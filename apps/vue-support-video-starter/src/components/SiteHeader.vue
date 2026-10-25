<script setup lang="ts">
/**
 * 顶部导航（第三版 · 参照站复刻）
 *
 * 参照站顶栏结构：左侧一排导航文字 + 右侧一个搜索输入框。
 * 无 Logo、无毛玻璃、无药丸背景——白底、60px、底部 1px 阴影，
 * 当前项为蓝色 #3b82f6 且加粗。
 */
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { favorites } from "@/utils/library";

const route = useRoute();
const router = useRouter();

const keyword = ref("");

/** 主导航项 */
const NAV_ITEMS = [
  { label: "主页", to: "/" },
  { label: "电影", to: "/channel/movie" },
  { label: "电视剧", to: "/channel/tv" },
  { label: "动漫", to: "/channel/anime" },
  { label: "综艺", to: "/channel/variety" },
  { label: "纪录片", to: "/channel/documentary" },
  { label: "直播", to: "/live" },
  { label: "CCTV直播", to: "/live/cctv" },
  { label: "排行榜", to: "/rank" },
  { label: "专题", to: "/topics" },
  { label: "直链播放", to: "/play" },
  { label: "配置", to: "/config" },
] as const;

/** 当前激活的主导航项 */
const activeTo = computed(() => {
  if (route.name === "browse") return "";
  if (route.name === "channel") return route.path;
  if (route.name === "live") return "/live";
  if (route.name === "live-cctv") return "/live/cctv";
  if (route.name === "rank") return "/rank";
  if (route.name === "topics") return "/topics";
  if (route.name === "play") return "/play";
  if (route.name === "config") return "/config";
  return route.name === "home" ? "/" : "";
});

/** 片库两个入口的选中态 */
const onMine = computed(() => route.name === "mine");
const mineTab = computed(() => (route.query.tab === "history" ? "history" : "fav"));

function onSearch() {
  const kw = keyword.value.trim();
  if (!kw) return;
  void router.push({ name: "browse", query: { keyword: kw } });
}
</script>

<template>
  <header class="vds-header">
    <div class="vds-header-inner">
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

      <div class="vds-search-wrap">
        <div class="vds-search">
          <svg class="vds-search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path
              d="M10.5 10.5 L14 14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="keyword"
            class="vds-search-input"
            type="text"
            placeholder="Search"
            aria-label="搜索影片"
            @keyup.enter="onSearch"
          />
        </div>
      </div>

      <div class="vds-user">
        <router-link
          class="vds-user-link"
          :class="{ 'is-active': onMine && mineTab === 'fav' }"
          :to="{ name: 'mine' }"
        >
          <svg class="vds-user-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M4 2.5h8v11l-4-2.6-4 2.6z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linejoin="round"
            />
          </svg>
          <span class="vds-user-text">收藏</span>
          <span v-if="favorites.length" class="vds-user-count">{{ favorites.length }}</span>
        </router-link>

        <span class="vds-user-sep" aria-hidden="true" />

        <router-link
          class="vds-user-link"
          :class="{ 'is-active': onMine && mineTab === 'history' }"
          :to="{ name: 'mine', query: { tab: 'history' } }"
        >
          <svg class="vds-user-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path
              d="M8 4.8v3.4l2.3 1.4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
          <span class="vds-user-text">历史</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.vds-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--vd-bg);
  box-shadow: var(--vd-shadow-hair);
}

.vds-header-inner {
  max-width: var(--vd-page);
  margin: 0 auto;
  padding: 0 var(--vd-pad);
  height: var(--vd-header-h);
  display: flex;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
}

/* ── 主导航：左移 15px 让首项文字对齐内容左边缘 ── */
.vds-nav {
  display: flex;
  align-items: center;
  margin-left: -15px;
  flex: 0 0 auto;
  min-width: 0;
  /* 不设上限：菜单项必须完整显示，空间不足时改用两行布局（见下方断点） */
  max-width: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.vds-nav::-webkit-scrollbar {
  display: none;
}

.vds-nav-link {
  display: block;
  padding: 0 15px;
  line-height: var(--vd-header-h);
  font-size: 16px;
  color: var(--vd-text);
  white-space: nowrap;
  transition: color var(--vd-fast) var(--vd-ease);
}

.vds-nav-link:hover {
  color: var(--vd-primary);
}

.vds-nav-link.is-active {
  color: var(--vd-primary);
  font-weight: 600;
}

.vds-nav-link:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: -4px;
  border-radius: var(--vd-radius-xs);
}

/* ── 搜索框：在导航右侧剩余空间里居中（参照站 .search 居中于 flex:1 容器） ── */
.vds-search-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.vds-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 622px;
  min-width: 140px;
  height: 30px;
  border: 1px solid var(--vd-border-input);
  border-radius: 4px;
  background: var(--vd-bg);
  padding: 0 8px;
  gap: 6px;
  box-sizing: border-box;
  transition: border-color var(--vd-fast) var(--vd-ease);
}

.vds-search:focus-within {
  border-color: var(--vd-primary);
}

.vds-search-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--vd-text-3);
}

.vds-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--vd-text);
  padding: 0;
}

.vds-search-input::placeholder {
  color: var(--vd-text-3);
}

/* ── 右侧片库入口（收藏 / 历史） ── */
.vds-user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.vds-user-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 20px;
  color: var(--vd-text-2);
  white-space: nowrap;
  transition: color var(--vd-fast) var(--vd-ease);
}

.vds-user-link:hover,
.vds-user-link.is-active {
  color: var(--vd-primary);
}

.vds-user-link.is-active {
  font-weight: 600;
}

.vds-user-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.vds-user-count {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--vd-primary-soft);
  color: var(--vd-primary);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  box-sizing: border-box;
}

.vds-user-sep {
  width: 1px;
  height: 12px;
  background: var(--vd-border);
}

/* 中等宽度：导航项收紧内边距，让 1200 一档仍是一行 */
@media (max-width: 1360px) {
  .vds-nav-link {
    padding: 0 12px;
  }
}

/* ── 窄屏：导航独占一行，搜索与片库入口换到第二行，避免菜单被裁切 ── */
@media (max-width: 1160px) {
  .vds-header-inner {
    height: auto;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
    padding: 0 12px;
  }

  .vds-nav {
    flex: 0 0 100%;
    width: 100%;
    max-width: none;
    margin: 0 -12px;
    padding: 0 12px;
    box-sizing: border-box;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* 右侧渐隐，提示还可以横向滑动 */
    mask-image: linear-gradient(to right, #000 calc(100% - 20px), transparent);
  }

  .vds-nav-link {
    padding: 0 12px;
    font-size: 15px;
  }

  .vds-search-wrap {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    justify-content: stretch;
    padding-bottom: 10px;
  }

  .vds-search {
    max-width: none;
  }

  .vds-user {
    padding-bottom: 10px;
  }
}

@media (max-width: 860px) {
  .vds-nav-link {
    padding: 0 10px;
    font-size: 14px;
  }
}

@media (max-width: 560px) {
  .vds-nav-link {
    padding: 0 9px;
    font-size: 14px;
  }
  .vds-search {
    height: 32px;
  }
  .vds-user {
    gap: 6px;
  }
  .vds-user-link {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vds-nav-link,
  .vds-search {
    transition: none;
  }
}
</style>
