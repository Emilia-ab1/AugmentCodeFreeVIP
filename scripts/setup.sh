#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  AugmentCode 自动登录扩展 - 一键安装"
echo -e "========================================${NC}"
echo

echo "此脚本将自动完成以下操作："
echo "1. 检查开发环境"
echo "2. 构建Native Host程序"
echo "3. 安装并注册扩展"
echo "4. 显示使用说明"
echo
read -p "继续安装？(Y/n): " confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "取消安装"
    exit 0
fi

# 设置路径变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo
echo -e "${BLUE}========================================"
echo -e "  第1步：环境检查"
echo -e "========================================${NC}"

# 检查Go环境
echo -e "${YELLOW}检查Go环境...${NC}"
if ! command -v go &> /dev/null; then
    echo -e "${RED}[ERROR] Go未安装！${NC}"
    echo "请从 https://golang.org/dl/ 下载并安装Go 1.19+"
    exit 1
fi
echo -e "${GREEN}[OK] Go环境检查通过${NC}"

# 检查项目文件
echo -e "${YELLOW}检查项目文件...${NC}"
if [ ! -f "$PROJECT_DIR/native-messaging/email_verifier_host.go" ]; then
    echo -e "${RED}[ERROR] 项目文件不完整${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] 项目文件检查通过${NC}"

echo
echo -e "${BLUE}========================================"
echo -e "  第2步：构建程序"
echo -e "========================================${NC}"

# 运行构建脚本
bash "$SCRIPT_DIR/build.sh"
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] 构建失败${NC}"
    exit 1
fi

echo
echo -e "${BLUE}========================================"
echo -e "  第3步：安装扩展"
echo -e "========================================${NC}"

# 运行安装脚本
bash "$SCRIPT_DIR/install.sh"
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] 安装失败${NC}"
    exit 1
fi

echo
echo -e "${BLUE}========================================"
echo -e "  第4步：使用说明"
echo -e "========================================${NC}"
echo

echo -e "${GREEN}🎉 安装完成！请按以下步骤开始使用：${NC}"
echo

echo -e "${CYAN}📋 浏览器扩展安装：${NC}"
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 开启\"开发者模式\""
echo "4. 点击\"加载已解压的扩展程序\""
echo "5. 选择目录: $PROJECT_DIR/chrome-extension"
echo

echo -e "${CYAN}⚙️ 邮箱配置：${NC}"
echo "1. 编辑文件: $PROJECT_DIR/native-messaging/email_verification.go"
echo "2. 填写您的邮箱配置信息"
echo "3. 重新运行 build.sh 构建"
echo

echo -e "${CYAN}🚀 开始使用：${NC}"
echo "1. 访问 https://app.augmentcode.com/"
echo "2. 点击扩展图标"
echo "3. 点击\"开始登录\""
echo

echo -e "${CYAN}📞 技术支持：${NC}"
echo "- GitHub Issues: 提交问题和建议"
echo "- 微信: 扫描README.md中的二维码"
echo

echo -e "${BLUE}========================================"
echo -e "  安装向导完成！"
echo -e "========================================${NC}"
echo
