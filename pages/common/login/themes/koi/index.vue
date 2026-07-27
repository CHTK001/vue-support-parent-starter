<template>
  <div class="login-page w-screen h-screen overflow-hidden">
    <el-row class="h-100%">
      <div class="flex flex-items-center pos-absolute top-8px right-8px z-10 h-40px p-y-2px p-x-12px bg-#F4F4F5 dark:bg-#141414 border-1px border-solid border-#E4E7ED dark:border-#4C4D4F rounded-20px shadow-[0_4px_12px_rgb(0_0_0_/_15%)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all transition-300ms transition-ease">
        <div
          v-if="showEnvBadge"
          class="env-badge mr-8px"
          :class="envBadgeClass"
        >
          {{ envBadgeText }}
        </div>
        <div
          v-if="enableThemeSwitcher"
          class="mr-8px"
        >
          <ThemeSwitcher />
        </div>
        <div class="theme-switch-container mr-8px">
          <div class="theme-mode-toggle">
            <button
              class="theme-mode-button"
              :class="{ active: !isDarkTheme }"
              @click="setLoginThemeMode('light')"
            >
              <span class="theme-mode-icon">☀</span>
              <span>{{ themeModeText.light }}</span>
            </button>
            <button
              class="theme-mode-button"
              :class="{ active: isDarkTheme }"
              @click="setLoginThemeMode('dark')"
            >
              <span class="theme-mode-icon">☾</span>
              <span>{{ themeModeText.dark }}</span>
            </button>
          </div>
        </div>
        <el-dropdown trigger="click" popper-class="lang-dropdown-popper">
          <div class="lang-trigger">
            <div class="lang-icon-wrapper">
              <span class="lang-main-icon">{{ currentLanguageConfig.icon }}</span>
            </div>
            <div class="lang-info">
              <span class="lang-name">{{ currentLanguageConfig.name }}</span>
            </div>
            <div class="dropdown-arrow-wrapper">
              <span class="dropdown-arrow">▼</span>
            </div>
          </div>
          <template #dropdown>
            <div class="lang-menu">
              <div class="lang-header">
                <span>🌐</span>
                <span>{{ isZhCnLocale ? '选择语言' : 'Select Language' }}</span>
              </div>
              <div
                v-for="(lang, key) in languageConfigs"
                :key="key"
                class="lang-item"
                :class="{ active: key === currentLocale }"
                @click="switchLanguage(key)"
              >
                <div class="lang-item-content">
                  <span class="lang-flag">{{ lang.icon }}</span>
                  <div class="lang-item-info">
                    <span class="lang-item-name">{{ lang.name }}</span>
                    <span class="lang-item-desc">{{ lang.description }}</span>
                  </div>
                </div>
                <span v-if="key === currentLocale" class="lang-check">✓</span>
              </div>
            </div>
          </template>
        </el-dropdown>
      </div>

      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex flex-items-center flex-justify-center">
        <div class="login-background w-100% h-100%">
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>
          <div class="glass-overlay"></div>
          <div class="pos-absolute text-center select-none transition-all transition-ease transition-500 content-layer">
            <div class="brand-badge flex flex-items-center flex-justify-center gap-10px m-b-32px <md:hidden">
              <div class="login-logo-wrap login-logo-wrap--brand">
                <img class="login-logo" :src="koiLogo" alt="System" />
              </div>
              <span class="brand-text text-18px font-700">{{ defaultSetting.SystemName || 'vue-support' }}</span>
            </div>
            <el-image
              class="w-260px max-w-500px h-260px m-b-40px animate-float-picture <md:hidden <lg:h-320px <lg:max-w-400px"
              :src="science"
            />
            <div class="welcome-title text-2xl font-700 m-b-12px text-center <lg:text-xl <md:hidden">
              {{ $t("login.pureWelcome") }}
            </div>
            <div class="welcome-subtitle text-28px font-800 m-b-16px text-center <lg:text-22px <md:hidden">
              {{ defaultSetting.SystemName || 'vue-support' }}
            </div>
            <div class="welcome-desc text-16px font-400 text-center max-w-420px mx-auto leading-relaxed <md:hidden">
              {{ $t("login.pureHello") }}
            </div>
            <div class="feature-tags flex flex-justify-center gap-12px m-t-32px flex-wrap <md:hidden">
              <span class="feature-tag">
                <span class="feature-tag-icon">⚡</span>
                高效管理
              </span>
              <span class="feature-tag">
                <span class="feature-tag-icon">🎨</span>
                现代设计
              </span>
              <span class="feature-tag">
                <span class="feature-tag-icon">🔒</span>
                安全可靠
              </span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col
        :lg="8"
        :md="12"
        :sm="9"
        :xs="24"
        class="login-form-side flex flex-items-center flex-justify-center flex-col"
      >
        <div class="login-form-panel w-100% flex flex-col flex-items-center">
          <div class="login-mobile-brand md:hidden">
            <div class="login-logo-wrap login-logo-wrap--mobile">
              <img class="login-logo" :src="koiLogo" alt="System" />
            </div>
            <div class="font-600 text-xl">{{ defaultSetting.SystemName || 'vue-support' }}</div>
          </div>

          <div class="form-header text-center m-b-32px">
            <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("login.pureLoginTitle") }}</h3>
            <p class="text-14px text-[--el-text-color-regular]">
              {{ $t("login.pureUsername") }} / {{ $t("login.purePassword") }}
            </p>
          </div>

          <div
            v-if="openSwitchLoginType"
            class="login-type-selector m-b-20px w-100% max-w-300px"
          >
            <div class="selector-options">
              <div
                class="option-card"
                :class="{ active: loginType === 1 }"
                @click="handleChangeLoginType(1)"
              >
                <div class="option-icon-wrapper">
                  <span class="option-icon">👤</span>
                </div>
                <div class="option-content">
                  <div class="option-title">基础登录</div>
                  <div class="option-desc">普通用户登录</div>
                </div>
              </div>
              <div
                class="option-card"
                :class="{ active: loginType === 2 }"
                @click="handleChangeLoginType(2)"
              >
                <div class="option-icon-wrapper">
                  <span class="option-icon">🏢</span>
                </div>
                <div class="option-content">
                  <div class="option-title">租户登录</div>
                  <div class="option-desc">多租户登录</div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="showStaticLoginEntry"
            class="static-login-entry w-100% max-w-300px m-b-18px"
          >
            <div class="static-login-entry__header">
              <span class="static-login-entry__title">🔧 {{ staticLoginDisplayName }}</span>
              <span class="static-login-entry__tip">开发/测试环境</span>
            </div>
            <button
              class="static-login-entry__button"
              :disabled="loading"
              @click="handleStaticLogin"
            >
              <span v-if="!loading">一键登录</span>
              <span v-else>登录中...</span>
            </button>
          </div>

          <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" class="login-form w-300px">
            <el-form-item
              v-if="defaultSetting.OpenTenantLogin && loginType === 2"
              prop="tenantCode"
            >
              <el-input
                v-model="ruleForm.tenantCode"
                :disabled="loading"
                :placeholder="$t('login.pureTenantCode')"
                size="large"
                class="login-input"
              >
                <template #prefix>
                  <span class="input-prefix-icon">🏢</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="username">
              <el-input
                v-model="ruleForm.username"
                type="text"
                :placeholder="$t('login.pureUsername')"
                size="large"
                class="login-input"
                :disabled="loading"
              >
                <template #prefix>
                  <span class="input-prefix-icon">👤</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="ruleForm.password"
                type="password"
                :placeholder="$t('login.purePassword')"
                show-password
                size="large"
                class="login-input"
                :disabled="loading"
                @keydown.enter="handleLoginClick"
              >
                <template #prefix>
                  <span class="input-prefix-icon">🔒</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="defaultSetting.OpenVerifyCode" prop="verifyCode">
              <div class="login-verify-wrap flex flex-col sm:flex-row items-start sm:items-center gap-12px w-full">
                <el-input
                  v-model="ruleForm.verifyCode"
                  type="text"
                  :placeholder="$t('login.verifyCode')"
                  size="large"
                  class="login-input w-full sm:flex-1"
                  :disabled="loading"
                  @keydown.enter="handleLoginClick"
                >
                  <template #prefix>
                    <span class="input-prefix-icon">📧</span>
                  </template>
                </el-input>
                <div
                  class="login-verify-img w-100px h-40px flex-shrink-0 rounded-8px overflow-hidden cursor-pointer border-1px border-solid border-[--el-border-color-lighter]"
                  :class="{ disabled: loading }"
                  @click="!loading && getVerifyCode()"
                >
                  <el-image
                    v-if="defaultVerifyCode.verifyCodeBase64"
                    class="w-100px h-40px block"
                    :src="defaultVerifyCode.verifyCodeBase64"
                    fit="cover"
                  />
                  <div
                    v-else
                    class="login-verify-placeholder w-100px h-40px flex flex-items-center flex-justify-center bg-[--el-fill-color-light] text-[--el-color-primary]"
                  >
                    <span class="animate-spin">⟳</span>
                  </div>
                </div>
              </div>
            </el-form-item>

            <el-form-item class="m-b-0">
              <el-button
                v-if="defaultSetting.OpenVcode"
                type="primary"
                class="login-btn w-100% tracking-4px"
                size="large"
                :loading="loading"
                :disabled="loading"
                @click="handleLoginCodeClick"
              >
                {{ loading ? $t("login.pureLoginLoading") : $t("login.pureLogin") }}
              </el-button>
              <el-button
                v-else-if="defaultSetting.CheckTotpOpen"
                type="primary"
                class="login-btn w-100% tracking-4px"
                size="large"
                :loading="loading"
                :disabled="loading"
                @click="handleLoginToptCodeClick"
              >
                {{ loading ? $t("login.pureLoginLoading") : $t("login.pureLogin") }}
              </el-button>
              <el-button
                v-else
                type="primary"
                class="login-btn w-100% tracking-4px"
                size="large"
                :loading="loading"
                :disabled="loading"
                @click="handleLoginClick"
              >
                {{ loading ? $t("login.pureLoginLoading") : $t("login.pureLogin") }}
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="isShowThirdPartyValue" class="m-t-24px w-100% max-w-300px">
            <div class="divider">
              <span class="divider-text">或</span>
            </div>
            <div class="third-party-container">
              <div
                v-if="ssoSetting.Gitee"
                class="third-party-item gitee"
                @click="handleThirdLogin('gitee')"
                title="Gitee 登录"
              >
                <span>G</span>
              </div>
              <div
                v-if="ssoSetting.Github"
                class="third-party-item github"
                @click="handleThirdLogin('github')"
                title="GitHub 登录"
              >
                <span>G</span>
              </div>
              <div
                v-if="ssoSetting.Wechat"
                class="third-party-item wechat"
                @click="handleThirdLogin('wechat')"
                title="微信登录"
              >
                <span>W</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <sc-dialog
      v-model="openVcode"
      width="480px"
      draggable
      title="滑动验证"
      class="modern-dialog vcode-dialog"
      append-to-body
      @close="vcodeClose"
    >
      <div v-if="defaultSetting.OpenVcode" class="vcode-container">
        <div class="vcode-wrapper">
          <div class="vcode-component-wrapper">
            <VcodeAsync
              ref="vcodeRef"
              :show="defaultSetting.OpenVcode"
              type="inside"
              :puzzleScale="0.8"
              @fail="onVcodeFail"
              @success="onVcodeSuccess"
            />
          </div>
        </div>
      </div>
    </sc-dialog>

    <sc-dialog
      v-model="openToptcode"
      width="480px"
      :close-on-click-modal="false"
      draggable
      title="动态验证码验证"
      class="modern-dialog totp-dialog"
      append-to-body
      @close="vcodeToptClose"
    >
      <div class="totp-container">
        <div class="totp-wrapper">
          <ScCodeAsync
            ref="scCodeRef"
            :disabled="loading"
            @onComplete="handleTotpComplete"
            @onChange="handleTotpChange"
          />
        </div>
      </div>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { useDataThemeChange } from "@layout/default/hooks/useDataThemeChange";
import { useTranslationLang } from "@layout/default/hooks/useTranslationLang";
import { fetchDefaultSetting } from "@pages/setting";
import {
  FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
  getFrontendSystemConfig,
  getInitialConfig,
  isLoginThemeSwitcherVisible,
} from "@repo/config";
import { getConfig, setConfig } from "@repo/config/src/config";
import {
  getAllLanguageConfigs,
  getLanguageConfig,
} from "@repo/config/src/i18n";
import { fetchVerifyCode, initRouter } from "@repo/core";
import { useUserStoreHook } from "@repo/core/src/store/modules/UserStore";
import { message } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { Md5 } from "ts-md5";
import { fetchThirdLoginCode } from "@repo/core";
import { uuid } from "@repo/config";
import ThemeSwitcher from "../../components/ThemeSwitcher.vue";
import { getThemeConfig } from "../../utils/themeConfig";
import science from "@repo/assets/images/science.png";
import koiLogo from "@repo/assets/images/koi-logo.webp";

defineOptions({
  name: "KoiLogin",
});

const VcodeAsync = defineAsyncComponent(() =>
  import("vue3-puzzle-vcode").then((module) => module.default ?? module),
);

const ScCodeAsync = defineAsyncComponent(
  () => import("@repo/components/ScCode"),
);

const MD5_HEX_PATTERN = /^[a-f0-9]{32}$/i;
const encodeLoginPassword = (password: string) => {
  const normalizedPassword = String(password || "").trim();
  if (!normalizedPassword) {
    return normalizedPassword;
  }
  if (MD5_HEX_PATTERN.test(normalizedPassword)) {
    return normalizedPassword.toLowerCase();
  }
  return String(Md5.hashStr(normalizedPassword));
};

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStoreHook();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { locale, translation } = useTranslationLang();

const languageConfigs = getAllLanguageConfigs();
const currentLanguageConfig = computed(() => {
  const currentLocale =
    typeof locale.value === "string" ? locale.value : locale.value.value;
  return getLanguageConfig(currentLocale);
});

const currentLocale = computed(() => {
  return typeof locale.value === "string" ? locale.value : locale.value.value;
});

const isZhCnLocale = computed(() => {
  return currentLocale.value === "zh-CN";
});

const isDarkTheme = computed(
  () => overallStyle.value === "dark" || dataTheme.value,
);

const themeModeText = computed(() => ({
  light: isZhCnLocale.value ? "浅色" : "Light",
  dark: isZhCnLocale.value ? "深色" : "Dark",
}));

const setLoginThemeMode = (mode: "light" | "dark") => {
  const nextIsDark = mode === "dark";
  if (dataTheme.value === nextIsDark && overallStyle.value === mode) {
    return;
  }
  dataTheme.value = nextIsDark;
  dataThemeChange(mode);
};

const switchLanguage = (key: string) => {
  translation(key);
};

const storedConfig = getThemeConfig();
const enableThemeManagement = storedConfig.EnableThemeManagement;
const enableThemeSwitcher = computed(() => {
  const frontendState = getFrontendSystemConfig(getInitialConfig());
  return isLoginThemeSwitcherVisible(frontendState);
});

const frontendSystemState = ref(getFrontendSystemConfig(getInitialConfig()));

const loginType = ref(1);
const loading = ref(false);
const ruleFormRef = ref();

const defaultSetting = reactive({
  OpenVerifyCode: false,
  OpenVcode: false,
  CheckTotpOpen: false,
  OpenThirdPartyLogin: false,
  OpenTenantLogin: false,
  OpenBaseLogin: false,
  SystemName: "",
});

const ssoSetting = reactive({
  Gitee: false,
  Github: false,
  Wechat: false,
});

const defaultVerifyCode = ref({
  verifyCodeKey: "",
  verifyCodeBase64: "",
  verifyCodeUlid: "",
});

const getVerifyCode = async () => {
  const { data } = await fetchVerifyCode();
  Object.assign(defaultVerifyCode.value, data);
};

const loadDefaultSetting = async () => {
  try {
    const { data } = await fetchDefaultSetting();
    if (!data || !Array.isArray(data)) {
      return;
    }
    data.forEach((element) => {
      if (!element) {
        return;
      }
      if (element.sysSettingGroup == "default") {
        if (element.sysSettingName === "SystemName") {
          defaultSetting.SystemName = element.sysSettingValue;
          setConfig("Title", defaultSetting.SystemName);
          return;
        }
        if (element.sysSettingName === "CheckCodeOpen") {
          defaultSetting.OpenVerifyCode = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "CheckTotpCodeOpen") {
          defaultSetting.CheckTotpOpen = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "SlidingBlockOpen") {
          defaultSetting.OpenVcode = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "OpenThirdPartyLogin") {
          const _val = element.sysSettingValue === "true";
          defaultSetting.OpenThirdPartyLogin = _val;
          return;
        }
      } else if (element.sysSettingGroup === "sso") {
        const _val = element.sysSettingValue === "true";
        (ssoSetting as any)[element.sysSettingName] = _val;
      }
    });
    if (defaultSetting.OpenVerifyCode) {
      await getVerifyCode();
    }
  } catch {
    // ignore
  }
};

const registerConfigToDefault = () => {
  defaultSetting.OpenTenantLogin = getConfig().OpenTenantLogin;
  defaultSetting.OpenBaseLogin = getConfig().OpenBaseLogin;
};

const syncLoginType = () => {
  loginType.value = getSwitchLoginType();
};

registerConfigToDefault();
syncLoginType();

const openSwitchLoginType = computed(() => {
  return defaultSetting.OpenBaseLogin && defaultSetting.OpenTenantLogin;
});

function getSwitchLoginType() {
  if (defaultSetting.OpenBaseLogin) {
    return 1;
  }
  if (defaultSetting.OpenTenantLogin) {
    return 2;
  }
  return 1;
}

const handleChangeLoginType = async (_val: number) => {
  loginType.value = _val;
};

const isShowThirdPartyValue = computed(() => {
  return (
    Object.keys(ssoSetting).some((item) => (ssoSetting as any)[item]) &&
    defaultSetting.OpenThirdPartyLogin
  );
});

const handleThirdLogin = async (loginType: string) => {
  try {
    const { data } = await fetchThirdLoginCode({
      loginType: loginType,
      loginCode: uuid(),
      thirdType: 1,
      callback: window.location.origin,
    });
    window.location.href = data;
  } catch (error) {
    message(error?.message || "第三方登录失败", { type: "error" });
  }
};

const ruleForm = reactive({
  username: getConfig().defaultUsername || "",
  password: getConfig().defaultPassword || "",
  verifyCode: "",
  tenantCode: "",
});

const loginRules = {
  username: [
    { required: true, message: t("login.pureUsernameReg"), trigger: "blur" },
  ],
  password: [
    { required: true, message: t("login.purePasswordReg"), trigger: "blur" },
  ],
};

const resolveFormInstance = (formEl: any) => formEl?.value ?? formEl;

const handleLoginClick = () => onLogin(ruleFormRef.value);
const handleLoginCodeClick = () => onLoginCode(ruleFormRef.value);
const handleLoginToptCodeClick = () => onLoginToptCode(ruleFormRef.value);

const openVcode = ref(false);
const openToptcode = ref(false);
const vcodeRef = ref<any>(null);
const scCodeRef = ref<any>(null);
const currentFormEl = ref<any>(null);

const vcodeClose = () => {
  openVcode.value = false;
  vcodeRef.value?.reset();
};

const vcodeToptClose = () => {
  openToptcode.value = false;
  currentFormEl.value = null;
  scCodeRef.value?.clear?.();
};

const handleTotpChange = async (data: any) => {
  ruleForm.verifyCode = data;
};

const handleTotpComplete = () => {
  if (loading.value) {
    return;
  }
  onLogin(currentFormEl.value);
  vcodeToptClose();
};

const onLoginCode = async (formEl: any) => {
  const resolvedFormEl = resolveFormInstance(formEl);
  openVcode.value = true;
  setTimeout(() => {
    currentFormEl.value = resolvedFormEl;
    vcodeRef.value?.reset();
  }, 100);
};

const onLoginToptCode = async (formEl: any) => {
  const resolvedFormEl = resolveFormInstance(formEl);
  openToptcode.value = true;
  setTimeout(() => {
    currentFormEl.value = resolvedFormEl;
  }, 100);
};

const onVcodeSuccess = () => {
  if (loading.value) {
    return;
  }
  message("验证成功！", { type: "success" });
  setTimeout(() => {
    if (!loading.value) {
      onLogin(currentFormEl.value);
      currentFormEl.value = null;
      vcodeRef.value?.reset();
      vcodeClose();
    }
  }, 1000);
};

const onVcodeFail = () => {
  message("验证失败，请重试", { type: "error" });
  setTimeout(() => {
    vcodeRef.value?.reset();
  }, 1500);
};

const onLogin = async (formEl: any) => {
  const resolvedFormEl = resolveFormInstance(formEl);
  vcodeClose();
  if (!resolvedFormEl || loading.value) {
    return;
  }

  if (defaultSetting.OpenVerifyCode) {
    if (
      defaultVerifyCode.value.verifyCodeKey?.toLowerCase() !=
      ruleForm.verifyCode?.toLowerCase()
    ) {
      message(t("login.pureVerifyCodeError"), { type: "error" });
      getVerifyCode();
      return;
    }
  }

  await resolvedFormEl.validate((valid: boolean, fields: any) => {
    if (valid) {
      if (!ruleForm.password) {
        message(t("login.purePasswordReg"), { type: "error" });
        return;
      }
      loading.value = true;

      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: encodeLoginPassword(ruleForm.password),
          verifyCodeKey: ruleForm.verifyCode,
          verifyCodeUlid: defaultVerifyCode.value.verifyCodeUlid,
          loginType: "WEB",
          tenantCode: ruleForm.tenantCode,
          accountType: loginType.value === 2 ? "tenant" : null,
        })
        .then(() => {
          return initRouter()
            .then(() => {
              router.push(getTopMenuPath()).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch(() => {
              message("路由初始化失败，请重试", { type: "error" });
              useUserStoreHook().logOut();
            });
        })
        .catch((error) => {
          message(error.message || "登录失败，请检查用户名和密码", {
            type: "error",
          });
          if (defaultSetting.OpenVerifyCode) {
            getVerifyCode();
          }
        })
        .finally(() => {
          loading.value = false;
          ruleForm.verifyCode = "";
          vcodeRef.value?.reset();
        });
    }
  });
};

const getTopMenuPath = () => {
  const configuredRedirect = String(
    getConfig().PostLoginRedirect || getConfig().LoginSuccessRedirect || "",
  ).trim();
  if (configuredRedirect) {
    return configuredRedirect;
  }
  return "/home";
};

const currentEnv = import.meta.env.MODE || "production";
const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
const isTest = currentEnv === "test";
const showEnvBadge = computed(() => isDevelopment || isTest);

const showStaticLoginEntry = computed(() => {
  return (
    (isDevelopment || isTest) &&
    getConfig().OpenAuth !== false &&
    getConfig().ShowStaticLoginEntry === true
  );
});

const staticLoginDisplayName = computed(() => {
  return (
    getConfig().StaticLoginNickname ||
    getConfig().StaticLoginUsername ||
    "开发测试账号"
  );
});

const envBadgeText = computed(() => {
  if (isDevelopment) {
    return "开发环境";
  }
  return "测试环境";
});

const envBadgeClass = computed(() => {
  return isDevelopment ? "env-dev" : "env-test";
});

const handleStaticLogin = async () => {
  const targetPath = getConfig().StaticLoginPath || "/home";
  const username = getConfig().StaticLoginUsername || "admin";
  const password = getConfig().StaticLoginPassword || "123456";
  const nickname = getConfig().StaticLoginNickname || username;
  try {
    await userStore.loginByUsername({
      username,
      password: encodeLoginPassword(password),
      loginType: "WEB",
      accountType: null,
    });
    await initRouter(targetPath);
    await router.push(targetPath);
    userStore.SET_NICKNAME(nickname);
  } catch (error: any) {
    message(error?.message || "开发测试账号登录失败，请检查本地后端与账号配置", {
      type: "error",
    });
  }
};

const refreshFrontendSystemState = () => {
  frontendSystemState.value = getFrontendSystemConfig(getInitialConfig());
};

onMounted(() => {
  refreshFrontendSystemState();
  if (typeof window !== "undefined") {
    window.addEventListener(
      FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
      refreshFrontendSystemState as EventListener,
    );
  }
  const scheduleLoad =
    typeof window !== "undefined" && "requestAnimationFrame" in window
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) =>
          window.setTimeout(() => callback(performance.now()), 16);
  scheduleLoad(() => {
    void loadDefaultSetting().then(syncLoginType);
  });
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") {
    return;
  }
  window.removeEventListener(
    FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
    refreshFrontendSystemState as EventListener,
  );
});
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  overflow: hidden;
}

/* 环境标识 */
.env-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.5px;

  &.env-dev {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  }

  &.env-test {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }
}

/* 主题切换 */
.theme-switch-container {
  .theme-mode-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    border-radius: 999px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .theme-mode-button {
    appearance: none;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 60px;
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    color: var(--el-text-color-secondary);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      color: var(--el-text-color-primary);
    }

    &.active {
      color: var(--el-color-primary);
      background: var(--el-bg-color-overlay);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.16);
    }
  }

  .theme-mode-icon {
    font-size: 13px;
  }
}

/* 语言触发 */
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 2px;
  border-radius: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
  }

  .lang-icon-wrapper {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 50%;
  }

  .lang-main-icon {
    font-size: 11px;
    color: #fff;
  }

  .lang-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .lang-name {
    font-size: 10px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-arrow-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--el-fill-color);
  }

  .dropdown-arrow {
    font-size: 8px;
    color: var(--el-text-color-placeholder);
  }
}

/* 左侧背景 */
.login-background {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.10), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.08), transparent 60%),
    var(--el-bg-color-page, #F8F8F8);
}

html.dark .login-background {
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.25), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.20), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.15), transparent 60%),
    #03020c;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  pointer-events: none;
  animation: bg-float 18s infinite ease-in-out;
  z-index: 0;

  &--1 {
    top: -5%;
    left: 10%;
    width: 400px;
    height: 400px;
    background: rgba(var(--el-color-primary-rgb), 0.35);
  }

  &--2 {
    bottom: 5%;
    right: 5%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #a855f7 50%);
    animation-delay: -6s;
  }

  &--3 {
    top: 40%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #06b6d4 50%);
    animation-delay: -12s;
  }
}

html.dark .bg-shape {
  opacity: 0.3;
}

.glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 1;
  pointer-events: none;
}

html.dark .glass-overlay {
  background: rgba(0, 0, 0, 0.25);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.content-layer {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 40px;
  text-align: center;
}

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;

  &--brand {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.22),
      0 0 0 2px rgba(255, 255, 255, 0.35);
  }

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

.login-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.brand-text {
  color: var(--el-text-color-primary);
}

.welcome-title {
  color: var(--el-text-color-regular);
  letter-spacing: 2px;
}

.welcome-subtitle {
  color: var(--el-text-color-primary);
}

.welcome-desc {
  color: var(--el-text-color-regular);
  opacity: 0.85;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: rgba(var(--el-color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.15);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  transition: all 0.3s;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.15);
    transform: translateY(-2px);
  }
}

.feature-tag-icon {
  color: var(--el-color-primary);
}

/* 右侧表单区 */
.login-form-side {
  position: relative;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

html.dark .login-form-side {
  background: #0c0c0c;
  border-left-color: rgba(255, 255, 255, 0.06);
}

.login-form-panel {
  padding: 40px 24px;
}

.login-form {
  width: 100%;
  max-width: 300px;
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

  &:hover:not(.disabled) {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    transform: scale(1.02);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
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

.input-prefix-icon {
  font-size: 14px;
}

.animate-float-picture {
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
}

/* 登录类型选择器 */
.login-type-selector {
  .selector-options {
    display: flex;
    flex-direction: row;
    gap: 10px;

    .option-card {
      display: flex;
      align-items: center;
      padding: 12px;
      background: var(--el-fill-color-extra-light);
      border: 2px solid var(--el-border-color-lighter);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      flex: 1;

      &:hover {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-7);
        transform: translateY(-2px);
      }

      &.active {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 3px var(--el-color-primary-light-8);

        .option-icon-wrapper {
          background: var(--el-color-primary);
        }

        .option-title {
          color: var(--el-color-primary);
        }
      }

      .option-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        margin-right: 10px;
        transition: all 0.3s;

        .option-icon {
          font-size: 18px;
        }
      }

      .option-content {
        flex: 1;

        .option-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 2px;
        }

        .option-desc {
          font-size: 11px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }
}

/* 静态登录入口 */
.static-login-entry {
  padding: 12px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.16);
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.08) 0%,
    var(--el-fill-color-extra-light) 100%
  );

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__tip {
    font-size: 10px;
    color: var(--el-text-color-secondary);
  }

  &__button {
    width: 100%;
    height: 38px;
    border: 0;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.24);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(var(--el-color-primary-rgb), 0.28);
    }
  }
}

/* 第三方登录 */
.divider {
  position: relative;
  text-align: center;
  margin: 18px 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--el-border-color-light);
  }

  .divider-text {
    background: var(--el-bg-color);
    padding: 0 16px;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    position: relative;
    z-index: 1;
  }
}

.third-party-container {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.third-party-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-weight: 700;
  font-size: 16px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  &.gitee {
    &:hover {
      background: linear-gradient(135deg, #c71d23, #d64a4a);
      border-color: #c71d23;
      color: #fff;
    }
  }

  &.github {
    &:hover {
      background: linear-gradient(135deg, #24292e, #404448);
      border-color: #24292e;
      color: #fff;
    }
  }

  &.wechat {
    &:hover {
      background: linear-gradient(135deg, #07c160, #2aae67);
      border-color: #07c160;
      color: #fff;
    }
  }
}

@keyframes float-picture {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

@keyframes bg-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15px, -10px) scale(1.05);
  }
}
</style>