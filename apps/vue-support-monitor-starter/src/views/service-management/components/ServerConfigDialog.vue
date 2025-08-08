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

        <div class="filter-list" v-loading="availableLoading">
          <div
            v-for="filter in availableFilters"
            :key="filter.type"
            class="filter-item available"
          >
            <div class="filter-info">
              <div class="filter-name">{{ filter.name }}</div>
              <div class="filter-type">{{ filter.type }}</div>
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

        <div class="filter-list" v-loading="installedLoading">
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
              >
                <div class="drag-handle">
                  <IconifyIconOnline icon="ri:drag-move-line" />
                </div>

                <div class="filter-info">
                  <div class="filter-name">
                    {{ filter.systemServerSettingName }}
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

    <!-- Filter配置对话框 -->
    <FilterConfigDialog
      v-model:visible="showConfigDialog"
      :filter-setting="currentFilterSetting"
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

// Props
interface Props {
  visible: boolean;
  serverId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  serverId: null,
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
      availableFilters.value = response.data;
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
      installedFilters.value = response.data.sort(
        (a, b) =>
          (a.systemServerSettingSortOrder || 0) -
          (b.systemServerSettingSortOrder || 0)
      );
    } else {
      ElMessage.error(response.msg || "加载已安装Filter失败");
      erver / setting / objects;
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

  installLoading.value[filter.type] = true;
  try {
    const response = await installServletFilter(
      props.serverId,
      filter.type,
      filter.name,
      filter.description
    );

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

// 打开配置对话框
const openConfigDialog = (filter: SystemServerSetting) => {
  currentFilterSetting.value = filter;
  showConfigDialog.value = true;
};

// 配置成功回调
const handleConfigSuccess = () => {
  showConfigDialog.value = false;
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
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.filter-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  /* 统一的细滚动条样式 */
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 140, 140, 0.3);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);

    &:hover {
      background: rgba(140, 140, 140, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(140, 140, 140, 0);
    border-radius: 2px;
    box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &.available:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  }

  &.installed {
    &:hover {
      border-color: #67c23a;
      box-shadow: 0 2px 8px rgba(103, 194, 58, 0.1);
    }

    &.disabled {
      opacity: 0.6;
      background: #f5f7fa;
    }
  }

  .drag-handle {
    cursor: move;
    color: #909399;
    font-size: 16px;

    &:hover {
      color: #409eff;
    }
  }

  .filter-info {
    flex: 1;

    .filter-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-type {
      font-size: 12px;
      color: #909399;
      background: #f0f2f5;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .filter-description {
      font-size: 14px;
      color: #606266;
      line-height: 1.4;
    }

    .filter-detail {
      margin-top: 4px;

      .detail-icon {
        color: #909399;
        font-size: 14px;
        cursor: help;

        &:hover {
          color: #409eff;
        }
      }
    }
  }

  .filter-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
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
