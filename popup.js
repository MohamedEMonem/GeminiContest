// FactCheck Pro - Enhanced Popup Script
class FactCheckPro {
  constructor() {
    this.currentAnalysis = null;
    this.settings = {};
    this.initializeApp();
  }

  async initializeApp() {
    await this.loadSettings();
    this.setupEventListeners();
    this.checkForStoredText();
    this.showInitialState();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      this.settings = result.settings || {
        geminiApiKey: '',
        factCheckApiKey: '',
        enableNotifications: true,
        credibilityThreshold: 70,
        autoFactCheck: false
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupEventListeners() {
    // Main action buttons
    document.getElementById('factCheckBtn').addEventListener('click', () => this.performFactCheck());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearInput());
    document.getElementById('retryBtn').addEventListener('click', () => this.performFactCheck());
    
    // Settings and navigation
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
    document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
    document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
    
    // Action buttons
    document.getElementById('shareBtn').addEventListener('click', () => this.shareResult());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveResult());
    document.getElementById('reportBtn').addEventListener('click', () => this.reportIssue());

    // Input handling
    const textInput = document.getElementById('textInput');
    textInput.addEventListener('input', () => this.handleInputChange());
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.performFactCheck();
      }
    });
  }

  async checkForStoredText() {
    try {
      const result = await chrome.storage.local.get(['factCheckText']);
      if (result.factCheckText) {
        document.getElementById('textInput').value = result.factCheckText;
        // Auto-start fact check if enabled
        if (this.settings.autoFactCheck) {
          setTimeout(() => this.performFactCheck(), 500);
        }
        // Clear stored text
        chrome.storage.local.remove(['factCheckText']);
      }
    } catch (error) {
      console.error('Error checking stored text:', error);
    }
  }

  showInitialState() {
    this.hideAllStates();
    document.getElementById('resultsContent').classList.add('active');
    this.updateFactCheckButton(false);
  }

  hideAllStates() {
    document.getElementById('loadingState').classList.remove('active');
    document.getElementById('resultsContent').classList.remove('active');
    document.getElementById('errorState').classList.remove('active');
  }

  handleInputChange() {
    const textInput = document.getElementById('textInput');
    const hasText = textInput.value.trim().length > 0;
    this.updateFactCheckButton(!hasText);
  }

  updateFactCheckButton(disabled) {
    const btn = document.getElementById('factCheckBtn');
    btn.disabled = disabled;
    btn.innerHTML = disabled ? 
      '<i class="fas fa-search"></i> Enter Text' : 
      '<i class="fas fa-search"></i> Fact Check';
  }

  clearInput() {
    document.getElementById('textInput').value = '';
    this.showInitialState();
    this.updateFactCheckButton(true);
  }

  async performFactCheck() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    if (!text) {
      this.showError('Please enter text to fact-check.');
      return;
    }

    if (!this.settings.geminiApiKey && !this.settings.factCheckApiKey) {
      this.showError('Please configure API keys in settings.');
      return;
    }

    this.showLoading();
    
    try {
      // Run parallel fact-checking
      const [geminiResult, googleFactCheck] = await Promise.allSettled([
        this.runGeminiFactCheck(text),
        this.runGoogleFactCheck(text)
      ]);

      const analysis = this.combineResults(text, geminiResult, googleFactCheck);
      this.currentAnalysis = analysis;
      this.displayResults(analysis);
      
      // Save to history
      this.saveToHistory(analysis);
      
      // Show notification if enabled
      if (this.settings.enableNotifications) {
        this.showNotification(analysis);
      }

    } catch (error) {
      console.error('Fact check error:', error);
      this.showError('Analysis failed. Please check your settings and try again.');
    }
  }

  showLoading() {
    this.hideAllStates();
    document.getElementById('loadingState').classList.add('active');
    this.animateProgressSteps();
  }

  animateProgressSteps() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => step.classList.remove('active'));
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        steps[currentStep].classList.add('active');
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);
  }

  async runGeminiFactCheck(text) {
    if (!this.settings.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.settings.geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `As a professional fact-checker, analyze this statement and provide a credibility score (0-100), 
                   key findings, and reasoning. Format your response as JSON:
                   {
                     "credibilityScore": number,
                     "verdict": "string (True/False/Partially True/Misleading/Unverifiable)",
                     "analysis": "detailed analysis",
                     "keyPoints": ["point1", "point2", "point3"],
                     "concerns": ["concern1", "concern2"],
                     "confidence": "High/Medium/Low"
                   }
                   
                   Statement: "${text}"`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Invalid Gemini API response');
    }

    try {
      return JSON.parse(content);
    } catch {
      // Fallback for non-JSON responses
      return {
        credibilityScore: 50,
        verdict: "Analysis Available",
        analysis: content,
        keyPoints: [],
        concerns: [],
        confidence: "Medium"
      };
    }
  }

  async runGoogleFactCheck(text) {
    if (!this.settings.factCheckApiKey) {
      return { claims: [] };
    }

    const endpoint = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${this.settings.factCheckApiKey}`;
    
    const response = await fetch(`${endpoint}&query=${encodeURIComponent(text)}&languageCode=en`);
    
    if (!response.ok) {
      console.warn('Google Fact Check API failed:', response.status);
      return { claims: [] };
    }

    return await response.json();
  }

  combineResults(originalText, geminiResult, googleFactCheck) {
    const timestamp = new Date().toISOString();
    
    let credibilityScore = 50;
    let verdict = "Unverifiable";
    let analysis = "Unable to complete analysis.";
    let keyPoints = [];
    let concerns = [];
    let confidence = "Low";
    let sources = [];

    // Process Gemini result
    if (geminiResult.status === 'fulfilled' && geminiResult.value) {
      const gemini = geminiResult.value;
      credibilityScore = gemini.credibilityScore || 50;
      verdict = gemini.verdict || "Analysis Available";
      analysis = gemini.analysis || "Analysis completed.";
      keyPoints = gemini.keyPoints || [];
      concerns = gemini.concerns || [];
      confidence = gemini.confidence || "Medium";
    }

    // Process Google Fact Check result
    if (googleFactCheck.status === 'fulfilled' && googleFactCheck.value?.claims) {
      const claims = googleFactCheck.value.claims;
      sources = claims.map(claim => ({
        url: claim.claimReview?.[0]?.url || '#',
        title: claim.claimReview?.[0]?.publisher?.name || 'Fact Check Source',
        rating: claim.claimReview?.[0]?.textualRating || 'No Rating',
        type: 'fact-check'
      }));

      // Adjust credibility based on fact-check sources
      if (sources.length > 0) {
        const ratings = sources.map(s => s.rating.toLowerCase());
        const negativeRatings = ratings.filter(r => 
          r.includes('false') || r.includes('fake') || r.includes('misleading')
        );
        
        if (negativeRatings.length > sources.length / 2) {
          credibilityScore = Math.min(credibilityScore, 30);
          verdict = "Likely False";
        } else if (negativeRatings.length > 0) {
          credibilityScore = Math.min(credibilityScore, 60);
          verdict = "Mixed Evidence";
        }
      }
    }

    return {
      originalText,
      timestamp,
      credibilityScore: Math.max(0, Math.min(100, credibilityScore)),
      verdict,
      analysis,
      keyPoints,
      concerns,
      confidence,
      sources,
      geminiError: geminiResult.status === 'rejected' ? geminiResult.reason?.message : null,
      googleError: googleFactCheck.status === 'rejected' ? googleFactCheck.reason?.message : null
    };
  }

  displayResults(analysis) {
    this.hideAllStates();
    document.getElementById('resultsContent').classList.add('active');

    // Update credibility score
    this.updateCredibilityScore(analysis.credibilityScore, analysis.verdict);
    
    // Update analysis result
    document.getElementById('resultContent').innerHTML = this.formatAnalysis(analysis);
    
    // Update sources
    this.updateSources(analysis.sources);
    
    // Show action buttons
    document.getElementById('actionButtons').style.display = 'flex';
  }

  updateCredibilityScore(score, verdict) {
    const scoreElement = document.getElementById('scoreValue');
    const labelElement = document.getElementById('scoreLabel');
    const circleElement = document.getElementById('scoreCircle');
    
    scoreElement.textContent = score;
    labelElement.textContent = verdict;
    
    // Update circle color based on score
    let color = '#ef4444'; // Red for low scores
    if (score >= 70) color = '#10b981'; // Green for high scores
    else if (score >= 40) color = '#fbbf24'; // Yellow for medium scores
    
    circleElement.style.background = `conic-gradient(from 0deg, ${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)`;
  }

  formatAnalysis(analysis) {
    let html = `<div class="analysis-content">`;
    
    if (analysis.analysis) {
      html += `<p class="main-analysis">${analysis.analysis}</p>`;
    }
    
    if (analysis.keyPoints.length > 0) {
      html += `
        <div class="key-points">
          <h4><i class="fas fa-check-circle"></i> Key Findings</h4>
          <ul>
            ${analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    if (analysis.concerns.length > 0) {
      html += `
        <div class="concerns">
          <h4><i class="fas fa-exclamation-triangle"></i> Concerns</h4>
          <ul>
            ${analysis.concerns.map(concern => `<li>${concern}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    html += `
      <div class="confidence-indicator">
        <span class="confidence-label">Confidence Level:</span>
        <span class="confidence-value ${analysis.confidence.toLowerCase()}">${analysis.confidence}</span>
      </div>
    `;
    
    html += `</div>`;
    return html;
  }

  updateSources(sources) {
    const sourcesContainer = document.getElementById('sourcesList');
    
    if (sources.length === 0) {
      sourcesContainer.innerHTML = '<p class="no-sources">No additional sources found.</p>';
      return;
    }
    
    sourcesContainer.innerHTML = sources.map(source => `
      <a href="${source.url}" target="_blank" class="source-item">
        <i class="fas fa-external-link-alt"></i>
        <span class="source-title">${source.title}</span>
        <span class="source-rating">${source.rating}</span>
      </a>
    `).join('');
  }

  showError(message) {
    this.hideAllStates();
    document.getElementById('errorState').classList.add('active');
    document.getElementById('errorMessage').textContent = message;
  }

  async saveToHistory(analysis) {
    try {
      const result = await chrome.storage.local.get(['factCheckHistory']);
      const history = result.factCheckHistory || [];
      
      history.unshift({
        ...analysis,
        id: Date.now().toString()
      });
      
      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(50);
      }
      
      await chrome.storage.local.set({ factCheckHistory: history });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  showNotification(analysis) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'FactCheck Pro',
        message: `Analysis complete: ${analysis.verdict} (${analysis.credibilityScore}/100)`
      });
    }
  }

  // Action methods
  shareResult() {
    if (!this.currentAnalysis) return;
    
    const shareText = `FactCheck Pro Analysis:
Text: "${this.currentAnalysis.originalText}"
Verdict: ${this.currentAnalysis.verdict}
Credibility: ${this.currentAnalysis.credibilityScore}/100
Confidence: ${this.currentAnalysis.confidence}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'FactCheck Pro Result',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      this.showToast('Result copied to clipboard!');
    }
  }

  async saveResult() {
    if (!this.currentAnalysis) return;
    
    try {
      const result = await chrome.storage.local.get(['savedResults']);
      const saved = result.savedResults || [];
      
      saved.unshift({
        ...this.currentAnalysis,
        savedAt: new Date().toISOString()
      });
      
      await chrome.storage.local.set({ savedResults: saved });
      this.showToast('Result saved!');
    } catch (error) {
      console.error('Error saving result:', error);
      this.showToast('Failed to save result.');
    }
  }

  reportIssue() {
    const issueUrl = 'https://github.com/YourRepo/factcheck-pro/issues/new';
    chrome.tabs.create({ url: issueUrl });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  showHistory() {
    // Implementation for history view
    this.showToast('History feature coming soon!');
  }

  showAbout() {
    // Implementation for about dialog
    this.showToast('FactCheck Pro v2.0.0 - Professional fact-checking extension');
  }

  showHelp() {
    const helpUrl = 'https://github.com/YourRepo/factcheck-pro/wiki';
    chrome.tabs.create({ url: helpUrl });
  }

  showToast(message, duration = 3000) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #374151;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.style.opacity = '1', 100);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FactCheckPro();
});

// Add CSS for dynamic elements
const dynamicCSS = `
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-analysis {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.key-points, .concerns {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border-left: 4px solid #10b981;
}

.concerns {
  border-left-color: #fbbf24;
}

.key-points h4, .concerns h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.key-points ul, .concerns ul {
  margin: 0;
  padding-left: 16px;
}

.key-points li, .concerns li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #4b5563;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.confidence-label {
  font-size: 13px;
  color: #6b7280;
}

.confidence-value {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.confidence-value.high {
  background: #d1fae5;
  color: #065f46;
}

.confidence-value.medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence-value.low {
  background: #fee2e2;
  color: #991b1b;
}

.no-sources {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.source-rating {
  margin-left: auto;
  font-size: 11px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  color: #6b7280;
}
`;

// Inject dynamic CSS
const style = document.createElement('style');
style.textContent = dynamicCSS;
document.head.appendChild(style);
