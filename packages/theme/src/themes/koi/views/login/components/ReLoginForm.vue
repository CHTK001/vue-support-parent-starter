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

    <!-- 标题：默认显示；页面自带标题时传 showHeader=false 避免重复 -->
    <div v-if="!systemUnavailable && showHeader && !bindMode" class="form-header text-center m-b-32px">
      <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("menu.login.account") }}</h3>
      <p class="text-14px text-[--el-text-color-regular]">
        {{ $t("menu.login.form.loginName") }} / {{ $t("menu.login.form.password") }}
      </p>
    </div>

    <!-- 三方账号绑定视图：回调带回 bindToken（三方账号未绑定本地用户）时展示，
         用户输入本地账密核验通过后，服务端一次性完成「落绑定 + 签发登录态」 -->
    <el-form v-if="!systemUnavailable && bindMode" ref="bindFormRef" :model="bindForm" :rules="bindRules" class="login-form">
      <div class="form-header text-center m-b-24px">
        <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">绑定本地账号</h3>
        <p class="text-14px text-[--el-text-color-regular]">
          {{ bindPlatformLabel }} 账号尚未绑定本系统，验证本地账号密码后完成绑定并登录
        </p>
      </div>

      <!-- 三方身份回显：信息来自回调暂存的服务端凭证，仅作展示 -->
      <div class="login-bind-identity">
        <el-avatar :size="44" :src="bindInfo.avatar || undefined">
          {{ (bindInfo.nickname || bindInfo.username || "?").slice(0, 1) }}
        </el-avatar>
        <div class="login-bind-identity__meta">
          <div class="login-bind-identity__name">{{ bindInfo.nickname || bindInfo.username || "第三方账号" }}</div>
          <div class="login-bind-identity__sub">
            {{ bindPlatformLabel }}<template v-if="bindInfo.username"> · {{ bindInfo.username }}</template><template v-if="bindInfo.email"> · {{ bindInfo.email }}</template>
          </div>
        </div>
      </div>

      <el-form-item prop="username">
        <el-input
          v-model="bindForm.username"
          type="text"
          name="username"
          autocomplete="username"
          placeholder="本地账号"
          size="large"
          class="login-input"
          @keydown.enter="handleBindComplete"
        >
          <template #prefix>
            <el-icon :size="16"><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="bindForm.password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="本地密码"
          show-password
          size="large"
          class="login-input"
          @keydown.enter="handleBindComplete"
        >
          <template #prefix>
            <el-icon :size="16"><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item class="m-b-0">
        <el-button
          type="primary"
          class="login-btn w-100% tracking-4px"
          size="large"
          :loading="bindLoading"
          @click="handleBindComplete"
        >
          {{ bindLoading ? "绑定中..." : "绑定并登录" }}
        </el-button>
      </el-form-item>

      <div class="flex flex-justify-center m-t-12px">
        <el-button text :disabled="bindLoading" @click="cancelBind">
          <span class="text-13px text-[--el-text-color-secondary] hover:text-[--el-color-primary] select-none transition-colors">
            返回登录
          </span>
        </el-button>
      </div>
    </el-form>

    <el-form v-else-if="!systemUnavailable" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
      <!-- 登录类型选择卡片：只在 app.yaml loginConfig.types 配了多项时出现 -->
      <ReLoginTypePicker v-if="loginTypes.length > 1" v-model="activeLoginType" :disabled="loading" />

      <!--
        登录方式切换：账号密码 / 短信验证码，两个入口平级。
        只在 OpenSmsLogin（login.smsLogin）与短信发信账号可用（other.smsLogin.enable）
        同时成立时出现，缺一即整块隐藏——没有可用短信通道时给出入口只会让用户白等验证码。
      -->
      <div v-if="smsLoginAvailable" class="login-mode-switch" role="tablist" aria-label="登录方式">
        <button
          v-for="item in loginModes"
          :key="item.value"
          type="button"
          role="tab"
          class="login-mode-switch__item"
          :class="{ 'is-active': loginMode === item.value }"
          :aria-selected="loginMode === item.value"
          :disabled="loading"
          @click="switchLoginMode(item.value)"
        >
          <el-icon :size="14"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </div>

      <!-- 账号密码登录 -->
      <template v-if="loginMode === 'password'">
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
      </template>

      <!-- 短信验证码登录：手机号 + 验证码，发送走 /v2/sms/send（bizType=login） -->
      <template v-else>
        <el-form-item>
          <el-input
            v-model="smsForm.phone"
            type="tel"
            name="phone"
            autocomplete="tel"
            maxlength="11"
            placeholder="请输入手机号"
            size="large"
            class="login-input"
            @keydown.enter="handleSmsLogin"
          >
            <template #prefix>
              <el-icon :size="16"><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <div class="login-sms-code">
            <el-input
              v-model="smsForm.code"
              type="text"
              name="smsCode"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="请输入短信验证码"
              size="large"
              class="login-input login-sms-code__input"
              @keydown.enter="handleSmsLogin"
            >
              <template #prefix>
                <el-icon :size="16"><Message /></el-icon>
              </template>
            </el-input>
            <el-button
              class="login-sms-code__send"
              size="large"
              :disabled="smsCountdown > 0"
              :loading="sendingSmsCode"
              @click="handleSendSmsCode"
            >
              {{ smsCountdown > 0 ? `${smsCountdown}s` : "获取验证码" }}
            </el-button>
          </div>
        </el-form-item>

        <!-- 自动注册提示：短信验证通过后，未注册手机号会自动创建账号并登录 -->
        <div class="login-sms-hint">未注册手机号验证通过后将自动注册账号</div>

        <el-form-item class="m-b-0">
          <el-button
            type="primary"
            class="login-btn w-100% tracking-4px"
            size="large"
            :loading="loading"
            @click="handleSmsLogin"
          >
            {{ loading ? $t("menu.login.loading") : $t("menu.login.in") }}
          </el-button>
        </el-form-item>
      </template>

      <!-- 第三方登录（与个人中心绑定面板共用 /v2/setting/sso/providers 配置源） -->
      <ReThirdLogin />
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Postcard, WarningFilled, OfficeBuilding, Iphone, Message } from "@element-plus/icons-vue";
import { ref, reactive, toRef, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { LoginTypeConfig } from "@repo/config";
import { msgWarning, msgError, msgSuccess, getCaptcha, thirdLoginExchange, thirdBindPending, thirdBindComplete, takeThirdCallbackParams, setUserRoles, setUserPerms, refreshDefaultSetting, setActiveBaseUrl, applyActiveBaseUrl, resetActiveBaseUrl, sendSmsCode, smsLogin } from "@repo/core";
import type { ThirdBindPendingInfo } from "@repo/core";
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

/**
 * 短信验证码登录是否可用（双条件）。
 *
 * <p>{@code login.smsLogin} 来自后端 {@code OpenSmsLogin} 开关；{@code other.smsLogin.enable}
 * 是后端派生的「短信发信账号是否可用」结论（{@code SmsDeliveryCapability}）。
 * 缺一即整块隐藏：只有开关、没有可用短信账号时，用户点进去也永远收不到验证码。</p>
 */
const smsLoginAvailable = computed(
  () => loginConfig.value.smsLogin === true && getConfig().other?.smsLogin?.enable === true,
);

/** 登录方式：账号密码（默认） / 短信验证码，二者平级 */
const loginMode = ref<"password" | "sms">("password");

/** 方式切换按钮（图标取 Element Plus 组件，避免再引一套图标依赖） */
const loginModes = [
  { value: "password" as const, label: "账号密码", icon: User },
  { value: "sms" as const, label: "短信登录", icon: Iphone },
];

/** 手机号 / 验证码规则与后端 {@code SmsLoginRequest} 的 @Pattern 保持一致，先在本地拦一道 */
const SMS_PHONE_PATTERN = /^1[3-9]\d{9}$/;
const SMS_CODE_PATTERN = /^\d{4,6}$/;

/** 短信登录表单（不入 el-form 校验：手机号/验证码不是账号密码字段） */
const smsForm = reactive({ phone: "", code: "" });
const sendingSmsCode = ref(false);
/** 重发倒计时（秒），大于 0 时禁止再点发送 */
const smsCountdown = ref(0);
let smsCountdownTimer: ReturnType<typeof setInterval> | undefined;

/** 清掉倒计时（卸载 / 切回账号密码时） */
const stopSmsCountdown = () => {
  if (smsCountdownTimer) {
    clearInterval(smsCountdownTimer);
    smsCountdownTimer = undefined;
  }
};

/** 60s 重发倒计时：只为防连点触发服务端限流，与验证码 5 分钟有效期无关 */
const startSmsCountdown = (seconds = 60) => {
  stopSmsCountdown();
  smsCountdown.value = seconds;
  smsCountdownTimer = setInterval(() => {
    smsCountdown.value -= 1;
    if (smsCountdown.value <= 0) stopSmsCountdown();
  }, 1000);
};

/** 切换登录方式：清掉另一侧的输入，避免验证码在两种方式之间串用 */
const switchLoginMode = (mode: "password" | "sms") => {
  if (loading.value || mode === loginMode.value) return;
  loginMode.value = mode;
  loginForm.securityCode = "";
  smsForm.code = "";
  sliderPassed.value = false;
  sliderRef.value?.reset();
};

// 短信通道不可用（配置被关掉 / 账号被停用）时强制回到账号密码，避免停在空面板上
watch(smsLoginAvailable, (available) => {
  if (!available && loginMode.value === "sms") {
    loginMode.value = "password";
    stopSmsCountdown();
  }
});

onBeforeUnmount(stopSmsCountdown);

/** 发送短信验证码（登录场景固定 bizType=login，与 SmsCodeServiceImpl 的校验键一致） */
const handleSendSmsCode = async () => {
  const phone = smsForm.phone.trim();
  if (!SMS_PHONE_PATTERN.test(phone)) {
    msgWarning("请输入正确的手机号");
    return;
  }
  if (smsCountdown.value > 0 || sendingSmsCode.value) return;
  sendingSmsCode.value = true;
  try {
    // 验证码签在所选入口的后端上：登录请求必须发往同一地址，否则校验必然失败
    setActiveBaseUrl(activeLoginEntry.value.baseUrl);
    const res = await sendSmsCode({ phone, bizType: "login" });
    if (res?.data === false) {
      msgError(res?.msg || "验证码发送失败");
      return;
    }
    msgSuccess("验证码已发送，请查收");
    startSmsCountdown();
  } catch (error) {
    msgError((error as Error)?.message || "验证码发送失败");
  } finally {
    sendingSmsCode.value = false;
  }
};

/**
 * 短信验证码登录。
 *
 * <p>登录成功后的收尾与账号密码登录（{@link submitLogin}）完全一致：
 * setToken → roles/perms → refreshDefaultSetting → initAuthRouter → 目标页。</p>
 */
const handleSmsLogin = async () => {
  if (loading.value) return;
  const phone = smsForm.phone.trim();
  const code = smsForm.code.trim();
  if (!SMS_PHONE_PATTERN.test(phone)) {
    msgWarning("请输入正确的手机号");
    return;
  }
  if (!SMS_CODE_PATTERN.test(code)) {
    msgWarning("请输入短信验证码");
    return;
  }
  try {
    loading.value = true;
    authStore.$reset();
    resetRouter();
    setActiveBaseUrl(activeLoginEntry.value.baseUrl);
    const res = await smsLogin({ phone, code });
    const result = res?.data;
    if (!result?.accessToken) {
      // 登录失败：撤销入口地址，避免停在一个连不通的站点上反复重试
      resetActiveBaseUrl();
      msgError(res?.msg || "短信登录失败，请检查验证码");
      return;
    }
    applyActiveBaseUrl();
    userStore.setToken(result);
    if (result.roles?.length) setUserRoles(result.roles);
    if (result.perms?.length) setUserPerms(result.perms);
    // 令牌就绪后补拉后端配置（能力开关等），失败静默降级为本地配置
    void refreshDefaultSetting();
    const username =
      (typeof result.username === "string" && result.username) ||
      ((result.userInfo as Record<string, unknown> | undefined)?.sysUserUsername as string) ||
      phone;
    tabsStore.$reset();
    userStore.setLoginName(username);
    keepAliveStore.$reset();
    await nextTick();
    await initAuthRouter(router);
    if (props.forced) {
      emit("success");
    } else {
      await router.replace(HOME_URL);
    }
  } catch (error) {
    resetActiveBaseUrl();
    msgError((error as Error)?.message || "短信登录失败，请重试");
  } finally {
    loading.value = false;
  }
};
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
  delete rest.bindToken;
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

/**
 * 三方账号绑定视图：回调未绑定时暂存 bindToken，先回显三方身份，
 * 用户输入本地账密核验通过后，由后端一次性完成「落绑定 + 签发登录态」。
 */
const bindMode = ref(false);
const bindToken = ref("");
/** 绑定成功后的跳转目标（回调 redirect 参数，可空） */
const bindRedirect = ref("");
const bindLoading = ref(false);
const bindInfo = reactive<ThirdBindPendingInfo>({
  thirdPartyType: "",
  username: "",
  nickname: "",
  avatar: "",
  email: "",
});
const bindForm = reactive({ username: "", password: "" });
const bindFormRef = ref<FormInstance>();
const bindRules: FormRules = {
  username: [{ required: true, message: "请输入本地账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入本地密码", trigger: "blur" }],
};

/** 平台展示名：小写 loginType → 常见平台名，未知名原样展示 */
const BIND_PLATFORM_LABELS: Record<string, string> = {
  gitee: "Gitee",
  github: "GitHub",
  google: "Google",
  oidc: "OIDC",
  wechat: "微信",
};
const bindPlatformLabel = computed(
  () => BIND_PLATFORM_LABELS[bindInfo.thirdPartyType?.toLowerCase()] || bindInfo.thirdPartyType || "第三方"
);

/**
 * 进入绑定视图：回显三方身份（pending 接口只读不核销，complete 时才消费）
 *
 * @param token    回调带回的一次性待绑定凭证
 * @param redirect 绑定成功后的跳转目标（可空）
 */
const enterBindMode = async (token: string, redirect: string) => {
  try {
    loading.value = true;
    const res = await thirdBindPending({ bindToken: token });
    const info = res?.data;
    if (!info?.thirdPartyType) {
      // 凭证缺失/过期：剥参留在登录页，用户需重新发起三方登录
      msgError(res?.msg || "绑定凭证已失效，请重新发起第三方登录");
      await stripThirdCallbackQuery();
      return;
    }
    Object.assign(bindInfo, info);
    bindToken.value = token;
    bindRedirect.value = redirect || "";
    bindMode.value = true;
  } catch (error) {
    msgError((error as Error)?.message || "绑定凭证已失效，请重新发起第三方登录");
    await stripThirdCallbackQuery();
  } finally {
    loading.value = false;
  }
};

/** 绑定并登录：表单校验通过后提交 */
const handleBindComplete = () => {
  if (!bindFormRef.value) return;
  bindFormRef.value.validate(async (valid: any) => {
    if (!valid) {
      msgError(t("msg.validFail"));
      return;
    }
    await submitBind();
  });
};

/**
 * 提交绑定：核验本地账密 → 落绑定 → 签发登录态。
 *
 * <p>登录收尾与三方换票（consumeThirdLogin）同一套语义：
 * setToken → roles/perms → refreshDefaultSetting → initAuthRouter → 目标页。</p>
 *
 * <p>bindToken 是一次性凭证（服务端先核销再校验账密，防凭 token 试口令），
 * 业务失败即失效：回登录视图让用户重新发起三方登录。</p>
 */
const submitBind = async () => {
  try {
    bindLoading.value = true;
    const res = await thirdBindComplete({
      bindToken: bindToken.value,
      username: bindForm.username.trim(),
      password: bindForm.password,
    });
    const result = res?.data;
    if (!result?.accessToken) {
      msgError(res?.msg || "绑定失败，请检查账号密码");
      bindMode.value = false;
      bindToken.value = "";
      await stripThirdCallbackQuery();
      return;
    }
    msgSuccess("绑定成功，正在进入系统");
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
      bindForm.username.trim();
    if (username) {
      tabsStore.$reset();
      userStore.setLoginName(username);
    }
    keepAliveStore.$reset();
    await nextTick();
    await initAuthRouter(router);
    await router.replace(bindRedirect.value || HOME_URL);
  } catch (error) {
    // 网络类异常：凭证可能仍在有效期，留在绑定视图可重试
    msgError((error as Error)?.message || "绑定失败，请重试");
  } finally {
    bindLoading.value = false;
  }
};

/** 放弃绑定：回登录视图并剥掉 bindToken，防止刷新重放 */
const cancelBind = async () => {
  bindMode.value = false;
  bindToken.value = "";
  await stripThirdCallbackQuery();
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
  // 三方未绑定回跳：进绑定视图完成本地账密核验，绑定成功即登录
  if (third.bindToken) {
    await enterBindMode(third.bindToken, third.redirect);
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

/* 登录方式切换（账号密码 / 短信登录）
   与「登录类型卡片」区分：卡片换的是后端入口（平台 / 租户），这里换的是同后端的登录方式 */
.login-mode-switch {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.login-mode-switch__item {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition:
    background var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;

  &:hover:not(:disabled):not(.is-active) {
    color: var(--el-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-bg-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
}

/* 短信验证码 + 获取按钮同行：按钮定宽，输入框吃掉剩余宽度 */
.login-sms-code {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.login-sms-code__input {
  flex: 1;
}

.login-sms-code__send {
  flex-shrink: 0;
  min-width: 104px;
  border-radius: 10px;
}

/* 短信登录自动注册提示：贴在验证码行下方，弱化展示 */
.login-sms-hint {
  margin: -10px 0 18px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 三方账号绑定视图：身份回显卡片 */
.login-bind-identity {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 20px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.login-bind-identity__meta {
  min-width: 0;
}

.login-bind-identity__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-bind-identity__sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

