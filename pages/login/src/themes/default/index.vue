<template>
  <div class="login-page login-page--default">
    <div class="login-toolbar">
      <DefaultLanguage />
      <DefaultDark />
    </div>

    <div class="login-row login-row--centered">
      <!-- 居中登录卡片 -->
      <div class="login-card">
        <div class="login-card-header">
          <img v-if="logoUrl" class="login-card-logo" :src="logoUrl" alt="System" />
          <h2 class="login-card-title">{{ systemName }}</h2>
          <p class="login-card-subtitle">{{ slogan }}</p>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              type="text"
              :placeholder="$t('login.pureUsername')"
              size="large"
              :disabled="props.loading"
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
              :disabled="props.loading"
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
              :loading="props.loading"
              :disabled="props.loading"
              @click="handleLogin"
            >
              {{ props.loading ? $t("login.pureLoginLoading") : $t("login.pureLogin") }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="bei-an-hao">
      <a v-if="beiAn" href="https://beian.miit.gov.cn/" target="_blank">{{ beiAn }}</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock } from "@element-plus/icons-vue";
import { ref, reactive, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
import DefaultLanguage from "./components/DefaultLanguage.vue";
import DefaultDark from "./components/DefaultDark.vue";

defineOptions({
  name: "DefaultLogin",
});

const props = defineProps<{
  defaultSetting: Record<string, any>;
  ssoSetting: Record<string, any>;
  accountType: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  login: [payload: { username: string; password: string; accountType?: number | null; totpCode?: string }];
  "verify-code-refresh": [];
}>();

const { t } = useI18n();

const loginFormRef = ref<FormInstance>();

const systemName = computed(() => getConfig()?.Title);
const logoUrl = computed(() => getConfig()?.LoginLogo);
const slogan = computed(() => getConfig()?.LoginSlogan);
const beiAn = computed(() => getConfig()?.BeiAn);

interface ILoginUser {
  username: string;
  password: string;
}
const loginForm = reactive<ILoginUser>({
  username: "",
  password: "",
});
const loginRules = reactive<FormRules<ILoginUser>>({
  username: [{ required: true, message: t("login.pureUsernameReg"), trigger: "blur" }],
  password: [{ required: true, message: t("login.purePassWordReg"), trigger: "blur" }],
});

const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    emit("login", {
      username: loginForm.username,
      password: loginForm.password,
      accountType: null,
    });
  });
};
</script>

<style lang="scss" scoped>
.login-page--default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.login-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
}

.login-row--centered {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 400px;
  max-width: 100%;
  padding: 40px 32px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-card-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-card-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  object-fit: contain;
}

.login-card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.login-card-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.login-btn {
  width: 100%;
}

.bei-an-hao {
  text-align: center;
  padding: 16px;
  font-size: 12px;

  a {
    color: var(--el-text-color-placeholder);
    text-decoration: none;
  }
}

html.dark .login-card {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
</style>