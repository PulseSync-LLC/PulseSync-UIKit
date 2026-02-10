import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import clsx from 'clsx'
import styles from './input.module.scss'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Label displayed above the input */
    label?: string
    /** Hint text displayed below the input */
    hint?: string
    /** Error message — replaces hint and highlights input */
    error?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
    /** Left icon/addon */
    leftIcon?: ReactNode
    /** Right icon/addon */
    rightIcon?: ReactNode
    /** Value to reset to — shows reset link when current value differs */
    resetValue?: string
    /** Called when reset is clicked (receives resetValue) */
    onResetValue?: (value: string) => void
    /** Custom reset text */
    resetText?: string
    /** Wrapper className */
    wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, hint, error, size = 'md', leftIcon, rightIcon, resetValue, onResetValue, resetText = 'Reset', wrapperClassName, className, disabled, value, defaultValue, ...rest }, ref) => {
        const hasIcons = !!(leftIcon || rightIcon)
        const currentVal = value !== undefined ? String(value) : undefined
        const canReset = resetValue !== undefined && currentVal !== undefined && currentVal !== resetValue

        return (
            <div className={clsx(styles.wrapper, styles[`size-${size}`], error && styles.hasError, wrapperClassName)}>
                {(label || canReset) && (
                    <div className={styles.labelRow}>
                        {label && <label className={styles.label}>{label}</label>}
                        {canReset && (
                            <button type="button" className={styles.resetBtn} onClick={e => { e.stopPropagation(); onResetValue?.(resetValue!) }}>
                                {resetText}
                            </button>
                        )}
                    </div>
                )}

                {hasIcons ? (
                    <div className={clsx(styles.inputContainer, styles.hasIcons, error && styles.hasError)}>
                        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
                        <input ref={ref} className={clsx(styles.input, className)} disabled={disabled} value={value} defaultValue={defaultValue} {...rest} />
                        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
                    </div>
                ) : (
                    <input ref={ref} className={clsx(styles.input, className)} disabled={disabled} value={value} defaultValue={defaultValue} {...rest} />
                )}

                {(error || hint) && (
                    <span className={clsx(styles.hint, error && styles.hintError)}>{error || hint}</span>
                )}
            </div>
        )
    },
)

Input.displayName = 'Input'
