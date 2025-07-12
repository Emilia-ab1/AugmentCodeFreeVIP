# 🛠️ 跨平台脚本工具

本目录包含了AugmentCode自动登录扩展的跨平台构建、安装和管理脚本。

> **🌐 Language**: [中文](README.md) | [English](README_EN.md)

## 📁 脚本列表

### 🔨 构建脚本
- **`build.bat`** - Windows构建脚本
- **`build.sh`** - Linux/macOS构建脚本

### 📦 安装脚本
- **`install.bat`** - Windows安装脚本
- **`install.sh`** - Linux/macOS安装脚本

### 🗑️ 卸载脚本
- **`uninstall.bat`** - Windows卸载脚本
- **`uninstall.sh`** - Linux/macOS卸载脚本

### 🚀 一键脚本
- **`setup.bat`** - Windows一键安装脚本
- **`setup.sh`** - Linux/macOS一键安装脚本

### 🔍 开发工具
- **`dev-check.sh`** - 开发环境检查脚本（跨平台）

## 🎯 使用方法

### Windows用户

#### 快速开始（推荐）
```cmd
# 一键安装
scripts\setup.bat
```

#### 分步操作
```cmd
# 1. 构建程序
scripts\build.bat

# 2. 安装扩展
scripts\install.bat

# 3. 卸载（如需要）
scripts\uninstall.bat
```

### Linux/macOS用户

#### 快速开始（推荐）
```bash
# 设置执行权限（首次运行）
chmod +x scripts/*.sh

# 一键安装
./scripts/setup.sh
```

#### 分步操作
```bash
# 1. 环境检查
./scripts/dev-check.sh

# 2. 构建程序
./scripts/build.sh

# 3. 安装扩展
./scripts/install.sh

# 4. 卸载（如需要）
./scripts/uninstall.sh
```

## 🔧 脚本功能详解

### 构建脚本 (build.*)
- ✅ 检查Go环境
- ✅ 编译Native Host程序
- ✅ 生成平台特定的可执行文件
- ✅ 验证构建结果

### 安装脚本 (install.*)
- ✅ 检查必要文件
- ✅ 更新配置文件路径
- ✅ 注册Native Host到浏览器
- ✅ 提供扩展安装指导

### 卸载脚本 (uninstall.*)
- ✅ 删除Native Host注册
- ✅ 清理可执行文件
- ✅ 清理临时文件
- ✅ 提供扩展移除指导

### 一键脚本 (setup.*)
- ✅ 环境检查
- ✅ 自动构建
- ✅ 自动安装
- ✅ 完整使用指导

### 开发检查脚本 (dev-check.sh)
- ✅ Go环境检查
- ✅ Git环境检查
- ✅ Node.js环境检查（可选）
- ✅ 浏览器环境检查
- ✅ 项目文件完整性检查
- ✅ Go模块验证

## 🌍 平台支持

| 平台 | 构建 | 安装 | 卸载 | 一键安装 |
|------|------|------|------|----------|
| Windows 10/11 | ✅ | ✅ | ✅ | ✅ |
| macOS | ✅ | ✅ | ✅ | ✅ |
| Linux | ✅ | ✅ | ✅ | ✅ |

## 📋 系统要求

### 通用要求
- **Go 1.19+**: 用于构建Native Host程序
- **Chrome/Edge**: 用于运行扩展

### Windows特定
- **PowerShell**: 用于JSON配置更新
- **注册表访问**: 用于Native Host注册

### Linux/macOS特定
- **Bash**: 用于运行Shell脚本
- **基本Unix工具**: sed, awk, chmod等

## 🚨 注意事项

### 权限要求
- **Windows**: 建议以管理员身份运行以获得最佳兼容性
- **Linux/macOS**: 需要对用户配置目录的写权限

### 文件路径
- 所有脚本使用相对路径，确保在项目根目录运行
- 配置文件会自动更新为绝对路径

### 浏览器支持
- 主要支持Chrome，同时兼容Edge
- 需要手动在浏览器中加载扩展

## 🔍 故障排除

### 常见问题

1. **Go环境未找到**
   ```bash
   # 检查Go安装
   go version
   
   # 如果未安装，请访问 https://golang.org/dl/
   ```

2. **权限不足**
   ```bash
   # Linux/macOS: 设置执行权限
   chmod +x scripts/*.sh
   
   # Windows: 以管理员身份运行
   ```

3. **Native Host注册失败**
   - 检查配置文件路径是否正确
   - 确认浏览器已安装
   - 尝试手动注册

4. **构建失败**
   - 检查Go版本是否>=1.19
   - 确认项目文件完整
   - 检查网络连接（Go模块下载）

### 调试方法
- 查看脚本输出的详细信息
- 检查生成的配置文件
- 验证可执行文件是否正确生成

## 📞 技术支持

如遇问题，请：
1. 查看脚本输出的错误信息
2. 运行 `dev-check.sh` 检查环境
3. 提交GitHub Issue并附上错误日志
4. 通过微信联系技术支持

---

**💡 提示**: 推荐使用一键脚本 `setup.*` 进行首次安装，可以自动完成所有必要步骤。
