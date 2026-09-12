import io

with io.open('telemetry.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复第一个 .el-container.layout-container 的 flex-direction 应该是 row，不是 column
old_style = '''/* element-plus 布局容器（koi 布局实际使用的类名） */
.el-container,
.el-container.layout-container,
.el-container.layout-vertical {
  height: 100% !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column;
}'''

new_style = '''/* element-plus 布局容器（koi 布局实际使用的类名） */
.el-container {
  height: 100% !important;
  min-height: 100% !important;
  display: flex !important;
}
/* 最外层布局容器：侧边栏 + 内容区，水平排列 */
.el-container.layout-container,
.el-container.layout-vertical {
  flex-direction: row !important;
}
/* 右侧内容容器：头部 + 主内容区，垂直排列 */
.el-container.is-vertical {
  flex-direction: column !important;
}'''

if old_style in content:
    content = content.replace(old_style, new_style, 1)
    with io.open('telemetry.css', 'w', encoding='utf-8') as f:
        f.write(content)
    print('成功修复 .el-container 布局方向')
else:
    print('未找到旧样式，尝试查找...')
    idx = content.find('element-plus 布局容器')
    if idx > 0:
        print(f'找到"element-plus 布局容器"在位置 {idx}')
        print(content[idx:idx+500])
