<<<<<<< HEAD
<template>
  <router-view />
</template>

<script setup lang="ts">
/**
 * 应用根组件。直接渲染路由出口，布局由各页面决定。
 */
</script>
=======
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Document, List, Setting, Share } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

/**
 * 左侧导航菜单项。
 */
const menuItems = [
  { path: "/definitions", title: "爬虫定义", icon: Setting },
  { path: "/orchestration", title: "编排测试", icon: Share },
  { path: "/data-records", title: "采集数据", icon: Document },
  { path: "/execution-records", title: "执行记录", icon: List },
];

/**
 * 当前路由对应标题。
 */
const pageTitle = computed(
  () =>
    menuItems.find((m) => m.path === route.path)?.title ?? "Spider Center"
);

/**
 * 跳转到指定菜单项。
 */
function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-aside">
      <div class="brand">Spider Center</div>
      <nav style="padding: 12px 0; flex: 1">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="nav-item"
          :class="{ 'is-active': route.path === item.path }"
          @click="goTo(item.path)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </div>
      </nav>
      <div
        style="
          padding: 12px 20px;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #1e293b;
        "
      >
        <div>v1.0.0 · CH</div>
        <div style="margin-top: 4px">19091 / proxy /spider</div>
      </div>
    </aside>
    <main class="app-main">
      <header class="app-header">
        <div style="font-weight: 600; color: var(--el-text-color-primary)">
          {{ pageTitle }}
        </div>
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="color: var(--el-text-color-secondary); font-size: 13px">
            后端: 19091
          </span>
        </div>
      </header>
      <section class="app-content">
        <router-view />
      </section>
    </main>
  </div>
</template>
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
