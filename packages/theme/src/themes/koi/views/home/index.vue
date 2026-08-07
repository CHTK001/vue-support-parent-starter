<template>
  <el-card class="home-card" shadow="never" :body-style="cardBodyStyle">
    <div class="home-welcome">
      <img
        class="home-welcome__avatar"
        :src="
          authStore.loginUser?.avatar ||
          'https://avatars.githubusercontent.com/u/185870639?v=4&size=64'
        "
        alt="avatar"
      />
      <div class="home-welcome__content">
        <div class="home-welcome__greeting">{{ greetingText }}</div>
        <div class="home-welcome__subtitle">
          一款有「鲤」的后台框架——简约而不简单，欢迎回来
          <span class="home-welcome__name">{{ authStore.loginUser?.loginName || "管理员" }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts" name="homePage">
import { computed } from "vue";
import { getDayText } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";

const authStore = useAuthStore();

const cardBodyStyle = { padding: "16px 20px" };

const greetingText = computed(() => {
  return getDayText() || "您好，愿您天天开心，事事如意！";
});
</script>

<style lang="scss" scoped>
.home-card {
  border-radius: 8px;
}

.home-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 76px;
  padding: 4px 0;
}

.home-welcome__avatar {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 50%;
  user-select: none;
}

.home-welcome__greeting {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-welcome__subtitle {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.home-welcome__name {
  margin-left: 4px;
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>