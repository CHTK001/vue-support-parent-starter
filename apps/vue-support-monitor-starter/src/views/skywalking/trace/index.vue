<template>
  <div class="skywalking-trace">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="28"><Connection /></el-icon>
        </div>
        <div class="header-text">
          <h2>链路追踪</h2>
          <p>查询和分析分布式请求链路</p>
        </div>
      </div>
      <div class="header-actions">
        <el-select v-model="filterForm.configId" placeholder="选择配置" @change="handleConfigChange" style="width: 160px">
          <el-option
            v-for="item in configList"
            :key="item.skywalkingConfigId"
            :label="item.skywalkingConfigName"
            :value="item.skywalkingConfigId"
          />
        </el-select>
        <el-select v-model="filterForm.serviceId" placeholder="选择服务" clearable filterable style="width: 160px">
          <el-option v-for="item in serviceList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-input v-model="filterForm.traceId" placeholder="TraceID" clearable style="width: 200px" />
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          format="MM-DD HH:mm"
          value-format="YYYY-MM-DD HHmm"
          @change="handleTimeChange"
          style="width: 260px"
        />
        <el-select v-model="filterForm.traceState" placeholder="状态" style="width: 100px">
          <el-option label="全部" value="ALL" />
          <el-option label="成功" value="SUCCESS" />
          <el-option label="错误" value="ERROR" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tableData" border stripe @row-click="handleRowClick">
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isError ? 'danger' : 'success'" size="small">
              {{ row.isError ? '错误' : '成功' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trace ID" min-width="300">
          <template #default="{ row }">
            <span class="trace-id">{{ row.traceIds?.[0] || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="端点" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.endpointNames?.join(', ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'slow-duration': row.duration > 1000 }">
              {{ formatDuration(row.duration) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="start" label="开始时间" width="180" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Search, RefreshRight, Connection } from "@element-plus/icons-vue";
import { getEnabledSkywalkingConfigs, type SkywalkingConfig } from "@/api/skywalking/config";
import {
  getSkywalkingServices,
  querySkywalkingTraces,
  getDefaultTimeRange,
  formatDuration,
  type SkywalkingService,
  type BasicTrace,
} from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingTrace" });

const router = useRouter();
const route = useRoute();

// 配置列表
const configList = ref<SkywalkingConfig[]>([]);
// 服务列表
const serviceList = ref<SkywalkingService[]>([]);
// 表格数据
const tableData = ref<BasicTrace[]>([]);
const loading = ref(false);

// 时间范围
const timeRange = ref<string[]>([]);

// 筛选表单
const filterForm = reactive({
  configId: undefined as number | undefined,
  serviceId: "",
  traceId: "",
  startTime: "",
  endTime: "",
  traceState: "ALL",
});

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
});

// 初始化时间范围
const initTimeRange = () => {
  const range = getDefaultTimeRange(30); // 默认30分钟
  filterForm.startTime = range.startTime;
  filterForm.endTime = range.endTime;
  timeRange.value = [range.startTime, range.endTime];
};

// 加载配置列表
const loadConfigList = async () => {
  const res = await getEnabledSkywalkingConfigs();
  if (res.code === "00000") {
    configList.value = res.data || [];
    if (configList.value.length > 0) {
      filterForm.configId = configList.value[0].skywalkingConfigId;
      loadServiceList();
    }
  }
};

// 加载服务列表
const loadServiceList = async () => {
  if (!filterForm.configId) return;
  const res = await getSkywalkingServices({
    configId: filterForm.configId,
    startTime: filterForm.startTime,
    endTime: filterForm.endTime,
  });
  if (res.code === "00000") {
    serviceList.value = res.data || [];
  }
};

// 配置变更
const handleConfigChange = () => {
  filterForm.serviceId = "";
  loadServiceList();
};

// 时间变更
const handleTimeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.startTime = val[0];
    filterForm.endTime = val[1];
  }
};

// 获取数据
const fetchData = async () => {
  if (!filterForm.configId) {
    ElMessage.warning("请先选择 SkyWalking 配置");
    return;
  }

  loading.value = true;
  try {
    const res = await querySkywalkingTraces({
      configId: filterForm.configId,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
      serviceId: filterForm.serviceId || undefined,
      traceId: filterForm.traceId || undefined,
      traceState: filterForm.traceState,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    });
    if (res.code === "00000") {
      tableData.value = res.data?.traces || [];
      pagination.total = res.data?.total || 0;
    } else {
      ElMessage.error(res.msg || "查询失败");
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1;
  fetchData();
};

// 重置
const handleReset = () => {
  filterForm.serviceId = "";
  filterForm.traceId = "";
  filterForm.traceState = "ALL";
  initTimeRange();
  handleSearch();
};

// 点击行查看详情
const handleRowClick = (row: BasicTrace) => {
  const traceId = row.traceIds?.[0];
  if (traceId) {
    router.push({
      path: `/skywalking/trace/${traceId}`,
      query: { configId: filterForm.configId },
    });
  }
};

onMounted(async () => {
  initTimeRange();
  await loadConfigList();
  // 处理从服务页跳转的预设参数
  const q = route.query as Record<string, any>;
  if (q?.configId) {
    filterForm.configId = Number(q.configId);
    await loadServiceList();
  }
  if (q?.serviceId) {
    filterForm.serviceId = String(q.serviceId);
  }
  fetchData();
});
</script>

<style scoped lang="scss">
.skywalking-trace {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
        border-radius: 10px;
        color: #fff;
      }

      .header-text {
        h2 {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        p {
          margin: 0;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      :deep(.el-select),
      :deep(.el-input),
      :deep(.el-date-editor) {
        .el-input__wrapper {
          background: var(--el-fill-color-blank);
          border: 1px solid var(--el-border-color-lighter);
          box-shadow: none;
        }
      }

      :deep(.el-button) {
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: none;
      }
    }
  }

  .table-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    :deep(.el-table) {
      border-radius: 8px;
    }

    .trace-id {
      font-family: monospace;
      color: #f5576c;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        text-decoration: underline;
        color: #f093fb;
      }
    }

    .slow-duration {
      color: var(--el-color-warning);
      font-weight: bold;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
