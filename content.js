let dragSrcEl = null;
let saveTimeout;
let hideTimeout;

console.log("Web Dock content script loaded");

function createDock() {
  console.log("Creating dock");
  const dock = document.createElement('div');
  dock.id = 'web-dock';
  dock.innerHTML = `
    <ul id="dock-items"></ul>
    <button id="add-to-dock">+</button>
  `;
  document.body.appendChild(dock);

  // 创建触发区域
  const trigger = document.createElement('div');
  trigger.id = 'web-dock-trigger';
  document.body.appendChild(trigger);

  // 添加鼠标事件监听器
  trigger.addEventListener('mouseenter', showDock);
  dock.addEventListener('mouseleave', () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideDock, 4000);
  });
  
  dock.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });
}

function showDock() {
  const dock = document.getElementById('web-dock');
  dock.classList.add('active');
}

function hideDock() {
  const dock = document.getElementById('web-dock');
  dock.classList.remove('active');
}

function addCurrentPageToDock() {
  const dockItems = document.getElementById('dock-items');
  const newItem = createDockItem(window.location.href, document.title, getFavicon());
  dockItems.appendChild(newItem);
  saveDockItems();
}

function createDockItem(url, title, favicon) {
  const item = document.createElement('li');
  item.draggable = true;
  item.innerHTML = `
    <a href="${encodeURI(url)}">
      <img src="${encodeURI(favicon)}" alt="${title}">
    </a>
    <button class="remove-item">x</button>
  `;
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);
  item.addEventListener('dragend', handleDragEnd);
  item.querySelector('.remove-item').addEventListener('click', removeItem);
  return item;
}

function getFavicon() {
  let favicon;
  try {
    const nodeList = document.getElementsByTagName("link");
    for (let i = 0; i < nodeList.length; i++) {
      if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon")) {
        favicon = nodeList[i].getAttribute("href");
        break;
      }
    }
  } catch (error) {
    console.error("Error getting favicon:", error);
  }
  return favicon || "/favicon.ico";
}

function saveDockItems() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const items = Array.from(document.querySelectorAll('#dock-items li a')).map(a => ({
      url: a.href,
      title: a.querySelector('img').alt,
      favicon: a.querySelector('img').src
    }));
    chrome.storage.sync.set({dockItems: items}, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving dock items:", chrome.runtime.lastError);
      }
    });
  }, 300);
}

function loadDockItems() {
  chrome.storage.sync.get(['dockItems', 'dockStyle'], function(data) {
    const dockItems = document.getElementById('dock-items');
    if (data.dockItems) {
      data.dockItems.forEach(item => {
        const newItem = createDockItem(item.url, item.title, item.favicon);
        dockItems.appendChild(newItem);
      });
    }
    if (data.dockStyle) {
      applyDockStyle(data.dockStyle);
    }
  });
}

function removeItem(e) {
  e.target.closest('li').remove();
  saveDockItems();
}

function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (dragSrcEl != this) {
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/html');
    this.querySelector('.remove-item').addEventListener('click', removeItem);
    dragSrcEl.querySelector('.remove-item').addEventListener('click', removeItem);
  }
  return false;
}

function handleDragEnd() {
  saveDockItems();
}

function applyDockStyle(style) {
  const dock = document.getElementById('web-dock');
  if (dock) {
    dock.style.backgroundColor = style.backgroundColor;
    dock.style.borderRadius = style.borderRadius;
  }
}

function initializeDock() {
  console.log("Initializing dock");
  if (!document.getElementById('web-dock')) {
    createDock();
    loadDockItems();
    document.getElementById('add-to-dock').addEventListener('click', addCurrentPageToDock);

    // 打开新网页后立刻弹出dock栏
    const dock = document.getElementById('web-dock');
    setTimeout(() => {
      showDock();
      // 自动隐藏dock栏
      hideTimeout = setTimeout(hideDock, 4000);
    }, 0);
  }
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        initializeDock();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeDOM);
} else {
  observeDOM();
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.action === "toggleDock") {
      const dock = document.getElementById('web-dock');
      if (dock) {
        dock.style.display = dock.style.display === 'none' ? 'flex' : 'none';
      }
    } else if (request.action === "showDock") {
      initializeDock();
      const dock = document.getElementById('web-dock');
      if (dock) dock.style.display = 'flex';
    }
  }
);
