<template>
  <div class="erw">
    <div v-if="!widget.hideTitle" class="erw__header">
      <span class="erw__title">
        <el-icon class="erw__icon"><Money /></el-icon>
        {{ widget.title }}
      </span>
      <span class="erw__meta">{{ sourceLabel }} · {{ updatedText }}</span>
      <button
        v-if="showRefresh"
        type="button"
        class="erw__refresh"
        :disabled="loading"
        aria-label="刷新汇率"
        @click="load"
      >
        <el-icon :size="15"><RefreshRight /></el-icon>
      </button>
    </div>

    <div v-loading="loading" class="erw__body">
      <el-empty v-if="!enabled" description="汇率功能未开启" :image-size="54" />
      <el-empty v-else-if="!rates.length && !loading" description="暂无汇率数据" :image-size="54" />
      <ul v-else class="erw__list">
        <li v-for="point in rates" :key="point.symbol" class="erw__row">
          <span class="erw__pair">{{ point.symbol }}</span>
          <span class="erw__rate">{{ formatPrice(point.rate) }}</span>
          <span class="erw__change" :class="'is-' + changeTone(point.changePercent)">
            {{ formatPercent(point.changePercent) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts" name="ExchangeRateWidget">
/**
 * 汇率组件（首页仪表板）
 *
 * <p>数据源复用顶栏的 {@code useExchangeRate}：后台汇率接口优先，未命中回落
 * frankfurter，UI 只消费统一的 {@code rates}。不自己定义第二套请求链路，
 * 避免首页与顶栏出现两个不一致的汇率。</p>
 */
import { computed, onMounted } from "vue";
import { Money, RefreshRight } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { useExchangeRate } from "@repo/theme/composables/useExchangeRate";
import type { WidgetItem } from "../types";

const props = defineProps<{ widget: WidgetItem }>();

const { rates, loading, source, updatedAt, fetchOverview, formatPrice, formatPercent, changeTone } =
  useExchangeRate();

/** 能力位关闭时，看板上已放置的汇率卡也不能继续请求 */
const enabled = computed(() => getConfig().other?.capabilities?.exchangeRate !== false);

/** 刷新图标是否显示（外观配置显式关闭时才隐藏） */
const showRefresh = computed(() => props.widget.appearance?.showRefresh !== false);

const updatedText = computed(() => updatedAt.value || "等待更新");
const sourceLabel = computed(() => (source.value === "frankfurter" ? "三方" : "后台"));

function load(): void {
  if (!enabled.value) return;
  void fetchOverview();
}

onMounted(load);
</script>

<style lang="scss" scoped>
.erw {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--koi-widget-bg, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}

.erw__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}

.erw__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.erw__icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.erw__meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-tertiary);
  white-space: nowrap;
}

.erw__refresh {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.erw__refresh:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.erw__refresh:disabled {
  cursor: default;
  opacity: 0.5;
}

.erw__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 12px;
}

.erw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.erw__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.erw__row:last-child {
  border-bottom: none;
}

.erw__pair {
  flex: none;
  width: 92px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}

.erw__rate {
  flex: 1;
  text-align: right;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.erw__change {
  flex: none;
  width: 66px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.erw__change.is-up {
  color: var(--el-color-danger);
}

.erw__change.is-down {
  color: var(--el-color-success);
}

.erw__change.is-flat {
  color: var(--el-text-color-secondary);
}
</style>
