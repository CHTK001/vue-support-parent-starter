<template>
  <el-container class="ai-shell">
    <!-- 左侧：侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="ai-aside">
      <div class="ai-brand">
        <span class="ai-brand__icon">🤖</span>
        <span v-show="!collapsed" class="ai-brand__text">Vue Support AI</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        class="ai-menu"
        router
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
      >
        <el-menu-item
          v-for="m in menus"
          :key="m.path"
          :index="m.path"
          @click="navigate(m.path)"
        >
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
      <div class="ai-aside__footer">
        <el-button text @click="collapsed = !collapsed">
          <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          <span v-show="!collapsed">收起</span>
        </el-button>
      </div>
    </el-aside>

    <!-- 右侧：头部 + 内容 -->
    <el-container class="ai-main">
      <el-header height="56px" class="ai-header">
        <span class="ai-header__title">{{ currentTitle }}</span>
        <span class="ai-header__sub">spring-support-ai-starter 对接演示</span>
      </el-header>
      <el-main class="ai-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChatDotRound, Picture, VideoCamera, Fold, Expand } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const collapsed = ref(false);

const menus = [
  { path: "/chat", title: "AI 对话", icon: ChatDotRound },
  { path: "/image-gen", title: "文生图", icon: Picture },
  { path: "/video-gen", title: "文生视频", icon: VideoCamera },
];

const activeMenu = computed(() => route.path);
const currentTitle = computed(
  () => (route.meta?.title as string) || "AI 工作台"
);

const navigate = (path: string) => {
  if (route.path !== path) router.push(path);
};
</script>

<style scoped>
.ai-shell { height: 100vh; }
.ai-aside {
  background: #0f172a;
  color: #cbd5e1;
  display: flex; flex-direction: column;
  transition: width 0.2s;
}
.ai-brand {
  display: flex; align-items: center; gap: 8px;
  height: 56px; padding: 0 20px;
  color: #fff; font-weight: 600; font-size: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ai-brand__icon { font-size: 22px; }
.ai-brand__text { letter-spacing: 0.4px; }

.ai-menu { flex: 1; border-right: none !important; }
:deep(.ai-menu.el-menu) { background: transparent; }
:deep(.ai-menu .el-menu-item) {
  color: #cbd5e1; margin: 4px 8px; border-radius: 6px;
}
:deep(.ai-menu .el-menu-item:hover) {
  background: rgba(255,255,255,0.06); color: #fff;
}
:deep(.ai-menu .el-menu-item.is-active) {
  background: var(--el-color-primary); color: #fff;
}

.ai-aside__footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  color: #94a3b8;
}

.ai-main { flex: 1; background: var(--el-bg-color-page); }
.ai-header {
  display: flex; align-items: center; gap: 12px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}
.ai-header__title { font-size: 15px; font-weight: 600; }
.ai-header__sub { font-size: 12px; color: var(--el-text-color-secondary); }

.ai-content { padding: 20px; overflow: auto; }
</style>
