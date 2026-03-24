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
        <el-card class="global-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">
                <IconifyIconOnline
                  icon="ri:settings-4-line"
                  class="header-icon"
                />
                全局设置
              </div>
            </div>
          </template>
          <el-scrollbar class="global-scrollbar">
            <div class="global-content">
              <!-- 功能开关区域 -->
              <div class="setting-section">
                <div class="section-title">
                  <IconifyIconOnline icon="ri:toggle-line" />
                  <span>功能开关</span>
                </div>
                <div class="switch-grid">
                  <ScSwitch
                    v-model="global.openDownload"
                    layout="compact-card"
                    label="下载"
                    active-icon="ri:download-cloud-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openPreview"
                    layout="compact-card"
                    label="预览"
                    active-icon="ri:eye-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openPlugin"
                    layout="compact-card"
                    label="插件"
                    active-icon="ri:plug-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openSetting"
                    layout="compact-card"
                    label="设置"
                    active-icon="ri:equalizer-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openFormat"
                    layout="compact-card"
                    label="文件转化"
                    active-icon="ri:file-transfer-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openRange"
                    layout="compact-card"
                    label="Range"
                    active-icon="ri:split-cells-horizontal"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openWatermark"
                    layout="compact-card"
                    label="水印"
                    active-icon="ri:drop-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openWebjars"
                    layout="compact-card"
                    label="WebJars"
                    active-icon="ri:javascript-line"
                    size="small"
                  />
                  <ScSwitch
                    v-model="global.openRemoteFile"
                    layout="compact-card"
                    label="远程文件"
                    active-icon="ri:global-line"
                    size="small"
                  />
                </div>
              </div>

              <!-- 扩展配置区域 -->
              <div
                class="setting-section"
                v-if="global.openSetting || global.openPlugin"
              >
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
                    <el-select
                      v-model="imageSettingSelection"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      placeholder="选择或自定义参数"
                      class="config-select"
                    >
                      <el-option
                        v-for="opt in imageSettingOptions"
                        :key="opt.name"
                        :label="opt.describe || opt.name"
                        :value="opt.name"
                      />
                    </el-select>
                  </div>
                  <div class="config-item" v-if="global.openPlugin">
                    <label class="config-label">
                      <IconifyIconOnline icon="ri:puzzle-line" />
                      启用插件
                    </label>
                    <el-select
                      v-model="imageFilterSelection"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      placeholder="选择或自定义插件"
                      class="config-select"
                    >
                      <el-option
                        v-for="opt in imageFilterOptions"
                        :key="opt.name"
                        :label="opt.describe || opt.name"
                        :value="opt.name"
                      />
                    </el-select>
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
                      <el-input-number
                        v-model="global.formatCacheTimeMinutes"
                        :min="0"
                        :max="1440 * 7"
                        size="small"
                        controls-position="right"
                      />
                      <span class="cache-unit">分钟</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 水印配置区域 -->
              <div
                class="setting-section watermark-section"
                v-if="global.openWatermark"
              >
                <div class="section-title">
                  <IconifyIconOnline icon="ri:drop-line" />
                  <span>水印配置</span>
                </div>
                <div class="watermark-config">
                  <div class="watermark-row">
                    <div class="watermark-item full">
                      <label>水印内容</label>
                      <el-input
                        v-model="global.watermark"
                        placeholder="文本或图片URL"
                        size="small"
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:text" />
                        </template>
                      </el-input>
                    </div>
                  </div>
                  <div class="watermark-row">
                    <div class="watermark-item">
                      <label>颜色</label>
                      <el-input
                        v-model="global.watermarkColor"
                        placeholder="#RRGGBB"
                        size="small"
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:palette-line" />
                        </template>
                      </el-input>
                    </div>
                    <div class="watermark-item">
                      <label>X 坐标</label>
                      <el-input-number
                        v-model="global.watermarkX"
                        :min="-9999"
                        :max="9999"
                        size="small"
                        controls-position="right"
                      />
                    </div>
                    <div class="watermark-item">
                      <label>Y 坐标</label>
                      <el-input-number
                        v-model="global.watermarkY"
                        :min="-9999"
                        :max="9999"
                        size="small"
                        controls-position="right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </div>

      <div class="middle-col">
        <el-card class="installed-card" shadow="never">
          <template #header>
            <div class="card-header-row">
              <div class="card-header">已安装的存储</div>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="onAddClick">
                  <IconifyIconOnline icon="ri:add-line" />
                  新增存储
                </el-button>
                <el-button size="small" @click="openFullPreview">
                  <IconifyIconOnline icon="ri:eye-line" />
                  预览
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="storages.length === 0" class="empty-tip">
            <el-empty description="尚未添加任何文件存储">
              <el-button type="primary" @click="onAddClick">新增存储</el-button>
            </el-empty>
          </div>
          <el-scrollbar v-else class="installed-list thin-scrollbar">
            <div
              v-for="(s, idx) in storages"
              :key="idx"
              class="storage-item"
              :class="{ active: selectedIndex === idx }"
              @click="selectStorage(idx)"
            >
              <!-- 状态条 -->
              <div
                class="storage-status-bar"
                :class="s.fileStorageEnabled ? 'enabled' : 'disabled'"
              ></div>

              <!-- 头部：图标 + 类型 + 状态 -->
              <div class="storage-header">
                <div class="storage-icon-wrapper">
                  <IconifyIconOnline
                    :icon="getStorageIcon(s.fileStorageType)"
                  />
                </div>
                <div class="storage-meta">
                  <div class="storage-type">
                    {{ getFileStorageDescribe(s.fileStorageType) || "-" }}
                  </div>
                  <div class="storage-seq">#{{ idx + 1 }}</div>
                </div>
                <el-tag
                  size="small"
                  :type="s.fileStorageEnabled ? 'success' : 'info'"
                  effect="dark"
                  class="storage-status-tag"
                >
                  {{ s.fileStorageEnabled ? "启用" : "禁用" }}
                </el-tag>
              </div>

              <!-- 路径信息 -->
              <div class="storage-path">
                <IconifyIconOnline icon="ri:folder-line" class="path-icon" />
                <span
                  v-if="s.fileStorageType === 'FILESYSTEM'"
                  class="path-text"
                >
                  {{ s.fileStorageEndpoint || "未配置路径" }}
                </span>
                <span v-else class="path-text">
                  {{ s.fileStorageBucket || "-" }} @
                  {{ s.fileStorageEndpoint || "-" }}
                </span>
              </div>

              <!-- 操作按钮 -->
              <div class="storage-actions">
                <el-tooltip content="预览文件" placement="top">
                  <el-button
                    circle
                    size="small"
                    @click.stop="previewStorage(idx)"
                  >
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="测试连接" placement="top">
                  <el-button
                    circle
                    size="small"
                    @click.stop="testConnection(idx)"
                  >
                    <IconifyIconOnline icon="ri:wifi-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除存储" placement="top">
                  <el-button
                    circle
                    size="small"
                    type="danger"
                    @click.stop="removeStorage(idx)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </el-tooltip>
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
          <div class="preview-panel" v-if="rightPreview.visible">
            <!-- 预览头部工具栏 -->
            <div class="preview-toolbar">
              <div class="toolbar-left">
                <el-segmented
                  v-model="rightPreview.mode"
                  :options="previewModeOptions"
                  size="small"
                />
              </div>
              <div class="toolbar-right">
                <el-button size="small" circle @click="fetchPreviewItems">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
              </div>
            </div>

            <!-- 预览内容区 -->
            <div class="preview-content thin-scrollbar">
              <!-- 列表视图 -->
              <div v-if="rightPreview.mode === 'list'" class="file-list-view">
                <div
                  v-for="it in previewItems"
                  :key="it.id"
                  class="file-list-item"
                >
                  <div class="file-icon">
                    <IconifyIconOnline :icon="getFileIcon(it.ext)" />
                  </div>
                  <div class="file-info">
                    <div class="file-name" :title="it.name">{{ it.name }}</div>
                    <div class="file-meta">
                      <span class="file-size">{{ it.size }}</span>
                      <span class="file-date">{{ it.modified }}</span>
                    </div>
                  </div>
                </div>
                <el-empty
                  v-if="previewItems.length === 0"
                  description="暂无文件"
                />
              </div>

              <!-- 卡片视图 -->
              <div
                v-else-if="rightPreview.mode === 'card'"
                class="file-card-view"
              >
                <div
                  v-for="it in previewItems"
                  :key="it.id"
                  class="file-card-item"
                >
                  <div class="card-icon" :class="getFileColorClass(it.ext)">
                    <IconifyIconOnline :icon="getFileIcon(it.ext)" />
                    <span class="ext-label">{{ it.ext || "?" }}</span>
                  </div>
                  <div class="card-info">
                    <div class="card-name" :title="it.name">{{ it.name }}</div>
                    <div class="card-size">{{ it.size }}</div>
                  </div>
                </div>
                <el-empty
                  v-if="previewItems.length === 0"
                  description="暂无文件"
                />
              </div>

              <!-- 大图视图 -->
              <div v-else class="file-image-view">
                <div v-for="it in previewItems" :key="it.id" class="image-item">
                  <el-image
                    :src="it.url"
                    fit="cover"
                    lazy
                    :preview-src-list="[it.url]"
                  >
                    <template #error>
                      <div class="image-error">
                        <IconifyIconOnline icon="ri:image-line" />
                      </div>
                    </template>
                  </el-image>
                  <div class="image-name" :title="it.name">{{ it.name }}</div>
                </div>
                <el-empty
                  v-if="previewItems.length === 0"
                  description="暂无图片"
                />
              </div>
            </div>

            <!-- 分页器 -->
            <div class="preview-footer">
              <div class="page-info">共 {{ previewItems.length }} 项</div>
              <div class="page-controls">
                <el-button-group size="small">
                  <el-button @click="goPrevPage" :disabled="pager.page <= 1">
                    <IconifyIconOnline icon="ri:arrow-left-s-line" />
                  </el-button>
                  <el-button disabled class="page-number">{{
                    pager.page
                  }}</el-button>
                  <el-button
                    @click="goNextPage"
                    :disabled="previewItems.length < pager.limit"
                  >
                    <IconifyIconOnline icon="ri:arrow-right-s-line" />
                  </el-button>
                </el-button-group>
                <el-select
                  v-model="pager.limit"
                  size="small"
                  style="width: 80px; margin-left: 12px"
                  @change="onLimitChange"
                >
                  <el-option :value="20" label="20条" />
                  <el-option :value="50" label="50条" />
                  <el-option :value="100" label="100条" />
                </el-select>
              </div>
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
              <!-- 根据存储类型显示不同的配置项 -->
              <template v-if="currentStorage.fileStorageType === 'FILESYSTEM'">
                <el-form-item label="根路径" prop="fileStorageEndpoint">
                  <div class="dir-picker">
                    <DirectorySelector
                      v-model="currentStorage.fileStorageEndpoint"
                    />
                  </div>
                </el-form-item>
                <el-form-item label="基础路径" prop="fileStorageBasePath">
                  <el-input
                    v-model="currentStorage.fileStorageBasePath"
                    placeholder="相对于根路径的基础路径，如: /uploads"
                  />
                </el-form-item>
              </template>

              <template v-else>
                <el-form-item label="端点" prop="fileStorageEndpoint">
                  <el-input
                    v-model="currentStorage.fileStorageEndpoint"
                    placeholder="https://endpoint"
                  />
                  <div class="form-tip">
                    <IconifyIconOnline icon="ri:information-line" />
                    <span v-if="currentStorage.fileStorageType === 'S3'"
                      >AWS S3 端点，如: https://s3.amazonaws.com</span
                    >
                    <span v-else-if="currentStorage.fileStorageType === 'MINIO'"
                      >MinIO 服务端点，如: http://localhost:9000</span
                    >
                    <span
                      v-else-if="currentStorage.fileStorageType === 'ALIYUN'"
                      >阿里云 OSS 端点，如:
                      https://oss-cn-hangzhou.aliyuncs.com</span
                    >
                    <span v-else>对象存储服务端点地址</span>
                  </div>
                </el-form-item>

                <el-form-item label="存储桶" prop="fileStorageBucket">
                  <el-input
                    v-model="currentStorage.fileStorageBucket"
                    placeholder="存储桶名称"
                  />
                  <div class="form-tip">
                    <IconifyIconOnline icon="ri:information-line" />
                    存储桶名称，用于组织和管理文件
                  </div>
                </el-form-item>

                <el-form-item label="访问密钥" prop="fileStorageAccessKey">
                  <el-input
                    v-model="currentStorage.fileStorageAccessKey"
                    placeholder="Access Key ID"
                  />
                </el-form-item>

                <el-form-item label="密钥" prop="fileStorageSecretKey">
                  <el-input
                    v-model="currentStorage.fileStorageSecretKey"
                    type="password"
                    placeholder="Secret Access Key"
                    show-password
                  />
                </el-form-item>

                <el-form-item
                  label="区域"
                  prop="fileStorageRegion"
                  v-if="
                    currentStorage.fileStorageType === 'S3' ||
                    currentStorage.fileStorageType === 'ALIYUN'
                  "
                >
                  <el-input
                    v-model="currentStorage.fileStorageRegion"
                    placeholder="区域代码，如: us-east-1"
                  />
                  <div class="form-tip">
                    <IconifyIconOnline icon="ri:information-line" />
                    <span v-if="currentStorage.fileStorageType === 'S3'"
                      >AWS 区域，如: us-east-1, eu-west-1</span
                    >
                    <span
                      v-else-if="currentStorage.fileStorageType === 'ALIYUN'"
                      >阿里云区域，如: oss-cn-hangzhou, oss-cn-beijing</span
                    >
                  </div>
                </el-form-item>

                <el-form-item label="基础路径" prop="fileStorageBasePath">
                  <el-input
                    v-model="currentStorage.fileStorageBasePath"
                    placeholder="存储桶内的基础路径，如: /app/uploads"
                  />
                  <div class="form-tip">
                    <IconifyIconOnline icon="ri:information-line" />
                    在存储桶内的基础路径前缀，用于文件分类管理
                  </div>
                </el-form-item>
              </template>

              <!-- 通用配置项 -->
              <el-form-item label="启用状态">
                <el-switch
                  v-model="currentStorage.fileStorageEnabled"
                  active-text="启用"
                  inactive-text="禁用"
                />
                <div class="form-tip">
                  <IconifyIconOnline icon="ri:information-line" />
                  禁用后该存储配置将不会被使用
                </div>
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
  </sc-dialog>
</template>

<script setup lang="ts">
import { fileStorageList } from "@/api/file-manager/file-storage";
import { fetchOptionObjectsList } from "@/api/spi";
import {
  getSystemDirectories,
  getSystemDrives,
  type DirectoryInfo,
  type DriveInfo,
} from "@/api/system-info";
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
import DirectorySelector from "@/views/file-system/components/DirectorySelector.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { message } from "@repo/utils";
import { ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { computed, nextTick, ref, watch } from "vue";

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

/**
 * 解析数组或字符串格式的值
 * 支持：数组、"[GRAY,OTHER]" 字符串、"GRAY,OTHER" 逗号分隔字符串
 * @param value 原始值
 * @returns 逗号分隔的字符串
 */
function parseArrayOrString(value: any): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.join(",");
  }
  if (typeof value === "string") {
    // 去除首尾方括号，如 "[GRAY,OTHER]" -> "GRAY,OTHER"
    let str = value.trim();
    if (str.startsWith("[") && str.endsWith("]")) {
      str = str.slice(1, -1);
    }
    return str;
  }
  return "";
}

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

  // 根据存储类型设置不同的验证规则
  if (s.fileStorageType === "FILESYSTEM") {
    // 文件系统类型只需要根路径
    common.fileStorageEndpoint = [
      { required: true, message: "请选择根目录", trigger: "blur" },
    ];
  } else {
    // 对象存储类型需要端点、存储桶、访问密钥等
    common.fileStorageEndpoint = [
      { required: true, message: "请输入端点地址", trigger: "blur" },
    ];
    common.fileStorageBucket = [
      { required: true, message: "请输入存储桶名称", trigger: "blur" },
    ];
    common.fileStorageAccessKey = [
      { required: true, message: "请输入访问密钥", trigger: "blur" },
    ];
    common.fileStorageSecretKey = [
      { required: true, message: "请输入密钥", trigger: "blur" },
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
    return "ri:cloud-line";
  }

  return "ri:file-line";
};

// 获取存储类型图标
const getStorageIcon = (type) => {
  const iconMap = {
    FILESYSTEM: "ri:hard-drive-2-line",
    LOCAL: "ri:hard-drive-2-line",
    S3: "ri:amazon-line",
    MINIO: "ri:database-2-line",
    ALIYUN: "ri:cloud-line",
    OSS: "ri:cloud-line",
    FTP: "ri:folder-transfer-line",
    SFTP: "ri:folder-shield-2-line",
  };
  return iconMap[type] || "ri:file-line";
};

const getFileStorageDescribe = (type) => {
  return typeOptions.value.find((it) => it.value === type)?.describe || type;
};

// 测试存储连接
async function testConnection(idx: number) {
  const storage = storages.value[idx];
  if (!storage) return;

  try {
    message("正在测试连接...", { type: "info" });
    // 这里可以调用后端测试连接的接口
    // const result = await testStorageConnection(storage);

    // 模拟测试结果
    setTimeout(() => {
      message("连接测试成功", { type: "success" });
    }, 1000);
  } catch (error) {
    message("连接测试失败: " + error.message, { type: "error" });
  }
}

function selectStorage(idx: number) {
  selectedIndex.value = idx;
  // 关闭预览模式，显示配置表单
  rightPreview.value.visible = false;
}

function newStorage(): FileStorageConfig {
  return {
    fileStorageServerId: props.serverId,
    fileStorageEnabled: true,
    fileStorageType: "FILESYSTEM",
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

// 预览模式选项
const previewModeOptions = [
  { label: "列表", value: "list" },
  { label: "卡片", value: "card" },
  { label: "大图", value: "image" },
];

/**
 * 根据文件扩展名获取图标
 */
const getFileIcon = (ext: string): string => {
  if (!ext) return "ri:file-line";
  const lowerExt = ext.toLowerCase();
  const iconMap: Record<string, string> = {
    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    bmp: "ri:image-line",
    svg: "ri:image-line",
    webp: "ri:image-line",
    // 文档
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",
    txt: "ri:file-text-line",
    md: "ri:markdown-line",
    // 代码
    js: "ri:javascript-line",
    ts: "ri:code-line",
    vue: "ri:vuejs-line",
    html: "ri:html5-line",
    css: "ri:css3-line",
    json: "ri:braces-line",
    java: "ri:code-box-line",
    py: "ri:code-line",
    xml: "ri:code-s-slash-line",
    // 压缩包
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line",
    gz: "ri:file-zip-line",
    // 视频
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mov: "ri:video-line",
    mkv: "ri:video-line",
    // 音频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    flac: "ri:music-line",
  };
  return iconMap[lowerExt] || "ri:file-line";
};

/**
 * 根据文件扩展名获取颜色类
 */
const getFileColorClass = (ext: string): string => {
  if (!ext) return "color-default";
  const lowerExt = ext.toLowerCase();
  // 图片
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(lowerExt))
    return "color-image";
  // 文档
  if (["pdf"].includes(lowerExt)) return "color-pdf";
  if (["doc", "docx"].includes(lowerExt)) return "color-word";
  if (["xls", "xlsx"].includes(lowerExt)) return "color-excel";
  if (["ppt", "pptx"].includes(lowerExt)) return "color-ppt";
  // 代码
  if (
    ["js", "ts", "vue", "html", "css", "json", "java", "py", "xml"].includes(
      lowerExt
    )
  )
    return "color-code";
  // 压缩包
  if (["zip", "rar", "7z", "tar", "gz"].includes(lowerExt))
    return "color-archive";
  // 视频
  if (["mp4", "avi", "mov", "mkv"].includes(lowerExt)) return "color-video";
  // 音频
  if (["mp3", "wav", "flac"].includes(lowerExt)) return "color-audio";
  return "color-default";
};
// 轻量缓存：30秒内同参命中直接返回，减少请求
const listCache = new Map<
  string,
  { ts: number; items: any[]; marker: string }
>();
const CACHE_TTL = 30_000;
function makeCacheKey(
  serverId: number,
  s: any,
  basePath: string,
  limit: number,
  marker: string
) {
  return [
    serverId,
    s?.fileStorageType,
    s?.fileStorageEndpoint,
    s?.fileStorageBucket,
    basePath,
    limit,
    marker,
  ].join("|");
}
// 请求互斥：使用页面已有 loading 状态

// 基于 marker 的分页
const pager = ref({ page: 1, limit: 20, marker: "", nextMarker: "" });

function base64EncodeUtf8(input: string) {
  // 将 UTF-8 字符串编码为 base64（兼容中文）
  // eslint-disable-next-line no-undef
  return btoa(unescape(encodeURIComponent(input)));
}
function hexEncode(str: string) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function makeMarker(index: number) {
  if (!index || index <= 1) return "";
  const raw = `${index}_0`;
  const b64 = base64EncodeUtf8(raw);
  return hexEncode(b64);
}
function resetPager() {
  pager.value.page = 1;
  pager.value.marker = "";
  pager.value.nextMarker = "";
}
function onLimitChange() {
  resetPager();
  fetchPreviewItems();
}
function goPrevPage() {
  if (pager.value.page <= 1) return;
  pager.value.page -= 1;
  pager.value.marker =
    pager.value.page === 1 ? "" : makeMarker(pager.value.page);
  fetchPreviewItems();
}
function goNextPage() {
  // 简单依据条目数量判断是否可能有下一页
  if (previewItems.value.length < pager.value.limit) return;
  pager.value.page += 1;
  pager.value.marker = makeMarker(pager.value.page);
  fetchPreviewItems();
}

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
    const url = `#/service/file-storage/preview/${props.serverId}`;
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
    if (loading.value) return;
    loading.value = true;

    const s =
      selectedIndex.value != null
        ? storages.value[selectedIndex.value]
        : storages.value[0];
    if (!s) {
      loading.value = false;
      return;
    }

    const basePath = s.fileStorageBasePath || "/";
    const key = makeCacheKey(
      props.serverId,
      s,
      basePath,
      pager.value.limit,
      pager.value.marker || ""
    );
    const now = Date.now();
    const cached = listCache.get(key);
    if (cached && now - cached.ts < CACHE_TTL) {
      previewItems.value = cached.items;
      pager.value.marker = cached.marker || pager.value.marker;
      loading.value = false;
      return;
    }

    // 调用文件存储列表接口（后端使用FileStorage#listObject）
    const params = new URLSearchParams();
    params.append("serverId", String(props.serverId));
    params.append("type", s.fileStorageType || "");
    params.append("bucket", s.fileStorageBucket || "");
    params.append("endpoint", s.fileStorageEndpoint || "");
    params.append("basePath", basePath);
    // 控制每次返回条数
    params.append("limit", String(pager.value.limit));
    // 分页游标
    params.append("marker", pager.value.marker || "");
    // 提示后端只返回必要字段（若不支持会被忽略）
    params.append("fields", "name,size,modified,ext,url");
    // 简化模式，减少拼装计算（若不支持会被忽略）
    params.append("simple", "1");
    // 兼容接口期望的表单提交
    const res = await fileStorageList(params);
    const rr = res?.data; // ReturnResult
    const items = Array.isArray(rr?.metadata) ? rr.metadata : [];
    const mapped = (items || []).map((it: any, i: number) => ({
      id: it.fileId || it.id || i,
      name:
        it.name ||
        it.filename ||
        it.fileName ||
        it.originalFilename ||
        it.path ||
        "",
      size: it.size || it.fileSize || it.length || "",
      modified: it.modified || it.lastModified || it.updateTime || "",
      ext: it.ext || it.suffix || "",
      url: it.url || it.previewUrl || it.downloadUrl || "",
    }));
    previewItems.value = mapped;
    listCache.set(key, { ts: now, items: mapped, marker: pager.value.marker });
  } catch (e) {
    console.error("获取预览文件列表失败:", e);
    previewItems.value = [];
    message("获取文件列表失败，请检查存储配置", { type: "warning" });
  } finally {
    loading.value = false;
  }
}

function addStorage() {
  storages.value.push(newStorage());
  nextTick(() => {
    selectedIndex.value = storages.value.length - 1;
  });
}
async function removeStorage(idx: number) {
  const storage = storages.value[idx];
  if (!storage) return;

  try {
    await ElMessageBox.confirm(`确定要移除存储 #${idx + 1} 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 如果存储有 ID，调用后端 API 删除
    if (storage.systemServerSettingFileStorageId) {
      try {
        const res = await deleteFileStorageById(
          storage.systemServerSettingFileStorageId
        );
        if (!res.success) {
          message(res.msg || "删除失败", { type: "error" });
          return;
        }
      } catch (err) {
        message("删除存储失败，请稍后重试", { type: "error" });
        return;
      }
    }

    // 从本地数组中移除
    storages.value.splice(idx, 1);

    // 更新选中索引
    if (selectedIndex.value != null) {
      if (storages.value.length === 0) {
        selectedIndex.value = null;
      } else if (idx <= selectedIndex.value) {
        selectedIndex.value = Math.max(0, selectedIndex.value - 1);
      }
    }

    // 关闭预览模式
    rightPreview.value.visible = false;

    message("存储已移除", { type: "success" });
  } catch {
    // 用户取消删除，不做任何操作
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
    // 处理 plugins：可能是数组、"[XXX]" 字符串或逗号分隔字符串
    const pluginsStr = parseArrayOrString(cfg.plugins) || cfg.pluginsStr || "";
    // 解析 plugins 中是否包含 format，设置 openFormat 开关
    const pluginsArr = pluginsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    global.value.openFormat = pluginsArr.includes("format");
    // 从 pluginsStr 中移除 format，因为它由独立开关控制
    global.value.pluginsStr = pluginsArr
      .filter((s) => s !== "format")
      .join(",");
    global.value.downloadUserAgentStr = Array.isArray(cfg.downloadUserAgent)
      ? cfg.downloadUserAgent.join(",")
      : cfg.downloadUserAgentStr || "";
    // 处理 settings：可能是数组、"[GRAY,OTHER]" 字符串或逗号分隔字符串
    global.value.settingsStr =
      parseArrayOrString(cfg.settings) || cfg.settingsStr || "";
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
    // 合并 plugins：如果 openFormat 为 true，添加 "format" 到 plugins
    plugins: (() => {
      const arr = global.value.openPlugin
        ? [...imageFilterSelection.value]
        : [];
      if (global.value.openFormat && !arr.includes("format")) {
        arr.unshift("format");
      }
      return arr.length > 0 ? arr : undefined;
    })(),
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
  // 关闭预览模式，显示配置表单
  rightPreview.value.visible = false;
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
      message.error(`存储 #${i + 1} 未选择类型`);
      return;
    }
    if (s.fileStorageType === "LOCAL") {
      if (!s.fileStorageBasePath) {
        message.error(`存储 #${i + 1} 请填写根路径`);
        return;
      }
    } else {
      if (!s.fileStorageEndpoint) {
        message.error(`存储 #${i + 1} 请完整填写 Endpoint/Bucket`);
        return;
      }
    }
  }
  loading.value = true;
  try {
    // 先保存全局设置
    const ok = await saveGlobal();
    if (!ok) throw new Error("全局设置保存失败");

    // 保存各存储项（区分新增和更新）
    for (const s of storages.value) {
      const payload = toPayload(s);
      let res;

      // 如果有 ID，则为更新操作；否则为新增操作
      if (payload.systemServerSettingFileStorageId) {
        res = await updateFileStorageConfig(payload);
      } else {
        res = await saveFileStorageConfig(payload);
      }

      if (!res.success) {
        throw new Error(res.msg || "保存失败");
      }

      // 如果是新增，更新本地数据的 ID
      if (
        !payload.systemServerSettingFileStorageId &&
        res.data?.systemServerSettingFileStorageId
      ) {
        s.systemServerSettingFileStorageId =
          res.data.systemServerSettingFileStorageId;
      }
    }

    message({ message: "保存成功，已热应用" }, { type: "success" });
    emit("success");
    visibleInner.value = false;
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
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

<style scoped lang="scss">
.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 20px;
  align-items: stretch;
  padding: 8px;
  min-height: 70vh;
}
.left-col,
.middle-col,
.right-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.left-col > .el-card,
.middle-col > .el-card,
.right-col > .el-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.left-col :deep(.el-card__body),
.middle-col :deep(.el-card__body),
.right-col :deep(.el-card__body) {
  flex: 1;
  overflow: auto;
}
.global-card {
  margin-bottom: 0;
  border-radius: 16px;
  border: none;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  height: 100%;
}
.global-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.header-icon {
  font-size: 18px;
}
.global-scrollbar {
  height: calc(70vh - 80px);
}
.global-content {
  padding: 4px;
}

/* 设置区块 */
.setting-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.setting-section:last-child {
  margin-bottom: 0;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}
.section-title .iconify {
  font-size: 16px;
  color: #6366f1;
}

/* 开关网格 */
.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
/* ScSwitch compact-card 布局已内置样式 */

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
  color: #475569;
}
.config-label .iconify {
  font-size: 14px;
  color: #6366f1;
}
.config-select {
  width: 100%;
}

/* 缓存配置 */
.cache-config {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}
.cache-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cache-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.cache-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cache-unit {
  font-size: 12px;
  color: #94a3b8;
}

/* 水印配置 */
.watermark-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
}
.watermark-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.watermark-row {
  display: flex;
  gap: 12px;
}
.watermark-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.watermark-item.full {
  flex: none;
  width: 100%;
}
.watermark-item label {
  font-size: 12px;
  font-weight: 500;
  color: #0369a1;
}
.watermark-item :deep(.el-input-number) {
  width: 100%;
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
  border-radius: 16px;
  height: 100%;
  border: none;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}
.installed-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.installed-card .header-actions :deep(.el-button) {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}
.installed-card .header-actions :deep(.el-button:hover) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
}
.installed-list {
  max-height: 60vh;
  padding: 8px;
}

/* 存储项样式 - 与服务管理卡片风格统一 */
.storage-item {
  background: #fff;
  border-radius: 12px;
  margin: 8px 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.storage-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.storage-item.active {
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
}

/* 状态条 */
.storage-item .storage-status-bar {
  height: 3px;
  background: #e5e7eb;
  transition: all 0.3s ease;
}

.storage-item .storage-status-bar.enabled {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.storage-item .storage-status-bar.disabled {
  background: linear-gradient(90deg, #94a3b8, #cbd5e1);
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
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}

.storage-item .storage-meta {
  flex: 1;
  min-width: 0;
}

.storage-item .storage-type {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.storage-item .storage-seq {
  font-size: 11px;
  color: #94a3b8;
}

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
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
}

.storage-item .storage-path .path-icon {
  font-size: 16px;
  color: #94a3b8;
  flex-shrink: 0;
}

.storage-item .storage-path .path-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Consolas", monospace;
}

/* 操作按钮 */
.storage-item .storage-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid #f1f5f9;
}

.storage-item .storage-actions .el-button.is-circle {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #64748b;
}

.storage-item .storage-actions .el-button.is-circle:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.storage-item .storage-actions .el-button.is-circle.el-button--danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

/* ========== 预览面板样式 ========== */
.preview-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
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
.file-list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.25s ease;
  cursor: pointer;
}

.file-list-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateX(4px);
}

.file-list-item .file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
}

.file-list-item .file-info {
  flex: 1;
  min-width: 0;
}

.file-list-item .file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list-item .file-meta {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
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
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.25s ease;
  cursor: pointer;
}

.file-card-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}

.file-card-item .card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 24px;
  margin-bottom: 10px;
  position: relative;
}

.file-card-item .card-icon .ext-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 2px;
}

/* 颜色类 */
.card-icon.color-default {
  background: linear-gradient(135deg, #64748b, #475569);
  color: #fff;
}
.card-icon.color-image {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
}
.card-icon.color-pdf {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}
.card-icon.color-word {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.card-icon.color-excel {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}
.card-icon.color-ppt {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
}
.card-icon.color-code {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
}
.card-icon.color-archive {
  background: linear-gradient(135deg, #eab308, #ca8a04);
  color: #fff;
}
.card-icon.color-video {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #fff;
}
.card-icon.color-audio {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: #fff;
}

.file-card-item .card-info {
  text-align: center;
  width: 100%;
}

.file-card-item .card-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-item .card-size {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 大图视图 */
.file-image-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-item {
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  transition: all 0.25s ease;
}

.image-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
  transform: scale(1.02);
}

.image-item .el-image {
  width: 100%;
  height: 120px;
  display: block;
}

.image-item .image-error {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 32px;
}

.image-item .image-name {
  padding: 8px 10px;
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  background: #fff;
}

/* 分页底部 */
.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-top: 16px;
}

.preview-footer .page-info {
  font-size: 13px;
  color: #64748b;
}

.preview-footer .page-controls {
  display: flex;
  align-items: center;
}

.preview-footer .page-number {
  min-width: 36px;
  font-weight: 600;
}

/* 表单提示样式 */
.form-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.form-tip .iconify {
  font-size: 14px;
}

/* 滚动条样式 */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;
}
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 3px;
}
.thin-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-text-color-secondary);
}

/* 兼容原有样式 */
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
  border-radius: 16px;
  height: 100%;
  border: none;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}
.detail-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.detail-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100% - 60px);
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


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
