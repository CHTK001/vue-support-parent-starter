<template>
  <sc-dialog
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
            初始化默认组件
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
          <el-table-column prop="monitorSysGenServerDetailComponentExpressionType" label="表达式类型" width="120">
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
              {{ row.monitorSysGenServerDetailComponentRefreshInterval }}秒
            </template>
          </el-table-column>
          <el-table-column prop="monitorSysGenServerDetailComponentEnabled" label="状态" width="80">
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
          已选择 {{ selectedComponents.length }} 个组件
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

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog
      ref="componentEditDialogRef"
      @success="handleComponentSaved"
    />
  </sc-dialog>
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

// 导入子组件
import ComponentEditDialog from "./ComponentEditDialog.vue";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const initLoading = ref(false);
const serverId = ref<number>(0);
const components = ref<ServerDetailComponent[]>([]);
const selectedComponents = ref<ServerDetailComponent[]>([]);
const searchText = ref("");

// 组件引用
const componentEditDialogRef = ref();

// 计算属性
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
    gauge: "仪表盘",
    line: "折线图",
    bar: "柱状图",
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
 * 打开对话框
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
 * 初始化默认组件
 */
const handleInitDefault = async () => {
  try {
    await messageBox.confirm("确定要初始化默认组件吗？这将添加一些预设的监控组件。", "确认操作");
    
    initLoading.value = true;
    const res = await initDefaultComponentsForServer(serverId.value);
    if (res.code === "00000") {
      message.success("初始化默认组件成功");
      await loadComponents();
    } else {
      message.error(res.msg || "初始化失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("初始化默认组件失败:", error);
      message.error("初始化失败");
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
    await messageBox.confirm(`确定要删除组件 "${component.monitorSysGenServerDetailComponentTitle}" 吗？`, "确认删除");
    
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
 * 切换组件启用状态
 */
const handleToggleEnabled = async (component: ServerDetailComponent) => {
  try {
    const res = await toggleComponentEnabled(
      component.monitorSysGenServerDetailComponentId!,
      component.monitorSysGenServerDetailComponentEnabled === 1
    );
    if (res.code === "00000") {
      message.success(component.monitorSysGenServerDetailComponentEnabled === 1 ? "已启用" : "已禁用");
    } else {
      message.error(res.msg || "操作失败");
      // 恢复原状态
      component.monitorSysGenServerDetailComponentEnabled = component.monitorSysGenServerDetailComponentEnabled === 1 ? 0 : 1;
    }
  } catch (error) {
    console.error("切换组件状态失败:", error);
    message.error("操作失败");
    // 恢复原状态
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
    await messageBox.confirm(`确定要删除选中的 ${selectedComponents.value.length} 个组件吗？`, "确认删除");
    
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
@use "@/styles/variables.scss" as *;

.component-manage-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    @include glass-effect(0.95, 20px);
    box-shadow: $shadow-xl;
    border: 1px solid $border-light;
    overflow: hidden;

    .el-dialog__header {
      padding: $spacing-lg $spacing-xl;
      background: $gradient-bg-1;
      border-bottom: 1px solid $border-light;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: $gradient-line-top;
      }

      .el-dialog__title {
        font-weight: $font-weight-semibold;
        font-size: $font-lg;
        color: var(--el-text-color-primary);
      }
    }

    .el-dialog__body {
      padding: $spacing-xl;
      background: rgba(255, 255, 255, 0.5);
    }

    .el-dialog__footer {
      padding: $spacing-lg $spacing-xl;
      background: rgba(255, 255, 255, 0.6);
      border-top: 1px solid $border-light;
    }
  }
}

.manage-content {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xl;
    padding: $spacing-lg;
    @include glass-effect(0.9, 16px);
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    border: 1px solid $border-light;
    transition: all $duration-normal $ease-standard;

    &:hover {
      box-shadow: $shadow-md;
    }

    .toolbar-left {
      display: flex;
      gap: $spacing-md;

      .el-button {
        border-radius: $radius-sm;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover {
          transform: translateY(-1px);
          box-shadow: $shadow-sm;
        }

        :deep(.iconify-icon) {
          transition: transform $duration-fast $ease-standard;
        }

        &:hover :deep(.iconify-icon) {
          transform: scale(1.1);
        }
      }
    }

    .toolbar-right {
      .el-input {
        :deep(.el-input__wrapper) {
          border-radius: $radius-sm;
          transition: all $duration-fast $ease-standard;

          &:hover {
            box-shadow: $shadow-sm;
          }

          &.is-focus {
            box-shadow: 0 0 0 2px $primary-light;
          }
        }
      }
    }
  }

  .component-list {
    margin-bottom: $spacing-xl;
    border-radius: $radius-md;
    overflow: hidden;

    :deep(.el-table) {
      @include glass-effect(0.9, 16px);
      border-radius: $radius-md;
      border: 1px solid $border-light;

      .el-table__header {
        th {
          background: rgba(255, 255, 255, 0.6);
          font-weight: $font-weight-semibold;
          color: var(--el-text-color-primary);
          border-bottom: 2px solid $border-medium;
        }
      }

      .el-table__body {
        tr {
          transition: all $duration-fast $ease-standard;

          &:hover {
            background: rgba(99, 102, 241, 0.05);
            transform: scale(1.001);
          }
        }

        td {
          border-bottom: 1px solid $border-light;
        }
      }

      .el-tag {
        border-radius: $radius-sm;
        font-weight: $font-weight-medium;
      }

      .el-button {
        border-radius: $radius-sm;
        transition: all $duration-fast $ease-standard;

        &:hover {
          transform: translateY(-1px);
        }

        :deep(.iconify-icon) {
          transition: transform $duration-fast $ease-standard;
        }

        &:hover :deep(.iconify-icon) {
          transform: scale(1.1);
        }
      }
    }
  }

  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.08));
    border-radius: $radius-md;
    border: 1px solid $border-primary;
    box-shadow: $shadow-sm;
    animation: slideInUp $duration-normal $ease-standard;

    .selected-info {
      font-size: $font-md;
      color: var(--el-color-primary);
      font-weight: $font-weight-semibold;
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      &::before {
        content: "";
        width: 8px;
        height: 8px;
        background: var(--el-color-primary);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }
    }

    .actions {
      display: flex;
      gap: $spacing-sm;

      .el-button {
        border-radius: $radius-sm;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover {
          transform: translateY(-1px);
          box-shadow: $shadow-sm;
        }

        :deep(.iconify-icon) {
          transition: transform $duration-fast $ease-standard;
        }

        &:hover :deep(.iconify-icon) {
          transform: scale(1.1);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;

  .el-button {
    border-radius: $radius-sm;
    padding: $button-padding-md;
    transition: all $duration-fast $ease-standard;
    font-weight: $font-weight-medium;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

// 响应式设计
@include respond-to(lg) {
  .component-manage-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 3vh auto;

      .el-dialog__body {
        padding: $spacing-lg;
      }
    }
  }

  .manage-content {
    .toolbar {
      flex-direction: column;
      gap: $spacing-md;
      align-items: stretch;

      .toolbar-left,
      .toolbar-right {
        width: 100%;
      }
    }
  }
}

@include respond-to(sm) {
  .component-manage-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      margin: 1vh auto;

      .el-dialog__header,
      .el-dialog__body,
      .el-dialog__footer {
        padding: $spacing-md;
      }
    }
  }

  .manage-content {
    .toolbar {
      padding: $spacing-md;

      .toolbar-left {
        flex-direction: column;
        gap: $spacing-sm;
      }
    }

    .batch-actions {
      flex-direction: column;
      gap: $spacing-md;
      align-items: stretch;

      .actions {
        flex-direction: column;
        width: 100%;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>
