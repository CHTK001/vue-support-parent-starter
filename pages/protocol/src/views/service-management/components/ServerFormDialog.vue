<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑服务' : '新增服务'"
    width="960px"
    :close-on-click-modal="false"
    class="server-dialog"
    @close="handleClose"
  >
    <div class="dialog-body">
      <!-- 顶部标题区域 -->
      <div class="dialog-header-banner">
        <div class="banner-icon" :class="{ 'is-edit': isEdit }">
          <IconifyIconOnline :icon="isEdit ? 'ri:edit-2-line' : 'ri:add-circle-line'" />
        </div>
        <div class="banner-content">
          <h3 class="banner-title">{{ isEdit ? '编辑服务配置' : '创建新服务' }}</h3>
          <p class="banner-desc">{{ isEdit ? '修改服务的基本信息和高级配置' : '配置服务的基本信息以启动新服务' }}</p>
        </div>
      </div>

      <ScForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
        class="server-form"
      >
        <ScRow :gutter="32">
          <!-- 左列：基本信息 -->
          <ScCol :xs="24" :sm="24" :md="12" :lg="12">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon primary">
                  <IconifyIconOnline icon="ri:information-line" />
                </div>
                <div class="section-meta">
                  <span class="section-title">基本信息</span>
                  <span class="section-subtitle">服务的核心配置项</span>
                </div>
              </div>

              <div class="section-content">
                <ScFormItem label="服务名称" prop="systemServerName">
                  <ScInput
                    v-model="formData.systemServerName"
                    placeholder="请输入服务名称"
                    clearable
                    class="custom-input"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:server-line" class="input-icon" />
                    </template>
                  </ScInput>
                </ScFormItem>

                <ScFormItem label="服务类型" prop="systemServerType">
                  <ScSelect
                    v-model="formData.systemServerType"
                    placeholder="请选择服务类型"
                    class="custom-select"
                  >
                    <el-option-group
                      v-for="group in groupedServerTypes"
                      :key="group.key"
                      :label="group.label"
                    >
                      <ScOption
                        v-for="item in group.options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      >
                        <div class="type-option">
                          <span class="type-option-label">{{ item.label }}</span>
                          <span class="type-option-desc">{{ item.subtitle }}</span>
                        </div>
                      </ScOption>
                    </el-option-group>
                  </ScSelect>
                </ScFormItem>

                <ScFormItem label="服务主机">
                  <ScInput
                    v-model="formData.systemServerHost"
                    placeholder="请输入服务主机地址"
                    clearable
                    class="custom-input"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:global-line" class="input-icon" />
                    </template>
                  </ScInput>
                </ScFormItem>

                <ScFormItem label="服务端口" prop="systemServerPort">
                  <div class="port-input-wrapper">
                    <ScInputNumber
                      v-model="formData.systemServerPort"
                      :min="1"
                      :max="65535"
                      placeholder="端口号 (1-65535)"
                      class="custom-input-number"
                      controls-position="right"
                    />
                    <transition name="fade">
                      <div v-if="portCheckMessage" class="port-status" :class="portCheckClass">
                        <IconifyIconOnline
                          :icon="portCheckClass === 'port-available' ? 'ri:checkbox-circle-line' : portCheckClass === 'port-unavailable' ? 'ri:close-circle-line' : 'ri:error-warning-line'"
                        />
                        <span>{{ portCheckMessage }}</span>
                      </div>
                    </transition>
                  </div>
                </ScFormItem>

                <ScFormItem label="上下文路径" prop="systemServerContextPath">
                  <ScInput
                    v-model="formData.systemServerContextPath"
                    placeholder="例如: /api"
                    class="custom-input"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:link" class="input-icon" />
                    </template>
                  </ScInput>
                </ScFormItem>
              </div>
            </div>
          </ScCol>

          <!-- 右列：高级配置 -->
          <ScCol :xs="24" :sm="24" :md="12" :lg="12">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon success">
                  <IconifyIconOnline icon="ri:settings-3-line" />
                </div>
                <div class="section-meta">
                  <span class="section-title">高级配置</span>
                  <span class="section-subtitle">可选的性能与行为设置</span>
                </div>
              </div>

              <div class="section-content">
                <ScFormItem label="最大连接数" prop="systemServerMaxConnections">
                  <ScInputNumber
                    v-model="formData.systemServerMaxConnections"
                    :min="1"
                    :max="10000"
                    placeholder="留空表示不限制"
                    class="custom-input-number"
                    controls-position="right"
                  />
                  <div class="form-helper">
                    <IconifyIconOnline icon="ri:information-line" />
                    <span>服务允许的最大并发连接数</span>
                  </div>
                </ScFormItem>

                <ScFormItem label="超时时间" prop="systemServerTimeout">
                  <ScInputNumber
                    v-model="formData.systemServerTimeout"
                    :min="1"
                    :max="3600"
                    placeholder="单位：秒"
                    class="custom-input-number"
                    controls-position="right"
                  />
                  <div class="form-helper">
                    <IconifyIconOnline icon="ri:timer-line" />
                    <span>连接超时时间，范围 1-3600 秒</span>
                  </div>
                </ScFormItem>

                <ScFormItem label="自动启动">
                  <div class="switch-card">
                    <div class="switch-card-content">
                      <div class="switch-card-icon">
                        <IconifyIconOnline icon="ri:play-circle-line" />
                      </div>
                      <div class="switch-card-text">
                        <span class="switch-card-title">系统启动时自动运行</span>
                        <span class="switch-card-desc">开启后，系统启动时将自动启动此服务</span>
                      </div>
                    </div>
                    <ScSwitch
                      v-model="formData.systemServerAutoStart"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                      class="custom-switch"
                    />
                  </div>
                </ScFormItem>

                <ScFormItem label="服务描述" prop="systemServerDescription">
                  <ScInput
                    v-model="formData.systemServerDescription"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入服务描述信息，便于后续管理和维护..."
                    class="custom-textarea"
                    resize="none"
                  />
                </ScFormItem>

                <FtpServerConfigSection
                  v-if="isFtpType"
                  v-model="ftpConfig"
                />
              </div>
            </div>
          </ScCol>
        </ScRow>
      </ScForm>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton class="btn-cancel" @click="handleClose">
          <IconifyIconOnline icon="ri:close-line" />
          <span>取消</span>
        </ScButton>
        <ScButton
          type="primary"
          :loading="loading"
          class="btn-submit"
          @click="handleSubmit"
        >
          <IconifyIconOnline :icon="isEdit ? 'ri:save-line' : 'ri:add-line'" />
          <span>{{ isEdit ? '保存修改' : '创建服务' }}</span>
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
import {
  addSystemServer,
  updateSystemServer,
  checkPortAvailable,
  type SystemServer,
} from "@/api/system-server";
import FtpServerConfigSection, {
  type FtpConfigForm,
} from "./FtpServerConfigSection.vue";

// Props
interface Props {
  visible: boolean;
  serverData?: SystemServer | null;
  serverTypes: RawServerType[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  serverData: null,
  serverTypes: () => [],
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const loading = ref(false);
const portCheckMessage = ref("");
const portCheckClass = ref("");

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const isEdit = computed(() => !!props.serverData?.systemServerId);

interface RawServerType {
  name?: string;
  value?: string;
  label?: string;
  describe?: string;
  describeType?: string;
}

interface ServerTypeOption {
  value: string;
  label: string;
  sourceType: string;
  subtitle: string;
}

interface ServerTypeGroup {
  key: string;
  label: string;
  options: ServerTypeOption[];
}

const normalizeServerTypeValue = (value?: string): string => {
  const upper = (value || "").trim().toUpperCase();
  if (!upper) return "";
  if (upper === "HTTPD") return "HTTP";
  if (
    upper === "HTTP-PROXY-SERVER" ||
    upper === "HTTPPROXY" ||
    upper === "HTTPPROXY-SERVER" ||
    upper === "PROXY-HTTP"
  ) {
    return "HTTP-PROXY";
  }
  if (upper === "SOCK5" || upper === "SOCKS" || upper === "SOCKS5-PROXY") {
    return "SOCKS5";
  }
  return upper;
};

const resolveServerTypeSource = (
  item: RawServerType | string,
  normalizedValue: string,
): string => {
  const itemAny = item as Record<string, unknown>;
  const source =
    typeof item === "string"
      ? ""
      : (item.describeType || itemAny.describe_type || "").toString();
  if (source && source !== "default") {
    return source;
  }
  if (normalizedValue.startsWith("NETTY-")) {
    return "utils-netty";
  }
  return "utils-common";
};

const buildSourceSubtitle = (sourceType: string): string => {
  if (!sourceType || sourceType === "utils-common") {
    return "实现来源：默认（utils-common）";
  }
  if (sourceType.startsWith("utils-")) {
    return `实现来源：${sourceType.replace("utils-", "")}（${sourceType}）`;
  }
  return `实现来源：${sourceType}`;
};

const groupedServerTypes = computed<ServerTypeGroup[]>(() => {
  const list = Array.isArray(props.serverTypes) ? props.serverTypes : [];
  const optionMap = new Map<string, ServerTypeOption>();

  for (const raw of list) {
    const value =
      typeof raw === "string" ? raw : raw.name || raw.value || raw.label || "";
    const normalizedValue = normalizeServerTypeValue(value);
    if (!normalizedValue) {
      continue;
    }
    const sourceType = resolveServerTypeSource(raw, normalizedValue);
    const labelSource =
      typeof raw === "string"
        ? raw
        : raw.describe || raw.label || raw.name || raw.value || normalizedValue;
    const label =
      typeof raw === "string"
        ? normalizedValue
        : raw.describe
          ? `${raw.describe}(${normalizedValue})`
          : `${labelSource}(${normalizedValue})`;
    optionMap.set(normalizedValue, {
      value: normalizedValue,
      label,
      sourceType,
      subtitle: buildSourceSubtitle(sourceType),
    });
  }

  const groups = new Map<string, ServerTypeGroup>();
  for (const option of optionMap.values()) {
    const sourceType = option.sourceType || "utils-common";
    const groupKey = sourceType;
    const groupLabel =
      sourceType === "utils-common"
        ? "默认"
        : sourceType.startsWith("utils-")
          ? sourceType.replace("utils-", "")
          : sourceType;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        options: [],
      });
    }
    groups.get(groupKey)!.options.push(option);
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (a.key === "utils-common") return -1;
    if (b.key === "utils-common") return 1;
    return a.label.localeCompare(b.label);
  });
  for (const group of sorted) {
    group.options.sort((a, b) => a.value.localeCompare(b.value));
  }
  return sorted;
});

const resolveDefaultServerType = (): string => {
  const options = groupedServerTypes.value.flatMap((item) => item.options);
  if (!options.length) return "";
  const preferred = options.find((item) => item.value === "HTTP");
  return preferred?.value || options[0].value;
};

const createDefaultFtpConfig = (): FtpConfigForm => ({
  homeDirectory: "./ftp-home",
  enableAnonymous: false,
  anonymousHomeDirectory: "./ftp-home",
  anonymousWriteEnabled: false,
  accounts: [
    {
      username: "admin",
      password: "admin",
      permission: "readWrite" as const,
      homeDirectory: "",
    },
  ],
});

// 表单数据
const formData = reactive<SystemServer>({
  systemServerName: "",
  systemServerType: resolveDefaultServerType(),
  systemServerContextPath: "",
  systemServerPort: 8080,
  systemServerHost: "0.0.0.0",
  systemServerMaxConnections: undefined,
  systemServerTimeout: undefined,
  systemServerAutoStart: false,
  systemServerDescription: "",
  systemServerConfig: "",
});

const ftpConfig = reactive(createDefaultFtpConfig());
const isFtpType = computed(
  () => normalizeServerTypeValue(formData.systemServerType) === "FTP",
);

// 表单验证规则
const formRules: FormRules = {
  systemServerName: [
    { required: true, message: "请输入服务器名称", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "服务器名称长度在 2 到 100 个字符",
      trigger: "blur",
    },
  ],
  systemServerType: [
    { required: true, message: "请选择服务器类型", trigger: "change" },
  ],
  systemServerPort: [
    { required: true, message: "请输入服务器端口", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 65535,
      message: "端口号必须在 1-65535 之间",
      trigger: "blur",
    },
  ],
  systemServerDescription: [
    { max: 500, message: "描述长度不能超过 500 个字符", trigger: "blur" },
  ],
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    systemServerId: undefined,
    systemServerName: "",
    systemServerType: resolveDefaultServerType(),
    systemServerPort: 8080,
    systemServerMaxConnections: undefined,
    systemServerTimeout: undefined,
    systemServerAutoStart: false,
    systemServerDescription: "",
    systemServerConfig: "",
  });
  Object.assign(ftpConfig, createDefaultFtpConfig());
  formRef.value?.clearValidate();
};

const parseServerConfig = (raw?: string) => {
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    ftpConfig.homeDirectory = parsed.homeDirectory || "./ftp-home";
    ftpConfig.enableAnonymous = !!parsed.enableAnonymous;
    ftpConfig.anonymousHomeDirectory =
      parsed.anonymousHomeDirectory || ftpConfig.homeDirectory;
    ftpConfig.anonymousWriteEnabled = !!parsed.anonymousWriteEnabled;
    if (Array.isArray(parsed.accounts) && parsed.accounts.length) {
      ftpConfig.accounts = parsed.accounts.map((item: Record<string, any>) => ({
        username: String(item.username || ""),
        password: String(item.password || ""),
        permission:
          item.permission === "readWrite" ? "readWrite" : "readOnly",
        homeDirectory: String(item.homeDirectory || ""),
      }));
    }
  } catch (error) {
    console.warn("解析FTP配置失败", error);
  }
};

// 监听服务器数据变化
watch(
  () => props.serverData,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        systemServerId: newData.systemServerId,
        systemServerName: newData.systemServerName,
        systemServerType: newData.systemServerType,
        systemServerPort: newData.systemServerPort,
        systemServerMaxConnections: newData.systemServerMaxConnections,
        systemServerTimeout: newData.systemServerTimeout,
        systemServerAutoStart: newData.systemServerAutoStart || false,
        systemServerDescription: newData.systemServerDescription || "",
        systemServerConfig: newData.systemServerConfig || "",
      });
      if (
        normalizeServerTypeValue(newData.systemServerType) === "FTP" &&
        newData.systemServerConfig
      ) {
        parseServerConfig(newData.systemServerConfig);
      } else {
        Object.assign(ftpConfig, createDefaultFtpConfig());
      }
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.serverTypes,
  () => {
    if (!isEdit.value && !formData.systemServerType) {
      formData.systemServerType = resolveDefaultServerType();
    }
  },
  { immediate: true },
);

watch(
  () => formData.systemServerType,
  (type) => {
    if (normalizeServerTypeValue(type) !== "FTP") {
      formData.systemServerConfig = "";
      return;
    }
    if (!formData.systemServerConfig) {
      formData.systemServerConfig = JSON.stringify(createDefaultFtpConfig());
    }
  },
  { immediate: true },
);

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 检查端口可用性
const checkPortAvailableHandler = async () => {
  if (!formData.systemServerPort) {
    portCheckMessage.value = "";
    return;
  }

  try {
    const response = await checkPortAvailable(
      formData.systemServerPort,
      formData.systemServerId,
    );

    if (response.success) {
      if (response.data) {
        portCheckMessage.value = "端口可用";
        portCheckClass.value = "port-available";
      } else {
        portCheckMessage.value = "端口已被占用";
        portCheckClass.value = "port-unavailable";
      }
    }
  } catch (error) {
    console.error("检查端口失败:", error);
    portCheckMessage.value = "检查端口失败";
    portCheckClass.value = "port-error";
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;
    if (isFtpType.value) {
      const accounts = ftpConfig.accounts
        .filter((item) => item.username.trim())
        .map((item) => ({
          username: item.username.trim(),
          password: item.password,
          permission: item.permission,
          homeDirectory: item.homeDirectory?.trim() || undefined,
          enabled: true,
        }));
      formData.systemServerConfig = JSON.stringify({
        homeDirectory: ftpConfig.homeDirectory?.trim() || "./ftp-home",
        enableAnonymous: ftpConfig.enableAnonymous,
        anonymousHomeDirectory:
          ftpConfig.anonymousHomeDirectory?.trim() ||
          ftpConfig.homeDirectory?.trim() ||
          "./ftp-home",
        anonymousWriteEnabled: ftpConfig.anonymousWriteEnabled,
        accounts,
      });
    } else {
      formData.systemServerConfig = "";
    }

    const apiCall = isEdit.value ? updateSystemServer : addSystemServer;
    const response = await apiCall(formData);

    if (response.success) {
      message(isEdit.value ? "更新成功" : "创建成功", { type: "success" });
      emit("success");
    } else {
      message(response.msg || "操作失败", { type: "error" });
    }
  } catch (error) {
    console.error("提交表单失败:", error);
    message("操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
// 设计令牌
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$text-placeholder: #a8abb2;
$border-color: #dcdfe6;
$border-color-light: #e4e7ed;
$border-color-lighter: #ebeef5;
$fill-color: #f5f7fa;
$fill-color-light: #fafafa;
$bg-color: #ffffff;
$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 14px;
$transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

// 对话框样式
.server-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid $border-color-lighter;
    background: $fill-color-light;
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid $border-color-lighter;
    background: $fill-color-light;
  }
}

// 对话框主体
.dialog-body {
  padding: 24px;
  background: $bg-color;
}

// 顶部横幅
.dialog-header-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 28px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: $radius-md;
  border: 1px solid rgba($primary-color, 0.1);

  .banner-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $primary-color 0%, #66b1ff 100%);
    color: #fff;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba($primary-color, 0.3);

    &.is-edit {
      background: linear-gradient(135deg, $success-color 0%, #85ce61 100%);
      box-shadow: 0 4px 12px rgba($success-color, 0.3);
    }
  }

  .banner-content {
    flex: 1;
    min-width: 0;
  }

  .banner-title {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  .banner-desc {
    margin: 0;
    font-size: 13px;
    color: $text-secondary;
  }
}

// 表单样式
.server-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: $text-primary;
    padding-bottom: 8px;
    line-height: 1;
  }

  :deep(.el-form-item__error) {
    padding-top: 4px;
    font-size: 12px;
  }
}

// 表单分区
.form-section {
  background: $bg-color;
  border-radius: $radius-md;
  border: 1px solid $border-color-lighter;
  padding: 20px;
  height: 100%;
  transition: $transition;

  &:hover {
    border-color: $border-color-light;
    box-shadow: $shadow-sm;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid $border-color-lighter;
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    font-size: 20px;
    flex-shrink: 0;

    &.primary {
      background: rgba($primary-color, 0.1);
      color: $primary-color;
    }

    &.success {
      background: rgba($success-color, 0.1);
      color: $success-color;
    }
  }

  .section-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .section-subtitle {
    font-size: 12px;
    color: $text-secondary;
  }

  .section-content {
    display: flex;
    flex-direction: column;
  }
}

// 自定义输入框
.custom-input,
.custom-select,
.custom-textarea {
  width: 100%;

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: $radius-sm;
    box-shadow: 0 0 0 1px $border-color inset;
    transition: $transition;

    &:hover {
      box-shadow: 0 0 0 1px $primary-color inset;
    }

    &:focus,
    &.is-focus {
      box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba($primary-color, 0.1);
    }
  }

  .input-icon {
    color: $text-placeholder;
    font-size: 16px;
  }
}

.custom-input-number {
  width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: $radius-sm;
    box-shadow: 0 0 0 1px $border-color inset;
    transition: $transition;

    &:hover {
      box-shadow: 0 0 0 1px $primary-color inset;
    }
  }

  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    border-radius: 0 $radius-sm $radius-sm 0;
  }
}

// 端口输入区
.port-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: $radius-sm;
  font-size: 12px;
  font-weight: 500;

  &.port-available {
    background: rgba($success-color, 0.1);
    color: $success-color;
  }

  &.port-unavailable {
    background: rgba($danger-color, 0.1);
    color: $danger-color;
  }

  &.port-error {
    background: rgba($warning-color, 0.1);
    color: $warning-color;
  }
}

// 表单辅助文字
.form-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: $text-secondary;
}

// 类型选项
.type-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;

  .type-option-label {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .type-option-desc {
    font-size: 12px;
    color: $text-secondary;
  }
}

// 开关卡片
.switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $fill-color;
  border-radius: $radius-sm;
  border: 1px solid $border-color-lighter;
  transition: $transition;

  &:hover {
    border-color: $border-color-light;
    background: $fill-color-light;
  }

  .switch-card-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .switch-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    background: rgba($primary-color, 0.1);
    color: $primary-color;
    font-size: 18px;
  }

  .switch-card-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .switch-card-title {
    font-size: 13px;
    font-weight: 500;
    color: $text-primary;
  }

  .switch-card-desc {
    font-size: 12px;
    color: $text-secondary;
  }
}

.custom-switch {
  --el-switch-on-color: #{$primary-color};
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: $radius-sm;
  font-size: 14px;
  font-weight: 500;
  transition: $transition;
}

.btn-cancel {
  background: $bg-color;
  border: 1px solid $border-color;
  color: $text-regular;

  &:hover {
    background: $fill-color;
    border-color: $border-color-light;
    color: $text-primary;
  }
}

.btn-submit {
  background: linear-gradient(135deg, $primary-color 0%, #66b1ff 100%);
  border: none;
  color: #fff;
  box-shadow: 0 4px 12px rgba($primary-color, 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba($primary-color, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .dialog-body {
    padding: 16px;
  }

  .dialog-header-banner {
    flex-direction: column;
    text-align: center;
    padding: 16px;
    margin-bottom: 20px;

    .banner-icon {
      width: 48px;
      height: 48px;
      font-size: 22px;
    }
  }

  .form-section {
    padding: 16px;
    margin-bottom: 16px;

    .section-header {
      flex-direction: column;
      text-align: center;
      gap: 10px;
    }
  }

  .switch-card {
    flex-direction: column;
    gap: 12px;
    text-align: center;

    .switch-card-content {
      flex-direction: column;
    }
  }

  .dialog-footer {
    flex-direction: column-reverse;

    .btn-cancel,
    .btn-submit {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
