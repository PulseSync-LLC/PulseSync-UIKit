import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './dropdownMenu.module.scss'

/* ── Types ── */

export interface DropdownMenuItem {
    /** Unique key */
    key: string
    /** Display label */
    label: ReactNode
    /** Optional icon (left side) */
    icon?: ReactNode
    /** Nested submenu items */
    children?: DropdownMenuItem[]
    /** Click handler (leaf items) */
    onClick?: () => void
    /** Disable the item */
    disabled?: boolean
    /** Separator after this item */
    divider?: boolean
    /** Toggle mode — renders a small square checkbox */
    toggle?: boolean
    /** Radio mode — renders a circular radio indicator (mutually exclusive choice) */
    radio?: boolean
    /** Current toggle/radio state (controlled) */
    checked?: boolean
}

export interface DropdownMenuProps {
    /** Menu items */
    items: DropdownMenuItem[]
    /** Trigger element */
    children: ReactNode
    /** Additional className on the trigger wrapper */
    className?: string
    /** Additional className on the menu panel */
    menuClassName?: string
    /** Alignment relative to trigger */
    align?: 'left' | 'right'
    /**
     * Submenu mode:
     * - `'hover'` (default) — submenus fly out to the side on hover
     * - `'drill'` — clicking navigates into submenu in-place with a back button
     */
    mode?: 'hover' | 'drill'
    /**
     * Whether the menu closes when a leaf item is clicked.
     * Default: `true`. Set to `false` to keep the menu open on any click.
     */
    closeOnSelect?: boolean
}

/* ── Icons ── */

function ChevronRight() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

function ChevronLeft() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

/** Arrow icon for drill-down items — indicates "click to enter" */
function ArrowEnter() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
        </svg>
    )
}

/** Back arrow for drill mode */
function ArrowBack() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
        </svg>
    )
}

/* ═══════════════════════════════════════════════
 *  HOVER MODE — fly-out submenus
 * ═══════════════════════════════════════════════ */

function HoverMenuItem({
    item,
    onClose,
    openDirection,
    closeOnSelect,
}: {
    item: DropdownMenuItem
    onClose: () => void
    openDirection: 'right' | 'left'
    closeOnSelect: boolean
}) {
    const [subOpen, setSubOpen] = useState(false)
    const [subClosing, setSubClosing] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const itemRef = useRef<HTMLDivElement>(null)
    const subRef = useRef<HTMLDivElement>(null)

    const hasChildren = item.children && item.children.length > 0
    const showSub = subOpen || subClosing
    const isLeft = openDirection === 'left'

    const openSub = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setSubClosing(false)
        setSubOpen(true)
    }

    const closeSub = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (subOpen) setSubClosing(true)
    }

    const handleSubAnimEnd = () => {
        if (subClosing) { setSubClosing(false); setSubOpen(false) }
    }

    const handleMouseEnter = () => { if (hasChildren) openSub() }

    /* When mouse leaves the parent .item entirely (to outside), schedule close */
    const handleItemLeave = (e: React.MouseEvent) => {
        if (!hasChildren) return
        const related = e.relatedTarget as Node | null
        // If mouse went into the submenu, don't close
        if (related && subRef.current && subRef.current.contains(related)) return
        timeoutRef.current = setTimeout(closeSub, 80)
    }

    /* When mouse leaves the submenu, check if it went back to the parent item */
    const handleSubLeave = (e: React.MouseEvent) => {
        const related = e.relatedTarget as Node | null
        // If mouse went back to parent item row, keep submenu open
        if (related && itemRef.current && itemRef.current.contains(related)) {
            // Don't close — mouse is back on parent
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            return
        }
        timeoutRef.current = setTimeout(closeSub, 80)
    }

    const handleClick = () => {
        if (item.disabled) return
        if ((item.toggle || item.radio) && item.onClick) { item.onClick(); return }
        if (!hasChildren && item.onClick) {
            item.onClick()
            if (closeOnSelect) onClose()
        }
    }

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
    }, [])

    const selectorEl = (item.toggle || item.radio) && (
        <span className={clsx(
            item.radio ? styles.radio : styles.toggle,
            item.checked && (item.radio ? styles.radioChecked : styles.toggleChecked),
        )}>
            <span className={item.radio ? styles.radioDot : styles.toggleDot} />
        </span>
    )

    const chevronEl = hasChildren && (
        <span className={clsx(
            styles.itemChevron,
            isLeft && styles.itemChevronLeft,
            (subOpen && !subClosing) && styles.itemChevronOpen,
        )}>
            {isLeft ? <ChevronLeft /> : <ChevronRight />}
        </span>
    )

    return (
        <>
            <div
                ref={itemRef}
                className={clsx(
                    styles.item,
                    item.disabled && styles.itemDisabled,
                    (subOpen && !subClosing) && styles.itemActive,
                    isLeft && styles.itemReverse,
                )}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleItemLeave}
            >
                {/* Left-direction: chevron on the left */}
                {isLeft && chevronEl}

                {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                <span className={styles.itemLabel}>{item.label}</span>

                {selectorEl}

                {/* Right-direction: chevron on the right */}
                {!isLeft && chevronEl}

                {showSub && hasChildren && (
                    <div
                        ref={subRef}
                        className={clsx(
                            styles.submenu,
                            isLeft && styles.submenuLeft,
                            subClosing && (isLeft ? styles.submenuClosingLeft : styles.submenuClosing),
                        )}
                        onAnimationEnd={handleSubAnimEnd}
                        onMouseEnter={openSub}
                        onMouseLeave={handleSubLeave}
                    >
                        {item.children!.map(child => (
                            <HoverMenuItem key={child.key} item={child} onClose={onClose} openDirection={openDirection} closeOnSelect={closeOnSelect} />
                        ))}
                    </div>
                )}
            </div>
            {item.divider && <div className={styles.divider} />}
        </>
    )
}

/* ═══════════════════════════════════════════════
 *  DRILL MODE — in-place submenu navigation
 * ═══════════════════════════════════════════════ */

interface DrillLevel {
    title: string
    items: DropdownMenuItem[]
}

function DrillPanel({
    items,
    onClose,
    closeOnSelect,
}: {
    items: DropdownMenuItem[]
    onClose: () => void
    closeOnSelect: boolean
}) {
    const [stack, setStack] = useState<DrillLevel[]>([])
    const [slideDir, setSlideDir] = useState<'in' | 'out' | null>(null)

    const currentItems = stack.length > 0 ? stack[stack.length - 1].items : items
    const currentTitle = stack.length > 0 ? stack[stack.length - 1].title : null

    const drillIn = (item: DropdownMenuItem) => {
        if (!item.children || item.children.length === 0) return
        setSlideDir('in')
        setStack(prev => [...prev, { title: String(item.label), items: item.children! }])
    }

    const drillOut = () => {
        if (stack.length === 0) return
        setSlideDir('out')
        setStack(prev => prev.slice(0, -1))
    }

    const handleClick = (item: DropdownMenuItem) => {
        if (item.disabled) return
        if ((item.toggle || item.radio) && item.onClick) { item.onClick(); return }
        if (item.children && item.children.length > 0) {
            drillIn(item)
            return
        }
        if (item.onClick) {
            item.onClick()
            if (closeOnSelect) onClose()
        }
    }

    const handleAnimEnd = () => { setSlideDir(null) }

    return (
        <div
            className={clsx(
                styles.drillContent,
                slideDir === 'in' && styles.drillSlideIn,
                slideDir === 'out' && styles.drillSlideOut,
            )}
            onAnimationEnd={handleAnimEnd}
        >
            {currentTitle && (
                <div className={styles.drillBack} onClick={drillOut}>
                    <span className={styles.drillBackIcon}><ArrowBack /></span>
                    <span className={styles.drillBackLabel}>{currentTitle}</span>
                </div>
            )}
            {currentItems.map(item => (
                <div key={item.key}>
                    <div
                        className={clsx(
                            styles.item,
                            item.disabled && styles.itemDisabled,
                        )}
                        onClick={() => handleClick(item)}
                    >
                        {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                        <span className={styles.itemLabel}>{item.label}</span>

                        {(item.toggle || item.radio) && (
                            <span className={clsx(
                                item.radio ? styles.radio : styles.toggle,
                                item.checked && (item.radio ? styles.radioChecked : styles.toggleChecked),
                            )}>
                                <span className={item.radio ? styles.radioDot : styles.toggleDot} />
                            </span>
                        )}

                        {item.children && item.children.length > 0 && (
                            <span className={styles.drillChevron}>
                                <ArrowEnter />
                            </span>
                        )}
                    </div>
                    {item.divider && <div className={styles.divider} />}
                </div>
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════ */

export function DropdownMenu({
    items,
    children,
    className,
    menuClassName,
    align = 'left',
    mode = 'hover',
    closeOnSelect = true,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const showMenu = open || closing

    const closeMenu = useCallback(() => {
        if (!open) return
        setClosing(true)
    }, [open])

    const handleAnimEnd = useCallback(() => {
        if (closing) { setClosing(false); setOpen(false) }
    }, [closing])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeMenu()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [closeMenu])

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, closeMenu])

    const toggle = () => { if (open) closeMenu(); else setOpen(true) }

    const openDirection = align === 'right' ? 'left' : 'right'

    return (
        <div ref={wrapRef} className={clsx(styles.wrapper, className)}>
            <div className={styles.trigger} onClick={toggle}>{children}</div>

            {showMenu && (
                <div
                    className={clsx(
                        styles.menu,
                        closing && styles.menuClosing,
                        align === 'right' && styles.menuRight,
                        mode === 'drill' && styles.menuDrill,
                        menuClassName,
                    )}
                    onAnimationEnd={handleAnimEnd}
                >
                    {mode === 'drill' ? (
                        <DrillPanel items={items} onClose={closeMenu} closeOnSelect={closeOnSelect} />
                    ) : (
                        items.map(item => (
                            <HoverMenuItem key={item.key} item={item} onClose={closeMenu} openDirection={openDirection} closeOnSelect={closeOnSelect} />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
