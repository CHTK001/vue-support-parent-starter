<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { des } from "@repo/config";
import { fetchUpdateUser } from "@repo/core";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { ScDivider } from "@repo/components/ScDivider";

defineOptions({
  name: "AccountManagement",
});

const { t } = useI18n();

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits<{
  (e: "updated:user", val: Record<string, any>): void;
}>();

const visible = reactive({
  phone: false,
  email: false,
});

const saving = reactive({
  phone: false,
  email: false,
});

const phoneFormRef = ref<FormInstance>();
const emailFormRef = ref<FormInstance>();

const editForm = reactive({
  phone: "",
  email: "",
});

const maskedPhone = computed(() => {
  const value = String(props.userInfo?.sysUserPhone || "");
  return value
    ? `${t("message.bindPhone")}：${des(value)}`
    : t("message.unbindPhone");
});

const maskedEmail = computed(() => {
  const value = String(props.userInfo?.sysUserEmail || "");
  return value
    ? `${t("message.bindEmail")}：${des(value)}`
    : t("message.unbindEmail");
});

const items = computed(() => [
  {
    key: "phone",
    title: "保密手机",
    illustrate: maskedPhone.value,
    button: t("buttons.update"),
  },
  {
    key: "email",
    title: "备用邮箱",
    illustrate: maskedEmail.value,
    button: t("buttons.update"),
  },
]);

const phoneRules: FormRules = {
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
};

const emailRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
};

const openEditor = (type: "phone" | "email") => {
  if (type === "phone") {
    editForm.phone = String(props.userInfo?.sysUserPhone || "");
  } else {
    editForm.email = String(props.userInfo?.sysUserEmail || "");
  }
  visible[type] = true;
};

const buildUpdatePayload = (type: "phone" | "email") => {
  return {
    sysUserId: props.userInfo?.sysUserId,
    sysUserNickname: props.userInfo?.sysUserNickname || "",
    sysUserEmail:
      type === "email"
        ? editForm.email
        : String(props.userInfo?.sysUserEmail || ""),
    sysUserPhone:
      type === "phone"
        ? editForm.phone
        : String(props.userInfo?.sysUserPhone || ""),
    description: props.userInfo?.description || "",
    updateRole: false,
  };
};

const submitEditor = async (type: "phone" | "email") => {
  const formRef = type === "phone" ? phoneFormRef.value : emailFormRef.value;
  if (!formRef) return;

  const valid = await formRef.validate().catch(() => false);
  if (!valid) return;

  saving[type] = true;
  try {
    await fetchUpdateUser(buildUpdatePayload(type));
    const nextUser = {
      ...props.userInfo,
      sysUserPhone:
        type === "phone"
          ? editForm.phone
          : String(props.userInfo?.sysUserPhone || ""),
      sysUserEmail:
        type === "email"
          ? editForm.email
          : String(props.userInfo?.sysUserEmail || ""),
    };

    emit("updated:user", nextUser);
    visible[type] = false;
    message.success(type === "phone" ? "手机号更新成功" : "邮箱更新成功");
  } finally {
    saving[type] = false;
  }
};
</script>

<template>
  <div
    :class="[
      'account-management',
      deviceDetection()
        ? 'account-management--mobile'
        : 'account-management--desktop',
    ]"
  >
    <ScDialog
      v-model="visible.phone"
      width="520px"
      title="更新保密手机"
      destroy-on-close
    >
      <ScForm
        ref="phoneFormRef"
        :model="editForm"
        :rules="phoneRules"
        label-width="96px"
        class="account-management__dialog-form"
      >
        <ScFormItem label="保密手机" prop="phone">
          <ScInput
            v-model="editForm.phone"
            placeholder="请输入新的保密手机号"
            clearable
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="visible.phone = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="saving.phone"
          @click="submitEditor('phone')"
        >
          保存
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="visible.email"
      width="520px"
      title="更新备用邮箱"
      destroy-on-close
    >
      <ScForm
        ref="emailFormRef"
        :model="editForm"
        :rules="emailRules"
        label-width="96px"
        class="account-management__dialog-form"
      >
        <ScFormItem label="备用邮箱" prop="email">
          <ScInput
            v-model="editForm.email"
            placeholder="请输入新的备用邮箱"
            clearable
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="visible.email = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="saving.email"
          @click="submitEditor('email')"
        >
          保存
        </ScButton>
      </template>
    </ScDialog>

    <h3 class="account-management__title">
      {{ $t("buttons.AccountManagement") }}
    </h3>

    <div v-for="item in items" :key="item.key" class="account-management__item">
      <div class="account-management__info">
        <p class="account-management__item-title">{{ item.title }}</p>
        <el-text class="account-management__item-copy" type="info">
          {{ item.illustrate }}
        </el-text>
      </div>
      <ScButton
        type="primary"
        text
        @click="openEditor(item.key as 'phone' | 'email')"
      >
        {{ item.button }}
      </ScButton>
      <ScDivider />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.account-management {
  min-width: 180px;
}

.account-management--desktop {
  max-width: 70%;
}

.account-management--mobile {
  max-width: 100%;
}

.account-management__title {
  margin: 2rem 0;
}

.account-management__item {
  display: block;
}

.account-management__info {
  flex: 1;
  min-width: 0;
}

.account-management__item-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-management__item-copy {
  line-height: 1.7;
  white-space: normal;
}

.account-management__dialog-form {
  padding-top: 6px;
}

:deep(.account-management__dialog-form .el-form-item__label) {
  justify-content: flex-end;
}

:deep(.account-management__dialog-form .el-form-item__content) {
  min-width: 0;
}

.account-management__item :deep(.el-divider--horizontal) {
  margin: 14px 0;
  border-top: 0.1px var(--el-border-color) var(--el-border-style);
}

.account-management__item {
  .el-button {
    margin-left: auto;
  }
}

.account-management__item > .account-management__info,
.account-management__item > .el-button {
  display: inline-flex;
  vertical-align: middle;
}

.account-management__item > .account-management__info {
  width: calc(100% - 88px);
  flex-direction: column;
}
</style>
