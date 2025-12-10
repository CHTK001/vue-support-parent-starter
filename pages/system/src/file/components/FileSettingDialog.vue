<template>
  <el-dialog
    v-model="visible"
    title="文件服务设置"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="right"
    >
      <!-- 基础配置 -->
      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:settings-4-line" />
        基础配置
      </el-divider>

      <el-form-item label="配置名称" prop="sysFileSystemSettingName">
        <el-input
          v-model="formData.sysFileSystemSettingName"
          placeholder="请输入配置名称"
        />
      </el-form-item>

      <el-form-item label="默认存储类型">
        <el-select
          v-model="formData.sysFileSystemSettingDefaultStorageType"
          style="width: 100%"
        >
          <el-option label="本地存储" value="local" />
          <el-option label="阿里云 OSS" value="oss" />
          <el-option label="腾讯云 COS" value="cos" />
          <el-option label="七牛云" value="qiniu" />
          <el-option label="MinIO" value="minio" />
        </el-select>
      </el-form-item>

      <el-form-item label="单文件最大(MB)">
        <el-input-number
          v-model="formData.sysFileSystemSettingMaxFileSizeMb"
          :min="1"
          :max="10240"
        />
      </el-form-item>

      <el-form-item label="文件保留天数">
        <el-input-number
          v-model="formData.sysFileSystemSettingRetentionDays"
          :min="0"
          :max="365"
        />
        <span class="form-tip">0 表示永久保留</span>
      </el-form-item>

      <!-- 分片上传配置 -->
      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:upload-cloud-line" />
        分片上传
      </el-divider>

      <el-form-item label="启用分片上传">
        <ScSwitch v-model="formData.sysFileSystemSettingChunkEnabled" />
      </el-form-item>

      <el-form-item
        v-if="formData.sysFileSystemSettingChunkEnabled"
        label="分片大小(MB)"
      >
        <el-input-number
          v-model="formData.sysFileSystemSettingChunkSizeMb"
          :min="1"
          :max="500"
        />
      </el-form-item>

      <el-form-item label="启用自动合并">
        <ScSwitch v-model="formData.sysFileSystemSettingAutoMergeEnabled" />
      </el-form-item>

      <el-form-item label="支持手动合并">
        <ScSwitch v-model="formData.sysFileSystemSettingManualMergeEnabled" />
      </el-form-item>

      <el-form-item
        v-if="formData.sysFileSystemSettingAutoMergeEnabled"
        label="合并任务限制"
      >
        <el-input-number
          v-model="formData.sysFileSystemSettingMergeTaskLimit"
          :min="1"
          :max="100"
        />
      </el-form-item>

      <!-- 文件存储配置 -->
      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:folder-line" />
        存储配置
      </el-divider>

      <el-form-item
        label="存储根路径"
        prop="sysFileSystemSettingStorageRootPath"
      >
        <el-input
          v-model="formData.sysFileSystemSettingStorageRootPath"
          placeholder="请输入存储根路径，如: /data/files 或 D:/files"
        />
      </el-form-item>

      <el-form-item label="临时文件路径">
        <el-input
          v-model="formData.sysFileSystemSettingTempPath"
          placeholder="请输入临时文件路径，如: /data/temp 或 D:/temp"
        />
      </el-form-item>

      <!-- HTTP 服务配置 -->
      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:global-line" />
        HTTP 文件服务
      </el-divider>

      <!-- 服务器状态和控制 -->
      <el-form-item label="服务器状态">
        <div class="server-control">
          <el-tag
            :type="serverStatus === 'running' ? 'success' : 'info'"
            size="large"
          >
            <IconifyIconOnline
              :icon="
                serverStatus === 'running'
                  ? 'ri:checkbox-circle-line'
                  : 'ri:close-circle-line'
              "
            />
            {{ serverStatus === "running" ? "运行中" : "已停止" }}
          </el-tag>
          <el-button
            v-if="serverStatus === 'stopped'"
            type="success"
            size="small"
            :loading="serverLoading"
            @click="handleStartServer"
          >
            <IconifyIconOnline icon="ri:play-circle-line" />
            启动服务
          </el-button>
          <el-button
            v-else
            type="danger"
            size="small"
            :loading="serverLoading"
            @click="handleStopServer"
          >
            <IconifyIconOnline icon="ri:stop-circle-line" />
            停止服务
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="服务端口" prop="sysFileSystemSettingHttpServerPort">
        <el-input-number
          v-model="formData.sysFileSystemSettingHttpServerPort"
          :min="1"
          :max="65535"
          @change="handlePortChange"
        />
        <el-tag
          v-if="portStatus !== null"
          :type="portStatus ? 'success' : 'danger'"
          size="small"
          style="margin-left: 12px"
        >
          {{ portStatus ? "端口可用" : "端口已占用" }}
        </el-tag>
      </el-form-item>

      <el-form-item label="服务主机">
        <el-input
          v-model="formData.sysFileSystemSettingHttpServerHost"
          placeholder="0.0.0.0"
        />
      </el-form-item>

      <el-form-item label="上下文路径">
        <el-input
          v-model="formData.sysFileSystemSettingHttpServerContext"
          placeholder="/file"
        />
      </el-form-item>

      <el-form-item label="访问域名">
        <el-input
          v-model="formData.sysFileSystemSettingHttpAccessDomain"
          placeholder="http://example.com"
        />
      </el-form-item>

      <!-- 功能开关 -->
      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:toggle-line" />
        功能开关
      </el-divider>

      <el-form-item label="启用文件下载">
        <ScSwitch v-model="formData.sysFileSystemSettingDownloadEnabled" />
      </el-form-item>

      <el-form-item label="启用文件预览">
        <ScSwitch v-model="formData.sysFileSystemSettingPreviewEnabled" />
        <span class="form-tip">开启后可实时监听上传进度</span>
      </el-form-item>

      <el-form-item label="允许的文件类型">
        <el-input
          v-model="formData.sysFileSystemSettingAllowedTypes"
          type="textarea"
          :rows="2"
          placeholder="留空表示允许所有类型，多个用逗号分隔，如: jpg,png,pdf,doc"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="formData.sysFileSystemSettingRemark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import type { FormInstance, FormRules } from "element-plus";
import {
  updateFileSystemSetting,
  startFileServer,
  stopFileServer,
  getFileServerStatus,
  checkPortAvailable,
  type SysFileSystemSetting,
} from "../../api/file";

interface Props {
  modelValue: boolean;
  setting?: SysFileSystemSetting;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const formData = ref<SysFileSystemSetting>({});

// 服务器状态
const serverStatus = ref<"running" | "stopped">("stopped");
const serverLoading = ref(false);
const portStatus = ref<boolean | null>(null);

const rules: FormRules = {
  sysFileSystemSettingName: [
    { required: true, message: "请输入配置名称", trigger: "blur" },
  ],
  sysFileSystemSettingStorageRootPath: [
    { required: true, message: "请输入存储根路径", trigger: "blur" },
  ],
  sysFileSystemSettingHttpServerPort: [
    { required: true, message: "请输入服务端口", trigger: "blur" },
  ],
};

// 获取服务器状态
const fetchServerStatus = async () => {
  getFileServerStatus().then((res) => {
    serverStatus.value = res.data === "running" ? "running" : "stopped";
  });
};

// 启动服务器
const handleStartServer = async () => {
  serverLoading.value = true;
  startFileServer()
    .then((res) => {
      message("服务启动成功", { type: "success" });
      serverStatus.value = "running";
    })
    .catch((err) => {
      message(err.message || "服务启动失败", { type: "error" });
    })
    .finally(() => {
      serverLoading.value = false;
    });
};

// 停止服务器
const handleStopServer = async () => {
  serverLoading.value = true;
  stopFileServer()
    .then((res) => {
      message("服务停止成功", { type: "success" });
      serverStatus.value = "stopped";
    })
    .catch((err) => {
      message(err.message || "服务停止失败", { type: "error" });
    })
    .finally(() => {
      serverLoading.value = false;
    });
};

// 检查端口
const handlePortChange = async (port: number) => {
  if (!port || port < 1 || port > 65535) {
    portStatus.value = null;
    return;
  }
  checkPortAvailable(port).then((res) => {
    portStatus.value = res.data ?? false;
  });
};

// 监听 props 变化初始化表单
watch(
  () => props.setting,
  (val) => {
    if (val) {
      formData.value = { ...val };
    }
  },
  { immediate: true }
);

// 监听对话框打开
watch(visible, (val) => {
  if (val) {
    fetchServerStatus();
    portStatus.value = null;
  }
});

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const res = await updateFileSystemSetting(formData.value);
      if (res.code === 200) {
        message("保存成功", { type: "success" });
        emit("saved");
        visible.value = false;
      } else {
        message(res.msg || "保存失败", { type: "error" });
      }
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style lang="scss" scoped>
.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-control {
  display: flex;
  align-items: center;
  gap: 12px;

  .el-tag {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

:deep(.el-divider__text) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
