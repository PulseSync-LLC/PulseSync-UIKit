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
    /** Alignment relative to trigger (dropdown mode) */
    align?: 'left' | 'right'
    /** Display as centered modal with backdrop */
    modal?: boolean
    /** Callback when nickname is clicked (e.g. for copy) */
    onNicknameClick?: () => void
    /** Trigger avatar size (default: 'sm') */
    triggerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Trigger avatar className */
    triggerClassName?: string
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
    modal = false,
    onNicknameClick,
    triggerSize = 'sm',
    triggerClassName,
}: UserMenuProps) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [hasOpened, setHasOpened] = useState(false) // Track if ever opened (for caching)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const wrapRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    // Mark as opened once
    useEffect(() => {
        if (open && !hasOpened) setHasOpened(true)
    }, [open, hasOpened])

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
        if (modal) return // Modal handles clicks via backdrop
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return
            closePanel()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [closePanel, modal])

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
    const isHidden = hasOpened && !showPanel

    const panelContent = (
        <div
            ref={panelRef}
            className={clsx(
                styles.panel,
                align === 'right' && styles.panelRight,
                closing && styles.panelClosing,
                isHidden && styles.panelHidden
            )}
            style={panelStyle}
            onAnimationEnd={handleAnimEnd}
            onClick={e => e.stopPropagation()}
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
                        {nickname != null && (
                            <div
                                className={clsx(styles.nickname, onNicknameClick && styles.nicknameClickable)}
                                onClick={onNicknameClick}
                                role={onNicknameClick ? 'button' : undefined}
                                tabIndex={onNicknameClick ? 0 : undefined}
                                onKeyDown={onNicknameClick ? e => e.key === 'Enter' && onNicknameClick() : undefined}
                            >
                                {nickname}
                            </div>
                        )}
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
                                closePanel()
                            }
                        }}
                    >
                        {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                        <span className={styles.itemLabel}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div ref={wrapRef} className={clsx(styles.wrapper, className)}>
            <div className={styles.trigger} onClick={toggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggle()}>
                {children ?? (
                    <Avatar
                        src={avatarSrc}
                        alt={avatarAlt || ''}
                        size={triggerSize}
                        shape="rounded"
                        status={status}
                        className={triggerClassName}
                    />
                )}
            </div>

            {mounted && hasOpened && createPortal(
                modal ? (
                    <div
                        className={clsx(styles.backdrop, closing && styles.backdropClosing, isHidden && styles.backdropHidden)}
                        onClick={closePanel}
                        onAnimationEnd={handleAnimEnd}
                    >
                        {panelContent}
                    </div>
                ) : panelContent,
                document.body,
            )}
        </div>
    )
}
