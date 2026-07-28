<template>
  <div class="ssh-section">
    <div class="ssh-header">
      <div class="ssh-header-left">
        <div class="ssh-header-icon">
          <IconifyIconOnline icon="ri:terminal-box-line" />
        </div>
        <div class="ssh-header-text">
          <div class="ssh-header-title">SSH 专属配置</div>
          <div class="ssh-header-subtitle">认证信息与文件传输根目录</div>
        </div>
      </div>
    </div>

    <div class="ssh-grid">
      <div class="ssh-card">
        <div class="ssh-card-title">
          <IconifyIconOnline icon="ri:user-3-line" />
          <span>认证信息</span>
        </div>
        <div class="ssh-card-desc">SSH 服务用户名与密码，用于客户端登录认证</div>

        <div class="ssh-fields">
          <div class="ssh-field">
            <div class="ssh-field-label">用户名</div>
            <ScInput
              v-model="localModel.username"
              placeholder="例如：root"
              class="custom-input"
            />
          </div>
          <div class="ssh-field">
            <div class="ssh-field-label">密码</div>
            <ScInput
              v-model="localModel.password"
              placeholder="请输入密码"
              type="password"
              show-password
              class="custom-input"
            />
          </div>
        </div>
      </div>

      <div class="ssh-card">
        <div class="ssh-card-title">
          <IconifyIconOnline icon="ri:folder-3-line" />
          <span>文件传输</span>
        </div>
        <div class="ssh-card-desc">SFTP 文件系统根目录，SSH 客户端可在此目录下进行文件操作</div>

        <div class="ssh-fields">
          <div class="ssh-field ssh-field-full">
            <div class="ssh-field-label">Context Path（根目录）</div>
            <ScInput
              v-model="localModel.contextPath"
              placeholder="例如：./ssh-home 或 /home/ssh-data"
              class="custom-input"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

export interface SshConfigForm {
  username: string;
  password: string;
  contextPath: string;
}

const props = defineProps<{
  modelValue: SshConfigForm;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SshConfigForm];
}>();

const cloneConfig = (value: SshConfigForm): SshConfigForm => ({
  username: value?.username ?? "root",
  password: value?.password ?? "root123",
  contextPath: value?.contextPath ?? "./ssh-home",
});

const localModel = reactive<SshConfigForm>(cloneConfig(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(localModel, cloneConfig(value));
  },
  { deep: true },
);

watch(
  localModel,
  () => {
    emit("update:modelValue", cloneConfig(localModel));
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.ssh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 14px;
}

.ssh-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ssh-header-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
  border: 1px solid rgba(103, 194, 58, 0.18);
}

.ssh-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ssh-header-title {
  font-size: 14px;
  font-weight: 650;
  color: #303133;
}

.ssh-header-subtitle {
  font-size: 12px;
  color: #909399;
}

.ssh-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ssh-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.ssh-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.ssh-card-desc {
  margin-top: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.ssh-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ssh-field-full {
  grid-column: 1 / -1;
}

.ssh-field-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 600;
}

@media (max-width: 920px) {
  .ssh-grid {
    grid-template-columns: 1fr;
  }

  .ssh-fields {
    grid-template-columns: 1fr;
  }
}
</style>
