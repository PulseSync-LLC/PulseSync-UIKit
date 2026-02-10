import clsx from 'clsx'
import styles from './skeleton.module.scss'

export interface SkeletonProps {
    /** Width — CSS value or number (px) */
    width?: string | number
    /** Height — CSS value or number (px) */
    height?: string | number
    /** Border-radius variant */
    variant?: 'text' | 'circular' | 'rounded' | 'rectangular'
    /** Custom border-radius */
    borderRadius?: string | number
    /** Number of skeleton lines to render (for text variant) */
    count?: number
    /** Gap between lines */
    gap?: number
    /** Disable shimmer animation */
    static?: boolean
    className?: string
}

export function Skeleton({
    width,
    height,
    variant = 'text',
    borderRadius,
    count = 1,
    gap = 8,
    static: isStatic,
    className,
}: SkeletonProps) {
    const resolveRadius = () => {
        if (borderRadius !== undefined) return typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
        switch (variant) {
            case 'circular':
                return '50%'
            case 'rounded':
                return '12px'
            case 'rectangular':
                return '0'
            case 'text':
            default:
                return '8px'
        }
    }

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height || (variant === 'text' ? '16px' : undefined),
        borderRadius: resolveRadius(),
    }

    if (variant === 'circular' && width && !height) {
        style.height = style.width
    }

    if (count > 1) {
        return (
            <div className={styles.group} style={{ gap }}>
                {Array.from({ length: count }, (_, i) => (
                    <div
                        key={i}
                        className={clsx(styles.skeleton, !isStatic && styles.animated, className)}
                        style={{
                            ...style,
                            width: i === count - 1 ? '75%' : style.width,
                        }}
                    />
                ))}
            </div>
        )
    }

    return <div className={clsx(styles.skeleton, !isStatic && styles.animated, className)} style={style} />
}
