## Отчёт о выполнении TASK-0175

### Внесённые изменения:

#### 1.`EdgeExtension/src/background.js`

Добавлена строка сразу после`importScripts("./core/slonstore.js");`:
```javascript
importScripts("./slonbg.js");
```



#### 2.`EdgeExtension/src/slonbg.js`(полный апгрейд)

- Меню создаётся идемпотентно на КАЖДОМ старте SW(не только в`onInstalled`): 

```javascript
function createSlonMenu() {
  chrome.contextMenus.remove("slon-door", () => {
    void chrome.runtime.lastError;
    chrome.contextMenus.create({
      id: 'slon-door',
      title: 'Слон: статус...',
      contexts: ['link']
    });
  });
}
createSlonMenu(); // вызов при загрузке скрипта
```
- ID меню изменён:`slon-status`→`slon-door`(единый ID)
- Парсинг координаты переписанпо ТЗ:
    - `profile/NNN`и субстраницы →`profile:NNN`
    - `group/NNN`и субстраницы →`group:NNN`
    - `music/video/app`→`ok-_music_track_…`,`ok-_video_…`,`ok-_app_vk_app…`
- Свои regex убраны— используется логика, совместимая с донорской нормализацией

#### 3. Сборка

`dist/`пересобрана: все файлы на месте,`manifest.json`не тронут (версия 0.1.2).

### Дифф (кратко):

```
~ EdgeExtension/src/background.js (+1 строка: importScripts slonbg.js)
~ EdgeExtension/src/slonbg.js (меню на каждом старте SW, ID slon-door, новый парсер координат)
```

### Меню: третий пункт «Слон: статус…» — ГОТОВ к проверке

ПКМ по ссылке на ok.ru → в подменю «Записки ОК» теперь должен быть третий пункт«Слон: статус…».

Commit:`433ca82`—`fix: слон — importScripts slonbg.js и меню на каждом старте SW [TASK-0175]`