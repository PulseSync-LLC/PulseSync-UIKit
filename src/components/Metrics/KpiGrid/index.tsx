import React from 'react'
import styles from '../kpiGrid.module.scss'

export interface KpiGridValues {
    totalInstalls: number
    dau: number
    mau: number
}

export interface KpiGridLabels {
    totalInstalls: string
    dau: string
    mau: string
}

export interface KpiGridProps {
    values: KpiGridValues
    labels: KpiGridLabels
    formatNumber: (value: number) => string
}

export function KpiGrid({ values, labels, formatNumber }: KpiGridProps) {
    return (
        <div className={styles.kpiGrid}>
            <article className={styles.kpiCard}>
                <span className={styles.kpiValue}>{formatNumber(values.totalInstalls)}</span>
                <span className={styles.kpiLabel}>{labels.totalInstalls}</span>
            </article>
            <article className={styles.kpiCard}>
                <span className={styles.kpiValue}>{formatNumber(values.dau)}</span>
                <span className={styles.kpiLabel}>{labels.dau}</span>
            </article>
            <article className={styles.kpiCard}>
                <span className={styles.kpiValue}>{formatNumber(values.mau)}</span>
                <span className={styles.kpiLabel}>{labels.mau}</span>
            </article>
        </div>
    )
}
