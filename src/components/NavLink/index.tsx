import { type ReactNode, type AnchorHTMLAttributes } from 'react'
import { usePulseSyncUI } from '@/context/PulseSyncUIProvider'
import styles from './navLink.module.scss'
import clsx from 'clsx'

export interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string
    children: ReactNode
    /** If true, only exact pathname match counts as active. */
    exact?: boolean
    icon?: ReactNode
    /** Override active state externally (useful when not using PulseSyncUIProvider). */
    active?: boolean
}

export function NavLink({
    href,
    children,
    exact = false,
    icon,
    active,
    className,
    ...rest
}: NavLinkProps) {
    const { LinkComponent, usePathname } = usePulseSyncUI()

    // Determine active state
    let isActive = active
    if (isActive === undefined && usePathname) {
        try {
            const pathname = usePathname()
            isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
        } catch {
            isActive = false
        }
    }

    const classes = clsx(styles.navLink, isActive && styles.active, className)

    const content = (
        <>
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.label}>{children}</span>
        </>
    )

    if (LinkComponent) {
        return (
            <LinkComponent href={href} className={classes} {...rest}>
                {content}
            </LinkComponent>
        )
    }

    return (
        <a href={href} className={classes} {...rest}>
            {content}
        </a>
    )
}
