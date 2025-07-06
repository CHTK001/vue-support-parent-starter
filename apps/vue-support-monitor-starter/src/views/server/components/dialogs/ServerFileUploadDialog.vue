<template>
  <el-dialog v-model="visible" title="服务器文件上传" width="800px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="formRef" :model="uploadForm" :rules="formRules" label-width="120px" class="upload-form">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务名称" prop="taskName">
            <el-input v-model="uploadForm.taskName" placeholder="请输入任务名称" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标服务器" prop="serverId">
            <el-select v-model="uploadForm.serverId" placeholder="请选择目标服务器" style="width: 100%" filterable>
              <el-option
                v-for="server in sshServers"
                :key="server.monitorSysGenServerId"
                :label="`${server.monitorSysGenServerName} (${server.monitorSysGenServerHost})`"
                :value="server.monitorSysGenServerId"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="目标路径" prop="targetPath">
            <el-input v-model="uploadForm.targetPath" placeholder="请输入目标路径，如：/home/user/" maxlength="500" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上传模式" prop="uploadMode">
            <el-select v-model="uploadForm.uploadMode" style="width: 100%">
              <el-option label="立即上传" value="REALTIME" />
              <el-option label="定时上传" value="SCHEDULED" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="uploadForm.uploadMode === 'SCHEDULED'">
        <el-col :span="12">
          <el-form-item label="定时时间" prop="scheduledTime">
            <el-date-picker v-model="uploadForm.scheduledTime" type="datetime" placeholder="选择定时上传时间" style="width: 100%" :disabled-date="disabledDate" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="uploadForm.priority" style="width: 100%">
              <el-option label="低" :value="1" />
              <el-option label="普通" :value="5" />
              <el-option label="高" :value="10" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="覆盖文件">
            <el-switch v-model="uploadForm.overwrite" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备份原文件">
            <el-switch v-model="uploadForm.backup" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="压缩传输">
            <el-switch v-model="uploadForm.compress" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="文件校验">
            <el-switch v-model="uploadForm.verify" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="超时时间(秒)">
            <el-input-number v-model="uploadForm.timeoutSeconds" :min="30" :max="3600" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最大重试次数">
            <el-input-number v-model="uploadForm.maxRetry" :min="0" :max="10" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="任务描述">
        <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入任务描述（可选）" maxlength="500" show-word-limit />
      </el-form-item>

      <el-form-item label="选择文件" prop="files">
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
          <IconifyIconOnline icon="ep:upload-filled" class="el-icon--upload" />
          <div class="el-upload__text">
            将文件拖到此处，或
            <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持多文件上传，单个文件大小不超过 100MB</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">创建任务</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from "element-plus";
import { createServerFileUploadTask, type ServerFileUploadRequest, UPLOAD_MODE } from "@/api/server-file-upload";

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
    ElMessage.error("文件大小不能超过 100MB");
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
      ElMessage.error("请选择要上传的文件");
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

    ElMessage.success("上传任务创建成功");
    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("创建上传任务失败:", error);
    ElMessage.error(error.message || "创建上传任务失败");
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
.upload-form {
  max-height: 60vh;
  overflow-y: auto;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

.dialog-footer {
  text-align: right;
}
</style>
