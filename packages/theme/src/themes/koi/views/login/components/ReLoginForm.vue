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
        <img class="login-logo" :src="fallbackLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <div class="font-600 text-xl">{{ translateConfigText(loginConfig.title) }}</div>
    </div>

    <!-- 标题：默认显示；页面自带标题时传 showHeader=false 避免重复 -->
    <div v-if="!systemUnavailable && showHeader" class="form-header text-center m-b-32px">
      <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("menu.login.account") }}</h3>
      <p class="text-14px text-[--el-text-color-regular]">
        {{ $t("menu.login.form.loginName") }} / {{ $t("menu.login.form.password") }}
      </p>
    </div>

    <el-form v-if="!systemUnavailable" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
      <!-- 登录类型选择卡片：只在 app.yaml loginConfig.types 配了多项时出现 -->
      <ReLoginTypePicker v-if="loginTypes.length > 1" v-model="activeLoginType" :disabled="loading" />

      <!-- 租户编码：仅当所选入口需要按编码定位租户时才显示 -->
      <el-form-item v-if="activeLoginEntry?.tenantCode" prop="tenantCode">
        <el-input
          v-model="loginForm.tenantCode"
          type="text"
          :placeholder="$t('menu.login.form.tenantCode')"
          size="large"
          class="login-input"
          clearable
          @keydown.enter="handleKoiLogin"
        >
          <template #prefix>
            <el-icon :size="16"><OfficeBuilding /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="loginName">
        <el-input
          v-model="loginForm.loginName"
          type="text"
          name="username"
          autocomplete="username"
          :placeholder="$t('menu.login.form.loginName')"
          size="large"
          class="login-input"
          @keydown.enter="handleKoiLogin"
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
          name="password"
          autocomplete="current-password"
          :placeholder="$t('menu.login.form.password')"
          show-password
          size="large"
          class="login-input"
          @keydown.enter="handleKoiLogin"
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

      <!-- 滑块验证（按 loginConfig.sliderType 渲染对应形态：simple = 普通滑动 / puzzle = 图片拼图） -->
      <el-form-item v-if="loginConfig.slider">
        <ReSliderVerify
          ref="sliderRef"
          :slider-type="loginConfig.sliderType || 'simple'"
          :disabled="loading"
          :tolerance="4"
          :puzzle="loginConfig.sliderPuzzle"
          @success="sliderPassed = true"
        />
      </el-form-item>

      <!-- 记住账号密码：勾选且登录成功后才写入本机（凭据专用存储，强制 AES），取消勾选并登录成功即清除 -->
      <el-form-item class="login-remember-item">
        <el-checkbox v-model="rememberMe" :disabled="loading">
          {{ $t("menu.login.remember") }}
        </el-checkbox>
      </el-form-item>

      <el-form-item class="m-b-0">
        <el-button
          type="primary"
          class="login-btn w-100% tracking-4px"
          size="large"
          :loading="loading"
          @click="handleKoiLogin"
        >
          {{ loading ? $t("menu.login.loading") : $t("menu.login.in") }}
        </el-button>
      </el-form-item>

      <div class="flex flex-justify-center m-t-12px" v-if="loginConfig.captcha">
        <el-button text @click="handleCaptcha">
          <span class="text-13px text-[--el-text-color-secondary] hover:text-[--el-color-primary] select-none transition-colors">
            {{ $t("menu.login.picture") }}
          </span>
        </el-button>
      </div>

      <!-- 第三方登录（与个人中心绑定面板共用 /v2/setting/sso/providers 配置源） -->
      <ReThirdLogin />
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Postcard, WarningFilled, OfficeBuilding } from "@element-plus/icons-vue";
import { ref, reactive, toRef, computed, onMounted, nextTick, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { LoginTypeConfig } from "@repo/config";
import { msgWarning, msgError, getCaptcha, thirdLoginExchange, takeThirdCallbackParams, setUserRoles, setUserPerms, refreshDefaultSetting, setActiveBaseUrl, applyActiveBaseUrl, resetActiveBaseUrl } from "@repo/core";
import {
  readRememberedLogin,
  saveRememberedLogin,
  clearRememberedLogin,
  saveBrowserCredential,
} from "@repo/utils";
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
import ReThirdLogin from "./ReThirdLogin.vue";
import ReLoginTypePicker from "./ReLoginTypePicker.vue";

const props = withDefaults(
  defineProps<{
    /** 是否显示移动端品牌 Logo */
    showMobileBrand?: boolean;
    /** 是否显示「账号密码登录」标题（页面自带标题时传 false，避免重复） */
    showHeader?: boolean;
    /** 样式主题额外 class */
    formClass?: string;
    /**
     * 强制登录：弹窗/宿主接管登录后的页面落点（true 时不跳走，只回报登录成功）。
     * 默认 false（在登录页正常落地：已登录自动跳首页/redirect 地址、登录后跳首页）。
     */
    forced?: boolean;
  }>(),
  {
    showHeader: true,
  },
);

const { t } = useI18n();
/** 登录成功（弹窗 / 宿主接管控制权） */
const emit = defineEmits<{ (e: "success"): void }>();
// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

/** 登录类型列表（app.yaml loginConfig.types）；未配时回落为单个普通登录 */
const DEFAULT_LOGIN_TYPE: LoginTypeConfig = { type: "web", title: "普通登录", baseUrl: "" };

const loginTypes = computed<LoginTypeConfig[]>(() => {
  const list = loginConfig.value.types;
  return Array.isArray(list) && list.length ? list : [DEFAULT_LOGIN_TYPE];
});

/** 当前选中的登录类型标识；默认取数组第一项（yaml 里第一项即普通登录） */
const activeLoginType = ref<string>(loginTypes.value[0]?.type ?? DEFAULT_LOGIN_TYPE.type);

// 配置热重载后列表可能变短甚至消失：选中项已不存在时退回第一项
watch(
  () => loginTypes.value.map((item) => item.type).join(","),
  () => {
    if (!loginTypes.value.some((item) => item.type === activeLoginType.value)) {
      activeLoginType.value = loginTypes.value[0]?.type ?? DEFAULT_LOGIN_TYPE.type;
    }
  },
);

/** 当前选中的入口配置（决定是否显示租户码、登录发往哪个地址） */
const activeLoginEntry = computed<LoginTypeConfig>(
  () => loginTypes.value.find((item) => item.type === activeLoginType.value) ?? loginTypes.value[0] ?? DEFAULT_LOGIN_TYPE,
);
// 品牌 Logo：支持 app.yaml 配置（本地资源路径或外部 URL），为空时回退内置 logo
const resolvedLogoUrl = computed(() => {
  const custom = loginConfig.value.logoUrl;
  if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) {
    return resolveAssetUrl(custom);
  }
  return fallbackLogoUrl;
});
const userStore = useUserStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const router = useRouter();
const loginFormRef = ref<FormInstance>();
const sliderRef = ref<InstanceType<typeof ReSliderVerify>>();
const otpDialogRef = ref<InstanceType<typeof ReOtpDialog>>();
// 服务端要求补录动态码时的提示语，用于把登录失败转成动态口令弹窗
const OTP_REQUIRED_MESSAGE = "请输入动态验证码";
const sliderPassed = ref(false);
const loading = ref(false);

interface ILoginUser {
  loginName: string;
  password: string | number;
  securityCode: string | number;
  codeKey: string | number;
  captchaPicture: any;
  otpCode: string;
  tenantCode: string;
}

const loginForm = reactive<ILoginUser>({
  loginName: "",
  password: "",
  securityCode: "",
  codeKey: "",
  captchaPicture: "",
  otpCode: "",
  tenantCode: "",
});

/**
 * 是否记住账号密码。
 *
 * <p>默认不勾选：没有已保存凭据时不主动落盘，避免共用电脑上悄悄记住口令；
 * 上次勾选过（本地有凭据）时进入页面会自动勾选并回填。</p>
 */
const rememberMe = ref(false);

/**
 * 把当前登录入口已记住的凭据回填到表单。
 *
 * <p>只填空字段：浏览器自动填充或用户已经输入时不被覆盖。</p>
 */
const fillRememberedLogin = () => {
  const saved = readRememberedLogin(activeLoginType.value);
  if (!saved) {
    rememberMe.value = false;
    return;
  }
  rememberMe.value = true;
  if (!loginForm.loginName) loginForm.loginName = saved.loginName;
  if (!loginForm.password) loginForm.password = saved.password;
  if (!loginForm.tenantCode && saved.tenantCode) loginForm.tenantCode = saved.tenantCode;
};

/**
 * 登录成功后的凭据处理。
 *
 * <p>勾选：写入凭据专用加密存储（强制 AES）并请求浏览器密码本保存；
 * 未勾选：清除该入口之前记住的凭据，下次进入不再回填。</p>
 *
 * @param loginName 本次登录账号
 * @param password  本次登录口令
 */
const persistLoginCredential = (loginName: string, password: string) => {
  const tenantCode = String(loginForm.tenantCode || "").trim().toLowerCase();
  if (rememberMe.value) {
    saveRememberedLogin(activeLoginType.value, {
      loginName,
      password,
      ...(tenantCode ? { tenantCode } : {}),
    });
    // 浏览器密码本与本机存储是两条独立通道：不支持 / 非 HTTPS 时静默跳过
    void saveBrowserCredential({ username: loginName, password, displayName: loginName });
    return;
  }
  clearRememberedLogin(activeLoginType.value);
};

const loginRules: any = reactive<FormRules<ILoginUser>>({
  loginName: [
    { required: true, message: t("menu.login.rules.loginName.required"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
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
  ],
  tenantCode: [
    {
      // 选填：平台用户留空。填了就必须是合法短码，否则后端只会回「租户编码不存在」，
      // 在本地先拦一道，省一次往返也避免用户以为是自己账号的问题
      validator: (_rule: any, value: any, callback: any) => {
        const code = String(value || "").trim();
        if (!code) {
          callback();
          return;
        }
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,31}$/.test(code)) {
          callback(new Error(t("menu.login.rules.tenantCode.validator")));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
});

/** 获取验证码 */
const handleCaptcha = async () => {
  userStore.setToken({});
  // 验证码由所选入口的后端签发，必须把入口地址先交给请求层，否则会拿到默认站点的验证码
  setActiveBaseUrl(activeLoginEntry.value.baseUrl);
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

/** 切换登录类型＝换一个后端：旧验证码在新站点上无效，清空并重新拉取 */
watch(activeLoginType, () => {
  loginForm.loginName = "";
  loginForm.password = "";
  loginForm.tenantCode = "";
  loginForm.securityCode = "";
  loginForm.codeKey = "";
  loginForm.captchaPicture = "";
  sliderPassed.value = false;
  sliderRef.value?.reset();
  // 不同入口的账号口令互不通用：切过去就回填该入口自己记住的那份
  fillRememberedLogin();
  if (loginConfig.value.captcha) void handleCaptcha();
});

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

/** 剥离 URL 上的三方回跳参数（停留登录页时防刷新重放凭证 / 重复错误提示） */
const stripThirdCallbackQuery = async () => {
  const current = router.currentRoute.value;
  const rest = { ...current.query };
  delete rest.redirectParam;
  delete rest.thirdMsg;
  if (Object.keys(rest).length === Object.keys(current.query).length) return;
  await router.replace({ path: current.path, query: rest, hash: current.hash });
};

/**
 * 三方登录回跳换票：兑换一次性凭证 → 写入登录态 → 初始化路由 → 跳目标页
 *
 * <p>状态写入与账号密码登录（userStore.loginByUsername）保持同一套语义：
 * setToken → roles/perms → refreshDefaultSetting → initAuthRouter → 目标页。</p>
 *
 * @param redirectParam 回调签发的一次性加密凭证
 * @param redirect      登录成功后的跳转目标（可空）
 */
const consumeThirdLogin = async (redirectParam: string, redirect: string) => {
  try {
    loading.value = true;
    const res = await thirdLoginExchange({ redirectParam });
    const result = res?.data;
    if (!result?.accessToken) {
      // 凭证为一次性（服务端先核销后解密），失败无法重试：提示后剥参留在登录页
      msgError(res?.msg || "三方登录失败，请重试");
      await stripThirdCallbackQuery();
      return;
    }
    authStore.$reset();
    resetRouter();
    userStore.setToken(result);
    if (result.roles?.length) setUserRoles(result.roles);
    if (result.perms?.length) setUserPerms(result.perms);
    // 令牌就绪后补拉后端配置（能力开关等），失败静默降级为本地配置
    void refreshDefaultSetting();
    const username =
      (typeof result.username === "string" && result.username) ||
      ((result.userInfo as Record<string, unknown> | undefined)?.sysUserUsername as string) ||
      "";
    if (username) {
      tabsStore.$reset();
      userStore.setLoginName(username);
    }
    keepAliveStore.$reset();
    await nextTick();
    await initAuthRouter(router);
    await router.replace(redirect || HOME_URL);
  } catch (error) {
    msgError((error as Error)?.message || "三方登录失败，请重试");
    await stripThirdCallbackQuery();
  } finally {
    loading.value = false;
  }
};

// 进入页面加载管理员信息
onMounted(async () => {
  await loadSettingAndInit();
  // 上次勾选过「记住账号密码」时回填该入口的账号与口令
  fillRememberedLogin();

  // 三方登录回跳：redirectParam=一次性换票凭证（成功路径），thirdMsg=回调错误提示。
  // 参数由 core 在启动期快照（history 模式守卫 replace 到登录页时不带 query，
  // 挂载时 route.query 已被清空），必须在「已登录自动跳转」之前消费。
  const third = takeThirdCallbackParams();
  if (third.redirectParam) {
    await consumeThirdLogin(third.redirectParam, third.redirect);
    return;
  }
  if (third.thirdMsg) {
    msgError(third.thirdMsg);
    await stripThirdCallbackQuery();
  }

  // 如果用户已经登录，自动跳转到 redirect 地址或首页
  if (!props.forced && userStore?.token) {
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
    // 不做前端全局预判：直接提交，由后端按该用户是否已绑定 TOTP 决定是否要求动态码
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
  // 租户编码是登录页的人工输入，空格与大小写都不该导致登不进去：
  // 去空格后与后端一致地按小写提交；空串不发送，保持平台入口语义
  const tenantCode = String(loginForm.tenantCode || "").trim().toLowerCase();
  try {
    loading.value = true;
    authStore.$reset();
    resetRouter();
    // 入口地址必须在发请求前落定：先用它签出令牌，登录成功后再写进全局配置，
    // 保证之后 refreshDefaultSetting / initAuthRouter 拉数据时打的是同一个后端
    setActiveBaseUrl(activeLoginEntry.value.baseUrl);
    await userStore.loginByUsername({
      username: loginName,
      password: String(password),
      codeKey,
      securityCode,
      // 后端若按「记住登录」区分令牌有效期，这里就是它的开关；
      // 未实现时该字段被忽略，不影响登录
      isRemembered: rememberMe.value,
      ...(tenantCode ? { tenantCode } : {}),
      ...(otpCode ? { otpCode } : {}),
    });
    applyActiveBaseUrl();

    if (userStore?.token) {
      // 登录已成功：按勾选状态记住 / 清除本机凭据（验证码、OTP 不落盘）
      persistLoginCredential(loginName, String(password));
      try {
        await initAuthRouter(router);
      } catch (e) {
        // 原来这里是空 return：初始化失败时页面既不跳转、也不给任何提示，
        // 表现就是「点了登录没反应、还停在登录页」，完全无从排查。
        // 登录本身已成功（token 已拿到），这里只提示路由初始化失败并留在登录页。
        msgError(`登录后初始化路由失败：${(e as Error)?.message || e}`);
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
    // 强制登录（弹窗接管）时不跳首页，把控制权交还给弹窗宿主；正常登录页跳首页
    if (props.forced) {
      emit("success");
    } else {
      await router.replace(HOME_URL);
    }
  } catch (error: any) {
    sliderPassed.value = false;
    sliderRef.value?.reset();
    // 登录失败：撤销入口地址，避免停留在错误站点（例如租户站点 500）上反复重试
    resetActiveBaseUrl();
    // 显示登录失败错误提示
    const errorMsg = error?.message || error?.msg || t("msg.logInFail");
    if (String(errorMsg).includes(OTP_REQUIRED_MESSAGE)) {
      otpDialogRef.value?.open();
      return;
    }
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

.login-remember-item {
  margin-top: -4px;
  margin-bottom: 12px;
}

.login-input {
  :deep(.el-input__wrapper) {
    border: 1px solid var(--el-border-color-lighter) !important;
    border-radius: 10px;
    background: var(--el-fill-color-blank) !important;
    box-shadow: none !important;
    transition: all 0.3s;

    /* 登录页不做品牌色高亮：hover 与聚焦都保持同一根浅边框，
       避免点进输入框时边框突然变蓝、再叠一圈光晕。
       错误态仍按下方 :is-error 规则变红，不影响校验反馈。 */
    &:hover,
    &.is-focus {
      border-color: var(--el-border-color-lighter) !important;
      box-shadow: none !important;
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
  /* 登录页主按钮固定跟随主题主色（--el-color-primary）。
     应用级 telemetry.css 会给 .el-button--primary 上自定义品牌渐变（--brand-gradient），
     这里用高特异度 + !important 覆盖，保证登录页是主色纯蓝而不是品牌紫。 */
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.35);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%) !important;
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

