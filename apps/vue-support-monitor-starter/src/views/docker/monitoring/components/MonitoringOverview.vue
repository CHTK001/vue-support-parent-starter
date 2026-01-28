<template>
  <div class="monitoring-overview system-container modern-bg">
    <div class="overview-grid">
      <div class="overview-card">
        <div class="overview-icon cpu">
          <IconifyIconOnline icon="ri:cpu-line" />
        </div>
        <div class="overview-content">
          <div class="overview-value">{{ formatPercent(avgCpuUsage) }}</div>
          <div class="overview-label">平均CPU使用率</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon memory">
          <IconifyIconOnline icon="ri:database-2-line" />
        </div>
        <div class="overview-content">
          <div class="overview-value">{{ formatPercent(avgMemoryUsage) }}</div>
          <div class="overview-label">平均内存使用率</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon container">
          <IconifyIconOnline icon="ri:container-line" />
        </div>
        <div class="overview-content">
          <div class="overview-value">{{ totalContainers }}</div>
          <div class="overview-label">总容器数</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon running">
          <IconifyIconOnline icon="ri:play-circle-line" />
        </div>
        <div class="overview-content">
          <div class="overview-value">{{ runningContainers }}</div>
          <div class="overview-label">运行中容器</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface Props {
  avgCpuUsage: number
  avgMemoryUsage: number
  totalContainers: number
  runningContainers: number
}

const props = defineProps<Props>()

const formatPercent = (value: number) => `${value.toFixed(1)}%`
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.monitoring-overview {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.overview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  font-size: 24px;
  color: white;
}

.overview-icon.cpu {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.overview-icon.memory {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.overview-icon.container {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.overview-icon.running {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>