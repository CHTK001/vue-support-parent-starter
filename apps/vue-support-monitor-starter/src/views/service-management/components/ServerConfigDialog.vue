<template>
  <el-dialog
    v-model="dialogVisible"
    title="服务器配置"
    width="1200px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="config-container">
      <!-- 左侧：可用的ServletFilter -->
      <div class="available-filters">
        <div class="section-header available-header">
          <div class="header-title">
            <IconifyIconOnline icon="ri:apps-2-line" class="header-icon" />
            <h3>可用的 Filter</h3>
            <el-tag type="info" size="small" round>
              {{ availableFilters.length }}
            </el-tag>
          </div>
          <el-button
            type="primary"
            size="small"
            circle
            @click="refreshAvailableFilters"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </div>

        <el-scrollbar class="filter-scrollbar" v-loading="availableLoading">
          <div
            v-for="(filter, index) in availableFilters"
            :key="filter.type"
            class="filter-item available"
          >
            <div class="filter-info">
              <div class="filter-name">
                <span class="filter-seq"> {{ index + 1 }}</span>
                <span>
                  {{ filter.describe || filter.name }}
                </span>
                <span class="filter-type">
                  {{
                    filter.describe ? filter.name : filter.describeType
                  }}</span
                >
              </div>
              <div class="filter-detail" v-if="filter.describe">
                <el-tooltip :content="filter.describe" placement="top">
                  <el-icon class="detail-icon"> <InfoFilled /> </el-icon>
                </el-tooltip>
                {{ filter.describe }}
              </div>
            </div>
            <div class="filter-actions">
              <el-button
                type="primary"
                size="small"
                @click="installFilter(filter)"
                :loading="installLoading[filter.type]"
              >
                <IconifyIconOnline icon="ri:download-line" />
                安装
              </el-button>
            </div>
          </div>

          <el-empty
            v-if="!availableLoading && availableFilters.length === 0"
            description="暂无可用的 Filter"
          />
        </el-scrollbar>
      </div>

      <!-- 右侧：已安装的ServletFilter -->
      <div class="installed-filters">
        <div class="section-header installed-header">
          <div class="header-title">
            <IconifyIconOnline
              icon="ri:stack-line"
              class="header-icon installed-icon"
            />
            <h3>已安装</h3>
            <el-tag type="success" size="small" round>
              {{ installedFilters.length }}
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button size="small" circle @click="refreshInstalledFilters">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="saveOrder"
              :loading="saveLoading"
            >
              <IconifyIconOnline icon="ri:save-line" />
              保存排序
            </el-button>
          </div>
        </div>

        <el-scrollbar class="filter-scrollbar" v-loading="installedLoading">
          <draggable
            v-model="installedFilters"
            item-key="systemServerSettingId"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <template #item="{ element: filter }">
              <div
                class="filter-item installed"
                :class="{ disabled: !filter.systemServerSettingEnabled }"
                @dblclick="openConfigDialog(filter)"
              >
                <div class="drag-handle">
                  <IconifyIconOnline icon="ri:drag-move-line" />
                </div>

                <div class="filter-info">
                  <div class="filter-name">
                    <span
                      class="filter-name-link"
                      title="点击打开配置"
                      @click="openConfigDialog(filter)"
                    >
                      {{ filter.systemServerSettingName }}
                    </span>
                    <el-tag
                      :type="
                        filter.systemServerSettingEnabled ? 'success' : 'info'
                      "
                      size="small"
                    >
                      {{ filter.systemServerSettingEnabled ? "启用" : "禁用" }}
                    </el-tag>
                  </div>
                  <div class="filter-type">
                    {{ filter.systemServerSettingType }}
                  </div>
                  <div class="filter-description">
                    {{ filter.systemServerSettingDescription }}
                  </div>
                </div>

                <div class="filter-actions">
                  <el-button
                    :type="
                      filter.systemServerSettingEnabled ? 'warning' : 'success'
                    "
                    size="small"
                    @click="toggleFilterStatus(filter)"
                    :loading="toggleLoading[filter.systemServerSettingId]"
                  >
                    <IconifyIconOnline
                      :icon="
                        filter.systemServerSettingEnabled
                          ? 'ri:pause-line'
                          : 'ri:play-line'
                      "
                    />
                    {{ filter.systemServerSettingEnabled ? "禁用" : "启用" }}
                  </el-button>

                  <el-button size="small" @click="openConfigDialog(filter)">
                    <IconifyIconOnline icon="ri:settings-3-line" />
                    配置
                  </el-button>

                  <el-button
                    type="danger"
                    size="small"
                    @click="uninstallFilter(filter)"
                    :loading="uninstallLoading[filter.systemServerSettingId]"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    卸载
                  </el-button>
                </div>
              </div>
            </template>
          </draggable>

          <el-empty
            v-if="!installedLoading && installedFilters.length === 0"
            description="暂无已安装的 Filter"
          >
            <el-button type="primary" @click="refreshAvailableFilters">
              去安装
            </el-button>
          </el-empty>
        </el-scrollbar>
      </div>
    </div>

    <!-- Filter配置对话框（通用+专用） -->
    <FilterConfigDialog
      v-model:visible="showConfigDialog"
      :filter-setting="currentFilterSetting"
      @success="handleConfigSuccess"
    />
    <FilterConfigFileStorage
      v-model:visible="showFileStorageDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigServiceDiscovery
      v-model:visible="showServiceDiscoveryDialog"
      :server-id="props.serverId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigIpRateLimit
      v-model:visible="showIpRateLimitDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigAddressRateLimit
      v-model:visible="showAddressRateLimitDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigQpsRateLimit
      v-model:visible="showQpsRateLimitDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigRequestFingerprint
      v-model:visible="showRequestFingerprintDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigDynamicExpression
      v-model:visible="showDynamicExprDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigEnhancedProxy
      v-model:visible="showEnhancedProxyDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigProxyResponse
      v-model:visible="showProxyResponseDialog"
      :server-id="props.serverId as number"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />
    <FilterConfigViewServlet
      v-model:visible="showViewServletDialog"
      :filter-setting-id="currentFilterSetting?.systemServerSettingId as number"
      @success="handleConfigSuccess"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
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
import FilterConfigItemDialog from "./FilterConfigItemDialog.vue";
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

// Props
interface Props {
  visible: boolean;
  serverId?: number | null;
  server?: SystemServer;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  serverId: null,
  server: {} as SystemServer,
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

const showConfigDialog = ref(false);
const showFileStorageDialog = ref(false);
const showServiceDiscoveryDialog = ref(false);
const showIpRateLimitDialog = ref(false);
const showAddressRateLimitDialog = ref(false);
const showQpsRateLimitDialog = ref(false);
const showRequestFingerprintDialog = ref(false);
const showDynamicExprDialog = ref(false);
const showEnhancedProxyDialog = ref(false);
const showProxyResponseDialog = ref(false);
const showViewServletDialog = ref(false);
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

// 打开配置对话框（根据类型分发到专用页面）
const openConfigDialog = (filter: SystemServerSetting) => {
  currentFilterSetting.value = filter;
  // 先关闭全部
  showConfigDialog.value = false;
  showFileStorageDialog.value = false;
  showServiceDiscoveryDialog.value = false;
  showIpRateLimitDialog.value = false;
  showAddressRateLimitDialog.value = false;
  showQpsRateLimitDialog.value = false;
  showRequestFingerprintDialog.value = false;
  showDynamicExprDialog.value = false;
  showEnhancedProxyDialog.value = false;
  showProxyResponseDialog.value = false;
  showViewServletDialog.value = false;

  const type = (filter.systemServerSettingType || "").toLowerCase();

  if (type.includes("filestorage")) {
    showFileStorageDialog.value = true;
    return;
  }
  if (type.includes("servicediscovery")) {
    showServiceDiscoveryDialog.value = true;
    return;
  }
  if (type.includes("ipratelimit")) {
    showIpRateLimitDialog.value = true;
    return;
  }
  if (type.includes("addressratelimit")) {
    showAddressRateLimitDialog.value = true;
    return;
  }
  if (type.includes("qpsratelimit")) {
    showQpsRateLimitDialog.value = true;
    return;
  }
  if (type.includes("requestfingerprint")) {
    showRequestFingerprintDialog.value = true;
    return;
  }
  if (type.includes("dynamicexpression")) {
    showDynamicExprDialog.value = true;
    return;
  }
  if (type.includes("enhanced") && type.includes("proxy")) {
    showEnhancedProxyDialog.value = true;
    return;
  }
  if (type.includes("proxy") && type.includes("response")) {
    showProxyResponseDialog.value = true;
    return;
  }
  if (type.includes("view")) {
    showViewServletDialog.value = true;
    return;
  }

  // 兜底：通用配置
  showConfigDialog.value = true;
};

// 配置成功回调（统一收口）
const handleConfigSuccess = () => {
  showConfigDialog.value = false;
  showFileStorageDialog.value = false;
  showServiceDiscoveryDialog.value = false;
  showIpRateLimitDialog.value = false;
  showAddressRateLimitDialog.value = false;
  showQpsRateLimitDialog.value = false;
  showRequestFingerprintDialog.value = false;
  showDynamicExprDialog.value = false;
  showEnhancedProxyDialog.value = false;
  showProxyResponseDialog.value = false;
  showViewServletDialog.value = false;
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
.config-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 600px;
}

.available-filters,
.installed-filters {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

// 可用Filter区域
.available-filters {
  border: 1px solid #e0e6ed;
}

// 已安装区域
.installed-filters {
  border: 1px solid #d4edda;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e4e7ed;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-icon {
    font-size: 20px;
    color: #409eff;
  }

  .installed-icon {
    color: #67c23a;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

// 可用区域标题背景
.available-header {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0fa 100%);
}

// 已安装区域标题背景
.installed-header {
  background: linear-gradient(135deg, #f0fff4 0%, #e6f7ed 100%);
}

.filter-scrollbar {
  flex: 1;
  padding: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  transition: all 0.25s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &.available {
    &:hover {
      border-color: #a0cfff;
      background: linear-gradient(135deg, #f5faff 0%, #eef5ff 100%);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
      transform: translateY(-1px);
    }
  }

  &.installed {
    &:hover {
      border-color: #95d475;
      background: linear-gradient(135deg, #f5fff7 0%, #eef9f0 100%);
      box-shadow: 0 4px 12px rgba(103, 194, 58, 0.12);
      transform: translateY(-1px);
    }

    &.disabled {
      opacity: 0.55;
      background: #fafafa;
      border-style: dashed;
    }
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    cursor: move;
    color: #909399;
    font-size: 16px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }
  }

  .filter-info {
    flex: 1;
    min-width: 0;

    .filter-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      // 美化序号
      .filter-seq {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        border-radius: 6px;
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
        user-select: none;
      }
    }

    .filter-type {
      font-size: 11px;
      color: #606266;
      background: linear-gradient(135deg, #f0f2f5 0%, #e8eaed 100%);
      padding: 3px 10px;
      border-radius: 10px;
      display: inline-block;
      margin-bottom: 6px;
      font-family: "SF Mono", "Monaco", "Consolas", monospace;
    }

    .filter-description {
      font-size: 13px;
      color: #909399;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .filter-detail {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 4px;

      .detail-icon {
        color: #c0c4cc;
        font-size: 14px;
        cursor: help;
        transition: color 0.2s ease;

        &:hover {
          color: #409eff;
        }
      }
    }
  }

  .filter-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .filter-name-link {
    cursor: pointer;
    color: #409eff;
    transition: all 0.2s ease;

    &:hover {
      color: #66b1ff;
      text-decoration: underline;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式
@media (max-width: 1024px) {
  .config-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .available-filters,
  .installed-filters {
    height: 400px;
  }
}
</style>
