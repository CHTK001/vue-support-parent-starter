<template>
  <div class="login-page">
    <h1>Koi Login</h1>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Brush, Promotion, Key } from "@element-plus/icons-vue";
import { ref, reactive, computed, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
import KoiLoading from "./KoiLoading.vue";
import KoiThemeColor from "./components/KoiThemeColor.vue";
import KoiLanguage from "./components/KoiLanguage.vue";
import KoiDark from "./components/KoiDark.vue";

defineOptions({
  name: "KoiLogin",
});

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
    default: 1,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "login",
  "verify-code-refresh",
  "login-type-change",
]);

const { t } = useI18n();

const loginFormRef = ref<FormInstance>();
const verifyCodeBase64 = ref("");

const openSwitchLoginType = computed(
  () => props.defaultSetting?.OpenBaseLogin && props.defaultSetting?.OpenTenantLogin,
);

const hasSso = computed(
  () => props.ssoSetting?.Gitee || props.ssoSetting?.Github || props.ssoSetting?.Wechat,
);

const systemName = computed(() => getConfig()?.Title);

const logoUrl = computed(() => getConfig()?.LoginLogo);
const scienceUrl = computed(() => getConfig()?.LoginScience);
const beiAn = computed(() => getConfig()?.BeiAn);

const featureIcons = [Promotion, Brush, Lock];
const featureTags = computed(() => {
  const raw = getConfig()?.LoginFeatureTags;
  const list: string[] = Array.isArray(raw) ? raw.map(String) : [];
  return list.map((text, idx) => ({
    text,
    icon: featureIcons[idx % featureIcons.length],
  }));
});

interface ILoginUser {
  username: string;
  password: string;
  tenantCode?: string;
  verifyCode?: string;
  totpCode?: string;
}
const loginForm = reactive<ILoginUser>({
  username: "",
  password: "",
  tenantCode: "",
  verifyCode: "",
  totpCode: "",
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

const handleThirdPartyLogin = (type: string) => {
  // 简化处理：实际应由容器统一处理
  window.location.href = `/api/v2/auth/third/${type.toLowerCase()}?redirect=${encodeURIComponent(window.location.origin + "/#/bindSuccess")}`;
};

const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    emit("login", {
      username: loginForm.username,
      password: loginForm.password,
      accountType: props.accountType === 2 ? 2 : null,
      totpCode: loginForm.totpCode,
      tenantCode: loginForm.tenantCode,
      verifyCode: loginForm.verifyCode,
    });
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

.science-image {
  width: 260px;
  max-width: 500px;
  height: 260px;
  margin-bottom: 40px;
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
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

.login-type-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.login-type-tab {
  flex: 1;
  padding: 8px 0;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;

  &.active {
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
}

.verify-code-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.verify-code-row .login-input {
  flex: 1;
}

.verify-code-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 40px;
  cursor: pointer;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-light));
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--el-color-primary);
}

.verify-code-image:hover {
  border-color: var(--el-color-primary);
}

.verify-code-placeholder {
  font-size: 14px;
}

.verify-code-text {
  background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.vcode-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-color-primary-light-7);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.third-party-section {
  margin-top: 16px;
}

.third-party-divider-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.third-party-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
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
  .science-image {
    height: 320px;
    max-width: 400px;
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
  .science-image,
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
