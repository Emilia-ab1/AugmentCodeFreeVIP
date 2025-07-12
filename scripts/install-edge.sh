#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  Edge专用扩展 - 安装脚本"
echo -e "========================================${NC}"
echo

# 设置路径变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NATIVE_DIR="$PROJECT_DIR/native-messaging"
EDGE_EXTENSION_DIR="$PROJECT_DIR/edge-extension"

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    EDGE_DIR="$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    CHROME_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    EXE_NAME="email_verifier_host_mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    EDGE_DIR="$HOME/.config/microsoft-edge/NativeMessagingHosts"
    CHROME_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    EXE_NAME="email_verifier_host_linux"
else
    echo -e "${RED}[ERROR] 不支持的操作系统: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}检测到操作系统: $OS${NC}"
echo -e "${CYAN}Edge专用版本 - 优化随机邮箱生成${NC}"

# 检查必要文件
echo
echo -e "${YELLOW}[1/6] 检查必要文件...${NC}"
if [ ! -f "$NATIVE_DIR/$EXE_NAME" ]; then
    echo -e "${RED}[ERROR] $EXE_NAME 未找到${NC}"
    echo "请先运行 build.sh 构建程序"
    exit 1
fi
if [ ! -f "$NATIVE_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${RED}[ERROR] Native Host配置文件未找到${NC}"
    exit 1
fi
if [ ! -f "$EDGE_EXTENSION_DIR/manifest.json" ]; then
    echo -e "${RED}[ERROR] Edge扩展文件未找到${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] 必要文件检查通过${NC}"

# 复制图标文件
echo
echo -e "${YELLOW}[2/6] 复制图标文件...${NC}"
mkdir -p "$EDGE_EXTENSION_DIR/icons"
if [ -f "$PROJECT_DIR/chrome-extension/icons/icon16.png" ]; then
    cp "$PROJECT_DIR/chrome-extension/icons/"*.png "$EDGE_EXTENSION_DIR/icons/" 2>/dev/null
    echo -e "${GREEN}[OK] 图标文件已复制${NC}"
else
    echo -e "${YELLOW}[WARNING] 图标文件未找到，请手动复制${NC}"
fi

# 更新配置文件路径
echo
echo -e "${YELLOW}[3/6] 更新Native Host配置...${NC}"
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
echo -e "${YELLOW}[4/6] 创建Native Host目录...${NC}"
mkdir -p "$EDGE_DIR" 2>/dev/null
mkdir -p "$CHROME_DIR" 2>/dev/null
echo -e "${GREEN}[OK] 目录创建完成${NC}"

# 安装Edge Native Host
echo
echo -e "${YELLOW}[5/6] 安装Edge Native Host...${NC}"

# 复制到Edge目录
if cp "$CONFIG_FILE" "$EDGE_DIR/" 2>/dev/null; then
    echo -e "${GREEN}[OK] Edge Native Host 安装成功${NC}"
else
    echo -e "${RED}[ERROR] Edge Native Host 安装失败${NC}"
    exit 1
fi

# 复制到Chrome目录（兼容性）
if cp "$CONFIG_FILE" "$CHROME_DIR/" 2>/dev/null; then
    echo -e "${GREEN}[OK] Chrome Native Host 安装成功（兼容性）${NC}"
else
    echo -e "${YELLOW}[WARNING] Chrome Native Host 安装失败（不影响Edge使用）${NC}"
fi

# 显示Edge扩展安装说明
echo
echo -e "${YELLOW}[6/6] Edge扩展安装说明...${NC}"
echo
echo -e "${BLUE}========================================"
echo -e "  Edge扩展安装步骤"
echo -e "========================================${NC}"
echo
echo "请按以下步骤安装Edge扩展："
echo
echo "1. 打开Microsoft Edge浏览器"
echo "2. 访问 edge://extensions/"
echo "3. 开启左下角的\"开发人员模式\""
echo "4. 点击\"加载解压缩的扩展\""
echo "5. 选择目录: $EDGE_EXTENSION_DIR"
echo "6. 确认扩展已加载并启用"
echo
echo -e "${BLUE}========================================"
echo -e "  重要提醒"
echo -e "========================================${NC}"
echo
echo -e "${CYAN}• Edge版本专门优化了随机邮箱生成算法${NC}"
echo -e "${CYAN}• 确保每次生成的邮箱都是真正随机的${NC}"
echo -e "${CYAN}• 支持Edge专用的人机验证处理${NC}"
echo -e "${CYAN}• 与Chrome版本完全独立运行${NC}"
echo

# 验证安装
echo -e "${YELLOW}验证安装...${NC}"
if [ -f "$EDGE_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${GREEN}[OK] Edge Native Host 验证成功${NC}"
else
    echo -e "${RED}[ERROR] Edge Native Host 验证失败${NC}"
fi

if [ -f "$CHROME_DIR/com.augmentcode.email_verifier.json" ]; then
    echo -e "${GREEN}[OK] Chrome Native Host 验证成功（兼容性）${NC}"
else
    echo -e "${YELLOW}[WARNING] Chrome Native Host 验证失败${NC}"
fi

echo
echo -e "${BLUE}========================================"
echo -e "  Edge专用扩展安装完成！"
echo -e "========================================${NC}"
echo -e "${GREEN}Native Host: 已安装到Edge${NC}"
echo -e "${GREEN}扩展目录: $EDGE_EXTENSION_DIR${NC}"
echo -e "${GREEN}配置文件: $CONFIG_FILE${NC}"
echo
echo -e "${YELLOW}下一步: 在Edge浏览器中加载扩展并测试${NC}"
echo
