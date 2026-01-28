<template>
  <sc-dialog 
    v-model="visible" 
    width="900px" 
    :close-on-click-modal="false" 
    @close="handleClose"
    class="upload-dialog"
    :show-close="false"
  >
    <!-- 自定义标题 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:upload-cloud-2-line" :size="28" />
          </div>
          <div class="header-info">
            <h3 class="header-title">服务器文件上传</h3>
            <p class="header-subtitle">创建文件上传任务，支持定时上传和多文件批量处理</p>
          </div>
        </div>
        <el-button class="close-btn" :icon="CloseIcon" circle @click="handleClose" />
      </div>
    </template>

    <el-form ref="formRef" :model="uploadForm" :rules="formRules" label-width="100px" class="upload-form">
      <!-- 基本信息区域 -->
      <div class="form-section">
        <div class="section-header">
          <IconifyIconOnline icon="ri:information-line" :size="18" />
          <span>基本信息</span>
        </div>
        <div class="section-content">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="任务名称" prop="taskName">
                <el-input 
                  v-model="uploadForm.taskName" 
                  placeholder="请输入任务名称" 
                  maxlength="100" 
                  show-word-limit
                  :prefix-icon="TaskIcon"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="目标服务器" prop="serverId">
                <el-select 
                  v-model="uploadForm.serverId" 
                  placeholder="请选择目标服务器" 
                  style="width: 100%" 
                  filterable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:server-line" :size="16" />
                  </template>
                  <el-option
                    v-for="server in sshServers"
                    :key="server.monitorSysGenServerId"
                    :label="`${server.monitorSysGenServerName} (${server.monitorSysGenServerHost})`"
                    :value="server.monitorSysGenServerId"
                  >
                    <div class="server-option">
                      <IconifyIconOnline icon="ri:server-line" :size="16" />
                      <span class="server-name">{{ server.monitorSysGenServerName }}</span>
                      <span class="server-host">{{ server.monitorSysGenServerHost }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="目标路径" prop="targetPath">
                <el-input 
                  v-model="uploadForm.targetPath" 
                  placeholder="如：/home/user/uploads/" 
                  maxlength="500"
                  :prefix-icon="FolderIcon"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上传模式" prop="uploadMode">
                <el-radio-group v-model="uploadForm.uploadMode" class="mode-radio-group">
                  <el-radio-button label="REALTIME">
                    <IconifyIconOnline icon="ri:flashlight-line" :size="14" />
                    <span>立即上传</span>
                  </el-radio-button>
                  <el-radio-button label="SCHEDULED">
                    <IconifyIconOnline icon="ri:time-line" :size="14" />
                    <span>定时上传</span>
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 定时上传选项 -->
          <el-collapse-transition>
            <el-row :gutter="24" v-if="uploadForm.uploadMode === 'SCHEDULED'">
              <el-col :span="12">
                <el-form-item label="定时时间" prop="scheduledTime">
                  <el-date-picker 
                    v-model="uploadForm.scheduledTime" 
                    type="datetime" 
                    placeholder="选择定时上传时间" 
                    style="width: 100%" 
                    :disabled-date="disabledDate"
                    :prefix-icon="CalendarIcon"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级" prop="priority">
                  <el-select v-model="uploadForm.priority" style="width: 100%">
                    <el-option label="低优先级" :value="1">
                      <div class="priority-option">
                        <span class="priority-dot low"></span>
                        <span>低优先级</span>
                      </div>
                    </el-option>
                    <el-option label="普通" :value="5">
                      <div class="priority-option">
                        <span class="priority-dot normal"></span>
                        <span>普通</span>
                      </div>
                    </el-option>
                    <el-option label="高优先级" :value="10">
                      <div class="priority-option">
                        <span class="priority-dot high"></span>
                        <span>高优先级</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-transition>
        </div>
      </div>

      <!-- 高级选项区域 -->
      <div class="form-section">
        <div class="section-header">
          <IconifyIconOnline icon="ri:settings-3-line" :size="18" />
          <span>高级选项</span>
          <el-tag size="small" type="info" class="section-tag">可选</el-tag>
        </div>
        <div class="section-content">
          <!-- 开关选项卡片 -->
          <div class="switch-cards">
            <div class="switch-card" :class="{ active: uploadForm.overwrite }">
              <div class="switch-card-icon">
                <IconifyIconOnline icon="ri:file-copy-2-line" :size="20" />
              </div>
              <div class="switch-card-content">
                <div class="switch-card-title">覆盖文件</div>
                <div class="switch-card-desc">存在同名文件时自动覆盖</div>
              </div>
              <el-switch v-model="uploadForm.overwrite" />
            </div>

            <div class="switch-card" :class="{ active: uploadForm.backup }">
              <div class="switch-card-icon">
                <IconifyIconOnline icon="ri:folder-shield-2-line" :size="20" />
              </div>
              <div class="switch-card-content">
                <div class="switch-card-title">备份原文件</div>
                <div class="switch-card-desc">覆盖前自动备份原文件</div>
              </div>
              <el-switch v-model="uploadForm.backup" />
            </div>

            <div class="switch-card" :class="{ active: uploadForm.compress }">
              <div class="switch-card-icon">
                <IconifyIconOnline icon="ri:file-zip-line" :size="20" />
              </div>
              <div class="switch-card-content">
                <div class="switch-card-title">压缩传输</div>
                <div class="switch-card-desc">启用压缩提升传输速度</div>
              </div>
              <el-switch v-model="uploadForm.compress" />
            </div>

            <div class="switch-card" :class="{ active: uploadForm.verify }">
              <div class="switch-card-icon">
                <IconifyIconOnline icon="ri:shield-check-line" :size="20" />
              </div>
              <div class="switch-card-content">
                <div class="switch-card-title">文件校验</div>
                <div class="switch-card-desc">MD5校验确保文件完整</div>
              </div>
              <el-switch v-model="uploadForm.verify" />
            </div>
          </div>

          <!-- 数值配置 -->
          <el-row :gutter="24" class="number-config">
            <el-col :span="12">
              <el-form-item label="超时时间">
                <el-input-number 
                  v-model="uploadForm.timeoutSeconds" 
                  :min="30" 
                  :max="3600" 
                  style="width: 100%"
                  :step="30"
                />
                <div class="form-item-tip">单位：秒，建议 300-600</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大重试">
                <el-input-number 
                  v-model="uploadForm.maxRetry" 
                  :min="0" 
                  :max="10" 
                  style="width: 100%" 
                />
                <div class="form-item-tip">失败后自动重试次数</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="任务描述">
            <el-input 
              v-model="uploadForm.description" 
              type="textarea" 
              :rows="2" 
              placeholder="添加任务描述，便于后续识别和管理（可选）" 
              maxlength="500" 
              show-word-limit
              resize="none"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div class="form-section">
        <div class="section-header">
          <IconifyIconOnline icon="ri:upload-2-line" :size="18" />
          <span>选择文件</span>
          <el-tag v-if="fileList.length > 0" size="small" type="success" class="section-tag">
            已选 {{ fileList.length }} 个文件
          </el-tag>
        </div>
        <div class="section-content">
          <el-form-item prop="files" label-width="0">
            <el-upload
              ref="uploadRef"
              :file-list="fileList"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              multiple
              drag
              class="upload-area"
            >
              <div class="upload-content">
                <div class="upload-icon">
                  <IconifyIconOnline icon="ri:upload-cloud-2-line" :size="48" />
                </div>
                <div class="upload-text">
                  <p class="upload-main-text">拖拽文件到此处上传</p>
                  <p class="upload-sub-text">或 <em>点击选择文件</em></p>
                </div>
                <div class="upload-hint">
                  <IconifyIconOnline icon="ri:information-line" :size="14" />
                  <span>支持多文件上传，单个文件大小不超过 100MB</span>
                </div>
              </div>
            </el-upload>
          </el-form-item>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <IconifyIconOnline icon="ri:lightbulb-line" :size="16" />
          <span>任务创建后将自动开始执行</span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose" size="large">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
            <IconifyIconOnline v-if="!submitting" icon="ri:upload-cloud-line" :size="16" />
            <span>{{ submitting ? '创建中...' : '创建任务' }}</span>
          </el-button>
        </div>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { type FormInstance, type FormRules, type UploadFile } from "element-plus";
import { message } from "@repo/utils";
import { createServerFileUploadTask, type ServerFileUploadRequest, UPLOAD_MODE } from "@/api/server-file-upload";

// 图标组件
const CloseIcon = h(IconifyIconOnline, { icon: 'ri:close-line', size: 18 });
const TaskIcon = h(IconifyIconOnline, { icon: 'ri:task-line', size: 16 });
const FolderIcon = h(IconifyIconOnline, { icon: 'ri:folder-line', size: 16 });
const CalendarIcon = h(IconifyIconOnline, { icon: 'ri:calendar-line', size: 16 });

// Props
interface Props {
  sshServers?: Array<{
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerType: string;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  sshServers: () => []
});

// Emits
const emit = defineEmits<{
  success: [];
  close: [];
}>();

// 响应式数据
const visible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const uploadRef = ref();
const fileList = ref<UploadFile[]>([]);

// 表单数据
const uploadForm = reactive({
  taskName: "",
  serverId: undefined as number | undefined,
  targetPath: "",
  uploadMode: UPLOAD_MODE.REALTIME,
  scheduledTime: undefined as Date | undefined,
  priority: 5,
  overwrite: false,
  backup: false,
  compress: false,
  verify: true,
  timeoutSeconds: 300,
  maxRetry: 3,
  description: ""
});

// 表单验证规则
const formRules: FormRules = {
  taskName: [
    { required: true, message: "请输入任务名称", trigger: "blur" },
    { min: 2, max: 100, message: "任务名称长度在 2 到 100 个字符", trigger: "blur" }
  ],
  serverId: [{ required: true, message: "请选择目标服务器", trigger: "change" }],
  targetPath: [
    { required: true, message: "请输入目标路径", trigger: "blur" },
    { pattern: /^\/.*/, message: "目标路径必须以 / 开头", trigger: "blur" }
  ],
  uploadMode: [{ required: true, message: "请选择上传模式", trigger: "change" }],
  scheduledTime: [
    {
      validator: (rule, value, callback) => {
        if (uploadForm.uploadMode === UPLOAD_MODE.SCHEDULED && !value) {
          callback(new Error("定时上传模式下必须选择定时时间"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  files: [
    {
      validator: (rule, value, callback) => {
        if (fileList.value.length === 0) {
          callback(new Error("请选择要上传的文件"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
};

// 计算属性
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
};

// 方法
const open = () => {
  visible.value = true;
  resetForm();
};

const handleClose = () => {
  visible.value = false;
  emit("close");
};

const resetForm = () => {
  Object.assign(uploadForm, {
    taskName: "",
    serverId: undefined,
    targetPath: "",
    uploadMode: UPLOAD_MODE.REALTIME,
    scheduledTime: undefined,
    priority: 5,
    overwrite: false,
    backup: false,
    compress: false,
    verify: true,
    timeoutSeconds: 300,
    maxRetry: 3,
    description: ""
  });
  fileList.value = [];
  formRef.value?.clearValidate();
};

const handleFileChange = (file: UploadFile) => {
  // 文件大小检查
  if (file.size && file.size > 100 * 1024 * 1024) {
    message.error("文件大小不能超过 100MB");
    return false;
  }

  // 触发表单验证
  formRef.value?.validateField("files");
};

const handleFileRemove = (file: UploadFile) => {
  // 触发表单验证
  formRef.value?.validateField("files");
};

const beforeUpload = () => {
  return false; // 阻止自动上传
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (fileList.value.length === 0) {
      message.error("请选择要上传的文件");
      return;
    }

    submitting.value = true;

    // 为每个文件创建上传任务
    for (const fileItem of fileList.value) {
      if (!fileItem.raw) continue;

      const request: ServerFileUploadRequest = {
        serverId: uploadForm.serverId!,
        taskName: uploadForm.taskName,
        targetPath: uploadForm.targetPath,
        uploadMode: uploadForm.uploadMode,
        scheduledTime: uploadForm.scheduledTime?.toISOString(),
        priority: uploadForm.priority,
        overwrite: uploadForm.overwrite,
        backup: uploadForm.backup,
        compress: uploadForm.compress,
        verify: uploadForm.verify,
        timeoutSeconds: uploadForm.timeoutSeconds,
        maxRetry: uploadForm.maxRetry,
        description: uploadForm.description
      };

      const { data } = await createServerFileUploadTask(fileItem.raw, request);

      if (data.code !== "00000") {
        throw new Error(data.msg || "创建上传任务失败");
      }
    }

    message.success("上传任务创建成功");
    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("创建上传任务失败:", error);
    message.error(error.message || "创建上传任务失败");
  } finally {
    submitting.value = false;
  }
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

/* 对话框样式 */
.upload-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    overflow: hidden;
    @include glass-effect(0.95, 20px);
    box-shadow: $shadow-xl;
    border: 1px solid $border-light;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 0 $spacing-2xl $spacing-2xl;
    background: rgba(255, 255, 255, 0.5);
  }

  :deep(.el-dialog__footer) {
    padding: $spacing-lg $spacing-2xl;
    border-top: 1px solid var(--app-border-secondary);
    background: rgba(255, 255, 255, 0.6);
  }
}

/* 自定义标题 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-xl $spacing-2xl;
  background: $gradient-bg-1, $gradient-bg-2;
  border-bottom: 1px solid var(--app-border-secondary);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: $gradient-line-top;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: $radius-md;
  color: #fff;
  background: var(--app-primary);
  box-shadow: $shadow-md;
  transition: transform $duration-fast $ease-standard, box-shadow $duration-fast $ease-standard;

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-hover-md;
  }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.header-title {
  margin: 0;
  font-size: $font-xl;
  font-weight: $font-weight-bold;
  color: var(--app-text-primary);
  letter-spacing: $letter-spacing-tight;
}

.header-subtitle {
  margin: 0;
  font-size: $font-sm;
  color: var(--app-text-tertiary);
}

.close-btn {
  border: none;
  background: transparent;
  color: var(--app-text-secondary);
  transition: all $duration-fast $ease-standard;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--app-text-primary);
    transform: rotate(90deg);
  }
}

/* 表单样式 */
.upload-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: $spacing-sm;
  @include custom-scrollbar(6px);
}

/* 表单区块 */
.form-section {
  margin-bottom: $spacing-xl;
  border-radius: $radius-md;
  border: 1px solid var(--app-border-secondary);
  overflow: hidden;
  @include glass-effect(0.9, 16px);
  box-shadow: $shadow-sm;
  transition: all $duration-normal $ease-standard;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-1px);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--app-border-secondary);
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  color: var(--app-text-primary);
}

.section-tag {
  margin-left: auto;
  border-radius: $radius-full;
}

.section-content {
  padding: $spacing-xl $spacing-lg $spacing-sm;
}

/* 服务器选项样式 */
.server-option {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.server-name {
  font-weight: $font-weight-medium;
}

.server-host {
  color: var(--app-text-tertiary);
  font-size: $font-xs;
}

/* 模式选择器 */
.mode-radio-group {
  width: 100%;
  display: flex;
}

.mode-radio-group :deep(.el-radio-button) {
  flex: 1;
}

.mode-radio-group :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  width: 100%;
  padding: $spacing-sm $spacing-lg;
  transition: all $duration-fast $ease-standard;
}

/* 优先级选项 */
.priority-option {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.low {
    background: var(--app-info);
  }

  &.normal {
    background: var(--app-success);
  }

  &.high {
    background: var(--app-danger);
  }
}

/* 开关卡片 */
.switch-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.switch-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border: 1px solid var(--app-border-secondary);
  border-radius: $radius-sm;
  transition: all $duration-fast $ease-standard;
  background: rgba(255, 255, 255, 0.45);

  &:hover {
    border-color: var(--app-border-primary);
    transform: translateY(-1px);
    box-shadow: $shadow-sm;
  }

  &.active {
    border-color: var(--app-primary);
    background: rgba(99, 102, 241, 0.08);
  }
}

.switch-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  color: var(--app-text-secondary);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.03);
  transition: all $duration-fast $ease-standard;
}

.switch-card.active .switch-card-icon {
  background: var(--app-primary);
  color: #fff;
}

.switch-card-content {
  flex: 1;
  min-width: 0;
}

.switch-card-title {
  font-size: $font-sm;
  font-weight: $font-weight-semibold;
  color: var(--app-text-primary);
  margin-bottom: 2px;
}

.switch-card-desc {
  font-size: 11px;
  color: var(--app-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数值配置 */
.number-config {
  margin-bottom: $spacing-md;
}

.form-item-tip {
  font-size: 11px;
  color: var(--app-text-tertiary);
  margin-top: $spacing-xs;
}

/* 上传区域 */
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  min-height: 160px;
  padding: $spacing-3xl $spacing-xl;
  border: 2px dashed var(--app-border-secondary);
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.4);
  transition: all $duration-normal $ease-standard;

  &:hover {
    border-color: var(--app-primary);
    background: rgba(99, 102, 241, 0.06);
    transform: translateY(-1px);
    box-shadow: $shadow-sm;
  }
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--app-primary);
  background: rgba(99, 102, 241, 0.08);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.upload-icon {
  color: var(--app-primary);
  opacity: 0.9;
  transition: transform $duration-normal $ease-standard;
}

.upload-area :deep(.el-upload-dragger:hover) .upload-icon {
  transform: translateY(-2px) scale(1.04);
}

.upload-text {
  text-align: center;
}

.upload-main-text {
  margin: 0;
  font-size: $font-lg;
  font-weight: $font-weight-semibold;
  color: var(--app-text-primary);
}

.upload-sub-text {
  margin: $spacing-xs 0 0;
  font-size: $font-sm;
  color: var(--app-text-tertiary);
}

.upload-sub-text em {
  color: var(--app-primary);
  font-style: normal;
  cursor: pointer;
  font-weight: $font-weight-medium;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-sm;
  font-size: $font-xs;
  color: var(--app-text-tertiary);
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 文件列表 */
.upload-area :deep(.el-upload-list) {
  margin-top: $spacing-md;
}

.upload-area :deep(.el-upload-list__item) {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  margin-bottom: $spacing-sm;
  border: 1px solid var(--app-border-secondary);
  background: rgba(255, 255, 255, 0.5);
  transition: all $duration-fast $ease-standard;

  &:hover {
    border-color: var(--app-border-primary);
    box-shadow: $shadow-sm;
  }
}

.upload-area :deep(.el-upload-list__item-name) {
  color: var(--app-text-primary);
}

/* 底部样式 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-lg;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-xs;
  color: var(--app-text-tertiary);
}

.footer-actions {
  display: flex;
  gap: $spacing-md;

  .el-button {
    min-width: 110px;
    border-radius: $radius-sm;
    padding: $button-padding-lg;
    font-weight: $font-weight-medium;
    transition: all $duration-fast $ease-standard;

    &:hover:not(.is-disabled) {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:active:not(.is-disabled) {
      transform: translateY(0);
    }
  }

  .el-button--primary {
    @include button-ripple;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
}

@include respond-to(sm) {
  .upload-dialog {
    :deep(.el-dialog__body) {
      padding: 0 $spacing-lg $spacing-lg;
    }

    :deep(.el-dialog__footer) {
      padding: $spacing-md $spacing-lg;
    }
  }

  .dialog-header {
    padding: $spacing-lg $spacing-lg;
  }

  .switch-cards {
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    flex-direction: column;
    align-items: stretch;

    .footer-actions {
      width: 100%;
      flex-direction: column-reverse;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
