/* mem-OK · src/ui/slonmarks.js · «слон» (TASK-0173).
 * Метки слона на ok.ru: контент собирает видимые координаты, background
 * возвращает статусы, метки рисуются на своём стекле (персистентность).
 * Метка кликабельна → дверь. Самозапускается (подключается манифестом). */
(function () {
  "use strict";
  if (!(location.host === "ok.ru" || location.host.endsWith(".ok.ru"))) return;
  if (globalThis.CTX_SLON_MARKS) return; /* уже инициализирован */

  var glass = null;
  var timer = 0;
  var SLON_KEY = (typeof CTX_SLONSTORE !== "undefined") ? CTX_SLONSTORE.KEY : "ctxslon";

  /* ок-координата из ссылки (та же схема, что в content.js) */
  function coordOf(link) {
    try {
      var u = new URL(link);
      var m = u.pathname.match(/^\/(profile|group)\/(\d+)/);
      if (m) return m[1] + ":" + m[2];
      return u.pathname;
    } catch (e) { return link; }
  }

  function ensureGlass() {
    if (glass && document.body.contains(glass)) return glass;
    glass = document.createElement("div");
    glass.id = "ctx-slon";
    glass.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147482999;overflow:hidden;";
    document.body.appendChild(glass);
    return glass;
  }

  function collectCoords() {
    var coords = [];
    var seen = {};
    document.querySelectorAll("a[href]").forEach(function (a) {
      if (!a.textContent || !a.textContent.trim()) return;
      var href = a.getAttribute("href");
      if (!href) return;
      var abs;
      try { abs = new URL(href, location.origin).href; } catch (e) { return; }
      var c = coordOf(abs);
      if (!c || seen[c]) return;
      seen[c] = true;
      coords.push(c);
    });
    return coords;
  }

  function draw(statuses) {
    var g = ensureGlass();
    g.replaceChildren();
    if (!statuses) return;
    var marked = 0;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var abs;
      try { abs = new URL(href, location.origin).href; } catch (e) { return; }
      var c = coordOf(abs);
      var st = c ? statuses[c] : null;
      if (!st || st.hidden) return;
      var r = a.getBoundingClientRect();
      if (r.width === 0) return;
      var mk = document.createElement("span");
      mk.textContent = st.rankName ? st.rankName : "●";
      mk.title = "Слон: " + st.coord + (st.descript ? " — " + st.descript : "");
      mk.style.cssText = "position:absolute;pointer-events:auto;cursor:pointer;" +
        "left:" + (r.right + 4) + "px;top:" + (r.top - 1) + "px;" +
        "background:" + (st.bgcolor || "#8a94a3") + ";color:" + (st.fontcolor || "#000000") + ";" +
        "font:600 10px/1.4 'Golos Text',sans-serif;" +
        "padding:1px 6px;border-radius:9px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3);";
      mk.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: "SLON_OPEN_DOOR", payload: { coord: st.coord } }).catch(function () {});
      });
      g.appendChild(mk);
      marked++;
    });
    console.log("[CTX слон] marked " + marked);
  }

  function rescan() {
    var coords = collectCoords();
    if (!coords.length) {
      if (glass) glass.replaceChildren();
      return;
    }
    chrome.runtime.sendMessage({ type: "SLON_GET_STATUSES", payload: { coords: coords } })
      .then(function (sts) { draw(sts || {}); })
      .catch(function () {});
  }

  /* триггеры перерисовки */
  var obs = new MutationObserver(function () {
    clearTimeout(timer);
    timer = setTimeout(rescan, 600);
  });
  obs.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(rescan, 300); });
  window.addEventListener("scroll", function () { clearTimeout(timer); timer = setTimeout(rescan, 300); }, { passive: true });
  setInterval(rescan, 2000); /* спокойный интервал */

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes[SLON_KEY]) {
      clearTimeout(timer);
      timer = setTimeout(rescan, 120); /* дверь сохранила — метки обновятся без F5 */
    }
  });

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === "SLON_RESCAN") {
      clearTimeout(timer);
      timer = setTimeout(rescan, 120);
    }
  });

  globalThis.CTX_SLON_MARKS = { rescan: rescan };
  rescan();
})();