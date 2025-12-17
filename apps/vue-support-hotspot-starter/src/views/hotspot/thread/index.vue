<template>
  <div class="page flex flex-col h-full">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:cpu-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.length }}</div>
              <div class="stat-label">总线程数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper success">
              <IconifyIconOnline icon="ri:play-circle-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.filter(t => t.state === 'RUNNABLE').length }}</div>
              <div class="stat-label">RUNNABLE</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper warning">
              <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.filter(t => t.state === 'WAITING' || t.state === 'TIMED_WAITING').length }}</div>
              <div class="stat-label">WAITING</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper danger">
              <IconifyIconOnline icon="ri:error-warning-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.filter(t => t.state === 'BLOCKED').length }}</div>
              <div class="stat-label">BLOCKED</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="flex-1 overflow-hidden">
      <el-card class="h-full" shadow="never">
        <el-table :data="data" border stripe style="width: 100%" row-key="id" max-height="calc(100vh - 280px)">
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="id" label="线程ID" width="100" align="center">
            <template #default="{ row }">
              <el-tooltip placement="top">
                <template #content>
                  <div style="max-width: 300px">
                    <div><strong>线程ID:</strong> {{ row.id }}</div>
                    <div><strong>状态:</strong> {{ row.state }}</div>
                    <div v-if="row.lockOwnerId > 0"><strong>锁拥有者ID:</strong> {{ row.lockOwnerId }}</div>
                  </div>
                </template>
                <el-tag size="small">{{ row.id }}</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="线程名称" min-width="250">
            <template #default="{ row }">
              <el-tooltip placement="top">
                <template #content>
                  <div style="max-width: 400px">
                    <div><strong>线程名称:</strong> {{ row.name }}</div>
                    <div><strong>是否守护线程:</strong> {{ row.daemon ? '是' : '否' }}</div>
                    <div v-if="row.inNative"><strong>在Native方法中:</strong> 是</div>
                    <div v-if="row.suspended"><strong>已暂停:</strong> 是</div>
                    <div v-if="row.lockName"><strong>锁名称:</strong> {{ row.lockName }}</div>
                  </div>
                </template>
                <div class="flex items-center gap-2">
                  <IconifyIconOnline icon="ri:thread-line" class="text-primary" />
                  <span class="font-medium">{{ row.name }}</span>
                </div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStateType(row.state)" size="small">{{ row.state }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cpu" label="CPU使用率" width="120" align="center">
            <template #default="{ row }">
              <el-tooltip placement="top">
                <template #content>
                  <div style="max-width: 300px">
                    <div><strong>CPU使用率:</strong> {{ row.cpu }}%</div>
                    <div><strong>阻塞次数:</strong> {{ row.blockedCount }}</div>
                    <div><strong>阻塞时间:</strong> {{ row.blockedTime }}ms</div>
                    <div><strong>等待次数:</strong> {{ row.waitedCount }}</div>
                    <div><strong>等待时间:</strong> {{ row.waitedTime }}ms</div>
                  </div>
                </template>
                <span class="font-mono font-semibold">{{ row.cpu }}%</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleInfo(row)">
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="infoVisible" title="线程详情" width="60%" destroy-on-close>
      <pre class="code-block"><code>{{ info }}</code></pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { onBeforeMount, onUnmounted, ref } from "vue";
import { wsService } from "@/utils/websocket";

const data = ref([]);
let unsubscribe = null;
const infoVisible = ref(false);
const info = ref("");

const getStateType = state => {
  const stateMap = {
    RUNNABLE: "success",
    WAITING: "warning",
    TIMED_WAITING: "info",
    BLOCKED: "danger",
    NEW: "",
    TERMINATED: "info"
  };
  return stateMap[state] || "";
};

const handleInfo = row => {
  info.value = JSON.stringify(row, null, 2);
  infoVisible.value = true;
};

// 映射线程数据
const mapThreadData = threads => {
  return (threads || []).map(thread => ({
    id: thread.threadId,
    name: thread.threadName,
    state: thread.threadState,
    cpu: 0,
    blockedCount: thread.blockedCount || 0,
    blockedTime: thread.blockedTime || 0,
    waitedCount: thread.waitedCount || 0,
    waitedTime: thread.waitedTime || 0,
    lockName: thread.lockName,
    lockOwnerId: thread.lockOwnerId,
    lockOwnerName: thread.lockOwnerName,
    inNative: thread.inNative,
    suspended: thread.suspended,
    stackTrace: thread.stackTrace || []
  }));
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "THREAD_INFO") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      data.value = mapThreadData(wsData.threads);
    } catch (error) {
      console.error("解析线程数据失败:", error);
    }
  }
};

onBeforeMount(async () => {
  // 初始加载数据
  http.get((window.agentPath || "/agent") + "/thread").then(res => {
    data.value = mapThreadData(res.data);
  });
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("JVM", "THREAD_INFO", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>
<style lang="scss" scoped>
.page {
  padding: 20px;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.stat-card {
  border-radius: 12px;
  border: none;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      .stat-icon { color: var(--el-color-primary); }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon { color: var(--el-color-success); }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon { color: var(--el-color-warning); }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon { color: var(--el-color-danger); }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon { color: var(--el-color-info); }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.code-block {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
