<template>
  <div class="login-page">
    <div class="login-koi-layout">
      <el-card class="login-card">
        <template #header>
          <div class="login-header">
            <h2>vue-support</h2>
            <p>登录系统</p>
          </div>
        </template>
        <el-form :model="loginForm" :rules="rules" ref="formRef" label-width="0">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用户名" size="large">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large" show-password>
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" style="width: 100%" @click="handleLogin" :loading="loading">登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";

defineOptions({
  name: "KoiLogin",
});

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const loginForm = reactive({
  username: "",
  password: ""
});

const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

const handleLogin = async () => {
  await formRef.value?.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        ElMessage.success("登录成功");
        router.push("/");
      }, 1000);
    }
  });
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  background-color: var(--el-bg-color);
}

.login-koi-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-card {
  width: 420px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 8px 0 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>