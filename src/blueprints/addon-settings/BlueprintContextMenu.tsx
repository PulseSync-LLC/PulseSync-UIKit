import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { ContextMenuItem } from './BlueprintEditorContext'
import styles from './visual-blueprint-editor.module.scss'

export interface BlueprintContextMenuProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
}

export function BlueprintContextMenu({ x, y, items, onClose }: BlueprintContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (ref.current?.contains(e.target as Node)) return
            onClose()
        }
        const onContextMenu = () => onClose()
        const t = requestAnimationFrame(() => {
            window.addEventListener('mousedown', onMouseDown, true)
            window.addEventListener('contextmenu', onContextMenu, true)
        })
        return () => {
            cancelAnimationFrame(t)
            window.removeEventListener('mousedown', onMouseDown, true)
            window.removeEventListener('contextmenu', onContextMenu, true)
        }
    }, [onClose])

    const menu = (
        <div
            ref={ref}
            className={styles.contextMenu}
            style={getMenuPosition(x, y)}
            onMouseDown={e => e.stopPropagation()}
        >
            {items.map((item, i) => (
                <button
                    key={i}
                    type="button"
                    className={clsx(
                        styles.contextMenuItem,
                        item.danger && styles.contextMenuDanger
                    )}
                    onClick={() => {
                        item.onClick()
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>
    )

    return createPortal(menu, document.body)
}

function getMenuPosition(x: number, y: number): React.CSSProperties {
    const pad = 8
    const menuW = 200
    const menuH = 300
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    let left = x + pad
    let top = y + pad
    if (left + menuW > vw) left = vw - menuW - pad
    if (top + menuH > vh) top = vh - menuH - pad
    if (left < pad) left = pad
    if (top < pad) top = pad
    return { position: 'fixed' as const, left, top }
}
