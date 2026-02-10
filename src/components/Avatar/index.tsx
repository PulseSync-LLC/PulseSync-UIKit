import {
    useState,
    isValidElement,
    cloneElement,
    Children,
    type ReactNode,
    type ReactElement,
    type ImgHTMLAttributes,
} from 'react'
import styles from './avatar.module.scss'
import clsx from 'clsx'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'rounded' | 'circle' | 'square'
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size' | 'src'> {
    /** Image source URL. */
    src?: string | null
    /** Alt text for the image. */
    alt?: string
    /** Size preset. */
    size?: AvatarSize
    /** Shape of the avatar. */
    shape?: AvatarShape
    /** Show a status indicator bar. */
    status?: AvatarStatus
    /** Initials or icon to show when image is not available. */
    fallback?: ReactNode
    /** Additional class on the root element. */
    className?: string
    /** Click handler. */
    onClick?: () => void
}

function getInitials(alt?: string): string {
    if (!alt) return '?'
    return alt
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
}

const statusClassMap: Record<AvatarStatus, string> = {
    online: styles.statusOnline,
    offline: styles.statusOffline,
    busy: styles.statusBusy,
    away: styles.statusAway,
}

export function Avatar({
    src,
    alt,
    size = 'md',
    shape = 'rounded',
    status,
    fallback,
    className,
    onClick,
    ...imgProps
}: AvatarProps) {
    const [imgError, setImgError] = useState(false)
    const showImage = src && !imgError

    return (
        <div
            className={clsx(styles.avatar, styles[size], styles[shape], className)}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            {showImage ? (
                <div className={styles.imageWrap}>
                    <img
                        src={src}
                        alt={alt || ''}
                        className={styles.image}
                        onError={() => setImgError(true)}
                        draggable={false}
                        {...imgProps}
                    />
                </div>
            ) : (
                <span className={styles.fallback}>{fallback || getInitials(alt)}</span>
            )}
            {status && (
                <span className={clsx(styles.status, statusClassMap[status])} aria-label={status} />
            )}
        </div>
    )
}

/* ── AvatarGroup ── */

export interface AvatarGroupProps {
    children: ReactNode
    className?: string
    /** Maximum avatars to display before showing +N counter. */
    max?: number
}

/**
 * Extract displayable info from an Avatar element for the overflow popover.
 */
function getAvatarInfo(child: ReactElement<AvatarProps>) {
    const props = child.props as AvatarProps
    return {
        src: props.src,
        alt: props.alt || '?',
        size: props.size,
        shape: props.shape,
    }
}

export function AvatarGroup({ children, className, max }: AvatarGroupProps) {
    const childArray = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[]
    const visible = max ? childArray.slice(0, max) : childArray
    const overflow = max && childArray.length > max ? childArray.slice(max) : []

    return (
        <div className={clsx(styles.group, className)}>
            {visible}
            {overflow.length > 0 && (
                <div className={styles.overflowTrigger}>
                    <Avatar fallback={`+${overflow.length}`} size="md" shape="circle" />
                    <div className={styles.overflowPopover}>
                        {overflow.map((child, i) => {
                            const info = getAvatarInfo(child)
                            return (
                                <div key={i} className={styles.overflowItem}>
                                    {cloneElement(child, {
                                        size: 'xs' as AvatarSize,
                                        shape: (info.shape || 'circle') as AvatarShape,
                                        status: undefined,
                                    })}
                                    <span className={styles.overflowItemName}>{info.alt}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
