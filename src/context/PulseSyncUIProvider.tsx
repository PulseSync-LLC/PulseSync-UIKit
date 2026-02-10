import {
    createContext,
    useContext,
    type ComponentType,
    type AnchorHTMLAttributes,
    type ReactNode,
} from 'react'

/**
 * Props expected by a link component (e.g. next/link, react-router Link).
 * The component must accept at least `href`, `className`, `children`, and
 * spread the remaining anchor attributes.
 */
export type LinkComponentProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    children?: ReactNode
}

export interface PulseSyncUIContextValue {
    /** Custom link component for client-side navigation (e.g. next/link, react-router Link). */
    LinkComponent?: ComponentType<LinkComponentProps>
    /** Hook that returns the current pathname (e.g. usePathname from next/navigation, useLocation().pathname). */
    usePathname?: () => string
}

const PulseSyncUIContext = createContext<PulseSyncUIContextValue>({})

export interface PulseSyncUIProviderProps extends PulseSyncUIContextValue {
    children: ReactNode
}

/**
 * Provider to configure framework-specific integrations for PulseSync UI.
 *
 * @example Next.js
 * ```tsx
 * import Link from 'next/link'
 * import { usePathname } from 'next/navigation'
 * import { PulseSyncUIProvider } from '@maks1mio/pulsesync-uikit'
 *
 * <PulseSyncUIProvider LinkComponent={Link} usePathname={usePathname}>
 *   <App />
 * </PulseSyncUIProvider>
 * ```
 *
 * @example React Router
 * ```tsx
 * import { Link, useLocation } from 'react-router-dom'
 * import { PulseSyncUIProvider } from '@maks1mio/pulsesync-uikit'
 *
 * const usePathname = () => useLocation().pathname
 *
 * <PulseSyncUIProvider LinkComponent={Link as any} usePathname={usePathname}>
 *   <App />
 * </PulseSyncUIProvider>
 * ```
 */
export function PulseSyncUIProvider({
    children,
    LinkComponent,
    usePathname,
}: PulseSyncUIProviderProps) {
    return (
        <PulseSyncUIContext.Provider value={{ LinkComponent, usePathname }}>
            {children}
        </PulseSyncUIContext.Provider>
    )
}

export function usePulseSyncUI() {
    return useContext(PulseSyncUIContext)
}
