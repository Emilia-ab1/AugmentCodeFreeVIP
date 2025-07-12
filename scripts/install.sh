#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  AugmentCode 自动登录扩展 - 安装脚本"
echo -e "========================================${NC}"
echo

# 设置路径变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NATIVE_DIR="$PROJECT_DIR/native-messaging"
EXTENSION_DIR="$PROJECT_DIR/chrome-extension"

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    CHROME_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    EDGE_DIR="$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    EXE_NAME="email_verifier_host_mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    CHROME_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    EDGE_DIR="$HOME/.config/microsoft-edge/NativeMessagingHosts"
    EXE_NAME="email_verifier_host_linux"
else
    echo -e "${RED}[ERROR] 不支持的操作系统: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}检测到操作系统: $OS${NC}"

# 检查必要文件
echo
echo -e "${YELLOW}[1/5] 检查必要文件...${NC}"
if [ ! -f "$NATIVE_DIR/$EXE_NAME" ]; then
    echo -e "${RED}[ERROR] $EXE_NAME 未找到${NC}"
    echo "请先运行 build.sh 构建程序"
    exit 1
fi
if [ ! -f "$NATIVE_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${RED}[ERROR] Native Host配置文件未找到${NC}"
    exit 1
fi
if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
    echo -e "${RED}[ERROR] Chrome扩展文件未找到${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] 必要文件检查通过${NC}"

# 更新配置文件路径
echo
echo -e "${YELLOW}[2/5] 更新Native Host配置...${NC}"
CONFIG_FILE="$NATIVE_DIR/com.augmentcode.email_verifier.json"
EXE_PATH="$NATIVE_DIR/$EXE_NAME"

# 使用sed更新JSON文件中的路径
if command -v jq &> /dev/null; then
    # 如果有jq，使用jq更新
    jq --arg path "$EXE_PATH" '.path = $path' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
else
    # 否则使用sed简单替换
    sed -i.bak "s|\"path\":.*|\"path\": \"$EXE_PATH\",|" "$CONFIG_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] 配置文件已更新${NC}"
else
    echo -e "${RED}[ERROR] 配置文件更新失败${NC}"
    exit 1
fi

# 创建Native Host目录
echo
echo -e "${YELLOW}[3/5] 创建Native Host目录...${NC}"
mkdir -p "$CHROME_DIR" 2>/dev/null
mkdir -p "$EDGE_DIR" 2>/dev/null
echo -e "${GREEN}[OK] 目录创建完成${NC}"

# 安装Native Host
echo
echo -e "${YELLOW}[4/5] 安装Native Host...${NC}"

# 复制到Chrome目录
if cp "$CONFIG_FILE" "$CHROME_DIR/" 2>/dev/null; then
    echo -e "${GREEN}[OK] Chrome Native Host 安装成功${NC}"
else
    echo -e "${YELLOW}[WARNING] Chrome Native Host 安装失败${NC}"
fi

# 复制到Edge目录
if cp "$CONFIG_FILE" "$EDGE_DIR/" 2>/dev/null; then
    echo -e "${GREEN}[OK] Edge Native Host 安装成功${NC}"
else
    echo -e "${YELLOW}[WARNING] Edge Native Host 安装失败${NC}"
fi

# 显示扩展安装说明
echo
echo -e "${YELLOW}[5/5] Chrome扩展安装说明...${NC}"
echo "请按以下步骤手动安装Chrome扩展："
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 开启右上角的\"开发者模式\""
echo "4. 点击\"加载已解压的扩展程序\""
echo "5. 选择目录: $EXTENSION_DIR"
echo

# 验证安装
echo -e "${YELLOW}验证安装...${NC}"
if [ -f "$CHROME_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${GREEN}[OK] Chrome Native Host 验证成功${NC}"
else
    echo -e "${YELLOW}[WARNING] Chrome Native Host 验证失败${NC}"
fi

if [ -f "$EDGE_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${GREEN}[OK] Edge Native Host 验证成功${NC}"
else
    echo -e "${YELLOW}[WARNING] Edge Native Host 验证失败${NC}"
fi

echo
echo -e "${BLUE}========================================"
echo -e "  安装完成！"
echo -e "========================================${NC}"
echo -e "${GREEN}Native Host: 已安装${NC}"
echo -e "${GREEN}扩展目录: $EXTENSION_DIR${NC}"
echo -e "${GREEN}配置文件: $CONFIG_FILE${NC}"
echo
echo -e "${YELLOW}下一步: 在浏览器中加载扩展并配置邮箱信息${NC}"
echo
