<script setup>
import { useDataThemeChange, useLayout, useNav, useTranslationLang } from "@layout/default";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import TypeIt from "@repo/components/ReTypeit";
import ScCode from "@repo/components/ScCode/index.vue";
import { $t, getConfig, transformI18n } from "@repo/config";
import { fetchVerifyCode, getTopMenu, initRouter, useUserStoreHook } from "@repo/core";

import { getParameter, message, uu3 } from "@repo/utils";
import $ from "jquery";
import { Md5 } from "ts-md5";
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ThirdParty from "../components/thirdParty.vue";
import Motion from "../utils/motion";
import { loginRules } from "../utils/rule";
import { avatar } from "../utils/static";

import { gsap } from "gsap";
import Vcode from "vue3-puzzle-vcode";

defineOptions({
  name: "Login",
});

const redirectParam = getParameter("redirectParam");
const ThirdPartyLayout = markRaw(ThirdParty);
const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref();
const { initStorage } = useLayout();
initStorage();

const { t } = useI18n();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const props = defineProps({
  defaultSetting: {
    type: Object,
    default: () => ({}),
  },
  ssoSetting: {
    type: Object,
    default: () => ({}),
  },
  accountType: {
    type: Number,
  },
});
const isShowThirdPartyValue = computed(() => {
  return Object.keys(props.ssoSetting).some((item) => props.ssoSetting[item]) && props.defaultSetting.OpenThirdPartyLogin;
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

const ruleForm = reactive({
  username: getConfig().defaultUsername,
  password: getConfig().defaultPassword,
  verifyCode: "",
  tenantCode: "",
});

const openVcode = ref(false);
const openToptcode = ref(false);

const scCodeRef = ref();
const currentFormEl = ref({});
/** 使用验证码 */
const onLoginCode = async (formEl) => {
  openVcode.value = true;
  nextTick(() => {
    currentFormEl.value = formEl;
    vcodeRef.value?.reset();
  });
};

/** 使用TOTP */
const onLoginToptCode = async (formEl) => {
  openToptcode.value = true;
  nextTick(() => {
    currentFormEl.value = formEl;
  });
};

const handleTimeline = async () => {
  const feTurbulence = document.querySelector("feTurbulence");
  const image = document.getElementsByClassName("filter-bolin");
  const timeline = gsap.timeline({
    paused: true,
    onUpdate: () => {
      feTurbulence.setAttribute("baseFrequency", `0 ${config.freq}`);
    },
  });
  const config = {
    freq: 0.00001,
  };
  timeline.to(config, {
    freq: 0.04,
    duration: 0.1,
  });
  timeline.to(config, {
    freq: 0.00001,
    duration: 0.1,
  });
  if (image.complete) {
    timeline.play();
    return;
  }
  timeline.play();
};

const handleTotpChange = async (data) => {
  ruleForm.verifyCode = data;
};

const handleTotpComplete = () => {
  if (loading.value) {
    return; // 如果正在登录中，不允许重复提交
  }
  onLogin(currentFormEl.value);
  vcodeToptClose();
};
const vcodeToptClose = () => {
  openToptcode.value = false;
  currentFormEl.value = null;
  scCodeRef.value.clear();
};
const onLogin = async (formEl) => {
  vcodeClose();
  if (!formEl || loading.value) {
    return;
  }

  // 验证码检查
  if (props.defaultSetting.OpenVerifyCode) {
    if (defaultVerifyCode.value.verifyCodeKey?.toLowerCase() != ruleForm.verifyCode?.toLowerCase()) {
      message(t("login.pureVerifyCodeError"), { type: "error" });
      getVerifyCode();
      return;
    }
  }

  await formEl.validate((valid, fields) => {
    if (valid) {
      // 检查密码是否存在
      if (!ruleForm.password) {
        message(t("login.purePasswordReg"), { type: "error" });
        return;
      }

      // 设置加载状态
      loading.value = true;

      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: Md5.hashStr(ruleForm.password || ""),
          verifyCodeKey: ruleForm.verifyCode,
          verifyCodeUlid: defaultVerifyCode.value.verifyCodeUlid,
          loginType: "WEB",
          tenantCode: ruleForm.tenantCode,
          accountType: props.accountType == 2 ? "tenant" : null,
        })
        .then((res) => {
          // 登录成功，获取后端路由
          return initRouter()
            .then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch((error) => {
              // 路由初始化失败
              message("路由初始化失败，请重试", { type: "error" });
              useUserStoreHook().logOut();
            });
        })
        .catch((error) => {
          // 登录失败
          console.error("登录失败:", error);
          message(error.message || "登录失败，请检查用户名和密码", { type: "error" });

          // 刷新验证码
          if (props.defaultSetting.OpenVerifyCode) {
            getVerifyCode();
          }
        })
        .finally(() => {
          // 无论成功还是失败，都要重置加载状态
          loading.value = false;
          ruleForm.verifyCode = "";
          vcodeRef.value?.reset();
        });
    } else {
      // 表单验证失败
    }
  });
};

/** 使用公共函数，避免`removeEventListener`失效 */
function onkeypress({ code }) {
  if (["Enter", "NumpadEnter"].includes(code)) {
    onLogin(ruleFormRef.value);
  }
}
const vcodeState = ref(false);

const vcodeRef = ref(null);

const vcodeClose = () => {
  openVcode.value = false;
  vcodeRef.value?.reset();
};
function onSuccess() {
  vcodeState.value = true;

  // 检查是否已经在登录中
  if (loading.value) {
    return;
  }

  // 添加成功反馈效果
  const vcodeContainer = document.querySelector(".vcode-component-wrapper");
  if (vcodeContainer) {
    vcodeContainer.classList.add("vcode-success");

    // 显示成功消息
    message("验证成功！", { type: "success" });

    // 延迟执行登录，让用户看到成功效果
    setTimeout(() => {
      if (!loading.value) {
        // 再次检查loading状态
        onLogin(currentFormEl.value);
        currentFormEl.value = null;
        vcodeRef.value?.reset();
        vcodeClose();

        // 清除成功状态
        vcodeContainer.classList.remove("vcode-success");
      }
    }, 1000);
  } else {
    // 如果找不到容器，直接执行登录
    if (!loading.value) {
      onLogin(currentFormEl.value);
      currentFormEl.value = null;
      vcodeRef.value?.reset();
      vcodeClose();
    }
  }
}

function onFail() {
  vcodeState.value = false;

  // 添加失败反馈效果
  const vcodeContainer = document.querySelector(".vcode-component-wrapper");
  if (vcodeContainer) {
    vcodeContainer.classList.add("vcode-error");

    // 显示失败消息
    message("验证失败，请重试", { type: "error" });

    // 延迟重置，让用户看到失败效果
    setTimeout(() => {
      vcodeRef.value?.reset();
      vcodeContainer.classList.remove("vcode-error");
    }, 1500);
  } else {
    // 如果找不到容器，直接重置
    vcodeRef.value?.reset();
  }
}

onMounted(() => {
  $(document).ready(function () {
    handleTimeline();
  });
  window.document.addEventListener("keypress", onkeypress);
  if (redirectParam) {
    const info = uu3(redirectParam);
    if (info) {
      useUserStoreHook()
        .load(info)
        .then((res) => {
          // 获取后端路由
          return initRouter()
            .then(() => {
              const url = getTopMenu(true).path;
              router.push(url, { query: {} }).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch((error) => {
              useUserStoreHook().logOut();
            });
        })
        .finally(() => {
          loading.value = false;
          vcodeRef.value?.reset();
        });
      return;
    }
  }
});

onBeforeUnmount(() => {
  window.document.removeEventListener("keypress", onkeypress);
});
</script>

<template>
  <div>
    <svg style="display: none">
      <defs>
        <filter id="noise" color-interpolation-filters="linearRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
          <feTurbulence type="turbulence" baseFrequency="0 0.4" numOctaves="2" seed="2" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="30" xChannelSelector="R" yChannelSelector="B" x="0%" y="0%" width="100%" height="100%" result="displacementMap" />
        </filter>
      </defs>
    </svg>
    <!-- 滑动验证码对话框 -->
    <sc-dialog v-model="openVcode" width="480px" draggable title="滑动验证" @close="vcodeClose" class="modern-dialog vcode-dialog" append-to-body>
      <div v-if="props.defaultSetting.OpenVcode" class="vcode-container">
        <Motion :delay="150">
          <div class="vcode-wrapper">
            <!-- 验证说明 -->
            <div class="verification-notice">
              <div class="notice-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="notice-content">
                <h4 class="notice-title">请完成安全验证</h4>
                <p class="notice-desc">拖动滑块完成拼图验证</p>
              </div>
            </div>

            <!-- 滑动验证组件 -->
            <div class="vcode-component-wrapper">
              <div class="vcode-header">
                <div class="vcode-title">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>拼图验证</span>
                </div>
                <div class="vcode-subtitle">请拖动滑块完成拼图</div>
              </div>

              <div class="vcode-puzzle-area">
                <Vcode ref="vcodeRef" :show="props.defaultSetting.OpenVcode" type="inside" :puzzleScale="0.8" @fail="onFail" @success="onSuccess" />
              </div>

              <!-- 操作提示 -->
              <div class="vcode-tips">
                <div class="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>拖动滑块到正确位置</span>
                </div>
                <div class="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>仔细观察拼图缺口</span>
                </div>
              </div>
            </div>

            <!-- 验证状态提示 -->
            <div class="verification-status">
              <div class="status-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>安全验证保护您的账户</span>
              </div>
            </div>
          </div>
        </Motion>
      </div>
    </sc-dialog>

    <!-- TOTP验证码对话框 -->
    <sc-dialog v-model="openToptcode" width="480px" :close-on-click-modal="false" draggable title="动态验证码验证" @close="vcodeToptClose" class="modern-dialog totp-dialog" append-to-body>
      <div class="totp-container">
        <Motion :delay="150">
          <div class="totp-wrapper">
            <!-- 安全提示 -->
            <div class="security-notice">
              <div class="notice-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <p class="notice-text">为了您的账户安全，请输入动态验证码</p>
            </div>

            <!-- 验证码输入组件 -->
            <ScCode ref="scCodeRef" :disabled="loading" @onComplete="handleTotpComplete" @onChange="handleTotpChange" />

            <!-- 帮助信息 -->
            <div class="help-info">
              <div class="help-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>验证码每30秒更新一次</span>
              </div>
              <div class="help-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>支持粘贴验证码</span>
              </div>
            </div>
          </div>
        </Motion>
      </div>
    </sc-dialog>
    <div class="modern-login-form-container">
      <div class="modern-login-form">
        <!-- 头像和标题区域 - 增强版 -->
        <div class="enhanced-header-section">
          <!-- 装饰性背景 -->
          <div class="header-background">
            <div class="bg-decoration bg-decoration-1"></div>
            <div class="bg-decoration bg-decoration-2"></div>
            <div class="bg-decoration bg-decoration-3"></div>
          </div>

          <!-- 头像容器 -->
          <Motion>
            <div class="enhanced-avatar-container">
              <div class="avatar-glow-ring"></div>
              <div class="avatar-outer-ring"></div>
              <div class="avatar-inner-wrapper">
                <avatar class="enhanced-avatar filter-bolin" @mouseover="handleTimeline" />
                <div class="avatar-status-indicator"></div>
              </div>
              <div class="avatar-floating-particles">
                <span class="particle particle-1"></span>
                <span class="particle particle-2"></span>
                <span class="particle particle-3"></span>
                <span class="particle particle-4"></span>
              </div>
            </div>
          </Motion>

          <!-- 标题容器 -->
          <Motion :delay="100">
            <div class="enhanced-title-container">
              <div class="title-wrapper">
                <h2 class="enhanced-login-title">
                  <span class="title-gradient">
                    <TypeIt :options="{ strings: [title], cursor: false, speed: 100 }" />
                  </span>
                </h2>
                <div class="title-underline"></div>
              </div>
              <p class="enhanced-login-subtitle">
                <span class="subtitle-icon">✨</span>
                欢迎回来，请登录您的账户
                <span class="subtitle-icon">✨</span>
              </p>
              <div class="welcome-badge">
                <span class="badge-text">安全登录</span>
              </div>
            </div>
          </Motion>
        </div>

        <!-- 表单区域 -->
        <div class="form-section">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large" class="modern-form">
            <!-- 租户编码字段（非必填） -->
            <Motion :delay="150" v-if="defaultSetting.OpenTenantLogin && props.accountType == 2">
              <div class="form-field-wrapper">
                <label class="field-label">租户编码 <span class="optional-hint">(选填)</span></label>
                <el-form-item prop="tenantCode" class="modern-form-item">
                  <el-input v-model="ruleForm.tenantCode" clearable :disabled="loading" :placeholder="t('login.pureTenantCode')" :prefix-icon="useRenderIcon('ri:building-fill')" class="modern-input" />
                </el-form-item>
              </div>
            </Motion>

            <!-- 用户名字段 -->
            <Motion :delay="100">
              <div class="form-field-wrapper">
                <label class="field-label">用户名</label>
                <el-form-item
                  :rules="[
                    {
                      required: true,
                      message: transformI18n($t('login.pureUsernameReg')),
                      trigger: 'blur',
                    },
                  ]"
                  prop="username"
                  class="modern-form-item"
                >
                  <el-input v-model="ruleForm.username" clearable :disabled="loading" :placeholder="t('login.pureUsername')" :prefix-icon="useRenderIcon('ri:user-3-fill')" class="modern-input" />
                </el-form-item>
              </div>
            </Motion>

            <!-- 密码字段 -->
            <Motion :delay="150">
              <div class="form-field-wrapper">
                <label class="field-label">密码</label>
                <el-form-item prop="password" class="modern-form-item">
                  <el-input v-model="ruleForm.password" clearable show-password :disabled="loading" :placeholder="t('login.purePassword')" :prefix-icon="useRenderIcon('ri:lock-fill')" class="modern-input" />
                </el-form-item>
              </div>
            </Motion>

            <!-- 验证码字段 -->
            <Motion v-if="props.defaultSetting.OpenVerifyCode" :delay="200">
              <div class="form-field-wrapper">
                <label class="field-label">验证码</label>
                <div class="verify-code-wrapper">
                  <el-form-item prop="verifyCode" class="modern-form-item verify-code-input">
                    <el-input v-model="ruleForm.verifyCode" clearable :disabled="loading" :placeholder="t('login.verifyCode')" :prefix-icon="useRenderIcon('ri:lock-fill')" class="modern-input" />
                  </el-form-item>
                  <div class="verify-code-image" :class="{ disabled: loading }" @click="!loading && getVerifyCode()">
                    <el-image :src="defaultVerifyCode.verifyCodeBase64" fit="fill" :lazy="true" class="code-image" />
                    <div class="refresh-hint">{{ loading ? "登录中..." : "点击刷新" }}</div>
                  </div>
                </div>
              </div>
            </Motion>

            <!-- 登录按钮 -->
            <Motion :delay="250">
              <div class="login-button-wrapper">
                <el-button v-if="props.defaultSetting.OpenVerifyCode" class="modern-login-button" size="large" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
                  <span v-if="!loading">{{ t("login.pureLogin") }}</span>
                  <span v-else>登录中...</span>
                </el-button>
                <el-button v-else-if="props.defaultSetting.OpenVcode" class="modern-login-button" size="large" type="primary" :loading="loading" @click="onLoginCode(ruleFormRef)">
                  <span v-if="!loading">{{ t("login.pureLogin") }}</span>
                  <span v-else>验证中...</span>
                </el-button>
                <el-button v-else-if="props.defaultSetting.CheckToptOpen" class="modern-login-button" size="large" type="primary" :loading="loading" @click="onLoginToptCode(ruleFormRef)">
                  <span v-if="!loading">{{ t("login.pureLogin") }}</span>
                  <span v-else>验证中...</span>
                </el-button>
                <el-button v-else class="modern-login-button" size="large" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
                  <span v-if="!loading">{{ t("login.pureLogin") }}</span>
                  <span v-else>登录中...</span>
                </el-button>
              </div>
            </Motion>
          </el-form>
        </div>

        <!-- 第三方登录 -->
        <Motion v-if="isShowThirdPartyValue" :delay="300">
          <div class="third-party-section">
            <div class="divider">
              <span class="divider-text">或</span>
            </div>
            <ThirdPartyLayout :data="props.ssoSetting" class="third-party-component" />
          </div>
        </Motion>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 现代化登录表单 - 完全适配 Element Plus 主题系统
.modern-login-form-container {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.modern-login-form {
  width: 100%;

  // 增强版头部区域 - 优化尺寸和间距
  .enhanced-header-section {
    position: relative;
    text-align: center;
    margin-bottom: 24px; // 从48px减少到24px
    padding: 16px 0; // 从32px减少到16px
    overflow: hidden;

    // 装饰性背景
    .header-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;

      .bg-decoration {
        position: absolute;
        border-radius: 50%;
        opacity: 0.1;
        animation: float 8s ease-in-out infinite;

        &.bg-decoration-1 {
          width: 80px; // 从120px减少到80px
          height: 80px;
          background: var(--el-color-primary);
          top: -15px; // 从-20px调整到-15px
          right: 15px; // 从20px调整到15px
          animation-delay: 0s;
        }

        &.bg-decoration-2 {
          width: 60px; // 从80px减少到60px
          height: 60px;
          background: var(--el-color-success);
          bottom: 8px; // 从10px调整到8px
          left: 20px; // 从30px调整到20px
          animation-delay: 2s;
        }

        &.bg-decoration-3 {
          width: 40px; // 从60px减少到40px
          height: 40px;
          background: var(--el-color-warning);
          top: 50%;
          left: -8px; // 从-10px调整到-8px
          animation-delay: 4s;
        }
      }
    }

    // 增强版头像容器 - 优化尺寸
    .enhanced-avatar-container {
      position: relative;
      display: inline-block;
      margin-bottom: 20px; // 从32px减少到20px
      z-index: 2;

      // 外层光晕环 - 调整尺寸
      .avatar-glow-ring {
        position: absolute;
        top: -15px; // 从-20px调整到-15px
        left: -15px;
        right: -15px;
        bottom: -15px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary), var(--el-color-primary-light-5), var(--el-color-primary));
        opacity: 0.3;
        animation: rotate 8s linear infinite;
        z-index: 1;
      }

      // 外环装饰 - 调整尺寸
      .avatar-outer-ring {
        position: absolute;
        top: -8px; // 从-12px调整到-8px
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 50%;
        border: 2px solid var(--el-color-primary-light-8); // 从3px减少到2px
        background: var(--el-fill-color-extra-light);
        backdrop-filter: blur(10px);
        z-index: 2;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      // 头像内层包装
      .avatar-inner-wrapper {
        position: relative;
        z-index: 3;

        .enhanced-avatar {
          width: 100px; // 从140px减少到100px
          height: 100px;
          border-radius: 50%;
          box-shadow:
            0 6px 24px rgba(0, 0, 0, 0.08),
            // 调整阴影尺寸
            0 3px 12px var(--el-color-primary-light-8),
            inset 0 1px 3px rgba(255, 255, 255, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 3px solid var(--el-bg-color); // 从4px减少到3px
          position: relative;
          overflow: hidden;

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            transform: scale(1.05) translateY(-3px); // 减少缩放和位移
            box-shadow:
              0 12px 36px rgba(0, 0, 0, 0.12),
              // 调整阴影尺寸
              0 6px 18px var(--el-color-primary-light-7),
              inset 0 1px 3px rgba(255, 255, 255, 0.4);

            &::before {
              opacity: 1;
            }
          }
        }

        // 状态指示器 - 调整尺寸
        .avatar-status-indicator {
          position: absolute;
          bottom: 6px; // 从8px调整到6px
          right: 6px;
          width: 18px; // 从24px减少到18px
          height: 18px;
          background: var(--el-color-success);
          border-radius: 50%;
          border: 2px solid var(--el-bg-color); // 从3px减少到2px
          box-shadow: var(--el-box-shadow-light);
          z-index: 4;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px; // 从8px减少到6px
            height: 6px;
            background: var(--el-bg-color-overlay);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }
        }
      }

      // 浮动粒子
      .avatar-floating-particles {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1;

        .particle {
          position: absolute;
          width: 4px; // 从6px减少到4px
          height: 4px;
          background: var(--el-color-primary);
          border-radius: 50%;
          opacity: 0.6;

          &.particle-1 {
            top: 20%;
            left: 10%;
            animation: float 3s ease-in-out infinite;
          }

          &.particle-2 {
            top: 30%;
            right: 15%;
            animation: float 4s ease-in-out infinite reverse;
          }

          &.particle-3 {
            bottom: 25%;
            left: 20%;
            animation: float 5s ease-in-out infinite;
          }

          &.particle-4 {
            bottom: 35%;
            right: 10%;
            animation: float 3.5s ease-in-out infinite reverse;
          }
        }
      }

      &:hover {
        .avatar-outer-ring {
          border-color: var(--el-color-primary-light-5);
          transform: scale(1.05);
          box-shadow: var(--el-box-shadow-light);
        }

        .avatar-glow-ring {
          opacity: 0.5;
          transform: scale(1.1);
        }
      }
    }

    // 增强版标题容器
    .enhanced-title-container {
      position: relative;
      z-index: 2;

      .title-wrapper {
        position: relative;
        margin-bottom: 12px; // 从16px减少到12px

        .enhanced-login-title {
          font-size: 24px; // 从32px减少到24px
          font-weight: 700; // 从800减少到700
          margin: 0 0 8px 0; // 从12px减少到8px
          text-align: center;
          writing-mode: horizontal-tb;
          letter-spacing: -0.5px; // 从-1px调整到-0.5px
          line-height: 1.2;
          position: relative;

          .title-gradient {
            background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--el-color-primary) 50%, var(--el-text-color-primary) 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% 200%;
            animation: gradientShift 4s ease-in-out infinite;
            display: inline-block;
            position: relative;

            &::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
              background-clip: text;
              -webkit-background-clip: text;
              opacity: 0;
              transition: opacity 0.3s ease;
            }

            &:hover::after {
              opacity: 1;
            }
          }
        }

        .title-underline {
          width: 40px; // 从60px减少到40px
          height: 3px; // 从4px减少到3px
          background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary));
          border-radius: 2px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;

          &::after {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
            animation: shimmer 2s ease-in-out infinite;
          }
        }
      }

      .enhanced-login-subtitle {
        font-size: 15px; // 从18px减少到15px
        color: var(--el-text-color-regular);
        margin: 0 0 16px 0; // 从20px减少到16px
        text-align: center;
        writing-mode: horizontal-tb;
        line-height: 1.4; // 从1.5调整到1.4
        font-weight: 500;
        position: relative;

        .subtitle-icon {
          display: inline-block;
          margin: 0 6px; // 从8px减少到6px
          font-size: 14px; // 从16px减少到14px
          animation: sparkle 2s ease-in-out infinite;

          &:first-child {
            animation-delay: 0s;
          }

          &:last-child {
            animation-delay: 1s;
          }
        }
      }

      .welcome-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 16px; // 从8px 20px减少到6px 16px
        background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
        border: 1px solid var(--el-color-primary-light-7);
        border-radius: 16px; // 从20px减少到16px
        box-shadow: var(--el-box-shadow-lighter);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }

        &:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: var(--el-box-shadow-light);
          border-color: var(--el-color-primary-light-5);

          &::before {
            left: 100%;
          }
        }

        .badge-text {
          font-size: 13px; // 从14px减少到13px
          font-weight: 600;
          color: var(--el-color-primary);
          text-align: center;
          writing-mode: horizontal-tb;
          position: relative;
          z-index: 1;
        }
      }
    }
  }

  // 表单区域
  .form-section {
    .modern-form {
      .form-field-wrapper {
        margin-bottom: 18px; // 从24px减少到18px
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;

        .field-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 0;
          text-align: left;
          writing-mode: horizontal-tb;
          min-width: 80px;
          flex-shrink: 0;

          .optional-hint {
            font-size: 12px;
            font-weight: 400;
            color: var(--el-text-color-secondary);
          }
        }

        .modern-form-item {
          margin-bottom: 0;
          flex: 1;

          :deep(.el-form-item__error) {
            font-size: 12px;
            color: var(--el-color-danger);
            margin-top: 4px;
            position: absolute;
            left: 92px;
            top: 100%;
          }
        }

        .modern-input {
          :deep(.el-input__wrapper) {
            background: var(--el-fill-color-extra-light);
            border: 2px solid var(--el-border-color-lighter);
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;

            &:hover {
              border-color: var(--el-color-primary-light-7);
              background: var(--el-fill-color-light);
            }

            &.is-focus {
              border-color: var(--el-color-primary);
              background: var(--el-bg-color-overlay);
              box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
            }
          }

          :deep(.el-input__inner) {
            font-size: 16px;
            color: var(--el-text-color-primary);
            background: transparent;

            &::placeholder {
              color: var(--el-text-color-placeholder);
              font-size: 14px;
            }
          }

          :deep(.el-input__prefix) {
            color: var(--el-text-color-regular);

            .el-icon {
              font-size: 18px;
            }
          }

          :deep(.el-input__suffix) {
            color: var(--el-text-color-regular);
          }
        }
      }
    }
  }

  // 验证码区域
  .verify-code-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex: 1;

    .verify-code-input {
      flex: 1;
    }

    .verify-code-image {
      width: 120px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      border: 2px solid var(--el-border-color-lighter);
      transition: all 0.3s ease;

      &:hover:not(.disabled) {
        border-color: var(--el-color-primary-light-7);
        transform: scale(1.02);

        .refresh-hint {
          opacity: 1;
        }
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 0.6;
        filter: grayscale(50%);

        .code-image {
          pointer-events: none;
        }

        .refresh-hint {
          background: rgba(0, 0, 0, 0.8);
          opacity: 1;
          color: var(--el-color-warning);
        }
      }

      .code-image {
        width: 100%;
        height: 100%;

        :deep(.el-image__inner) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .refresh-hint {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        color: var(--el-text-color-primary);
        font-size: 10px;
        text-align: center;
        padding: 2px;
        opacity: 0;
        transition: opacity 0.3s ease;
        text-align: center;
        writing-mode: horizontal-tb;
      }
    }
  }

  // 登录按钮
  .login-button-wrapper {
    margin-top: 24px; // 从32px减少到24px

    .modern-login-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border: none;
      box-shadow: var(--el-box-shadow-light);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
      writing-mode: horizontal-tb;

      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
        box-shadow: var(--el-box-shadow);
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }

      &.is-loading {
        background: var(--el-color-primary-light-5);
        cursor: not-allowed;

        &:hover {
          transform: none;
        }
      }

      span {
        color: var(--el-bg-color);
        font-weight: 600;
      }
    }
  }

  // 第三方登录区域
  .third-party-section {
    margin-top: 24px; // 从32px减少到24px

    .divider {
      position: relative;
      text-align: center;
      margin: 18px 0; // 从24px减少到18px

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
        background: var(--el-bg-color-overlay);
        padding: 0 16px;
        color: var(--el-text-color-placeholder);
        font-size: 14px;
        position: relative;
        z-index: 1;
      }
    }

    .third-party-component {
      :deep(.third-party-container) {
        display: flex;
        justify-content: center;
        gap: 16px;

        .third-party-item {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--el-fill-color-extra-light);
          border: 2px solid var(--el-border-color-lighter);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary-light-7);
            transform: translateY(-2px) scale(1.05);
            box-shadow: var(--el-box-shadow-light);
          }

          .third-party-icon {
            font-size: 24px;
            color: var(--el-text-color-regular);
            transition: color 0.3s ease;
          }

          &:hover .third-party-icon {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }
}

// 现代化对话框样式
:deep(.modern-dialog) {
  .el-dialog {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
    box-shadow: var(--el-box-shadow-dark);
    backdrop-filter: blur(20px);
  }

  .el-dialog__header {
    background: var(--el-fill-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    border-radius: 16px 16px 0 0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 24px;

      .el-dialog__close {
        color: var(--el-text-color-regular);
        font-size: 18px;

        &:hover {
          color: var(--el-color-danger);
        }
      }
    }
  }

  .el-dialog__body {
    padding: 24px;
  }
}

// 现代化对话框样式
:deep(.modern-dialog) {
  .el-dialog {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
    box-shadow: var(--el-box-shadow-dark);
    backdrop-filter: blur(20px);

    .el-dialog__header {
      background: var(--el-fill-color-extra-light);
      border-bottom: 1px solid var(--el-border-color-lighter);
      border-radius: 16px 16px 0 0;
      padding: 20px 24px;

      .el-dialog__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .el-dialog__headerbtn {
        top: 20px;
        right: 20px;

        .el-dialog__close {
          color: var(--el-text-color-regular);
          font-size: 18px;

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }
    }

    .el-dialog__body {
      padding: 24px;
    }
  }

  .el-overlay {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
}

// 滑动验证码对话框样式
:deep(.vcode-dialog) {
  .el-dialog {
    .el-dialog__header {
      .el-dialog__title {
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: "";
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-light-3));
          border-radius: 50%;
          display: inline-block;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: var(--el-bg-color-overlay);
            border-radius: 50%;
          }
        }
      }
    }
  }
}

// 验证码容器样式
.vcode-container {
  .vcode-wrapper {
    background: transparent;
    border-radius: 0;
    padding: 0;
    border: none;

    // 验证说明样式
    .verification-notice {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 12px;
      margin-bottom: 24px;

      .notice-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: var(--el-color-primary);
        border-radius: 50%;
        color: var(--el-text-color-primary);
        flex-shrink: 0;

        svg {
          width: 24px;
          height: 24px;
        }
      }

      .notice-content {
        flex: 1;

        .notice-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-color-primary-dark-2);
          margin: 0 0 4px 0;
          text-align: left;
          writing-mode: horizontal-tb;
        }

        .notice-desc {
          font-size: 14px;
          color: var(--el-color-primary);
          margin: 0;
          text-align: left;
          writing-mode: horizontal-tb;
        }
      }
    }

    // 验证组件包装器
    .vcode-component-wrapper {
      background: var(--el-fill-color-extra-light);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--el-border-color-lighter);
      margin-bottom: 20px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      // 添加装饰性背景
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, transparent 50%, var(--el-color-success-light-9) 100%);
        opacity: 0.3;
        z-index: 0;
      }

      > * {
        position: relative;
        z-index: 1;
      }

      &:hover {
        box-shadow: var(--el-box-shadow);
        transform: translateY(-2px);
      }

      // 成功状态
      &.vcode-success {
        background: var(--el-color-success-light-9);
        border-color: var(--el-color-success-light-5);
        animation: bounceIn 0.6s ease-out;

        &::before {
          background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, transparent 50%, var(--el-color-success-light-7) 100%);
        }

        .vcode-header .vcode-title {
          color: var(--el-color-success);

          svg {
            color: var(--el-color-success);
            animation: glow 1s ease-in-out infinite;
          }
        }

        .vcode-puzzle-area {
          border-color: var(--el-color-success-light-5);
          background: var(--el-color-success-light-9);
        }
      }

      // 失败状态
      &.vcode-error {
        background: var(--el-color-error-light-9);
        border-color: var(--el-color-error-light-5);
        animation: shake 0.5s ease-in-out;

        &::before {
          background: linear-gradient(135deg, var(--el-color-error-light-8) 0%, transparent 50%, var(--el-color-error-light-7) 100%);
        }

        .vcode-header .vcode-title {
          color: var(--el-color-error);

          svg {
            color: var(--el-color-error);
          }
        }

        .vcode-puzzle-area {
          border-color: var(--el-color-error-light-5);
          background: var(--el-color-error-light-9);
        }
      }

      // 验证码头部
      .vcode-header {
        text-align: center;
        margin-bottom: 20px;

        .vcode-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 6px;
          text-align: center;
          writing-mode: horizontal-tb;

          svg {
            width: 20px;
            height: 20px;
            color: var(--el-color-primary);
          }
        }

        .vcode-subtitle {
          font-size: 13px;
          color: var(--el-text-color-regular);
          text-align: center;
          writing-mode: horizontal-tb;
        }
      }

      // 拼图区域
      .vcode-puzzle-area {
        background: var(--el-bg-color-overlay);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
        margin-bottom: 16px;
      }

      // 操作提示
      .vcode-tips {
        display: flex;
        justify-content: space-between;
        gap: 16px;

        .tip-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--el-text-color-placeholder);
          flex: 1;
          text-align: left;
          writing-mode: horizontal-tb;

          svg {
            width: 14px;
            height: 14px;
            color: var(--el-color-info);
            flex-shrink: 0;
          }

          span {
            flex: 1;
          }
        }
      }

      // 深度样式覆盖验证码组件
      :deep(.vcode-container) {
        background: transparent;
        border: none;
        border-radius: 0;
        overflow: hidden;

        // 拼图图片面板
        .vcode-img-panel {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 2px solid var(--el-border-color-extra-light);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
          }

          img {
            border-radius: 6px;
          }
        }

        // 滑块容器
        .vcode-slider-container {
          margin-top: 20px;
          position: relative;

          // 滑块轨道
          .vcode-slider-track {
            background: linear-gradient(90deg, var(--el-fill-color-light) 0%, var(--el-fill-color-extra-light) 50%, var(--el-fill-color-light) 100%);
            border: 2px solid var(--el-border-color-lighter);
            border-radius: 24px;
            height: 48px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);

            // 添加轨道装饰
            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(90deg, transparent 0%, rgba(var(--el-color-primary-rgb), 0.1) 50%, transparent 100%);
              animation: shimmer 2s ease-in-out infinite;
            }

            // 滑块轨道文字
            .vcode-slider-text {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 14px;
              color: var(--el-text-color-placeholder);
              font-weight: 500;
              pointer-events: none;
              z-index: 1;
              text-align: center;
              writing-mode: horizontal-tb;
            }
          }

          // 滑块按钮
          .vcode-slider-btn {
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            border: 3px solid var(--el-bg-color);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            box-shadow:
              0 4px 12px rgba(var(--el-color-primary-rgb), 0.3),
              0 2px 6px rgba(0, 0, 0, 0.1);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 2;

            // 添加滑块图标
            &::before {
              content: "";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 16px;
              height: 16px;
              background: var(--el-bg-color-overlay);
              border-radius: 2px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            &::after {
              content: "";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 8px;
              height: 8px;
              background: var(--el-color-primary);
              border-radius: 1px;
            }

            &:hover {
              background: linear-gradient(135deg, var(--el-color-primary-dark-2) 0%, var(--el-color-primary) 100%);
              transform: scale(1.1);
              box-shadow:
                0 6px 16px rgba(var(--el-color-primary-rgb), 0.4),
                0 3px 8px rgba(0, 0, 0, 0.15);
            }

            &:active {
              cursor: grabbing;
              transform: scale(1.05);
            }
          }

          // 成功状态
          &.vcode-success {
            .vcode-slider-track {
              background: linear-gradient(90deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
              border-color: var(--el-color-success-light-5);
            }

            .vcode-slider-btn {
              background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);

              &::after {
                background: var(--el-color-success);
              }
            }
          }

          // 失败状态
          &.vcode-error {
            .vcode-slider-track {
              background: linear-gradient(90deg, var(--el-color-error-light-8) 0%, var(--el-color-error-light-9) 100%);
              border-color: var(--el-color-error-light-5);
              animation: shake 0.5s ease-in-out;
            }

            .vcode-slider-btn {
              background: linear-gradient(135deg, var(--el-color-error) 0%, var(--el-color-error-light-3) 100%);

              &::after {
                background: var(--el-color-error);
              }
            }
          }
        }
      }
    }

    // 验证状态提示
    .verification-status {
      .status-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        text-align: center;
        writing-mode: horizontal-tb;

        svg {
          width: 16px;
          height: 16px;
          color: var(--el-color-success);
        }
      }
    }
  }
}

// TOTP验证码对话框样式
:deep(.totp-dialog) {
  .el-dialog {
    .el-dialog__header {
      .el-dialog__title {
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: "";
          width: 20px;
          height: 20px;
          background: var(--el-color-primary);
          border-radius: 50%;
          display: inline-block;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: var(--el-bg-color-overlay);
            border-radius: 50%;
          }
        }
      }
    }
  }
}

.totp-container {
  .totp-wrapper {
    background: transparent;
    border-radius: 0;
    padding: 0;
    border: none;
    text-align: center;

    // 安全提示样式
    .security-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 20px;
      background: var(--el-color-warning-light-9);
      border: 1px solid var(--el-color-warning-light-7);
      border-radius: 12px;
      margin-bottom: 24px;

      .notice-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--el-color-warning);
        flex-shrink: 0;

        svg {
          width: 20px;
          height: 20px;
        }
      }

      .notice-text {
        font-size: 14px;
        color: var(--el-color-warning-dark-2);
        margin: 0;
        font-weight: 500;
        text-align: left;
        writing-mode: horizontal-tb;
      }
    }

    // 帮助信息样式
    .help-info {
      margin-top: 24px;
      padding: 16px;
      background: var(--el-fill-color-extra-light);
      border-radius: 12px;
      border: 1px solid var(--el-border-color-lighter);

      .help-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
        text-align: left;
        writing-mode: horizontal-tb;

        &:last-child {
          margin-bottom: 0;
        }

        svg {
          width: 16px;
          height: 16px;
          color: var(--el-color-primary);
          flex-shrink: 0;
        }

        span {
          flex: 1;
        }
      }
    }
  }
}

// 动画关键帧
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.8);
  }
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes slideIn {
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(var(--el-color-primary-rgb), 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(var(--el-color-primary-rgb), 0.8);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

// 响应式设计 - 优化后的尺寸
@media (max-width: 768px) {
  .modern-login-form {
    .form-section {
      .modern-form {
        .form-field-wrapper {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;

          .field-label {
            min-width: auto;
          }

          .modern-form-item {
            width: 100%;

            :deep(.el-form-item__error) {
              left: 0;
              position: relative;
              margin-top: 4px;
            }
          }

          .verify-code-wrapper {
            width: 100%;
          }
        }
      }
    }
  }

  // 滑块验证码平板端优化
  .vcode-container {
    .vcode-wrapper {
      .vcode-component-wrapper {
        padding: 20px 16px;

        .vcode-header {
          .vcode-title {
            font-size: 15px;

            svg {
              width: 18px;
              height: 18px;
            }
          }

          .vcode-subtitle {
            font-size: 12px;
          }
        }

        .vcode-tips {
          flex-direction: column;
          gap: 8px;

          .tip-item {
            justify-content: center;
            text-align: center;

            svg {
              width: 12px;
              height: 12px;
            }

            span {
              font-size: 11px;
            }
          }
        }

        :deep(.vcode-container) {
          .vcode-slider-container {
            .vcode-slider-track {
              height: 44px;
              border-radius: 22px;

              .vcode-slider-text {
                font-size: 13px;
              }
            }

            .vcode-slider-btn {
              width: 40px;
              height: 40px;

              &::before {
                width: 14px;
                height: 14px;
              }

              &::after {
                width: 7px;
                height: 7px;
              }
            }
          }
        }
      }
    }
  }
  .enhanced-header-section {
    margin-bottom: 20px; // 从32px减少到20px
    padding: 16px 0; // 从24px减少到16px

    .enhanced-avatar-container {
      margin-bottom: 16px; // 从24px减少到16px

      .avatar-glow-ring {
        top: -12px; // 从-15px调整到-12px
        left: -12px;
        right: -12px;
        bottom: -12px;
      }

      .avatar-outer-ring {
        top: -6px; // 从-8px调整到-6px
        left: -6px;
        right: -6px;
        bottom: -6px;
        border-width: 2px;
      }

      .avatar-inner-wrapper {
        .enhanced-avatar {
          width: 80px; // 从100px减少到80px
          height: 80px;
          border-width: 2px; // 从3px减少到2px
        }

        .avatar-status-indicator {
          width: 16px; // 从20px减少到16px
          height: 16px;
          bottom: 4px; // 从6px调整到4px
          right: 4px;
          border-width: 2px;

          &::after {
            width: 5px; // 从6px减少到5px
            height: 5px;
          }
        }
      }
    }

    .enhanced-title-container {
      .title-wrapper {
        .enhanced-login-title {
          font-size: 20px; // 从24px减少到20px
          font-weight: 600; // 从700减少到600
        }

        .title-underline {
          width: 32px; // 从40px减少到32px
          height: 2px; // 从3px减少到2px
        }
      }

      .enhanced-login-subtitle {
        font-size: 14px; // 从16px减少到14px
        margin-bottom: 12px; // 从16px减少到12px

        .subtitle-icon {
          font-size: 12px; // 从14px减少到12px
          margin: 0 4px; // 从6px减少到4px
        }
      }

      .welcome-badge {
        padding: 4px 12px; // 从6px 16px减少到4px 12px

        .badge-text {
          font-size: 12px; // 从13px减少到12px
        }
      }
    }
  }
}

@media (max-width: 480px) {
  // 滑块验证码移动端优化
  .vcode-container {
    .vcode-wrapper {
      .vcode-component-wrapper {
        padding: 16px 12px;
        border-radius: 12px;

        .vcode-header {
          margin-bottom: 16px;

          .vcode-title {
            font-size: 14px;
            gap: 6px;

            svg {
              width: 16px;
              height: 16px;
            }
          }

          .vcode-subtitle {
            font-size: 11px;
          }
        }

        .vcode-puzzle-area {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .vcode-tips {
          .tip-item {
            font-size: 10px;
            gap: 4px;

            svg {
              width: 10px;
              height: 10px;
            }
          }
        }

        :deep(.vcode-container) {
          .vcode-img-panel {
            border-radius: 6px;
            border-width: 1px;
          }

          .vcode-slider-container {
            margin-top: 16px;

            .vcode-slider-track {
              height: 40px;
              border-radius: 20px;
              border-width: 1px;

              .vcode-slider-text {
                font-size: 12px;
              }
            }

            .vcode-slider-btn {
              width: 36px;
              height: 36px;
              border-width: 2px;

              &::before {
                width: 12px;
                height: 12px;
              }

              &::after {
                width: 6px;
                height: 6px;
              }
            }
          }
        }
      }
    }
  }

  .enhanced-header-section {
    margin-bottom: 16px; // 从24px减少到16px
    padding: 12px 0; // 从16px减少到12px

    .enhanced-avatar-container {
      margin-bottom: 12px; // 从20px减少到12px

      .avatar-glow-ring {
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
      }

      .avatar-outer-ring {
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border-width: 1px;
      }

      .avatar-inner-wrapper {
        .enhanced-avatar {
          width: 70px; // 从80px减少到70px
          height: 70px;
          border-width: 2px;
        }

        .avatar-status-indicator {
          width: 14px; // 从16px减少到14px
          height: 14px;
          bottom: 3px; // 从4px调整到3px
          right: 3px;
          border-width: 1px;

          &::after {
            width: 4px;
            height: 4px;
          }
        }
      }

      .avatar-floating-particles {
        .particle {
          width: 3px; // 从4px减少到3px
          height: 3px;
        }
      }
    }

    .enhanced-title-container {
      .title-wrapper {
        .enhanced-login-title {
          font-size: 18px; // 从20px减少到18px
        }

        .title-underline {
          width: 24px; // 从30px减少到24px
          height: 2px;
        }
      }

      .enhanced-login-subtitle {
        font-size: 13px; // 从14px减少到13px
        margin-bottom: 10px; // 从12px减少到10px
      }

      .welcome-badge {
        padding: 3px 10px; // 从4px 12px减少到3px 10px

        .badge-text {
          font-size: 11px; // 从12px减少到11px
        }
      }
    }

    .header-background {
      .bg-decoration {
        &.bg-decoration-1 {
          width: 80px;
          height: 80px;
        }

        &.bg-decoration-2 {
          width: 60px;
          height: 60px;
        }

        &.bg-decoration-3 {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}
</style>
