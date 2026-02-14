import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './viewToggle.module.scss'

function GridIcon() {
    return (
        <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <g fillRule="evenodd">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
            </g>
        </svg>
    )
}

function ListIcon() {
    return (
        <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z" />
        </svg>
    )
}

/** One view option: value, icon, optional title (tooltip) */
export type ViewToggleOption = {
    value: string
    icon: ReactNode
    title?: string
}

export type ViewToggleValue = 'grid' | 'list'

export type ViewToggleProps = {
    /** Current view value (must match one of options' value) */
    value: string
    /** Called when user selects a view */
    onChange: (value: string) => void
    /**
     * Custom view options. Each option: value, icon, optional title.
     * If not set, uses default Grid + List.
     */
    options?: ViewToggleOption[]
    /** Title for default grid button (only when options is not set) */
    gridTitle?: string
    /** Title for default list button (only when options is not set) */
    listTitle?: string
    /** Optional className */
    className?: string
    /** Accessible group label */
    'aria-label'?: string
}

const DEFAULT_OPTIONS: ViewToggleOption[] = [
    { value: 'grid', icon: <GridIcon />, title: 'Grid' },
    { value: 'list', icon: <ListIcon />, title: 'List' },
]

export function ViewToggle({
    value,
    onChange,
    options: optionsProp,
    gridTitle = 'Grid',
    listTitle = 'List',
    className,
    'aria-label': ariaLabel = 'View mode',
}: ViewToggleProps) {
    const listRef = useRef<HTMLDivElement>(null)
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    const options = useMemo(() => {
        if (optionsProp != null && optionsProp.length > 0) return optionsProp
        return [
            { value: 'grid', icon: <GridIcon />, title: gridTitle },
            { value: 'list', icon: <ListIcon />, title: listTitle },
        ]
    }, [optionsProp, gridTitle, listTitle])

    useLayoutEffect(() => {
        const list = listRef.current
        if (!list) return
        const active = list.querySelector<HTMLElement>(`[data-view-toggle-value="${value}"]`)
        if (!active) return
        const listRect = list.getBoundingClientRect()
        const btnRect = active.getBoundingClientRect()
        setIndicator({
            left: btnRect.left - listRect.left,
            width: btnRect.width,
        })
    }, [value, options])

    return (
        <div ref={listRef} className={clsx(styles.viewToggle, className)} role="group" aria-label={ariaLabel}>
            <div
                className={styles.indicator}
                style={{
                    transform: `translateX(${indicator.left}px)`,
                    width: Math.max(indicator.width, 0),
                    opacity: indicator.width > 0 ? 1 : 0,
                }}
            />
            {options.map(opt => {
                const label = opt.title ?? opt.value
                const btn = (
                    <button
                        key={opt.value}
                        type="button"
                        className={clsx(styles.button, value === opt.value && styles.active)}
                        onClick={() => onChange(opt.value)}
                        aria-pressed={value === opt.value}
                        data-view-toggle-value={opt.value}
                    >
                        {opt.icon}
                    </button>
                )
                return label ? (
                    <Tooltip key={opt.value} content={label} position="auto" delay={400}>
                        {btn}
                    </Tooltip>
                ) : (
                    <React.Fragment key={opt.value}>{btn}</React.Fragment>
                )
            })}
        </div>
    )
}
