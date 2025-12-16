<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { http } from "@repo/utils";
import { ElMessage } from "element-plus";

const loading = ref(false);
const jvmInfo = ref<any>({});
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 获取JVM信息
const fetchJvmInfo = async () => {
  loading.value = true;
  try {
    const res = await http.get((window.agentPath || "/agent") + "/jvm");
    jvmInfo.value = res.data || {};
  } catch (error) {
    console.error("获取JVM信息失败:", error);
  } finally {
    loading.value = false;
  }
};

// 格式化字节
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

// 计算内存使用百分比
const heapUsedPercent = computed(() => {
  const used = jvmInfo.value?.heapMemoryUsed || 0;
  const max = jvmInfo.value?.heapMemoryMax || 1;
  return Math.round((used / max) * 100);
});

const nonHeapUsedPercent = computed(() => {
  const used = jvmInfo.value?.nonHeapMemoryUsed || 0;
  const max = jvmInfo.value?.nonHeapMemoryMax || jvmInfo.value?.nonHeapMemoryUsed || 1;
  return Math.round((used / max) * 100);
});

// 格式化运行时长
const formatUptime = (ms: number) => {
  if (!ms) return "-";
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let result = "";
  if (days > 0) result += `${days}天 `;
  if (hours > 0) result += `${hours}小时 `;
  if (minutes > 0) result += `${minutes}分钟 `;
  result += `${secs}秒`;
  return result;
};

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("zh-CN");
};

// 触发GC
const triggerGC = async () => {
  try {
    await http.post((window.agentPath || "/agent") + "/jvm?action=gc");
    ElMessage.success("GC已触发");
    setTimeout(fetchJvmInfo, 1000);
  } catch (error) {
    ElMessage.error("触发GC失败");
  }
};

onMounted(() => {
  fetchJvmInfo();
  // 每5秒刷新一次
  refreshTimer = setInterval(fetchJvmInfo, 5000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:cpu-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">JVM 监控</h2>
          <p class="header-desc">实时监控 JVM 内存、GC 和运行时状态</p>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-card">
          <div class="stat-number">{{ heapUsedPercent }}%</div>
          <div class="stat-label">堆内存</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ jvmInfo.threadCount || 0 }}</div>
          <div class="stat-label">线程数</div>
        </div>
        <el-button type="info" @click="fetchJvmInfo" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="warning" @click="triggerGC">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          触发GC
        </el-button>
      </div>
    </div>

    <!-- 内存监控 -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:stack-line" class="card-icon" />
                堆内存
              </span>
            </div>
          </template>
          <div class="memory-info">
            <div class="memory-progress">
              <el-progress 
                :percentage="heapUsedPercent" 
                :stroke-width="20"
                :color="heapUsedPercent > 80 ? '#F56C6C' : heapUsedPercent > 60 ? '#E6A23C' : '#67C23A'"
              />
            </div>
            <div class="memory-details">
              <div class="detail-item">
                <span class="label">已用</span>
                <span class="value">{{ formatBytes(jvmInfo.heapMemoryUsed) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">已分配</span>
                <span class="value">{{ formatBytes(jvmInfo.heapMemoryCommitted) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最大</span>
                <span class="value">{{ formatBytes(jvmInfo.heapMemoryMax) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:database-line" class="card-icon" />
                非堆内存
              </span>
            </div>
          </template>
          <div class="memory-info">
            <div class="memory-progress">
              <el-progress 
                :percentage="nonHeapUsedPercent" 
                :stroke-width="20"
                :color="nonHeapUsedPercent > 80 ? '#F56C6C' : nonHeapUsedPercent > 60 ? '#E6A23C' : '#409EFF'"
              />
            </div>
            <div class="memory-details">
              <div class="detail-item">
                <span class="label">已用</span>
                <span class="value">{{ formatBytes(jvmInfo.nonHeapMemoryUsed) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">已分配</span>
                <span class="value">{{ formatBytes(jvmInfo.nonHeapMemoryCommitted) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最大</span>
                <span class="value">{{ jvmInfo.nonHeapMemoryMax > 0 ? formatBytes(jvmInfo.nonHeapMemoryMax) : '无限制' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- GC统计和线程信息 -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:recycle-line" class="card-icon gc" />
                GC 统计
              </span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Young GC 次数">
              <span class="highlight-number">{{ jvmInfo.youngGcCount || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Young GC 耗时">
              {{ jvmInfo.youngGcTime || 0 }} ms
            </el-descriptions-item>
            <el-descriptions-item label="Full GC 次数">
              <span class="highlight-number danger">{{ jvmInfo.fullGcCount || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Full GC 耗时">
              {{ jvmInfo.fullGcTime || 0 }} ms
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:stack-overflow-line" class="card-icon thread" />
                线程信息
              </span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前线程数">
              <span class="highlight-number">{{ jvmInfo.threadCount || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="峰值线程数">
              {{ jvmInfo.peakThreadCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="守护线程数">
              {{ jvmInfo.daemonThreadCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="已创建总数">
              {{ jvmInfo.totalStartedThreadCount || 0 }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 类加载和运行时信息 -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:code-box-line" class="card-icon class" />
                类加载信息
              </span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="已加载类数">
              <span class="highlight-number">{{ jvmInfo.loadedClassCount || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="已卸载类数">
              {{ jvmInfo.unloadedClassCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="总加载类数">
              {{ jvmInfo.totalLoadedClassCount || 0 }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="modern-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <IconifyIconOnline icon="ri:information-line" class="card-icon info" />
                运行时信息
              </span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="JVM名称">
              {{ jvmInfo.vmName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="JVM版本">
              {{ jvmInfo.vmVersion || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="启动时间">
              {{ formatTime(jvmInfo.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              <span class="highlight-number">{{ formatUptime(jvmInfo.uptime) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-color-success-light-8) 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-success);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-desc {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-card {
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-success);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.content-row {
  margin-bottom: 20px;
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);

        &.gc { color: var(--el-color-warning); }
        &.thread { color: var(--el-color-info); }
        &.class { color: var(--el-color-success); }
        &.info { color: var(--el-color-primary); }
      }
    }
  }
}

.memory-info {
  .memory-progress {
    margin-bottom: 20px;
  }

  .memory-details {
    display: flex;
    justify-content: space-between;

    .detail-item {
      text-align: center;

      .label {
        display: block;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
      }

      .value {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.highlight-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);

  &.danger {
    color: var(--el-color-danger);
  }
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    .header-right .stat-card {
      background: var(--el-bg-color);
    }
  }

  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
