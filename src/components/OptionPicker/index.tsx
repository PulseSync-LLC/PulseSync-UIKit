import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './optionPicker.module.scss'

export type OptionPickerOption = {
    value: string | number
    label: React.ReactNode
    disabled?: boolean
    kind?: 'group'
}

export type OptionPickerProps = {
    options: OptionPickerOption[]
    value?: string | number | null
    onChange?: (value: string) => void
    /** Default value — shows reset link when value differs */
    defaultValue?: string | number
    /** Custom reset text */
    resetText?: string
    placeholder?: React.ReactNode
    disabled?: boolean
    className?: string
    menuClassName?: string
    optionClassName?: string
    wrapperClassName?: string
    showChevron?: boolean
    /** Open menu above the trigger */
    menuPlacement?: 'top' | 'bottom'
    ariaLabel?: string
    onTriggerMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function OptionPicker({
    options,
    value = null,
    onChange,
    defaultValue,
    resetText = 'Reset',
    placeholder,
    disabled = false,
    className,
    menuClassName,
    optionClassName,
    wrapperClassName,
    showChevron = true,
    menuPlacement = 'bottom',
    ariaLabel,
    onTriggerMouseDown,
}: OptionPickerProps) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [closing, setClosing] = useState(false)
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
    const wrapperRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const listId = useId()
    const triggerId = useId()

    useEffect(() => {
        setMounted(true)
    }, [])

    const stringValue = value === null || value === undefined ? null : String(value)
    const selectedOption =
        stringValue !== null ? options.find(option => String(option.value) === stringValue) : undefined
    const displayLabel = selectedOption?.label ?? placeholder ?? ''

    const updatePosition = useCallback(() => {
        const rect = triggerRef.current?.getBoundingClientRect()
        if (!rect) return
        const gap = 6
        if (menuPlacement === 'top') {
            setMenuStyle({
                bottom: typeof window !== 'undefined' ? window.innerHeight - rect.top + gap : rect.bottom + gap,
                left: rect.left,
                minWidth: rect.width,
            })
        } else {
            setMenuStyle({
                top: rect.bottom + gap,
                left: rect.left,
                minWidth: rect.width,
            })
        }
    }, [menuPlacement])

    const closeMenu = useCallback(() => {
        if (!open) return
        setClosing(true)
    }, [open])

    const handleMenuAnimationEnd = useCallback(() => {
        if (closing) {
            setClosing(false)
            setOpen(false)
        }
    }, [closing])

    useEffect(() => {
        if (!open) return
        updatePosition()

        const handlePointer = (event: MouseEvent) => {
            const target = event.target as Node
            if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return
            closeMenu()
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            event.preventDefault()
            closeMenu()
            triggerRef.current?.focus()
        }
        const handleScroll = () => updatePosition()
        const handleResize = () => updatePosition()

        document.addEventListener('mousedown', handlePointer)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
            document.removeEventListener('mousedown', handlePointer)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [closeMenu, open, updatePosition])

    useEffect(() => {
        if (disabled && open) closeMenu()
    }, [closeMenu, disabled, open])

    useEffect(() => {
        if (!open) return
        const buttons = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('[data-option-picker-option]') ?? [],
        )
        const selectable = buttons.filter(btn => !btn.disabled)
        const selected = selectable.find(btn => btn.dataset.value === stringValue)
        ;(selected ?? selectable[0])?.focus()
    }, [open, stringValue, options])

    const handleTriggerClick = () => {
        if (disabled) return
        if (open) {
            closeMenu()
        } else {
            setOpen(true)
        }
    }

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen(true)
        }
    }

    const handleOptionClick = (option: OptionPickerOption) => {
        if (option.disabled || option.kind === 'group') return
        onChange?.(String(option.value))
        closeMenu()
        triggerRef.current?.focus()
    }

    const canReset = defaultValue !== undefined && String(value) !== String(defaultValue)
    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultValue !== undefined) onChange?.(String(defaultValue))
    }

    const triggerClasses = [styles.trigger, className].filter(Boolean).join(' ')
    const wrapperClasses = [styles.wrapper, open ? styles.open : '', wrapperClassName]
        .filter(Boolean)
        .join(' ')
    const menuClasses = [
        styles.menu,
        menuPlacement === 'top' ? styles.menuTop : '',
        closing ? styles.menuClosing : '',
        menuClassName,
    ]
        .filter(Boolean)
        .join(' ')

    const showMenu = open || closing

    const menu = showMenu ? (
        <div
            ref={menuRef}
            className={menuClasses}
            style={menuStyle}
            role="listbox"
            id={listId}
            aria-labelledby={triggerId}
            data-option-picker
            onAnimationEnd={handleMenuAnimationEnd}
        >
            {options.map(option => {
                const isSelected = stringValue !== null && String(option.value) === stringValue
                const isDisabled = option.disabled || option.kind === 'group'
                const optionClasses = [
                    styles.option,
                    option.kind === 'group' ? styles.optionGroup : '',
                    optionClassName,
                ]
                    .filter(Boolean)
                    .join(' ')

                return (
                    <button
                        key={`${option.value}`}
                        type="button"
                        className={optionClasses}
                        onClick={() => handleOptionClick(option)}
                        disabled={isDisabled}
                        aria-selected={isSelected}
                        aria-disabled={isDisabled}
                        data-value={String(option.value)}
                        data-option-picker-option
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    ) : null

    return (
        <div ref={wrapperRef} className={wrapperClasses} data-option-picker>
            <button
                ref={triggerRef}
                type="button"
                className={triggerClasses}
                onClick={handleTriggerClick}
                onKeyDown={handleTriggerKeyDown}
                onMouseDown={onTriggerMouseDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-label={ariaLabel}
                id={triggerId}
                data-option-picker
            >
                <span className={styles.label}>{displayLabel}</span>
                {showChevron && (
                    <span className={styles.chevron} aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </span>
                )}
            </button>
            {canReset && (
                <button type="button" className={styles.resetBtn} onClick={handleReset}>
                    {resetText}
                </button>
            )}
            {mounted && menu ? createPortal(menu, document.body) : null}
        </div>
    )
}
