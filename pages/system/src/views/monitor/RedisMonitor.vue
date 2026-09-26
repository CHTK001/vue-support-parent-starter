<script setup lang="ts">
/**
 * Redis 监控页面（REST 版 · Bento 布局）
 *
 * 进入页面拉一次，手动刷新。图表走 ReEChart。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import type { EChartsOption } from "echarts";
import { Refresh, Coin, Connection, Clock, Histogram, Cpu, DataLine, Box } from "@element-plus/icons-vue";
import ReEChart from "../components/ReEChart.vue";
import { getRedisInfo } from "../../api/systemApi";
import type { RedisInfo } from "../../api/types";
import { useElColors, withAlpha } from "./echarts-colors";

const colors = useElColors();

const info = ref<RedisInfo>({});
const loading = ref(false);
const updateTime = ref("");

async function loadInfo() {
  loading.value = true;
  try {
    const res = await getRedisInfo();
    info.value = res?.data ?? {};
    updateTime.value = new Date().toLocaleTimeString();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Redis 信息加载失败");
  } finally {
    loading.value = false;
  }
}
onMounted(() => { loadInfo(); });

/* ============ 工具函数 ============ */
function formatKps(v?: number): string { return (v ?? 0).toFixed(2); }
function dash(v?: string | number | null): string { return (v === undefined || v === null || v === "") ? "—" : String(v); }

/* ============ 内存自适应逻辑 ============ */
/** maxMemoryBytes > 0 → 有上限；否则无限制 */
const hasMaxMemory = computed(() => (info.value.maxMemoryBytes ?? 0) > 0);
/** 有峰值可比较时 used/peak 才有意义 */
const hasPeakMemory = computed(() => (info.value.usedMemoryPeakBytes ?? 0) > 0);

/** 仪表百分比：有上限用 used/max；无上限有峰值用 used/peak；否则不显示百分比 */
const memoryPercent = computed(() => {
  if (hasMaxMemory.value) {
    const used = info.value.usedMemoryBytes ?? 0;
    const max = info.value.maxMemoryBytes ?? 0;
    return Math.min(100, Math.round((used / max) * 1000) / 10);
  }
  if (hasPeakMemory.value) {
    const used = info.value.usedMemoryBytes ?? 0;
    const peak = info.value.usedMemoryPeakBytes ?? 0;
    return Math.min(100, Math.round((used / peak) * 1000) / 10);
  }
  return 0;
});

/** 仪表是否显示百分比（无上限且无峰值时退化为纯数值展示） */
const memoryShowPercent = computed(() => hasMaxMemory.value || hasPeakMemory.value);

const memoryGaugeColor = computed(() => {
  if (memoryPercent.value >= 80) return colors.danger;
  if (memoryPercent.value >= 60) return colors.warning;
  return colors.primary;
});

/* ============ ECharts ============ */
const commandOption = computed<EChartsOption>(() => {
  const stats = info.value.commandStats ?? [];
  const data = stats.map((s) => ({ name: s.command ?? "", value: s.calls ?? 0 }));
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", left: 0, top: "middle", textStyle: { color: colors.textSecondary, fontSize: 12 }, itemWidth: 8, itemHeight: 8 },
    series: [{
      type: "pie", radius: ["52%", "75%"], center: ["62%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: colors.bgColor, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: false }, itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.1)" } },
      data,
    }],
  };
});

const memoryOption = computed<EChartsOption | null>(() => {
  if (!memoryShowPercent.value) return null;
  const gaugeLabel = hasMaxMemory.value ? "内存占用" : "已用/峰值";
  return {
    series: [{
      type: "gauge", startAngle: 210, endAngle: -30, min: 0, max: 100,
      radius: "92%", center: ["50%", "58%"],
      progress: { show: true, width: 18, roundCap: true, itemStyle: { color: memoryGaugeColor.value } },
      axisLine: { lineStyle: { width: 18, color: [[1, colors.fill]] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      pointer: { show: false }, anchor: { show: false },
      detail: { valueAnimation: true, fontSize: 22, fontWeight: 600, offsetCenter: [0, "0%"], formatter: "{value}%", color: colors.textPrimary },
      title: { offsetCenter: [0, "35%"], fontSize: 12, color: colors.textSecondary },
      data: [{ value: memoryPercent.value, name: gaugeLabel }],
    }],
  };
});

/** 键空间分布柱状图 */
const keyspaceOption = computed<EChartsOption>(() => {
  const ks = info.value.keyspaceDetails ?? [];
  return {
    grid: { left: 8, right: 8, top: 16, bottom: 24, containLabel: true },
    xAxis: { type: "category", data: ks.map((k) => k.db ?? ""), axisLabel: { color: colors.textSecondary, fontSize: 11 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: colors.borderLight } }, axisLabel: { color: colors.textSecondary, fontSize: 10 } },
    tooltip: { trigger: "axis" },
    series: [{
      type: "bar", data: ks.map((k) => k.keys ?? 0),
      barWidth: "50%",
      itemStyle: { borderRadius: [3, 3, 0, 0], color: colors.primary },
    }],
  };
});
</script>

<template>
  <div class="system-page redis-monitor">
    <!-- 页头卡片 -->
    <div class="page-card header-card">
      <div>
        <div class="header-card__title">Redis 监控</div>
        <div class="header-card__subtitle">实时查看 Redis 运行状态、命令统计与内存消耗</div>
      </div>
      <div class="header-card__right">
        <span class="header-card__time">更新于 {{ updateTime || "--:--:--" }}</span>
        <ReButton layout="square" icon="Refresh" :loading="loading" @click="loadInfo">刷新</ReButton>
      </div>
    </div>

    <!-- 统计卡 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-primary-light-9); --icon-color: var(--el-color-primary)"><el-icon :size="16"><Coin /></el-icon></div>
        <div class="stat-card__label">Key 数量</div>
        <div class="stat-card__value">{{ info.keyCount ?? 0 }}<span class="unit">个</span></div>
        <div class="stat-card__hint">Redis {{ info.version ?? "-" }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-success-light-9); --icon-color: var(--el-color-success)"><el-icon :size="16"><Connection /></el-icon></div>
        <div class="stat-card__label">客户端连接</div>
        <div class="stat-card__value">{{ info.connectedClients ?? 0 }}<span class="unit">个</span></div>
        <div class="stat-card__hint">端口 {{ info.port ?? 6379 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-warning-light-9); --icon-color: var(--el-color-warning)"><el-icon :size="16"><Histogram /></el-icon></div>
        <div class="stat-card__label">已用内存</div>
        <div class="stat-card__value">{{ dash(info.usedMemory) }}</div>
        <div class="stat-card__hint">{{ hasMaxMemory ? info.maxMemory : "无上限" }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-info-light-9); --icon-color: var(--el-color-info)"><el-icon :size="16"><Clock /></el-icon></div>
        <div class="stat-card__label">运行时间</div>
        <div class="stat-card__value">{{ info.uptimeDays ?? 0 }}<span class="unit">天</span></div>
        <div class="stat-card__hint">入 {{ formatKps(info.netInputKps) }} / 出 {{ formatKps(info.netOutputKps) }} kps</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-danger-light-9); --icon-color: var(--el-color-danger)"><el-icon :size="16"><Cpu /></el-icon></div>
        <div class="stat-card__label">CPU 使用率</div>
        <div class="stat-card__value">{{ (info.usedCpuPercent ?? 0).toFixed(2) }}<span class="unit">%</span></div>
        <div class="stat-card__hint">进程 CPU 占用</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="--icon-bg: var(--el-color-primary-light-9); --icon-color: var(--el-color-primary)"><el-icon :size="16"><Box /></el-icon></div>
        <div class="stat-card__label">网络 IO</div>
        <div class="stat-card__value">{{ formatKps(info.netInputKps) }}<span class="unit">kps</span></div>
        <div class="stat-card__hint">入口 / 出口 {{ formatKps(info.netOutputKps) }} kps</div>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="page-card">
      <div class="section-head">
        <div class="section-head__icon" style="--icon-bg: var(--el-color-primary-light-9); --icon-color: var(--el-color-primary)"><el-icon :size="16"><Box /></el-icon></div>
        <div>
          <div class="section-head__title">基本信息</div>
          <div class="section-head__desc">Redis 实例运行参数</div>
        </div>
        <ReTag effect="plain" size="small" style="margin-left: auto">{{ info.mode === "cluster" ? "集群模式" : "单机模式" }}</ReTag>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-item__label">Redis 版本</span><b>{{ dash(info.version) }}</b></div>
        <div class="info-item"><span class="info-item__label">运行模式</span><b>{{ info.mode === "cluster" ? "集群" : "单机" }}</b></div>
        <div class="info-item"><span class="info-item__label">端口</span><b>{{ dash(info.port) }}</b></div>
        <div class="info-item"><span class="info-item__label">客户端数</span><b>{{ dash(info.connectedClients) }}</b></div>
        <div class="info-item"><span class="info-item__label">运行时间</span><b>{{ dash(info.uptimeDays) }} 天</b></div>
        <div class="info-item"><span class="info-item__label">使用内存</span><b>{{ dash(info.usedMemory) }}</b></div>
        <div class="info-item"><span class="info-item__label">使用 CPU</span><b>{{ (info.usedCpuPercent ?? 0).toFixed(2) }}%</b></div>
        <div class="info-item"><span class="info-item__label">maxmemory</span><b>{{ hasMaxMemory ? dash(info.maxMemory) : "无限制" }}</b></div>
        <div class="info-item"><span class="info-item__label">AOF</span><b><ReTag :type="info.aofEnabled ? 'success' : 'info'" effect="plain" size="small">{{ info.aofEnabled ? "已开启" : "未开启" }}</ReTag></b></div>
        <div class="info-item"><span class="info-item__label">RDB</span><b><ReTag :type="info.rdbLastStatus === 'ok' ? 'success' : 'danger'" effect="plain" size="small">{{ dash(info.rdbLastStatus) }}</ReTag></b></div>
        <div class="info-item"><span class="info-item__label">Key 数量</span><b>{{ dash(info.keyCount) }}</b></div>
        <div class="info-item"><span class="info-item__label">网络 IO</span><b>{{ formatKps(info.netInputKps) }} / {{ formatKps(info.netOutputKps) }} kps</b></div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="bento-row">
      <div class="page-card">
        <div class="section-head">
          <div class="section-head__icon" style="--icon-bg: var(--el-color-success-light-9); --icon-color: var(--el-color-success)"><el-icon :size="16"><DataLine /></el-icon></div>
          <div><div class="section-head__title">命令统计</div><div class="section-head__desc">各命令调用次数占比</div></div>
        </div>
        <ReEChart v-if="(info.commandStats ?? []).length > 0" :option="commandOption" height="280px" />
        <el-empty v-else description="暂无命令统计数据" :image-size="48" />
      </div>

      <!-- ★ 内存占用（自适应） -->
      <div class="page-card">
        <div class="section-head">
          <div class="section-head__icon" style="--icon-bg: var(--el-color-warning-light-9); --icon-color: var(--el-color-warning)"><el-icon :size="16"><Histogram /></el-icon></div>
          <div><div class="section-head__title">内存占用</div><div class="section-head__desc">Redis 内存使用与分配</div></div>
        </div>

        <!-- 仪表 / 退化数值 -->
        <div v-if="memoryShowPercent" class="mem-gauge-wrap">
          <ReEChart :option="memoryOption!" height="220px" />
        </div>
        <div v-else class="mem-fallback">
          <div class="mem-fallback__value">{{ dash(info.usedMemory) }}</div>
          <div class="mem-fallback__label">已用内存</div>
        </div>

        <!-- 明细网格 -->
        <div class="mem-detail">
          <div class="mem-detail__item">
            <span class="mem-detail__label">已用内存</span>
            <b class="mem-detail__value">{{ dash(info.usedMemory) }}</b>
          </div>
          <div class="mem-detail__item">
            <span class="mem-detail__label">物理 RSS</span>
            <b class="mem-detail__value">{{ dash(info.usedMemoryRss) }}</b>
          </div>
          <div class="mem-detail__item">
            <span class="mem-detail__label">峰值内存</span>
            <b class="mem-detail__value">{{ dash(info.usedMemoryPeak) }}</b>
          </div>
          <div class="mem-detail__item">
            <span class="mem-detail__label">碎片率</span>
            <b class="mem-detail__value">{{ info.memFragmentationRatio !== undefined && info.memFragmentationRatio !== null ? info.memFragmentationRatio.toFixed(2) : "—" }}</b>
          </div>
          <div class="mem-detail__item">
            <span class="mem-detail__label">分配器</span>
            <b class="mem-detail__value">{{ dash(info.memAllocator) }}</b>
          </div>
          <div class="mem-detail__item">
            <span class="mem-detail__label">配置上限</span>
            <b class="mem-detail__value">{{ hasMaxMemory ? dash(info.maxMemory) : "无限制" }}</b>
          </div>
        </div>
      </div>
    </div>

    <!-- 键空间分布 -->
    <div class="page-card">
      <div class="section-head">
        <div class="section-head__icon" style="--icon-bg: var(--el-color-primary-light-9); --icon-color: var(--el-color-primary)"><el-icon :size="16"><Box /></el-icon></div>
        <div><div class="section-head__title">键空间分布</div><div class="section-head__desc">各数据库 Key 数量分布</div></div>
      </div>
      <ReEChart v-if="(info.keyspaceDetails ?? []).length > 0" :option="keyspaceOption" height="200px" />
      <el-empty v-else description="暂无键空间数据" :image-size="48" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-monitor { display: flex; flex-direction: column; gap: 12px; height: 100%; overflow: auto; padding-bottom: 8px; }

.page-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px; background: var(--el-bg-color);
  padding: 16px 20px;
  box-shadow: 0 1px 4px var(--el-box-shadow-light);
}
.header-card { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.header-card__title { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); }
.header-card__subtitle { margin-top: 2px; font-size: 12px; color: var(--el-text-color-secondary); }
.header-card__right { display: flex; align-items: center; gap: 12px; }
.header-card__time { font-size: 12px; color: var(--el-text-color-secondary); }

.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px; background: var(--el-bg-color);
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 2px 8px var(--el-box-shadow-light); }
.stat-card__icon {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  background: var(--icon-bg, var(--el-color-primary-light-9));
  color: var(--icon-color, var(--el-color-primary));
}
.stat-card__label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 2px; }
.stat-card__value { font-size: 24px; font-weight: 600; color: var(--el-text-color-primary); line-height: 1.2; }
.stat-card__value .unit { font-size: 13px; font-weight: 400; margin-left: 2px; color: var(--el-text-color-secondary); }
.stat-card__hint { margin-top: 4px; font-size: 11px; color: var(--el-text-color-secondary); }

.section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.section-head__icon {
  width: 32px; height: 32px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: var(--icon-bg, var(--el-color-primary-light-9));
  color: var(--icon-color, var(--el-color-primary));
  flex-shrink: 0;
}
.section-head__title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.section-head__desc { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 1px; }

.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.info-item {
  padding: 8px 12px; border-radius: 6px;
  background: var(--el-fill-color-light);
  display: flex; flex-direction: column; gap: 2px;
}
.info-item__label { font-size: 11px; color: var(--el-text-color-secondary); }
.info-item b { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

.bento-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* 内存占用卡片 */
.mem-gauge-wrap { margin: 0 -8px; }
.mem-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0 16px; }
.mem-fallback__value { font-size: 28px; font-weight: 600; color: var(--el-text-color-primary); }
.mem-fallback__label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.mem-detail {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;
}
.mem-detail__item {
  padding: 8px 10px; border-radius: 6px;
  background: var(--el-fill-color-light);
  display: flex; flex-direction: column; gap: 2px;
}
.mem-detail__label { font-size: 11px; color: var(--el-text-color-secondary); }
.mem-detail__value { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }

@media screen and (max-width: 1200px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-row { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .mem-detail { grid-template-columns: repeat(2, 1fr); }
}
</style>
