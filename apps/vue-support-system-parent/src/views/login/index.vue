<script setup>
import { useI18n } from "vue-i18n";
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { getParameter, message, uu3 } from "@repo/utils";
import { loginRules } from "./utils/rule";
import { useDataThemeChange, useLayout, useNav, useTranslationLang } from "@layout/default";
import { Md5 } from "ts-md5";
import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw } from "vue";
import { fetchDefaultSetting, fetchVerifyCode, getTopMenu, initRouter, useUserStoreHook } from "@repo/core";
import { $t, setConfig, transformI18n } from "@repo/config";
import { avatar, bg, illustration } from "./utils/static";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ThirdParty from "./components/thirdParty.vue";

import dayIcon from "@repo/assets/svg/day.svg?component";
import darkIcon from "@repo/assets/svg/dark.svg?component";
import globalization from "@repo/assets/svg/globalization.svg?component";
import Lock from "@iconify-icons/ri/lock-fill";
import Check from "@iconify-icons/ep/check";
import User from "@iconify-icons/ri/user-3-fill";
import Vcode from "vue3-puzzle-vcode";

defineOptions({
  name: "Login"
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

const defaultSetting = reactive({
  openVerifyCode: false,
  openVcode: false,
  systemName: ""
});
const ssoSetting = reactive({
  gitee: false
});
const loadDefaultSetting = async () => {
  const { data } = await fetchDefaultSetting();
  data.forEach(element => {
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
      if (element.sysSettingName === "SlidingBlockOpen") {
        defaultSetting.openVcode = element.sysSettingValue === "true";
        return;
      } else if (element.sysSettingGroup === "sso") {
        const _val = element.sysSettingValue === "true";
        ssoSetting[element.sysSettingName] = _val;
      }
    }
  });

  if (defaultSetting.openVerifyCode) {
    await getVerifyCode();
  }
};

const isShowThirdPartyValue = computed(() => Object.keys(ssoSetting).some(item => ssoSetting[item]));

onBeforeMount(async () => {
  await loadDefaultSetting();
});

const defaultVerifyCode = ref({
  verifyCodeKey: "",
  verifyCodeBase64: "",
  verifyCodeUlid: ""
});
const getVerifyCode = async () => {
  const { data } = await fetchVerifyCode();
  Object.assign(defaultVerifyCode.value, data);
};

const ruleForm = reactive({
  username: "sa",
  password: "admin@123#456",
  verifyCode: ""
});

const openVcode = ref(false);

const currentFormEl = ref({});
const onLoginCode = async formEl => {
  await nextTick();
  openVcode.value = true;
  currentFormEl.value = formEl;
};
const onLogin = async formEl => {
  vcodeClose();
  if (!formEl) {
    return;
  }

  if (defaultSetting.openVerifyCode) {
    if (defaultVerifyCode.value.verifyCodeKey != ruleForm.verifyCode) {
      message(t("login.pureVerifyCodeError"), { type: "error" });
      return;
    }
  }
  await formEl.validate((valid, fields) => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: Md5.hashStr(ruleForm.password),
          verifyCodeKey: ruleForm.verifyCode,
          verifyCodeUlid: defaultVerifyCode.value.verifyCodeUlid,
          loginType: "SYSTEM"
        })
        .then(res => {
          // 获取后端路由
          return initRouter()
            .then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch(error => {
              useUserStoreHook().logOut();
            });
        })
        .finally(() => {
          loading.value = false;
          vcodeRef.value?.reset();
        });
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
  vcodeState.value = !0;
  onLogin(currentFormEl.value);
  currentFormEl.value = null;
  vcodeClose();
}

function onFail() {
  vcodeState.value = !1;
  vcodeRef.value?.reset();
}

onMounted(() => {
  window.document.addEventListener("keypress", onkeypress);
  if (redirectParam) {
    const info = uu3(redirectParam);
    if (info) {
      useUserStoreHook()
        .load(info)
        .then(res => {
          // 获取后端路由
          return initRouter()
            .then(() => {
              const url = getTopMenu(true).path;
              router.push(url, { query: {} }).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch(error => {
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
  <el-dialog v-model="openVcode" width="420px" draggable title="校验" @close="vcodeClose">
    <el-row v-if="defaultSetting.openVcode" :gutter="12">
      <el-col>
        <Motion :delay="150">
          <div class="bg-[rgba(15,23,42,0.2)] p-6 w-[360px]">
            <Vcode ref="vcode" :show="defaultSetting.openVcode" type="inside" :puzzleScale="0.8" @fail="onFail" @success="onSuccess" />
          </div>
        </Motion>
      </el-col>
    </el-row>
  </el-dialog>
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
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'zh')" :class="['dark:!text-white', getDropdownItemClass(locale, 'zh')]" @click="translationCh">
              <IconifyIconOffline v-show="locale === 'zh'" class="check-zh" :icon="Check" />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item :style="getDropdownItemStyle(locale, 'en')" :class="['dark:!text-white', getDropdownItemClass(locale, 'en')]" @click="translationEn">
              <span v-show="locale === 'en'" class="check-en">
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
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-none">{{ title }}</h2>
          </Motion>

          <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large">
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: transformI18n($t('login.pureUsernameReg')),
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input v-model="ruleForm.username" clearable :placeholder="t('login.pureUsername')" :prefix-icon="useRenderIcon(User)" />
              </el-form-item>
            </Motion>
            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input v-model="ruleForm.password" clearable show-password :placeholder="t('login.purePassword')" :prefix-icon="useRenderIcon(Lock)" />
              </el-form-item>
            </Motion>

            <el-row v-if="defaultSetting.openVerifyCode" :gutter="12">
              <el-col :span="16">
                <Motion :delay="150">
                  <el-form-item prop="verifyCode">
                    <el-input v-model="ruleForm.verifyCode" clearable show-password :placeholder="t('login.verifyCode')" :prefix-icon="useRenderIcon(Lock)" />
                  </el-form-item>
                </Motion>
              </el-col>
              <el-col :span="8">
                <el-image :src="defaultVerifyCode.verifyCodeBase64" fit="fill" :lazy="true" @click="getVerifyCode" />
              </el-col>
            </el-row>

            <Motion v-if="!defaultSetting.openVcode" :delay="250">
              <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
                {{ t("login.pureLogin") }}
              </el-button>
            </Motion>
            <Motion v-else :delay="250">
              <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLoginCode(ruleFormRef)">
                {{ t("login.pureLogin") }}
              </el-button>
            </Motion>
          </el-form>

          <Motion v-if="isShowThirdPartyValue" :delay="300">
            <ThirdPartyLayout :data="ssoSetting" />
          </Motion>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@repo/assets/style/layout/default/login.css");
</style>

<style lang="scss" scoped>
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
