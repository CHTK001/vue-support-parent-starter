<template>
  <el-dialog
    v-model="visibleInner"
    title="文件存储配置"
    width="80%"
    top="10px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="three-col">
      <div class="left-col">
        <el-card class="global-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">全局设置（FileStorageSetting）</div>
            </div>
          </template>
          <el-form :model="global" label-width="140px" class="global-form">
            <el-form-item label="开启下载"
              ><el-switch v-model="global.openDownload"
            /></el-form-item>
            <el-form-item label="开启预览"
              ><el-switch v-model="global.openPreview"
            /></el-form-item>
            <el-form-item label="开启插件"
              ><el-switch v-model="global.openPlugin"
            /></el-form-item>
            <el-form-item label="开启设置"
              ><el-switch v-model="global.openSetting"
            /></el-form-item>
            <el-form-item label="开启Range"
              ><el-switch v-model="global.openRange"
            /></el-form-item>
            <el-form-item label="开启水印"
              ><el-switch v-model="global.openWatermark"
            /></el-form-item>
            <el-form-item label="支持webjars"
              ><el-switch v-model="global.openWebjars"
            /></el-form-item>
            <el-form-item label="支持远程文件"
              ><el-switch v-model="global.openRemoteFile"
            /></el-form-item>

            <el-form-item label="参数名（逗号分隔）" v-if="global.openSetting">
              <el-select
                v-model="imageSettingSelection"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或自定义参数"
              >
                <el-option
                  v-for="opt in imageSettingOptions"
                  :key="opt.name"
                  :label="opt.describe || opt.name"
                  :value="opt.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="插件（逗号分隔）" v-if="global.openPlugin">
              <el-select
                v-model="imageFilterSelection"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或自定义插件"
              >
                <el-option
                  v-for="opt in imageFilterOptions"
                  :key="opt.name"
                  :label="opt.describe || opt.name"
                  :value="opt.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="格式缓存(分钟)">
              <el-input-number
                v-model="global.formatCacheTimeMinutes"
                :min="0"
                :max="1440 * 7"
              />
            </el-form-item>

            <el-divider content-position="left">水印</el-divider>
            <template v-if="global.openWatermark">
              <el-form-item label="水印内容/URL"
                ><el-input
                  v-model="global.watermark"
                  placeholder="文本或图片URL"
              /></el-form-item>
              <el-form-item label="水印颜色"
                ><el-input
                  v-model="global.watermarkColor"
                  placeholder="#RRGGBB 或 颜色名"
              /></el-form-item>
              <el-form-item label="水印坐标X"
                ><el-input-number
                  v-model="global.watermarkX"
                  :min="-9999"
                  :max="9999"
              /></el-form-item>
              <el-form-item label="水印坐标Y"
                ><el-input-number
                  v-model="global.watermarkY"
                  :min="-9999"
                  :max="9999"
              /></el-form-item>
            </template>
          </el-form>
        </el-card>
      </div>

      <div class="middle-col">
        <el-card class="installed-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">已安装的存储</div>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="onAddClick"
                  ><IconifyIconOnline icon="ri:add-line" />新增存储</el-button
                >
                <el-button size="small" @click="openFullPreview"
                  ><IconifyIconOnline icon="ri:eye-line" />预览</el-button
                >
              </div>
            </div>
          </template>
          <div v-if="storages.length === 0" class="empty-tip">
            <el-empty description="尚未添加任何文件存储">
              <el-button type="primary" @click="onAddClick">新增存储</el-button>
            </el-empty>
          </div>
          <el-scrollbar v-else class="installed-list">
            <div
              v-for="(s, idx) in storages"
              :key="idx"
              class="installed-item"
              :class="{ active: selectedIndex === idx }"
              @click="selectStorage(idx)"
            >
              <div class="item-title">
                <span class="seq">#{{ idx + 1 }}</span>
                <span class="type">{{
                  getFileStorageDescribe(s.fileStorageType) || "-"
                }}</span>
                <el-tag
                  size="small"
                  :type="s.fileStorageEnabled ? 'success' : 'info'"
                >
                  {{ s.fileStorageEnabled ? "启用" : "禁用" }}
                </el-tag>
              </div>
              <div class="item-sub">
                <span v-if="s.fileStorageType === 'LOCAL'">{{
                  s.fileStorageBasePath || "未配置路径"
                }}</span>
                <span v-else
                  >{{ s.fileStorageBucket || "-" }} @
                  {{ s.fileStorageEndpoint || "-" }}</span
                >
              </div>
              <div class="item-actions" @click.stop>
                <el-switch v-model="s.fileStorageEnabled" size="small" />
                <el-button link size="small" @click="previewStorage(idx)"
                  ><IconifyIconOnline icon="ri:eye-line" />预览</el-button
                >
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeStorage(idx)"
                  ><IconifyIconOnline
                    icon="ri:delete-bin-line"
                  />移除</el-button
                >
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </div>

      <div class="right-col">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">存储配置</div>
          </template>
          <div class="preview-modes" v-if="rightPreview.visible">
            <el-radio-group v-model="rightPreview.mode" size="small">
              <el-radio-button label="list">列表</el-radio-button>
              <el-radio-button label="card">卡片</el-radio-button>
              <el-radio-button label="image">大图</el-radio-button>
            </el-radio-group>
            <el-divider />
            <div class="preview-body thin-scrollbar">
              <template v-if="rightPreview.mode === 'list'">
                <el-table :data="previewItems" height="320" size="small" border>
                  <el-table-column prop="name" label="名称" min-width="160" />
                  <el-table-column prop="size" label="大小" width="100" />
                  <el-table-column
                    prop="modified"
                    label="修改时间"
                    width="160"
                  />
                </el-table>
              </template>
              <template v-else-if="rightPreview.mode === 'card'">
                <div class="card-grid">
                  <el-card
                    v-for="it in previewItems"
                    :key="it.id"
                    class="file-card"
                    shadow="hover"
                  >
                    <div class="file-thumb">{{ it.ext || "文件" }}</div>
                    <div class="file-name" :title="it.name">{{ it.name }}</div>
                  </el-card>
                </div>
              </template>
              <template v-else>
                <div class="image-grid">
                  <el-image
                    v-for="it in previewItems"
                    :key="it.id"
                    :src="it.url"
                    fit="cover"
                    lazy
                  />
                </div>
              </template>
            </div>
          </div>
          <div v-else-if="currentStorage">
            <ScSelect
              v-model="currentStorage.fileStorageType"
              :options="typeOptions"
            />
            <!-- <div class="type-group">
              <el-radio-group v-model="currentStorage.fileStorageType" size="small">
                <el-radio-button
                  v-for="opt in typeOptions"
                  :key="opt.name"
                  :label="opt.name"
                >{{ opt.describe || opt.name }}</el-radio-button>
              </el-radio-group>
            </div> -->
            <el-form
              :model="currentStorage"
              :rules="formRules(currentStorage)"
              ref="detailFormRef"
              label-width="120px"
              class="storage-form"
            >
              <el-form-item
                label="根路径"
                prop="fileStorageEndpoint"
                v-if="currentStorage.fileStorageType === 'FILESYSTEM'"
              >
                <div class="dir-picker">
                  <DirectorySelector
                    v-model="currentStorage.fileStorageEndpoint"
                  />
                </div>
              </el-form-item>
              <el-form-item label="端点" prop="fileStorageEndpoint" v-else>
                <el-input
                  v-model="currentStorage.fileStorageEndpoint"
                  placeholder="https://endpoint"
                />
              </el-form-item>
              <el-form-item label="Bucket" prop="fileStorageBucket">
                <el-input v-model="currentStorage.fileStorageBucket" />
              </el-form-item>
              <el-form-item label="账号" prop="fileStorageAccessKey">
                <el-input v-model="currentStorage.fileStorageAccessKey" />
              </el-form-item>
              <el-form-item label="密码" prop="fileStorageSecretKey">
                <el-input
                  v-model="currentStorage.fileStorageSecretKey"
                  type="password"
                />
              </el-form-item>
              <el-form-item label="区域" prop="fileStorageRegion">
                <el-input v-model="currentStorage.fileStorageRegion" />
              </el-form-item>
            </el-form>
          </div>
          <el-empty v-else description="请选择左侧已安装的存储或新增一个" />
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave"
          >保存</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import {
  getFileStorageConfig,
  saveFileStorageConfig,
  deleteFileStorageConfig,
  getServletFilterConfig,
  updateServletFilterConfig,
  getServletFilterConfigItems,
  type FileStorageConfig,
} from "@/api/system-server-setting";
import { fetchOptionList, fetchOptionObjectsList } from "@/api/spi";
import { fileStorageList } from "@/api/file-manager/file-storage";
import {
  getSystemDrives,
  getSystemDirectories,
  type DriveInfo,
  type DirectoryInfo,
} from "@/api/system-info";
import DirectorySelector from "@/views/file-system/components/DirectorySelector.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId?: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const storages = ref<
  Array<FileStorageConfig & { _formRef?: FormInstance | null }>
>([]);
const selectedIndex = ref<number | null>(null);
const detailFormRef = ref<FormInstance | null>(null);
type SpiOption = {
  name: string;
  describe?: string;
  value?: string;
  label?: string;
};
const typeOptions = ref<SpiOption[]>([]);

// 全局设置默认值
const global = ref({
  openDownload: true,
  openPreview: true,
  openPlugin: false,
  openSetting: false,
  openRange: false,
  openWatermark: false,
  openWebjars: true,
  openRemoteFile: false,
  pluginsStr: "",
  downloadUserAgentStr: "",
  settingsStr: "",
  watermark: "",
  watermarkColor: "",
  watermarkX: 0,
  watermarkY: 0,
  formatCacheTimeMinutes: 1440,
});

const imageSettingOptions = ref<SpiOption[]>([]);
const imageFilterOptions = ref<SpiOption[]>([]);
const imageSettingSelection = ref<string[]>([]);
const imageFilterSelection = ref<string[]>([]);
// 处理选中变化
function applySelectionsToGlobal() {
  if (global.value.openSetting) {
    global.value.settingsStr = imageSettingSelection.value.join(",");
  }
  if (global.value.openPlugin) {
    global.value.pluginsStr = imageFilterSelection.value.join(",");
  }
}

watch(
  [imageSettingSelection, imageFilterSelection, () => global.value.openPlugin],
  () => {
    applySelectionsToGlobal();
  }
);

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) await loadData();
  },
  { immediate: true }
);
watch(visibleInner, (v) => emit("update:visible", v));

function formRules(s: FileStorageConfig): FormRules {
  const common: FormRules = {
    fileStorageType: [
      { required: true, message: "请选择存储类型", trigger: "change" },
    ],
  };
  common.fileStorageEndpoint = [
    { required: true, message: "请选择根目录", trigger: "blur" },
  ];
  common.fileStorageBucket = [
    { required: true, message: "请输入Bucket", trigger: "blur" },
  ];
  if (s.fileStorageType !== "FILESYSTEM") {
    common.fileStorageAccessKey = [
      { required: true, message: "请输入AccessKey", trigger: "blur" },
    ];
    common.fileStorageSecretKey = [
      { required: true, message: "请输入SecretKey", trigger: "blur" },
    ];
  }
  return common;
}

const getIcon = (type) => {
  if (!type) {
    return "ri:file-line";
  }
  if (type === "FILESYSTEM") {
    return "ri:computer-line";
  }

  if (type === "FTP" || type === "SFTP") {
    return "ri:folder-2-line";
  }

  if (type === "ALIYUN") {
  }

  return "ri:file-line";
};

const getFileStorageDescribe = (type) => {
  return typeOptions.value.find((it) => it.value === type)?.describe || type;
};

function selectStorage(idx: number) {
  selectedIndex.value = idx;
}

function newStorage(): FileStorageConfig {
  return {
    fileStorageServerId: props.serverId,
    fileStorageEnabled: true,
    fileStorageType: "LOCAL",
    fileStorageBasePath: "",
    fileStorageEndpoint: "",
    fileStorageBucket: "",
    fileStorageAccessKey: "",
    fileStorageSecretKey: "",
    fileStorageRegion: "",
  } as any;
}

// 右侧预览状态
const rightPreview = ref({
  visible: false,
  mode: "list" as "list" | "card" | "image",
});
const previewItems = ref<any[]>([]);

function previewStorage(idx: number) {
  selectedIndex.value = idx;
  rightPreview.value.visible = true;
  fetchPreviewItems();
}

async function openFullPreview() {
  if (storages.value.length === 0) {
    ElMessageBox.alert("请先添加一个文件存储配置", "提示");
    return;
  }
  // 路由跳转到全屏预览页面
  try {
    const url = `/service/file-storage/preview/${props.serverId}`;
    // 通过 a 标签打开新窗口，避免依赖全局路由实例
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  } catch (e) {
    ElMessageBox.alert("无法打开全屏预览页面", "提示");
  }
}

async function fetchPreviewItems() {
  try {
    const s =
      selectedIndex.value != null
        ? storages.value[selectedIndex.value]
        : storages.value[0];
    if (!s) return;
    // 调用文件存储列表接口（后端使用FileStorage#listObject）
    const params = new URLSearchParams();
    params.append("serverId", String(props.serverId));
    params.append("type", s.fileStorageType || "");
    params.append("bucket", s.fileStorageBucket || "");
    params.append("endpoint", s.fileStorageEndpoint || "");
    params.append("basePath", s.fileStorageBasePath || "/");
    // 兼容接口期望的表单提交
    const res = await fileStorageList(params);
    const items = Array.isArray(res?.data) ? res.data : res?.data?.list || [];
    previewItems.value = (items || []).map((it: any, i: number) => ({
      id: it.id || i,
      name: it.name || it.filename || it.fileName || it.path || "",
      size: it.size || it.length || "",
      modified: it.modified || it.updateTime || it.lastModified || "",
      ext: it.ext || it.suffix || "",
      url: it.url || it.previewUrl || it.downloadUrl || "",
    }));
  } catch (e) {
    // 忽略错误，保持空数据
    previewItems.value = [];
  }
}

function addStorage() {
  storages.value.push(newStorage());
  nextTick(() => {
    selectedIndex.value = storages.value.length - 1;
  });
}
function removeStorage(idx: number) {
  storages.value.splice(idx, 1);
  if (selectedIndex.value != null) {
    if (storages.value.length === 0) selectedIndex.value = null;
    else if (idx <= selectedIndex.value)
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
  }
}

async function loadGlobal() {
  if (!props.filterSettingId) return;
  const res = await getServletFilterConfig(props.filterSettingId);
  if (res.success && res.data) {
    const cfg = res.data as any;
    global.value.openDownload = cfg.openDownload == "true";
    global.value.openPreview = cfg.openPreview == "true";
    global.value.openPlugin = cfg.openPlugin == "true";
    global.value.openSetting = cfg.openSetting == "true";
    global.value.openRange = cfg.openRange == "true";
    global.value.openWatermark = cfg.openWatermark == "true";
    global.value.openWebjars = cfg.openWebjars == "true";
    global.value.openRemoteFile = cfg.openRemoteFile == "true";
    global.value.pluginsStr = Array.isArray(cfg.plugins)
      ? cfg.plugins.join(",")
      : cfg.pluginsStr || "";
    global.value.downloadUserAgentStr = Array.isArray(cfg.downloadUserAgent)
      ? cfg.downloadUserAgent.join(",")
      : cfg.downloadUserAgentStr || "";
    global.value.settingsStr = Array.isArray(cfg.settings)
      ? cfg.settings.join(",")
      : cfg.settingsStr || "";
    global.value.watermark = cfg.watermark || "";
    global.value.watermarkColor = cfg.watermarkColor || "";
    global.value.watermarkX = Number(cfg.watermarkX ?? 0);
    global.value.watermarkY = Number(cfg.watermarkY ?? 0);
    global.value.formatCacheTimeMinutes = Number(
      cfg.formatCacheTimeMinutes ?? 1440
    );
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
    plugins: global.value.openPlugin ? imageFilterSelection.value : undefined,
    settings: global.value.openSetting
      ? imageSettingSelection.value
      : undefined,
    watermark: global.value.openWatermark
      ? global.value.watermark || undefined
      : undefined,
    watermarkColor: global.value.openWatermark
      ? global.value.watermarkColor || undefined
      : undefined,
    watermarkX: global.value.openWatermark
      ? Number(global.value.watermarkX || 0)
      : undefined,
    watermarkY: global.value.openWatermark
      ? Number(global.value.watermarkY || 0)
      : undefined,
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
          const opts = (it.options || it.values || [])
            .map((o: any) =>
              typeof o === "string" ? o : (o?.value ?? o?.label)
            )
            .filter(Boolean);
          if (opts.length > 0) typeOptions.value = Array.from(new Set(opts));
        }
        if (String(name).toLowerCase() === "settings") {
          const defaults = Array.isArray(it.defaultValue)
            ? it.defaultValue
            : typeof it.defaultValue === "string"
              ? it.defaultValue.split(",")
              : [];
          if (!global.value.settingsStr && defaults.length > 0) {
            global.value.settingsStr = defaults.join(",");
          }
        }
      }
    }
  } catch {}
}

// 通过 SPI 获取 com.chua.common.support.oss.FileStorage 的类型选项
async function loadTypeOptionsFromSpi() {
  try {
    const res = await fetchOptionObjectsList({ type: "fileStorage" });
    if (res?.success) {
      const list = (res.data || [])
        .map((it: any) => {
          if (typeof it === "string") return { name: it } as SpiOption;
          return {
            name: it?.name ?? it?.value ?? it?.label,
            value: it?.name,
            icon: getIcon(it?.name),
            describe: it?.describe ?? it?.label,
          } as SpiOption;
        })
        .filter((it: SpiOption) => !!it.name);
      if (list.length > 0) {
        const seen = new Set<string>();
        typeOptions.value = list.filter((it) =>
          seen.has(it.name) ? false : (seen.add(it.name), true)
        );
      }
    }
  } catch {}
}

async function loadOptionalProviderOptions() {
  try {
    const [settingRes, filterRes] = await Promise.all([
      fetchOptionObjectsList({ type: "ImageSettingProcessor" }),
      fetchOptionObjectsList({ type: "fileStoragePlugin" }),
    ]);
    if (settingRes?.success) {
      const raw = settingRes.data || [];
      const list = raw
        .map((it: any) =>
          typeof it === "string"
            ? { name: it }
            : {
                name: it?.name ?? it?.value ?? it?.label,
                describe: it?.describe ?? it?.label,
              }
        )
        .filter((it: any) => !!it.name);
      const seen = new Set<string>();
      imageSettingOptions.value = list.filter((it: any) =>
        seen.has(it.name) ? false : (seen.add(it.name), true)
      );
    }
    if (filterRes?.success) {
      const raw = filterRes.data || [];
      const list = raw
        .map((it: any) =>
          typeof it === "string"
            ? { name: it }
            : {
                name: it?.name ?? it?.value ?? it?.label,
                describe: it?.describe ?? it?.label,
              }
        )
        .filter((it: any) => !!it.name);
      const seen = new Set<string>();
      imageFilterOptions.value = list.filter((it: any) =>
        seen.has(it.name) ? false : (seen.add(it.name), true)
      );
    }
    if (global.value.settingsStr)
      imageSettingSelection.value = global.value.settingsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (global.value.pluginsStr)
      imageFilterSelection.value = global.value.pluginsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  } catch {}
}

function onAddClick() {
  addStorage();
  nextTick(() => {
    selectedIndex.value = storages.value.length - 1;
  });
}

function toPayload(s: any) {
  return { ...s, fileStorageServerId: props.serverId } as FileStorageConfig;
}

async function handleSave() {
  // 优先校验右侧详情表单（若有选中）
  if (detailFormRef.value) {
    const ok = await detailFormRef.value.validate().catch(() => false);
    if (!ok) return;
  }
  // 简单校验所有存储项必要字段
  for (let i = 0; i < storages.value.length; i++) {
    const s = storages.value[i];
    if (!s.fileStorageType) {
      ElMessage.error(`存储 #${i + 1} 未选择类型`);
      return;
    }
    if (s.fileStorageType === "LOCAL") {
      if (!s.fileStorageBasePath) {
        ElMessage.error(`存储 #${i + 1} 请填写根路径`);
        return;
      }
    } else {
      if (!s.fileStorageEndpoint || !s.fileStorageBucket) {
        ElMessage.error(`存储 #${i + 1} 请完整填写 Endpoint/Bucket`);
        return;
      }
    }
  }
  loading.value = true;
  try {
    // 先保存全局设置
    const ok = await saveGlobal();
    if (!ok) throw new Error("全局设置保存失败");

    // 重置并保存各存储项
    await deleteFileStorageConfig(props.serverId);
    for (const s of storages.value) {
      const res = await saveFileStorageConfig(toPayload(s));
      if (!res.success) throw new Error(res.msg || "保存失败");
    }
    ElMessage.success("保存成功，已热应用");
    emit("success");
    visibleInner.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}

function reload() {
  loadData();
}

// 当前选中存储
const currentStorage = computed(() =>
  selectedIndex.value != null ? storages.value[selectedIndex.value] : null
);

// 本地目录选择（仅 LOCAL 类型使用）
const dirSelection = ref<string | undefined>(undefined);
const dirOptions = ref<any[]>([]);
const dirProps = {
  value: "path",
  label: "name",
  children: "children",
  emitPath: false,
  checkStrictly: true,
  lazy: true,
  async lazyLoad(node: any, resolve: (nodes: any[]) => void) {
    try {
      if (node.level === 0) {
        const res = await getSystemDrives();
        const list = (res.data || []).map((d: DriveInfo) => ({
          path: d.path,
          name: d.name,
          leaf: false,
        }));
        resolve(list);
      } else {
        const res = await getSystemDirectories(node.data.path, false);
        const list = (res.data || []).map((d: DirectoryInfo) => ({
          path: d.path,
          name: d.name,
          leaf: false,
        }));
        resolve(list);
      }
    } catch {
      resolve([]);
    }
  },
};

async function ensureDrivesLoaded() {
  if (dirOptions.value.length > 0) return;
  try {
    const res = await getSystemDrives();
    dirOptions.value = (res.data || []).map((d: DriveInfo) => ({
      path: d.path,
      name: d.name,
    }));
  } catch {
    dirOptions.value = [];
  }
}

function onDirChange(val: string) {
  if (currentStorage.value) currentStorage.value.fileStorageEndpoint = val;
}

watch(
  () => currentStorage.value?.fileStorageType,
  (t) => {
    if (t !== "FILESYSTEM") {
      dirSelection.value = undefined;
    } else if (currentStorage.value?.fileStorageEndpoint) {
      dirSelection.value = currentStorage.value
        .fileStorageEndpoint as unknown as string;
    }
  }
);

// 统一加载
async function loadData() {
  loading.value = true;
  try {
    await Promise.all([
      loadGlobal(),
      loadConfigItems(),
      loadTypeOptionsFromSpi(),
      loadOptionalProviderOptions(),
      (async () => {
        try {
          const res = await getFileStorageConfig(props.serverId);
          if (res?.success && Array.isArray(res.data)) {
            storages.value = res.data as any[];
          } else {
            storages.value = [];
          }
        } catch (e) {
          // 后端可能未提供该接口或暂未有配置，容错为空
          storages.value = [];
        }
      })(),
    ]);
    selectedIndex.value = storages.value.length > 0 ? 0 : null;
    if (rightPreview.value.visible) {
      await fetchPreviewItems();
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.three-col {
  display: grid;
  grid-template-columns: 1fr 0.9fr 1.4fr;
  gap: 12px;
  align-items: start;
}
.left-col,
.middle-col,
.right-col {
  min-width: 0;
  height: 100%;
}
.global-card {
  margin-bottom: 12px;
  border-radius: 8px;
}
.card-header {
  font-weight: 600;
}
.global-form :deep(.el-input__wrapper),
.storage-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.item-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.item-title .seq {
  color: #64748b;
}
.storage-form {
  padding: 8px 8px 0 8px;
}
.kv-list {
  padding: 0 8px;
}
.kv-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-actions :deep(.el-button) {
  border-radius: 8px;
}

/* 中间列表 */
.installed-card {
  border-radius: 8px;
  height: 100%;
}
.installed-list {
  max-height: 640px;
}
.installed-item {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  background: #fff;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 6px;
}
.installed-item.active {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}
.installed-item .item-title {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.installed-item .item-sub {
  color: #64748b;
  font-size: 12px;
}
.installed-item .item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-self: end;
}

/* 右侧类型按钮组 */
.detail-card {
  border-radius: 8px;
  height: 100%;
}
.type-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dir-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.dir-picker :deep(.el-cascader) {
  width: 360px;
}

@media (max-width: 920px) {
  .three-col {
    grid-template-columns: 1fr;
  }

  /* 右侧与全屏预览样式 */
  .preview-body {
    max-height: 360px;
    overflow: auto;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  .file-card {
    width: 160px;
  }
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
  .full-preview {
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
  }
}
</style>
