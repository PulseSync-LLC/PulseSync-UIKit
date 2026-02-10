import { type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './badge.module.scss'

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
    children: ReactNode
    /** Visual variant */
    variant?: BadgeVariant
    /** Size */
    size?: BadgeSize
    /** Optional left icon */
    icon?: ReactNode
    /** Uppercase text */
    uppercase?: boolean
    className?: string
}

export function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    icon,
    uppercase = true,
    className,
}: BadgeProps) {
    return (
        <span
            className={clsx(
                styles.badge,
                styles[`variant-${variant}`],
                styles[`size-${size}`],
                uppercase && styles.uppercase,
                className,
            )}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </span>
    )
}
