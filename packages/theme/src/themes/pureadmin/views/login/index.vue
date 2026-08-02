<template>
  <div class="pureadmin-login-page">
    <!-- 背景波浪 -->
    <img :src="loginBg" class="wave-bg" />
    
    <!-- 右上角工具栏 -->
    <div class="login-toolbar">
      <!-- 暗色模式切换 -->
      <el-switch
        v-model="isDarkMode"
        inline-prompt
        active-text="深色"
        inactive-text="浅色"
        @change="toggleDarkMode"
      />
      <!-- 语言选择 -->
      <el-dropdown trigger="click" @command="handleLanguageChange">
        <span class="language-btn">
          {{ locale }} 
          <el-icon><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">简体中文</el-dropdown-item>
            <el-dropdown-item command="en-US">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 登录容器 -->
    <div class="login-container">
      <!-- 左侧插图区 (大屏幕显示) -->
      <div class="login-illustration">
        <component :is="illustration" v-if="illustration" class="illustration-svg" />
        <div class="illustration-placeholder">
          <h2>{{ t("menu.login.welcome") }}</h2>
          <p>PureAdmin Vue3 Admin</p>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-form-wrapper">
        <div class="login-header">
          <img :src="avatar" class="avatar-svg" alt="logo" />
          <h2 class="title">{{ t("menu.login.title") }}</h2>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          size="large"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="t('menu.login.form.username')"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              :placeholder="t('menu.login.form.password')"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item prop="captcha" v-if="loginConfig.captcha">
            <el-input
              v-model="loginForm.captcha"
              :placeholder="t('menu.login.form.captcha')"
              prefix-icon="Key"
              clearable
            >
              <template #append>
                <el-image
                  :src="captchaImage"
                  class="captcha-img"
                  :preview-src-list="[captchaImage]"
                  @click="handleGetCaptcha"
                />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">
                {{ t("menu.login.remember") }}
              </el-checkbox>
              <el-button link type="primary">
                {{ t("menu.login.forget") }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? t("menu.login.loading") : t("menu.login.submit") }}
            </el-button>
          </el-form-item>

          <!-- 其他登录方式 -->
          <div class="other-methods">
            <el-divider>{{ t("menu.login.other") }}</el-divider>
            <div class="social-login">
              <a href="#" class="social-btn" title="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" class="social-btn" title="Gitee">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.628 0-12 5.373-12 12 0 5.302 3.439 9.8 8.207 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.013-.32 3.31 1.23.96-.267 1.983-.399 3.003-.405 1.02.006 2.043.138 3.003.405 2.297-1.55 3.31-1.23 3.31-1.23.645 1.653.24 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.576C20.565 21.795 24 17.297 24 12c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer-copyright">
      Copyright © 2020-present 
      <a href="https://github.com/pure-admin/vue-pure-admin" target="_blank">Vue-Pure-Admin</a>
    </div>
  </div>
</template>

<script setup lang="ts" name="PureadminLogin">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { getCaptcha, loadDefaultSetting } from "@repo/core";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import useTabsStore from "@repo/pinia/modules/tabs";
import { getConfig } from "@repo/config";
import logo from "@repo/assets/images/pureadmin/login/avatar.svg?component";
import bg from "@repo/assets/images/pureadmin/login/bg.png";
import illustration from "@repo/assets/images/pureadmin/login/illustration.svg?component";

const router = useRouter();
const { t, locale } = useI18n();
const userStore = useUserStore();
const authStore = useAuthStore();
const keepAliveStore = useKeepAliveStore();
const tabsStore = useTabsStore();

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const captchaImage = ref("");
const rememberMe = ref(true);

// 从全局 store 获取主题状态
const globalStore = () => ({} as any); // TODO: 接入真实的 globalStore

const isDarkMode = computed({
  get: () => false, // TODO: from globalStore.isDark
  set: (val) => {
    console.log("Toggle dark mode:", val);
  },
});

const loginBg = bg;
const avatar = logo;
const illustration = illustration;

interface ILoginForm {
  username: string;
  password: string;
  captcha: string;
}

const loginForm = ref<ILoginForm>({
  username: "",
  password: "",
  captcha: "",
});

const loginConfig = computed(() => getConfig().login);

const loginRules: FormRules = {
  username: [
    { required: true, message: t("menu.login.rules.username.required"), trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: t("menu.login.rules.username.pattern"),
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: t("menu.login.rules.password.required"), trigger: "blur" },
    { min: 6, max: 20, message: t("menu.login.rules.password.length"), trigger: "blur" },
  ],
  captcha: [
    { required: true, message: t("menu.login.rules.captcha.required"), trigger: "blur" },
  ],
};

const handleGetCaptcha = async () => {
  try {
    const res = await getCaptcha();
    const data = res?.data as any;
    captchaImage.value = data?.verifyCodeBase64 ?? data?.captchaPicture ?? "";
  } catch (error) {
    ElMessage.error(t("msg.captcha.fail"));
  }
};

const toggleDarkMode = () => {
  // TODO: 调用 globalStore.setGlobalState("isDark", !isDarkMode.value);
};

const handleLanguageChange = (lang: string) => {
  locale.value = lang;
};

const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      await userStore.loginByUsername({
        username: loginForm.value.username,
        password: loginForm.value.password,
        code: loginForm.value.captcha,
        codeKey: "test-key", // TODO: 从 captcha 接口获取
      });
      
      ElMessage.success(t("msg.login.success"));
      
      // 清空 keep-alive 缓存
      keepAliveStore.clearViews();
      tabsStore.delOthers("home");
      
      setTimeout(() => {
        router.replace("/");
      }, 300);
    } catch (error) {
      console.error("Login failed:", error);
      handleGetCaptcha();
    } finally {
      loading.value = false;
    }
  });
};

onMounted(async () => {
  await loadDefaultSetting();
  await handleGetCaptcha();
});
</script>

<style scoped lang="scss">
.pureadmin-login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--el-bg-color);
}

.wave-bg {
  position: fixed;
  height: 100%;
  width: 80%;
  left: 0;
  bottom: 0;
  z-index: -1;
}

.login-toolbar {
  position: absolute;
  right: 30px;
  top: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;

  .language-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-primary);
  }
}

.login-container {
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 18rem;
  padding: 0 2rem;
}

.login-illustration {
  display: flex;
  justify-content: flex-end;
  align-items: center;

  .illustration-svg {
    width: 500px;
    height: auto;
  }

  .illustration-placeholder {
    text-align: right;
    h2 {
      font-size: 2rem;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }
    p {
      font-size: 1rem;
      color: var(--el-text-color-secondary);
    }
  }
}

.login-form-wrapper {
  display: flex;
  align-items: center;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;

  .avatar-svg {
    width: 120px;
    height: auto;
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    text-transform: uppercase;
    margin: 0;
  }
}

.login-btn {
  width: 100%;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.captcha-img {
  width: 100px;
  height: 40px;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  border-left: 1px solid var(--el-border-color-lighter);
}

.other-methods {
  margin-top: 16px;
  
  .social-login {
    display: flex;
    justify-content: center;
    gap: 24px;
    
    .social-btn {
      color: var(--el-text-color-secondary);
      transition: color 0.3s;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

.footer-copyright {
  position: absolute;
  bottom: 12px;
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  
  html.dark & {
    color: rgba(255, 255, 255, 0.6);
  }
  
  a {
    color: inherit;
    
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

// 响应式
@media screen and (max-width: 1180px) {
  .login-container {
    grid-gap: 9rem;
  }
  
  .illustration-svg {
    width: 360px;
  }
  
  .avatar-svg {
    width: 100px;
  }
  
  .title {
    font-size: 24px;
  }
}

@media screen and (max-width: 968px) {
  .wave-bg {
    display: none;
  }
  
  .login-illustration {
    display: none;
  }
  
  .login-container {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  
  .login-toolbar {
    right: 16px;
    top: 12px;
  }
}
</style>
