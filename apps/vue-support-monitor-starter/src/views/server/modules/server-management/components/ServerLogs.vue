<template>
  <div class="server-logs system-container modern-bg">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ScButton @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </ScButton>

        <ScButton @click="handleExportLogs">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          导出日志
        </ScButton>

        <ScButton type="danger" @click="handleCleanupLogs">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清理日志
        </ScButton>
      </div>

      <div class="toolbar-right">
        <ScSelect
          v-model="filterServerId"
          placeholder="选择服务器"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <ScOption
            v-for="server in serverList"
            :key="server.id"
            :label="server.name"
            :value="server.id"
          />
        </ScSelect>

        <ScSelect
          v-model="filterLevel"
          placeholder="日志级别"
          clearable
          style="width: 120px; margin-left: 12px"
          @change="handleFilter"
        >
          <ScOption label="DEBUG" value="DEBUG" />
          <ScOption label="INFO" value="INFO" />
          <ScOption label="WARN" value="WARN" />
          <ScOption label="ERROR" value="ERROR" />
          <ScOption label="FATAL" value="FATAL" />
        </ScSelect>

        <ScDatePicker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 350px; margin-left: 12px"
          @change="handleFilter"
        />

        <ScInput
          v-model="searchKeyword"
          placeholder="搜索日志内容..."
          clearable
          style="width: 200px; margin-left: 12px"
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </ScInput>
      </div>
    </div>

    <!-- 日志表格 -->
    <ScTable
      v-loading="loading"
      :data="logList"
      stripe
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
    >
      <ScTableColumn type="selection" width="55" />

      <ScTableColumn label="时间" width="160" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.monitorSysGenServerLogTimestamp) }}
        </template>
      </ScTableColumn>

      <ScTableColumn label="服务器" width="120" align="center">
        <template #default="{ row }">
          <span>{{ getServerName(row.monitorSysGenServerId) }}</span>
        </template>
      </ScTableColumn>

      <ScTableColumn label="级别" width="80" align="center">
        <template #default="{ row }">
          <ScTag
            :type="getLogLevelColor(row.monitorSysGenServerLogLevel)"
            size="small"
            effect="light"
          >
            {{ row.monitorSysGenServerLogLevel }}
          </ScTag>
        </template>
      </ScTableColumn>

      <ScTableColumn label="来源" width="120" align="center">
        <template #default="{ row }">
          <span>{{ row.monitorSysGenServerLogSource || "-" }}</span>
        </template>
      </ScTableColumn>

      <ScTableColumn label="日志内容" min-width="400">
        <template #default="{ row }">
          <div class="log-content">
            <span class="log-text">{{
              row.monitorSysGenServerLogContent
            }}</span>
            <ScButton
              v-if="row.monitorSysGenServerLogContent.length > 100"
              type="text"
              size="small"
              @click="handleViewFullLog(row)"
              >查看完整</ScButton
            >
          </div>
        </template>
      </ScTableColumn>

      <ScTableColumn label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <ScButton size="small" @click="handleViewFullLog(row)">
              <IconifyIconOnline icon="ri:eye-line" />
              查看
            </ScButton>

            <ScDropdown @command="(cmd) => handleAction(cmd, row)">
              <ScButton size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </ScButton>
              <template #dropdown>
                <ScDropdownMenu>
                  <ScDropdownItem command="copy">复制内容</ScDropdownItem>
                  <ScDropdownItem command="context">上下文</ScDropdownItem>
                  <ScDropdownItem command="delete" divided
                    >删除</ScDropdownItem
                  >
                </ScDropdownMenu>
              </template>
            </ScDropdown>
          </ScButton-group>
        </template>
      </ScTableColumn>
    </ScTable>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <ScPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 日志详情对话框 -->
    <sc-dialog
      v-model="logDetailVisible"
      title="日志详情"
      width="80%"
      destroy-on-close
    >
      <div v-if="selectedLog" class="log-detail">
        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="时间">
            {{ formatDateTime(selectedLog.monitorSysGenServerLogTimestamp) }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="服务器">
            {{ getServerName(selectedLog.monitorSysGenServerId) }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="级别">
            <ScTag
              :type="getLogLevelColor(selectedLog.monitorSysGenServerLogLevel)"
            >
              {{ selectedLog.monitorSysGenServerLogLevel }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="来源">
            {{ selectedLog.monitorSysGenServerLogSource || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="内容" span="2">
            <div class="log-content-detail">
              <pre>{{ selectedLog.monitorSysGenServerLogContent }}</pre>
            </div>
          </ScDescriptionsItem>
        </ScDescriptions>
      </div>

      <template #footer>
        <ScButton @click="logDetailVisible = false">关闭</ScButton>
        <ScButton type="primary" @click="handleCopyLogContent"
          >复制内容</ScButton
        >
      </template>
    </sc-dialog>

    <!-- 清理日志对话框 -->
    <sc-dialog
      v-model="cleanupDialogVisible"
      title="清理日志"
      width="400px"
      destroy-on-close
    >
      <div class="cleanup-form">
        <ScForm :model="cleanupForm" label-width="100px">
          <ScFormItem label="保留天数">
            <ScInputNumber
              v-model="cleanupForm.days"
              :min="1"
              :max="365"
              placeholder="保留天数"
              style="width: 100%"
            />
          </ScFormItem>
          <ScFormItem>
            <ScAlert
              title="注意"
              :description="`将删除 ${cleanupForm.days} 天前的所有日志记录，此操作不可恢复！`"
              type="warning"
              :closable="false"
            />
          </ScFormItem>
        </ScForm>
      </div>

      <template #footer>
        <ScButton @click="cleanupDialogVisible = false">取消</ScButton>
        <ScButton type="danger" @click="handleConfirmCleanup"
          >确定清理</ScButton
        >
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  deleteServerLog,
  exportServerLogs,
  getLogLevelColor,
  type ServerLog,
} from "@/api/server/log";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";

// 定义事件
const emit = defineEmits<{
  view: [log: ServerLog];
  export: [params: any];
  cleanup: [days: number];
}>();

// 响应式状态
const loading = ref(false);
const logList = ref<ServerLog[]>([]);
const selectedLogs = ref<ServerLog[]>([]);
const serverList = ref<any[]>([]);

// 搜索和筛选
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

// 对话框
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
      monitorSysGenServerId: filterServerId.value
        ? parseInt(filterServerId.value)
        : undefined,
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
 * 获取服务器名称
 */
const getServerName = (serverId: number) => {
  const server = serverList.value.find((s) => s.id === serverId);
  return server?.name || `服务器${serverId}`;
};

/**
 * 获取行类名
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
 * 格式化日期时间
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
 * 处理筛选
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
      monitorSysGenServerId: filterServerId.value
        ? parseInt(filterServerId.value)
        : undefined,
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
      message.success(`成功清理了 ${res.data} 条过期日志`);
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
      await navigator.clipboard.writeText(
        selectedLog.value.monitorSysGenServerLogContent,
      );
      message.success("日志内容已复制到剪贴板");
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
        message.success("日志内容已复制到剪贴板");
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
    await ElMessageBox.confirm("确定要删除这条日志记录吗？", "删除确认", {
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
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadLogList();
};

/**
 * 根据服务器ID筛选
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
  // 这里可以加载服务器列表
  // loadServerList();
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

  // 行样式
  :deep(.error-row) {
    background-color: #fef0f0;
  }

  :deep(.warning-row) {
    background-color: #fdf6ec;
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
