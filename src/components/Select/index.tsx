import React, { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEventHandler } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './select.module.scss'

export interface SelectOption {
    value: string | number
    label: string
}

export interface SelectProps {
    /** Label above the select */
    label?: string
    /** Description tooltip text */
    description?: string
    /** Currently selected value */
    value: string | number | null | undefined
    /** Options list */
    options: SelectOption[]
    /** Called when user selects an option */
    onChange?: (value: string | number) => void
    /** Default value — shows reset link when value differs */
    defaultValue?: string | number
    /** Disable interaction */
    disabled?: boolean
    /** Placeholder when nothing is selected */
    placeholder?: string
    /** Error message */
    error?: string
    /** Custom reset text */
    resetText?: string
    /** Additional className on wrapper */
    className?: string
}

function ChevronDown() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

export function Select({
    label,
    description,
    value,
    options,
    onChange,
    disabled = false,
    placeholder = 'Select…',
    error,
    defaultValue,
    resetText = 'Reset',
    className,
}: SelectProps) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const [hover, setHover] = useState(-1)
    const wrapRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    const showPanel = open || closing

    const idxByValue = useMemo(
        () => options.findIndex(o => String(o.value) === String(value)),
        [options, value],
    )
    const selected = idxByValue >= 0 ? options[idxByValue] : null

    const closePanel = useCallback(() => {
        if (!open) return
        setClosing(true)
    }, [open])

    const handleAnimEnd = useCallback(() => {
        if (closing) {
            setClosing(false)
            setOpen(false)
        }
    }, [closing])

    const updatePanelPosition = useCallback(() => {
        const el = wrapRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setPanelStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            minWidth: rect.width,
            zIndex: 10050,
        })
    }, [])

    useEffect(() => {
        if (!open) return
        updatePanelPosition()
        window.addEventListener('scroll', updatePanelPosition, true)
        window.addEventListener('resize', updatePanelPosition)
        return () => {
            window.removeEventListener('scroll', updatePanelPosition, true)
            window.removeEventListener('resize', updatePanelPosition)
        }
    }, [open, updatePanelPosition])

    /* close on outside click — panel is in portal so check both wrap and panel */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return
            closePanel()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [closePanel])

    const commit = (i: number) => {
        const opt = options[i]
        if (!opt) return
        onChange?.(opt.value)
        closePanel()
    }

    const toggle = () => {
        if (disabled) return
        if (open) {
            closePanel()
        } else {
            setHover(idxByValue >= 0 ? idxByValue : 0)
            setOpen(true)
        }
    }

    const canReset = defaultValue !== undefined && String(value) !== String(defaultValue)

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultValue !== undefined) onChange?.(defaultValue)
    }

    const onKeyDown: KeyboardEventHandler = e => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            toggle()
            return
        }
        if (!open) return
        if (e.key === 'Escape') { e.preventDefault(); closePanel(); return }
        if (e.key === 'ArrowDown') { e.preventDefault(); setHover(h => Math.min(options.length - 1, h < 0 ? 0 : h + 1)); return }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHover(h => Math.max(0, h < 0 ? 0 : h - 1)); return }
        if (e.key === 'Enter') { e.preventDefault(); commit(hover >= 0 ? hover : idxByValue >= 0 ? idxByValue : 0) }
    }

    return (
        <div
            ref={wrapRef}
            className={clsx(styles.container, open && styles.open, disabled && styles.disabled, error && styles.error, className)}
            role="button"
            aria-expanded={open}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onClick={e => {
                if (listRef.current?.contains(e.target as Node)) return
                toggle()
            }}
        >
            {(label || canReset) && (
                <div className={styles.labelRow}>
                    {label && (
                        <div className={styles.label}>
                            {label}
                            {description && (
                                <Tooltip content={description} position="right">
                                    <span className={styles.descDot}>?</span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {canReset && (
                        <button type="button" className={styles.resetBtn} onClick={handleReset}>
                            {resetText}
                        </button>
                    )}
                </div>
            )}

            <div className={styles.valueLine}>
                <span className={clsx(styles.value, !selected && styles.placeholder)}>
                    {selected ? selected.label : placeholder}
                </span>
                <span className={clsx(styles.arrow, open && styles.arrowOpen)}>
                    <ChevronDown />
                </span>
            </div>

            {mounted && showPanel && createPortal(
                <div
                    ref={panelRef}
                    className={clsx(styles.panel, closing && styles.panelClosing)}
                    style={panelStyle}
                    onClick={e => e.stopPropagation()}
                    onAnimationEnd={handleAnimEnd}
                >
                    <div ref={listRef} className={styles.list} role="listbox">
                        {options.map((o, i) => {
                            const active = String(o.value) === String(value)
                            return (
                                <button
                                    key={String(o.value)}
                                    type="button"
                                    className={clsx(styles.option, active && styles.active, hover === i && styles.hover)}
                                    role="option"
                                    aria-selected={active}
                                    onMouseEnter={() => setHover(i)}
                                    onClick={() => commit(i)}
                                >
                                    <span className={styles.optionLabel}>{o.label}</span>
                                    {active && <span className={styles.check}><CheckIcon /></span>}
                                </button>
                            )
                        })}
                    </div>
                </div>,
                document.body,
            )}

            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    )
}
