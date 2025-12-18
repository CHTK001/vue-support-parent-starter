<template>
  <div class="job-log-container">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-select
              v-model="searchForm.jobId"
              placeholder="选择任务"
              class="job-filter"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option
                v-for="job in jobList"
                :key="job.jobId"
                :label="job.jobName"
                :value="job.jobId"
              />
            </el-select>
            <el-select
              v-model="searchForm.logStatus"
              placeholder="执行状态"
              class="status-filter"
              clearable
              @change="handleSearch"
            >
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleDateChange"
            />
          </div>
          <div class="search-right">
            <el-button @click="handleRefresh">
              <i class="ri-refresh-line"></i>
              刷新
            </el-button>
            <el-button type="danger" @click="handleClearLog">
              <i class="ri-delete-bin-line"></i>
              清理日志
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 日志列表 -->
    <div class="logs-section">
      <el-card shadow="never">
        <el-table
          v-loading="loading"
          :data="logList"
          row-key="logId"
          stripe
          border
        >
          <el-table-column prop="logId" label="日志ID" width="100" align="center" />
          <el-table-column prop="jobId" label="任务ID" width="80" align="center" />
          <el-table-column label="任务信息" min-width="200">
            <template #default="{ row }">
              <div class="job-info-cell">
                <span class="handler">{{ row.executorHandler }}</span>
                <el-tag v-if="row.executorParam" size="small" type="info">
                  {{ row.executorParam }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="executorAddress" label="执行器地址" width="150" />
          <el-table-column prop="triggerTime" label="调度时间" width="170" />
          <el-table-column label="调度结果" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.triggerCode === 200 ? 'success' : 'danger'" size="small">
                {{ row.triggerCode === 200 ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handleTime" label="执行时间" width="170" />
          <el-table-column label="执行结果" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.handleCode === 200 ? 'success' : 'danger'" size="small">
                {{ row.handleCode === 200 ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleViewDetail(row)">
                <i class="ri-eye-line"></i>
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </el-card>
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="800px">
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ currentLog.logId }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ currentLog.jobId }}</el-descriptions-item>
          <el-descriptions-item label="执行器">{{ currentLog.executorHandler }}</el-descriptions-item>
          <el-descriptions-item label="执行器地址">{{ currentLog.executorAddress }}</el-descriptions-item>
          <el-descriptions-item label="执行参数" :span="2">
            <pre class="param-content">{{ currentLog.executorParam || '-' }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="调度时间">{{ currentLog.triggerTime }}</el-descriptions-item>
          <el-descriptions-item label="调度结果">
            <el-tag :type="currentLog.triggerCode === 200 ? 'success' : 'danger'">
              {{ currentLog.triggerCode === 200 ? '成功' : '失败' }} ({{ currentLog.triggerCode }})
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="调度日志" :span="2">
            <pre class="log-content">{{ currentLog.triggerMsg || '-' }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="执行时间">{{ currentLog.handleTime }}</el-descriptions-item>
          <el-descriptions-item label="执行结果">
            <el-tag :type="currentLog.handleCode === 200 ? 'success' : 'danger'">
              {{ currentLog.handleCode === 200 ? '成功' : '失败' }} ({{ currentLog.handleCode }})
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行日志" :span="2">
            <pre class="log-content">{{ currentLog.handleMsg || '-' }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 实时日志 -->
        <div class="realtime-log-section" v-if="realtimeLog">
          <div class="section-title">
            <span>实时日志</span>
            <el-button size="small" @click="loadRealtimeLog">
              <i class="ri-refresh-line"></i>
              刷新
            </el-button>
          </div>
          <pre class="realtime-log-content">{{ realtimeLog }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="loadRealtimeLog">
          <i class="ri-refresh-line"></i>
          加载实时日志
        </el-button>
      </template>
    </el-dialog>

    <!-- 清理日志对话框 -->
    <el-dialog v-model="clearDialogVisible" title="清理日志" width="500px">
      <el-form label-width="120px">
        <el-form-item label="清理方式">
          <el-radio-group v-model="clearType">
            <el-radio value="days">按天数</el-radio>
            <el-radio value="count">按条数</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="clearType === 'days'" label="保留天数">
          <el-input-number v-model="clearDays" :min="1" :max="365" />
          <span class="form-tip">将删除 {{ clearDays }} 天前的日志</span>
        </el-form-item>
        <el-form-item v-if="clearType === 'count'" label="保留条数">
          <el-input-number v-model="clearCount" :min="100" :max="100000" :step="100" />
          <span class="form-tip">将保留最近 {{ clearCount }} 条日志</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clearDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="clearLoading" @click="confirmClear">
          确认清理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchJobLogPage,
  fetchJobLogCat,
  fetchJobLogClear,
  fetchJobPageList,
  type JobInfo,
  type JobLogInfo,
  type JobLogPageParams,
} from "./api";

// Props
const props = defineProps<{
  /** 初始任务ID */
  jobId?: number;
}>();

// 状态
const loading = ref(false);
const clearLoading = ref(false);
const detailDialogVisible = ref(false);
const clearDialogVisible = ref(false);

// 搜索表单
const searchForm = reactive<JobLogPageParams>({
  jobId: props.jobId,
  logStatus: undefined,
  triggerTimeStart: undefined,
  triggerTimeEnd: undefined,
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 任务列表（用于下拉选择）
const jobList = ref<JobInfo[]>([]);

// 日志列表
const logList = ref<JobLogInfo[]>([]);

// 当前查看的日志
const currentLog = ref<JobLogInfo | null>(null);

// 实时日志
const realtimeLog = ref("");

// 清理配置
const clearType = ref<"days" | "count">("days");
const clearDays = ref(7);
const clearCount = ref(1000);

// 加载任务列表（用于下拉选择）
const loadJobList = async () => {
  try {
    const response = await fetchJobPageList({ pageSize: 1000 });
    if (response.success) {
      jobList.value = response.data?.records || response.data || [];
    }
  } catch (error) {
    console.error("加载任务列表失败:", error);
  }
};

// 加载日志列表
const loadLogList = async () => {
  loading.value = true;
  try {
    const response = await fetchJobLogPage({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    if (response.success) {
      logList.value = response.data?.records || response.data || [];
      pagination.total = response.data?.total || logList.value.length;
    } else {
      ElMessage.error(response.msg || "加载日志列表失败");
    }
  } catch (error) {
    console.error("加载日志列表失败:", error);
    ElMessage.error("加载日志列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadLogList();
};

// 刷新
const handleRefresh = () => {
  loadLogList();
};

// 日期范围变化
const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    searchForm.triggerTimeStart = val[0];
    searchForm.triggerTimeEnd = val[1];
  } else {
    searchForm.triggerTimeStart = undefined;
    searchForm.triggerTimeEnd = undefined;
  }
  handleSearch();
};

// 查看详情
const handleViewDetail = (row: JobLogInfo) => {
  currentLog.value = row;
  realtimeLog.value = "";
  detailDialogVisible.value = true;
};

// 加载实时日志
const loadRealtimeLog = async () => {
  if (!currentLog.value) return;
  try {
    const response = await fetchJobLogCat({ logId: currentLog.value.logId! });
    if (response.success) {
      realtimeLog.value = response.data?.logContent || response.data || "暂无日志内容";
    } else {
      ElMessage.error(response.msg || "加载实时日志失败");
    }
  } catch (error) {
    console.error("加载实时日志失败:", error);
    ElMessage.error("加载实时日志失败");
  }
};

// 清理日志
const handleClearLog = () => {
  clearDialogVisible.value = true;
};

// 确认清理
const confirmClear = async () => {
  try {
    await ElMessageBox.confirm("确定要清理日志吗？此操作不可恢复！", "警告", {
      type: "warning",
    });

    clearLoading.value = true;
    const params: any = {
      jobId: searchForm.jobId,
    };
    if (clearType.value === "days") {
      params.clearBeforeNum = clearDays.value;
    } else {
      params.clearBeforeNum = -clearCount.value; // 负数表示保留条数
    }

    const response = await fetchJobLogClear(params);
    if (response.success) {
      ElMessage.success("清理成功");
      clearDialogVisible.value = false;
      loadLogList();
    } else {
      ElMessage.error(response.msg || "清理失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("清理失败:", error);
      ElMessage.error("清理失败");
    }
  } finally {
    clearLoading.value = false;
  }
};

// 监听 jobId 变化
watch(
  () => props.jobId,
  (newVal) => {
    searchForm.jobId = newVal;
    handleSearch();
  }
);

// 生命周期
onMounted(() => {
  loadJobList();
  loadLogList();
});

// 暴露方法
defineExpose({
  loadLogList,
  handleRefresh,
});
</script>

<style lang="scss" scoped>
.job-log-container {
  padding: 20px;

  .search-section {
    margin-bottom: 20px;

    .search-card {
      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .search-left {
          display: flex;
          gap: 12px;

          .job-filter {
            width: 200px;
          }

          .status-filter {
            width: 120px;
          }
        }

        .search-right {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .logs-section {
    .job-info-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .handler {
        font-weight: 500;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}

.log-detail {
  .param-content,
  .log-content {
    max-height: 150px;
    overflow: auto;
    background: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .realtime-log-section {
    margin-top: 20px;

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .realtime-log-content {
      max-height: 300px;
      overflow: auto;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 4px;
      margin: 0;
      font-size: 12px;
      font-family: "Consolas", "Monaco", monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
