@echo off
chcp 65001 >nul
echo ========================================
echo   AugmentCode 自动登录扩展 - 卸载脚本
echo ========================================
echo.

echo [WARNING] 此操作将完全卸载AugmentCode自动登录扩展
echo 包括：Native Host注册、配置文件等
echo.
set /p confirm="确认卸载？(y/N): "
if /i not "%confirm%"=="y" (
    echo 取消卸载
    pause
    exit /b 0
)

echo.
echo [1/4] 删除Chrome Native Host注册...
reg delete "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.augmentcode.email_verifier" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Chrome注册已删除
) else (
    echo [INFO] Chrome注册不存在或已删除
)

echo.
echo [2/4] 删除Edge Native Host注册...
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.augmentcode.email_verifier" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Edge注册已删除
) else (
    echo [INFO] Edge注册不存在或已删除
)

echo.
echo [3/4] 清理临时文件...
set "NATIVE_DIR=%~dp0..\native-messaging"
if exist "%NATIVE_DIR%\email_verifier_host.exe" (
    del "%NATIVE_DIR%\email_verifier_host.exe" >nul 2>&1
    echo [OK] 可执行文件已删除
)

:: 清理备份文件
if exist "%NATIVE_DIR%\*.bak" (
    del "%NATIVE_DIR%\*.bak" >nul 2>&1
    echo [OK] 备份文件已清理
)

echo.
echo [4/4] 扩展卸载说明...
echo 请手动从浏览器中移除扩展：
echo 1. 打开Chrome浏览器
echo 2. 访问 chrome://extensions/
echo 3. 找到"AugmentCode自动登录扩展"
echo 4. 点击"移除"按钮
echo.

echo ========================================
echo   卸载完成！
echo ========================================
echo Native Host注册: 已删除
echo 可执行文件: 已删除
echo 扩展: 需手动从浏览器移除
echo.
echo 感谢使用AugmentCode自动登录扩展！
echo.
pause
