chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheck",
    title: "Fact Check with Gemini",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const selectedText = results[0].result;
        fetchFactCheck(selectedText);
      }
    });
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}

function fetchFactCheck(text) {
  chrome.storage.local.set({ factCheckText: text }, () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  });
}
