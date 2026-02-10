import { useState, useRef, useCallback, useLayoutEffect, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './accordion.module.scss'

/* ── Types ── */

export interface AccordionItem {
    /** Unique key */
    key: string
    /** Section title */
    title: ReactNode
    /** Section content (rendered when expanded) */
    content: ReactNode
    /** Disable this section */
    disabled?: boolean
    /** Custom className for this section */
    className?: string
    /** Custom className for this section's content area */
    contentClassName?: string
}

export interface AccordionProps {
    /** List of collapsible sections */
    items: AccordionItem[]
    /** Allow multiple sections open at once */
    multiple?: boolean
    /** Initially expanded keys */
    defaultOpen?: string[]
    /** Controlled open keys (external state) */
    openKeys?: string[]
    /** Called when open keys change */
    onOpenKeysChange?: (keys: string[]) => void
    /** Show numbered badges */
    numbered?: boolean
    /** Custom className for the wrapper */
    className?: string
    /** Custom className applied to each section */
    sectionClassName?: string
    /** Custom className for header buttons */
    headerClassName?: string
    /** Custom className for the body inner area */
    bodyClassName?: string
    /** Whether to render the border separator between header and body */
    showDivider?: boolean
}

function ChevronDown() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

/* ── Single section ── */

function AccordionSection({
    item,
    index,
    isOpen,
    onToggle,
    numbered,
    sectionClassName,
    headerClassName,
    bodyClassName,
    showDivider,
}: {
    item: AccordionItem
    index: number
    isOpen: boolean
    onToggle: () => void
    numbered: boolean
    sectionClassName?: string
    headerClassName?: string
    bodyClassName?: string
    showDivider?: boolean
}) {
    const bodyRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const [animState, setAnimState] = useState<'idle' | 'opening' | 'closing'>('idle')
    const [bodyHeight, setBodyHeight] = useState<string | number>(isOpen ? 'auto' : 0)
    const prevOpenRef = useRef(isOpen)

    useLayoutEffect(() => {
        const wasOpen = prevOpenRef.current
        prevOpenRef.current = isOpen

        if (wasOpen === isOpen) return

        const inner = innerRef.current
        if (!inner) return
        const naturalHeight = inner.scrollHeight

        if (isOpen) {
            /* OPENING: 0 → naturalHeight → auto */
            setBodyHeight(0)
            setAnimState('opening')
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setBodyHeight(naturalHeight)
                })
            })
        } else {
            /* CLOSING: auto → naturalHeight → 0 */
            setBodyHeight(naturalHeight)
            setAnimState('closing')
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setBodyHeight(0)
                })
            })
        }
    }, [isOpen])

    const handleTransitionEnd = () => {
        if (animState === 'opening') {
            setBodyHeight('auto')
            setAnimState('idle')
        } else if (animState === 'closing') {
            setAnimState('idle')
        }
    }

    return (
        <div className={clsx(
            styles.section,
            isOpen && styles.sectionOpen,
            item.disabled && styles.sectionDisabled,
            sectionClassName,
            item.className,
        )}>
            <button
                type="button"
                className={clsx(styles.header, headerClassName)}
                onClick={() => { if (!item.disabled) onToggle() }}
                aria-expanded={isOpen}
            >
                {numbered && <span className={styles.badge}>{index + 1}</span>}
                <span className={styles.title}>{item.title}</span>
                <span className={clsx(styles.chevron, isOpen && styles.chevronOpen)}>
                    <ChevronDown />
                </span>
            </button>

            <div
                ref={bodyRef}
                className={clsx(styles.body, animState === 'opening' && styles.bodyOpening, animState === 'closing' && styles.bodyClosing)}
                style={{ height: bodyHeight }}
                onTransitionEnd={handleTransitionEnd}
            >
                <div ref={innerRef} className={styles.bodyContent}>
                    {showDivider && <div className={styles.divider} />}
                    <div className={clsx(styles.bodyInner, bodyClassName, item.contentClassName)}>
                        {item.content}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main component ── */

export function Accordion({
    items,
    multiple = false,
    defaultOpen = [],
    openKeys: controlledKeys,
    onOpenKeysChange,
    numbered = true,
    className,
    sectionClassName,
    headerClassName,
    bodyClassName,
    showDivider = true,
}: AccordionProps) {
    const [internalKeys, setInternalKeys] = useState<Set<string>>(new Set(defaultOpen))

    /* Support controlled mode */
    const isControlled = controlledKeys !== undefined
    const openKeys = isControlled ? new Set(controlledKeys) : internalKeys

    const toggle = useCallback((key: string) => {
        const compute = (prev: Set<string>) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                if (!multiple) next.clear()
                next.add(key)
            }
            return next
        }

        if (isControlled) {
            const next = compute(new Set(controlledKeys))
            onOpenKeysChange?.(Array.from(next))
        } else {
            setInternalKeys(prev => {
                const next = compute(prev)
                onOpenKeysChange?.(Array.from(next))
                return next
            })
        }
    }, [multiple, isControlled, controlledKeys, onOpenKeysChange])

    return (
        <div className={clsx(styles.wrapper, className)}>
            {items.map((item, i) => (
                <AccordionSection
                    key={item.key}
                    item={item}
                    index={i}
                    isOpen={openKeys.has(item.key)}
                    onToggle={() => toggle(item.key)}
                    numbered={numbered}
                    sectionClassName={sectionClassName}
                    headerClassName={headerClassName}
                    bodyClassName={bodyClassName}
                    showDivider={showDivider}
                />
            ))}
        </div>
    )
}
