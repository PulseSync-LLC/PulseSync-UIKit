import { ReactNode, useState, useRef, useEffect } from 'react'
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
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    return (
        <div
            className={clsx(styles.wrapper, className)}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            <div
                className={clsx(
                    styles.tooltip,
                    styles[position],
                    isVisible && styles.visible,
                    tooltipClassName,
                )}
                role="tooltip"
            >
                {content}
                <span className={styles.arrow} />
            </div>
        </div>
    )
}

export default Tooltip
