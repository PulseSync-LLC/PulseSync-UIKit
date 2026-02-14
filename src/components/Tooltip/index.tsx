import { ReactNode, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './tooltip.module.scss'
import clsx from 'clsx'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'

export interface TooltipProps {
    content: ReactNode
    children: ReactNode
    position?: TooltipPosition
    delay?: number
    className?: string
    tooltipClassName?: string
    disabled?: boolean
    /** Min width (number = px, or string e.g. '20rem') */
    minWidth?: number | string
    /** Max width (number = px, or string) */
    maxWidth?: number | string
    /** Min height (number = px, or string) */
    minHeight?: number | string
    /** Max height (number = px, or string). Content scrolls when it overflows. */
    maxHeight?: number | string
    /** If true, tooltip stays open when hovering over it (pointer-events enabled, can scroll) */
    hoverable?: boolean
}

const toCssSize = (v: number | string | undefined): string | undefined =>
    v === undefined ? undefined : typeof v === 'number' ? `${v}px` : v

/** Parse maxWidth/maxHeight to pixels for viewport clamping (estimate) */
function toPxEstimate(v: number | string | undefined, fallback: number): number {
    if (v === undefined) return fallback
    if (typeof v === 'number') return v
    const n = parseFloat(String(v))
    return Number.isFinite(n) ? n : fallback
}

const MARGIN = 12
const TOOLTIP_ESTIMATE_HEIGHT = 240
const TOOLTIP_ESTIMATE_WIDTH = 320
const OFF_SCREEN = -9999

function getBestPosition(
    rect: DOMRect,
    maxW: number | undefined,
    maxH: number | undefined,
): 'top' | 'bottom' | 'left' | 'right' {
    const w = typeof window === 'undefined' ? 1024 : window.innerWidth
    const h = typeof window === 'undefined' ? 768 : window.innerHeight
    const needH = Math.min(maxH ?? TOOLTIP_ESTIMATE_HEIGHT, h - MARGIN * 2) + MARGIN
    const needW = Math.min(maxW ?? TOOLTIP_ESTIMATE_WIDTH, w - MARGIN * 2) + MARGIN
    const spaceTop = rect.top
    const spaceBottom = h - rect.bottom
    const spaceLeft = rect.left
    const spaceRight = w - rect.right
    if (spaceTop >= needH) return 'top'
    if (spaceBottom >= needH) return 'bottom'
    if (spaceRight >= needW) return 'right'
    if (spaceLeft >= needW) return 'left'
    const vert = spaceTop >= spaceBottom ? 'top' : 'bottom'
    const horz = spaceRight >= spaceLeft ? 'right' : 'left'
    return spaceTop >= needH * 0.6 || spaceBottom >= needH * 0.6 ? vert : horz
}

/** Optional actual tooltip size (after render) for accurate viewport clamping on small screens */
function computePlacement(
    rect: DOMRect,
    position: TooltipPosition,
    maxWidth: number | string | undefined,
    maxHeight: number | string | undefined,
    actualTooltipWidth?: number,
    actualTooltipHeight?: number,
): { style: React.CSSProperties; resolvedPosition: 'top' | 'bottom' | 'left' | 'right' } {
    const gap = 8
    const resolvedPosition =
        position === 'auto'
            ? getBestPosition(
                  rect,
                  typeof maxWidth === 'number' ? maxWidth : TOOLTIP_ESTIMATE_WIDTH,
                  typeof maxHeight === 'number' ? maxHeight : TOOLTIP_ESTIMATE_HEIGHT,
              )
            : position

    const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 10100,
    }

    switch (resolvedPosition) {
        case 'top':
            style.left = rect.left + rect.width / 2
            style.top = rect.top - gap
            style.transform = 'translate(-50%, -100%)'
            break
        case 'bottom':
            style.left = rect.left + rect.width / 2
            style.top = rect.bottom + gap
            style.transform = 'translateX(-50%)'
            break
        case 'left':
            style.left = rect.left - gap
            style.top = rect.top + rect.height / 2
            style.transform = 'translate(-100%, -50%)'
            break
        case 'right':
            style.left = rect.right + gap
            style.top = rect.top + rect.height / 2
            style.transform = 'translateY(-50%)'
            break
    }

    const w = typeof window === 'undefined' ? 1024 : window.innerWidth
    const h = typeof window === 'undefined' ? 768 : window.innerHeight
    const maxTooltipW = w - MARGIN * 2
    const maxTooltipH = h - MARGIN * 2
    const estWidth = Math.min(toPxEstimate(maxWidth, TOOLTIP_ESTIMATE_WIDTH), maxTooltipW)
    const estHeight = Math.min(toPxEstimate(maxHeight, TOOLTIP_ESTIMATE_HEIGHT), maxTooltipH)
    const clampW = actualTooltipWidth != null ? Math.min(actualTooltipWidth, maxTooltipW) : (w < 480 ? Math.min(220, maxTooltipW) : estWidth)
    const clampH = actualTooltipHeight != null ? Math.min(actualTooltipHeight, maxTooltipH) : estHeight

    if (resolvedPosition === 'top' || resolvedPosition === 'bottom') {
        const minLeft = MARGIN + clampW / 2
        const maxLeft = w - MARGIN - clampW / 2
        if (typeof style.left === 'number') {
            style.left = Math.max(minLeft, Math.min(maxLeft, style.left))
        }
        const minTop = MARGIN + clampH
        const maxTop = h - MARGIN
        if (resolvedPosition === 'top' && typeof style.top === 'number') {
            style.top = Math.max(minTop, style.top)
        }
        if (resolvedPosition === 'bottom' && typeof style.top === 'number') {
            style.top = Math.min(maxTop - clampH, style.top)
        }
    } else {
        const minTop = MARGIN + clampH / 2
        const maxTop = h - MARGIN - clampH / 2
        if (typeof style.top === 'number') {
            style.top = Math.max(minTop, Math.min(maxTop, style.top))
        }
        const minLeft = MARGIN + clampW
        const maxLeft = w - MARGIN
        if (resolvedPosition === 'left' && typeof style.left === 'number') {
            style.left = Math.max(minLeft, style.left)
        }
        if (resolvedPosition === 'right' && typeof style.left === 'number') {
            style.left = Math.min(maxLeft - clampW, style.left)
        }
    }

    return { style, resolvedPosition }
}

export function Tooltip({
    content,
    children,
    position = 'top',
    delay = 0,
    className,
    tooltipClassName,
    disabled = false,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    hoverable = false,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [positionReady, setPositionReady] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
    const [computedPosition, setComputedPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(position === 'auto' ? 'top' : position)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    const updatePosition = useCallback((tooltipW?: number, tooltipH?: number) => {
        const el = wrapperRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const { style, resolvedPosition } = computePlacement(
            rect,
            position,
            maxWidth,
            maxHeight,
            tooltipW,
            tooltipH,
        )
        setTooltipStyle(style)
        setComputedPosition(resolvedPosition)
    }, [position, maxWidth, maxHeight])

    useLayoutEffect(() => {
        if (!isVisible || positionReady) return
        const tip = tooltipRef.current
        const trigger = wrapperRef.current
        if (tip && trigger) {
            const tr = tip.getBoundingClientRect()
            const triggerRect = trigger.getBoundingClientRect()
            const { style, resolvedPosition } = computePlacement(
                triggerRect,
                position,
                maxWidth,
                maxHeight,
                tr.width,
                tr.height,
            )
            setTooltipStyle(style)
            setComputedPosition(resolvedPosition)
            setPositionReady(true)
        }
    }, [isVisible, positionReady, position, maxWidth, maxHeight])

    useEffect(() => {
        if (!isVisible || !positionReady) return
        const onUpdate = () => {
            const tip = tooltipRef.current
            const trigger = wrapperRef.current
            if (tip && trigger) {
                const tr = tip.getBoundingClientRect()
                updatePosition(tr.width, tr.height)
            } else {
                updatePosition()
            }
        }
        window.addEventListener('scroll', onUpdate, true)
        window.addEventListener('resize', onUpdate)
        return () => {
            window.removeEventListener('scroll', onUpdate, true)
            window.removeEventListener('resize', onUpdate)
        }
    }, [isVisible, positionReady, updatePosition])

    const showTooltip = useCallback(() => {
        if (disabled) return
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
        }
        const open = () => {
            setTooltipStyle({
                position: 'fixed',
                left: OFF_SCREEN,
                top: 0,
                zIndex: 10100,
                visibility: 'hidden',
            })
            setComputedPosition(position === 'auto' ? 'top' : position)
            setPositionReady(false)
            setIsVisible(true)
        }
        if (delay > 0) {
            timeoutRef.current = setTimeout(open, delay)
        } else {
            open()
        }
    }, [disabled, delay, position])

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setPositionReady(false)
        setIsVisible(false)
    }, [])

    const scheduleHide = useCallback(() => {
        if (!hoverable) {
            hideTooltip()
            return
        }
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = setTimeout(() => {
            hideTimeoutRef.current = null
            hideTooltip()
        }, 150)
    }, [hoverable, hideTooltip])

    const cancelScheduleHide = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
        }
    }, [])

    const boxStyle: React.CSSProperties = {
        ...tooltipStyle,
        minWidth: toCssSize(minWidth),
        maxWidth: toCssSize(maxWidth),
        minHeight: toCssSize(minHeight),
        maxHeight: toCssSize(maxHeight),
        visibility: positionReady ? 'visible' : 'hidden',
    }

    const positionClass = position === 'auto' ? computedPosition : position

    const tooltipContent = isVisible && (
        <div
            ref={tooltipRef}
            className={clsx(
                styles.tooltip,
                styles.tooltipPortal,
                styles[positionClass],
                positionReady && styles.visible,
                hoverable && styles.hoverable,
                tooltipClassName,
            )}
            style={boxStyle}
            role="tooltip"
            onMouseEnter={hoverable ? cancelScheduleHide : undefined}
            onMouseLeave={hoverable ? scheduleHide : undefined}
        >
            <div className={styles.tooltipInner}>
                {content}
            </div>
            <span className={styles.arrow} />
        </div>
    )

    return (
        <div
            ref={wrapperRef}
            className={clsx(styles.wrapper, className)}
            onMouseEnter={showTooltip}
            onMouseLeave={scheduleHide}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
        </div>
    )
}

export default Tooltip
