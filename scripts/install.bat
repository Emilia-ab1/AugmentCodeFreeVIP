@echo off
chcp 65001 >nul
echo ========================================
echo   AugmentCode 自动登录扩展 - 安装脚本
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] 建议以管理员身份运行以获得最佳兼容性
    echo 继续使用当前用户权限安装...
    echo.
)

:: 设置路径变量
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "NATIVE_DIR=%PROJECT_DIR%\native-messaging"
set "EXTENSION_DIR=%PROJECT_DIR%\chrome-extension"

:: 检查必要文件
echo [1/5] 检查必要文件...
if not exist "%NATIVE_DIR%\email_verifier_host.exe" (
    echo [ERROR] email_verifier_host.exe 未找到
    echo 请先运行 build.bat 构建程序
    pause
    exit /b 1
)
if not exist "%NATIVE_DIR%\com.augmentcode.email_verifier.json" (
    echo [ERROR] Native Host配置文件未找到
    pause
    exit /b 1
)
if not exist "%EXTENSION_DIR%\manifest.json" (
    echo [ERROR] Chrome扩展文件未找到
    pause
    exit /b 1
)
echo [OK] 必要文件检查通过

:: 更新配置文件路径
echo.
echo [2/5] 更新Native Host配置...
set "CONFIG_FILE=%NATIVE_DIR%\com.augmentcode.email_verifier.json"
set "EXE_PATH=%NATIVE_DIR%\email_verifier_host.exe"

:: 使用PowerShell更新JSON文件中的路径
powershell -Command "& {
    $json = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json;
    $json.path = '%EXE_PATH%'.Replace('\', '\\');
    $json | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG_FILE%' -Encoding UTF8
}"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 配置文件更新失败
    pause
    exit /b 1
)
echo [OK] 配置文件已更新

:: 注册Native Host
echo.
echo [3/5] 注册Native Host...
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CONFIG_FILE%" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Chrome Native Host 注册成功
) else (
    echo [WARNING] Chrome 注册失败，尝试 Edge...
)

:: 尝试注册到Edge
reg add "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CONFIG_FILE%" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Edge Native Host 注册成功
) else (
    echo [WARNING] Edge 注册失败
)

:: 显示扩展安装说明
echo.
echo [4/5] Chrome扩展安装说明...
echo 请按以下步骤手动安装Chrome扩展：
echo 1. 打开Chrome浏览器
echo 2. 访问 chrome://extensions/
echo 3. 开启右上角的"开发者模式"
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择目录: %EXTENSION_DIR%
echo.

:: 验证安装
echo [5/5] 验证安装...
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Native Host 注册验证成功
) else (
    echo [WARNING] Native Host 注册验证失败
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo Native Host: 已注册
echo 扩展目录: %EXTENSION_DIR%
echo 配置文件: %CONFIG_FILE%
echo.
echo 下一步: 在浏览器中加载扩展并配置邮箱信息
echo.
pause
