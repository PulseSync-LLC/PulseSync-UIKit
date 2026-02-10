import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './promptModal.module.scss'

type PromptTone = 'default' | 'danger'

export type PromptModalProps = {
    isOpen: boolean
    title?: ReactNode
    message?: ReactNode
    placeholder?: string
    defaultValue?: string
    confirmText?: ReactNode
    cancelText?: ReactNode
    tone?: PromptTone
    onConfirm: (value: string) => void
    onCancel: () => void
}

export function PromptModal({
    isOpen,
    title,
    message,
    placeholder,
    defaultValue = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    tone = 'default',
    onConfirm,
    onCancel,
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue)
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!isOpen) return
        setValue(defaultValue)
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [defaultValue, isOpen, onCancel])

    useEffect(() => {
        if (!isOpen) return
        const id = window.setTimeout(() => inputRef.current?.focus(), 0)
        return () => window.clearTimeout(id)
    }, [isOpen])

    const handleConfirm = useCallback(() => {
        onConfirm(value)
    }, [onConfirm, value])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    onClick={onCancel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <motion.div
                        className={styles.modal}
                        onClick={event => event.stopPropagation()}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        role="dialog"
                        aria-modal="true"
                    >
                        {title && <h3 className={styles.title}>{title}</h3>}
                        {message && <p className={styles.text}>{message}</p>}
                        <input
                            ref={inputRef}
                            className={styles.input}
                            value={value}
                            placeholder={placeholder}
                            onChange={event => setValue(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault()
                                    handleConfirm()
                                }
                            }}
                        />
                        <div className={styles.actions}>
                            <button className={styles.cancelButton} onClick={onCancel} type="button">
                                {cancelText}
                            </button>
                            <button
                                className={`${styles.confirmButton} ${tone === 'danger' ? styles.dangerButton : ''}`}
                                onClick={handleConfirm}
                                type="button"
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

type PromptOptions = {
    title?: ReactNode
    message?: ReactNode
    placeholder?: string
    defaultValue?: string
    confirmText?: ReactNode
    cancelText?: ReactNode
    tone?: PromptTone
}

type PromptState = PromptOptions & {
    resolve: (value: string | null) => void
}

export function usePromptModal() {
    const [state, setState] = useState<PromptState | null>(null)

    const close = useCallback((value: string | null) => {
        setState(prev => {
            if (prev) prev.resolve(value)
            return null
        })
    }, [])

    const prompt = useCallback((options: PromptOptions) => {
        return new Promise<string | null>(resolve => {
            setState(prev => {
                if (prev) prev.resolve(null)
                return {
                    resolve,
                    title: options.title,
                    message: options.message,
                    placeholder: options.placeholder,
                    defaultValue: options.defaultValue ?? '',
                    confirmText: options.confirmText ?? 'OK',
                    cancelText: options.cancelText ?? 'Cancel',
                    tone: options.tone ?? 'default',
                }
            })
        })
    }, [])

    const modal = (
        <PromptModal
            isOpen={!!state}
            title={state?.title}
            message={state?.message}
            placeholder={state?.placeholder}
            defaultValue={state?.defaultValue}
            confirmText={state?.confirmText}
            cancelText={state?.cancelText}
            tone={state?.tone}
            onCancel={() => close(null)}
            onConfirm={value => close(value)}
        />
    )

    return { prompt, modal }
}
