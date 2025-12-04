<template>
  <div class="server-detail-components">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="server-info">
          <div class="server-title">
            <IconifyIconOnline :icon="getProtocolIcon(serverInfo?.protocol)" class="server-icon" />
            <span class="server-name">{{ serverInfo?.name || "服务器详�? }}</span>
            <el-tag :type="getStatusType(serverInfo?.status)" size="small" class="status-tag">
              {{ getStatusText(serverInfo?.status) }}
            </el-tag>
          </div>
          <div class="server-subtitle">{{ serverInfo?.host }}:{{ serverInfo?.port }} | {{ serverInfo?.protocol }}</div>
        </div>
      </div>
      <div class="header-right">
        <el-button type="success" @click="handleRefresh" :loading="refreshLoading" plain size="small">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="handleInitDefaultComponents" :loading="loading" plain size="small">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          初始化组�?
        </el-button>
        <el-button type="info" @click="handleManageComponents" plain size="small">
          <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
          管理组件
        </el-button>
        <el-button :type="editMode ? 'success' : 'warning'" @click="toggleEditMode" plain size="small">
          <IconifyIconOnline :icon="editMode ? 'ri:save-line' : 'ri:edit-line'" class="mr-1" />
          {{ editMode ? "保存布局" : "编辑布局" }}
        </el-button>
      </div>
    </div>

    <!-- 组件网格布局 -->
    <div class="components-container" v-loading="loading">
      <div v-if="components.length === 0" class="empty-state">
        <el-empty description="暂无组件">
          <el-button type="primary" @click="handleInitDefaultComponents"> 初始化默认组�?</el-button>
        </el-empty>
      </div>

      <GridLayoutEditor v-else ref="gridLayoutEditorRef" :layout="layout" :edit-mode="editMode" @layout-updated="handleLayoutUpdated" @component-edit="handleComponentEdit" @component-delete="handleComponentDelete">
        <template #component="{ item }">
          <component :is="getComponentType(item.componentType)" :component-data="item" :server-id="serverId" :edit-mode="editMode" @edit="handleComponentEdit" @delete="handleComponentDelete" @refresh="handleComponentRefresh" />
        </template>
      </GridLayoutEditor>
    </div>

    <!-- 组件编辑对话�?-->
    <ComponentEditDialog ref="componentEditDialogRef" :server-id="serverId" @saved="handleComponentSaved" />

    <!-- 组件管理对话�?-->
    <ComponentManageDialog ref="componentManageDialogRef" :server-id="serverId" @managed="handleComponentsManaged" />
  </div>
</template>

<script setup lang="ts">
import { batchUpdateComponentPosition, deleteServerDetailComponent, getEnabledServerDetailComponents, getServerInfo, initDefaultComponentsForServerDetail, type ServerComponent, type ServerDisplayData } from "@/api/server";
import { message } from "@repo/utils";
import { ref, watch } from "vue";

// 导入组件
import GridLayoutEditor from "../../components/layout/GridLayoutEditor.vue";
import ComponentEditDialog from "./components/ComponentEditDialog.vue";
import ComponentManageDialog from "./components/ComponentManageDialog.vue";
import BarChartComponent from "./components/previews/BarPreview.vue";
import CardComponent from "./components/previews/CardPreview.vue";
import GaugeComponent from "./components/previews/GaugePreview.vue";
import LineChartComponent from "./components/previews/LinePreview.vue";
import PieChartComponent from "./components/previews/PiePreview.vue";
import TableComponent from "./components/previews/TablePreview.vue";

// 定义属�?
const props = defineProps<{
  serverId: number;
}>();

// 响应式状�?
const loading = ref(false);
const refreshLoading = ref(false);
const editMode = ref(false);
const serverInfo = ref<ServerDisplayData & any>();
const components = ref<ServerComponent[]>([]);
const layout = ref<any[]>([]);

// 引用
const componentEditDialogRef = ref();
const componentManageDialogRef = ref();
const gridLayoutEditorRef = ref();

// 组件类型映射
const componentTypeMap = {
  card: CardComponent,
  gauge: GaugeComponent,
  line: LineChartComponent,
  bar: BarChartComponent,
  pie: PieChartComponent,
  table: TableComponent,
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
  const iconMap: Record<string, string> = {
    SSH: "ri:terminal-line",
    RDP: "ri:computer-line",
    VNC: "ri:remote-control-line",
    HTTP: "ri:global-line",
    HTTPS: "ri:shield-line",
  };
  return iconMap[protocol || ""] || "ri:server-line";
};

/**
 * 获取状态类�?
 */
const getStatusType = (status?: string): any => {
  const typeMap: Record<string, string> = {
    ONLINE: "success",
    OFFLINE: "danger",
    ERROR: "warning",
  };
  return typeMap[status || ""] || "info";
};

/**
 * 获取状态文�?
 */
const getStatusText = (status?: string) => {
  const textMap: Record<string, string> = {
    ONLINE: "在线",
    OFFLINE: "离线",
    ERROR: "错误",
  };
  return textMap[status || ""] || "未知";
};

/**
 * 加载服务器信�?
 */
const loadServerInfo = async () => {
  try {
    const res = await getServerInfo(String(props.serverId));
    if (res.code === "00000") {
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
    const res = await getEnabledServerDetailComponents(props.serverId);
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

/**
 * 刷新数据
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
 * 初始化默认组�?
 */
const handleInitDefaultComponents = async () => {
  try {
    loading.value = true;
    const res = await initDefaultComponentsForServerDetail(props.serverId);
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
 * 管理组件
 */
const handleManageComponents = () => {
  componentManageDialogRef.value?.open();
};

/**
 * 切换编辑模式
 */
const toggleEditMode = async () => {
  if (editMode.value) {
    // 保存布局
    await handleSaveLayout();
  }
  editMode.value = !editMode.value;
};

/**
 * 保存布局
 */
const handleSaveLayout = async () => {
  try {
    const layoutData = layout.value.map((item) => ({
      componentId: Number(item.i),
      position: JSON.stringify({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }),
    }));

    const res = await batchUpdateComponentPosition(props.serverId, layoutData as any);
    if (res.code === "00000") {
      message.success("布局保存成功");
    } else {
      message.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存布局失败:", error);
    message.error("保存失败");
  }
};

/**
 * 布局更新
 */
const handleLayoutUpdated = (newLayout: any[]) => {
  layout.value = newLayout;
};

/**
 * 编辑组件
 */
const handleComponentEdit = (component: ServerComponent) => {
  componentEditDialogRef.value?.open("edit", component);
};

/**
 * 删除组件
 */
const handleComponentDelete = async (componentId: number) => {
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
 * 组件刷新
 */
const handleComponentRefresh = (componentId: number) => {
  console.log("刷新组件:", componentId);
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

// 监听服务器ID变化
watch(
  () => props.serverId,
  (newServerId) => {
    if (newServerId) {
      loadServerInfo();
      loadComponents();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.server-detail-components {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
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

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.components-container {
  flex: 1;
  padding: 20px;
  overflow: auto;

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }
}
</style>
