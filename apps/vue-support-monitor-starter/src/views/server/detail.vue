<template>
  <div class="server-detail-page system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="primary" plain @click="goBack" class="back-btn" circle>
          <IconifyIconOnline icon="ri:arrow-left-line" />
        </el-button>
        <div class="divider-vertical"></div>
        <div class="server-info">
          <div class="server-title">
            <div class="server-icon-wrapper">
              <IconifyIconOnline
                :icon="getProtocolIcon(serverInfo?.protocol)"
                class="server-icon"
              />
            </div>
            <div class="server-title-content">
              <h1 class="server-name">
                {{ serverInfo?.name || "服务器详情" }}
              </h1>
              <el-tag
                :type="getStatusType(serverInfo?.status)"
                size="small"
                class="status-tag"
                effect="dark"
              >
                <IconifyIconOnline
                  :icon="getStatusIcon(serverInfo?.status)"
                  class="status-icon"
                />
                {{ getStatusText(serverInfo?.status) }}
              </el-tag>
            </div>
          </div>
          <div class="server-meta">
            <div class="meta-item">
              <IconifyIconOnline icon="ri:server-line" class="meta-icon" />
              <span>{{ serverInfo?.host }}:{{ serverInfo?.port }}</span>
            </div>
            <div class="meta-divider">•</div>
            <div class="meta-item">
              <IconifyIconOnline icon="ri:settings-3-line" class="meta-icon" />
              <span>{{ serverInfo?.protocol }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- 主要操作组 -->
        <div class="action-group primary-actions">
          <el-button
            type="success"
            @click="handleRefresh"
            :loading="refreshLoading"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button
            type="primary"
            @click="handleAddComponent"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加组件
          </el-button>
        </div>
        <div class="divider-vertical"></div>
        <!-- 工具操作组 -->
        <div class="action-group tool-actions">
          <el-button
            type="info"
            @click="handleFileManager"
            plain
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
            文件管理
          </el-button>
          <el-button
            type="warning"
            @click="handleManageComponents"
            plain
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
            管理组件
          </el-button>
        </div>
        <div class="divider-vertical"></div>
        <!-- 配置操作组 -->
        <div class="action-group config-actions">
          <el-button
            @click="handleComponentConfig"
            plain
            class="action-btn"
            title="组件配置"
          >
            <IconifyIconOnline icon="ri:dashboard-line" />
          </el-button>
          <el-button
            @click="handleLayoutConfig"
            plain
            class="action-btn"
            title="布局配置"
          >
            <IconifyIconOnline icon="ri:layout-grid-line" />
          </el-button>
        </div>
        <div class="divider-vertical"></div>
        <!-- 视图切换 -->
        <el-button
          :type="editMode ? 'success' : 'default'"
          @click="toggleEditMode"
          :plain="!editMode"
          class="action-btn view-toggle"
        >
          <IconifyIconOnline
            :icon="editMode ? 'ri:eye-line' : 'ri:edit-line'"
            class="mr-1"
          />
          {{ editMode ? "预览" : "编辑" }}
        </el-button>
      </div>
    </div>

    <!-- 组件网格布局 -->
    <div class="components-container" v-loading="loading">
      <GridLayoutEditor
        ref="gridLayoutEditorRef"
        :layout="layout"
        :edit-mode="editMode"
        @layout-updated="handleLayoutUpdated"
      >
        <template #component="{ item }">
          <component
            :is="getComponentType(item.componentType)"
            :component-data="item"
            :server-id="serverId"
            :edit-mode="editMode"
            @delete="handleDeleteComponent"
            @edit="handleEditComponent"
            @refresh="handleRefreshComponent"
          />
        </template>
      </GridLayoutEditor>
    </div>

    <!-- 编辑模式工具栏 -->
    <transition name="toolbar-slide">
      <div v-if="editMode" class="edit-toolbar">
        <div class="toolbar-content">
          <div class="toolbar-info">
            <div class="edit-badge">
              <IconifyIconOnline icon="ri:edit-line" class="badge-icon" />
              <span>编辑模式</span>
            </div>
            <span class="edit-tip">
              <IconifyIconOnline icon="ri:information-line" class="tip-icon" />
              可拖拽调整组件位置和大小
            </span>
          </div>
          <div class="toolbar-actions">
            <el-button @click="handleCancelEdit" class="cancel-btn">
              取消
            </el-button>
            <el-button
              type="primary"
              @click="handleSaveLayout"
              class="save-btn"
            >
              <IconifyIconOnline icon="ri:save-line" class="mr-1" />
              保存布局
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 组件编辑对话框 -->
    <ComponentEditDialog
      ref="componentEditDialogRef"
      @success="handleComponentSaved"
    />

    <!-- 组件管理对话框 -->
    <ComponentManageDialog
      ref="componentManageDialogRef"
      @success="handleComponentsManaged"
    />

    <!-- 文件管理对话框 -->
    <sc-dialog
      v-model="fileManagerVisible"
      title="文件管理"
      width="90%"
      :before-close="handleFileManagerClose"
      append-to-body
      destroy-on-close
    >
      <FileManager :server="serverInfo" @close="handleFileManagerClose" />
    </sc-dialog>

    <!-- 组件配置对话框 -->
    <ComponentConfigDialog
      ref="componentConfigDialogRef"
      :server-id="serverId"
      @success="handleComponentConfigSuccess"
    />

    <!-- 布局配置对话框 -->
    <LayoutConfigDialog
      ref="layoutConfigDialogRef"
      @apply="handleApplyLayoutTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import {
  batchUpdateComponentPosition,
  deleteServerDetailComponent,
  getEnabledServerDetailComponents,
  getServerInfo,
  initDefaultComponentsForServerDetail,
  type ServerComponent,
  type ServerDisplayData,
} from "@/api/server";
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

// 响应式状态
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

// 文件管理对话框状态
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
  return (
    componentTypeMap[type as keyof typeof componentTypeMap] || CardComponent
  );
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
 * 获取状态类型
 */
const getStatusType = (
  status?: number
): "success" | "info" | "warning" | "danger" => {
  const typeMap: Record<number, "success" | "info" | "warning" | "danger"> = {
    0: "info",
    1: "success",
    2: "warning",
    3: "danger",
  };
  return typeMap[status as keyof typeof typeMap] || "info";
};

/**
 * 获取状态文本
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
 * 获取状态图标
 */
const getStatusIcon = (status?: number) => {
  const iconMap = {
    0: "ri:question-line",
    1: "ri:checkbox-circle-line",
    2: "ri:close-circle-line",
    3: "ri:error-warning-line",
  };
  return iconMap[status as keyof typeof iconMap] || "ri:question-line";
};

/**
 * 返回上一页
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
 * 关闭文件管理对话框
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
};

/**
 * 初始化默认组件
 */
const handleInitDefaultComponents = async () => {
  try {
    loading.value = true;
    const res = await initDefaultComponentsForServerDetail(serverId.value);
    if (res.code === "00000") {
      message.success("初始化默认组件成功");
      await loadComponents();
    } else {
      message.error(res.msg || "初始化失败");
    }
  } catch (error) {
    console.error("初始化默认组件失败:", error);
    message.error("初始化失败");
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
    // 将布局信息映射回组件数据
    const updatedComponents = components.value.map((component) => {
      const layoutItem = layout.value.find(
        (item) => item.i === String(component.monitorSysGenServerComponentId)
      );
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

    const res = await batchUpdateComponentPosition(
      serverId.value,
      updatedComponents
    );
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
  message.success("组件配置已保存");
};

/**
 * 应用布局模板
 */
const handleApplyLayoutTemplate = (template: any) => {
  if (template?.config?.layout) {
    layout.value = template.config.layout;
    message.success("布局模板已应用");
  }
};

/**
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  try {
    const res = await getServerInfo(String(serverId.value));
    if (res.code === "00000") {
      //@ts-ignore
      serverInfo.value = res.data;
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
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
            position = JSON.parse(
              component.monitorSysGenServerComponentPosition
            );
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

// 页面初始化
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
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 2px 16px rgba(0, 0, 0, 0.04),
    0 1px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.2),
      transparent
    );
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    min-width: 0;

    .back-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      flex-shrink: 0;
      transition: all 0.2s ease;

      &:hover {
        transform: translateX(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      }
    }

    .divider-vertical {
      width: 1px;
      height: 32px;
      background: linear-gradient(
        180deg,
        transparent,
        rgba(0, 0, 0, 0.1),
        transparent
      );
      flex-shrink: 0;
    }

    .server-info {
      flex: 1;
      min-width: 0;

      .server-title {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;

        .server-icon-wrapper {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.1),
            rgba(168, 85, 247, 0.1)
          );
          border-radius: 12px;
          flex-shrink: 0;
          transition: all 0.3s ease;

          .server-icon {
            font-size: 24px;
            color: var(--el-color-primary);
            transition: transform 0.3s ease;
          }
        }

        &:hover .server-icon-wrapper {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);

          .server-icon {
            transform: rotate(5deg);
          }
        }

        .server-title-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;

          .server-name {
            font-size: 22px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            margin: 0;
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: -0.02em;
          }

          .status-tag {
            flex-shrink: 0;
            border-radius: 12px;
            padding: 4px 12px;
            font-weight: 500;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;

            .status-icon {
              font-size: 14px;
            }
          }
        }
      }

      .server-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 4px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--el-text-color-regular);
          font-weight: 500;

          .meta-icon {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }

        .meta-divider {
          color: var(--el-text-color-placeholder);
          font-size: 12px;
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    .divider-vertical {
      width: 1px;
      height: 32px;
      background: linear-gradient(
        180deg,
        transparent,
        rgba(0, 0, 0, 0.1),
        transparent
      );
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition:
          width 0.3s ease,
          height 0.3s ease;
      }

      &:hover::before {
        width: 200px;
        height: 200px;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .view-toggle {
      font-weight: 600;
      padding: 10px 20px;
    }

    .primary-actions .action-btn {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
}

.components-container {
  flex: 1;
  padding: 32px 40px;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  .grid-layout {
    min-height: calc(100vh - 200px);
  }

  .grid-item {
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.06),
      0 2px 4px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(
        90deg,
        rgba(99, 102, 241, 0.6),
        rgba(168, 85, 247, 0.6)
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.12),
        0 4px 12px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transform: translateY(-4px) scale(1.01);
      border-color: rgba(99, 102, 241, 0.2);

      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(-2px) scale(1);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    color: var(--el-text-color-placeholder);
    gap: 16px;

    .empty-icon {
      font-size: 64px;
      opacity: 0.3;
    }

    .empty-text {
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.edit-toolbar {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;

  .toolbar-content {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 18px 32px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-radius: 40px;
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        rgba(99, 102, 241, 0.6),
        rgba(168, 85, 247, 0.6),
        rgba(99, 102, 241, 0.6)
      );
      border-radius: 40px 40px 0 0;
    }

    &:hover {
      box-shadow:
        0 16px 56px rgba(0, 0, 0, 0.2),
        0 6px 20px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 1);
      transform: translateY(-2px);
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 16px;

      .edit-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: linear-gradient(
          135deg,
          rgba(99, 102, 241, 0.1),
          rgba(168, 85, 247, 0.1)
        );
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        color: var(--el-color-primary);
        border: 1px solid rgba(99, 102, 241, 0.2);

        .badge-icon {
          font-size: 16px;
        }
      }

      .edit-tip {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-regular);

        .tip-icon {
          font-size: 16px;
          color: var(--el-color-info);
        }
      }
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;

      .cancel-btn,
      .save-btn {
        border-radius: 24px;
        padding: 10px 24px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition:
            width 0.4s ease,
            height 0.4s ease;
        }

        &:hover::before {
          width: 300px;
          height: 300px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .save-btn {
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          rgba(168, 85, 247, 0.9)
        );
        border: none;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);

        &:hover {
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
      }
    }
  }
}

// 工具栏动画
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toolbar-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

// 响应式设计
@media (max-width: 1200px) {
  .page-header {
    padding: 20px 24px;

    .header-left {
      gap: 16px;

      .server-info .server-title .server-title-content .server-name {
        font-size: 20px;
      }
    }

    .header-right {
      gap: 12px;

      .action-group {
        gap: 6px;
      }

      .action-btn {
        padding: 8px 14px;
        font-size: 13px;
      }
    }
  }

  .components-container {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;

    .header-left {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .back-btn {
        align-self: flex-start;
      }

      .divider-vertical {
        display: none;
      }

      .server-info {
        width: 100%;

        .server-title {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .server-title-content {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      }
    }

    .header-right {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;

      .divider-vertical {
        display: none;
      }

      .action-group {
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }

      .action-btn {
        flex: 1;
        min-width: 100px;
        max-width: 140px;
      }

      .view-toggle {
        width: 100%;
        max-width: none;
      }
    }
  }

  .components-container {
    padding: 16px;
  }

  .edit-toolbar {
    bottom: 16px;
    left: 16px;
    right: 16px;
    transform: none;

    .toolbar-content {
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border-radius: 24px;

      .toolbar-info {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .edit-tip {
          width: 100%;
          text-align: left;
        }
      }

      .toolbar-actions {
        width: 100%;
        justify-content: stretch;

        .cancel-btn,
        .save-btn {
          flex: 1;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 12px 16px;

    .header-left .server-info .server-title .server-title-content .server-name {
      font-size: 18px;
    }
  }

  .components-container {
    padding: 12px;
  }
}
</style>
