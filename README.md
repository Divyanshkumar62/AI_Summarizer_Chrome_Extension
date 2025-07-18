# SmartDigest - AI-Powered Chrome Extension

<div align="center">

![SmartDigest Logo](https://img.shields.io/badge/SmartDigest-AI%20Summarizer-blue?style=for-the-badge&logo=google-chrome)

**Condense your content in seconds with AI-powered summarization**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue?logo=google-chrome)](https://chrome.google.com/webstore/detail/smartdigest)
[![GitHub Stars](https://img.shields.io/github/stars/Divyanshkumar62/AI_Summarizer_Chrome_Extension?style=social)](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 🚀 Features

### ✨ **Smart Summarization**

- **Multiple Summary Types**: Brief, Detailed, or Bullet Points
- **On-Page Selection**: Select any text and get instant summaries
- **Full Page Summarization**: Summarize entire web pages with one click
- **AI-Powered**: Powered by Google's Gemini AI for accurate results

### 🎤 **Text-to-Speech**

- **Voice Control**: Choose from available system voices
- **Speed Control**: Adjust playback speed (0.5x to 2.0x)
- **Playback Controls**: Play, pause, resume, and stop functionality
- **Real-time**: Listen to summaries as they're generated

### 🎨 **User Experience**

- **Modern UI**: Clean, intuitive interface with dark/light themes
- **Responsive Design**: Works seamlessly across different screen sizes
- **Keyboard Shortcuts**: Quick access to key features
- **Settings Sync**: Preferences sync across devices

### 🔒 **Privacy & Security**

- **Local Storage**: All settings stored locally in your browser
- **No Data Collection**: We don't store or track your content
- **Secure API**: Direct communication with Google's Gemini API
- **Open Source**: Transparent codebase for security review

## 📦 Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/smartdigest)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Development)

1. Clone the repository:

   ```bash
   git clone https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension.git
   cd AI_Summarizer_Chrome_Extension
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🛠️ Setup

### 1. Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for the next step

### 2. Configure the Extension

1. Click the SmartDigest icon in your browser toolbar
2. Go to "API Key" settings
3. Paste your Gemini API key
4. Click "Save API Settings"

### 3. Start Summarizing!

- **Popup Mode**: Click the extension icon and select summary type
- **Selection Mode**: Select text on any webpage and click "Summarize"

## 🎯 How to Use

### Popup Summarization

1. Click the SmartDigest icon in your toolbar
2. Choose your preferred summary type:
   - **Brief**: Quick overview
   - **Detailed**: Comprehensive analysis
   - **Bullet Points**: Key points in list format
3. Click "Summarize" to process the current page

### Text Selection Summarization

1. Select any text on a webpage
2. A "Summarize" button will appear
3. Click it to get an instant summary tooltip
4. Use the copy button to save the summary

### Text-to-Speech

1. After generating a summary, click the 🎤 microphone icon
2. Use the floating controls to:
   - ⏸️ Pause/Resume
   - ⏹️ Stop
   - 🎤 Restart
3. Adjust voice and speed in TTS Settings

## ⚙️ Settings

### General Settings

- **Text Selection Tooltip**: Enable/disable floating summarize button
- **Default Summary Style**: Set your preferred summary type
- **Theme**: Light, Dark, or Auto (follows system preference)

### TTS Settings

- **Voice Selection**: Choose from available system voices
- **Speed Control**: Adjust playback speed (0.5x to 2.0x)
- **Test Voice**: Preview your selected voice and speed

### API Configuration

- **API Key Management**: Securely store and update your Gemini API key
- **Key Validation**: Automatic validation of API key format

## 🏗️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom CSS
- **AI Service**: Google Gemini API
- **Text-to-Speech**: Web Speech API
- **Storage**: Chrome Extension Storage API
- **Form Handling**: Formspree

## 📁 Project Structure

```
AI_Summarizer_Chrome_Extension/
├── src/
│   ├── pages/
│   │   ├── options/          # Settings page
│   │   └── popup/           # Extension popup
│   ├── background/          # Background scripts
│   ├── content/            # Content scripts
│   ├── utils/              # Utility functions
│   └── assets/             # Static assets
├── public/                 # Public assets
├── dist/                   # Build output
├── manifest.json           # Extension manifest
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome browser

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Environment Variables

Create a `.env` file for development:

```env
VITE_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Clone your fork
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Load the extension in Chrome
5. Make your changes and test

## 🐛 Bug Reports

Found a bug? Please report it:

1. **GitHub Issues**: [Create an issue](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/issues)
2. **Email Support**: contactsmartdigest@gmail.com

Please include:

- Browser version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the AI summarization capabilities
- **Chrome Extension API** for the platform
- **React & Vite** for the development framework
- **Tailwind CSS** for the styling system
- **Formspree** for feedback form handling

## 📞 Support

Need help? We're here for you:

- 📧 **Email**: contactsmartdigest@gmail.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/issues)
- 📖 **Documentation**: [Wiki](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/discussions)

## 🔗 Links

- 🌐 **Website**: [SmartDigest](https://smartdigest.app)
- 📦 **Chrome Web Store**: [Install Extension](https://chrome.google.com/webstore/detail/smartdigest)
- 📚 **Documentation**: [Wiki](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/wiki)
- 🐛 **Issues**: [Bug Reports](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/issues)
- 💡 **Feature Requests**: [Ideas](https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/discussions)

---

<div align="center">

**Made with ❤️ by the SmartDigest Team**

[![GitHub](https://img.shields.io/badge/GitHub-Follow-lightgrey?style=social&logo=github)](https://github.com/Divyanshkumar62)
[![Email](https://img.shields.io/badge/Email-Contact-blue?style=social&logo=gmail)](mailto:contactsmartdigest@gmail.com)

</div>
