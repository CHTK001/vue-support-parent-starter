<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive } from 'vue';
import { useMessage } from 'naive-ui';
import { $t } from '@/locales';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useAuthStore } from '@/store/modules/auth';
import { md5 } from '@/utils/crypto';
import { fetchDefaultSetting, fetchVerifyCode } from '@/service/api';

defineOptions({
  name: 'PwdLogin'
});

async function doLogin(e: KeyboardEvent) {
  if (e.keyCode !== 13) {
    return;
  }

  handleSubmit();
}
onMounted(() => {
  window.addEventListener('keyup', doLogin);
});

onUnmounted(() => {
  window.removeEventListener('keyup', doLogin);
});

const message = useMessage();
const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();

const verifyCode: Api.Common.VerifyCode = reactive({
  verifyCodeKey: '',
  verifyCodeBase64: '',
  verifyCodeUlid: ''
});

interface GuessSetting {
  openVerifyCode: boolean;
}

const defaultSetting: GuessSetting = reactive({
  openVerifyCode: false
});
async function getDefaultSetting() {
  const { data: res, error } = await fetchDefaultSetting();
  if (!error) {
    res.forEach(item => {
      if (item.sysSettingName === 'openVerifyCode') {
        defaultSetting.openVerifyCode = item.sysSettingValue === 'true';
      }
    });
  }
}

getDefaultSetting();

async function getVerifyCode() {
  const { data: res, error } = await fetchVerifyCode();
  if (!error) {
    await registerVerifyCode(res);
  }
}
const model: Api.Auth.LoginData = reactive({
  username: 'sa',
  password: 'admin@123#'
});

async function registerVerifyCode(res: Api.Common.VerifyCode) {
  verifyCode.verifyCodeKey = res.verifyCodeKey;
  verifyCode.verifyCodeBase64 = res.verifyCodeBase64;
  verifyCode.verifyCodeUlid = res.verifyCodeUlid;
  model.verifyCodeUlid = res.verifyCodeUlid;
}

getVerifyCode();

const rules = computed<Record<keyof Api.Auth.LoginData, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    username: formRules.username,
    password: formRules.pwd,
    verifyCodeKey: [],
    verifyCodeUlid: [],
    loginType: []
  };
});

async function handleSubmit() {
  await validate();
  if (!defaultSetting.openVerifyCode) {
    if (!model.verifyCodeKey) {
      message.warning($t('page.login.common.verifyCodeKeyEmptyPlaceholder'));
      return;
    }

    if (model.verifyCodeKey !== verifyCode.verifyCodeKey) {
      message.warning($t('page.login.common.verifyCodeKeyErrorPlaceholder'));
      model.verifyCodeKey = '';
      getVerifyCode();
      return;
    }
  }
  const newModel: Api.Auth.LoginData = { ...model };
  newModel.password = md5(model.password);
  newModel.loginType = 'SYSTEM';
  const error = await authStore.login(newModel);
  if (error) {
    message.warning(String(error));
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="username">
      <NInput v-model:value="model.username" size="medium" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput v-model:value="model.password" size="medium" type="password" show-password-on="click" :placeholder="$t('page.login.common.passwordPlaceholder')" />
    </NFormItem>
    <NFormItem v-if="defaultSetting.openVerifyCode">
      <NGrid x-gap="12" :cols="3">
        <NGi :span="2">
          <NInput v-model:value="model.verifyCodeKey" size="medium" :placeholder="$t('page.login.common.verifyCodeKeyPlaceholder')" />
        </NGi>
        <NGi :span="1">
          <img :src="verifyCode.verifyCodeBase64" @click="getVerifyCode" />
        </NGi>
      </NGrid>
    </NFormItem>
    <NSpace vertical :size="24">
      <NButton type="primary" size="large" block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
