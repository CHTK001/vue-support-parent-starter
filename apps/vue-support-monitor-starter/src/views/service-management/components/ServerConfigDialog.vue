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
        <div class="section-header">
          <h3>可用的ServletFilter</h3>
          <el-button
            type="primary"
            size="small"
            @click="refreshAvailableFilters"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </el-button>
        </div>

        <div class="filter-list thin-scrollbar" v-loading="availableLoading">
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
            description="暂无可用的ServletFilter"
          />
        </div>
      </div>

      <!-- 右侧：已安装的ServletFilter -->
      <div class="installed-filters">
        <div class="section-header">
          <h3>已安装的ServletFilter</h3>
          <div class="header-actions">
            <el-button size="small" @click="refreshInstalledFilters">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
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

        <div class="filter-list thin-scrollbar" v-loading="installedLoading">
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
            description="暂无已安装的ServletFilter"
          >
            <el-button type="primary" @click="refreshAvailableFilters">
              安装ServletFilter
            </el-button>
          </el-empty>
        </div>
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
  gap: 24px;
  height: 600px;
}

.available-filters,
.installed-filters {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.95) 0%,
    rgba(241, 245, 249, 0.9) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "";
      width: 4px;
      height: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  :deep(.el-button) {
    border-radius: 8px;
  }

  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
  }

  :deep(.el-button--success) {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    border: none;
  }
}

.filter-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: rgba(248, 250, 252, 0.5);

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(102, 126, 234, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  margin-bottom: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--item-accent, transparent);
    transition: width 0.3s ease;
  }

  &:last-child {
    margin-bottom: 0;
  }

  &.available {
    --item-accent: linear-gradient(180deg, #667eea 0%, #764ba2 100%);

    &:hover {
      border-color: rgba(102, 126, 234, 0.4);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);

      &::before {
        width: 5px;
      }
    }
  }

  &.installed {
    --item-accent: linear-gradient(180deg, #10b981 0%, #34d399 100%);

    &:hover {
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
      transform: translateY(-2px);

      &::before {
        width: 5px;
      }
    }

    &.disabled {
      opacity: 0.6;
      --item-accent: linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%);
    }
  }

  .drag-handle {
    cursor: move;
    color: #94a3b8;
    font-size: 18px;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }
  }

  .filter-info {
    flex: 1;
    min-width: 0;

    .filter-name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .filter-seq {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
        flex-shrink: 0;
      }
    }

    .filter-type {
      font-size: 11px;
      color: #64748b;
      background: linear-gradient(
        135deg,
        rgba(248, 250, 252, 0.9) 0%,
        rgba(241, 245, 249, 0.8) 100%
      );
      border: 1px solid rgba(226, 232, 240, 0.6);
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .filter-description {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }

    .filter-detail {
      margin-top: 6px;
      font-size: 12px;
      color: #94a3b8;

      .detail-icon {
        color: #94a3b8;
        font-size: 14px;
        cursor: help;
        margin-right: 4px;

        &:hover {
          color: #667eea;
        }
      }
    }
  }

  .filter-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    :deep(.el-button) {
      border-radius: 8px;
      font-weight: 500;
    }

    :deep(.el-button--primary) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
    }

    :deep(.el-button--success) {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      border: none;
    }

    :deep(.el-button--warning) {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      border: none;
    }

    :deep(.el-button--danger) {
      background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
      border: none;
    }
  }

  .filter-name-link {
    cursor: pointer;
    color: #667eea;
    transition: all 0.2s ease;

    &:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-empty) {
  padding: 40px 20px;
}

:deep(.el-tag--success) {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #059669;
}

:deep(.el-tag--info) {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.3);
  color: #475569;
}

@media (max-width: 1024px) {
  .config-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .available-filters,
  .installed-filters {
    height: 400px;
  }

  .filter-item {
    flex-wrap: wrap;

    .filter-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(226, 232, 240, 0.6);
    }
  }
}
</style>
