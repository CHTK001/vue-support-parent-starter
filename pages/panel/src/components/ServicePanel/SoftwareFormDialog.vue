<template>
  <ElDialog
    v-model="dialogVisible"
    title="软件预设管理"
    width="960px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="preset-manager">
      <!-- ── Left panel: preset card list ── -->
      <div class="preset-list-panel">
        <div class="panel-toolbar">
          <ElInput v-model="searchQuery" placeholder="搜索预设..." clearable size="small" />
          <ElButton size="small" type="primary" @click="createNew">
            <IconifyIconOnline icon="ep:plus" />
            新建
          </ElButton>
        </div>
        <div v-if="filteredPresets.length === 0" class="panel-empty">
          <span>暂无预设</span>
        </div>
        <div v-else class="preset-cards">
          <div
            v-for="preset in filteredPresets"
            :key="preset.sysProjectContainerSoftwarePresetId"
            class="preset-card-item"
            :class="{ active: selectedPresetId === preset.sysProjectContainerSoftwarePresetId }"
            @click="selectPreset(preset)"
          >
            <div class="preset-card-icon">
              <SoftwareIcon
                :icon="preset.softwareIcon"
                style="font-size: 22px; color: var(--el-color-primary)"
                fallback="ep:box"
              />
            </div>
            <div class="preset-card-body">
              <div class="preset-card-name">{{ preset.softwareName || '未知' }}</div>
              <div class="preset-card-meta">
                <ElTag size="small" type="info" effect="plain">
                  {{ getCategoryLabel(preset.softwareCategory) }}
                </ElTag>
                <span class="preset-version">v{{ preset.softwareVersion || '-' }}</span>
              </div>
            </div>
            <ElButton
              v-if="preset.sysProjectContainerSoftwarePresetId"
              size="small"
              text
              type="danger"
              class="preset-card-delete"
              @click.stop="handleDelete(preset)"
            >
              <IconifyIconOnline icon="ep:delete" />
            </ElButton>
          </div>
        </div>
      </div>

      <!-- ── Right panel: Docker API config ── -->
      <div class="config-panel" v-if="editingPreset">
        <div class="config-panel-header">
          <div class="config-panel-title">
            <SoftwareIcon
              :icon="editingPreset.softwareIcon"
              style="font-size: 20px; color: var(--el-color-primary)"
              fallback="ep:box"
            />
            <span>{{ isNew ? '新建预设' : editingPreset.softwareName }}</span>
          </div>
        </div>

        <ElTabs v-model="editTab" class="config-tabs">
          <!-- ── Basic info tab ── -->
          <ElTabPane label="基础信息" name="basic">
            <ElForm label-width="100px" label-position="top" size="small" class="config-form">
              <ElRow :gutter="12">
                <ElCol :span="12">
                  <ElFormItem label="软件名称" required>
                    <ElInput v-model="form.softwareName" placeholder="如：MySQL" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="软件编码" required>
                    <ElInput v-model="form.softwareCode" placeholder="如：mysql" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <ElRow :gutter="12">
                <ElCol :span="8">
                  <ElFormItem label="版本">
                    <ElInput v-model="form.softwareVersion" placeholder="如：8.0" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="分类">
                    <ElSelect v-model="form.softwareCategory" placeholder="选择分类" allow-create filterable>
                      <ElOption label="数据库" value="database" />
                      <ElOption label="中间件" value="middleware" />
                      <ElOption label="运维工具" value="devops" />
                      <ElOption label="Web 服务" value="webserver" />
                      <ElOption label="远程桌面" value="remote" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="图标">
                    <ElInput v-model="form.softwareIcon" placeholder="图标名或 Logo URL" />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElDivider style="margin: 8px 0" />

              <ElFormItem label="Docker 镜像" required>
                <ElInput v-model="dockerDefaults.image" placeholder="如：nginx">
                  <template #append>
                    <ElButton @click="fillFromSuggestion" :disabled="!nextSuggestion">自动填充</ElButton>
                  </template>
                </ElInput>
                <div class="form-tip">仅填写镜像名称，不含 tag（如 nginx）</div>
              </ElFormItem>

              <ElFormItem label="可用 Tag">
                <div class="tags-input">
                  <ElTag
                    v-for="(tag, idx) in dockerTags"
                    :key="idx"
                    closable
                    size="small"
                    @close="dockerTags.splice(idx, 1)"
                  >{{ tag }}</ElTag>
                  <ElInput
                    v-if="tagInputVisible"
                    ref="tagInputRef"
                    v-model="tagInputValue"
                    size="small"
                    style="width: 100px"
                    @keyup.enter="confirmTag"
                    @blur="confirmTag"
                  />
                  <ElButton v-else size="small" @click="showTagInput">+ tag</ElButton>
                </div>
                <div class="form-tip">常用 tag 如：1.24, alpine, latest，安装时用户可选择</div>
              </ElFormItem>

              <ElFormItem label="默认端口">
                <ElInput v-model="form.exposePorts" placeholder="如：3306 / 80,443" />
                <div class="form-tip">多个端口用逗号分隔</div>
              </ElFormItem>

              <!-- Docker Script mode -->
              <ElFormItem label="脚本模式">
                <ElRadioGroup v-model="dockerDefaults.scriptMode">
                  <ElRadio value="script">标准脚本</ElRadio>
                  <ElRadio value="dockerfile">Dockerfile</ElRadio>
                </ElRadioGroup>
              </ElFormItem>

              <ElFormItem v-if="dockerDefaults.scriptMode === 'dockerfile'" label="Dockerfile 内容" style="margin-bottom:0">
                <ScScriptEditor
                  v-model="dockerDefaults.dockerfileContent"
                  language="dockerfile"
                  label="Dockerfile"
                  dialog-title="Dockerfile 内容"
                />
              </ElFormItem>

              <ElFormItem label="特权模式">
                <ElSwitch v-model="dockerDefaults.privileged" :active-value="true" :inactive-value="false" />
                <div class="form-tip">启用 --privileged 模式，适用于线程受限或需要访问宿主机硬件设备的环境</div>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- ── Env vars tab ── -->
          <ElTabPane label="环境变量" name="env">
            <div class="kv-list">
              <div v-for="(entry, idx) in dockerEnvEntries" :key="idx" class="kv-row">
                <ElInput v-model="entry.key" placeholder="KEY" size="small" style="width:160px" />
                <ElInput v-model="entry.value" placeholder="VALUE" size="small" style="width:240px" />
                <ElButton size="small" text type="danger" @click="dockerEnvEntries.splice(idx, 1)">×</ElButton>
              </div>
              <ElButton size="small" @click="dockerEnvEntries.push({ key: '', value: '' })">+ 添加</ElButton>
            </div>
          </ElTabPane>

          <!-- ── Volume mappings tab ── -->
          <ElTabPane label="卷映射" name="volume">
            <div class="kv-list">
              <div v-for="(vol, idx) in dockerVolumeMappings" :key="idx" class="kv-row">
                <ElInput v-model="vol.hostPath" placeholder="宿主机路径" size="small" style="width:180px" />
                <ElInput v-model="vol.containerPath" placeholder="容器路径" size="small" style="width:180px" />
                <ElCheckbox v-model="vol.readOnly" label="只读" size="small" />
                <ElButton size="small" text type="danger" @click="dockerVolumeMappings.splice(idx, 1)">×</ElButton>
              </div>
              <ElButton size="small" @click="dockerVolumeMappings.push({ hostPath: '', containerPath: '', readOnly: false })">+ 添加</ElButton>
            </div>
          </ElTabPane>
        </ElTabs>

        <!-- Save button -->
        <div class="config-actions">
          <ElButton type="primary" :loading="saving" @click="handleSave" style="width:100%">
            <IconifyIconOnline icon="ep:check" style="margin-right:4px" />
            {{ isNew ? '创建预设' : '保存修改' }}
          </ElButton>
        </div>
      </div>

      <!-- Empty state for right panel -->
      <div v-else class="config-panel config-panel-empty">
        <IconifyIconOnline icon="ep:box" style="font-size: 48px; color: var(--el-text-color-disabled)" />
        <span>选择一个预设开始编辑</span>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCol,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTag,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import ScScriptEditor from "@repo/components/ScScriptEditor";
import {
  createEmptyScriptSet,
  deletePreset,
  fetchPresetList,
  getCategoryLabel,
  getPresetSuggestions,
  PRESET_SUGGESTIONS,
  parseSoftwarePresetRemark,
  savePreset,
  stringifySoftwarePresetRemark,
  updatePreset,
  type DockerScriptMode,
  type SoftwarePreset,
  type VolumeMapping,
} from "../../api/software";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    preset?: SoftwarePreset | null;
  }>(),
  { preset: null },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [preset: SoftwarePreset];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// ─── State ──────────────────────────────────────────────────

const presets = ref<SoftwarePreset[]>([]);
const searchQuery = ref("");
const selectedPresetId = ref<number | undefined>(undefined);
const editingPreset = ref<SoftwarePreset | null>(null);
const isNew = ref(false);
const saving = ref(false);

const editTab = ref("basic");

// ─── Form model (reactive) ──────────────────────────────────

const form = reactive<Partial<SoftwarePreset>>({
  softwareName: "",
  softwareCode: "",
  softwareVersion: "",
  softwareCategory: "",
  softwareIcon: "",
  softwareVendor: "",
  osType: "linux",
  exposePorts: "",
  presetRemark: "",
});

const dockerDefaults = reactive({
  image: "",
  scriptMode: "script" as DockerScriptMode,
  dockerfileContent: "",
  privileged: false,
});
const dockerEnvEntries = reactive<{ key: string; value: string }[]>([]);
const dockerVolumeMappings = reactive<VolumeMapping[]>([]);
const dockerTags = reactive<string[]>([]);
const tagInputVisible = ref(false);
const tagInputValue = ref("");
const tagInputRef = ref<InstanceType<typeof ElInput> | null>(null);

const showTagInput = () => {
  tagInputVisible.value = true;
  tagInputValue.value = "";
  nextTick(() => tagInputRef.value?.focus());
};
const confirmTag = () => {
  const val = tagInputValue.value.trim();
  if (val && !dockerTags.includes(val)) dockerTags.push(val);
  tagInputVisible.value = false;
  tagInputValue.value = "";
};

const nextSuggestion = computed(() => {
  return getPresetSuggestions(form.softwareCode) || getPresetSuggestions(form.softwareName);
});

const fillFromSuggestion = () => {
  const sug = nextSuggestion.value;
  if (!sug) return;
  if (sug.image && !dockerDefaults.image) dockerDefaults.image = sug.image;
  if (sug.ports && !form.exposePorts) form.exposePorts = sug.ports;
  if (sug.softwareIcon && !form.softwareIcon) form.softwareIcon = sug.softwareIcon;
  if (sug.env && dockerEnvEntries.length === 0) {
    for (const [key, value] of Object.entries(sug.env)) {
      dockerEnvEntries.push({ key, value });
    }
  }
  if (sug.volumes && dockerVolumeMappings.length === 0) {
    for (const vol of sug.volumes) {
      dockerVolumeMappings.push({ ...vol });
    }
  }
  if (sug.tags && dockerTags.length === 0) {
    for (const tag of sug.tags) {
      dockerTags.push(tag);
    }
  }
};

// ─── Filtered presets ───────────────────────────────────────

const filteredPresets = computed(() => {
  let list = presets.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.softwareName?.toLowerCase().includes(q) ||
        p.softwareCode?.toLowerCase().includes(q),
    );
  }
  return list;
});

// ─── Load presets ───────────────────────────────────────────

const loadPresets = async () => {
  const res = await fetchPresetList({ presetDelete: 0 });
  if (res.code === "00000") {
    presets.value = res.data || [];
    // Re-select current if still there
    if (selectedPresetId.value) {
      const found = presets.value.find(p => p.sysProjectContainerSoftwarePresetId === selectedPresetId.value);
      if (found) selectPreset(found);
      else selectPreset(presets.value[0]);
    } else if (presets.value.length > 0) {
      selectPreset(presets.value[0]);
    }
  }
};

// ─── Select preset ──────────────────────────────────────────

const selectPreset = (preset: SoftwarePreset) => {
  selectedPresetId.value = preset.sysProjectContainerSoftwarePresetId;
  editingPreset.value = preset;
  isNew.value = false;

  Object.assign(form, {
    softwareName: preset.softwareName || "",
    softwareCode: preset.softwareCode || "",
    softwareVersion: preset.softwareVersion || "",
    softwareCategory: preset.softwareCategory || "",
    softwareIcon: preset.softwareIcon || "",
    softwareVendor: preset.softwareVendor || "",
    osType: preset.osType || "linux",
    exposePorts: preset.exposePorts || "",
    presetRemark: preset.presetRemark || "",
  });

  const remark = parseSoftwarePresetRemark(preset.presetRemark);
  dockerDefaults.image = remark.dockerDefaults?.image || "";
  dockerDefaults.scriptMode = (remark.dockerDefaults?.scriptMode as DockerScriptMode) || "script";
  dockerDefaults.dockerfileContent = remark.dockerDefaults?.dockerfileContent || "";
  dockerDefaults.privileged = remark.dockerDefaults?.privileged === true;

  dockerEnvEntries.length = 0;
  if (remark.dockerDefaults?.env) {
    for (const [key, value] of Object.entries(remark.dockerDefaults.env)) {
      dockerEnvEntries.push({ key, value });
    }
  }

  dockerVolumeMappings.length = 0;
  if (remark.dockerDefaults?.volumeMappings) {
    for (const vol of remark.dockerDefaults.volumeMappings) {
      dockerVolumeMappings.push({ ...vol });
    }
  }

  dockerTags.length = 0;
  if (remark.dockerDefaults?.tags) {
    for (const tag of remark.dockerDefaults.tags) {
      dockerTags.push(tag);
    }
  }
};

const createNew = () => {
  selectedPresetId.value = undefined;
  isNew.value = true;
  editingPreset.value = {
    softwareName: "",
    softwareCode: "",
    presetType: "SOFTWARE",
    osType: "linux",
  } as SoftwarePreset;

  form.softwareName = "";
  form.softwareCode = "";
  form.softwareVersion = "";
  form.softwareCategory = "";
  form.softwareIcon = "";
  form.softwareVendor = "";
  form.osType = "linux";
  form.exposePorts = "";
  form.presetRemark = "";

  dockerDefaults.image = "";
  dockerDefaults.scriptMode = "script";
  dockerDefaults.dockerfileContent = "";
  dockerDefaults.privileged = false;
  dockerEnvEntries.length = 0;
  dockerVolumeMappings.length = 0;
  dockerTags.length = 0;
  editTab.value = "basic";
};

// ─── Save ───────────────────────────────────────────────────

const handleSave = async () => {
  if (!form.softwareName || !form.softwareCode) {
    ElMessage.warning("请填写软件名称和编码");
    return;
  }
  if (!dockerDefaults.image) {
    ElMessage.warning("请填写 Docker 镜像名");
    return;
  }
  if (dockerDefaults.scriptMode === "dockerfile" && !dockerDefaults.dockerfileContent.trim()) {
    ElMessage.warning("请填写 Dockerfile 内容");
    return;
  }
  if (dockerDefaults.scriptMode === "script" && !form.exposePorts) {
    ElMessage.warning("请填写默认端口");
    return;
  }

  saving.value = true;
  try {
    const payload: Partial<SoftwarePreset> = {
      ...form,
      presetRemark: stringifySoftwarePresetRemark({
        description: undefined,
        supportedModes: ["DOCKER"],
        modeConfigFields: { DOCKER: [] },
        modeScripts: {
          DOCKER: createEmptyScriptSet(),
        },
        dockerDefaults: {
          image: dockerDefaults.image || undefined,
          tags: dockerTags.length > 0 ? dockerTags.map(t => t.trim()).filter(Boolean) : undefined,
          scriptMode: dockerDefaults.scriptMode,
          dockerfileContent: dockerDefaults.scriptMode === "dockerfile" ? (dockerDefaults.dockerfileContent || undefined) : undefined,
          privileged: dockerDefaults.privileged || undefined,
          env: dockerDefaults.scriptMode === "script" && dockerEnvEntries.length > 0
            ? Object.fromEntries(
                dockerEnvEntries.filter((e) => e.key.trim()).map((e) => [e.key.trim(), e.value]),
              )
            : undefined,
          volumeMappings: dockerDefaults.scriptMode === "script" && dockerVolumeMappings.length > 0
            ? dockerVolumeMappings.filter((v) => v.hostPath.trim() && v.containerPath.trim())
            : undefined,
        },
      }),
    };

    const res = isNew.value ? await savePreset(payload) : await updatePreset(payload);
    if (res.code === "00000") {
      ElMessage.success(isNew.value ? "创建成功" : "更新成功");
      emit("saved", payload as SoftwarePreset);
      await loadPresets();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } finally {
    saving.value = false;
  }
};

// ─── Delete ─────────────────────────────────────────────────

const handleDelete = async (preset: SoftwarePreset) => {
  const id = preset.sysProjectContainerSoftwarePresetId;
  if (!id) return;
  try {
    const res = await deletePreset(id);
    if (res.code === "00000") {
      ElMessage.success("已删除");
      await loadPresets();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch {
    ElMessage.error("删除异常");
  }
};

// ─── Close ──────────────────────────────────────────────────

const handleClose = () => {
  selectedPresetId.value = undefined;
  editingPreset.value = null;
  isNew.value = false;
  searchQuery.value = "";
};

// ─── Watchers ───────────────────────────────────────────────

watch(
  () => props.modelValue,
  (val) => {
    if (val) loadPresets();
  },
  { immediate: true },
);
</script>

<style scoped>
.preset-manager {
  display: flex;
  gap: 16px;
  height: 520px;
}

/* ─── Left panel (preset list) ──────────────────────────── */

.preset-list-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 12px;
}

.panel-toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
}
.panel-toolbar .el-input {
  flex: 1;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.preset-cards {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 1px solid transparent;
}
.preset-card-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-light);
}
.preset-card-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}
.preset-card-delete {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.preset-card-item:hover .preset-card-delete {
  opacity: 1;
}

.preset-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.preset-card-item.active .preset-card-icon {
  background: var(--el-color-primary-light-8);
}

.preset-card-body {
  flex: 1;
  min-width: 0;
}
.preset-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.preset-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}
.preset-version {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ─── Right panel (config) ───────────────────────────────── */

.config-panel {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.config-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.config-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
.config-panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-disabled);
  font-size: 14px;
}

.config-form {
  flex: 1;
}
.config-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.config-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-light);
}

.form-tip {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
}

.kv-list {
  width: 100%;
}
.kv-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* ── Tags input ── */
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 28px;
}

/* ── Config tabs ── */
.config-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.config-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}
.config-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}
.config-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 500;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
}

/* ─── Dialog override ───────────────────────────────────── */

:deep(.el-dialog__body) {
  padding: 16px 20px !important;
}
</style>
