@echo off
chcp 65001 >nul
echo ========================================
echo   AugmentCode 自动登录扩展 - 一键安装
echo ========================================
echo.

echo 此脚本将自动完成以下操作：
echo 1. 检查开发环境
echo 2. 构建Native Host程序
echo 3. 安装并注册扩展
echo 4. 显示使用说明
echo.
set /p confirm="继续安装？(Y/n): "
if /i "%confirm%"=="n" (
    echo 取消安装
    pause
    exit /b 0
)

echo.
echo ========================================
echo   第1步：环境检查
echo ========================================

:: 检查Go环境
echo 检查Go环境...
go version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go未安装！
    echo 请从 https://golang.org/dl/ 下载并安装Go 1.19+
    echo.
    pause
    exit /b 1
)
echo [OK] Go环境检查通过

:: 检查项目文件
echo 检查项目文件...
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
if not exist "%PROJECT_DIR%\native-messaging\email_verifier_host.go" (
    echo [ERROR] 项目文件不完整
    pause
    exit /b 1
)
echo [OK] 项目文件检查通过

echo.
echo ========================================
echo   第2步：构建程序
echo ========================================

call "%SCRIPT_DIR%build.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 构建失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   第3步：安装扩展
echo ========================================

call "%SCRIPT_DIR%install.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 安装失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   第4步：使用说明
echo ========================================
echo.
echo 🎉 安装完成！请按以下步骤开始使用：
echo.
echo 📋 浏览器扩展安装：
echo 1. 打开Chrome浏览器
echo 2. 访问 chrome://extensions/
echo 3. 开启"开发者模式"
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择目录: %PROJECT_DIR%\chrome-extension
echo.
echo ⚙️ 邮箱配置：
echo 1. 编辑文件: %PROJECT_DIR%\native-messaging\email_verification.go
echo 2. 填写您的邮箱配置信息
echo 3. 重新运行 build.bat 构建
echo.
echo 🚀 开始使用：
echo 1. 访问 https://app.augmentcode.com/
echo 2. 点击扩展图标
echo 3. 点击"开始登录"
echo.
echo 📞 技术支持：
echo - GitHub Issues: 提交问题和建议
echo - 微信: 扫描README.md中的二维码
echo.
echo ========================================
echo   安装向导完成！
echo ========================================
echo.
pause
