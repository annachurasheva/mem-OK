/**
 * slondoor.js — логика окна двери (door.html)
 * Автозахват контекста, автозаполнение координаты и времени, бинарный выбор
 */

(function() {
  let currentCoord = '';
  let currentTime = '';
  let existingStatus = null;
  let ranks = [];

  // Парсинг параметров из URL
  function parseParams() {
    const params = new URLSearchParams(window.location.search);
    currentCoord = params.get('coord') || '';
    currentTime = params.get('time') || '';
  }

  // Автозахват координаты из текущей вкладки (если вызов из background)
  async function autoCaptureContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('ok.ru')) {
        const urlObj = new URL(tab.url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts[0] === 'profile' || pathParts[0] === 'group') {
          currentCoord = `${urlObj.origin}/${pathParts[0]}/${pathParts[1]}`;
          currentTime = new Date().toISOString();
        }
      }
    } catch (e) {
      // Если не удалось получить вкладку, используем параметры из URL
    }
  }

  // Загрузка рангов
  async function loadRanks() {
    const result = await chrome.runtime.sendMessage({ action: 'getRanks' });
    ranks = result?.ranks || [];
    return ranks;
  }

  // Загрузка существующего статуса
  async function loadExistingStatus() {
    if (!currentCoord) return null;
    const result = await chrome.runtime.sendMessage({ action: 'getStatus', coord: currentCoord });
    return result?.status || null;
  }

  // Заполнение формы
  async function populateForm() {
    const coordInput = document.getElementById('coord');
    const timeInput = document.getElementById('time');
    const authorInput = document.getElementById('author');
    const rankSelect = document.getElementById('rank');
    const descriptTextarea = document.getElementById('descript');

    // Автозаполнение координаты и времени (СТРОГО по ТЗ)
    if (coordInput) coordInput.value = currentCoord;
    if (timeInput) timeInput.value = currentTime;

    // Заполнение автора из существующего статуса или пусто
    if (authorInput) {
      authorInput.value = existingStatus?.author || '';
    }

    // Заполнение ранга
    if (rankSelect) {
      rankSelect.innerHTML = '';
      ranks.forEach(rank => {
        const option = document.createElement('option');
        option.value = rank.id;
        option.textContent = `${rank.id} «${rank.name}»`;
        if (existingStatus && parseInt(existingStatus.rank) === rank.id) {
          option.selected = true;
        }
        rankSelect.appendChild(option);
      });
    }

    // Поле descript — СТРОГО ПУСТОЕ при новой записи (ТЗ)
    if (descriptTextarea) {
      descriptTextarea.value = existingStatus?.descript || '';
      // Никаких placeholder с текстами
      descriptTextarea.placeholder = '';
    }

    // Режим редактирования vs создания
    const modeLabel = document.getElementById('mode-label');
    if (modeLabel) {
      modeLabel.textContent = existingStatus ? 'Режим: Редактирование' : 'Режим: Создание';
    }

    // История (если есть)
    const historyContainer = document.getElementById('history');
    if (historyContainer && existingStatus?.history) {
      historyContainer.innerHTML = '';
      existingStatus.history.forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'history-entry';
        div.textContent = `${entry.time} — Автор: ${entry.author}, Ранг: ${entry.rank}`;
        historyContainer.appendChild(div);
      });
    }
  }

  // Сохранение статуса
  async function saveStatus() {
    const authorInput = document.getElementById('author');
    const rankSelect = document.getElementById('rank');
    const descriptTextarea = document.getElementById('descript');

    const author = authorInput?.value?.trim();
    const rank = rankSelect?.value;
    const descript = descriptTextarea?.value || '';

    if (!author) {
      alert('Автор обязателен для заполнения');
      return;
    }

    if (!rank) {
      alert('Выберите ранг');
      return;
    }

    await chrome.runtime.sendMessage({
      action: 'setStatus',
      coord: currentCoord,
      time: currentTime,
      author: author,
      rank: rank,
      descript: descript
    });

    // Закрываем окно после сохранения
    window.close();
  }

  // Сброс (отмена без записи)
  function resetForm() {
    window.close();
  }

  // Инициализация
  async function init() {
    parseParams();
    await autoCaptureContext();
    await loadRanks();
    existingStatus = await loadExistingStatus();
    await populateForm();

    // Навешиваем обработчики
    document.getElementById('save-btn')?.addEventListener('click', saveStatus);
    document.getElementById('reset-btn')?.addEventListener('click', resetForm);
  }

  // Запуск
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
