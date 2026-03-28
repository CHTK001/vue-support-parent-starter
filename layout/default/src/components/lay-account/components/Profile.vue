<script setup lang="ts">
import { reactive, ref } from "vue";
import { localStorageProxy, message } from "@repo/utils";
import { fetchUpdateUser } from "@repo/core";
import { userKey } from "@repo/config";
import type { FormInstance, FormRules } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { ScAvatar } from "@repo/components/ScAvatar";
import { ScForm } from "@repo/components/ScForm";
import { ScFormItem } from "@repo/components/ScFormItem";
import { ScInput } from "@repo/components/ScInput";
import { ScButton } from "@repo/components/ScButton";

defineOptions({
  name: "Profile",
});

const props = defineProps({
  showTitle: {
    type: Boolean,
    default: true,
  },
});
const isMobile = deviceDetection();
const userInfoFormRef = ref<FormInstance>();
interface Emits {
  (e: "updated:user", val: any): void;
}

const userInfos = reactive({
  sysUserAvatar: null,
  sysUserId: 0,
  avatar: null,
  sysUserNickname: "",
  sysUserEmail: "",
  sysUserPhone: "",
  description: "",
  updateRole: false,
});
const emit = defineEmits<Emits>();
const cachedUser = localStorageProxy().getItem<any>(userKey) || {};

const rules = reactive<FormRules>({});

function queryEmail(queryString, callback) {
  const emailList = [
    { value: "@qq.com" },
    { value: "@gmail.com" },
    { value: "@yahoo.com" },
    { value: "@126.com" },
    { value: "@163.com" },
  ];
  let results = [];
  let queryList = [];
  emailList.map((item) =>
    queryList.push({ value: queryString.split("@")[0] + item.value }),
  );
  results = queryString
    ? queryList.filter(
        (item) =>
          item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0,
      )
    : queryList;
  callback(results);
}

// 更新信息
const onSubmit = async (formEl: FormInstance) => {
  await formEl.validate((valid) => {
    if (valid) {
      fetchUpdateUser(userInfos).then(() => {
        message("更新信息成功", { type: "success" });
        emit("updated:user", { ...userInfos });
      });
    }
  });
};

Object.assign(userInfos, {
  sysUserAvatar: cachedUser.sysUserAvatar || cachedUser.avatar || null,
  sysUserId: cachedUser.sysUserId || 0,
  avatar: cachedUser.avatar || cachedUser.sysUserAvatar || null,
  sysUserNickname: cachedUser.sysUserNickname || "",
  sysUserEmail: cachedUser.sysUserEmail || "",
  sysUserPhone: cachedUser.sysUserPhone || "",
  description: cachedUser.description || "",
});
</script>

<template>
  <div
    :class="[
      'profile-pane',
      {
        'profile-pane--compact': !showTitle,
        'profile-pane--mobile': isMobile,
      },
    ]"
  >
    <h3 v-if="showTitle" class="profile-pane__title">{{ $t("buttons.profile") }}</h3>

    <div class="profile-hero">
      <div class="profile-hero__avatar">
        <ScAvatar :size="88" :src="userInfos.avatar" />
      </div>
      <div class="profile-hero__content">
        <div class="profile-hero__headline">{{ userInfos.sysUserNickname || "未设置昵称" }}</div>
        <div class="profile-hero__subline">
          ID #{{ userInfos.sysUserId || "--" }} · 账户资料已与当前登录信息同步
        </div>
        <div class="profile-hero__meta">
          <span class="profile-chip">{{ userInfos.sysUserEmail || "未设置邮箱" }}</span>
          <span class="profile-chip">{{ userInfos.sysUserPhone || "未设置手机号" }}</span>
        </div>
      </div>
    </div>

    <div class="profile-form-card">
      <div class="profile-form-card__header">
        <div class="profile-form-card__title">基础资料</div>
        <div class="profile-form-card__desc">
          用于展示昵称、联系方式和个人简介，修改后会同步到账户侧栏。
        </div>
      </div>

      <ScForm
        ref="userInfoFormRef"
        label-position="top"
        :rules="rules"
        :model="userInfos"
        class="profile-form"
      >
        <ScFormItem :label="$t('field.avatar')">
          <div class="profile-avatar-row">
            <ScAvatar :size="72" :src="userInfos.avatar" />
            <div class="profile-avatar-row__hint">
              头像上传入口先保持轻量模式，优先保证账户页稳定和表单体验。
            </div>
          </div>
        </ScFormItem>
        <ScFormItem :label="$t('field.nickname')" prop="sysUserNickname">
          <ScInput v-model="userInfos.sysUserNickname" placeholder="请输入昵称" />
        </ScFormItem>
        <ScFormItem :label="$t('field.email')" prop="sysUserEmail">
          <ScInput
            v-model="userInfos.sysUserEmail"
            placeholder="请输入邮箱"
            clearable
            class="w-full"
          />
        </ScFormItem>
        <ScFormItem :label="$t('field.phone')">
          <ScInput
            v-model="userInfos.sysUserPhone"
            placeholder="请输入联系电话"
            clearable
          />
        </ScFormItem>
        <ScFormItem :label="$t('field.description')">
          <ScInput
            v-model="userInfos.description"
            placeholder="请输入简介"
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 7 }"
            maxlength="56"
            show-word-limit
          />
        </ScFormItem>
        <div class="profile-form__actions">
          <ScButton type="primary" @click="onSubmit(userInfoFormRef)">
            {{ $t("buttons.updateInfo") }}
          </ScButton>
        </div>
      </ScForm>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-pane {
  width: 100%;
  max-width: 900px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-pane--compact,
.profile-pane--mobile {
  max-width: 100%;
}

.profile-pane__title {
  margin: 0 0 4px;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.08), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.06),
    0 6px 18px rgba(15, 23, 42, 0.04);
}

.profile-hero__avatar {
  flex-shrink: 0;
}

.profile-hero__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-hero__headline {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.02em;
}

.profile-hero__subline {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(var(--el-color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.12);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.profile-form-card {
  padding: 24px 26px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.06),
    0 6px 16px rgba(15, 23, 42, 0.04);
}

.profile-form-card__header {
  margin-bottom: 22px;
}

.profile-form-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.profile-form-card__desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar-row__hint {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.profile-form__actions {
  padding-top: 8px;
}

@media (max-width: 768px) {
  .profile-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .profile-form-card {
    padding: 20px;
  }

  .profile-avatar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
