<template>
  <!-- 刷新：icons-animated 动画刷新图标（hover/focus 播放），故去掉 koi-rotate-i 的整体自转 -->
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
    @click="handleRefresh"
  >
    <el-tooltip :content="$t('header.refreshCache')">
      <ReIcon name="anim:tabler:refresh" size="18" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { clearSessionStorage, clearAuthCacheKeepToken } from "@repo/utils";
import useGlobalStore from "@repo/pinia/modules/global";
import useAuthStore from "@repo/pinia/modules/auth";

const globalStore = useGlobalStore();
const authStore = useAuthStore();
/** 刷新路由：清空菜单/布局/用户信息缓存(保留 token)后重新拉取并 reload */
const handleRefresh = async () => {
  // 清除 sessionStorage
  clearSessionStorage();
  // 清除菜单/布局/用户信息缓存(保留 accessToken/refreshToken)
  clearAuthCacheKeepToken();
  // 清除 global store 数据[重置为初始状态]
  globalStore.$reset();
  // 显式重新拉取菜单 + 用户信息（不依赖守卫 initPromise 缓存，确保清理后重新查询）
  try {
    await Promise.allSettled([authStore.listRouters(), authStore.getLoginUserInfo()]);
  } catch {
    /* 拉取失败不阻塞刷新 */
  }
  window.location.reload();
};
</script>

<style lang="scss" scoped></style>
