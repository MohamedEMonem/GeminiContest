# FactCheck Pro - Professional AI-Powered Fact Checking Extension

A sophisticated Chrome extension that combines Google's Gemini AI with the Google Fact Check Tools API to provide comprehensive, credible fact-checking directly in your browser.

## 🚀 Features

### Core Functionality
- **AI-Powered Analysis**: Advanced fact-checking using Google Gemini AI
- **Verified Sources**: Integration with Google's Fact Check Tools database
- **Credibility Scoring**: Numerical confidence ratings (0-100) for every analysis
- **Multiple Analysis Modes**: Quick check, standard analysis, and deep investigation
- **Real-time Highlighting**: Visual indicators for analyzed text on web pages

### User Experience
- **Professional UI**: Modern, responsive interface with smooth animations
- **Smart Context Menu**: Right-click any selected text to fact-check
- **Inline Results**: View results directly on web pages
- **Keyboard Shortcuts**: Quick access via Ctrl+Shift+F
- **Multiple Themes**: Light, dark, and auto themes

### Privacy & Security
- **Local Storage**: All data stored locally on your device
- **No Tracking**: Zero data collection or user tracking
- **Encrypted Keys**: API keys stored securely and encrypted
- **Optional History**: Choose whether to save fact-check history

### Advanced Features
- **Page Analysis**: Analyze entire web pages for factual content
- **Export Data**: Export your settings and history
- **Notification System**: Get alerts when analysis is complete
- **Source Verification**: Links to verified fact-checking organizations

## 📋 Requirements

### API Keys (Required)
1. **Google Gemini API Key** (Required)
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to the extension settings

2. **Google Fact Check Tools API Key** (Optional but recommended)
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Fact Check Tools API
   - Create an API key
   - Add it to the extension settings

### Browser Requirements
- Chrome 88+ or any Chromium-based browser
- Extensions developer mode enabled (for manual installation)

## 🛠️ Installation

### Option 1: Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](link-to-store-page)
2. Click "Add to Chrome"
3. Follow the installation prompts

### Option 2: Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will appear in your browser toolbar

## ⚙️ Setup & Configuration

### Initial Setup
1. Click the FactCheck Pro icon in your browser toolbar
2. Click the settings (gear) icon
3. Navigate to "API Configuration"
4. Enter your Google Gemini API key (required)
5. Optionally add your Google Fact Check Tools API key
6. Click "Test API Connections" to verify

### Recommended Settings
- **Analysis Depth**: Standard (balanced speed and accuracy)
- **Credibility Threshold**: 70% (reasonable confidence level)
- **Enable Notifications**: Yes (for completion alerts)
- **Save History**: Yes (for reference and improvement)

## 🎯 Usage

### Basic Fact-Checking
1. **Select Text**: Highlight any text on a web page
2. **Right-click**: Choose "Fact Check with AI" from the context menu
3. **Choose Analysis Type**:
   - Quick Check: Fast, basic verification
   - Standard Analysis: Balanced speed and depth
   - Deep Analysis: Comprehensive investigation
4. **View Results**: See credibility score, analysis, and sources

### Keyboard Shortcuts
- `Ctrl+Shift+F`: Fact-check selected text
- `Esc`: Clear highlights and close widgets

### Page Analysis
- Right-click on any page and select "Analyze This Page"
- Get an overview of the page's factual content and credibility

### Using the Popup
1. Click the extension icon
2. Type or paste text in the input field
3. Click "Fact Check" to analyze
4. View detailed results with sources and confidence scores

## 📊 Understanding Results

### Credibility Scores
- **80-100**: High credibility (likely true)
- **60-79**: Medium credibility (partially verified)
- **40-59**: Low credibility (questionable)
- **0-39**: Very low credibility (likely false)

### Analysis Components
- **Verdict**: Overall assessment (True/False/Partially True/Misleading/Unverifiable)
- **Key Findings**: Main points supporting the verdict
- **Concerns**: Issues or red flags identified
- **Confidence Level**: AI's confidence in the analysis
- **Sources**: Links to fact-checking organizations and verified sources

## 🔧 Troubleshooting

### Common Issues

**"API Key Error"**
- Verify your API key is correct
- Check if the API is enabled in Google Cloud Console
- Ensure you have sufficient API quota

**"No Results Found"**
- Try simplifying your query
- Check your internet connection
- Verify the selected text is clear and factual

**"Analysis Failed"**
- Check your API keys in settings
- Try again with a shorter text snippet
- Ensure the APIs are not experiencing downtime

### Performance Tips
- Use "Quick Check" for faster results
- Keep text selections under 500 words for best performance
- Clear history regularly if experiencing slowdowns

## 📈 Privacy & Data

### What We Store Locally
- Your API keys (encrypted)
- Extension settings and preferences
- Fact-check history (if enabled)
- Saved results (if you choose to save them)

### What We Don't Collect
- Personal information
- Browsing history
- Usage analytics
- Any data outside the extension

### Data Export
You can export all your data at any time:
1. Go to Settings → Privacy & Data
2. Click "Export Data"
3. Save the JSON file as backup

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Changelog

### Version 2.0.0 (Current)
- Complete UI/UX redesign
- Google Fact Check Tools API integration
- Enhanced credibility scoring
- Improved performance and reliability
- New settings and configuration options
- Better error handling and user feedback

### Version 1.0.1 (Previous)
- Basic Gemini AI integration
- Simple fact-checking functionality
- Basic popup interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Get Help
- 📖 [Documentation](https://github.com/yourrepo/factcheck-pro/wiki)
- 🐛 [Report Issues](https://github.com/yourrepo/factcheck-pro/issues)
- 💬 [Discussions](https://github.com/yourrepo/factcheck-pro/discussions)
- 📧 [Email Support](mailto:support@factcheckpro.com)

### Useful Links
- [Google Gemini AI](https://ai.google.dev/)
- [Google Fact Check Tools API](https://developers.google.com/fact-check/tools/api)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

---

**FactCheck Pro** - Empowering users with AI-powered truth verification for a more informed digital world.

Made with ❤️ by the FactCheck Pro Team
