<script setup>
import { useDataThemeChange, useLayout, useNav, useTranslationLang } from "@layout/default";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import TypeIt from "@repo/components/ReTypeit";
import ScCode from "@repo/components/ScCode/index.vue";
import { $t, getConfig, setConfig, transformI18n } from "@repo/config";
import { fetchDefaultSetting, fetchVerifyCode, getTopMenu, initRouter, useUserStoreHook } from "@repo/core";
import { getParameter, message, uu3 } from "@repo/utils";
import $ from "jquery";
import { Md5 } from "ts-md5";
import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ThirdParty from "../components/thirdParty.vue";
import Motion from "../utils/motion";
import { loginRules } from "../utils/rule";
import { avatar } from "../utils/static";

import Lock from "@iconify-icons/ri/lock-fill";
import User from "@iconify-icons/ri/user-3-fill";
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
const isShowThirdPartyValue = computed(() => Object.keys(props.ssoSetting).some((item) => props.ssoSetting[item]));

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
  tenantId: "",
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

  if (props.defaultSetting.openVerifyCode) {
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
          loginType: "WEB",
          tenantId: ruleForm.tenantId,
          accountType: props.accountType == 2 ? "tenant" : null,
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
      <el-row v-if="props.defaultSetting.openVcode" :gutter="12">
        <el-col>
          <Motion :delay="150">
            <div class="bg-[rgba(15,23,42,0.2)] p-6 w-[360px]">
              <Vcode ref="vcodeRef" :show="props.defaultSetting.openVcode" type="inside" :puzzleScale="0.8" @fail="onFail" @success="onSuccess" />
            </div>
          </Motion>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog style="border-radius: 12px !important" v-model="openToptcode" width="380px" :close-on-click-modal="false" draggable title="验证码" @close="vcodeToptClose">
      <Motion :delay="150">
        <div></div>
        <ScCode ref="scCodeRef" @onComplete="handleTotpComplete" @onChange="handleTotpChange" />
      </Motion>
    </el-dialog>
    <div>
      <div class="login-form">
        <avatar class="avatar filter-bolin" @mouseover="handleTimeline" />
        <Motion>
          <h2 class="outline-none"><TypeIt :options="{ strings: [title], cursor: false, speed: 100 }" /></h2>
        </Motion>

        <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large">
          <Motion :delay="150" v-if="defaultSetting.OpenTenantLogin && defaultSetting.OpenTenantLoginRequire && props.accountType == 2">
            <el-form-item
              prop="tenantId"
              :rules="[
                {
                  required: true,
                  message: transformI18n($t('login.pureTenantReg')),
                  trigger: 'blur',
                },
              ]"
            >
              <el-input v-model="ruleForm.tenantId" clearable :placeholder="t('login.pureTenant')" :prefix-icon="useRenderIcon(Lock)" />
            </el-form-item>
          </Motion>
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

          <el-row v-if="props.defaultSetting.openVerifyCode" :gutter="12">
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

          <Motion v-if="props.defaultSetting.openVerifyCode" :delay="250">
            <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
              {{ t("login.pureLogin") }}
            </el-button>
          </Motion>
          <Motion v-else-if="props.defaultSetting.openVcode" :delay="250">
            <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLoginCode(ruleFormRef)">
              {{ t("login.pureLogin") }}
            </el-button>
          </Motion>
          <Motion v-else-if="props.defaultSetting.checkTotpOpen" :delay="250">
            <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLoginToptCode(ruleFormRef)">
              {{ t("login.pureLogin") }}
            </el-button>
          </Motion>
          <Motion v-else :delay="250">
            <el-button class="w-full mt-4" size="default" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
              {{ t("login.pureLogin") }}
            </el-button>
          </Motion>
        </el-form>

        <Motion v-if="isShowThirdPartyValue" :delay="300">
          <ThirdPartyLayout :data="props.ssoSetting" />
        </Motion>
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
