<template>
  <sc-dialog
    v-model="visibleInner"
    title="视图查看器配置"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="viewer-config-container">
      <!-- 说明信息 -->
      <el-alert type="info" :closable="false" class="tip-alert">
        <template #title>
          <span
            >视图查看器用于处理文件预览，通过 SPI
            机制动态加载。启用或禁用查看器后将立即热应用到运行中的服务器。</span
          >
        </template>
      </el-alert>

      <!-- 查看器列表 -->
      <div class="viewer-list">
        <div
          v-for="viewer in viewerList"
          :key="viewer.name"
          class="viewer-item"
          :class="{ disabled: !viewer.enabled }"
        >
          <div class="viewer-header">
            <div class="viewer-info">
              <ScSwitch
                v-model="viewer.enabled"
                size="small"
                @change="handleViewerToggle(viewer)"
              />
              <span class="viewer-name">{{ viewer.name }}</span>
              <el-tag size="small" type="info"
                >优先级: {{ viewer.priority }}</el-tag
              >
              <el-tag
                size="small"
                :type="viewer.enabled ? 'success' : 'danger'"
              >
                {{ viewer.enabled ? "已启用" : "已禁用" }}
              </el-tag>
            </div>
            <div class="viewer-actions">
              <el-tooltip
                :content="viewer.enabled ? '禁用此查看器' : '启用此查看器'"
              >
                <el-button
                  :type="viewer.enabled ? 'danger' : 'success'"
                  size="small"
                  text
                  @click="handleViewerToggle(viewer)"
                >
                  <IconifyIconOnline
                    :icon="
                      viewer.enabled
                        ? 'ri:close-circle-line'
                        : 'ri:checkbox-circle-line'
                    "
                  />
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="viewer-body">
            <div class="viewer-desc">{{ viewer.description }}</div>
            <!-- OnlyOffice 服务器配置 -->
            <div v-if="isOnlyOfficeViewer(viewer)" class="onlyoffice-config">
              <el-alert
                type="warning"
                :closable="false"
                class="server-warning"
                show-icon
              >
                <template #title>
                  <span>此查看器需要部署 OnlyOffice Document Server 才能使用</span>
                </template>
              </el-alert>
              <div class="config-form">
                <div class="config-item">
                  <span class="config-label">服务器地址:</span>
                  <el-input
                    v-model="viewer.serverUrl"
                    placeholder="如: http://localhost:8080"
                    size="small"
                    :disabled="!viewer.enabled"
                    clearable
                  >
                    <template #prepend>
                      <IconifyIconOnline icon="ri:server-line" />
                    </template>
                  </el-input>
                </div>
                <div class="config-item">
                  <span class="config-label">JWT密钥:</span>
                  <el-input
                    v-model="viewer.jwtSecret"
                    placeholder="可选，如果OnlyOffice启用了JWT验证"
                    size="small"
                    :disabled="!viewer.enabled"
                    show-password
                    clearable
                  />
                </div>
                <div class="config-item">
                  <el-checkbox
                    v-model="viewer.jwtEnabled"
                    :disabled="!viewer.enabled"
                    size="small"
                  >
                    启用JWT验证
                  </el-checkbox>
                </div>
              </div>
            </div>
            <div class="viewer-meta">
              <div class="meta-item" v-if="viewer.supportedExtensions?.length">
                <span class="meta-label">支持扩展名:</span>
                <div class="extension-tags">
                  <el-tag
                    v-for="ext in viewer.supportedExtensions.slice(0, 10)"
                    :key="ext"
                    size="small"
                    type="warning"
                  >
                    {{ ext }}
                  </el-tag>
                  <el-tag
                    v-if="viewer.supportedExtensions.length > 10"
                    size="small"
                    type="info"
                  >
                    +{{ viewer.supportedExtensions.length - 10 }} 更多
                  </el-tag>
                </div>
              </div>
              <div class="meta-item" v-if="viewer.targetFormat">
                <span class="meta-label">输出格式:</span>
                <el-tag size="small">{{ viewer.targetFormat }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!loading && viewerList.length === 0"
          description="暂无可用的视图查看器"
        />
      </div>

      <!-- 统计信息 -->
      <div class="viewer-stats" v-if="viewerList.length > 0">
        <span class="stats-item">
          <IconifyIconOnline icon="ri:eye-line" />
          总计: {{ viewerList.length }} 个查看器
        </span>
        <span class="stats-item enabled">
          <IconifyIconOnline icon="ri:checkbox-circle-line" />
          已启用: {{ enabledCount }} 个
        </span>
        <span class="stats-item disabled">
          <IconifyIconOnline icon="ri:close-circle-line" />
          已禁用: {{ disabledCount }} 个
        </span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" />
          保存并热应用
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  getViewerListForSetting,
  saveViewerConfigForSetting,
  type ViewerInfo,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  filterSettingId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const saving = ref(false);
const viewerList = ref<ViewerInfo[]>([]);

// 计算启用/禁用数量
const enabledCount = computed(
  () => viewerList.value.filter((v) => v.enabled).length
);
const disabledCount = computed(
  () => viewerList.value.filter((v) => !v.enabled).length
);

// 加载数据
async function loadData() {
  if (!props.filterSettingId) return;

  loading.value = true;
  try {
    const res = await getViewerListForSetting(props.filterSettingId);
    if (res.success && res.data) {
      viewerList.value = res.data;
    }
  } catch (e) {
    message("加载视图查看器列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

// 判断是否是OnlyOffice查看器
function isOnlyOfficeViewer(viewer: ViewerInfo) {
  return viewer.name?.toLowerCase().includes("onlyoffice");
}

// 切换查看器状态
function handleViewerToggle(viewer: ViewerInfo) {
  viewer.enabled = !viewer.enabled;
}

// 保存配置
async function handleSave() {
  saving.value = true;
  try {
    // 收集禁用的查看器名称
    const disabledViewers = viewerList.value
      .filter((v) => !v.enabled)
      .map((v) => v.name);

    // 收集OnlyOffice配置
    const onlyofficeViewer = viewerList.value.find((v) =>
      isOnlyOfficeViewer(v)
    );
    const onlyofficeConfig = onlyofficeViewer
      ? {
          serverUrl: onlyofficeViewer.serverUrl,
          jwtSecret: onlyofficeViewer.jwtSecret,
          jwtEnabled: onlyofficeViewer.jwtEnabled,
        }
      : undefined;

    const res = await saveViewerConfigForSetting(props.filterSettingId, {
      disabledViewers,
      onlyoffice: onlyofficeConfig,
    });

    if (res.success) {
      message("视图查看器配置已保存并热应用", { type: "success" });
      emit("success");
      handleClose();
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (e) {
    message("保存视图查看器配置失败", { type: "error" });
  } finally {
    saving.value = false;
  }
}

// 关闭对话框
function handleClose() {
  visibleInner.value = false;
  emit("update:visible", false);
}

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) {
      await loadData();
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.viewer-config-container {
  min-height: 300px;
}

.tip-alert {
  margin-bottom: 16px;
}

.viewer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

.viewer-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  &.disabled {
    background: #fef2f2;
    border-color: #fecaca;
    opacity: 0.8;
  }
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.viewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewer-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.viewer-body {
  margin-left: 44px;
}

.viewer-desc {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.viewer-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.meta-label {
  color: #94a3b8;
  white-space: nowrap;
  min-width: 70px;
}

.extension-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.viewer-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;

  &.enabled {
    color: #16a34a;
  }

  &.disabled {
    color: #dc2626;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// OnlyOffice配置区域样式
.onlyoffice-config {
  margin: 12px 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);

  .server-warning {
    margin-bottom: 12px;

    :deep(.el-alert__title) {
      font-size: 12px;
    }
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .config-label {
      min-width: 80px;
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    .el-input {
      flex: 1;
      max-width: 400px;
    }
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
