<template>
  <div class="re-page" :class="{ 're-page--fill': fill }">
    <!-- 页面头：与「用量管理」同一套版式 —— 浅灰通栏、标题 16px 半粗、
         右侧操作区一行对齐。此前各管理页各写一份 .page-header（有的叫
         .header-actions、有的叫 .page-header-actions，字号/间距/边框各不相同），
         十几页看下来像十几个产品。 -->
    <header class="re-page__head">
      <div class="re-page__title-wrap">
        <h2 class="re-page__title">
          <slot name="title">{{ title }}</slot>
        </h2>
        <span v-if="subtitle" class="re-page__subtitle">{{ subtitle }}</span>
        <slot name="meta" />
      </div>
      <div v-if="$slots.actions" class="re-page__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="re-page__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * RePage —— 控制台页面外壳。
 *
 * <p>只负责三件事：**页面级留白**、**标题区版式**、**操作区对齐**。
 * 内容仍然由页面自己排（表格/卡片/表单），所以迁移成本很低：
 * 把原来的 `&lt;div class="xxx-page"&gt;` + `.page-header` 换成
 * `&lt;RePage title="…"&gt;` 即可，其余结构不动。</p>
 *
 * <p>⚠️ 不提供 overflow 滚动：滚动容器仍由外层布局（MainLayout）负责。
 * 这里再套一个 `overflow:auto` 会出现「双滚动条 + 表头吸顶失效」，
 * 那是迁移时最容易踩的坑。</p>
 */
defineProps({
  /** 页面标题 */
  title: { type: String, default: '' },
  /** 标题右侧/下方的辅助说明（可选） */
  subtitle: { type: String, default: '' },
  /**
   * 整页撑满 + 内容区自己滚（表格类页面）。
   *
   * <p>默认（false）只做留白，滚动交给外层布局 —— 适合「页面整体一起滚」的页面。
   * {@code fill} 用于「表头固定、表体内部滚动」的页面：根容器 100% 高且
   * 不滚动，内容区 flex:1 + overflow:auto。之前这类页面各自写
   * `h-full overflow-hidden flex flex-col` + 内层 `p-6`，留白与滚动容器每页一版。</p>
   */
  fill: { type: Boolean, default: false },
});
</script>

<style scoped>
.re-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  box-sizing: border-box;
  min-width: 0;
}

/* 标题区通栏：浅灰底 + 1px 描边 + 8px 圆角，与用量页顶栏一致 */
.re-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  flex-wrap: wrap;
  padding: 12px 18px;
  border-radius: var(--u-radius, 8px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.re-page__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.re-page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.re-page__subtitle {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.re-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* 操作区里的搜索框统一收窄一点，避免把标题挤到换行 */
.re-page__actions :deep(.el-input) { width: 240px; }
.re-page__actions :deep(.el-input--large) { width: 260px; }

.re-page__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* fill：整页撑满，内容区自己滚（表头固定类页面） */
.re-page--fill {
  height: 100%;
  overflow: hidden;
}
.re-page--fill .re-page__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

@media (max-width: 760px) {
  .re-page { padding: 14px; gap: 12px; }
  .re-page__actions { width: 100%; justify-content: flex-start; }
  .re-page__actions :deep(.el-input) { width: 100%; }
}
</style>
