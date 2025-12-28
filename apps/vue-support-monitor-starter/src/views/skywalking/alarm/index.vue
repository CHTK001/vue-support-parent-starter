<template>
  <div class="skywalking-alarm">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="28"><Bell /></el-icon>
        </div>
        <div class="header-text">
          <h2>告警中心</h2>
          <p>查看和管理所有 SkyWalking 告警信息</p>
        </div>
      </div>
      <div class="header-actions">
        <el-select v-model="filterForm.configId" placeholder="选择配置" @change="fetchData" style="width: 180px">
          <el-option
            v-for="item in configList"
            :key="item.skywalkingConfigId"
            :label="item.skywalkingConfigName"
            :value="item.skywalkingConfigId"
          />
        </el-select>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          format="MM-DD HH:mm"
          value-format="YYYY-MM-DD HHmm"
          @change="handleTimeChange"
          style="width: 280px"
        />
        <el-input v-model="filterForm.keyword" placeholder="关键字搜索" clearable style="width: 180px" />
        <el-button type="primary" :icon="Search" @click="fetchData">查询</el-button>
        <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <!-- 告警列表 -->
    <el-card class="table-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>告警列表</span>
          <span class="count">共 {{ filteredList.length }} 条</span>
        </div>
      </template>

      <el-table :data="filteredList" stripe border style="width: 100%" max-height="calc(100vh - 340px)">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTs(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" width="120" />
        <el-table-column prop="message" label="信息" min-width="360" show-overflow-tooltip />
        <el-table-column label="标签" min-width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag
                v-for="(t, idx) in row.tags || []"
                :key="idx"
                size="small"
                effect="plain"
              >
                {{ t.key }}: {{ t.value }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, RefreshRight, Bell } from "@element-plus/icons-vue";
import { getEnabledSkywalkingConfigs, type SkywalkingConfig } from "@/api/skywalking/config";
import { getDefaultTimeRange, getSkywalkingAlarms, type AlarmMessage } from "@/api/skywalking/data";

defineOptions({ name: "SkywalkingAlarm" });

// 配置列表
const configList = ref<SkywalkingConfig[]>([]);
const loading = ref(false);

// 时间范围
const timeRange = ref<string[]>([]);

// 筛选表单
const filterForm = reactive({
  configId: undefined as number | undefined,
  startTime: "",
  endTime: "",
  keyword: "",
});

// 告警数据
const alarmList = ref<AlarmMessage[]>([]);

// 过滤
const filteredList = computed(() => {
  if (!filterForm.keyword) return alarmList.value;
  const kw = filterForm.keyword.toLowerCase();
  return alarmList.value.filter(
    (a) => a.message?.toLowerCase().includes(kw) || a.scope?.toLowerCase().includes(kw)
  );
});

// 初始化时间范围
const initTimeRange = () => {
  const range = getDefaultTimeRange(60);
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
      fetchData();
    }
  }
};

// 时间变更
const handleTimeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.startTime = val[0];
    filterForm.endTime = val[1];
  }
};

// 重置
const resetFilter = () => {
  filterForm.keyword = "";
  initTimeRange();
  fetchData();
};

// 拉取告警
const fetchData = async () => {
  if (!filterForm.configId) {
    ElMessage.warning("请先选择 SkyWalking 配置");
    return;
  }
  loading.value = true;
  try {
    const res = await getSkywalkingAlarms({
      configId: filterForm.configId,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime,
    });
    if (res.code === "00000") {
      alarmList.value = res.data?.msgs || [];
    } else {
      ElMessage.error(res.msg || "获取告警失败");
    }
  } finally {
    loading.value = false;
  }
};

const formatTs = (ts: number | string) => {
  if (!ts) return "-";
  const d = new Date(Number(ts));
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
};

onMounted(() => {
  initTimeRange();
  loadConfigList();
});
</script>

<style scoped lang="scss">
.skywalking-alarm {
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

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
