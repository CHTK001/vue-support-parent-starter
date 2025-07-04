<template>
  <el-dialog
    v-model="visible"
    title="批量操作"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="batch-operation">
      <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
        v-loading="loading"
      >
        <el-form-item label="操作类型" prop="operationType">
          <el-select
            v-model="formData.operationType"
            placeholder="请选择操作类型"
            style="width: 100%"
            @change="handleOperationTypeChange"
          >
            <el-option label="批量启用" value="enable" />
            <el-option label="批量禁用" value="disable" />
            <el-option label="批量设置排序" value="sort" />
            <el-option label="批量设置刷新间隔" value="refresh" />
            <el-option label="批量克隆到其他服务器" value="clone" />
            <el-option label="批量删除" value="delete" />
          </el-select>
        </el-form-item>

        <el-form-item 
          label="排序起始值" 
          prop="sortStart"
          v-if="formData.operationType === 'sort'"
        >
          <el-input-number
            v-model="formData.sortStart"
            :min="0"
            style="width: 100%"
            placeholder="请输入排序起始值"
          />
          <div class="form-help">
            <span class="help-text">组件将按选择顺序从此值开始递增排序</span>
          </div>
        </el-form-item>

        <el-form-item 
          label="刷新间隔(秒)" 
          prop="refreshInterval"
          v-if="formData.operationType === 'refresh'"
        >
          <el-input-number
            v-model="formData.refreshInterval"
            :min="5"
            :max="3600"
            style="width: 100%"
            placeholder="请输入刷新间隔"
          />
        </el-form-item>

        <el-form-item 
          label="目标服务器" 
          prop="targetServerId"
          v-if="formData.operationType === 'clone'"
        >
          <el-select
            v-model="formData.targetServerId"
            placeholder="请选择目标服务器"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="server in serverList"
              :key="server.id"
              :label="`${server.name} (${server.host}:${server.port})`"
              :value="server.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选中组件">
          <div class="selected-components">
            <el-tag
              v-for="component in selectedComponents"
              :key="component.monitorSysGenServerDetailComponentId"
              closable
              @close="removeComponent(component)"
              class="component-tag"
            >
              {{ component.monitorSysGenServerDetailComponentTitle }}
            </el-tag>
            <div v-if="selectedComponents.length === 0" class="no-selection">
              暂无选中的组件
            </div>
          </div>
        </el-form-item>

        <el-form-item label="操作说明">
          <div class="operation-description">
            {{ getOperationDescription() }}
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleExecute" 
          :loading="loading"
          :disabled="!canExecute"
        >
          执行操作
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message, messageBox } from "@repo/utils";
import { 
  getServerList,
  toggleComponentEnabledDetail,
  updateServerDetailComponent,
  cloneComponent,
  deleteServerDetailComponent,
  type ServerDetailComponent 
} from "@/api/server";

// 定义事件
const emit = defineEmits<{
  completed: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const selectedComponents = ref<ServerDetailComponent[]>([]);
const serverList = ref<any[]>([]);

// 表单引用
const formRef = ref();

// 表单数据
const formData = reactive({
  operationType: "",
  sortStart: 0,
  refreshInterval: 30,
  targetServerId: ""
});

// 计算属性
const canExecute = computed(() => {
  if (selectedComponents.value.length === 0) return false;
  if (!formData.operationType) return false;
  
  switch (formData.operationType) {
    case "sort":
      return formData.sortStart >= 0;
    case "refresh":
      return formData.refreshInterval >= 5 && formData.refreshInterval <= 3600;
    case "clone":
      return !!formData.targetServerId;
    default:
      return true;
  }
});

/**
 * 打开对话框
 */
const open = (components: ServerDetailComponent[]) => {
  visible.value = true;
  selectedComponents.value = [...components];
  resetForm();
  loadServerList();
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    operationType: "",
    sortStart: 0,
    refreshInterval: 30,
    targetServerId: ""
  });
};

/**
 * 加载服务器列表
 */
const loadServerList = async () => {
  try {
    const res = await getServerList();
    if (res.code === "00000") {
      serverList.value = res.data || [];
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  }
};

/**
 * 操作类型变化
 */
const handleOperationTypeChange = () => {
  // 重置相关字段
  formData.sortStart = 0;
  formData.refreshInterval = 30;
  formData.targetServerId = "";
};

/**
 * 移除组件
 */
const removeComponent = (component: ServerDetailComponent) => {
  const index = selectedComponents.value.findIndex(
    item => item.monitorSysGenServerDetailComponentId === component.monitorSysGenServerDetailComponentId
  );
  if (index > -1) {
    selectedComponents.value.splice(index, 1);
  }
};

/**
 * 获取操作说明
 */
const getOperationDescription = () => {
  const count = selectedComponents.value.length;
  
  switch (formData.operationType) {
    case "enable":
      return `将启用选中的 ${count} 个组件`;
    case "disable":
      return `将禁用选中的 ${count} 个组件`;
    case "sort":
      return `将为选中的 ${count} 个组件设置排序序号，从 ${formData.sortStart} 开始递增`;
    case "refresh":
      return `将为选中的 ${count} 个组件设置刷新间隔为 ${formData.refreshInterval} 秒`;
    case "clone":
      const targetServer = serverList.value.find(s => s.id === formData.targetServerId);
      return `将选中的 ${count} 个组件克隆到服务器 "${targetServer?.name || '未选择'}"`;
    case "delete":
      return `将删除选中的 ${count} 个组件，此操作不可恢复`;
    default:
      return "请选择操作类型";
  }
};

/**
 * 取消
 */
const handleCancel = () => {
  visible.value = false;
};

/**
 * 执行操作
 */
const handleExecute = async () => {
  if (!canExecute.value) {
    message.warning("请完善操作参数");
    return;
  }

  // 危险操作需要确认
  if (formData.operationType === "delete") {
    try {
      await messageBox.confirm(
        `确定要删除选中的 ${selectedComponents.value.length} 个组件吗？此操作不可恢复！`,
        "确认删除",
        { type: "warning" }
      );
    } catch {
      return;
    }
  }

  try {
    loading.value = true;
    
    switch (formData.operationType) {
      case "enable":
        await batchToggleEnabled(true);
        break;
      case "disable":
        await batchToggleEnabled(false);
        break;
      case "sort":
        await batchSetSort();
        break;
      case "refresh":
        await batchSetRefresh();
        break;
      case "clone":
        await batchClone();
        break;
      case "delete":
        await batchDelete();
        break;
    }

    message.success("批量操作执行成功");
    visible.value = false;
    emit("completed");
  } catch (error) {
    console.error("批量操作失败:", error);
    message.error("批量操作失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 批量切换启用状态
 */
const batchToggleEnabled = async (enabled: boolean) => {
  for (const component of selectedComponents.value) {
    await toggleComponentEnabledDetail(
      component.monitorSysGenServerDetailComponentId!,
      enabled
    );
  }
};

/**
 * 批量设置排序
 */
const batchSetSort = async () => {
  for (let i = 0; i < selectedComponents.value.length; i++) {
    const component = selectedComponents.value[i];
    const updatedComponent = {
      ...component,
      monitorSysGenServerDetailComponentSortOrder: formData.sortStart + i
    };
    await updateServerDetailComponent(updatedComponent);
  }
};

/**
 * 批量设置刷新间隔
 */
const batchSetRefresh = async () => {
  for (const component of selectedComponents.value) {
    const updatedComponent = {
      ...component,
      monitorSysGenServerDetailComponentRefreshInterval: formData.refreshInterval
    };
    await updateServerDetailComponent(updatedComponent);
  }
};

/**
 * 批量克隆
 */
const batchClone = async () => {
  for (const component of selectedComponents.value) {
    await cloneComponent(
      component.monitorSysGenServerDetailComponentId!,
      Number(formData.targetServerId)
    );
  }
};

/**
 * 批量删除
 */
const batchDelete = async () => {
  for (const component of selectedComponents.value) {
    await deleteServerDetailComponent(component.monitorSysGenServerDetailComponentId!);
  }
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.batch-operation {
  .selected-components {
    .component-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }

    .no-selection {
      color: var(--el-text-color-placeholder);
      font-size: 14px;
    }
  }

  .operation-description {
    padding: 12px;
    background: var(--el-bg-color-page);
    border-radius: 4px;
    border-left: 4px solid var(--el-color-primary);
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  .form-help {
    margin-top: 4px;

    .help-text {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
