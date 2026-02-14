import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import styles from './searchBox.module.scss'

function SearchIcon() {
    return (
        <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
    )
}

export type SearchBoxProps = {
    /** Current value (controlled) */
    value?: string
    /** Default value (uncontrolled) */
    defaultValue?: string
    /** Placeholder text */
    placeholder?: string
    /** Called on input change */
    onChange?: (value: string) => void
    /** Called on form submit (e.g. Enter) */
    onSubmit?: (value: string) => void
    /** Called on blur; can be used to submit on blur */
    onBlur?: () => void
    /** Custom buttons/elements on the right inside the search box */
    rightAddons?: ReactNode
    /** When true, show preview dropdown below (content from renderPreview) */
    showPreview?: boolean
    /** Renders preview content; receives current query. Rendered in portal below input, z-index 2000. */
    renderPreview?: (query: string) => ReactNode
    /** Form/wrapper className */
    className?: string
    /** Input type */
    type?: InputHTMLAttributes<HTMLInputElement>['type']
    /** Disabled state */
    disabled?: boolean
    /** Input autoComplete */
    autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>

export function SearchBox({
    value,
    defaultValue,
    placeholder,
    onChange,
    onSubmit,
    onBlur,
    rightAddons,
    showPreview = false,
    renderPreview,
    className,
    type = 'search',
    disabled,
    autoComplete,
    ...formProps
}: SearchBoxProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
    const [previewStyle, setPreviewStyle] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 0,
    })
    const [closing, setClosing] = useState(false)

    const isControlled = value !== undefined
    const currentValue = isControlled ? (value ?? '') : uncontrolledValue

    const updatePreviewPosition = useCallback(() => {
        const rect = wrapperRef.current?.getBoundingClientRect()
        if (!rect) return
        setPreviewStyle({
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
        })
    }, [])

    const closePreview = useCallback(() => {
        setClosing(true)
    }, [])

    const handlePreviewAnimationEnd = useCallback(() => {
        setClosing(false)
    }, [])

    useEffect(() => {
        if (!showPreview || !isFocused) return
        updatePreviewPosition()

        const handlePointer = (e: MouseEvent) => {
            const target = e.target as Node
            if (previewRef.current?.contains(target)) return
            if (wrapperRef.current?.contains(target)) return
            closePreview()
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            closePreview()
            inputRef.current?.focus()
        }
        const handleScroll = () => updatePreviewPosition()
        const handleResize = () => updatePreviewPosition()

        document.addEventListener('mousedown', handlePointer)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleResize)

        return () => {
            document.removeEventListener('mousedown', handlePointer)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', handleResize)
        }
    }, [showPreview, isFocused, updatePreviewPosition, closePreview])

    const handleInputBlur = useCallback(() => {
        blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 150)
    }, [])

    const handlePreviewMouseDown = useCallback(() => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current)
            blurTimeoutRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
        }
    }, [])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const input = form.querySelector('input')
        const v = input?.value?.trim() ?? ''
        onSubmit?.(v)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        if (!isControlled) setUncontrolledValue(v)
        onChange?.(v)
    }

    const showPreviewPanel = showPreview && renderPreview && (isFocused || closing)
    const previewContent = showPreviewPanel ? renderPreview(currentValue) : null
    const hasPreviewContent = previewContent != null

    const previewPanel =
        showPreviewPanel && hasPreviewContent ? (
            <div
                ref={previewRef}
                className={closing ? `${styles.preview} ${styles.previewClosing}` : styles.preview}
                style={previewStyle}
                role="listbox"
                data-search-box-preview
                onAnimationEnd={handlePreviewAnimationEnd}
                onMouseDown={handlePreviewMouseDown}
            >
                {previewContent}
            </div>
        ) : null

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <form
                className={`${styles.searchBox} ${className ?? ''}`}
                onSubmit={handleSubmit}
                {...formProps}
            >
                <div className={styles.inputWrap}>
                    <span className={styles.searchIcon} aria-hidden>
                        <SearchIcon />
                    </span>
                    <input
                        ref={inputRef}
                        type={type}
                        placeholder={placeholder}
                        value={isControlled ? value : uncontrolledValue}
                        defaultValue={isControlled ? undefined : defaultValue}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleInputBlur}
                        onBlurCapture={onBlur}
                        disabled={disabled}
                        autoComplete={autoComplete}
                        aria-expanded={showPreview && hasPreviewContent ? true : undefined}
                        aria-haspopup={showPreview ? 'listbox' : undefined}
                    />
                </div>
                {rightAddons != null && <div className={styles.rightAddons}>{rightAddons}</div>}
            </form>
            {typeof document !== 'undefined' && previewPanel ? createPortal(previewPanel, document.body) : null}
        </div>
    )
}
