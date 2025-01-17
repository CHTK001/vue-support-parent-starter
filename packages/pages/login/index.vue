<script setup>
import { useI18n } from "vue-i18n";
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { getParameter, message, uu3 } from "@repo/utils";
import { loginRules } from "./utils/rule";
import ScCode from "@repo/components/ScCode/index.vue";
import { useDataThemeChange, useLayout, useNav, useTranslationLang } from "@layout/default";
import { Md5 } from "ts-md5";
import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw } from "vue";
import { fetchDefaultSetting, fetchVerifyCode, getTopMenu, initRouter, useUserStoreHook } from "@repo/core";
import { $t, setConfig, transformI18n } from "@repo/config";
import { avatar, bg, illustration } from "./utils/static";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ThirdParty from "./components/thirdParty.vue";
import TypeIt from "@repo/components/ReTypeit";
import $ from "jquery";

import { gsap } from "gsap";
import dayIcon from "@repo/assets/svg/day.svg?component";
import darkIcon from "@repo/assets/svg/dark.svg?component";
import globalization from "@repo/assets/svg/globalization.svg?component";
import Lock from "@iconify-icons/ri/lock-fill";
import Check from "@iconify-icons/ep/check";
import User from "@iconify-icons/ri/user-3-fill";
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
    }
  });

  if (defaultSetting.openVerifyCode) {
    await getVerifyCode();
  }
};

const isShowThirdPartyValue = computed(() => Object.keys(ssoSetting).some((item) => ssoSetting[item]));

onBeforeMount(async () => {
  await loadDefaultSetting();
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
  username: "sa",
  password: "admin@123#456",
  verifyCode: "",
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
      console.log(config.freq);
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
  if (!formEl) {
    return;
  }

  if (defaultSetting.openVerifyCode) {
    if (defaultVerifyCode.value.verifyCodeKey?.toLowerCase() != ruleForm.verifyCode?.toLowerCase()) {
      message(t("login.pureVerifyCodeError"), { type: "error" });
      getVerifyCode();
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
          loginType: "SYSTEM",
        })
        .then((res) => {
          // 获取后端路由
          return initRouter()
            .then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message(t("login.pureLoginSuccess"), { type: "success" });
              });
            })
            .catch((error) => {
              useUserStoreHook().logOut();
            });
        })
        .finally(() => {
          loading.value = false;
          ruleForm.verifyCode = null;
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
  vcodeRef.value?.reset();
  vcodeClose();
}

function onFail() {
  vcodeState.value = !1;
  vcodeRef.value?.reset();
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
    <el-dialog v-model="openVcode" width="420px" draggable title="校验" @close="vcodeClose">
      <el-row v-if="defaultSetting.openVcode" :gutter="12">
        <el-col>
          <Motion :delay="150">
            <div class="bg-[rgba(15,23,42,0.2)] p-6 w-[360px]">
              <Vcode ref="vcodeRef" :show="defaultSetting.openVcode" type="inside" :puzzleScale="0.8" @fail="onFail" @success="onSuccess" />
            </div>
          </Motion>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog style="border-radius: 12px !important" v-model="openToptcode" width="380px" :close-on-click-modal="false" draggable title="验证码" @close="vcodeToptClose">
      <Motion :delay="150">
        <div>
          <ScCode ref="scCodeRef" @onComplete="handleTotpComplete" @onChange="handleTotpChange" />
        </div>
      </Motion>
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
            <avatar class="avatar filter-bolin" @mouseover="handleTimeline" />
            <Motion>
              <h2 class="outline-none"><TypeIt :options="{ strings: [title], cursor: false, speed: 100 }" /></h2>
            </Motion>

            <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large">
              <Motion :delay="100">
                <el-form-item
                  :rules="[
                    {
                      required: true,
                      message: transformI18n($t('login.pureUsernameReg')),
                      trigger: 'blur',
                    },
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

              <Motion v-if="defaultSetting.openVerifyCode" :delay="250">
                <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
                  {{ t("login.pureLogin") }}
                </el-button>
              </Motion>
              <Motion v-else-if="defaultSetting.openVcode" :delay="250">
                <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLoginCode(ruleFormRef)">
                  {{ t("login.pureLogin") }}
                </el-button>
              </Motion>
              <Motion v-else :delay="250">
                <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLoginToptCode(ruleFormRef)">
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
  </div>
</template>

<style scoped>
@import url("@repo/assets/style/layout/default/login.css");
</style>

<style lang="scss" scoped>
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
