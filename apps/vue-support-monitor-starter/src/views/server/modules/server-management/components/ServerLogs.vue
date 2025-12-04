<template>
  <div class="server-logs">
    <!-- 工具�?-->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>

        <el-button @click="handleExportLogs">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          导出日志
        </el-button>

        <el-button type="danger" @click="handleCleanupLogs">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清理日志
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-select v-model="filterServerId" placeholder="选择服务�? clearable style="width: 150px" @change="handleFilter">
          <el-option v-for="server in serverList" :key="server.id" :label="server.name" :value="server.id" />
        </el-select>

        <el-select v-model="filterLevel" placeholder="日志级别" clearable style="width: 120px; margin-left: 12px" @change="handleFilter">
          <el-option label="DEBUG" value="DEBUG" />
          <el-option label="INFO" value="INFO" />
          <el-option label="WARN" value="WARN" />
          <el-option label="ERROR" value="ERROR" />
          <el-option label="FATAL" value="FATAL" />
        </el-select>

        <el-date-picker v-model="dateRange" type="datetimerange" range-separator="�? start-placeholder="开始时�? end-placeholder="结束时间" style="width: 350px; margin-left: 12px" @change="handleFilter" />

        <el-input v-model="searchKeyword" placeholder="搜索日志内容..." clearable style="width: 200px; margin-left: 12px" @input="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 日志表格 -->
    <el-table v-loading="loading" :data="logList" stripe :row-class-name="getRowClassName" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />

      <el-table-column label="时间" width="160" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.monitorSysGenServerLogTimestamp) }}
        </template>
      </el-table-column>

      <el-table-column label="服务�? width="120" align="center">
        <template #default="{ row }">
          <span>{{ getServerName(row.monitorSysGenServerId) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="级别" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getLogLevelColor(row.monitorSysGenServerLogLevel)" size="small" effect="light">
            {{ row.monitorSysGenServerLogLevel }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="来源" width="120" align="center">
        <template #default="{ row }">
          <span>{{ row.monitorSysGenServerLogSource || "-" }}</span>
        </template>
      </el-table-column>

      <el-table-column label="日志内容" min-width="400">
        <template #default="{ row }">
          <div class="log-content">
            <span class="log-text">{{ row.monitorSysGenServerLogContent }}</span>
            <el-button v-if="row.monitorSysGenServerLogContent.length > 100" type="text" size="small" @click="handleViewFullLog(row)">查看完整</el-button>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="handleViewFullLog(row)">
              <IconifyIconOnline icon="ri:eye-line" />
              查看
            </el-button>

            <el-dropdown @command="(cmd) => handleAction(cmd, row)">
              <el-button size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制内容</el-dropdown-item>
                  <el-dropdown-item command="context">上下�?/el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>

    <!-- 日志详情对话�?-->
    <el-dialog v-model="logDetailVisible" title="日志详情" width="80%" destroy-on-close>
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatDateTime(selectedLog.monitorSysGenServerLogTimestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="服务�?>
            {{ getServerName(selectedLog.monitorSysGenServerId) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLogLevelColor(selectedLog.monitorSysGenServerLogLevel)">
              {{ selectedLog.monitorSysGenServerLogLevel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ selectedLog.monitorSysGenServerLogSource || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="内容" span="2">
            <div class="log-content-detail">
              <pre>{{ selectedLog.monitorSysGenServerLogContent }}</pre>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="logDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyLogContent">复制内容</el-button>
      </template>
    </el-dialog>

    <!-- 清理日志对话�?-->
    <el-dialog v-model="cleanupDialogVisible" title="清理日志" width="400px" destroy-on-close>
      <div class="cleanup-form">
        <el-form :model="cleanupForm" label-width="100px">
          <el-form-item label="保留天数">
            <el-input-number v-model="cleanupForm.days" :min="1" :max="365" placeholder="保留天数" style="width: 100%" />
          </el-form-item>
          <el-form-item>
            <el-alert title="注意" :description="`将删�?${cleanupForm.days} 天前的所有日志记录，此操作不可恢复！`" type="warning" :closable="false" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="cleanupDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleConfirmCleanup">确定清理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { deleteServerLog, exportServerLogs, getLogLevelColor, type ServerLog } from "@/api/server/log";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";

// 定义事件
const emit = defineEmits<{
  view: [log: ServerLog];
  export: [params: any];
  cleanup: [days: number];
}>();

// 响应式状�?
const loading = ref(false);
const logList = ref<ServerLog[]>([]);
const selectedLogs = ref<ServerLog[]>([]);
const serverList = ref<any[]>([]);

// 搜索和筛�?
const searchKeyword = ref("");
const filterServerId = ref("");
const filterLevel = ref("");
const dateRange = ref<[Date, Date] | null>(null);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 对话�?
const logDetailVisible = ref(false);
const cleanupDialogVisible = ref(false);
const selectedLog = ref<ServerLog | null | any>(null);

// 清理表单
const cleanupForm = reactive({
  days: 30,
});

/**
 * 加载日志列表
 */
const loadLogList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenServerId: filterServerId.value ? parseInt(filterServerId.value) : undefined,
      monitorSysGenServerLogLevel: filterLevel.value || undefined,
      monitorSysGenServerLogContent: searchKeyword.value || undefined,
      startTime: dateRange.value?.[0]?.toISOString(),
      endTime: dateRange.value?.[1]?.toISOString(),
    };

    // const res = await getServerLogPageList(params);
    // if (res.code === "00000") {
    //   logList.value = res.data.records || [];
    //   pagination.total = res.data.total || 0;
    // }
  } catch (error) {
    console.error("加载日志列表失败:", error);
    message.error("加载日志列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 获取服务器名�?
 */
const getServerName = (serverId: number) => {
  const server = serverList.value.find((s) => s.id === serverId);
  return server?.name || `服务�?{serverId}`;
};

/**
 * 获取行类�?
 */
const getRowClassName = ({ row }: { row: ServerLog }) => {
  const level = row.monitorSysGenServerLogLevel;
  if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
    return "error-row";
  }
  if (level === LogLevel.WARN) {
    return "warning-row";
  }
  return "";
};

/**
 * 格式化日期时�?
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadLogList();
};

/**
 * 处理筛�?
 */
const handleFilter = () => {
  pagination.page = 1;
  loadLogList();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadLogList();
};

/**
 * 处理导出日志
 */
const handleExportLogs = async () => {
  try {
    const params = {
      monitorSysGenServerId: filterServerId.value ? parseInt(filterServerId.value) : undefined,
      monitorSysGenServerLogLevel: filterLevel.value || undefined,
      monitorSysGenServerLogContent: searchKeyword.value || undefined,
      startTime: dateRange.value?.[0]?.toISOString(),
      endTime: dateRange.value?.[1]?.toISOString(),
    };

    const res = await exportServerLogs(params);
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `server-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success("日志导出成功");
    emit("export", params);
  } catch (error) {
    console.error("导出日志失败:", error);
    message.error("导出日志失败");
  }
};

/**
 * 处理清理日志
 */
const handleCleanupLogs = () => {
  cleanupDialogVisible.value = true;
};

/**
 * 处理确认清理
 */
const handleConfirmCleanup = async () => {
  try {
    const res = await cleanupExpiredLogs(cleanupForm.days);
    if (res.code === "00000") {
      message.success(`成功清理�?${res.data} 条过期日志`);
      cleanupDialogVisible.value = false;
      loadLogList();
      emit("cleanup", cleanupForm.days);
    } else {
      message.error(`清理失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("清理日志失败:", error);
    message.error("清理日志失败");
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: ServerLog[]) => {
  selectedLogs.value = selection;
};

/**
 * 处理查看完整日志
 */
const handleViewFullLog = (log: ServerLog) => {
  selectedLog.value = log;
  logDetailVisible.value = true;
  emit("view", log);
};

/**
 * 处理复制日志内容
 */
const handleCopyLogContent = async () => {
  if (selectedLog.value) {
    try {
      await navigator.clipboard.writeText(selectedLog.value.monitorSysGenServerLogContent);
      message.success("日志内容已复制到剪贴�?);
    } catch (error) {
      console.error("复制失败:", error);
      message.error("复制失败");
    }
  }
};

/**
 * 处理操作
 */
const handleAction = async (command: string, log: ServerLog) => {
  switch (command) {
    case "copy":
      try {
        await navigator.clipboard.writeText(log.monitorSysGenServerLogContent);
        message.success("日志内容已复制到剪贴�?);
      } catch (error) {
        message.error("复制失败");
      }
      break;
    case "context":
      // 查看上下文逻辑
      break;
    case "delete":
      await handleDeleteLog(log);
      break;
  }
};

/**
 * 处理删除日志
 */
const handleDeleteLog = async (log: ServerLog) => {
  try {
    await ElMessageBox.confirm("确定要删除这条日志记录吗�?, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await deleteServerLog(log.monitorSysGenServerLogId);
    if (res.code === "00000") {
      message.success("删除成功");
      loadLogList();
    } else {
      message.error(`删除失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除日志失败:", error);
      message.error("删除日志失败");
    }
  }
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadLogList();
};

/**
 * 处理当前页变�?
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadLogList();
};

/**
 * 根据服务器ID筛�?
 */
const filterByServer = (serverId: string) => {
  filterServerId.value = serverId;
  handleFilter();
};

/**
 * 刷新列表
 */
const refresh = () => {
  loadLogList();
};

// 暴露方法
defineExpose({
  refresh,
  filterByServer,
});

// 生命周期
onMounted(() => {
  loadLogList();
  // 这里可以加载服务器列�?
  // loadServerList();
});
</script>

<style scoped lang="scss">
.server-logs {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
    }
  }

  .log-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .log-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .log-detail {
    .log-content-detail {
      background: var(--el-bg-color-overlay);
      border-radius: 4px;
      padding: 12px;
      max-height: 300px;
      overflow-y: auto;

      pre {
        margin: 0;
        font-family: "Courier New", monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .cleanup-form {
    padding: 16px 0;
  }

  // 行样�?
  :deep(.error-row) {
    background-color: #fef0f0;
  }

  :deep(.warning-row) {
    background-color: #fdf6ec;
  }
}
</style>
