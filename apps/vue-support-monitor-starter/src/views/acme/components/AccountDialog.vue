<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑账户' : '添加账户'"
    width="520px"
    :close-on-click-modal="false"
    class="account-dialog"
  >
    <!-- 头部提示 -->
    <div class="dialog-tip">
      <IconifyIconOnline icon="mdi:information-outline" class="tip-icon" />
      <span>{{
        isEdit
          ? "修改账户信息后将自动更新关联的证书配置"
          : "ACME账户用于与证书颁发机构通信，请使用有效的邮箱地址"
      }}</span>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="account-form"
    >
      <el-form-item prop="acmeAccountEmail">
        <template #label>
          <div class="form-label">
            <IconifyIconOnline icon="mdi:email-outline" class="label-icon" />
            <span>邮箱地址</span>
            <span class="required-mark">*</span>
          </div>
        </template>
        <el-input
          v-model="form.acmeAccountEmail"
          placeholder="请输入用于接收证书通知的邮箱地址"
          :disabled="isEdit"
          :prefix-icon="isEdit ? undefined : undefined"
          class="form-input"
        >
          <template #prefix>
            <IconifyIconOnline icon="mdi:at" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="acmeAccountServer">
        <template #label>
          <div class="form-label">
            <IconifyIconOnline icon="mdi:server" class="label-icon" />
            <span>ACME服务器</span>
            <span class="required-mark">*</span>
          </div>
        </template>
        <el-select
          v-model="form.acmeAccountServer"
          placeholder="请选择ACME服务器"
          class="form-select"
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
                <IconifyIconOnline
                  icon="mdi:shield-check"
                  class="option-icon"
                />
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </el-form-item>

      <el-form-item>
        <template #label>
          <div class="form-label">
            <IconifyIconOnline
              icon="mdi:note-text-outline"
              class="label-icon"
            />
            <span>备注信息</span>
            <span class="optional-mark">（可选）</span>
          </div>
        </template>
        <el-input
          v-model="form.acmeAccountRemark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息，如：用途说明、负责人等"
          class="form-textarea"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" class="cancel-btn">
          <IconifyIconOnline icon="mdi:close" />
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
          class="submit-btn"
        >
          <IconifyIconOnline
            v-if="!submitting"
            :icon="isEdit ? 'mdi:content-save' : 'mdi:plus'"
          />
          {{ isEdit ? "保存修改" : "添加账户" }}
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

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive<AcmeAccount>({
  acmeAccountEmail: "",
  acmeAccountServer: "",
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
        form.acmeAccountRemark = "";
      }
      formRef.value?.clearValidate();
    }
  }
);
</script>

<style scoped lang="scss">
/* 提示信息 */
.dialog-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--el-color-primary);
  line-height: 1.5;

  .tip-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
  }
}

/* 表单样式 */
.account-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 8px;
  }
}

/* 表单标签 */
.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;

  .label-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }

  .required-mark {
    color: var(--el-color-danger);
    margin-left: 2px;
  }

  .optional-mark {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-weight: 400;
  }
}

/* 输入框图标 */
.input-icon {
  font-size: 16px;
  color: var(--el-text-color-placeholder);
}

/* 表单输入框 */
.form-input,
.form-select {
  width: 100%;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
    background: var(--el-fill-color-light);
    box-shadow: none;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color);
    }
  }
}

/* 文本域 */
.form-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    background: var(--el-fill-color-light);
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color);
    }

    &:focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color);
    }
  }
}

/* 服务器选项 */
.server-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .option-icon {
    font-size: 16px;
    color: var(--el-color-success);
  }
}

/* 弹框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 10px 20px;
}

.submit-btn {
  min-width: 120px;
}
</style>

<!-- 全局样式：下拉菜单宽度 -->
<style lang="scss">
.acme-server-dropdown {
  min-width: 480px !important;

  .el-select-dropdown__item {
    padding: 8px 16px;
  }

  .el-select-group__title {
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding-left: 16px;
  }
}
</style>
