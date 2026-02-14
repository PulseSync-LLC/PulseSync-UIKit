import React, { type ReactNode } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './iconButton.module.scss'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export type IconButtonProps = {
    /** Icon content (e.g. SVG) */
    children: ReactNode
    /** Visual style */
    variant?: IconButtonVariant
    /** Size */
    size?: IconButtonSize
    /** Accessible label (title/tooltip) */
    'aria-label': string
    className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function IconButton({
    children,
    variant = 'secondary',
    size = 'md',
    className,
    disabled,
    ...rest
}: IconButtonProps) {
    return (
        <button
            type="button"
            className={clsx(styles.iconButton, styles[variant], styles[size], className)}
            disabled={disabled}
            {...rest}
        >
            <span className={styles.icon}>{children}</span>
        </button>
    )
}
