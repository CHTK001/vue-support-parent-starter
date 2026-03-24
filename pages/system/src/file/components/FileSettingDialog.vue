<template>
  <sc-dialog
    v-model="visible"
    title="文件服务设置"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <ScForm 
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="right"
    >
      <!-- 基础配置 -->
      <ScDivider content-position="left">
        <IconifyIconOnline icon="ri:settings-4-line" />
        基础配置
      </ScDivider>

      <ScFormItem label="配置名称" prop="sysFileSystemSettingName">
        <ScInput 
          v-model="formData.sysFileSystemSettingName"
          placeholder="请输入配置名称"
        />
      </ScFormItem>

      <ScFormItem label="默认存储类型">
        <ScSelect 
          v-model="formData.sysFileSystemSettingDefaultStorageType"
          style="width: 100%"
        >
          <ScOption label="本地存储" value="local" />
          <ScOption label="阿里云 OSS" value="oss" />
          <ScOption label="腾讯云 COS" value="cos" />
          <ScOption label="七牛云" value="qiniu" />
          <ScOption label="MinIO" value="minio" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="单文件最大(MB)">
        <ScInputNumber 
          v-model="formData.sysFileSystemSettingMaxFileSizeMb"
          :min="1"
          :max="10240"
        />
      </ScFormItem>

      <ScFormItem label="文件保留天数">
        <ScInputNumber 
          v-model="formData.sysFileSystemSettingRetentionDays"
          :min="0"
          :max="365"
        />
        <span class="form-tip">0 表示永久保留</span>
      </ScFormItem>

      <!-- 分片上传配置 -->
      <ScDivider content-position="left">
        <IconifyIconOnline icon="ri:upload-cloud-line" />
        分片上传
      </ScDivider>

      <ScFormItem label="启用分片上传">
        <ScSwitch v-model="formData.sysFileSystemSettingChunkEnabled" />
      </ScFormItem>

      <ScFormItem 
        v-if="formData.sysFileSystemSettingChunkEnabled"
        label="分片大小(MB)"
      >
        <ScInputNumber 
          v-model="formData.sysFileSystemSettingChunkSizeMb"
          :min="1"
          :max="500"
        />
      </ScFormItem>

      <ScFormItem label="启用自动合并">
        <ScSwitch v-model="formData.sysFileSystemSettingAutoMergeEnabled" />
      </ScFormItem>

      <ScFormItem label="支持手动合并">
        <ScSwitch v-model="formData.sysFileSystemSettingManualMergeEnabled" />
      </ScFormItem>

      <ScFormItem 
        v-if="formData.sysFileSystemSettingAutoMergeEnabled"
        label="合并任务限制"
      >
        <ScInputNumber 
          v-model="formData.sysFileSystemSettingMergeTaskLimit"
          :min="1"
          :max="100"
        />
      </ScFormItem>

      <!-- 文件存储配置 -->
      <ScDivider content-position="left">
        <IconifyIconOnline icon="ri:folder-line" />
        存储配置
      </ScDivider>

      <ScFormItem 
        label="存储根路径"
        prop="sysFileSystemSettingStorageRootPath"
      >
        <ScInput 
          v-model="formData.sysFileSystemSettingStorageRootPath"
          placeholder="请输入存储根路径，如: /data/files 或 D:/files"
        />
      </ScFormItem>

      <ScFormItem label="临时文件路径">
        <ScInput 
          v-model="formData.sysFileSystemSettingTempPath"
          placeholder="请输入临时文件路径，如: /data/temp 或 D:/temp"
        />
      </ScFormItem>

      <!-- HTTP 服务配置 -->
      <ScDivider content-position="left">
        <IconifyIconOnline icon="ri:global-line" />
        HTTP 文件服务
      </ScDivider>

      <!-- 服务器状态和控制 -->
      <ScFormItem label="服务器状态">
        <div class="server-control">
          <ScTag 
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
          </ScTag>
          <ScButton 
            v-if="serverStatus === 'stopped'"
            type="success"
            size="small"
            :loading="serverLoading"
            @click="handleStartServer"
          >
            <IconifyIconOnline icon="ri:play-circle-line" />
            启动服务
          </ScButton>
          <ScButton 
            v-else
            type="danger"
            size="small"
            :loading="serverLoading"
            @click="handleStopServer"
          >
            <IconifyIconOnline icon="ri:stop-circle-line" />
            停止服务
          </ScButton>
        </div>
      </ScFormItem>

      <ScFormItem label="服务端口" prop="sysFileSystemSettingHttpServerPort">
        <ScInputNumber 
          v-model="formData.sysFileSystemSettingHttpServerPort"
          :min="1"
          :max="65535"
          @change="handlePortChange"
        />
        <ScTag 
          v-if="portStatus !== null"
          :type="portStatus ? 'success' : 'danger'"
          size="small"
          style="margin-left: 12px"
        >
          {{ portStatus ? "端口可用" : "端口已占用" }}
        </ScTag>
      </ScFormItem>

      <ScFormItem label="服务主机">
        <ScInput 
          v-model="formData.sysFileSystemSettingHttpServerHost"
          placeholder="0.0.0.0"
        />
      </ScFormItem>

      <ScFormItem label="上下文路径">
        <ScInput 
          v-model="formData.sysFileSystemSettingHttpServerContext"
          placeholder="/file"
        />
      </ScFormItem>

      <ScFormItem label="访问域名">
        <ScInput 
          v-model="formData.sysFileSystemSettingHttpAccessDomain"
          placeholder="http://example.com"
        />
      </ScFormItem>

      <!-- 功能开关 -->
      <ScDivider content-position="left">
        <IconifyIconOnline icon="ri:toggle-line" />
        功能开关
      </ScDivider>

      <ScFormItem label="启用文件下载">
        <ScSwitch v-model="formData.sysFileSystemSettingDownloadEnabled" />
      </ScFormItem>

      <ScFormItem label="启用文件预览">
        <ScSwitch v-model="formData.sysFileSystemSettingPreviewEnabled" />
        <span class="form-tip">开启后可实时监听上传进度</span>
      </ScFormItem>

      <ScFormItem label="允许的文件类型">
        <ScInput 
          v-model="formData.sysFileSystemSettingAllowedTypes"
          type="textarea"
          :rows="2"
          placeholder="留空表示允许所有类型，多个用逗号分隔，如: jpg,png,pdf,doc"
        />
      </ScFormItem>

      <ScFormItem label="备注">
        <ScInput 
          v-model="formData.sysFileSystemSettingRemark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
        />
      </ScFormItem>
    </ScForm>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="loading" @click="handleSubmit"
        >保存</el-button
      >
    </template>
  </sc-dialog>
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
