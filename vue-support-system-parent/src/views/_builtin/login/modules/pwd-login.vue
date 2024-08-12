<script setup lang="ts">
import { computed, reactive } from 'vue';
import {Md5} from 'ts-md5';
import { $t } from '@/locales';
import { loginModuleRecord } from '@/constants/app';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useAuthStore } from '@/store/modules/auth';
import { getCapture } from '@/service/api';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

const captureValue:Api.Common.VerifyCode = reactive({
    verifyCodeKey: '',
    verifyCodeBase64: '',
  });
async function getCaptcha(){
  const res = await getCapture();
  captureValue.verifyCodeBase64 = res.verifyCodeBase64;
  captureValue.verifyCodeKey = res.verifyCodeKey;
};

getCaptcha();


const model: Api.Auth.UserLogin = reactive({
  username: 'admin',
  password: '123456',
  verifyCode: ''
});

const rules = computed<Record<keyof Api.Auth.UserLogin, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    username: formRules.username,
    password: formRules.pwd,
    verifyCode: formRules.verifyCode
  };
});

async function handleSubmit() {
  await validate();
  const newModel: Api.Auth.UserLogin = {...model};
  newModel.password = Md5.hashStr(newModel.password);
  await authStore.login(newModel);
}

</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="username">
      <NInput v-model:value="model.username" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NFormItem path="verifyCode">
      <n-grid x-gap="12" :cols="3">
        <n-gi :span="2">
          <NInput v-model:value="model.verifyCode" :placeholder="$t('page.login.common.verifyCodePlaceholder')" />
        </n-gi>
        <n-gi :span="1">
          <img :src="captureValue.verifyCodeBase64" @click="getCaptcha" />
        </n-gi>
    </n-grid>
    </NFormItem>
    <NSpace vertical :size="24">
      <div class="flex-y-center justify-between">
        <NCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <div class="flex-y-center justify-between gap-12px">
        <NButton class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>
        <NButton class="flex-1" block @click="toggleLoginModule('register')">
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
