<template>
  <el-dialog
    v-model="visible"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="settings-dialog-wrapper"
    append-to-body
  >
    <!-- 自定义标题 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <IconifyIconOnline icon="ri:settings-4-line" />
        </div>
        <div class="header-content">
          <h3>文件系统设置</h3>
          <p>配置文件上传、存储和访问相关参数</p>
        </div>
      </div>
    </template>

    <div class="settings-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <!-- 上传设置 -->
        <div class="setting-section">
          <div class="section-header">
            <div class="section-icon upload">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" />
            </div>
            <div class="section-title">
              <h4>上传设置</h4>
              <span>配置文件分片上传相关参数</span>
            </div>
          </div>
          <div class="section-body">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="分片大小" prop="fileSystemSettingChunkSizeMb">
                  <div class="input-with-unit">
                    <el-input-number
                      v-model="formData.fileSystemSettingChunkSizeMb"
                      :min="1"
                      :max="100"
                      :step="1"
                      controls-position="right"
                    />
                    <span class="unit">MB</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最大并发" prop="fileSystemSettingMergeTaskLimit">
                  <div class="input-with-unit">
                    <el-input-number
                      v-model="formData.fileSystemSettingMergeTaskLimit"
                      :min="1"
                      :max="20"
                      :step="1"
                      controls-position="right"
                    />
                    <span class="unit">个</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="最大文件" prop="fileSystemSettingMaxFileSizeMb">
                  <div class="input-with-unit">
                    <el-input-number
                      v-model="formData.fileSystemSettingMaxFileSizeMb"
                      :min="1"
                      :max="10240"
                      :step="1"
                      controls-position="right"
                    />
                    <span class="unit">MB</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <!-- 预留位置 -->
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 存储设置 -->
        <div class="setting-section">
          <div class="section-header">
            <div class="section-icon storage">
              <IconifyIconOnline icon="ri:folder-5-line" />
            </div>
            <div class="section-title">
              <h4>存储设置</h4>
              <span>配置文件存储路径和管理选项</span>
            </div>
          </div>
          <div class="section-body">
            <el-form-item label="存储目录" prop="fileSystemSettingStorageRootPath">
              <DirectorySelector v-model="formData.fileSystemSettingStorageRootPath" />
              <div class="form-tip">
                <IconifyIconOnline icon="ri:information-line" class="tip-icon" />
                所有上传的文件将保存在此目录下
              </div>
            </el-form-item>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="手动合并">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.fileSystemSettingManualMergeEnabled"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                    />
                    <span class="switch-desc">{{ formData.fileSystemSettingManualMergeEnabled ? '需手动触发合并' : '自动合并分片' }}</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="HTTP访问">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.fileSystemSettingHttpAccessEnabled"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                    />
                    <span class="switch-desc">{{ formData.fileSystemSettingHttpAccessEnabled ? '允许外部访问' : '禁止外部访问' }}</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 文件类型 -->
        <div class="setting-section">
          <div class="section-header">
            <div class="section-icon filetype">
              <IconifyIconOnline icon="ri:file-list-3-line" />
            </div>
            <div class="section-title">
              <h4>文件类型</h4>
              <span>限制允许上传的文件格式</span>
            </div>
          </div>
          <div class="section-body">
            <el-form-item label="允许类型" prop="fileSystemSettingAllowedFileTypes">
              <el-select
                v-model="allowedTypesList"
                multiple
                filterable
                allow-create
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="5"
                placeholder="选择或输入文件扩展名"
                class="w-full"
              >
                <el-option-group label="图片">
                  <el-option v-for="t in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']" :key="t" :label="t" :value="t" />
                </el-option-group>
                <el-option-group label="视频">
                  <el-option v-for="t in ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.flv']" :key="t" :label="t" :value="t" />
                </el-option-group>
                <el-option-group label="音频">
                  <el-option v-for="t in ['.mp3', '.wav', '.flac', '.aac', '.ogg']" :key="t" :label="t" :value="t" />
                </el-option-group>
                <el-option-group label="文档">
                  <el-option v-for="t in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']" :key="t" :label="t" :value="t" />
                </el-option-group>
                <el-option-group label="压缩包">
                  <el-option v-for="t in ['.zip', '.rar', '.7z', '.tar', '.gz']" :key="t" :label="t" :value="t" />
                </el-option-group>
              </el-select>
              <div class="form-tip">
                <IconifyIconOnline icon="ri:information-line" class="tip-icon" />
                留空表示允许所有类型，可输入自定义扩展名
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleReset" class="reset-btn">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            <IconifyIconOnline icon="ri:save-line" class="mr-1" />
            保存设置
          </el-button>
        </div>
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
// 弹框头部
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;

  .header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .header-content {
    h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }
  }
}

// 内容区域
.settings-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
}

// 设置区块
.setting-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;

    .section-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;

      &.upload {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #2563eb;
      }

      &.storage {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: #16a34a;
      }

      &.filetype {
        background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        color: #9333ea;
      }
    }

    .section-title {
      h4 {
        margin: 0 0 2px 0;
        font-size: 15px;
        font-weight: 600;
        color: #334155;
      }

      span {
        font-size: 12px;
        color: #64748b;
      }
    }
  }

  .section-body {
    :deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      color: #475569;
      font-weight: 500;
    }
  }
}

// 输入框带单位
.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  :deep(.el-input-number) {
    flex: 1;
  }

  .unit {
    font-size: 13px;
    color: #64748b;
    min-width: 24px;
  }
}

// 开关包装
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .switch-desc {
    font-size: 12px;
    color: #64748b;
  }
}

// 表单提示
.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;

  .tip-icon {
    font-size: 14px;
    color: #3b82f6;
  }
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .reset-btn {
    color: #64748b;
    border-color: #e2e8f0;

    &:hover {
      color: #3b82f6;
      border-color: #3b82f6;
    }
  }

  .footer-right {
    display: flex;
    gap: 12px;
  }
}

// 全局样式覆盖
:deep(.el-input-number) {
  width: 100%;

  .el-input__wrapper {
    border-radius: 8px;
  }
}

:deep(.el-select) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

:deep(.el-switch) {
  --el-switch-on-color: #3b82f6;
}

.w-full {
  width: 100%;
}
</style>
