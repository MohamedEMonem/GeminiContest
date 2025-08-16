// FactCheck Pro - Options Page Script

class FactCheckProOptions {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
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
      theme: 'auto',
      showInlineResults: true,
      highlightDuration: 15
    };
    
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupNavigation();
    this.populateForm();
    this.updateApiStatus();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      this.settings = { ...this.defaultSettings, ...result.settings };
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
      this.showToast('Settings saved successfully!', 'success');
      this.updateSaveStatus('saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  setupEventListeners() {
    // Form inputs
    document.getElementById('geminiApiKey').addEventListener('input', (e) => {
      this.settings.geminiApiKey = e.target.value.trim();
      this.updateApiStatus();
      this.autoSave();
    });

    document.getElementById('factCheckApiKey').addEventListener('input', (e) => {
      this.settings.factCheckApiKey = e.target.value.trim();
      this.updateApiStatus();
      this.autoSave();
    });

    document.getElementById('analysisDepth').addEventListener('change', (e) => {
      this.settings.analysisDepth = e.target.value;
      this.autoSave();
    });

    document.getElementById('credibilityThreshold').addEventListener('input', (e) => {
      this.settings.credibilityThreshold = parseInt(e.target.value);
      document.getElementById('thresholdValue').textContent = e.target.value;
      this.autoSave();
    });

    document.getElementById('highlightDuration').addEventListener('input', (e) => {
      this.settings.highlightDuration = parseInt(e.target.value);
      document.getElementById('highlightValue').textContent = e.target.value;
      this.autoSave();
    });

    document.getElementById('theme').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.autoSave();
    });

    document.getElementById('maxHistoryItems').addEventListener('change', (e) => {
      this.settings.maxHistoryItems = parseInt(e.target.value);
      this.autoSave();
    });

    // Checkboxes
    const checkboxes = [
      'autoFactCheck', 'enablePageAnalysis', 'enableNotifications',
      'saveHistory', 'enableKeyboardShortcuts', 'showInlineResults'
    ];

    checkboxes.forEach(id => {
      document.getElementById(id).addEventListener('change', (e) => {
        this.settings[id] = e.target.checked;
        this.autoSave();
      });
    });

    // Password visibility toggles
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
      btn.addEventListener('click', () => this.togglePasswordVisibility(btn));
    });

    // Action buttons
    document.getElementById('testApisBtn').addEventListener('click', () => this.testApiConnections());
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
    document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetAllBtn').addEventListener('click', () => this.resetAll());
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.settings-section');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const sectionId = item.dataset.section;
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionId}-section`).classList.add('active');
      });
    });
  }

  populateForm() {
    // Text inputs
    document.getElementById('geminiApiKey').value = this.settings.geminiApiKey;
    document.getElementById('factCheckApiKey').value = this.settings.factCheckApiKey;
    
    // Selects
    document.getElementById('analysisDepth').value = this.settings.analysisDepth;
    document.getElementById('theme').value = this.settings.theme;
    document.getElementById('maxHistoryItems').value = this.settings.maxHistoryItems;
    
    // Ranges
    document.getElementById('credibilityThreshold').value = this.settings.credibilityThreshold;
    document.getElementById('thresholdValue').textContent = this.settings.credibilityThreshold;
    document.getElementById('highlightDuration').value = this.settings.highlightDuration;
    document.getElementById('highlightValue').textContent = this.settings.highlightDuration;
    
    // Checkboxes
    document.getElementById('autoFactCheck').checked = this.settings.autoFactCheck;
    document.getElementById('enablePageAnalysis').checked = this.settings.enablePageAnalysis;
    document.getElementById('enableNotifications').checked = this.settings.enableNotifications;
    document.getElementById('saveHistory').checked = this.settings.saveHistory;
    document.getElementById('enableKeyboardShortcuts').checked = this.settings.enableKeyboardShortcuts;
    document.getElementById('showInlineResults').checked = this.settings.showInlineResults;
  }

  updateApiStatus() {
    const geminiStatus = document.getElementById('geminiStatus');
    const factCheckStatus = document.getElementById('factCheckStatus');
    
    // Update Gemini API status
    if (this.settings.geminiApiKey) {
      geminiStatus.textContent = 'Configured';
      geminiStatus.className = 'status-indicator connected';
    } else {
      geminiStatus.textContent = 'Not configured';
      geminiStatus.className = 'status-indicator';
    }
    
    // Update Fact Check API status
    if (this.settings.factCheckApiKey) {
      factCheckStatus.textContent = 'Configured';
      factCheckStatus.className = 'status-indicator connected';
    } else {
      factCheckStatus.textContent = 'Not configured';
      factCheckStatus.className = 'status-indicator';
    }
  }

  togglePasswordVisibility(button) {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  async testApiConnections() {
    const button = document.getElementById('testApisBtn');
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
      const results = await Promise.allSettled([
        this.testGeminiApi(),
        this.testFactCheckApi()
      ]);
      
      const geminiResult = results[0];
      const factCheckResult = results[1];
      
      this.updateTestResults(geminiResult, factCheckResult);
      
    } catch (error) {
      console.error('Error testing APIs:', error);
      this.showToast('Error testing API connections', 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  async testGeminiApi() {
    if (!this.settings.geminiApiKey) {
      throw new Error('No API key configured');
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.settings.geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Test connection. Reply with 'OK'." }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  async testFactCheckApi() {
    if (!this.settings.factCheckApiKey) {
      throw new Error('No API key configured');
    }
    
    const response = await fetch(`https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${this.settings.factCheckApiKey}&query=test&languageCode=en`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  updateTestResults(geminiResult, factCheckResult) {
    const geminiStatus = document.getElementById('geminiStatus');
    const factCheckStatus = document.getElementById('factCheckStatus');
    
    // Update Gemini status
    if (geminiResult.status === 'fulfilled') {
      geminiStatus.textContent = 'Connected ✓';
      geminiStatus.className = 'status-indicator connected';
      this.showToast('Gemini API connection successful!', 'success');
    } else {
      geminiStatus.textContent = 'Connection failed ✗';
      geminiStatus.className = 'status-indicator error';
      this.showToast(`Gemini API error: ${geminiResult.reason.message}`, 'error');
    }
    
    // Update Fact Check status
    if (factCheckResult.status === 'fulfilled') {
      factCheckStatus.textContent = 'Connected ✓';
      factCheckStatus.className = 'status-indicator connected';
      this.showToast('Fact Check API connection successful!', 'success');
    } else {
      factCheckStatus.textContent = 'Connection failed ✗';
      factCheckStatus.className = 'status-indicator error';
      this.showToast(`Fact Check API error: ${factCheckResult.reason.message}`, 'error');
    }
  }

  async exportData() {
    try {
      this.showLoading('Exporting data...');
      
      const [settingsData, historyData, savedData] = await Promise.all([
        chrome.storage.sync.get(['settings']),
        chrome.storage.local.get(['factCheckHistory']),
        chrome.storage.local.get(['savedResults'])
      ]);
      
      const exportData = {
        settings: settingsData.settings || {},
        history: historyData.factCheckHistory || [],
        savedResults: savedData.savedResults || [],
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };
      
      // Remove sensitive data
      if (exportData.settings.geminiApiKey) {
        exportData.settings.geminiApiKey = '[REDACTED]';
      }
      if (exportData.settings.factCheckApiKey) {
        exportData.settings.factCheckApiKey = '[REDACTED]';
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `factcheck-pro-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.hideLoading();
      this.showToast('Data exported successfully!', 'success');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      this.hideLoading();
      this.showToast('Failed to export data', 'error');
    }
  }

  async clearHistory() {
    if (!confirm('Are you sure you want to clear all fact-check history? This action cannot be undone.')) {
      return;
    }
    
    try {
      await chrome.storage.local.remove(['factCheckHistory']);
      this.showToast('History cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      this.showToast('Failed to clear history', 'error');
    }
  }

  async resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This will not affect your API keys.')) {
      return;
    }
    
    // Preserve API keys
    const apiKeys = {
      geminiApiKey: this.settings.geminiApiKey,
      factCheckApiKey: this.settings.factCheckApiKey
    };
    
    this.settings = { ...this.defaultSettings, ...apiKeys };
    
    try {
      await this.saveSettings();
      this.populateForm();
      this.updateApiStatus();
      this.showToast('Settings reset to defaults!', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showToast('Failed to reset settings', 'error');
    }
  }

  async resetAll() {
    if (!confirm('Are you sure you want to reset ALL data including API keys and history? This action cannot be undone.')) {
      return;
    }
    
    try {
      this.showLoading('Resetting all data...');
      
      // Clear all data
      await Promise.all([
        chrome.storage.sync.clear(),
        chrome.storage.local.clear()
      ]);
      
      // Reset to defaults
      this.settings = { ...this.defaultSettings };
      await this.saveSettings();
      
      this.populateForm();
      this.updateApiStatus();
      
      this.hideLoading();
      this.showToast('All data reset successfully!', 'success');
      
    } catch (error) {
      console.error('Error resetting all data:', error);
      this.hideLoading();
      this.showToast('Failed to reset data', 'error');
    }
  }

  autoSave() {
    // Debounced auto-save
    clearTimeout(this.autoSaveTimeout);
    this.updateSaveStatus('saving');
    
    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await chrome.storage.sync.set({ settings: this.settings });
        this.updateSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save error:', error);
        this.updateSaveStatus('error');
      }
    }, 1000);
  }

  updateSaveStatus(status) {
    const saveStatus = document.getElementById('saveStatus');
    const icon = saveStatus.querySelector('i');
    const text = saveStatus.querySelector('i').nextSibling;
    
    switch (status) {
      case 'saving':
        icon.className = 'fas fa-spinner fa-spin';
        text.textContent = ' Saving...';
        saveStatus.style.color = '#d97706';
        break;
      case 'saved':
        icon.className = 'fas fa-check-circle';
        text.textContent = ' Settings saved automatically';
        saveStatus.style.color = '#059669';
        break;
      case 'error':
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = ' Error saving settings';
        saveStatus.style.color = '#dc2626';
        break;
    }
  }

  showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    loadingText.textContent = text;
    overlay.classList.add('active');
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
  }

  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-remove toast
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => container.removeChild(toast), 300);
      }
    }, duration);
  }
}

// Initialize the options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FactCheckProOptions();
});
