// FactCheck Pro - Enhanced Background Script

class FactCheckProBackground {
  constructor() {
    this.initializeExtension();
  }

  initializeExtension() {
    // Extension installation and updates
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Context menu handling
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenu(info, tab);
    });

    // Message handling between components
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Tab updates for content script injection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Keyboard shortcut handling
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  async handleInstallation(details) {
    console.log('FactCheck Pro installation:', details.reason);

    // Create context menus
    await this.createContextMenus();

    // Set default settings
    if (details.reason === 'install') {
      await this.setDefaultSettings();
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      this.showUpdateNotification();
    }
  }

  async createContextMenus() {
    // Remove existing menus
    await chrome.contextMenus.removeAll();

    // Main fact-check menu
    chrome.contextMenus.create({
      id: 'factCheck',
      title: '🔍 Fact Check with AI',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    // Quick analysis submenu
    chrome.contextMenus.create({
      id: 'quickAnalysis',
      title: '⚡ Quick Analysis',
      parentId: 'factCheck',
      contexts: ['selection']
    });

    // Deep analysis submenu
    chrome.contextMenus.create({
      id: 'deepAnalysis',
      title: '🔬 Deep Analysis',
      parentId: 'factCheck',
      contexts: ['selection']
    });

    // Source verification submenu
    chrome.contextMenus.create({
      id: 'sourceVerification',
      title: '📚 Verify Sources',
      parentId: 'factCheck',
      contexts: ['selection']
    });

    // Page analysis menu
    chrome.contextMenus.create({
      id: 'analyzePage',
      title: '📄 Analyze This Page',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  }

  async setDefaultSettings() {
    const defaultSettings = {
      geminiApiKey: '',
      factCheckApiKey: '',
      enableNotifications: true,
      credibilityThreshold: 70,
      autoFactCheck: false,
      analysisDepth: 'standard',
      enablePageAnalysis: true,
      saveHistory: true,
      maxHistoryItems: 100,
      enableKeyboardShortcuts: true,
      theme: 'auto'
    };

    await chrome.storage.sync.set({ settings: defaultSettings });
  }

  async handleContextMenu(info, tab) {
    const { menuItemId, selectionText, pageUrl } = info;

    try {
      switch (menuItemId) {
        case 'quickAnalysis':
          await this.performFactCheck(selectionText, 'quick', tab);
          break;
        case 'deepAnalysis':
          await this.performFactCheck(selectionText, 'deep', tab);
          break;
        case 'sourceVerification':
          await this.performFactCheck(selectionText, 'sources', tab);
          break;
        case 'analyzePage':
          await this.performPageAnalysis(pageUrl, tab);
          break;
        default:
          await this.performFactCheck(selectionText, 'standard', tab);
      }
    } catch (error) {
      console.error('Context menu error:', error);
      this.showErrorNotification('Failed to perform analysis');
    }
  }

  async performFactCheck(text, analysisType = 'standard', tab) {
    if (!text || text.trim().length === 0) {
      this.showErrorNotification('No text selected for fact-checking');
      return;
    }

    // Store the text and analysis type
    await chrome.storage.local.set({
      factCheckText: text.trim(),
      analysisType: analysisType,
      sourceTab: {
        id: tab.id,
        url: tab.url,
        title: tab.title
      }
    });

    // Open popup window
    await this.openFactCheckWindow();

    // Highlight selected text in the page
    this.highlightTextInPage(tab.id, text);
  }

  async performPageAnalysis(pageUrl, tab) {
    try {
      // Extract page content
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.extractPageContent
      });

      if (result && result.result) {
        const pageContent = result.result;
        await this.performFactCheck(pageContent.summary, 'page', tab);
      }
    } catch (error) {
      console.error('Page analysis error:', error);
      this.showErrorNotification('Failed to analyze page content');
    }
  }

  // Function to inject into page for content extraction
  extractPageContent() {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    // Extract main content
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.article-content',
      '.post-content',
      '#content'
    ];

    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.innerText.slice(0, 1000); // Limit content
        break;
      }
    }

    // Fallback to body content
    if (!mainContent) {
      mainContent = document.body.innerText.slice(0, 1000);
    }

    return {
      title,
      description: metaDescription,
      summary: `${title}\n\n${metaDescription}\n\n${mainContent}`.trim(),
      url: window.location.href
    };
  }

  async openFactCheckWindow() {
    // Check if popup window already exists
    const windows = await chrome.windows.getAll({ type: 'popup' });
    const existingWindow = windows.find(w => w.type === 'popup');

    if (existingWindow) {
      // Focus existing window
      await chrome.windows.update(existingWindow.id, { focused: true });
    } else {
      // Create new popup window
      await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 440,
        height: 640,
        focused: true
      });
    }
  }

  async highlightTextInPage(tabId, text) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        function: (searchText) => {
          // Remove existing highlights
          document.querySelectorAll('.factcheck-highlight').forEach(el => {
            el.outerHTML = el.innerHTML;
          });

          // Add new highlight
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );

          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent.includes(searchText)) {
              textNodes.push(node);
            }
          }

          textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            if (parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
              const highlightedHtml = textNode.textContent.replace(
                new RegExp(`(${searchText})`, 'gi'),
                '<span class="factcheck-highlight" style="background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%); padding: 2px 4px; border-radius: 3px; font-weight: 500;">$1</span>'
              );
              
              if (highlightedHtml !== textNode.textContent) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = highlightedHtml;
                while (tempDiv.firstChild) {
                  parent.insertBefore(tempDiv.firstChild, textNode);
                }
                parent.removeChild(textNode);
              }
            }
          });

          // Auto-remove highlight after 10 seconds
          setTimeout(() => {
            document.querySelectorAll('.factcheck-highlight').forEach(el => {
              el.outerHTML = el.innerHTML;
            });
          }, 10000);
        },
        args: [text]
      });
    } catch (error) {
      console.error('Error highlighting text:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    const { action, data } = request;

    try {
      switch (action) {
        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, data: settings });
          break;

        case 'saveSettings':
          await chrome.storage.sync.set({ settings: data });
          sendResponse({ success: true });
          break;

        case 'getHistory':
          const history = await this.getHistory();
          sendResponse({ success: true, data: history });
          break;

        case 'clearHistory':
          await chrome.storage.local.remove(['factCheckHistory']);
          sendResponse({ success: true });
          break;

        case 'exportData':
          const exportData = await this.exportUserData();
          sendResponse({ success: true, data: exportData });
          break;

        case 'performAnalysis':
          const result = await this.performBackgroundAnalysis(data);
          sendResponse({ success: true, data: result });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Inject content script when page loads
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
      } catch (error) {
        // Ignore errors for non-injectable pages
        if (!error.message.includes('Cannot access')) {
          console.error('Content script injection error:', error);
        }
      }
    }
  }

  async handleCommand(command) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      switch (command) {
        case 'fact-check-selection':
          await this.getSelectedTextAndAnalyze(activeTab);
          break;
        case 'open-popup':
          await this.openFactCheckWindow();
          break;
        case 'analyze-page':
          await this.performPageAnalysis(activeTab.url, activeTab);
          break;
      }
    } catch (error) {
      console.error('Command handling error:', error);
    }
  }

  async getSelectedTextAndAnalyze(tab) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString().trim()
      });

      if (result && result.result) {
        await this.performFactCheck(result.result, 'standard', tab);
      } else {
        this.showErrorNotification('No text selected');
      }
    } catch (error) {
      console.error('Error getting selected text:', error);
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || {};
  }

  async getHistory() {
    const result = await chrome.storage.local.get(['factCheckHistory']);
    return result.factCheckHistory || [];
  }

  async exportUserData() {
    const [settings, history, savedResults] = await Promise.all([
      chrome.storage.sync.get(['settings']),
      chrome.storage.local.get(['factCheckHistory']),
      chrome.storage.local.get(['savedResults'])
    ]);

    return {
      settings: settings.settings || {},
      history: history.factCheckHistory || [],
      savedResults: savedResults.savedResults || [],
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  showWelcomeNotification() {
    if (chrome.notifications) {
      chrome.notifications.create('welcome', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Welcome to FactCheck Pro!',
        message: 'Right-click on any text to start fact-checking. Configure your API keys in settings for best results.'
      });
    }
  }

  showUpdateNotification() {
    if (chrome.notifications) {
      chrome.notifications.create('update', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'FactCheck Pro Updated!',
        message: 'New features: Enhanced UI, Google Fact Check API integration, and improved analysis.'
      });
    }
  }

  showErrorNotification(message) {
    if (chrome.notifications) {
      chrome.notifications.create('error', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'FactCheck Pro Error',
        message: message
      });
    }
  }
}

// Initialize the background script
new FactCheckProBackground();
