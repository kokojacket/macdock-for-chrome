chrome.runtime.onInstalled.addListener(function() {
  console.log("Web Dock插件已安装");
  chrome.storage.sync.set({
    dockStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '10px 10px 0 0'
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {action: "showDock"});
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: "toggleDock"});
});