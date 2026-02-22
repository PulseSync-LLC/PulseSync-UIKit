import React, { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Accordion } from '../../components/Accordion'
import type { AccordionItem } from '../../components/Accordion'
import { Toggle } from '../../components/Toggle'
import { Slider } from '../../components/Slider'
import { Select } from '../../components/Select'
import { ColorPicker } from '../../components/ColorPicker'
import { FilePicker } from '../../components/FilePicker'
import { TitleText } from '../../components/TitleText'
import type {
    AddonSettingsSchema,
    AddonSettingsValues,
    AddonSettingsItem,
    AddonSettingsItemButton,
    AddonSettingsItemSlider,
    AddonSettingsItemFilePicker,
    AddonSettingsItemColorPicker,
    AddonSettingsItemSelect,
} from './types'
import styles from './addon-settings-accordion.module.scss'

export interface AddonSettingsAccordionProps {
    schema: AddonSettingsSchema
    values?: AddonSettingsValues
    onChange?: (values: AddonSettingsValues) => void
    defaultOpenKeys?: string[]
    multiple?: boolean
    numbered?: boolean
    className?: string
}

function getDefaultValue(item: AddonSettingsItem): boolean | number | string | undefined {
    if (item.type === 'text') {
        const btn = item.buttons?.[0]
        return btn?.defaultParameter ?? btn?.text ?? ''
    }
    if (item.type === 'button') {
        return (item as AddonSettingsItemButton).defaultParameter ?? true
    }
    if (item.type === 'slider') {
        const s = item as AddonSettingsItemSlider
        return s.defaultParameter ?? s.value ?? s.min ?? 0
    }
    if (item.type === 'color_picker') {
        return (item as AddonSettingsItemColorPicker).defaultParameter ?? '#ffffff'
    }
    if (item.type === 'select') {
        return (item as AddonSettingsItemSelect).defaultParameter ?? ''
    }
    if (item.type === 'file_picker') {
        return ''
    }
    return undefined
}

function SettingRow({
    item,
    value,
    onChange,
}: {
    item: AddonSettingsItem
    value: boolean | number | string | undefined
    onChange: (id: string, v: boolean | number | string) => void
}) {
    if (item.type === 'text') {
        const firstBtn = item.buttons?.[0]
        const textValue = typeof value === 'string'
            ? value
            : (firstBtn?.defaultParameter ?? firstBtn?.text ?? '')
        const defaultText = firstBtn?.defaultParameter ?? firstBtn?.text
        return (
            <div className={styles.row}>
                <TitleText
                    label={item.name}
                    description={item.description}
                    value={textValue}
                    defaultValue={defaultText}
                    placeholder="Введите текст…"
                    onChange={v => onChange(item.id, v)}
                />
            </div>
        )
    }

    if (item.type === 'button') {
        const bool = typeof value === 'boolean' ? value : (item as AddonSettingsItemButton).defaultParameter ?? true
        return (
            <div className={styles.row}>
                <Toggle
                    label={item.name}
                    description={item.description}
                    checked={bool}
                    defaultChecked={(item as AddonSettingsItemButton).defaultParameter}
                    onChange={v => onChange(item.id, v)}
                    enabledText="Включено"
                    disabledText="Выключено"
                />
            </div>
        )
    }

    if (item.type === 'slider') {
        const s = item as AddonSettingsItemSlider
        const min = s.min ?? 0
        const max = s.max ?? 100
        const step = s.step ?? 1
        const num = typeof value === 'number' ? value : (s.defaultParameter ?? s.value ?? min)
        return (
            <div className={styles.row}>
                <Slider
                    label={item.name}
                    description={item.description}
                    min={min}
                    max={max}
                    step={step}
                    value={num}
                    defaultValue={s.defaultParameter}
                    onChange={v => onChange(item.id, v)}
                />
            </div>
        )
    }

    if (item.type === 'file_picker') {
        const fp = item as AddonSettingsItemFilePicker
        const fileName = typeof value === 'string' ? value : ''
        return (
            <div className={styles.row}>
                <FilePicker
                    label={item.name}
                    description={item.description}
                    value={fileName}
                    accept={fp.accept ?? '*'}
                    placeholder="Выберите файл…"
                    onChange={(name) => onChange(item.id, name)}
                />
            </div>
        )
    }

    if (item.type === 'color_picker') {
        const cp = item as AddonSettingsItemColorPicker
        const color = typeof value === 'string' ? value : (cp.defaultParameter ?? '#ffffff')
        return (
            <div className={styles.row}>
                <ColorPicker
                    label={item.name}
                    description={item.description}
                    value={color}
                    defaultValue={cp.defaultParameter}
                    onChange={v => onChange(item.id, v)}
                />
            </div>
        )
    }

    if (item.type === 'select') {
        const sel = item as AddonSettingsItemSelect
        const current = typeof value === 'string' ? value : (sel.defaultParameter ?? '')
        const options = (sel.options ?? []).map(o => ({ value: o.value, label: o.label }))
        return (
            <div className={styles.row}>
                <Select
                    label={item.name}
                    description={item.description}
                    value={current}
                    options={options}
                    defaultValue={sel.defaultParameter}
                    onChange={v => onChange(item.id, String(v))}
                />
            </div>
        )
    }

    return null
}

export function AddonSettingsAccordion({
    schema,
    values: controlledValues,
    onChange: onValuesChange,
    defaultOpenKeys = [],
    multiple = true,
    numbered = true,
    className,
}: AddonSettingsAccordionProps) {
    const [internalValues, setInternalValues] = useState<AddonSettingsValues>(() => {
        const initial: AddonSettingsValues = {}
        schema.sections.forEach(sec => {
            sec.items.forEach(item => {
                const v = getDefaultValue(item)
                if (v !== undefined) initial[item.id] = v
            })
        })
        return initial
    })

    const values = controlledValues ?? internalValues
    const setValues = useCallback(
        (next: AddonSettingsValues) => {
            if (controlledValues === undefined) setInternalValues(next)
            onValuesChange?.(next)
        },
        [controlledValues, onValuesChange]
    )

    const handleItemChange = useCallback(
        (id: string, v: boolean | number | string) => {
            setValues({ ...values, [id]: v })
        },
        [values, setValues]
    )

    const accordionItems: AccordionItem[] = useMemo(
        () =>
            schema.sections.map((section, idx) => ({
                key: String(idx),
                title: section.title,
                content: (
                    <div className={styles.sectionContent}>
                        {section.items.map(item => (
                            <SettingRow
                                key={item.id}
                                item={item}
                                value={values[item.id]}
                                onChange={handleItemChange}
                            />
                        ))}
                    </div>
                ),
            })),
        [schema.sections, values, handleItemChange]
    )

    return (
        <div className={clsx(styles.wrapper, className)}>
            <Accordion
                items={accordionItems}
                multiple={multiple}
                defaultOpen={defaultOpenKeys}
                numbered={numbered}
                showDivider
            />
        </div>
    )
}
