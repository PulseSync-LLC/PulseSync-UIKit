/**
 * Blueprint types for addon handleEvents-like JSON (e.g. BetterAlbumInfo handleEvents.json).
 * Blueprint = определение структуры, которое вы создаёте/редактируете (как в UE5);
 * из него генерируется и handleEvents.json, и интерфейс (Accordion).
 */

/** Button sub-item (e.g. for type "text" with buttons array) */
export interface AddonSettingsButtonItem {
    id: string
    name?: string
    text?: string
    defaultParameter?: string
}

/** Single setting item — type determines which control to render */
export type AddonSettingsItem =
    | AddonSettingsItemText
    | AddonSettingsItemButton
    | AddonSettingsItemSlider
    | AddonSettingsItemFilePicker
    | AddonSettingsItemColorPicker
    | AddonSettingsItemSelect

export type AddonSettingsItemType = AddonSettingsItem['type']

export interface AddonSettingsItemBase {
    id: string
    name: string
    description?: string
    /** Order within section (lower = higher). Used for manual reordering. */
    order?: number
}

export interface AddonSettingsItemText extends AddonSettingsItemBase {
    type: 'text'
    buttons?: AddonSettingsButtonItem[]
}

export interface AddonSettingsItemButton extends AddonSettingsItemBase {
    type: 'button'
    bool?: boolean
    defaultParameter?: boolean
}

export interface AddonSettingsItemSlider extends AddonSettingsItemBase {
    type: 'slider'
    min?: number
    max?: number
    step?: number
    value?: number
    defaultParameter?: number
}

export interface AddonSettingsItemFilePicker extends AddonSettingsItemBase {
    type: 'file_picker'
    accept?: string
    defaultParameter?: string
}

export interface AddonSettingsItemColorPicker extends AddonSettingsItemBase {
    type: 'color_picker'
    defaultParameter?: string
}

export interface AddonSettingsSelectOption {
    value: string
    label: string
}

export interface AddonSettingsItemSelect extends AddonSettingsItemBase {
    type: 'select'
    options?: AddonSettingsSelectOption[]
    defaultParameter?: string
}

export interface AddonSettingsSection {
    title: string
    items: AddonSettingsItem[]
}

/** Stored position/metadata for a blueprint node */
export interface AddonSettingsNodeLayout {
    id: string
    type: 'section' | 'item'
    position: { x: number; y: number }
    sectionId?: string
}

/** Root shape of handleEvents.json */
export interface AddonSettingsSchema {
    sections: AddonSettingsSection[]
    nodes?: AddonSettingsNodeLayout[]
}

/** Current values keyed by item id (for controlled mode) */
export type AddonSettingsValues = Record<
    string,
    boolean | number | string | undefined
>
