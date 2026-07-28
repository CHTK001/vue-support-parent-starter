<template>
  <div class="ftp-section">
    <div class="ftp-header">
      <div class="ftp-header-left">
        <div class="ftp-header-icon">
          <IconifyIconOnline icon="ri:folder-transfer-line" />
        </div>
        <div class="ftp-header-text">
          <div class="ftp-header-title">FTP 专属配置</div>
          <div class="ftp-header-subtitle">目录、匿名访问、账号权限与目录隔离</div>
        </div>
      </div>
    </div>

    <div class="ftp-grid">
      <div class="ftp-card">
      <div class="ftp-card-title">
          <IconifyIconOnline icon="ri:folder-3-line" />
        <span>主目录</span>
        </div>
      <div class="ftp-card-desc">FTP 服务主目录（作为所有账号的默认 homeDirectory；账号目录留空则继承）</div>
        <ScInput
          v-model="localModel.homeDirectory"
          placeholder="例如：D:/data/ftp-root"
          class="custom-input"
        />
      </div>

      <div class="ftp-card ftp-card-switch">
        <div class="ftp-card-switch-row">
          <div class="ftp-card-title">
            <IconifyIconOnline icon="ri:user-shared-line" />
            <span>匿名访问</span>
          </div>
          <ScSwitch
            v-model="localModel.enableAnonymous"
            inline-prompt
            active-text="开"
            inactive-text="关"
            class="custom-switch"
          />
        </div>
        <div class="ftp-card-desc">允许 anonymous 登录，可配置匿名目录与写权限</div>

        <div v-if="localModel.enableAnonymous" class="ftp-subgrid">
          <div class="ftp-subcard">
            <div class="ftp-subcard-label">匿名目录</div>
            <ScInput
              v-model="localModel.anonymousHomeDirectory"
              placeholder="例如：D:/data/ftp-anon"
              class="custom-input"
            />
          </div>
          <div class="ftp-subcard ftp-subcard-switch">
            <div class="ftp-subcard-label">匿名写权限</div>
            <ScSwitch
              v-model="localModel.anonymousWriteEnabled"
              inline-prompt
              active-text="可写"
              inactive-text="只读"
              class="custom-switch"
            />
          </div>
        </div>
      </div>

      <div class="ftp-card ftp-card-full">
        <div class="ftp-card-title">
          <IconifyIconOnline icon="ri:shield-user-line" />
          <span>账号列表</span>
        </div>
        <div class="ftp-card-desc">
          每个账号可配置权限（只读/读写）与独立目录。建议至少配置一个账号或开启匿名访问。
        </div>

        <div class="ftp-accounts">
          <div
            v-for="(account, index) in localModel.accounts"
            :key="index"
            class="ftp-account-card"
          >
            <div class="ftp-account-head">
              <div class="ftp-account-title">
                <span class="ftp-account-badge">账号 {{ index + 1 }}</span>
              </div>
              <ScButton text type="danger" @click="removeFtpAccount(index)">
                删除
              </ScButton>
            </div>

            <div class="ftp-fields">
              <div class="ftp-field">
                <div class="ftp-field-label">用户名</div>
                <ScInput
                  v-model="account.username"
                  placeholder="例如：admin"
                  class="custom-input"
                />
              </div>
              <div class="ftp-field">
                <div class="ftp-field-label">密码</div>
                <ScInput
                  v-model="account.password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                  class="custom-input"
                />
              </div>
              <div class="ftp-field">
                <div class="ftp-field-label">权限</div>
                <ScSelect v-model="account.permission" class="custom-select">
                  <ScOption label="只读" value="readOnly" />
                  <ScOption label="读写" value="readWrite" />
                </ScSelect>
              </div>
              <div class="ftp-field">
                <div class="ftp-field-label">账号目录</div>
                <ScInput
                  v-model="account.homeDirectory"
                  placeholder="留空继承默认目录"
                  class="custom-input"
                />
              </div>
            </div>
          </div>

          <div class="ftp-add-row">
            <ScButton plain class="ftp-add-btn" @click="addFtpAccount">
              <IconifyIconOnline icon="ri:add-line" />
              添加账号
            </ScButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { ScOption } from "@repo/components/ScOption";

export interface FtpAccountForm {
  username: string;
  password: string;
  permission: "readOnly" | "readWrite";
  homeDirectory: string;
}

export interface FtpConfigForm {
  homeDirectory: string;
  enableAnonymous: boolean;
  anonymousHomeDirectory: string;
  anonymousWriteEnabled: boolean;
  accounts: FtpAccountForm[];
}

const props = defineProps<{
  modelValue: FtpConfigForm;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: FtpConfigForm];
}>();

const cloneConfig = (value: FtpConfigForm): FtpConfigForm => ({
  homeDirectory: value?.homeDirectory ?? "",
  enableAnonymous: !!value?.enableAnonymous,
  anonymousHomeDirectory: value?.anonymousHomeDirectory ?? "",
  anonymousWriteEnabled: !!value?.anonymousWriteEnabled,
  accounts: Array.isArray(value?.accounts)
    ? value.accounts.map((item) => ({
        username: item?.username ?? "",
        password: item?.password ?? "",
        permission: item?.permission === "readWrite" ? "readWrite" : "readOnly",
        homeDirectory: item?.homeDirectory ?? "",
      }))
    : [],
});

const localModel = reactive<FtpConfigForm>(cloneConfig(props.modelValue));

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

const addFtpAccount = () => {
  localModel.accounts.push({
    username: "",
    password: "",
    permission: "readOnly",
    homeDirectory: "",
  });
};

const removeFtpAccount = (index: number) => {
  localModel.accounts.splice(index, 1);
};
</script>

<style lang="scss" scoped>
.ftp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 14px;
}

.ftp-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ftp-header-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #409eff;
  background: rgba(64, 158, 255, 0.12);
  border: 1px solid rgba(64, 158, 255, 0.18);
}

.ftp-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ftp-header-title {
  font-size: 14px;
  font-weight: 650;
  color: #303133;
}

.ftp-header-subtitle {
  font-size: 12px;
  color: #909399;
}

.ftp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ftp-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.ftp-card-full {
  grid-column: 1 / -1;
}

.ftp-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.ftp-card-desc {
  margin-top: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.ftp-card-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ftp-subgrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 10px;
}

.ftp-subcard {
  border: 1px dashed #dcdfe6;
  background: #fafcff;
  border-radius: 10px;
  padding: 10px;
}

.ftp-subcard-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 600;
}

.ftp-subcard-switch {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ftp-accounts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ftp-account-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
}

.ftp-account-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.ftp-account-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.18);
}

.ftp-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ftp-field-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 600;
}

.ftp-add-row {
  display: flex;
  justify-content: flex-start;
}

.ftp-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 920px) {
  .ftp-grid {
    grid-template-columns: 1fr;
  }

  .ftp-subgrid {
    grid-template-columns: 1fr;
  }

  .ftp-fields {
    grid-template-columns: 1fr;
  }
}
</style>
