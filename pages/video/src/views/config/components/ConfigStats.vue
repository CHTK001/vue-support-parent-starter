<template>
  <div class="stats-cards">
    <div class="stat-card stat-card-primary">
      <div class="stat-content">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:settings-3-line" />
        </div>
        <div class="stat-info">
          <p class="stat-label">总配置数</p>
          <p class="stat-value">{{ stats.totalConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card stat-card-success">
      <div class="stat-content">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:check-line" />
        </div>
        <div class="stat-info">
          <p class="stat-label">启用中</p>
          <p class="stat-value">{{ stats.enabledConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card stat-card-warning">
      <div class="stat-content">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:time-line" />
        </div>
        <div class="stat-info">
          <p class="stat-label">同步中</p>
          <p class="stat-value">{{ stats.syncingConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card stat-card-danger">
      <div class="stat-content">
        <div class="stat-icon">
          <IconifyIconOnline icon="ri:error-warning-line" />
        </div>
        <div class="stat-info">
          <p class="stat-label">异常配置</p>
          <p class="stat-value">{{ stats.errorConfigs }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 配置统计信息组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

interface StatsData {
  totalConfigs: number;
  enabledConfigs: number;
  syncingConfigs: number;
  errorConfigs: number;
}

// 定义props
defineProps<{
  stats: StatsData;
}>();
</script>

<style scoped lang="scss">
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.stat-card-primary {
  border-left-color: var(--el-color-primary);
}

.stat-card-success {
  border-left-color: var(--el-color-success);
}

.stat-card-warning {
  border-left-color: var(--el-color-warning);
}

.stat-card-danger {
  border-left-color: var(--el-color-danger);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.stat-card-primary .stat-icon {
  background: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
}

.stat-card-success .stat-icon {
  background: rgba(var(--el-color-success-rgb), 0.1);
  color: var(--el-color-success);
}

.stat-card-warning .stat-icon {
  background: rgba(var(--el-color-warning-rgb), 0.1);
  color: var(--el-color-warning);
}

.stat-card-danger .stat-icon {
  background: rgba(var(--el-color-danger-rgb), 0.1);
  color: var(--el-color-danger);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>