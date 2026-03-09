#!/bin/bash

# 支付管理系统前端构建和复制脚本

echo "开始构建支付管理系统前端..."

# 构建前端
pnpm build

if [ $? -ne 0 ]; then
    echo "前端构建失败！"
    exit 1
fi

echo "前端构建成功！"

# 目标目录
TARGET_DIR="../../../../utils-support-parent-starter/utils-support-cloud-parent/utils-support-cloud-starter/src/main/resources/payment-web"

# 创建目标目录
mkdir -p "$TARGET_DIR"

# 复制文件
echo "正在复制文件到Spring Boot资源目录..."
cp -r dist/* "$TARGET_DIR/"

if [ $? -ne 0 ]; then
    echo "文件复制失败！"
    exit 1
fi

echo "文件复制成功！"
echo "前端页面已打包到: $TARGET_DIR"
echo ""
echo "现在可以启动Spring Boot应用，访问: http://localhost:8080/payment-admin"
