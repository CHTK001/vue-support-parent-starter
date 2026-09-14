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
] as const;

/** 当前激活的主导航项 */
const activeTo = computed(() => {
  if (route.name === "browse") return "/";
  if (route.name === "channel") return route.path;
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
        <span class="vds-logo-mark" aria-hidden="true">▶</span>
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
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--vd-border);
}

.vds-header-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 28px;
}

/* Logo */
.vds-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.vds-logo-mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
}

.vds-logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--vd-text);
  letter-spacing: 0.5px;
  white-space: nowrap;
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
  padding: 8px 14px;
  border-radius: var(--vd-radius-sm);
  transition: color 0.2s var(--vd-ease), background 0.2s var(--vd-ease);
  white-space: nowrap;
}

.vds-nav-link:hover {
  color: var(--vd-primary-strong);
  background: var(--vd-surface);
}

.vds-nav-link.is-active {
  color: var(--vd-primary-strong);
  font-weight: 600;
}

.vds-nav-link.is-active::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 2px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--vd-primary), var(--vd-secondary));
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
  border-color: #bae6fd;
  background: var(--vd-surface);
}

.vds-play-url-btn:hover {
  background: #e0f2fe;
  border-color: var(--vd-secondary);
}

.vds-search {
  width: 220px;
}

.vds-search :deep(.el-input__wrapper) {
  border-radius: 999px;
}

@media (max-width: 900px) {
  .vds-header-inner {
    padding: 0 16px;
    gap: 12px;
  }
  .vds-nav-link {
    padding: 8px 8px;
    font-size: 14px;
  }
  .vds-search {
    width: 140px;
  }
  .vds-logo-text {
    display: none;
  }
}
</style>
