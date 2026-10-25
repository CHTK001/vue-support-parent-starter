<script setup lang="ts">
/**
 * 详情页（第三版 · 参照站复刻）
 *
 * 参照站 /mv/:id 结构：
 *   `.main-meta`（海报 288×432 + 信息区（22px/700 标题、浅蓝更新标签、
 *   16px 字段行、操作按钮）+ 右侧 264 宽的评分卡区）
 *   → `h2 电影简介` → `ul.all-tabs`（磁力/网盘/在线）→ 对应面板
 *   → `ul.content-list2`（7 列相关推荐）
 *
 * 差异说明：本项目数据源没有磁力资源，因此第三个页签对应
 * 「直链资源」（type=cl），网盘资源对应 type=pan。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { fetchVideoDetail, fetchVideoList } from "@/api/videoApi";
import type { VideoDetail, VideoInfo } from "@/types/video";
import VideoCard from "@/components/VideoCard.vue";
import { isFavorite, pushHistory, toggleFavorite } from "@/utils/library";

const route = useRoute();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(false);
const error = ref(false);
const lastError = ref("");
const detail = ref<VideoDetail | null>(null);
const activeLine = ref(0);
const activeTab = ref<"play" | "pan" | "cl">("play");
const related = ref<VideoInfo[]>([]);
const summaryOpen = ref(false);

/** 当前线路的集数列表 */
const episodes = computed(() => detail.value?.playLines?.[activeLine.value]?.episodes ?? []);

/** 网盘 / 直链资源 */
const panList = computed(() => (detail.value?.downloads ?? []).filter((d) => d.type === "pan"));
const clList = computed(() => (detail.value?.downloads ?? []).filter((d) => d.type === "cl"));

/** 类型中文名 */
const TYPE_LABEL: Record<string, string> = {
  movie: "电影",
  tv: "剧集",
  variety: "综艺",
  anime: "动漫",
  documentary: "纪录片",
};
const typeLabel = computed(() =>
  detail.value?.videoType ? (TYPE_LABEL[detail.value.videoType] ?? detail.value.videoType) : "",
);

/** 页签（带数量，参照站页签里的括号计数） */
const tabs = computed(() => [
  { key: "play" as const, label: "在线播放", count: episodes.value.length },
  { key: "pan" as const, label: "网盘资源", count: panList.value.length },
  { key: "cl" as const, label: "直链资源", count: clList.value.length },
]);

/** 是否已收藏（读写 localStorage，切换后立即反映到按钮） */
const faved = computed(() => (detail.value ? isFavorite(detail.value.id) : false));

function onToggleFavorite() {
  if (!detail.value) return;
  const added = toggleFavorite(detail.value);
  message.success(added ? "已加入收藏，可在右上角「收藏」查看" : "已取消收藏");
}

/* ── 数据加载 ─────────────────────────────── */
async function load() {  loading.value = true;
  error.value = false;
  try {
    const data = await fetchVideoDetail(String(route.params.id));
    detail.value = data;
    activeLine.value = 0;
    activeTab.value = "play";
    summaryOpen.value = false;
    pushHistory(data);
    void loadRelated(data);
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : "视频详情加载失败，请确认后端服务已启动";
    error.value = true;
    detail.value = null;
    related.value = [];
  } finally {
    loading.value = false;
  }
}

/** 相关推荐：同类型取 7 部，去掉当前条目 */
async function loadRelated(data: VideoDetail) {
  try {
    const result = await fetchVideoList({ videoType: data.videoType, page: 1, pageSize: 24 });
    related.value = (result.list ?? []).filter((v) => v.id !== data.id).slice(0, 7);
  } catch {
    related.value = [];
  }
}

/** 切换线路时回到第 1 集（列表顺序不变） */
watch(activeLine, () => {
  activeTab.value = "play";
});

/**
 * 新页面播放地址：本站 /play 路由 + url 查询参数。
 * 详情页只展示「名称 + 地址」，播放放到新标签页，避免详情页被播放器占满。
 */
function playHref(url: string) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/play?url=${encodeURIComponent(url)}`;
}

/** 顶栏「立即播放」：打开第一条可用地址 */
function openFirstPlay() {
  const first = episodes.value.find((ep) => ep.url);
  if (!first) {
    activeTab.value = "play";
    message.info("该影片暂无可用的播放地址");
    return;
  }
  window.open(playHref(first.url), "_blank", "noopener");
}

/** 复制资源地址 */
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败，请手动选择");
  }
}

onMounted(() => void load());

// 路由 id 变化（相关推荐点击）时重新加载
watch(
  () => route.params.id,
  () => {
    if (route.name === "watch") void load();
  },
);
</script>

<template>
  <div class="vd-page">
    <!-- 加载骨架 -->
    <div v-if="loading" class="vdw-skeleton" aria-busy="true">
      <div class="vd-poster-skeleton vdw-skeleton-poster" />
      <div class="vdw-skeleton-lines">
        <div class="vd-poster-skeleton vdw-sk-line" style="width: 46%" />
        <div class="vd-poster-skeleton vdw-sk-line" style="width: 80%" />
        <div class="vd-poster-skeleton vdw-sk-line" style="width: 70%" />
      </div>
    </div>

    <!-- 错误空态 -->
    <div v-else-if="error || !detail" class="vd-empty">
      <el-empty :description="lastError || '视频详情加载失败'">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- ═══ 头部信息区 ═══════════════════════ -->
      <div class="vdw-main">
        <div class="vdw-meta">
          <!-- 海报 -->
          <div class="vdw-poster">
            <img v-if="detail.cover" :src="detail.cover" :alt="detail.name" />
            <div v-else class="vdw-poster-fallback">暂无封面</div>
          </div>

          <!-- 信息 -->
          <div class="vdw-info">
            <h1 class="vdw-title">
              {{ detail.name }}<template v-if="detail.year"> ({{ detail.year }})</template>
            </h1>

            <div v-if="detail.updateTime || detail.continueInfo" class="vdw-update-chip">
              {{ detail.updateTime ? `最后更新于 ${detail.updateTime}` : detail.continueInfo }}
            </div>

            <div v-if="typeLabel" class="vdw-field"><span>类型：</span>{{ typeLabel }}</div>
            <div v-if="detail.district" class="vdw-field"><span>地区：</span>{{ detail.district }}</div>
            <div v-if="detail.year" class="vdw-field"><span>年份：</span>{{ detail.year }}</div>
            <div v-if="detail.tags?.length" class="vdw-field">
              <span>标签：</span>{{ detail.tags.join(" / ") }}
            </div>
            <div v-if="detail.director" class="vdw-field"><span>导演：</span>{{ detail.director }}</div>
            <div v-if="detail.actor" class="vdw-field"><span>主演：</span>{{ detail.actor }}</div>
            <div v-if="detail.continueInfo" class="vdw-field">
              <span>状态：</span>{{ detail.continueInfo }}
            </div>

            <div class="vdw-actions">
              <button type="button" class="vdw-btn-primary" @click="openFirstPlay">
                立即播放
              </button>
              <button
                type="button"
                class="vdw-btn-ghost"
                :class="{ 'is-on': faved }"
                @click="onToggleFavorite"
              >
                {{ faved ? "已收藏" : "添加收藏" }}
              </button>
            </div>
          </div>

          <!-- 评分卡区 -->
          <aside class="vdw-ratings">
            <div class="vdw-rating-card">
              <div class="vdw-rating-label">评分</div>
              <div class="vdw-rating-value">
                {{ detail.score ? detail.score.toFixed(1) : "暂无" }}
              </div>
            </div>
            <div class="vdw-rating-card">
              <div class="vdw-rating-label">类型</div>
              <div class="vdw-rating-text">{{ typeLabel || "未知" }}</div>
            </div>
            <div class="vdw-rating-card">
              <div class="vdw-rating-label">资源</div>
              <div class="vdw-rating-text">
                在线 {{ episodes.length }} · 网盘 {{ panList.length }} · 直链 {{ clList.length }}
              </div>
            </div>
          </aside>
        </div>

        <!-- ═══ 简介 ═══════════════════════════ -->
        <section v-if="detail.remark" class="vdw-block">
          <h2 class="vdw-h2">影片简介</h2>
          <div class="vdw-summary">
            <p class="vdw-summary-text" :class="{ 'is-open': summaryOpen }">{{ detail.remark }}</p>
            <button
              v-if="detail.remark.length > 90"
              type="button"
              class="vdw-summary-more"
              @click="summaryOpen = !summaryOpen"
            >
              {{ summaryOpen ? "收起" : "展开全部" }}
            </button>
          </div>
        </section>

        <!-- ═══ 资源页签 ═══════════════════════ -->
        <section class="vdw-block">
          <ul class="vdw-tabs" role="tablist" aria-label="资源类型">
            <li
              v-for="t in tabs"
              :key="t.key"
              role="tab"
              :aria-selected="activeTab === t.key"
              :class="{ on: activeTab === t.key }"
              tabindex="0"
              @click="activeTab = t.key"
              @keydown.enter="activeTab = t.key"
            >
              {{ t.label }}<i v-if="t.count">({{ t.count }})</i>
            </li>
          </ul>

          <!-- 在线播放：只列「名称 + 地址」，点击「播放」在新页面播放 -->
          <div v-show="activeTab === 'play'" class="vdw-panel">
            <h2 class="vdw-h2">在线播放</h2>

            <div v-if="(detail.playLines?.length ?? 0) > 1" class="vdw-line-row">
              <span class="vdw-row-label">线路：</span>
              <div class="vdw-episodes">
                <button
                  v-for="(line, li) in detail.playLines"
                  :key="line.line"
                  type="button"
                  class="vd-chip"
                  :class="{ 'is-active': activeLine === li }"
                  @click="activeLine = li"
                >
                  {{ line.line }}
                </button>
              </div>
            </div>

            <table v-if="episodes.length" class="vdw-table">
              <thead>
                <tr>
                  <th width="200">名称</th>
                  <th>地址</th>
                  <th width="130" class="vdw-table-ops">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ep in episodes" :key="ep.index">
                  <td class="vdw-table-name">{{ ep.name || `第 ${ep.index} 集` }}</td>
                  <td class="vdw-table-url">
                    <span v-if="ep.url" :title="ep.url">{{ ep.url }}</span>
                    <span v-else>—</span>
                  </td>
                  <td class="vdw-table-ops">
                    <template v-if="ep.url">
                      <a
                        :href="playHref(ep.url)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="vdw-play-link"
                        >播放</a
                      >
                      <a href="#" @click.prevent="copyUrl(ep.url)">复制</a>
                    </template>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="vdw-inline-empty">该影片暂无可用的在线播放地址</div>

            <p class="vdw-tip">
              「播放」会在新标签页打开播放器；也可以复制地址到本地播放器使用。
            </p>
          </div>

          <!-- 网盘资源 / 直链资源 -->
          <div
            v-for="group in [
              { key: 'pan', label: '网盘资源', list: panList },
              { key: 'cl', label: '直链资源', list: clList },
            ]"
            v-show="activeTab === group.key"
            :key="group.key"
            class="vdw-panel"
          >
            <h2 class="vdw-h2">{{ group.label }}</h2>
            <table v-if="group.list.length" class="vdw-table">
              <thead>
                <tr>
                  <th width="240">名称</th>
                  <th>地址</th>
                  <th width="90" class="vdw-table-ops">提取码</th>
                  <th width="120" class="vdw-table-ops">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dl, i) in group.list" :key="i">
                  <td class="vdw-table-name">{{ dl.name || "未命名资源" }}</td>
                  <td class="vdw-table-url">
                    <a :href="dl.url" target="_blank" rel="noreferrer noopener" :title="dl.url">{{
                      dl.url
                    }}</a>
                  </td>
                  <td class="vdw-table-ops">{{ dl.password || "—" }}</td>
                  <td class="vdw-table-ops">
                    <a :href="dl.url" target="_blank" rel="noreferrer noopener">打开</a>
                    <a href="#" @click.prevent="copyUrl(dl.url)">复制</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="vdw-inline-empty">暂无{{ group.label }}</div>
          </div>
        </section>

        <!-- ═══ 相关推荐 ═══════════════════════ -->
        <section v-if="related.length" class="vdw-block">
          <h2 class="vdw-h2">相关推荐</h2>
          <div class="vd-grid vdw-grid-7">
            <VideoCard v-for="item in related" :key="item.id" :item="item" />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   头部信息区
   ═══════════════════════════════════════════ */
.vdw-main {
  margin-top: 15px;
}

.vdw-meta {
  display: flex;
  flex-direction: row;
}

.vdw-poster {
  flex-shrink: 0;
  width: 288px;
  height: 432px;
  background: var(--vd-surface);
  border-radius: 5px;
  overflow: hidden;
}

.vdw-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vdw-poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vd-text-2);
  font-size: 13px;
}

.vdw-info {
  flex: 1;
  min-width: 0;
  padding: 0 20px;
}

.vdw-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
  line-height: 33px;
  color: var(--vd-text);
}

/* 浅蓝更新标签（参照站 .otherbox） */
.vdw-update-chip {
  display: inline-block;
  padding: 4px 10px 3px;
  margin-bottom: 6px;
  background: var(--vd-primary-soft);
  border-radius: var(--vd-radius);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: var(--vd-text);
}

/* 字段行：16px / 行高 28.8，标签固定 48px */
.vdw-field {
  font-size: 16px;
  line-height: 28.8px;
  color: var(--vd-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.vdw-field span {
  display: inline-block;
  width: 48px;
}

.vdw-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  margin: 10px 0 0;
}

.vdw-btn-primary {
  height: 30px;
  padding: 0 16px;
  border: none;
  border-radius: 5px;
  background: var(--vd-primary);
  color: #fff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 30px;
  cursor: pointer;
  transition: background var(--vd-fast) var(--vd-ease);
}

.vdw-btn-primary:hover {
  background: var(--vd-primary-dark);
}

.vdw-btn-ghost {
  height: 30px;
  padding: 0 16px;
  border: none;
  border-radius: 5px;
  background: var(--vd-chip);
  color: var(--vd-text);
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 30px;
  cursor: pointer;
  transition: background var(--vd-fast) var(--vd-ease);
}

.vdw-btn-ghost:hover {
  background: var(--vd-border-2);
}

/* 已收藏状态：浅蓝底 + 主色文字 */
.vdw-btn-ghost.is-on {
  background: var(--vd-primary-soft);
  color: var(--vd-primary);
}

/* ── 右侧评分卡区（264 宽 / 浅灰圆角容器） ── */
.vdw-ratings {
  flex-shrink: 0;
  width: 264px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  background: var(--vd-surface);
  border-radius: 8px;
  align-self: flex-start;
  box-sizing: border-box;
}

.vdw-rating-card {
  background: var(--vd-bg);
  border-radius: 6px;
  padding: 15px;
}

.vdw-rating-label {
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

.vdw-rating-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 44px;
  color: var(--vd-primary);
}

.vdw-rating-text {
  font-size: 16px;
  line-height: 24px;
  color: var(--vd-text);
  margin-top: 4px;
}

/* ═══════════════════════════════════════════
   区块 / 简介
   ═══════════════════════════════════════════ */
.vdw-block {
  display: block;
}

.vdw-h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
  font-size: 20px;
  font-weight: 400;
  line-height: 20px;
  color: var(--vd-text);
}

.vdw-summary {
  position: relative;
}

.vdw-summary-text {
  margin: 0;
  font-size: 16px;
  line-height: 28.8px;
  color: var(--vd-text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.vdw-summary-text.is-open {
  -webkit-line-clamp: unset;
  display: block;
}

.vdw-summary-more {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0 0 0 20px;
  border: none;
  background: var(--vd-bg);
  color: var(--vd-link);
  font-family: inherit;
  font-size: 16px;
  line-height: 28.8px;
  cursor: pointer;
}

.vdw-summary-more:hover {
  color: var(--vd-primary);
}

/* ═══════════════════════════════════════════
   页签（灰底圆角条，选中深灰）
   ═══════════════════════════════════════════ */
.vdw-tabs {
  display: flex;
  flex-direction: row;
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
  background: var(--vd-surface);
  border-radius: var(--vd-radius);
  width: fit-content;
}

.vdw-tabs li {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  min-width: 133px;
  padding: 10px 16px;
  font-size: 16px;
  line-height: 24px;
  color: var(--vd-text);
  cursor: pointer;
  border-radius: var(--vd-radius);
  transition: background var(--vd-fast) var(--vd-ease);
}

.vdw-tabs li:hover {
  color: var(--vd-primary);
}

.vdw-tabs li.on {
  background: var(--vd-chip);
  color: var(--vd-text);
  font-weight: 700;
}

.vdw-tabs li i {
  font-style: normal;
  font-weight: 400;
  color: var(--vd-text-2);
}

/* ═══════════════════════════════════════════
   面板
   ═══════════════════════════════════════════ */
.vdw-panel {
  padding: 0 0 10px;
}

/* 详情页不做内嵌播放，播放统一在新标签页的 /play 页进行 */
.vdw-inline-empty {
  padding: 24px 0;
  font-size: 16px;
  color: var(--vd-text-2);
}

.vdw-line-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 4px 0;
}

.vdw-row-label {
  flex-shrink: 0;
  width: 56px;
  font-size: 16px;
  line-height: 30px;
  color: var(--vd-text-2);
}

.vdw-episodes {
  flex: 1;
  min-width: 0;
}

.vdw-tip {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

/* ── 资源表（参照站 table.bit_list）：名称 / 地址 / 操作 ── */
.vdw-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 16px;
}

.vdw-table th,
.vdw-table td {
  padding: 9px 10px;
  text-align: left;
  border-bottom: 1px solid var(--vd-border);
  vertical-align: middle;
}

.vdw-table th {
  background: var(--vd-surface);
  font-weight: 400;
  font-size: 14px;
  color: var(--vd-text-2);
}

/* 地址列：单行省略，悬停看完整地址 */
.vdw-table-url {
  overflow: hidden;
  font-size: 14px;
  color: var(--vd-text-2);
}

.vdw-table-url > * {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作 / 提取码列居中（需要压过 .vdw-table th 的左对齐） */
.vdw-table th.vdw-table-ops,
.vdw-table td.vdw-table-ops {
  text-align: center;
  white-space: nowrap;
}

.vdw-table-ops a {
  margin: 0 6px;
  color: var(--vd-link);
}

.vdw-table-ops a:hover {
  color: var(--vd-primary);
  text-decoration: underline;
}

.vdw-play-link {
  font-weight: 600;
}

.vdw-table tbody tr:hover {
  background: var(--vd-primary-soft);
}

.vdw-table-name {
  word-break: break-all;
}

/* ═══════════════════════════════════════════
   相关推荐（参照站 7 列）
   ═══════════════════════════════════════════ */
.vdw-grid-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

/* ═══════════════════════════════════════════
   骨架
   ═══════════════════════════════════════════ */
.vdw-skeleton {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.vdw-skeleton-poster {
  width: 288px;
  height: 432px;
  flex-shrink: 0;
}

.vdw-skeleton-lines {
  flex: 1;
}

.vdw-sk-line {
  height: 20px;
  margin-bottom: 14px;
  border-radius: 4px;
}

/* ═══════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════ */
@media (max-width: 1100px) {
  .vdw-grid-7 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .vdw-ratings {
    width: 220px;
  }
  .vdw-poster {
    width: 230px;
    height: 345px;
  }
}

@media (max-width: 860px) {
  .vdw-meta {
    flex-wrap: wrap;
  }
  .vdw-info {
    padding-right: 0;
  }
  .vdw-ratings {
    width: 100%;
    margin-top: 16px;
    flex-direction: row;
    gap: 10px;
  }
  .vdw-rating-card {
    flex: 1;
  }
}

@media (max-width: 760px) {
  .vdw-grid-7 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .vdw-title {
    font-size: 19px;
    line-height: 28px;
  }
  .vdw-field {
    font-size: 14px;
    line-height: 24px;
  }
  .vdw-field span {
    width: 44px;
  }
}

@media (max-width: 520px) {
  .vdw-poster {
    width: 140px;
    height: 210px;
  }
  .vdw-info {
    padding-left: 12px;
  }
  /* 评分卡在手机上横排太挤，改为纵向排列并压缩高度 */
  .vdw-ratings {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .vdw-rating-card {
    flex: none;
    padding: 10px 14px;
  }
  .vdw-rating-value {
    font-size: 26px;
    line-height: 34px;
  }
  .vdw-grid-7 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vdw-tabs li {
    min-width: 0;
    padding: 10px 12px;
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vdw-btn-primary,
  .vdw-btn-ghost,
  .vdw-tabs li {
    transition: none;
  }
}
</style>
