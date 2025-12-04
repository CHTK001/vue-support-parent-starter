<template>
  <div class="container-performance-ranking">
    <div class="ranking-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:bar-chart-line" class="header-icon" />
        <span class="header-title">容器性能排行榜</span>
      </div>
      <div class="header-right">
        <el-select v-model="rankingType" size="small" @change="handleRankingTypeChange">
          <el-option label="CPU使用率" value="cpu" />
          <el-option label="内存使用率" value="memory" />
          <el-option label="网络IO" value="network" />
          <el-option label="磁盘IO" value="disk" />
        </el-select>
      </div>
    </div>
    
    <div class="ranking-content">
      <el-table :data="rankingData" style="width: 100%" :show-header="false">
        <el-table-column prop="rank" width="40">
          <template #default="{ row }">
            <div class="rank-number" :class="getRankClass(row.rank)">
              {{ row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="containerName">
          <template #default="{ row }">
            <div class="container-info">
              <div class="container-name">{{ row.containerName }}</div>
              <div class="container-image">{{ row.imageName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="value" width="80" align="right">
          <template #default="{ row }">
            <div class="value-text">{{ formatValue(row.value, row.unit) }}</div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface RankingItem {
  rank: number
  containerId: number
  containerName: string
  imageName: string
  value: number
  unit: string
}

// 响应式数据
const rankingType = ref('cpu')
const rankingData = ref<RankingItem[]>([])

// 获取排行榜数据
const fetchRankingData = async () => {
  try {
    // 这里使用模拟数据，实际应用中应该从API获取真实数据
    const mockData: RankingItem[] = [
      {
        rank: 1,
        containerId: 1001,
        containerName: 'nginx-proxy',
        imageName: 'nginx:latest',
        value: 95.2,
        unit: '%'
      },
      {
        rank: 2,
        containerId: 1002,
        containerName: 'mysql-db',
        imageName: 'mysql:8.0',
        value: 87.6,
        unit: '%'
      },
      {
        rank: 3,
        containerId: 1003,
        containerName: 'redis-cache',
        imageName: 'redis:alpine',
        value: 72.3,
        unit: '%'
      },
      {
        rank: 4,
        containerId: 1004,
        containerName: 'node-app',
        imageName: 'node:16-alpine',
        value: 65.8,
        unit: '%'
      },
      {
        rank: 5,
        containerId: 1005,
        containerName: 'mongo-db',
        imageName: 'mongo:latest',
        value: 58.4,
        unit: '%'
      }
    ]
    
    rankingData.value = mockData
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
  }
}

// 处理排行榜类型变化
const handleRankingTypeChange = () => {
  fetchRankingData()
}

// 根据排名获取样式类
const getRankClass = (rank: number) => {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return ''
}

// 格式化值显示
const formatValue = (value: number, unit: string) => {
  return `${value.toFixed(1)}${unit}`
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRankingData()
})
</script>

<style scoped>
.container-performance-ranking {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ranking-content {
  min-height: 200px;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  background: #f5f7fa;
}

.rank-number.rank-first {
  background: #f56c6c;
  color: white;
}

.rank-number.rank-second {
  background: #e6a23c;
  color: white;
}

.rank-number.rank-third {
  background: #67c23a;
  color: white;
}

.container-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.container-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.container-image {
  font-size: 12px;
  color: #909399;
}

.value-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>