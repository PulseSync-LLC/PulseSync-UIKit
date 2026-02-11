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
    /** Alignment relative to trigger (dropdown mode). 'auto' detects based on screen position */
    align?: 'left' | 'right' | 'auto'
    /** Display as centered modal with backdrop */
    modal?: boolean
    /** Callback when nickname is clicked (e.g. for copy) */
    onNicknameClick?: () => void
    /** Trigger avatar size (default: 'sm') */
    triggerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Trigger avatar className */
    triggerClassName?: string
    /** Controlled open state */
    open?: boolean
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void
    /** Anchor element for positioning (used when trigger is external) */
    anchorRef?: React.RefObject<HTMLElement | null>
    /** Hide the built-in trigger (use with controlled mode and external trigger) */
    hideTrigger?: boolean
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
    open: controlledOpen,
    onOpenChange,
    anchorRef,
    hideTrigger = false,
}: UserMenuProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [hasOpened, setHasOpened] = useState(false) // Track if ever opened (for caching)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const [computedAlign, setComputedAlign] = useState<'left' | 'right'>('right')
    const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down')
    const wrapRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Support controlled mode
    const isControlled = controlledOpen !== undefined
    // Track previous controlled open state for animation
    const prevControlledOpen = useRef(controlledOpen)
    // Track if close was initiated internally (via closePanel)
    const internalCloseRef = useRef(false)
    
    // In controlled mode: if controlledOpen changes from true to false, 
    // we need to animate closing instead of instant hide
    const [animatingClose, setAnimatingClose] = useState(false)
    
    // Determine actual open state considering close animation
    const open = isControlled 
        ? (controlledOpen || animatingClose)  // Keep open during close animation
        : internalOpen

    const setOpen = useCallback((value: boolean) => {
        if (!isControlled) {
            setInternalOpen(value)
        }
        onOpenChange?.(value)
    }, [isControlled, onOpenChange])

    // Handle controlled close with animation
    useEffect(() => {
        if (isControlled && prevControlledOpen.current === true && controlledOpen === false) {
            // Controlled open changed from true to false
            // Only start animation if close was NOT initiated internally
            if (!internalCloseRef.current) {
                setAnimatingClose(true)
                setClosing(true)
            }
        }
        // Reset internal close flag when controlled state changes
        if (prevControlledOpen.current !== controlledOpen) {
            internalCloseRef.current = false
        }
        prevControlledOpen.current = controlledOpen
    }, [controlledOpen, isControlled])

    useEffect(() => setMounted(true), [])

    // Mark as opened once
    useEffect(() => {
        if (open && !hasOpened) setHasOpened(true)
    }, [open, hasOpened])

    const updatePosition = useCallback(() => {
        const el = anchorRef?.current ?? wrapRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const panelHeight = 320 // Approximate panel height
        const panelWidth = 280

        // Determine horizontal alignment
        let effectiveAlign: 'left' | 'right' = align === 'auto' ? 'right' : align
        if (align === 'auto') {
            const triggerCenterX = rect.left + rect.width / 2
            const screenCenterX = window.innerWidth / 2
            effectiveAlign = triggerCenterX < screenCenterX ? 'left' : 'right'
        }
        setComputedAlign(effectiveAlign)

        // Determine vertical direction
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const direction: 'down' | 'up' = spaceBelow < panelHeight && spaceAbove > spaceBelow ? 'up' : 'down'
        setOpenDirection(direction)

        const style: React.CSSProperties = {
            position: 'fixed',
            minWidth: panelWidth,
            zIndex: 10050,
        }

        if (direction === 'down') {
            style.top = rect.bottom + 6
        } else {
            style.bottom = window.innerHeight - rect.top + 6
        }

        if (effectiveAlign === 'left') {
            style.left = rect.left
        } else {
            style.right = window.innerWidth - rect.right
        }

        setPanelStyle(style)
    }, [align, anchorRef])

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
        // Mark as internal close to prevent double animation
        internalCloseRef.current = true
        setAnimatingClose(true)
        setClosing(true)
    }, [open, closing])

    useEffect(() => {
        if (modal) return // Modal handles clicks via backdrop
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            const anchor = anchorRef?.current ?? wrapRef.current
            if (anchor?.contains(target) || panelRef.current?.contains(target)) return
            closePanel()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [closePanel, modal, anchorRef])

    const handleAnimEnd = useCallback(() => {
        if (closing) {
            setClosing(false)
            setAnimatingClose(false)
            // Always notify parent about close (for controlled mode)
            // In uncontrolled mode this also updates internal state
            setOpen(false)
        }
    }, [closing, setOpen])

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
                computedAlign === 'right' && styles.panelRight,
                openDirection === 'up' && styles.panelUp,
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

    // If hideTrigger, render only portal when needed
    if (hideTrigger) {
        // Only render portal when mounted and (open, closing, or has been opened for caching)
        const shouldRenderPortal = mounted && (open || closing || hasOpened)
        if (!shouldRenderPortal) return null
        
        return createPortal(
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
        )
    }

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
