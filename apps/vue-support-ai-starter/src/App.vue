<template>
  <div class="ai-app">
    <aside class="ai-aside">
      <div class="ai-brand">Vue Support AI</div>
      <nav class="ai-menu">
        <router-link
          v-for="r in routes"
          :key="r.path"
          :to="r.path"
          class="ai-menu-item"
          active-class="is-active"
        >
          {{ (r.meta as any)?.title || r.path }}
        </router-link>
      </nav>
    </aside>
    <main class="ai-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
const routes = [
  { path: "/chat", meta: { title: "AI 对话" } },
  { path: "/image-gen", meta: { title: "文生图" } },
  { path: "/video-gen", meta: { title: "文生视频" } },
];
</script>

<style>
html, body, #app { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.ai-app { display: flex; height: 100vh; background: var(--el-bg-color-page); }
.ai-aside {
  width: 220px; background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  padding: 16px 0;
  display: flex; flex-direction: column;
}
.ai-brand {
  padding: 0 20px 16px;
  font-size: 16px; font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}
.ai-menu { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
.ai-menu-item {
  display: block; padding: 10px 14px; border-radius: 6px;
  color: var(--el-text-color-regular); text-decoration: none;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}
.ai-menu-item:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.ai-menu-item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}
.ai-main { flex: 1; overflow: auto; padding: 24px; background: var(--el-bg-color-page); }
</style>
