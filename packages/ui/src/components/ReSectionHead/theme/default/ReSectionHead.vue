<!--
  ReSectionHead —— 区段头部（标题 + 描述 + 右侧操作）
  设计风格：Vercel / Linear · 低饱和度 · 极简
  复用场景：管理页面、设置页面的区段头部
-->
<template>
  <header class="re-section-head">
    <div class="re-section-head__main">
      <h3
        v-if="title || $slots.title"
        class="re-section-head__title"
        style="color: var(--el-text-color-primary)"
      >
        <slot name="title">{{ title }}</slot>
      </h3>
      <div
        v-if="description || $slots.description"
        class="re-section-head__desc"
        style="color: var(--el-text-color-secondary)"
      >
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
    <div v-if="$slots.actions" class="re-section-head__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  { title: "", description: "" },
);

defineOptions({ name: "ReSectionHead", inheritAttrs: true });
</script>

<style scoped>
.re-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  margin-bottom: 12px;
}

.re-section-head__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.re-section-head__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.re-section-head__desc {
  font-size: 12px;
}

.re-section-head__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
