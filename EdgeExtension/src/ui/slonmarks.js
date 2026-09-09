/**
 * slonmarks.js — content script для отрисовки меток слона на ok.ru
 * Вешается на страницы ok.ru, рисует метки рядом со ссылками на профили/группы
 */

(function() {
  const MARK_CLASS = 'slon-mark';
  const MARK_CONTAINER_CLASS = 'slon-mark-container';

  // Функция получения координаты из ссылки
  function getCoordFromLink(link) {
    try {
      const url = new URL(link.href);
      if (!url.hostname.includes('ok.ru')) return null;

      const pathParts = url.pathname.split('/').filter(p => p);
      if (pathParts[0] === 'profile' || pathParts[0] === 'group') {
        return `${url.origin}/${pathParts[0]}/${pathParts[1]}`;
      }
    } catch (e) {}
    return null;
  }

  // Создание элемента метки
  function createMark(status, ranks) {
    const container = document.createElement('span');
    container.className = MARK_CONTAINER_CLASS;

    const mark = document.createElement('span');
    mark.className = MARK_CLASS;
    mark.title = status.descript || '';

    // Находим ранг по ID
    const rank = ranks.find(r => r.id === parseInt(status.rank));
    if (rank) {
      mark.style.backgroundColor = rank.color;
      mark.textContent = rank.name;
    } else {
      mark.style.backgroundColor = '#ccc';
      mark.textContent = 'Статус';
    }

    mark.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Открываем дверь с существующим статусом
      chrome.runtime.sendMessage({
        action: 'openDoor',
        coord: status.coord,
        time: new Date().toISOString()
      });
    });

    container.appendChild(mark);
    return container;
  }

  // Отрисовка меток на странице
  async function renderMarks() {
    const links = document.querySelectorAll('a[href*="ok.ru/profile"], a[href*="ok.ru/group"]');

    // Получаем все статусы и ранги
    const [statusesResult, ranksResult] = await Promise.all([
      chrome.runtime.sendMessage({ action: 'getAllStatuses' }),
      chrome.runtime.sendMessage({ action: 'getRanks' })
    ]);

    const statuses = statusesResult?.statuses || {};
    const ranks = ranksResult?.ranks || [];

    // Очищаем старые метки
    document.querySelectorAll(`.${MARK_CONTAINER_CLASS}`).forEach(el => el.remove());

    // Добавляем метки к ссылкам
    links.forEach(link => {
      const coord = getCoordFromLink(link);
      if (!coord) return;

      const status = statuses[coord];
      if (status) {
        const mark = createMark(status, ranks);
        link.parentNode.insertBefore(mark, link.nextSibling);
      }
    });
  }

  // Слушаем изменения статуса и хранилища
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'statusChanged' || message.action === 'storageChanged') {
      renderMarks();
    }
    if (message.action === 'openDoor') {
      openDoor(message.coord, message.time);
    }
  });

  // Функция открытия двери
  function openDoor(coord, time) {
    const url = chrome.runtime.getURL('ui/door.html') +
      `?coord=${encodeURIComponent(coord)}&time=${encodeURIComponent(time)}`;
    chrome.runtime.sendMessage({ action: 'createTab', url });
  }

  // Запуск при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMarks);
  } else {
    renderMarks();
  }
})();
