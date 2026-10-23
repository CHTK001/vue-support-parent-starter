<template>
  <!--
    AI 提供商管理（/edu/ai-provider）—— pages/ai 的模型管理页直接内嵌。
    组卷 / 阅卷用到的模型、ONNX 等统一由 pages/ai 维护，复用同一份组件
    （ModelsPage）及其 API 出口，不做独立页面，避免两边配置口径分叉。

    样式：ModelsPage 依赖 AI 控制台定义的 --color-* 设计令牌
    （tailwind.css / refactor.css，只在 vue-support-ai-starter 的 main.js 里
    全局导入）。直接引那两份 CSS 会把整个 AI 主题覆盖到本应用所有页面，
    故这里只在本页子树内补齐 pages/ai 组件用到的令牌，映射到 Element Plus
    主题变量，保证内嵌页颜色/边框/文字色与宿主一致且不污染全局。

    加载：ModelsPage 及其依赖（pages/ai ApiService 等）体积较大。用通用
    ReAsync 封装异步加载 + 骨架动画 + 淡入过渡，避免点击后白屏突然出现。
  -->
  <div class="ai-provider">
    <ReAsync
      :loader="loadModelsPage"
      min-height="100%"
      skeleton-height="260px"
      fill-height
    />
  </div>
</template>

<script setup lang="ts">
const loadModelsPage = () => import("@pages/ai/components/models/ModelsPage.vue");
</script>

<style>
/* pages/ai 模型管理页的 --color-* 设计令牌 → Element Plus 运行时变量。
   作用域限制在 .ai-provider 子树，不影响宿主其它页面。 */
.ai-provider {
  /* pages/ai 卡片圆角统一抬高一档：供应商导航、模型卡片、详情卡都用它 */
  --size-surface-radius: 16px;
  --color-primary: var(--el-color-primary);
  --color-primary-0f: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  --color-primary-50: var(--el-color-primary-light-9);
  --color-primary-100: var(--el-color-primary-light-8);
  --color-primary-200: var(--el-color-primary-light-7);
  --color-primary-300: var(--el-color-primary-light-5);
  --color-primary-400: var(--el-color-primary-light-3);
  --color-primary-500: var(--el-color-primary);
  --color-primary-600: var(--el-color-primary-dark-2);
  --color-primary-700: var(--el-color-primary-dark-2);
  --color-primary-800: var(--el-color-primary-dark-2);
  --color-primary-900: var(--el-color-primary-dark-2);
  --color-primary-950: var(--el-color-primary-dark-2);
  --color-primary-disabled: var(--el-color-primary-light-7);
  --color-primary-hover: var(--el-color-primary-light-3);
  --color-primary-active: var(--el-color-primary-dark-2);
  --color-primary-text: var(--el-color-white);
  --color-primary-text-disabled: var(--el-color-white);

  --color-secondary: var(--el-color-primary);
  --color-secondary-50: var(--el-color-primary-light-9);
  --color-secondary-100: var(--el-color-primary-light-8);
  --color-secondary-200: var(--el-color-primary-light-7);
  --color-secondary-300: var(--el-color-primary-light-5);
  --color-secondary-400: var(--el-color-primary-light-3);
  --color-secondary-500: var(--el-color-primary);
  --color-secondary-600: var(--el-color-primary);
  --color-secondary-700: var(--el-color-primary-dark-2);
  --color-secondary-800: var(--el-color-primary-dark-2);
  --color-secondary-900: var(--el-color-primary-dark-2);
  --color-secondary-950: var(--el-color-primary-dark-2);
  --color-secondary-disabled: var(--el-color-primary-light-7);
  --color-secondary-hover: var(--el-color-primary-light-3);
  --color-secondary-active: var(--el-color-primary-dark-2);
  --color-secondary-text: var(--el-color-white);
  --color-secondary-text-disabled: var(--el-color-white);

  --color-text: var(--el-text-color-primary);
  --color-text-gray: var(--el-text-color-regular);
  --color-text-disabled: var(--el-text-color-placeholder);
  --color-surface: var(--el-bg-color);
  --color-secondary-surface: var(--el-fill-color-light);
  --color-surface-border: var(--el-border-color-lighter);
  --color-surface-hover: var(--el-fill-color-light);
  --color-surface-active: var(--el-fill-color);
  --color-danger: var(--el-color-danger);
  --color-warning: var(--el-color-warning);
  --color-success: var(--el-color-success);
}
</style>

<style scoped>
/* ModelPage 自带有 h-full flex 布局，这里只保证父容器撑满路由内容区 */
.ai-provider {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.ai-provider__loading {
  padding: 24px 20px;
}

/* ModelsPage 的 PageHeader 是 AI 控制台自身的顶栏（模型管理标题 + 收起侧边栏），
   嵌入 eduai 后与宿主顶栏重复，隐藏这一层，只保留模型管理工作区本体。 */
.ai-provider :deep(.drag-region) {
  display: none;
}

/* 圆角：供应商侧栏、模型卡片、详情卡统一比默认更圆润 */
.ai-provider :deep(.models-workspace) {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.ai-provider :deep(.mw-aside),
.ai-provider :deep(.mw-main) {
  border-radius: 20px;
}

.ai-provider :deep(.mw-item) {
  border-radius: 14px;
}

.ai-provider :deep(.mw-store) {
  border-radius: 16px;
}

.ai-provider :deep(.d-band),
.ai-provider :deep(.d-empty),
.ai-provider :deep(.mc) {
  border-radius: 20px;
}

.ai-provider :deep(.model-grid) {
  gap: 16px;
}

.ai-provider :deep(.mc-foot-btns .el-button),
.ai-provider :deep(.d-band-actions .el-button) {
  border-radius: 12px;
}
</style>