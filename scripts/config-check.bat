@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: AugmentCode 配置检查脚本
:: Configuration Check Script for AugmentCode

echo 🔍 AugmentCode 配置检查工具
echo 🔍 AugmentCode Configuration Check Tool
echo ========================================

echo.
echo 📋 检查清单 / Checklist:
echo ========================

:: 1. 检查Go环境
echo.
echo 1️⃣ 检查Go环境 / Checking Go Environment...

where go >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('go version') do set GO_VERSION=%%i
    set GO_VERSION=!GO_VERSION:go=!
    echo    Go版本 / Go Version: !GO_VERSION!
    echo    ✅ Go环境正常 / Go environment OK
) else (
    echo    ❌ 未安装Go / Go not installed
)

:: 2. 检查项目文件
echo.
echo 2️⃣ 检查项目文件 / Checking Project Files...

set FILES_OK=1

if exist "native-messaging\email_verification.go" (
    echo    ✅ native-messaging\email_verification.go
) else (
    echo    ❌ native-messaging\email_verification.go ^(缺失 / Missing^)
    set FILES_OK=0
)

if exist "native-messaging\email_verifier_host.go" (
    echo    ✅ native-messaging\email_verifier_host.go
) else (
    echo    ❌ native-messaging\email_verifier_host.go ^(缺失 / Missing^)
    set FILES_OK=0
)

if exist "native-messaging\go.mod" (
    echo    ✅ native-messaging\go.mod
) else (
    echo    ❌ native-messaging\go.mod ^(缺失 / Missing^)
    set FILES_OK=0
)

if exist "chrome-extension\manifest.json" (
    echo    ✅ chrome-extension\manifest.json
) else (
    echo    ❌ chrome-extension\manifest.json ^(缺失 / Missing^)
    set FILES_OK=0
)

if exist "chrome-extension\popup.js" (
    echo    ✅ chrome-extension\popup.js
) else (
    echo    ❌ chrome-extension\popup.js ^(缺失 / Missing^)
    set FILES_OK=0
)

if !FILES_OK! equ 1 (
    echo    ✅ 项目文件完整 / Project files complete
) else (
    echo    ❌ 项目文件不完整 / Project files incomplete
)

:: 3. 检查邮箱配置
echo.
echo 3️⃣ 检查邮箱配置 / Checking Email Configuration...

if exist "native-messaging\email_verification.go" (
    findstr /c:"your-email@domain.com" "native-messaging\email_verification.go" >nul
    if !errorlevel! equ 0 (
        echo    ❌ 邮箱配置未修改，仍为默认值 / Email config not modified, still default values
        echo    💡 请修改 native-messaging\email_verification.go 中的邮箱配置
        echo    💡 Please modify email configuration in native-messaging\email_verification.go
    ) else (
        echo    ✅ 邮箱配置已修改 / Email configuration modified
    )
    
    findstr /c:"your-password" "native-messaging\email_verification.go" >nul
    if !errorlevel! equ 0 (
        echo    ❌ 邮箱密码未配置 / Email password not configured
        echo    💡 请设置真实的邮箱密码或应用专用密码
        echo    💡 Please set real email password or app-specific password
    ) else (
        echo    ✅ 邮箱密码已配置 / Email password configured
    )
) else (
    echo    ❌ 邮箱配置文件不存在 / Email configuration file not found
)

:: 4. 检查Go依赖包
echo.
echo 4️⃣ 检查Go依赖包 / Checking Go Dependencies...

if exist "native-messaging\go.mod" (
    cd native-messaging
    go mod verify >nul 2>&1
    if !errorlevel! equ 0 (
        echo    ✅ Go依赖包正常 / Go dependencies OK
    ) else (
        echo    ❌ Go依赖包有问题 / Go dependencies have issues
        echo    💡 运行 'go mod tidy' 修复依赖
        echo    💡 Run 'go mod tidy' to fix dependencies
    )
    cd ..
) else (
    echo    ❌ go.mod文件不存在 / go.mod file not found
)

:: 5. 网络连接检查
echo.
echo 5️⃣ 检查网络连接 / Checking Network Connectivity...

ping -n 1 github.com >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ GitHub连接正常 / GitHub connectivity OK
) else (
    echo    ❌ GitHub连接失败 / GitHub connectivity failed
)

:: 检查邮箱服务器连接
echo.
echo 📧 检查邮箱服务器连接 / Checking Email Server Connectivity...

:: 使用telnet检查IMAP端口（如果可用）
echo    检查常见IMAP服务器... / Checking common IMAP servers...
echo    ⚠️ 需要手动测试IMAP连接 / Manual IMAP connection testing required
echo    💡 可以使用邮箱客户端测试相同配置 / Can use email client to test same configuration

:: 总结
echo.
echo 📊 配置检查总结 / Configuration Check Summary:
echo ==============================================
echo.
echo 📖 下一步操作建议 / Next Steps:
echo.
echo 1. 如果邮箱配置未修改，请编辑 native-messaging\email_verification.go
echo    If email config not modified, please edit native-messaging\email_verification.go
echo.
echo 2. 确保您拥有 dddd.tools 域名管理权限并设置邮箱转发
echo    Ensure you have dddd.tools domain admin access and set up email forwarding
echo.
echo 3. 获取邮箱的应用专用密码或授权码
echo    Obtain app-specific password or authorization code for your email
echo.
echo 4. 运行构建脚本: .\scripts\build.bat
echo    Run build script: .\scripts\build.bat
echo.
echo 5. 安装扩展: .\scripts\install.bat
echo    Install extension: .\scripts\install.bat
echo.
echo 🎉 配置完成后即可开始使用！
echo 🎉 Ready to use after configuration is complete!

pause
