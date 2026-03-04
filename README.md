# Virtual Tour Creator 🏞️

Современное Electron-приложение для создания виртуальных 360° туров из фотографий Insta360 X4.

![Screenshot](screenshot.png)

## ✨ Возможности

### 🎨 Дизайн
- **Glassmorphism UI** — современный интерфейс с эффектом стекла
- **Тёмная тема** — приятная для глаз при длительной работе
- **Анимации** — плавные переходы и интерактивные эффекты
- **Адаптивный layout** — работает на разных размерах окна

### 📸 Работа с панорамами
- **Drag & Drop** — перетащите папку с фото в приложение
- **Миниатюры** — предпросмотр панорам в списке
- **Поиск** — быстрый поиск по названию
- **Поддержка форматов** — JPG, JPEG, PNG, WebP

### 🔗 Hotspot'ы
- **Transition** — точки перехода между панорамами
- **Info Points** — информационные точки с подписями
- **Визуальный редактор** — кликайте на сфере для размещения
- **Редактирование** — изменяйте label и целевую панораму
- **Метки** — 3D маркеры с HTML-лейблами

### 🎮 Режимы
- **Edit Mode** — создание и редактирование тура
- **Preview Mode** — тестирование с навигацией по hotspot'ам
- **Стартовая позиция** — настройка начального вида для каждой панорамы

### 💾 Работа с проектами
- **Save/Load** — сохранение в формате `.vtour`
- **Undo/Redo** — история изменений (Ctrl+Z / Ctrl+Y)
- **Auto-save** — автоматическое сохранение истории
- **Export** — экспорт в standalone HTML

### ⌨️ Горячие клавиши
| Клавиша | Действие |
|---------|----------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + S` | Save |
| `Ctrl + O` | Open |
| `Space` | Toggle Add Hotspot |
| `Drag` | Rotate view |
| `Scroll` | Zoom |

## 🚀 Установка

### Требования
- Node.js 18+
- npm или yarn

### Установка зависимостей
```bash
cd virtual-tour-creator
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка production
```bash
npm run build
npm start
```

### Создание дистрибутива
```bash
# Windows
npm run dist

# macOS
npm run dist -- --mac

# Linux
npm run dist -- --linux
```

## 📖 Использование

### 1. Загрузка панорам
- Нажмите **"Load Folder"** или перетащите папку с фото
- Выберите папку с панорамами Insta360 X4
- Миниатюры автоматически сгенерируются

### 2. Создание переходов
1. Выберите тип hotspot'а (**Transition** или **Info**)
2. Нажмите **"Add Hotspot"** или клавишу `Space`
3. Кликните на панораму, чтобы разместить точку
4. Для transition выберите целевую панораму
5. Добавьте label (подпись)

### 3. Настройка вида
- Поверните камеру в нужное положение
- Нажмите **"Set Start View"**, чтобы сохранить позицию
- При переходе камера автоматически установится в эту позицию

### 4. Тестирование
- Нажмите **"Preview"** для входа в режим просмотра
- Кликайте на зелёные hotspot'ы для навигации
- Выход — повторный клик на **"Preview"**

### 5. Экспорт
- Нажмите **"Export Tour"**
- Выберите папку для сохранения
- Получите standalone HTML с встроенным viewer'ом

## 📁 Структура проекта

```
virtual-tour-creator/
├── electron/              # Electron main process
│   ├── main.js           # Главный процесс
│   └── preload.js        # Preload скрипт
├── src/
│   ├── components/        # React компоненты
│   │   ├── PanoramaViewer.jsx    # 3D просмотрщик (Three.js)
│   │   ├── PanoramaList.jsx      # Список панорам
│   │   ├── HotspotEditor.jsx     # Редактор hotspot'ов
│   │   └── Toolbar.jsx           # Панель инструментов
│   ├── hooks/
│   │   └── useTourProject.js     # Логика проекта + Undo/Redo
│   ├── App.jsx           # Главный компонент
│   ├── main.jsx          # Точка входа
│   └── index.css         # Стили
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🛠️ Технологии

- **Electron** — Desktop framework
- **React 18** — UI library
- **Three.js** — 3D графика
- **React Three Fiber** — React обёртка для Three.js
- **Tailwind CSS** — Стилизация
- **Vite** — Сборка

## 📝 Формат проекта (.vtour)

```json
{
  "name": "My Tour",
  "version": "1.0",
  "panoramas": [
    {
      "id": "pano-xxx",
      "name": "photo1.jpg",
      "path": "/full/path",
      "startPosition": { "x": 0, "y": 0, "z": 0.1 }
    }
  ],
  "hotspots": [
    {
      "id": "hs-xxx",
      "type": "transition",
      "panoramaId": "pano-xxx",
      "position": { "x": 100, "y": 50, "z": 200 },
      "targetPanoramaId": "pano-yyy",
      "label": "Go to Kitchen"
    }
  ]
}
```

## 🐛 Известные проблемы

1. **Большие панорамы** — файлы >50MB могут загружаться медленно
2. **WebP** — не все браузеры поддерживают в экспортированном HTML

## 🔮 Roadmap

- [ ] Поддержка видео-панорам
- [ ] VR режим (WebXR)
- [ ] Звуковые hotspot'ы
- [ ] Карта тура (minimap)
- [ ] Поделиться в облаке
- [ ] Мобильное приложение

## 📄 Лицензия

MIT License — свободное использование для личных и коммерческих проектов.

## 🙏 Благодарности

- Three.js Community
- Electron Team
- Insta360 за отличные камеры

---

Создано с ❤️ для творцов виртуальных туров