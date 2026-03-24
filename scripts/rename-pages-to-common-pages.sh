#!/bin/bash
# 批量更新 @pages/common 为 @pages/common

echo "开始更新所有 @pages/common 引用为 @pages/common..."

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
echo "3. git add -A && git commit -m 'refactor: migrate packages/pages to pages/common'"
echo "4. git push origin master"
