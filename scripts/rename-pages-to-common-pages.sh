#!/bin/bash
# 批量更新 @repo/common 为 @repo/common

echo "开始更新所有 @repo/common 引用为 @repo/common..."

# 更新所有 .ts .vue .json 文件中的引用
find . -type f \( -name "*.ts" -o -name "*.vue" -o -name "*.json" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -exec sed -i 's/@repo\/pages"/@repo\/common-pages"/g' {} \;

echo "更新完成！"
echo ""
echo "请执行以下命令完成重命名："
echo "1. 关闭所有编辑器和进程"
echo "2. cd packages && mv pages common-pages"
echo "3. git add -A && git commit -m 'refactor: 重命名 packages/pages 为 packages/common-pages'"
echo "4. git push origin master"
