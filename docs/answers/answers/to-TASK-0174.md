Отчёт о выполнении TASK-0174: Создание базы слона и апгрейд UX (дверь и автозахват)

## Созданные файлы (согласно ТЗ):

### 1.`EdgeExtension/src/core/slonstore.js`

Хранилище слона (ключ`ctxslon`в`chrome.storage.local`):

- Эталонные ранги из dmiandr/context (9 градаций, 0–8)
- Методы:`load()`,`save()`,`getStatus()`,`setStatus()`,`deleteStatus()`,`getRanks()`,`getAllStatuses()`
- История изменений для каждой записи

### 2.`EdgeExtension/src/slonbg.js`

Background service worker для слона (не используется напрямую — логика интегрирована в`background.js`)

### 3.`EdgeExtension/src/ui/slonmarks.js`

Content script для отрисовки меток на ok.ru:

- Парсит ссылки на профили/группы
- Рисует цветные метки рядом со ссылками
- Клик по метке → открытие двери

### 4.`EdgeExtension/src/ui/slondoor.js`

Логика окна двери савтозахватом контекста:

- Автозахват координаты из`location.href`текущей вкладки
- Автозаполнение полей «Координата» и «Время»
- Поле`descript`строго пустоепри открытии (никаких placeholder)
- Бинарный выбор: кнопки «Сохранить» / «Сброс»
- Режим редактирования vs создания (по наличию статуса в базе)

### 5.`EdgeExtension/ui/door.html`

HTML-форма двери:

- CSS с адаптивным размером textarea (flexible)
- Поля: Координата (readonly), Время (readonly), Автор, Ранг (select), Пояснение (textarea)
- Кнопки «Сохранить» и «Сброс»
- Секция истории (скрыта по умолчанию)

## Изменённые файлы:

### `EdgeExtension/manifest.json`

- Версия:`0.1.1`→`0.1.2`
- Добавлено разрешение`tabs`
- `matches`:`https://ok.ru/*`→`*://*.ok.ru/*`
- В`content_scripts`добавлены:`src/core/slonstore.js`,`src/ui/slonmarks.js`
- Добавлен`web_accessible_resources`для`ui/door.html`

### `EdgeExtension/src/background.js`

- Добавлен`importScripts("./core/slonstore.js")`
- Интегрированы обработчики для слона:`getStatus`,`setStatus`,`deleteStatus`,`getRanks`,`getAllStatuses`,`openDoor`

## Сборка:

- `dist/`создана копированием`EdgeExtension/`
- Все файлы на месте, manifest.json валиден

## Дифф (кратко):

```
+ EdgeExtension/src/core/slonstore.js (новый, 82 строки)
+ EdgeExtension/src/ui/slonmarks.js (новый, 106 строк)
+ EdgeExtension/src/ui/slondoor.js (новый, 160 строк)
+ EdgeExtension/ui/door.html (новый, 197 строк)
~ EdgeExtension/manifest.json (обновлён: version, permissions, content_scripts, web_accessible_resources)
~ EdgeExtension/src/background.js (добавлены обработчики слона)
```

Готово к тестированию:`pwsh scripts/Build.ps1`→`pwsh scripts/Run-moderator.ps1`→ ok.ru → ПКМ по ссылке → «Слон: статус…».