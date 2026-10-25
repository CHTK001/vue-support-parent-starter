<script setup lang="ts">
/**
 * 画像分区外壳 —— 7 个分区共用的骨架。
 *
 * <p>结构固定为「聚合条 → 工具条 → 内容区」三段：聚合条回答「整体什么情况」，
 * 工具条只放检索 / 翻页 / 刷新，内容区各自实现自己的形态（卡片、排名条、分组行）。</p>
 *
 * <p>本组件只管骨架与交互出口，不持有业务数据、不发请求，方便各分区复用同一套间距与状态呈现。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import type { StripItem } from "./types";

interface Props {
  /** 顶部聚合条内容；空数组则不渲染 */
  strip?: StripItem[];
  /** 是否后端分页 */
  paged?: boolean;
  page?: number;
  pageSize?: number;
  /** 分页分区的总行数；非分页分区传已过滤后的行数 */
  total?: number;
  /** 后端是否因采集上限截断 */
  truncated?: boolean;
  /** 检索关键字 */
  keyword?: string;
  keywordPlaceholder?: string;
  /** 是否显示检索框（网络分区不需要） */
  searchable?: boolean;
  loading?: boolean;
  error?: string;
  /** 内容为空时的提示 */
  emptyText?: string;
  /** 是否已有可渲染的数据（false 且 loading 时显示加载态） */
  hasRows?: boolean;
  /** 分区名，用于「共 N 条」的文案 */
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  strip: () => [],
  paged: false,
  page: 1,
  pageSize: 10,
  total: 0,
  truncated: false,
  keyword: "",
  keywordPlaceholder: "关键字过滤",
  searchable: true,
  loading: false,
  error: "",
  emptyText: "该分区无数据",
  hasRows: false,
  unit: "条",
});

const emit = defineEmits<{
  /** 输入过程中的实时关键字（本地过滤用，不触发请求） */
  (e: "search", keyword: string): void;
  /** 用户确认检索（回车 / 点搜索 / 清空），分页分区据此重新请求 */
  (e: "commit", keyword: string): void;
  (e: "page", delta: number): void;
  (e: "refresh"): void;
}>();

/** 检索框本地草稿：输入过程只回传 search，回车或点「搜索」才 commit 触发请求 */
const draft = ref(String(props.keyword || ""));
watch(() => props.keyword, v => { draft.value = String(v || ""); });

function onInput(v: string): void {
  draft.value = v;
  emit("search", v);
}
function commitSearch(): void {
  emit("commit", draft.value);
}

/** 统计文案：分页分区说「命中 / 共 N 条」，非分页说「共 N 条」 */
const countText = computed(() => {
  const kw = String(props.keyword || "").trim();
  const prefix = kw ? "命中 " : "";
  if (props.paged) {
    const base = `${prefix}${props.total} ${props.unit}`;
    return props.truncated ? `${base}（已达采集上限，仅显示前 500 条）` : base;
  }
  return `${prefix}${props.total} ${props.unit}`;
});

const canPrev = computed(() => props.paged && props.page > 1 && !props.loading);
const canNext = computed(() => props.paged && !props.loading && props.page * props.pageSize < props.total);
</script>

<template>
  <div class="pfs">
    <!-- 聚合条：先看数字 -->
    <div v-if="strip.length" class="pf-strip">
      <div v-for="item in strip" :key="item.label" class="pf-stat">
        <span class="pf-stat-l">{{ item.label }}</span>
        <span :class="['pf-stat-v', item.tone ? `t-${item.tone}` : '']">{{ item.value }}</span>
        <span v-if="item.sub" class="pf-stat-s">{{ item.sub }}</span>
      </div>
    </div>

    <!-- 工具条 -->
    <div class="pfs-bar">
      <span class="pfs-count pf-dim">{{ countText }}</span>
      <div class="pfs-tools">
        <ReInput
          v-if="searchable"
          :model-value="draft"
          class="pfs-search"
          :placeholder="keywordPlaceholder"
          clearable
          @update:model-value="onInput"
          @keyup.enter="commitSearch"
          @clear="(onInput(''), commitSearch())"
        />
        <template v-if="paged">
          <button class="pf-btn" :disabled="loading" @click="commitSearch">搜索</button>
          <button class="pf-btn" :disabled="!canPrev" @click="emit('page', -1)">上一页</button>
          <span class="pfs-page pf-mono">{{ page }}</span>
          <button class="pf-btn" :disabled="!canNext" @click="emit('page', 1)">下一页</button>
        </template>
        <slot name="tools" />
        <button class="pf-btn" :disabled="loading" @click="emit('refresh')">
          {{ loading ? "刷新中…" : "刷新" }}
        </button>
      </div>
    </div>

    <!-- 内容 -->
    <div v-if="error" class="pf-error">{{ error }}</div>
    <div v-else-if="loading && !hasRows" class="pf-loading">正在拉取…</div>
    <div v-else-if="!hasRows" class="pf-empty">{{ keyword.trim() ? "关键字未命中任何一行" : emptyText }}</div>
    <div v-else class="pfs-body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.pfs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
/* 工具条：搜索 + 分页 + 刷新 全部一行（不换行、不占第二行高度） */
.pfs-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  margin-bottom: 8px;
}
.pfs-count {
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.pfs-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  margin-left: auto;
}
.pfs-search {
  width: 176px;
  flex-shrink: 0;
}
.pfs-page {
  min-width: 22px;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.pfs-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
