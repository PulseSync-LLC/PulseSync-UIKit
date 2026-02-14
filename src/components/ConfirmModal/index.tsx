import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/Button'
import styles from './confirmModal.module.scss'

type ConfirmTone = 'default' | 'danger'

export type ConfirmModalProps = {
    isOpen: boolean
    title?: ReactNode
    message: ReactNode
    confirmText?: ReactNode
    cancelText?: ReactNode
    tone?: ConfirmTone
    hideCancel?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    tone = 'default',
    hideCancel = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onCancel])

    const overlayContent = (
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
                        <p className={styles.text}>{message}</p>
                        <div className={styles.actions}>
                            <Button
                                variant="primary"
                                size="sm"
                                className={tone === 'danger' ? styles.dangerButton : undefined}
                                onClick={onConfirm}
                                type="button"
                            >
                                {confirmText}
                            </Button>
                            {!hideCancel && (
                                <Button variant="secondary" size="sm" onClick={onCancel} type="button">
                                    {cancelText}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    return typeof document !== 'undefined' ? createPortal(overlayContent, document.body) : null
}

type ConfirmOptions = {
    title?: ReactNode
    message: ReactNode
    confirmText?: ReactNode
    cancelText?: ReactNode
    tone?: ConfirmTone
    hideCancel?: boolean
}

type ConfirmState = ConfirmOptions & {
    resolve: (result: boolean) => void
}

export function useConfirmModal() {
    const [state, setState] = useState<ConfirmState | null>(null)

    const close = useCallback((result: boolean) => {
        setState(prev => {
            if (prev) prev.resolve(result)
            return null
        })
    }, [])

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>(resolve => {
            setState(prev => {
                if (prev) prev.resolve(false)
                return {
                    resolve,
                    title: options.title,
                    message: options.message,
                    confirmText: options.confirmText ?? 'OK',
                    cancelText: options.cancelText ?? 'Cancel',
                    tone: options.tone ?? 'default',
                    hideCancel: options.hideCancel ?? false,
                }
            })
        })
    }, [])

    const alert = useCallback(
        (options: Omit<ConfirmOptions, 'hideCancel'>) =>
            confirm({ ...options, hideCancel: true }).then(() => undefined),
        [confirm],
    )

    const modal = (
        <ConfirmModal
            isOpen={!!state}
            title={state?.title}
            message={state?.message ?? ''}
            confirmText={state?.confirmText}
            cancelText={state?.cancelText}
            tone={state?.tone}
            hideCancel={state?.hideCancel}
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
        />
    )

    return { alert, confirm, modal }
}
