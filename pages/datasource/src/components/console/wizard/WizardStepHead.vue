<script setup lang="ts">
/**
 * 步骤体标题（导入 / 导出共用）。
 *
 * <p>只负责「标题 + 一句说明 + 右侧摘要」这一行，内边距交给容器 ——
 * 弹窗态和页面态的留白不一样，写死在这里会让两处没法各自收放。</p>
 */
defineProps<{
  /** 步骤标题 */
  title: string;
  /** 一句说明 */
  desc?: string;
}>();
</script>

<template>
  <header class="wz-head">
    <div class="wz-head-main">
      <h4 class="wz-head-title">
        {{ title }}
        <slot name="badge" />
      </h4>
      <p v-if="desc || $slots.desc" class="wz-head-desc">
        <slot name="desc">{{ desc }}</slot>
      </p>
    </div>
    <div v-if="$slots.meta" class="wz-head-meta">
      <slot name="meta" />
    </div>
  </header>
</template>

<style scoped>
.wz-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.wz-head-main {
  flex: 1;
  min-width: 0;
}
.wz-head-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}
.wz-head-desc {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.wz-head-meta {
  flex: none;
  text-align: right;
  font-size: 11px;
  line-height: 1.7;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
</style>
