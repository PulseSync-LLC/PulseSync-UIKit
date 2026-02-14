export type MetricsGranularity = 'day' | 'hour'

export interface MetricsStatsPoint {
    ts: string
    value: number
}

export interface MetricsBreakdownItem {
    key: string
    count: number
}

/** Key of the breakdown item currently hovered; used to highlight/dim across cards. */
export type MetricsHoveredKey = string | null
