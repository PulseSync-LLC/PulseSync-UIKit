import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { useBlueprintEditor } from './BlueprintEditorContext'
import type { AddonSettingsItemType } from './types'
import styles from './visual-blueprint-editor.module.scss'

export interface SectionNodeData {
    title: string
    itemsCount: number
    [key: string]: unknown
}

export interface SectionNodeProps {
    node?: never
    itemsCount?: never
}

const noDrag = (e: React.MouseEvent) => e.stopPropagation()

function SectionNodeInner({ id, data, selected }: NodeProps) {
    const d = data as unknown as SectionNodeData
    const {
        updateSectionTitle,
        addItemToSection,
        deleteNode,
        setContextMenu,
    } = useBlueprintEditor()

    const allTypes: { label: string; type: AddonSettingsItemType }[] = [
        { label: 'Text', type: 'text' },
        { label: 'Toggle', type: 'button' },
        { label: 'Slider', type: 'slider' },
        { label: 'File Picker', type: 'file_picker' },
        { label: 'Color Picker', type: 'color_picker' },
        { label: 'Select', type: 'select' },
    ]

    return (
        <div
            className={clsx(styles.ueNode, styles.ueSectionNode, selected && styles.ueNodeSelected)}
            onContextMenu={e => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    items: [
                        ...allTypes.map(t => ({
                            label: `Add ${t.label}`,
                            onClick: () => addItemToSection(id, t.type),
                        })),
                        { label: 'Delete section', onClick: () => deleteNode(id), danger: true },
                    ],
                })
            }}
        >
            <div className={styles.ueNodeHeader}>
                <div className={styles.ueNodeIcon}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="1" width="10" height="10" rx="2" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                    </svg>
                </div>
                <input
                    type="text"
                    className={styles.ueNodeTitleInput}
                    value={d.title}
                    onChange={e => updateSectionTitle(id, e.target.value)}
                    onClick={noDrag}
                    onMouseDown={noDrag}
                />
                <span className={styles.ueNodeBadge}>{d.itemsCount}</span>
            </div>
            <div className={styles.ueSectionBody} onMouseDown={noDrag}>
                <span>Items: {d.itemsCount}</span>
                <button
                    type="button"
                    className={styles.ueSectionAddBtn}
                    onClick={() => addItemToSection(id)}
                    onMouseDown={noDrag}
                >
                    + Add
                </button>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="exec-out"
                className={styles.pinExecOut}
            />
        </div>
    )
}

export const SectionNode = memo(SectionNodeInner)
