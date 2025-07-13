# SmartDigest - AI-Powered Content Summarizer

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore/detail/smartdigest)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-username/smartdigest)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> Transform lengthy articles and web content into concise, intelligent summaries powered by Google's Gemini AI. SmartDigest helps you save time and extract key insights from any webpage with advanced text-to-speech capabilities.

## ✨ Features

### 🤖 AI-Powered Summarization

- **Multiple Summary Types**: Choose from brief summaries, detailed analysis, or bullet-point formats
- **Gemini AI Integration**: Powered by Google's advanced Gemini 1.5 Flash model
- **Smart Content Extraction**: Automatically extracts relevant text from articles, blog posts, and web pages
- **Context-Aware Processing**: Understands content context for more accurate summaries

### 🎤 Advanced Text-to-Speech

- **Customizable Voice Settings**: Choose from available system voices or use recommended Google US English
- **Speed Control**: Adjust playback speed from 0.5x to 2.0x
- **Floating Controls**: Intuitive pause/resume and stop controls with visual feedback
- **Cross-Browser Compatibility**: Works across different browsers with graceful fallbacks
- **Settings Persistence**: Your voice preferences sync across devices

### 🖱️ Seamless User Experience

- **Context Menu Integration**: Right-click any selected text for instant summarization
- **Floating Summarize Button**: Appears when you select text on any webpage
- **One-Click Copy**: Copy summaries with visual feedback and animations
- **Responsive Design**: Modern, clean interface that adapts to different screen sizes

### 🔒 Security & Privacy

- **Local Storage**: All settings and API keys stored locally on your device
- **No Data Collection**: We don't collect or store any personal information
- **XSS Protection**: Built-in security measures to prevent malicious content
- **Rate Limiting**: Intelligent request management to prevent API abuse

### 🛠️ Technical Features

- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Browser Compatibility**: Works with Chrome, Edge, and other Chromium-based browsers
- **Performance Optimized**: Efficient content processing and minimal resource usage
- **Offline Capable**: Basic functionality works without internet (TTS features)

## 📸 Screenshots

### Main Interface

![SmartDigest Popup Interface](screenshots/popup-interface.png)
_The main popup interface showing summarization options and results_

### Settings Page

![TTS Settings Page](screenshots/tts-settings.png)
_Text-to-Speech settings with voice selection and speed control_

### Context Menu

![Context Menu Integration](screenshots/context-menu.png)
_Right-click context menu for selected text summarization_

### Floating Controls

![Floating TTS Controls](screenshots/floating-controls.png)
_Floating pause/resume and stop controls during text-to-speech_

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit the [SmartDigest page on Chrome Web Store](https://chrome.google.com/webstore/detail/smartdigest)
2. Click "Add to Chrome"
3. Confirm the installation when prompted
4. The extension icon will appear in your browser toolbar

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## ⚙️ Setup

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated key

### 2. Configure the Extension

1. Click the SmartDigest icon in your browser toolbar
2. Click the settings icon (⚙️) to open options
3. Navigate to the "API Key" tab
4. Paste your Gemini API key and click "Save Settings"

### 3. Customize TTS Settings (Optional)

1. In the options page, click the "TTS Settings" tab
2. Choose your preferred voice from the dropdown
3. Adjust the speech speed using the slider
4. Test your settings with the "Test Voice" button
5. Click "Save TTS Settings"

## 📖 Usage Guide

### Summarizing Web Pages

1. **Navigate** to any webpage with content you want to summarize
2. **Click** the SmartDigest icon in your browser toolbar
3. **Select** your preferred summary type (Brief, Detailed, or Bullet Points)
4. **Click** "Summarize" to generate the summary
5. **Use** the copy button to save the summary to your clipboard

### Using Context Menu

1. **Select** any text on a webpage (minimum 10 characters)
2. **Right-click** the selected text
3. **Choose** "Summarize with SmartDigest" from the context menu
4. **View** the summary in a floating tooltip
5. **Copy** or close the tooltip as needed

### Text-to-Speech

1. **Generate** a summary using any method above
2. **Click** the microphone button to start TTS
3. **Use** the floating controls to:
   - ⏸ Pause/Resume (top button)
   - ⏹ Stop and restart (bottom button)
4. **Click** outside the controls to hide them (TTS continues in background)

### Keyboard Shortcuts

- **Ctrl+Shift+S**: Quick summarize current page
- **Ctrl+Shift+T**: Toggle TTS for current summary
- **Escape**: Close any open tooltips or controls

## 🔧 Troubleshooting

### Common Issues

**"API key missing" error**

- Ensure you've entered your Gemini API key in the settings
- Check that the API key is valid and has sufficient quota

**"Text-to-Speech failed" error**

- Verify your browser supports speech synthesis
- Try refreshing the page and restarting TTS
- Check if your system has available voices

**"Couldn't extract text from this page"**

- Try selecting specific text instead of using page summarization
- Some pages may have restricted content extraction
- Ensure the page has loaded completely

**Extension not working**

- Check if the extension is enabled in `chrome://extensions/`
- Try disabling and re-enabling the extension
- Clear browser cache and restart Chrome

### Performance Tips

- Use brief summaries for faster processing
- Close unnecessary browser tabs to free up memory
- Ensure stable internet connection for API calls
- Update to the latest version of Chrome

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore/detail/smartdigest)
- [Privacy Policy](PRIVACY.md)
- [Changelog](CHANGELOG.md)
- [Report Issues](https://github.com/your-username/smartdigest/issues)
- [Feature Requests](https://github.com/your-username/smartdigest/issues/new)

## 📞 Support

- **Email**: support@smartdigest.com
- **GitHub Issues**: [Report a Bug](https://github.com/your-username/smartdigest/issues)
- **Documentation**: [Wiki](https://github.com/your-username/smartdigest/wiki)

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the powerful summarization API
- **Chrome Extensions Team** for the excellent development platform
- **Open Source Community** for various libraries and tools used

## 📚 Credits

Inspired by Roadside Code's tutorial on building AI-powered summarizer extensions. All code is original and includes additional features and improvements beyond the tutorial.

---

**Made with ❤️ for productivity enthusiasts everywhere**

_SmartDigest - Condense your content in seconds_
