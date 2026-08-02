<template>
  <div class="pureadmin-error-page">
    <img :src="errorImage" :alt="code" class="error-image" />
    <div class="error-content">
      <h1 class="error-code">{{ code }}</h1>
      <p class="error-message">{{ message }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="handleHome">返回首页</el-button>
        <el-button @click="handleBack">返回上页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PureadminErrorPage">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import img403 from "@repo/assets/images/pureadmin/status/403.svg?component";
import img404 from "@repo/assets/images/pureadmin/status/404.svg?component";
import img500 from "@repo/assets/images/pureadmin/status/500.svg?component";

const route = useRoute();
const router = useRouter();

const code = computed(() => {
  const q = route.query?.code as string;
  if (q && /^\d{3}$/.test(q)) return q;
  const name = String(route.name ?? "");
  if (name === "403") return "403";
  if (name === "500") return "500";
  return "404";
});

const message = computed(() => {
  switch (code.value) {
    case "403":
      return "您没有权限访问此页面";
    case "500":
      return "服务器内部错误，请稍后再试";
    default:
      return "抱歉，您访问的页面不存在";
  }
});

const errorImage = computed(() => {
  switch (code.value) {
    case "403":
      return img403;
    case "500":
      return img500;
    default:
      return img404;
  }
});

const handleHome = () => router.replace("/");
const handleBack = () => router.back();
</script>

<style scoped lang="scss">
.pureadmin-error-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color);
}

.error-image {
  width: 400px;
  max-width: 80%;
  margin-bottom: 40px;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 64px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.error-message {
  font-size: 18px;
  color: var(--el-text-color-secondary);
  margin-bottom: 40px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
