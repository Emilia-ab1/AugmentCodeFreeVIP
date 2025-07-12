#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  AugmentCode 自动登录扩展 - 卸载脚本"
echo -e "========================================${NC}"
echo

echo -e "${RED}[WARNING] 此操作将完全卸载AugmentCode自动登录扩展${NC}"
echo "包括：Native Host配置、可执行文件等"
echo
read -p "确认卸载？(y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "取消卸载"
    exit 0
fi

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

# 设置路径变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NATIVE_DIR="$PROJECT_DIR/native-messaging"

echo
echo -e "${YELLOW}[1/4] 删除Chrome Native Host配置...${NC}"
if [ -f "$CHROME_DIR/com.augmentcode.email_verifier.json" ]; then
    rm "$CHROME_DIR/com.augmentcode.email_verifier.json"
    echo -e "${GREEN}[OK] Chrome配置已删除${NC}"
else
    echo -e "${BLUE}[INFO] Chrome配置不存在或已删除${NC}"
fi

echo
echo -e "${YELLOW}[2/4] 删除Edge Native Host配置...${NC}"
if [ -f "$EDGE_DIR/com.augmentcode.email_verifier.json" ]; then
    rm "$EDGE_DIR/com.augmentcode.email_verifier.json"
    echo -e "${GREEN}[OK] Edge配置已删除${NC}"
else
    echo -e "${BLUE}[INFO] Edge配置不存在或已删除${NC}"
fi

echo
echo -e "${YELLOW}[3/4] 清理可执行文件...${NC}"
if [ -f "$NATIVE_DIR/$EXE_NAME" ]; then
    rm "$NATIVE_DIR/$EXE_NAME"
    echo -e "${GREEN}[OK] 可执行文件已删除${NC}"
fi

# 清理备份文件
if ls "$NATIVE_DIR"/*.bak 1> /dev/null 2>&1; then
    rm "$NATIVE_DIR"/*.bak
    echo -e "${GREEN}[OK] 备份文件已清理${NC}"
fi

echo
echo -e "${YELLOW}[4/4] 扩展卸载说明...${NC}"
echo "请手动从浏览器中移除扩展："
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 找到\"AugmentCode自动登录扩展\""
echo "4. 点击\"移除\"按钮"
echo

echo -e "${BLUE}========================================"
echo -e "  卸载完成！"
echo -e "========================================${NC}"
echo -e "${GREEN}Native Host配置: 已删除${NC}"
echo -e "${GREEN}可执行文件: 已删除${NC}"
echo -e "${YELLOW}扩展: 需手动从浏览器移除${NC}"
echo
echo -e "${BLUE}感谢使用AugmentCode自动登录扩展！${NC}"
echo
