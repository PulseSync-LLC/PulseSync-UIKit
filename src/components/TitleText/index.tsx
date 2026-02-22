import React from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './titletext.module.scss'

export interface TitleTextProps {
    /** Current text value */
    value: string
    /** Called when text changes */
    onChange?: (value: string) => void
    /** Label above the input */
    label?: string
    /** Description tooltip text */
    description?: string
    /** Placeholder when empty */
    placeholder?: string
    /** Default value — shows reset link when value differs */
    defaultValue?: string
    /** Custom reset text */
    resetText?: string
    /** Disable interaction */
    disabled?: boolean
    /** Error message */
    error?: string
    /** Additional className on wrapper */
    className?: string
}

export function TitleText({
    value,
    onChange,
    label,
    description,
    placeholder = 'Enter text…',
    defaultValue,
    resetText = 'Reset',
    disabled = false,
    error,
    className,
}: TitleTextProps) {
    const canReset = defaultValue !== undefined && value !== defaultValue

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultValue !== undefined) onChange?.(defaultValue)
    }

    return (
        <div className={clsx(styles.container, disabled && styles.disabled, error && styles.error, className)}>
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

            <input
                type="text"
                className={styles.input}
                value={value}
                onChange={e => onChange?.(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
            />

            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    )
}
