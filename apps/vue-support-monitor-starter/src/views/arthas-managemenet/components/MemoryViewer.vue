<template>
  <div class="memory-viewer system-container modern-bg">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <el-button type="primary" :disabled="!nodeId" :loading="loading" @click="run">
          {{ autoRefresh && countdown > 0 ? `刷新(${countdown}s)` : "刷新" }}
        </el-button>
        <el-checkbox v-model="autoRefresh">自动刷新</el-checkbox>
        <el-select v-model="refreshInterval" style="width: 120px" placeholder="刷新间隔" title="设置内存数据刷新间隔">
          <el-option :value="5" label="5秒" />
          <el-option :value="10" label="10秒" />
          <el-option :value="30" label="30秒" />
          <el-option :value="60" label="60秒" />
        </el-select>
        <el-button @click="clearData">清空</el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon class="mb-4" />

    <!-- 内存概览卡片 -->
    <div v-if="memoryData" class="memory-overview">
      <div class="memory-cards">
        <el-card class="memory-card">
          <div class="card-header">
            <span class="card-title">堆内存</span>
            <el-tag :type="getUsageType(memoryData.heap.usage)">
              {{ formatPercent(memoryData.heap.usage) }}
            </el-tag>
          </div>
          <div class="memory-info">
            <div class="memory-bar">
              <el-progress :percentage="memoryData.heap.usage" :color="getProgressColor(memoryData.heap.usage)" :show-text="false" />
            </div>
            <div class="memory-details">
              <span>已用: {{ formatBytes(memoryData.heap.used) }}</span>
              <span>最大: {{ memoryData.heap.max > 0 ? formatBytes(memoryData.heap.max) : "无限制" }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="memory-card">
          <div class="card-header">
            <span class="card-title">非堆内存</span>
            <el-tag :type="getUsageType(memoryData.nonHeap.usage)">
              {{ formatPercent(memoryData.nonHeap.usage) }}
            </el-tag>
          </div>
          <div class="memory-info">
            <div class="memory-bar">
              <el-progress :percentage="memoryData.nonHeap.usage" :color="getProgressColor(memoryData.nonHeap.usage)" :show-text="false" />
            </div>
            <div class="memory-details">
              <span>已用: {{ formatBytes(memoryData.nonHeap.used) }}</span>
              <span>最大: {{ formatBytes(memoryData.nonHeap.max) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="memory-card">
          <div class="card-header">
            <span class="card-title">直接内存</span>
            <el-tag :type="getUsageType(memoryData.direct.usage)">
              {{ formatPercent(memoryData.direct.usage) }}
            </el-tag>
          </div>
          <div class="memory-info">
            <div class="memory-bar">
              <el-progress :percentage="memoryData.direct.usage" :color="getProgressColor(memoryData.direct.usage)" :show-text="false" />
            </div>
            <div class="memory-details">
              <span>已用: {{ formatBytes(memoryData.direct.used) }}</span>
              <span>最大: {{ formatBytes(memoryData.direct.max) }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 内存池详情表格 -->
    <div v-if="memoryPools.length > 0" class="memory-pools">
      <h3>内存池详情</h3>
      <el-table :data="memoryPools" stripe>
        <el-table-column prop="name" label="内存池名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'HEAP' ? 'primary' : 'info'" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usage" label="使用率" width="120">
          <template #default="{ row }">
            <el-tag :type="getUsageType(row.usage)" size="small">
              {{ formatPercent(row.usage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="used" label="已用内存" width="120">
          <template #default="{ row }">
            {{ formatBytes(row.used) }}
          </template>
        </el-table-column>
        <el-table-column prop="committed" label="已提交" width="120">
          <template #default="{ row }">
            {{ formatBytes(row.committed) }}
          </template>
        </el-table-column>
        <el-table-column prop="max" label="最大内存" width="120">
          <template #default="{ row }">
            {{ formatBytes(row.max) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && !memoryData" class="empty-state">
      <el-empty description="暂无内存数据，请点击刷新获取" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { execArthasCommand } from "@/api/arthas/arthas-http";
import { ref, watch, onBeforeUnmount } from "vue";

const props = defineProps<{ nodeId: string }>();

// 内存数据接口
interface MemoryInfo {
  used: number;
  committed: number;
  max: number;
  usage: number; // 使用率百分比
}

interface MemoryData {
  heap: MemoryInfo;
  nonHeap: MemoryInfo;
  direct: MemoryInfo;
}

interface MemoryPool {
  name: string;
  type: string;
  used: number;
  committed: number;
  max: number;
  usage: number;
}

// 响应式数据
const loading = ref(false);
const error = ref("");
const memoryData = ref<MemoryData | null>(null);
const memoryPools = ref<MemoryPool[]>([]);

// 自动刷新相关
const autoRefresh = ref(false);
const refreshInterval = ref(10); // 默认10秒
const countdown = ref(0);
let refreshTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

// 清空数据
function clearData() {
  memoryData.value = null;
  memoryPools.value = [];
  error.value = "";
}

// 解析内存数据
function parseMemoryData(output: any): {
  memoryData: MemoryData | null;
  memoryPools: MemoryPool[];
} {
  try {
    if (!output?.body?.results) {
      return { memoryData: null, memoryPools: [] };
    }

    const results = output.body.results;
    const memoryResult = results.find((r: any) => r.type === "memory");

    if (!memoryResult) {
      return { memoryData: null, memoryPools: [] };
    }

    // 后端返回的真实结构：memoryResult.memoryInfo 下包含 heap/nonheap/buffer_pool 数组
    const info = (memoryResult as any).memoryInfo || {};
    const heapPools = Array.isArray(info.heap) ? info.heap : [];
    const nonHeapPools = Array.isArray(info.nonheap) ? info.nonheap : [];
    const bufferPools = Array.isArray(info.buffer_pool) ? info.buffer_pool : [];

    // 汇总项：总堆、总非堆、直接内存
    const heapTotal = heapPools.find((p: any) => p?.name === "heap") || {};
    const nonHeapTotal = nonHeapPools.find((p: any) => p?.name === "nonheap") || {};
    const directBuffer = bufferPools.find((p: any) => p?.name === "direct") || {};

    const memoryData: MemoryData = {
      heap: {
        used: heapTotal.used || 0,
        committed: heapTotal.total || 0,
        max: heapTotal.max || 0,
        usage: heapTotal.max > 0 ? (heapTotal.used / heapTotal.max) * 100 : heapTotal.total > 0 ? (heapTotal.used / heapTotal.total) * 100 : 0,
      },
      nonHeap: {
        used: nonHeapTotal.used || 0,
        committed: nonHeapTotal.total || 0,
        max: nonHeapTotal.max || 0,
        // 非堆max可能为-1，回退用total计算
        usage: nonHeapTotal.max > 0 ? (nonHeapTotal.used / nonHeapTotal.max) * 100 : nonHeapTotal.total > 0 ? (nonHeapTotal.used / nonHeapTotal.total) * 100 : 0,
      },
      direct: {
        used: directBuffer.used || 0,
        committed: directBuffer.total || 0,
        max: directBuffer.max || 0,
        // 直接内存通常max为负值（无限制），用total或used近似
        usage: directBuffer.max > 0 ? (directBuffer.used / directBuffer.max) * 100 : directBuffer.total > 0 ? (directBuffer.used / directBuffer.total) * 100 : directBuffer.used ? 100 : 0,
      },
    };

    // 解析内存池：合并三类数组
    const pools: MemoryPool[] = [];

    const pushPool = (pool: any, type: string) => {
      const max = pool.max || 0;
      const total = pool.total || 0;
      const used = pool.used || 0;
      const usage = max > 0 ? (used / max) * 100 : total > 0 ? (used / total) * 100 : 0;
      pools.push({
        name: pool.name || "",
        type,
        used,
        committed: total,
        max,
        usage,
      });
    };

    heapPools.forEach((p: any) => pushPool(p, "HEAP"));
    nonHeapPools.forEach((p: any) => pushPool(p, "NON_HEAP"));
    bufferPools.forEach((p: any) => pushPool(p, "BUFFER_POOL"));

    return { memoryData, memoryPools: pools };
  } catch (e) {
    console.error("解析内存数据失败:", e);
    return { memoryData: null, memoryPools: [] };
  }
}

// 执行查询
async function run() {
  if (!props.nodeId) return;

  loading.value = true;
  error.value = "";

  try {
    const cmd = "memory";
    const res = await execArthasCommand(props.nodeId, cmd);

    if (res?.success) {
      const { memoryData: parsedMemoryData, memoryPools: parsedPools } = parseMemoryData(res.data?.output);
      memoryData.value = parsedMemoryData;
      memoryPools.value = parsedPools;

      if (!parsedMemoryData) {
        error.value = "未获取到内存数据";
      }
    } else {
      error.value = res?.msg || "执行失败";
      memoryData.value = null;
      memoryPools.value = [];
    }
  } catch (e: any) {
    error.value = e?.message || "执行异常";
    memoryData.value = null;
    memoryPools.value = [];
  } finally {
    loading.value = false;

    // 如果是手动刷新且开启了自动刷新，重新启动定时器
    if (autoRefresh.value && props.nodeId) {
      startAutoRefresh();
    }
  }
}

// 格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 格式化百分比
function formatPercent(percent: number): string {
  return percent.toFixed(1) + "%";
}

// 获取使用率类型
function getUsageType(usage: number): "danger" | "warning" | "success" {
  if (usage >= 90) return "danger";
  if (usage >= 70) return "warning";
  return "success";
}

// 获取进度条颜色
function getProgressColor(usage: number): string {
  if (usage >= 90) return "#f56c6c";
  if (usage >= 70) return "#e6a23c";
  return "#67c23a";
}

// 启动自动刷新
function startAutoRefresh() {
  if (!autoRefresh.value || !props.nodeId) return;

  stopAutoRefresh(); // 先停止之前的定时器

  // 启动倒计时
  countdown.value = refreshInterval.value;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      run(); // 执行刷新
      countdown.value = refreshInterval.value; // 重置倒计时
    }
  }, 1000);
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
}

// 监听自动刷新状态变化
watch(autoRefresh, (newVal) => {
  if (newVal && props.nodeId) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

// 监听刷新间隔变化
watch(refreshInterval, () => {
  if (autoRefresh.value && props.nodeId) {
    startAutoRefresh(); // 重新启动定时器
  }
});

// 监听节点变化
watch(
  () => props.nodeId,
  (n, o) => {
    if (n && n !== o) {
      clearData();
      stopAutoRefresh(); // 停止自动刷新
      if (n && autoRefresh.value) {
        startAutoRefresh(); // 如果开启了自动刷新，重新启动
      }
    }
  }
);

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  stopAutoRefresh();
});
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


.memory-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-panel {
  background: var(--el-bg-color-overlay);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.memory-overview {
  flex: 0 0 auto;
}

.memory-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.memory-card {
  min-height: 120px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.memory-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-bar {
  width: 100%;
}

.memory-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.memory-pools {
  flex: 1;
  min-height: 0;
}

.memory-pools h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mb-4 {
  margin-bottom: 16px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
