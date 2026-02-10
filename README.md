# PulseSync UIKit

Библиотека UI-компонентов для экосистемы PulseSync. React-компоненты с SCSS-модулями, дизайн-токенами и анимациями.

## Установка

```bash
npm install @pulsesync/ui
```

**Peer-зависимости:** `react`, `react-dom`, `framer-motion` (опционально).

## Использование

```tsx
import { Button, Input, PulseSyncUIProvider } from '@pulsesync/ui'
import '@pulsesync/ui/styles'

function App() {
  return (
    <PulseSyncUIProvider>
      <Button variant="primary">Кнопка</Button>
      <Input placeholder="Поле ввода" />
    </PulseSyncUIProvider>
  )
}
```

## Компоненты

| Компонент | Описание |
|-----------|----------|
| **Accordion** | Раскрывающиеся секции |
| **Avatar** | Аватар с группой и индикатором статуса |
| **Badge** | Бейджи и теги |
| **Button** | Кнопки: primary, secondary, ghost, outline |
| **ColorPicker** | Выбор цвета |
| **ConfirmModal** | Модальное окно подтверждения |
| **DropdownMenu** | Вложенное выпадающее меню |
| **FilePicker** | Выбор файлов |
| **Input** | Поле ввода |
| **NavigationBar** | Вертикальная панель навигации |
| **NavLink** | Ссылка для роутера |
| **OptionPicker** | Выбор опций |
| **Pagination** | Пагинация |
| **PromptModal** | Модальное окно с вводом |
| **Select** | Выпадающий список |
| **Skeleton** | Заглушка загрузки |
| **Slider** | Слайдер |
| **Tabs** | Вкладки |
| **TextInput** | contentEditable-поле |
| **Toast** | Уведомления |
| **Toggle** | Переключатель |
| **Tooltip** | Всплывающая подсказка |
| **UserCard** | Карточка пользователя |
| **UserMenu** | Меню профиля |
| **UserMention** | Упоминание пользователя |

## Дизайн-токены

Библиотека использует CSS-переменные из `tokens.css`. Их можно переопределить в своём приложении.

## Лицензия

MIT
