<script setup>
import {
  useDataThemeChange,
  useLayout,
  useNav,
  useTranslationLang,
} from "@layout/default";
import { fetchDefaultSetting } from "@pages/setting";
import { getConfig, setConfig } from "@repo/config";
import { fetchVerifyCode } from "@repo/core";
import { getParameter, localStorageProxy } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  markRaw,
  onBeforeMount,
  reactive,
  ref,
  toRaw,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ThirdParty from "./components/thirdParty.vue";
import ThemeSwitcher from "./components/ThemeSwitcher.vue";
import { bg, illustration } from "./utils/static";
import { getLoginTheme as getLoginThemeComponent } from "./themes";
import {
  getThemeConfig,
  type ThemeConfig,
} from "./utils/themeConfig";

import darkIcon from "@repo/assets/svg/dark.svg?component";
import dayIcon from "@repo/assets/svg/day.svg?component";
import globalization from "@repo/assets/svg/globalization.svg?component";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

defineOptions({
  name: "Login",
});

// 获取主题配置
const storedConfig = getThemeConfig();
const themeConfig = storedConfig.LoginTheme;
const enableFestival = storedConfig.EnableFestivalTheme;
const enableThemeSwitcher = getConfig("EnableLoginThemeSwitcher") !== false;

console.debug("[Login] Theme config:", {
  loginTheme: themeConfig,
  enableFestival,
  enableThemeSwitcher,
});

const currentTheme = getLoginThemeComponent(themeConfig, enableFestival);
console.debug("[Login] Theme component loaded:", currentTheme.key || currentTheme.name);

const ThemeComponent = defineAsyncComponent(currentTheme.component);

const BaseLayout = defineAsyncComponent(() => import("./layout/base.vue"));
const redirectParam = getParameter("redirectParam");
const ThirdPartyLayout = markRaw(ThirdParty);
const router = useRouter();
const loading = ref(false);
const loginType = ref(1);
const ruleFormRef = ref();
const { initStorage } = useLayout();
initStorage();

const { t } = useI18n();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const defaultSetting = reactive({
  OpenVerifyCode: false,
  OpenVcode: false,
  CheckTotpOpen: false,
  OpenThirdPartyLogin: false,
  SystemName: "",
});
const ssoSetting = reactive({
  Gitee: false,
  Github: false,
  Wechat: false,
});
const loadDefaultSetting = async () => {
  try {
    const { data } = await fetchDefaultSetting();
    // 检查 data 是否存在且为数组
    if (!data || !Array.isArray(data)) {
      return;
    }
    data.forEach((element) => {
      // 跳过空元素
      if (!element) {
        return;
      }
      if (element.sysSettingGroup == "default") {
        if (element.sysSettingName === "SystemName") {
          defaultSetting.systemName = element.sysSettingValue;
          setConfig("Title", defaultSetting.systemName);
          return;
        }
        if (element.sysSettingName === "CheckCodeOpen") {
          defaultSetting.openVerifyCode = element.sysSettingValue === "true";
          return;
        }

        if (element.sysSettingName === "CheckTotpCodeOpen") {
          defaultSetting.checkTotpOpen = element.sysSettingValue === "true";
          return;
        }

        if (element.sysSettingName === "SlidingBlockOpen") {
          defaultSetting.openVcode = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "OpenThirdPartyLogin") {
          const _val = element.sysSettingValue === "true";
          defaultSetting.OpenThirdPartyLogin = _val;
          return;
        }
        defaultSetting[element.sysSettingName] =
          element.sysSettingValue === "true";
      } else if (element.sysSettingGroup === "sso") {
        const _val = element.sysSettingValue === "true";
        ssoSetting[element.sysSettingName] = _val;
      }
    });

    if (defaultSetting.openVerifyCode) {
      await getVerifyCode();
    }
  } catch (error) {
    // 接口异常时静默处理，保证登录页面正常显示
    console.warn("获取默认配置失败:", error);
  }
};

const registerConfigToDefault = () => {
  defaultSetting.OpenTenantLogin = getConfig().OpenTenantLogin;
  defaultSetting.OpenBaseLogin = getConfig().OpenBaseLogin;
};
onBeforeMount(async () => {
  registerConfigToDefault();
  await loadDefaultSetting();
  if (defaultSetting.OpenBaseLogin) {
    loginType.value = 1;
  } else if (defaultSetting.OpenTenantLogin) {
    loginType.value = 2;
  }
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

const handleChangeLoginType = async (_val) => {
  loginType.value = _val;
};

const openSwitchLoginType = computed(() => {
  return defaultSetting.OpenBaseLogin && defaultSetting.OpenTenantLogin;
});

const getSwitchLoginType = () => {
  if (defaultSetting.OpenBaseLogin) {
    return 1;
  }
  if (defaultSetting.OpenTenantLogin) {
    return 2;
  }
  // 默认返回普通登录类型，确保登录框能正常显示
  return 1;
};

// 判断当前环境
const currentEnv = import.meta.env.MODE || "production";
const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
const isTest = currentEnv === "test";
const showEnvBadge = computed(() => isDevelopment || isTest);

// 获取环境标识文本
const envBadgeText = computed(() => {
  if (isDevelopment) {
    return "开发环境";
  }
  return "测试环境";
});

const envBadgeClass = computed(() => {
  return isDevelopment ? "env-dev" : "env-test";
});
</script>

<template>
  <component :is="ThemeComponent">
    <!-- 顶部工具栏 -->
    <template #toolbar>
    <div class="modern-toolbar">
      <div class="toolbar-content">
        <!-- 环境标识 -->
        <div v-if="showEnvBadge" class="env-badge" :class="envBadgeClass">
          <IconifyIconOnline
            :icon="isDevelopment ? 'ri:code-s-slash-line' : 'ri:test-tube-line'"
          />
          <span>{{ envBadgeText }}</span>
        </div>

        <div class="toolbar-spacer"></div>

        <!-- 主题切换器 -->
        <ThemeSwitcher v-if="enableThemeSwitcher" style="margin-right: 15px" />

        <!-- 主题切换 -->
        <div class="theme-switch-container">
          <el-switch
            v-model="dataTheme"
            inline-prompt
            :active-icon="dayIcon"
            :inactive-icon="darkIcon"
            @change="dataThemeChange"
            class="modern-theme-switch"
          />
        </div>

        <!-- 语言切换 -->
        <el-dropdown
          trigger="click"
          popper-class="lang-dropdown-popper"
        >
          <div class="lang-trigger">
            <div class="lang-icon-wrapper">
              <IconifyIconOnline icon="ri:translate-2" class="lang-main-icon" />
            </div>
            <div class="lang-info">
              <span class="lang-name">{{
                locale === "zh-CN" ? "简体中文" : "English"
              }}</span>
              <span class="lang-role">{{
                locale === "zh-CN" ? "语言" : "Language"
              }}</span>
            </div>
            <span class="dropdown-arrow-wrapper">
              <IconifyIconOnline
                icon="ri:arrow-down-s-line"
                class="dropdown-arrow"
              />
            </span>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="lang-menu">
              <div class="lang-header">
                <IconifyIconOnline icon="ri:global-line" />
                <span>选择语言</span>
              </div>
              <el-dropdown-item
                :class="['lang-item', { active: locale === 'zh-CN' }]"
                @click="translationCh"
              >
                <div class="lang-item-content">
                  <span class="lang-flag">🇨🇳</span>
                  <div class="lang-item-info">
                    <span class="lang-item-name">简体中文</span>
                    <span class="lang-item-desc">Simplified Chinese</span>
                  </div>
                </div>
                <IconifyIconOnline
                  v-show="locale === 'zh-CN'"
                  class="lang-check"
                  icon="ep:check"
                />
              </el-dropdown-item>
              <el-dropdown-item
                :class="['lang-item', { active: locale === 'en-US' }]"
                @click="translationEn"
              >
                <div class="lang-item-content">
                  <span class="lang-flag">🇺🇸</span>
                  <div class="lang-item-info">
                    <span class="lang-item-name">English</span>
                    <span class="lang-item-desc">United States</span>
                  </div>
                </div>
                <IconifyIconOnline
                  v-show="locale === 'en-US'"
                  class="lang-check"
                  icon="ep:check"
                />
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    </template>

    <!-- 表单内容 -->
    <template #form>
      <!-- 登录表单 -->
      <BaseLayout
        v-if="loginType == 1 || loginType == 2"
        :accountType="loginType"
        :defaultSetting="defaultSetting"
        :ssoSetting="ssoSetting"
        class="login-form-component"
      />

      <!-- 登录类型选择 -->
      <div v-if="openSwitchLoginType" class="login-type-selector">
              <div class="selector-title">选择登录方式</div>
              <div class="selector-options">
                <div
                  v-if="defaultSetting.OpenBaseLogin"
                  class="option-card"
                  :class="{ active: loginType == 1 }"
                  @click="handleChangeLoginType(1)"
                >
                  <div class="option-icon-wrapper">
                    <el-icon class="option-icon">
                      <component :is="useRenderIcon('ep:user')" />
                    </el-icon>
                  </div>
                  <div class="option-content">
                    <div class="option-title">普通登录</div>
                    <div class="option-desc">账号/手机号登录</div>
                  </div>
                </div>

                <div
                  v-if="defaultSetting.OpenTenantLogin"
                  class="option-card"
                  :class="{ active: loginType == 2 }"
                  @click="handleChangeLoginType(2)"
                >
                  <div class="option-icon-wrapper">
                    <el-icon class="option-icon">
                      <component :is="useRenderIcon('ep:office-building')" />
                    </el-icon>
                  </div>
                  <div class="option-content">
                    <div class="option-title">租户登录</div>
                    <div class="option-desc">租户账号/手机号登录</div>
                  </div>
          </div>
        </div>
      </div>
    </template>
  </component>
</template>

<style lang="scss" scoped>
// 现代化登录页面 - 完全适配 Element Plus 主题系统
.modern-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color-page);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 动态背景容器
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .login-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(1px);
    transition: all 0.3s ease;
  }

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      var(--el-bg-color-page) 50%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    backdrop-filter: blur(8px);
  }

  .background-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(
        circle at 20% 80%,
        var(--el-color-primary-light-9) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        var(--el-color-primary-light-8) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 40%,
        var(--el-color-primary-light-9) 0%,
        transparent 50%
      );
    animation: float 20s ease-in-out infinite;
  }
}

// 现代化工具栏
.modern-toolbar {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  padding: 24px;

  .toolbar-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 50px;
    backdrop-filter: blur(20px);
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: var(--el-box-shadow);
      transform: translateY(-2px);
    }
  }

  .toolbar-spacer {
    flex: 1;
  }

  // 环境标识
  .env-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
    letter-spacing: 0.5px;

    svg {
      font-size: 14px;
    }

    &.env-dev {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      animation: envBadgePulse 2s ease-in-out infinite;
    }

    &.env-test {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
  }

  @keyframes envBadgePulse {
    0%,
    100% {
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    }
    50% {
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
    }
  }

  .theme-switch-container {
    .modern-theme-switch {
      :deep(.el-switch__core) {
        border: 2px solid var(--el-border-color-light);
        background: var(--el-fill-color);
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-5);
        }
      }

      :deep(.el-switch__action) {
        background: var(--el-bg-color-overlay);
        box-shadow: var(--el-box-shadow-lighter);
      }
    }
  }

  // 语言切换触发器 - 统一为头像风格
  .lang-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px 6px 6px;
    border-radius: 28px;
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    /* 光泽效果 */
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s ease;
    }

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-fill-color-light) 0%,
        var(--el-fill-color) 100%
      );
      border-color: rgba(var(--el-color-primary-rgb), 0.3);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
      transform: translateY(-1px);

      &::before {
        left: 100%;
      }
    }

    .lang-icon-wrapper {
      position: relative;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

      .lang-main-icon {
        font-size: 16px;
        color: #fff;
      }
    }

    .lang-info {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }

    .lang-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      letter-spacing: 0.2px;
    }

    .lang-role {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }

    .dropdown-arrow-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--el-fill-color) 0%,
        var(--el-fill-color-light) 100%
      );
      margin-left: 4px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dropdown-arrow {
      font-size: 14px;
      color: var(--el-text-color-placeholder);
      transition: all 0.3s ease;
    }
  }

  &:focus-within .dropdown-arrow-wrapper {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-8) 0%,
      var(--el-color-primary-light-9) 100%
    );
    box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);

    .dropdown-arrow {
      color: var(--el-color-primary);
    }
  }
}
// 主要内容容器
.login-main-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 40px 20px;
}

// 现代化内容盒子
.modern-content-box {
  display: flex;
  width: 100%;
  max-width: 1400px;
  min-height: 600px;
  margin: 0 auto;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 24px;
  box-shadow: var(--el-box-shadow-dark);
  //backdrop-filter: blur(20px);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow:
      0 32px 64px rgba(0, 0, 0, 0.1),
      0 16px 32px rgba(0, 0, 0, 0.05);
    transform: translateY(-4px);
  }
}

// 插图区域
.illustration-section {
  flex: 1.2;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-extra-light) 0%,
    var(--el-fill-color-lighter) 50%,
    var(--el-fill-color-light) 100%
  );
  position: relative;
  overflow: hidden;

  .illustration-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .main-illustration {
      max-width: 100%;
      max-height: 100%;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1));
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.02) translateY(-8px);
        filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.15));
      }
    }
  }

  .illustration-decoration {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      var(--el-color-primary-light-9) 0%,
      transparent 60%
    );
    animation: rotate 30s linear infinite;
    z-index: 1;
  }

  // 添加装饰性元素
  &::before {
    content: "";
    position: absolute;
    top: 20%;
    right: 20%;
    width: 100px;
    height: 100px;
    background: var(--el-color-primary-light-8);
    border-radius: 50%;
    opacity: 0.3;
    animation: float 6s ease-in-out infinite;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 30%;
    left: 15%;
    width: 60px;
    height: 60px;
    background: var(--el-color-primary-light-7);
    border-radius: 50%;
    opacity: 0.4;
    animation: float 8s ease-in-out infinite reverse;
  }
}

// 表单区域 - 优化间距
.form-section {
  flex: 1;
  padding: 32px 32px; // 从48px 40px减少到32px 32px
  background: var(--el-bg-color-overlay);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  .form-wrapper {
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 2;

    .login-form-component {
      margin-bottom: 20px; // 从32px减少到20px
    }
  }

  // 添加微妙的背景装饰
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 0%,
      var(--el-color-primary-light-9) 50%,
      transparent 100%
    );
    opacity: 0.3;
    z-index: 1;
  }
}

// 登录类型选择器 - 优化间距
.login-type-selector {
  width: 100%;

  .selector-title {
    font-size: 15px; // 从16px减少到15px
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-align: center;
    margin-bottom: 16px; // 从24px减少到16px
    text-align: left;
    writing-mode: horizontal-tb;
  }

  .selector-options {
    display: flex;
    flex-direction: row;
    gap: 12px; // 从16px减少到12px

    .option-card {
      display: flex;
      align-items: center;
      padding: 16px; // 从20px减少到16px
      background: var(--el-fill-color-extra-light);
      border: 2px solid var(--el-border-color-lighter);
      border-radius: 14px; // 从16px减少到14px
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      // 添加微妙的悬停效果
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          var(--el-color-primary-light-9),
          transparent
        );
        transition: left 0.5s ease;
      }

      &:hover {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-7);
        transform: translateY(-2px) scale(1.02);
        box-shadow: var(--el-box-shadow-light);

        &::before {
          left: 100%;
        }

        .option-icon-wrapper {
          background: var(--el-color-primary-light-8);
          transform: scale(1.1);
        }

        .option-icon {
          color: var(--el-color-primary);
        }
      }

      &.active {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        box-shadow:
          0 0 0 4px var(--el-color-primary-light-8),
          var(--el-box-shadow-light);

        .option-icon-wrapper {
          background: var(--el-color-primary);
        }

        .option-icon {
          color: var(--el-bg-color);
        }

        .option-title {
          color: var(--el-color-primary);
        }
      }

      .option-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px; // 从48px减少到40px
        height: 40px;
        background: var(--el-fill-color-light);
        border-radius: 10px; // 从12px减少到10px
        margin-right: 14px; // 从16px减少到14px
        transition: all 0.3s ease;

        .option-icon {
          font-size: 20px; // 从24px减少到20px
          color: var(--el-text-color-regular);
          transition: all 0.3s ease;
        }
      }

      .option-content {
        flex: 1;

        .option-title {
          font-size: 15px; // 从16px减少到15px
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 3px; // 从4px减少到3px
          text-align: left;
          writing-mode: horizontal-tb;
          transition: all 0.3s ease;
        }

        .option-desc {
          font-size: 13px; // 从14px减少到13px
          color: var(--el-text-color-regular);
          text-align: left;
          writing-mode: horizontal-tb;
        }
      }
    }
  }
}

// 动画关键帧
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .modern-content-box {
    max-width: 1000px;

    .illustration-section {
      padding: 32px;
    }

    .form-section {
      padding: 32px 24px;
    }
  }
}

@media (max-width: 968px) {
  .modern-content-box {
    flex-direction: column;
    max-width: 600px;

    .illustration-section {
      flex: none;
      min-height: 300px;
      padding: 24px;

      .main-illustration {
        max-height: 200px;
      }
    }

    .form-section {
      flex: none;
      padding: 32px 24px;

      .form-wrapper {
        max-width: 100%;
      }
    }
  }

  .modern-toolbar {
    padding: 16px;

    .toolbar-content {
      padding: 8px 16px;
      gap: 12px;
    }
  }

  .login-type-selector {
    .selector-options {
      .option-card {
        padding: 16px;

        .option-icon-wrapper {
          width: 40px;
          height: 40px;
          margin-right: 12px;

          .option-icon {
            font-size: 20px;
          }
        }

        .option-content {
          .option-title {
            font-size: 15px;
          }

          .option-desc {
            font-size: 13px;
          }
        }
      }
    }
  }
}

@media (max-width: 640px) {
  .login-main-container {
    padding: 20px 16px;
  }

  .modern-content-box {
    border-radius: 16px;

    .illustration-section {
      min-height: 200px;
      padding: 16px;

      .main-illustration {
        max-height: 150px;
      }
    }

    .form-section {
      padding: 20px 16px; // 从24px减少到20px
    }
  }

  .modern-toolbar {
    padding: 12px;

    .toolbar-content {
      padding: 6px 12px;
      gap: 8px;
    }
  }

  .login-type-selector {
    .selector-options {
      gap: 10px; // 从12px减少到10px

      .option-card {
        padding: 10px; // 从12px减少到10px
        border-radius: 10px; // 从12px减少到10px
      }
    }
  }
}
</style>

<style lang="scss">
/**
 * 语言下拉菜单全局样式
 */
.lang-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 20px;
    border: none;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 240px;
    backdrop-filter: blur(20px);
  }
}

.lang-menu {
  padding: 0 !important;

  /**
   * 菜单头部样式
   */
  .lang-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
  }

  /**
   * 语言项目样式
   */
  .lang-item {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding: 24px !important;
    margin: 8px 10px;
    margin-bottom: 8px;
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      &::before {
        opacity: 1;
      }

      .lang-flag {
        transform: scale(1.1);
      }
    }

    &.active {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.12) 0%,
        rgba(var(--el-color-primary-rgb), 0.06) 100%
      );
      border: 1px solid rgba(var(--el-color-primary-rgb), 0.2);

      .lang-item-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }

      .lang-check {
        animation: check-pop 0.3s ease;
      }
    }

    .lang-item-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .lang-flag {
      font-size: 28px;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .lang-item-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .lang-item-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .lang-item-desc {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }

    .lang-check {
      font-size: 20px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    }
  }
}

/**
 * 动画定义
 */
@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/**
 * 深色模式适配
 */
html.dark {
  .lang-dropdown-popper .el-dropdown-menu {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  }

  .lang-menu .lang-header {
    background: var(--el-fill-color-dark);
  }
}
</style>
