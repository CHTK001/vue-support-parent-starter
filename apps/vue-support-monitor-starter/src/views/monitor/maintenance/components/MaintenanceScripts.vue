<template>
  <div class="scripts-container">
    <div class="scripts-header">
      <el-button type="primary" @click="openCreateDialog">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加脚本
      </el-button>
      <el-input v-model="searchKeyword" placeholder="搜索脚本名称/描述" prefix-icon="Search" clearable style="width: 220px" />
    </div>

    <!-- 脚本列表 -->
    <div class="scripts-content">
      <el-table v-loading="loading" :data="filteredScripts" border stripe style="width: 100%">
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
            {{ row.maintenanceScriptPath || "/" }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceScriptStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.maintenanceScriptStatus ? 'success' : 'danger'" size="small">
              {{ row.maintenanceScriptStatus ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openScriptContent(row)">
              <IconifyIconOnline icon="ri:eye-line" />
              查看
            </el-button>
            <el-button type="success" size="small" @click="executeScript(row)">
              <IconifyIconOnline icon="ri:play-line" />
              执行
            </el-button>
            <el-dropdown trigger="click" @command="command => handleCommand(command, row)">
              <el-button size="small">
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
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredScripts.length === 0" description="暂无脚本" :image-size="200" />
    </div>

    <!-- 创建/编辑脚本对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '添加脚本' : '编辑脚本'" width="80%" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="脚本名称" prop="maintenanceScriptName">
          <el-input v-model="form.maintenanceScriptName" placeholder="请输入脚本名称" />
        </el-form-item>
        <el-form-item label="脚本路径" prop="maintenanceScriptPath">
          <el-input v-model="form.maintenanceScriptPath" placeholder="请输入脚本路径，如：/usr/local/scripts" />
        </el-form-item>
        <el-form-item label="脚本描述" prop="maintenanceScriptDesc">
          <el-input v-model="form.maintenanceScriptDesc" type="textarea" rows="2" placeholder="请输入脚本描述" />
        </el-form-item>
        <el-form-item label="脚本内容" prop="maintenanceScriptContent">
          <div class="code-editor-container">
            <el-input v-model="form.maintenanceScriptContent" type="textarea" rows="15" placeholder="请输入脚本内容" class="code-editor" spellcheck="false" wrap="off" />
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="maintenanceScriptStatus">
          <el-switch v-model="form.maintenanceScriptStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 脚本内容查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="脚本内容" width="80%" :close-on-click-modal="false">
      <div class="code-view">
        <pre class="code-block"><code>{{ currentScript.maintenanceScriptContent }}</code></pre>
      </div>
      <div class="script-info">
        <div class="info-item">
          <span class="info-label">名称：</span>
          <span class="info-value">{{ currentScript.maintenanceScriptName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">路径：</span>
          <span class="info-value">{{ currentScript.maintenanceScriptPath || "/" }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">描述：</span>
          <span class="info-value">{{ currentScript.maintenanceScriptDesc || "暂无描述" }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="executeScript(currentScript)">
            <IconifyIconOnline icon="ri:play-line" class="mr-1" />
            执行脚本
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 脚本执行确认对话框 -->
    <el-dialog v-model="executeDialogVisible" title="执行脚本" width="500px" :close-on-click-modal="false">
      <div class="execute-warning">
        <IconifyIconOnline icon="ri:alert-line" class="warning-icon" />
        <span>确定要在维护组下的所有主机上执行该脚本吗？</span>
      </div>
      <div class="script-info">
        <div class="info-item">
          <span class="info-label">脚本名称：</span>
          <span class="info-value">{{ currentScript.maintenanceScriptName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">描述：</span>
          <span class="info-value">{{ currentScript.maintenanceScriptDesc || "暂无描述" }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="executeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExecute" :loading="executing">确认执行</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务监控对话框 -->
    <el-dialog v-model="taskMonitorVisible" title="脚本执行监控" width="70%" :close-on-click-modal="false">
      <task-monitor ref="taskMonitorRef" :task-id="currentTaskId" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceScripts, createMaintenanceScript, updateMaintenanceScript, deleteMaintenanceScript, executeMaintenanceScript } from "@/api/monitor/maintenance";

const TaskMonitor = defineAsyncComponent(() => import("./TaskMonitor.vue"));

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

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref("create"); // 'create' 或 'edit'
const formRef = ref(null);
const submitting = ref(false);

// 查看脚本内容相关
const viewDialogVisible = ref(false);
const currentScript = ref({});

// 脚本执行相关
const executeDialogVisible = ref(false);
const executing = ref(false);

// 任务监控相关
const taskMonitorVisible = ref(false);
const taskMonitorRef = ref(null);
const currentTaskId = ref(null);

// 表单数据
const form = reactive({
  maintenanceScriptId: null,
  maintenanceGroupId: null,
  maintenanceScriptName: "",
  maintenanceScriptPath: "",
  maintenanceScriptContent: "",
  maintenanceScriptDesc: "",
  maintenanceScriptStatus: 1
});

// 表单验证规则
const rules = {
  maintenanceScriptName: [{ required: true, message: "请输入脚本名称", trigger: "blur" }],
  maintenanceScriptContent: [{ required: true, message: "请输入脚本内容", trigger: "blur" }]
};

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
const fetchScripts = async () => {
  loading.value = true;
  try {
    const res = await fetchMaintenanceScripts(props.groupId);
    scriptList.value = res.data || [];
  } catch (error) {
    console.error("获取维护脚本列表失败:", error);
    message("获取维护脚本列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = "create";
  resetForm();
  form.maintenanceGroupId = props.groupId;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = script => {
  dialogType.value = "edit";
  resetForm();
  Object.assign(form, script);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceScriptId = null;
  form.maintenanceGroupId = props.groupId;
  form.maintenanceScriptName = "";
  form.maintenanceScriptPath = "";
  form.maintenanceScriptContent = "";
  form.maintenanceScriptDesc = "";
  form.maintenanceScriptStatus = 1;
};

// 提交表单
const submitForm = async () => {
  if (formRef.value) {
    await formRef.value.validate(async valid => {
      if (valid) {
        submitting.value = true;
        try {
          if (dialogType.value === "create") {
            await createMaintenanceScript(form);
            message("添加脚本成功", { type: "success" });
          } else {
            await updateMaintenanceScript(form);
            message("更新脚本成功", { type: "success" });
          }
          dialogVisible.value = false;
          fetchScripts();
        } catch (error) {
          console.error(dialogType.value === "create" ? "添加脚本失败:" : "更新脚本失败:", error);
          message(dialogType.value === "create" ? "添加脚本失败" : "更新脚本失败", { type: "error" });
        } finally {
          submitting.value = false;
        }
      }
    });
  }
};

// 删除脚本
const deleteScript = async script => {
  try {
    await deleteMaintenanceScript(script.maintenanceScriptId);
    message("删除脚本成功", { type: "success" });
    fetchScripts();
  } catch (error) {
    console.error("删除脚本失败:", error);
    message("删除脚本失败", { type: "error" });
  }
};

// 更新脚本状态
const updateScriptStatus = async script => {
  const newStatus = script.maintenanceScriptStatus === 1 ? 0 : 1;
  try {
    const data = { ...script, maintenanceScriptStatus: newStatus };
    await updateMaintenanceScript(data);
    message(`${newStatus === 1 ? "启用" : "禁用"}脚本成功`, { type: "success" });
    fetchScripts();
  } catch (error) {
    console.error("更新脚本状态失败:", error);
    message("更新脚本状态失败", { type: "error" });
  }
};

// 打开脚本内容查看对话框
const openScriptContent = script => {
  currentScript.value = script;
  viewDialogVisible.value = true;
};

// 打开脚本执行对话框
const executeScript = script => {
  currentScript.value = script;
  executeDialogVisible.value = true;
};

// 确认执行脚本
const confirmExecute = async () => {
  executing.value = true;
  try {
    const res = await executeMaintenanceScript(currentScript.value.maintenanceScriptId, props.groupId);

    message("脚本执行任务已提交", { type: "success" });
    executeDialogVisible.value = false;

    // 如果返回任务ID，打开任务监控
    if (res.data && res.data.taskId) {
      openTaskMonitor(res.data.taskId);
    }
  } catch (error) {
    console.error("脚本执行失败:", error);
    message("脚本执行失败", { type: "error" });
  } finally {
    executing.value = false;
  }
};

// 打开任务监控
const openTaskMonitor = taskId => {
  currentTaskId.value = taskId;
  taskMonitorVisible.value = true;

  // 等待DOM更新后再调用子组件方法
  setTimeout(() => {
    if (taskMonitorRef.value) {
      taskMonitorRef.value.startMonitor(taskId);
    }
  }, 100);
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

  .scripts-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .scripts-content {
    flex: 1;
    overflow-y: auto;
  }

  .script-name {
    display: flex;
    align-items: center;

    .script-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }

  .code-editor-container {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    .code-editor {
      font-family: monospace;
      font-size: 14px;

      :deep(textarea) {
        padding: 12px;
        line-height: 1.5;
      }
    }
  }

  .script-info {
    margin-top: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    .info-item {
      margin-bottom: 8px;
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

    .code-block {
      margin: 0;
      padding: 16px;
      background-color: #282c34;
      color: #abb2bf;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre;
    }
  }

  .execute-warning {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: var(--el-color-warning-light-9);
    border-radius: 4px;
    margin-bottom: 16px;

    .warning-icon {
      font-size: 24px;
      color: var(--el-color-warning);
      margin-right: 8px;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
