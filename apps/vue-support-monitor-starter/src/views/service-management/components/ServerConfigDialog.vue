<template>
  <el-dialog
    v-model="dialogVisible"
    title="服务配置"
    width="1200px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="server-config-dialog"
  >
    <div class="config-container">
      <!-- 左侧：可用的 Filter -->
      <div class="panel available-panel">
        <div class="panel-header">
          <div class="panel-title">
            <div class="title-icon available-icon">
              <IconifyIconOnline icon="ri:apps-2-line" />
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
              <el-button type="primary" size="small" circle @click="refreshAvailableFilters">
                <IconifyIconOnline icon="ri:refresh-line" />
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <el-scrollbar class="panel-content" v-loading="availableLoading">
          <div class="filter-list">
            <div
              v-for="(filter, index) in availableFilters"
              :key="filter.type"
              class="filter-card available-card"
            >
              <div class="card-index">{{ index + 1 }}</div>
              <div class="card-body">
                <div class="card-header">
                  <span class="card-name">{{ filter.describe || filter.name }}</span>
                  <span class="card-type">{{ filter.describe ? filter.name : filter.describeType }}</span>
                </div>
                <div class="card-desc" v-if="filter.describeDetail">
                  {{ filter.describeDetail }}
                </div>
              </div>
              <div class="card-action">
                <el-button
                  type="primary"
                  size="small"
                  @click="installFilter(filter)"
                  :loading="installLoading[filter.type]"
                >
                  <IconifyIconOnline icon="ri:add-line" />
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
              <IconifyIconOnline icon="ri:stack-line" />
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
              <el-button size="small" circle @click="refreshInstalledFilters">
                <IconifyIconOnline icon="ri:refresh-line" />
              </el-button>
            </el-tooltip>
            <el-button type="success" size="small" @click="saveOrder" :loading="saveLoading">
              <IconifyIconOnline icon="ri:save-line" />
              保存排序
            </el-button>
          </div>
        </div>

        <el-scrollbar class="panel-content" v-loading="installedLoading">
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
                  <IconifyIconOnline icon="ri:drag-move-2-fill" />
                </div>
                <div class="card-status">
                  <span
                    class="status-dot"
                    :class="filter.systemServerSettingEnabled ? 'active' : 'inactive'"
                  ></span>
                </div>
                <div class="card-body">
                  <div class="card-header">
                    <span class="card-name clickable" @click="openConfigDialog(filter)">
                      {{ filter.systemServerSettingName }}
                    </span>
                    <el-tag
                      :type="filter.systemServerSettingEnabled ? 'success' : 'info'"
                      size="small"
                      effect="light"
                    >
                      {{ filter.systemServerSettingEnabled ? '已启用' : '已禁用' }}
                    </el-tag>
                  </div>
                  <div class="card-meta">
                    <span class="meta-type">{{ filter.systemServerSettingType }}</span>
                  </div>
                  <div class="card-desc" v-if="filter.systemServerSettingDescription">
                    {{ filter.systemServerSettingDescription }}
                  </div>
                </div>
                <div class="card-actions">
                  <el-tooltip :content="filter.systemServerSettingEnabled ? '禁用' : '启用'" placement="top">
                    <el-button
                      :type="filter.systemServerSettingEnabled ? 'warning' : 'success'"
                      size="small"
                      circle
                      @click="toggleFilterStatus(filter)"
                      :loading="toggleLoading[filter.systemServerSettingId]"
                    >
                      <IconifyIconOnline
                        :icon="filter.systemServerSettingEnabled ? 'ri:pause-fill' : 'ri:play-fill'"
                      />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="配置" placement="top">
                    <el-button size="small" circle @click="openConfigDialog(filter)">
                      <IconifyIconOnline icon="ri:settings-3-line" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="卸载" placement="top">
                    <el-button
                      type="danger"
                      size="small"
                      circle
                      @click="uninstallFilter(filter)"
                      :loading="uninstallLoading[filter.systemServerSettingId]"
                    >
                      <IconifyIconOnline icon="ri:delete-bin-line" />
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
            <el-button type="primary" size="small" @click="refreshAvailableFilters">
              <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
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
      :filter-setting="currentFilterSetting"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
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

// 加载可用的ServletFilter
const loadAvailableFilters = async () => {
  availableLoading.value = true;
  try {
    const response = await getAvailableServletFilterObjects();
    if (response.success) {
      availableFilters.value = response.data.filter((item) => {
        if (!item.supportedTypes) {
          return true;
        }
        if (item.supportedTypes.length === 0) {
          return true;
        }

        return item.supportedTypes.includes(
          props.server?.systemServerType?.toLocaleUpperCase()
        );
      });
    } else {
      ElMessage.error(response.msg || "加载可用Filter失败");
    }
  } catch (error) {
    console.error("加载可用Filter失败:", error);
    ElMessage.error("加载失败");
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
      installedFilters.value = response.data;
    } else {
      ElMessage.error(response.msg || "加载已安装Filter失败");
    }
  } catch (error) {
    console.error("加载已安装Filter失败:", error);
    ElMessage.error("加载失败");
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
      ElMessage.success("安装成功");
      loadInstalledFilters();
    } else {
      ElMessage.error(response.msg || "安装失败");
    }
  } catch (error) {
    console.error("安装Filter失败:", error);
    ElMessage.error("安装失败");
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
      }
    );

    uninstallLoading.value[filter.systemServerSettingId!] = true;

    const response = await uninstallServletFilter(
      filter.systemServerSettingId!
    );
    if (response.success) {
      ElMessage.success("卸载成功");
      loadInstalledFilters();
    } else {
      ElMessage.error(response.msg || "卸载失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("卸载Filter失败:", error);
      ElMessage.error("卸载失败");
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
      ElMessage.success(
        filter.systemServerSettingEnabled ? "禁用成功" : "启用成功"
      );
      loadInstalledFilters();
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (error) {
    console.error("切换Filter状态失败:", error);
    ElMessage.error("操作失败");
  } finally {
    toggleLoading.value[filter.systemServerSettingId!] = false;
  }
};

// 拖拽结束处理
const handleDragEnd = () => {
  // 更新排序顺序
  installedFilters.value.forEach((filter, index) => {
    filter.systemServerSettingSortOrder = index + 1;
  });
};

// 保存排序
const saveOrder = async () => {
  if (!props.serverId) return;

  saveLoading.value = true;
  try {
    const settingOrders = installedFilters.value.map((filter, index) => ({
      id: filter.systemServerSettingId!,
      sortOrder: index + 1,
    }));

    const response = await updateServletFilterOrder(
      props.serverId,
      settingOrders
    );
    if (response.success) {
      ElMessage.success("排序保存成功");
    } else {
      ElMessage.error(response.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存排序失败:", error);
    ElMessage.error("保存失败");
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
    filter.systemServerSettingType || ""
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
  }
);
</script>

<style lang="scss" scoped>
// 对话框样式
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 20px;
    background: var(--el-fill-color-lighter);
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.config-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 580px;
}

// 面板通用样式
.panel {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.available-panel {
  border: 1px solid var(--el-border-color-light);
}

.installed-panel {
  border: 1px solid var(--el-color-success-light-5);
}

// 面板头部
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.available-panel .panel-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
}

.installed-panel .panel-header {
  background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-bg-color) 100%);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 12px;

  .title-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    font-size: 20px;

    &.available-icon {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }

    &.installed-icon {
      background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.3);
    }
  }

  .title-text {
    h3 {
      margin: 0 0 2px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .subtitle {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

// 面板内容
.panel-content {
  flex: 1;
  padding: 16px;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 卡片样式
.filter-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
}

// 可用卡片
.available-card {
  .card-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

// 已安装卡片
.installed-card {
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: move;
    color: var(--el-text-color-placeholder);
    font-size: 16px;
    border-radius: 6px;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .card-status {
    flex-shrink: 0;

    .status-dot {
      display: block;
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.active {
        background: var(--el-color-success);
        box-shadow: 0 0 8px var(--el-color-success-light-3);
      }

      &.inactive {
        background: var(--el-text-color-placeholder);
      }
    }
  }

  &:hover {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }

  &.is-disabled {
    opacity: 0.6;
    background: var(--el-fill-color-light);
    border-style: dashed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.card-body {
  flex: 1;
  min-width: 0;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;

    .card-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      &.clickable {
        cursor: pointer;
        color: var(--el-color-primary);
        transition: color 0.2s ease;

        &:hover {
          color: var(--el-color-primary-light-3);
          text-decoration: underline;
        }
      }
    }

    .card-type {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color);
      padding: 2px 8px;
      border-radius: 10px;
      font-family: "SF Mono", "Monaco", "Consolas", monospace;
    }
  }

  .card-meta {
    margin-bottom: 4px;

    .meta-type {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color);
      padding: 2px 8px;
      border-radius: 10px;
      font-family: "SF Mono", "Monaco", "Consolas", monospace;
    }
  }

  .card-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
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
  gap: 6px;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

// 响应式
@media (max-width: 1024px) {
  .config-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .panel {
    height: 380px;
  }
}
</style>
