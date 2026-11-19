<script setup lang="ts">
// 根组件：站点导航 + 路由视图 + 页脚
// EP locale 由 el-config-provider 提供（性能清单 F1/F2，替代原 app.use(ElementPlus, { locale })）
import SiteHeader from "@/components/SiteHeader.vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
</script>

<template>
  <el-config-provider :locale="zhCn">
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
        <nav class="vd-footer-links" aria-label="页脚导航">
          <router-link to="/topics">专题</router-link>
          <router-link to="/rank">排行榜</router-link>
          <router-link :to="{ name: 'mine' }">我的片库</router-link>
          <router-link to="/live">电视直播</router-link>
          <router-link to="/play">直链播放</router-link>
        </nav>
      </div>
    </footer>
  </el-config-provider>
</template>
