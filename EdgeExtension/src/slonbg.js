/* mem-OK · src/slonbg.js · «слон» (TASK-0173).
 * Фоновая логика слона: единственный писатель ctxslon.
 * Подключается из background.js через importScripts (общая область видимости,
 * поэтому доступна okId() из background.js внутри обработчиков). */
if (typeof CTX_SLONSTORE === "undefined") importScripts("./core/slonstore.js");

/* --- контекстное меню «Слон: статус…» — вход в дверь для любой координаты --- */
function ensureSlonMenu() {
  chrome.contextMenus.remove("slon-door", function () {
    void chrome.runtime.lastError; /* подавить «не найдено» при первом запуске */
    chrome.contextMenus.create({ id: "slon-door", title: "Слон: статус…", contexts: ["link"] });
  });
}
ensureSlonMenu(); /* при каждом старте SW (меню переживает перезапуск) */

function openSlonDoor(coord) {
  chrome.windows.create({
    url: chrome.runtime.getURL("ui/door.html") + "#" + encodeURIComponent(coord),
    type: "popup",
    width: 480,
    height: 640,
    focused: true,
  });
}

/* --- обработчик сообщений слона (асинхронный, единственный писатель) --- */
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || typeof msg.type !== "string" || msg.type.indexOf("SLON_") !== 0) return false;

  (async function () {
    var db = await CTX_SLONSTORE.loadSlon();
    var p = msg.payload || {};
    var out = null;

    switch (msg.type) {
      case "SLON_GET_STATUSES": {
        var res = {};
        (p.coords || []).forEach(function (coord) {
          var st = db.statuses[coord];
          if (!st) return;
          var rank = null;
          for (var i = 0; i < db.ranks.length; i++) {
            if (db.ranks[i].id === st.rankId) { rank = db.ranks[i]; break; }
          }
          res[coord] = {
            coord: coord,
            rankId: st.rankId == null ? null : st.rankId,
            rankName: rank ? rank.rank : "",
            bgcolor: rank && rank.bgcolor ? rank.bgcolor : "",
            fontcolor: rank && rank.fontcolor ? rank.fontcolor : "",
            descript: st.descript || "",
            hidden: !!st.hidden,
          };
        });
        out = res;
        break;
      }

      case "SLON_GET_DOOR": {
        out = { coord: p.coord, status: db.statuses[p.coord] || null, ranks: db.ranks };
        break;
      }

      case "SLON_SET_STATUS": {
        /* координата + время + автор — обязательны */
        if (!p.coord || !p.author) { out = { ok: false, error: "нужны координата и автор" }; break; }
        var st = db.statuses[p.coord] || { coord: p.coord, history: [] };
        st.rankId = (p.rankId === undefined || p.rankId === null || p.rankId === "") ? null : p.rankId;
        st.descript = (p.descript === undefined) ? (st.descript || "") : p.descript; /* descript пишет управляющий */
        st.hidden = !!p.hidden;
        st.history = st.history || [];
        st.history.push({ coord: p.coord, ts: Date.now(), author: p.author, action: "setstatus", rankId: st.rankId });
        db.statuses[p.coord] = st;
        await CTX_SLONSTORE.saveSlon(db);
        out = { ok: true, coord: p.coord, total: Object.keys(db.statuses).length };
        break;
      }

      case "SLON_HIDE": {
        if (!p.coord || !p.author) { out = { ok: false, error: "нужны координата и автор" }; break; }
        var st2 = db.statuses[p.coord];
        if (!st2) { out = { ok: false, error: "нет статуса" }; break; }
        st2.hidden = !!p.hidden;
        st2.history = st2.history || [];
        st2.history.push({ coord: p.coord, ts: Date.now(), author: p.author, action: p.hidden ? "hide" : "unhide" });
        await CTX_SLONSTORE.saveSlon(db);
        out = { ok: true, hidden: st2.hidden };
        break;
      }

      case "SLON_DELETE": {
        /* No implicit data removal: только явное подтверждение */
        if (!p.coord || !p.author || p.confirm !== true) { out = { ok: false, error: "нужно явное подтверждение" }; break; }
        delete db.statuses[p.coord];
        await CTX_SLONSTORE.saveSlon(db);
        out = { ok: true };
        break;
      }

      case "SLON_LIST_RANKS": { out = db.ranks; break; }

      case "SLON_ADD_RANK": {
        /* ranks — открытая структура: поля по эталону (rank/descript/bgcolor/fontcolor/
           bold/italic), id авто; descript пишет управляющий. Доп. поля — через extra. */
        if (!p.rank) { out = { ok: false, error: "нужно имя ранга" }; break; }
        var maxId = 0;
        db.ranks.forEach(function (r) { if ((r.id || 0) > maxId) maxId = r.id; });
        var rank = {
          id: maxId + 1,
          rank: p.rank,
          descript: p.descript || "",
          bgcolor: p.bgcolor || "#8a94a3",
          fontcolor: p.fontcolor || "#000000",
          bold: !!p.bold,
          italic: !!p.italic,
        };
        if (p.extra && typeof p.extra === "object") {
          Object.keys(p.extra).forEach(function (k) { rank[k] = p.extra[k]; });
        }
        db.ranks.push(rank);
        await CTX_SLONSTORE.saveSlon(db);
        out = { ok: true, rank: rank };
        break;
      }

      case "SLON_DEL_RANK": {
        if (p.confirm !== true) { out = { ok: false, error: "нужно подтверждение" }; break; }
        db.ranks = db.ranks.filter(function (r) { return r.id !== p.id; });
        await CTX_SLONSTORE.saveSlon(db);
        out = { ok: true };
        break;
      }

      case "SLON_OPEN_DOOR": {
        if (p.coord) openSlonDoor(p.coord);
        out = { ok: true };
        break;
      }

      default:
        out = { ok: false, error: "неизвестный тип: " + msg.type };
    }
    sendResponse(out);
  })();

  return true; /* асинхронный ответ */
});

/* --- клик «Слон: статус…» по ссылке → дверь --- */
chrome.contextMenus.onClicked.addListener(function (info) {
  if (info.menuItemId !== "slon-door") return;
  /* okId() определена в background.js (общая область видимости importScripts) */
  var coord = (typeof okId === "function") ? okId(info.linkUrl || "").id : "";
  if (coord) openSlonDoor(coord);
});