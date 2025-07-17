#!/bin/bash

# AugmentCode 配置检查脚本
# Configuration Check Script for AugmentCode

echo "🔍 AugmentCode 配置检查工具"
echo "🔍 AugmentCode Configuration Check Tool"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_item() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $3${NC}"
        return 1
    fi
}

echo ""
echo "📋 检查清单 / Checklist:"
echo "========================"

# 1. 检查Go环境
echo ""
echo "1️⃣ 检查Go环境 / Checking Go Environment..."
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    echo "   Go版本 / Go Version: $GO_VERSION"
    
    # 检查Go版本是否 >= 1.19
    if [[ $(echo "$GO_VERSION 1.19" | tr " " "\n" | sort -V | head -n1) == "1.19" ]]; then
        check_item 0 "Go环境正常 / Go environment OK" ""
    else
        check_item 1 "" "Go版本过低，需要1.19+ / Go version too low, requires 1.19+"
    fi
else
    check_item 1 "" "未安装Go / Go not installed"
fi

# 2. 检查项目文件
echo ""
echo "2️⃣ 检查项目文件 / Checking Project Files..."

# 检查关键文件是否存在
files_to_check=(
    "native-messaging/email_verification.go"
    "native-messaging/email_verifier_host.go"
    "native-messaging/go.mod"
    "chrome-extension/manifest.json"
    "chrome-extension/popup.js"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${RED}❌${NC} $file (缺失 / Missing)"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    check_item 0 "项目文件完整 / Project files complete" ""
else
    check_item 1 "" "项目文件不完整 / Project files incomplete"
fi

# 3. 检查邮箱配置
echo ""
echo "3️⃣ 检查邮箱配置 / Checking Email Configuration..."

if [ -f "native-messaging/email_verification.go" ]; then
    # 检查是否包含默认配置
    if grep -q "your-email@domain.com" native-messaging/email_verification.go; then
        check_item 1 "" "邮箱配置未修改，仍为默认值 / Email config not modified, still default values"
        echo -e "   ${YELLOW}💡 请修改 native-messaging/email_verification.go 中的邮箱配置${NC}"
        echo -e "   ${YELLOW}💡 Please modify email configuration in native-messaging/email_verification.go${NC}"
    else
        check_item 0 "邮箱配置已修改 / Email configuration modified" ""
    fi
    
    # 检查是否包含密码占位符
    if grep -q "your-password" native-messaging/email_verification.go; then
        check_item 1 "" "邮箱密码未配置 / Email password not configured"
        echo -e "   ${YELLOW}💡 请设置真实的邮箱密码或应用专用密码${NC}"
        echo -e "   ${YELLOW}💡 Please set real email password or app-specific password${NC}"
    else
        check_item 0 "邮箱密码已配置 / Email password configured" ""
    fi
else
    check_item 1 "" "邮箱配置文件不存在 / Email configuration file not found"
fi

# 4. 检查依赖包
echo ""
echo "4️⃣ 检查Go依赖包 / Checking Go Dependencies..."

if [ -f "native-messaging/go.mod" ]; then
    cd native-messaging
    if go mod verify &> /dev/null; then
        check_item 0 "Go依赖包正常 / Go dependencies OK" ""
    else
        check_item 1 "" "Go依赖包有问题 / Go dependencies have issues"
        echo -e "   ${YELLOW}💡 运行 'go mod tidy' 修复依赖${NC}"
        echo -e "   ${YELLOW}💡 Run 'go mod tidy' to fix dependencies${NC}"
    fi
    cd ..
else
    check_item 1 "" "go.mod文件不存在 / go.mod file not found"
fi

# 5. 网络连接检查
echo ""
echo "5️⃣ 检查网络连接 / Checking Network Connectivity..."

# 检查GitHub连接
if ping -c 1 github.com &> /dev/null; then
    check_item 0 "GitHub连接正常 / GitHub connectivity OK" ""
else
    check_item 1 "" "GitHub连接失败 / GitHub connectivity failed"
fi

# 检查常见IMAP服务器连接
echo ""
echo "📧 检查邮箱服务器连接 / Checking Email Server Connectivity..."

imap_servers=(
    "imap.gmail.com:993"
    "outlook.office365.com:993"
    "imap.qq.com:993"
    "imap.163.com:993"
)

for server in "${imap_servers[@]}"; do
    host=$(echo $server | cut -d: -f1)
    port=$(echo $server | cut -d: -f2)
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" &> /dev/null; then
        echo -e "   ${GREEN}✅${NC} $server"
    else
        echo -e "   ${YELLOW}⚠️${NC} $server (连接超时 / Connection timeout)"
    fi
done

# 总结
echo ""
echo "📊 配置检查总结 / Configuration Check Summary:"
echo "=============================================="
echo ""
echo -e "${BLUE}📖 下一步操作建议 / Next Steps:${NC}"
echo ""
echo "1. 如果邮箱配置未修改，请编辑 native-messaging/email_verification.go"
echo "   If email config not modified, please edit native-messaging/email_verification.go"
echo ""
echo "2. 确保您拥有 dddd.tools 域名管理权限并设置邮箱转发"
echo "   Ensure you have dddd.tools domain admin access and set up email forwarding"
echo ""
echo "3. 获取邮箱的应用专用密码或授权码"
echo "   Obtain app-specific password or authorization code for your email"
echo ""
echo "4. 运行构建脚本: ./scripts/build.sh 或 ./scripts/build.bat"
echo "   Run build script: ./scripts/build.sh or ./scripts/build.bat"
echo ""
echo "5. 安装扩展: ./scripts/install.sh 或 ./scripts/install.bat"
echo "   Install extension: ./scripts/install.sh or ./scripts/install.bat"
echo ""
echo -e "${GREEN}🎉 配置完成后即可开始使用！${NC}"
echo -e "${GREEN}🎉 Ready to use after configuration is complete!${NC}"
