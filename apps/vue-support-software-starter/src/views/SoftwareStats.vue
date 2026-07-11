<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">软件统计</h1>
        <p class="page-desc">已安装软件的聚合分析与概览</p>
      </div>
      <el-button :loading="loading" @click="loadStats">刷新</el-button>
    </div>

    <div v-if="stats" class="stats-grid">
      <el-card class="shadow-sm rounded-xl p-6 stat-card total">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">已安装软件</div>
      </el-card>
      <el-card class="shadow-sm rounded-xl p-6 stat-card">
        <div class="stat-num">{{ stats.byPublisher?.length || 0 }}</div>
        <div class="stat-label">不同发布者</div>
      </el-card>
      <el-card class="shadow-sm rounded-xl p-6 stat-card">
        <div class="stat-num">{{ stats.byLetter ? Object.keys(stats.byLetter).length : 0 }}</div>
        <div class="stat-label">首字母分组</div>
      </el-card>
    </div>

    <div v-if="stats" class="seg">
      <h2 class="seg-title">按发布者统计</h2>
      <div class="pub-list">
        <div v-for="pub in stats.byPublisher" :key="pub.name" class="pub-row">
          <span class="pub-name">{{ pub.name }}</span>
          <div class="pub-bar-wrap">
            <div class="pub-bar" :style="{ width: barWidth(pub.count) + '%' }" />
          </div>
          <span class="pub-count">{{ pub.count }}</span>
        </div>
      </div>
    </div>

    <div v-if="stats" class="seg">
      <h2 class="seg-title">首字母分布</h2>
      <div class="letter-grid">
        <div v-for="(count, letter) in stats.byLetter" :key="letter" class="letter-item">
          <div class="letter-bar" :style="{ height: letterHeight(count) + 'px' }" />
          <span class="letter-char">{{ letter }}</span>
          <span class="letter-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <div v-if="stats" class="seg">
      <h2 class="seg-title">名称最长的 10 款软件</h2>
      <div class="tool-list">
        <div v-for="(sw, i) in stats.topLongest" :key="i" class="tool-item">
          <span class="tool-rank">#{{ i + 1 }}</span>
          <span class="tool-name">{{ sw.name }}</span>
          <span class="tool-len">{{ sw.name?.length || 0 }} 字</span>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && !stats" description="暂无数据，请先扫描软件" :image-size="40" class="mt-8" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSoftwareStats } from '@/api/software'

const loading = ref(false)
const stats = ref<any>(null)
const maxPubCount = ref(1)

async function loadStats() {
  loading.value = true
  try {
    stats.value = await getSoftwareStats()
    if (stats.value?.byPublisher?.length) {
      maxPubCount.value = Math.max(...stats.value.byPublisher.map((p: any) => p.count))
    }
  } catch { ElMessage.error('加载统计失败') }
  finally { loading.value = false }
}

function barWidth(count: number): number {
  return (count / maxPubCount.value) * 100
}

function letterHeight(count: number): number {
  const vals = Object.values(stats.value?.byLetter || {}) as number[]
  const max = vals.length ? Math.max(...vals) : 0
  return max > 0 ? (count / max) * 80 : 0
}

onMounted(() => { loadStats() })
</script>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { text-align: center; padding: 24px; }
.stat-num { font-size: 36px; font-weight: 700; color: var(--el-text-color-primary); line-height: 1; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 6px; }

.seg { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 14px; padding: 24px; margin-bottom: 14px; }
.seg-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

.pub-list { display: flex; flex-direction: column; gap: 8px; }
.pub-row { display: flex; align-items: center; gap: 12px; }
.pub-name { width: 140px; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.pub-bar-wrap { flex: 1; height: 20px; background: var(--el-fill-color-light); border-radius: 100px; overflow: hidden; }
.pub-bar { height: 100%; background: rgb(var(--el-color-primary)); border-radius: 100px; transition: width 0.4s; }
.pub-count { width: 30px; text-align: right; font-size: 13px; color: var(--el-text-color-secondary); }

.letter-grid { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-end; min-height: 120px; }
.letter-item { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 30px; }
.letter-bar { width: 16px; background: rgb(var(--el-color-primary)); border-radius: 4px 4px 0 0; transition: height 0.4s; min-height: 4px; }
.letter-char { font-size: 11px; font-weight: 600; }
.letter-count { font-size: 10px; color: var(--el-text-color-secondary); }

.tool-list { display: flex; flex-direction: column; gap: 4px; }
.tool-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; transition: background 0.1s; }
.tool-item:hover { background: var(--el-color-primary-light-9); }
.tool-rank { font-size: 12px; color: var(--el-text-color-secondary); width: 24px; }
.tool-name { flex: 1; font-size: 14px; }
.tool-len { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
