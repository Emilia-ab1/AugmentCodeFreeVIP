# AugmentCode Auto Login Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![Go](https://img.shields.io/badge/Go-1.19+-00ADD8.svg)](https://golang.org/)

> **🌐 Language**: [中文](README.md) | [English](README_EN.md)

An intelligent Chrome extension for automating the AugmentCode website login process, supporting email registration, verification code retrieval, human verification handling, and more.

## 🎯 Features

### 🤖 Smart Automation
- **Automatic Email Registration**: Uses randomly generated @dddd.tools email addresses
- **Auto Verification Code Retrieval**: Automatically fetches verification codes from email servers
- **Human Verification Handling**: Intelligently handles Cloudflare, reCAPTCHA, and other verifications
- **Auto Terms Acceptance**: Automatically checks service terms and submits

### 📧 Email System
- **Random Email Generation**: 6-digit random number @dddd.tools format
- **Email Refresh Function**: One-click generation of new random emails
- **Email Forwarding Mechanism**: Verification codes automatically forwarded to specified email
- **Multi-Server Support**: Supports multiple IMAP servers as backup

### 🌐 Dual Browser Support
- **Chrome Extension**: Standard version for Chrome browser
- **Edge Dedicated Version**: Optimized random email algorithm, solving Edge compatibility issues
- **Independent Operation**: Two versions run completely independently, avoiding conflicts
- **Enhanced Algorithm**: Edge version uses multiple random sources ensuring true randomness

### 🔐 Security Features
- **Native Messaging**: Secure communication between extension and local program
- **TLS Encryption**: All email connections use TLS encryption
- **Minimal Permissions**: Only requests necessary browser permissions
- **Local Storage**: Configuration information securely stored locally

### 🎨 User Experience
- **Real-time Status Display**: Detailed operation status and progress
- **Visual Logging**: Complete operation log recording
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Login Completion Detection**: Automatic detection of login completion status

## 📋 System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **Browser**: Chrome 88+ or Edge 88+
- **Memory**: Minimum 4GB RAM
- **Network**: Stable internet connection
- **Go Environment**: Go 1.19+ (only required for development)

## ⚠️ Important Configuration Notice

**Before you start using this software, you MUST complete the following configurations, otherwise the program will not work properly:**

### 🔑 Required Configuration Checklist
- [ ] **Domain Email Forwarding**: Configure `*@dddd.tools` forwarding to your personal email
- [ ] **Personal Email IMAP**: Configure your email IMAP information in the code
- [ ] **Email Authorization**: Enable IMAP service and obtain app-specific password/authorization code
- [ ] **Go Environment**: Install Go 1.19+ for compiling Native Host program

**⚡ Quick Configuration Guide**:
1. Ensure you have administrative access to the `dddd.tools` domain
2. Set up email forwarding: `*@dddd.tools` → `youremail@gmail.com`
3. Modify email configuration in `native-messaging/email_verification.go`
4. Obtain app-specific password or authorization code for your email

**🔍 Configuration Check Tool**:
```bash
# Run configuration check script to verify all configurations are correct
./scripts/config-check.sh    # Linux/Mac
./scripts/config-check.bat   # Windows
```

> 📖 **For detailed configuration instructions, please refer to the [📧 Detailed Email Configuration](#-detailed-email-configuration) section below**

## 🚀 Quick Start

### 1. Download Project
```bash
git clone https://github.com/chinanpc/AugmentCodeFreeVIP.git
cd AugmentCodeFreeVIP-Extension
```

### 2. Build Native Host
```bash
cd native-messaging
go build -o email_verifier_host.exe email_verifier_host.go email_verification.go
```

### 3. Register Native Host
Run Command Prompt as Administrator:
```bash
cd native-messaging
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CD%\com.augmentcode.email_verifier.json" /f
```

### 4. Install Browser Extension

#### Chrome Extension
1. Open Chrome browser
2. Visit `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the `chrome-extension` folder

#### Edge Dedicated Extension (Recommended)
```cmd
# Windows
scripts\install-edge.bat

# Linux/macOS
./scripts/install-edge.sh
```
1. Open Microsoft Edge browser
2. Visit `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `edge-extension` folder

### 5. Start Using
1. Visit https://app.augmentcode.com/
2. Click the extension icon
3. Click "Start Login" button
4. Wait for automatic login completion

## 📁 Project Structure

```
AugmentCodeFreeVIP-Extension/
├── chrome-extension/           # Chrome extension files
│   ├── manifest.json          # Extension manifest
│   ├── popup.html             # Popup interface
│   ├── popup.js               # Popup logic
│   ├── content.js             # Content script
│   ├── background.js          # Background script
│   └── icons/                 # Extension icons
├── edge-extension/            # Edge dedicated extension files
│   ├── manifest.json          # Edge dedicated manifest
│   ├── popup.html             # Edge optimized interface
│   ├── popup.js               # Edge dedicated logic
│   ├── content.js             # Edge content script
│   ├── background.js          # Edge background script
│   ├── config.json            # Edge dedicated config
│   └── icons/                 # Extension icons
├── native-messaging/          # Native Host program
│   ├── email_verifier_host.go # Main program
│   ├── email_verification.go  # Email verification logic
│   ├── *.exe                  # Compiled executable files
│   └── *.json                 # Configuration files
├── scripts/                   # Cross-platform script tools
│   ├── build.bat/.sh          # Build scripts
│   ├── install.bat/.sh        # Install scripts
│   ├── install-edge.bat/.sh   # Edge dedicated install
│   ├── setup.bat/.sh          # One-click install scripts
│   └── uninstall.bat/.sh      # Uninstall scripts
├── docs/                      # Documentation directory
└── README.md                  # This file
```

## 🔧 Configuration

### 📧 Detailed Email Configuration

#### 🔄 System Working Principle
This software uses an **enterprise email forwarding mechanism** to achieve automated verification code retrieval:

1. **Domain Email Generation**: System automatically generates `random-digits@dddd.tools` format emails for registration
2. **Email Forwarding Setup**: Forward all emails sent to `*@dddd.tools` to your personal mailbox
3. **Verification Code Retrieval**: Program connects to your personal mailbox via IMAP protocol to get forwarded verification emails
4. **Automatic Parsing**: Automatically extracts verification codes from emails and completes verification process

#### ⚙️ Required Configuration Steps

##### Step 1: Domain Email Forwarding Setup
**⚠️ Important: This step must be completed first, otherwise verification emails cannot be received**

You need administrative access to the `dddd.tools` domain and set up email forwarding rules:

**Forwarding Rule Configuration:**
```
Source Address: *@dddd.tools
Target Address: Your personal email (e.g., yourname@gmail.com)
```

**Common Domain Provider Setup Methods:**
- **Cloudflare**: DNS → Email Routing → Catch-all address → Set forwarding to personal email
- **Namecheap**: Domain List → Manage → Redirect Email → Configure catch-all forwarding
- **GoDaddy**: Email & Office → Email Forwarding → Set wildcard forwarding
- **AWS Route 53**: Create MX records and configure SES forwarding rules

##### Step 2: Personal Email IMAP Configuration
Configure your personal email information in `native-messaging/email_verification.go`:

```go
config := EmailConfig{
    Email:          "yourname@gmail.com",       // Your personal email (receives forwarded emails)
    GeneratedEmail: generateRandomEmail(),      // Auto-generated @dddd.tools email
    Password:       "your-app-password",        // Email password or app-specific password
    IMAPServer:     "imap.gmail.com",          // IMAP server address
    IMAPPort:       993,                        // IMAP port (SSL)
}
```

#### 📋 Email Provider Configuration Reference

##### Gmail Configuration
```go
config := EmailConfig{
    Email:      "yourname@gmail.com",
    Password:   "your-app-password",    // Must use app-specific password
    IMAPServer: "imap.gmail.com",
    IMAPPort:   993,
}
```
**Setting up App-Specific Password:**
1. Login to Google Account → Security → 2-Step Verification
2. App passwords → Select app and device → Generate password
3. Use the generated 16-digit password to replace `your-app-password`

##### Outlook/Hotmail Configuration
```go
config := EmailConfig{
    Email:      "yourname@outlook.com",
    Password:   "your-password",
    IMAPServer: "outlook.office365.com",
    IMAPPort:   993,
}
```

##### Yahoo Mail Configuration
```go
config := EmailConfig{
    Email:      "yourname@yahoo.com",
    Password:   "your-app-password",    // Use app-specific password
    IMAPServer: "imap.mail.yahoo.com",
    IMAPPort:   993,
}
```

#### 🔧 Configuration Verification Testing

After configuration, it's recommended to perform verification testing:

1. **Send Test Email**:
   ```bash
   # Send test email to generated @dddd.tools address
   echo "Test content" | mail -s "Test subject" 123456@dddd.tools
   ```

2. **Check if Forwarding Works**:
   - Check if your personal mailbox receives the forwarded test email
   - Confirm email source shows as `123456@dddd.tools`

3. **Test IMAP Connection**:
   ```bash
   # Run in native-messaging directory
   go run email_verification.go
   ```

### Extension Configuration
The extension automatically generates random emails, no manual configuration needed. Modify relevant parameters if customization is required.

### Security Configuration
- **Email Password**: Recommend using app-specific passwords
- **IMAP Connection**: Force TLS encryption
- **Permission Control**: Extension only requests necessary permissions
- **Data Storage**: Sensitive information only stored locally

### Performance Tuning
- **Delay Settings**: Verification code retrieval delay 20 seconds, adjustable based on network environment
- **Retry Mechanism**: Failed operations automatically retry, maximum 3 times
- **Memory Management**: Automatic cleanup of temporary data and connections

## 📖 Usage Guide

### Basic Usage
1. **Open Extension**: Click the extension icon in browser toolbar
2. **Check Status**: Confirm "✅ Ready" status is displayed
3. **Start Login**: Click "Start Login" button
4. **Wait for Completion**: Observe log output, wait for login completion

### Advanced Features
- **Refresh Email**: Click 🔄 button next to email to generate new email
- **View Logs**: View detailed operation logs in extension popup
- **Manual Intervention**: Manually click verification box if human verification encountered

### Operation Flow
```
1. Email Fill → 2. Human Verification → 3. Code Retrieval → 4. Terms Accept → 5. Login Complete
   (Auto)        (Smart Handle, manual click required for some regions)  (Auto Get)     (Auto Check)     (Status Display)
```

### Notes
- **Network Environment**: Some regional IPs may require manual human verification handling
- **Wait Time**: Verification code retrieval has 20-second delay to ensure latest code retrieval
- **Page Navigation**: Do not switch tabs or close browser during login process

## 🐛 Troubleshooting

### Common Issues

1. **Go environment not found**
   ```bash
   # Check Go installation
   go version

   # If not installed, visit https://golang.org/dl/
   ```

2. **Insufficient permissions**
   ```bash
   # Linux/macOS: Set execute permissions
   chmod +x scripts/*.sh

   # Windows: Run as administrator
   ```

3. **Native Host registration failed**
   - Check if configuration file path is correct
   - Confirm browser is installed
   - Try manual registration

4. **Build failed**
   - Check if Go version is >=1.19
   - Confirm project files are complete
   - Check network connection (Go module download)

### Debugging Methods
- View detailed information from script output
- Check generated configuration files
- Verify executable files are correctly generated

## 🏗️ Technical Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome Ext    │◄──►│  Native Host    │◄──►│   Mail Server   │
│                 │    │                 │    │                 │
│ • popup.js      │    │ • Go Program    │    │ • IMAP Service  │
│ • content.js    │    │ • Email Verify  │    │ • Mail Forward  │
│ • background.js │    │ • Code Extract  │    │ • TLS Encrypt   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Communication Mechanism
- **Native Messaging**: Secure communication between Chrome extension and local program
- **Message Passing**: Message passing between extension internal components
- **IMAP Protocol**: Standard protocol communication with email servers
- **TLS Encryption**: All network communications use encrypted transmission

### Data Flow
```
User Action → Extension UI → Background Script → Native Host → Mail Server
                                    ↓
Page Action ← Content Script ← Background Script ← Code Return
```

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

### Development Tools
- **Go**: Backend Native Host development
- **JavaScript**: Frontend extension development
- **Chrome DevTools**: Debugging and testing
- **Git**: Version control

## 📄 License

This project is licensed under the [MIT License](LICENSE).


## ⚠️ Disclaimer

### 📚 Usage Statement
This project is for **learning and research purposes only**, aimed at:
- Learning Chrome extension development techniques
- Researching automated testing methods
- Exploring Native Messaging mechanisms
- Exchanging programming techniques and experiences

**Strictly prohibited for any commercial use, illegal activities, or violation of terms of service.**

### ⚖️ Legal Responsibility
1. **Usage Risk**:
   - All risks from using this software are borne by the user
   - Developers are not responsible for any direct or indirect losses
   - Users should fully understand relevant risks before use

2. **Compliance Use**:
   - Users should ensure use of this software complies with local laws and regulations
   - Comply with cybersecurity laws, data protection laws, and other relevant laws
   - Must not be used for any illegal activities

3. **Terms of Service**:
   - Users should comply with target website's terms of service and usage agreements
   - Respect website's robots.txt and usage restrictions
   - Must not cause undue burden or damage to target websites

4. **Data Security**:
   - Users should properly protect personal account information and data
   - Must not leak or abuse others' account information
   - Comply with data protection and privacy-related regulations

### 🔧 Technical Limitations
1. **Compatibility**:
   - This software may fail due to target website updates
   - Not guaranteed to work properly in all environments
   - May conflict with other software or extensions

2. **Stability**:
   - Automated operations may be affected by network environment
   - Server response time may affect success rate
   - Human verification mechanisms may cause operation failures

3. **Accuracy**:
   - Does not guarantee 100% success rate and accuracy
   - May have misoperations or data errors
   - Users should verify correctness of operation results

4. **Maintenance**:
   - Developers provide continuous maintenance and updates
   - May have undiscovered bugs and security vulnerabilities

### 📞 Contact Information

If you have questions or suggestions, please contact through:

#### 📞 Contact Methods

#### WeChat Contact
<div align="center">
<img src="docs/images/wechat-qr.png" alt="WeChat QR Code" width="200"/>
<br>
<strong>NPC</strong>
<br>
Scan the QR code above to add as friend
</div>

#### Other Contact Methods
- **GitHub Issues**: Submit technical questions and feature suggestions
- **Technical Discussion**: Welcome technical discussions via WeChat

---

**⚠️ Important Reminder**: Please carefully read and understand the above disclaimer before use. Continued use of this software indicates your agreement to assume all related risks and responsibilities.

**📚 Learning Exchange**: This project aims to promote technical learning and exchange, and developers are welcome to participate in discussions and improvements.
