<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ep:data-analysis" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频数据报告</h2>
          <p class="page-header-desc">视频库整体数据统计与分析</p>
        </div>
      </div>
      <div class="page-header-actions">
        <ScButton type="primary" @click="loadData">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新数据
        </ScButton>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-card--primary">
        <div class="stat-card__icon"><IconifyIconOnline icon="ep:video-camera" /></div>
        <div class="stat-card__info">
          <p class="stat-card__label">总视频数</p>
          <p class="stat-card__value">{{ stats?.totalVideos ?? '-' }}</p>
        </div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon"><IconifyIconOnline icon="ep:download" /></div>
        <div class="stat-card__info">
          <p class="stat-card__label">总下载数</p>
          <p class="stat-card__value">{{ stats?.totalDownloads ?? '-' }}</p>
        </div>
      </div>
      <div class="stat-card stat-card--warning">
        <div class="stat-card__icon"><IconifyIconOnline icon="ep:search" /></div>
        <div class="stat-card__info">
          <p class="stat-card__label">关键词数</p>
          <p class="stat-card__value">{{ stats?.totalKeywords ?? '-' }}</p>
        </div>
      </div>
      <div class="stat-card stat-card--info">
        <div class="stat-card__icon"><IconifyIconOnline icon="ep:connection" /></div>
        <div class="stat-card__info">
          <p class="stat-card__label">视频源数</p>
          <p class="stat-card__value">{{ stats?.totalSources ?? '-' }}</p>
        </div>
      </div>
      <div class="stat-card stat-card--danger">
        <div class="stat-card__icon"><IconifyIconOnline icon="ep:refresh" /></div>
        <div class="stat-card__info">
          <p class="stat-card__label">同步配置</p>
          <p class="stat-card__value">{{ stats?.totalSyncConfigs ?? '-' }}</p>
        </div>
      </div>
    </div>

    <!-- 图表行 -->
    <div class="charts-grid">
      <!-- 分类分布 -->
      <div class="chart-card">
        <h3 class="chart-card__title">分类分布</h3>
        <ScEcharts v-if="categoryOption" :option="categoryOption" height="300px" />
        <div v-else class="chart-card__empty">暂无数据</div>
      </div>

      <!-- 类型分布 -->
      <div class="chart-card">
        <h3 class="chart-card__title">类型分布</h3>
        <ScEcharts v-if="typeOption" :option="typeOption" height="300px" />
        <div v-else class="chart-card__empty">暂无数据</div>
      </div>

      <!-- 年份分布 -->
      <div class="chart-card chart-card--full">
        <h3 class="chart-card__title">年份分布</h3>
        <ScEcharts v-if="yearOption" :option="yearOption" height="300px" />
        <div v-else class="chart-card__empty">暂无数据</div>
      </div>

      <!-- 地区分布 -->
      <div class="chart-card">
        <h3 class="chart-card__title">地区分布</h3>
        <ScEcharts v-if="districtOption" :option="districtOption" height="300px" />
        <div v-else class="chart-card__empty">暂无数据</div>
      </div>

      <!-- 最近7天新增 -->
      <div class="chart-card">
        <h3 class="chart-card__title">最近7天新增</h3>
        <ScEcharts v-if="recentOption" :option="recentOption" height="300px" />
        <div v-else class="chart-card__empty">暂无数据</div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div class="rankings-grid">
      <!-- 播放量前十 -->
      <div class="ranking-card">
        <h3 class="ranking-card__title">
          <IconifyIconOnline icon="ep:trend-chart" class="ranking-card__icon" />
          播放量 TOP 10
        </h3>
        <div v-if="stats?.topViewed?.length" class="ranking-list">
          <div
            v-for="(item, index) in stats.topViewed"
            :key="item.video_id"
            class="ranking-item"
          >
            <span class="ranking-item__index" :class="getRankClass(index)">{{ index + 1 }}</span>
            <span class="ranking-item__name">{{ item.video_name || '未知' }}</span>
            <span class="ranking-item__value">{{ formatNumber(item.count) }}</span>
          </div>
        </div>
        <div v-else class="ranking-card__empty">暂无数据</div>
      </div>

      <!-- 评分前十 -->
      <div class="ranking-card">
        <h3 class="ranking-card__title">
          <IconifyIconOnline icon="ep:star" class="ranking-card__icon" />
          评分 TOP 10
        </h3>
        <div v-if="stats?.topRated?.length" class="ranking-list">
          <div
            v-for="(item, index) in stats.topRated"
            :key="item.video_id"
            class="ranking-item"
          >
            <span class="ranking-item__index" :class="getRankClass(index)">{{ index + 1 }}</span>
            <span class="ranking-item__name">{{ item.video_name || '未知' }}</span>
            <span class="ranking-item__value">{{ Number(item.count).toFixed(1) }}</span>
          </div>
        </div>
        <div v-else class="ranking-card__empty">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 视频数据报告页面
 * @author CH
 * @since 2025-09-16
 */
import { computed, onMounted, ref } from "vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { getVideoReportStatistics } from "../../api/report";
import type { VideoReportStatistics } from "../../api/report";

const stats = ref<VideoReportStatistics | null>(null);
const loading = ref(false);

/**
 * 加载数据
 */
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getVideoReportStatistics();
    if (res.data) {
      stats.value = res.data;
    }
  } catch (e) {
    console.error("加载报告数据失败", e);
  } finally {
    loading.value = false;
  }
};

// ----- ECharts 配置项 (computed) -----

const categoryOption = computed(() => {
  if (!stats.value?.categoryDistribution?.length) return null;
  return {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: "#999" } },
    series: [{
      type: "pie",
      radius: ["35%", "60%"],
      center: ["50%", "45%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: "transparent" },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14 } },
      data: stats.value.categoryDistribution.map((item) => ({
        name: formatCategory(item.name),
        value: item.count,
      })),
    }],
  };
});

const typeOption = computed(() => {
  if (!stats.value?.typeDistribution?.length) return null;
  return {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: "#999" } },
    series: [{
      type: "pie",
      radius: ["35%", "60%"],
      center: ["50%", "45%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: "transparent" },
      label: { show: false },
      data: stats.value.typeDistribution.map((item) => ({
        name: item.name,
        value: item.count,
      })),
    }],
  };
});

const yearOption = computed(() => {
  if (!stats.value?.yearDistribution?.length) return null;
  const data = stats.value.yearDistribution.slice(0, 20).reverse();
  return {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, bottom: 30, top: 10 },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d.name),
      axisLabel: { color: "#999" },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#999" },
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } },
    },
    series: [{
      type: "bar",
      data: data.map((d) => d.count),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#409EFF" },
            { offset: 1, color: "#79bbff" },
          ] },
      },
    }],
  };
});

const districtOption = computed(() => {
  if (!stats.value?.districtDistribution?.length) return null;
  const data = stats.value.districtDistribution;
  return {
    tooltip: { trigger: "axis" as const },
    grid: { left: 80, right: 20, bottom: 30, top: 10 },
    xAxis: {
      type: "value" as const,
      axisLabel: { color: "#999" },
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } },
    },
    yAxis: {
      type: "category" as const,
      data: data.map((d) => d.name).reverse(),
      axisLabel: { color: "#999" },
    },
    series: [{
      type: "bar",
      data: data.map((d) => d.count).reverse(),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: { type: "linear", x: 0, y: 0, x: 1, y: 0,
          colorStops: [
            { offset: 0, color: "#36CE9E" },
            { offset: 1, color: "#7ddfb8" },
          ] },
      },
    }],
  };
});

const recentOption = computed(() => {
  if (!stats.value?.recentDailyAdded?.length) return null;
  const data = stats.value.recentDailyAdded;
  return {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, bottom: 30, top: 10 },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d.name),
      axisLabel: { color: "#999" },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#999" },
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } },
    },
    series: [{
      type: "line",
      data: data.map((d) => d.count),
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { width: 3, color: "#f56e6a" },
      areaStyle: {
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(245,110,106,0.3)" },
            { offset: 1, color: "rgba(245,110,106,0.02)" },
          ] },
      },
    }],
  };
});

// ----- 工具方法 -----

const formatCategory = (cat: string): string => {
  const map: Record<string, string> = {
    MV: "电影", TV: "电视剧", AC: "动漫", DOC: "纪录片",
    VAR: "综艺", SP: "体育", MUSIC: "音乐",
  };
  return map[cat] || cat;
};

const formatNumber = (val: any): string => {
  const n = Number(val);
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return String(n);
};

const getRankClass = (index: number): string => {
  if (index === 0) return "rank-gold";
  if (index === 1) return "rank-silver";
  if (index === 2) return "rank-bronze";
  return "";
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &-content { display: flex; align-items: center; gap: 16px; }
  &-icon { font-size: 48px; opacity: 0.9; }
  &-title { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
  &-desc { margin: 0; font-size: 14px; opacity: 0.9; }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }

  &__icon {
    font-size: 36px;
    opacity: 0.85;
  }
  &__label { margin: 0 0 4px; font-size: 13px; color: var(--el-text-color-secondary); }
  &__value { margin: 0; font-size: 28px; font-weight: 700; }

  &--primary &__icon { color: #409EFF; }
  &--success &__icon { color: #36CE9E; }
  &--warning &__icon { color: #f56e6a; }
  &--info &__icon { color: #909399; }
  &--danger &__icon { color: #e6a23c; }
}

/* 图表 */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &--full { grid-column: 1 / -1; }
  &__title { margin: 0 0 16px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
  &__empty { height: 300px; display: flex; align-items: center; justify-content: center; color: var(--el-text-color-secondary); }
}

/* 排行榜 */
.rankings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ranking-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &__title {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &__icon { color: #e6a23c; }
  &__empty { height: 200px; display: flex; align-items: center; justify-content: center; color: var(--el-text-color-secondary); }
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover { background: rgba(0, 0, 0, 0.03); }

  &__index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    background: rgba(128, 128, 128, 0.1);
    color: var(--el-text-color-secondary);
    flex-shrink: 0;

    &.rank-gold { background: #e6b422; color: white; }
    &.rank-silver { background: #a8a8a8; color: white; }
    &.rank-bronze { background: #cd7f32; color: white; }
  }

  &__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .charts-grid, .rankings-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
}
</style>
