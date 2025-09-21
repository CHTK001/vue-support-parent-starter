<template>
  <el-dialog
    v-model="visible"
    title="文件系统设置"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="settings-dialog">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <!-- 上传设置 -->
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:upload-2-line" class="mr-2" />
              上传设置
            </div>
          </template>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item
                label="分片大小(MB)"
                prop="fileSystemSettingChunkSizeMb"
              >
                <el-input-number
                  v-model="formData.fileSystemSettingChunkSizeMb"
                  :min="1"
                  :max="100"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="最大并发数(个)"
                prop="fileSystemSettingMergeTaskLimit"
              >
                <el-input-number
                  v-model="formData.fileSystemSettingMergeTaskLimit"
                  :min="1"
                  :max="20"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <!-- 重试次数（后端未持久化，临时下线）
              <el-form-item label="重试次数" prop="retryCount">
                <el-input-number
                  v-model="formData.retryCount"
                  :min="0"
                  :max="10"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
                <span class="form-item-suffix">次</span>
              </el-form-item>
              -->
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="最大文件大小(MB)"
                prop="fileSystemSettingMaxFileSizeMb"
              >
                <el-input-number
                  v-model="formData.fileSystemSettingMaxFileSizeMb"
                  :min="1"
                  :max="10240"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 文件管理设置 -->
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:file-settings-line" class="mr-2" />
              文件管理设置
            </div>
          </template>

          <!-- 文件存储根目录 -->
          <el-form-item
            label="存储根目录"
            prop="fileSystemSettingStorageRootPath"
          >
            <DirectorySelector
              v-model="formData.fileSystemSettingStorageRootPath"
            />
            <div class="form-item-tip">
              设置文件存储的根目录路径，所有上传的文件将保存在此目录下
            </div>
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="手动合并">
                <el-switch
                  v-model="formData.fileSystemSettingManualMergeEnabled"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="HTTP访问">
                <el-switch
                  v-model="formData.fileSystemSettingHttpAccessEnabled"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <!-- 存储配额（后端未持久化，临时下线）
              <el-form-item label="存储配额" prop="storageQuota">
                <el-input-number
                  v-model="formData.storageQuota"
                  :min="1"
                  :max="10240"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
                <span class="form-item-suffix">GB</span>
              </el-form-item>
              -->
            </el-col>
            <el-col :span="12">
              <!-- 占位列，保持布局对齐 -->
            </el-col>
          </el-row>

          <el-form-item
            label="允许的文件类型"
            prop="fileSystemSettingAllowedFileTypes"
          >
            <el-select
              v-model="allowedTypesList"
              multiple
              filterable
              allow-create
              placeholder="选择或输入文件类型"
              class="w-full"
            >
              <el-option
                v-for="type in commonFileTypes"
                :key="type"
                :label="type"
                :value="type"
              />
            </el-select>
            <div class="form-item-tip">
              支持文件扩展名，如：.jpg, .png, .pdf 等。留空表示允许所有类型
            </div>
          </el-form-item>
        </el-card>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存设置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { FileSystemSetting } from "@/api/monitor/filesystem";
import {
  getFileSystemConfig,
  updateFileSystemConfig,
} from "@/api/monitor/filesystem";
import DirectorySelector from "./DirectorySelector.vue";

// Props & Emits
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "settings-updated": [];
}>();

// 响应式数据
const visible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<FileSystemSetting>({
  fileSystemSettingChunkSizeMb: 5,
  fileSystemSettingMergeTaskLimit: 3,
  fileSystemSettingManualMergeEnabled: false,
  fileSystemSettingHttpAccessEnabled: false,
  fileSystemSettingAllowedFileTypes: "*",
  fileSystemSettingMaxFileSizeMb: 100,
  fileSystemSettingStorageRootPath: "",
});

// 默认配置备份
const defaultConfig = reactive<FileSystemSetting>({ ...formData });

// 允许类型的数组视图，与实体的逗号分隔字符串字段互转
const allowedTypesList = computed<string[]>({
  get() {
    const v = formData.fileSystemSettingAllowedFileTypes || "";
    return v
      .split(",")
      .map((s) => s.trim())
      .filter((s) => !!s);
  },
  set(arr: string[]) {
    formData.fileSystemSettingAllowedFileTypes = Array.isArray(arr)
      ? arr.join(",")
      : "";
  },
});

// 常见文件类型
const commonFileTypes = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".webp", // 图片
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv", // 视频
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg", // 音频
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx", // 文档
  ".txt",
  ".md",
  ".json",
  ".xml",
  ".csv", // 文本
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz", // 压缩包
];

// 表单验证规则
const formRules: FormRules = {
  fileSystemSettingStorageRootPath: [
    { required: true, message: "请选择文件存储根目录", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback(new Error("请选择文件存储根目录"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  fileSystemSettingChunkSizeMb: [
    { required: true, message: "请设置分片大小", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 100,
      message: "分片大小必须在1-100MB之间",
      trigger: "blur",
    },
  ],
  fileSystemSettingMergeTaskLimit: [
    { required: true, message: "请设置最大并发数", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 20,
      message: "最大并发数必须在1-20之间",
      trigger: "blur",
    },
  ],
  fileSystemSettingMaxFileSizeMb: [
    { required: true, message: "请设置最大文件大小", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 10240,
      message: "最大文件大小必须在1-10240MB之间",
      trigger: "blur",
    },
  ],
};

// 监听显示状态
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      loadConfig();
    }
  },
  { immediate: true }
);

watch(visible, (newVal) => {
  emit("update:modelValue", newVal);
});

/**
 * 加载配置
 */
const loadConfig = async () => {
  try {
    const result = await getFileSystemConfig();
    if (result.code === "00000" && result.data) {
      // 直接使用实体字段
      Object.assign(formData, result.data);
      Object.assign(defaultConfig, result.data);
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    ElMessage.error("加载配置失败");
  }
};

/**
 * 保存设置
 */
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    saving.value = true;

    const result = await updateFileSystemConfig(formData);
    if (result.code === "00000") {
      ElMessage.success("设置保存成功");
      Object.assign(defaultConfig, formData);
      emit("settings-updated");
      handleClose();
    } else {
      ElMessage.error((result as any).msg || "保存设置失败");
    }
  } catch (error) {
    console.error("保存设置失败:", error);
    ElMessage.error("保存设置失败");
  } finally {
    saving.value = false;
  }
};

/**
 * 重置设置
 */
const handleReset = () => {
  Object.assign(formData, defaultConfig);
  formRef.value?.clearValidate();
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
  formRef.value?.clearValidate();
};
</script>

<style lang="scss" scoped>
.settings-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.setting-card {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-card__header) {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.form-item-suffix {
  margin-left: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.form-item-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}

// 两列布局优化
:deep(.el-row) {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.el-col) {
  .el-form-item {
    margin-bottom: 0;
  }
}

// 开关组件样式优化
:deep(.el-switch) {
  .el-switch__label {
    font-size: 12px;
  }
}

.form-item-tip {
  font-size: 12px;
   color: var(--el-text-color);
  margin-top: 4px;
  line-height: 1.4;
}
</style>
