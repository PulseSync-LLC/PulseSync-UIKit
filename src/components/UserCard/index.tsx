import { type ReactNode } from 'react'
import styles from './userCard.module.scss'
import clsx from 'clsx'

/* ── Types ── */

export interface UserCardBadge {
    /** Unique key for this badge. */
    key: string
    /** Display name (shown as title on hover). */
    name: string
    /** Badge icon — URL string or ReactNode (inline SVG, Image, etc). */
    icon?: string | ReactNode
    /** Optional accent color. */
    color?: string
}

export interface UserCardUser {
    /** Login/handle. */
    username: string
    /** Display name (falls back to username). */
    nickname?: string
    /** Avatar image URL. */
    avatarUrl: string
    /** Banner image URL (if absent, gradient is used). */
    bannerUrl?: string
    /** Online status. */
    status?: 'online' | 'offline'
    /** User badges. */
    badges?: UserCardBadge[]
    /** Currently playing track info. */
    currentTrack?: {
        title: string
        artists?: string
    }
}

export interface UserCardProps {
    /** User data to display. */
    user: UserCardUser
    /** Status label text (e.g. "Online", "Offline"). */
    statusText?: string
    /** Status indicator color (CSS color). */
    statusColor?: string
    /** Additional class on the root element. */
    className?: string
}

/* ── Component ── */

export function UserCard({ user, statusText, statusColor, className }: UserCardProps) {
    const bannerBg = user.bannerUrl
        ? `linear-gradient(0deg, #2C303F 0%, rgba(55,60,80,0.3) 100%), url(${user.bannerUrl})`
        : 'linear-gradient(0deg, #2C303F 0%, rgba(55,60,80,0.3) 100%)'

    const trackLabel = user.currentTrack
        ? user.currentTrack.artists
            ? `${user.currentTrack.title} — ${user.currentTrack.artists}`
            : user.currentTrack.title
        : null

    const displayStatus = trackLabel || statusText || (user.status === 'online' ? 'Online' : 'Offline')
    const displayColor = statusColor || (user.status === 'online' ? '#66E3FF' : '#434B61')

    const style = { '--ps-user-status-color': displayColor } as React.CSSProperties

    return (
        <div className={clsx(styles.container, className)} style={style} aria-hidden>
            <div
                className={styles.topSection}
                style={{ background: bannerBg }}
            >
                <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className={styles.userAvatar}
                    draggable={false}
                />
                <div className={styles.userInfo}>
                    {user.badges && user.badges.length > 0 && (
                        <div className={styles.badges}>
                            {user.badges.map(b => (
                                <div key={b.key} className={styles.badge} title={b.name}>
                                    {typeof b.icon === 'string' ? (
                                        <img src={b.icon} alt={b.name} className={styles.badgeIcon} draggable={false} />
                                    ) : b.icon ? (
                                        <span className={styles.badgeIcon}>{b.icon}</span>
                                    ) : (
                                        <span
                                            className={styles.badgeDot}
                                            style={{ background: b.color || 'var(--ps-text-muted)' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.nickname}>{user.nickname || user.username}</div>
                </div>
            </div>
            <div className={styles.bottomSection}>
                <div className={styles.statusText}>{displayStatus}</div>
                <div className={styles.statusIcon} aria-hidden>●</div>
            </div>
        </div>
    )
}
