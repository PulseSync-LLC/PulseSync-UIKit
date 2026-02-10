import { type ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './navigationBar.module.scss'

export interface NavigationBarItem {
    /** Unique key */
    key: string
    /** Icon (small, ~20px recommended) */
    icon: ReactNode
    /** Tooltip text on hover */
    tooltip: string
    /** Tooltip when disabled (e.g. "В разработке. Магазин недоступен") */
    disabledTooltip?: string
    /** Link URL — renders as <a> when provided */
    href?: string
    /** Click handler — used when href is not provided */
    onClick?: () => void
    /** Active/selected state */
    active?: boolean
    /** Disabled state */
    disabled?: boolean
    /** Custom color for active state (CSS color, e.g. #5865f2, #44ff88) */
    activeColor?: string
}

export interface NavigationBarProps {
    /** Navigation items */
    items: NavigationBarItem[]
    /** Default color for active items (overridden by item.activeColor) */
    defaultActiveColor?: string
    /** Tooltip position relative to icons */
    tooltipPosition?: 'right' | 'left' | 'top' | 'bottom'
    /** Content above nav items (e.g. avatar with UserMenu) */
    topContent?: ReactNode
    /** Content below nav items */
    bottomContent?: ReactNode
    /** Additional className */
    className?: string
}

export function NavigationBar({
    items,
    defaultActiveColor,
    tooltipPosition = 'right',
    topContent,
    bottomContent,
    className,
}: NavigationBarProps) {
    return (
        <nav
            className={clsx(styles.bar, className)}
            role="navigation"
            style={defaultActiveColor ? ({ '--ps-nav-active': defaultActiveColor } as React.CSSProperties) : undefined}
        >
            {topContent && <div className={styles.slot}>{topContent}</div>}
            <div className={styles.items}>
                {items.map(item => {
                    const content = (
                        <span className={styles.iconWrap}>
                            {item.icon}
                        </span>
                    )

                    const tooltipContent = item.disabled
                        ? (item.disabledTooltip ?? item.tooltip)
                        : item.tooltip

                    const wrap = (child: ReactNode) =>
                        tooltipContent ? (
                            <Tooltip content={tooltipContent} position={tooltipPosition}>
                                {child}
                            </Tooltip>
                        ) : (
                            child
                        )

                    const btnClass = clsx(
                        styles.item,
                        item.active && styles.itemActive,
                        item.disabled && styles.itemDisabled,
                    )

                    const activeStyle = item.active && item.activeColor
                        ? { backgroundColor: item.activeColor }
                        : undefined

                    if (item.href && !item.disabled) {
                        return (
                            <a
                                key={item.key}
                                href={item.href}
                                className={btnClass}
                                style={activeStyle}
                                aria-label={item.tooltip}
                                aria-current={item.active ? 'page' : undefined}
                            >
                                {wrap(content)}
                            </a>
                        )
                    }

                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={btnClass}
                            style={activeStyle}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            aria-label={item.tooltip}
                            aria-current={item.active ? 'page' : undefined}
                        >
                            {wrap(content)}
                        </button>
                    )
                })}
            </div>
            {bottomContent && <div className={styles.slot}>{bottomContent}</div>}
        </nav>
    )
}
