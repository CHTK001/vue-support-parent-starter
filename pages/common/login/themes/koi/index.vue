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
                <img class="login-logo" :src="logo" alt="System" />
              </div>
              <span class="brand-text text-18px font-700">{{ systemName }}</span>
            </div>
            <el-image
              class="w-260px max-w-500px h-260px m-b-40px animate-float-picture <md:hidden <lg:h-320px <lg:max-w-400px"
              :src="science"
            />
            <div class="welcome-title text-2xl font-700 m-b-12px text-center <lg:text-xl <md:hidden">
              {{ $t("login.pureWelcome") }}
            </div>
            <div class="welcome-subtitle text-28px font-800 m-b-16px text-center <lg:text-22px <md:hidden">
              {{ systemName }}
            </div>
            <div class="welcome-desc text-16px font-400 text-center max-w-420px mx-auto leading-relaxed <md:hidden">
              {{ $t("login.pureHello") }}
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
              >豫ICP备2022022094号-1</a
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
              <img class="login-logo" :src="logo" alt="System" />
            </div>
            <div class="font-600 text-xl">{{ systemName }}</div>
          </div>

          <div class="form-header text-center m-b-32px">
            <h3 class="text-24px font-700 m-b-8px text-[--el-text-color-primary]">{{ $t("login.pureLoginTitle") }}</h3>
            <p class="text-14px text-[--el-text-color-regular]">
              {{ $t("login.pureUsername") }} / {{ $t("login.purePassword") }}
            </p>
          </div>

          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form w-300px">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                type="text"
                :placeholder="$t('login.pureUsername')"
                size="large"
                class="login-input"
                :disabled="loading"
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
                :placeholder="$t('login.purePassword')"
                show-password
                size="large"
                class="login-input"
                :disabled="loading"
                @keydown.enter="handleLogin"
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
                :loading="loading"
                :disabled="loading"
                @click="handleLogin"
              >
                {{ loading ? $t("login.pureLoginLoading") : $t("login.pureLogin") }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 备案号 - 小屏 -->
        <div class="bei-an-hao select-none lg:hidden md:hidden">
          <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank"
            >豫ICP备2022022094号-1</a
          >
        </div>
      </el-col>
    </el-row>

    <KoiLoading />
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Brush, Promotion } from "@element-plus/icons-vue";
import { ref, reactive, computed, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
import { initRouter } from "@repo/core";
import { useUserStoreHook } from "@repo/core/src/store/modules/UserStore";
import { message } from "@repo/utils";
import logo from "@repo/assets/images/koi-logo.webp";
import science from "@repo/assets/images/science.png";
import KoiLoading from "./KoiLoading.vue";
import KoiThemeColor from "./components/KoiThemeColor.vue";
import KoiLanguage from "./components/KoiLanguage.vue";
import KoiDark from "./components/KoiDark.vue";

defineOptions({
  name: "KoiLogin",
});

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStoreHook();

const loginFormRef = ref<FormInstance>();
const loading = ref(false);

// 系统名称
const systemName = computed(() => getConfig()?.Title || "vue-support");

// 登录表单
interface ILoginUser {
  username: string;
  password: string;
}
const loginForm = reactive<ILoginUser>({
  username: "",
  password: "",
});
const loginRules = reactive<FormRules<ILoginUser>>({
  username: [
    { required: true, message: t("login.pureUsername"), trigger: "blur" },
  ],
  password: [
    { required: true, message: t("login.purePassword"), trigger: "blur" },
    { min: 6, max: 20, message: t("login.purePassword"), trigger: "blur" },
  ],
});

/** 登录 */
const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      loading.value = true;
      // 框架登录逻辑
      await userStore.loginByUsername({
        username: loginForm.username,
        password: loginForm.password,
        loginType: "WEB",
        accountType: null,
      });
      await initRouter();
      await nextTick();
      await router.replace(getConfig()?.home || "/home");
    } catch (error) {
      message(error?.message || "登录失败", { type: "error" });
    } finally {
      loading.value = false;
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
