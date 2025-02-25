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

      if (element.sysSettingName === "CheckTotpOpen") {
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
  <div>
    <div class="select-none">
      <img :src="bg" class="wave" />
      <div class="flex-c absolute right-5 top-3">
        <!-- 主题 -->
        <el-switch v-model="dataTheme" inline-prompt :active-icon="dayIcon" :inactive-icon="darkIcon" @change="dataThemeChange" />
        <!-- 国际化 -->
        <el-dropdown trigger="click">
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
      <div class="login-container">
        <div class="img">
          <component :is="toRaw(illustration)" />
        </div>
        <div class="login-box">
          <div class="login-form">
            <BaseLayout v-if="loginType == 1 || loginType == 2" :accountType="loginType" :defaultSetting="defaultSetting" :ssoSetting="ssoSetting"></BaseLayout>
            <div class="login-wrapper-operation__options !h-[100px]">
              <div v-if="defaultSetting.OpenBaseLogin" class="login-option-item" :class="{ active: loginType == 1 }" @click="handleChangeLoginType(1)">
                <div class="flex justify-center option-icon">
                  <el-icon>
                    <component :is="useRenderIcon('bi:people')" />
                  </el-icon>
                </div>
                <p class="flex justify-center">账号/手机</p>
              </div>
              <div v-if="defaultSetting.OpenTenantLogin" class="login-option-item" :class="{ active: loginType == 2 }" @click="handleChangeLoginType(2)">
                <div class="flex justify-center option-icon">
                  <el-icon>
                    <component :is="useRenderIcon('bi:people')" />
                  </el-icon>
                </div>
                <p class="flex justify-center">租户账号/手机</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@repo/assets/style/layout/default/login.css");
</style>

<style lang="scss" scoped>
.login-wrapper-operation__options {
  width: 336px;
  margin-top: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 24px;
  .login-option-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    width: 32px;
  }
  .login-option-item p {
    margin-top: 12px;
    color: #7c7d80;
    font-size: 12px;
    line-height: 16px;
    transition: all 0.1s;
    white-space: nowrap;
  }
  .login-option-item .option-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    background-color: #fff;
    align-items: center;
    justify-content: center;
    border: 1px solid #f2f3f5;
    transition: all 0.1s;
  }
  .login-option-item.active .option-icon {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    color: red;
  }
  .login-option-item.active p {
    color: #1a1a1a;
  }
}
.flex-c {
  display: flex;
}

.absolute {
  position: absolute;
}

.right-5 {
  right: 5em;
}
.top-3 {
  top: 3px;
}
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}
</style>
