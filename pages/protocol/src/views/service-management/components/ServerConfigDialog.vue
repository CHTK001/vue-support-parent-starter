<template>
  <sc-dialog
    v-model="dialogVisible"
    title="服务配置"
    width="1200px"
    :close-on-click-modal="false"
    class="server-config-dialog"
    @close="handleClose"
  >
    <div class="config-container">
      <!-- 左侧：可用的 Filter -->
      <div class="panel available-panel">
        <div class="panel-header">
          <div class="panel-title">
            <div class="title-icon available-icon">
              <el-icon :size="22"><Grid /></el-icon>
            </div>
            <div class="title-text">
              <h3>可用组件</h3>
              <span class="subtitle">点击安装到右侧列表</span>
            </div>
          </div>
          <div class="panel-actions">
            <el-tag type="info" size="small" effect="plain" round>
              {{ availableFilters.length }} 个可用
            </el-tag>
            <el-tooltip content="刷新列表" placement="top">
              <el-button
                type="primary"
                circle
                @click="refreshAvailableFilters"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <el-scrollbar v-loading="availableLoading" class="panel-content">
          <div class="filter-list">
            <div
              v-for="(filter, index) in availableFilters"
              :key="filter.type"
              class="filter-card available-card"
            >
              <div class="card-index">{{ index + 1 }}</div>
              <div class="card-body">
                <div class="card-header">
                  <span class="card-name">{{
                    filter.describe || filter.name
                  }}</span>
                  <span class="card-type">{{
                    filter.describe ? filter.name : filter.describeType
                  }}</span>
                </div>
                <div v-if="filter.describeDetail" class="card-desc">
                  {{ filter.describeDetail }}
                </div>
              </div>
              <div class="card-action">
                <el-button
                  type="primary"
                  :loading="installLoading[filter.type]"
                  @click="installFilter(filter)"
                >
                  <el-icon class="btn-icon"><Plus /></el-icon>
                  安装
                </el-button>
              </div>
            </div>
          </div>

          <el-empty
            v-if="!availableLoading && availableFilters.length === 0"
            description="暂无可用的组件"
            :image-size="80"
          />
        </el-scrollbar>
      </div>

      <!-- 右侧：已安装的 Filter -->
      <div class="panel installed-panel">
        <div class="panel-header">
          <div class="panel-title">
            <div class="title-icon installed-icon">
              <el-icon :size="22"><Files /></el-icon>
            </div>
            <div class="title-text">
              <h3>已安装</h3>
              <span class="subtitle">拖拽调整执行顺序</span>
            </div>
          </div>
          <div class="panel-actions">
            <el-tag type="success" size="small" effect="plain" round>
              {{ installedFilters.length }} 个已装
            </el-tag>
            <el-tooltip content="刷新列表" placement="top">
              <el-button  circle @click="refreshInstalledFilters">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button
              circle
              type="primary"
              :loading="saveLoading"
              @click="saveOrder"
              :icon="Check"
            >
            </el-button>
          </div>
        </div>

        <el-scrollbar v-loading="installedLoading" class="panel-content">
          <draggable
            v-model="installedFilters"
            item-key="systemServerSettingId"
            handle=".drag-handle"
            class="filter-list"
            @end="handleDragEnd"
          >
            <template #item="{ element: filter, index }">
              <div
                class="filter-card installed-card"
                :class="{ 'is-disabled': !filter.systemServerSettingEnabled }"
                @dblclick="openConfigDialog(filter)"
              >
                <div class="drag-handle">
                  <el-icon :size="18"><Rank /></el-icon>
                </div>
                <div class="card-status">
                  <span
                    class="status-dot"
                    :class="
                      filter.systemServerSettingEnabled ? 'active' : 'inactive'
                    "
                  />
                </div>
                <div class="card-body">
                  <div class="card-header">
                    <span
                      class="card-name clickable"
                      @click="openConfigDialog(filter)"
                    >
                      {{ filter.systemServerSettingName }}
                    </span>
                    <el-tag
                      :type="
                        filter.systemServerSettingEnabled ? 'success' : 'info'
                      "
                      size="small"
                      effect="light"
                    >
                      {{
                        filter.systemServerSettingEnabled ? "已启用" : "已禁用"
                      }}
                    </el-tag>
                  </div>
                  <div class="card-meta">
                    <span class="meta-type">{{
                      filter.systemServerSettingType
                    }}</span>
                  </div>
                  <div
                    v-if="filter.systemServerSettingDescription"
                    class="card-desc"
                  >
                    {{ filter.systemServerSettingDescription }}
                  </div>
                </div>
                <div class="card-actions">
                  <el-tooltip
                    :content="
                      filter.systemServerSettingEnabled ? '禁用' : '启用'
                    "
                    placement="top"
                  >
                    <el-button
                      :type="
                        filter.systemServerSettingEnabled
                          ? 'warning'
                          : 'success'
                      "
                      circle
                      :loading="toggleLoading[filter.systemServerSettingId]"
                      @click="toggleFilterStatus(filter)"
                    >
                      <el-icon>
                        <VideoPause v-if="filter.systemServerSettingEnabled" />
                        <VideoPlay v-else />
                      </el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="配置" placement="top">
                    <el-button
                      circle
                      @click="openConfigDialog(filter)"
                    >
                      <el-icon><Setting /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="卸载" placement="top">
                    <el-button
                      type="danger"
                      circle
                      :loading="uninstallLoading[filter.systemServerSettingId]"
                      @click="uninstallFilter(filter)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </draggable>

          <el-empty
            v-if="!installedLoading && installedFilters.length === 0"
            description="暂无已安装的组件"
            :image-size="80"
          >
            <el-button
              type="primary"
              size="small"
              @click="refreshAvailableFilters"
            >
              <el-icon class="btn-icon"><ArrowLeft /></el-icon>
              从左侧选择安装
            </el-button>
          </el-empty>
        </el-scrollbar>
      </div>
    </div>

    <!-- Filter 配置对话框（动态组件） -->
    <component
      :is="activeFilterComponent"
      v-if="activeFilterComponent"
      v-model:visible="showFilterDialog"
      :server-id="props.serverId as number"
      :server="props.server"
      :filter-setting="currentFilterSetting"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          <el-icon class="btn-icon"><Close /></el-icon>
          关闭
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  Grid,
  Refresh,
  Plus,
  Files,
  Check,
  Rank,
  VideoPause,
  VideoPlay,
  Setting,
  Delete,
  ArrowLeft,
  Close,
} from "@element-plus/icons-vue";
import draggable from "vuedraggable";
import {
  getAvailableServletFilterObjects,
  getSystemServerSettingByServerId,
  installServletFilter,
  uninstallServletFilter,
  enableServletFilter,
  disableServletFilter,
  updateServletFilterOrder,
  applyConfigToRunningServer,
  type SystemServerSetting,
  type ServletFilterObject,
} from "@/api/system-server-setting";
import FilterConfigDialog from "./FilterConfigDialog.vue";
import FilterConfigFileStorage from "./FilterConfigFileStorage.vue";
import FilterConfigServiceDiscovery from "./FilterConfigServiceDiscovery.vue";
import FilterConfigIpRateLimit from "./FilterConfigIpRateLimit.vue";
import FilterConfigAddressRateLimit from "./FilterConfigAddressRateLimit.vue";
import FilterConfigQpsRateLimit from "./FilterConfigQpsRateLimit.vue";
import FilterConfigRequestFingerprint from "./FilterConfigRequestFingerprint.vue";
import FilterConfigDynamicExpression from "./FilterConfigDynamicExpression.vue";
import FilterConfigEnhancedProxy from "./FilterConfigEnhancedProxy.vue";
import FilterConfigProxyResponse from "./FilterConfigProxyResponse.vue";
import FilterConfigViewServlet from "./FilterConfigViewServlet.vue";
import { SystemServer } from "@/api/system-server";

/**
 * Filter 类型与配置组件的映射
 * 键：类型关键字（小写），值：对应的组件
 */
const FILTER_COMPONENT_MAP: Record<string, any> = {
  filestorage: FilterConfigFileStorage,
  servicediscovery: FilterConfigServiceDiscovery,
  ipratelimit: FilterConfigIpRateLimit,
  addressratelimit: FilterConfigAddressRateLimit,
  qpsratelimit: FilterConfigQpsRateLimit,
  requestfingerprint: FilterConfigRequestFingerprint,
  dynamicexpression: FilterConfigDynamicExpression,
  enhancedproxy: FilterConfigEnhancedProxy,
  proxyresponse: FilterConfigProxyResponse,
  viewservlet: FilterConfigViewServlet,
};

const isFirewallType = (type?: string) => {
  return (type || "").toUpperCase().includes("FIREWALL");
};

// Props
interface Props {
  visible: boolean;
  serverId?: number | null;
  server?: SystemServer;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  serverId: null,
  server: undefined,
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const availableLoading = ref(false);
const installedLoading = ref(false);
const saveLoading = ref(false);
const installLoading = ref<Record<string, boolean>>({});
const uninstallLoading = ref<Record<number, boolean>>({});
const toggleLoading = ref<Record<number, boolean>>({});

const availableFilters = ref<ServletFilterObject[]>([]);
const installedFilters = ref<SystemServerSetting[]>([]);

// Filter 配置对话框状态（统一管理）
const showFilterDialog = ref(false);
const activeFilterComponent = shallowRef<any>(null);
const currentFilterSetting = ref<SystemServerSetting | null>(null);

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const normalizeInstalledFilters = (
  raw: unknown,
): SystemServerSetting[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (item): item is SystemServerSetting =>
        !!item &&
        typeof item === "object" &&
        (item as SystemServerSetting).systemServerSettingId != null,
    )
    .map((item) => ({
      ...item,
      systemServerSettingEnabled: !!item.systemServerSettingEnabled,
    }));
};

const extractInstalledFiltersPayload = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const payload = raw as Record<string, unknown>;
  if (Array.isArray(payload.records)) {
    return payload.records;
  }
  if (Array.isArray(payload.list)) {
    return payload.list;
  }
  return [];
};

const resolveServerTypeCandidates = (rawServerType?: string): string[] => {
  const upper = (rawServerType || "").trim().toUpperCase();
  if (!upper) {
    return [];
  }
  if (upper === "HTTPD") {
    return ["HTTP"];
  }
  if (
    upper === "HTTP-PROXY" ||
    upper === "HTTP-PROXY-SERVER" ||
    upper === "HTTPPROXY" ||
    upper === "PROXY-HTTP"
  ) {
    return ["HTTP-PROXY"];
  }
  if (upper === "NETTY-HTTP-PROXY") {
    return ["NETTY-HTTP-PROXY", "HTTP-PROXY"];
  }
  if (upper === "SOCK5" || upper === "SOCKS" || upper === "SOCKS5-PROXY") {
    return ["SOCKS5"];
  }
  if (upper === "NETTY-SOCKS5") {
    return ["NETTY-SOCKS5", "SOCKS5"];
  }
  return [upper];
};

// 加载可用的ServletFilter
const loadAvailableFilters = async () => {
  availableLoading.value = true;
  try {
    const response = await getAvailableServletFilterObjects(
      props.serverId ?? undefined,
    );
    if (response.success) {
      const typeCandidates = resolveServerTypeCandidates(
        props.server?.systemServerType,
      );
      availableFilters.value = response.data.filter((item) => {
        if (isFirewallType(item.name)) {
          return false;
        }
        if (!item.supportedTypes) {
          return true;
        }
        if (item.supportedTypes.length === 0) {
          return true;
        }
        const supportedTypes = item.supportedTypes
          .filter((it): it is string => !!it)
          .map((it) => it.toUpperCase());
        if (!supportedTypes.length || !typeCandidates.length) {
          return true;
        }
        return typeCandidates.some((candidate) =>
          supportedTypes.includes(candidate),
        );
      });
    } else {
      message(response.msg || "加载可用Filter失败", { type: "error" });
    }
  } catch (error) {
    console.error("加载可用Filter失败:", error);
    message("加载失败", { type: "error" });
  } finally {
    availableLoading.value = false;
  }
};

// 加载已安装的ServletFilter
const loadInstalledFilters = async () => {
  if (!props.serverId) return;
  installedLoading.value = true;
  try {
    const response = await getSystemServerSettingByServerId(props.serverId);
    if (response.success) {
      const rawItems = extractInstalledFiltersPayload(response.data);
      const normalized = normalizeInstalledFilters(rawItems);
      if (rawItems.length > 0 && normalized.length === 0) {
        message("已安装过滤器数据异常，请检查后端字段映射", {
          type: "warning",
        });
      }
      installedFilters.value = normalized.filter(
        (item) => !isFirewallType(item.systemServerSettingType),
      );
    } else {
      message(response.msg || "加载已安装Filter失败", { type: "error" });
    }
  } catch (error) {
    console.error("加载已安装Filter失败:", error);
    message("加载失败", { type: "error" });
  } finally {
    installedLoading.value = false;
  }
};

// 刷新可用Filter
const refreshAvailableFilters = () => {
  loadAvailableFilters();
};

// 刷新已安装Filter
const refreshInstalledFilters = () => {
  loadInstalledFilters();
};

// 安装Filter
const installFilter = async (filter: ServletFilterObject) => {
  if (!props.serverId) return;

  installLoading.value[filter.name] = true;
  try {
    const response = await installServletFilter(props.serverId, filter.name);

    if (response.success) {
      message("安装成功", { type: "success" });
      loadInstalledFilters();
    } else {
      message(response.msg || "安装失败", { type: "error" });
    }
  } catch (error) {
    console.error("安装Filter失败:", error);
    message("安装失败", { type: "error" });
  } finally {
    installLoading.value[filter.type] = false;
  }
};

// 卸载Filter
const uninstallFilter = async (filter: SystemServerSetting) => {
  try {
    await ElMessageBox.confirm(
      `确定要卸载 ${filter.systemServerSettingName} 吗？`,
      "确认卸载",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    uninstallLoading.value[filter.systemServerSettingId!] = true;

    const response = await uninstallServletFilter(
      filter.systemServerSettingId!,
    );
    if (response.success) {
      message("卸载成功", { type: "success" });
      loadInstalledFilters();
    } else {
      message(response.msg || "卸载失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("卸载Filter失败:", error);
      message("卸载失败", { type: "error" });
    }
  } finally {
    uninstallLoading.value[filter.systemServerSettingId!] = false;
  }
};

// 切换Filter状态
const toggleFilterStatus = async (filter: SystemServerSetting) => {
  toggleLoading.value[filter.systemServerSettingId!] = true;
  try {
    const apiCall = filter.systemServerSettingEnabled
      ? disableServletFilter
      : enableServletFilter;
    const response = await apiCall(filter.systemServerSettingId!);

    if (response.success) {
      message(filter.systemServerSettingEnabled ? "禁用成功" : "启用成功", {
        type: "success",
      });
      loadInstalledFilters();
    } else {
      message(response.msg || "操作失败", { type: "error" });
    }
  } catch (error) {
    console.error("切换Filter状态失败:", error);
    message("操作失败", { type: "error" });
  } finally {
    toggleLoading.value[filter.systemServerSettingId!] = false;
  }
};

// 拖拽结束处理
const handleDragEnd = () => {
  // 更新排序顺序
  installedFilters.value = normalizeInstalledFilters(installedFilters.value);
  installedFilters.value.forEach((filter, index) => {
    filter.systemServerSettingSortOrder = index + 1;
  });
};

// 保存排序
const saveOrder = async () => {
  if (!props.serverId) return;

  saveLoading.value = true;
  try {
    const filters = normalizeInstalledFilters(installedFilters.value);
    const settingOrders = filters.map((filter, index) => ({
      id: filter.systemServerSettingId!,
      sortOrder: index + 1,
    }));

    const response = await updateServletFilterOrder(
      props.serverId,
      settingOrders,
    );
    if (response.success) {
      message("排序保存成功", { type: "success" });
    } else {
      message(response.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存排序失败:", error);
    message("保存失败", { type: "error" });
  } finally {
    saveLoading.value = false;
  }
};

/**
 * 根据 Filter 类型获取对应的配置组件
 * @param filterType Filter 类型字符串
 */
const getFilterComponent = (filterType: string) => {
  const type = (filterType || "").toLowerCase();

  // 遍历映射表，查找匹配的组件
  for (const [key, component] of Object.entries(FILTER_COMPONENT_MAP)) {
    if (type.includes(key)) {
      return component;
    }
  }

  // 特殊处理：enhancedproxy 需要同时匹配 enhanced 和 proxy
  if (type.includes("enhanced") && type.includes("proxy")) {
    return FILTER_COMPONENT_MAP.enhancedproxy;
  }

  // 兜底：通用配置组件
  return FilterConfigDialog;
};

/**
 * 打开配置对话框（根据类型动态加载组件）
 */
const openConfigDialog = (filter: SystemServerSetting) => {
  currentFilterSetting.value = filter;
  activeFilterComponent.value = getFilterComponent(
    filter.systemServerSettingType || "",
  );
  showFilterDialog.value = true;
};

/**
 * 配置成功回调
 */
const handleConfigSuccess = () => {
  showFilterDialog.value = false;
  activeFilterComponent.value = null;
  currentFilterSetting.value = null;
  loadInstalledFilters();
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  emit("success");
};

// 初始化
onMounted(() => {
  if (props.visible && props.serverId) {
    loadAvailableFilters();
    loadInstalledFilters();
  }
});

// 监听对话框显示状态
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.serverId) {
      loadAvailableFilters();
      loadInstalledFilters();
    }
  },
);
</script>

<style lang="scss" scoped>
// 对话框样式
:deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .el-dialog__header {
    padding: 24px 28px;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-bottom: 1px solid #f1f5f9;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.025em;
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .el-dialog__footer {
    padding: 20px 28px;
    background: #ffffff;
    border-top: 1px solid #f1f5f9;
  }
}

.config-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 600px;
}

// 面板通用样式
.panel {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 
              0 2px 4px -2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 
                0 4px 6px -4px rgba(0, 0, 0, 0.05);
  }
}

.available-panel {
  border: 1px solid #e2e8f0;
}

.installed-panel {
  border: 1px solid #bbf7d0;
}

// 面板头部
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.available-panel .panel-header {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.installed-panel .panel-header {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 14px;

  .title-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    color: #ffffff;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    &.available-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    }

    &.installed-icon {
      background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }
  }

  .title-text {
    h3 {
      margin: 0 0 4px 0;
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.025em;
    }

    .subtitle {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

// 面板内容
.panel-content {
  flex: 1;
  padding: 20px;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// 卡片样式
.filter-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 20px -4px rgba(0, 0, 0, 0.1);
  }
}

// 可用卡片
.available-card {
  .card-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  &:hover {
    border-color: #93c5fd;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  }
}

// 已安装卡片
.installed-card {
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    cursor: move;
    color: #94a3b8;
    border-radius: 8px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    background: #f8fafc;

    &:hover {
      color: #3b82f6;
      background: #eff6ff;
    }
  }

  .card-status {
    flex-shrink: 0;

    .status-dot {
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transition: all 0.3s ease;

      &.active {
        background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
        box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
        animation: pulse-green 2s infinite;
      }

      &.inactive {
        background: #cbd5e1;
      }
    }
  }

  &:hover {
    border-color: #86efac;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  }

  &.is-disabled {
    opacity: 0.55;
    background: #f8fafc;
    border-style: dashed;
    border-color: #cbd5e1;

    &:hover {
      transform: none;
      box-shadow: none;
      background: #f8fafc;
    }
  }
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.7);
  }
}

.card-body {
  flex: 1;
  min-width: 0;

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    .card-name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      letter-spacing: -0.01em;

      &.clickable {
        cursor: pointer;
        color: #3b82f6;
        transition: all 0.2s ease;

        &:hover {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      }
    }

    .card-type {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 20px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
      font-weight: 500;
    }
  }

  .card-meta {
    margin-bottom: 6px;

    .meta-type {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 20px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
      font-weight: 500;
    }
  }

  .card-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.card-action,
.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tag) {
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  padding: 0 12px;
  height: 26px;
  line-height: 24px;
}

:deep(.el-empty) {
  padding: 40px 0;

  .el-empty__description {
    color: #64748b;
    font-weight: 500;
  }
}

:deep(.el-scrollbar) {
  .el-scrollbar__bar {
    &.is-vertical {
      width: 6px;
      right: 4px;
    }

    .el-scrollbar__thumb {
      background: #cbd5e1;
      border-radius: 3px;

      &:hover {
        background: #94a3b8;
      }
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .config-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .panel {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .panel-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filter-card {
    flex-wrap: wrap;

    .card-body {
      width: 100%;
      order: 2;
    }

    .card-action,
    .card-actions {
      order: 3;
      width: 100%;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      margin-top: 12px;
    }
  }
}
</style>
