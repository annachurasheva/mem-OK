# ОТЧЁТ TASK-0154 — EdgeExtension от донора (provenance) + адаптация ok.ru

Дата: 2026-08-29 15:56
Доноры: `C:\Projects\git-isolated-fixed\git-projects` · Цель: `C:\astro-projects\mem-OK`

## Provenance-цепочка

TASK-0002 (context-vkru: RunEdgeCdp/CDP 9222) -> TASK-0100 (m3: каркас) -> TASK-0154 (mem-OK: ок-адаптация).

## Скопировано КАК ЕСТЬ из context-vkru (ядро v07g, SHA256)

| Файл | SHA256 |
|------|--------|
| `EdgeExtension\manifest.json` | `62F6093281873C892E7D5118665D82ECC0F554D4629E2EFBD4F85433D17D7C38` |
| `EdgeExtension\src\core\messaging.js` | `75742B69BE8B9F724489716318EDB04F8BD33EB2D24082CB2D78FF12D9254A03` |
| `EdgeExtension\src\core\normalize.js` | `8040CF4134A08EBD1DD4B8A43CFE047E4E1E45FC2F87D8F3416C02C80740AC82` |
| `EdgeExtension\src\core\storage.js` | `1A8301FA1CBD5E00D6D990D100B18BAD392DEB46CC1CA9F921CD904878063D53` |
| `EdgeExtension\src\ui\layer.js` | `80C95EC63DF99E74DD87E323DB099E2FB282ECF34E32A338788BEEA87B49565B` |
| `EdgeExtension\src\ui\dialog.js` | `A8259155542C4AD26ED44A7DFCF46DF4E220D57883CBFDC8150BF09A39B825F9` |
| `EdgeExtension\src\content.js` | `53D3C09A6E584C1C6AA71F23CA4049FFA9E5F085A5DDEF0C3D32EA8AE6708E93` |
| `EdgeExtension\src\background.js` | `355D87D94C678A28E0F2BFD1FDF39D5DA32F15F2605999A26056B85EA12235AC` |
| `EdgeExtension\src\styles.css` | `211628E92F4282A2FA35F840E7B372C888982F9679CDFD543B95E549EF503F5A` |

## Адаптировано под ok.ru (заменено)

- `EdgeExtension/manifest.json`
- `EdgeExtension/src/content.js`
- `EdgeExtension/src/background.js`
- `scripts/RunEdgeCdp.ps1`

## Создано

- `docs/TEST_PROTOCOL.md`

## НЕ тронуты

- Ядро v07g (messaging, normalize, storage, ui/kartoteka) — единственный писатель, NAME_HINT, badge.
- VK-вариант у донора context-vkru.

## НЕ включено

- журналы-копии строительства, контур джунов, GRANT, эксплуатационный дашборд.

