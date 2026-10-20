<script setup lang="ts">
// 根组件：站点导航 + 路由视图 + 页脚
import SiteHeader from "@/components/SiteHeader.vue";
</script>

<template>
  <SiteHeader />
  <main class="vd-main">
    <router-view v-slot="{ Component }">
      <transition name="vd-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <footer class="vd-footer">
    <div class="vd-footer-inner">
      <span class="vd-footer-brand">视频资源中心</span>
      <span>多源聚合检索 · 电视直播 · 直链播放</span>
    </div>
  </footer>
</template>
