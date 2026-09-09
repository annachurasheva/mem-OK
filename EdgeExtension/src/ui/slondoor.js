/* mem-OK · src/ui/slondoor.js · «слон» (TASK-0173).
 * Дверь: статус + descript (управляющий) + история (координата·время·автор)
 * + действия сменить/скрыть/удалить (с подтверждением) + ранги (открытая структура).
 * Пишет ТОЛЬКО через сообщения в background (единственный писатель). */
(function () {
  "use strict";

  var coord = decodeURIComponent(location.hash.slice(1) || "");
  var state = { status: null, ranks: [] };

  function $(id) { return document.getElementById(id); }
  function send(type, payload) { return chrome.runtime.sendMessage({ type: type, payload: payload }); }

  function fmtTs(ts) {
    var d = new Date(ts);
    function p(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function badgeHtml(st) {
    var rank = null;
    for (var i = 0; i < state.ranks.length; i++) if (state.ranks[i].id === st.rankId) rank = state.ranks[i];
    var name = rank ? rank.rank : (st.rankId == null ? "без ранга" : "ранг #" + st.rankId);
    var bgcolor = rank && rank.bgcolor ? rank.bgcolor : "#8a94a3";
    var fontcolor = rank && rank.fontcolor ? rank.fontcolor : "#000000";
    return { name: name, bgcolor: bgcolor, fontcolor: fontcolor };
  }

  function render() {
    var st = state.status;
    var cur = $("curStatus");
    var rankSel = $("rankSel");
    var descript = $("descript");
    var hist = $("hist");
    var btnHide = $("btnHide");

    /* текущий статус */
    cur.innerHTML = "";
    if (st) {
      var b = badgeHtml(st);
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.style.background = b.bgcolor;
      badge.style.color = b.fontcolor;
      badge.textContent = b.name;
      cur.appendChild(badge);
      if (st.hidden) {
        var h = document.createElement("span");
        h.className = "flag";
        h.textContent = "скрыт";
        cur.appendChild(h);
      }
      descript.value = st.descript || "";
      btnHide.textContent = st.hidden ? "Показать" : "Скрыть";
    } else {
      cur.innerHTML = '<span class="none">статуса нет — выберите ранг и сохраните</span>';
      descript.value = "";
      btnHide.textContent = "Скрыть";
    }

    /* селект рангов */
    rankSel.innerHTML = '<option value="">— без ранга —</option>';
    state.ranks.forEach(function (r) {
      var o = document.createElement("option");
      o.value = String(r.id);
      o.textContent = r.rank;
      if (st && st.rankId === r.id) o.selected = true;
      rankSel.appendChild(o);
    });

    /* история: координата · время · автор · действие (новые сверху) */
    hist.innerHTML = "";
    var hs = (st && st.history) ? st.history.slice().reverse() : [];
    if (!hs.length) {
      hist.innerHTML = '<li class="empty">история пуста</li>';
    } else {
      hs.forEach(function (h) {
        var li = document.createElement("li");
        li.innerHTML = "";
        var c = document.createElement("span"); c.className = "h-coord"; c.textContent = h.coord; li.appendChild(c);
        var t = document.createElement("span"); t.className = "h-ts"; t.textContent = fmtTs(h.ts); li.appendChild(t);
        var a = document.createElement("span"); a.className = "h-author"; a.textContent = h.author; li.appendChild(a);
        var act = document.createElement("span"); act.className = "h-action"; act.textContent = h.action; li.appendChild(act);
        hist.appendChild(li);
      });
    }

    /* ранги — открытая структура */
    var rl = $("rankList");
    rl.innerHTML = "";
    if (!state.ranks.length) {
      rl.innerHTML = '<li class="empty">рангов нет — структура открытая, добавьте первый</li>';
    } else {
      state.ranks.forEach(function (r) {
        var li = document.createElement("li");
        li.className = "rank-row";
        var sw = document.createElement("span"); sw.className = "sw"; sw.style.background = r.bgcolor || "#8a94a3"; li.appendChild(sw);
        var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = r.rank + (r.descript ? " — " + r.descript : ""); li.appendChild(nm);
        var del = document.createElement("button");
        del.className = "mini danger";
        del.type = "button";
        del.textContent = "×";
        del.title = "удалить ранг";
        del.addEventListener("click", function () {
          if (!confirm("Удалить ранг «" + r.rank + "»? Действие явное (No implicit data removal).")) return;
          send("SLON_DEL_RANK", { id: r.id, confirm: true }).then(load);
        });
        li.appendChild(del);
        rl.appendChild(li);
      });
    }
  }

  function load() {
    send("SLON_GET_DOOR", { coord: coord }).then(function (res) {
      state.status = res.status;
      state.ranks = res.ranks || [];
      render();
    });
  }

  $("coordLabel").textContent = coord || "—";

  $("btnSet").addEventListener("click", function () {
    var author = $("author").value.trim();
    if (!author) { alert("Автор занесения обязателен (координата + время + автор)."); return; }
    var rv = $("rankSel").value;
    send("SLON_SET_STATUS", {
      coord: coord,
      author: author,
      rankId: rv === "" ? null : Number(rv),
      descript: $("descript").value,
      hidden: state.status ? !!state.status.hidden : false,
    }).then(function (r) { if (r && r.ok) load(); else alert("Ошибка: " + ((r && r.error) || "неизвестно")); });
  });

  $("btnHide").addEventListener("click", function () {
    var author = $("author").value.trim();
    if (!author) { alert("Автор занесения обязателен."); return; }
    var nh = !(state.status && state.status.hidden);
    send("SLON_HIDE", { coord: coord, author: author, hidden: nh }).then(load);
  });

  $("btnDel").addEventListener("click", function () {
    var author = $("author").value.trim();
    if (!author) { alert("Автор занесения обязателен."); return; }
    if (!confirm("Удалить статус для «" + coord + "» полностью?\nЯвное действие: история будет удалена (No implicit data removal).")) return;
    send("SLON_DELETE", { coord: coord, author: author, confirm: true }).then(function () { window.close(); });
  });

  $("btnAddRank").addEventListener("click", function () {
    var name = $("newRankName").value.trim();
    if (!name) { alert("Имя ранга обязательно."); return; }
    send("SLON_ADD_RANK", {
      rank: name,
      descript: $("newRankDesc").value,
      bgcolor: $("newRankColor").value,
      /* fontcolor/bold/italic — по умолчанию из обработчика (эталонные) */
    }).then(function () {
      $("newRankName").value = "";
      $("newRankDesc").value = "";
      load();
    });
  });

  load();
})();