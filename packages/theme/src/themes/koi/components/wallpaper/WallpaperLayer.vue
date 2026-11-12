<template>
  <!-- 壁纸图层：两个空 div，样式全部由 html 上的行内 CSS 变量驱动 -->
  <div class="koi-wallpaper" aria-hidden="true">
    <div class="koi-wallpaper__image"></div>
    <div class="koi-wallpaper__dim"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 壁纸图层
 *
 * <p>只负责把 DOM 放出来，何时显示、显示什么全在 store 里决定：
 * store 在模块加载时就把变量写到 {@code <html>} 上，这个组件晚一帧挂载也不影响。</p>
 *
 * <p>外层布局（layouts/index.vue）把它放在所有布局组件之前，
 * 配合 styles/wallpaper.scss 的 {@code z-index:-1}，正好落在布局背景之下。</p>
 */
import { onMounted } from "vue";
import { initWallpaper, syncWallpaperFromServer } from "./store";

onMounted(() => {
  // 模块加载时已恢复过一次；这里再恢复一次，兜住「配置在模块加载后才就绪」的启动顺序
  initWallpaper();
  // 登录后才挂得上布局，此时令牌已就绪：拉目录、当前设置与上传记录
  void syncWallpaperFromServer();
});
</script>
