# SmartDigest Extension Testing Guide

This document provides comprehensive manual testing steps for the SmartDigest Chrome extension.

## 🚀 Setup for Testing

### Prerequisites

- Chrome or Edge browser
- Valid Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Extension loaded in development mode

### Loading Extension for Testing

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `ai-summarizer-react-extension` folder
4. Verify the extension appears in the list with version 1.0

## 📋 Test Categories

### 1. Extension Installation & Basic Functionality

#### Test: Extension Installation

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Extension icon appears in browser toolbar
- [ ] Context menu "Summarize with SmartDigest" appears on text selection
- [ ] Options page opens automatically on first install

#### Test: Basic Navigation

- [ ] Click extension icon opens popup
- [ ] Right-click extension icon shows context menu
- [ ] "Options" in context menu opens settings page

### 2. Popup Functionality

#### Test: Popup UI Elements

- [ ] Popup opens with correct dimensions (480px width)
- [ ] Header shows "SmartDigest" title and subtitle
- [ ] Settings button (⚙️) is visible and clickable
- [ ] Summary type dropdown shows all three options:
  - Brief Summary
  - Detailed Analysis
  - Bullet Points
- [ ] Summarize button shows "✨ Summarize" text
- [ ] Copy button shows "📋 Copy" text
- [ ] TTS button shows microphone icon
- [ ] Result area shows default text "Select a Type and click Summarize"

#### Test: Summary Generation

- [ ] Select "Brief Summary" and click Summarize on a webpage with content
- [ ] Verify loading state shows "Summarizing..."
- [ ] Verify summary appears in result area
- [ ] Test with "Detailed Analysis" option
- [ ] Test with "Bullet Points" option
- [ ] Verify summaries are different for each type

#### Test: Copy Functionality

- [ ] Generate a summary
- [ ] Click "📋 Copy" button
- [ ] Verify button changes to "✓ Copied!" with green background
- [ ] Verify button reverts to original state after 1.5 seconds
- [ ] Paste in another application to verify content was copied
- [ ] Test copy with empty result (should not copy)

#### Test: Text-to-Speech (TTS)

- [ ] Generate a summary
- [ ] Click microphone button to start TTS
- [ ] Verify floating controls appear (pause/resume and stop buttons)
- [ ] Verify TTS plays the summary text
- [ ] Click pause button (if supported by browser)
- [ ] Click resume button (if supported by browser)
- [ ] Click stop button to end TTS
- [ ] Verify floating controls disappear after stopping
- [ ] Test TTS with different summary types

#### Test: Settings Integration

- [ ] Click settings button (⚙️) in popup
- [ ] Verify options page opens in new tab
- [ ] Verify popup closes when options page opens

### 3. Content Script Functionality

#### Test: Text Selection Tooltip

- [ ] Navigate to any webpage with text content
- [ ] Select at least 10 characters of text
- [ ] Verify floating "✨ Summarize" button appears
- [ ] Verify button is positioned correctly (not off-screen)
- [ ] Verify button has hover effects
- [ ] Select less than 10 characters - verify button doesn't appear
- [ ] Click outside selection - verify button disappears

#### Test: Context Menu Integration

- [ ] Select text on any webpage
- [ ] Right-click to open context menu
- [ ] Verify "Summarize with SmartDigest" option appears
- [ ] Click the context menu option
- [ ] Verify summary tooltip appears with result

#### Test: Summary Tooltip

- [ ] Click floating summarize button
- [ ] Verify loading tooltip appears with spinner
- [ ] Verify summary tooltip appears with result
- [ ] Verify tooltip has copy and close buttons
- [ ] Test copy functionality in tooltip
- [ ] Test close button functionality
- [ ] Verify tooltip positioning (centered on screen)

#### Test: Dark Mode Support

- [ ] Enable dark mode in extension settings
- [ ] Test floating button appearance in dark mode
- [ ] Test summary tooltip appearance in dark mode
- [ ] Verify all elements are visible and readable

### 4. Options/Settings Page

#### Test: General Settings

- [ ] Open options page
- [ ] Verify "Text Selection Tooltip" toggle is present
- [ ] Toggle tooltip setting on/off
- [ ] Verify setting persists after page reload
- [ ] Test "Default Summary Style" dropdown
- [ ] Test theme selection (Light/Dark/Auto)
- [ ] Verify theme changes apply immediately

#### Test: API Configuration

- [ ] Navigate to API Key section
- [ ] Enter invalid API key and test
- [ ] Enter valid API key and save
- [ ] Verify API key is saved and persists
- [ ] Test with empty API key field

#### Test: TTS Settings

- [ ] Navigate to TTS Settings section
- [ ] Verify voice selection dropdown loads available voices
- [ ] Test voice selection and save
- [ ] Test speech speed slider (0.5x to 2.0x)
- [ ] Test "Test Voice" functionality
- [ ] Verify settings persist after page reload

#### Test: Help & Support

- [ ] Navigate to Help section
- [ ] Verify FAQ accordion functionality
- [ ] Test expanding/collapsing FAQ items
- [ ] Verify all help content is readable
- [ ] Test support links (GitHub, email)

#### Test: Feedback Form

- [ ] Navigate to Support section
- [ ] Test feedback form validation
- [ ] Submit feedback with valid data
- [ ] Test character counter functionality
- [ ] Verify form submission handling

### 5. Error Handling

#### Test: API Key Missing

- [ ] Remove API key from settings
- [ ] Try to generate summary
- [ ] Verify appropriate error message appears
- [ ] Verify options page opens automatically

#### Test: Network Errors

- [ ] Disconnect internet connection
- [ ] Try to generate summary
- [ ] Verify network error message appears
- [ ] Reconnect and verify functionality resumes

#### Test: Invalid Input

- [ ] Try to summarize less than 10 characters
- [ ] Verify "text too short" error message
- [ ] Try to summarize empty content
- [ ] Verify appropriate error handling

#### Test: Rate Limiting

- [ ] Make multiple rapid summary requests
- [ ] Verify rate limit error messages if applicable
- [ ] Test error message clarity and helpfulness

### 6. Cross-Browser Compatibility

#### Test: Chrome

- [ ] All functionality works in Chrome
- [ ] TTS works with Chrome's speech synthesis
- [ ] Context menus work correctly
- [ ] Extension permissions work as expected

#### Test: Edge

- [ ] All functionality works in Edge
- [ ] TTS works with Edge's speech synthesis
- [ ] Context menus work correctly
- [ ] Extension permissions work as expected

### 7. Performance Testing

#### Test: Loading Performance

- [ ] Extension loads quickly on browser startup
- [ ] Popup opens without delay
- [ ] Options page loads quickly
- [ ] Content script injection is fast

#### Test: Memory Usage

- [ ] Monitor memory usage during extended use
- [ ] Verify no memory leaks with repeated operations
- [ ] Test with multiple tabs open

### 8. Security Testing

#### Test: XSS Protection

- [ ] Try to inject malicious content in summaries
- [ ] Verify content is properly sanitized
- [ ] Test with various special characters

#### Test: Data Privacy

- [ ] Verify API key is stored securely
- [ ] Verify no data is sent to unauthorized servers
- [ ] Test data deletion on extension uninstall

## 🐛 Bug Reporting

When reporting bugs, please include:

1. **Browser Information**

   - Browser name and version
   - Operating system
   - Extension version

2. **Steps to Reproduce**

   - Detailed step-by-step instructions
   - Screenshots if applicable
   - Console error messages

3. **Expected vs Actual Behavior**

   - What you expected to happen
   - What actually happened

4. **Additional Context**
   - URL of the webpage (if relevant)
   - Text content being summarized
   - Any error messages displayed

## ✅ Test Checklist Template

Use this template for systematic testing:

```
Test Session: [Date] [Tester Name]
Browser: [Chrome/Edge] [Version]
Extension Version: [Version]

[ ] Installation & Basic Setup
[ ] Popup Functionality
[ ] Content Script Features
[ ] Options Page
[ ] Error Handling
[ ] Cross-Browser Testing
[ ] Performance Testing
[ ] Security Testing

Notes:
- [Any issues found]
- [Performance observations]
- [User experience feedback]
```

## 🔄 Continuous Testing

For ongoing development:

1. **Automated Testing**: Run tests after each code change
2. **Regression Testing**: Verify existing features still work
3. **Integration Testing**: Test all components work together
4. **User Acceptance Testing**: Test with real user scenarios

---

**Last Updated**: December 2024  
**Version**: 1.0.0
