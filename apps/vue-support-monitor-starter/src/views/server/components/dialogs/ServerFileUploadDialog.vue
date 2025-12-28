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

<style scoped>
/* 对话框样式 */
.upload-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.upload-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.upload-dialog :deep(.el-dialog__body) {
  padding: 0 24px 24px;
}

.upload-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--app-border-secondary);
  background: var(--app-bg-secondary);
}

/* 自定义标题 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--app-primary-light) 0%, var(--app-bg-primary) 100%);
  border-bottom: 1px solid var(--app-border-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--app-primary);
  border-radius: 12px;
  color: #fff;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-tertiary);
}

.close-btn {
  border: none;
  background: transparent;
  color: var(--app-text-secondary);
}

.close-btn:hover {
  background: var(--app-bg-tertiary);
  color: var(--app-text-primary);
}

/* 表单样式 */
.upload-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.upload-form::-webkit-scrollbar {
  width: 6px;
}

.upload-form::-webkit-scrollbar-thumb {
  background: var(--app-border-secondary);
  border-radius: 3px;
}

.upload-form::-webkit-scrollbar-thumb:hover {
  background: var(--app-border-primary);
}

/* 表单区块 */
.form-section {
  margin-bottom: 20px;
  background: var(--app-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--app-border-secondary);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: var(--app-bg-tertiary);
  border-bottom: 1px solid var(--app-border-secondary);
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.section-tag {
  margin-left: auto;
}

.section-content {
  padding: 20px 16px 8px;
}

/* 服务器选项样式 */
.server-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-name {
  font-weight: 500;
}

.server-host {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

/* 模式选择器 */
.mode-radio-group {
  width: 100%;
}

.mode-radio-group :deep(.el-radio-button) {
  flex: 1;
}

.mode-radio-group :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
}

/* 优先级选项 */
.priority-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-dot.low {
  background: var(--app-info);
}

.priority-dot.normal {
  background: var(--app-success);
}

.priority-dot.high {
  background: var(--app-danger);
}

/* 开关卡片 */
.switch-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.switch-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--app-bg-primary);
  border: 1px solid var(--app-border-secondary);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.switch-card:hover {
  border-color: var(--app-border-primary);
}

.switch-card.active {
  border-color: var(--app-primary);
  background: var(--app-primary-light);
}

.switch-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--app-bg-tertiary);
  border-radius: 8px;
  color: var(--app-text-secondary);
  flex-shrink: 0;
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
  font-size: 13px;
  font-weight: 500;
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
  margin-bottom: 12px;
}

.form-item-tip {
  font-size: 11px;
  color: var(--app-text-tertiary);
  margin-top: 4px;
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
  padding: 32px 20px;
  border: 2px dashed var(--app-border-secondary);
  border-radius: 12px;
  background: var(--app-bg-primary);
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--app-primary);
  background: var(--app-primary-light);
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--app-primary);
  background: var(--app-primary-light);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: var(--app-primary);
  opacity: 0.8;
}

.upload-text {
  text-align: center;
}

.upload-main-text {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--app-text-primary);
}

.upload-sub-text {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--app-text-tertiary);
}

.upload-sub-text em {
  color: var(--app-primary);
  font-style: normal;
  cursor: pointer;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--app-bg-tertiary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--app-text-tertiary);
}

/* 文件列表 */
.upload-area :deep(.el-upload-list) {
  margin-top: 12px;
}

.upload-area :deep(.el-upload-list__item) {
  padding: 8px 12px;
  background: var(--app-bg-tertiary);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--app-border-secondary);
}

.upload-area :deep(.el-upload-list__item-name) {
  color: var(--app-text-primary);
}

/* 底部样式 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--app-text-tertiary);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.footer-actions .el-button {
  min-width: 100px;
}

.footer-actions .el-button--primary {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
