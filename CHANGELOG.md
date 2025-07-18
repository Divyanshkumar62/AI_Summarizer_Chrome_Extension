# Changelog

All notable changes to the SmartDigest Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enhanced FAQ accordion padding consistency
- Improved help section UI/UX with better spacing
- Better visual hierarchy in support sections

### Changed

- Updated button styling for better visibility in light mode
- Improved hover effects across all interactive elements
- Enhanced support link styling with better visual feedback

## [1.0.0] - 2024-12-XX

### Added

- **Core Features**

  - AI-powered text summarization using Google Gemini API
  - Multiple summary types: Brief, Detailed, and Bullet Points
  - Text-to-Speech functionality with voice and speed control
  - On-page text selection with floating summarize button
  - Full page summarization from extension popup

- **User Interface**

  - Modern, responsive design with dark/light theme support
  - Intuitive settings page with organized sections
  - Real-time feedback and status messages
  - Copy-to-clipboard functionality for summaries
  - Loading animations and progress indicators

- **Settings & Configuration**

  - API key management with secure storage
  - TTS voice and speed preferences
  - Theme selection (Light/Dark/Auto)
  - Text selection tooltip toggle
  - Default summary type selection

- **Support & Documentation**

  - Comprehensive help section with usage instructions
  - FAQ section with common questions and answers
  - Feedback form integration with Formspree
  - Support channels (GitHub Issues, Email)
  - Privacy policy and trust information

- **Technical Features**
  - React 18 + TypeScript architecture
  - Vite build system for fast development
  - Tailwind CSS for styling
  - Chrome Extension Manifest V3
  - Secure API key storage
  - Error handling and validation

### Security

- Local storage for sensitive data
- Secure API communication with HTTPS
- No data collection or tracking
- Privacy-first design approach

### Performance

- Optimized bundle size
- Fast loading times
- Efficient API request handling
- Smooth animations and transitions

---

## Version History

### Version 1.0.0

- Initial release with core summarization functionality
- Complete UI/UX implementation
- Full settings and configuration system
- Comprehensive documentation and support

---

## Contributing

To add entries to this changelog:

1. Add your changes under the appropriate section
2. Use the following prefixes:

   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for security-related changes

3. Follow the existing format and style
4. Include the date when the version is released

---

For more information about this project, see the [README.md](README.md) file.
