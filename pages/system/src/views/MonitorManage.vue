<script setup lang="ts">
/**
 * 系统监控（JVM 运行时）页面
 *
 * 调用 GET /v2/jvm/info，默认 5 秒轮询刷新。
 * 顶部 4 个统计卡片 + 内存 / 线程 / GC / 系统信息 / Top CPU 线程。
 * 进度条颜色：<60% 绿，<80% 橙，>=80% 红。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Cpu, Monitor } from "@element-plus/icons-vue";
import { getJvmInfo } from "../api/systemApi";
import type { JvmInfo, MemoryUsage } from "../api/types";

const info = ref<JvmInfo>({});
const loading = ref(false);
const autoRefresh = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

async function loadInfo(silent = false) {
  if (!silent) loading.value = true;
  try {
    const res = await getJvmInfo();
    info.value = res?.data ?? {};
  } catch (e) {
    if (!silent) ElMessage.error((e as Error)?.message ?? "监控信息加载失败");
  } finally {
    if (!silent) loading.value = false;
  }
}

function startTimer() {
  stopTimer();
  if (autoRefresh.value) {
    timer = setInterval(() => loadInfo(true), 5000);
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(autoRefresh, (v) => {
  if (v) startTimer();
  else stopTimer();
});

/* ============ 工具函数 ============ */

/** 字节格式化（1024 进制） */
function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(2)} ${units[i]}`;
}

/** 使用率百分比 0-100 */
function usagePercent(usage?: MemoryUsage): number {
  if (!usage || usage.max === undefined || usage.max <= 0 || usage.used === undefined) return 0;
  return Math.min(100, Math.round((usage.used / usage.max) * 100));
}

/** 根据使用率返回进度条颜色 */
function barColor(percent: number): string {
  if (percent >= 80) return "var(--el-color-danger)";
  if (percent >= 60) return "var(--el-color-warning)";
  return "var(--el-color-success)";
}

/** 运行时长格式化 */
function formatUptime(ms?: number): string {
  if (!ms) return "-";
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}天 ${h}时 ${m}分 ${s}秒`;
  if (h > 0) return `${h}时 ${m}分 ${s}秒`;
  if (m > 0) return `${m}分 ${s}秒`;
  return `${s}秒`;
}

function formatTime(ms?: number): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

/* ============ 顶部统计 ============ */
const cpuPercent = computed(() => Math.round((info.value.systemInfo?.cpuUsage ?? 0) * 100));
const heapPercent = computed(() => usagePercent(info.value.heapMemory));
const nonHeapPercent = computed(() => usagePercent(info.value.nonHeapMemory));
const threadCount = computed(() => info.value.threadInfo?.threadCount ?? 0);
const deadlocked = computed(() => info.value.threadInfo?.deadlockedThreadCount ?? 0);

onMounted(() => {
  loadInfo();
  startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<template>
  <div class="system-page">
    <!-- 控制栏 -->
    <div class="mon-toolbar">
      <div class="mon-toolbar__title">
        <el-icon :size="18" color="var(--el-color-primary)"><Monitor /></el-icon>
        <span>JVM 实时监控</span>
      </div>
      <div class="mon-toolbar__actions">
        <span class="mon-toolbar__auto">
          自动刷新
          <el-switch v-model="autoRefresh" size="small" />
        </span>
        <ReButton layout="modern" icon="Refresh" :loading="loading" @click="loadInfo()">手动刷新</ReButton>
      </div>
    </div>

    <!-- 顶部 4 个统计卡片 -->
    <div class="mon-stats">
      <div class="mon-stat">
        <div class="mon-stat__label"><el-icon><Cpu /></el-icon> CPU 使用率</div>
        <el-progress type="dashboard" :width="110" :percentage="cpuPercent" :color="barColor(cpuPercent)" />
      </div>
      <div class="mon-stat">
        <div class="mon-stat__label">堆内存使用率</div>
        <el-progress type="dashboard" :width="110" :percentage="heapPercent" :color="barColor(heapPercent)" />
      </div>
      <div class="mon-stat">
        <div class="mon-stat__label">非堆内存使用率</div>
        <el-progress type="dashboard" :width="110" :percentage="nonHeapPercent" :color="barColor(nonHeapPercent)" />
      </div>
      <div class="mon-stat">
        <div class="mon-stat__label">线程数</div>
        <div class="mon-stat__big">{{ threadCount }}</div>
        <div v-if="deadlocked > 0" class="mon-stat__warn">死锁线程 {{ deadlocked }}</div>
        <div v-else class="mon-stat__sub">运行正常</div>
      </div>
    </div>

    <!-- 内存区域 -->
    <el-card shadow="never" class="system-page__card">
      <template #header><span class="mon-section__title">内存</span></template>
      <div class="mon-mem">
        <div class="mon-mem__row">
          <div class="mon-mem__name">堆内存</div>
          <el-progress
            class="mon-mem__bar"
            :percentage="heapPercent"
            :color="barColor(heapPercent)"
            :format="() => `${formatBytes(info.heapMemory?.used)} / ${formatBytes(info.heapMemory?.max)}`"
          />
        </div>
        <div class="mon-mem__row">
          <div class="mon-mem__name">非堆内存</div>
          <el-progress
            class="mon-mem__bar"
            :percentage="nonHeapPercent"
            :color="barColor(nonHeapPercent)"
            :format="() => `${formatBytes(info.nonHeapMemory?.used)} / ${formatBytes(info.nonHeapMemory?.max)}`"
          />
        </div>
        <div v-for="p in info.memoryPools ?? []" :key="p.name" class="mon-mem__row">
          <div class="mon-mem__name" :title="p.name">{{ p.name }}</div>
          <el-progress
            class="mon-mem__bar"
            :percentage="usagePercent(p.usage)"
            :color="barColor(usagePercent(p.usage))"
            :format="() => `${formatBytes(p.usage?.used)} / ${formatBytes(p.usage?.max)}`"
          />
        </div>
      </div>
    </el-card>

    <!-- 线程 + GC -->
    <div class="mon-grid">
      <el-card shadow="never" class="system-page__card">
        <template #header><span class="mon-section__title">线程</span></template>
        <div class="mon-kv">
          <div class="mon-kv__item"><span>当前线程数</span><b>{{ info.threadInfo?.threadCount ?? '-' }}</b></div>
          <div class="mon-kv__item"><span>峰值线程数</span><b>{{ info.threadInfo?.peakThreadCount ?? '-' }}</b></div>
          <div class="mon-kv__item"><span>守护线程数</span><b>{{ info.threadInfo?.daemonThreadCount ?? '-' }}</b></div>
          <div class="mon-kv__item" :class="{ 'mon-kv__item--danger': deadlocked > 0 }">
            <span>死锁线程数</span><b>{{ deadlocked }}</b>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="system-page__card">
        <template #header><span class="mon-section__title">垃圾回收 (GC)</span></template>
        <div v-if="(info.garbageCollectors ?? []).length" class="mon-gc">
          <div v-for="g in info.garbageCollectors" :key="g.name" class="mon-gc__item">
            <div class="mon-gc__name" :title="g.name">{{ g.name }}</div>
            <div class="mon-gc__meta">回收 {{ g.collectionCount ?? 0 }} 次 / 耗时 {{ g.collectionTime ?? 0 }} ms</div>
          </div>
        </div>
        <el-empty v-else description="暂无 GC 数据" :image-size="50" />
      </el-card>
    </div>

    <!-- 系统信息 -->
    <el-card shadow="never" class="system-page__card">
      <template #header><span class="mon-section__title">系统信息</span></template>
      <div class="mon-kv mon-kv--cols">
        <div class="mon-kv__item"><span>JVM 名称</span><b>{{ info.jvmName ?? '-' }}</b></div>
        <div class="mon-kv__item"><span>JVM 版本</span><b>{{ info.jvmVersion ?? '-' }}</b></div>
        <div class="mon-kv__item"><span>Java 版本</span><b>{{ info.javaVersion ?? '-' }}</b></div>
        <div class="mon-kv__item"><span>启动时间</span><b>{{ formatTime(info.startTime) }}</b></div>
        <div class="mon-kv__item"><span>运行时长</span><b>{{ formatUptime(info.uptime) }}</b></div>
        <div class="mon-kv__item">
          <span>系统内存</span>
          <b>{{ formatBytes(info.systemInfo?.totalMemory) }} 总 / {{ formatBytes(info.systemInfo?.freeMemory) }} 可用</b>
        </div>
      </div>
      <div v-if="(info.inputArguments ?? []).length" class="mon-args">
        <div class="mon-args__title">JVM 参数</div>
        <pre class="mon-args__pre">{{ (info.inputArguments ?? []).join('\n') }}</pre>
      </div>
    </el-card>

    <!-- Top CPU 线程 -->
    <el-card shadow="never" class="system-page__card">
      <template #header><span class="mon-section__title">Top CPU 线程</span></template>
      <el-table v-if="(info.topCpuThreads ?? []).length" :data="info.topCpuThreads" size="small">
        <el-table-column prop="name" label="线程名" min-width="280" show-overflow-tooltip />
        <el-table-column label="CPU 使用率" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.cpuPercent ?? 0) * 100)"
              :color="barColor(Math.round((row.cpuPercent ?? 0) * 100))"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="140" />
      </el-table>
      <el-empty v-else description="暂无线程数据" :image-size="50" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  overflow: auto;
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.mon-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.mon-toolbar__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.mon-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mon-toolbar__auto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mon-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.mon-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.mon-stat__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.mon-stat__big {
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
}
.mon-stat__sub {
  font-size: 13px;
  color: var(--el-color-success);
}
.mon-stat__warn {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-danger);
}
.mon-section__title {
  font-size: 15px;
  font-weight: 600;
}
.mon-mem {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mon-mem__row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.mon-mem__name {
  width: 160px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mon-mem__bar {
  flex: 1;
}
.mon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.mon-kv {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mon-kv--cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 24px;
}
.mon-kv__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.mon-kv__item span {
  color: var(--el-text-color-secondary);
}
.mon-kv__item b {
  color: var(--el-text-color-primary);
}
.mon-kv__item--danger b {
  color: var(--el-color-danger);
}
.mon-gc {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mon-gc__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.mon-gc__name {
  font-size: 13px;
  font-weight: 600;
}
.mon-gc__meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mon-args {
  margin-top: 14px;
}
.mon-args__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}
.mon-args__pre {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  background: var(--el-fill-color-darker);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow: auto;
}
@media screen and (max-width: 1200px) {
  .mon-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .mon-grid {
    grid-template-columns: 1fr;
  }
}
</style>
