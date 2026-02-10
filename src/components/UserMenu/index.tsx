import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Avatar } from '../Avatar'
import type { AvatarStatus } from '../Avatar'
import styles from './userMenu.module.scss'

export interface UserMenuItem {
    /** Unique key */
    key: string
    /** Display label */
    label: ReactNode
    /** Optional icon (left side) */
    icon?: ReactNode
    /** Click handler */
    onClick?: () => void
    /** Disable the item */
    disabled?: boolean
}

export interface UserMenuProps {
    /** Avatar image URL */
    avatarSrc?: string | null
    /** Avatar alt/fallback text */
    avatarAlt?: string
    /** Username (display name) */
    username: ReactNode
    /** Nickname / @handle */
    nickname?: ReactNode
    /** Banner image URL (optional) */
    bannerSrc?: string | null
    /** Status indicator */
    status?: AvatarStatus
    /** Menu items */
    items: UserMenuItem[]
    /** Custom trigger element; if not provided, renders avatar */
    children?: ReactNode
    /** Additional className on wrapper */
    className?: string
    /** Alignment relative to trigger */
    align?: 'left' | 'right'
}

export function UserMenu({
    avatarSrc,
    avatarAlt,
    username,
    nickname,
    bannerSrc,
    status,
    items,
    children,
    className,
    align = 'right',
}: UserMenuProps) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const wrapRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    const updatePosition = useCallback(() => {
        const el = wrapRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setPanelStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: align === 'right' ? undefined : rect.left,
            right: align === 'right' ? window.innerWidth - rect.right : undefined,
            minWidth: 280,
            zIndex: 10050,
        })
    }, [align])

    useEffect(() => {
        if (!open) return
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [open, updatePosition])

    const closePanel = useCallback(() => {
        if (!open && !closing) return
        if (closing) return
        setClosing(true)
    }, [open, closing])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return
            closePanel()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [closePanel])

    const handleAnimEnd = useCallback(() => {
        if (closing) {
            setClosing(false)
            setOpen(false)
        }
    }, [closing])

    const toggle = () => {
        if (open) closePanel()
        else setOpen(true)
    }

    const showPanel = open || closing

    return (
        <div ref={wrapRef} className={clsx(styles.wrapper, className)}>
            <div className={styles.trigger} onClick={toggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggle()}>
                {children ?? (
                    <Avatar
                        src={avatarSrc}
                        alt={avatarAlt || ''}
                        size="sm"
                        shape="rounded"
                        status={status}
                    />
                )}
            </div>

            {mounted && showPanel && createPortal(
                <div
                    ref={panelRef}
                    className={clsx(styles.panel, align === 'right' && styles.panelRight, closing && styles.panelClosing)}
                    style={panelStyle}
                    onAnimationEnd={handleAnimEnd}
                >
                    <div className={styles.content}>
                        {bannerSrc && (
                            <div
                                className={styles.banner}
                                style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%), url(${bannerSrc})` }}
                            />
                        )}
                        <div className={styles.userInfo}>
                            <div className={styles.avatarWrap}>
                                <Avatar
                                    src={avatarSrc}
                                    alt={avatarAlt || ''}
                                    size="lg"
                                    shape="rounded"
                                    status={status}
                                />
                            </div>
                            <div className={styles.userDetails}>
                                <div className={styles.username}>{username}</div>
                                {nickname != null && <div className={styles.nickname}>{nickname}</div>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.menu}>
                        {items.map(item => (
                            <button
                                key={item.key}
                                type="button"
                                className={clsx(styles.item, item.disabled && styles.itemDisabled)}
                                disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled) {
                                        item.onClick?.()
                                        setOpen(false)
                                    }
                                }}
                            >
                                {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                                <span className={styles.itemLabel}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}
