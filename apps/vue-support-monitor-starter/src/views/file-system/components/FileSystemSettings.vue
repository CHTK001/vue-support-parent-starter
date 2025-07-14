<template>
  <el-dialog
    v-model="visible"
    title="文件系统设置"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="settings-dialog">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
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
              <el-form-item label="分片大小" prop="chunkSize">
                <el-input-number
                  v-model="formData.chunkSize"
                  :min="1"
                  :max="100"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
                <span class="form-item-suffix">MB</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大并发数" prop="maxConcurrent">
                <el-input-number
                  v-model="formData.maxConcurrent"
                  :min="1"
                  :max="20"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
                <span class="form-item-suffix">个</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
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
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大文件大小" prop="maxFileSize">
                <el-input-number
                  v-model="formData.maxFileSize"
                  :min="1"
                  :max="10240"
                  :step="1"
                  controls-position="right"
                  class="w-full"
                />
                <span class="form-item-suffix">MB</span>
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

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="自动合并">
                <el-switch
                  v-model="formData.autoMerge"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="HTTP访问">
                <el-switch
                  v-model="formData.enableHttpAccess"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
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
            </el-col>
            <el-col :span="12">
              <!-- 占位列，保持布局对齐 -->
            </el-col>
          </el-row>

          <el-form-item label="允许的文件类型" prop="allowedFileTypes">
            <el-select
              v-model="formData.allowedFileTypes"
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
import { ref, reactive, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { FileSystemConfig } from "@/api/monitor/filesystem";
import {
  getFileSystemConfig,
  updateFileSystemConfig,
} from "@/api/monitor/filesystem";

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
const formData = reactive<FileSystemConfig>({
  chunkSize: 5,
  maxConcurrent: 3,
  retryCount: 3,
  autoMerge: true,
  enableHttpAccess: false,
  allowedFileTypes: [],
  maxFileSize: 100,
  storageQuota: 100,
});

// 默认配置备份
const defaultConfig = reactive<FileSystemConfig>({ ...formData });

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
  chunkSize: [
    { required: true, message: "请设置分片大小", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 100,
      message: "分片大小必须在1-100MB之间",
      trigger: "blur",
    },
  ],
  maxConcurrent: [
    { required: true, message: "请设置最大并发数", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 20,
      message: "最大并发数必须在1-20之间",
      trigger: "blur",
    },
  ],
  retryCount: [
    { required: true, message: "请设置重试次数", trigger: "blur" },
    {
      type: "number",
      min: 0,
      max: 10,
      message: "重试次数必须在0-10之间",
      trigger: "blur",
    },
  ],
  maxFileSize: [
    { required: true, message: "请设置最大文件大小", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 10240,
      message: "最大文件大小必须在1-10240MB之间",
      trigger: "blur",
    },
  ],
  storageQuota: [
    { required: true, message: "请设置存储配额", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 10240,
      message: "存储配额必须在1-10240GB之间",
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
      ElMessage.error(result.message || "保存设置失败");
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
</style>
