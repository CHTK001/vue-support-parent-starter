<template>
  <div class="modern-page-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="page-title">
          <IconifyIconOnline v-if="icon" :icon="icon" class="title-icon" />
          {{ title }}
        </h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="stats && stats.length" class="stats-section">
        <div v-for="(stat, index) in stats" :key="index" class="stat-card">
          <div class="stat-number">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
      <div v-if="$slots.actions" class="actions-section">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面头部组件
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
defineProps({
  /** 页面标题 */
  title: {
    type: String,
    required: true,
  },
  /** 页面副标题 */
  subtitle: {
    type: String,
    default: "",
  },
  /** 标题图标 */
  icon: {
    type: String,
    default: "",
  },
  /** 统计数据 */
  stats: {
    type: Array,
    default: () => [],
  },
});
</script>

<style lang="scss" scoped>
.modern-page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 100px;

  .stat-number {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }
}

.actions-section {
  display: flex;
  gap: 12px;
}
</style>
