# Virtual Tour Creator

Приложение для создания виртуальных 360° туров из фотографий Insta360 X4.

## Возможности

- 📁 **Загрузка папок** — drag-and-drop или выбор папки с панорамами
- 🗺️ **Редактор точек перехода** — кликай на панораму, чтобы создать переход
- 🎮 **Режим просмотра** — тестируй тур, кликая на точки перехода
- 💾 **Сохранение проектов** — формат `.vtour` со всеми данными
- 🚀 **Экспорт** — standalone HTML с встроенным viewer'ом

## Установка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка и запуск
npm start
```

## Использование

1. **Загрузи панорамы** — нажми "Load Folder" и выбери папку с фото Insta360 X4
2. **Создай переходы** — нажми "Add Hotspot", кликни на панораму, выбери целевую панораму
3. **Протестируй** — включи "Preview Mode" и кликай на точки для навигации
4. **Сохрани проект** — используй "Save" для сохранения прогресса
5. **Экспортируй** — "Export Tour" создаёт standalone HTML для публикации

## Структура проекта

```
virtual-tour-creator/
├── electron/           # Electron main process
│   ├── main.js
│   └── preload.js
├── src/
│   ├── components/     # React components
│   │   ├── PanoramaViewer.jsx
│   │   ├── PanoramaList.jsx
│   │   ├── HotspotEditor.jsx
│   │   └── Toolbar.jsx
│   ├── hooks/
│   │   └── useTourProject.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
```

## Технологии

- **Electron** — desktop framework
- **React 18** — UI library
- **Three.js** — 3D/360° panorama rendering
- **Tailwind CSS** — styling
- **Vite** — build tool

## Сборка дистрибутива

```bash
# Windows
npm run dist

# macOS
npm run dist -- --mac

# Linux
npm run dist -- --linux
```

## Лицензия

MIT