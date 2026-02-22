import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { Toggle } from '../../components/Toggle'
import type {
    AddonSettingsSchema,
    AddonSettingsSection,
    AddonSettingsItem,
    AddonSettingsItemText,
    AddonSettingsItemButton,
    AddonSettingsItemSlider,
} from './types'
import { createEmptySection, createEmptyItem } from './createDefault'
import styles from './blueprint-editor.module.scss'

export interface AddonSettingsBlueprintEditorProps {
    /** Текущий блюпринт (структура handleEvents) */
    blueprint: AddonSettingsSchema
    /** Вызывается при любом изменении — создание/редактирование блюпринта */
    onChange: (blueprint: AddonSettingsSchema) => void
    /** Подписи кнопок (опционально) */
    labels?: {
        addSection?: string
        addItem?: string
        removeSection?: string
        removeItem?: string
        sectionTitle?: string
        itemType?: string
        itemId?: string
        itemName?: string
        itemDescription?: string
    }
    className?: string
}

const TYPE_OPTIONS = [
    { value: 'text', label: 'Текст (text)' },
    { value: 'button', label: 'Переключатель (button)' },
    { value: 'slider', label: 'Слайдер (slider)' },
]

function SectionEditor({
    section,
    sectionIndex,
    onUpdate,
    onRemove,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    labels,
}: {
    section: AddonSettingsSection
    sectionIndex: number
    onUpdate: (title: string) => void
    onRemove: () => void
    onAddItem: () => void
    onUpdateItem: (index: number, item: AddonSettingsItem) => void
    onRemoveItem: (index: number) => void
    labels?: AddonSettingsBlueprintEditorProps['labels']
}) {
    return (
        <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
                <Input
                    label={labels?.sectionTitle ?? 'Название секции'}
                    value={section.title}
                    onChange={e => onUpdate(e.target.value)}
                    placeholder="Важно! / Плейлисты / …"
                    size="sm"
                    wrapperClassName={styles.sectionTitleInput}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className={styles.removeSectionBtn}
                >
                    {labels?.removeSection ?? 'Удалить секцию'}
                </Button>
            </div>
            <div className={styles.itemsList}>
                {section.items.map((item, itemIndex) => (
                    <ItemEditor
                        key={item.id}
                        item={item}
                        itemIndex={itemIndex}
                        onUpdate={next => onUpdateItem(itemIndex, next)}
                        onRemove={() => onRemoveItem(itemIndex)}
                        labels={labels}
                    />
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddItem}
                    className={styles.addItemBtn}
                >
                    + {labels?.addItem ?? 'Добавить элемент'}
                </Button>
            </div>
        </div>
    )
}

function ItemEditor({
    item,
    itemIndex,
    onUpdate,
    onRemove,
    labels,
}: {
    item: AddonSettingsItem
    itemIndex: number
    onUpdate: (item: AddonSettingsItem) => void
    onRemove: () => void
    labels?: AddonSettingsBlueprintEditorProps['labels']
}) {
    const updateBase = useCallback(
        (patch: Partial<AddonSettingsItem>) => {
            onUpdate({ ...item, ...patch } as AddonSettingsItem)
        },
        [item, onUpdate]
    )

    const setType = useCallback(
        (type: AddonSettingsItem['type']) => {
            if (item.type === type) return
            onUpdate(createEmptyItem(type, item.id) as AddonSettingsItem)
        },
        [item.id, item.type, onUpdate]
    )

    return (
        <div className={styles.itemBlock}>
            <div className={styles.itemRow}>
                <Select
                    label={labels?.itemType ?? 'Тип'}
                    value={item.type}
                    options={TYPE_OPTIONS}
                    onChange={v => setType(v as AddonSettingsItem['type'])}
                    className={styles.itemTypeSelect}
                />
                <Input
                    label={labels?.itemId ?? 'ID'}
                    value={item.id}
                    onChange={e => updateBase({ id: e.target.value })}
                    placeholder="playlist_index"
                    size="sm"
                    wrapperClassName={styles.itemIdInput}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className={styles.removeItemBtn}
                >
                    {labels?.removeItem ?? 'Удалить'}
                </Button>
            </div>
            <Input
                label={labels?.itemName ?? 'Название'}
                value={item.name}
                onChange={e => updateBase({ name: e.target.value })}
                placeholder="Порядковый номер треков"
                size="sm"
                wrapperClassName={styles.itemField}
            />
            <div className={styles.textareaRow}>
                <label className={styles.textareaLabel}>
                    {labels?.itemDescription ?? 'Описание'}
                </label>
                <textarea
                    className={styles.textarea}
                    value={item.description ?? ''}
                    onChange={e => updateBase({ description: e.target.value })}
                    placeholder="Показывать порядковый номер…"
                    rows={2}
                />
            </div>
            {item.type === 'button' && (
                <div className={styles.itemField}>
                    <Toggle
                        label="По умолчанию включено"
                        checked={(item as AddonSettingsItemButton).defaultParameter ?? true}
                        onChange={v =>
                            onUpdate({
                                ...item,
                                defaultParameter: v,
                            } as AddonSettingsItemButton)
                        }
                    />
                </div>
            )}
            {item.type === 'slider' && (
                <div className={styles.sliderFields}>
                    <Input
                        label="min"
                        type="number"
                        value={String((item as AddonSettingsItemSlider).min ?? 0)}
                        onChange={e =>
                            onUpdate({
                                ...item,
                                min: Number((e.target as HTMLInputElement).value) || 0,
                            } as AddonSettingsItemSlider)
                        }
                        wrapperClassName={styles.smallNum}
                    />
                    <Input
                        label="max"
                        type="number"
                        value={String((item as AddonSettingsItemSlider).max ?? 100)}
                        onChange={e =>
                            onUpdate({
                                ...item,
                                max: Number((e.target as HTMLInputElement).value) || 100,
                            } as AddonSettingsItemSlider)
                        }
                        wrapperClassName={styles.smallNum}
                    />
                    <Input
                        label="step"
                        type="number"
                        value={String((item as AddonSettingsItemSlider).step ?? 1)}
                        onChange={e =>
                            onUpdate({
                                ...item,
                                step: Number((e.target as HTMLInputElement).value) || 1,
                            } as AddonSettingsItemSlider)
                        }
                        wrapperClassName={styles.smallNum}
                    />
                    <Input
                        label="defaultParameter"
                        type="number"
                        value={String((item as AddonSettingsItemSlider).defaultParameter ?? 0)}
                        onChange={e =>
                            onUpdate({
                                ...item,
                                defaultParameter: Number((e.target as HTMLInputElement).value) || 0,
                            } as AddonSettingsItemSlider)
                        }
                        wrapperClassName={styles.smallNum}
                    />
                </div>
            )}
        </div>
    )
}

export function AddonSettingsBlueprintEditor({
    blueprint,
    onChange,
    labels,
    className,
}: AddonSettingsBlueprintEditorProps) {
    const updateSection = useCallback(
        (index: number, patch: Partial<AddonSettingsSection> | ((prev: AddonSettingsSection) => AddonSettingsSection)) => {
            const next = { ...blueprint }
            next.sections = [...next.sections]
            const prev = next.sections[index]!
            next.sections[index] =
                typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
            onChange(next)
        },
        [blueprint, onChange]
    )

    const removeSection = useCallback(
        (index: number) => {
            const next = {
                ...blueprint,
                sections: blueprint.sections.filter((_, i) => i !== index),
            }
            if (next.sections.length === 0) next.sections = [createEmptySection()]
            onChange(next)
        },
        [blueprint, onChange]
    )

    const addSection = useCallback(() => {
        onChange({
            ...blueprint,
            sections: [...blueprint.sections, createEmptySection()],
        })
    }, [blueprint, onChange])

    const addItem = useCallback(
        (sectionIndex: number) => {
            updateSection(sectionIndex, sec => ({
                ...sec,
                items: [...sec.items, createEmptyItem('button')],
            }))
        },
        [updateSection]
    )

    const updateItem = useCallback(
        (sectionIndex: number, itemIndex: number, item: AddonSettingsItem) => {
            updateSection(sectionIndex, sec => ({
                ...sec,
                items: sec.items.map((it, i) => (i === itemIndex ? item : it)),
            }))
        },
        [updateSection]
    )

    const removeItem = useCallback(
        (sectionIndex: number, itemIndex: number) => {
            updateSection(sectionIndex, sec => ({
                ...sec,
                items: sec.items.filter((_, i) => i !== itemIndex),
            }))
        },
        [updateSection]
    )

    return (
        <div className={clsx(styles.wrapper, className)}>
            {blueprint.sections.map((section, idx) => (
                <SectionEditor
                    key={idx}
                    section={section}
                    sectionIndex={idx}
                    onUpdate={title => updateSection(idx, { title })}
                    onRemove={() => removeSection(idx)}
                    onAddItem={() => addItem(idx)}
                    onUpdateItem={(itemIdx, item) => updateItem(idx, itemIdx, item)}
                    onRemoveItem={itemIdx => removeItem(idx, itemIdx)}
                    labels={labels}
                />
            ))}
            <Button variant="outline" size="sm" onClick={addSection} className={styles.addSectionBtn}>
                + {labels?.addSection ?? 'Добавить секцию'}
            </Button>
        </div>
    )
}
