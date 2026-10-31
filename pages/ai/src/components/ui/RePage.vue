<template>
  <div class="re-page" :class="{ 're-page--fill': fill }">
    <!-- 页面头：统一由 RePageHead 渲染。
         以前四个自绘页面（用量/图像生成/渠道/服务）各写一份头部，
         同一位置五套 DOM、三套观感。现在全站共用一份实现。 -->
    <RePageHead :title="title" :subtitle="subtitle">
      <template v-if="$slots.title" #title><slot name="title" /></template>
      <template v-if="$slots.meta" #meta><slot name="meta" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
      <template v-if="$slots.sub" #sub><slot name="sub" /></template>
      <template v-if="$slots.tools" #tools><slot name="tools" /></template>
      <template v-if="$slots.foot" #foot><slot name="foot" /></template>
    </RePageHead>

    <div class="re-page__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import RePageHead from './RePageHead.vue'

/**
 * RePage —— 控制台页面外壳。
 *
 * <p>只负责三件事：**页面级留白**、**标题区版式**、**操作区对齐**。
 * 内容仍然由页面自己排（表格/卡片/表单），所以迁移成本很低：
 * 把原来的 `&lt;div class="xxx-page"&gt;` + `.page-header` 换成
 * `&lt;RePage title="…"&gt;` 即可，其余结构不动。</p>
 *
 * <p>标题区本身由 {@link RePageHead} 渲染 —— 与四个自绘页面（用量管理 /
 * 图像生成 / 渠道管理 / 服务配置）共用同一份 DOM，全站页面头因此完全一致。</p>
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
}
</style>