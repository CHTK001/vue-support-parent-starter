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
      <ScAlert type="info" :closable="false" class="fc-tip-alert">
        <template #title>视图查看器用于处理文件预览，通过 SPI 机制动态加载。启用或禁用查看器后将立即热应用到运行中的服务器。</template>
      </ScAlert>

      <!-- 查看器列表 -->
      <div class="fc-viewer-list">
        <div v-for="viewer in viewerList" :key="viewer.name" class="fc-viewer-item" :class="{ 'fc-viewer-disabled': !viewer.enabled }">
          <div class="fc-viewer-header">
            <div class="fc-viewer-info">
              <ScSwitch v-model="viewer.enabled" size="small" @change="handleViewerToggle(viewer)" />
              <span class="fc-viewer-name">{{ viewer.name }}</span>
              <ScTag size="small" type="info">优先级: {{ viewer.priority }}</ScTag>
              <ScTag size="small" :type="viewer.enabled ? 'success' : 'danger'">{{ viewer.enabled ? "已启用" : "已禁用" }}</ScTag>
            </div>
            <div class="fc-viewer-actions">
              <ScTooltip :content="viewer.enabled ? '禁用此查看器' : '启用此查看器'">
                <ScButton :type="viewer.enabled ? 'danger' : 'success'" size="small" text @click="handleViewerToggle(viewer)">
                  <IconifyIconOnline :icon="viewer.enabled ? 'ri:close-circle-line' : 'ri:checkbox-circle-line'" />
                </ScButton>
              </ScTooltip>
            </div>
          </div>
          <div class="fc-viewer-body">
            <div class="fc-viewer-desc">{{ viewer.description }}</div>
            <!-- OnlyOffice 服务器配置 -->
            <div v-if="isOnlyOfficeViewer(viewer)" class="fc-onlyoffice-config">
              <ScAlert type="warning" :closable="false" show-icon>
                <template #title>此查看器需要部署 OnlyOffice Document Server 才能使用</template>
              </ScAlert>
              <div class="fc-onlyoffice-form">
                <div class="fc-onlyoffice-item">
                  <span class="fc-oo-label">服务器地址:</span>
                  <ScInput v-model="viewer.serverUrl" placeholder="如: http://localhost:8080" size="small" :disabled="!viewer.enabled" clearable>
                    <template #prefix><IconifyIconOnline icon="ri:server-line" /></template>
                  </ScInput>
                </div>
                <div class="fc-onlyoffice-item">
                  <span class="fc-oo-label">JWT密钥:</span>
                  <ScInput v-model="viewer.jwtSecret" placeholder="可选，如果OnlyOffice启用了JWT验证" size="small" :disabled="!viewer.enabled" show-password clearable />
                </div>
                <div class="fc-onlyoffice-item">
                  <ScCheckbox v-model="viewer.jwtEnabled" :disabled="!viewer.enabled" size="small">启用JWT验证</ScCheckbox>
                </div>
              </div>
            </div>
            <div class="fc-viewer-meta">
              <div class="fc-meta-item" v-if="viewer.supportedExtensions?.length">
                <span class="fc-meta-label">支持扩展名:</span>
                <div class="fc-ext-tags">
                  <ScTag v-for="ext in viewer.supportedExtensions.slice(0, 10)" :key="ext" size="small" type="warning">{{ ext }}</ScTag>
                  <ScTag v-if="viewer.supportedExtensions.length > 10" size="small" type="info">+{{ viewer.supportedExtensions.length - 10 }} 更多</ScTag>
                </div>
              </div>
              <div class="fc-meta-item" v-if="viewer.targetFormat">
                <span class="fc-meta-label">输出格式:</span>
                <ScTag size="small">{{ viewer.targetFormat }}</ScTag>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <ScEmpty v-if="!loading && viewerList.length === 0" description="暂无可用的视图查看器" />
      </div>

      <!-- 统计信息 -->
      <div class="fc-viewer-stats" v-if="viewerList.length > 0">
        <span class="fc-stats-item">
          <IconifyIconOnline icon="ri:eye-line" />
          总计: {{ viewerList.length }} 个查看器
        </span>
        <span class="fc-stats-item fc-stats-enabled">
          <IconifyIconOnline icon="ri:checkbox-circle-line" />
          已启用: {{ enabledCount }} 个
        </span>
        <span class="fc-stats-item fc-stats-disabled">
          <IconifyIconOnline icon="ri:close-circle-line" />
          已禁用: {{ disabledCount }} 个
        </span>
      </div>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" /> 保存并热应用
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { getViewerListForSetting, saveViewerConfigForSetting, type ViewerInfo } from "@/api/system-server-setting";
import { ScCheckbox } from "@repo/components/ScCheckbox";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScTooltip } from "@repo/components/ScTooltip";

interface Props { visible: boolean; filterSettingId: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const saving = ref(false);
const viewerList = ref<ViewerInfo[]>([]);

const enabledCount = computed(() => viewerList.value.filter(v => v.enabled).length);
const disabledCount = computed(() => viewerList.value.filter(v => !v.enabled).length);

async function loadData() {
  if (!props.filterSettingId) return;
  loading.value = true;
  try {
    const res = await getViewerListForSetting(props.filterSettingId);
    if (res.success && res.data) viewerList.value = res.data;
  } catch { message("加载视图查看器列表失败", { type: "error" }); }
  finally { loading.value = false; }
}

function isOnlyOfficeViewer(viewer: ViewerInfo) { return viewer.name?.toLowerCase().includes("onlyoffice"); }
function handleViewerToggle(viewer: ViewerInfo) { viewer.enabled = !viewer.enabled; }

async function handleSave() {
  saving.value = true;
  try {
    const disabledViewers = viewerList.value.filter(v => !v.enabled).map(v => v.name);
    const onlyofficeViewer = viewerList.value.find(v => isOnlyOfficeViewer(v));
    const onlyofficeConfig = onlyofficeViewer ? { serverUrl: onlyofficeViewer.serverUrl, jwtSecret: onlyofficeViewer.jwtSecret, jwtEnabled: onlyofficeViewer.jwtEnabled } : undefined;
    const res = await saveViewerConfigForSetting(props.filterSettingId, { disabledViewers, onlyoffice: onlyofficeConfig });
    if (res.success) { message("视图查看器配置已保存并热应用", { type: "success" }); emit("success"); handleClose(); }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } catch { message("保存视图查看器配置失败", { type: "error" }); }
  finally { saving.value = false; }
}

function handleClose() { visibleInner.value = false; emit("update:visible", false); }

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.viewer-config-container { min-height: 300px; }

.fc-tip-alert { margin-bottom: 16px; }

.fc-viewer-list {
  display: flex; flex-direction: column; gap: 12px;
  max-height: 500px; overflow-y: auto; padding-right: 4px;
}

.fc-viewer-item {
  background: $fc-surface-alt; border: 1px solid $fc-border;
  border-radius: $fc-radius-sm; padding: 12px 16px; transition: all 0.2s;
  &:hover { border-color: #cbd5e1; box-shadow: $fc-shadow-sm; }
}

.fc-viewer-disabled {
  background: #fef2f2; border-color: #fecaca; opacity: 0.8;
}

.fc-viewer-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}

.fc-viewer-info { display: flex; align-items: center; gap: 8px; }
.fc-viewer-name { font-weight: 600; color: $fc-title; font-size: 14px; }
.fc-viewer-body { margin-left: 44px; }
.fc-viewer-desc { color: $fc-hint; font-size: 13px; margin-bottom: 8px; line-height: 1.5; }

.fc-viewer-meta { display: flex; flex-direction: column; gap: 6px; }
.fc-meta-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; }
.fc-meta-label { color: $fc-muted; white-space: nowrap; min-width: 70px; }
.fc-ext-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.fc-viewer-stats {
  display: flex; align-items: center; justify-content: center; gap: 24px;
  margin-top: 16px; padding-top: 16px; border-top: 1px solid $fc-border;
}

.fc-stats-item {
  display: flex; align-items: center; gap: 6px; font-size: 13px; color: $fc-hint;
  &.fc-stats-enabled { color: $fc-success; }
  &.fc-stats-disabled { color: $fc-danger; }
}

.fc-onlyoffice-config {
  margin: 12px 0; padding: 12px;
  background: $fc-surface-alt; border-radius: $fc-radius-xs;
  border: 1px dashed $fc-border;
}

.fc-onlyoffice-form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }

.fc-onlyoffice-item {
  display: flex; align-items: center; gap: 8px;
  .fc-oo-label { min-width: 80px; font-size: 13px; color: $fc-body; }
}

.fc-footer { @include action-row; }
</style>
