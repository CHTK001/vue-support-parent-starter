<template>
  <div class="skywalking-alarm">
    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="SkyWalking">
          <el-select v-model="filterForm.configId" placeholder="请选择配置" @change="fetchData">
            <el-option
              v-for="item in configList"
              :key="item.skywalkingConfigId"
              :label="item.skywalkingConfigName"
              :value="item.skywalkingConfigId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HHmm"
            @change="handleTimeChange"
          />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filterForm.keyword" placeholder="匹配消息/范围" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

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
  padding: 16px;

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .table-card {
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
