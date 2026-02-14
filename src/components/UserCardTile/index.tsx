import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Avatar } from '../Avatar'
import styles from './userCardTile.module.scss'

export type UserCardTileStatus = 'online' | 'offline' | 'idle' | 'banned'

export interface UserCardTileProps {
    /** Avatar image URL */
    avatarSrc?: string | null
    /** Display name (bold) */
    nickname: string
    /** Handle without @, will be shown as @username */
    username: string
    /** Status indicator */
    status?: UserCardTileStatus
    /** Level number, e.g. 1 — shown with star icon */
    level?: number
    /** Formatted date string, e.g. "14 февр. 2026 г." — shown with calendar icon */
    date?: string
    /** Optional banner image URL (top of card) */
    bannerSrc?: string | null
    /** Level label renderer: (level) => "Ур. 1" */
    levelLabel?: (level: number) => string
    /** Click handler — parent can open user management modal */
    onClick?: () => void
    /** Additional class name */
    className?: string
    /** Alt for avatar */
    avatarAlt?: string
    /** Custom content after meta row (e.g. tags) */
    children?: ReactNode
}

const defaultLevelLabel = (level: number) => `Ур. ${level}`

export function UserCardTile({
    avatarSrc,
    nickname,
    username,
    status = 'offline',
    level,
    date,
    bannerSrc,
    levelLabel = defaultLevelLabel,
    onClick,
    className,
    avatarAlt = '',
    children,
}: UserCardTileProps) {
    const isBanned = status === 'banned'
    const displayLevel = level ?? 1

    return (
        <div
            role="button"
            tabIndex={0}
            className={clsx(styles.root, isBanned && styles.banned, className)}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick?.()
                }
            }}
        >
            {bannerSrc && (
                <div
                    className={styles.banner}
                    style={{ backgroundImage: `url(${bannerSrc})` }}
                    aria-hidden
                />
            )}
            <div className={styles.content}>
                <div
                    className={clsx(
                        styles.header,
                        !bannerSrc && styles.headerNoBanner
                    )}
                >
                    <div className={styles.avatarWrap}>
                        <Avatar
                            src={avatarSrc}
                            alt={avatarAlt || nickname}
                            size="lg"
                            shape="rounded"
                        />
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.nickname}>{nickname}</div>
                        <div className={styles.username}>@{username}</div>
                    </div>
                    <div
                        className={clsx(styles.statusDot, styles[status])}
                        title={status}
                        aria-hidden
                    />
                </div>
                {(level != null || date) && (
                    <div className={styles.meta}>
                        {level != null && (
                            <div className={styles.metaItem}>
                                <StarIcon />
                                <span>{levelLabel(displayLevel)}</span>
                            </div>
                        )}
                        {date && (
                            <div className={styles.metaItem}>
                                <CalendarIcon />
                                <span>{date}</span>
                            </div>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}

function StarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    )
}
