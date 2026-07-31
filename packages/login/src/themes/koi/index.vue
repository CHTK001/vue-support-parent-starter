<template>
  <div class="login-page w-screen h-screen overflow-hidden">
    <el-row class="h-100%">
      <div class="flex flex-items-center pos-absolute top-8px right-8px z-10 h-40px p-y-2px p-x-12px bg-#F4F4F5 dark:bg-#141414 border-1px border-solid border-#E4E7ED dark:border-#4C4D4F rounded-20px shadow-[0_4px_12px_rgb(0_0_0_/_15%)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all transition-300ms transition-ease">
        <KoiThemeColor></KoiThemeColor>
        <KoiLanguage></KoiLanguage>
        <KoiDark></KoiDark>
        <KoiLoginTheme></KoiLoginTheme>
      </div>
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex flex-items-center flex-justify-center">
        <div class="login-background w-100% h-100%">
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>
          <div class="glass-overlay"></div>
          <div class="pos-absolute text-center select-none transition-all transition-ease transition-500 content-layer">
            <div class="brand-badge flex flex-items-center flex-justify-center gap-10px m-b-32px <md:hidden">
              <div class="login-logo-wrap login-logo-wrap--brand">
                <img class="login-logo" src="/src/assets/images/logo/logo.webp" alt="KOI-ADMIN" />
              </div>
              <span class="brand-text text-18px font-700">KOI-ADMIN</span>
            </div>
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
          <div class="bei-an-hao select-none <md:hidden">
            <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank">
              {{ $t("menu.login.beiAnHao") }}：豫ICP备2022022094号-1
            </a>
          </div>
        </div>
      </el-col>
      <el-col :lg="8" :md="12" :sm="9" :xs="24" class="login-form-side flex flex-items-center flex-justify-center flex-col">
        <div class="login-form-panel w-100% flex flex-col flex-items-center">
          <div class="login-mobile-brand md:hidden">
            <div class="login-logo-wrap login-logo-wrap--mobile">
              <img class="login-logo" src="/src/assets/images/logo/logo.webp" alt="KOI-ADMIN" />
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
              <el-input v-model="loginForm.loginName" type="text" :placeholder="$t('menu.login.form.loginName')" size="large" class="login-input">
                <template #prefix>
                  <el-icon :size="16"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" :placeholder="$t('menu.login.form.password')" show-password size="large" class="login-input">
                <template #prefix>
                  <el-icon :size="16"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="securityCode">
              <div class="login-verify-wrap flex flex-col sm:flex-row items-start sm:items-center gap-12px w-full">
                <el-input v-model="loginForm.securityCode" type="text" :placeholder="$t('menu.login.form.securityCode')" size="large" class="login-input w-full sm:flex-1">
                  <template #prefix>
                    <el-icon :size="16"><Postcard /></el-icon>
                  </template>
                </el-input>
                <div class="login-verify-img w-100px h-40px flex-shrink-0 rounded-8px overflow-hidden cursor-pointer border-1px border-solid border-[--el-border-color-lighter]" @click="handleCaptcha">
                  <el-image v-if="loginForm.captchaPicture" class="w-100px h-40px block" :src="loginForm.captchaPicture" fit="cover" />
                  <div class="login-verify-placeholder w-100px h-40px flex flex-items-center flex-justify-center bg-[--el-fill-color-light] text-[--el-color-primary]">
                    <el-icon class="animate-spin"><Loading /></el-icon>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item class="m-b-0">
              <el-button type="primary" class="login-btn w-100% tracking-4px" size="large" :loading="loading" @click="handleKoiLogin">
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
        <div class="bei-an-hao select-none lg:hidden md:hidden">
          <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank">
            {{ $t("menu.login.beiAnHao") }}：豫ICP备2022022094号-1
          </a>
        </div>
      </el-col>
    </el-row>
    <KoiLoading></KoiLoading>
  </div>
</template>

<script lang="ts" setup>
import { User, Lock, Postcard, Loading } from "@element-plus/icons-vue"
import { ref, reactive, onMounted } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { useI18n } from "vue-i18n"
import KoiDark from "@repo/login/themes/koi/components/KoiDark.vue"
import KoiLoading from "@repo/login/themes/koi/components/KoiLoading.vue"
import KoiLanguage from "@repo/login/themes/koi/components/KoiLanguage.vue"
import KoiThemeColor from "@repo/login/themes/koi/components/KoiThemeColor.vue"
import KoiLoginTheme from "@repo/login/themes/koi/components/KoiLoginTheme.vue"

const { t } = useI18n()

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: "login", payload: { username: string; password: string })
  (e: "verify-code-refresh")
}>()

const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
  loginName: "",
  password: "",
  securityCode: "",
  codeKey: "",
  captchaPicture: ""
})

const loginRules = reactive({
  loginName: [
    { required: true, message: t("menu.login.rules.loginName.required"), trigger: "blur" },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
          callback(new Error(t("menu.login.rules.loginName.validator")))
        } else {
          callback()
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
          callback(new Error(t("menu.login.rules.password.validator2")))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  securityCode: [{ required: true, message: t("menu.login.rules.securityCode.required"), trigger: "blur" }]
})

const handleCaptcha = () => {
  emit("verify-code-refresh")
}

const handleKoiLogin = () => {
  if (!loginFormRef.value) return
  ;(loginFormRef.value as any).validate((valid: any) => {
    if (valid) {
      emit("login", {
        username: loginForm.loginName,
        password: loginForm.password,
      })
    }
  })
}

onMounted(() => {
  handleCaptcha()
})
</script>

<style lang="scss" scoped>
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

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;
  &--brand {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(255, 255, 255, 0.35);
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
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  .login-logo-wrap--mobile {
    background: #fff;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}

.login-mobile-brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
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

.login-verify-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
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
}

.verify-code-placeholder {
  font-size: 14px;
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
}

@keyframes bg-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15px, -10px) scale(1.05);
  }
}

@media (max-width: 1199px) {
  .welcome-title {
    font-size: 20px;
  }
  .welcome-subtitle {
    font-size: 22px;
  }
}

@media (max-width: 767px) {
  .login-mobile-brand {
    display: flex;
  }
  .brand-badge,
  .welcome-title,
  .welcome-subtitle,
  .welcome-desc,
  .feature-tags {
    display: none;
  }
}
</style>