# ScFlourishEmbed 任务文档

## 第1组：组件包骨架

- [x] 1.1 创建 `packages/components-standalone/ScFlourishEmbed/package.json`
- [x] 1.2 创建 `packages/components-standalone/ScFlourishEmbed/index.ts`

## 第2组：index.vue 核心实现

- [x] 2.1 定义 Props / Emits / 全局类型声明（第4、5、13节）
- [x] 2.2 实现脚本单例加载函数 `loadEmbedScript` / `loadApiScript`（第7.1节）
- [x] 2.3 实现状态机 + Public Embed 渲染逻辑（第7.2、8节）
- [x] 2.4 实现 Live API 渲染逻辑 + `defineExpose.update`（第7.3、6节）
- [x] 2.5 实现 watch 逻辑（第11节）
- [x] 2.6 实现 `onBeforeUnmount` 清理（第12节）
- [x] 2.7 编写模板 HTML（第9节）
- [x] 2.8 编写 scoped 样式（骨架屏 shimmer、错误状态、容器，第10节）

## 第3组：TypeScript 检查

- [x] 3.1 运行 `getDiagnostics` 确认无类型错误
