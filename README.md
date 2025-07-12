# AugmentCode 自动登录扩展

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![Go](https://img.shields.io/badge/Go-1.19+-00ADD8.svg)](https://golang.org/)

> **🌐 Language**: [中文](README.md) | [English](README_EN.md)

一个智能化的Chrome扩展，用于自动化处理AugmentCode网站的登录流程，支持邮箱注册、验证码获取、人机验证处理等功能。

## 🎯 功能特性

### 🤖 智能自动化
- **自动邮箱注册**: 使用随机生成的@dddd.tools邮箱地址
- **验证码自动获取**: 从邮箱服务器自动获取验证码
- **人机验证处理**: 智能处理Cloudflare、reCAPTCHA等验证
- **条款自动接受**: 自动勾选服务条款并提交

### 📧 邮箱系统
- **随机邮箱生成**: 6位随机数字@dddd.tools格式
- **邮箱刷新功能**: 一键生成新的随机邮箱
- **邮件转发机制**: 验证码自动转发到指定邮箱
- **多服务器支持**: 支持多个IMAP服务器备用

### 🌐 双浏览器支持
- **Chrome扩展**: 标准版本，适用于Chrome浏览器
- **Edge专用版**: 优化随机邮箱算法，解决Edge兼容性问题
- **独立运行**: 两个版本完全独立，避免冲突
- **增强算法**: Edge版本使用多重随机源确保真正随机

### 🔐 安全特性
- **Native Messaging**: 安全的扩展与本地程序通信
- **TLS加密**: 所有邮箱连接使用TLS加密
- **权限最小化**: 仅请求必要的浏览器权限
- **本地存储**: 配置信息安全存储在本地

### 🎨 用户体验
- **实时状态显示**: 详细的操作状态和进度
- **可视化日志**: 完整的操作日志记录
- **错误处理**: 完善的错误处理和重试机制
- **登录完成检测**: 自动检测登录完成状态

## 📋 系统要求

- **操作系统**: Windows 10/11 (64位)
- **浏览器**: Chrome 88+ 或 Edge 88+
- **内存**: 最低 4GB RAM
- **网络**: 稳定的互联网连接
- **Go环境**: Go 1.19+ (仅开发时需要)

## 🚀 快速开始

### 1. 下载项目
```bash
git clone https://github.com/chinanpc/AugmentCodeFreeVIP.git
cd AugmentCodeFreeVIP-Extension
```

### 2. 构建Native Host
```bash
cd native-messaging
go build -o email_verifier_host.exe email_verifier_host.go email_verification.go
```

### 3. 注册Native Host
以管理员身份运行命令提示符：
```bash
cd native-messaging
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CD%\com.augmentcode.email_verifier.json" /f
```

### 4. 安装浏览器扩展

#### Chrome扩展
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹

#### Edge专用扩展（推荐）
```cmd
# Windows
scripts\install-edge.bat

# Linux/macOS
./scripts/install-edge.sh
```
1. 打开Microsoft Edge浏览器
2. 访问 `edge://extensions/`
3. 开启"开发人员模式"
4. 点击"加载解压缩的扩展"
5. 选择 `edge-extension` 文件夹

### 5. 开始使用
1. 访问 https://app.augmentcode.com/
2. 点击扩展图标
3. 点击"开始登录"按钮
4. 等待自动登录完成

## 📁 项目结构

```
AugmentCodeFreeVIP-Extension/
├── chrome-extension/           # Chrome扩展文件
│   ├── manifest.json          # 扩展清单
│   ├── popup.html             # 弹窗界面
│   ├── popup.js               # 弹窗逻辑
│   ├── content.js             # 内容脚本
│   ├── background.js          # 后台脚本
│   └── icons/                 # 扩展图标
├── edge-extension/            # Edge专用扩展文件
│   ├── manifest.json          # Edge专用清单
│   ├── popup.html             # Edge优化界面
│   ├── popup.js               # Edge专用逻辑
│   ├── content.js             # Edge内容脚本
│   ├── background.js          # Edge后台脚本
│   ├── config.json            # Edge专用配置
│   └── icons/                 # 扩展图标
├── native-messaging/          # Native Host程序
│   ├── email_verifier_host.go # 主程序
│   ├── email_verification.go  # 邮箱验证逻辑
│   ├── *.exe                  # 编译后的可执行文件
│   └── *.json                 # 配置文件
├── scripts/                   # 跨平台脚本工具
│   ├── build.bat/.sh          # 构建脚本
│   ├── install.bat/.sh        # 安装脚本
│   ├── install-edge.bat/.sh   # Edge专用安装
│   ├── setup.bat/.sh          # 一键安装脚本
│   └── uninstall.bat/.sh      # 卸载脚本
├── docs/                      # 文档目录
└── README.md                  # 本文件
```

## 🔧 配置说明

### 邮箱配置
邮箱配置在 `email_verification.go` 中：
```go
config := EmailConfig{
    Email:          "your-email@domain.com",    // 实际接收邮件的邮箱
    GeneratedEmail: generateRandomEmail(),      // 生成的注册邮箱
    Password:       "your-password",            // 邮箱密码
    IMAPServer:     "imap.your-server.com",     // IMAP服务器
    IMAPPort:       993,                        // IMAP端口
}
```

### 扩展配置
扩展会自动生成随机邮箱，无需手动配置。如需自定义，可修改相关参数。

### 安全配置
- **邮箱密码**: 建议使用应用专用密码
- **IMAP连接**: 强制使用TLS加密
- **权限控制**: 扩展仅请求必要权限
- **数据存储**: 敏感信息仅存储在本地

### 性能调优
- **延迟设置**: 验证码获取延迟20秒，可根据网络环境调整
- **重试机制**: 失败操作自动重试，最多3次
- **内存管理**: 自动清理临时数据和连接

## 📖 使用指南

### 基本使用
1. **打开扩展**: 点击浏览器工具栏中的扩展图标
2. **检查状态**: 确认显示"✅ 就绪"状态
3. **开始登录**: 点击"开始登录"按钮
4. **等待完成**: 观察日志输出，等待登录完成

### 高级功能
- **刷新邮箱**: 点击邮箱右侧的🔄按钮生成新邮箱
- **查看日志**: 在扩展弹窗中查看详细操作日志
- **手动干预**: 如遇人机验证，可手动点击验证框

### 操作流程
```
1. 邮箱填写 → 2. 人机验证 → 3. 验证码获取 → 4. 条款接受 → 5. 登录完成
   (自动)      (智能处理，部分地区IP原因，当出现Verify you are human字样时需手动点击勾选框)     (自动获取)     (自动勾选)     (状态显示)
```

### 注意事项
- **网络环境**: 部分地区IP可能需要手动处理人机验证
- **等待时间**: 验证码获取有20秒延迟，确保获取最新验证码
- **页面跳转**: 请勿在登录过程中切换标签页或关闭浏览器

## 🐛 故障排除

### 常见问题
1. **Native Host连接失败**: 检查是否正确注册和构建
2. **验证码获取失败**: 检查邮箱配置和网络连接
3. **人机验证卡住**: 手动点击验证框后继续
4. **页面元素未找到**: 可能网站结构已更新

### 调试方法
- **查看控制台**: F12打开开发者工具查看错误
- **检查日志**: 查看扩展弹窗中的操作日志
- **重新加载**: 禁用并重新启用扩展

## 🏗️ 技术架构

### 系统组件
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome扩展    │◄──►│  Native Host    │◄──►│   邮箱服务器    │
│                 │    │                 │    │                 │
│ • popup.js      │    │ • Go程序        │    │ • IMAP服务      │
│ • content.js    │    │ • 邮箱验证      │    │ • 邮件转发      │
│ • background.js │    │ • 验证码提取    │    │ • TLS加密       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 通信机制
- **Native Messaging**: Chrome扩展与本地程序的安全通信
- **Message Passing**: 扩展内部组件间的消息传递
- **IMAP Protocol**: 与邮箱服务器的标准协议通信
- **TLS Encryption**: 所有网络通信使用加密传输

### 数据流向
```
用户操作 → 扩展UI → Background Script → Native Host → 邮箱服务器
                                    ↓
页面操作 ← Content Script ← Background Script ← 验证码返回
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！


## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 📖 关于项目

想了解更多关于项目背景、技术架构和开发团队的信息？请查看：
- **[关于我们 (中文)](ABOUT.md)**
- **[About Us (English)](ABOUT_EN.md)**

## ⚠️ 免责声明

### 📚 使用声明
本项目仅供**学习和研究目的**使用，旨在：
- 学习Chrome扩展开发技术
- 研究自动化测试方法
- 探索Native Messaging机制
- 交流编程技术和经验

**严禁用于任何商业用途、非法活动或违反服务条款的行为。**

### ⚖️ 法律责任
1. **使用风险**:
   - 使用本软件的所有风险由用户自行承担
   - 开发者不对任何直接或间接损失负责
   - 用户应在使用前充分了解相关风险

2. **合规使用**:
   - 用户应确保使用本软件符合当地法律法规
   - 遵守网络安全法、数据保护法等相关法律
   - 不得用于任何违法违规活动

3. **服务条款**:
   - 用户应遵守目标网站的服务条款和使用协议
   - 尊重网站的robots.txt和使用限制
   - 不得对目标网站造成不当负担或损害

4. **数据安全**:
   - 用户应妥善保管个人账户信息和数据
   - 不得泄露或滥用他人账户信息
   - 遵守数据保护和隐私相关法规

### 🔧 技术限制
1. **兼容性**:
   - 本软件可能因目标网站更新而失效
   - 不保证在所有环境下都能正常工作
   - 可能与其他软件或扩展产生冲突

2. **稳定性**:
   - 自动化操作可能受网络环境影响
   - 服务器响应时间可能影响成功率
   - 人机验证机制可能导致操作失败

3. **准确性**:
   - 不保证100%的成功率和准确性
   - 可能出现误操作或数据错误
   - 用户应验证操作结果的正确性

4. **维护**:
   - 开发者持续维护和更新
   - 可能存在未发现的bug和安全漏洞



### 📞 联系方式

如有疑问或建议，请通过以下方式联系：

#### 微信联系
<div align="center">
<img src="docs/images/wechat-qr.png" alt="微信二维码" width="200"/>
<br>
<strong>NPC</strong>
<br>
扫一扫上面的二维码图案，加我为朋友
</div>

#### 其他联系方式
- **GitHub Issues**: 提交技术问题和功能建议
- **技术交流**: 欢迎通过微信进行技术讨论

---

**⚠️ 重要提醒**: 请在使用前仔细阅读并理解上述免责声明。继续使用本软件即表示您同意承担所有相关风险和责任。

**📚 学习交流**: 本项目旨在促进技术学习和交流，欢迎开发者参与讨论和改进。
