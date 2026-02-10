import React, { useCallback, useRef, useState, useEffect, type ChangeEvent } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './filePicker.module.scss'

export interface FilePickerProps {
    /** Label text */
    label?: string
    /** Description tooltip */
    description?: string
    /** Current file name / path (controlled) */
    value?: string
    /** Called with file name on selection */
    onChange?: (fileName: string, file: File | null) => void
    /** Accept filter (e.g. ".png,.jpg,.gif") */
    accept?: string
    /** Placeholder */
    placeholder?: string
    /** Show image preview if file is an image */
    showPreview?: boolean
    /** External preview URL (e.g. for existing files) */
    previewUrl?: string
    /** Default file name — shows reset link when differs */
    defaultValue?: string
    /** Custom reset text */
    resetText?: string
    /** Disable interaction */
    disabled?: boolean
    /** Additional className */
    className?: string
}

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i

function FolderIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
}


export function FilePicker({
    label,
    description,
    value = '',
    onChange,
    accept = '',
    placeholder = 'Select a file…',
    showPreview = true,
    previewUrl,
    defaultValue,
    resetText = 'Reset',
    disabled = false,
    className,
}: FilePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [localPreview, setLocalPreview] = useState<string | null>(null)
    const [imgLoaded, setImgLoaded] = useState(false)

    const isImage = IMAGE_EXTS.test(value)
    const displayPreview = showPreview && (localPreview || previewUrl) && isImage

    /* Revoke blob URL on unmount */
    useEffect(() => {
        return () => { if (localPreview) URL.revokeObjectURL(localPreview) }
    }, [localPreview])

    const handleFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        /* Create preview if image */
        if (IMAGE_EXTS.test(file.name)) {
            if (localPreview) URL.revokeObjectURL(localPreview)
            setLocalPreview(URL.createObjectURL(file))
            setImgLoaded(false)
        } else {
            if (localPreview) URL.revokeObjectURL(localPreview)
            setLocalPreview(null)
        }

        onChange?.(file.name, file)
        e.target.value = ''
    }, [onChange, localPreview])

    const clear = useCallback(() => {
        if (localPreview) URL.revokeObjectURL(localPreview)
        setLocalPreview(null)
        setImgLoaded(false)
        onChange?.('', null)
    }, [onChange, localPreview])

    const openPicker = () => inputRef.current?.click()

    const preview = localPreview || previewUrl || null
    const canReset = defaultValue !== undefined && value !== defaultValue

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (localPreview) URL.revokeObjectURL(localPreview)
        setLocalPreview(null)
        setImgLoaded(false)
        onChange?.(defaultValue ?? '', null)
    }

    return (
        <div className={clsx(styles.wrapper, disabled && styles.disabled, className)} onClick={openPicker} style={{ cursor: disabled ? 'default' : 'pointer' }}>
            {/* Image preview */}
            {displayPreview && preview && (
                <div className={clsx(styles.previewWrap, imgLoaded && styles.previewLoaded)} onClick={openPicker}>
                    <img
                        className={styles.previewImg}
                        src={preview}
                        alt=""
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgLoaded(false)}
                    />
                </div>
            )}

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

            <div className={styles.field} onClick={e => e.stopPropagation()}>
                <input
                    className={styles.textInput}
                    value={value}
                    placeholder={placeholder}
                    readOnly
                    onClick={openPicker}
                />
                {value && (
                    <button type="button" className={styles.clearBtn} onClick={e => { e.stopPropagation(); clear() }} title="Clear">
                        <CloseIcon />
                    </button>
                )}
                <button type="button" className={styles.pickBtn} onClick={e => { e.stopPropagation(); openPicker() }} title="Browse">
                    <FolderIcon />
                </button>
            </div>

            <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className={styles.hidden} tabIndex={-1} />
        </div>
    )
}
