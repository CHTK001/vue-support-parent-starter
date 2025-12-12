<template>
  <div class="script-management-page">
    <!-- 使用 ScTable 卡片模式 -->
    <ScTable
      ref="tableRef"
      :url="fetchScripts"
      :params="queryParams"
      layout="card"
      :col-size="3"
      table-name="script-management"
      :page-size="12"
      :page-sizes="[12, 24, 48, 96]"
      row-key="monitorSysGenScriptId"
      @loaded="handleDataLoaded"
    >
      <!-- 工具栏 -->
      <template #toolbar>
        <div class="toolbar-wrapper">
          <div class="toolbar-left">
            <div class="page-header">
              <div class="header-icon">
                <IconifyIconOnline icon="ri:code-s-slash-line" />
              </div>
              <div class="header-text">
                <h2>脚本管理</h2>
                <p>管理和执行服务器脚本</p>
              </div>
            </div>
            <div class="stats-wrapper">
              <div class="stat-badge">
                <IconifyIconOnline icon="ri:file-list-3-line" />
                <span>总计 {{ totalCount }}</span>
              </div>
              <div class="stat-badge success">
                <IconifyIconOnline icon="ri:checkbox-circle-line" />
                <span>启用 {{ enabledCount }}</span>
              </div>
            </div>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="queryParams.scriptName"
              placeholder="搜索脚本..."
              clearable
              class="search-input"
              @input="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-select
              v-model="queryParams.scriptType"
              placeholder="类型"
              clearable
              class="filter-select"
              @change="handleFilter"
            >
              <el-option label="Shell" value="shell" />
              <el-option label="Python" value="python" />
              <el-option label="PowerShell" value="powershell" />
              <el-option label="Batch" value="batch" />
              <el-option label="JavaScript" value="javascript" />
              <el-option label="SQL" value="sql" />
            </el-select>
            <el-select
              v-model="queryParams.scriptStatus"
              placeholder="状态"
              clearable
              class="filter-select"
              @change="handleFilter"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
            <el-button type="primary" @click="handleCreate">
              <IconifyIconOnline icon="ri:add-line" />
              新建脚本
            </el-button>
          </div>
        </div>
      </template>

      <!-- 卡片内容 -->
      <template #default="{ row }">
        <div class="script-card" @click="handleEdit(row)">
          <!-- 状态指示条 -->
          <div
            class="status-bar"
            :class="{ active: row.monitorSysGenScriptStatus === 'ENABLED' }"
          />

          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="script-icon" :class="getIconClass(row.monitorSysGenScriptType)">
              <IconifyIconOnline :icon="getScriptTypeIcon(row.monitorSysGenScriptType)" />
            </div>
            <div class="script-meta">
              <h3 class="script-name">{{ row.monitorSysGenScriptName }}</h3>
              <p class="script-desc">{{ row.monitorSysGenScriptDescription || '暂无描述' }}</p>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">
                <IconifyIconOnline icon="ri:code-box-line" />
                类型
              </span>
              <el-tag size="small" :type="getTypeTagType(row.monitorSysGenScriptType)">
                {{ row.monitorSysGenScriptType }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">
                <IconifyIconOnline icon="ri:time-line" />
                更新时间
              </span>
              <span class="info-value">{{ formatTime(row.updateTime) }}</span>
            </div>
            <div class="info-row" v-if="row.monitorSysGenScriptCategory">
              <span class="info-label">
                <IconifyIconOnline icon="ri:folder-line" />
                分类
              </span>
              <span class="info-value">{{ row.monitorSysGenScriptCategory }}</span>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer" @click.stop>
            <el-switch
              v-model="row.monitorSysGenScriptStatus"
              active-value="ENABLED"
              inactive-value="DISABLED"
              @change="handleStatusChange(row)"
            />
            <div class="action-buttons">
              <el-tooltip content="运行" placement="top">
                <el-button text circle type="success" @click="handleRun(row)">
                  <IconifyIconOnline icon="ri:play-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button text circle @click="handleEdit(row)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="复制" placement="top">
                <el-button text circle @click="handleCopy(row)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button text circle type="danger" @click="handleDelete(row)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <template #empty>
        <div class="empty-state">
          <IconifyIconOnline icon="ri:file-code-line" class="empty-icon" />
          <p class="empty-title">暂无脚本</p>
          <p class="empty-desc">点击"新建脚本"创建第一个脚本</p>
          <el-button type="primary" @click="handleCreate">
            <IconifyIconOnline icon="ri:add-line" />
            新建脚本
          </el-button>
        </div>
      </template>
    </ScTable>

    <!-- 脚本编辑对话框 -->
    <ScriptEditDialog
      v-model:visible="editDialogVisible"
      :script-data="currentScript"
      @save="handleSaveSuccess"
    />

    <!-- 服务器选择对话框 -->
    <ServerSelectDialog
      v-model:visible="serverSelectVisible"
      :script-data="currentScript"
      @executed="handleExecuteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import ScriptEditDialog from "./components/ScriptEditDialog.vue";
import ServerSelectDialog from "./components/ServerSelectDialog.vue";
import * as ScriptAPI from "@/api/server/script-management";
import type { Script } from "./types";
import { ScriptStatus } from "./types";
import { getScriptTypeIcon } from "./utils";

// 响应式数据
const tableRef = ref();
const currentScript = ref<Script | null>(null);
const editDialogVisible = ref(false);
const serverSelectVisible = ref(false);
const totalCount = ref(0);
const enabledCount = ref(0);

// 查询参数
const queryParams = reactive({
  scriptName: "",
  scriptType: "",
  scriptStatus: undefined as number | undefined,
});

// 数据获取函数（供 ScTable 使用）
const fetchScripts = async (params: any) => {
  try {
    const response: any = await ScriptAPI.getScriptPage({
      page: params.page,
      pageSize: params.pageSize,
      scriptName: queryParams.scriptName || undefined,
      scriptType: queryParams.scriptType || undefined,
      scriptStatus: queryParams.scriptStatus,
    });

    if (response.success) {
      const records = (response.data.records || []).map((item: any) => ({
        ...item,
        monitorSysGenScriptStatus:
          item.monitorSysGenScriptStatus?.code === 1 ||
          item.monitorSysGenScriptStatus === "ENABLED" ||
          item.monitorSysGenScriptStatus === 1
            ? "ENABLED"
            : "DISABLED",
      }));
      return {
        data: records,
        total: response.data.total || 0,
      };
    }
    return { data: [], total: 0 };
  } catch (error) {
    console.error("加载脚本列表失败:", error);
    return { data: [], total: 0 };
  }
};

// 数据加载完成回调
const handleDataLoaded = (data: any) => {
  totalCount.value = data.total || 0;
  enabledCount.value = (data.data || []).filter(
    (s: Script) => s.monitorSysGenScriptStatus === "ENABLED"
  ).length;
};

// 搜索
let searchTimer: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    tableRef.value?.refresh();
  }, 300);
};

// 筛选
const handleFilter = () => {
  tableRef.value?.refresh();
};

// 创建脚本
const handleCreate = () => {
  currentScript.value = null;
  editDialogVisible.value = true;
};

// 编辑脚本
const handleEdit = (script: Script) => {
  currentScript.value = script;
  editDialogVisible.value = true;
};

// 状态切换
const handleStatusChange = async (script: Script) => {
  try {
    const statusValue = script.monitorSysGenScriptStatus === ScriptStatus.ENABLED ? 1 : 0;
    const response: any = await ScriptAPI.updateScriptStatus(
      script.monitorSysGenScriptId!,
      statusValue
    );
    if (response.success) {
      message("状态更新成功", { type: "success" });
    } else {
      message("状态更新失败", { type: "error" });
      script.monitorSysGenScriptStatus =
        script.monitorSysGenScriptStatus === ScriptStatus.ENABLED
          ? ScriptStatus.DISABLED
          : ScriptStatus.ENABLED;
    }
  } catch (error) {
    message("状态更新失败", { type: "error" });
    script.monitorSysGenScriptStatus =
      script.monitorSysGenScriptStatus === ScriptStatus.ENABLED
        ? ScriptStatus.DISABLED
        : ScriptStatus.ENABLED;
  }
};

// 复制脚本
const handleCopy = async (script: Script) => {
  try {
    const response: any = await ScriptAPI.copyScript(
      script.monitorSysGenScriptId!,
      `${script.monitorSysGenScriptName}_副本`
    );
    if (response.success) {
      message("脚本复制成功", { type: "success" });
      tableRef.value?.refresh();
    } else {
      message("脚本复制失败", { type: "error" });
    }
  } catch (error) {
    message("脚本复制失败", { type: "error" });
  }
};

// 删除脚本
const handleDelete = async (script: Script) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除脚本 "${script.monitorSysGenScriptName}" 吗？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response: any = await ScriptAPI.deleteScript(
      script.monitorSysGenScriptId!
    );
    if (response.success) {
      message("脚本删除成功", { type: "success" });
      tableRef.value?.refresh();
    } else {
      message("脚本删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("脚本删除失败", { type: "error" });
    }
  }
};

// 保存成功回调
const handleSaveSuccess = () => {
  editDialogVisible.value = false;
  tableRef.value?.refresh();
  message("脚本保存成功", { type: "success" });
};

// 运行脚本
const handleRun = (script: Script) => {
  currentScript.value = script;
  serverSelectVisible.value = true;
};

// 执行成功回调
const handleExecuteSuccess = () => {
  message("脚本执行任务已提交", { type: "success" });
};

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return "未知";
  const date = new Date(time);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

// 获取图标样式类
const getIconClass = (type: string) => {
  const typeMap: Record<string, string> = {
    SHELL: "shell",
    PYTHON: "python",
    POWERSHELL: "powershell",
    BATCH: "batch",
    JAVASCRIPT: "javascript",
    SQL: "sql",
  };
  return typeMap[type?.toUpperCase()] || "default";
};

// 获取类型标签颜色
const getTypeTagType = (type: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    SHELL: "success",
    PYTHON: "primary",
    POWERSHELL: "info",
    BATCH: "warning",
    JAVASCRIPT: "warning",
    SQL: "danger",
  };
  return typeMap[type?.toUpperCase()] || "info";
};
</script>

<style scoped lang="scss">
.script-management-page {
  min-height: 100%;
  padding: 20px;
  background: var(--el-bg-color-page);
}

// 工具栏
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 24px;

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        color: white;
        font-size: 22px;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }

      .header-text {
        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .stats-wrapper {
      display: flex;
      gap: 12px;

      .stat-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--el-fill-color-light);
        border-radius: 20px;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        .iconify {
          font-size: 14px;
        }

        &.success {
          background: var(--el-color-success-light-9);
          color: var(--el-color-success);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .search-input {
      width: 200px;
    }

    .filter-select {
      width: 120px;
    }
  }
}

// 脚本卡片
.script-card {
  position: relative;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);
  }

  .status-bar {
    height: 4px;
    background: var(--el-fill-color-light);
    transition: background 0.3s;

    &.active {
      background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3));
    }
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 16px 12px;

    .script-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      color: white;
      font-size: 20px;
      flex-shrink: 0;

      &.shell {
        background: linear-gradient(135deg, #10b981, #34d399);
      }

      &.python {
        background: linear-gradient(135deg, #3b82f6, #60a5fa);
      }

      &.powershell {
        background: linear-gradient(135deg, #6366f1, #818cf8);
      }

      &.batch {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
      }

      &.javascript {
        background: linear-gradient(135deg, #eab308, #facc15);
      }

      &.sql {
        background: linear-gradient(135deg, #ef4444, #f87171);
      }

      &.default {
        background: linear-gradient(135deg, #6b7280, #9ca3af);
      }
    }

    .script-meta {
      flex: 1;
      min-width: 0;

      .script-name {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .script-desc {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.5;
      }
    }
  }

  .card-body {
    padding: 0 16px 12px;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dashed var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .iconify {
          font-size: 14px;
        }
      }

      .info-value {
        font-size: 12px;
        color: var(--el-text-color-primary);
        font-family: "JetBrains Mono", monospace;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color-lighter);

    .action-buttons {
      display: flex;
      gap: 4px;

      .el-button {
        width: 32px;
        height: 32px;
        font-size: 16px;

        &:hover {
          background: var(--el-fill-color);
        }
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    font-size: 64px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 16px;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .empty-desc {
    margin: 0 0 20px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

// 响应式
@media (max-width: 768px) {
  .toolbar-wrapper {
    flex-direction: column;
    align-items: stretch;

    .toolbar-left {
      flex-direction: column;
      align-items: flex-start;
    }

    .toolbar-right {
      flex-wrap: wrap;

      .search-input {
        flex: 1;
        min-width: 150px;
      }

      .filter-select {
        flex: 1;
        min-width: 100px;
      }
    }
  }
}
</style>
