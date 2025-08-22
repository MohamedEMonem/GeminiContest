# Fact Check with Gemini - Chrome Extension

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

## 🎯 Overview
**Fact Check with Gemini** is a powerful Chrome extension that leverages Google's Gemini AI to fact-check selected text on any webpage. Simply highlight text, right-click, and get instant AI-powered fact verification through Google Search integration.

## ✨ Features
- **Right-Click Fact Checking**: Highlight any text and fact-check it via context menu
- **Gemini AI Integration**: Uses Google's advanced Gemini 2.0 Flash model
- **Real-time Results**: Get fact-check results in under 300 characters
- **Beautiful UI**: Animated loading spinner with gradient design
- **Popup Window**: Dedicated popup for displaying fact-check results
- **Secure API Integration**: Safe handling of API keys through environment configuration

## 🚀 Installation

### Prerequisites
- Google Chrome browser
- Gemini API key from Google AI Studio

### Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/MohamedEMonem/Gemini--Contest.git
   cd "Gemini--Contest"
   ```

2. **Configure API Key**:
   - Create a `.env` file in the project root
   - Add your Gemini API key:
     ```
     APIKEY=your_gemini_api_key_here
     ```
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" and select the project folder
   - The extension icon will appear in your browser toolbar

## 📖 Usage

### Fact-Checking Text
1. **Select Text**: Highlight any text on a webpage
2. **Right-Click**: Access the context menu
3. **Choose "Fact Check with Gemini"**: Click the fact-check option
4. **View Results**: A popup window will open showing the AI-powered fact-check

### Example Workflow
```
Highlight: "The Earth is flat"
→ Right-click → "Fact Check with Gemini"
→ Popup opens with Gemini's fact-check response
```

## 🏗️ Project Structure
```
├── manifest.json           # Extension manifest (v3)
├── background.js           # Service worker for context menu
├── popup.html             # Fact-check results UI
├── popup.js               # Popup logic & Gemini API integration
├── styles.css             # Styling with animations
├── .env                   # Environment variables (API key)
├── logo.png               # Extension icon
├── hello_extensions.png   # Additional branding
└── icons/                 # Icon assets
```

## 🔧 Technical Details

### Permissions
- `contextMenus`: Right-click menu integration
- `activeTab`: Access to current tab content
- `scripting`: Text selection functionality
- `storage`: Temporary data storage

### API Integration
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Model**: Gemini 2.0 Flash
- **Response Limit**: 300 characters for concise fact-checks

### Security Features
- Environment-based API key management
- Secure HTTPS-only API calls
- Minimal permission scope

## 🎨 UI/UX Features
- **Gradient Background**: Beautiful blue-green gradient design
- **Loading Animation**: Rotating gradient spinner
- **Responsive Design**: Clean, centered layout
- **Error Handling**: User-friendly error messages

## 🛠️ Development

### Local Development
```bash
# Make changes to source files
# Reload extension in chrome://extensions/
# Test functionality on various websites
```

### Key Files to Modify
- **`popup.js`**: Modify fact-checking logic or API integration
- **`background.js`**: Change context menu behavior
- **`styles.css`**: Update UI styling and animations
- **`popup.html`**: Modify popup structure

### Environment Variables
Create a `.env` file with:
```
APIKEY=your_gemini_api_key
```

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- ✅ Commercial use allowed
- ✅ Modification allowed  
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed

## 🔗 Links
- [Chrome Web Store]() *(Coming Soon)*
- [Google AI Studio](https://makersuite.google.com/)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

## ⚠️ Important Notes
- Requires active internet connection
- API usage subject to Google's rate limits
- Keep your API key secure and never commit it to version control

---
**Built with ❤️ for the Gemini Contest**
