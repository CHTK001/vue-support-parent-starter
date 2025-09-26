<template>
  <div class="container-status-stats">
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsData" :key="stat.status">
        <div class="stat-icon" :class="stat.status">
          <IconifyIconOnline :icon="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface ContainerStatusStat {
  status: string
  count: number
  label: string
  icon: string
}

interface Props {
  stats: {
    total?: number
    running?: number
    stopped?: number
    paused?: number
    exited?: number
    dead?: number
  }
}

const props = defineProps<Props>()

const statsData: ContainerStatusStat[] = [
  { status: 'total', count: props.stats.total || 0, label: '总计', icon: 'ri:container-line' },
  { status: 'running', count: props.stats.running || 0, label: '运行中', icon: 'ri:play-circle-line' },
  { status: 'stopped', count: props.stats.stopped || 0, label: '已停止', icon: 'ri:stop-circle-line' },
  { status: 'paused', count: props.stats.paused || 0, label: '已暂停', icon: 'ri:pause-circle-line' },
  { status: 'exited', count: props.stats.exited || 0, label: '已退出', icon: 'ri:logout-box-line' },
  { status: 'dead', count: props.stats.dead || 0, label: '已死亡', icon: 'ri:skull-line' }
]
</script>

<style scoped>
.container-status-stats {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: white;
  font-size: 20px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.stat-icon.running {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.stopped {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-icon.paused {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-icon.exited {
  background: linear-gradient(135deg, #f56c6c, #fab6b6);
}

.stat-icon.dead {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>