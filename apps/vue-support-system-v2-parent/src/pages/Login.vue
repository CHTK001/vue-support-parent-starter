<template>
  <div class="koi-login-wrapper">
    <div class="koi-login-bg">
      <div class="koi-login-bg-shapes">
        <div class="shape shape-1" />
        <div class="shape shape-2" />
        <div class="shape shape-3" />
      </div>
    </div>
    <div class="koi-login-card">
      <div class="koi-login-header">
        <div class="koi-login-logo">
          <svg viewBox="0 0 48 48" width="40" height="40">
            <path fill="#409eff" d="M24 4L4 14v20l20 10 20-10V14L24 4z" />
            <path fill="#fff" d="M24 12l-12 6v12l12 6 12-6V18l-12-6z" />
          </svg>
        </div>
        <h2 class="koi-login-title">系统管理</h2>
        <p class="koi-login-subtitle">基于 KOI-UI 的新一代管理平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="koi-login-form"
        label-width="0"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="captcha" v-if="showCaptcha">
          <div class="captcha-row">
            <el-input
              v-model="form.captcha"
              placeholder="验证码"
              size="large"
              class="captcha-input"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <div class="captcha-img" @click="refreshCaptcha">
              <span>点击刷新</span>
            </div>
          </div>
        </el-form-item>

        <p v-if="errorMsg" class="koi-login-error">
          <el-icon><WarningFilled /></el-icon>
          {{ errorMsg }}
        </p>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="koi-login-btn"
            @click="handleLogin"
          >
            {{ loading ? "登录中..." : "登 录" }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="koi-login-footer">
        <span class="koi-login-footer-text">
          推荐使用 Chrome / Edge 浏览器
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock, Key, WarningFilled } from "@element-plus/icons-vue";
import { useKoiAuthStore } from "@layout/koi";
import { useUserStoreHook } from "@repo/core";
import { getLogin, getMine } from "@repo/core";
import { setToken } from "@repo/core";
import { getAsyncRoutes } from "@repo/core";

const router = useRouter();
const authStore = useKoiAuthStore();

const formRef = ref();
const loading = ref(false);
const errorMsg = ref("");
const showCaptcha = ref(false);

const form = reactive({
  username: "admin",
  password: "admin123",
  captcha: "",
});

const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

function refreshCaptcha() {
  // placeholder: 刷新验证码
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  errorMsg.value = "";

  try {
    const res = await getLogin({
      username: form.username,
      password: form.password,
      loginType: "WEB",
    });

    if (res.code === "00000" || res.code === 200) {
      // 使用 @repo/core 的标准 token 存储
      setToken(res.data, { isRemembered: true });

      // 拉取用户信息
      const meRes = await getMine();
      const userInfo = meRes?.data;

      // 同步到 koi auth store
      if (userInfo) {
        const userData = userInfo?.userInfo || userInfo;
        authStore.loginUser = {
          userId: String(userData.sysUserId || userData.userId || userData.id || ""),
          loginName: String(userData.sysUserUsername || userData.username || ""),
          sex: String(userData.sex || ""),
          avatar: String(userData.avatar || userData.sysUserAvatar || ""),
        };
      }

      ElMessage.success("登录成功");
      router.push("/dashboard");
    } else {
      errorMsg.value = res.msg || "登录失败";
    }
  } catch (e: any) {
    const resp = e.response?.data;
    errorMsg.value = resp?.msg || e.message || "请求失败";

    // 需要验证码
    if (resp?.code === "00003" || resp?.code === 3) {
      showCaptcha.value = true;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.koi-login-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

.koi-login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.koi-login-bg-shapes {
  position: absolute;
  inset: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;

  &.shape-1 {
    width: 400px;
    height: 400px;
    top: -100px;
    left: -100px;
    background: radial-gradient(circle, #409eff, #337ecc);
    animation: float 20s ease-in-out infinite;
  }

  &.shape-2 {
    width: 500px;
    height: 500px;
    bottom: -150px;
    right: -100px;
    background: radial-gradient(circle, #67c23a, #529b2e);
    animation: float 25s ease-in-out infinite reverse;
  }

  &.shape-3 {
    width: 300px;
    height: 300px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, #e6a23c, #d48806);
    animation: float 18s ease-in-out infinite 5s;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(20px, 30px) scale(1.02);
  }
}

.koi-login-card {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 40px 36px 28px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.04),
      0 24px 72px rgba(0, 0, 0, 0.1),
      0 10px 30px rgba(0, 0, 0, 0.08);
  }
}

.koi-login-header {
  text-align: center;
  margin-bottom: 32px;
}

.koi-login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.koi-login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}

.koi-login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.koi-login-form {
  margin-bottom: 8px;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    padding: 4px 12px;
    box-shadow: 0 0 0 1px #e4e7ed inset;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  :deep(.el-input__prefix) {
    margin-right: 8px;

    .el-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-input__inner) {
    height: 42px;
  }
}

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 110px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
}

.koi-login-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: -8px 0 16px;
  font-size: 13px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 8px;
  border: 1px solid #fde2e2;
}

.koi-login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 4px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

.koi-login-footer {
  text-align: center;
  margin-top: 24px;
}

.koi-login-footer-text {
  font-size: 12px;
  color: #c0c4cc;
}

// 暗色模式适配
:root[data-theme="dark"] {
  .koi-login-wrapper {
    background: #1a1a2e;
  }

  .koi-login-card {
    background: rgba(30, 30, 60, 0.92);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .koi-login-title {
    color: #e0e0f0;
  }

  .koi-login-form :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    background: rgba(255, 255, 255, 0.06);

    &:hover {
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    }
  }

  .koi-login-error {
    background: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
  }
}
</style>