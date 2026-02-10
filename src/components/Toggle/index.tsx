import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './toggle.module.scss'

export interface ToggleProps {
    /** Current state */
    checked: boolean
    /** Called when user toggles */
    onChange: (checked: boolean) => void
    /** Default checked state — shows reset link when differs */
    defaultChecked?: boolean
    /** Label text */
    label?: string
    /** Optional description shown as a Tooltip on "?" icon */
    description?: string
    /** Text shown when enabled */
    enabledText?: string
    /** Text shown when disabled */
    disabledText?: string
    /** Disable interaction */
    disabled?: boolean
    /** Error message */
    error?: string
    /** Custom reset text */
    resetText?: string
    /** Additional className */
    className?: string
}

function CheckIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function MinusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    )
}

export function Toggle({
    checked,
    onChange,
    defaultChecked,
    label,
    description,
    enabledText = 'Включено',
    disabledText = 'Выключено',
    disabled,
    error,
    resetText = 'Reset',
    className,
}: ToggleProps) {
    const handleClick = useCallback(() => {
        if (!disabled) onChange(!checked)
    }, [checked, disabled, onChange])

    const canReset = defaultChecked !== undefined && checked !== defaultChecked

    const handleReset = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultChecked !== undefined) onChange(defaultChecked)
    }, [defaultChecked, onChange])

    return (
        <div
            className={clsx(styles.container, disabled && styles.disabled, error && styles.error, className)}
            onClick={handleClick}
            role="switch"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    handleClick()
                }
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
                <span className={clsx(styles.value, !checked && styles.valueInactive)}>
                    {checked ? enabledText : disabledText}
                </span>
                <span className={clsx(styles.indicator, checked && styles.indicatorActive)}>
                    {checked ? <CheckIcon /> : <MinusIcon />}
                </span>
            </div>

            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    )
}
