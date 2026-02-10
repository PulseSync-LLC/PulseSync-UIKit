import {
    useState,
    useEffect,
    useCallback,
    useRef,
    createContext,
    useContext,
    type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './toast.module.scss'

/* ─────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
    id: string
    type: ToastType
    title?: string
    message: ReactNode
    duration?: number
}

interface ToastInternal extends ToastData {
    state: 'entering' | 'visible' | 'exiting'
    createdAt: number
}

type AddToastFn = (toast: Omit<ToastData, 'id'>) => string
type DismissToastFn = (id: string) => void

export interface ToastAPI {
    add: AddToastFn
    dismiss: DismissToastFn
    success: (message: ReactNode, title?: string) => string
    error: (message: ReactNode, title?: string) => string
    warning: (message: ReactNode, title?: string) => string
    info: (message: ReactNode, title?: string) => string
}

/* ─────────────────────────────────────────────
 *  Colors & icons
 * ───────────────────────────────────────────── */

const typeColors: Record<ToastType, string> = {
    success: '#87FF77',
    error: '#FF7777',
    warning: '#FFEF77',
    info: '#77FFC9',
}

const defaultTitles: Record<ToastType, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
}

function ToastIcon({ type }: { type: ToastType }) {
    const color = typeColors[type]
    switch (type) {
        case 'success':
            return (
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM9.29 16.29L5.7 12.7C5.31 12.31 5.31 11.68 5.7 11.29C6.09 10.9 6.72 10.9 7.11 11.29L10 14.17L16.88 7.29C17.27 6.9 17.9 6.9 18.29 7.29C18.68 7.68 18.68 8.31 18.29 8.7L10.7 16.29C10.32 16.68 9.68 16.68 9.29 16.29Z"
                        fill={color}
                    />
                </svg>
            )
        case 'error':
            return (
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 13C11.45 13 11 12.55 11 12V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V12C13 12.55 12.55 13 12 13ZM13 17H11V15H13V17Z"
                        fill={color}
                    />
                </svg>
            )
        case 'warning':
            return (
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M4.47 21H19.53C21.07 21 22.03 19.33 21.26 18L13.73 4.99C12.96 3.66 11.04 3.66 10.27 4.99L2.74 18C1.97 19.33 2.93 21 4.47 21ZM12 14C11.45 14 11 13.55 11 13V11C11 10.45 11.45 10 12 10C12.55 10 13 10.45 13 11V13C13 13.55 12.55 14 12 14ZM13 18H11V16H13V18Z"
                        fill={color}
                    />
                </svg>
            )
        case 'info':
            return (
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17C11.45 17 11 16.55 11 16V12C11 11.45 11.45 11 12 11C12.55 11 13 11.45 13 12V16C13 16.55 12.55 17 12 17ZM13 9H11V7H13V9Z"
                        fill={color}
                    />
                </svg>
            )
    }
}

function DismissIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    )
}

/* ─────────────────────────────────────────────
 *  Single toast item
 * ───────────────────────────────────────────── */

function ToastItem({
    toast: t,
    onDismiss,
}: {
    toast: ToastInternal
    onDismiss: (id: string) => void
}) {
    const duration = t.duration ?? 5000
    const [progress, setProgress] = useState(100)
    const startRef = useRef(Date.now())

    useEffect(() => {
        if (duration === Infinity) return
        startRef.current = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - startRef.current
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
            setProgress(remaining)
            if (remaining <= 0) {
                clearInterval(interval)
            }
        }, 50)
        return () => clearInterval(interval)
    }, [duration])

    const cls = [
        styles.toast,
        t.state === 'entering' || t.state === 'visible' ? styles.toastVisible : '',
        t.state === 'exiting' ? styles.toastExiting : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div
            className={cls}
            style={{ '--toast-color': typeColors[t.type] } as React.CSSProperties}
        >
            <div className={styles.iconContainer}>
                <ToastIcon type={t.type} />
            </div>
            <div className={styles.textContainer}>
                <div className={styles.title}>{t.title || defaultTitles[t.type]}</div>
                <div className={styles.message}>{t.message}</div>
            </div>
            <button className={styles.dismissButton} onClick={() => onDismiss(t.id)}>
                <DismissIcon />
            </button>
            {duration !== Infinity && (
                <div
                    className={styles.progressBar}
                    style={{ width: `${progress}%`, transitionDuration: '50ms' }}
                />
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────
 *  Toast context & provider
 * ───────────────────────────────────────────── */

const ToastContext = createContext<ToastAPI | null>(null)

let idCounter = 0
function nextId() {
    return `ps-toast-${++idCounter}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastInternal[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const dismiss = useCallback((id: string) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, state: 'exiting' as const } : t)),
        )
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 500)
    }, [])

    const add: AddToastFn = useCallback(
        ({ type, title, message, duration }) => {
            const id = nextId()
            const d = duration ?? 5000

            const internal: ToastInternal = {
                id,
                type,
                title,
                message,
                duration: d,
                state: 'entering',
                createdAt: Date.now(),
            }

            setToasts(prev => [...prev, internal])

            // Mark visible after animation frame
            requestAnimationFrame(() => {
                setToasts(prev =>
                    prev.map(t => (t.id === id ? { ...t, state: 'visible' as const } : t)),
                )
            })

            // Auto-dismiss
            if (d !== Infinity) {
                setTimeout(() => dismiss(id), d)
            }

            return id
        },
        [dismiss],
    )

    const api: ToastAPI = {
        add,
        dismiss,
        success: (message, title) => add({ type: 'success', message, title }),
        error: (message, title) => add({ type: 'error', message, title }),
        warning: (message, title) => add({ type: 'warning', message, title }),
        info: (message, title) => add({ type: 'info', message, title }),
    }

    return (
        <ToastContext.Provider value={api}>
            {children}
            {mounted
                ? createPortal(
                      <div className={styles.container}>
                          {toasts.map(t => (
                              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                          ))}
                      </div>,
                      document.body,
                  )
                : null}
        </ToastContext.Provider>
    )
}

/**
 * Hook to access toast API.
 *
 * @example
 * ```tsx
 * const toast = useToast()
 * toast.success('Saved!')
 * toast.error('Something went wrong')
 * toast.warning('Check your input')
 * toast.info('New update available')
 * ```
 */
export function useToast(): ToastAPI {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        throw new Error('useToast must be used within <ToastProvider>')
    }
    return ctx
}
