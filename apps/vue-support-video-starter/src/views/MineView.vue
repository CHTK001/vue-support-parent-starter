<script setup lang="ts">
/**
 * 我的片库：收藏 / 观看历史
 *
 * 数据来自 {@link import("@/utils/library")}（localStorage），
 * 版式沿用首页的 6 列卡片网格 + 参照站的页签条。
 */
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import VideoCard from "@/components/VideoCard.vue";
import {
  clearFavorites,
  clearHistory,
  favorites,
  formatWatchedAt,
  history,
  removeFavorite,
  removeHistory,
} from "@/utils/library";

const route = useRoute();
const router = useRouter();

type Tab = "fav" | "history";

const tab = ref<Tab>(route.query.tab === "history" ? "history" : "fav");

/** 页签 ↔ 地址栏同步，方便右侧「收藏 / 历史」直接跳进来 */
watch(tab, (value) => {
  void router.replace({
    query: { ...route.query, tab: value === "history" ? "history" : undefined },
  });
});

watch(
  () => route.query.tab,
  (value) => {
    const next: Tab = value === "history" ? "history" : "fav";
    if (next !== tab.value) tab.value = next;
  },
);

const tabs = computed(() => [
  { key: "fav" as const, label: "我的收藏", count: favorites.value.length },
  { key: "history" as const, label: "观看历史", count: history.value.length },
]);

const list = computed(() => (tab.value === "fav" ? favorites.value : history.value));

const emptyText = computed(() =>
  tab.value === "fav"
    ? { title: "还没有收藏任何影片", desc: "在影片详情页点「添加收藏」，就会出现在这里。" }
    : { title: "还没有观看记录", desc: "打开任意影片详情页后，这里会自动记录并置顶。" },
);

/** 历史条目的观看时间（收藏页不显示） */
function watchedAt(id: string): number {
  return history.value.find((item) => item.id === id)?.watchedAt ?? 0;
}

function remove(id: string) {
  if (tab.value === "fav") removeFavorite(id);
  else removeHistory(id);
}

function clear() {
  const isFav = tab.value === "fav";
  const count = list.value.length;
  if (!count) return;
  const label = isFav ? "收藏" : "观看历史";
  if (!window.confirm(`确定清空全部 ${count} 条${label}？此操作不可撤销。`)) return;
  if (isFav) clearFavorites();
  else clearHistory();
}
</script>

<template>
  <div class="vd-page">
    <header class="vdm-head">
      <h1 class="vdm-title">我的片库</h1>
      <p class="vdm-desc">收藏与观看记录保存在本机浏览器，不上传服务器；清理浏览器数据会一并清除。</p>
    </header>

    <div class="vdm-bar">
      <div class="vd-tabs vdm-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="vd-tab vdm-tab"
          :class="{ 'is-active': tab === t.key }"
          @click="tab = t.key"
        >
          {{ t.label }}<span class="vd-tab-count">{{ t.count }}</span>
        </button>
      </div>
      <button v-if="list.length" type="button" class="vdm-clear" @click="clear">清空</button>
    </div>

    <div v-if="list.length" class="vd-grid vdm-grid">
      <div v-for="item in list" :key="item.id" class="vdm-item">
        <VideoCard :item="item" />
        <div class="vdm-foot">
          <p v-if="tab === 'history'" class="vdm-time">
            {{ formatWatchedAt(watchedAt(item.id)) }}
          </p>
          <button type="button" class="vdm-remove" @click="remove(item.id)">移除</button>
        </div>
      </div>
    </div>

    <div v-else class="vdm-empty">
      <p class="vdm-empty-title">{{ emptyText.title }}</p>
      <p class="vdm-empty-desc">{{ emptyText.desc }}</p>
      <router-link class="vdm-empty-btn" :to="{ name: 'home' }">去首页逛逛</router-link>
    </div>
  </div>
</template>

<style scoped>
.vdm-head {
  padding: 24px 0 0;
}

.vdm-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 34px;
  color: var(--vd-text);
}

.vdm-desc {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

.vdm-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 18px 0 20px;
  border-bottom: 1px solid var(--vd-border);
}

.vdm-tabs {
  gap: 24px;
  margin-bottom: 0;
  border-bottom: none;
}

.vdm-tab {
  padding: 8px 0 10px;
  font-size: 16px;
}

.vdm-tab.is-active {
  color: var(--vd-primary);
  border-bottom-color: var(--vd-primary);
}

.vdm-clear {
  border: none;
  background: none;
  margin-bottom: 10px;
  padding: 0;
  font-family: inherit;
  font-size: 14px;
  color: var(--vd-text-2);
  cursor: pointer;
  transition: color var(--vd-fast) var(--vd-ease);
}

.vdm-clear:hover {
  color: var(--vd-primary);
}

.vdm-grid {
  row-gap: 24px;
}

.vdm-item {
  position: relative;
}

/* 卡片自带 12px 下边距，这里由条目统一控制间距 */
.vdm-item :deep(.vd-card) {
  margin-bottom: 0;
}

/* 海报下方的信息行：左观看时间、右移除（不压在海报角标上） */
.vdm-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
  margin-top: 4px;
}

.vdm-time {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--vd-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vdm-remove {
  flex: 0 0 auto;
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
  color: var(--vd-text-3);
  cursor: pointer;
  transition: color var(--vd-fast) var(--vd-ease);
}

.vdm-remove:hover,
.vdm-remove:focus-visible {
  color: var(--vd-primary);
}

.vdm-empty {
  padding: 64px 0 80px;
  text-align: center;
}

.vdm-empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdm-empty-desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--vd-text-2);
}

.vdm-empty-btn {
  display: inline-block;
  margin-top: 18px;
  height: 34px;
  padding: 0 20px;
  border-radius: 5px;
  background: var(--vd-primary);
  color: #fff;
  font-size: 14px;
  line-height: 34px;
  transition: background var(--vd-fast) var(--vd-ease);
}

.vdm-empty-btn:hover {
  background: var(--vd-primary-dark);
}

@media (max-width: 900px) {
  .vdm-head {
    padding-top: 18px;
  }
  .vdm-title {
    font-size: 21px;
    line-height: 30px;
  }
}

@media (max-width: 560px) {
  .vdm-bar {
    gap: 10px;
  }
  .vdm-tabs {
    gap: 18px;
  }
  .vdm-tab {
    font-size: 15px;
  }
  .vdm-grid {
    row-gap: 18px;
  }
}
</style>
