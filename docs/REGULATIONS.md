# REGULATIONS.md · v3 · 2026-08-29
# Координата: annachurasheva/mem-OK · docs/REGULATIONS.md · v3

## Вход для внешнего
Вы в пространстве mem/m3/mem-2026/mem-OK/mem-ok-s-admin.
Читать по координатам: mem-OK (подробно для владельца и входящих):
REGULATIONS → STAGES → ABOUT_USER; m3 (личное): ABOUT_USER →
STAGES → REGULATIONS; mem-ok-s-admin (готовый модуль): README →
INSTRUCTION; mem: ROLES_OK, CONTACT_PROTOCOL; context-vkru:
HANDOVER, SPLIT (архив).

## Координаты бумажек (правило)
Бумажка = репо · путь · версия · дата. Для записей — второй тип
координаты: SC issue #NN. При открытии диалога передаются
координаты, не содержимое. Реестр координат:
annachurasheva/mem-OK · docs/REGULATIONS.md · v3 · 2026-08-29
annachurasheva/mem-OK · docs/STAGES.md · v3 · 2026-08-29
annachurasheva/mem-OK · docs/ABOUT_USER.md · v3 · 2026-08-29
annachurasheva/m3 · docs/ABOUT_USER.md · v2 · 2026-08-25
annachurasheva/m3 · docs/STAGES.md · v2 · 2026-08-25
annachurasheva/m3 · docs/REGULATIONS.md · v2 · 2026-08-25
annachurasheva/mem-ok-s-admin · README.md · v2 · 2026-08-29
annachurasheva/mem-ok-s-admin · INSTRUCTION.md · v1 · 2026-08-28
annachurasheva/mem-ok-s-admin · docs/PUBLISH_PROTOCOL.md · v1 · 2026-08-29
annachurasheva/mem-ok-s-admin · docs/MANUALS/GRANT.md · v1 · 2026-08-29
annachurasheva/mem-ok-s-admin · docs/MANUALS/BUILD_RUN.md · v1 · 2026-08-29
annachurasheva/mem-ok-s-admin · data/geo/settlements.md · v1 · 2026-08-29
annachurasheva/mem · docs/ROLES_OK.md · v1 · ожидает
annachurasheva/mem · docs/CONTACT_PROTOCOL.md · v1 · ожидает
annachurasheva/context-vkru · docs/HANDOVER.md · архив
annachurasheva/context-vkru · docs/SPLIT.md · v7 · архив
annachurasheva/context-vkru · docs/track_С.md · v1 · архив
SC: sourcecraft.dev/ermek-toptaev-1/context-vkru/issues/27 ·
    спецификация дашборда mem-OK

## Роли
Пользователь — смыслы, вердикты; НЕ оператор инструментов.
Проектировщик — зона кода, схемы, задания, raw-гейт.
Кодер — тексты, коммиты; одна задача за ответ.
Агент — зрение (CDP 9222), диагностика без пользователя.

## Коммиты
Conventional: feat/fix/docs/chore/refactor/diag/test/infra + [TASK-NNN].
context-vkru: 6 закрывающих (TASK-0102) — очередь, порядок сохранён.
Фикс и refactor не смешивать.

## Лимиты
Л1 0–1 движение; Л2 ≤2 итераций; Л3 без слепой диагностики;
Л4 короткие тексты; Л5 артефакт только при отдаче.
КК = отдача/(лента+ресурсы); цикл КК≤0 не повторяется.

## Хранилище и каналы
File-first (zapiski.json), НЕТ IndexedDB; буфера НЕТ (кастомная W10).
mem: лички — канал; реестр контактов; охлаждение 2 недели;
шаблоны нумерованные с основанием; массового сбора нет.

## Инструменты: реальная цепь
- один TASK = одна квота-сессия; вопросов на уточнение НЕ допускаем:
  вероятные вопросы предвосхищены внутри TASK (как мой ответ по 8-му,
  который съел отдельный диалог);
- не «поправьте», а ТОЧНЫЙ контент: полные тексты файлов под вставку,
  готовые commit-сообщения;
- диф маленький; большое — режем на 2–3 TASK;
- отчёт Кодера: сделано/осталось — и только.