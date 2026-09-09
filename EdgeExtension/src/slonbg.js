/**
 * slonbg.js — background service worker для слона
 * Обработчики: contextMenus, storage onChanged, сообщения от content
 */

importScripts('core/slonstore.js');

// Создание контекстного меню
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'slon-status',
    title: 'Слон: статус...',
    contexts: ['link']
  });
});

// Клик по пункту меню → открытие двери
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'slon-status') {
    // Автозахват координаты из URL ссылки
    const linkUrl = info.linkUrl || info.pageUrl;
    const time = new Date().toISOString();

    // Парсинг координаты из URL ok.ru
    let coord = linkUrl;
    try {
      const urlObj = new URL(linkUrl);
      if (urlObj.hostname.includes('ok.ru')) {
        // Для профиля: https://ok.ru/profile/123456
        // Для группы: https://ok.ru/group/123456
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts[0] === 'profile' || pathParts[0] === 'group') {
          coord = `${urlObj.origin}/${pathParts[0]}/${pathParts[1]}`;
        }
      }
    } catch (e) {
      // Если не удалось распарсить, оставляем как есть
    }

    // Открываем дверь с автозаполненными координатой и временем
    chrome.runtime.sendMessage({
      action: 'openDoor',
      coord: coord,
      time: time,
      tabId: tab.id
    });
  }
});

// Обработка сообщений от content scripts и popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    CTX_SLON.getStatus(message.coord).then(status => {
      sendResponse({ status });
    });
    return true;
  }

  if (message.action === 'setStatus') {
    CTX_SLON.setStatus(
      message.coord,
      message.time,
      message.author,
      message.rank,
      message.descript
    ).then(status => {
      sendResponse({ status });
      // Уведомляем все вкладки об изменении
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'statusChanged' }).catch(() => {});
        });
      });
    });
    return true;
  }

  if (message.action === 'deleteStatus') {
    CTX_SLON.deleteStatus(message.coord).then(() => {
      sendResponse({ success: true });
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'statusChanged' }).catch(() => {});
        });
      });
    });
    return true;
  }

  if (message.action === 'getRanks') {
    CTX_SLON.getRanks().then(ranks => {
      sendResponse({ ranks });
    });
    return true;
  }

  if (message.action === 'getAllStatuses') {
    CTX_SLON.getAllStatuses().then(statuses => {
      sendResponse({ statuses });
    });
    return true;
  }

  if (message.action === 'openDoor') {
    // Пересылаем команду на открытие двери в content script
    chrome.tabs.sendMessage(message.tabId, {
      action: 'openDoor',
      coord: message.coord,
      time: message.time
    }).catch(() => {
      // Если content script не активен, открываем door.html напрямую
      const url = chrome.runtime.getURL('ui/door.html') + `?coord=${encodeURIComponent(message.coord)}&time=${encodeURIComponent(message.time)}`;
      chrome.tabs.create({ url });
    });
    sendResponse({ success: true });
    return true;
  }
});

// Слушаем изменения хранилища для перерисовки меток
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[CTX_STORAGE_KEY]) {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'storageChanged' }).catch(() => {});
      });
    });
  }
});
