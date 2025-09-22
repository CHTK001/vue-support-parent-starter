<template>
  <div class="stats-cards grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="stat-card  rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="stat-icon bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
          <el-icon><IconifyIconOnline icon="ep:setting" /></el-icon>
        </div>
        <div>
          <p class="text-sm text-gray-500">总配置数</p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.totalConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card  rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="stat-icon bg-green-100 text-green-600 p-3 rounded-full mr-3">
          <el-icon><IconifyIconOnline icon="ep:check" /></el-icon>
        </div>
        <div>
          <p class="text-sm text-gray-500">启用中</p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.enabledConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card  rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="stat-icon bg-yellow-100 text-yellow-600 p-3 rounded-full mr-3">
          <el-icon><IconifyIconOnline icon="ep:clock" /></el-icon>
        </div>
        <div>
          <p class="text-sm text-gray-500">同步中</p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.syncingConfigs }}</p>
        </div>
      </div>
    </div>

    <div class="stat-card  rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="stat-icon bg-red-100 text-red-600 p-3 rounded-full mr-3">
          <el-icon><IconifyIconOnline icon="ep:warning" /></el-icon>
        </div>
        <div>
          <p class="text-sm text-gray-500">异常配置</p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.errorConfigs }}</p>
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

<style scoped>
.stat-card {
  transition: all 0.3s ease;
  background: var(--el-bg-color);
}

.stat-card p {
  color: var(--el-text-color-primary);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  transition: all 0.3s ease;
  color: var(--el-text-color-primary);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}
</style>