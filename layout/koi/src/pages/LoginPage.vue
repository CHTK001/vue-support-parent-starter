<template>
  <div class="koi-login-container">
    <div class="koi-login-card">
      <div class="koi-login-header">
        <div class="koi-login-logo">
          <svg viewBox="0 0 48 48" width="40" height="40">
            <path fill="#409eff" d="M24 4L4 14v20l20 10 20-10V14L24 4z" />
            <path fill="#fff" d="M24 12l-12 6v12l12 6 12-6V18l-12-6z" />
          </svg>
        </div>
        <h2 class="koi-login-title">{{ title }}</h2>
        <p class="koi-login-subtitle">{{ subtitle }}</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" clearable>
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password clearable>
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <p v-if="errorMsg" class="koi-login-error">
          <el-icon><WarningFilled /></el-icon> {{ errorMsg }}
        </p>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="koi-login-btn" @click="handleLogin">
            {{ loading ? "登录中..." : "登 录" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, type Component } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock, WarningFilled } from "@element-plus/icons-vue";
import { useKoiAuthStore } from "../stores/auth";
import { getLogin, getMine } from "@repo/core/src/api/common/user";
import { setToken } from "@repo/core/src/utils/auth";
import type { UserResult } from "@repo/core/src/api/common/user";

const UserIcon = User as Component;
const LockIcon = Lock as Component;

interface Props {
  /** 页面标题 */
  title?: string;
  subtitle?: string;
  /** 登录成功后跳转路径，默认 /dashboard */
  redirectPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "系统管理",
  subtitle: "基于 KOI-UI 的新一代管理平台",
  redirectPath: "/dashboard",
});

const router = useRouter();
const authStore = useKoiAuthStore();

const formRef = ref();
const loading = ref(false);
const errorMsg = ref("");

const form = reactive({
  username: "admin",
  password: "admin123",
});

const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

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
      setToken(res.data as unknown as UserResult, { isRemembered: true });

      // 拉取用户信息并同步到 koi auth store
      const meRes = await getMine();
      const userInfo = meRes?.data;

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
      router.push(props.redirectPath);
    } else {
      errorMsg.value = res.msg || "登录失败";
    }
  } catch (e: any) {
    const resp = e.response?.data;
    errorMsg.value = resp?.msg || e.message || "请求失败";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.koi-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.koi-login-card {
  width: 420px;
  padding: 40px 36px 28px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
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
.koi-login-btn { width: 100%; height: 44px; font-size: 16px; font-weight: 600; border-radius: 10px; letter-spacing: 4px; }
.koi-login-error {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; margin: -8px 0 16px;
  font-size: 13px; color: #f56c6c;
  background: #fef0f0; border-radius: 8px; border: 1px solid #fde2e2;
}
:deep(.el-input__wrapper) { border-radius: 10px; }
:deep(.el-input__inner) { height: 42px; }
</style>