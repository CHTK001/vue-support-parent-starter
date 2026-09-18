<template>
  <div class="koi-login-form" :class="formClass">
    <!-- 系统不可用（default 配置加载失败时显示） -->
    <div v-if="systemUnavailable" class="login-system-error">
      <div class="system-error-icon">
        <el-icon :size="48"><WarningFilled /></el-icon>
      </div>
      <h3 class="system-error-title">{{ $t("menu.login.systemUnavailable") }}</h3>
      <p class="system-error-desc">{{ $t("menu.login.systemUnavailableDesc") }}</p>
      <el-button type="primary" size="large" :loading="retrying" @click="retryLoadSetting">
        {{ $t("menu.login.retry") }}
      </el-button>
    </div>

    <!-- 移动端 Logo -->
    <div v-else-if="showMobileBrand" class="login-mobile-brand md:hidden">
      <div class="login-logo-wrap login-logo-wrap--mobile">
        <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <div class="font-600 text-xl">{{ translateConfigText(loginConfig.title) }}</div>
    </div>

    <div v-if="!systemUnavailable" class="form-header text-center m-b-32px">
      <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("menu.login.account") }}</h3>
      <p class="text-14px text-[--el-text-color-regular]">
        {{ $t("menu.login.form.loginName") }} / {{ $t("menu.login.form.password") }}
      </p>
    </div>

    <el-form v-if="!systemUnavailable" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
      <el-form-item prop="loginName">
        <el-input
          v-model="loginForm.loginName"
          type="text"
          :placeholder="$t('menu.login.form.loginName')"
          size="large"
          class="login-input"
        >
          <template #prefix>
            <el-icon :size="16"><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          :placeholder="$t('menu.login.form.password')"
          show-password
          size="large"
          class="login-input"
        >
          <template #prefix>
            <el-icon :size="16"><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="securityCode" v-if="loginConfig.captcha">
        <div class="login-verify-wrap flex flex-col sm:flex-row items-start sm:items-center gap-12px w-full">
          <el-input
            v-model="loginForm.securityCode"
            type="text"
            :placeholder="$t('menu.login.form.securityCode')"
            size="large"
            class="login-input w-full sm:flex-1"
            @keydown.enter="handleKoiLogin"
          >
            <template #prefix>
              <el-icon :size="16"><Postcard /></el-icon>
            </template>
          </el-input>
          <el-tooltip
            effect="light"
            placement="top"
            :show-after="300"
          >
            <template #content>
              <el-image
                v-if="loginForm.captchaPicture"
                class="login-verify-tip-img block"
                :src="loginForm.captchaPicture"
                fit="contain"
              />
              <span v-else>{{ $t("menu.login.picture") }}</span>
            </template>
            <div
              class="login-verify-img w-100px h-40px flex-shrink-0 rounded-8px overflow-hidden cursor-pointer border-1px border-solid border-[--el-border-color-lighter]"
              @click="handleCaptcha"
            >
              <el-image
                v-if="loginForm.captchaPicture"
                class="w-100px h-40px block"
                :src="loginForm.captchaPicture"
                fit="cover"
              />
              <div
                v-else
                class="login-verify-placeholder w-100px h-40px flex flex-items-center flex-justify-center bg-[--el-fill-color-light] text-[--el-color-primary]"
              >
                <el-icon class="animate-spin"><Loading /></el-icon>
              </div>
            </div>
          </el-tooltip>
        </div>
      </el-form-item>

      <!-- OTP 动态口令弹窗（TOTP） -->
      <ReOtpDialog ref="otpDialogRef" @confirm="handleOtpConfirm" />

      <!-- 滑块验证 -->
      <el-form-item v-if="loginConfig.slider">
        <ReSliderVerify ref="sliderRef" :disabled="loading" @success="sliderPassed = true" />
      </el-form-item>

      <el-form-item class="m-b-0">
        <el-button
          type="primary"
          class="login-btn w-100% tracking-4px"
          size="large"
          :loading="loading"
          v-throttle:3000="handleKoiLogin"
        >
          {{ loading ? $t("menu.login.loading") : $t("menu.login.in") }}
        </el-button>
      </el-form-item>

      <div class="flex flex-justify-center m-t-12px" v-if="loginConfig.captcha">
        <el-button text size="small" @click="handleCaptcha">
          <span class="text-13px text-[--el-text-color-secondary] hover:text-[--el-color-primary] select-none transition-colors">
            {{ $t("menu.login.picture") }}
          </span>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Postcard, WarningFilled } from "@element-plus/icons-vue";
import { ref, reactive, toRef, computed, onMounted, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { msgWarning, msgError, getCaptcha } from "@repo/core";
import { useRouter } from "vue-router";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import { HOME_URL, LOGIN_URL, getConfig } from "@repo/config";
import { initAuthRouter, resetRouter } from "@repo/pinia";
import useTabsStore from "@repo/pinia/modules/tabs";
import { resolveAssetUrl } from "@repo/assets";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";
import { translateConfigText } from "@repo/languages";
import { useI18n } from "vue-i18n";
import ReOtpDialog from "./ReOtpDialog.vue";
import ReSliderVerify from "./ReSliderVerify.vue";

defineProps<{
  /** 是否显示移动端品牌 Logo */
  showMobileBrand?: boolean;
  /** 样式主题额外 class */
  formClass?: string;
}>();

const { t } = useI18n();
// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");
// 品牌 Logo：支持 app.yaml 配置（本地资源路径或外部 URL），为空时回退内置 logo
const resolvedLogoUrl = computed(() =>
  loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : fallbackLogoUrl
);
const userStore = useUserStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const router = useRouter();
const loginFormRef = ref<FormInstance>();
const sliderRef = ref<InstanceType<typeof ReSliderVerify>>();
const otpDialogRef = ref<InstanceType<typeof ReOtpDialog>>();
const sliderPassed = ref(false);
const loading = ref(false);

interface ILoginUser {
  loginName: string;
  password: string | number;
  securityCode: string | number;
  codeKey: string | number;
  captchaPicture: any;
  otpCode: string;
}

const loginForm = reactive<ILoginUser>({
  loginName: "",
  password: "",
  securityCode: "",
  codeKey: "",
  captchaPicture: "",
  otpCode: "",
});

const loginRules: any = reactive<FormRules<ILoginUser>>({
  loginName: [
    { required: true, message: t("menu.login.rules.loginName.required"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
          callback(new Error(t("menu.login.rules.loginName.validator")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  password: [
    { required: true, message: t("menu.login.rules.password.required"), trigger: "blur" },
    { min: 6, max: 20, message: t("menu.login.rules.password.validator1"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^(?=.*\d)(?=.*[a-zA-Z]).+$/.test(value)) {
          callback(new Error(t("menu.login.rules.password.validator2")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
});

/** 获取验证码 */
const handleCaptcha = async () => {
  userStore.setToken({});
  try {
    const res = await getCaptcha();
    const data = res?.data as any;
    loginForm.codeKey = data?.verifyCodeKey ?? data?.codeKey ?? "";
    loginForm.captchaPicture = data?.verifyCodeBase64 ?? data?.captchaPicture ?? "";
  } catch (error) {
    console.log(error);
    msgError(t("msg.yzmFail"));
  }
};

// 系统是否可用：loadDefaultSetting 已静默降级（远程配置失败保留本地配置），
// 仅当加载流程本身出现非预期异常时才标记系统不可用。
const systemUnavailable = ref(false);
const retrying = ref(false);

/** 加载验证码（开启图形验证码时） */
const loadSettingAndInit = async () => {
  try {
    systemUnavailable.value = false;
    if (loginConfig.value.captcha) {
      await handleCaptcha();
    }
  } catch {
    systemUnavailable.value = true;
  }
};

/** 系统不可用时手动重试 */
const retryLoadSetting = async () => {
  retrying.value = true;
  try {
    await loadSettingAndInit();
  } finally {
    retrying.value = false;
  }
};

// 进入页面加载管理员信息
onMounted(async () => {
  await loadSettingAndInit();
  
  // 如果用户已经登录，自动跳转到 redirect 地址或首页
  if (userStore?.token) {
    const redirect = router.currentRoute.value.query.redirect as string;
    if (redirect) {
      router.replace(redirect);
    } else {
      router.replace(HOME_URL);
    }
  }
});

/** 登录 */
const handleKoiLogin = () => {
  if (!loginFormRef.value) return;
  if (loginConfig.value.slider && !sliderPassed.value) {
    msgWarning(t("menu.login.sliderRequired"));
    return;
  }
  (loginFormRef.value as any).validate(async (valid: any) => {
    if (!valid) {
      msgError(t("msg.validFail"));
      return;
    }
    // OTP 开启：弹出动态口令弹窗
    if (loginConfig.value.otp) {
      otpDialogRef.value?.open();
      return;
    }
    await submitLogin("");
  });
};

/** OTP 弹窗确认后提交登录 */
const handleOtpConfirm = async (code: string) => {
  await submitLogin(code);
};

/** 执行登录请求 */
const submitLogin = async (otpCode: string) => {
  const loginName = loginForm.loginName;
  const password = loginForm.password;
  const securityCode = loginForm.securityCode;
  const codeKey = loginForm.codeKey;
  try {
    loading.value = true;
    authStore.$reset();
    resetRouter();
    await userStore.loginByUsername({
      username: loginName,
      password: String(password),
      codeKey,
      securityCode,
      ...(otpCode ? { otpCode } : {}),
    });

    if (userStore?.token) {
      try {
        await initAuthRouter(router);
      } catch {
        return;
      }
    } else {
      msgWarning(t("msg.logIn"));
      router.replace(LOGIN_URL);
      return;
    }

    if (userStore.loginName) {
      if (userStore.loginName !== loginName) {
        tabsStore.$reset();
        userStore.setLoginName(loginName);
      }
    } else {
      tabsStore.$reset();
      userStore.setLoginName(loginName);
    }

    keepAliveStore.$reset();
    await nextTick();
    await router.replace(HOME_URL);
  } catch (error: any) {
    sliderPassed.value = false;
    sliderRef.value?.reset();
    // 显示登录失败错误提示
    const errorMsg = error?.message || error?.msg || t("msg.logInFail");
    msgError(errorMsg);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-form {
  width: 100%;
}

.login-input {
  :deep(.el-input__wrapper) {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-blank);
    box-shadow: none;
    transition: all 0.3s;

    &:hover,
    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
    }
  }
}

.login-form {
  :deep(.el-form-item.is-error .el-input__wrapper) {
    border-color: color-mix(in srgb, var(--el-color-danger) 65%, var(--el-border-color));
    box-shadow: none;

    &:hover,
    &.is-focus {
      border-color: var(--el-color-danger);
      box-shadow: none;
    }
  }
}

.login-verify-img {
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;

  &:hover {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    transform: scale(1.02);
  }
}

.login-verify-tip-img {
  width: 240px;
  height: 72px;
  border-radius: 8px;
}

.login-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.35);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;

  &--mobile {
    width: 40px;
    height: 40px;
    padding: 2px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.14);
  }
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

/* 系统不可用（default 配置加载失败） */
.login-system-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 320px;
  min-height: 320px;
  padding: 40px 24px;
  text-align: center;
}

.system-error-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: 24px;
  color: var(--el-color-warning);
  background: rgba(var(--el-color-warning-rgb), 0.1);
  border-radius: 50%;
  animation: system-error-breathe 2.4s ease-in-out infinite;
}

.system-error-icon::before {
  position: absolute;
  inset: 0;
  content: "";
  border: 1.5px solid rgba(var(--el-color-warning-rgb), 0.25);
  border-radius: 50%;
  animation: system-error-ping 2.4s ease-in-out infinite;
}

.system-error-icon .el-icon {
  position: relative;
  z-index: 1;
}

@keyframes system-error-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes system-error-ping {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70%,
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

.system-error-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--el-text-color-primary);
}

.system-error-desc {
  margin: 0 0 28px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.login-system-error :deep(.el-button) {
  min-width: 120px;
  border-radius: var(--el-border-radius-base);
  font-weight: 500;
  letter-spacing: 1px;
}
</style>

