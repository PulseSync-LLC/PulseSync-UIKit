import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { UserCard, type UserCardUser } from '../UserCard'
import styles from './userMention.module.scss'
import clsx from 'clsx'

export type { UserCardUser, UserCardBadge, UserCardProps } from '../UserCard'

export interface UserMentionProps {
    /** Username displayed inline. */
    username: string
    /** Accent dot color (CSS value). Default: `#94a3b8`. */
    dotColor?: string
    /**
     * User data for the popover card.
     * - If provided, popover renders immediately on hover.
     * - If omitted, `onFetchUser` is called on hover.
     */
    user?: UserCardUser | null
    /**
     * Called when hovering if `user` is not provided.
     * Return `UserCardUser` or `null`. Can be async.
     */
    onFetchUser?: (username: string) => Promise<UserCardUser | null> | UserCardUser | null
    /** Status label shown in the card (e.g. "Online"). */
    statusText?: string
    /** Status indicator color. */
    statusColor?: string
    /** Content shown when user data is loading. */
    loadingContent?: ReactNode
    /** Content shown when user is not found. */
    notFoundContent?: ReactNode
    /** Additional class on the root `<span>`. */
    className?: string
}

export function UserMention({
    username,
    dotColor = '#94a3b8',
    user: userProp,
    onFetchUser,
    statusText,
    statusColor,
    loadingContent,
    notFoundContent,
    className,
}: UserMentionProps) {
    const [showPopover, setShowPopover] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const [fetchedUser, setFetchedUser] = useState<UserCardUser | null>(null)
    const [fetching, setFetching] = useState(false)
    const [fetchDone, setFetchDone] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})

    const hoverTimer = useRef<number | null>(null)
    const hideTimer = useRef<number | null>(null)
    const triggerRef = useRef<HTMLSpanElement>(null)

    const user = userProp ?? fetchedUser

    useEffect(() => setMounted(true), [])

    // Mark as opened once
    useEffect(() => {
        if (showPopover && !hasOpened) setHasOpened(true)
    }, [showPopover, hasOpened])

    // Update position
    const updatePosition = useCallback(() => {
        const el = triggerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setPopoverStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
            transform: 'translateX(-50%)',
            zIndex: 10100,
        })
    }, [])

    useEffect(() => {
        if (!showPopover) return
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [showPopover, updatePosition])

    const handleMouseEnter = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current)
            hideTimer.current = null
        }
        hoverTimer.current = window.setTimeout(async () => {
            setShowPopover(true)

            // Fetch user data if not provided and not yet fetched
            if (userProp === undefined && onFetchUser && !fetchDone) {
                setFetching(true)
                try {
                    const result = await onFetchUser(username)
                    setFetchedUser(result)
                } catch {
                    setFetchedUser(null)
                } finally {
                    setFetching(false)
                    setFetchDone(true)
                }
            }
        }, 150)
    }, [userProp, onFetchUser, fetchDone, username])

    const handleMouseLeave = useCallback(() => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current)
            hoverTimer.current = null
        }
        hideTimer.current = window.setTimeout(() => setShowPopover(false), 200)
    }, [])

    const isHidden = hasOpened && !showPopover

    const popoverContent = (
        <div
            className={clsx(styles.popover, isHidden && styles.popoverHidden)}
            style={popoverStyle}
            onMouseEnter={() => {
                if (hideTimer.current) {
                    clearTimeout(hideTimer.current)
                    hideTimer.current = null
                }
            }}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.popoverInner}>
                {fetching && !user && (
                    <div className={styles.fallbackContent}>
                        {loadingContent || 'Loading...'}
                    </div>
                )}
                {!fetching && !user && fetchDone && (
                    <div className={styles.fallbackContent}>
                        {notFoundContent || 'User not found'}
                    </div>
                )}
                {user && (
                    <UserCard
                        user={user}
                        statusText={statusText}
                        statusColor={statusColor}
                        noAnimation
                    />
                )}
            </div>
        </div>
    )

    return (
        <span
            className={clsx(styles.root, className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span ref={triggerRef} className={styles.trigger} role="button" tabIndex={0}>
                <span className={styles.dot} style={{ background: dotColor }} aria-hidden />
                <span className={styles.username}>{username}</span>
            </span>

            {mounted && hasOpened && createPortal(popoverContent, document.body)}
        </span>
    )
}
