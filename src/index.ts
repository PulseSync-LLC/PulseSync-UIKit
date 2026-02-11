/* ── Styles (consumers should import '@maks1mio/pulsesync-uikit/styles' separately) ── */
import './styles/index.css'

/* ── Context / Provider ── */
export { PulseSyncUIProvider, usePulseSyncUI } from './context/PulseSyncUIProvider'
export type {
    PulseSyncUIProviderProps,
    PulseSyncUIContextValue,
    LinkComponentProps,
} from './context/PulseSyncUIProvider'

/* ── Button ── */
export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button'

/* ── Tooltip ── */
export { Tooltip } from './components/Tooltip'
export type { TooltipProps, TooltipPosition } from './components/Tooltip'

/* ── ConfirmModal ── */
export { ConfirmModal, useConfirmModal } from './components/ConfirmModal'
export type { ConfirmModalProps } from './components/ConfirmModal'

/* ── PromptModal ── */
export { PromptModal, usePromptModal } from './components/PromptModal'
export type { PromptModalProps } from './components/PromptModal'

/* ── OptionPicker ── */
export { OptionPicker } from './components/OptionPicker'
export type { OptionPickerOption, OptionPickerProps } from './components/OptionPicker'

/* ── NavLink ── */
export { NavLink } from './components/NavLink'
export type { NavLinkProps } from './components/NavLink'

/* ── Avatar ── */
export { Avatar, AvatarGroup } from './components/Avatar'
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarShape, AvatarStatus } from './components/Avatar'

/* ── Toast ── */
export { ToastProvider, useToast } from './components/Toast'
export type { ToastAPI, ToastData, ToastType } from './components/Toast'

/* ── Pagination ── */
export { Pagination } from './components/Pagination'
export type { PaginationProps } from './components/Pagination'

/* ── UserCard ── */
export { UserCard } from './components/UserCard'
export type { UserCardProps, UserCardUser, UserCardBadge } from './components/UserCard'

/* ── UserMention ── */
export { UserMention } from './components/UserMention'
export type { UserMentionProps } from './components/UserMention'

/* ── Tabs ── */
export { Tabs, TabList, Tab, TabPanel } from './components/Tabs'
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from './components/Tabs'

/* ── Input ── */
export { Input } from './components/Input'
export type { InputProps } from './components/Input'

/* ── Badge ── */
export { Badge } from './components/Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './components/Badge'

/* ── Skeleton ── */
export { Skeleton } from './components/Skeleton'
export type { SkeletonProps } from './components/Skeleton'

/* ── Slider ── */
export { Slider } from './components/Slider'
export type { SliderProps } from './components/Slider'

/* ── Toggle ── */
export { Toggle } from './components/Toggle'
export type { ToggleProps } from './components/Toggle'

/* ── Select ── */
export { Select } from './components/Select'
export type { SelectProps, SelectOption } from './components/Select'

/* ── TextInput (contentEditable) ── */
export { TextInput } from './components/TextInput'
export type { TextInputProps, TextInputCommand } from './components/TextInput'

/* ── DropdownMenu (nested tree) ── */
export { DropdownMenu } from './components/DropdownMenu'
export type { DropdownMenuProps, DropdownMenuItem } from './components/DropdownMenu'

/* ── ColorPicker ── */
export { ColorPicker } from './components/ColorPicker'
export type { ColorPickerProps } from './components/ColorPicker'

/* ── FilePicker ── */
export { FilePicker } from './components/FilePicker'
export type { FilePickerProps } from './components/FilePicker'

/* ── Accordion ── */
export { Accordion } from './components/Accordion'
export type { AccordionProps, AccordionItem } from './components/Accordion'

/* ── UserMenu ── */
export { UserMenu } from './components/UserMenu'
export type { UserMenuProps, UserMenuItem } from './components/UserMenu'

/* ── NavigationBar ── */
export { NavigationBar } from './components/NavigationBar'
export type { NavigationBarProps, NavigationBarItem } from './components/NavigationBar'

/* ── ImageCropModal ── */
export { ImageCropModal } from './components/ImageCropModal'
export type { ImageCropModalProps, ImageCropModalLabels, CropType } from './components/ImageCropModal'
