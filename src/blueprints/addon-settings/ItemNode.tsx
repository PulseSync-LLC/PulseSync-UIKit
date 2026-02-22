import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { Select } from '../../components/Select'
import { useBlueprintEditor } from './BlueprintEditorContext'
import { createEmptyItem } from './createDefault'
import type {
    AddonSettingsItem,
    AddonSettingsItemType,
    AddonSettingsItemButton,
    AddonSettingsItemSlider,
    AddonSettingsItemFilePicker,
    AddonSettingsItemColorPicker,
    AddonSettingsItemSelect,
    AddonSettingsSelectOption,
} from './types'
import { TYPE_OPTIONS } from './constants'
import type { BlueprintItemNode as BIN } from './blueprint-graph'
import styles from './visual-blueprint-editor.module.scss'

export interface ItemNodeData {
    sectionId: string
    item: AddonSettingsItem
    [key: string]: unknown
}

export interface ItemNodeProps {
    node?: never
}

const noDrag = (e: React.MouseEvent | React.FocusEvent) => e.stopPropagation()

export const TYPE_COLOR: Record<string, string> = {
    text: '#66e3ff',
    button: '#4caf50',
    slider: '#ff9800',
    file_picker: '#ab47bc',
    color_picker: '#e91e63',
    select: '#42a5f5',
}

function ItemNodeInner({ id, data, selected }: NodeProps) {
    const d = data as unknown as ItemNodeData
    const item = d.item
    const {
        updateItem,
        deleteNode,
        duplicateItem,
        detachItem,
        setContextMenu,
        graph,
    } = useBlueprintEditor()

    const itemN = graph.nodes.find(n => n.id === id && n.type === 'item') as BIN | undefined

    const headerColor = TYPE_COLOR[item.type] ?? 'var(--ps-accent, #66e3ff)'

    return (
        <div
            className={clsx(styles.ueNode, styles.ueItemNode, selected && styles.ueNodeSelected)}
            onContextMenu={e => {
                e.preventDefault()
                e.stopPropagation()
                const menuItems: { label: string; onClick: () => void; danger?: boolean }[] = []
                if (itemN) {
                    menuItems.push({ label: 'Duplicate', onClick: () => duplicateItem(itemN) })
                    if (itemN.sectionId) {
                        menuItems.push({ label: 'Detach from section', onClick: () => detachItem(itemN) })
                    }
                }
                menuItems.push({ label: 'Delete', onClick: () => deleteNode(id), danger: true })
                setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems })
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="exec-in"
                className={styles.pinExecIn}
            />
            <div className={styles.ueNodeHeader} style={{ background: headerColor }}>
                <span className={styles.typeDot} style={{ background: headerColor }} />
                <Select
                    value={item.type}
                    options={TYPE_OPTIONS}
                    onChange={v => {
                        const next = createEmptyItem(v as AddonSettingsItemType, item.id) as AddonSettingsItem
                        updateItem(id, { ...next, name: item.name, description: item.description })
                    }}
                    className={styles.typeSelect}
                />
                <span className={styles.ueNodeTitle}>
                    {item.name || item.id || '—'}
                </span>
                {item.order != null && (
                    <span className={styles.ueNodeBadge}>#{item.order}</span>
                )}
            </div>
            <div className={styles.ueItemBody} onMouseDown={noDrag} onFocus={noDrag as any}>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>ID</span>
                    <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="item_id"
                        value={item.id}
                        onChange={e => updateItem(id, { ...item, id: e.target.value })}
                    />
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Name</span>
                    <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="Display name"
                        value={item.name}
                        onChange={e => updateItem(id, { ...item, name: e.target.value })}
                    />
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Order</span>
                    <input
                        type="number"
                        className={styles.fieldInputNum}
                        placeholder="0"
                        value={item.order ?? 0}
                        onChange={e => updateItem(id, { ...item, order: Number(e.target.value) || 0 })}
                    />
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Desc</span>
                    <textarea
                        className={styles.fieldTextarea}
                        placeholder="Description"
                        value={item.description ?? ''}
                        onChange={e => updateItem(id, { ...item, description: e.target.value })}
                        rows={2}
                    />
                </div>

                {item.type === 'button' && (
                    <label className={styles.fieldCheck}>
                        <input
                            type="checkbox"
                            checked={(item as AddonSettingsItemButton).defaultParameter ?? true}
                            onChange={e => updateItem(id, { ...item, defaultParameter: e.target.checked } as AddonSettingsItemButton)}
                        />
                        Default enabled
                    </label>
                )}

                {item.type === 'slider' && (
                    <div className={styles.sliderFields}>
                        {(['min', 'max', 'step', 'defaultParameter'] as const).map(key => (
                            <div key={key} className={styles.fieldRow}>
                                <span className={styles.fieldLabelSm}>{key === 'defaultParameter' ? 'def' : key}</span>
                                <input
                                    type="number"
                                    className={styles.fieldInputNum}
                                    value={(item as AddonSettingsItemSlider)[key] ?? 0}
                                    onChange={e => updateItem(id, { ...item, [key]: Number(e.target.value) || 0 } as AddonSettingsItemSlider)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {item.type === 'file_picker' && (
                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>Accept</span>
                        <input
                            type="text"
                            className={styles.fieldInput}
                            placeholder="*.png, *.jpg"
                            value={(item as AddonSettingsItemFilePicker).accept ?? '*'}
                            onChange={e => updateItem(id, { ...item, accept: e.target.value } as AddonSettingsItemFilePicker)}
                        />
                    </div>
                )}

                {item.type === 'color_picker' && (
                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>Default</span>
                        <input
                            type="color"
                            className={styles.fieldColorInput}
                            value={(item as AddonSettingsItemColorPicker).defaultParameter ?? '#ffffff'}
                            onChange={e => updateItem(id, { ...item, defaultParameter: e.target.value } as AddonSettingsItemColorPicker)}
                        />
                        <input
                            type="text"
                            className={styles.fieldInput}
                            value={(item as AddonSettingsItemColorPicker).defaultParameter ?? '#ffffff'}
                            onChange={e => updateItem(id, { ...item, defaultParameter: e.target.value } as AddonSettingsItemColorPicker)}
                        />
                    </div>
                )}

                {item.type === 'select' && (
                    <SelectOptionsEditor
                        options={(item as AddonSettingsItemSelect).options ?? []}
                        defaultValue={(item as AddonSettingsItemSelect).defaultParameter ?? ''}
                        onChange={(opts, def) => updateItem(id, { ...item, options: opts, defaultParameter: def } as AddonSettingsItemSelect)}
                    />
                )}
            </div>
        </div>
    )
}

function SelectOptionsEditor({
    options,
    defaultValue,
    onChange,
}: {
    options: AddonSettingsSelectOption[]
    defaultValue: string
    onChange: (opts: AddonSettingsSelectOption[], def: string) => void
}) {
    const updateOpt = (i: number, patch: Partial<AddonSettingsSelectOption>) => {
        const next = options.map((o, idx) => idx === i ? { ...o, ...patch } : o)
        onChange(next, defaultValue)
    }
    const removeOpt = (i: number) => {
        const next = options.filter((_, idx) => idx !== i)
        const def = next.some(o => o.value === defaultValue) ? defaultValue : (next[0]?.value ?? '')
        onChange(next, def)
    }
    const addOpt = () => {
        const val = `option_${options.length + 1}`
        onChange([...options, { value: val, label: `Option ${options.length + 1}` }], defaultValue || val)
    }

    return (
        <div className={styles.selectOptsWrap}>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Default</span>
                <input
                    type="text"
                    className={styles.fieldInput}
                    value={defaultValue}
                    onChange={e => onChange(options, e.target.value)}
                    placeholder="default value"
                />
            </div>
            {options.map((opt, i) => (
                <div key={i} className={styles.selectOptRow}>
                    <input
                        type="text"
                        className={styles.fieldInput}
                        value={opt.value}
                        onChange={e => updateOpt(i, { value: e.target.value })}
                        placeholder="value"
                    />
                    <input
                        type="text"
                        className={styles.fieldInput}
                        value={opt.label}
                        onChange={e => updateOpt(i, { label: e.target.value })}
                        placeholder="label"
                    />
                    <button type="button" className={styles.optRemoveBtn} onClick={() => removeOpt(i)}>×</button>
                </div>
            ))}
            <button type="button" className={styles.optAddBtn} onClick={addOpt}>+ Option</button>
        </div>
    )
}

export const ItemNode = memo(ItemNodeInner)
