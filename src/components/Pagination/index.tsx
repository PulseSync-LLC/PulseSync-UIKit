import { useMemo } from 'react'
import styles from './pagination.module.scss'
import clsx from 'clsx'

export interface PaginationProps {
    /** Total number of items. */
    totalItems: number
    /** Items displayed per page. */
    itemsPerPage: number
    /** Currently active page (1-based). */
    currentPage: number
    /** Callback fired when a page is selected. */
    onPageChange: (page: number) => void
    /** Maximum number of visible page buttons (excluding prev/next). Default 7. */
    maxButtons?: number
    /** Additional class on the root element. */
    className?: string
}

function ChevronLeft() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function ChevronRight() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
        </svg>
    )
}

function getPageNumbers(current: number, total: number, max: number): (number | '...')[] {
    if (total <= max) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages: (number | '...')[] = []
    const sideWidth = Math.floor((max - 3) / 2) // pages on each side of current

    // Always show first page
    pages.push(1)

    const leftBound = Math.max(2, current - sideWidth)
    const rightBound = Math.min(total - 1, current + sideWidth)

    if (leftBound > 2) {
        pages.push('...')
    }

    for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i)
    }

    if (rightBound < total - 1) {
        pages.push('...')
    }

    // Always show last page
    if (total > 1) {
        pages.push(total)
    }

    return pages
}

export function Pagination({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    maxButtons = 7,
    className,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const pages = useMemo(
        () => getPageNumbers(currentPage, totalPages, maxButtons),
        [currentPage, totalPages, maxButtons],
    )

    if (totalPages <= 1) return null

    return (
        <nav className={clsx(styles.pagination, className)} aria-label="Pagination">
            <button
                className={clsx(styles.pageItem, styles.nav)}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
            >
                <ChevronLeft />
            </button>

            {pages.map((page, i) => {
                if (page === '...') {
                    return (
                        <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                            &hellip;
                        </span>
                    )
                }
                return (
                    <button
                        key={page}
                        className={clsx(styles.pageItem, currentPage === page && styles.active)}
                        onClick={() => onPageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                    >
                        {page}
                    </button>
                )
            })}

            <button
                className={clsx(styles.pageItem, styles.nav)}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
            >
                <ChevronRight />
            </button>
        </nav>
    )
}
