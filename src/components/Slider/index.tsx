import { useCallback, useEffect, useRef, useState, type KeyboardEventHandler, type MouseEventHandler } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './slider.module.scss'

export interface SliderProps {
    /** Minimum value */
    min: number
    /** Maximum value */
    max: number
    /** Step increment */
    step?: number
    /** Current value */
    value: number
    /** Called on value change */
    onChange?: (value: number) => void
    /** Default value — when set, a "Reset" link appears if value differs */
    defaultValue?: number
    /** Label text */
    label?: string
    /** Description tooltip */
    description?: string
    /** Unit suffix (e.g. '%', 'px') */
    unit?: string
    /** Show the numeric value inside the bar */
    showValue?: boolean
    /** Allow editing the value by clicking */
    editable?: boolean
    /** Disable interaction */
    disabled?: boolean
    /** Custom reset text */
    resetText?: string
    /** Additional className */
    className?: string
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const snap = (n: number, step: number, min: number) => Math.round((n - min) / step) * step + min

export function Slider({
    min,
    max,
    step = 1,
    value,
    onChange,
    defaultValue,
    label,
    description,
    unit,
    showValue = true,
    editable = true,
    disabled = false,
    resetText = 'Reset',
    className,
}: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState(false)
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState('')

    const range = Math.max(0.00001, max - min)
    const v = clamp(value, min, max)
    const pct = ((v - min) / range) * 100
    const canReset = defaultValue !== undefined && value !== defaultValue

    const commit = useCallback((n: number) => {
        onChange?.(clamp(snap(n, step, min), min, max))
    }, [onChange, step, min, max])

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultValue !== undefined) onChange?.(defaultValue)
    }

    /* Drag logic */
    useEffect(() => {
        if (!dragging) return
        const onMove = (e: MouseEvent) => {
            if (!trackRef.current) return
            const rect = trackRef.current.getBoundingClientRect()
            const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
            commit(min + x * range)
        }
        const onUp = () => setDragging(false)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, min, range, commit])

    const handleTrackDown: MouseEventHandler = e => {
        if (disabled || editing) return
        e.stopPropagation()
        setDragging(true)
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        commit(min + x * range)
    }

    const handleKeyDown: KeyboardEventHandler = e => {
        if (disabled) return
        const accel = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); commit(v - step * accel) }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); commit(v + step * accel) }
        if (e.key === 'Home') { e.preventDefault(); commit(min) }
        if (e.key === 'End') { e.preventDefault(); commit(max) }
    }

    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!editable || disabled) return
        setDraft(String(v))
        setEditing(true)
    }

    const stopEdit = (apply: boolean) => {
        if (apply) {
            const num = Number(draft.replace(',', '.'))
            if (Number.isFinite(num)) commit(num)
        }
        setEditing(false)
    }

    return (
        <div className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
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

            <div
                ref={trackRef}
                className={clsx(styles.bar, dragging && styles.barActive)}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={v}
                aria-label={label}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                onMouseDown={handleTrackDown}
            >
                {/* Fill */}
                <div className={styles.fill} style={{ width: `${pct}%` }} />

                {/* Edge indicator */}
                <div className={clsx(styles.edge, dragging && styles.edgeActive)} style={{ left: `${pct}%` }} />

                {/* Inner content layer — above fill */}
                <div className={styles.content}>
                    {/* Min label */}
                    <span className={styles.minLabel}>{min}{unit}</span>

                    {/* Max label */}
                    <span className={styles.maxLabel}>{max}{unit}</span>

                    {/* Center value */}
                    {showValue && (
                        <div className={styles.valueCenter}>
                            {!editing ? (
                                <button type="button" className={styles.valueBtn} onMouseDown={e => e.stopPropagation()} onClick={startEdit}>
                                    {v}<span className={styles.unit}>{unit}</span>
                                </button>
                            ) : (
                                <input
                                    className={styles.valueInput}
                                    autoFocus
                                    value={draft}
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                    onChange={e => setDraft(e.target.value)}
                                    onBlur={() => stopEdit(true)}
                                    onKeyDown={e => {
                                        e.stopPropagation()
                                        if (e.key === 'Enter') stopEdit(true)
                                        if (e.key === 'Escape') stopEdit(false)
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
