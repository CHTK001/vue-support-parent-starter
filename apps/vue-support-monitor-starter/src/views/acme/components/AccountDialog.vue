<template>
  <el-dialog
    v-model="dialogVisible"
    :title="''"
    width="560px"
    :close-on-click-modal="false"
    class="account-dialog"
    :show-close="false"
    append-to-body
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-icon" :class="isEdit ? 'edit' : 'add'">
          <IconifyIconOnline :icon="isEdit ? 'mdi:account-edit' : 'mdi:account-plus'" />
        </div>
        <div class="header-info">
          <h3 class="header-title">{{ isEdit ? '编辑 ACME 账户' : '添加 ACME 账户' }}</h3>
          <p class="header-desc">{{
            isEdit
              ? '修改账户信息后将自动更新关联的证书配置'
              : 'ACME 账户用于与证书颁发机构通信'
          }}</p>
        </div>
        <button class="close-btn" @click="dialogVisible = false">
          <IconifyIconOnline icon="mdi:close" />
        </button>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="account-form"
    >
      <!-- 邮箱地址 -->
      <div class="form-section">
        <el-form-item prop="acmeAccountEmail">
          <template #label>
            <div class="form-label">
              <div class="label-icon-wrapper email">
                <IconifyIconOnline icon="mdi:email-outline" />
              </div>
              <div class="label-text">
                <span class="label-title">邮箱地址</span>
                <span class="label-hint">用于接收证书到期通知</span>
              </div>
            </div>
          </template>
          <el-input
            v-model="form.acmeAccountEmail"
            placeholder="example@domain.com"
            :disabled="isEdit"
            class="form-input"
            size="large"
          />
        </el-form-item>
      </div>

      <!-- ACME 服务器 -->
      <div class="form-section">
        <el-form-item prop="acmeAccountServer">
          <template #label>
            <div class="form-label">
              <div class="label-icon-wrapper server">
                <IconifyIconOnline icon="mdi:server-security" />
              </div>
              <div class="label-text">
                <span class="label-title">ACME 服务器</span>
                <span class="label-hint">选择证书颁发机构</span>
              </div>
            </div>
          </template>
          <el-select
            v-model="form.acmeAccountServer"
            placeholder="请选择 ACME 服务器"
            class="form-select"
            size="large"
            :popper-options="{
              modifiers: [
                { name: 'computeStyles', options: { adaptive: false } },
              ],
            }"
            popper-class="acme-server-dropdown"
          >
            <el-option-group
              v-for="group in ACME_SERVER_GROUPS"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="item in group.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="server-option">
                  <IconifyIconOnline icon="mdi:shield-check" class="option-icon" />
                  <span>{{ item.label }}</span>
                  <span class="server-badge" v-if="isEabRequired(item.value)">EAB</span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
      </div>

      <!-- EAB 凭证区域 -->
      <transition name="eab-slide">
        <div class="eab-section" v-if="showEabFields && eabConfig">
          <div class="eab-header">
            <div class="eab-badge">
              <IconifyIconOnline icon="mdi:key-chain" />
              <span>EAB 凭证配置</span>
            </div>
            <a :href="eabConfig.eabUrl" target="_blank" class="eab-link">
              <span>获取凭证</span>
              <IconifyIconOnline icon="mdi:open-in-new" />
            </a>
          </div>
          
          <div class="eab-tip">
            <IconifyIconOnline icon="mdi:lightbulb-on-outline" class="tip-icon" />
            <div class="tip-content">
              <strong>{{ eabConfig.name }}</strong>
              <span>{{ eabConfig.eabTip }}</span>
            </div>
          </div>
          
          <div class="eab-fields">
            <el-form-item prop="acmeAccountEabKid">
              <template #label>
                <div class="eab-label">
                  <IconifyIconOnline icon="mdi:identifier" />
                  <span>EAB Key ID (KID)</span>
                </div>
              </template>
              <el-input
                v-model="form.acmeAccountEabKid"
                placeholder="请输入 EAB Key ID"
                class="form-input"
                size="large"
              />
            </el-form-item>

            <el-form-item prop="acmeAccountEabHmacKey">
              <template #label>
                <div class="eab-label">
                  <IconifyIconOnline icon="mdi:shield-key" />
                  <span>EAB HMAC Key</span>
                </div>
              </template>
              <el-input
                v-model="form.acmeAccountEabHmacKey"
                placeholder="请输入 EAB HMAC Key (Base64)"
                class="form-input"
                type="password"
                show-password
                size="large"
              />
            </el-form-item>
          </div>
        </div>
      </transition>

      <!-- 备注 -->
      <div class="form-section">
        <el-form-item>
          <template #label>
            <div class="form-label">
              <div class="label-icon-wrapper remark">
                <IconifyIconOnline icon="mdi:note-text-outline" />
              </div>
              <div class="label-text">
                <span class="label-title">备注信息</span>
                <span class="label-hint">可选，用于记录账户用途</span>
              </div>
            </div>
          </template>
          <el-input
            v-model="form.acmeAccountRemark"
            type="textarea"
            :rows="3"
            placeholder="例如：生产环境主域名证书申请账户"
            class="form-textarea"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" class="cancel-btn" size="large">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
          class="submit-btn"
          size="large"
        >
          <IconifyIconOnline
            v-if="!submitting"
            :icon="isEdit ? 'mdi:content-save' : 'mdi:plus-circle'"
          />
          {{ isEdit ? '保存更改' : '创建账户' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
import {
  saveAccount,
  ACME_SERVER_GROUPS,
  ACME_SERVERS,
  isEabRequired,
  getEabConfig,
  type AcmeAccount,
} from "@/api/acme";

defineOptions({
  name: "AccountDialog",
});

const props = defineProps<{
  visible: boolean;
  account?: AcmeAccount;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const isEdit = computed(() => !!props.account?.acmeAccountId);
const showEabFields = computed(() => isEabRequired(form.acmeAccountServer));
const eabConfig = computed(() => getEabConfig(form.acmeAccountServer));

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive<AcmeAccount>({
  acmeAccountEmail: "",
  acmeAccountServer: "",
  acmeAccountEabKid: "",
  acmeAccountEabHmacKey: "",
  acmeAccountRemark: "",
});

const rules: FormRules = {
  acmeAccountEmail: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  acmeAccountServer: [
    { required: true, message: "请选择ACME服务器", trigger: "change" },
  ],
};

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await saveAccount({
      ...form,
      acmeAccountId: props.account?.acmeAccountId,
    });
    message(isEdit.value ? "保存成功" : "添加成功", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.account) {
        Object.assign(form, props.account);
      } else {
        form.acmeAccountEmail = "";
        form.acmeAccountServer = ACME_SERVERS[0].value;
        form.acmeAccountEabKid = "";
        form.acmeAccountEabHmacKey = "";
        form.acmeAccountRemark = "";
      }
      formRef.value?.clearValidate();
    }
  }
);
</script>

<style scoped lang="scss">
/* 自定义头部 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;

  .header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 24px;
    flex-shrink: 0;

    &.add {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    }

    &.edit {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
      box-shadow: 0 6px 20px rgba(17, 153, 142, 0.3);
    }
  }

  .header-info {
    flex: 1;

    .header-title {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .header-desc {
      margin: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-text-color-primary);
    }
  }
}

/* 表单样式 */
.account-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 10px;
  }
}

/* 表单分区 */
.form-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }
}

/* 表单标签 */
.form-label {
  display: flex;
  align-items: center;
  gap: 12px;

  .label-icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 18px;

    &.email {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      color: #667eea;
    }

    &.server {
      background: linear-gradient(135deg, #11998e15 0%, #38ef7d15 100%);
      color: #11998e;
    }

    &.remark {
      background: linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%);
      color: #f5576c;
    }
  }

  .label-text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .label-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .label-hint {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-weight: 400;
    }
  }
}

/* 表单输入框 */
.form-input,
.form-select {
  width: 100%;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    box-shadow: none;
    border: 2px solid transparent;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 4px 12px;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color);
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
  }
}

/* 文本域 */
.form-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    border: 2px solid transparent;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px 14px;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color);
    }

    &:focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color);
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
  }
}

/* EAB 凭证区域 */
.eab-section {
  margin: 16px 0;
  padding: 20px;
  background: linear-gradient(135deg, #fef9e7 0%, #fdf6e3 100%);
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.eab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.eab-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.eab-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  color: #d97706;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.25s ease;
  border: 1px solid rgba(245, 158, 11, 0.2);

  &:hover {
    background: #d97706;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
}

.eab-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid rgba(245, 158, 11, 0.15);

  .tip-icon {
    font-size: 20px;
    color: #f59e0b;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .tip-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    line-height: 1.5;

    strong {
      color: #b45309;
      font-weight: 600;
    }

    span {
      color: var(--el-text-color-secondary);
    }
  }
}

.eab-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.eab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
}

/* 服务器选项 */
.server-option {
  display: flex;
  align-items: center;
  gap: 10px;

  .option-icon {
    font-size: 16px;
    color: var(--el-color-success);
  }

  .server-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
}

/* 弹框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.cancel-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 500;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  min-width: 140px;
  justify-content: center;
}

/* EAB 动画 */
.eab-slide-enter-active,
.eab-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.eab-slide-enter-from,
.eab-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<!-- 全局样式 -->
<style lang="scss">
.account-dialog {
  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    padding: 0 24px;
    max-height: 60vh;
    overflow-y: auto;

    /* thin-scroller */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;

      &:hover {
        background: var(--el-border-color-darker);
      }
    }
  }

  .el-dialog__footer {
    padding: 16px 24px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.acme-server-dropdown {
  min-width: 480px !important;

  .el-select-dropdown__item {
    padding: 10px 16px;
  }

  .el-select-group__title {
    font-weight: 700;
    color: var(--el-text-color-primary);
    padding: 8px 16px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
</style>
