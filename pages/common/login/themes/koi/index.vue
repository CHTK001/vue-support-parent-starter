<template>
  <div class="login-page">
    <div class="login-toolbar">
      <KoiThemeColor />
      <KoiLanguage />
      <KoiDark />
    </div>

    <div class="login-row">
      <!-- 左侧背景区 -->
      <div class="login-left">
        <div class="login-background">
          <!-- 动态装饰光斑 -->
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>

          <!-- 毛玻璃覆盖层 -->
          <div class="glass-overlay"></div>

          <!-- 内容层 -->
          <div class="content-layer">
            <div class="brand-badge">
              <div class="login-logo-wrap login-logo-wrap--brand">
                <img class="login-logo" :src="logo" alt="System" />
              </div>
              <span class="brand-text">{{ systemName }}</span>
            </div>
            <div class="science-illustration" aria-hidden="true">
              <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- 外圈轨道 -->
                <circle cx="130" cy="130" r="110" stroke="currentColor" stroke-opacity="0.15" stroke-width="1.5" stroke-dasharray="8 4" />
                <circle cx="130" cy="130" r="85" stroke="currentColor" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="6 6" />
                <!-- 数据中心圆 -->
                <circle cx="130" cy="130" r="32" stroke="currentColor" stroke-opacity="0.35" stroke-width="2" fill="currentColor" fill-opacity="0.06" />
                <circle cx="130" cy="130" r="8" fill="currentColor" fill-opacity="0.5" />
                <!-- 连接节点 -->
                <circle cx="130" cy="46" r="5" fill="currentColor" fill-opacity="0.45" />
                <circle cx="130" cy="214" r="5" fill="currentColor" fill-opacity="0.45" />
                <circle cx="78" cy="72" r="5" fill="currentColor" fill-opacity="0.4" />
                <circle cx="182" cy="72" r="5" fill="currentColor" fill-opacity="0.4" />
                <circle cx="78" cy="188" r="5" fill="currentColor" fill-opacity="0.4" />
                <circle cx="182" cy="188" r="5" fill="currentColor" fill-opacity="0.4" />
                <!-- 连线 -->
                <line x1="130" y1="98" x2="130" y2="122" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
                <line x1="130" y1="138" x2="130" y2="162" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
                <line x1="98" y1="130" x2="122" y2="130" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
                <line x1="138" y1="130" x2="162" y2="130" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
                <line x1="130" y1="51" x2="130" y2="98" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="130" y1="162" x2="130" y2="209" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="83" y1="77" x2="98" y2="98" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="177" y1="77" x2="162" y2="98" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="83" y1="183" x2="98" y2="162" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="177" y1="183" x2="162" y2="162" stroke="currentColor" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 3" />
                <!-- 数据装饰点 -->
                <rect x="30" y="30" width="3" height="3" rx="1" fill="currentColor" fill-opacity="0.25" />
                <rect x="227" y="30" width="3" height="3" rx="1" fill="currentColor" fill-opacity="0.25" />
                <rect x="30" y="227" width="3" height="3" rx="1" fill="currentColor" fill-opacity="0.25" />
                <rect x="227" y="227" width="3" height="3" rx="1" fill="currentColor" fill-opacity="0.25" />
              </svg>
            </div>
            <div class="welcome-title">{{ $t("login.pureWelcome") }}</div>
            <div class="welcome-subtitle">{{ systemName }}</div>
            <div class="welcome-desc">{{ $t("login.pureHello") }}</div>
            <div class="feature-tags">
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
          <div class="bei-an-hao bei-an-hao--lg">
            <a href="https://beian.miit.gov.cn/" target="_blank">豫ICP备2022022094号-1</a>
          </div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-right">
        <div class="login-form-panel">
          <!-- 移动端 Logo -->
          <div class="login-mobile-brand">
            <div class="login-logo-wrap login-logo-wrap--mobile">
              <img class="login-logo" :src="logo" alt="System" />
            </div>
            <div class="mobile-brand-text">{{ systemName }}</div>
          </div>

          <div class="form-header">
            <h3 class="form-title">{{ $t("login.pureLoginTitle") }}</h3>
            <p class="form-subtitle">
              {{ $t("login.pureUsername") }} / {{ $t("login.purePassword") }}
            </p>
          </div>

          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
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

            <el-form-item class="login-submit-item">
              <el-button
                type="primary"
                class="login-btn"
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
        <div class="bei-an-hao bei-an-hao--sm">
          <a href="https://beian.miit.gov.cn/" target="_blank">豫ICP备2022022094号-1</a>
        </div>
      </div>
    </div>

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

const systemName = computed(() => getConfig()?.Title || "vue-support");

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

const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      loading.value = true;
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
/* ============ 页面容器 ============ */
.login-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ============ 顶部工具栏 ============ */
.login-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 2px 12px;
  background: #f4f4f5;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  transition: all 300ms ease;
}

html.dark .login-toolbar {
  background: #141414;
  border-color: #4c4d4f;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

/* ============ 主体两栏布局 ============ */
.login-row {
  display: flex;
  width: 100%;
  height: 100%;
}

.login-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66.6667%; /* lg=16/24 */
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 33.3333%; /* lg=8/24 */
  position: relative;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

html.dark .login-right {
  background: #0c0c0c;
  border-left-color: rgba(255, 255, 255, 0.06);
}

/* ============ 左侧背景区 ============ */
.login-background {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.1), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.08), transparent 60%),
    var(--el-bg-color-page, #f8f8f8);
}

html.dark .login-background {
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.25), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.2), transparent 65%),
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
  transition: all 500ms ease;
}

.brand-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.science-illustration {
  width: 260px;
  max-width: 400px;
  margin: 0 auto 40px;
  animation: float-picture 5s ease-in-out infinite;
  color: rgba(255, 255, 255, 0.35);
}

html.dark .science-illustration {
  color: rgba(255, 255, 255, 0.18);
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: var(--el-text-color-regular);
  letter-spacing: 2px;
}

.welcome-subtitle {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 16px;
  text-align: center;
  color: var(--el-text-color-primary);
}

.welcome-desc {
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  opacity: 0.85;
}

.feature-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
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

/* ============ 备案号 ============ */
.bei-an-hao {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: normal;
  text-align: center;
  z-index: 10;
  white-space: nowrap;
  padding-bottom: 10px;
  width: 100%;
  user-select: none;

  a {
    font-size: 12px;
    color: var(--el-text-color-primary);
    opacity: 0.7;
    transition: opacity 0.3s;
    text-decoration: none;

    &:hover {
      opacity: 1;
    }
  }
}

.bei-an-hao--sm {
  display: none;
}

/* ============ Logo ============ */
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

/* ============ 右侧表单区 ============ */
.login-mobile-brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.mobile-brand-text {
  font-size: 20px;
  font-weight: 600;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
}

.form-subtitle {
  font-size: 14px;
  margin: 0;
  color: var(--el-text-color-regular);
}

.login-form-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.login-submit-item {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 4px;
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

/* ============ 动画 ============ */
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

/* ============ 响应式 ============ */
@media (max-width: 1199px) {
  .login-left {
    width: 50%; /* md=12/24 */
  }
  .login-right {
    width: 50%; /* md=12/24 */
  }
  .science-illustration {
    width: 240px;
    margin-bottom: 32px;
  }
  .welcome-title {
    font-size: 20px;
  }
  .welcome-subtitle {
    font-size: 22px;
  }
}

@media (max-width: 991px) {
  .login-left {
    width: 62.5%; /* sm=15/24 */
  }
  .login-right {
    width: 37.5%; /* sm=9/24 */
  }
}

@media (max-width: 767px) {
  .login-left {
    display: none; /* xs=0 */
  }
  .login-right {
    width: 100%; /* xs=24 */
  }
  .login-mobile-brand {
    display: flex;
  }
  .brand-badge,
  .science-illustration,
  .welcome-title,
  .welcome-subtitle,
  .welcome-desc,
  .feature-tags {
    display: none;
  }
  .bei-an-hao--lg {
    display: none;
  }
  .bei-an-hao--sm {
    display: block;
  }
}
</style>
