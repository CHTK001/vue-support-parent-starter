<template>
  <div class="thread-viewer">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="按线程名称过�? clearable style="max-width: 200px" />
      <el-select v-model="count" style="width: 120px">
        <el-option :value="10" label="10�? />
        <el-option :value="20" label="20�? />
        <el-option :value="50" label="50�? />
      </el-select>
      <el-checkbox v-model="blocking">仅阻�?/el-checkbox>
      <el-input v-model="threadId" placeholder="线程ID" style="max-width: 120px" />
      <el-select v-model="stateFilter" placeholder="状态筛�? style="width: 140px" clearable>
        <el-option value="RUNNABLE" label="RUNNABLE" />
        <el-option value="WAITING" label="WAITING" />
        <el-option value="TIMED_WAITING" label="TIMED_WAITING" />
        <el-option value="BLOCKED" label="BLOCKED" />
        <el-option value="NEW" label="NEW" />
        <el-option value="TERMINATED" label="TERMINATED" />
      </el-select>
      <el-checkbox v-model="autoRefresh">自动刷新</el-checkbox>
      <el-select v-model="refreshInterval" style="width: 120px" :disabled="!autoRefresh" placeholder="刷新间隔">
        <el-option :value="5" label="5�? />
        <el-option :value="10" label="10�? />
        <el-option :value="30" label="30�? />
        <el-option :value="60" label="60�? />
      </el-select>
      <el-button @click="clearData">清空</el-button>
      <el-button type="primary" :disabled="!nodeId" :loading="loading" @click="run">
        {{ autoRefresh && countdown > 0 ? `刷新(${countdown}s)` : "刷新" }}
      </el-button>
    </div>

    <div class="content">
      <div v-if="error" class="error-message">
        <el-alert type="error" :title="error" show-icon />
      </div>

      <div v-else-if="threads.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无线程数据，请点击刷新获取" />
      </div>

      <div v-else class="thread-table-container">
        <el-table :data="filteredThreads" height="100%" stripe @row-click="handleRowClick" row-class-name="thread-row">
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="name" label="线程名称" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="thread-name">
                <el-tag v-if="row.daemon" size="small" type="info">守护</el-tag>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状�? width="120">
            <template #default="{ row }">
              <el-tag :type="getStateType(row.state)" size="small">
                {{ row.state }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cpu" label="CPU%" width="100" sortable>
            <template #default="{ row }"> {{ (row.cpu || 0).toFixed(1) }}% </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先�? width="100" sortable />
          <el-table-column prop="group" label="线程�? width="120" show-overflow-tooltip />
          <el-table-column prop="time" label="时间(ms)" width="120" sortable />
          <el-table-column label="阻塞信息" width="120">
            <template #default="{ row }">
              <div v-if="row.blockedCount > 0" class="blocked-info">
                <el-tag type="warning" size="small">{{ row.blockedCount }}</el-tag>
              </div>
              <span v-else class="blocked-info">�?/span>
            </template>
          </el-table-column>
          <el-table-column label="等待信息" width="120">
            <template #default="{ row }">
              <div v-if="row.waitedCount > 0" class="waited-info">
                <el-tag type="info" size="small">{{ row.waitedCount }}</el-tag>
              </div>
              <span v-else class="waited-info">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click.stop="viewStackTrace(row)"> 堆栈 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 堆栈跟踪对话�?-->
    <el-dialog v-model="stackTraceVisible" :title="`线程堆栈 - ${selectedThread?.name} (ID: ${selectedThread?.id})`" width="80%" top="5vh">
      <div v-if="selectedThread" class="stack-trace-content">
        <div class="thread-info">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="线程ID">{{ selectedThread.id }}</el-descriptions-item>
            <el-descriptions-item label="线程名称">{{ selectedThread.name }}</el-descriptions-item>
            <el-descriptions-item label="状�?>
              <el-tag :type="getStateType(selectedThread.state)">{{ selectedThread.state }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先�?>{{ selectedThread.priority }}</el-descriptions-item>
            <el-descriptions-item label="线程�?>{{ selectedThread.group }}</el-descriptions-item>
            <el-descriptions-item label="是否守护线程">
              <el-tag :type="selectedThread.daemon ? 'info' : 'success'">
                {{ selectedThread.daemon ? "�? : "�? }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="CPU使用�?>{{ (selectedThread.cpu || 0).toFixed(2) }}%</el-descriptions-item>
            <el-descriptions-item label="运行时间">{{ selectedThread.time }}ms</el-descriptions-item>
            <el-descriptions-item label="是否中断">
              <el-tag :type="selectedThread.interrupted ? 'danger' : 'success'">
                {{ selectedThread.interrupted ? "�? : "�? }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="selectedThread.lockInfo" class="lock-info">
          <h4>锁信�?/h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="锁名�?>{{ selectedThread.lockName }}</el-descriptions-item>
            <el-descriptions-item label="锁拥有者ID">{{ selectedThread.lockOwnerId }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="stack-trace">
          <h4>堆栈跟踪</h4>
          <div v-if="selectedThread.stackTrace && selectedThread.stackTrace.length > 0" class="stack-frames">
            <div v-for="(frame, index) in selectedThread.stackTrace" :key="index" class="stack-frame">
              <div class="frame-method">
                <span class="class-name">{{ frame.className }}</span>
                <span class="method-name">.{{ frame.methodName }}</span>
                <span v-if="frame.fileName" class="file-info"> ({{ frame.fileName }}:{{ frame.lineNumber > 0 ? frame.lineNumber : "Native" }}) </span>
              </div>
            </div>
          </div>
          <div v-else class="no-stack">
            <el-empty description="无堆栈信�? />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { execArthasCommand, type ArthasThreadInfo } from "@/api/arthas/arthas-http";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ nodeId: string }>();

// 响应式数�?
const keyword = ref("");
const count = ref(20);
const blocking = ref(false);
const threadId = ref<string | number | "">("");
const stateFilter = ref("");
const loading = ref(false);
const error = ref("");
const threads = ref<ArthasThreadInfo[]>([]);
const stackTraceVisible = ref(false);
const selectedThread = ref<ArthasThreadInfo | null>(null);

// 自动刷新相关
const autoRefresh = ref(false);
const refreshInterval = ref(10); // 默认10�?
const countdown = ref(0);
let refreshTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

// 过滤后的线程列表
const filteredThreads = computed(() => {
  let result = threads.value;

  // 按关键字过滤
  if (keyword.value) {
    result = result.filter((thread) => thread.name.toLowerCase().includes(keyword.value.toLowerCase()));
  }

  // 按状态过�?
  if (stateFilter.value) {
    result = result.filter((thread) => thread.state === stateFilter.value);
  }

  return result;
});

// 获取状态对应的标签类型
function getStateType(state: string): "success" | "info" | "warning" | "danger" | "primary" {
  switch (state) {
    case "RUNNABLE":
      return "success";
    case "WAITING":
      return "info";
    case "TIMED_WAITING":
      return "warning";
    case "BLOCKED":
      return "danger";
    case "NEW":
      return "primary";
    case "TERMINATED":
      return "info";
    default:
      return "primary";
  }
}

// 清空数据
function clearData() {
  threads.value = [];
  error.value = "";
}

// 构建命令
function buildCmd(): string {
  const id = String(threadId.value || "").trim();
  if (id) return `thread -i ${id}`;
  if (blocking.value) return `thread -b`;
  return `thread -n ${count.value}`;
}

// 解析线程数据
function parseThreadData(output: any): ArthasThreadInfo[] {
  try {
    if (!output?.body?.results) {
      return [];
    }

    const results = output.body.results;
    const threadResult = results.find((r: any) => r.type === "thread");

    if (!threadResult?.busyThreads) {
      return [];
    }

    return threadResult.busyThreads.map((thread: any) => ({
      id: thread.id,
      name: thread.name,
      state: thread.state,
      cpu: thread.cpu || 0,
      daemon: thread.daemon,
      deltaTime: thread.deltaTime,
      group: thread.group,
      inNative: thread.inNative,
      interrupted: thread.interrupted,
      lockInfo: thread.lockInfo,
      lockName: thread.lockName,
      lockOwnerId: thread.lockOwnerId,
      lockedMonitors: thread.lockedMonitors || [],
      lockedSynchronizers: thread.lockedSynchronizers || [],
      priority: thread.priority,
      stackTrace: thread.stackTrace || [],
      suspended: thread.suspended,
      time: thread.time,
      waitedCount: thread.waitedCount,
      waitedTime: thread.waitedTime,
      blockedCount: thread.blockedCount,
      blockedTime: thread.blockedTime,
    }));
  } catch (e) {
    console.error("解析线程数据失败:", e);
    return [];
  }
}

// 执行查询
async function run() {
  if (!props.nodeId) return;

  loading.value = true;
  error.value = "";

  try {
    const cmd = buildCmd();
    const res = await execArthasCommand(props.nodeId, cmd);

    if (res?.success) {
      const parsedThreads = parseThreadData(res.data?.output);
      threads.value = parsedThreads;

      if (parsedThreads.length === 0) {
        error.value = "未获取到线程数据";
      }
    } else {
      error.value = res?.msg || "执行失败";
      threads.value = [];
    }
  } catch (e: any) {
    error.value = e?.message || "执行异常";
    threads.value = [];
  } finally {
    loading.value = false;

    // 如果是手动刷新且开启了自动刷新，重新启动定时器
    if (autoRefresh.value && props.nodeId) {
      startAutoRefresh();
    }
  }
}

// 处理行点�?
function handleRowClick(row: ArthasThreadInfo) {
  selectedThread.value = row;
  stackTraceVisible.value = true;
}

// 查看堆栈跟踪
function viewStackTrace(thread: ArthasThreadInfo) {
  selectedThread.value = thread;
  stackTraceVisible.value = true;
}

// 启动自动刷新
function startAutoRefresh() {
  if (!autoRefresh.value || !props.nodeId) return;

  stopAutoRefresh(); // 先停止之前的定时�?

  // 启动倒计�?
  countdown.value = refreshInterval.value;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      run(); // 执行刷新
      countdown.value = refreshInterval.value; // 重置倒计�?
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

// 监听自动刷新状态变�?
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
    startAutoRefresh(); // 重新启动定时�?
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
        startAutoRefresh(); // 如果开启了自动刷新，重新启�?
      }
    }
  }
);

// 组件挂载时自动执�?
onMounted(() => {
  if (props.nodeId) {
    run();
    if (autoRefresh.value) {
      startAutoRefresh();
    }
  }
});

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.thread-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-message {
  margin-bottom: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thread-table-container {
  flex: 1;
  overflow: hidden;
}

.thread-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thread-row {
  cursor: pointer;
}

.thread-row:hover {
  background-color: var(--el-table-row-hover-bg-color);
}

.blocked-info,
.waited-info {
  display: flex;
  justify-content: center;
}

/* 堆栈跟踪对话框样�?*/
.stack-trace-content {
  max-height: 70vh;
  overflow-y: auto;
}

.thread-info {
  margin-bottom: 20px;
}

.lock-info {
  margin-bottom: 20px;
}

.lock-info h4,
.stack-trace h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.stack-trace {
  margin-bottom: 20px;
}

.stack-frames {
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.stack-frame {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
}

.stack-frame:last-child {
  border-bottom: none;
}

.frame-method {
  color: var(--el-text-color-primary);
}

.class-name {
  color: var(--el-color-primary);
  font-weight: 500;
}

.method-name {
  color: var(--el-color-success);
  font-weight: 600;
}

.file-info {
  color: var(--el-text-color-secondary);
  font-style: italic;
  margin-left: 8px;
}

.no-stack {
  text-align: center;
  padding: 20px;
}

/* 自动刷新相关样式 */
.toolbar .el-checkbox {
  white-space: nowrap;
}

.toolbar .el-select.is-disabled {
  opacity: 0.6;
}

/* 响应式设�?*/
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar > * {
    width: 100%;
  }

  .toolbar .el-checkbox,
  .toolbar .el-button {
    width: auto;
  }
}
</style>
