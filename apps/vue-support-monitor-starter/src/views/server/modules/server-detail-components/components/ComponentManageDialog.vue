<template>
  <el-dialog
    v-model="visible"
    title="组件管理"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    top="5vh"
  >
    <div class="component-manage">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleCreate">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            新建组件
          </el-button>
          <el-button type="success" @click="handleBatchEnable" :disabled="selectedComponents.length === 0">
            <IconifyIconOnline icon="ri:play-line" class="mr-1" />
            批量启用
          </el-button>
          <el-button type="warning" @click="handleBatchDisable" :disabled="selectedComponents.length === 0">
            <IconifyIconOnline icon="ri:pause-line" class="mr-1" />
            批量禁用
          </el-button>
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedComponents.length === 0">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            批量删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchText"
            placeholder="搜索组件名称或标题"
            style="width: 250px"
            clearable
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-select v-model="filterType" placeholder="组件类型" style="width: 120px" clearable>
            <el-option
              v-for="option in componentTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态" style="width: 100px" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>
      </div>

      <!-- 组件列表 -->
      <div class="component-list">
        <ScTable
          ref="tableRef"
          :data="filteredComponents"
          :loading="loading"
          row-key="monitorSysGenServerDetailComponentId"
          @selection-change="handleSelectionChange"
          height="500px"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="monitorSysGenServerDetailComponentName" label="组件名称" min-width="120" />
          <el-table-column prop="monitorSysGenServerDetailComponentTitle" label="组件标题" min-width="120" />
          <el-table-column prop="monitorSysGenServerDetailComponentType" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="getComponentTypeColor(row.monitorSysGenServerDetailComponentType)">
                {{ getComponentTypeName(row.monitorSysGenServerDetailComponentType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="monitorSysGenServerDetailComponentExpressionType" label="表达式类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.monitorSysGenServerDetailComponentExpressionType === 'PROMETHEUS' ? 'success' : 'info'">
                {{ row.monitorSysGenServerDetailComponentExpressionType }}
              </el-tag>
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
          <el-table-column prop="monitorSysGenServerDetailComponentSortOrder" label="排序" width="80" />
          <el-table-column prop="monitorSysGenServerDetailComponentRefreshInterval" label="刷新间隔(秒)" width="100" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                <IconifyIconOnline icon="ri:edit-line" />
              </el-button>
              <el-button type="success" size="small" @click="handlePreview(row)">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
              <el-button type="info" size="small" @click="handleClone(row)">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog
      ref="componentEditDialogRef"
      :server-id="serverId"
      @saved="handleComponentSaved"
    />

    <!-- 组件预览对话框 -->
    <ComponentPreviewDialog
      ref="componentPreviewDialogRef"
      :server-id="serverId"
    />

    <!-- 批量操作对话框 -->
    <BatchOperationDialog
      ref="batchOperationDialogRef"
      @completed="handleBatchCompleted"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message, messageBox } from "@repo/utils";
import {
  getServerDetailComponents,
  deleteServerDetailComponent,
  toggleComponentEnabledDetail,
  type ServerDetailComponent
} from "@/api/server";

// 导入组件
import ComponentEditDialog from "./ComponentEditDialog.vue";
import ComponentPreviewDialog from "./ComponentPreviewDialog.vue";
import BatchOperationDialog from "./BatchOperationDialog.vue";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 定义事件
const emit = defineEmits<{
  managed: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const components = ref<ServerDetailComponent[]>([]);
const selectedComponents = ref<ServerDetailComponent[]>([]);
const searchText = ref("");
const filterType = ref("");
const filterStatus = ref<number | "">("");

// 选项数据
const componentTypeOptions = [
  { label: "卡片", value: "card" },
  { label: "仪表盘", value: "gauge" },
  { label: "折线图", value: "line" },
  { label: "柱状图", value: "bar" },
  { label: "饼图", value: "pie" },
  { label: "表格", value: "table" }
];

// 引用
const tableRef = ref();
const componentEditDialogRef = ref();
const componentPreviewDialogRef = ref();
const batchOperationDialogRef = ref();

// 计算属性
const filteredComponents = computed(() => {
  let result = components.value;

  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(item =>
      item.monitorSysGenServerDetailComponentName?.toLowerCase().includes(search) ||
      item.monitorSysGenServerDetailComponentTitle?.toLowerCase().includes(search)
    );
  }

  // 类型过滤
  if (filterType.value) {
    result = result.filter(item => item.monitorSysGenServerDetailComponentType === filterType.value);
  }

  // 状态过滤
  if (filterStatus.value !== "") {
    result = result.filter(item => item.monitorSysGenServerDetailComponentEnabled === filterStatus.value);
  }

  return result;
});

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
  loadComponents();
};

/**
 * 加载组件列表
 */
const loadComponents = async () => {
  try {
    loading.value = true;
    const res = await getServerDetailComponents(props.serverId);
    if (res.code === "00000") {
      components.value = res.data || [];
    }
  } catch (error) {
    console.error("加载组件列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 选择变化
 */
const handleSelectionChange = (selection: ServerDetailComponent[]) => {
  selectedComponents.value = selection;
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    card: "卡片",
    gauge: "仪表盘",
    line: "折线图",
    bar: "柱状图",
    pie: "饼图",
    table: "表格"
  };
  return nameMap[type] || type;
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    card: "primary",
    gauge: "success",
    line: "warning",
    bar: "info",
    pie: "danger",
    table: ""
  };
  return colorMap[type] || "";
};

/**
 * 创建组件
 */
const handleCreate = () => {
  componentEditDialogRef.value?.open("create");
};

/**
 * 编辑组件
 */
const handleEdit = (component: ServerDetailComponent) => {
  componentEditDialogRef.value?.open("edit", component);
};

/**
 * 预览组件
 */
const handlePreview = (component: ServerDetailComponent) => {
  componentPreviewDialogRef.value?.open(component);
};

/**
 * 克隆组件
 */
const handleClone = (component: ServerDetailComponent) => {
  const clonedComponent = { ...component };
  delete clonedComponent.monitorSysGenServerDetailComponentId;
  clonedComponent.monitorSysGenServerDetailComponentName += "_副本";
  clonedComponent.monitorSysGenServerDetailComponentTitle += "_副本";
  componentEditDialogRef.value?.open("create", clonedComponent);
};

/**
 * 删除组件
 */
const handleDelete = async (component: ServerDetailComponent) => {
  try {
    await messageBox.confirm(
      `确定要删除组件 "${component.monitorSysGenServerDetailComponentTitle}" 吗？`,
      "确认删除",
      { type: "warning" }
    );

    const res = await deleteServerDetailComponent(component.monitorSysGenServerDetailComponentId!);
    if (res.code === "00000") {
      message.success("删除成功");
      await loadComponents();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    console.error("删除组件失败:", error);
  }
};

/**
 * 切换启用状态
 */
const handleToggleEnabled = async (component: ServerDetailComponent) => {
  try {
    const res = await toggleComponentEnabledDetail(
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
        await toggleComponentEnabledDetail(component.monitorSysGenServerDetailComponentId!, true);
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
        await toggleComponentEnabledDetail(component.monitorSysGenServerDetailComponentId!, false);
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
    await messageBox.confirm(
      `确定要删除选中的 ${selectedComponents.value.length} 个组件吗？`,
      "确认删除",
      { type: "warning" }
    );

    for (const component of selectedComponents.value) {
      await deleteServerDetailComponent(component.monitorSysGenServerDetailComponentId!);
    }
    
    message.success("批量删除成功");
    await loadComponents();
  } catch (error) {
    console.error("批量删除失败:", error);
    message.error("批量删除失败");
  }
};

/**
 * 组件保存成功
 */
const handleComponentSaved = () => {
  loadComponents();
};

/**
 * 批量操作完成
 */
const handleBatchCompleted = () => {
  loadComponents();
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.component-manage {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .component-list {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 16px;
  }
}
</style>
