<template>
  <div class="capture-stats" v-loading="loading">
    <div class="stats-header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>统计信息</h2>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats?.total || 0 }}</div>
        <div class="stat-label">总数据包数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ protocolCount }}</div>
        <div class="stat-label">协议类型数</div>
      </div>
    </div>

    <div class="protocol-card">
      <h3>协议分布</h3>
      <el-table :data="protocolStats" stripe style="width: 100%">
        <el-table-column prop="protocol" label="协议" />
        <el-table-column prop="count" label="数量" />
        <el-table-column label="占比">
          <template #default="{ row }">
            {{ getPercentage(row.count) }}%
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <el-progress :percentage="getPercentage(row.count)" :stroke-width="8" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { captureApi, type CaptureStats } from '@/api/capture'

const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)

const loading = ref(false)
const stats = ref<CaptureStats | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await captureApi.getStats(sessionId)
  } catch (e) {
    console.error('Failed to load stats', e)
  } finally {
    loading.value = false
  }
})

const protocolStats = computed(() => {
  return stats.value?.protocols || []
})

const protocolCount = computed(() => {
  return protocolStats.value.length
})

function getPercentage(count: number) {
  if (!stats.value?.total) return 0
  return Math.round((count / stats.value.total) * 100)
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.capture-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.stat-label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.protocol-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
}

.protocol-card h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
}
</style>
