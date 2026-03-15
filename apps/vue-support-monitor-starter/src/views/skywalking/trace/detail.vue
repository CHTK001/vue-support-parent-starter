<template>
  <div class="trace-detail system-container modern-bg">
    <!-- 头部信息 -->
    <ScCard class="header-card" shadow="never">
      <div class="header-content">
        <div class="trace-info">
          <div class="trace-id">
            <span class="label">Trace ID:</span>
            <span class="value">{{ traceId }}</span>
            <ScButton type="primary" link size="small" @click="copyTraceId">
              <template #icon
                ><ScIcon><CopyDocument /></el-icon
              ></template>
              复制
            </ScButton>
          </div>
          <div class="trace-stats">
            <ScTag type="info" size="small"
              >Span 数量: {{ traceData?.spans?.length || 0 }}</el-tag
            >
            <ScTag :type="hasError ? 'danger' : 'success'" size="small">
              {{ hasError ? "包含错误" : "正常" }}
            </ScTag>
            <ScTag type="info" size="small"
              >总耗时: {{ totalDuration }}</el-tag
            >
          </div>
        </div>
        <div class="header-actions">
          <ScButton @click="router.back()">返回列表</ScButton>
          <ScButton type="primary" @click="fetchData">刷新</ScButton>
        </div>
      </div>
    </ScCard>

    <!-- Span 列表 -->
    <ScCard v-loading="loading" class="span-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>Span 列表</span>
          <ScRadioGroup v-model="viewMode" size="small">
            <el-radio-button value="list">列表</el-radio-button>
            <el-radio-button value="timeline">时间线</el-radio-button>
          </ScRadioGroup>
        </div>
      </template>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="span-list">
        <ScTable
          :data="traceData?.spans || []"
          border
          stripe
          row-key="spanId"
          default-expand-all
        >
          <ScTableColumn label="状态" width="80" align="center">
            <template #default="{ row }">
              <ScTag :type="row.isError ? 'danger' : 'success'" size="small">
                {{ row.isError ? "错误" : "正常" }}
              </ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="endpointName"
            label="端点"
            min-width="250"
            show-overflow-tooltip
          />
          <ScTableColumn
            prop="serviceCode"
            label="服务"
            min-width="150"
            show-overflow-tooltip
          />
          <ScTableColumn prop="component" label="组件" width="120" />
          <ScTableColumn prop="type" label="类型" width="100" />
          <ScTableColumn label="耗时" width="120" align="right">
            <template #default="{ row }">
              {{ formatDuration(row.endTime - row.startTime) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <ScButton
                type="primary"
                link
                size="small"
                @click="showSpanDetail(row)"
                >详情</el-button
              >
            </template>
          </ScTableColumn>
        </ScTable>
      </div>

      <!-- 时间线视图 -->
      <div v-else class="timeline-view">
        <div
          v-for="span in sortedSpans"
          :key="span.segmentId + '-' + span.spanId"
          class="timeline-item"
        >
          <div class="timeline-bar" :style="getBarStyle(span)">
            <span class="bar-label">{{ span.endpointName }}</span>
          </div>
          <div class="timeline-info">
            <span class="service">{{ span.serviceCode }}</span>
            <span class="duration">{{
              formatDuration(span.endTime - span.startTime)
            }}</span>
            <ScTag v-if="span.isError" type="danger" size="small">错误</ScTag>
          </div>
        </div>
      </div>
    </ScCard>

    <!-- Span 详情抽屉 -->
    <sc-drawer v-model="drawerVisible" title="Span 详情" size="600px">
      <template v-if="selectedSpan">
        <ScDescriptions :column="1" border>
          <ScDescriptionsItem label="Span ID">{{
            selectedSpan.spanId
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="Segment ID">{{
            selectedSpan.segmentId
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="端点名称">{{
            selectedSpan.endpointName
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="服务">{{
            selectedSpan.serviceCode
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="服务实例">{{
            selectedSpan.serviceInstanceName
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="类型">{{
            selectedSpan.type
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="组件">{{
            selectedSpan.component
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="层">{{
            selectedSpan.layer
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="对端地址">{{
            selectedSpan.peer || "-"
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="开始时间">{{
            formatTimestamp(selectedSpan.startTime)
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="结束时间">{{
            formatTimestamp(selectedSpan.endTime)
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="耗时">{{
            formatDuration(selectedSpan.endTime - selectedSpan.startTime)
          }}</ScDescriptionsItem>
          <ScDescriptionsItem label="状态">
            <ScTag :type="selectedSpan.isError ? 'danger' : 'success'">
              {{ selectedSpan.isError ? "错误" : "正常" }}
            </ScTag>
          </ScDescriptionsItem>
        </ScDescriptions>

        <!-- Tags -->
        <div class="section-title">标签</div>
        <ScTable
          :data="selectedSpan.tags || []"
          border
          size="small"
          max-height="200"
        >
          <ScTableColumn prop="key" label="Key" width="200" />
          <ScTableColumn prop="value" label="Value" show-overflow-tooltip />
        </ScTable>

        <!-- Logs -->
        <div class="section-title">日志</div>
        <div v-if="selectedSpan.logs?.length" class="log-list">
          <div
            v-for="(log, idx) in selectedSpan.logs"
            :key="idx"
            class="log-item"
          >
            <div class="log-time">{{ formatTimestamp(log.time) }}</div>
            <ScTable :data="log.data || []" border size="small">
              <ScTableColumn prop="key" label="Key" width="150" />
              <ScTableColumn
                prop="value"
                label="Value"
                show-overflow-tooltip
              />
            </ScTable>
          </div>
        </div>
        <ScEmpty v-else description="无日志" :image-size="60" />
      </template>
    </sc-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";
import {
  getSkywalkingTraceDetail,
  formatDuration,
  formatTimestamp,
  type Span,
} from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingTraceDetail" });

const route = useRoute();
const router = useRouter();

const traceId = computed(() => route.params.traceId as string);
const configId = computed(() => Number(route.query.configId));

const loading = ref(false);
const traceData = ref<{ traceId: string; spans: Span[] } | null>(null);
const viewMode = ref<"list" | "timeline">("list");
const drawerVisible = ref(false);
const selectedSpan = ref<Span | null>(null);

// 是否有错误
const hasError = computed(
  () => traceData.value?.spans?.some((s) => s.isError) || false,
);

// 总耗时
const totalDuration = computed(() => {
  const spans = traceData.value?.spans || [];
  if (spans.length === 0) return "0ms";
  const minStart = Math.min(...spans.map((s) => s.startTime));
  const maxEnd = Math.max(...spans.map((s) => s.endTime));
  return formatDuration(maxEnd - minStart);
});

// 排序后的 spans
const sortedSpans = computed(() => {
  const spans = [...(traceData.value?.spans || [])];
  return spans.sort((a, b) => a.startTime - b.startTime);
});

// 时间线起始时间
const timelineStart = computed(() => {
  const spans = traceData.value?.spans || [];
  return spans.length > 0 ? Math.min(...spans.map((s) => s.startTime)) : 0;
});

// 时间线总时长
const timelineTotal = computed(() => {
  const spans = traceData.value?.spans || [];
  if (spans.length === 0) return 1;
  const minStart = Math.min(...spans.map((s) => s.startTime));
  const maxEnd = Math.max(...spans.map((s) => s.endTime));
  return maxEnd - minStart || 1;
});

// 获取时间线条样式
const getBarStyle = (span: Span) => {
  const left =
    ((span.startTime - timelineStart.value) / timelineTotal.value) * 100;
  const width = ((span.endTime - span.startTime) / timelineTotal.value) * 100;
  return {
    marginLeft: `${left}%`,
    width: `${Math.max(width, 1)}%`,
    backgroundColor: span.isError
      ? "var(--el-color-danger)"
      : "var(--el-color-primary)",
  };
};

// 获取数据
const fetchData = async () => {
  if (!configId.value) {
    ElMessage.warning("缺少配置ID");
    return;
  }

  loading.value = true;
  try {
    const res = await getSkywalkingTraceDetail(traceId.value, configId.value);
    if (res.code === "00000") {
      traceData.value = res.data;
    } else {
      ElMessage.error(res.msg || "获取链路详情失败");
    }
  } finally {
    loading.value = false;
  }
};

// 复制 Trace ID
const copyTraceId = () => {
  navigator.clipboard.writeText(traceId.value);
  ElMessage.success("已复制到剪贴板");
};

// 显示 Span 详情
const showSpanDetail = (span: Span) => {
  selectedSpan.value = span;
  drawerVisible.value = true;
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
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

.trace-detail {
  padding: 16px;

  .header-card {
    margin-bottom: 16px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .trace-info {
      .trace-id {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .label {
          color: var(--el-text-color-secondary);
        }

        .value {
          font-family: monospace;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .trace-stats {
        display: flex;
        gap: 8px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .span-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timeline-view {
      .timeline-item {
        margin-bottom: 8px;
        padding: 8px;
        border: 1px solid var(--el-border-color);
        border-radius: 4px;

        .timeline-bar {
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          color: #fff;
          font-size: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .timeline-info {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 12px;
          color: var(--el-text-color-secondary);

          .duration {
            color: var(--el-text-color-primary);
            font-weight: 500;
          }
        }
      }
    }
  }

  .section-title {
    font-weight: 600;
    margin: 16px 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .log-list {
    .log-item {
      margin-bottom: 12px;

      .log-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
