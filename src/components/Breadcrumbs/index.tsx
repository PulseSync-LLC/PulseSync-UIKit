import React, { type ReactNode } from 'react'
import { IconButton } from '../IconButton'
import styles from './breadcrumbs.module.scss'

function ChevronIcon() {
    return (
        <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
    )
}

function LinkIcon() {
    return (
        <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
    )
}

export type BreadcrumbsProps = {
    /** Label for the root / parent (e.g. "Панель управления") */
    rootLabel: ReactNode
    /** Label for the current page (e.g. "Пользователи") */
    currentLabel: ReactNode
    /** Called when copy button is clicked (e.g. copy URL to clipboard) */
    onCopy?: () => void
    /** Copy button aria-label */
    copyLabel?: string
    /** Optional className for the wrapper */
    className?: string
}

export function Breadcrumbs({
    rootLabel,
    currentLabel,
    onCopy,
    copyLabel = 'Copy link',
    className,
}: BreadcrumbsProps) {
    return (
        <div className={`${styles.wrapper} ${className ?? ''}`}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                <span className={styles.beforePage}>{rootLabel}</span>
                <ChevronIcon />
                <span className={styles.mainPage}>{currentLabel}</span>
            </nav>
            {onCopy != null && (
                <IconButton
                    variant="secondary"
                    size="md"
                    onClick={onCopy}
                    aria-label={copyLabel}
                >
                    <LinkIcon />
                </IconButton>
            )}
        </div>
    )
}
