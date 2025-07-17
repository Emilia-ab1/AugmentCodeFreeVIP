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

## ⚠️ 重要配置提醒

**在开始使用前，您必须完成以下配置，否则程序无法正常运行：**

### 🔑 必需配置清单
- [ ] **域名邮箱转发**: 配置 `*@dddd.tools` 转发到您的个人邮箱
- [ ] **个人邮箱IMAP**: 在代码中配置您的邮箱IMAP信息
- [ ] **邮箱授权**: 启用IMAP服务并获取应用专用密码/授权码
- [ ] **Go环境**: 安装Go 1.19+用于编译Native Host程序

**⚡ 快速配置指南**:
1. 确保您拥有 `dddd.tools` 域名管理权限
2. 设置邮箱转发：`*@dddd.tools` → `您的邮箱@gmail.com`
3. 修改 `native-messaging/email_verification.go` 中的邮箱配置
4. 获取邮箱的应用专用密码或授权码

**🔍 配置检查工具**:
```bash
# 运行配置检查脚本，验证所有配置是否正确
./scripts/config-check.sh    # Linux/Mac
./scripts/config-check.bat   # Windows
```

> 📖 **详细配置说明请参考下方的 [📧 邮箱配置详解](#-邮箱配置详解) 章节**

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

### 📧 邮箱配置详解

#### 🔄 系统工作原理
本软件采用**企业邮箱转发机制**实现自动化验证码获取：

1. **域名邮箱生成**: 系统自动生成 `随机数字@dddd.tools` 格式的邮箱用于注册
2. **邮件转发设置**: 将所有发送到 `*@dddd.tools` 的邮件转发到您的个人邮箱
3. **验证码获取**: 程序通过IMAP协议连接您的个人邮箱获取转发的验证邮件
4. **自动解析**: 自动从邮件中提取验证码并完成验证流程

#### ⚙️ 必需配置步骤

##### 第一步：域名邮箱转发设置
**⚠️ 重要：必须先完成此步骤，否则无法接收验证邮件**

您需要拥有 `dddd.tools` 域名的管理权限，并设置邮箱转发规则：

**转发规则配置：**
```
源地址: *@dddd.tools
目标地址: 您的个人邮箱 (如: yourname@gmail.com)
```

**常见域名服务商设置方法：**
- **Cloudflare**: DNS → Email Routing → Catch-all address → 设置转发到个人邮箱
- **阿里云**: 域名控制台 → 邮箱 → 邮箱转发 → 添加转发规则
- **腾讯云**: 域名服务 → 邮箱功能 → 邮件转发 → 配置转发地址
- **GoDaddy**: Email & Office → Email Forwarding → 设置通配符转发

##### 第二步：个人邮箱IMAP配置
在 `native-messaging/email_verification.go` 中配置您的个人邮箱信息：

```go
config := EmailConfig{
    Email:          "yourname@gmail.com",       // 您的个人邮箱（接收转发邮件）
    GeneratedEmail: generateRandomEmail(),      // 自动生成的@dddd.tools邮箱
    Password:       "your-app-password",        // 邮箱密码或应用专用密码
    IMAPServer:     "imap.gmail.com",          // IMAP服务器地址
    IMAPPort:       993,                        // IMAP端口（SSL）
}
```

#### 📋 邮箱服务商配置参考

##### Gmail 配置
```go
config := EmailConfig{
    Email:      "yourname@gmail.com",
    Password:   "your-app-password",    // 必须使用应用专用密码
    IMAPServer: "imap.gmail.com",
    IMAPPort:   993,
}
```
**设置应用专用密码：**
1. 登录 Google 账户 → 安全性 → 两步验证
2. 应用专用密码 → 选择应用和设备 → 生成密码
3. 使用生成的16位密码替换 `your-app-password`

##### Outlook/Hotmail 配置
```go
config := EmailConfig{
    Email:      "yourname@outlook.com",
    Password:   "your-password",
    IMAPServer: "outlook.office365.com",
    IMAPPort:   993,
}
```

##### QQ邮箱 配置
```go
config := EmailConfig{
    Email:      "yourname@qq.com",
    Password:   "your-authorization-code",  // 使用授权码
    IMAPServer: "imap.qq.com",
    IMAPPort:   993,
}
```
**获取授权码：** QQ邮箱 → 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务 → 生成授权码

##### 163邮箱 配置
```go
config := EmailConfig{
    Email:      "yourname@163.com",
    Password:   "your-authorization-code",  // 使用授权码
    IMAPServer: "imap.163.com",
    IMAPPort:   993,
}
```

#### 🔧 配置验证测试

配置完成后，建议进行测试验证：

1. **发送测试邮件**：
   ```bash
   # 向生成的@dddd.tools邮箱发送测试邮件
   echo "测试邮件" | mail -s "测试主题" 123456@dddd.tools
   ```

2. **检查转发是否正常**：
   - 查看您的个人邮箱是否收到转发的测试邮件
   - 确认邮件来源显示为 `123456@dddd.tools`

3. **测试IMAP连接**：
   ```bash
   # 在native-messaging目录下运行
   go run email_verification.go
   ```

### 扩展配置
扩展会自动生成随机邮箱，无需手动配置。如需自定义，可修改相关参数。

#### 🔒 安全配置要求

##### 邮箱安全设置
- **应用专用密码**: 强烈建议使用应用专用密码，避免使用主账户密码
- **两步验证**: 启用邮箱的两步验证功能提高安全性
- **IMAP加密**: 必须使用TLS/SSL加密连接（端口993）
- **权限最小化**: 仅授予必要的邮箱访问权限

##### 域名安全管理
- **DNS安全**: 确保域名DNS记录安全，防止被恶意修改
- **转发监控**: 定期检查邮箱转发规则，确保未被篡改
- **访问日志**: 监控域名管理面板的访问日志

##### 代码安全
- **密码保护**: 不要在代码中硬编码密码，使用环境变量或配置文件
- **权限控制**: 扩展仅请求必要的浏览器权限
- **数据存储**: 敏感信息仅存储在本地，不上传到服务器

#### ⚠️ 常见配置错误及解决方案

##### 1. 邮箱转发未生效
**症状**: 发送到@dddd.tools的邮件无法收到
**解决方案**:
- 检查域名DNS设置是否正确
- 确认MX记录指向正确的邮件服务器
- 测试转发规则：发送测试邮件验证
- 检查垃圾邮件文件夹

##### 2. IMAP连接失败
**症状**: 程序无法连接到邮箱服务器
**解决方案**:
```bash
# 检查网络连接
telnet imap.gmail.com 993

# 验证IMAP设置
openssl s_client -connect imap.gmail.com:993
```
- 确认IMAP服务已启用
- 检查防火墙设置
- 验证服务器地址和端口
- 确认使用正确的密码/授权码

##### 3. 验证码获取失败
**症状**: 程序运行但无法获取验证码
**解决方案**:
- 检查邮件是否被过滤到垃圾邮件
- 确认邮件主题包含验证码关键词
- 增加邮件检索的时间范围
- 检查邮箱文件夹权限

##### 4. 权限被拒绝
**症状**: 邮箱提示权限不足或登录被拒绝
**解决方案**:
- Gmail: 启用"不够安全的应用的访问权限"
- Outlook: 检查安全默认值设置
- QQ/163: 确认已开启IMAP服务并获取授权码

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

## 🐛 故障排除与问题诊断

### 🔍 配置相关问题

#### 1. 邮箱转发配置问题
**问题症状**:
- 程序提示"未收到验证邮件"
- 验证码获取超时
- 邮箱连接正常但无法获取验证码

**诊断步骤**:
```bash
# 1. 测试邮箱转发是否正常
echo "测试内容" | mail -s "转发测试" test@dddd.tools

# 2. 检查个人邮箱是否收到转发邮件
# 3. 确认邮件来源显示为 test@dddd.tools
```

**解决方案**:
- 检查域名DNS的MX记录设置
- 确认邮箱转发规则配置正确
- 验证 `*@dddd.tools` 通配符转发已启用
- 检查垃圾邮件文件夹

#### 2. IMAP连接配置问题
**问题症状**:
- "IMAP连接失败"错误
- "认证失败"提示
- 连接超时

**诊断命令**:
```bash
# 测试IMAP服务器连通性
telnet imap.gmail.com 993

# 测试SSL连接
openssl s_client -connect imap.gmail.com:993 -servername imap.gmail.com
```

**解决方案**:
- **Gmail**: 启用两步验证并生成应用专用密码
- **Outlook**: 检查"安全默认值"设置
- **QQ邮箱**: 开启IMAP服务并使用授权码
- **163邮箱**: 开启客户端授权密码

#### 3. Go环境和编译问题
**问题症状**:
- Native Host程序无法启动
- 编译失败
- 依赖包下载失败

**解决步骤**:
```bash
# 1. 检查Go版本
go version  # 需要 Go 1.19+

# 2. 清理模块缓存
go clean -modcache

# 3. 重新下载依赖
cd native-messaging
go mod tidy
go mod download

# 4. 重新编译
go build -o email_verifier_host.exe
```

### 🚨 运行时问题

#### 1. Native Host连接失败
**错误信息**: "Native messaging host has exited"

**解决方案**:
```bash
# 1. 检查注册表项（Windows）
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.emailverifier"

# 2. 重新注册Native Host
cd scripts
./install.bat  # Windows
./install.sh   # Linux/Mac

# 3. 检查可执行文件权限
chmod +x native-messaging/email_verifier_host.exe
```

#### 2. 验证码获取失败
**可能原因及解决方案**:

**原因1**: 邮件延迟
```bash
# 增加等待时间（在代码中修改）
time.Sleep(30 * time.Second)  // 从20秒增加到30秒
```

**原因2**: 邮件被过滤
- 检查垃圾邮件文件夹
- 添加发件人到白名单
- 检查邮箱过滤规则

**原因3**: 验证码格式变化
```go
// 更新验证码正则表达式
codeRegex := regexp.MustCompile(`\b\d{6}\b`)  // 6位数字
codeRegex := regexp.MustCompile(`\b[A-Z0-9]{8}\b`)  // 8位字母数字
```

#### 3. 人机验证处理
**问题**: Cloudflare或reCAPTCHA验证卡住

**解决方案**:
- 手动点击验证框
- 等待验证完成后程序自动继续
- 如果多次失败，更换IP地址或使用代理

### 🔧 调试工具和方法

#### 1. 日志调试
```bash
# 启用详细日志
cd native-messaging
go run email_verifier_host.go -debug

# 查看扩展日志
# Chrome: 扩展管理 → 开发者模式 → 背景页 → 控制台
```

#### 2. 网络调试
```bash
# 检查网络连接
ping imap.gmail.com
nslookup dddd.tools

# 检查端口连通性
telnet imap.gmail.com 993
```

#### 3. 邮箱调试
```bash
# 使用邮箱客户端测试IMAP
# 推荐使用Thunderbird或Outlook测试相同配置
```

### 📞 获取技术支持

如果以上方法无法解决问题，请提供以下信息：

1. **系统环境**:
   - 操作系统版本
   - 浏览器版本
   - Go版本

2. **配置信息**:
   - 邮箱服务商
   - 域名服务商
   - 错误日志

3. **问题描述**:
   - 具体错误信息
   - 复现步骤
   - 已尝试的解决方案

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
