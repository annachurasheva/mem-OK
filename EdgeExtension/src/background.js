/* mem-OK · src/background.js · ok.ru-адаптация (TASK-0154).
 * ПКМ «Записка: ПЕР/СОО» на ok.ru -> картотека -> запись в базу.
 * Ядро v07g (messaging, normalize, storage) — от донора, НЕ трогать.
 * Единственный писатель: loadDb -> mutate -> saveDb. NAME_HINT, badge — сохранены.
 */
importScripts("./core/messaging.js");
importScripts("./core/normalize.js");
importScripts("./core/storage.js");
importScripts("./core/slonstore.js"); // TASK-0173 слон
importScripts("./slonbg.js"); // TASK-0173 слон
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