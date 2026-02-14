import React, { CSSProperties, useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MetricsGranularity, MetricsStatsPoint } from '../types'
import styles from '../areaChartCard.module.scss'

export interface AreaChartCardProps {
    title: string
    points: MetricsStatsPoint[]
    granularity: MetricsGranularity
    locale: string
    emptyText: string
    tone?: 'cyan' | 'blue' | 'violet'
    dimmed?: boolean
}

const toneMap: Record<NonNullable<AreaChartCardProps['tone']>, string> = {
    cyan: 'hsl(175 88% 58%)',
    blue: 'hsl(212 92% 62%)',
    violet: 'hsl(262 90% 68%)',
}

interface TooltipPoint {
    ts: string
    value: number
}

interface TooltipPayloadItem {
    value?: number
    payload?: TooltipPoint
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
    formatDate: (value: string) => string
    formatNumber: (value: number) => string
}

function ChartTooltip({ active, payload, formatDate, formatNumber }: ChartTooltipProps) {
    if (!active || !payload?.length || !payload[0].payload) return null
    const point = payload[0].payload

    return (
        <div className={styles.chartTooltip}>
            <div className={styles.chartTooltipDate}>{formatDate(point.ts)}</div>
            <div className={styles.chartTooltipValue}>{formatNumber(point.value)}</div>
        </div>
    )
}

export function AreaChartCard({
    title,
    points,
    granularity,
    locale,
    emptyText,
    tone = 'cyan',
    dimmed = false,
}: AreaChartCardProps) {
    const hasData = points.length > 0
    const sourcePoints = hasData ? points : [{ ts: new Date().toISOString(), value: 0 }]
    const maxValue = Math.max(...sourcePoints.map(item => item.value), 1)
    const avgValue = sourcePoints.reduce((acc, item) => acc + item.value, 0) / sourcePoints.length
    const lastValue = sourcePoints[sourcePoints.length - 1]?.value ?? 0
    const yMax = maxValue <= 2 ? maxValue + 1 : Math.ceil(maxValue * 1.1)

    const id = useId()
    const gradientId = `${id.replace(/[:]/g, '')}-chart-area`
    const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

    const xAxisFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                day: '2-digit',
                month: 'short',
            }),
        [locale],
    )

    const tooltipFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                day: '2-digit',
                month: 'short',
                ...(granularity === 'hour'
                    ? {
                          hour: '2-digit',
                          minute: '2-digit',
                      }
                    : {}),
            }),
        [locale, granularity],
    )

    const sectionStyle = useMemo(
        () =>
            ({
                '--chart-accent': toneMap[tone],
            }) as CSSProperties,
        [tone],
    )

    return (
        <section
            className={`${styles.panel} ${styles.chartPanel} ${dimmed ? styles.panelDimmed : ''}`}
            style={sectionStyle}
        >
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>{title}</h3>
                <div className={styles.chartStats}>
                    <span>
                        MAX <b>{numberFormatter.format(maxValue)}</b>
                    </span>
                    <span>
                        AVG <b>{numberFormatter.format(Math.round(avgValue * 10) / 10)}</b>
                    </span>
                    <span>
                        LAST <b>{numberFormatter.format(lastValue)}</b>
                    </span>
                </div>
            </div>
            {!hasData && <div className={styles.empty}>{emptyText}</div>}
            <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={sourcePoints}
                        margin={{
                            top: 8,
                            right: 14,
                            left: -16,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity="0.03" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 6" className={styles.chartGrid} />
                        <XAxis
                            dataKey="ts"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={40}
                            interval="preserveStartEnd"
                            padding={{
                                left: 6,
                                right: 8,
                            }}
                            tickFormatter={value => xAxisFormatter.format(new Date(value))}
                            tick={{
                                fill: 'var(--ps-text-muted, var(--text-muted))',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        />
                        <YAxis
                            width={40}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            domain={[0, yMax]}
                            tickCount={4}
                            tick={{
                                fill: 'var(--ps-text-muted, var(--text-muted))',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        />
                        <Tooltip
                            cursor={{
                                stroke: 'var(--chart-accent)',
                                strokeOpacity: 0.25,
                            }}
                            content={
                                <ChartTooltip
                                    formatDate={value => tooltipFormatter.format(new Date(value))}
                                    formatNumber={value => numberFormatter.format(value)}
                                />
                            }
                        />
                        <Area
                            type="monotoneX"
                            dataKey="value"
                            stroke="var(--chart-accent)"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill={`url(#${gradientId})`}
                            dot={false}
                            isAnimationActive={false}
                            activeDot={{
                                r: 5,
                                fill: 'var(--chart-accent)',
                                stroke: 'var(--ps-surface-secondary, var(--surface-secondary))',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}
