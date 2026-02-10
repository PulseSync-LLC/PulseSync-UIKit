import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import styles from './tooltip.module.scss'
import clsx from 'clsx'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
    content: ReactNode
    children: ReactNode
    position?: TooltipPosition
    delay?: number
    className?: string
    tooltipClassName?: string
    disabled?: boolean
    followCursor?: boolean
    cursorOffset?: number
}

export function Tooltip({
    content,
    children,
    position = 'top',
    delay = 0,
    className,
    tooltipClassName,
    disabled = false,
    followCursor = false,
    cursorOffset = 16,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
    const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
    const [arrowPos, setArrowPos] = useState({ x: 50, y: 50 })
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const calculateCursorPosition = useCallback(
        (clientX: number, clientY: number) => {
            if (!tooltipRef.current) return

            const tooltipRect = tooltipRef.current.getBoundingClientRect()
            const padding = 12
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let x = clientX
            let y = clientY
            let newPlacement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
            let arrowX = 50
            let arrowY = 50

            const spaceTop = clientY
            const spaceBottom = viewportHeight - clientY
            const spaceLeft = clientX
            const spaceRight = viewportWidth - clientX

            if (position === 'top' || position === 'bottom') {
                if (spaceBottom >= tooltipRect.height + cursorOffset + padding) {
                    newPlacement = 'bottom'
                    y = clientY + cursorOffset
                } else if (spaceTop >= tooltipRect.height + cursorOffset + padding) {
                    newPlacement = 'top'
                    y = clientY - cursorOffset - tooltipRect.height
                } else {
                    newPlacement = spaceBottom > spaceTop ? 'bottom' : 'top'
                    y =
                        newPlacement === 'bottom'
                            ? clientY + cursorOffset
                            : clientY - cursorOffset - tooltipRect.height
                }

                x = clientX - tooltipRect.width / 2
                if (x < padding) x = padding
                if (x + tooltipRect.width > viewportWidth - padding) {
                    x = viewportWidth - padding - tooltipRect.width
                }

                arrowX = ((clientX - x) / tooltipRect.width) * 100
                arrowX = Math.max(10, Math.min(90, arrowX))
            } else {
                if (spaceRight >= tooltipRect.width + cursorOffset + padding) {
                    newPlacement = 'right'
                    x = clientX + cursorOffset
                } else if (spaceLeft >= tooltipRect.width + cursorOffset + padding) {
                    newPlacement = 'left'
                    x = clientX - cursorOffset - tooltipRect.width
                } else {
                    newPlacement = spaceRight > spaceLeft ? 'right' : 'left'
                    x =
                        newPlacement === 'right'
                            ? clientX + cursorOffset
                            : clientX - cursorOffset - tooltipRect.width
                }

                y = clientY - tooltipRect.height / 2
                if (y < padding) y = padding
                if (y + tooltipRect.height > viewportHeight - padding) {
                    y = viewportHeight - padding - tooltipRect.height
                }

                arrowY = ((clientY - y) / tooltipRect.height) * 100
                arrowY = Math.max(10, Math.min(90, arrowY))
            }

            x = Math.max(padding, Math.min(x, viewportWidth - tooltipRect.width - padding))
            y = Math.max(padding, Math.min(y, viewportHeight - tooltipRect.height - padding))

            setTooltipPos({ x, y })
            setPlacement(newPlacement)
            setArrowPos({ x: arrowX, y: arrowY })
        },
        [position, cursorOffset],
    )

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (followCursor && isVisible) {
                requestAnimationFrame(() => calculateCursorPosition(e.clientX, e.clientY))
            }
        },
        [followCursor, isVisible, calculateCursorPosition],
    )

    const showTooltip = (e?: React.MouseEvent) => {
        if (disabled) return
        const show = () => {
            setIsVisible(true)
            if (followCursor && e) {
                requestAnimationFrame(() => calculateCursorPosition(e.clientX, e.clientY))
            }
        }
        if (delay > 0) {
            timeoutRef.current = setTimeout(show, delay)
        } else {
            show()
        }
    }

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setIsVisible(false)
    }

    useEffect(() => {
        if (followCursor && isVisible) {
            window.addEventListener('mousemove', handleMouseMove)
            return () => window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [followCursor, isVisible, handleMouseMove])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const tooltipStyle: React.CSSProperties = followCursor
        ? ({
              position: 'fixed',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'none',
              '--arrow-x': `${arrowPos.x}%`,
              '--arrow-y': `${arrowPos.y}%`,
          } as React.CSSProperties)
        : {}

    return (
        <div
            ref={wrapperRef}
            className={clsx(styles.wrapper, className)}
            onMouseEnter={e => showTooltip(e)}
            onMouseLeave={hideTooltip}
            onFocus={() => showTooltip()}
            onBlur={hideTooltip}
        >
            {children}
            <div
                ref={tooltipRef}
                className={clsx(
                    styles.tooltip,
                    !followCursor && styles[position],
                    followCursor && styles.followCursor,
                    followCursor &&
                        styles[
                            `cursor${placement.charAt(0).toUpperCase() + placement.slice(1)}` as keyof typeof styles
                        ],
                    isVisible && styles.visible,
                    tooltipClassName,
                )}
                style={tooltipStyle}
                role="tooltip"
            >
                {content}
                <span className={styles.arrow} />
            </div>
        </div>
    )
}

export default Tooltip
