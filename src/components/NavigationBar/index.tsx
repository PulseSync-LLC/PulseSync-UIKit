import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { Tooltip } from '../Tooltip'
import styles from './navigationBar.module.scss'

/** Item width (44) + gap (4) in responsive mode; total for n items = 48*n - 4 */
const RESPONSIVE_ITEM_WIDTH = 48
const RESPONSIVE_ITEM_GAP = 4

function BurgerIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

export interface NavigationBarItem {
    /** Unique key */
    key: string
    /** Icon (small, ~20px recommended) */
    icon: ReactNode
    /** Label text (shown when expanded) */
    label?: string
    /** Tooltip text on hover (defaults to label if not provided) */
    tooltip?: string
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

export interface NavigationBarSlotProps {
    /** Content for the fixed-size box (icon/avatar) */
    content?: ReactNode
    /** Label shown when expanded */
    expandedLabel?: ReactNode
    /** Additional className for the slot */
    className?: string
    /** Link URL — makes entire slot a link */
    href?: string
    /** Click handler — makes entire slot clickable */
    onClick?: () => void
    /** Style for the slot */
    style?: React.CSSProperties
    /** Ref to the slot element (for positioning dropdowns, etc.) */
    ref?: React.RefObject<HTMLElement | null>
    /** Render content directly without slotBox wrapper (for custom layouts) */
    raw?: boolean
}

export interface NavigationBarProps {
    /** Navigation items */
    items: NavigationBarItem[]
    /** Default color for active items (overridden by item.activeColor) */
    defaultActiveColor?: string
    /** Tooltip position relative to icons */
    tooltipPosition?: 'right' | 'left' | 'top' | 'bottom'
    
    /** Top slot configuration — vertical mode (above nav items) */
    topSlot?: NavigationBarSlotProps
    /** Bottom slot configuration — vertical mode (below nav items) */
    bottomSlot?: NavigationBarSlotProps
    
    /** Left slot configuration — horizontal/mobile mode (left of items) */
    leftSlot?: NavigationBarSlotProps
    /** Right slot configuration — horizontal/mobile mode (right of items) */
    rightSlot?: NavigationBarSlotProps
    
    // Legacy props for backwards compatibility
    /** @deprecated Use topSlot.content instead */
    topContent?: ReactNode
    /** @deprecated Use topSlot.expandedLabel instead */
    topExpandedLabel?: ReactNode
    /** @deprecated Use bottomSlot.content instead */
    bottomContent?: ReactNode
    /** @deprecated Use bottomSlot.expandedLabel instead */
    bottomExpandedLabel?: ReactNode
    
    /** Additional className */
    className?: string
    /** Enable expand on hover to show labels */
    expandable?: boolean
    /** Delay before expanding (ms). Default: 300 */
    expandDelay?: number
    /** Controlled expanded state */
    expanded?: boolean
    /** Callback when expanded state changes */
    onExpandedChange?: (expanded: boolean) => void
    /** Width when collapsed (default: 52) */
    collapsedWidth?: number
    /** Width when expanded (default: 220) */
    expandedWidth?: number
    /** Enable responsive mode — bottom bar on mobile (default: true) */
    responsive?: boolean
    /** Inline mode — responsive without position:fixed (for demos/containers) */
    inline?: boolean
}

export function NavigationBar({
    items,
    defaultActiveColor,
    tooltipPosition = 'right',
    topSlot,
    bottomSlot,
    leftSlot,
    rightSlot,
    // Legacy props
    topContent,
    topExpandedLabel,
    bottomContent,
    bottomExpandedLabel,
    className,
    expandable = false,
    expandDelay = 300,
    expanded: controlledExpanded,
    onExpandedChange,
    collapsedWidth = 52,
    expandedWidth = 220,
    responsive = true,
    inline = false,
}: NavigationBarProps) {
    const [internalExpanded, setInternalExpanded] = useState(false)
    const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [overflowDetected, setOverflowDetected] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const middleRef = useRef<HTMLDivElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

    // In responsive mode: detect if nav items would overflow; if so, show burger menu
    useEffect(() => {
        if (!responsive || !middleRef.current || items.length === 0) return
        const el = middleRef.current
        const requiredWidth = items.length * RESPONSIVE_ITEM_WIDTH - RESPONSIVE_ITEM_GAP
        const check = () => {
            if (!el) return
            const available = el.clientWidth
            setOverflowDetected(requiredWidth > available)
        }
        check()
        const ro = new ResizeObserver(check)
        ro.observe(el)
        return () => ro.disconnect()
    }, [responsive, items.length])

    // Merge legacy props with new slot props
    const resolvedTopSlot: NavigationBarSlotProps = topSlot ?? {
        content: topContent,
        expandedLabel: topExpandedLabel,
    }
    const resolvedBottomSlot: NavigationBarSlotProps = bottomSlot ?? {
        content: bottomContent,
        expandedLabel: bottomExpandedLabel,
    }

    const handleMouseEnter = useCallback(() => {
        if (!expandable) return
        expandTimeoutRef.current = setTimeout(() => {
            if (controlledExpanded === undefined) {
                setInternalExpanded(true)
            }
            onExpandedChange?.(true)
        }, expandDelay)
    }, [expandable, expandDelay, controlledExpanded, onExpandedChange])

    const handleMouseLeave = useCallback(() => {
        if (!expandable) return
        if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current)
            expandTimeoutRef.current = null
        }
        if (controlledExpanded === undefined) {
            setInternalExpanded(false)
        }
        onExpandedChange?.(false)
    }, [expandable, controlledExpanded, onExpandedChange])

    useEffect(() => {
        return () => {
            if (expandTimeoutRef.current) {
                clearTimeout(expandTimeoutRef.current)
            }
        }
    }, [])

    // Close burger menu on outside click or Escape
    useEffect(() => {
        if (!menuOpen) return
        const handle = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent) {
                if (e.key !== 'Escape') return
            } else {
                if (menuRef.current?.contains(e.target as Node)) return
            }
            setMenuOpen(false)
        }
        document.addEventListener('click', handle, true)
        document.addEventListener('keydown', handle)
        return () => {
            document.removeEventListener('click', handle, true)
            document.removeEventListener('keydown', handle)
        }
    }, [menuOpen])

    const barStyle: React.CSSProperties = {
        ...(defaultActiveColor ? { '--ps-nav-active': defaultActiveColor } : {}),
        ...(expandable ? {
            '--ps-nav-collapsed-width': `${collapsedWidth}px`,
            '--ps-nav-expanded-width': `${expandedWidth}px`,
        } : {}),
    } as React.CSSProperties

    const renderSlot = (
        slot: NavigationBarSlotProps | undefined,
        position: 'top' | 'bottom' | 'left' | 'right'
    ) => {
        if (!slot?.content) return null

        // For horizontal slots (left/right), don't show expandedLabel
        const showLabel = (position === 'top' || position === 'bottom') && slot.expandedLabel

        // Raw mode: render content directly without slotBox wrapper
        const slotContent = slot.raw ? (
            slot.content
        ) : (
            <>
                <div className={styles.slotBox}>
                    {slot.content}
                </div>
                {showLabel && (
                    <div className={styles.slotLabel}>
                        {slot.expandedLabel}
                    </div>
                )}
            </>
        )

        const positionClass = {
            top: styles.slotTop,
            bottom: styles.slotBottom,
            left: styles.slotLeft,
            right: styles.slotRight,
        }[position]

        const slotClass = clsx(
            styles.slot,
            positionClass,
            (slot.href || slot.onClick) && styles.slotClickable,
            slot.raw && styles.slotRaw,
            slot.className
        )

        // Render as link if href provided
        if (slot.href) {
            return (
                <a
                    ref={slot.ref as React.RefObject<HTMLAnchorElement | null>}
                    href={slot.href}
                    className={slotClass}
                    style={slot.style}
                >
                    {slotContent}
                </a>
            )
        }

        // Render as button if onClick provided
        if (slot.onClick) {
            return (
                <button
                    ref={slot.ref as React.RefObject<HTMLButtonElement | null>}
                    type="button"
                    className={slotClass}
                    style={slot.style}
                    onClick={slot.onClick}
                >
                    {slotContent}
                </button>
            )
        }

        // Render as div
        return (
            <div ref={slot.ref as React.RefObject<HTMLDivElement | null>} className={slotClass} style={slot.style}>
                {slotContent}
            </div>
        )
    }

    const renderItems = () => (
        <>
            {items.map(item => {
                const labelText = item.label || item.tooltip || ''
                const tooltipText = item.tooltip || item.label || ''

                const content = (
                    <>
                        <span className={styles.iconWrap}>
                            {item.icon}
                        </span>
                        {labelText && (
                            <span className={styles.labelWrap}>
                                {labelText}
                            </span>
                        )}
                    </>
                )

                const tooltipContent = item.disabled
                    ? (item.disabledTooltip ?? tooltipText)
                    : tooltipText

                const wrap = (child: ReactNode) =>
                    tooltipContent && !isExpanded ? (
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
                    ? { '--item-active-color': item.activeColor } as React.CSSProperties
                    : undefined

                if (item.href && !item.disabled) {
                    return (
                        <a
                            key={item.key}
                            href={item.href}
                            className={btnClass}
                            style={activeStyle}
                            aria-label={tooltipText}
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
                        aria-label={tooltipText}
                        aria-current={item.active ? 'page' : undefined}
                    >
                        {wrap(content)}
                    </button>
                )
            })}
        </>
    )

    return (
        <nav
            className={clsx(
                styles.bar,
                expandable && styles.barExpandable,
                isExpanded && styles.barExpanded,
                responsive && styles.barResponsive,
                inline && styles.barInline,
                className
            )}
            role="navigation"
            style={barStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Vertical mode: top/bottom slots */}
            <div className={styles.verticalContent}>
                {renderSlot(resolvedTopSlot, 'top')}
                <div className={styles.items}>
                    {renderItems()}
                </div>
                {renderSlot(resolvedBottomSlot, 'bottom')}
            </div>

            {/* Horizontal mode: left/items/right in single row */}
            <div className={styles.horizontalContent}>
                {renderSlot(leftSlot, 'left')}
                <div ref={middleRef} className={styles.middleWrap}>
                    {responsive && overflowDetected ? (
                        <button
                            type="button"
                            className={styles.burgerButton}
                            onClick={() => setMenuOpen(o => !o)}
                            aria-expanded={menuOpen}
                            aria-label="Меню"
                        >
                            <span className={styles.iconWrap}>
                                <BurgerIcon />
                            </span>
                        </button>
                    ) : (
                        <div className={styles.itemsHorizontal}>
                            {renderItems()}
                        </div>
                    )}
                </div>
                {renderSlot(rightSlot, 'right')}
            </div>

            {/* Burger menu overlay — list of items when overflow in responsive mode */}
            {responsive && overflowDetected && menuOpen && typeof document !== 'undefined' &&
                createPortal(
                    <>
                        <div
                            className={styles.menuBackdrop}
                            aria-hidden
                            onClick={() => setMenuOpen(false)}
                        />
                        <div ref={menuRef} className={styles.menuPanel} role="dialog" aria-label="Навигация">
                            {items.map(item => {
                                const labelText = item.label || item.tooltip || ''
                                const content = (
                                    <>
                                        <span className={styles.iconWrap}>
                                            {item.icon}
                                        </span>
                                        {labelText && (
                                            <span className={styles.menuItemLabel}>
                                                {labelText}
                                            </span>
                                        )}
                                    </>
                                )
                                const itemClass = clsx(
                                    styles.menuItem,
                                    item.active && styles.itemActive,
                                    item.disabled && styles.itemDisabled,
                                )
                                const activeStyle = item.active && item.activeColor
                                    ? { '--item-active-color': item.activeColor } as React.CSSProperties
                                    : undefined
                                if (item.href && !item.disabled) {
                                    return (
                                        <a
                                            key={item.key}
                                            href={item.href}
                                            className={itemClass}
                                            style={activeStyle}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            {content}
                                        </a>
                                    )
                                }
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={itemClass}
                                        style={activeStyle}
                                        disabled={item.disabled}
                                        onClick={() => {
                                            item.onClick?.()
                                            setMenuOpen(false)
                                        }}
                                    >
                                        {content}
                                    </button>
                                )
                            })}
                        </div>
                    </>,
                    document.body,
                )}
        </nav>
    )
}
