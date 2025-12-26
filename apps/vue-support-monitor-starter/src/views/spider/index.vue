<template>
  <div class="spider-task-list">
    <!-- 统计概览 -->
    <div class="statistics-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <IconifyIconOnline icon="ri:spider-line" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalCount }}</div>
                <div class="stat-label">总任务数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon running">
                <IconifyIconOnline icon="ri:play-circle-line" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.runningCount }}</div>
                <div class="stat-label">运行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon success">
                <IconifyIconOnline icon="ri:checkbox-circle-line" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.todayDataCount }}</div>
                <div class="stat-label">今日数据</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon fail">
                <IconifyIconOnline icon="ri:close-circle-line" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalDataCount }}</div>
                <div class="stat-label">总数据量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCreate">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          创建任务
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="filterStatus" placeholder="任务状态" clearable style="width: 120px" @change="handleFilter">
          <el-option label="停用" :value="0" />
          <el-option label="启用" :value="1" />
          <el-option label="运行中" :value="2" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称..."
          clearable
          style="width: 200px; margin-left: 12px"
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="taskList" stripe>
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="任务名称" min-width="200">
        <template #default="{ row }">
          <div class="task-name">
            <IconifyIconOnline icon="ri:spider-line" class="task-icon" />
            <span>{{ row.spiderTaskName }}</span>
          </div>
          <div class="task-url">{{ row.spiderTaskUrl }}</div>
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.spiderTaskStatus)" size="small">
            {{ getStatusText(row.spiderTaskStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="调度类型" width="100" align="center">
        <template #default="{ row }">
          <span>{{ row.spiderTaskScheduleType === 'CRON' ? '定时' : '一次性' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="爬取统计" width="150" align="center">
        <template #default="{ row }">
          <div class="stat-mini">
            <span class="success">{{ row.spiderTaskTotalSuccess || 0 }}</span>
            <span class="separator">/</span>
            <span class="fail">{{ row.spiderTaskTotalFail || 0 }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="运行状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getRunStatusType(row.spiderTaskRunStatus)" size="small">
            {{ row.spiderTaskRunStatus || 'IDLE' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="最后执行" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.spiderTaskLastRunTime">{{ formatDateTime(row.spiderTaskLastRunTime) }}</span>
          <span v-else class="text-muted">从未执行</span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button 
              v-if="row.spiderTaskRunStatus !== 'RUNNING'" 
              size="small" 
              type="primary" 
              @click="handleRun(row)" 
              :disabled="row.spiderTaskStatus === 0"
            >
              <IconifyIconOnline icon="ri:play-line" />
              运行
            </el-button>
            <el-button 
              v-else 
              size="small" 
              type="warning" 
              @click="handleStop(row)"
            >
              <IconifyIconOnline icon="ri:stop-line" />
              停止
            </el-button>
            <el-button size="small" @click="handleEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" />
            </el-button>
            <el-button size="small" @click="handleViewData(row)">
              <IconifyIconOnline icon="ri:database-2-line" />
            </el-button>
            <el-button size="small" @click="handleViewLogs(row)">
              <IconifyIconOnline icon="ri:file-list-line" />
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建/编辑对话框 -->
    <SpiderTaskDialog
      v-model:visible="dialogVisible"
      :task-id="currentTaskId"
      @success="handleDialogSuccess"
    />

    <!-- 数据查看对话框 -->
    <SpiderDataDialog
      v-model:visible="dataDialogVisible"
      :task-id="currentTaskId"
    />

    <!-- 日志查看对话框 -->
    <SpiderLogDialog
      v-model:visible="logDialogVisible"
      :task-id="currentTaskId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getSpiderTaskPageList,
  getSpiderTaskStatistics,
  runSpiderTask,
  stopSpiderTask,
  deleteSpiderTask,
  TASK_STATUS_MAP
} from "@/api/spider";
import SpiderTaskDialog from "./components/SpiderTaskDialog.vue";
import SpiderDataDialog from "./components/SpiderDataDialog.vue";
import SpiderLogDialog from "./components/SpiderLogDialog.vue";

// 响应式状态
const loading = ref(false);
const taskList = ref<any[]>([]);
const searchKeyword = ref("");
const filterStatus = ref<number | undefined>(undefined);
const dialogVisible = ref(false);
const dataDialogVisible = ref(false);
const logDialogVisible = ref(false);
const currentTaskId = ref<number | undefined>(undefined);
let refreshTimer: number | null = null;

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 统计
const statistics = reactive({
  totalCount: 0,
  runningCount: 0,
  enabledCount: 0,
  todayDataCount: 0,
  totalDataCount: 0
});

/**
 * 加载任务列表
 */
const loadTaskList = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    if (searchKeyword.value) {
      params.spiderTaskName = searchKeyword.value;
    }
    if (filterStatus.value !== undefined) {
      params.spiderTaskStatus = filterStatus.value;
    }
    
    const res = await getSpiderTaskPageList(params);
    if (res.code === "00000") {
      taskList.value = res.data?.records || [];
      pagination.total = res.data?.total || 0;
    }
  } catch (error) {
    console.error("加载任务列表失败:", error);
    message.error("加载任务列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 加载统计信息
 */
const loadStatistics = async () => {
  try {
    const res = await getSpiderTaskStatistics();
    if (res.code === "00000") {
      Object.assign(statistics, res.data);
    }
  } catch (error) {
    console.error("加载统计信息失败:", error);
  }
};

/**
 * 获取状态类型
 */
const getStatusType = (status: number) => {
  return TASK_STATUS_MAP[status]?.color || "info";
};

/**
 * 获取状态文本
 */
const getStatusText = (status: number) => {
  return TASK_STATUS_MAP[status]?.text || "未知";
};

/**
 * 获取运行状态类型
 */
const getRunStatusType = (status: string) => {
  const map: Record<string, string> = {
    IDLE: "info",
    RUNNING: "primary",
    STOPPED: "warning",
    ERROR: "danger"
  };
  return map[status] || "info";
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 创建任务
 */
const handleCreate = () => {
  currentTaskId.value = undefined;
  dialogVisible.value = true;
};

/**
 * 编辑任务
 */
const handleEdit = (row: any) => {
  currentTaskId.value = row.spiderTaskId;
  dialogVisible.value = true;
};

/**
 * 运行任务
 */
const handleRun = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要运行任务 "${row.spiderTaskName}" 吗？`,
      "运行确认",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
    
    const res = await runSpiderTask(row.spiderTaskId);
    if (res.code === "00000") {
      message.success("任务已开始运行");
      loadTaskList();
      loadStatistics();
    } else {
      message.error(`运行失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("运行任务失败:", error);
      message.error("运行任务失败");
    }
  }
};

/**
 * 删除任务
 */
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${row.spiderTaskName}" 吗？`,
      "删除确认",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
    
    const res = await deleteSpiderTask(row.spiderTaskId);
    if (res.code === "00000") {
      message.success("删除成功");
      loadTaskList();
      loadStatistics();
    } else {
      message.error(`删除失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除任务失败:", error);
      message.error("删除任务失败");
    }
  }
};

/**
 * 查看数据
 */
const handleViewData = (row: any) => {
  currentTaskId.value = row.spiderTaskId;
  dataDialogVisible.value = true;
};

/**
 * 查看日志
 */
const handleViewLogs = (row: any) => {
  currentTaskId.value = row.spiderTaskId;
  logDialogVisible.value = true;
};

/**
 * 停止任务
 */
const handleStop = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要停止任务 "${row.spiderTaskName}" 吗？`,
      "停止确认",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
    
    const res = await stopSpiderTask(row.spiderTaskId);
    if (res.code === "00000") {
      message.success("任务已停止");
      loadTaskList();
      loadStatistics();
    } else {
      message.error(`停止失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("停止任务失败:", error);
      message.error("停止任务失败");
    }
  }
};

/**
 * 启动自动刷新（当有运行中的任务时）
 */
const startAutoRefresh = () => {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    const hasRunning = taskList.value.some((t: any) => t.spiderTaskRunStatus === "RUNNING");
    if (hasRunning) {
      loadTaskList();
      loadStatistics();
    }
  }, 5000);
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * 刷新
 */
const handleRefresh = () => {
  loadTaskList();
  loadStatistics();
};

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadTaskList();
};

/**
 * 筛选
 */
const handleFilter = () => {
  pagination.page = 1;
  loadTaskList();
};

/**
 * 分页大小变化
 */
const handleSizeChange = () => {
  pagination.page = 1;
  loadTaskList();
};

/**
 * 当前页变化
 */
const handleCurrentChange = () => {
  loadTaskList();
};

/**
 * 对话框成功
 */
const handleDialogSuccess = () => {
  loadTaskList();
  loadStatistics();
};

// 监听任务列表变化，自动管理刷新
watch(() => taskList.value, (list) => {
  const hasRunning = list.some((t: any) => t.spiderTaskRunStatus === "RUNNING");
  if (hasRunning) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}, { deep: true });

// 生命周期
onMounted(() => {
  loadTaskList();
  loadStatistics();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped lang="scss">
.spider-task-list {
  padding: 20px;
  
  .statistics-overview {
    margin-bottom: 20px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          color: #fff;
          
          &.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          &.running { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          &.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
          &.fail { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        }
        
        .stat-info {
          .stat-value { font-size: 28px; font-weight: 600; color: var(--el-text-color-primary); }
          .stat-label { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 4px; }
        }
      }
    }
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .task-name {
    display: flex;
    align-items: center;
    font-weight: 500;
    
    .task-icon { margin-right: 8px; color: #409eff; }
  }
  
  .task-url {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .stat-mini {
    .success { color: #67c23a; }
    .fail { color: #f56c6c; }
    .total { color: #409eff; }
    .separator { margin: 0 4px; color: #c0c4cc; }
  }
  
  .text-muted { color: #c0c4cc; }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
