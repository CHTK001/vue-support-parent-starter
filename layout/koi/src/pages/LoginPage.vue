<template>
  <div class="koi-login-container">
    <div class="koi-login-card">
      <h2 class="koi-login-title">{{ title }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="UserIcon"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="LockIcon"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="koi-login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <p v-if="errorMsg" class="koi-login-error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, type Component } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { useKoiAuthStore } from "../stores/auth";
import { LOGIN_URL, HOME_URL } from "../config/index";

const UserIcon = User as Component;
const LockIcon = Lock as Component;

interface Props {
  /** 页面标题 */
  title?: string;
  /** 登录 API 路径 */
  loginApi?: string;
  /** 获取用户信息 API 路径 */
  userInfoApi?: string;
  /** 获取菜单 API 路径 */
  userMenuApi?: string;
  /** 登录成功后跳转路径，默认 / */
  redirectPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "系统管理",
  loginApi: "/v2/user/login",
  userInfoApi: "/v2/user/me",
  userMenuApi: "/v2/user/menu",
  redirectPath: HOME_URL,
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

/** 登录后拉取用户信息和菜单，填充 koi auth store */
async function fetchUserData() {
  const [meRes, menuRes] = await Promise.all([
    import("axios").then((axios) =>
      axios.default.get(props.userInfoApi)
    ),
    import("axios").then((axios) =>
      axios.default.get(props.userMenuApi)
    ),
  ]);

  const userInfo = meRes.data?.data;
  const menuList = menuRes.data?.data || [];

  if (userInfo) {
    authStore.loginUser = {
      userId: String(userInfo.userId || userInfo.id || ""),
      loginName: String(userInfo.username || userInfo.loginName || ""),
      sex: String(userInfo.sex || ""),
      avatar: String(userInfo.avatar || ""),
    };
  }

  if (menuList.length) {
    authStore.setMenuList(menuList);
  }
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  errorMsg.value = "";

  try {
    const axios = (await import("axios")).default;
    const res = await axios.post(props.loginApi, {
      username: form.username,
      password: form.password,
      loginType: "WEB",
    });

    const data = res.data;
    if (data.code === "00000" || data.code === 200) {
      const token = data.data?.accessToken;
      if (token) {
        localStorage.setItem("koi-access-token", token);
      }
      await fetchUserData();
      ElMessage.success("登录成功");
      router.push(props.redirectPath);
    } else {
      errorMsg.value = data.msg || "登录失败";
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.msg || e.message || "请求失败";
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.koi-login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.koi-login-title {
  text-align: center;
  margin-bottom: 32px;
  font-size: 24px;
  color: #303133;
}
.koi-login-btn {
  width: 100%;
}
.koi-login-error {
  color: #f56c6c;
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
}
</style>