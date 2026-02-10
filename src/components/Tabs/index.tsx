import { type ReactNode, createContext, useContext, useCallback, useRef, useLayoutEffect, useState } from 'react'
import clsx from 'clsx'
import styles from './tabs.module.scss'

/* ─── Context ─── */
interface TabsContextValue {
    value: string
    onChange: (value: string) => void
}
const TabsCtx = createContext<TabsContextValue | null>(null)

/* ─── Tabs (root) ─── */
export interface TabsProps {
    /** Currently active tab value */
    value: string
    /** Called when the user clicks a tab */
    onChange: (value: string) => void
    children: ReactNode
    className?: string
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
    return (
        <TabsCtx.Provider value={{ value, onChange }}>
            <div className={clsx(styles.tabs, className)}>{children}</div>
        </TabsCtx.Provider>
    )
}

/* ─── TabList ─── */
export interface TabListProps {
    children: ReactNode
    className?: string
}

export function TabList({ children, className }: TabListProps) {
    const ctx = useContext(TabsCtx)
    const listRef = useRef<HTMLDivElement>(null)
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    useLayoutEffect(() => {
        const list = listRef.current
        const val = ctx?.value
        if (!list || !val) return
        const active = list.querySelector<HTMLElement>(`[data-tab-value="${val}"]`)
        if (!active) return
        const listRect = list.getBoundingClientRect()
        const tabRect = active.getBoundingClientRect()
        setIndicator({
            left: tabRect.left - listRect.left,
            width: tabRect.width,
        })
    }, [ctx?.value, children])

    return (
        <div ref={listRef} className={clsx(styles.tabList, className)} role="tablist">
            <div
                className={styles.tabIndicator}
                style={{
                    transform: `translateX(${indicator.left}px)`,
                    width: Math.max(indicator.width, 0),
                    opacity: indicator.width > 0 ? 1 : 0,
                }}
            />
            {children}
        </div>
    )
}

/* ─── Tab ─── */
export interface TabProps {
    /** Unique value that matches Tabs.value */
    value: string
    children: ReactNode
    disabled?: boolean
    className?: string
}

export function Tab({ value, children, disabled, className }: TabProps) {
    const ctx = useContext(TabsCtx)
    const isActive = ctx?.value === value

    const handleClick = useCallback(() => {
        if (!disabled && ctx) ctx.onChange(value)
    }, [ctx, value, disabled])

    return (
        <button
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            data-tab-value={value}
            className={clsx(styles.tab, isActive && styles.tabActive, disabled && styles.tabDisabled, className)}
            onClick={handleClick}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

/* ─── TabPanel ─── */
export interface TabPanelProps {
    /** Matches the Tab value */
    value: string
    children: ReactNode
    className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
    const ctx = useContext(TabsCtx)
    if (ctx?.value !== value) return null
    return (
        <div role="tabpanel" className={clsx(styles.tabPanel, className)}>
            {children}
        </div>
    )
}
