import React, { type ReactNode } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './filterButton.module.scss'

export type FilterButtonProps = {
    /** Whether the button is in active/selected state */
    active?: boolean
    /** Icon (e.g. SVG) before label */
    icon?: ReactNode
    /** Button content (label; can include sort arrow) */
    children: ReactNode
    /** Optional className */
    className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function FilterButton({
    active = false,
    icon,
    children,
    className,
    ...buttonProps
}: FilterButtonProps) {
    return (
        <button
            type="button"
            className={clsx(styles.filterBtn, active && styles.active, className)}
            {...buttonProps}
        >
            {icon}
            {children}
        </button>
    )
}
