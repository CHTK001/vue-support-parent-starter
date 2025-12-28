<template>
  <sc-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="脚本执行记录"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    class="execute-record-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.scriptName"
            placeholder="搜索脚本名称..."
            clearable
            class="search-input"
            @input="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-select
            v-model="queryParams.executeMethod"
            placeholder="执行方式"
            clearable
            class="filter-select"
            @change="handleFilter"
          >
            <el-option label="SSH" value="SSH" />
            <el-option label="NODE" value="NODE" />
          </el-select>
          <el-select
            v-model="queryParams.executeResult"
            placeholder="执行结果"
            clearable
            class="filter-select"
            @change="handleFilter"
          >
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="运行中" value="RUNNING" />
            <el-option label="超时" value="TIMEOUT" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
            @change="handleDateChange"
          />
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新" placement="top">
            <el-button type="primary" circle @click="loadRecords">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="清空记录" placement="top">
            <el-button type="danger" circle @click="handleClearAll">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 记录表格 -->
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        border
        class="record-table"
        @row-click="handleRowClick"
      >
        <el-table-column label="脚本信息" min-width="180">
          <template #default="{ row }">
            <div class="script-info">
              <div class="script-name">{{ row.monitorSysGenScriptName }}</div>
              <el-tag size="small" :type="getTypeTagType(row.monitorSysGenScriptType)">
                {{ row.monitorSysGenScriptType }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="执行方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.monitorSysGenScriptExecuteMethod === 'SSH' ? 'success' : 'primary'" size="small">
              {{ row.monitorSysGenScriptExecuteMethod }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="目标服务器" min-width="200">
          <template #default="{ row }">
            <div class="server-list">
              <el-tag
                v-for="server in getServerList(row.monitorSysGenScriptExecuteServerNames)"
                :key="server"
                size="small"
                type="info"
                class="server-tag"
              >
                {{ server }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="执行结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getResultTagType(row.monitorSysGenScriptExecuteResult)" size="small">
              {{ getResultText(row.monitorSysGenScriptExecuteResult) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="耗时" width="100" align="center">
          <template #default="{ row }">
            <span class="duration">{{ formatDuration(row.monitorSysGenScriptExecuteDuration) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="执行时间" width="160" align="center">
          <template #default="{ row }">
            <span class="execute-time">{{ formatTime(row.monitorSysGenScriptExecuteTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="执行人" width="100" align="center">
          <template #default="{ row }">
            {{ row.monitorSysGenScriptExecuteUser || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="查看详情" placement="top">
                <el-button text size="small" @click.stop="handleViewDetail(row)">
                  <IconifyIconOnline icon="ri:eye-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button text size="small" type="danger" @click.stop="handleDelete(row)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
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
          @current-change="loadRecords"
          @size-change="loadRecords"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <sc-drawer
      v-model="detailDrawerVisible"
      title="执行详情"
      size="50%"
      :append-to-body="true"
    >
      <div v-if="selectedRecord" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="脚本名称">
              {{ selectedRecord.monitorSysGenScriptName }}
            </el-descriptions-item>
            <el-descriptions-item label="脚本类型">
              <el-tag size="small" :type="getTypeTagType(selectedRecord.monitorSysGenScriptType)">
                {{ selectedRecord.monitorSysGenScriptType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行方式">
              <el-tag :type="selectedRecord.monitorSysGenScriptExecuteMethod === 'SSH' ? 'success' : 'primary'" size="small">
                {{ selectedRecord.monitorSysGenScriptExecuteMethod }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行结果">
              <el-tag :type="getResultTagType(selectedRecord.monitorSysGenScriptExecuteResult)" size="small">
                {{ getResultText(selectedRecord.monitorSysGenScriptExecuteResult) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行时间">
              {{ formatTime(selectedRecord.monitorSysGenScriptExecuteTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="耗时">
              {{ formatDuration(selectedRecord.monitorSysGenScriptExecuteDuration) }}
            </el-descriptions-item>
            <el-descriptions-item label="退出码">
              {{ selectedRecord.monitorSysGenScriptExecuteExitCode ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="执行人">
              {{ selectedRecord.monitorSysGenScriptExecuteUser || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 目标服务器 -->
        <div class="detail-section">
          <h4>目标服务器</h4>
          <div class="server-tags">
            <el-tag
              v-for="server in getServerList(selectedRecord.monitorSysGenScriptExecuteServerNames)"
              :key="server"
              size="default"
              type="info"
            >
              {{ server }}
            </el-tag>
          </div>
        </div>

        <!-- 脚本内容 -->
        <div class="detail-section">
          <h4>脚本内容</h4>
          <div class="code-block">
            <pre><code>{{ selectedRecord.monitorSysGenScriptContent || '无脚本内容' }}</code></pre>
          </div>
        </div>

        <!-- 执行输出 -->
        <div class="detail-section">
          <h4>执行输出</h4>
          <div class="output-block" :class="{ error: selectedRecord.monitorSysGenScriptExecuteResult === 'FAILED' }">
            <pre>{{ selectedRecord.monitorSysGenScriptExecuteOutput || '无输出' }}</pre>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="selectedRecord.monitorSysGenScriptExecuteError" class="detail-section">
          <h4>错误信息</h4>
          <div class="error-block">
            <pre>{{ selectedRecord.monitorSysGenScriptExecuteError }}</pre>
          </div>
        </div>
      </div>
    </sc-drawer>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  getScriptExecuteRecordPage,
  deleteScriptExecuteRecord,
  clearScriptExecuteRecords,
  type ScriptExecuteRecord,
  type ScriptExecuteRecordQueryParams,
} from "@/api/server/script-management";

interface Props {
  visible: boolean;
  scriptId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  scriptId: undefined,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 响应式数据
const loading = ref(false);
const records = ref<ScriptExecuteRecord[]>([]);
const selectedRecord = ref<ScriptExecuteRecord | null>(null);
const detailDrawerVisible = ref(false);
const dateRange = ref<[string, string] | null>(null);

// 查询参数
const queryParams = reactive<Partial<ScriptExecuteRecordQueryParams>>({
  scriptName: "",
  executeMethod: "",
  executeResult: "",
  startTime: "",
  endTime: "",
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 监听对话框打开
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.scriptId) {
        queryParams.scriptName = "";
      }
      loadRecords();
    }
  }
);

// 加载记录
const loadRecords = async () => {
  try {
    loading.value = true;
    const params: ScriptExecuteRecordQueryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      scriptId: props.scriptId,
      scriptName: queryParams.scriptName || undefined,
      executeMethod: queryParams.executeMethod || undefined,
      executeResult: queryParams.executeResult || undefined,
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined,
    };

    const response: any = await getScriptExecuteRecordPage(params);
    if (response.success) {
      records.value = response.data?.records || [];
      pagination.total = response.data?.total || 0;
    }
  } catch (error) {
    console.error("加载执行记录失败:", error);
  } finally {
    loading.value = false;
  }
};

// 搜索
let searchTimer: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.page = 1;
    loadRecords();
  }, 300);
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  loadRecords();
};

// 日期变化
const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    queryParams.startTime = val[0];
    queryParams.endTime = val[1];
  } else {
    queryParams.startTime = "";
    queryParams.endTime = "";
  }
  pagination.page = 1;
  loadRecords();
};

// 行点击
const handleRowClick = (row: ScriptExecuteRecord) => {
  handleViewDetail(row);
};

// 查看详情
const handleViewDetail = (record: ScriptExecuteRecord) => {
  selectedRecord.value = record;
  detailDrawerVisible.value = true;
};

// 删除记录
const handleDelete = async (record: ScriptExecuteRecord) => {
  try {
    await ElMessageBox.confirm("确定要删除该执行记录吗？", "删除确认", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    const response: any = await deleteScriptExecuteRecord(record.monitorSysGenScriptExecuteRecordId);
    if (response.success) {
      message("删除成功", { type: "success" });
      loadRecords();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

// 清空所有记录
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      props.scriptId ? "确定要清空该脚本的所有执行记录吗？" : "确定要清空所有执行记录吗？",
      "清空确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response: any = await clearScriptExecuteRecords(props.scriptId);
    if (response.success) {
      message("清空成功", { type: "success" });
      loadRecords();
    } else {
      message("清空失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("清空失败", { type: "error" });
    }
  }
};

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
};

// 获取服务器列表
const getServerList = (serverNames?: string): string[] => {
  if (!serverNames) return [];
  return serverNames.split(",").filter((s) => s.trim());
};

// 获取类型标签颜色
const getTypeTagType = (type?: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    SHELL: "success",
    PYTHON: "primary",
    POWERSHELL: "info",
    BATCH: "warning",
    JAVASCRIPT: "warning",
    SQL: "danger",
  };
  return typeMap[type?.toUpperCase() || ""] || "info";
};

// 获取结果标签颜色
const getResultTagType = (result?: string): "success" | "danger" | "warning" | "info" => {
  const resultMap: Record<string, "success" | "danger" | "warning" | "info"> = {
    SUCCESS: "success",
    FAILED: "danger",
    RUNNING: "warning",
    TIMEOUT: "info",
  };
  return resultMap[result || ""] || "info";
};

// 获取结果文本
const getResultText = (result?: string): string => {
  const textMap: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    RUNNING: "运行中",
    TIMEOUT: "超时",
  };
  return textMap[result || ""] || "未知";
};

// 格式化耗时
const formatDuration = (duration?: number): string => {
  if (!duration) return "-";
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${(duration / 60000).toFixed(1)}min`;
};

// 格式化时间
const formatTime = (time?: string): string => {
  if (!time) return "-";
  return new Date(time).toLocaleString("zh-CN");
};
</script>

<style scoped lang="scss">
.execute-record-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 80vh;
    overflow-y: auto;
  }
}

.dialog-content {
  padding: 20px 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .search-input {
      width: 200px;
    }

    .filter-select {
      width: 120px;
    }

    .date-picker {
      width: 240px;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.record-table {
  border-radius: 8px;
  overflow: hidden;

  .script-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .script-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .server-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .server-tag {
      margin: 0;
    }
  }

  .duration {
    font-family: "JetBrains Mono", monospace;
    color: var(--el-color-primary);
  }

  .execute-time {
    font-family: "JetBrains Mono", monospace;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

// 详情内容
.detail-content {
  padding: 0 20px 20px;

  .detail-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      padding-left: 8px;
      border-left: 3px solid var(--el-color-primary);
    }
  }

  .server-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .code-block {
    background: var(--el-fill-color-darker);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;

    pre {
      margin: 0;
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .output-block {
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;

    &.error {
      background: var(--el-color-danger-light-9);
      border-color: var(--el-color-danger-light-5);
    }

    pre {
      margin: 0;
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .error-block {
    background: var(--el-color-danger-light-9);
    border: 1px solid var(--el-color-danger-light-5);
    border-radius: 8px;
    padding: 16px;

    pre {
      margin: 0;
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-color-danger);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}
</style>
