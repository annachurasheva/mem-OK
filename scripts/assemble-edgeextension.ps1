# assemble-edgeextension.ps1 — TASK-0154: EdgeExtension от донора (provenance) + адаптация к ok.ru.
# Коммит: feat: mem-OK — EdgeExtension и RunEdgeCdp от донора (provenance) [TASK-0154]
#
# Доноры (в локали, присутствуют): context-vkru (архив), m3, mem-ok-s-admin, mem-2026.
#   context-vkru  — ядро v07g (messaging, normalize, storage, ui/kartoteka, layer, dialog)
#   m3            — RunEdgeCdp.ps1 (TASK-0100)
#
# ЧТО ДЕЛАЕТ:
#   1. КОПИЯ EdgeExtension/ из context-vkru -> mem-OK/EdgeExtension/ (КАК ЕСТЬ, SHA256 provenance).
#      Ядро v07g (messaging, normalize, storage file-first, ui/kartoteka) — НЕ трогать.
#   2. АДАПТАЦИЯ к ok.ru (заменяются ТОЛЬКО manifest.json, content.js, background.js):
#      manifest matches ok.ru/*; ПКМ «Записка: ПЕР/СОО» -> картотека -> база.
#      VK-вариант у донора (context-vkru) — НЕ трогать.
#   3. RunEdgeCdp.ps1 -> scripts/RunEdgeCdp.ps1 (ок-профили .edge_test_*, порты 9222-9226).
#   4. docs/TEST_PROTOCOL.md.
#   5. Отчёт с provenance-цепочкой: TASK-0002 (context-vkru) -> TASK-0100 (m3) -> TASK-0154 (mem-OK).
#
# НЕ включать: журналы-копии строительства, контур джунов, GRANT, эксплуатационный дашборд.
#
# Запуск: pwsh scripts/assemble-edgeextension.ps1

[CmdletBinding()]
param(
    [string]$DonorsRoot = "C:\Projects\git-isolated-fixed\git-projects",
    [string]$TargetRoot = "C:\astro-projects\mem-OK"
)

$ErrorActionPreference = "Stop"
$vkru    = Join-Path $DonorsRoot "context-vkru"
$m3      = Join-Path $DonorsRoot "m3"
$copied  = @()   # provenance: скопировано КАК ЕСТЬ
$adapted = @()   # адаптировано под ok.ru
$created = @()   # создано

function New-Dir([string]$p) {
    if (-not (Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

# КОПИЯ КАК ЕСТЬ + SHA256 provenance
function Copy-Provenance([string]$absSrc, [string]$relDst) {
    $dst = Join-Path $TargetRoot $relDst
    if (-not (Test-Path -LiteralPath $absSrc)) {
        Write-Warning "ДОНОР ОТСУТСТВУЕТ (пропущено): $absSrc"
        return
    }
    New-Dir (Split-Path $dst)
    Copy-Item -LiteralPath $absSrc -Destination $dst -Force
    $hash = (Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash
    $script:copied += [pscustomobject]@{ File = $relDst; SHA256 = $hash }
}

# АДАПТАЦИЯ: записать ок-вариант (только manifest/content/background)
function Write-Adapted([string]$relDst, [string]$content) {
    $dst = Join-Path $TargetRoot $relDst
    New-Dir (Split-Path $dst)
    Set-Content -LiteralPath $dst -Value $content -Encoding utf8 -NoNewline
    $script:adapted += $relDst
}

function Write-New([string]$relDst, [string]$content) {
    $dst = Join-Path $TargetRoot $relDst
    if (Test-Path -LiteralPath $dst) { Write-Host "уже есть (не перезаписываю): $relDst"; return }
    New-Dir (Split-Path $dst)
    Set-Content -LiteralPath $dst -Value $content -Encoding utf8 -NoNewline
    $script:created += $relDst
}

# ============================================================
# 1. КОПИЯ EdgeExtension/ из context-vkru (ядро v07g) — КАК ЕСТЬ
# ============================================================
Write-Host "== 1. Копия EdgeExtension из context-vkru (ядро v07g) =="
$edgeSrc = Join-Path $vkru "EdgeExtension"
$edgeFiles = @(
    "manifest.json",
    "src/core/messaging.js",
    "src/core/normalize.js",
    "src/core/storage.js",
    "src/ui/kartoteka.html",
    "src/ui/kartoteka.js",
    "src/ui/layer.js",
    "src/ui/dialog.js",
    "src/content.js",
    "src/background.js",
    "src/styles.css"
)
foreach ($f in $edgeFiles) { Copy-Provenance (Join-Path $edgeSrc $f) (Join-Path "EdgeExtension" $f) }

# ============================================================
# 2. АДАПТАЦИЯ к ok.ru: manifest / content / background
#    (ядро v07g и VK-вариант донора НЕ трогать)
# ============================================================
Write-Host "== 2. Адаптация к ok.ru =="

$manifestOk = @'
{
  "manifest_version": 3,
  "name": "Записки ОК",
  "version": "0.1.0",
  "description": "Записки на ok.ru: ПКМ «Записка: ПЕР/СОО» -> картотека. Ядро v07g от донора context-vkru (provenance TASK-0154).",
  "permissions": ["contextMenus", "storage"],
  "background": { "service_worker": "src/background.js" },
  "content_scripts": [
    {
      "matches": ["https://ok.ru/*"],
      "js": [
        "src/core/messaging.js",
        "src/core/normalize.js",
        "src/core/storage.js",
        "src/ui/layer.js",
        "src/content.js"
      ],
      "css": ["src/styles.css"],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": ["https://ok.ru/*"]
}
'@
Write-Adapted "EdgeExtension/manifest.json" $manifestOk

$contentOk = @'
/* mem-OK · src/content.js · ok.ru-адаптация (TASK-0154).
 * Тонкая точка входа для ok.ru. Ядро v07g (messaging, normalize, storage,
 * layer) — от донора context-vkru, НЕ трогать. VK-вариант в доноре — НЕ трогать.
 * ПКМ «Записка: ПЕР/СОО» создаётся в background.js (contextMenus).
 * Единственный писатель — background.js (storage.saveDb).
 */
(() => {
  "use strict";
  // ok.ru: основной домен и поддомены
  if (!(location.host === "ok.ru" || location.host.endsWith(".ok.ru"))) return;

  console.log("[CTX " + CTX_BUILD + "] content started (ok.ru) — path: " + location.pathname);

  // Индекс по картотеке (для стекла/подхватов).
  let INDEX = { byId: new Map() };

  function buildIndex(db) {
    const byId = new Map();
    const cards = Array.isArray(db.cards) ? db.cards : Object.values(db.cards || {});
    cards.forEach((card) => {
      const id = card && card.identities && card.identities.id;
      if (id) byId.set(String(id), card);
    });
    INDEX = { byId: byId };
  }

  // Старт: лог базы + стекло (layer из ядра).
  CTX_STORAGE.loadDb().then((db) => {
    const n = Array.isArray(db.cards) ? db.cards.length : Object.keys(db.cards || {}).length;
    console.log("[CTX " + CTX_BUILD + "] kartoteka: " + n + " cards");
    buildIndex(db);
    if (typeof CTX_LAYER !== "undefined") CTX_LAYER.init();
  }).catch(() => {});

  // CTX_SYNC (клик по значку) — перерисовка стекла / локальный скальпель.
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== CTX_MSG.CTX_SYNC) return;
    let scope = null;
    const sel = typeof window.getSelection === "function" ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = node && node.nodeType === 1 ? node : node && node.parentElement;
      if (el) scope = el;
    }
    if (typeof CTX_LAYER !== "undefined") CTX_LAYER.init(scope);
  });

  // CAPTURED (изъятие записки) — лог + NAME_HINT (имя из первого якоря).
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== CTX_MSG.CAPTURED) return;
    const p = msg.payload || {};
    console.log("[CTX " + CTX_BUILD + "] zapiska | menu: " + p.menu +
      " | id: " + p.id + " | type: " + p.type +
      " | link: " + p.link + " | db: " + (p.db || ""));

    // NAME_HINT: первый якорь с тем же id и непустым текстом.
    if (p.id) {
      const anchors = document.querySelectorAll("a[href]");
      for (const a of anchors) {
        if (!a.textContent.trim()) continue;
        // подхват: ok-ссылка, нормализованная к тому же id
        const href = a.getAttribute("href");
        if (!href) continue;
        let abs;
        try { abs = new URL(href, location.origin).href; } catch (e) { continue; }
        const id = okIdOf(abs);
        if (id === p.id) {
          chrome.runtime.sendMessage({
            type: CTX_MSG.NAME_HINT,
            payload: { id: p.id, name: a.textContent.trim() },
          }).catch(() => {});
          break;
        }
      }
    }
  });

  // ok-ид из ссылки (ok-специфика; ядро normalize.js НЕ трогать).
  function okIdOf(link) {
    try {
      const u = new URL(link);
      const m = u.pathname.match(/^\/(profile|group)\/(\d+)/);
      if (m) return m[1] + ":" + m[2];
      return u.pathname;
    } catch (e) { return link; }
  }
})();
'@
Write-Adapted "EdgeExtension/src/content.js" $contentOk

$backgroundOk = @'
/* mem-OK · src/background.js · ok.ru-адаптация (TASK-0154).
 * ПКМ «Записка: ПЕР/СОО» на ok.ru -> картотека -> запись в базу.
 * Ядро v07g (messaging, normalize, storage) — от донора, НЕ трогать.
 * Единственный писатель: loadDb -> mutate -> saveDb. NAME_HINT, badge — сохранены.
 */
importScripts("./core/messaging.js");
importScripts("./core/normalize.js");
importScripts("./core/storage.js");
console.log("[CTX " + CTX_BUILD + "] service worker started (ok.ru)");

// badge: по умолчанию серо (стекла нет)
function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setBadgeBackgroundColor({ color: "#9aa0a6" });
}

// ПКМ «Записка: ПЕР/СОО» на ok.ru
chrome.runtime.onInstalled.addListener(() => {
  clearBadge();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "zapiska-per", title: "Записка: ПЕР", contexts: ["link"] });
    chrome.contextMenus.create({ id: "zapiska-soo", title: "Записка: СОО", contexts: ["link"] });
  });
});

// ok-ид из ссылки (ok-специфика; ядро normalize.js НЕ трогать)
function okId(link) {
  try {
    const u = new URL(link);
    const m = u.pathname.match(/^\/(profile|group)\/(\d+)/);
    if (m) return { auto: m[1] === "profile" ? "PERSON" : "COMMUNITY", id: m[1] + ":" + m[2] };
    return { auto: null, id: u.pathname };
  } catch (e) { return { auto: null, id: link }; }
}

function normId(id) { return String(id).replace(/[^a-zA-Z0-9:_-]/g, "_"); }

// Единственный писатель: loadDb -> mutate -> saveDb
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "zapiska-per" && info.menuItemId !== "zapiska-soo") return;
  const link = info.linkUrl || "";
  const portal = CTX_NORMALIZE.portalOf(link); // "ok"
  const { id } = okId(link);
  const type = info.menuItemId === "zapiska-per" ? "PERSON" : "COMMUNITY";
  const now = Math.floor(Date.now() / 1000);
  const cardId = "ok-" + normId(id);

  const db = await CTX_STORAGE.loadDb();
  const isArr = Array.isArray(db.cards);
  const find = (cid) => isArr
    ? db.cards.find((c) => c && c.cardId === cid)
    : db.cards[cid];

  let logLine;
  let existing = find(cardId);
  if (existing) {
    existing.updated_at = now;
    existing.history = (existing.history || []).concat([{ ts: now, action: "captured (ok.ru)" }]);
    logLine = "уже в картотеке: " + cardId;
  } else {
    const card = {
      cardId: cardId,
      portal: "ok",
      external_id: null,
      identities: { id: id, type: type },
      meta: {},
      status: "draft",
      updated_at: now,
      history: [{ ts: now, action: "captured (ok.ru)" }],
      annotations: [],
    };
    if (isArr) db.cards.push(card); else db.cards[cardId] = card;
    logLine = "записка в картотеке: " + cardId + " (" + type + ")";
  }
  await CTX_STORAGE.saveDb(db);

  const total = isArr ? db.cards.length : Object.keys(db.cards).length;
  console.log("[CTX " + CTX_BUILD + "] " + logLine + " · total " + total);

  // badge: зелёный с числом карточек
  chrome.action.setBadgeText({ text: String(total) });
  chrome.action.setBadgeBackgroundColor({ color: "#3a7d44" });

  // сообщить контенту (CAPTURED) — для NAME_HINT и стекла
  if (tab && tab.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, {
      type: CTX_MSG.CAPTURED,
      payload: { menu: info.menuItemId, id: id, type: type, link: link, page: info.pageUrl || "", db: logLine },
    }).catch(() => {});
  }
});

// NAME_HINT: имя — только если пусто (guard)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === CTX_MSG.NAME_HINT) {
    (async () => {
      const { id, name } = msg.payload || {};
      if (!id || !name) return;
      const db = await CTX_STORAGE.loadDb();
      const cardId = "ok-" + normId(id);
      const card = Array.isArray(db.cards)
        ? db.cards.find((c) => c && c.cardId === cardId)
        : db.cards[cardId];
      if (!card) return;
      let changed = false;
      if (!card.identities) card.identities = {};
      if (!card.identities.name) { card.identities.name = name; changed = true; }
      if (!card.displayName) { card.displayName = name; changed = true; }
      if (changed) {
        await CTX_STORAGE.saveDb(db);
        console.log("[CTX " + CTX_BUILD + "] имя сохранено: " + cardId + " -> " + name);
      } else {
        console.log("[CTX " + CTX_BUILD + "] имя НЕ тронуто: " + cardId + " (уже задано)");
      }
    })();
    return false;
  }
  // BADGE / LOG из ядра — прокинуть (если layer шлёт)
  if (msg && msg.type === CTX_MSG.BADGE) {
    const p = msg.payload || {};
    const tabId = sender.tab ? sender.tab.id : undefined;
    if (p.state === "ready") {
      chrome.action.setBadgeText({ text: String(p.count || 0), tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#3a7d44", tabId: tabId });
    }
    return false;
  }
  if (msg && msg.type === CTX_MSG.LOG) {
    console.log("[CTX " + CTX_BUILD + "] " + ((msg.payload && msg.payload.text) || ""));
    return false;
  }
  return false;
});
'@
Write-Adapted "EdgeExtension/src/background.js" $backgroundOk

# ============================================================
# 3. RunEdgeCdp.ps1 -> scripts/ (ок-профили, порты 9222-9226)
# ============================================================
Write-Host "== 3. RunEdgeCdp.ps1 (ок-профили) =="
$runEdgeOk = @'
# RunEdgeCdp.ps1 — запуск Edge c --remote-debugging-port для тестов ok.ru (TASK-0154).
# Ок-профили: .edge_test_s_admin | admin | moderator | editor | user_01, порты 9222-9226.
# Происхождение: m3 (TASK-0100) <- context-vkru (TASK-0002). Provenance — в отчёте.
#
# Запуск:
#   pwsh scripts/RunEdgeCdp.ps1                    # по умолчанию: user_01, порт 9226
#   pwsh scripts/RunEdgeCdp.ps1 -Profile s_admin   # порт 9222
#
param(
    [ValidateSet("s_admin","admin","moderator","editor","user_01")]
    [string]$Profile = "user_01"
)

$ports = @{
    "s_admin"   = 9222
    "admin"     = 9223
    "moderator" = 9224
    "editor"    = 9225
    "user_01"   = 9226
}
$port = $ports[$Profile]
$profDir = Join-Path $PSScriptRoot ".edge_test_$Profile"

$edge = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edge) { Write-Error "Edge не найден"; exit 1 }

if (-not (Test-Path $profDir)) { New-Item -ItemType Directory -Force -Path $profDir | Out-Null }

Write-Host "Edge + CDP: профиль .$Profile -> порт $port" -ForegroundColor Cyan
Start-Process $edge -ArgumentList @(
    "--remote-debugging-port=$port",
    "--user-data-dir=$profDir",
    "https://ok.ru"
)
Write-Host "CDP: http://127.0.0.1:$port  (профиль: $profDir)" -ForegroundColor Green
'@
Write-Adapted "scripts/RunEdgeCdp.ps1" $runEdgeOk

# ============================================================
# 4. docs/TEST_PROTOCOL.md
# ============================================================
Write-Host "== 4. docs/TEST_PROTOCOL.md =="
$testProtocol = @'
# TEST_PROTOCOL.md — приёмка EdgeExtension на ok.ru (TASK-0154)

Ядро v07g — от донора context-vkru (provenance). Адаптированы ТОЛЬКО
manifest.json, content.js, background.js. VK-вариант у донора НЕ тронут.

## 1. Предусловия
- Edge, режим разработчика (edge://extensions), «Загрузить распакованное» ->
  mem-OK/EdgeExtension.
- Версия в карточке: 0.1.0 («Записки ОК»). Ошибок нет.

## 2. ПКМ «Записка: ПЕР/СОО» (ok.ru)
1. Открыть https://ok.ru, найти ссылку на профиль (ok.ru/profile/N) или группу
   (ok.ru/group/N).
2. ПКМ на ссылке -> в меню «Записка: ПЕР» и «Записка: СОО».
3. Клик «Записка: ПЕР» -> SW-консоль: «записка в картотеке: ok-profile:N (PERSON) · total 1».
4. Клик «Записка: СОО» на группе -> «записка в картотеке: ok-group:N (COMMUNITY)».
5. Повтор на той же ссылке -> «уже в картотеке: ok-profile:N» (дедуп, total не растёт).
6. ПКМ по пустому месту -> пунктов «Записка» НЕТ.

## 3. База (единственный писатель)
- Карточка создана: portal=ok, identities.id, status=draft, history[1].
- Повторная запись обновляет updated_at + history (НЕ создаёт дубль).

## 4. NAME_HINT + badge
- Если у карточки пустое имя — имя берётся из первого якоря («имя сохранено»).
- Если имя задано — «имя НЕ тронуто (уже задано)».
- badge на значке: зелёный с числом карточек.

## 5. НЕ тронуты
- Ядро v07g (messaging/normalize/storage/kartoteka) — SHA256 совпадает с донором.
- VK-вариант в context-vkru — без изменений.

## 6. RunEdgeCdp (ок-профили)
- pwsh scripts/RunEdgeCdp.ps1 -Profile s_admin -> порт 9222, профиль .edge_test_s_admin.
- Порты: s_admin 9222, admin 9223, moderator 9224, editor 9225, user_01 9226.
'@
Write-New "docs/TEST_PROTOCOL.md" $testProtocol

# ============================================================
# 5. ОТЧЁТ: provenance + цепочка TASK-0002 -> TASK-0100 -> TASK-0154
# ============================================================
$report = New-Object System.Text.StringBuilder
[void]$report.AppendLine("# ОТЧЁТ TASK-0154 — EdgeExtension от донора (provenance) + адаптация ok.ru")
[void]$report.AppendLine("")
[void]$report.AppendLine("Дата: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
[void]$report.AppendLine("Доноры: ``$DonorsRoot`` · Цель: ``$TargetRoot``")
[void]$report.AppendLine("")
[void]$report.AppendLine("## Provenance-цепочка")
[void]$report.AppendLine("")
[void]$report.AppendLine("TASK-0002 (context-vkru: RunEdgeCdp/CDP 9222) -> TASK-0100 (m3: каркас) -> TASK-0154 (mem-OK: ок-адаптация).")
[void]$report.AppendLine("")
[void]$report.AppendLine("## Скопировано КАК ЕСТЬ из context-vkru (ядро v07g, SHA256)")
[void]$report.AppendLine("")
[void]$report.AppendLine("| Файл | SHA256 |")
[void]$report.AppendLine("|------|--------|")
foreach ($c in $copied) { [void]$report.AppendLine("| ``$($c.File)`` | ``$($c.SHA256)`` |") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## Адаптировано под ok.ru (заменено)")
[void]$report.AppendLine("")
foreach ($a in $adapted) { [void]$report.AppendLine("- ``$a``") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## Создано")
[void]$report.AppendLine("")
foreach ($n in $created) { [void]$report.AppendLine("- ``$n``") }
[void]$report.AppendLine("")
[void]$report.AppendLine("## НЕ тронуты")
[void]$report.AppendLine("")
[void]$report.AppendLine("- Ядро v07g (messaging, normalize, storage, ui/kartoteka) — единственный писатель, NAME_HINT, badge.")
[void]$report.AppendLine("- VK-вариант у донора context-vkru.")
[void]$report.AppendLine("")
[void]$report.AppendLine("## НЕ включено")
[void]$report.AppendLine("")
[void]$report.AppendLine("- журналы-копии строительства, контур джунов, GRANT, эксплуатационный дашборд.")

New-Dir (Join-Path $TargetRoot "reports")
$repPath = Join-Path $TargetRoot "reports/assemble-edgeextension.md"
Set-Content -LiteralPath $repPath -Value $report.ToString() -Encoding utf8

Write-Host ""
Write-Host ($report.ToString())
Write-Host "Отчёт: $repPath" -ForegroundColor Green
Write-Host "EdgeExtension (ok.ru) собран: $TargetRoot" -ForegroundColor Green
