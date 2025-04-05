<template>
  <div class="scripts-container">
    <div class="scripts-header">
      <el-button type="primary" class="add-button" @click="openCreateDialog">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加脚本
      </el-button>
      <el-input v-model="searchKeyword" placeholder="搜索脚本名称/描述" prefix-icon="Search" clearable style="width: 220px" class="search-box" />
    </div>

    <!-- 脚本列表 -->
    <div class="scripts-content">
      <el-table
        v-loading="loading"
        :data="filteredScripts"
        border
        stripe
        style="width: 100%"
        class="script-table"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)',
          fontWeight: '600',
          fontSize: '14px'
        }"
        :cell-style="{
          fontSize: '14px'
        }"
        @row-click="openScriptContent"
      >
        <el-table-column prop="maintenanceScriptName" label="脚本名称" min-width="150">
          <template #default="{ row }">
            <div class="script-name">
              <IconifyIconOnline icon="ri:file-code-line" class="script-icon" />
              <span>{{ row.maintenanceScriptName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceScriptDesc" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.maintenanceScriptDesc || "暂无描述" }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceScriptPath" label="路径" min-width="200">
          <template #default="{ row }">
            <div class="script-path">
              <IconifyIconOnline icon="ri:folder-line" class="folder-icon" />
              <span>{{ row.maintenanceScriptPath || "/" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceScriptStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceScriptStatus ? 'success' : 'danger'" size="small" class="status-tag" :effect="row.maintenanceScriptStatus ? 'light' : 'plain'">
              {{ row.maintenanceScriptStatus ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons z-[20]">
              <el-button type="primary" size="small" class="view-btn" @click.stop="openScriptContent(row)">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
              <el-button type="success" size="small" class="execute-btn" @click.stop="executeScript(row)">
                <IconifyIconOnline icon="ri:play-line" />
                执行
              </el-button>
              <el-dropdown @command="command => handleCommand(command, row)" @click.stop>
                <el-button size="small" class="more-btn">
                  <IconifyIconOnline icon="ri:more-line" />
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <IconifyIconOnline icon="ri:edit-line" />
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="status">
                      <IconifyIconOnline :icon="row.maintenanceScriptStatus ? 'ri:forbid-line' : 'ri:check-line'" />
                      {{ row.maintenanceScriptStatus ? "禁用" : "启用" }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredScripts.length === 0" description="暂无脚本" :image-size="180" class="empty-data" />
    </div>

    <!-- 使用对话框组件 -->
    <script-form-dialog ref="scriptFormDialogRef" @submit="handleScriptSubmit" />
    <script-view-dialog ref="scriptViewDialogRef" @execute="executeScript" />
    <script-execute-dialog ref="scriptExecuteDialogRef" @execute="handleScriptExecute" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceScripts, createMaintenanceScript, updateMaintenanceScript, deleteMaintenanceScript, executeMaintenanceScript } from "@/api/monitor/maintenance";

// 异步加载对话框组件
const TaskMonitorDialog = defineAsyncComponent(() => import("./dialogs/TaskMonitorDialog.vue"));
const ScriptFormDialog = defineAsyncComponent(() => import("./dialogs/ScriptFormDialog.vue"));
const ScriptViewDialog = defineAsyncComponent(() => import("./dialogs/ScriptViewDialog.vue"));
const ScriptExecuteDialog = defineAsyncComponent(() => import("./dialogs/ScriptExecuteDialog.vue"));

// 定义props
const props = defineProps({
  groupId: {
    type: [Number, String],
    required: true
  }
});

// 脚本列表数据
const scriptList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");

// 对话框引用
const scriptFormDialogRef = ref(null);
const scriptViewDialogRef = ref(null);
const scriptExecuteDialogRef = ref(null);
const taskMonitorDialogRef = ref(null);

// 任务相关
const currentTaskId = ref(null);
const currentScript = ref({});

// 根据关键字过滤脚本列表
const filteredScripts = computed(() => {
  if (!searchKeyword.value) return scriptList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return scriptList.value.filter(
    script =>
      (script.maintenanceScriptName && script.maintenanceScriptName.toLowerCase().includes(keyword)) || (script.maintenanceScriptDesc && script.maintenanceScriptDesc.toLowerCase().includes(keyword))
  );
});

// 获取维护脚本列表
const fetchScripts = () => {
  loading.value = true;
  fetchMaintenanceScripts(props.groupId)
    .then(res => {
      scriptList.value = res.data || [];
      loading.value = false;
    })
    .catch(error => {
      console.error("获取维护脚本列表失败:", error);
      message("获取维护脚本列表失败", { type: "error" });
      loading.value = false;
    });
};

// 打开创建对话框
const openCreateDialog = () => {
  scriptFormDialogRef.value?.openAdd(props.groupId);
};

// 打开编辑对话框
const openEditDialog = script => {
  scriptFormDialogRef.value?.openEdit(script);
};

// 处理脚本表单提交
const handleScriptSubmit = (formData, isCreate) => {
  if (isCreate) {
    createMaintenanceScript(formData)
      .then(() => {
        message("添加脚本成功", { type: "success" });
        fetchScripts();
        scriptFormDialogRef.value.close();
        scriptFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("添加脚本失败:", error);
        message("添加脚本失败", { type: "error" });
        scriptFormDialogRef.value.submitting = false;
      });
  } else {
    updateMaintenanceScript(formData)
      .then(() => {
        message("更新脚本成功", { type: "success" });
        fetchScripts();
        scriptFormDialogRef.value.close();
        scriptFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("更新脚本失败:", error);
        message("更新脚本失败", { type: "error" });
        scriptFormDialogRef.value.submitting = false;
      });
  }
};

// 删除脚本
const deleteScript = script => {
  deleteMaintenanceScript(script.maintenanceScriptId)
    .then(() => {
      message("删除脚本成功", { type: "success" });
      fetchScripts();
    })
    .catch(error => {
      console.error("删除脚本失败:", error);
      message("删除脚本失败", { type: "error" });
    });
};

// 更新脚本状态
const updateScriptStatus = script => {
  const newStatus = script.maintenanceScriptStatus === 1 ? 0 : 1;
  const data = { ...script, maintenanceScriptStatus: newStatus };

  updateMaintenanceScript(data)
    .then(() => {
      message(`${newStatus === 1 ? "启用" : "禁用"}脚本成功`, { type: "success" });
      fetchScripts();
    })
    .catch(error => {
      console.error("更新脚本状态失败:", error);
      message("更新脚本状态失败", { type: "error" });
    });
};

// 打开脚本内容查看对话框
const openScriptContent = script => {
  currentScript.value = script;
  scriptViewDialogRef.value?.open(script);
};

// 打开脚本执行对话框
const executeScript = script => {
  currentScript.value = script;
  scriptExecuteDialogRef.value?.open(script);
};

// 确认执行脚本
const handleScriptExecute = scriptId => {
  const params = {
    maintenanceGroupId: props.groupId
  };

  executeMaintenanceScript(scriptId, params)
    .then(res => {
      message("脚本执行任务已提交", { type: "success" });

      // 如果返回任务ID，打开任务监控
      if (res.data && res.data.taskId) {
        currentTaskId.value = res.data.taskId;
        taskMonitorDialogRef.value?.open(res.data.taskId);
      }

      scriptExecuteDialogRef.value.executing = false;
    })
    .catch(error => {
      console.error("脚本执行失败:", error);
      message("脚本执行失败", { type: "error" });
      scriptExecuteDialogRef.value.executing = false;
    });
};

// 处理下拉菜单命令
const handleCommand = (command, script) => {
  switch (command) {
    case "edit":
      openEditDialog(script);
      break;
    case "status":
      updateScriptStatus(script);
      break;
    case "delete":
      ElMessageBox.confirm("确定要删除该脚本吗？删除后无法恢复。", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteScript(script);
        })
        .catch(() => {});
      break;
  }
};

// 监听groupId变化
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      fetchScripts();
    }
  }
);

// 组件挂载时获取数据
onMounted(() => {
  if (props.groupId) {
    fetchScripts();
  }
});

// 导出公开方法
defineExpose({
  fetchScripts
});
</script>

<style lang="scss" scoped>
.scripts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;

  .scripts-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .add-button {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    .search-box {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:focus-within {
          box-shadow:
            0 0 0 1px var(--el-color-primary) inset,
            0 4px 10px rgba(var(--el-color-primary-rgb), 0.1);
        }
      }
    }
  }

  .scripts-content {
    flex: 1;
    overflow-y: auto;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    background-color: #fff;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .script-table {
      border-radius: 12px;
      overflow: hidden;

      :deep(.el-table__row) {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--el-fill-color);
        }

        td {
          transition: all 0.2s ease;
        }
      }

      :deep(.el-table__header-wrapper) {
        th {
          padding: 12px 0;
          background: var(--el-fill-color);
        }
      }

      :deep(.el-table__body-wrapper) {
        overflow-y: auto;
      }

      :deep(.el-table__empty-block) {
        min-height: 200px;
      }
    }

    .empty-data {
      margin-top: 60px;

      :deep(.el-empty__image) {
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
      }

      :deep(.el-empty__description) {
        margin-top: 20px;
        color: var(--el-text-color-secondary);
        font-size: 15px;
      }
    }
  }

  .script-name {
    display: flex;
    align-items: center;

    .script-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
      font-size: 18px;
    }
  }

  .script-path {
    display: flex;
    align-items: center;

    .folder-icon {
      margin-right: 6px;
      color: var(--el-color-warning);
      font-size: 16px;
    }
  }

  .status-tag {
    border-radius: 12px;
    padding: 0 10px;
    font-weight: 500;
    font-size: 12px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-start;

    .view-btn,
    .execute-btn,
    .more-btn {
      transition: all 0.3s ease;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .view-btn:hover {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .execute-btn:hover {
      box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.2);
    }
  }

  .code-editor-container {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;

    .code-editor {
      font-family: "Fira Code", "Cascadia Code", Monaco, Menlo, Consolas, monospace;
      font-size: 14px;

      :deep(textarea) {
        padding: 16px;
        line-height: 1.5;
        background-color: var(--el-fill-color-light);
      }
    }
  }

  .script-info {
    margin-top: 16px;
    padding: 16px 20px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    border-left: 4px solid var(--el-color-primary);

    .info-item {
      margin-bottom: 10px;
      display: flex;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-weight: 500;
        color: var(--el-text-color-secondary);
        min-width: 60px;
      }

      .info-value {
        flex: 1;
        word-break: break-all;
      }
    }
  }

  .code-view {
    max-height: 500px;
    overflow: auto;
    border-radius: 8px;
    margin-bottom: 16px;

    .code-block {
      margin: 0;
      padding: 20px;
      background-color: #282c34;
      color: #abb2bf;
      border-radius: 8px;
      font-family: "Fira Code", Monaco, Menlo, Consolas, monospace;
      font-size: 14px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }
  }

  .execute-warning {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background-color: var(--el-color-warning-light-9);
    border-radius: 8px;
    margin-bottom: 16px;
    border-left: 4px solid var(--el-color-warning);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .warning-icon {
      font-size: 24px;
      color: var(--el-color-warning);
      margin-right: 12px;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .scripts-container {
    .scripts-header {
      flex-direction: column;
      gap: 12px;

      .search-box {
        width: 100% !important;
      }
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .el-button {
        padding: 6px 8px;
      }
    }
  }
}
</style>
