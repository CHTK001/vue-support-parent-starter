<template>
  <div class="koi-login-form" :class="formClass">
    <!-- 移动端 Logo -->
    <div v-if="showMobileBrand" class="login-mobile-brand md:hidden">
      <div class="login-logo-wrap login-logo-wrap--mobile">
        <img class="login-logo" :src="logo" :alt="loginConfig.brandName" />
      </div>
      <div class="font-600 text-xl">{{ $t(loginConfig.title) }}</div>
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

      <el-form-item prop="securityCode" v-if="loginConfig.captcha">
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
</template>

<script lang="ts" setup>
import { User, Lock, Postcard } from "@element-plus/icons-vue";
import { ref, reactive, toRef, onMounted, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { msgWarning, msgError, getCaptcha, loadDefaultSetting } from "@repo/core";
import { useRouter } from "vue-router";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import { HOME_URL, LOGIN_URL, getConfig } from "@repo/config";
import { initAuthRouter, resetRouter } from "@repo/pinia";
import useTabsStore from "@repo/pinia/modules/tabs";
import logo from "@repo/assets/images/logo/logo.webp";
import { useI18n } from "vue-i18n";

defineProps<{
  /** 是否显示移动端品牌 Logo */
  showMobileBrand?: boolean;
  /** 样式主题额外 class */
  formClass?: string;
}>();

const { t } = useI18n();
// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");
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
  loginName: "",
  password: "",
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
  ]
});

/** 获取验证码 */
const handleCaptcha = async () => {
  userStore.setToken({});
  try {
    const res = await getCaptcha();
    const data = res?.data as any;
    loginForm.codeKey = data?.verifyCodeKey ?? data?.codeKey ?? "";
    loginForm.captchaPicture = data?.verifyCodeBase64 ?? data?.captchaPicture ?? "";
  } catch (error) {
    console.log(error);
    msgError(t("msg.yzmFail"));
  }
};

// 进入页面加载管理员信息
onMounted(async () => {
  await loadDefaultSetting();
  await handleCaptcha();
});

/** 登录 */
const handleKoiLogin = () => {
  if (!loginFormRef.value) return;
  (loginFormRef.value as any).validate(async (valid: any) => {
    const loginName = loginForm.loginName;
    const password = loginForm.password;
    const securityCode = loginForm.securityCode;
    const codeKey = loginForm.codeKey;
    if (valid) {
      try {
        loading.value = true;
        authStore.$reset();
        resetRouter();
        // 1、执行登录接口（core api 封装 + pinia UserStore）
        await userStore.loginByUsername({
          username: loginName,
          password: String(password),
          codeKey,
          securityCode,
        });

        // 2、添加动态路由 AND 用户按钮 AND 角色信息 AND 用户个人信息
        if (userStore?.token) {
          try {
            await initAuthRouter(router);
          } catch {
            return;
          }
        } else {
          msgWarning(t("msg.logIn"));
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
      msgError(t("msg.validFail"));
    }
  });
};
</script>

<style lang="scss" scoped>
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

.login-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;

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
}
</style>
