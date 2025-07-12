@echo off
chcp 65001 >nul
echo ========================================
echo   Edge专用扩展 - 安装脚本
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
set "EDGE_EXTENSION_DIR=%PROJECT_DIR%\edge-extension"

:: 检查必要文件
echo [1/6] 检查必要文件...
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
if not exist "%EDGE_EXTENSION_DIR%\manifest.json" (
    echo [ERROR] Edge扩展文件未找到
    pause
    exit /b 1
)
echo [OK] 必要文件检查通过

:: 复制图标文件
echo.
echo [2/6] 复制图标文件...
if not exist "%EDGE_EXTENSION_DIR%\icons" mkdir "%EDGE_EXTENSION_DIR%\icons"
if exist "%PROJECT_DIR%\chrome-extension\icons\icon16.png" (
    copy "%PROJECT_DIR%\chrome-extension\icons\*.png" "%EDGE_EXTENSION_DIR%\icons\" >nul 2>&1
    echo [OK] 图标文件已复制
) else (
    echo [WARNING] 图标文件未找到，请手动复制
)

:: 更新配置文件路径
echo.
echo [3/6] 更新Native Host配置...
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

:: 注册Edge Native Host
echo.
echo [4/6] 注册Edge Native Host...
reg add "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CONFIG_FILE%" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Edge Native Host 注册成功
) else (
    echo [ERROR] Edge Native Host 注册失败
    pause
    exit /b 1
)

:: 同时注册Chrome（兼容性）
echo.
echo [5/6] 注册Chrome Native Host（兼容性）...
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" /ve /t REG_SZ /d "%CONFIG_FILE%" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Chrome Native Host 注册成功（兼容性）
) else (
    echo [WARNING] Chrome 注册失败（不影响Edge使用）
)

:: 显示Edge扩展安装说明
echo.
echo [6/6] Edge扩展安装说明...
echo.
echo ========================================
echo   Edge扩展安装步骤
echo ========================================
echo.
echo 请按以下步骤安装Edge扩展：
echo.
echo 1. 打开Microsoft Edge浏览器
echo 2. 访问 edge://extensions/
echo 3. 开启左下角的"开发人员模式"
echo 4. 点击"加载解压缩的扩展"
echo 5. 选择目录: %EDGE_EXTENSION_DIR%
echo 6. 确认扩展已加载并启用
echo.
echo ========================================
echo   重要提醒
echo ========================================
echo.
echo • Edge版本专门优化了随机邮箱生成算法
echo • 确保每次生成的邮箱都是真正随机的
echo • 支持Edge专用的人机验证处理
echo • 与Chrome版本完全独立运行
echo.

:: 验证安装
echo [验证] 检查安装状态...
reg query "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.augmentcode.email_verifier" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Edge Native Host 注册验证成功
) else (
    echo [WARNING] Edge Native Host 注册验证失败
)

echo.
echo ========================================
echo   Edge专用扩展安装完成！
echo ========================================
echo Native Host: 已注册到Edge
echo 扩展目录: %EDGE_EXTENSION_DIR%
echo 配置文件: %CONFIG_FILE%
echo.
echo 下一步: 在Edge浏览器中加载扩展并测试
echo.
pause
