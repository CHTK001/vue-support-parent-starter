<template>
  <div class="koi-login-page">
    <!-- 右上角工具栏 -->
    <div class="login-toolbar">
      <el-tooltip content="主题色" placement="bottom">
        <el-popover placement="bottom" :width="280" trigger="hover">
          <template #reference>
            <div class="toolbar-icon"><el-icon :size="20"><Brush /></el-icon></div>
          </template>
          <div class="theme-colors-grid">
            <div v-for="color in themeColors" :key="color" class="theme-color-item" @click="changeThemeColor(color)" :class="{ active: currentThemeColor === color }">
              <div class="color-preview" :style="{ backgroundColor: color }">
                <el-icon v-if="currentThemeColor === color" :size="12"><Check /></el-icon>
              </div>
            </div>
          </div>
        </el-popover>
      </el-tooltip>
      <el-tooltip content="语言" placement="bottom">
        <div class="toolbar-icon"><el-icon :size="20"><Aim /></el-icon></div>
      </el-tooltip>
      <el-tooltip :content="isDark ? '浅色模式' : '暗色模式'" placement="bottom">
        <div class="toolbar-icon" @click="toggleDark">
          <el-icon :size="20"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
        </div>
      </el-tooltip>
    </div>

    <el-row class="login-row">
      <!-- 左侧背景 -->
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="login-bg-side">
        <div class="login-background">
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>
          <div class="glass-overlay"></div>
          <div class="content-layer">
            <div class="brand-badge">
              <div class="logo-wrap"><el-icon :size="28" color="#fff"><Monitor /></el-icon></div>
              <span class="brand-text">KOI-ADMIN</span>
            </div>
            <div class="science-placeholder"><div class="science-inner"></div></div>
            <div class="welcome-title">欢迎回来</div>
            <div class="welcome-subtitle">{{ systemName || 'KOI-ADMIN 管理系统' }}</div>
            <div class="welcome-desc">高效管理，现代设计，安全可靠</div>
            <div class="feature-tags">
              <span class="feature-tag"><el-icon :size="14"><Promotion /></el-icon>高效管理</span>
              <span class="feature-tag"><el-icon :size="14"><Brush /></el-icon>现代设计</span>
              <span class="feature-tag"><el-icon :size="14"><Lock /></el-icon>安全可靠</span>
            </div>
          </div>
        </div>
      </el-col>
      <!-- 右侧表单 -->
      <el-col :lg="8" :md="12" :sm="9" :xs="24" class="login-form-side">
        <div class="login-form-panel">
          <div class="mobile-brand">
            <div class="logo-wrap logo-wrap--mobile"><el-icon :size="20" color="#409eff"><Monitor /></el-icon></div>
            <span class="mobile-brand-text">KOI-ADMIN</span>
          </div>
          <div class="form-header">
            <h3>账户登录</h3>
            <p>用户名 / 密码</p>
          </div>

          <!-- 登录类型切换 -->
          <div v-if="openSwitchLoginType" class="login-type-selector">
            <div class="selector-options">
              <div v-if="defaultSetting.OpenBaseLogin" class="option-card" :class="{ active: loginType === 1 }" @click="loginType = 1">
                <el-icon :size="20"><User /></el-icon>
                <span>普通登录</span>
              </div>
              <div v-if="defaultSetting.OpenTenantLogin" class="option-card" :class="{ active: loginType === 2 }" @click="loginType = 2">
                <el-icon :size="20"><OfficeBuilding /></el-icon>
                <span>租户登录</span>
              </div>
            </div>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" size="large" class="login-form" @keyup.enter="handleLogin">
            <!-- 租户编码 -->
            <el-form-item v-if="defaultSetting.OpenTenantLogin && loginType === 2" prop="tenantCode">
              <el-input v-model="form.tenantCode" placeholder="租户编码（选填）" clearable class="login-input">
                <template #prefix><el-icon :size="16"><OfficeBuilding /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item prop="loginName">
              <el-input v-model="form.loginName" placeholder="用户名" clearable class="login-input">
                <template #prefix><el-icon :size="16"><User /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码" show-password clearable class="login-input">
                <template #prefix><el-icon :size="16"><Lock /></el-icon></template>
              </el-input>
            </el-form-item>

            <!-- 验证码 -->
            <el-form-item v-if="defaultSetting.OpenVerifyCode" prop="securityCode">
              <div class="verify-wrap">
                <el-input v-model="form.securityCode" placeholder="验证码" clearable class="login-input verify-input" @keydown.enter="handleLogin">
                  <template #prefix><el-icon :size="16"><Postcard /></el-icon></template>
                </el-input>
                <div class="verify-img" @click="handleCaptcha">
                  <el-image v-if="form.captchaPicture" class="verify-image" :src="form.captchaPicture" fit="cover" />
                  <div v-else class="verify-placeholder"><el-icon class="animate-spin"><Loading /></el-icon></div>
                </div>
              </div>
            </el-form-item>

            <p v-if="errorMsg" class="error-msg"><el-icon><WarningFilled /></el-icon> {{ errorMsg }}</p>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="handleLogin">
                {{ loading ? "登录中..." : "登 录" }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  User, Lock, WarningFilled, Monitor, Promotion, Brush,
  Check, Aim, Moon, Sunny, Postcard, Loading, OfficeBuilding,
} from "@element-plus/icons-vue";
import { useUserStoreHook } from "@repo/core/src/store/modules/UserStore";
import { initRouter, fetchVerifyCode } from "@repo/core";
import { getConfig, setConfig } from "@repo/config/src/config";
import { fetchDefaultSetting } from "@pages/setting";

defineOptions({ name: "Login" });

const router = useRouter();
const userStore = useUserStoreHook();
const formRef = ref();
const loading = ref(false);
const errorMsg = ref("");
const isDark = ref(false);
const currentThemeColor = ref("#409EFF");
const loginType = ref(1);
const systemName = ref("");

const themeColors = [
  "#2992FF", "#1E71EE", "#6169FF", "#8076C3",
  "#1BA784", "#316C72", "#FF6B35", "#0099FF",
  "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4",
];

const defaultSetting = reactive({
  OpenVerifyCode: false,
  OpenVcode: false,
  CheckTotpOpen: false,
  OpenThirdPartyLogin: false,
  OpenTenantLogin: false,
  OpenBaseLogin: false,
  SystemName: "",
});

const openSwitchLoginType = computed(() => {
  return defaultSetting.OpenBaseLogin && defaultSetting.OpenTenantLogin;
});

const form = reactive({
  loginName: getConfig().defaultUsername || "admin",
  password: getConfig().defaultPassword || "123456",
  securityCode: "",
  codeKey: "",
  captchaPicture: "",
  tenantCode: "",
});

const rules = {
  loginName: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const changeThemeColor = (color: string) => {
  currentThemeColor.value = color;
  document.documentElement.style.setProperty("--el-color-primary", color);
};

const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
};

const handleCaptcha = async () => {
  try {
    const res: any = await fetchVerifyCode();
    const data = res?.data;
    if (data) {
      form.codeKey = data.codeKey || "";
      form.captchaPicture = data.captchaPicture || "";
    }
  } catch {
    // 验证码加载失败静默处理
  }
};

const loadDefaultSetting = async () => {
  try {
    const { data } = await fetchDefaultSetting();
    if (!data || !Array.isArray(data)) return;
    data.forEach((element: any) => {
      if (!element) return;
      if (element.sysSettingGroup === "default") {
        if (element.sysSettingName === "SystemName") {
          systemName.value = element.sysSettingValue;
          setConfig("Title", systemName.value);
          return;
        }
        if (element.sysSettingName === "CheckCodeOpen") {
          defaultSetting.OpenVerifyCode = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "CheckTotpCodeOpen") {
          defaultSetting.CheckTotpOpen = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "SlidingBlockOpen") {
          defaultSetting.OpenVcode = element.sysSettingValue === "true";
          return;
        }
        if (element.sysSettingName === "OpenThirdPartyLogin") {
          defaultSetting.OpenThirdPartyLogin = element.sysSettingValue === "true";
          return;
        }
        defaultSetting[element.sysSettingName] = element.sysSettingValue === "true";
      }
    });

    if (defaultSetting.OpenVerifyCode) {
      await handleCaptcha();
    }
  } catch {
    // 配置加载失败时保留默认值
  }
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    await userStore.loginByUsername({
      username: form.loginName,
      password: form.password,
      verifyCodeKey: form.securityCode,
      codeKey: form.codeKey,
      loginType: "WEB",
      tenantCode: form.tenantCode || undefined,
      accountType: loginType.value === 2 ? "tenant" : null,
    });
    await initRouter();
    const path = getConfig().PostLoginRedirect || "/dashboard";
    router.push(path);
    ElMessage.success("登录成功");
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.msg || e?.message || "登录失败";
    if (defaultSetting.OpenVerifyCode) handleCaptcha();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDefaultSetting();
});
</script>

<style lang="scss" scoped>
.koi-login-page { min-height: 100vh; overflow: hidden; background: var(--el-bg-color-page); position: relative; }
.login-row { height: 100vh; }

.login-toolbar {
  position: absolute; top: 8px; right: 8px; z-index: 10;
  display: flex; align-items: center; gap: 4px;
  height: 40px; padding: 2px 12px;
  background: #F4F4F5; border: 1px solid #E4E7ED; border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  .toolbar-icon {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 6px; cursor: pointer;
    transition: all 0.3s;
    &:hover { background: rgba(0,0,0,0.06); }
  }
}
html.dark .login-toolbar { background: #141414; border-color: #4C4D4F; box-shadow: 0 4px 12px rgba(255,255,255,0.1); }

.theme-colors-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 4px; }
.theme-color-item {
  display: flex; flex-direction: column; align-items: center; padding: 4px;
  cursor: pointer; border: 2px solid transparent; border-radius: 8px; transition: all 0.3s;
  &:hover { background: var(--el-fill-color-light); }
  &.active { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
}
.color-preview {
  width: 28px; height: 28px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;
}

.login-bg-side { display: flex; align-items: center; justify-content: center; }

.login-background {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.10), transparent 65%),
    var(--el-bg-color-page, #F8F8F8);
}

.bg-shape {
  position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5;
  pointer-events: none; animation: bg-float 18s infinite ease-in-out; z-index: 0;
  &--1 { top: -5%; left: 10%; width: 400px; height: 400px; background: rgba(var(--el-color-primary-rgb), 0.35); }
  &--2 { bottom: 5%; right: 5%; width: 300px; height: 300px; background: color-mix(in srgb, var(--el-color-primary) 50%, #a855f7 50%); animation-delay: -6s; }
  &--3 { top: 40%; left: 50%; width: 200px; height: 200px; background: color-mix(in srgb, var(--el-color-primary) 50%, #06b6d4 50%); animation-delay: -12s; }
}

.glass-overlay {
  position: absolute; inset: 0;
  background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.15); z-index: 1; pointer-events: none;
}

.content-layer {
  position: absolute; z-index: 2; top: 50%; left: 50%;
  transform: translate(-50%, -50%); width: 100%; padding: 0 40px; text-align: center;
}

.logo-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 70%, #a855f7));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
  &--mobile { width: 40px; height: 40px; border-radius: 10px; background: #fff; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.14); }
}

.brand-badge { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 32px; }
.brand-text { font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); }

.science-placeholder {
  width: 260px; max-width: 500px; height: 260px; margin: 0 auto 40px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
  .science-inner { width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, rgba(var(--el-color-primary-rgb), 0.2), transparent 60%); }
}

.welcome-title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: var(--el-text-color-regular); letter-spacing: 2px; }
.welcome-subtitle { font-size: 28px; font-weight: 800; margin-bottom: 16px; color: var(--el-text-color-primary); }
.welcome-desc { font-size: 16px; color: var(--el-text-color-regular); opacity: 0.85; max-width: 420px; margin: 0 auto; line-height: 1.6; }

.feature-tags { display: flex; justify-content: center; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.feature-tag {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500;
  color: var(--el-text-color-regular); background: rgba(var(--el-color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.15); border-radius: 20px;
  backdrop-filter: blur(8px); transition: all 0.3s;
  &:hover { background: rgba(var(--el-color-primary-rgb), 0.15); transform: translateY(-2px); }
  .el-icon { color: var(--el-color-primary); }
}

.login-form-side {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--el-bg-color); border-left: 1px solid var(--el-border-color-lighter);
}

.login-form-panel { width: 100%; padding: 40px 24px; display: flex; flex-direction: column; align-items: center; }

.mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 16px; }
.mobile-brand-text { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); }

.form-header { text-align: center; margin-bottom: 32px;
  h3 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: var(--el-text-color-primary); }
  p { font-size: 14px; color: var(--el-text-color-regular); }
}

.login-form { width: 100%; max-width: 300px; }

.login-type-selector {
  width: 100%; max-width: 300px; margin-bottom: 20px;
  .selector-options { display: flex; gap: 12px; }
  .option-card {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px; border: 2px solid var(--el-border-color-lighter); border-radius: 10px;
    cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500;
    &:hover { border-color: var(--el-color-primary-light-7); }
    &.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  }
}

:deep(.el-input__wrapper) { border-radius: 10px; }
:deep(.el-input__inner) { height: 42px; }

.login-btn { width: 100%; height: 44px; font-size: 16px; font-weight: 600; border-radius: 10px; letter-spacing: 4px; }

.error-msg {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px; margin: -8px 0 16px;
  font-size: 13px; color: var(--el-color-danger); background: var(--el-color-danger-light-9);
  border-radius: 8px; border: 1px solid var(--el-color-danger-light-7);
}

.verify-wrap { display: flex; gap: 12px; align-items: flex-start; }
.verify-input { flex: 1; }
.verify-img {
  width: 100px; height: 40px; flex-shrink: 0; border-radius: 8px; overflow: hidden;
  cursor: pointer; border: 1px solid var(--el-border-color-lighter); transition: all 0.3s;
  &:hover { border-color: var(--el-color-primary); transform: scale(1.02); }
}
.verify-image { width: 100px; height: 40px; display: block; }
.verify-placeholder {
  width: 100px; height: 40px; display: flex; align-items: center; justify-content: center;
  background: var(--el-fill-color-light); color: var(--el-color-primary);
}

.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes float-picture { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes bg-float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(15px, -10px) scale(1.05); } }

@media (max-width: 768px) {
  .login-bg-side { display: none; }
  .login-form-side { border-left: none; }
  .mobile-brand { display: flex; }
}
</style>
