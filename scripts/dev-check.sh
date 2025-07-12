#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  开发环境检查脚本"
echo -e "========================================${NC}"
echo

# 检查Go环境
echo -e "${YELLOW}检查Go环境...${NC}"
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo -e "${GREEN}✓ Go已安装: $GO_VERSION${NC}"
    
    # 检查Go版本
    GO_MAJOR=$(echo $GO_VERSION | sed 's/go//' | cut -d. -f1)
    GO_MINOR=$(echo $GO_VERSION | sed 's/go//' | cut -d. -f2)
    if [ "$GO_MAJOR" -gt 1 ] || ([ "$GO_MAJOR" -eq 1 ] && [ "$GO_MINOR" -ge 19 ]); then
        echo -e "${GREEN}✓ Go版本符合要求 (>=1.19)${NC}"
    else
        echo -e "${RED}✗ Go版本过低，建议升级到1.19+${NC}"
    fi
else
    echo -e "${RED}✗ Go未安装${NC}"
    echo "请从 https://golang.org/dl/ 下载安装"
fi

echo

# 检查Git环境
echo -e "${YELLOW}检查Git环境...${NC}"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓ Git已安装: $GIT_VERSION${NC}"
else
    echo -e "${RED}✗ Git未安装${NC}"
fi

echo

# 检查Node.js环境（可选）
echo -e "${YELLOW}检查Node.js环境...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js已安装: $NODE_VERSION${NC}"
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✓ npm已安装: $NPM_VERSION${NC}"
    fi
else
    echo -e "${YELLOW}○ Node.js未安装 (可选，用于前端开发)${NC}"
fi

echo

# 检查浏览器
echo -e "${YELLOW}检查浏览器环境...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo -e "${GREEN}✓ Chrome已安装${NC}"
    else
        echo -e "${YELLOW}○ Chrome未找到${NC}"
    fi
    
    if [ -d "/Applications/Microsoft Edge.app" ]; then
        echo -e "${GREEN}✓ Edge已安装${NC}"
    else
        echo -e "${YELLOW}○ Edge未找到${NC}"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
        echo -e "${GREEN}✓ Chrome/Chromium已安装${NC}"
    else
        echo -e "${YELLOW}○ Chrome/Chromium未找到${NC}"
    fi
    
    if command -v microsoft-edge &> /dev/null; then
        echo -e "${GREEN}✓ Edge已安装${NC}"
    else
        echo -e "${YELLOW}○ Edge未找到${NC}"
    fi
fi

echo

# 检查项目文件
echo -e "${YELLOW}检查项目文件...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 检查关键文件
FILES_TO_CHECK=(
    "native-messaging/email_verifier_host.go"
    "native-messaging/email_verification.go"
    "native-messaging/com.augmentcode.email_verifier.json"
    "chrome-extension/manifest.json"
    "chrome-extension/popup.html"
    "chrome-extension/popup.js"
    "chrome-extension/content.js"
    "chrome-extension/background.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file 缺失${NC}"
    fi
done

echo

# 检查Go模块
echo -e "${YELLOW}检查Go模块...${NC}"
cd "$PROJECT_DIR/native-messaging" 2>/dev/null
if [ -f "go.mod" ]; then
    echo -e "${GREEN}✓ go.mod存在${NC}"
    if go mod verify &> /dev/null; then
        echo -e "${GREEN}✓ Go模块验证通过${NC}"
    else
        echo -e "${YELLOW}○ 建议运行: go mod tidy${NC}"
    fi
else
    echo -e "${YELLOW}○ go.mod不存在，建议运行: go mod init${NC}"
fi

echo

# 总结
echo -e "${BLUE}========================================"
echo -e "  环境检查完成"
echo -e "========================================${NC}"
echo -e "${GREEN}开发环境基本就绪！${NC}"
echo
echo -e "${YELLOW}下一步操作建议：${NC}"
echo "1. 运行 build.sh 构建项目"
echo "2. 运行 install.sh 安装扩展"
echo "3. 在浏览器中加载扩展进行测试"
echo
