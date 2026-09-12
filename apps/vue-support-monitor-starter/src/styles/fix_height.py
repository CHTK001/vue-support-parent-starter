import io

with io.open('telemetry.css', 'r', encoding='utf-8') as f:
    content = f.read()

old_style = '''/* ================= 全局高度修复 =================
 * 确保 koi 布局内容区、router-view 子元素、外部包组件都占满高度 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
.koi-layout,
.koi-layout__main,
.koi-layout__content,
.el-container,
.el-main {
  height: 100% !important;
  min-height: 100% !important;
}
.koi-layout__content > div,
.koi-layout__content > section,
.koi-layout__content > main {
  min-height: 100%;
  height: 100%;
}
.tw {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tw .term-main {
  flex: 1;
  min-height: 0;
}'''

new_style = '''/* ================= 全局高度修复 =================
 * 确保 koi/element-plus 布局内容区、router-view 子元素、外部包组件都占满高度 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
/* element-plus 布局容器（koi 布局实际使用的类名） */
.el-container,
.el-container.layout-container,
.el-container.layout-vertical {
  height: 100% !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column;
}
/* 主内容区 - 必须 flex:1 才能在 flex 容器中吃满高度 */
.el-main,
.el-main.main-content {
  flex: 1 !important;
  height: 100% !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
}
/* 主内容区的直接子元素（页面根容器）吃满高度 */
.el-main > div,
.el-main > section,
.el-main > main,
.el-main.main-content > div,
.el-main.main-content > section {
  flex: 1 !important;
  min-height: 0 !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column;
}
/* koi 布局类名（兼容） */
.koi-layout,
.koi-layout__main,
.koi-layout__content {
  height: 100% !important;
  min-height: 100% !important;
}
.koi-layout__content > div,
.koi-layout__content > section,
.koi-layout__content > main {
  min-height: 100%;
  height: 100%;
}
/* .tel-page 容器 - 吃满父容器高度 */
.tel-page {
  flex: 1 !important;
  min-height: 0 !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column;
  overflow: auto !important;
}
/* TerminalView 使用的 .tw 类 */
.tw {
  flex: 1 !important;
  min-height: 0 !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column;
}
.tw .term-main {
  flex: 1;
  min-height: 0;
}'''

if old_style in content:
    content = content.replace(old_style, new_style, 1)
    with io.open('telemetry.css', 'w', encoding='utf-8') as f:
        f.write(content)
    print('成功修改全局高度样式')
else:
    print('未找到旧样式，尝试查找...')
    # 查找全局高度修复的位置
    idx = content.find('全局高度修复')
    if idx > 0:
        print(f'找到"全局高度修复"在位置 {idx}')
        print(content[idx:idx+500])
    else:
        print('未找到"全局高度修复"')
