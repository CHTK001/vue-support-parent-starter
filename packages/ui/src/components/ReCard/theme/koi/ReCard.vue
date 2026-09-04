<script setup lang="ts">
/**
 * ReCard koi 主题 —— 卡片组件（KoiCard 移植）
 *
 * 独立 div 结构，不依赖 element-plus，样式走主题令牌（--theme-* 变量）。
 * 兼容 default 主题的 header / shadow / bodyStyle props，业务切换主题不破 API。
 */
defineOptions({ name: "ReCard", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 卡片标题 */
    header?: string;
    /** 阴影强度（兼容 el-card，koi 下视觉统一按主题令牌） */
    shadow?: "always" | "hover" | "never";
    /** 内边距覆盖（保留兼容，默认不启用） */
    bodyStyle?: Record<string, string>;
    /** 是否撑满父容器剩余高度（flex-1） */
    isFlex?: boolean;
  }>(),
  { header: "", shadow: "always", bodyStyle: () => ({}), isFlex: true },
);
</script>

<template>
  <div class="koi-card" :class="{ 'flex-1': props.isFlex }">
    <div v-if="header || $slots.header" class="koi-card__header">
      <slot name="header">{{ header }}</slot>
    </div>
    <div class="koi-card__body" :style="bodyStyle">
      <slot />
    </div>
    <div v-if="$slots.footer" class="koi-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.koi-card {
  display: flex;
  flex-direction: column;
  margin: 5px 6px;
  padding: 10px 20px;
  overflow: hidden;
  color: var(--theme-color-text, #303133);
  background-color: var(--theme-color-bg-container, #ffffff);
  border: 1px solid var(--theme-color-border, #e5e7ed);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));

  &__header {
    padding-bottom: 8px;
  }

  &__body {
    flex: 1;
  }

  &__footer {
    padding-top: 12px;
  }
}
</style>
