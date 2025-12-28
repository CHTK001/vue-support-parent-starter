<template>
  <div class="trace-history">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <div class="search-form">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索链路ID、方法名、地址等"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>

        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="x"
          class="date-picker"
        />

        <el-button type="primary" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" />
          搜索
        </el-button>

        <el-tooltip content="刷新" placement="top">
          <el-button type="primary" :icon="Refresh" @click="handleRefresh" />
        </el-tooltip>
      </div>
    </el-card>

    <!-- 链路列表 -->
    <el-card class="trace-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <IconifyIconOnline icon="ri:route-line" />
            链路追踪列表
          </span>
          <span class="count">共 {{ traceList.length }} 条</span>
        </div>
      </template>

      <div v-loading="loading" class="trace-list">
        <div
          v-for="trace in traceList"
          :key="trace.linkId + trace.spanId"
          class="trace-item"
          @click="handleViewDetail(trace)"
        >
          <div class="trace-header">
            <div class="trace-info">
              <el-tag
                :type="getStatusType(trace)"
                size="small"
                effect="dark"
              >
                {{ trace.category || "UNKNOWN" }}
              </el-tag>
              <span class="method-name">{{ trace.method || "-" }}</span>
              <span class="link-id">{{ trace.linkId }}</span>
            </div>
            <div class="trace-time">
              <span class="cost-time" :class="getCostTimeClass(trace.costTime)">
                {{ formatCostTime(trace.costTime) }}
              </span>
              <span class="enter-time">{{ formatTime(trace.enterTime) }}</span>
            </div>
          </div>

          <div class="trace-body">
            <div class="trace-detail">
              <span class="label">类名:</span>
              <span class="value">{{ trace.typeName || "-" }}</span>
            </div>
            <div class="trace-detail">
              <span class="label">地址:</span>
              <span class="value">{{ trace.address || "-" }}</span>
            </div>
            <div v-if="trace.error" class="trace-error">
              <IconifyIconOnline icon="ri:error-warning-line" />
              {{ trace.error }}
            </div>
          </div>

          <div class="trace-footer">
            <span class="app-name">
              <IconifyIconOnline icon="ri:apps-line" />
              {{ trace.applicationName || "-" }}
            </span>
            <span class="source-info">
              <IconifyIconOnline icon="ri:server-line" />
              {{ trace.sourceIp }}:{{ trace.sourcePort }}
            </span>
          </div>
        </div>

        <el-empty v-if="!loading && traceList.length === 0" description="暂无链路数据" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 链路详情抽屉 -->
    <sc-drawer
      v-model="detailVisible"
      title="链路详情"
      direction="rtl"
      size="60%"
    >
      <div v-if="selectedTrace" class="trace-detail-drawer">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="链路ID">
              {{ selectedTrace.linkId }}
            </el-descriptions-item>
            <el-descriptions-item label="Span ID">
              {{ selectedTrace.spanId }}
            </el-descriptions-item>
            <el-descriptions-item label="父 Span ID">
              {{ selectedTrace.parentSpanId || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="线程名">
              {{ selectedTrace.threadName }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ selectedTrace.category }}
            </el-descriptions-item>
            <el-descriptions-item label="协议">
              {{ selectedTrace.protocol }}
            </el-descriptions-item>
            <el-descriptions-item label="状态码">
              <el-tag :type="selectedTrace.statusCode === '200' ? 'success' : 'danger'" size="small">
                {{ selectedTrace.statusCode || "-" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="耗时">
              <span :class="getCostTimeClass(selectedTrace.costTime)">
                {{ formatCostTime(selectedTrace.costTime) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 调用信息 -->
        <div class="detail-section">
          <h4>调用信息</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="类名">
              {{ selectedTrace.typeName }}
            </el-descriptions-item>
            <el-descriptions-item label="方法名">
              {{ selectedTrace.method }}
            </el-descriptions-item>
            <el-descriptions-item label="地址">
              {{ selectedTrace.address }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedTrace.database" label="数据库">
              {{ selectedTrace.database }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedTrace.description" label="描述">
              {{ selectedTrace.description }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 错误信息 -->
        <div v-if="selectedTrace.error" class="detail-section error-section">
          <h4>
            <IconifyIconOnline icon="ri:error-warning-line" />
            错误信息
          </h4>
          <el-alert type="error" :closable="false" show-icon>
            {{ selectedTrace.error }}
          </el-alert>
        </div>

        <!-- 请求头 -->
        <div v-if="selectedTrace.headers?.length" class="detail-section">
          <h4>请求头</h4>
          <div class="header-list">
            <el-tag
              v-for="(header, index) in selectedTrace.headers"
              :key="index"
              size="small"
              class="header-tag"
            >
              {{ header }}
            </el-tag>
          </div>
        </div>

        <!-- 参数 -->
        <div v-if="selectedTrace.params?.length" class="detail-section">
          <h4>请求参数</h4>
          <div class="param-list">
            <el-tag
              v-for="(param, index) in selectedTrace.params"
              :key="index"
              size="small"
              type="info"
              class="param-tag"
            >
              {{ param }}
            </el-tag>
          </div>
        </div>

        <!-- 子 Span -->
        <div v-if="selectedTrace.children?.length" class="detail-section">
          <h4>子调用链 ({{ selectedTrace.children.length }})</h4>
          <el-timeline>
            <el-timeline-item
              v-for="child in selectedTrace.children"
              :key="child.spanId"
              :type="child.error ? 'danger' : 'primary'"
              :timestamp="formatCostTime(child.costTime)"
              placement="top"
            >
              <div class="child-span">
                <el-tag size="small" effect="plain">{{ child.category }}</el-tag>
                <span class="child-method">{{ child.method }}</span>
                <span class="child-address">{{ child.address }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </sc-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { message } from "@repo/utils";
import {
  searchTracesForAgent,
  type AgentTraceDTO,
} from "@/api/server/agent-data";

// 搜索参数
const searchKeyword = ref("");
const dateRange = ref<[number, number] | null>(null);

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 数据
const traceList = ref<AgentTraceDTO[]>([]);
const loading = ref(false);

// 详情
const detailVisible = ref(false);
const selectedTrace = ref<AgentTraceDTO | null>(null);

/**
 * 加载链路数据
 */
const loadTraceData = async () => {
  loading.value = true;
  try {
    const startTime = dateRange.value?.[0];
    const endTime = dateRange.value?.[1];

    const response = await searchTracesForAgent(
      searchKeyword.value || undefined,
      startTime,
      endTime,
      currentPage.value,
      pageSize.value
    );

    if (response.success && response.data) {
      traceList.value = response.data;
      total.value = response.data.length;
    } else {
      traceList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("加载链路数据失败:", error);
    message("加载链路数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  currentPage.value = 1;
  loadTraceData();
};

/**
 * 刷新
 */
const handleRefresh = () => {
  loadTraceData();
};

/**
 * 分页大小变化
 */
const handleSizeChange = () => {
  currentPage.value = 1;
  loadTraceData();
};

/**
 * 页码变化
 */
const handlePageChange = () => {
  loadTraceData();
};

/**
 * 查看详情
 */
const handleViewDetail = (trace: AgentTraceDTO) => {
  selectedTrace.value = trace;
  detailVisible.value = true;
};

/**
 * 获取状态类型
 */
const getStatusType = (trace: AgentTraceDTO) => {
  if (trace.error) return "danger" as const;
  if (trace.statusCode === "200" || !trace.statusCode) return "success" as const;
  return "warning" as const;
};

/**
 * 获取耗时样式类
 */
const getCostTimeClass = (costTime: number): string => {
  if (costTime >= 3000) return "cost-slow";
  if (costTime >= 1000) return "cost-warning";
  return "cost-normal";
};

/**
 * 格式化耗时
 */
const formatCostTime = (ms: number): string => {
  if (!ms) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadTraceData();
});
</script>

<style lang="scss" scoped>
.trace-history {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;

  .search-card {
    margin-bottom: 20px;

    .search-form {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      .search-input {
        width: 300px;
      }

      .date-picker {
        width: 380px;
      }
    }
  }

  .trace-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .count {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }

    .trace-list {
      min-height: 400px;

      .trace-item {
        padding: 16px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .trace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .trace-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .method-name {
              font-weight: 600;
              color: var(--el-text-color-primary);
            }

            .link-id {
              color: var(--el-text-color-secondary);
              font-size: 12px;
              font-family: monospace;
            }
          }

          .trace-time {
            display: flex;
            align-items: center;
            gap: 16px;

            .cost-time {
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 14px;

              &.cost-normal {
                color: var(--el-color-success);
                background: var(--el-color-success-light-9);
              }

              &.cost-warning {
                color: var(--el-color-warning);
                background: var(--el-color-warning-light-9);
              }

              &.cost-slow {
                color: var(--el-color-danger);
                background: var(--el-color-danger-light-9);
              }
            }

            .enter-time {
              color: var(--el-text-color-secondary);
              font-size: 13px;
            }
          }
        }

        .trace-body {
          .trace-detail {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 13px;

            .label {
              color: var(--el-text-color-secondary);
              min-width: 50px;
            }

            .value {
              color: var(--el-text-color-primary);
              word-break: break-all;
            }
          }

          .trace-error {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--el-color-danger);
            font-size: 13px;
            background: var(--el-color-danger-light-9);
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 8px;
          }
        }

        .trace-footer {
          display: flex;
          gap: 24px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--el-border-color-lighter);
          font-size: 13px;
          color: var(--el-text-color-secondary);

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
    }
  }

  .trace-detail-drawer {
    .detail-section {
      margin-bottom: 24px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      &.error-section h4 {
        color: var(--el-color-danger);
      }

      .header-list,
      .param-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .header-tag,
        .param-tag {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .child-span {
        display: flex;
        align-items: center;
        gap: 12px;

        .child-method {
          font-weight: 500;
        }

        .child-address {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }
      }
    }
  }
}
</style>
