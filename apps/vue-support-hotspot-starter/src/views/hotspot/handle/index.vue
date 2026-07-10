<template>
  <div class="page flex flex-col h-full">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:file-list-3-line" class="title-icon" />
            句柄监控
          </h1>
          <p class="page-subtitle">实时查看系统句柄信息、分类统计与泄漏检测</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalCurrent }}</div>
            <div class="stat-label">当前句柄</div>
          </div>
          <div class="stat-card stat-card--peak">
            <div class="stat-number">{{ stats.totalPeak }}</div>
            <div class="stat-label">历史峰值</div>
          </div>
          <div class="stat-card stat-card--leak">
            <div class="stat-number">{{ leakData.leakCount || 0 }}</div>
            <div class="stat-label">潜在泄漏</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
          <el-radio-button label="list">句柄列表</el-radio-button>
          <el-radio-button label="stats">分类统计</el-radio-button>
          <el-radio-button label="leaks">泄漏检测</el-radio-button>
        </el-radio-group>
        <el-select
          v-if="activeTab === 'list'"
          v-model="typeFilter"
          placeholder="按类型筛选"
          clearable
          size="small"
          style="width: 140px; margin-left: 12px"
          @change="handleFilterChange"
        >
          <el-option label="全部类型" value="" />
          <el-option label="文件句柄" value="FILE" />
          <el-option label="Socket连接" value="SOCKET" />
          <el-option label="管道" value="PIPE" />
          <el-option label="选择器" value="SELECTOR" />
          <el-option label="文件通道" value="FILE_CHANNEL" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text=""
          size="small"
          style="margin-right: 12px"
          @change="handleAutoRefreshChange"
        />
        <el-button size="small" :icon="Refresh" @click="refreshCurrentTab">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 分类统计视图 -->
    <div v-if="activeTab === 'stats'" class="stats-view">
      <div class="type-stats-grid">
        <div
          v-for="ts in stats.typeStatistics || []"
          :key="ts.type"
          class="type-stat-card"
          :class="'type-stat-card--' + ts.type.toLowerCase()"
        >
          <div class="type-stat-header">
            <IconifyIconOnline :icon="getTypeIcon(ts.type)" class="type-icon" />
            <span class="type-name">{{ ts.displayName }}</span>
          </div>
          <div class="type-stat-body">
            <div class="type-stat-row">
              <span class="type-stat-label">当前打开</span>
              <span class="type-stat-value type-stat-value--current">{{ ts.currentCount }}</span>
            </div>
            <div class="type-stat-row">
              <span class="type-stat-label">历史峰值</span>
              <span class="type-stat-value type-stat-value--peak">{{ ts.peakCount }}</span>
            </div>
            <div class="type-stat-row">
              <span class="type-stat-label">累计打开</span>
              <span class="type-stat-value">{{ ts.totalOpen }}</span>
            </div>
            <div class="type-stat-row">
              <span class="type-stat-label">累计关闭</span>
              <span class="type-stat-value">{{ ts.totalClose }}</span>
            </div>
          </div>
          <div class="type-stat-bar">
            <div
              class="type-stat-bar-fill"
              :style="{ width: getBarWidth(ts.currentCount, ts.peakCount) }"
            />
          </div>
        </div>
      </div>

      <!-- 告警配置 -->
      <div class="threshold-config">
        <ScCard shadow="hover">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:settings-3-line" />
              <span>告警配置</span>
            </div>
          </template>
          <div class="config-form">
            <div class="config-item">
              <label>泄漏检测阈值</label>
              <el-input-number
                v-model="leakThresholdSec"
                :min="10"
                :max="86400"
                :step="30"
                size="small"
                style="width: 140px"
              />
              <span class="config-unit">秒</span>
              <el-button size="small" type="primary" @click="updateLeakThreshold">
                应用
              </el-button>
            </div>
            <div class="config-item">
              <label>句柄数量告警</label>
              <el-input-number
                v-model="countThreshold"
                :min="100"
                :max="100000"
                :step="100"
                size="small"
                style="width: 140px"
              />
              <span class="config-unit">个</span>
              <el-button size="small" type="primary" @click="updateCountThreshold">
                应用
              </el-button>
            </div>
          </div>
        </ScCard>
      </div>
    </div>

    <!-- 泄漏检测视图 -->
    <div v-if="activeTab === 'leaks'" class="leaks-view">
      <div v-if="!leakData.leaks || leakData.leaks.length === 0" class="no-leaks">
        <IconifyIconOnline icon="ri:shield-check-line" class="no-leaks-icon" />
        <p>未检测到句柄泄漏</p>
        <p class="no-leaks-hint">
          泄漏阈值: {{ formatDuration(stats.leakThresholdMs) }}
        </p>
      </div>
      <div v-else class="leaks-list">
        <!-- 严重程度汇总 -->
        <div class="severity-summary">
          <div
            v-for="(count, severity) in leakData.severitySummary || {}"
            :key="severity"
            class="severity-badge"
            :class="'severity-badge--' + severity.toLowerCase()"
          >
            <span class="severity-count">{{ count }}</span>
            <span class="severity-label">{{ severity }}</span>
          </div>
        </div>

        <div v-for="(leak, idx) in leakData.leaks" :key="idx" class="leak-item">
          <ScCard shadow="hover" class="mb-4">
            <template #header>
              <div class="leak-header">
                <span class="leak-index">{{ idx + 1 }}</span>
                <span class="leak-type-badge" :class="'leak-type-badge--' + leak.type.toLowerCase()">
                  {{ leak.typeDisplayName }}
                </span>
                <span class="leak-severity" :class="'leak-severity--' + leak.leakSeverity.toLowerCase()">
                  {{ leak.leakSeverity }}
                </span>
                <span class="leak-duration">{{ leak.openDurationHuman }}</span>
              </div>
            </template>
            <div class="leak-body">
              <div class="leak-message">{{ leak.message }}</div>
              <div v-if="leak.stack && leak.stack.length > 0" class="leak-stack">
                <div class="stack-title">调用堆栈:</div>
                <pre class="stack-trace">{{ formatStack(leak.stack) }}</pre>
              </div>
              <div class="leak-meta">
                <span>打开时间: {{ formatTimestamp(leak.openTimestamp) }}</span>
              </div>
            </div>
          </ScCard>
        </div>
      </div>
    </div>

    <!-- 句柄列表视图 -->
    <div v-if="activeTab === 'list'" class="flex-1 overflow-auto">
      <!-- 分类统计卡片（列表模式下显示摘要） -->
      <div class="type-summary-cards">
        <div
          v-for="ts in stats.typeStatistics || []"
          :key="ts.type"
          class="type-summary-item"
          :class="{ 'type-summary-item--active': typeFilter === ts.type }"
          @click="handleTypeCardClick(ts.type)"
        >
          <IconifyIconOnline :icon="getTypeIcon(ts.type)" class="type-summary-icon" />
          <span class="type-summary-name">{{ ts.displayName }}</span>
          <span class="type-summary-count">{{ ts.currentCount }}</span>
        </div>
      </div>

      <!-- 信息卡片 -->
      <div class="info-card">
        <ScCard shadow="never">
          <div class="info-content" v-html="data.title" />
        </ScCard>
      </div>

      <!-- 句柄列表 -->
      <div v-for="it in filteredData" :id="'element' + it.index" :key="it.index" class="handle-item">
        <ScCard shadow="hover" class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="item-number">{{ it.index + 1 }}</span>
              <span class="item-title" v-html="it.title" />
            </div>
          </template>
          <pre class="code-block"><code v-html="it.code" /></pre>
        </ScCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { http } from "@repo/utils";
import { computed, onBeforeMount, onBeforeUnmount, onUnmounted, reactive, ref } from "vue";
import { wsService } from "@/utils/websocket";
import { Refresh } from "@element-plus/icons-vue";

let unsubscribe = null;
let refreshTimer = null;
const loading = ref(false);
const autoRefresh = ref(false);
const activeTab = ref("list");
const typeFilter = ref("");

const data = reactive({
  data: [],
  title: ""
});

const stats = reactive({
  totalCurrent: 0,
  totalPeak: 0,
  leakThresholdMs: 300000,
  handleCountThreshold: 1000,
  agentInstalled: false,
  typeStatistics: []
});

const leakData = reactive({
  leakCount: 0,
  leaks: [],
  severitySummary: {},
  leakThresholdMs: 300000
});

const leakThresholdSec = ref(300);
const countThreshold = ref(1000);

// 筛选后的数据
const filteredData = computed(() => {
  if (!typeFilter.value) return data.data;
  return data.data.filter(it => it.type === typeFilter.value);
});

function scrollToElement(element) {
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest"
  });
}

const handleClick = async index => {
  scrollToElement(document.getElementById("element" + index));
};

// 获取类型图标
const getTypeIcon = type => {
  const icons = {
    FILE: "ri:file-line",
    SOCKET: "ri:global-line",
    PIPE: "ri:git-branch-line",
    SELECTOR: "ri:checkbox-circle-line",
    FILE_CHANNEL: "ri:folder-transfer-line",
    UNKNOWN: "ri:question-line"
  };
  return icons[type] || icons.UNKNOWN;
};

// 获取进度条宽度
const getBarWidth = (current, peak) => {
  if (!peak || peak === 0) return "0%";
  return Math.min((current / peak) * 100, 100) + "%";
};

// 格式化持续时间
const formatDuration = ms => {
  if (!ms) return "0秒";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
  return `${seconds}秒`;
};

// 格式化时间戳
const formatTimestamp = ts => {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
};

// 格式化堆栈
const formatStack = stack => {
  if (!stack || stack.length === 0) return "无堆栈信息";
  return stack
    .map(s => {
      if (typeof s === "string") return `  at ${s}`;
      return `  at ${s.className || ""}.${s.methodName || ""}(${s.fileName || ""}:${s.lineNumber || ""})`;
    })
    .join("\n");
};

// 解析句柄数据
const parseHandleData = json => {
  const arr = [];
  if (json.data && json.data.length > 0) {
    json.data.forEach((item, index) => {
      const message = item.message || "";
      let resourceType = "UNKNOWN";
      let resourceTypeDisplay = "未知资源";
      let resourceColor = "var(--el-text-color-regular)";

      if (message.includes("FileChannel")) {
        resourceType = "FILE_CHANNEL";
        resourceTypeDisplay = "文件通道";
        resourceColor = "var(--el-color-primary)";
      } else if (message.includes("socket")) {
        resourceType = "SOCKET";
        resourceTypeDisplay = "Socket 连接";
        resourceColor = "var(--el-color-success)";
      } else if (message.includes("Pipe")) {
        resourceType = "PIPE";
        resourceTypeDisplay = "管道";
        resourceColor = "var(--el-color-warning)";
      } else if (message.includes("selector")) {
        resourceType = "SELECTOR";
        resourceTypeDisplay = "选择器";
        resourceColor = "var(--el-color-info)";
      } else if (message.includes("Opened")) {
        resourceType = "FILE";
        resourceTypeDisplay = "文件句柄";
        resourceColor = "var(--el-color-danger)";
      }

      let stackTrace = "";
      if (item.stack && item.stack.length > 0) {
        stackTrace = item.stack
          .map(s => {
            if (typeof s === "string") return `  at ${s}`;
            return `  at ${s.className || ""}.${s.methodName || ""}(${s.fileName || ""}:${s.lineNumber || ""})`;
          })
          .join("\n");
      }

      arr.push({
        index: index,
        id: item.id || `handle_${index}`,
        type: resourceType,
        typeDisplayName: resourceTypeDisplay,
        title: `<span style='color:${resourceColor};'>${resourceTypeDisplay}</span>`,
        code: `${message}\n\n调用堆栈:\n${stackTrace || "无堆栈信息"}`
      });
    });
  }

  const total = json.total || arr.length;
  const agentStatus = json.agentInstalled ? "已安装" : "未安装";
  data.title = `<strong>句柄监控</strong> - 发现 <span style='color:var(--el-color-danger);'>${total}</span> 个打开的句柄 (Agent: ${agentStatus})`;
  data.data = arr;

  // 更新统计信息
  if (json.statistics) {
    Object.assign(stats, json.statistics);
    leakThresholdSec.value = Math.floor((stats.leakThresholdMs || 300000) / 1000);
    countThreshold.value = stats.handleCountThreshold || 1000;
  }
};

// 刷新句柄列表
const refreshData = () => {
  loading.value = true;
  http
    .get((window.agentPath || "/agent") + "/handle")
    .then(res => {
      parseHandleData(res.data);
    })
    .catch(() => {
      data.title = "<strong>句柄监控</strong> - 无法获取数据";
      data.data = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

// 刷新统计信息
const refreshStats = () => {
  loading.value = true;
  http
    .get((window.agentPath || "/agent") + "/handle?action=stats")
    .then(res => {
      const d = res.data;
      if (d) {
        stats.totalCurrent = d.totalCurrent || 0;
        stats.totalPeak = d.totalPeak || 0;
        stats.leakThresholdMs = d.leakThresholdMs || 300000;
        stats.handleCountThreshold = d.handleCountThreshold || 1000;
        stats.agentInstalled = d.agentInstalled || false;
        stats.typeStatistics = d.typeStatistics || [];
        leakThresholdSec.value = Math.floor(stats.leakThresholdMs / 1000);
        countThreshold.value = stats.handleCountThreshold;
      }
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
};

// 刷新泄漏检测
const refreshLeaks = () => {
  loading.value = true;
  http
    .get((window.agentPath || "/agent") + "/handle?action=leaks")
    .then(res => {
      const d = res.data;
      if (d) {
        leakData.leakCount = d.leakCount || 0;
        leakData.leaks = d.leaks || [];
        leakData.severitySummary = d.severitySummary || {};
        leakData.leakThresholdMs = d.leakThresholdMs || 300000;
      }
    })
    .catch(() => {
      leakData.leakCount = 0;
      leakData.leaks = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

// 刷新当前Tab
const refreshCurrentTab = () => {
  if (activeTab.value === "list") refreshData();
  else if (activeTab.value === "stats") refreshStats();
  else if (activeTab.value === "leaks") refreshLeaks();
};

// Tab切换
const handleTabChange = tab => {
  refreshCurrentTab();
};

// 类型筛选
const handleFilterChange = () => {
  // 筛选由 computed 处理
};

// 类型卡片点击
const handleTypeCardClick = type => {
  typeFilter.value = typeFilter.value === type ? "" : type;
};

// 自动刷新
const handleAutoRefreshChange = val => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (val) {
    refreshTimer = setInterval(refreshCurrentTab, 5000);
  }
};

// 更新泄漏阈值
const updateLeakThreshold = () => {
  const ms = leakThresholdSec.value * 1000;
  http
    .get(
      (window.agentPath || "/agent") +
        "/handle?action=setLeakThreshold&threshold=" +
        ms
    )
    .then(() => {
      stats.leakThresholdMs = ms;
    })
    .catch(() => {});
};

// 更新句柄数量阈值
const updateCountThreshold = () => {
  http
    .get(
      (window.agentPath || "/agent") +
        "/handle?action=setCountThreshold&threshold=" +
        countThreshold.value
    )
    .then(() => {
      stats.handleCountThreshold = countThreshold.value;
    })
    .catch(() => {});
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "HANDLE_INFO") {
    try {
      const wsData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      parseHandleData(wsData);
    } catch (error) {
      console.error("解析句柄数据失败:", error);
    }
  }
};

onBeforeMount(async () => {
  refreshData();
  refreshStats();
  wsService.connect();
  unsubscribe = wsService.subscribe("JVM", "HANDLE_INFO", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  padding: 24px 32px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  padding: 16px 24px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);

  .stat-number {
    margin-bottom: 4px;
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &--peak .stat-number {
    color: var(--el-color-warning);
  }

  &--leak .stat-number {
    color: var(--el-color-danger);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);

  .toolbar-left {
    display: flex;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }
}

// 分类统计视图
.stats-view {
  padding: 0 16px;
}

.type-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.type-stat-card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  border-left: 4px solid var(--el-color-primary);

  &--file { border-left-color: var(--el-color-danger); }
  &--socket { border-left-color: var(--el-color-success); }
  &--pipe { border-left-color: var(--el-color-warning); }
  &--selector { border-left-color: var(--el-color-info); }
  &--file_channel { border-left-color: var(--el-color-primary); }
  &--unknown { border-left-color: var(--el-text-color-disabled); }

  .type-stat-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;

    .type-icon {
      font-size: 20px;
      color: var(--el-color-primary);
    }

    .type-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .type-stat-body {
    .type-stat-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }

    .type-stat-label {
      color: var(--el-text-color-secondary);
    }

    .type-stat-value {
      font-weight: 600;

      &--current { color: var(--el-color-primary); }
      &--peak { color: var(--el-color-warning); }
    }
  }

  .type-stat-bar {
    height: 4px;
    margin-top: 8px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border-radius: 2px;

    .type-stat-bar-fill {
      height: 100%;
      background: var(--el-color-primary);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  }
}

.threshold-config {
  margin-top: 16px;

  .card-header {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .config-item {
    display: flex;
    gap: 12px;
    align-items: center;

    label {
      min-width: 120px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .config-unit {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 泄漏检测视图
.leaks-view {
  padding: 0 16px;
}

.no-leaks {
  padding: 48px;
  text-align: center;

  .no-leaks-icon {
    font-size: 48px;
    color: var(--el-color-success);
  }

  p {
    margin-top: 16px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .no-leaks-hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.severity-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.severity-badge {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  border-radius: 16px;

  &--critical {
    color: #fff;
    background: var(--el-color-danger);
  }

  &--high {
    color: #fff;
    background: var(--el-color-warning);
  }

  &--medium {
    color: var(--el-text-color-primary);
    background: var(--el-color-warning-light-5);
  }

  &--low {
    color: var(--el-text-color-primary);
    background: var(--el-color-info-light-5);
  }

  .severity-count {
    font-weight: 700;
  }
}

.leak-item {
  margin-bottom: 16px;

  .leak-header {
    display: flex;
    gap: 10px;
    align-items: center;

    .leak-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
      border-radius: 50%;
    }

    .leak-type-badge {
      padding: 2px 10px;
      font-size: 12px;
      border-radius: 10px;

      &--file { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
      &--socket { color: var(--el-color-success); background: var(--el-color-success-light-9); }
      &--pipe { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
      &--selector { color: var(--el-color-info); background: var(--el-color-info-light-9); }
      &--file_channel { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
      &--unknown { color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
    }

    .leak-severity {
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;

      &--critical { color: #fff; background: var(--el-color-danger); }
      &--high { color: #fff; background: var(--el-color-warning); }
      &--medium { color: var(--el-text-color-primary); background: var(--el-color-warning-light-5); }
      &--low { color: var(--el-text-color-primary); background: var(--el-color-info-light-5); }
    }

    .leak-duration {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .leak-body {
    .leak-message {
      padding: 8px 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    .stack-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .stack-trace {
      padding: 12px;
      margin: 8px 0;
      overflow-x: auto;
      font-family: "Courier New", monospace;
      font-size: 12px;
      line-height: 1.5;
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }

    .leak-meta {
      padding-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 类型摘要卡片（列表模式）
.type-summary-cards {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  margin-bottom: 8px;
  overflow-x: auto;
}

.type-summary-item {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  }

  &--active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-5);
  }

  .type-summary-icon {
    font-size: 16px;
  }

  .type-summary-name {
    white-space: nowrap;
  }

  .type-summary-count {
    font-weight: 700;
    color: var(--el-color-primary);
  }
}

.info-card {
  margin-bottom: 16px;

  .info-content {
    font-size: 14px;
    line-height: 1.6;
  }
}

.handle-item {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    gap: 12px;
    align-items: center;

    .item-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-radius: 50%;
    }

    .item-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .code-block {
    padding: 16px;
    margin: 0;
    overflow-x: auto;
    font-family: "Courier New", monospace;
    font-size: 13px;
    line-height: 1.6;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>