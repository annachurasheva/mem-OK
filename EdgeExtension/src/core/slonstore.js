/* mem-OK · src/core/slonstore.js · «слон» (TASK-0173).
 * Хранилище рангов и статусов. Ключ "ctxslon".
 * ranks — открытая структура (управляющий добавляет/меняет; число и поля
 * не ограничены). Начальные 9 градаций перенесены ДОСЛОВНО из эталона
 * dmiandr/context (defaultranks, chrome/background.js) — LLM не добавляет.
 * Запись — ТОЛЬКО из background (единственный писатель, ядро v07g). */
(function () {
  "use strict";
  var KEY = "ctxslon";

  /* Начальные ранги — дословно из dmiandr/context (TASK-0173, п.1,5). */
  function defaultRanks() {
    return [
      {id: 0, rank: "Не читать", descript: "", bgcolor: "#FF0000", fontcolor: "#000000", bold: false, italic: false},
      {id: 1, rank: "Не комментировать", descript: "", bgcolor: "#FFB6B6", fontcolor: "#000000", bold: false, italic: false},
      {id: 2, rank: "Хам", descript: "Может сорваться на хамство без видимого повода", bgcolor: "#d3d52b", fontcolor: "#000000", bold: false, italic: false},
      {id: 3, rank: "Обидчивый", descript: "Оскорбляется на любую нейтральную реплику, в которой ему чудится несогласие", bgcolor: "#9587ff", fontcolor: "#000000", bold: false, italic: false},
      {id: 4, rank: "Религиозный", descript: "Тему религии не поднимать", bgcolor: "#a6a6a6", fontcolor: "#000000", bold: false, italic: false},
      {id: 5, rank: "Упертый", descript: "Излагать мысли краткими фразами, без отступлений, не давать возможности заболтать", bgcolor: "#290cff", fontcolor: "#ffffff", bold: false, italic: false},
      {id: 6, rank: "Не закончен разговор", descript: "Не начинать новых дискуссий пока не выполнены обещания по старым", bgcolor: "#29ffff", fontcolor: "#000000", bold: false, italic: false},
      {id: 7, rank: "Хороший собеседник", descript: "Не значит, что он со мной согласен, значит что он умеет беседовать содержательно, без демагогии", bgcolor: "#29ff1b", fontcolor: "#000000", bold: false, italic: false},
      {id: 8, rank: "Читать", descript: "", bgcolor: "#17760f", fontcolor: "#ffffff", bold: false, italic: false}
    ];
  }

  function defaultSlon() {
    return { version: 1, ranks: defaultRanks(), statuses: {} };
  }

  function loadSlon() {
    return chrome.storage.local.get(KEY).then(function (res) {
      var d = res ? res[KEY] : null;
      if (!d || !Array.isArray(d.ranks) || !d.statuses || typeof d.statuses !== "object") {
        return defaultSlon();
      }
      return d;
    });
  }

  function saveSlon(db) {
    var o = {};
    o[KEY] = db;
    return chrome.storage.local.set(o);
  }

  globalThis.CTX_SLONSTORE = Object.freeze({
    KEY: KEY,
    loadSlon: loadSlon,
    saveSlon: saveSlon,
    defaultSlon: defaultSlon,
  });
})();