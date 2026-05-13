<template>
  <sc-dialog
    v-model="visibleInner"
    title="文件存储配置"
    width="90%"
    top="20px"
    :close-on-click-modal="false"
    class="file-storage-dialog"
    @close="handleClose"
  >
    <div class="three-col">
      <div class="left-col">
        <ScCard class="global-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">
                <IconifyIconOnline icon="ri:settings-4-line" class="header-icon" />
                全局设置
              </div>
            </div>
          </template>
          <ScScrollbar class="global-scrollbar">
            <div class="global-content">
              <!-- 功能开关区域 -->
              <div class="setting-section">
                <div class="section-title">
                  <IconifyIconOnline icon="ri:toggle-line" />
                  <span>功能开关</span>
                </div>
                <div class="switch-grid">
                  <ScSwitch v-model="global.openDownload" layout="compact-card" label="下载" active-icon="ri:download-cloud-line" size="small" />
                  <ScSwitch v-model="global.openPreview" layout="compact-card" label="预览" active-icon="ri:eye-line" size="small" />
                  <ScSwitch v-model="global.openPlugin" layout="compact-card" label="插件" active-icon="ri:plug-line" size="small" />
                  <ScSwitch v-model="global.openSetting" layout="compact-card" label="设置" active-icon="ri:equalizer-line" size="small" />
                  <ScSwitch v-model="global.openFormat" layout="compact-card" label="文件转化" active-icon="ri:file-transfer-line" size="small" />
                  <ScSwitch v-model="global.openRange" layout="compact-card" label="Range" active-icon="ri:split-cells-horizontal" size="small" />
                  <ScSwitch v-model="global.openWatermark" layout="compact-card" label="水印" active-icon="ri:drop-line" size="small" />
                  <ScSwitch v-model="global.openWebjars" layout="compact-card" label="WebJars" active-icon="ri:javascript-line" size="small" />
                  <ScSwitch v-model="global.openRemoteFile" layout="compact-card" label="远程文件" active-icon="ri:global-line" size="small" />
                </div>
              </div>

              <!-- 扩展配置区域 -->
              <div class="setting-section" v-if="global.openSetting || global.openPlugin">
                <div class="section-title">
                  <IconifyIconOnline icon="ri:apps-line" />
                  <span>扩展配置</span>
                </div>
                <div class="ext-config">
                  <div class="config-item" v-if="global.openSetting">
                    <label class="config-label">
                      <IconifyIconOnline icon="ri:list-settings-line" />
                      参数设置
                    </label>
                    <ScSelect v-model="imageSettingSelection" :options="imageSettingSelectOptions" layout="select" multiple filterable allow-create default-first-option placeholder="选择或自定义参数" class="config-select" />
                  </div>
                  <div class="config-item" v-if="global.openPlugin">
                    <label class="config-label">
                      <IconifyIconOnline icon="ri:puzzle-line" />
                      启用插件
                    </label>
                    <ScSelect v-model="imageFilterSelection" :options="imageFilterSelectOptions" layout="select" multiple filterable allow-create default-first-option placeholder="选择或自定义插件" class="config-select" />
                  </div>
                </div>
              </div>

              <!-- 缓存配置 -->
              <div class="setting-section">
                <div class="section-title">
                  <IconifyIconOnline icon="ri:timer-line" />
                  <span>缓存配置</span>
                </div>
                <div class="cache-config">
                  <div class="cache-item">
                    <span class="cache-label">格式缓存时间</span>
                    <div class="cache-input">
                      <ScInputNumber v-model="global.formatCacheTimeMinutes" :min="0" :max="1440 * 7" size="small" controls-position="right" />
                      <span class="cache-unit">分钟</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 水印配置区域 -->
              <div class="setting-section watermark-section" v-if="global.openWatermark">
                <div class="section-title">
                  <IconifyIconOnline icon="ri:drop-line" />
                  <span>水印配置</span>
                </div>
                <div class="watermark-config">
                  <div class="watermark-row">
                    <div class="watermark-item full">
                      <label>水印内容</label>
                      <ScInput v-model="global.watermark" placeholder="文本或图片URL" size="small">
                        <template #prefix><IconifyIconOnline icon="ri:text" /></template>
                      </ScInput>
                    </div>
                  </div>
                  <div class="watermark-row">
                    <div class="watermark-item">
                      <label>颜色</label>
                      <ScInput v-model="global.watermarkColor" placeholder="#RRGGBB" size="small">
                        <template #prefix><IconifyIconOnline icon="ri:palette-line" /></template>
                      </ScInput>
                    </div>
                    <div class="watermark-item">
                      <label>X 坐标</label>
                      <ScInputNumber v-model="global.watermarkX" :min="-9999" :max="9999" size="small" controls-position="right" />
                    </div>
                    <div class="watermark-item">
                      <label>Y 坐标</label>
                      <ScInputNumber v-model="global.watermarkY" :min="-9999" :max="9999" size="small" controls-position="right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScScrollbar>
        </ScCard>
      </div>

      <div class="middle-col">
        <ScCard class="installed-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">已安装的存储</div>
              <div class="header-actions">
                <ScButton type="primary" size="small" @click="onAddClick">
                  <IconifyIconOnline icon="ri:add-line" />
                  新增存储
                </ScButton>
                <ScButton v-if="isServerRunning" size="small" @click="openFullPreview">
                  <IconifyIconOnline icon="ri:eye-line" />
                  预览
                </ScButton>
              </div>
            </div>
          </template>
          <div v-if="storages.length === 0" class="empty-tip">
            <ScEmpty description="尚未添加任何文件存储">
              <ScButton type="primary" @click="onAddClick">新增存储</ScButton>
            </ScEmpty>
          </div>
          <ScScrollbar v-else class="installed-list thin-scrollbar">
            <div v-for="(s, idx) in storages" :key="idx" class="storage-item" :class="{ active: selectedIndex === idx }" @click="selectStorage(idx)">
              <div class="storage-status-bar" :class="s.fileStorageEnabled ? 'enabled' : 'disabled'"></div>
              <div class="storage-header">
                <div class="storage-icon-wrapper">
                  <IconifyIconOnline :icon="getStorageIcon(s.fileStorageType)" />
                </div>
                <div class="storage-meta">
                  <div class="storage-type">{{ getFileStorageDescribe(s.fileStorageType) || "-" }}</div>
                  <div class="storage-seq">#{{ idx + 1 }}</div>
                </div>
                <ScTag size="small" :type="s.fileStorageEnabled ? 'success' : 'info'" effect="dark" class="storage-status-tag">
                  {{ s.fileStorageEnabled ? "启用" : "禁用" }}
                </ScTag>
              </div>
              <div class="storage-path">
                <IconifyIconOnline icon="ri:folder-line" class="path-icon" />
                <span v-if="isLocalStorageType(s.fileStorageType)" class="path-text">{{ s.fileStorageEndpoint || "未配置路径" }}</span>
                <span v-else class="path-text">{{ s.fileStorageBucket || "-" }} @ {{ s.fileStorageEndpoint || "-" }}</span>
              </div>
              <div class="storage-actions">
                <ScTooltip v-if="isServerRunning" content="预览文件" placement="top">
                  <ScButton circle size="small" @click.stop="previewStorage(idx)">
                    <IconifyIconOnline icon="ri:eye-line" />
                  </ScButton>
                </ScTooltip>
                <ScTooltip content="测试连接" placement="top">
                  <ScButton circle size="small" @click.stop="testConnection(idx)">
                    <IconifyIconOnline icon="ri:wifi-line" />
                  </ScButton>
                </ScTooltip>
                <ScTooltip content="删除存储" placement="top">
                  <ScButton circle size="small" type="danger" @click.stop="removeStorage(idx)">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </ScButton>
                </ScTooltip>
              </div>
            </div>
          </ScScrollbar>
        </ScCard>
      </div>

      <div class="right-col">
        <ScCard class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">存储配置</div>
          </template>

          <!-- 预览面板 -->
          <div class="preview-panel" v-if="rightPreview.visible">
            <div class="preview-toolbar">
              <div class="toolbar-left">
                <ScSegmented v-model="rightPreview.mode" :options="previewModeOptions" size="small" />
              </div>
              <div class="toolbar-right">
                <ScButton size="small" circle @click="fetchPreviewItems">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </ScButton>
              </div>
            </div>
            <div class="preview-content thin-scrollbar">
              <!-- 小图模式：只显示图标 -->
              <div v-if="rightPreview.mode === 'list'" class="file-list-view">
                <div v-for="it in previewItems" :key="it.id" class="file-list-item file-item-clickable" @click="handleFilePreview(it)">
                  <div class="file-icon"><IconifyIconOnline :icon="getFileIcon(it.ext)" /></div>
                  <div class="file-info">
                    <div class="file-name" :title="it.name">{{ it.name }}</div>
                  </div>
                </div>
                <ScEmpty v-if="previewItems.length === 0" description="暂无文件" />
              </div>

              <!-- 图片模式：前端能预览的都显示预览 -->
              <div v-else-if="rightPreview.mode === 'card'" class="file-card-view">
                <div v-for="it in previewItems" :key="it.id" class="file-card-item file-item-clickable" @click="handleFilePreview(it)">
                  <!-- 图片显示实际缩略图 -->
                  <div v-if="isImagePreviewItem(it)" class="card-icon card-icon-img">
                    <img :src="getPreviewImageUrl(it)" class="card-thumb-img" @error="onCardImgError($event, it)" />
                  </div>
                  <!-- 其他文件显示渐变图标 -->
                  <div v-else class="card-icon" :class="getFileColorClass(it.ext)">
                    <IconifyIconOnline :icon="getFileIcon(it.ext)" />
                    <span class="ext-label">{{ it.ext || "?" }}</span>
                  </div>
                  <div class="card-info">
                    <div class="card-name" :title="it.name">{{ it.name }}</div>
                    <div class="card-size">{{ it.size }}</div>
                  </div>
                </div>
                <ScEmpty v-if="previewItems.length === 0" description="暂无文件" />
              </div>

              <!-- 大图视图：尽可能预览 -->
              <div v-else class="file-image-view">
                <div v-for="it in previewItems" :key="it.id" class="image-item file-item-clickable" @click="handleFilePreview(it)">
                  <!-- 图片缩略图 -->
                  <img v-if="isImagePreviewItem(it)" :src="getPreviewImageUrl(it)" class="file-thumb-img" @error="onImgError($event)" />
                  <!-- PDF 缩略图 -->
                  <div v-else-if="isPdfFile(it)" class="file-thumb-pdf">
                    <IconifyIconOnline icon="ri:file-pdf-line" />
                    <span class="thumb-label">PDF</span>
                    <div class="thumb-overlay"><IconifyIconOnline icon="ri:eye-line" /><span>点击预览</span></div>
                  </div>
                  <!-- Word 缩略图 -->
                  <div v-else-if="isWordFile(it)" class="file-thumb-word">
                    <IconifyIconOnline icon="ri:file-word-line" />
                    <span class="thumb-label">Word</span>
                    <div class="thumb-overlay"><IconifyIconOnline icon="ri:eye-line" /><span>点击预览</span></div>
                  </div>
                  <!-- Excel 缩略图 -->
                  <div v-else-if="isExcelFile(it)" class="file-thumb-excel">
                    <IconifyIconOnline icon="ri:file-excel-line" />
                    <span class="thumb-label">Excel</span>
                    <div class="thumb-overlay"><IconifyIconOnline icon="ri:eye-line" /><span>点击预览</span></div>
                  </div>
                  <!-- 其他文件 -->
                  <div v-else class="file-thumb-other">
                    <IconifyIconOnline :icon="getFileIcon(it.ext)" />
                  </div>
                  <div class="image-name" :title="it.name">{{ it.name }}</div>
                </div>
                <ScEmpty v-if="previewItems.length === 0" description="暂无文件" />
              </div>
            </div>
            <div class="preview-footer">
              <div class="page-info">共 {{ previewItems.length }} 项</div>
              <div class="page-controls">
                <ScButton-group size="small">
                  <ScButton @click="goPrevPage" :disabled="pager.page <= 1">
                    <IconifyIconOnline icon="ri:arrow-left-s-line" />
                  </ScButton>
                  <ScButton disabled class="page-number">{{ pager.page }}</ScButton>
                  <ScButton @click="goNextPage" :disabled="previewItems.length < pager.limit">
                    <IconifyIconOnline icon="ri:arrow-right-s-line" />
                  </ScButton>
                </ScButton-group>
                <ScSelect v-model="pager.limit" size="small" style="width: 80px; margin-left: 12px" @change="onLimitChange">
                  <ScOption :value="20" label="20条" />
                  <ScOption :value="50" label="50条" />
                  <ScOption :value="100" label="100条" />
                </ScSelect>
              </div>
            </div>
          </div>

          <!-- 配置表单 -->
          <div v-else-if="currentStorage" class="storage-form-wrap">
            <ScSelect v-model="currentStorage.fileStorageType" :options="typeOptions" class="storage-type-select" />
            <div class="storage-form">
              <template v-if="isLocalStorageType(currentStorage.fileStorageType)">
                <div class="fc-field">
                  <label>根路径</label>
                  <ScInput v-model="currentStorage.fileStorageEndpoint" placeholder="请输入服务器本地根路径，如: H:\\data\\storage" />
                </div>
                <div class="fc-field">
                  <label>存储桶</label>
                  <ScInput v-model="currentStorage.fileStorageBucket" placeholder="存储桶名称" />
                </div>
              </template>
              <template v-else>
                <div class="fc-field">
                  <label>端点</label>
                  <ScInput v-model="currentStorage.fileStorageEndpoint" placeholder="https://endpoint" />
                </div>
                <div class="fc-field">
                  <label>存储桶</label>
                  <ScInput v-model="currentStorage.fileStorageBucket" placeholder="存储桶名称" />
                </div>
                <div class="fc-field">
                  <label>访问密钥</label>
                  <ScInput v-model="currentStorage.fileStorageAccessKey" placeholder="Access Key ID" />
                </div>
                <div class="fc-field">
                  <label>密钥</label>
                  <ScInput v-model="currentStorage.fileStorageSecretKey" type="password" placeholder="Secret Access Key" show-password />
                </div>
                <div class="fc-field" v-if="currentStorage.fileStorageType === 'S3' || currentStorage.fileStorageType === 'ALIYUN'">
                  <label>区域</label>
                  <ScInput v-model="currentStorage.fileStorageRegion" placeholder="区域代码，如: us-east-1" />
                </div>
                <div class="fc-field">
                  <label>基础路径</label>
                  <ScInput v-model="currentStorage.fileStorageBasePath" placeholder="存储桶内的基础路径，如: /app/uploads" />
                </div>
              </template>
              <div class="fc-field fc-field-switch">
                <label>启用状态</label>
                <ScSwitch v-model="currentStorage.fileStorageEnabled" />
                <span class="status-label" :class="{ enabled: currentStorage.fileStorageEnabled }">
                  {{ currentStorage.fileStorageEnabled ? "已启用" : "已禁用" }}
                </span>
              </div>
            </div>
          </div>
          <ScEmpty v-else description="请选择左侧已安装的存储或新增一个" class="right-col-empty" />
        </ScCard>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <ScDialog v-model="previewDialogVisible" :title="previewDialogTitle" width="75%" top="5vh" destroy-on-close append-to-body class="file-preview-dialog" @close="previewDialogVisible = false">
      <div class="file-preview-body">
        <iframe v-if="previewFileRenderHtml" :src="previewFileUrl" class="pdf-viewer" frameborder="0" allowfullscreen />
        <img v-else :src="previewFileUrl" class="image-viewer" @error="onPreviewImgError" />
      </div>
    </ScDialog>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">保存</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { fileStorageList } from "@/api/file-manager/file-storage";
import { fetchOptionObjectsList } from "@/api/spi";
import type { SystemServer } from "@/api/system-server";
import {
  deleteFileStorageById,
  deleteFileStorageConfig,
  getFileStorageConfig,
  getServletFilterConfig,
  getServletFilterConfigItems,
  saveFileStorageConfig,
  updateFileStorageConfig,
  updateServletFilterConfig,
  type FileStorageConfig,
} from "@/api/system-server-setting";
import ScSelect from "@repo/components/ScSelect";
import { ScButton } from "@repo/components/ScButton";
import { ScCard } from "@repo/components/ScCard";
import { ScDialog } from "@repo/components/ScDialog";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScInput } from "@repo/components/ScInput";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";
import { ScScrollbar } from "@repo/components/ScScrollbar";
import { ScSwitch } from "@repo/components/ScSwitch";
import { ScTag } from "@repo/components/ScTag";
import { ScTooltip } from "@repo/components/ScTooltip";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { computed, nextTick, ref, watch } from "vue";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId?: number;
  server?: SystemServer;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const storages = ref<Array<FileStorageConfig>>([]);
const selectedIndex = ref<number | null>(null);
type SpiOption = {
  name: string;
  describe?: string;
  value?: string;
  label?: string;
};
const typeOptions = ref<SpiOption[]>([]);
const SPI_FILE_STORAGE_TYPES = [
  "fileStorage",
  "com.chua.common.support.storage.oss.FileStorage",
  "FileStorage",
];
const SPI_IMAGE_SETTING_TYPES = [
  "com.chua.common.support.network.protocol.storage.image.ImageSettingProcessor",
  "ImageSettingProcessor",
  "imageSettingProcessor",
];
const SPI_IMAGE_FILTER_TYPES = [
  "com.chua.common.support.image.filter.ImageFilter",
  "ImageFilter",
  "fileStoragePlugin",
];
const DEFAULT_IMAGE_SETTING_OPTIONS = [
  "url", "format", "rotate", "thumbnail", "quality", "gray", "charset", "can", "limit",
];

function normalizeStorageType(type?: string): string {
  const normalized = String(type || "").trim().toUpperCase();
  return normalized === "LOCAL" ? "FILESYSTEM" : normalized;
}
function isLocalStorageType(type?: string): boolean {
  return normalizeStorageType(type) === "FILESYSTEM";
}

const isServerRunning = computed(
  () => String(props.server?.systemServerStatus || "").toUpperCase() === "RUNNING"
);

// 全局设置默认值
const global = ref({
  openDownload: true,
  openPreview: true,
  openPlugin: false,
  openSetting: false,
  openFormat: false,
  openRange: false,
  openWatermark: false,
  openWebjars: true,
  openRemoteFile: false,
  pluginsStr: "",
  downloadUserAgentStr: "",
  settingsStr: "",
  formatsStr: "",
  watermark: "",
  watermarkColor: "",
  watermarkX: 0,
  watermarkY: 0,
  formatCacheTimeMinutes: 1440,
});

function parseArrayOrString(value: any): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "string") {
    let str = value.trim();
    if (str.startsWith("[") && str.endsWith("]")) str = str.slice(1, -1);
    return str;
  }
  return "";
}

const imageSettingOptions = ref<SpiOption[]>([]);
const imageFilterOptions = ref<SpiOption[]>([]);
const imageSettingSelection = ref<string[]>([]);
const imageFilterSelection = ref<string[]>([]);
const suppressSelectionSync = ref(false);
const imageSettingSelectOptions = computed(() =>
  imageSettingOptions.value.map((opt) => ({
    label: opt.describe || opt.label || opt.name,
    value: opt.name,
  }))
);
const imageFilterSelectOptions = computed(() =>
  imageFilterOptions.value.map((opt) => ({
    label: opt.describe || opt.label || opt.name,
    value: opt.name,
  }))
);

function parseSelectionList(value?: string): string[] {
  return String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
}
function injectSelectedOptions(target: SpiOption[], selected: string[]) {
  const existing = new Set(target.map((it) => it.name));
  for (const name of selected) {
    if (!existing.has(name)) {
      target.push({ name, describe: name });
      existing.add(name);
    }
  }
}
function syncSelectionsFromGlobal() {
  imageSettingSelection.value = parseSelectionList(global.value.settingsStr);
  imageFilterSelection.value = parseSelectionList(global.value.pluginsStr);
  injectSelectedOptions(imageSettingOptions.value, imageSettingSelection.value);
  injectSelectedOptions(imageFilterOptions.value, imageFilterSelection.value);
}
function applySelectionsToGlobal() {
  if (suppressSelectionSync.value) return;
  if (global.value.openSetting) global.value.settingsStr = imageSettingSelection.value.join(",");
  if (global.value.openPlugin) global.value.pluginsStr = imageFilterSelection.value.join(",");
}

watch([imageSettingSelection, imageFilterSelection, () => global.value.openSetting, () => global.value.openPlugin], () => { applySelectionsToGlobal(); });
watch([() => global.value.openSetting, () => global.value.openPlugin], async ([openSetting, openPlugin], [prevOpenSetting, prevOpenPlugin]) => {
  if (!visibleInner.value) return;
  const activateSetting = openSetting && !prevOpenSetting;
  const activatePlugin = openPlugin && !prevOpenPlugin;
  if (activateSetting || activatePlugin) await loadOptionalProviderOptions();
});

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

const getIcon = (type: any) => {
  if (!type) return "ri:file-line";
  if (isLocalStorageType(type)) return "ri:computer-line";
  if (type === "FTP" || type === "SFTP") return "ri:folder-2-line";
  if (type === "ALIYUN") return "ri:cloud-line";
  return "ri:file-line";
};
const getStorageIcon = (type: any) => {
  const iconMap: Record<string, string> = {
    FILESYSTEM: "ri:hard-drive-2-line", LOCAL: "ri:hard-drive-2-line",
    S3: "ri:amazon-line", MINIO: "ri:database-2-line",
    ALIYUN: "ri:cloud-line", OSS: "ri:cloud-line",
    FTP: "ri:folder-transfer-line", SFTP: "ri:folder-shield-2-line",
  };
  return iconMap[type] || "ri:file-line";
};
const getFileStorageDescribe = (type: any) => {
  return typeOptions.value.find((it) => it.value === type)?.describe || type;
};

async function testConnection(idx: number) {
  const storage = storages.value[idx];
  if (!storage) return;
  try {
    message("正在测试连接...", { type: "info" });
    setTimeout(() => { message("连接测试成功", { type: "success" }); }, 1000);
  } catch (error: any) {
    message("连接测试失败: " + error.message, { type: "error" });
  }
}
function selectStorage(idx: number) {
  selectedIndex.value = idx;
  rightPreview.value.visible = false;
}
function newStorage(): FileStorageConfig {
  const preferredType = typeOptions.value.length > 0
    ? normalizeStorageType(typeOptions.value[0].name || typeOptions.value[0].value)
    : "FILESYSTEM";
  return {
    fileStorageServerId: props.serverId,
    fileStorageEnabled: true,
    fileStorageType: preferredType,
    fileStorageBasePath: "",
    fileStorageEndpoint: "",
    fileStorageBucket: "local",
    fileStorageAccessKey: "",
    fileStorageSecretKey: "",
    fileStorageRegion: "",
  } as any;
}

// 右侧预览
const rightPreview = ref({ visible: false, mode: "list" as "list" | "card" | "image" });
const previewItems = ref<any[]>([]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "avif"]);
const currentPreviewStorage = computed(() =>
  selectedIndex.value != null ? storages.value[selectedIndex.value] : storages.value[0]
);

function isImagePreviewItem(it: any): boolean {
  const ext = String(it?.ext || "").trim().toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}
function isPdfFile(it: any): boolean {
  return String(it?.ext || "").trim().toLowerCase() === "pdf";
}
function isWordFile(it: any): boolean {
  return ["doc", "docx"].includes(String(it?.ext || "").trim().toLowerCase());
}
function isExcelFile(it: any): boolean {
  return ["xls", "xlsx"].includes(String(it?.ext || "").trim().toLowerCase());
}
function isOfficeFile(it: any): boolean {
  return isWordFile(it) || isExcelFile(it);
}
function canPreviewFile(it: any): boolean {
  return isImagePreviewItem(it) || isPdfFile(it) || isOfficeFile(it);
}

function normalizePath(path?: string): string {
  const normalized = String(path || "").replace(/\\+/g, "/");
  if (!normalized) return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
function joinPath(parent?: string, name?: string): string {
  const p = normalizePath(parent).replace(/\/+$/, "");
  const n = String(name || "").trim().replace(/^\/+/, "");
  if (!n) return p || "/";
  return `${p || ""}/${n}` || "/";
}
function getServerAccessBaseUrl(): string {
  const rawHost = String(props.server?.systemServerHost || "127.0.0.1").trim();
  const host = !rawHost || rawHost === "0.0.0.0" ? "127.0.0.1" : rawHost;
  const port = Number(props.server?.systemServerPort || 0);
  if (!port) return "";
  return `http://${host}:${port}`;
}
function getPreviewImageUrl(it: any): string {
  const directUrl = String(it?.url || "").trim();
  if (directUrl) return directUrl;
  const s = currentPreviewStorage.value;
  if (!s) return "";
  const base = getServerAccessBaseUrl();
  if (!base) return "";
  const bucket = String(s.fileStorageBucket || "").trim().replace(/^\/+/, "");
  if (!bucket) return "";
  const filePath = String(it?.filePath || it?.parentPath || s.fileStorageBasePath || "/");
  const fullPath = joinPath(filePath, it?.name).replace(/^\/+/, "");
  const urlPath = `${bucket}/${fullPath}`.replace(/\/+/g, "/");
  return `${base}/${urlPath}`;
}

// 文件预览对话框
const previewDialogVisible = ref(false);
const previewFileUrl = ref("");
const previewFileName = ref("");
const previewFileRenderHtml = ref(false); // true=iframe, false=img

const previewFileIcon = computed(() => {
  if (!previewFileName.value) return "ri:file-line";
  const ext = previewFileName.value.split(".").pop()?.toLowerCase() || "";
  if (["doc", "docx"].includes(ext)) return "ri:file-word-line";
  if (["xls", "xlsx"].includes(ext)) return "ri:file-excel-line";
  if (ext === "pdf") return "ri:file-pdf-line";
  return "ri:file-line";
});
const previewDialogTitle = computed(() => {
  const name = previewFileName.value || "文件预览";
  return `${name}`;
});

function handleFilePreview(it: any) {
  if (!it || !canPreviewFile(it)) return;
  const url = getPreviewImageUrl(it);
  if (!url) {
    message("无法获取文件预览地址", { type: "warning" });
    return;
  }
  previewFileUrl.value = url;
  previewFileName.value = it.name || "";
  previewFileRenderHtml.value = isPdfFile(it) || isOfficeFile(it);
  previewDialogVisible.value = true;
}

function onImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  if (target) target.style.display = "none";
}

function onCardImgError(e: Event, it: any) {
  const img = e.target as HTMLImageElement;
  if (img) {
    img.style.display = "none";
    // 图片加载失败时回退到图标
    const parent = img.closest(".card-icon") as HTMLElement;
    if (parent) {
      parent.className = "card-icon " + (getFileColorClass(it?.ext) || "color-default");
      parent.innerHTML = `<span class="iconify" data-icon="${getFileIcon(it?.ext)}"></span><span class="ext-label">${it?.ext || "?"}</span>`;
    }
  }
}

function onPreviewImgError() {
  message("图片加载失败", { type: "warning" });
}

const previewModeOptions = [
  { label: "列表", value: "list" },
  { label: "卡片", value: "card" },
  { label: "大图", value: "image" },
];

const getFileIcon = (ext: string): string => {
  if (!ext) return "ri:file-line";
  const lowerExt = ext.toLowerCase();
  const iconMap: Record<string, string> = {
    jpg: "ri:image-line", jpeg: "ri:image-line", png: "ri:image-line",
    gif: "ri:image-line", bmp: "ri:image-line", svg: "ri:image-line", webp: "ri:image-line",
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line", docx: "ri:file-word-line",
    xls: "ri:file-excel-line", xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line", pptx: "ri:file-ppt-line",
    txt: "ri:file-text-line", md: "ri:markdown-line",
    js: "ri:javascript-line", ts: "ri:code-line", vue: "ri:vuejs-line",
    html: "ri:html5-line", css: "ri:css3-line", json: "ri:braces-line",
    java: "ri:code-box-line", py: "ri:code-line", xml: "ri:code-s-slash-line",
    zip: "ri:file-zip-line", rar: "ri:file-zip-line", "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line", gz: "ri:file-zip-line",
    mp4: "ri:video-line", avi: "ri:video-line", mov: "ri:video-line", mkv: "ri:video-line",
    mp3: "ri:music-line", wav: "ri:music-line", flac: "ri:music-line",
  };
  return iconMap[lowerExt] || "ri:file-line";
};

const getFileColorClass = (ext: string): string => {
  if (!ext) return "color-default";
  const lowerExt = ext.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(lowerExt)) return "color-image";
  if (["pdf"].includes(lowerExt)) return "color-pdf";
  if (["doc", "docx"].includes(lowerExt)) return "color-word";
  if (["xls", "xlsx"].includes(lowerExt)) return "color-excel";
  if (["ppt", "pptx"].includes(lowerExt)) return "color-ppt";
  if (["js", "ts", "vue", "html", "css", "json", "java", "py", "xml"].includes(lowerExt)) return "color-code";
  if (["zip", "rar", "7z", "tar", "gz"].includes(lowerExt)) return "color-archive";
  if (["mp4", "avi", "mov", "mkv"].includes(lowerExt)) return "color-video";
  if (["mp3", "wav", "flac"].includes(lowerExt)) return "color-audio";
  return "color-default";
};

// 轻量缓存
const listCache = new Map<string, { ts: number; items: any[]; marker: string }>();
const CACHE_TTL = 30_000;
function makeCacheKey(serverId: number, s: any, basePath: string, limit: number, marker: string) {
  return [serverId, s?.fileStorageType, s?.fileStorageEndpoint, s?.fileStorageBucket, basePath, limit, marker].join("|");
}

const pager = ref({ page: 1, limit: 20, marker: "", nextMarker: "" });

function base64EncodeUtf8(input: string) {
  return btoa(unescape(encodeURIComponent(input)));
}
function hexEncode(str: string) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function makeMarker(index: number) {
  if (!index || index <= 1) return "";
  const b64 = base64EncodeUtf8(`${index}_0`);
  return hexEncode(b64);
}
function resetPager() {
  pager.value.page = 1;
  pager.value.marker = "";
  pager.value.nextMarker = "";
}
function onLimitChange() { resetPager(); fetchPreviewItems(); }
function goPrevPage() {
  if (pager.value.page <= 1) return;
  pager.value.page -= 1;
  pager.value.marker = pager.value.page === 1 ? "" : makeMarker(pager.value.page);
  fetchPreviewItems();
}
function goNextPage() {
  if (previewItems.value.length < pager.value.limit) return;
  pager.value.page += 1;
  pager.value.marker = makeMarker(pager.value.page);
  fetchPreviewItems();
}

function previewStorage(idx: number) {
  if (!isServerRunning.value) return;
  selectedIndex.value = idx;
  rightPreview.value.visible = true;
  fetchPreviewItems();
}

async function openFullPreview() {
  if (!isServerRunning.value) return;
  if (storages.value.length === 0) {
    ElMessageBox.alert("请先添加一个文件存储配置", "提示");
    return;
  }
  try {
    const url = `#/service/file-storage/preview/${props.serverId}`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  } catch {
    ElMessageBox.alert("无法打开全屏预览页面", "提示");
  }
}

async function fetchPreviewItems() {
  try {
    if (loading.value) return;
    loading.value = true;
    const s = selectedIndex.value != null ? storages.value[selectedIndex.value] : storages.value[0];
    if (!s) { loading.value = false; return; }
    const basePath = s.fileStorageBasePath || "/";
    const key = makeCacheKey(props.serverId, s, basePath, pager.value.limit, pager.value.marker || "");
    const now = Date.now();
    const cached = listCache.get(key);
    if (cached && now - cached.ts < CACHE_TTL) {
      previewItems.value = cached.items;
      pager.value.marker = cached.marker || pager.value.marker;
      loading.value = false;
      return;
    }
    const params = new URLSearchParams();
    params.append("serverId", String(props.serverId));
    params.append("type", s.fileStorageType || "");
    params.append("bucket", s.fileStorageBucket || "");
    params.append("endpoint", s.fileStorageEndpoint || "");
    params.append("basePath", basePath);
    params.append("limit", String(pager.value.limit));
    params.append("marker", pager.value.marker || "");
    params.append("fields", "name,size,modified,ext,url");
    params.append("simple", "1");
    const res = await fileStorageList(params);
    const rr = res?.data;
    const items = Array.isArray(rr?.metadata) ? rr.metadata : [];
    const mapped = (items || []).map((it: any, i: number) => ({
      id: it.fileId || it.id || i,
      name: it.name || it.filename || it.fileName || it.originalFilename || it.path || "",
      size: it.size || it.fileSize || it.length || "",
      modified: it.modified || it.lastModified || it.updateTime || "",
      ext: it.ext || it.suffix || "",
      filePath: it.filePath || it.parentPath || basePath || "/",
      url: it.url || it.previewUrl || it.downloadUrl || "",
    }));
    previewItems.value = mapped;
    listCache.set(key, { ts: now, items: mapped, marker: pager.value.marker });
  } catch {
    console.error("获取预览文件列表失败");
    previewItems.value = [];
    message("获取文件列表失败，请检查存储配置", { type: "warning" });
  } finally {
    loading.value = false;
  }
}

function addStorage() {
  storages.value.push(newStorage());
  nextTick(() => { selectedIndex.value = storages.value.length - 1; });
}

async function removeStorage(idx: number) {
  const storage = storages.value[idx];
  if (!storage) return;
  try {
    await ElMessageBox.confirm(`确定要移除存储 #${idx + 1} 吗？`, "确认删除", {
      confirmButtonText: "确定", cancelButtonText: "取消", type: "warning",
    });
    if (storage.systemServerSettingFileStorageId) {
      try {
        const res = await deleteFileStorageById(storage.systemServerSettingFileStorageId);
        if (!res.success) { message(res.msg || "删除失败", { type: "error" }); return; }
      } catch { message("删除存储失败，请稍后重试", { type: "error" }); return; }
    }
    storages.value.splice(idx, 1);
    if (selectedIndex.value != null) {
      if (storages.value.length === 0) selectedIndex.value = null;
      else if (idx <= selectedIndex.value) selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    }
    rightPreview.value.visible = false;
    message("存储已移除", { type: "success" });
  } catch { /* user cancelled */ }
}

async function loadGlobal() {
  if (!props.filterSettingId) return;
  const res = await getServletFilterConfig(props.filterSettingId);
  if (res.success && res.data) {
    suppressSelectionSync.value = true;
    try {
      const cfg = res.data as any;
      global.value.openDownload = cfg.openDownload == "true";
      global.value.openPreview = cfg.openPreview == "true";
      global.value.openPlugin = cfg.openPlugin == "true";
      global.value.openSetting = cfg.openSetting == "true";
      global.value.openRange = cfg.openRange == "true";
      global.value.openWatermark = cfg.openWatermark == "true";
      global.value.openWebjars = cfg.openWebjars == "true";
      global.value.openRemoteFile = cfg.openRemoteFile == "true";
      const pluginsStr = parseArrayOrString(cfg.plugins) || cfg.pluginsStr || "";
      const pluginsArr = pluginsStr.split(",").map((s) => s.trim()).filter(Boolean);
      global.value.openFormat = pluginsArr.includes("format");
      global.value.pluginsStr = pluginsArr.filter((s) => s !== "format").join(",");
      global.value.downloadUserAgentStr = Array.isArray(cfg.downloadUserAgent)
        ? cfg.downloadUserAgent.join(",") : cfg.downloadUserAgentStr || "";
      global.value.settingsStr = parseArrayOrString(cfg.settings) || cfg.settingsStr || "";
      global.value.watermark = cfg.watermark || "";
      global.value.watermarkColor = cfg.watermarkColor || "";
      global.value.watermarkX = Number(cfg.watermarkX ?? 0);
      global.value.watermarkY = Number(cfg.watermarkY ?? 0);
      global.value.formatCacheTimeMinutes = Number(cfg.formatCacheTimeMinutes ?? 1440);
      syncSelectionsFromGlobal();
    } finally { suppressSelectionSync.value = false; }
  }
}

async function saveGlobal() {
  if (!props.filterSettingId) return true;
  const payload: Record<string, any> = {
    openDownload: !!global.value.openDownload,
    openPreview: !!global.value.openPreview,
    openPlugin: !!global.value.openPlugin,
    openSetting: !!global.value.openSetting,
    openRange: !!global.value.openRange,
    openWatermark: !!global.value.openWatermark,
    openWebjars: !!global.value.openWebjars,
    openRemoteFile: !!global.value.openRemoteFile,
    plugins: (() => {
      const arr = global.value.openPlugin ? [...imageFilterSelection.value] : [];
      if (global.value.openFormat && !arr.includes("format")) arr.unshift("format");
      return arr.length > 0 ? arr : undefined;
    })(),
    settings: global.value.openSetting ? imageSettingSelection.value : undefined,
    watermark: global.value.openWatermark ? global.value.watermark || undefined : undefined,
    watermarkColor: global.value.openWatermark ? global.value.watermarkColor || undefined : undefined,
    watermarkX: global.value.openWatermark ? Number(global.value.watermarkX || 0) : undefined,
    watermarkY: global.value.openWatermark ? Number(global.value.watermarkY || 0) : undefined,
    formatCacheTimeMinutes: Number(global.value.formatCacheTimeMinutes || 0),
  };
  const res = await updateServletFilterConfig(props.filterSettingId, payload);
  return !!res.success;
}

async function loadConfigItems() {
  try {
    const res = await getServletFilterConfigItems("FileStorageServletFilter");
    if (res.success && Array.isArray(res.data)) {
      for (const it of res.data as any[]) {
        const name = it?.name || it?.key;
        if (!name) continue;
        if (String(name).toLowerCase() === "filestoragetype") {
          const opts = (it.options || it.values || []).map((o: any) =>
            typeof o === "string" ? o : (o?.value ?? o?.label)
          ).filter(Boolean);
          if (opts.length > 0) {
            const unique = Array.from(new Set(opts.map((v: string) => normalizeStorageType(v))));
            typeOptions.value = unique.map((name) => ({ name, value: name, label: name, describe: name }));
          }
        }
        if (String(name).toLowerCase() === "settings") {
          const defaults = Array.isArray(it.defaultValue) ? it.defaultValue
            : typeof it.defaultValue === "string" ? it.defaultValue.split(",") : [];
          if (!global.value.settingsStr && defaults.length > 0) global.value.settingsStr = defaults.join(",");
        }
      }
    }
  } catch { /* ignore */ }
}

async function loadTypeOptionsFromSpi() {
  try {
    for (const spiType of SPI_FILE_STORAGE_TYPES) {
      const res = await fetchOptionObjectsList({ type: spiType });
      if (res?.success) {
        const list = (res.data || []).map((it: any) => {
          const rawName = typeof it === "string" ? it : (it?.name ?? it?.value ?? it?.label);
          const name = normalizeStorageType(rawName);
          return { name, value: name, icon: getIcon(name), describe: it?.describe ?? it?.label ?? name, label: it?.label ?? name } as SpiOption;
        }).filter((it: SpiOption) => !!it.name);
        if (list.length > 0) {
          const seen = new Set<string>();
          typeOptions.value = list.filter((it) => seen.has(it.name) ? false : (seen.add(it.name), true));
          return;
        }
      }
    }
  } catch { /* ignore */ }
}

async function loadOptionalProviderOptions() {
  try {
    const loadSpiOptions = async (types: string[]) => {
      for (const spiType of types) {
        const res = await fetchOptionObjectsList({ type: spiType });
        if (!res?.success) continue;
        const raw = res.data || [];
        const list = raw.map((it: any) =>
          typeof it === "string" ? { name: it } : { name: it?.name ?? it?.value ?? it?.label, describe: it?.describe ?? it?.label }
        ).filter((it: any) => !!it.name);
        if (list.length > 0) {
          const seen = new Set<string>();
          return list.filter((it: any) => seen.has(it.name) ? false : (seen.add(it.name), true));
        }
      }
      return [];
    };
    const [settingList, filterList] = await Promise.all([
      loadSpiOptions(SPI_IMAGE_SETTING_TYPES),
      loadSpiOptions(SPI_IMAGE_FILTER_TYPES),
    ]);
    if (settingList.length > 0) imageSettingOptions.value = settingList;
    else imageSettingOptions.value = DEFAULT_IMAGE_SETTING_OPTIONS.map((name) => ({ name, describe: name }));
    if (filterList.length > 0) imageFilterOptions.value = filterList;
    else imageFilterOptions.value = [];
    syncSelectionsFromGlobal();
  } catch { /* ignore */ }
}

async function onAddClick() {
  rightPreview.value.visible = false;
  await loadTypeOptionsFromSpi();
  addStorage();
  nextTick(() => { selectedIndex.value = storages.value.length - 1; });
}

function toPayload(s: any) {
  const normalizedType = normalizeStorageType(s?.fileStorageType);
  const payload: FileStorageConfig = { ...s, fileStorageServerId: props.serverId, fileStorageType: normalizedType };
  if (isLocalStorageType(normalizedType)) {
    payload.fileStorageBucket = String(payload.fileStorageBucket || "").trim() || "local";
    payload.fileStorageAccessKey = "local";
    payload.fileStorageSecretKey = "local";
    payload.fileStorageRegion = "";
  }
  return payload;
}

async function handleSave() {
  // 校验所有存储项必要字段
  for (let i = 0; i < storages.value.length; i++) {
    const s = storages.value[i];
    s.fileStorageType = normalizeStorageType(s.fileStorageType);
    if (!s.fileStorageType) { message.error(`存储 #${i + 1} 未选择类型`); return; }
    if (isLocalStorageType(s.fileStorageType)) {
      if (!s.fileStorageEndpoint) { message.error(`存储 #${i + 1} 请填写根路径`); return; }
    } else {
      if (!s.fileStorageEndpoint) { message.error(`存储 #${i + 1} 请填写 Endpoint`); return; }
      if (!s.fileStorageBucket) { message.error(`存储 #${i + 1} 请填写 Bucket`); return; }
      if (!s.fileStorageAccessKey) { message.error(`存储 #${i + 1} 请填写 AccessKeyId`); return; }
      if (!s.fileStorageSecretKey) { message.error(`存储 #${i + 1} 请填写 SecretKey`); return; }
    }
  }
  loading.value = true;
  try {
    const ok = await saveGlobal();
    if (!ok) throw new Error("全局设置保存失败");
    for (const s of storages.value) {
      const payload = toPayload(s);
      let res;
      if (payload.systemServerSettingFileStorageId) {
        res = await updateFileStorageConfig(payload);
      } else {
        res = await saveFileStorageConfig(payload);
      }
      if (!res.success) throw new Error(res.msg || "保存失败");
      if (!payload.systemServerSettingFileStorageId && res.data?.systemServerSettingFileStorageId) {
        s.systemServerSettingFileStorageId = res.data.systemServerSettingFileStorageId;
      }
    }
    message({ message: "保存成功，已热应用" }, { type: "success" });
    emit("success");
    visibleInner.value = false;
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  } finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }
function reload() { loadData(); }

const currentStorage = computed(() =>
  selectedIndex.value != null ? storages.value[selectedIndex.value] : null
);

async function loadData() {
  loading.value = true;
  try {
    await loadGlobal();
    await Promise.all([
      loadConfigItems(),
      loadTypeOptionsFromSpi(),
      (async () => {
        try {
          const res = await getFileStorageConfig(props.serverId);
          if (res?.success && Array.isArray(res.data)) storages.value = res.data as any[];
          else storages.value = [];
        } catch { storages.value = []; }
      })(),
    ]);
    await loadOptionalProviderOptions();
    selectedIndex.value = storages.value.length > 0 ? 0 : null;
    if (rightPreview.value.visible) await fetchPreviewItems();
  } finally { loading.value = false; }
}
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 20px;
  align-items: stretch;
  padding: 8px;
  min-height: 70vh;
}
.left-col, .middle-col, .right-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.left-col > .el-card, .middle-col > .el-card, .right-col > .el-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.left-col :deep(.el-card__body), .middle-col :deep(.el-card__body), .right-col :deep(.el-card__body) {
  flex: 1;
  overflow: auto;
}

/* 卡片通用 */
.global-card {
  margin-bottom: 0;
  border-radius: 16px;
  border: none;
  background: $fc-surface;
  box-shadow: $fc-shadow-md;
  transition: all 0.3s ease;
  height: 100%;
  &:hover {
    box-shadow: $fc-shadow-lg;
    transform: translateY(-2px);
  }
}
.header-icon { font-size: 18px; }
.global-scrollbar { height: calc(70vh - 80px); }
.global-content { padding: 4px; }

/* 设置区块 */
.setting-section {
  background: $fc-surface-alt;
  border-radius: $fc-radius;
  padding: 16px;
  margin-bottom: 16px;
  &:last-child { margin-bottom: 0; }
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $fc-title;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed $fc-border;
  .iconify { font-size: 16px; color: #6366f1; }
}

/* 开关网格 */
.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* 扩展配置 */
.ext-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.config-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $fc-body;
  .iconify { font-size: 14px; color: #6366f1; }
}
.config-select { width: 100%; }

/* 缓存配置 */
.cache-config {
  background: $fc-surface;
  border-radius: $fc-radius-sm;
  padding: 12px;
  border: 1px solid $fc-border;
}
.cache-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cache-label { font-size: 13px; font-weight: 500; color: $fc-body; }
.cache-input { display: flex; align-items: center; gap: 8px; }
.cache-unit { font-size: 12px; color: $fc-muted; }

/* 水印配置 */
.watermark-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
}
.watermark-config { display: flex; flex-direction: column; gap: 12px; }
.watermark-row { display: flex; gap: 12px; }
.watermark-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  &.full { flex: none; width: 100%; }
  label { font-size: 12px; font-weight: 500; color: #0369a1; }
}
.watermark-item :deep(.el-input-number) { width: 100%; }

.storage-form :deep(.el-input__wrapper) {
  border-radius: $fc-radius-xs;
}
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-actions :deep(.el-button) { border-radius: $fc-radius-xs; }

/* 中间列表 */
.installed-card {
  border-radius: 16px;
  height: 100%;
  border: none;
  background: $fc-surface;
  box-shadow: $fc-shadow-md;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: $fc-shadow-lg;
    transform: translateY(-2px);
  }
}
.installed-card .header-actions :deep(.el-button) {
  background: $fc-surface;
  border: 1px solid $fc-border;
  color: $fc-hint;
  &:hover {
    background: $fc-surface-alt;
    border-color: #cbd5e1;
    color: $fc-title;
  }
}
.installed-list { max-height: 60vh; padding: 8px; }
.empty-tip { padding: 40px 0; }

/* 存储项卡片 */
.storage-item {
  background: $fc-surface;
  border-radius: $fc-radius;
  margin: 8px 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid $fc-border;
  box-shadow: $fc-shadow-sm;
  &:hover {
    transform: translateY(-2px);
    box-shadow: $fc-shadow-md;
    border-color: rgba($fc-primary, 0.3);
  }
  &.active {
    border-color: $fc-primary;
    box-shadow: $fc-shadow-blue;
  }
}

/* 状态条 */
.storage-item .storage-status-bar {
  height: 3px;
  background: $fc-border;
  transition: all 0.3s ease;
  &.enabled { background: linear-gradient(90deg, #10b981, #34d399); }
  &.disabled { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
}

/* 头部 */
.storage-item .storage-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 10px;
}
.storage-item .storage-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $fc-primary, #2563eb);
  color: $fc-surface;
  border-radius: $fc-radius-sm;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}
.storage-item .storage-meta { flex: 1; min-width: 0; }
.storage-item .storage-type {
  font-size: 14px;
  font-weight: 700;
  color: $fc-title;
  margin-bottom: 2px;
}
.storage-item .storage-seq { font-size: 11px; color: $fc-muted; }
.storage-item .storage-status-tag {
  border-radius: 12px;
  font-size: 11px;
  padding: 2px 10px;
}

/* 路径信息 */
.storage-item .storage-path {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 12px;
  padding: 10px 12px;
  background: $fc-surface-alt;
  border-radius: $fc-radius-xs;
  font-size: 12px;
  color: $fc-hint;
  .path-icon { font-size: 16px; color: $fc-muted; flex-shrink: 0; }
  .path-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: "Consolas", monospace;
  }
}

/* 操作按钮 */
.storage-item .storage-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid $fc-border-light;
}
.storage-item .storage-actions .el-button.is-circle {
  width: 32px;
  height: 32px;
  border: 1px solid $fc-border;
  background: $fc-surface;
  color: $fc-hint;
  &:hover { border-color: $fc-primary; color: $fc-primary; background: $fc-primary-light; }
}
.storage-item .storage-actions .el-button.is-circle.el-button--danger:hover {
  border-color: $fc-danger;
  color: $fc-danger;
  background: #fef2f2;
}

/* ========== 预览面板 ========== */
.preview-panel { display: flex; flex-direction: column; flex: 1; height: 100%; min-height: 0; }
.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: $fc-surface-alt;
  border-radius: $fc-radius;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.preview-content {
  flex: 1;
  min-height: 200px;
  max-height: calc(70vh - 200px);
  overflow-y: auto;
  padding: 4px;
}

/* 列表视图 */
.file-list-view { display: flex; flex-direction: column; gap: 8px; }
.file-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: $fc-surface;
  border: 1px solid $fc-border;
  border-radius: $fc-radius-sm;
  transition: all 0.25s ease;
  &:hover {
    border-color: $fc-primary;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    transform: translateX(4px);
  }
}
.file-list-item .file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $fc-primary, #2563eb);
  color: $fc-surface;
  border-radius: $fc-radius-sm;
  font-size: 18px;
  flex-shrink: 0;
}
.file-list-item .file-info { flex: 1; min-width: 0; }
.file-list-item .file-name {
  font-size: 14px;
  font-weight: 600;
  color: $fc-title;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-list-item .file-meta {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: $fc-muted;
}

/* 卡片视图 */
.file-card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.file-card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: $fc-surface;
  border: 1px solid $fc-border;
  border-radius: $fc-radius;
  transition: all 0.25s ease;
  &:hover {
    border-color: $fc-primary;
    box-shadow: $fc-shadow-blue;
    transform: translateY(-4px);
  }
}
.file-card-item .card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: $fc-radius;
  font-size: 24px;
  margin-bottom: 10px;
  position: relative;
  .ext-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 2px;
  }
}

/* 文件颜色类 */
.card-icon.color-default { background: linear-gradient(135deg, #64748b, #475569); color: $fc-surface; }
.card-icon.color-image { background: linear-gradient(135deg, #ec4899, #db2777); color: $fc-surface; }
.card-icon.color-pdf { background: linear-gradient(135deg, #ef4444, #dc2626); color: $fc-surface; }
.card-icon.color-word { background: linear-gradient(135deg, $fc-primary, #2563eb); color: $fc-surface; }
.card-icon.color-excel { background: linear-gradient(135deg, #22c55e, #16a34a); color: $fc-surface; }
.card-icon.color-ppt { background: linear-gradient(135deg, #f97316, #ea580c); color: $fc-surface; }
.card-icon.color-code { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: $fc-surface; }
.card-icon.color-archive { background: linear-gradient(135deg, #eab308, #ca8a04); color: $fc-surface; }
.card-icon.color-video { background: linear-gradient(135deg, #06b6d4, #0891b2); color: $fc-surface; }
.card-icon.color-audio { background: linear-gradient(135deg, #14b8a6, #0d9488); color: $fc-surface; }

.file-card-item .card-info { text-align: center; width: 100%; }

/* 卡片图片缩略图 */
.card-icon-img {
  overflow: hidden;
  padding: 0;
  background: $fc-surface-alt;
  border: 1px solid $fc-border;
}
.card-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-card-item .card-name {
  font-size: 13px;
  font-weight: 600;
  color: $fc-title;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-card-item .card-size { font-size: 11px; color: $fc-muted; margin-top: 2px; }

/* 文件可点击 */
.file-item-clickable { cursor: pointer; }

/* 大图视图 */
.file-image-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.image-item {
  border-radius: $fc-radius;
  overflow: hidden;
  background: $fc-surface-alt;
  border: 1px solid $fc-border;
  transition: all 0.25s ease;
  position: relative;
  &:hover {
    border-color: $fc-primary;
    box-shadow: $fc-shadow-blue;
    transform: scale(1.02);
    .thumb-overlay { opacity: 1; }
  }
}
.file-thumb-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}
.file-thumb-pdf {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #ef4444;
  font-size: 48px;
  position: relative;
}
.file-thumb-word {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #3b82f6;
  font-size: 48px;
  position: relative;
}
.file-thumb-excel {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #22c55e;
  font-size: 48px;
  position: relative;
}
.file-thumb-img { position: relative; }
.thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.25s ease;
  cursor: pointer;
  .iconify { font-size: 22px; }
  span { font-size: 12px; font-weight: 600; }
}
.thumb-label {
  font-size: 12px;
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
}
.file-thumb-pdf .thumb-label { color: #dc2626; }
.file-thumb-word .thumb-label { color: #2563eb; }
.file-thumb-excel .thumb-label { color: #16a34a; }
.file-thumb-other {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $fc-surface-alt;
  color: $fc-muted;
  font-size: 36px;
}
.image-item .image-name {
  padding: 8px 10px;
  font-size: 12px;
  color: $fc-hint;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  background: $fc-surface;
}

/* 预览分页 */
.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: $fc-surface-alt;
  border-radius: $fc-radius;
  margin-top: 16px;
  .page-info { font-size: 13px; color: $fc-hint; }
  .page-controls { display: flex; align-items: center; }
  .page-number { min-width: 36px; font-weight: 600; }
}

/* 表单样式 */
.storage-form-wrap {
  padding: 4px 0;
}
.storage-type-select {
  width: 100%;
  margin-bottom: 16px;
}
.storage-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fc-field {
  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: $fc-body;
    margin-bottom: 6px;
  }
}
.fc-field-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  label { margin-bottom: 0; }
}
.status-label {
  font-size: 13px;
  font-weight: 500;
  color: $fc-danger;
  &.enabled { color: $fc-success; }
}

.right-col-empty {
  margin-top: 60px;
}

/* 文件预览对话框 */
.file-preview-body {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}
.pdf-viewer {
  width: 100%;
  height: 80vh;
  border: none;
}
.image-viewer {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

/* 滚动条 */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;
  &::-webkit-scrollbar { width: 6px; height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color);
    border-radius: 3px;
    &:hover { background-color: var(--el-text-color-secondary); }
  }
}

.dialog-footer { @include action-row; }

@media (max-width: 920px) {
  .three-col { grid-template-columns: 1fr; }
  .preview-body { max-height: 360px; overflow: auto; }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  .file-card { width: 160px; }
  .file-thumb {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f7f7;
    color: #888;
  }
  .file-name {
    margin-top: 6px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .full-preview { height: calc(100vh - 140px); display: flex; flex-direction: column; }
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 12px; padding: 12px 16px; }
}
</style>
