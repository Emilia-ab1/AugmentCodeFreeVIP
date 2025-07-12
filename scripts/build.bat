@echo off
chcp 65001 >nul
echo ========================================
echo   AugmentCode 自动登录扩展 - 构建脚本
echo ========================================
echo.

:: 检查Go环境
echo [1/4] 检查Go环境...
go version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go未安装或未添加到PATH
    echo 请从 https://golang.org/dl/ 下载并安装Go
    pause
    exit /b 1
)
echo [OK] Go环境检查通过

:: 进入native-messaging目录
echo.
echo [2/4] 进入构建目录...
cd /d "%~dp0..\native-messaging"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 无法进入native-messaging目录
    pause
    exit /b 1
)
echo [OK] 当前目录: %CD%

:: 构建Native Host
echo.
echo [3/4] 构建Native Host程序...
echo 正在编译 email_verifier_host.exe...
go build -ldflags "-s -w" -o email_verifier_host.exe email_verifier_host.go email_verification.go
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 构建失败
    pause
    exit /b 1
)
echo [OK] 构建成功

:: 验证构建结果
echo.
echo [4/4] 验证构建结果...
if exist "email_verifier_host.exe" (
    echo [OK] email_verifier_host.exe 已生成
    for %%A in (email_verifier_host.exe) do echo 文件大小: %%~zA 字节
) else (
    echo [ERROR] 可执行文件未生成
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建完成！
echo ========================================
echo 生成文件: email_verifier_host.exe
echo 下一步: 运行 install.bat 安装扩展
echo.
pause
