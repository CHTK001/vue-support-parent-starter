<script setup lang="ts">
/**
 * 顶部导航 —— 与市面视频网站一致的站点头
 *
 * 结构：Logo + 主导航（主页/电影/电视剧/动漫/综艺）+ 直链播放入口 + 搜索框。
 * 交互：路由高亮、搜索回车跳转浏览页、吸顶毛玻璃。
 */
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, Link } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const keyword = ref("");

/** 主导航项（与频道路由一一对应） */
const NAV_ITEMS = [
  { label: "主页", to: "/" },
  { label: "电影", to: "/channel/movie" },
  { label: "电视剧", to: "/channel/tv" },
  { label: "动漫", to: "/channel/anime" },
  { label: "综艺", to: "/channel/variety" },
  { label: "直播", to: "/live" },
  { label: "CCTV直播", to: "/live/cctv" },
  { label: "配置", to: "/config" },
] as const;

/** 当前激活的主导航项 */
const activeTo = computed(() => {
  if (route.name === "browse") return "/";
  if (route.name === "channel") return route.path;
  if (route.name === "live") return "/live";
  if (route.name === "live-cctv") return "/live/cctv";
  if (route.name === "config") return "/config";
  return "";
});

function onSearch() {
  const kw = keyword.value.trim();
  if (!kw) return;
  void router.push({ name: "browse", query: { keyword: kw } });
  keyword.value = "";
}

function goPlayUrl() {
  void router.push({ name: "play" });
}
</script>

<template>
  <header class="vds-header">
    <div class="vds-header-inner">
      <a class="vds-logo" href="#/" aria-label="回到主页">
        <!-- 用图标组件代替 ▶ 字符：emoji/几何字符作图标在不同字体下渲染不一致 -->
        <span class="vds-logo-mark" aria-hidden="true">
          <ReIcon name="VideoPlay" :size="14" />
        </span>
        <span class="vds-logo-text">视频资源中心</span>
      </a>

      <nav class="vds-nav" aria-label="主导航">
        <router-link
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="vds-nav-link"
          :class="{ 'is-active': activeTo === item.to }"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="vds-header-actions">
        <el-button class="vds-play-url-btn" :icon="Link" round size="large" @click="goPlayUrl">
          直链播放
        </el-button>
        <el-input
          v-model="keyword"
          class="vds-search"
          :prefix-icon="Search"
          placeholder="搜索影片…"
          clearable
          @keyup.enter="onSearch"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.vds-header {
  position: sticky;
  top: 0;
  z-index: 100;
  /* #0b0e14 正是 --vd-bg，毛玻璃底色改用 color-mix 取 alpha */
  background: color-mix(in srgb, var(--vd-bg) 82%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--vd-border);
}

.vds-header-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
  height: 62px;
  display: flex;
  align-items: center;
  gap: 28px;
}

/* Logo */
.vds-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.vds-logo-mark {
  width: 32px;
  height: 32px;
  /* 原 10px，取最近档 md(8px) */
  border-radius: var(--el-radius-md, 8px);
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: var(--vd-text);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--vd-primary) 50%, transparent);
}

.vds-logo-text {
  font-size: 17px;
  font-weight: 800;
  color: var(--vd-text);
  letter-spacing: 0.5px;
  white-space: nowrap;
  background: linear-gradient(120deg, var(--vd-text), var(--vd-primary-strong));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Logo 是 <a href>，键盘可达，补实心焦点环 */
.vds-logo:focus-visible {
  outline: none;
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

/* 主导航 */
.vds-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.vds-nav-link {
  position: relative;
  text-decoration: none;
  color: var(--vd-text-secondary);
  font-size: 15px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: var(--vd-radius-sm);
  transition:
    color var(--el-transition-duration-fast, 0.2s) var(--vd-ease),
    background var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
  white-space: nowrap;
}

.vds-nav-link:hover {
  color: var(--vd-text);
  /* #94a3b8 正是 --vd-text-secondary */
  background: color-mix(in srgb, var(--vd-text-secondary) 10%, transparent);
}

.vds-nav-link.is-active {
  color: var(--vd-text);
  font-weight: 700;
}

/* router-link 渲染出的 <a>：补实心焦点环 */
.vds-nav-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

.vds-nav-link.is-active::after {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 4px;
  height: 3px;
  /* 原 2px（3px 高的下划条上即圆头），取胶囊档，渲染结果一致 */
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(90deg, var(--vd-primary), var(--vd-secondary));
  box-shadow: 0 0 12px color-mix(in srgb, var(--vd-primary) 60%, transparent);
}

/* 右侧动作区 */
.vds-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.vds-play-url-btn {
  color: var(--vd-primary-strong);
  border-color: color-mix(in srgb, var(--vd-primary) 45%, transparent);
  background: color-mix(in srgb, var(--vd-primary) 10%, transparent);
}

.vds-play-url-btn:hover {
  background: color-mix(in srgb, var(--vd-primary) 22%, transparent);
  border-color: var(--vd-primary-strong);
  color: var(--vd-text);
}

/* 搜索框暗色适配 */
.vds-search {
  width: 220px;
}

.vds-search :deep(.el-input__wrapper) {
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--vd-text-secondary) 10%, transparent);
  box-shadow: 0 0 0 1px var(--vd-border) inset;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) var(--vd-ease),
    background var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
}

.vds-search :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--vd-primary) inset,
    0 0 16px color-mix(in srgb, var(--vd-primary) 20%, transparent);
  background: color-mix(in srgb, var(--vd-text-secondary) 14%, transparent);
}

.vds-search :deep(.el-input__inner) {
  color: var(--vd-text);
}

.vds-search :deep(.el-input__inner::placeholder) {
  color: var(--vd-text-muted);
}

@media (max-width: 900px) {
  .vds-header-inner {
    padding: 0 16px;
    gap: 12px;
  }
  .vds-nav-link {
    padding: 8px 10px;
    font-size: 14px;
  }
  .vds-search {
    width: 140px;
  }
  .vds-logo-text {
    display: none;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .vds-nav-link,
  .vds-search :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>
