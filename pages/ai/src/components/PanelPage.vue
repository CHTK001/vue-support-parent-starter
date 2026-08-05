<template>
  <div class="panel-page">
    <header class="panel-page__header">
      <div class="panel-page__header-left">
        <h2 class="panel-page__title">
          <slot name="title">{{ title }}</slot>
        </h2>
        <p v-if="subtitle || $slots.subtitle" class="panel-page__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="panel-page__header-actions">
        <slot name="actions" />
      </div>
    </header>
    <div v-loading="loading" class="panel-page__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PanelPage —— 设置面板通用容器
 *
 * 消除各管理面板重复的 header + body 样板结构。
 *
 * 用法：
 *   <PanelPage title="提供商管理" subtitle="管理 AI 提供商" :loading="loading">
 *     <template #actions>
 *       <el-button @click="refresh">刷新</el-button>
 *     </template>
 *     <el-table :data="rows" />
 *   </PanelPage>
 */
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    loading?: boolean;
  }>(),
  {
    title: '',
    subtitle: '',
    loading: false,
  },
);
</script>

<style scoped>
.panel-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--ai-spacing-lg);
  box-sizing: border-box;
  overflow: hidden;
}

.panel-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--ai-spacing-lg);
  flex-shrink: 0;
}
.panel-page__header-left {
  min-width: 0;
}
.panel-page__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ai-text-primary);
  line-height: 1.3;
  margin: 0;
}
.panel-page__subtitle {
  font-size: 13px;
  color: var(--ai-text-muted);
  margin: 4px 0 0;
  line-height: 1.4;
}
.panel-page__header-actions {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
  flex-shrink: 0;
}

.panel-page__body {
  flex: 1;
  min-height: 0;
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-lg);
  overflow-y: auto;
}
</style>
