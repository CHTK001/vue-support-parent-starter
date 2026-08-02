<template>
  <div class="koi-error-page">
    <div class="koi-error-page__inner">
      <img class="koi-error-page__banner" :src="banner" :alt="code" />
      <div class="koi-error-page__caption">
        <div class="koi-error-page__code">{{ code }}</div>
        <p class="koi-error-page__msg">{{ message }}</p>
        <div class="koi-error-page__actions">
          <el-button class="koi-error-btn koi-error-btn--primary" @click="handleHome">
            <el-icon><HomeFilled /></el-icon>
            <span>返回首页</span>
          </el-button>
          <el-button class="koi-error-btn koi-error-btn--ghost" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回上页</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="KoiErrorPage">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, HomeFilled } from "@element-plus/icons-vue";
import { HOME_URL } from "@repo/config";
import img403 from "@repo/assets/images/error/403.png";
import img404 from "@repo/assets/images/error/404.png";
import img500 from "@repo/assets/images/error/500.png";

const route = useRoute();
const router = useRouter();

/**
 * 按 path / name 推断错误码
 * /403 → 403, /404 → 404, /500 → 500
 * 也可由 query.code 强制覆盖
 */
const code = computed<string>(() => {
  const q = route.query?.code;
  if (typeof q === "string" && /^\d{3}$/.test(q)) return q;
  const name = String(route.name ?? "");
  if (name === "403") return "403";
  if (name === "500") return "500";
  return "404";
});

const message = computed<string>(() => {
  switch (code.value) {
    case "403":
      return "您没有权限访问此页面";
    case "500":
      return "服务器开小差了，请稍后再试";
    default:
      return "您想看的页面不存在哟";
  }
});

const banner = computed(() => {
  switch (code.value) {
    case "403":
      return img403;
    case "500":
      return img500;
    default:
      return img404;
  }
});

const handleHome = () => router.replace(HOME_URL);
const handleBack = () => router.back();
</script>

<style scoped lang="scss">
.koi-error-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
}

.koi-error-page__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.koi-error-page__banner {
  max-width: 480px;
  width: 60vw;
  height: auto;
}

.koi-error-page__caption {
  text-align: center;
}

.koi-error-page__code {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 4px;
}

.koi-error-page__msg {
  margin: 8px 0 24px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.koi-error-page__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.koi-error-btn {
  border-radius: 8px;
}

.koi-error-btn--primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>
