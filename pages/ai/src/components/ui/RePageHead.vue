<template>
  <!--
    页面头（全站唯一实现）。
    以前每个管理页各写一份头：`.re-page__head`（12 页）、`.top-bar`、`.chm-head`、
    `.svc-head`、`.wg-head`（各 1 页）。同一个位置五套 DOM、三套观感，
    设计变体只能调到标题、调不到整条头部版式。现在统一到这里。

    结构：
      __head
        __row          ← 第一行：文本块 + 操作区
          __title-wrap   ← 标题 / 行内副标题 / meta 插槽 / 块副标题
          __actions      ← 右侧操作区
        __tools        ← 第二行（筛选行等），整行铺满
        （foot 插槽）   ← 贴头部底边的装饰（如用量页的刷新流光）
  -->
  <!--
    结构刻意保持「行方向 flex + 直接子元素」，并**不额外套一层 row 包裹**：
    设计变体是照着这个结构写的（例如 Brief 用 `align-items: flex-end` 做底对齐），
    一旦把容器改成 column，`align-items` 的含义会从「底对齐」变成「右对齐」，
    整个标题行会被推到右边。新增的 __sub / __tools 靠 flex-basis:100% 换行。
  -->
  <header class="re-page__head">
    <div class="re-page__title-wrap">
      <h2 class="re-page__title">
        <slot name="title">{{ title }}</slot>
      </h2>
      <span v-if="subtitle" class="re-page__subtitle">{{ subtitle }}</span>
      <slot name="meta" />
      <p v-if="$slots.sub" class="re-page__sub">
        <slot name="sub" />
      </p>
    </div>

    <div v-if="$slots.actions" class="re-page__actions">
      <slot name="actions" />
    </div>

    <div v-if="$slots.tools" class="re-page__tools">
      <slot name="tools" />
    </div>

    <slot name="foot" />
  </header>
</template>

<script setup lang="ts">
/**
 * RePageHead —— 页面标题区。
 *
 * <p>与 {@link RePage} 配套：RePage 内部就是用它渲染头部。四个自绘页面
 * （用量管理 / 图像生成 / 渠道管理 / 服务配置）也直接用它，从而全站页面头
 * 共用一份 DOM 与一套观感。</p>
 *
 * <p>观感基准是「浅灰通栏」：浅灰底 + 1px 描边 + 8px 圆角、标题 16px 半粗、
 * 右侧操作区一行对齐。这是 RePage 与用量管理原本就约定的版式。</p>
 *
 * <p>三类副标题用法，按需选一种：</p>
 * <ul>
 *   <li>{@code subtitle} prop —— 行内、不换行，适合短语（RePage 默认用法）；</li>
 *   <li>{@code #meta} 插槽 —— 行内任意内容（状态点、计数等）；</li>
 *   <li>{@code #sub} 插槽 —— 独立一行、可换行，适合长句说明。</li>
 * </ul>
 */
defineProps({
  /** 页面标题 */
  title: { type: String, default: '' },
  /** 标题右侧的行内辅助说明（短句，不换行） */
  subtitle: { type: String, default: '' },
});
</script>

<style scoped>
.re-page__head {
  /* 供 foot 插槽（如刷新流光）贴底边定位 */
  position: relative;
  /* 行方向 + wrap：__title-wrap / __actions 在第一行，__tools 靠 flex-basis:100% 换到第二行。
     不要改成 column —— 见模板注释（会让变体的 align-items: flex-end 变成右对齐）。 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  flex-wrap: wrap;
  padding: 12px 18px;
  box-sizing: border-box;
  border-radius: var(--u-radius, 8px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}

.re-page__title-wrap {
  display: flex;
  align-items: center;
  gap: 4px 10px;
  flex-wrap: wrap;
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

/* 块副标题：独立一行、允许换行（长句说明用） */
.re-page__sub {
  /* flex-basis 100% 让它在标题行内强制换行，不挤占操作区 */
  flex-basis: 100%;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
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

/* 第二行：筛选 / 搜索等工具条，整行铺满 */
.re-page__tools {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

@media (max-width: 760px) {
  .re-page__actions { width: 100%; justify-content: flex-start; }
  .re-page__actions :deep(.el-input) { width: 100%; }
}
</style>