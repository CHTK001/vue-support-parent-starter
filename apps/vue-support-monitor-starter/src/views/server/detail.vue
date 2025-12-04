<template>
  <div class="server-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="primary" plain @click="goBack" class="back-btn">
          <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
          返回
        </el-button>
        <div class="server-info">
          <div class="server-title">
            <IconifyIconOnline :icon="getProtocolIcon(serverInfo?.protocol)" class="server-icon" />
            <span class="server-name">{{ serverInfo?.name || "服务器详�? }}</span>
            <el-tag :type="getStatusType(serverInfo?.status)" size="small" class="status-tag">
              {{ getStatusText(serverInfo?.status) }}
            </el-tag>
          </div>
          <div class="server-subtitle">
            {{ serverInfo?.host }}:{{ serverInfo?.port }} |
            {{ serverInfo?.protocol }}
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-button type="success" @click="handleRefresh" :loading="refreshLoading" plain>
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="info" @click="handleFileManager" plain>
          <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
          文件管理
        </el-button>
        <el-button type="primary" @click="handleAddComponent">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加组件
        </el-button>
        <el-button type="warning" @click="handleManageComponents" plain>
          <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
          管理组件
        </el-button>

        <el-button @click="handleComponentConfig" plain>
          <IconifyIconOnline icon="ri:dashboard-line" class="mr-1" />
          组件配置
        </el-button>

        <el-button @click="handleLayoutConfig" plain>
          <IconifyIconOnline icon="ri:layout-grid-line" class="mr-1" />
          布局配置
        </el-button>

        <el-button :type="editMode ? 'success' : 'default'" @click="toggleEditMode" plain>
          <IconifyIconOnline :icon="editMode ? 'ri:eye-line' : 'ri:edit-line'" class="mr-1" />
          {{ editMode ? "预览模式" : "编辑模式" }}
        </el-button>
      </div>
    </div>

    <!-- 组件网格布局 -->
    <div class="components-container" v-loading="loading">
      <GridLayoutEditor ref="gridLayoutEditorRef" :server-id="serverId" :initial-layout="layout" @layout-change="handleLayoutUpdated" @save="handleSaveLayout" />
    </div>

    <!-- 编辑模式工具�?-->
    <div v-if="editMode" class="edit-toolbar">
      <div class="toolbar-content">
        <span class="edit-tip">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          编辑模式：可拖拽和调整组件大�?
        </span>
        <div class="toolbar-actions">
          <el-button @click="handleCancelEdit">取消</el-button>
          <el-button type="primary" @click="handleSaveLayout">保存布局</el-button>
        </div>
      </div>
    </div>

    <!-- 组件编辑对话�?-->
    <ComponentEditDialog ref="componentEditDialogRef" @success="handleComponentSaved" />

    <!-- 组件管理对话�?-->
    <ComponentManageDialog ref="componentManageDialogRef" @success="handleComponentsManaged" />

    <!-- 文件管理对话�?-->
    <el-dialog v-model="fileManagerVisible" title="文件管理" width="90%" :before-close="handleFileManagerClose" append-to-body destroy-on-close>
      <FileManager :server="serverInfo" @close="handleFileManagerClose" />
    </el-dialog>

    <!-- 组件配置对话�?-->
    <ComponentConfigDialog ref="componentConfigDialogRef" :server-id="serverId" @success="handleComponentConfigSuccess" />

    <!-- 布局配置对话�?-->
    <LayoutConfigDialog ref="layoutConfigDialogRef" @apply="handleApplyLayoutTemplate" />
  </div>
</template>

<script setup lang="ts">
import { batchUpdateComponentPosition, deleteServerDetailComponent, getEnabledServerDetailComponents, getServerInfo, initDefaultComponentsForServerDetail, type ServerComponent, type ServerDisplayData } from "@/api/server";
import { message } from "@repo/utils";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

// 导入组件
import BarChartComponent from "./components/charts/BarChartComponent.vue";
import CardComponent from "./components/charts/CardComponent.vue";
import DiskPartitionsComponent from "./components/charts/DiskPartitionsComponent.vue";
import GaugeComponent from "./components/charts/GaugeComponent.vue";
import LineChartComponent from "./components/charts/LineChartComponent.vue";
import PieChartComponent from "./components/charts/PieChartComponent.vue";
import TableComponent from "./components/charts/TableComponent.vue";
import ComponentConfigDialog from "./components/dialogs/ComponentConfigDialog.vue";
import ComponentEditDialog from "./components/dialogs/ComponentEditDialog.vue";
import ComponentManageDialog from "./components/dialogs/ComponentManageDialog.vue";
import LayoutConfigDialog from "./components/dialogs/LayoutConfigDialog.vue";
import GridLayoutEditor from "./components/layout/GridLayoutEditor.vue";
import FileManager from "./modules/file-management/index.vue";

const route = useRoute();
const router = useRouter();

// 响应式状�?
const loading = ref(false);
const refreshLoading = ref(false);
const editMode = ref(false);
const serverId = ref<number>(Number(route.params.id));
const serverInfo = ref<ServerDisplayData>();
const components = ref<ServerComponent[]>([]);
const layout = ref<any[]>([]);

// 组件引用
const componentEditDialogRef = ref();
const componentManageDialogRef = ref();
const componentConfigDialogRef = ref();
const layoutConfigDialogRef = ref();
const gridLayoutEditorRef = ref();

// 文件管理对话框状�?
const fileManagerVisible = ref(false);

// 组件类型映射
const componentTypeMap = {
  card: CardComponent,
  gauge: GaugeComponent,
  line: LineChartComponent,
  bar: BarChartComponent,
  pie: PieChartComponent,
  table: TableComponent,
  diskPartitions: DiskPartitionsComponent,
};

/**
 * 获取组件类型
 */
const getComponentType = (type: string) => {
  return componentTypeMap[type as keyof typeof componentTypeMap] || CardComponent;
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol?: string) => {
  const iconMap = {
    SSH: "ri:terminal-line",
    RDP: "ri:computer-line",
    VNC: "ri:remote-control-line",
  };
  return iconMap[protocol as keyof typeof iconMap] || "ri:server-line";
};

/**
 * 获取状态类�?
 */
const getStatusType = (status?: number) => {
  const typeMap = {
    0: "info",
    1: "success",
    2: "warning",
    3: "danger",
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

/**
 * 获取状态文�?
 */
const getStatusText = (status?: number) => {
  const textMap = {
    0: "未知",
    1: "在线",
    2: "离线",
    3: "异常",
  };
  return textMap[status as keyof typeof textMap] || "未知";
};

/**
 * 返回上一�?
 */
const goBack = () => {
  router.back();
};

/**
 * 刷新页面数据
 */
const handleRefresh = async () => {
  refreshLoading.value = true;
  try {
    await Promise.all([loadServerInfo(), loadComponents()]);
    message.success("刷新成功");
  } catch (error) {
    console.error("刷新失败:", error);
    message.error("刷新失败");
  } finally {
    refreshLoading.value = false;
  }
};

/**
 * 添加组件
 */
const handleAddComponent = () => {
  componentEditDialogRef.value?.open("add", { serverId: serverId.value });
};

/**
 * 管理组件
 */
const handleManageComponents = () => {
  componentManageDialogRef.value?.open(serverId.value);
};

/**
 * 文件管理
 */
const handleFileManager = () => {
  fileManagerVisible.value = true;
};

/**
 * 关闭文件管理对话�?
 */
const handleFileManagerClose = () => {
  fileManagerVisible.value = false;
};

/**
 * 组件配置
 */
const handleComponentConfig = () => {
  componentConfigDialogRef.value?.open("add");
};

/**
 * 布局配置
 */
const handleLayoutConfig = () => {
  layoutConfigDialogRef.value?.open();
};

/**
 * 切换编辑模式
 */
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  if (gridLayoutEditorRef.value) {
    gridLayoutEditorRef.value.setEditMode(editMode.value ? "edit" : "view");
  }
};

/**
 * 初始化默认组�?
 */
const handleInitDefaultComponents = async () => {
  try {
    loading.value = true;
    const res = await initDefaultComponentsForServerDetail(serverId.value);
    if (res.code === "00000") {
      message.success("初始化默认组件成�?);
      await loadComponents();
    } else {
      message.error(res.msg || "初始化失�?);
    }
  } catch (error) {
    console.error("初始化默认组件失�?", error);
    message.error("初始化失�?);
  } finally {
    loading.value = false;
  }
};

/**
 * 删除组件
 */
const handleDeleteComponent = async (componentId: number) => {
  try {
    const res = await deleteServerDetailComponent(componentId);
    if (res.code === "00000") {
      message.success("删除成功");
      await loadComponents();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    console.error("删除组件失败:", error);
    message.error("删除失败");
  }
};

/**
 * 编辑组件
 */
const handleEditComponent = (component: ServerComponent) => {
  componentEditDialogRef.value?.open("edit", component);
};

/**
 * 刷新单个组件
 */
const handleRefreshComponent = (componentId: number) => {
  // TODO: 实现单个组件刷新逻辑
  console.log("刷新组件:", componentId);
};

/**
 * 布局更新
 */
const handleLayoutUpdated = (newLayout: any[]) => {
  layout.value = newLayout;
};

/**
 * 取消编辑
 */
const handleCancelEdit = () => {
  editMode.value = false;
  // 重新加载组件以恢复原始布局
  loadComponents();
};

/**
 * 保存布局
 */
const handleSaveLayout = async () => {
  try {
    // 将布局信息映射回组件数�?
    const updatedComponents = components.value.map((component) => {
      const layoutItem = layout.value.find((item) => item.i === String(component.monitorSysGenServerComponentId));
      if (layoutItem) {
        return {
          ...component,
          monitorSysGenServerComponentPosition: JSON.stringify({
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }),
        };
      }
      return component;
    });

    const res = await batchUpdateComponentPosition(serverId.value, updatedComponents);
    if (res.code === "00000") {
      message.success("布局保存成功");
      editMode.value = false;
    } else {
      message.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存布局失败:", error);
    message.error("保存失败");
  }
};

/**
 * 组件保存成功
 */
const handleComponentSaved = () => {
  loadComponents();
};

/**
 * 组件管理完成
 */
const handleComponentsManaged = () => {
  loadComponents();
};

/**
 * 组件配置成功
 */
const handleComponentConfigSuccess = () => {
  loadComponents();
  message.success("组件配置已保�?);
};

/**
 * 应用布局模板
 */
const handleApplyLayoutTemplate = (template: any) => {
  if (gridLayoutEditorRef.value) {
    gridLayoutEditorRef.value.setLayout(template.config.layout);
    message.success("布局模板已应�?);
  }
};

/**
 * 加载服务器信�?
 */
const loadServerInfo = async () => {
  try {
    const res = await getServerInfo(String(serverId.value));
    if (res.code === "00000") {
      //@ts-ignore
      serverInfo.value = res.data;
    }
  } catch (error) {
    console.error("加载服务器信息失�?", error);
  }
};

/**
 * 加载组件列表
 */
const loadComponents = async () => {
  try {
    loading.value = true;
    const res = await getEnabledServerDetailComponents(serverId.value);
    if (res.code === "00000") {
      components.value = res.data || [];
      // 转换为网格布局格式
      layout.value = components.value.map((component) => {
        let position = { x: 0, y: 0, w: 6, h: 6 };
        try {
          if (component.monitorSysGenServerComponentPosition) {
            position = JSON.parse(component.monitorSysGenServerComponentPosition);
          }
        } catch (e) {
          console.warn("解析组件位置失败:", e);
        }

        return {
          i: String(component.monitorSysGenServerComponentId),
          x: position.x,
          y: position.y,
          w: position.w,
          h: position.h,
          componentType: component.monitorSysGenServerComponentType,
          ...component,
        };
      });
    }
  } catch (error) {
    console.error("加载组件列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 页面初始�?
onMounted(() => {
  loadServerInfo();
  loadComponents();
});
</script>

<style lang="scss" scoped>
.server-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-btn {
      border-radius: 8px;
    }

    .server-info {
      .server-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .server-icon {
          font-size: 20px;
          color: var(--el-color-primary);
        }

        .server-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .status-tag {
          margin-left: 8px;
        }
      }

      .server-subtitle {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
  }

  .header-right {
    display: flex;
    gap: 12px;

    .el-button {
      border-radius: 8px;
    }
  }
}

.components-container {
  flex: 1;
  padding: 20px;
  overflow: auto;
  position: relative;

  .grid-layout {
    min-height: calc(100vh - 200px);
  }

  .grid-item {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }
}

.edit-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  .toolbar-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: var(--el-bg-color-overlay);
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--el-border-color-lighter);

    .edit-tip {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 16px;
      }
    }
  }
}

// 响应式设�?
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;

    .header-left,
    .header-right {
      width: 100%;
      justify-content: center;
    }

    .header-right {
      .el-button {
        flex: 1;
        max-width: 120px;
      }
    }
  }

  .components-container {
    padding: 12px;
  }

  .edit-toolbar {
    bottom: 10px;
    left: 10px;
    right: 10px;
    transform: none;

    .toolbar-content {
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 16px;

      .edit-tip {
        text-align: center;
      }

      .toolbar-actions {
        width: 100%;
        justify-content: center;

        .el-button {
          flex: 1;
        }
      }
    }
  }
}
</style>
