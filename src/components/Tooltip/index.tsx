import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
}

export function Tooltip({
    content,
    children,
    position = 'top',
    delay = 0,
    className,
    tooltipClassName,
    disabled = false,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    const updatePosition = useCallback(() => {
        const el = wrapperRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const gap = 8

        const style: React.CSSProperties = {
            position: 'fixed',
            zIndex: 10100,
        }

        switch (position) {
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

        setTooltipStyle(style)
    }, [position])

    useEffect(() => {
        if (!isVisible) return
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [isVisible, updatePosition])

    const showTooltip = () => {
        if (disabled) return
        if (delay > 0) {
            timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
        } else {
            setIsVisible(true)
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
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const tooltipContent = isVisible && (
        <div
            className={clsx(
                styles.tooltip,
                styles.tooltipPortal,
                styles[position],
                styles.visible,
                tooltipClassName,
            )}
            style={tooltipStyle}
            role="tooltip"
        >
            {content}
            <span className={styles.arrow} />
        </div>
    )

    return (
        <div
            ref={wrapperRef}
            className={clsx(styles.wrapper, className)}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
        </div>
    )
}

export default Tooltip
