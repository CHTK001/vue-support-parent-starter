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
              <ElOption label="开发语言" value="language" />
              <ElOption label="运维工具" value="devops" />
              <ElOption label="远程桌面" value="remote" />
              <ElOption label="Web 服务" value="webserver" />
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

        <div v-else class="manage-grid">
          <div
            v-for="preset in presets"
            :key="preset.sysProjectContainerSoftwarePresetId"
            class="preset-card"
            @click="handleSelectPreset(preset)"
          >
            <div class="preset-card-icon">
              <IconifyIconOnline
                :icon="preset.softwareIcon || 'ep:box'"
                style="font-size: 36px; color: var(--el-color-primary)"
              />
            </div>
            <div class="preset-card-info">
              <div class="preset-card-name">{{ preset.softwareName }}</div>
              <div class="preset-card-code">{{ preset.softwareCode }}</div>
              <div class="preset-card-service" v-if="preset.serviceName">{{ preset.serviceName }}</div>
              <div class="preset-card-meta">
                <ElTag v-if="preset.softwareCategory" size="small">{{ categoryLabel(preset.softwareCategory) }}</ElTag>
                <ElTag v-if="preset.softwareVersion" size="small" type="info">v{{ preset.softwareVersion }}</ElTag>
                <ElTag v-if="preset.presetType" size="small" type="success" effect="plain">{{ getPresetTypeLabel(preset.presetType) }}</ElTag>
              </div>
              <div class="preset-card-mode-tags">
                <ElTag :type="supportsSystem(preset) ? 'success' : 'info'" size="small">
                  SYSTEM
                </ElTag>
                <ElTag :type="supportsDocker(preset) ? 'warning' : 'info'" size="small">
                  {{ dockerSupported(preset) ? "DOCKER" : "SYSTEM-only" }}
                </ElTag>
                <ElTag
                  v-if="dockerSupported(preset) && dockerScriptMode(preset) === 'dockerfile'"
                  size="small"
                  effect="plain"
                >
                  Dockerfile
                </ElTag>
              </div>
            </div>
            <div class="preset-card-actions" @click.stop>
              <ElTooltip content="编辑" placement="top">
                <ElButton circle size="small" text @click="openEditDialog(preset)">
                  <IconifyIconOnline icon="ep:edit" />
                </ElButton>
              </ElTooltip>
              <ElTooltip content="删除" placement="top">
                <ElButton circle size="small" text type="danger" @click="handleDelete(preset)">
                  <IconifyIconOnline icon="ep:delete" />
                </ElButton>
              </ElTooltip>
              <ElTooltip content="安装" placement="top">
                <ElButton circle size="small" type="primary" text @click="handleInstallPreset(preset)">
                  <IconifyIconOnline icon="ep:download" />
                </ElButton>
              </ElTooltip>
            </div>
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

    <ElDialog v-model="showDetail" title="软件详情" width="600px">
      <template v-if="selectedPreset">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="名称">{{ selectedPreset.softwareName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="编码">{{ selectedPreset.softwareCode }}</ElDescriptionsItem>
          <ElDescriptionsItem label="版本">{{ selectedPreset.softwareVersion || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="分类">{{ categoryLabel(selectedPreset.softwareCategory) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="预设类型">{{ getPresetTypeLabel(selectedPreset.presetType) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作系统">{{ selectedPreset.osType || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="厂商">{{ selectedPreset.softwareVendor || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="安装路径" :span="2">{{ selectedPreset.installPath || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="暴露端口" :span="2">{{ selectedPreset.exposePorts || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="端口映射" :span="2">{{ selectedPreset.hasPortMapping ? '开启' : '关闭' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="System 默认服务名" :span="2">
            {{ presetRemarkData.serviceName || selectedPreset.serviceName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="支持模式" :span="2">
            {{ (presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).join(' / ') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="(presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).includes('DOCKER')" label="Docker 默认镜像名" :span="2">
            {{ presetRemarkData.dockerDefaults?.image || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="(presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).includes('DOCKER')" label="Docker 默认方式" :span="2">
            {{
              presetRemarkData.dockerDefaults?.scriptMode === 'dockerfile'
                ? 'Dockerfile'
                : '脚本'
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="presetRemarkData.description" label="描述" :span="2">
            <div style="white-space: pre-wrap">{{ presetRemarkData.description }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="System 配置字段" :span="2">
            {{ systemConfigFieldSummary }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="(presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).includes('DOCKER')" label="Docker 配置字段" :span="2">
            {{ dockerConfigFieldSummary }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="System 脚本" :span="2">
            {{ systemScriptSummary }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="(presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).includes('DOCKER')" label="Docker 脚本" :span="2">
            {{ dockerScriptSummary }}
          </ElDescriptionsItem>
          <ElDescriptionsItem
            v-if="(presetRemarkData.supportedModes || ['SYSTEM', 'DOCKER']).includes('DOCKER') && presetRemarkData.dockerDefaults?.scriptMode === 'dockerfile' && presetRemarkData.dockerDefaults?.dockerfileContent"
            label="Dockerfile 默认内容"
            :span="2"
          >
            <div class="detail-code-block">{{ presetRemarkData.dockerDefaults?.dockerfileContent }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </template>
      <template #footer>
        <ElButton @click="showDetail = false">关闭</ElButton>
        <ElButton type="primary" @click="installFromDetail">安装此软件</ElButton>
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
  ElTooltip,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareFormDialog from "./SoftwareFormDialog.vue";
import DockerRegistryDialog from "./DockerRegistryDialog.vue";
import {
  createEmptyScriptSet,
  deletePreset,
  fetchPresetList,
  getPresetModeConfigFields,
  getPresetModeScripts,
  getPresetSupportedModes,
  getPresetTypeLabel,
  hasCompletePresetMode,
  parseSoftwarePresetRemark,
  type SoftwarePreset,
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

const presetRemarkData = computed(() =>
  selectedPreset.value ? parseSoftwarePresetRemark(selectedPreset.value.presetRemark) : {},
);

const scriptSummary = (mode: "SYSTEM" | "DOCKER") => {
  if (!selectedPreset.value) return "-";
  const scriptSet = getPresetModeScripts(selectedPreset.value, mode);
  const labels = [
    ["installScript", "安装"],
    ["startScript", "启动"],
    ["stopScript", "停止"],
    ["restartScript", "重启"],
    ["statusScript", "状态"],
    ["uninstallScript", "卸载"],
  ] as const;
  const filled = labels
    .filter(([key]) => scriptSet[key as keyof ReturnType<typeof createEmptyScriptSet>]?.trim())
    .map(([, label]) => label);
  return filled.length ? filled.join(" / ") : "-";
};

const configFieldSummary = (mode: "SYSTEM" | "DOCKER") => {
  if (!selectedPreset.value) return "-";
  const fields = getPresetModeConfigFields(selectedPreset.value, mode);
  return fields.length
    ? fields.map((field) => field.fieldLabel || field.fieldKey).join(" / ")
    : "-";
};

const systemConfigFieldSummary = computed(() => configFieldSummary("SYSTEM"));
const dockerConfigFieldSummary = computed(() => configFieldSummary("DOCKER"));
const systemScriptSummary = computed(() => scriptSummary("SYSTEM"));
const dockerScriptSummary = computed(() => scriptSummary("DOCKER"));

const supportsSystem = (preset: SoftwarePreset) =>
  hasCompletePresetMode(preset, "SYSTEM");

const supportsDocker = (preset: SoftwarePreset) =>
  hasCompletePresetMode(preset, "DOCKER");

const dockerSupported = (preset: SoftwarePreset) =>
  getPresetSupportedModes(preset).includes("DOCKER");

const dockerScriptMode = (preset: SoftwarePreset) =>
  parseSoftwarePresetRemark(preset.presetRemark).dockerDefaults?.scriptMode || "script";

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

const loadPresets = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (searchKeyword.value) params.softwareName = searchKeyword.value;
    if (categoryFilter.value) params.softwareCategory = categoryFilter.value;
    params.presetStatus = 1;
    params.presetDelete = 0;
    const res = await fetchPresetList(params);
    if (res.code === "00000") {
      presets.value = res.data || [];
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

const openEditDialog = (preset: SoftwarePreset) => {
  editingPreset.value = { ...preset };
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

const handleInstallPreset = (preset: SoftwarePreset) => {
  emit("install", preset);
};

const installFromDetail = () => {
  if (selectedPreset.value) {
    showDetail.value = false;
    emit("install", selectedPreset.value);
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
}
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
.manage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  overflow-y: auto;
}
.preset-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.preset-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.preset-card-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}
.preset-card-info {
  flex: 1;
  min-width: 0;
}
.preset-card-name {
  font-weight: 600;
  font-size: 14px;
}
.preset-card-code {
  font-size: 12px;
  font-family: monospace;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.preset-card-service {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 2px;
}
.preset-card-meta {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.preset-card-mode-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.preset-card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}
.detail-code-block {
  white-space: pre-wrap;
  font-family: "Cascadia Code", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--el-fill-color-light);
  padding: 10px 12px;
  border-radius: 6px;
}
</style>
