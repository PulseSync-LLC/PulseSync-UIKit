# PulseSync UIKit

Библиотека UI-компонентов для экосистемы PulseSync. React-компоненты с SCSS-модулями, дизайн-токенами и анимациями.

## Установка

```bash
npm install @pulsesync/uikit
```

**Peer-зависимости:** `react`, `react-dom`, `framer-motion` (опционально).

## Использование

```tsx
import { Button } from '@pulsesync/uikit/actions'
import { Input } from '@pulsesync/uikit/inputs'
import '@pulsesync/uikit/styles'

function App() {
  return (
    <>
      <Button variant="primary">Кнопка</Button>
      <Input placeholder="Поле ввода" />
    </>
  )
}
```

## Entry points

- `@pulsesync/uikit/actions`
- `@pulsesync/uikit/layout`
- `@pulsesync/uikit/navigation`
- `@pulsesync/uikit/inputs`
- `@pulsesync/uikit/feedback`
- `@pulsesync/uikit/data-display`
- `@pulsesync/uikit/styles`

## Компоненты

| Компонент | Описание |
|-----------|----------|
| **Accordion** | Раскрывающиеся секции |
| **Avatar** | Аватар с группой и индикатором статуса |
| **Badge** | Бейджи и теги |
| **Button** | Кнопки: primary, secondary, ghost, outline |
| **ColorPicker** | Выбор цвета |
| **ConfirmModal** | Модальное окно подтверждения |
| **Breadcrumbs** | Хлебные крошки |
| **DropdownMenu** | Вложенное выпадающее меню |
| **FilePicker** | Выбор файлов |
| **FilterButton** | Кнопка фильтра |
| **IconButton** | Кнопка-иконка |
| **Input** | Поле ввода |
| **OptionPicker** | Выбор опций |
| **Pagination** | Пагинация |
| **PromptModal** | Модальное окно с вводом |
| **SearchBox** | Поле поиска |
| **Select** | Выпадающий список |
| **Skeleton** | Заглушка загрузки |
| **Slider** | Слайдер |
| **Tabs** | Вкладки |
| **TextInput** | contentEditable-поле |
| **TitleText** | Заголовок секции |
| **Toast** | Уведомления |
| **Toggle** | Переключатель |
| **Tooltip** | Всплывающая подсказка |
| **ViewToggle** | Переключатель вида |

## Breaking changes in `2.0.0`

- Удалены `AchievementCard`, `AreaChartCard`, `BreakdownCard`, `KpiGrid`, `AddonSettings`.
- Удалены `NavLink`, `NavigationBar`, `UserCard`, `UserCardTile`, `UserMention`, `UserMenu`, `ImageCropModal`.
- Удалён `PulseSyncUIProvider`. Компоненты больше не зависят от app-level router adapter.
- Рекомендуемый импорт теперь идёт через subpath entrypoints вместо корневого barrel.

## Дизайн-токены

Библиотека использует CSS-переменные из `tokens.css`. Их можно переопределить в своём приложении.

## Лицензия

MIT
