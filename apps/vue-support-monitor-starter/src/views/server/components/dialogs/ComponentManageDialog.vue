<template>
  <el-dialog
    v-model="visible"
    title="组件管理"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
    class="component-manage-dialog"
  >
    <div class="manage-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button
            type="primary"
            @click="handleAddComponent"
          >
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加组件
          </el-button>
          <el-button
            type="success"
            @click="handleInitDefault"
            :loading="initLoading"
          >
            <IconifyIconOnline icon="ri:magic-line" class="mr-1" />
            初始化默认组�?
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchText"
            placeholder="搜索组件..."
            clearable
            style="width: 200px"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </div>
      </div>

      <div class="component-list" v-loading="loading">
        <el-table
          :data="filteredComponents"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="monitorSysGenServerDetailComponentName" label="组件名称" width="150" />
          <el-table-column prop="monitorSysGenServerDetailComponentTitle" label="组件标题" width="150" />
          <el-table-column prop="monitorSysGenServerDetailComponentType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getComponentTypeColor(row.monitorSysGenServerDetailComponentType)" size="small">
                {{ getComponentTypeName(row.monitorSysGenServerDetailComponentType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="monitorSysGenServerDetailComponentExpressionType" label="表达式类�? width="120">
            <template #default="{ row }">
              <el-tag
                :type="row.monitorSysGenServerDetailComponentExpressionType === 'PROMETHEUS' ? 'primary' : 'success'"
                size="small"
              >
                {{ row.monitorSysGenServerDetailComponentExpressionType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="monitorSysGenServerDetailComponentRefreshInterval" label="刷新间隔" width="100">
            <template #default="{ row }">
              {{ row.monitorSysGenServerDetailComponentRefreshInterval }}�?
            </template>
          </el-table-column>
          <el-table-column prop="monitorSysGenServerDetailComponentEnabled" label="状�? width="80">
            <template #default="{ row }">
              <el-switch
                v-model="row.monitorSysGenServerDetailComponentEnabled"
                :active-value="1"
                :inactive-value="0"
                @change="handleToggleEnabled(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                text
                size="small"
                @click="handleEditComponent(row)"
              >
                <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
                编辑
              </el-button>
              <el-button
                type="success"
                text
                size="small"
                @click="handleCloneComponent(row)"
              >
                <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
                克隆
              </el-button>
              <el-button
                type="danger"
                text
                size="small"
                @click="handleDeleteComponent(row)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="batch-actions" v-if="selectedComponents.length > 0">
        <div class="selected-info">
          已选择 {{ selectedComponents.length }} 个组�?
        </div>
        <div class="actions">
          <el-button
            type="success"
            @click="handleBatchEnable"
            size="small"
          >
            <IconifyIconOnline icon="ri:check-line" class="mr-1" />
            批量启用
          </el-button>
          <el-button
            type="warning"
            @click="handleBatchDisable"
            size="small"
          >
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            批量禁用
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchDelete"
            size="small"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            批量删除
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>

    <!-- 组件编辑对话�?-->
    <ComponentEditDialog
      ref="componentEditDialogRef"
      @success="handleComponentSaved"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message, messageBox } from "@repo/utils";
import {
  getServerDetailComponents,
  deleteServerDetailComponent,
  toggleComponentEnabled,
  initDefaultComponentsForServer,
  type ServerDetailComponent
} from "@/api/server";

// 导入子组�?
import ComponentEditDialog from "./ComponentEditDialog.vue";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状�?
const visible = ref(false);
const loading = ref(false);
const initLoading = ref(false);
const serverId = ref<number>(0);
const components = ref<ServerDetailComponent[]>([]);
const selectedComponents = ref<ServerDetailComponent[]>([]);
const searchText = ref("");

// 组件引用
const componentEditDialogRef = ref();

// 计算属�?
const filteredComponents = computed(() => {
  if (!searchText.value) {
    return components.value;
  }
  
  const keyword = searchText.value.toLowerCase();
  return components.value.filter(component =>
    component.monitorSysGenServerDetailComponentName?.toLowerCase().includes(keyword) ||
    component.monitorSysGenServerDetailComponentTitle?.toLowerCase().includes(keyword) ||
    component.monitorSysGenServerDetailComponentType?.toLowerCase().includes(keyword)
  );
});

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const nameMap = {
    card: "卡片",
    gauge: "仪表�?,
    line: "折线�?,
    bar: "柱状�?,
    pie: "饼图",
    table: "表格",
  };
  return nameMap[type as keyof typeof nameMap] || type;
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type: string) => {
  const colorMap = {
    card: "primary",
    gauge: "success",
    line: "warning",
    bar: "info",
    pie: "danger",
    table: "",
  };
  return colorMap[type as keyof typeof colorMap] || "";
};

/**
 * 打开对话�?
 */
const open = (serverIdValue: number) => {
  serverId.value = serverIdValue;
  visible.value = true;
  loadComponents();
};

/**
 * 加载组件列表
 */
const loadComponents = async () => {
  try {
    loading.value = true;
    const res = await getServerDetailComponents(serverId.value);
    if (res.code === "00000") {
      components.value = res.data || [];
    } else {
      message.error(res.msg || "加载组件列表失败");
    }
  } catch (error) {
    console.error("加载组件列表失败:", error);
    message.error("加载组件列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: ServerDetailComponent[]) => {
  selectedComponents.value = selection;
};

/**
 * 添加组件
 */
const handleAddComponent = () => {
  componentEditDialogRef.value?.open("add", { serverId: serverId.value });
};

/**
 * 初始化默认组�?
 */
const handleInitDefault = async () => {
  try {
    await messageBox.confirm("确定要初始化默认组件吗？这将添加一些预设的监控组件�?, "确认操作");
    
    initLoading.value = true;
    const res = await initDefaultComponentsForServer(serverId.value);
    if (res.code === "00000") {
      message.success("初始化默认组件成�?);
      await loadComponents();
    } else {
      message.error(res.msg || "初始化失�?);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("初始化默认组件失�?", error);
      message.error("初始化失�?);
    }
  } finally {
    initLoading.value = false;
  }
};

/**
 * 编辑组件
 */
const handleEditComponent = (component: ServerDetailComponent) => {
  componentEditDialogRef.value?.open("edit", component);
};

/**
 * 克隆组件
 */
const handleCloneComponent = (component: ServerDetailComponent) => {
  const clonedComponent = {
    ...component,
    monitorSysGenServerDetailComponentId: undefined,
    monitorSysGenServerDetailComponentName: component.monitorSysGenServerDetailComponentName + "_copy",
    monitorSysGenServerDetailComponentTitle: component.monitorSysGenServerDetailComponentTitle + " (副本)",
  };
  componentEditDialogRef.value?.open("add", clonedComponent);
};

/**
 * 删除组件
 */
const handleDeleteComponent = async (component: ServerDetailComponent) => {
  try {
    await messageBox.confirm(`确定要删除组�?"${component.monitorSysGenServerDetailComponentTitle}" 吗？`, "确认删除");
    
    const res = await deleteServerDetailComponent(component.monitorSysGenServerDetailComponentId!);
    if (res.code === "00000") {
      message.success("删除成功");
      await loadComponents();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除组件失败:", error);
      message.error("删除失败");
    }
  }
};

/**
 * 切换组件启用状�?
 */
const handleToggleEnabled = async (component: ServerDetailComponent) => {
  try {
    const res = await toggleComponentEnabled(
      component.monitorSysGenServerDetailComponentId!,
      component.monitorSysGenServerDetailComponentEnabled === 1
    );
    if (res.code === "00000") {
      message.success(component.monitorSysGenServerDetailComponentEnabled === 1 ? "已启�? : "已禁�?);
    } else {
      message.error(res.msg || "操作失败");
      // 恢复原状�?
      component.monitorSysGenServerDetailComponentEnabled = component.monitorSysGenServerDetailComponentEnabled === 1 ? 0 : 1;
    }
  } catch (error) {
    console.error("切换组件状态失�?", error);
    message.error("操作失败");
    // 恢复原状�?
    component.monitorSysGenServerDetailComponentEnabled = component.monitorSysGenServerDetailComponentEnabled === 1 ? 0 : 1;
  }
};

/**
 * 批量启用
 */
const handleBatchEnable = async () => {
  try {
    for (const component of selectedComponents.value) {
      if (component.monitorSysGenServerDetailComponentEnabled === 0) {
        component.monitorSysGenServerDetailComponentEnabled = 1;
        await toggleComponentEnabled(component.monitorSysGenServerDetailComponentId!, true);
      }
    }
    message.success("批量启用成功");
  } catch (error) {
    console.error("批量启用失败:", error);
    message.error("批量启用失败");
  }
};

/**
 * 批量禁用
 */
const handleBatchDisable = async () => {
  try {
    for (const component of selectedComponents.value) {
      if (component.monitorSysGenServerDetailComponentEnabled === 1) {
        component.monitorSysGenServerDetailComponentEnabled = 0;
        await toggleComponentEnabled(component.monitorSysGenServerDetailComponentId!, false);
      }
    }
    message.success("批量禁用成功");
  } catch (error) {
    console.error("批量禁用失败:", error);
    message.error("批量禁用失败");
  }
};

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  try {
    await messageBox.confirm(`确定要删除选中�?${selectedComponents.value.length} 个组件吗？`, "确认删除");
    
    for (const component of selectedComponents.value) {
      await deleteServerDetailComponent(component.monitorSysGenServerDetailComponentId!);
    }
    
    message.success("批量删除成功");
    await loadComponents();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      message.error("批量删除失败");
    }
  }
};

/**
 * 组件保存成功
 */
const handleComponentSaved = () => {
  loadComponents();
  emit("success");
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.component-manage-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.manage-content {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--el-fill-color-extra-light);
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      gap: 12px;
    }
  }

  .component-list {
    margin-bottom: 20px;
  }

  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
    border: 1px solid var(--el-color-primary-light-7);

    .selected-info {
      font-size: 14px;
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
