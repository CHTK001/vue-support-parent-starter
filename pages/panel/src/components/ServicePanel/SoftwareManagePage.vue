<template>
  <div class="soft-manage">
    <ElTabs v-model="manageTab">
      <ElTabPane label="软件预设" name="preset">
        <div class="manage-header">
          <div class="manage-header-left">
            <ElInput
              v-model="searchKeyword"
              placeholder="搜索软件..."
              clearable
              style="width: 240px"
              @input="handleSearch"
            />
            <ElSelect v-model="categoryFilter" placeholder="全部分类" clearable style="width: 140px" @change="handleSearch">
              <ElOption label="数据库" value="database" />
              <ElOption label="中间件" value="middleware" />
              <ElOption label="Web 服务" value="webserver" />
              <ElOption label="远程桌面" value="remote" />
              <ElOption label="运维工具" value="devops" />
            </ElSelect>
          </div>
          <ElButton type="primary" @click="openAddDialog">
            + 新增软件
          </ElButton>
        </div>

        <div v-if="loading" class="manage-loading">
          <ElSkeleton :rows="3" animated />
        </div>

        <div v-else-if="presets.length === 0" class="manage-empty">
          <ElEmpty description="暂无软件定义" />
        </div>

        <div v-else class="preset-grid">
          <div
            v-for="preset in presets"
            :key="preset.sysProjectContainerSoftwarePresetId"
            class="preset-cell"
            :style="{ '--i': presets.indexOf(preset) }"
            @click="handleSelectPreset(preset)"
          >
            <div class="preset-icon" :class="typeColorClass(preset)">
              <SoftwareIcon
                :icon="preset.softwareIcon"
                class="preset-icon-svg"
                fallback="ep:box"
              />
            </div>
            <span class="preset-label">{{ preset.softwareName }}</span>
            <span v-if="preset.presetType === 'DOCKERFILE'" class="preset-dockerfile-badge">DF</span>
            <span class="preset-del-icon" @click.stop="handleDelete(preset)">×</span>
          </div>
        </div>
      </ElTabPane>
      <ElTabPane label="Docker 仓库" name="registry">
        <DockerRegistryDialog />
      </ElTabPane>
    </ElTabs>

    <SoftwareFormDialog
      v-model="formVisible"
      :preset="editingPreset"
      @saved="handleSaved"
    />

    <ElDialog v-model="showDetail" title="软件详情" width="660px" class="detail-dialog">
      <template v-if="selectedPreset">
        <div class="detail-body">
          <div class="detail-topbar">
            <ElButton circle size="small" text @click="openEditFromDetail">
              <IconifyIconOnline icon="ep:edit" />
            </ElButton>
          </div>
          <div class="detail-head">
            <div class="detail-icon" :class="typeColorClass(selectedPreset)">
              <SoftwareIcon :icon="selectedPreset.softwareIcon" fallback="ep:box" />
            </div>
            <div class="detail-head-info">
              <div class="detail-head-name">{{ selectedPreset.softwareName }}</div>
              <div class="detail-head-meta">
                <span>v{{ selectedPreset.softwareVersion || '-' }}</span>
                <span class="detail-head-divider">|</span>
                <span>{{ categoryLabel(selectedPreset.softwareCategory) }}</span>
                <span class="detail-head-divider">|</span>
                <span>{{ getPresetTypeLabel(selectedPreset.presetType) }}</span>
              </div>
            </div>
          </div>
          <ElTabs v-model="detailTab" class="detail-tabs">
            <ElTabPane label="基础信息" name="basic">
              <ElDescriptions :column="2" border size="small">
                <ElDescriptionsItem label="编码">{{ selectedPreset.softwareCode }}</ElDescriptionsItem>
                <ElDescriptionsItem label="分类">{{ categoryLabel(selectedPreset.softwareCategory) }}</ElDescriptionsItem>
                <ElDescriptionsItem label="镜像">{{ presetRemarkData.dockerDefaults?.image || '-' }}</ElDescriptionsItem>
                <ElDescriptionsItem label="可用 Tag">
                  <div v-if="dockerTags.length > 0" class="detail-tags">
                    <ElTag v-for="tag in dockerTags" :key="tag" size="small" effect="plain">{{ tag }}</ElTag>
                  </div>
                  <span v-else>-</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="暴露端口" :span="2">{{ selectedPreset.exposePorts || '-' }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="presetRemarkData.description" label="描述" :span="2">
                  <div style="white-space: pre-wrap">{{ presetRemarkData.description }}</div>
                </ElDescriptionsItem>
              </ElDescriptions>
            </ElTabPane>
            <ElTabPane label="环境变量" name="env" :disabled="dockerEnvs.length === 0">
              <div v-if="dockerEnvs.length > 0" class="detail-list-pane">
                <div v-for="(ev, i) in dockerEnvs" :key="i" class="detail-kv-line">
                  <code class="detail-kv-env-key">{{ ev.key }}</code>
                  <span class="detail-kv-eq">=</span>
                  <code class="detail-kv-env-val">{{ ev.value }}</code>
                </div>
              </div>
              <ElEmpty v-else description="无环境变量" />
            </ElTabPane>
            <ElTabPane label="卷映射" name="volume" :disabled="dockerVolumes.length === 0">
              <div v-if="dockerVolumes.length > 0" class="detail-list-pane">
                <div v-for="(vol, i) in dockerVolumes" :key="i" class="detail-kv-line">
                  <code class="detail-kv-path">{{ vol.hostPath || '?' }}</code>
                  <span class="detail-kv-arrow">→</span>
                  <code class="detail-kv-path">{{ vol.containerPath }}</code>
                  <span v-if="vol.readOnly" class="detail-kv-ro">只读</span>
                </div>
              </div>
              <ElEmpty v-else description="无卷映射" />
            </ElTabPane>
          </ElTabs>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElTabPane,
  ElTabs,
  ElTag,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import SoftwareFormDialog from "./SoftwareFormDialog.vue";
import DockerRegistryDialog from "./DockerRegistryDialog.vue";
import {
  deletePreset,
  fetchPresetList,
  getPresetTypeLabel,
  parseSoftwarePresetRemark,
  type SoftwarePreset,
  type VolumeMapping,
} from "../../api/software";

const emit = defineEmits<{
  install: [preset: SoftwarePreset];
  navigate: [view: string];
}>();

const presets = ref<SoftwarePreset[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const categoryFilter = ref("");
const formVisible = ref(false);
const editingPreset = ref<SoftwarePreset | null>(null);
const selectedPreset = ref<SoftwarePreset | null>(null);
const showDetail = ref(false);
const manageTab = ref("preset");
const detailTab = ref("basic");

const presetRemarkData = computed(() =>
  selectedPreset.value ? parseSoftwarePresetRemark(selectedPreset.value.presetRemark) : {},
);

const dockerVolumes = computed<VolumeMapping[]>(() => {
  const data = presetRemarkData.value;
  const vols: VolumeMapping[] = [];
  // from preset_remark.dockerDefaults.volumeMappings
  if (data.dockerDefaults?.volumeMappings) {
    for (const v of data.dockerDefaults.volumeMappings) {
      vols.push(v);
    }
  }
  // also from old-style docker_env_vars -> no, volumes aren't in env vars
  return vols;
});

const dockerEnvs = computed<{ key: string; value: string }[]>(() => {
  const data = presetRemarkData.value;
  const entries: { key: string; value: string }[] = [];
  // from preset_remark.dockerDefaults.env
  if (data.dockerDefaults?.env) {
    for (const [k, v] of Object.entries(data.dockerDefaults.env)) {
      entries.push({ key: k, value: String(v) });
    }
  }
  return entries;
});

const dockerTags = computed<string[]>(() => {
  return presetRemarkData.value.dockerDefaults?.tags || [];
});

const categoryLabel = (cat?: string) => {
  const map: Record<string, string> = {
    database: "数据库",
    middleware: "中间件",
    language: "开发语言",
    devops: "运维工具",
    remote: "远程桌面",
    webserver: "Web 服务",
  };
  return cat ? map[cat] || cat : "-";
};

const TYPE_COLORS: Record<string, string> = {
  ENVIRONMENT: "icon-type-env",
  SOFTWARE: "icon-type-soft",
  DOCKERFILE: "icon-type-docker",
};

const typeColorClass = (preset: SoftwarePreset) =>
  TYPE_COLORS[preset.presetType || ""] || "";

const loadPresets = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (searchKeyword.value) params.softwareName = searchKeyword.value;
    if (categoryFilter.value) params.softwareCategory = categoryFilter.value;
    params.presetStatus = 1;
    params.presetDelete = 0;
    params.presetType = "SOFTWARE,DOCKERFILE";
    const res = await fetchPresetList(params);
    if (res.code === "00000") {
      presets.value = (res.data || []).filter(
        (p) => p.presetType !== "ENVIRONMENT",
      );
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadPresets();
};

const openAddDialog = () => {
  editingPreset.value = null;
  formVisible.value = true;
};

const handleDelete = async (preset: SoftwarePreset) => {
  try {
    await ElMessageBox.confirm(`确定删除软件「${preset.softwareName}」？`, "确认删除", {
      type: "warning",
    });
    const res = await deletePreset(preset.sysProjectContainerSoftwarePresetId!);
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      loadPresets();
    }
  } catch {
    // cancelled
  }
};

const handleSaved = () => {
  loadPresets();
};

const handleSelectPreset = (preset: SoftwarePreset) => {
  selectedPreset.value = preset;
  showDetail.value = true;
};

const openEditFromDetail = () => {
  if (selectedPreset.value) {
    showDetail.value = false;
    editingPreset.value = { ...selectedPreset.value };
    formVisible.value = true;
  }
};

onMounted(() => {
  loadPresets();
});
</script>

<style scoped>
.soft-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.manage-header-left {
  display: flex;
  gap: 8px;
  align-items: center;
}
.manage-loading {
  padding: 20px;
}
.manage-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Preset Grid ── */

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 80px);
  gap: 16px 8px;
  overflow: visible;
  padding: 12px 4px 4px;
}

.preset-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 80px;
  cursor: pointer;
  animation: pCellIn 0.35s ease-out both;
  animation-delay: calc(var(--i, 0) * 0.03s);
  padding: 4px 0;
}

.preset-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dt-hover-bg);
  color: var(--el-color-primary);
  font-size: 32px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.preset-cell:hover .preset-icon {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
  background: var(--el-color-primary-light-9);
}
.preset-cell:active .preset-icon {
  transform: scale(0.96);
}

.icon-type-soft .preset-icon {
  color: #67c23a;
}
.icon-type-docker .preset-icon {
  color: #b37feb;
}

.preset-icon-svg {
  transition: transform 0.2s ease;
}
.preset-cell:hover .preset-icon-svg {
  transform: scale(1.1);
}

.preset-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  text-align: center;
  line-height: 1.2;
  max-width: 76px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s;
}
.preset-cell:hover .preset-label {
  color: var(--el-text-color-primary);
}

.preset-dockerfile-badge {
  position: absolute;
  top: 0;
  right: 2px;
  font-size: 9px;
  font-weight: 700;
  color: #b37feb;
  background: rgba(179, 127, 235, 0.12);
  padding: 0 4px;
  border-radius: 4px;
  line-height: 14px;
}

.preset-del-icon {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.85);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.7);
  transition: opacity 0.18s ease, transform 0.18s ease;
  cursor: pointer;
  z-index: 5;
  line-height: 1;
  user-select: none;
}
.preset-cell:hover .preset-del-icon {
  opacity: 1;
  transform: scale(1);
}
.preset-del-icon:hover {
  background: #ef4444;
  transform: scale(1.1) !important;
}

@keyframes pCellIn {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Detail Dialog ── */

.detail-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
}
.detail-dialog :deep(.el-dialog) {
  border-radius: var(--dt-radius-xl) !important;
}

.detail-body {
  padding: 0 24px 20px;
}
.detail-topbar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
}
.detail-topbar :deep(.el-button) {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}
.detail-topbar :deep(.el-button:hover) {
  color: var(--el-color-primary);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 28px;
  flex-shrink: 0;
}
.detail-icon.icon-type-soft {
  color: #67c23a;
}
.detail-icon.icon-type-docker {
  color: #b37feb;
}
.detail-head-info {
  min-width: 0;
}
.detail-head-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.detail-head-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.detail-head-divider {
  color: var(--el-border-color);
}

.detail-kv-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 2px 0;
}
.detail-kv-path,
.detail-kv-env-key,
.detail-kv-env-val {
  font-family: "Cascadia Code", "Courier New", monospace;
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
}
.detail-kv-arrow {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
.detail-kv-eq {
  color: var(--el-text-color-secondary);
}
.detail-kv-ro {
  font-size: 11px;
  color: var(--el-color-warning);
  background: rgba(230, 162, 60, 0.1);
  padding: 0 4px;
  border-radius: 3px;
}

/* ── Detail Tabs ── */

.detail-tabs {
  margin-top: 4px;
}
.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
.detail-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 500;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
}
.detail-list-pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}
.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
