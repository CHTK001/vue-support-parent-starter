<template>
  <div class="koi-login-host">
    <CustomTitlebar />
    <div class="koi-login-body">
      <!-- 登录页整页来自 koi 主题（左侧品牌视觉 + 右侧 ReLoginForm），
           本应用不再维护自己的登录页样式与登录逻辑。 -->
      <KoiLoginPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomTitlebar from './CustomTitlebar.vue'
// koi 默认登录页（品牌视觉 + 框架 ReLoginForm）。
// 不取 koi/views/login/index.vue：那一版带 koi 顶栏的主题色/暗色/语言/登录风格切换器，
// 本应用的语言与主题体系独立，接进来会形成第二套开关；默认登录风格只保留页面本体。
import KoiLoginPage from '@repo/theme/koi/views/login/styles/default.vue'
</script>

<style>
/* koi 登录模板写死 100vw / 100vh；Electron 下上方还有自定义标题栏，
   这里把登录页收进剩余高度，避免页面被顶出可视区。 */
.koi-login-host {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.koi-login-body {
  flex: 1;
  min-height: 0;
}

.koi-login-host .login-page {
  width: 100% !important;
  height: 100% !important;
}
</style>
