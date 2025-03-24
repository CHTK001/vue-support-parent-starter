<script setup>
import { useDataThemeChange, useLayout, useNav, useTranslationLang } from "@layout/default";
import { getConfig, setConfig } from "@repo/config";
import { fetchDefaultSetting, fetchVerifyCode } from "@repo/core";
import { getParameter } from "@repo/utils";
import { computed, defineAsyncComponent, markRaw, onBeforeMount, reactive, ref, shallowRef, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ThirdParty from "./components/thirdParty.vue";
import { bg, illustration } from "./utils/static";

import Check from "@iconify-icons/ep/check";
import darkIcon from "@repo/assets/svg/dark.svg?component";
import dayIcon from "@repo/assets/svg/day.svg?component";
import globalization from "@repo/assets/svg/globalization.svg?component";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

defineOptions({
  name: "Login",
});
const BaseLayout = defineAsyncComponent(() => import("./layout/base.vue"));
const redirectParam = getParameter("redirectParam");
const ThirdPartyLayout = markRaw(ThirdParty);
const router = useRouter();
const loading = ref(false);
const loginType = shallowRef(1);
const ruleFormRef = ref();
const { initStorage } = useLayout();
initStorage();

const { t } = useI18n();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const defaultSetting = reactive({
  openVerifyCode: false,
  openVcode: false,
  checkTotpOpen: false,
  systemName: "",
});
const ssoSetting = reactive({
  gitee: false,
});
const loadDefaultSetting = async () => {
  const { data } = await fetchDefaultSetting();
  data.forEach((element) => {
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
      } else if (element.sysSettingGroup === "sso") {
        const _val = element.sysSettingValue === "true";
        ssoSetting[element.sysSettingName] = _val;
      }

      defaultSetting[element.sysSettingName] = element.sysSettingValue === "true";
    }
  });

  if (defaultSetting.openVerifyCode) {
    await getVerifyCode();
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
</script>

<template>
  <div class="login-page">
    <img :src="bg" class="login-bg" />
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-switch v-model="dataTheme" inline-prompt :active-icon="dayIcon" :inactive-icon="darkIcon" @change="dataThemeChange" />
      <div class="theme-switch-wrapper">
        <label class="theme-switch">
          <!-- 保持原有主题切换内容 -->
        </label>
      </div>
      <el-dropdown trigger="click" class="lang-dropdown">
        <globalization class="hover:text-primary hover:!bg-[transparent] w-[20px] h-[20px] ml-1.5 cursor-pointer outline-none duration-300" />
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'zh-CN')" :class="['dark:!text-white', getDropdownItemClass(locale, 'zh-CN')]" @click="translationCh">
              <IconifyIconOffline v-show="locale === 'zh-CN'" class="check-zh" :icon="Check" />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'en-US')" :class="['dark:!text-white', getDropdownItemClass(locale, 'en-US')]" @click="translationEn">
              <span v-show="locale === 'en-US'" class="check-en">
                <IconifyIconOffline :icon="Check" />
              </span>
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="content-box">
        <div class="illustration">
          <component :is="toRaw(illustration)" />
        </div>
        <div class="form-container">
          <BaseLayout v-if="loginType == 1 || loginType == 2" :accountType="loginType" :defaultSetting="defaultSetting" :ssoSetting="ssoSetting" />
          <div class="login-options">
            <div v-if="defaultSetting.OpenBaseLogin" class="option-item" :class="{ active: loginType == 1 }" @click="handleChangeLoginType(1)">
              <el-icon class="option-icon">
                <component :is="useRenderIcon('bi:people')" />
              </el-icon>
              <span>账号/手机</span>
            </div>
            <div v-if="defaultSetting.OpenTenantLogin" class="option-item" :class="{ active: loginType == 2 }" @click="handleChangeLoginType(2)">
              <el-icon class="option-icon">
                <component :is="useRenderIcon('bi:people')" />
              </el-icon>
              <span>租户账号/手机</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lang-dropdown {
  :deep(.el-dropdown-menu) {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 8px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.08),
      0 6px 12px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    .dark & {
      background: rgba(28, 28, 35, 0.95);
      border-color: rgba(255, 255, 255, 0.1);

      .el-dropdown-menu__item {
        color: rgba(255, 255, 255, 0.85);

        &:hover {
          background: rgba(var(--el-color-primary-rgb), 0.15);
        }
      }
    }
    .el-dropdown-menu__item {
      padding: 10px 16px;
      border-radius: 8px;
      transition: all 0.3s ease;
      margin: 2px 0;
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.1);
        color: var(--el-color-primary);
      }

      .check-zh,
      .check-en {
        font-size: 16px;
        color: var(--el-color-primary);
      }
    }
  }
}

.lang-icon {
  width: 22px;
  height: 22px;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.1);
    color: var(--el-color-primary);
    transform: scale(1.05);
  }
}
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.toolbar {
  position: fixed;
  right: 2rem;
  top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 10;
}

.login-main-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.content-box {
  display: flex;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(15px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  &.dark {
    background: rgba(28, 28, 35, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.illustration {
  flex: 1.2;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(248, 249, 250, 0.7), rgba(255, 255, 255, 0.9));
  position: relative;
  overflow: hidden;
  .dark & {
    background: linear-gradient(135deg, rgba(28, 28, 35, 0.7), rgba(38, 38, 45, 0.9));

    &::before {
      background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.15) 0%, transparent 60%);
    }
  }
  &::before {
    content: "";
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.1) 0%, transparent 60%);
    top: -50%;
    left: -50%;
    animation: rotate 30s linear infinite;
  }
}

.form-container {
  flex: 1;
  padding: 3.5rem 3rem;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  .dark & {
    background: rgba(28, 28, 35, 0.95);

    &::before {
      background: linear-gradient(45deg, transparent, rgba(var(--el-color-primary-rgb), 0.08), transparent);
    }
  }
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent, rgba(var(--el-color-primary-rgb), 0.03), transparent);
  }
}

.login-options {
  margin-top: 2.5rem;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 2.5rem;

  .option-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.2rem;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    .dark & {
      color: rgba(255, 255, 255, 0.85);

      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.15);
        border-color: rgba(var(--el-color-primary-rgb), 0.2);
      }

      &.active {
        background: rgba(var(--el-color-primary-rgb), 0.2);
        border-color: rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.05);
      transform: translateY(-3px);
      border-color: rgba(var(--el-color-primary-rgb), 0.1);
    }

    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
    }

    .option-icon {
      font-size: 28px;
      margin-bottom: 0.8rem;
      transition: transform 0.3s ease;
    }

    span {
      font-size: 15px;
      font-weight: 500;
      white-space: nowrap;
    }
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

.toolbar {
  position: fixed;
  right: 2.5rem;
  top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  z-index: 10;
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  .dark & {
    background: rgba(28, 28, 35, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.lang-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary);
    transform: scale(1.1);
  }
}
</style>
