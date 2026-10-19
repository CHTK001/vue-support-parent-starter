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
  { label: "直播", to: "/live" },
  { label: "CCTV直播", to: "/live/cctv" },
  { label: "直链播放", to: "/play" },
  { label: "配置", to: "/config" },
] as const;

/** 当前激活的主导航项 */
const activeTo = computed(() => {
  if (route.name === "browse") return "";
  if (route.name === "channel") return route.path;
  if (route.name === "live") return "/live";
  if (route.name === "live-cctv") return "/live/cctv";
  if (route.name === "play") return "/play";
  if (route.name === "config") return "/config";
  return "";
});

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
  max-width: 60%;
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

@media (max-width: 900px) {
  .vds-header-inner {
    gap: 10px;
  }
  .vds-nav-link {
    padding: 0 10px;
    font-size: 14px;
  }
  .vds-nav {
    margin-left: -10px;
    max-width: 55%;
  }
  .vds-search-wrap {
    justify-content: flex-end;
  }
  .vds-search {
    max-width: 220px;
  }
}

@media (max-width: 560px) {
  .vds-search-wrap {
    justify-content: flex-end;
  }
  .vds-search {
    max-width: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vds-nav-link,
  .vds-search {
    transition: none;
  }
}
</style>
