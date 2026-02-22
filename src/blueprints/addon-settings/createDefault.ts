import type {
    AddonSettingsSchema,
    AddonSettingsSection,
    AddonSettingsItem,
    AddonSettingsItemType,
    AddonSettingsItemText,
    AddonSettingsItemButton,
    AddonSettingsItemSlider,
    AddonSettingsItemFilePicker,
    AddonSettingsItemColorPicker,
    AddonSettingsItemSelect,
} from './types'

export function createEmptyBlueprint(): AddonSettingsSchema {
    return { sections: [createEmptySection()] }
}

export function createEmptySection(title = 'New Section'): AddonSettingsSection {
    return { title, items: [] }
}

export function createEmptyItem(
    type: AddonSettingsItemType,
    id = `item_${Date.now()}`
): AddonSettingsItem {
    const base = { id, name: '', description: '' }
    switch (type) {
        case 'text':
            return { ...base, type: 'text', buttons: [] } as AddonSettingsItemText
        case 'button':
            return { ...base, type: 'button', bool: true, defaultParameter: true } as AddonSettingsItemButton
        case 'slider':
            return {
                ...base, type: 'slider',
                min: 0, max: 100, step: 1, value: 0, defaultParameter: 0,
            } as AddonSettingsItemSlider
        case 'file_picker':
            return { ...base, type: 'file_picker', accept: '*', defaultParameter: '' } as AddonSettingsItemFilePicker
        case 'color_picker':
            return { ...base, type: 'color_picker', defaultParameter: '#ffffff' } as AddonSettingsItemColorPicker
        case 'select':
            return {
                ...base, type: 'select',
                options: [{ value: 'option1', label: 'Option 1' }],
                defaultParameter: 'option1',
            } as AddonSettingsItemSelect
        default:
            return { ...base, type: 'button', bool: true, defaultParameter: true } as AddonSettingsItemButton
    }
}
