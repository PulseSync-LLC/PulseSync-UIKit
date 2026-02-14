import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { MetricsBreakdownItem, MetricsHoveredKey } from '../types'
import styles from '../breakdownCard.module.scss'

export type BreakdownCardMode = 'bar' | 'donut'
export type BreakdownCardTone = 'cyan' | 'blue' | 'violet' | 'neutral'

export interface BreakdownCardLabels {
    total: string
    share: string
    count: string
    other: string
}

export interface BreakdownCardProps {
    title: string
    items: MetricsBreakdownItem[]
    emptyText: string
    mode?: BreakdownCardMode
    tone?: BreakdownCardTone
    showBars?: boolean
    locale?: string
    labels: BreakdownCardLabels
    hoveredKey?: MetricsHoveredKey
    onHoverKeyChange?: (key: string | null) => void
}

const DONUT_PALETTES: Record<BreakdownCardTone, string[]> = {
    cyan: ['#2ed7cf', '#53e8e0', '#6cf0e8', '#89f4ee', '#a8f9f4', '#c9fbf8'],
    blue: ['#4b8dff', '#6ea7ff', '#8bb8ff', '#a5c8ff', '#bfd8ff', '#d7e7ff'],
    violet: ['#9e6fff', '#b185ff', '#c29bff', '#d1b2ff', '#dfc9ff', '#eddfff'],
    neutral: ['#9aa5b1', '#acb5c0', '#bec6ce', '#d1d7de', '#e3e7ec', '#f0f3f6'],
}

const DONUT_ACCENT: Record<BreakdownCardTone, string> = {
    cyan: 'hsl(175 88% 58%)',
    blue: 'hsl(212 92% 62%)',
    violet: 'hsl(262 90% 68%)',
    neutral: 'hsl(210 15% 62%)',
}

export function BreakdownCard({
    title,
    items,
    emptyText,
    mode = 'bar',
    tone = 'neutral',
    showBars = false,
    locale = 'en',
    labels,
    hoveredKey = null,
    onHoverKeyChange,
}: BreakdownCardProps) {
    const topItems = items.slice(0, 8)
    const totalCount = Math.max(
        topItems.reduce((acc, item) => acc + item.count, 0),
        1,
    )
    const compactFormatter = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    })

    const donutBase = topItems.slice(0, 5)
    const otherCount = topItems.slice(5).reduce((acc, item) => acc + item.count, 0)
    const donutItems =
        mode === 'donut' && otherCount > 0
            ? [
                  ...donutBase,
                  {
                      key: labels.other,
                      count: otherCount,
                  },
              ]
            : mode === 'donut'
              ? donutBase
              : topItems
    const palette = DONUT_PALETTES[tone]
    const shouldRenderBars = mode === 'bar' || showBars

    return (
        <section
            className={`${styles.panel} ${mode === 'donut' ? styles.donutPanel : ''}`}
            style={
                {
                    '--donut-accent': DONUT_ACCENT[tone],
                } as React.CSSProperties
            }
        >
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>{title}</h3>
            </div>
            {topItems.length === 0 && <div className={styles.empty}>{emptyText}</div>}
            {topItems.length > 0 && (
                <>
                    {mode === 'donut' && (
                        <div className={styles.donutLayout}>
                            <div className={styles.donutWrap} style={{ cursor: 'pointer' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    key: 'track',
                                                    count: 1,
                                                },
                                            ]}
                                            dataKey="count"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={54}
                                            outerRadius={86}
                                            stroke="transparent"
                                            isAnimationActive={false}
                                            fill="var(--ps-surface-tertiary, var(--surface-tertiary))"
                                        />
                                        <Pie
                                            data={donutItems}
                                            dataKey="count"
                                            nameKey="key"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={82}
                                            stroke="transparent"
                                            paddingAngle={2}
                                            startAngle={90}
                                            endAngle={-270}
                                            cornerRadius={4}
                                            isAnimationActive={false}
                                            onMouseEnter={(_: unknown, index: number) => {
                                                const item = donutItems[index]
                                                if (item) onHoverKeyChange?.(item.key)
                                            }}
                                            onMouseLeave={() => onHoverKeyChange?.(null)}
                                        >
                                            {donutItems.map((entry, index) => {
                                                const isHighlighted = hoveredKey === null || entry.key === hoveredKey
                                                const isDimmed = hoveredKey !== null && entry.key !== hoveredKey
                                                return (
                                                    <Cell
                                                        key={`${entry.key}-${index}`}
                                                        fill={palette[index % palette.length]}
                                                        opacity={isDimmed ? 0.25 : 1}
                                                        style={{
                                                            filter: isHighlighted && hoveredKey === entry.key ? 'brightness(1.15)' : undefined,
                                                            cursor: 'pointer',
                                                        }}
                                                    />
                                                )
                                            })}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.donutCenter}>
                                    <span>{labels.total}</span>
                                    <strong title={`${totalCount}`}>{compactFormatter.format(totalCount)}</strong>
                                </div>
                            </div>

                            <div className={styles.donutLegend}>
                                {!showBars && <div className={styles.breakdownCaption}>{labels.share}</div>}
                                {donutItems.map((item, index) => {
                                    const percent = (item.count / totalCount) * 100
                                    const isOtherHover = hoveredKey === labels.other
                                    const isHighlighted =
                                        hoveredKey === null || item.key === hoveredKey || (isOtherHover && item.key === labels.other)
                                    const isDimmed = hoveredKey !== null && !isHighlighted
                                    return (
                                        <div
                                            key={item.key}
                                            className={`${styles.donutLegendItem} ${isHighlighted && hoveredKey === item.key ? styles.itemHighlighted : ''} ${isDimmed ? styles.itemDimmed : ''}`}
                                            onMouseEnter={() => onHoverKeyChange?.(item.key)}
                                            onMouseLeave={() => onHoverKeyChange?.(null)}
                                        >
                                            <span
                                                className={styles.donutDot}
                                                style={{
                                                    background: palette[index % palette.length],
                                                }}
                                            />
                                            <span className={styles.donutName} title={item.key}>
                                                {item.key}
                                            </span>
                                            <span className={styles.donutValues} title={labels.count}>
                                                {compactFormatter.format(item.count)}
                                                <span>{Math.round(percent)}%</span>
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {shouldRenderBars && (
                        <>
                            <div className={styles.breakdownSubsection}>
                                <div className={styles.breakdownCaption}>{labels.share}</div>
                            </div>
                            <div className={styles.breakdownList}>
                                {topItems.map((item, index) => {
                                    const percent = (item.count / totalCount) * 100
                                    const isOtherHover = hoveredKey === labels.other
                                    const isInOtherBucket = index >= 5
                                    const isHighlighted =
                                        hoveredKey === null ||
                                        item.key === hoveredKey ||
                                        (isOtherHover && isInOtherBucket)
                                    const isDimmed = hoveredKey !== null && !isHighlighted
                                    return (
                                        <div
                                            key={item.key}
                                            className={`${styles.breakdownItem} ${isHighlighted && hoveredKey === item.key ? styles.itemHighlighted : ''} ${isDimmed ? styles.itemDimmed : ''}`}
                                            onMouseEnter={() => onHoverKeyChange?.(item.key)}
                                            onMouseLeave={() => onHoverKeyChange?.(null)}
                                        >
                                            <span className={styles.breakdownLabel} title={item.key}>
                                                {item.key}
                                            </span>
                                            <div className={styles.breakdownBarTrack}>
                                                <span
                                                    className={styles.breakdownBar}
                                                    style={{
                                                        width: `${Math.min(Math.max(percent, 2), 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className={styles.breakdownCount} title={labels.count}>
                                                {item.count}
                                                <span className={styles.breakdownPercent}>{Math.round(percent)}%</span>
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    )
}
