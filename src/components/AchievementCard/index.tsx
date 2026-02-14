import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import { IconButton } from '../IconButton'
import styles from './achievementCard.module.scss'

export type AchievementCardDifficulty = 'easy' | 'normal' | 'hard' | 'extreme'

export interface AchievementCardCriterion {
    name: string
}

export interface AchievementCardProps {
    /** Achievement title */
    title: string
    /** Short description */
    description?: string
    /** Image URL for the achievement icon */
    imageUrl?: string | null
    /** Points value */
    points: number
    /** Difficulty — used for accent color and badge */
    difficulty: AchievementCardDifficulty
    /** Hint text — shown in tooltip on hover */
    hint?: string
    /** Criteria (e.g. tracks to listen) — shown in tooltip as "What to listen" */
    criteria?: AchievementCardCriterion[] | string[]
    /** Label for criteria block in tooltip, e.g. "What to listen to complete:" */
    criteriaLabel?: string
    /** Progress: total required (e.g. 5) */
    progressTotal?: number
    /** Progress: completed (e.g. 2) — optional, can show "2/5" in footer */
    progressCompleted?: number
    /** If false, progress (0/X) is not shown — e.g. in admin panel */
    showProgress?: boolean
    /** Display variant: grid card or list row */
    variant?: 'grid' | 'list'
    /** Click handler — e.g. open edit modal */
    onClick?: () => void
    /** Points suffix for a11y/label, e.g. "pts" */
    pointsSuffix?: string
    /** Additional class name */
    className?: string
    /** Tooltip max height (px or string). Content scrolls when longer. */
    tooltipMaxHeight?: number | string
    /** Tooltip max width (px or string) */
    tooltipMaxWidth?: number | string
    /** Tooltip min width (px or string) */
    tooltipMinWidth?: number | string
    /** Tooltip min height (px or string) */
    tooltipMinHeight?: number | string
    /** If true, tooltip stays open when hovering over it and can scroll */
    tooltipHoverable?: boolean
    /** Called when delete button is clicked (e.stopPropagation so card onClick is not fired) */
    onDelete?: () => void
    /** A11y label for delete button */
    deleteLabel?: string
}

const DIFFICULTY_CLASS: Record<string, keyof typeof styles> = {
    easy: styles.difficultyEasy,
    normal: styles.difficultyNormal,
    hard: styles.difficultyHard,
    extreme: styles.difficultyExtreme,
    EASY: styles.difficultyEasy,
    NORMAL: styles.difficultyNormal,
    HARD: styles.difficultyHard,
    EXTREME: styles.difficultyExtreme,
}

function StarIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
    )
}

function normalizeDifficulty(d: string): AchievementCardDifficulty {
    const lower = d.toLowerCase()
    if (['easy', 'normal', 'hard', 'extreme'].includes(lower)) return lower as AchievementCardDifficulty
    return 'normal'
}

function getDifficultyClass(d: string): string {
    const key = d.toUpperCase()
    return (DIFFICULTY_CLASS[key] ?? DIFFICULTY_CLASS[d] ?? styles.difficultyNormal) as string
}

function criteriaNames(criteria?: AchievementCardCriterion[] | string[]): string[] {
    if (!criteria?.length) return []
    return criteria.map(c => (typeof c === 'string' ? c : (c as AchievementCardCriterion).name)).filter(Boolean)
}

export function AchievementCard({
    title,
    description,
    imageUrl,
    points,
    difficulty,
    hint,
    criteria,
    criteriaLabel,
    progressTotal,
    progressCompleted,
    showProgress = true,
    variant = 'grid',
    onClick,
    pointsSuffix = '',
    className,
    tooltipMaxHeight = 280,
    tooltipMaxWidth = 500,
    tooltipMinWidth = 500,
    tooltipMinHeight,
    tooltipHoverable = true,
    onDelete,
    deleteLabel = 'Delete',
}: AchievementCardProps) {
    const diffNorm = normalizeDifficulty(difficulty)
    const difficultyClass = getDifficultyClass(difficulty)
    const names = criteriaNames(criteria)
    const hasTooltip = Boolean(hint || names.length > 0)

    const tooltipContent: ReactNode = (
        <div className={styles.tooltipContentWrap}>
            {hint && <div className={styles.tooltipHint}>{hint}</div>}
            {names.length > 0 && (
                <div className={styles.tooltipCriteria}>
                    {criteriaLabel && <div className={styles.tooltipCriteriaLabel}>{criteriaLabel}</div>}
                    <ul className={styles.tooltipCriteriaList}>
                        {names.map((name, i) => (
                            <li key={i}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )

    const card = (
        <div
            role="button"
            tabIndex={0}
            className={clsx(
                styles.root,
                variant === 'list' ? styles.rootList : styles.rootGrid,
                variant === 'grid' && styles.gridLayout,
                variant === 'list' && styles.listLayout,
                className
            )}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick?.()
                }
            }}
        >
            {onDelete && (
                <div className={styles.deleteWrap}>
                    <IconButton
                        variant="danger"
                        size="sm"
                        aria-label={deleteLabel}
                        onClick={e => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className={styles.deleteBtn}
                    >
                        <DeleteIcon />
                    </IconButton>
                </div>
            )}
            <div className={clsx(styles.body, variant === 'list' && styles.bodyList)}>
                <div className={clsx(styles.iconWrap, variant === 'list' && styles.iconWrapList)}>
                    {imageUrl ? (
                        <img src={imageUrl} alt="" className={styles.icon} />
                    ) : (
                        <div className={styles.iconPlaceholder}>
                            <StarIcon />
                        </div>
                    )}
                </div>
                <div className={styles.main}>
                    <div className={styles.topRow}>
                        <span className={clsx(styles.title, variant === 'list' && styles.titleList)}>{title}</span>
                        {variant === 'grid' && (
                            <span className={styles.pointsBadge}>
                                <StarIcon />
                                {points}
                                {pointsSuffix && ` ${pointsSuffix}`}
                            </span>
                        )}
                    </div>
                    {description && (
                        <div className={clsx(styles.description, variant === 'list' && styles.descriptionList)}>
                            {description}
                        </div>
                    )}
                    <div className={styles.footer}>
                        <span className={clsx(styles.difficultyBadge, difficultyClass)}>{diffNorm}</span>
                        {variant === 'list' && (
                            <span className={styles.pointsBadgeList}>
                                <StarIcon />
                                {points}
                                {pointsSuffix && ` ${pointsSuffix}`}
                            </span>
                        )}
                        {showProgress && progressTotal != null && (
                            <span className={styles.goal}>
                                {progressCompleted != null ? `${progressCompleted}/${progressTotal}` : progressTotal}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    if (hasTooltip) {
        return (
            <Tooltip
                content={tooltipContent}
                position="auto"
                delay={400}
                maxHeight={tooltipMaxHeight}
                maxWidth={tooltipMaxWidth}
                minWidth={tooltipMinWidth}
                minHeight={tooltipMinHeight}
                hoverable={tooltipHoverable}
            >
                {card}
            </Tooltip>
        )
    }

    return card
}
