#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  AugmentCode 自动登录扩展 - 构建脚本"
echo -e "========================================${NC}"
echo

# 检查Go环境
echo -e "${YELLOW}[1/4] 检查Go环境...${NC}"
if ! command -v go &> /dev/null; then
    echo -e "${RED}[ERROR] Go未安装或未添加到PATH${NC}"
    echo "请从 https://golang.org/dl/ 下载并安装Go"
    exit 1
fi
echo -e "${GREEN}[OK] Go环境检查通过${NC}"
go version

# 进入native-messaging目录
echo
echo -e "${YELLOW}[2/4] 进入构建目录...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../native-messaging" || {
    echo -e "${RED}[ERROR] 无法进入native-messaging目录${NC}"
    exit 1
}
echo -e "${GREEN}[OK] 当前目录: $(pwd)${NC}"

# 构建Native Host
echo
echo -e "${YELLOW}[3/4] 构建Native Host程序...${NC}"
echo "正在编译 email_verifier_host..."

# 根据操作系统选择输出文件名
if [[ "$OSTYPE" == "darwin"* ]]; then
    OUTPUT_NAME="email_verifier_host_mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OUTPUT_NAME="email_verifier_host_linux"
else
    OUTPUT_NAME="email_verifier_host"
fi

go build -ldflags "-s -w" -o "$OUTPUT_NAME" email_verifier_host.go email_verification.go
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] 构建成功${NC}"

# 设置执行权限
chmod +x "$OUTPUT_NAME"

# 验证构建结果
echo
echo -e "${YELLOW}[4/4] 验证构建结果...${NC}"
if [ -f "$OUTPUT_NAME" ]; then
    echo -e "${GREEN}[OK] $OUTPUT_NAME 已生成${NC}"
    FILE_SIZE=$(stat -c%s "$OUTPUT_NAME" 2>/dev/null || stat -f%z "$OUTPUT_NAME" 2>/dev/null)
    echo "文件大小: $FILE_SIZE 字节"
else
    echo -e "${RED}[ERROR] 可执行文件未生成${NC}"
    exit 1
fi

echo
echo -e "${BLUE}========================================"
echo -e "  构建完成！"
echo -e "========================================${NC}"
echo -e "${GREEN}生成文件: $OUTPUT_NAME${NC}"
echo -e "${YELLOW}下一步: 运行 install.sh 安装扩展${NC}"
echo
