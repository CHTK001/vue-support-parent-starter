<script setup lang="ts">
/**
 * 顶部导航 —— 站点头（第二版）
 *
 * 结构：Logo + 主导航药丸 + 直链播放入口 + 搜索框。
 * 交互：路由高亮（金色下划线）、搜索回车跳转浏览页、吸顶毛玻璃。
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
      <router-link class="vds-logo" to="/" aria-label="回到主页">
        <span class="vds-logo-mark" aria-hidden="true">
          <ReIcon name="VideoPlay" :size="15" />
        </span>
        <span class="vds-logo-text">视频资源中心</span>
      </router-link>

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
        <button type="button" class="vds-play-url-btn" @click="goPlayUrl">
          <el-icon aria-hidden="true"><Link /></el-icon>
          <span class="vds-play-url-label">直链播放</span>
        </button>
        <el-input
          v-model="keyword"
          class="vds-search"
          :prefix-icon="Search"
          placeholder="搜索影片…"
          clearable
          aria-label="搜索影片"
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
  background: color-mix(in srgb, var(--vd-bg) 78%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-bottom: 1px solid var(--vd-border);
}

.vds-header-inner {
  max-width: var(--vd-page-max);
  margin: 0 auto;
  padding: 0 32px;
  height: var(--vd-header-h);
  display: flex;
  align-items: center;
  gap: 26px;
}

/* ── Logo ── */
.vds-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  border-radius: var(--vd-radius-sm);
}

.vds-logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--vd-primary-strong), var(--vd-secondary));
  color: #1a1206;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 18px color-mix(in srgb, var(--vd-primary) 45%, transparent);
}

.vds-logo-text {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.5px;
  white-space: nowrap;
  background: linear-gradient(120deg, var(--vd-text) 20%, var(--vd-primary-strong));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.vds-logo:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

/* ── 主导航 ── */
.vds-nav {
  display: flex;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.vds-nav::-webkit-scrollbar {
  display: none;
}

.vds-nav-link {
  position: relative;
  text-decoration: none;
  color: var(--vd-text-secondary);
  font-size: 14.5px;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: var(--vd-radius-sm);
  white-space: nowrap;
  transition:
    color var(--vd-fast) var(--vd-ease),
    background var(--vd-fast) var(--vd-ease);
}

.vds-nav-link:hover {
  color: var(--vd-text);
  background: color-mix(in srgb, var(--vd-text) 7%, transparent);
}

.vds-nav-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

.vds-nav-link.is-active {
  color: var(--vd-primary-strong);
  font-weight: 700;
}

.vds-nav-link.is-active::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 1px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--vd-primary-strong), var(--vd-secondary));
  box-shadow: 0 0 12px color-mix(in srgb, var(--vd-primary) 70%, transparent);
}

/* ── 右侧动作区 ── */
.vds-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.vds-play-url-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vd-primary-strong);
  background: color-mix(in srgb, var(--vd-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--vd-primary) 40%, transparent);
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  transition:
    background var(--vd-fast) var(--vd-ease),
    border-color var(--vd-fast) var(--vd-ease),
    color var(--vd-fast) var(--vd-ease);
}

.vds-play-url-btn:hover {
  background: color-mix(in srgb, var(--vd-primary) 20%, transparent);
  border-color: var(--vd-primary-strong);
  color: var(--vd-text);
}

.vds-play-url-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

/* ── 搜索框 ── */
.vds-search {
  width: 220px;
}

.vds-search :deep(.el-input__wrapper) {
  border-radius: 999px;
  background: color-mix(in srgb, var(--vd-text) 7%, transparent);
  box-shadow: 0 0 0 1px var(--vd-border) inset;
  transition:
    box-shadow var(--vd-fast) var(--vd-ease),
    background var(--vd-fast) var(--vd-ease);
}

.vds-search :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--vd-primary) inset,
    0 0 18px color-mix(in srgb, var(--vd-primary) 22%, transparent);
  background: color-mix(in srgb, var(--vd-text) 10%, transparent);
}

.vds-search :deep(.el-input__inner) {
  color: var(--vd-text);
}

.vds-search :deep(.el-input__inner::placeholder) {
  color: var(--vd-text-muted);
}

@media (max-width: 1080px) {
  .vds-logo-text {
    display: none;
  }
}

@media (max-width: 900px) {
  .vds-header-inner {
    padding: 0 16px;
    gap: 12px;
  }
  .vds-nav-link {
    padding: 8px 10px;
    font-size: 13.5px;
  }
  .vds-nav-link.is-active::after {
    left: 10px;
    right: 10px;
  }
  .vds-play-url-label {
    display: none;
  }
  .vds-search {
    width: 150px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vds-nav-link,
  .vds-play-url-btn,
  .vds-search :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>
