<template>
  <div class="login-page w-screen h-screen overflow-hidden">
    <el-row class="h-100%">
      <!-- 登录工具栏 -->
      <div class="flex flex-items-center pos-absolute top-8px right-8px z-10 h-40px p-y-2px p-x-12px bg-#F4F4F5 dark:bg-#141414 border-1px border-solid border-#E4E7ED dark:border-#4C4D4F rounded-20px shadow-[0_4px_12px_rgb(0_0_0_/_15%)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all transition-300ms transition-ease">
        <KoiThemeColor></KoiThemeColor>
        <KoiLanguage></KoiLanguage>
        <KoiDark></KoiDark>
      </div>

      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex flex-items-center flex-justify-center">
        <div class="login-background w-100% h-100%">
          <!-- 动态装饰光斑 -->
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>

          <!-- 毛玻璃覆盖层 -->
          <div class="glass-overlay"></div>

          <!-- 内容层 -->
          <div class="pos-absolute text-center select-none transition-all transition-ease transition-500 content-layer">
            <div class="brand-badge flex flex-items-center flex-justify-center gap-10px m-b-32px <md:hidden">
              <div class="login-logo-wrap login-logo-wrap--brand">
                <img class="login-logo" :src="logo" alt="KOI-ADMIN" />
              </div>
              <span class="brand-text text-18px font-700">KOI-ADMIN</span>
            </div>
            <el-image
              class="w-260px max-w-500px h-260px m-b-40px animate-float-picture <md:hidden <lg:h-320px <lg:max-w-400px"
              :src="science"
            />
            <div class="welcome-title text-2xl font-700 m-b-12px text-center <lg:text-xl <md:hidden">
              {{ $t("menu.login.welcome") }}
            </div>
            <div class="welcome-subtitle text-28px font-800 m-b-16px text-center <lg:text-22px <md:hidden">
              {{ $t("menu.login.title") || "KOI-ADMIN" }}
            </div>
            <div class="welcome-desc text-16px font-400 text-center max-w-420px mx-auto leading-relaxed <md:hidden">
              {{ $t("menu.login.description") }}
            </div>
            <div class="feature-tags flex flex-justify-center gap-12px m-t-32px flex-wrap <md:hidden">
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Promotion /></el-icon>
                高效管理
              </span>
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Brush /></el-icon>
                现代设计
              </span>
              <span class="feature-tag">
                <el-icon :size="14" class="feature-tag-icon"><Lock /></el-icon>
                安全可靠
              </span>
            </div>
          </div>

          <!-- 备案号 -->
          <div class="bei-an-hao select-none <md:hidden">
            <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank"
              >{{ $t("menu.login.beiAnHao") }}：豫ICP备2022022094号-1</a
            >
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
          <!-- 移动端 Logo -->
          <div class="login-mobile-brand md:hidden">
            <div class="login-logo-wrap login-logo-wrap--mobile">
              <img class="login-logo" :src="logo" alt="KOI-ADMIN" />
            </div>
            <div class="font-600 text-xl">{{ $t("menu.login.title") || "KOI-ADMIN" }}</div>
          </div>

          <div class="form-header text-center m-b-32px">
            <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("menu.login.account") }}</h3>
            <p class="text-14px text-[--el-text-color-regular]">
              {{ $t("menu.login.form.loginName") }} / {{ $t("menu.login.form.password") }}
            </p>
          </div>

          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form w-300px">
            <el-form-item prop="loginName">
              <el-input
                v-model="loginForm.loginName"
                type="text"
                :placeholder="$t('menu.login.form.loginName')"
                size="large"
                class="login-input"
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
                :placeholder="$t('menu.login.form.password')"
                show-password
                size="large"
                class="login-input"
              >
                <template #prefix>
                  <el-icon :size="16"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="securityCode">
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
              </div>
            </el-form-item>

            <el-form-item class="m-b-0">
              <el-button
                type="primary"
                class="login-btn w-100% tracking-4px"
                size="large"
                :loading="loading"
                v-throttle:3000="handleKoiLogin"
              >
                {{ loading ? $t("menu.login.loading") : $t("menu.login.in") }}
              </el-button>
            </el-form-item>

            <div class="flex flex-justify-center m-t-12px">
              <el-button text size="small" @click="handleCaptcha">
                <span class="text-13px text-[--el-text-color-secondary] hover:text-[--el-color-primary] select-none transition-colors">
                  {{ $t("menu.login.picture") }}
                </span>
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 备案号 - 小屏 -->
        <div class="bei-an-hao select-none lg:hidden md:hidden">
          <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank"
            >{{ $t("menu.login.beiAnHao") }}：豫ICP备2022022094号-1</a
          >
        </div>
      </el-col>
    </el-row>

    <KoiLoading></KoiLoading>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Postcard } from "@element-plus/icons-vue";
// @ts-ignore
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";

import type { FormInstance, FormRules } from "element-plus";
import { koiMsgWarning, koiMsgError } from "@repo/theme/koi/utils/koi.ts";
import { useRouter } from "vue-router";
// import { koiLogin, getCaptcha } from "@repo/theme/koi/api/system/login/index.ts";
import authLogin from "@repo/theme/koi/assets/json/authLogin.json";
import useUserStore from "@repo/theme/koi/stores/modules/user.ts";
import useAuthStore from "@repo/theme/koi/stores/modules/auth.ts";
import useKeepAliveStore from "@repo/theme/koi/stores/modules/keepAlive.ts";
import { HOME_URL, LOGIN_URL } from "@repo/theme/koi/config/index.ts";
import { initDynamicRouter } from "@repo/theme/koi/routers/modules/dynamicRouter.ts";
import { resetRouter } from "@repo/theme/koi/routers/index.ts";
import useTabsStore from "@repo/theme/koi/stores/modules/tabs.ts";
import logo from "@repo/theme/koi/assets/images/logo/logo.webp";
import science from "@repo/theme/koi/assets/images/login/science.png";
import KoiDark from "@repo/theme/koi/layouts/components/Header/components/Dark.vue";
import KoiLoading from "./components/KoiLoading.vue";
import KoiLanguage from "@repo/theme/koi/layouts/components/Header/components/Language.vue";
import KoiThemeColor from "./components/KoiThemeColor.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const userStore = useUserStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const router = useRouter();
const loginFormRef = ref<FormInstance>();
const loading = ref(false);

interface ILoginUser {
  loginName: string;
  password: string | number;
  securityCode: string | number;
  codeKey: string | number;
  captchaPicture: any;
}

const loginForm = reactive<ILoginUser>({
  loginName: "yuadmin",
  password: "yu123456",
  securityCode: "",
  codeKey: "",
  captchaPicture: ""
});

const loginRules: any = reactive<FormRules<ILoginUser>>({
  loginName: [
    { required: true, message: t("menu.login.rules.loginName.required"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
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
    { min: 6, max: 20, message: t("menu.login.rules.password.validator1"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^(?=.*\d)(?=.*[a-zA-Z]).+$/.test(value)) {
          callback(new Error(t("menu.login.rules.password.validator2")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  // securityCode: [{ required: true, message: t("menu.login.rules.securityCode.required"), trigger: "blur" }]
});

/** 获取验证码 */
const handleCaptcha = async () => {
  userStore.setToken("");
  
  // try {
  //   const res: any = await getCaptcha();
  //   loginForm.codeKey = res.data.codeKey;
  //   loginForm.captchaPicture = res.data.captchaPicture;
  // } catch (error) {
  //   console.log(error);
  //   koiMsgError(t("msg.yzmFail"));
  // }
};

// const koiTimer = ref();
// // 验证码定时器
// const getCaptchaTimer = () => {
//   koiTimer.value = setInterval(() => {
//     // 执行刷新数据的方法
//     handleCaptcha();
//   }, 345 * 1000);
// };

// 进入页面加载管理员信息
onMounted(() => {
  // 获取验证码
  handleCaptcha();
  // 局部刷新定时器
  // getCaptchaTimer();
});

// onUnmounted(() => {
//   // 清除局部刷新定时器
//   clearInterval(koiTimer.value);
//   koiTimer.value = null;
// });

/** 登录 */
const handleKoiLogin = () => {
  if (!loginFormRef.value) return;
  (loginFormRef.value as any).validate(async (valid: any, fields: any) => {
    // @ts-ignore
    const loginName = loginForm.loginName;
    // @ts-ignore
    const password = loginForm.password;
    // @ts-ignore
    const securityCode = loginForm.securityCode;
    // @ts-ignore
    const codeKey = loginForm.codeKey;
    if (valid) {
      try {
        loading.value = true;
        authStore.$reset();
        resetRouter();
        // 1、执行登录接口
        // const res: any = await koiLogin({ loginName, password, codeKey, securityCode });
        // userStore.setToken(res.data.tokenValue);
        userStore.setToken(authLogin.data.tokenValue);

        // 2、添加动态路由 AND 用户按钮 AND 角色信息 AND 用户个人信息
        if (userStore?.token) {
          try {
            await initDynamicRouter(router);
          } catch {
            return;
          }
        } else {
          koiMsgWarning(t("msg.logIn"));
          router.replace(LOGIN_URL);
          return;
        }

        // 3、清空 tabs数据、keepAlive缓存数据
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

        // 4、等待所有响应式更新和路由注册完成
        await nextTick();

        // 5、跳转到首页（所有操作完成后）
        await router.replace(HOME_URL);
      } catch (error) {
        // 等待1秒关闭loading
        let loadingTime = 1;
        setInterval(() => {
          loadingTime--;
          if (loadingTime === 0) {
            loading.value = false;
          }
        }, 1000);
      } finally {
        loading.value = false;
      }
    } else {
      console.log("登录校验失败", fields);
      koiMsgError(t("msg.validFail"));
    }
  });
};
</script>

<style lang="scss" scoped>
/** 备案号 */
.bei-an-hao {
  position: absolute !important;
  bottom: 0 !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  font-size: 12px;
  font-weight: normal;
  text-align: center;
  z-index: 10 !important;
  white-space: nowrap;
  padding-bottom: 10px;
  width: 100%;
}

.bei-an-hao a {
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
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

/* 动态光斑 */
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

/* 毛玻璃覆盖层 */
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

/* 内容层 */
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

  .login-logo-wrap--brand & {
    border-radius: 12px;
  }
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

html.dark .feature-tag {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
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

html.dark {
  .login-logo-wrap--brand {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  .login-logo-wrap--mobile {
    background: #fff;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
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

  &:hover {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    transform: scale(1.02);
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

.animate-float-picture {
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
}

@keyframes float-picture {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

@keyframes bg-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15px, -10px) scale(1.05);
  }
}
</style>
