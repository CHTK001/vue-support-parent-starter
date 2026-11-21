<script setup lang="ts">
/**
 * 统计概览：GET /v2/logger/stats。
 * - 级别分布：水平条形（CSS，按 --log-level-* 着色）；
 * - eps 吞吐趋势：轻量 SVG 自绘折线（不引图表库）；
 * - topLoggers：带比例条的榜单。
 */
import { computed, onMounted, ref } from "vue";
import { LOG_LEVELS, fetchStats, normLevel, type LoggerStats } from "../api/logger";

const stats = ref<LoggerStats | null>(null);
const loading = ref(false);

/** 级别分布条形：按 LOG_LEVELS 顺序排列，未知级别排尾部 */
const levelBars = computed(() => {
  const by = stats.value?.byLevel ?? {};
  const entries = Object.entries(by).map(([lv, count]) => ({ lv: normLevel(lv), count: Number(count) || 0 }));
  entries.sort((a, b) => {
    const ia = LOG_LEVELS.indexOf(a.lv);
    const ib = LOG_LEVELS.indexOf(b.lv);
    return (ia === -1 ? LOG_LEVELS.length : ia) - (ib === -1 ? LOG_LEVELS.length : ib);
  });
  const max = Math.max(1, ...entries.map((entry) => entry.count));
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  return entries.map((entry) => ({
    ...entry,
    pct: Math.round((entry.count / max) * 100),
    share: total > 0 ? Math.round((entry.count / total) * 1000) / 10 : 0,
  }));
});

const epsPoints = computed<number[]>(() => {
  const eps = stats.value?.eps ?? [];
  return eps.map((point) => (typeof point === "number" ? point : Number(point?.count) || 0));
});

/* eps 折线几何：固定 viewBox，等比映射到像素坐标 */
const EPS_W = 560;
const EPS_H = 140;
const EPS_PAD = 8;

const epsPolyline = computed(() => {
  const points = epsPoints.value;
  if (points.length === 0) return "";
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? (EPS_W - EPS_PAD * 2) / (points.length - 1) : 0;
  return points
    .map((value, index) => {
      const x = EPS_PAD + index * step;
      const y = EPS_H - EPS_PAD - (value / max) * (EPS_H - EPS_PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const epsMax = computed(() => Math.max(1, ...epsPoints.value));
const epsTotal = computed(() => epsPoints.value.reduce((sum, value) => sum + value, 0));

const topLoggers = computed(() => {
  const list = (stats.value?.topLoggers ?? []).map((item) => ({
    logger: item.logger || "-",
    count: Number(item.count) || 0,
  }));
  const max = Math.max(1, ...list.map((item) => item.count));
  return list.map((item) => ({ ...item, pct: Math.round((item.count / max) * 100) }));
});

async function load(): Promise<void> {
  loading.value = true;
  try {
    stats.value = await fetchStats();
  } catch {
    // 错误提示由 http 层统一弹出
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="stats-view logger-scope">
    <div class="stats-toolbar">
      <el-button size="small" plain :loading="loading" @click="load">刷新</el-button>
    </div>
    <div class="stats-grid">
      <!-- 级别分布 -->
      <div class="logger-card stat-card">
        <h3 class="stat-title">级别分布</h3>
        <el-empty v-if="levelBars.length === 0" description="暂无数据" :image-size="60" />
        <div v-for="bar in levelBars" :key="bar.lv" class="level-bar-row">
          <span class="level-bar-label">{{ bar.lv }}</span>
          <div class="level-bar-track">
            <div class="level-bar-fill" :class="`level-fill--${bar.lv.toLowerCase()}`" :style="{ width: `${bar.pct}%` }"></div>
          </div>
          <span class="level-bar-value">{{ bar.count }}（{{ bar.share }}%）</span>
        </div>
      </div>

      <!-- eps 吞吐趋势（自绘 SVG 折线） -->
      <div class="logger-card stat-card">
        <h3 class="stat-title">吞吐趋势（eps）</h3>
        <el-empty v-if="epsPoints.length === 0" description="暂无数据" :image-size="60" />
        <template v-else>
          <svg
            class="eps-svg"
            :viewBox="`0 0 ${EPS_W} ${EPS_H}`"
            preserveAspectRatio="none"
            role="img"
            aria-label="每秒日志条数趋势"
          >
            <polyline
              :points="epsPolyline"
              fill="none"
              stroke="var(--brand-500)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div class="eps-meta">
            <span>峰值 {{ epsMax }} eps</span>
            <span>区间合计 {{ epsTotal }}</span>
          </div>
        </template>
      </div>

      <!-- Top Logger 榜单 -->
      <div class="logger-card stat-card">
        <h3 class="stat-title">Top Logger</h3>
        <el-empty v-if="topLoggers.length === 0" description="暂无数据" :image-size="60" />
        <div v-for="(item, index) in topLoggers" :key="item.logger" class="top-row">
          <span class="top-rank">{{ index + 1 }}</span>
          <span class="top-logger" :title="item.logger">{{ item.logger }}</span>
          <div class="top-track">
            <div class="top-fill" :style="{ width: `${item.pct}%` }"></div>
          </div>
          <span class="top-count">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
