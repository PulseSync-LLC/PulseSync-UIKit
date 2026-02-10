import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Tooltip } from '../Tooltip'
import styles from './colorPicker.module.scss'

/* ── Types ── */

type HSVA = { h: number; s: number; v: number; a: number }

export interface ColorPickerProps {
    /** Current hex color (e.g. "#FF00CC" or "#FF00CCFF" with alpha) */
    value: string
    /** Called with new hex value */
    onChange?: (hex: string) => void
    /** Default value — shows reset link when value differs */
    defaultValue?: string
    /** Label */
    label?: string
    /** Description tooltip */
    description?: string
    /** Enable alpha channel */
    withAlpha?: boolean
    /** Disable interaction */
    disabled?: boolean
    /** Custom reset text */
    resetText?: string
    /** Additional className */
    className?: string
}

/* ── Color math ── */

const cl = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

const hexToRgba = (hex: string) => {
    const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec((hex || '').trim())
    if (!m) return { r: 255, g: 255, b: 255, a: 1 }
    const i = parseInt(m[1], 16)
    return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255, a: m[2] ? parseInt(m[2], 16) / 255 : 1 }
}

const rgbaToHex = (r: number, g: number, b: number, a = 1, withA = true) => {
    const h = (v: number) => v.toString(16).padStart(2, '0').toUpperCase()
    return `#${h(r)}${h(g)}${h(b)}${withA ? h(Math.round(cl(a, 0, 1) * 255)) : ''}`
}

const rgb2hsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    let h = 0
    if (d) {
        if (mx === r) h = ((g - b) / d) % 6
        else if (mx === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60; if (h < 0) h += 360
    }
    return { h, s: mx === 0 ? 0 : d / mx, v: mx }
}

const hsv2rgb = (h: number, s: number, v: number) => {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x }
    else if (h < 120) { r = x; g = c }
    else if (h < 180) { g = c; b = x }
    else if (h < 240) { g = x; b = c }
    else if (h < 300) { r = x; b = c }
    else { r = c; b = x }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

const hsva2hex = (hs: HSVA, withA = true) => {
    const { r, g, b } = hsv2rgb(hs.h, hs.s, hs.v)
    return rgbaToHex(r, g, b, hs.a, withA)
}

const normHex = (hex: string) => (hex || '').trim().toUpperCase().replace(/^(?!#)/, '#')

/* ── Component ── */

export function ColorPicker({
    value,
    onChange,
    defaultValue,
    label,
    description,
    withAlpha = true,
    disabled = false,
    resetText = 'Reset',
    className,
}: ColorPickerProps) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const wrapRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const svRef = useRef<HTMLDivElement>(null)
    const svDrag = useRef(false)

    useEffect(() => setMounted(true), [])

    const [hsva, setHsva] = useState<HSVA>(() => {
        const { r, g, b, a } = hexToRgba(value)
        const { h, s, v } = rgb2hsv(r, g, b)
        return { h, s, v, a }
    })
    const [hexText, setHexText] = useState(value || '#FFFFFF')

    const canReset = defaultValue !== undefined && normHex(value) !== normHex(defaultValue)

    /* sync external value */
    useEffect(() => {
        const norm = (value || '#FFFFFF').trim().toUpperCase()
        const cur = hsva2hex(hsva, withAlpha).toUpperCase()
        if (norm !== cur) {
            const { r, g, b, a } = hexToRgba(value)
            const { h, s, v } = rgb2hsv(r, g, b)
            setHsva({ h, s, v, a })
            setHexText(norm)
        }
    }, [value, withAlpha])

    const updatePanelPosition = useCallback(() => {
        const el = triggerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setPanelStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            zIndex: 10050,
        })
    }, [])

    useEffect(() => {
        if (!open) return
        updatePanelPosition()
        window.addEventListener('scroll', updatePanelPosition, true)
        window.addEventListener('resize', updatePanelPosition)
        return () => {
            window.removeEventListener('scroll', updatePanelPosition, true)
            window.removeEventListener('resize', updatePanelPosition)
        }
    }, [open, updatePanelPosition])

    /* close on outside click — panel may be in portal so check both */
    useEffect(() => {
        const h = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const emit = useCallback((hs: HSVA) => {
        const hex = hsva2hex(hs, withAlpha)
        setHsva(hs)
        setHexText(hex.toUpperCase())
        onChange?.(hex)
    }, [onChange, withAlpha])

    /* SV panel drag */
    const onSV = (e: React.MouseEvent) => {
        if (!svRef.current) return
        const rect = svRef.current.getBoundingClientRect()
        const s = cl((e.clientX - rect.left) / rect.width, 0, 1)
        const v = 1 - cl((e.clientY - rect.top) / rect.height, 0, 1)
        emit({ ...hsva, s, v })
    }

    const { r, g, b } = hsv2rgb(hsva.h, hsva.s, hsva.v)
    const preview = `rgba(${r},${g},${b},${hsva.a})`
    const hex = hsva2hex(hsva, withAlpha).toUpperCase()

    const applyHexText = () => {
        const m = /^#?([0-9a-f]{3,8})$/i.exec(hexText.trim())
        if (m) {
            let full = m[1]
            if (full.length === 3) full = full[0]+full[0]+full[1]+full[1]+full[2]+full[2]
            if (full.length === 6 || full.length === 8) {
                const { r, g, b, a } = hexToRgba('#' + full)
                const { h, s, v } = rgb2hsv(r, g, b)
                emit({ h, s, v, a: withAlpha ? a : 1 })
                return
            }
        }
        setHexText(hex)
    }

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (defaultValue) onChange?.(defaultValue)
    }

    /* clicking wrapper opens picker */
    const handleWrapperClick = () => {
        if (disabled || open) return
        setOpen(true)
    }

    return (
        <div ref={wrapRef} className={clsx(styles.wrapper, disabled && styles.disabled, className)} onClick={handleWrapperClick}>
            {(label || canReset) && (
                <div className={styles.labelRow}>
                    {label && (
                        <div className={styles.label}>
                            {label}
                            {description && (
                                <Tooltip content={description} position="right">
                                    <span className={styles.descDot}>?</span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {canReset && (
                        <button type="button" className={styles.resetBtn} onClick={handleReset}>
                            {resetText}
                        </button>
                    )}
                </div>
            )}

            <button ref={triggerRef} type="button" className={styles.trigger} onClick={e => { e.stopPropagation(); setOpen(v => !v) }}>
                <span className={styles.swatch} style={{ background: preview }} />
                <span className={styles.hexLabel}>{hex}</span>
            </button>

            {mounted && open && createPortal(
                <div ref={panelRef} className={styles.panel} style={panelStyle} onClick={e => e.stopPropagation()}>
                    {/* SV area */}
                    <div
                        ref={svRef}
                        className={styles.sv}
                        style={{ backgroundColor: `hsl(${hsva.h} 100% 50%)` }}
                        onMouseDown={e => { svDrag.current = true; onSV(e) }}
                        onMouseMove={e => { if (svDrag.current) onSV(e) }}
                        onMouseUp={() => { svDrag.current = false }}
                        onMouseLeave={() => { svDrag.current = false }}
                    >
                        <div className={styles.svKnob} style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }} />
                    </div>

                    {/* Hue slider */}
                    <input
                        type="range" min={0} max={360} value={Math.round(hsva.h)}
                        className={styles.hueSlider}
                        onChange={e => emit({ ...hsva, h: Number(e.target.value) })}
                    />

                    {/* Alpha slider */}
                    {withAlpha && (
                        <div className={styles.alphaRow}>
                            <div className={styles.alphaChecker} />
                            <input
                                type="range" min={0} max={100} value={Math.round(hsva.a * 100)}
                                className={styles.alphaSlider}
                                style={{ background: `linear-gradient(90deg, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))` }}
                                onChange={e => emit({ ...hsva, a: Number(e.target.value) / 100 })}
                            />
                        </div>
                    )}

                    {/* Hex input + opacity */}
                    <div className={styles.inputs}>
                        <input
                            className={styles.hexInput}
                            value={hexText}
                            onChange={e => setHexText(e.target.value)}
                            onBlur={applyHexText}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        />
                        {withAlpha && (
                            <div className={styles.opacityBox}>
                                <input
                                    className={styles.opacityInput}
                                    value={Math.round(hsva.a * 100)}
                                    onChange={e => {
                                        const n = cl(parseInt(e.target.value || '0', 10), 0, 100)
                                        emit({ ...hsva, a: n / 100 })
                                    }}
                                />
                                <span className={styles.opacitySuffix}>%</span>
                            </div>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}
