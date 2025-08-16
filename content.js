// FactCheck Pro - Content Script for Enhanced Page Interaction

class FactCheckProContent {
  constructor() {
    this.isEnabled = true;
    this.selectedText = '';
    this.highlightedElements = [];
    this.factCheckWidget = null;
    this.initializeContent();
  }

  initializeContent() {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.injectCustomStyles();
  }

  setupEventListeners() {
    // Text selection handling
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    document.addEventListener('keyup', (e) => this.handleKeyboardSelection(e));
    
    // Double-click for quick fact-check
    document.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    
    // Message handling from extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+F for quick fact-check
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.quickFactCheck();
      }
      
      // Escape to clear highlights
      if (e.key === 'Escape') {
        this.clearHighlights();
        this.hideWidget();
      }
    });
  }

  handleTextSelection(e) {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        this.selectedText = selectedText;
        this.showFactCheckWidget(e.pageX, e.pageY);
      } else {
        this.hideWidget();
      }
    }, 100);
  }

  handleKeyboardSelection(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.shiftKey) {
      this.handleTextSelection(e);
    }
  }

  handleDoubleClick(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 5) {
      e.preventDefault();
      this.selectedText = selectedText;
      this.quickFactCheck();
    }
  }

  showFactCheckWidget(x, y) {
    this.hideWidget(); // Remove existing widget
    
    this.factCheckWidget = document.createElement('div');
    this.factCheckWidget.className = 'factcheck-widget';
    this.factCheckWidget.innerHTML = `
      <div class="factcheck-widget-content">
        <button class="factcheck-btn quick" title="Quick Fact Check">
          <span class="icon">⚡</span>
          Quick Check
        </button>
        <button class="factcheck-btn deep" title="Deep Analysis">
          <span class="icon">🔬</span>
          Deep Analysis
        </button>
        <button class="factcheck-btn sources" title="Verify Sources">
          <span class="icon">📚</span>
          Sources
        </button>
        <button class="factcheck-close" title="Close">×</button>
      </div>
    `;
    
    // Position widget
    this.factCheckWidget.style.left = Math.min(x, window.innerWidth - 250) + 'px';
    this.factCheckWidget.style.top = Math.max(y - 60, 10) + 'px';
    
    document.body.appendChild(this.factCheckWidget);
    
    // Add event listeners
    this.factCheckWidget.querySelector('.quick').addEventListener('click', () => {
      this.performFactCheck('quick');
    });
    
    this.factCheckWidget.querySelector('.deep').addEventListener('click', () => {
      this.performFactCheck('deep');
    });
    
    this.factCheckWidget.querySelector('.sources').addEventListener('click', () => {
      this.performFactCheck('sources');
    });
    
    this.factCheckWidget.querySelector('.factcheck-close').addEventListener('click', () => {
      this.hideWidget();
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => this.hideWidget(), 10000);
  }

  hideWidget() {
    if (this.factCheckWidget) {
      this.factCheckWidget.remove();
      this.factCheckWidget = null;
    }
  }

  quickFactCheck() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      this.selectedText = selectedText;
      this.performFactCheck('quick');
    }
  }

  performFactCheck(analysisType) {
    if (!this.selectedText) return;
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'performFactCheck',
      data: {
        text: this.selectedText,
        analysisType: analysisType,
        pageInfo: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname
        }
      }
    });
    
    this.hideWidget();
    this.highlightSelectedText();
    this.showAnalysisIndicator();
  }

  highlightSelectedText() {
    this.clearHighlights();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'factcheck-highlight-active';
      
      try {
        range.surroundContents(span);
        this.highlightedElements.push(span);
      } catch (e) {
        // Fallback for complex selections
        console.log('Complex selection, using alternative highlighting');
      }
    }
  }

  clearHighlights() {
    this.highlightedElements.forEach(element => {
      if (element.parentNode) {
        const parent = element.parentNode;
        parent.insertBefore(document.createTextNode(element.textContent), element);
        parent.removeChild(element);
        parent.normalize();
      }
    });
    this.highlightedElements = [];
    
    // Also clear any existing highlights
    document.querySelectorAll('.factcheck-highlight, .factcheck-highlight-active').forEach(el => {
      const parent = el.parentNode;
      parent.insertBefore(document.createTextNode(el.textContent), el);
      parent.removeChild(el);
      parent.normalize();
    });
  }

  showAnalysisIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'factcheck-analysis-indicator';
    indicator.innerHTML = `
      <div class="indicator-content">
        <div class="spinner"></div>
        <span>Analyzing...</span>
      </div>
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 5000);
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'highlightText':
        this.highlightText(request.text);
        sendResponse({ success: true });
        break;
        
      case 'clearHighlights':
        this.clearHighlights();
        sendResponse({ success: true });
        break;
        
      case 'getPageContent':
        const content = this.extractPageContent();
        sendResponse({ success: true, data: content });
        break;
        
      case 'showResult':
        this.showInlineResult(request.data);
        sendResponse({ success: true });
        break;
    }
  }

  highlightText(searchText) {
    this.clearHighlights();
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentNode;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' ||
              parent.classList.contains('factcheck-widget') ||
              parent.classList.contains('factcheck-analysis-indicator')) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent.toLowerCase().includes(searchText.toLowerCase()) ?
                 NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      },
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlightedHtml = textNode.textContent.replace(regex, 
        '<span class="factcheck-highlight">$1</span>'
      );
      
      if (highlightedHtml !== textNode.textContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = highlightedHtml;
        
        const highlights = tempDiv.querySelectorAll('.factcheck-highlight');
        highlights.forEach(highlight => this.highlightedElements.push(highlight));
        
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, textNode);
        }
        parent.removeChild(textNode);
      }
    });
    
    // Auto-remove highlights after 15 seconds
    setTimeout(() => this.clearHighlights(), 15000);
  }

  extractPageContent() {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    
    // Extract main content
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.article-content',
      '.post-content',
      '#content',
      '.entry-content'
    ];

    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.innerText.slice(0, 2000);
        break;
      }
    }

    if (!mainContent) {
      mainContent = document.body.innerText.slice(0, 2000);
    }

    // Extract headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.trim())
      .filter(text => text.length > 0)
      .slice(0, 10);

    return {
      title,
      description: metaDescription,
      content: mainContent,
      headings,
      url: canonical,
      domain: window.location.hostname,
      wordCount: mainContent.split(/\s+/).length
    };
  }

  showInlineResult(resultData) {
    // Show a brief inline result near the highlighted text
    const inlineResult = document.createElement('div');
    inlineResult.className = 'factcheck-inline-result';
    inlineResult.innerHTML = `
      <div class="inline-result-content">
        <div class="result-header">
          <span class="credibility-score ${this.getScoreClass(resultData.credibilityScore)}">
            ${resultData.credibilityScore}/100
          </span>
          <span class="verdict">${resultData.verdict}</span>
        </div>
        <p class="result-summary">${resultData.analysis.slice(0, 100)}...</p>
        <button class="view-full-result">View Full Analysis</button>
      </div>
    `;
    
    // Position near highlighted text
    const highlighted = document.querySelector('.factcheck-highlight-active');
    if (highlighted) {
      const rect = highlighted.getBoundingClientRect();
      inlineResult.style.top = (window.pageYOffset + rect.bottom + 10) + 'px';
      inlineResult.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';
    } else {
      inlineResult.style.top = '100px';
      inlineResult.style.right = '20px';
    }
    
    document.body.appendChild(inlineResult);
    
    // Add click handler for full result
    inlineResult.querySelector('.view-full-result').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openFullResult' });
      inlineResult.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (inlineResult.parentNode) {
        inlineResult.remove();
      }
    }, 10000);
  }

  getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very-low';
  }

  injectCustomStyles() {
    if (document.getElementById('factcheck-pro-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'factcheck-pro-styles';
    styles.textContent = `
      .factcheck-widget {
        position: absolute;
        z-index: 10000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border: 1px solid #e5e7eb;
        padding: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        animation: factcheckFadeIn 0.2s ease-out;
      }
      
      .factcheck-widget-content {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      
      .factcheck-btn {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: #f8fafc;
        color: #475569;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      
      .factcheck-btn:hover {
        background: #e2e8f0;
        transform: translateY(-1px);
      }
      
      .factcheck-btn.quick:hover { background: linear-gradient(135deg, #fef3c7, #fde68a); }
      .factcheck-btn.deep:hover { background: linear-gradient(135deg, #ddd6fe, #c4b5fd); }
      .factcheck-btn.sources:hover { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
      
      .factcheck-close {
        padding: 4px 8px;
        border: none;
        background: none;
        color: #64748b;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
        line-height: 1;
      }
      
      .factcheck-close:hover {
        background: #fee2e2;
        color: #dc2626;
      }
      
      .factcheck-highlight {
        background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 500;
        animation: factcheckHighlight 0.5s ease-out;
      }
      
      .factcheck-highlight-active {
        background: linear-gradient(120deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: 600;
        animation: factcheckPulse 2s infinite;
      }
      
      .factcheck-analysis-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        background: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        animation: factcheckSlideIn 0.3s ease-out;
      }
      
      .indicator-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
      }
      
      .indicator-content .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #4f46e5;
        border-radius: 50%;
        animation: factcheckSpin 1s linear infinite;
      }
      
      .factcheck-inline-result {
        position: absolute;
        z-index: 10000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        padding: 16px;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        animation: factcheckFadeIn 0.3s ease-out;
      }
      
      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .credibility-score {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
      }
      
      .credibility-score.high { background: #d1fae5; color: #065f46; }
      .credibility-score.medium { background: #fef3c7; color: #92400e; }
      .credibility-score.low { background: #fed7d7; color: #c53030; }
      .credibility-score.very-low { background: #fee2e2; color: #991b1b; }
      
      .verdict {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
      
      .result-summary {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.4;
        margin: 8px 0;
      }
      
      .view-full-result {
        padding: 8px 16px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        width: 100%;
        transition: all 0.15s ease;
      }
      
      .view-full-result:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      }
      
      @keyframes factcheckFadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes factcheckSlideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes factcheckHighlight {
        from { background: #fef3c7; }
        to { background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%); }
      }
      
      @keyframes factcheckPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      @keyframes factcheckSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FactCheckProContent();
  });
} else {
  new FactCheckProContent();
}
