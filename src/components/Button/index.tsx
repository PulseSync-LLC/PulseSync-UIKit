import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { usePulseSyncUI } from '@/context/PulseSyncUIProvider'
import styles from './button.module.scss'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'control'
export type ButtonSize = 'sm' | 'md' | 'lg'

type BaseProps = {
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: ReactNode
    iconPosition?: 'left' | 'right'
    fullWidth?: boolean
    loading?: boolean
    children?: ReactNode
}

type ButtonAsButton = BaseProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never
        target?: never
        rel?: never
    }

type ButtonAsLink = BaseProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
        href: string
        disabled?: boolean
    }

export type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
    const { LinkComponent } = usePulseSyncUI()

    const {
        variant = 'primary',
        size = 'md',
        icon,
        iconPosition = 'left',
        fullWidth = false,
        loading = false,
        disabled,
        className,
        children,
        ...rest
    } = props

    const classes = clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        disabled && styles.disabled,
        className,
    )

    const content = loading ? (
        <span className={styles.spinner} />
    ) : (
        <>
            {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
            {children && <span className={styles.label}>{children}</span>}
            {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
        </>
    )

    if ('href' in props && props.href) {
        const { href, target, rel, ...linkRest } = rest as ButtonAsLink
        const isExternal = href.startsWith('http') || href.startsWith('//')

        if (isExternal) {
            return (
                <a
                    href={href}
                    target={target || '_blank'}
                    rel={rel || 'noopener noreferrer'}
                    className={classes}
                    aria-disabled={disabled}
                    {...linkRest}
                >
                    {content}
                </a>
            )
        }

        // Use framework-specific Link if provided via PulseSyncUIProvider
        if (LinkComponent) {
            return (
                <LinkComponent href={href} className={classes} aria-disabled={disabled} {...linkRest}>
                    {content}
                </LinkComponent>
            )
        }

        return (
            <a href={href} className={classes} aria-disabled={disabled} {...linkRest}>
                {content}
            </a>
        )
    }

    const buttonProps = rest as ButtonAsButton
    return (
        <button className={classes} disabled={disabled || loading} {...buttonProps}>
            {content}
        </button>
    )
}

export default Button
