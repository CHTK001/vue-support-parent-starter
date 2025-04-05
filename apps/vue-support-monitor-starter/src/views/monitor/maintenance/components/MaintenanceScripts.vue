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
              <el-button type="success" size="small" class="sync-btn" @click.stop="syncScript(row)">
                <IconifyIconOnline icon="ri:refresh-line" />
                同步
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
    <script-view-dialog ref="scriptViewDialogRef" />
    <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { fetchMaintenanceScripts, createMaintenanceScript, updateMaintenanceScript, deleteMaintenanceScript, syncMaintenanceScript } from "@/api/monitor/maintenance";

// 异步加载对话框组件
const TaskMonitorDialog = defineAsyncComponent(() => import("./dialogs/TaskMonitorDialog.vue"));
const ScriptFormDialog = defineAsyncComponent(() => import("./dialogs/ScriptFormDialog.vue"));
const ScriptViewDialog = defineAsyncComponent(() => import("./dialogs/ScriptViewDialog.vue"));

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

// 同步脚本到远程主机
const syncScript = script => {
  currentScript.value = script;

  // 确认同步
  ElMessageBox.confirm(`确认将脚本 "${script.maintenanceScriptName}" 同步到维护组下所有启用的主机吗？`, "同步确认", {
    confirmButtonText: "确认同步",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      message(`正在同步脚本...`, { type: "info" });

      syncMaintenanceScript(script.maintenanceScriptId)
        .then(res => {
          console.log("同步脚本响应：", res);
          message("同步请求已发送，请查看系统消息获取进度", { type: "success" });
          // 可以打开任务监控对话框查看进度
          if (res.data) {
            currentTaskId.value = res.data;
            taskMonitorDialogRef.value?.open(res.data);
          }
        })
        .catch(error => {
          console.error("同步脚本失败:", error);
          message("同步脚本失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 下拉菜单命令处理
const handleCommand = (command, script) => {
  switch (command) {
    case "edit":
      openEditDialog(script);
      break;
    case "status":
      updateScriptStatus(script);
      break;
    case "delete":
      ElMessageBox.confirm(`确认删除脚本 "${script.maintenanceScriptName}" 吗？删除后将同时从远程主机删除。`, "删除确认", {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteScript(script);
        })
        .catch(() => {
          // 用户取消删除
        });
      break;
    default:
      break;
  }
};

// 在组件挂载时获取脚本列表
onMounted(() => {
  fetchScripts();
});

// 监听groupId变化重新获取数据
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      fetchScripts();
    }
  }
);

// 暴露方法给父组件
defineExpose({
  refreshScripts: fetchScripts
});
</script>

<style lang="scss" scoped>
.scripts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  .scripts-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .scripts-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }

  .script-table {
    margin-bottom: 16px;
  }

  .script-name,
  .script-path {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .script-icon,
  .folder-icon {
    font-size: 18px;
    color: var(--el-text-color-secondary);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .status-tag {
    min-width: 48px;
    text-align: center;
  }

  .empty-data {
    margin-top: 32px;
  }
}
</style>
