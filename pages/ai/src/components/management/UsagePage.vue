<template>
  <div class="usage-page">
    <div class="page-hero">
      <div class="hero-text">
        <h2 class="page-title">用量管理</h2>
        <p class="page-subtitle">
          <span class="sub-dot"></span>{{ rangeLabel }}
        </p>
      </div>
      <div class="quick-filters">
        <div class="seg-pills" role="tablist">
          <button v-for="f in quickFilters" :key="f.key" type="button" class="pill"
            role="tab" :class="{ active: activeFilter === f.key }"
            :aria-selected="activeFilter === f.key" @click="setQuickFilter(f.key)">{{ f.label }}</button>
        </div>
        <el-date-picker
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="hero-date"
          value-format="YYYY-MM-DD"
          @change="onCustomRange"
        />
      </div>
    </div>

    <!--
      实时用量条（SSE）。

      为什么需要它：页面此前只在「切筛选 / 点刷新」时拉一次快照，一次真实调用在界面上
      完全看不出来 —— 盯着不动的数字，用户根本判断不了系统到底在不在跑。这里挂一条
      SSE，由后端按秒**合并**推送重算后的快照（不是增量），前端直接替换即可。
    -->
    <div class="live-bar" :class="`is-${liveState}`">
      <span class="live-dot" :class="{ 'is-pulsing': liveState === 'live' }" />
      <span class="live-label">{{ liveLabel }}</span>
      <span class="live-metrics">
        <span class="live-metric">今日 Token <b>{{ fmtToken(liveTodayTokens) }}</b></span>
        <span class="live-metric">区间 Token <b>{{ fmtToken(liveRangeTokens) }}</b></span>
        <span v-if="liveRate > 0" class="live-metric is-rate">速率 <b>{{ fmtToken(liveRate) }}</b>/分</span>
      </span>
      <el-switch v-model="liveEnabled" size="small" inline-prompt active-text="实时" inactive-text="暂停" />
    </div>

    <!-- 顶部 KPI 卡片 -->
    <div class="stats-grid">
      <div v-for="s in statCards" :key="s.label" class="kpi-card" :class="`tone-${s.tone}`">
        <div class="kpi-top">
          <span class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="s.icon" /></svg>
          </span>
          <span class="kpi-label">{{ s.label }}</span>
        </div>
        <div class="kpi-value" :class="s.cls">{{ s.value }}<span v-if="s.unit" class="unit">{{ s.unit }}</span></div>
        <div class="kpi-sub"><span v-for="(sub, i) in s.sub" :key="i">{{ sub }}</span></div>
      </div>
    </div>

    <!-- 模型 / 分组 分布 -->
    <div class="dist-grid">
      <ReCard title="模型分布">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: modelChartType === 'token' }" @click="modelChartType = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: modelChartType === 'cost' }" @click="modelChartType = 'cost'">按费用</button>
          </div>
        </template>
        <ReEcharts :option="modelPieOption" height="260px" not-merge />
        <ReTable :data="modelPaged" :columns="modelDistColumns" :show-index="false" :stripe="false" class="dist-table" :row-style="distRowStyle(modelDist, modelChartType)">
          <template #col-name="{ row }"><span class="model-name">{{ row.name }}</span></template>
          <template #col-requests="{ row }">{{ formatNumber(row.requests) }}</template>
          <template #col-totalTokens="{ row }">{{ fmtToken(row.totalTokens) }}</template>
          <template #col-cost="{ row }">{{ money(row.cost) }}</template>
          <template #col-percent="{ row }">{{ percent(row, modelDist, modelChartType) }}</template>
        </ReTable>
        <div class="pager-row" v-if="modelDist.length > distPageSize">
          <el-pagination background small layout="prev, pager, next" :total="modelDist.length" :page-size="distPageSize" v-model:current-page="modelPage" />
        </div>
      </ReCard>

      <ReCard title="分组分布">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: groupChartType === 'token' }" @click="groupChartType = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: groupChartType === 'cost' }" @click="groupChartType = 'cost'">按费用</button>
          </div>
        </template>
        <ReEcharts :option="groupPieOption" height="260px" not-merge />
        <ReTable :data="groupPaged" :columns="groupDistColumns" :show-index="false" :stripe="false" class="dist-table" :row-style="distRowStyle(groupDist, groupChartType)">
          <template #col-name="{ row }"><span class="model-name">{{ row.name }}</span></template>
          <template #col-requests="{ row }">{{ formatNumber(row.requests) }}</template>
          <template #col-totalTokens="{ row }">{{ fmtToken(row.totalTokens) }}</template>
          <template #col-cost="{ row }">{{ money(row.cost) }}</template>
          <template #col-percent="{ row }">{{ percent(row, groupDist, groupChartType) }}</template>
        </ReTable>
        <div class="pager-row" v-if="groupDist.length > distPageSize">
          <el-pagination background small layout="prev, pager, next" :total="groupDist.length" :page-size="distPageSize" v-model:current-page="groupPage" />
        </div>
      </ReCard>
    </div>

    <!--
      Top5 排行：模型 / 应用（使用模型的软件）。

      「应用」= 消耗模型的软件：opencode / claude-code / codex 这类三方工具，
      以及本控制台自己（对话 + 机器人合并）。口径见下方 appDist 注释。
    -->
    <div class="dist-grid">
      <ReCard title="模型排行 Top5">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: rankMetric === 'token' }" @click="rankMetric = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: rankMetric === 'cost' }" @click="rankMetric = 'cost'">按费用</button>
          </div>
        </template>
        <ol class="rank-list">
          <li v-for="(r, i) in modelRankTop5" :key="r.name" class="rank-item">
            <span class="rank-no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="rank-name" :title="r.name">{{ r.name }}</span>
            <span class="rank-bar">
              <span class="rank-bar-fill" :style="{ width: rankBarWidth(r, modelRankTop5) }" />
            </span>
            <span class="rank-value">{{ rankValue(r) }}</span>
            <span class="rank-pct">{{ rankPct(r, modelRankTop5) }}</span>
          </li>
        </ol>
        <el-empty v-if="modelRankTop5.length === 0" description="暂无模型用量" class="lib-empty" :image-size="60" />
      </ReCard>

      <ReCard title="应用排行 Top5">
        <template #extra>
          <div class="seg-toggle">
            <button class="seg-btn" :class="{ active: rankMetric === 'token' }" @click="rankMetric = 'token'">按 Token</button>
            <button class="seg-btn" :class="{ active: rankMetric === 'cost' }" @click="rankMetric = 'cost'">按费用</button>
          </div>
        </template>
        <ol class="rank-list">
          <li v-for="(r, i) in appRankTop5" :key="r.name" class="rank-item">
            <span class="rank-no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="rank-name" :title="r.name">{{ appLabel(r.name) }}</span>
            <span class="rank-bar">
              <span class="rank-bar-fill" :style="{ width: rankBarWidth(r, appRankTop5) }" />
            </span>
            <span class="rank-value">{{ rankValue(r) }}</span>
            <span class="rank-pct">{{ rankPct(r, appRankTop5) }}</span>
          </li>
        </ol>
        <el-empty v-if="appRankTop5.length === 0" description="暂无应用用量" class="lib-empty" :image-size="60" />
      </ReCard>
    </div>

    <!-- 每日模型用量：一天一个柱，柱内按模型分段（每模型一色，段高按用量占比） -->
    <ReCard title="每日模型用量">
      <template #extra>
        <div class="seg-toggle">
          <button class="seg-btn" :class="{ active: modelBarMetric === 'token' }" @click="modelBarMetric = 'token'">按 Token</button>
          <button class="seg-btn" :class="{ active: modelBarMetric === 'cost' }" @click="modelBarMetric = 'cost'">按费用</button>
        </div>
      </template>
      <p class="chart-hint">
        每根柱代表一天，柱内按模型分段着色；分段高度即该模型当天的用量占比。
      </p>
      <ReEcharts v-if="modelBarDates.length > 0" :option="modelBarOption" height="360px" not-merge />
      <div v-else class="chart-empty">暂无按天模型用量数据</div>
    </ReCard>

    <!-- Token 趋势 -->
    <ReCard title="Token 趋势">
      <ReEcharts :option="trendOption" height="320px" not-merge v-if="trendData.length > 0" />
      <div v-else class="chart-empty">暂无趋势数据</div>
    </ReCard>

    <!-- 用量明细 -->
    <ReCard title="用量明细">
      <template #extra>
        <el-input v-model="detailModelFilter" placeholder="按模型筛选" clearable class="filter-input" @keyup.enter="reloadDetails" @clear="reloadDetails" />
        <!-- 敏感数据（费用）显示开关：默认隐藏，点眼睛才露出金额 -->
        <el-button link type="primary" class="cost-toggle" @click="costVisible = !costVisible"
          :title="costVisible ? '隐藏费用等敏感数据' : '显示费用等敏感数据'">
          <el-icon><Eye24Regular v-if="costVisible" /><EyeOff24Regular v-else /></el-icon>
          {{ costVisible ? '隐藏费用' : '显示费用' }}
        </el-button>
      </template>
      <ReTable :data="detailRecords" :loading="detailLoading" :columns="detailColumns" :show-index="false" class="detail-table" row-key="sysAiUsageId">
        <template #col-time="{ row }"><span class="time-cell">{{ formatTime(row.sysAiUsageCallTime) }}</span></template>
        <template #col-model="{ row }">
          <div class="model-cell">
            <span class="model-name" :title="row.sysAiUsageModel || '-'">{{ row.sysAiUsageModel || '-' }}</span>
            <!-- 解码速率：hover 弹完整阶段明细（首字/解码窗口/总耗 + Token 明细 + 速率）。
                 为什么用 popover 而不是 title：title 无法换行也放不下多阶段信息，
                 且 3109.9 这类异常值需要就地解释（批量推送口径假象 + 总耗时近似值）。 -->
            <el-popover trigger="hover" placement="top" :show-arrow="true" :width="265">
              <template #reference>
                <span class="model-sub is-speed" :style="{ color: speedColor(row) }">{{ formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
              </template>
              <div class="speed-popover-content">
                <div class="speed-popover-title">速率阶段明细</div>
                <div class="speed-popover-row">
                  <span class="sp-label">首字耗时</span>
                  <span class="sp-val" :style="{ color: getFirstColor(row) }">{{ formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
                </div>
                <div class="speed-popover-row">
                  <span class="sp-label">解码窗口</span>
                  <span class="sp-val" :style="{ color: decodeWindowColor(row) }">{{ formatLatency(decodeWindowMs(row)) }}</span>
                </div>
                <div class="speed-popover-row">
                  <span class="sp-label">总耗时</span>
                  <span class="sp-val" :style="{ color: getTotalColor(row) }">{{ formatLatency(row.sysAiUsageTotalLatency) }}</span>
                </div>
                <div class="speed-popover-divider"></div>
                <div class="speed-popover-row">
                  <span class="sp-label">输入 Token</span>
                  <span class="sp-val">{{ formatNumber(row.sysAiUsagePromptTokens) }}</span>
                </div>
                <div class="speed-popover-row">
                  <span class="sp-label">输出 Token</span>
                  <span class="sp-val">{{ formatNumber(row.sysAiUsageCompletionTokens) }}</span>
                </div>
                <div class="speed-popover-row">
                  <span class="sp-label">缓存读取</span>
                  <span class="sp-val">{{ formatNumber(row.sysAiUsageCachedTokens) }}</span>
                </div>
                <div class="speed-popover-row">
                  <span class="sp-label">总 Token</span>
                  <span class="sp-val">{{ formatNumber(row.sysAiUsageTotalTokens) }}</span>
                </div>
                <div class="speed-popover-divider"></div>
                <div class="speed-popover-row">
                  <span class="sp-label">解码速率</span>
                  <span class="sp-val" :style="{ color: speedColor(row) }">{{ formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
                </div>
                <div v-if="isSuspiciousSpeed(row)" class="speed-popover-note">{{ speedTitle(row) }}</div>
                <div class="speed-popover-hint">绿/橙/红 = 快/中/慢；解码窗口或总耗时不足 1s 标灰（批量推送假象/疑似缓存回放）</div>
              </div>
            </el-popover>
          </div>
        </template>
        <template #col-group="{ row }">{{ row.sysAiUsageGroupName }}</template>
        <template #col-user="{ row }">
          <ReTag :type="row.sysAiUsageUserId ? 'primary' : 'info'" >{{ row.sysAiUsageUserId || '三方' }}</ReTag>
        </template>
        <template #col-provider="{ row }"><span :title="row.sysAiUsageProvider || ''">{{ providerDisplay(row.sysAiUsageProvider) }}</span></template>
        <template #col-endpoint="{ row }">
          <span class="endpoint-cell">{{ endpointDisplay(row) }}</span>
        </template>
        <template #col-strength="{ row }">
          <ReTag v-if="row.sysAiUsageInferenceStrength && row.sysAiUsageInferenceStrength !== '默认'"
            type="info">{{ row.sysAiUsageInferenceStrength }}</ReTag>
          <span v-else class="cell-muted">默认</span>
        </template>
        <template #col-ip="{ row }">
          <ReIpText v-if="row.sysAiUsageIp" :ip="row.sysAiUsageIp" :address="row.sysAiUsageLocation" />
          <span v-else class="cell-muted">—</span>
        </template>
        <template #col-tokens="{ row }">
          <el-popover trigger="hover" placement="top" :show-arrow="true" :width="200">
            <template #reference>
              <div class="token-cell" :class="{ 'token-estimated': row.sysAiUsageEstimatedTokens === 1 }">
                <span class="token-col">
                  <span class="token-inline">
                    <span class="tk tk-in">
                      <svg class="tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8.2M4.6 7.3 8 10.8l3.4-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ fmtToken(row.sysAiUsagePromptTokens) }}
                    </span>
                    <span class="tk tk-out">
                      <svg class="tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5V5.3M4.6 8.7 8 5.2l3.4 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ fmtToken(row.sysAiUsageCompletionTokens) }}
                    </span>
                  </span>
                  <span v-if="Number(row.sysAiUsageCachedTokens) > 0" class="tk tk-cache-line" :title="'缓存读取 ' + formatNumber(row.sysAiUsageCachedTokens)">
                    <svg class="tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.5h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6ZM3 5.5 8 3l5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ fmtToken(row.sysAiUsageCachedTokens) }}
                  </span>
                </span>
              </div>
            </template>
            <div class="token-detail-pop">
              <div class="token-detail-title"><i class="td-dot" />Token 明细</div>
              <div class="token-detail-row"><span class="td-label">输入</span><span class="td-val tk-in">{{ formatNumber(row.sysAiUsagePromptTokens) }}</span></div>
              <div class="token-detail-row"><span class="td-label">输出</span><span class="td-val tk-out">{{ formatNumber(row.sysAiUsageCompletionTokens) }}</span></div>
              <div class="token-detail-row"><span class="td-label">缓存读取</span><span class="td-val tk-cache">{{ formatNumber(row.sysAiUsageCachedTokens) }}</span></div>
              <div class="token-detail-divider"></div>
              <div class="token-detail-row td-total"><span class="td-label">总计</span><span class="td-val">{{ formatNumber(row.sysAiUsageTotalTokens) }}</span></div>
              <div class="token-detail-row td-rate">
                <span class="td-label">缓存率</span>
                <span class="td-rate-body">
                  <span class="td-rate-bar"><i :style="{ width: cacheRatePct(row) + '%' }" /></span>
                  <span class="td-val">{{ cacheRateText(row) }}</span>
                </span>
              </div>
              <div v-if="row.sysAiUsageEstimatedTokens === 1" class="td-est-note">Token 为估算值（Qoder 按积分计费，未上报真实 token）</div>
            </div>
          </el-popover>
        </template>
        <template #col-cost="{ row }">
          <!-- 敏感数据：默认只给眼睛图标，由「用量明细」头部的显示费用开关统一控制 -->
          <span v-if="costVisible" class="cost-val">{{ money(row.sysAiUsageTotalCost) }}</span>
          <el-icon v-else class="cost-eye" title="费用已隐藏，点击上方「显示费用」查看"><EyeOff24Regular /></el-icon>
        </template>
        <template #col-latency="{ row }">
          <el-popover trigger="hover" placement="top" :show-arrow="true" :width="220">
            <template #reference>
              <div class="latency-inline">
                <span class="latency-vbar" :style="{ backgroundColor: getTotalColor(row) }"></span>
                <div class="latency-lines">
                  <div class="latency-line"><span class="latency-k">首字</span><span class="latency-v" :style="{ color: getFirstColor(row) }">{{ formatLatency(row.sysAiUsageFirstTokenLatency) }}</span></div>
                  <div class="latency-line"><span class="latency-k">总耗</span><span class="latency-v" :style="{ color: getTotalColor(row) }">{{ formatLatency(row.sysAiUsageTotalLatency) }}</span></div>
                </div>
              </div>
            </template>
            <div class="latency-popover-content">
              <div class="latency-popover-row">
                <span class="latency-popover-dot" :style="{ background: getFirstColor(row) }"></span>
                <span class="latency-popover-label">首字</span>
                <span class="latency-popover-value" :style="{ color: getFirstColor(row) }">{{ formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
              </div>
              <div class="latency-popover-row">
                <span class="latency-popover-dot" :style="{ background: getTotalColor(row) }"></span>
                <span class="latency-popover-label">总耗时</span>
                <span class="latency-popover-value" :style="{ color: getTotalColor(row) }">{{ formatLatency(row.sysAiUsageTotalLatency) }}</span>
              </div>
              <div class="latency-popover-row">
                <span class="latency-popover-dot" :style="{ background: speedColor(row) }"></span>
                <span class="latency-popover-label">解码速率</span>
                <span class="latency-popover-value" :style="{ color: speedColor(row) }">{{ formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
              </div>
              <div class="latency-popover-divider"></div>
              <div class="latency-popover-row">
                <span class="latency-popover-dot" style="background: var(--el-color-success)"></span>
                <span class="latency-popover-label">输入 Token</span>
                <span class="latency-popover-value">{{ formatNumber(row.sysAiUsagePromptTokens) }}</span>
              </div>
              <div class="latency-popover-row">
                <span class="latency-popover-dot" style="background: var(--el-color-primary)"></span>
                <span class="latency-popover-label">输出 Token</span>
                <span class="latency-popover-value">{{ formatNumber(row.sysAiUsageCompletionTokens) }}</span>
              </div>
              <div class="latency-popover-row">
                <span class="latency-popover-dot" style="background: var(--el-text-color-primary)"></span>
                <span class="latency-popover-label">总 Token</span>
                <span class="latency-popover-value">{{ formatNumber(row.sysAiUsageTotalTokens) }}</span>
              </div>
              <div v-if="isSuspiciousSpeed(row)" class="latency-popover-note">{{ speedTitle(row) }}</div>
              <div class="latency-popover-hint">绿/橙/红=快/中/慢（耗时与速率）</div>
            </div>
          </el-popover>
        </template>
        <template #col-type="{ row }">
          <ReTag :type="typeTagType(row.sysAiUsageType)" >{{ formatTypeLabel(row.sysAiUsageType) }}</ReTag>
        </template>
        <template #col-callType="{ row }">
          <ReTag :type="callModeTag(row)" >{{ callModeLabel(row) }}</ReTag>
        </template>
      </ReTable>
      <div class="pager-row">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="detailTotal" :page-size="detailPageSize" v-model:current-page="detailPage" @current-change="reloadDetails" />
      </div>
    </ReCard>
  </div>
</template>
<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

import ReEcharts from '@repo/ui/re-echarts';
import { http } from '@repo/utils';
import type { EChartsOption } from 'echarts';
import ReCard from '@/components/re/ReCard.vue';
import ReTable from '@/components/re/ReTable.vue';
import type { ReTableColumn } from '@repo/ui/re-table';
import ReTag from '@/components/re/ReTag.vue';
import ReButton from '@/components/re/ReButton.vue';
import ReIpText from '@repo/ui/re-ip-text';
import { Eye24Regular, EyeOff24Regular } from '@vicons/fluent';
import { usageApi } from '@/services/javaApi';

type ChartType = 'token' | 'cost';
interface DistRow {
  name: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

const distPageSize = 8;

const stats = reactive({
  totalCalls: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  totalCachedTokens: 0,
  standardCost: 0,
  avgLatency: 0,
  avgFirstTokenLatency: 0,
});

const statCards = computed(() => [
  { label: '总请求数', value: formatNumber(stats.totalCalls), unit: '', cls: '', tone: 'primary',
    icon: 'M2 12h3.2l2.4 7.5 4.2-15 3.3 9.2H14M15 12h7',
    sub: ['缓存 ' + fmtToken(stats.totalCachedTokens) + ' tokens'] },
  { label: '总 Token', value: fmtToken(stats.totalTokens), unit: '', cls: '', tone: 'info',
    icon: 'M12 2.8 19 6.4v6.2c0 4.3-2.9 6.7-7 8.6-4.1-1.9-7-4.3-7-8.6V6.4L12 2.8Z M9.2 11.6l2 2 3.8-4',
    sub: ['输入 ' + fmtToken(stats.totalPromptTokens), '输出 ' + fmtToken(stats.totalCompletionTokens)] },
  { label: '总消费', value: currencySymbol.value + money(stats.totalCost), unit: '', cls: 'cost', tone: 'success',
    icon: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 14.5v-7ZM3 9.5h18M15 12h3.2',
    sub: ['标准价 ' + currencySymbol.value + money(stats.standardCost)] },
  { label: '平均耗时', value: money(stats.avgLatency), unit: 'ms', cls: '', tone: 'warning',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3 2',
    sub: ['首字 ' + money(stats.avgFirstTokenLatency) + 'ms'] },
]);

// 当前时间范围的人类可读描述（头部副标题）
const rangeLabel = computed(() => {
  const map: Record<string, string> = { today: '今天', '7d': '近 7 天', '30d': '近 30 天', all: '全部时间', custom: '自定义区间' };
  const base = map[activeFilter.value] || '自定义区间';
  const { startTime, endTime } = timeParams.value;
  if (activeFilter.value === 'today' && startTime) return `${base} · ${startTime.slice(0, 10)}`;
  if (startTime && endTime) return `${base} · ${startTime.slice(0, 10)} 至 ${endTime.slice(0, 10)}`;
  return base;
});

const summaryRows = ref<any[]>([]);
const trendData = ref<Array<{ date: string; input: number; output: number; total: number }>>([]);

const modelChartType = ref<ChartType>('token');
const groupChartType = ref<ChartType>('token');
const modelPage = ref(1);
const groupPage = ref(1);

// 明细
const detailRecords = ref<any[]>([]);
const detailLoading = ref(false);
const detailTotal = ref(0);
const detailPage = ref(1);
const detailPageSize = 20;
const detailModelFilter = ref('');
/**
 * 费用等敏感数据是否可见（默认隐藏）。
 *
 * <p>明细表里费用默认只渲染眼睛图标，点「用量明细」头部的
 * 显示费用开关才露出金额 —— 截屏/分享场景不泄露账单数据。</p>
 */
const costVisible = ref(false);
const detailUserFilter = ref('');

/** 服务商 id → 中文名。后端 GET /v2/providers 列表回填，未命中兜底原样显示 */
const providerNameMap = ref<Record<string, string>>({});
let providerNameLoaded = false;
function providerDisplay(p: string | null | undefined): string {
  if (!p) return '-';
  // 后端 GET /v2/usage/providers 未上线时兜底：1791352877398=gavinchen（2026-10-14 库实测）。
  const FALLBACK_PROVIDERS: Record<string, string> = {
    '1791352877398': 'gavinchen',
  };
  return providerNameMap.value[p] || FALLBACK_PROVIDERS[p] || p;
}

/** 推理强度缩写：强度列 Tag 过长时用，完整值放 title（当前强度列直接显示全名，暂留备用） */
function shortStrength(s: string): string {
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower.includes('ultra')) return 'Ultra';
  if (lower.includes('high')) return 'High';
  if (lower.includes('medium') || lower.includes('med')) return 'Med';
  if (lower.includes('low')) return 'Low';
  if (lower.includes('minimal') || lower.includes('min')) return 'Min';
  if (lower.includes('none') || lower === 'off') return '关';
  return s.length > 8 ? s.slice(0, 8) : s;
}

/** 解码速率灰显阈值：超过即物理不可信（见 AiUsage.tokensPerSecond 窗口保护），标灰不误读 */
const SPEED_SUSPICIOUS = 1000;

/**
 * 总耗时极短阈值：<1s 的整请求视为「秒回」——缓存命中、代理回放等场景，
 * 即使输出÷总耗时的物理结果也够快，仍不能代表模型解码能力，单独标灰提示。
 */
const TOTAL_LATENCY_SUSPICIOUS = 1000;

/** 整请求总耗时是否 <1s（秒回/疑似缓存或回放） */
function isShortTotalLatency(row: any): boolean {
  const total = Number(row?.sysAiUsageTotalLatency);
  return Number.isFinite(total) && total > 0 && total < TOTAL_LATENCY_SUSPICIOUS;
}

/**
 * 是否判定为不可信速率：命中「解码窗口窄窗口假象」（>1000）
 * 或「整请求秒回」（总耗时<1s）都标灰，不再按快/中/慢着色。
 */
function isSuspiciousSpeed(row: any): boolean {
  const n = Number(row?.sysAiUsageTokensPerSecond);
  return Number.isFinite(n) && n > 0 && (n > SPEED_SUSPICIOUS || isShortTotalLatency(row));
}

// 时间筛选
const activeFilter = ref('today');
const customRange = ref<[string, string] | null>(null);
const timeParams = ref<{ startTime?: string; endTime?: string }>({});

const quickFilters = [
  { key: 'today', label: '今天' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'all', label: '全部' },
];

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function setQuickFilter(key: string) {
  activeFilter.value = key;
  customRange.value = null;
  const now = new Date();
  if (key === 'all') {
    timeParams.value = {};
  } else if (key === 'today') {
    const d = fmtDate(now);
    timeParams.value = { startTime: `${d} 00:00:00`, endTime: `${d} 23:59:59` };
  } else {
    const days = key === '7d' ? 7 : 30;
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    timeParams.value = {
      startTime: `${fmtDate(start)} 00:00:00`,
      endTime: `${fmtDate(now)} 23:59:59`,
    };
  }
  refreshAll();
}

function onCustomRange(val: [string, string] | null) {
  if (!val || !val[0] || !val[1]) {
    return;
  }
  activeFilter.value = 'custom';
  timeParams.value = {
    startTime: `${val[0]} 00:00:00`,
    endTime: `${val[1]} 23:59:59`,
  };
  refreshAll();
}

function refreshAll() {
  loadData();
  detailPage.value = 1;
  reloadDetails();
}

// 按 key 把后端聚合行 roll up
function rollUp(rows: any[], keyOf: (r: any) => string | null): DistRow[] {
  const map = new Map<string, DistRow>();
  for (const r of rows) {
    const k = keyOf(r);
    if (k == null) continue;
    if (!map.has(k)) {
      map.set(k, { name: k, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });
    }
    const a = map.get(k)!;
    a.requests += Number(r.requests) || 0;
    a.promptTokens += Number(r.promptTokens) || 0;
    a.completionTokens += Number(r.completionTokens) || 0;
    a.totalTokens += Number(r.totalTokens) || 0;
    a.cost += Number(r.cost) || 0;
  }
  return [...map.values()].sort((a, b) => b.totalTokens - a.totalTokens);
}

const modelDist = computed<DistRow[]>(() =>
  rollUp(summaryRows.value, (r) => r.model || '未知'),
);
const groupDist = computed<DistRow[]>(() =>
  rollUp(summaryRows.value, (r) => r.group || '默认'),
);

const modelPaged = computed(() =>
  modelDist.value.slice((modelPage.value - 1) * distPageSize, modelPage.value * distPageSize),
);
const groupPaged = computed(() =>
  groupDist.value.slice((groupPage.value - 1) * distPageSize, groupPage.value * distPageSize),
);

// ==================== Top5 排行（模型 / 应用） ====================
const rankMetric = ref<ChartType>('token');
const RANK_TOP_N = 5;

/**
 * 应用排行口径：按「使用模型的软件」roll up。
 *
 * 三方工具（opencode / claude-code / codex 等）同步进来的记录，groupName 就是软件名
 * （后端同步任务用解析器名当分组）；本控制台的 chat（对话）与 bot（机器人）是同一个
 * 软件的两个功能，合并成「本控制台」。其余分组名原样保留。
 *
 * 不按 provider 排：provider 记的是模型服务商，本控制台自己的记录该字段大量为空，
 * 排出来是一堆「未知来源」，回答不了「token 花在哪几个软件上」。
 */
const APP_GROUP_ALIAS: Record<string, string> = {
  chat: 'self-console',
  bot: 'self-console',
};
/** 应用标识：分组为空说明数据异常，显式兜底而不是从榜上悄悄消失 */
function appKeyOf(r: any): string {
  const g = r.group;
  if (!g) return 'unknown-app';
  return APP_GROUP_ALIAS[g] || g;
}
const appDist = computed<DistRow[]>(() =>
  rollUp(summaryRows.value, appKeyOf),
);

/**
 * 取前 N 条并按当前指标排序。
 *
 * <p>{@link rollUp} 恒按 token 降序；切到「按费用」时榜序也必须跟着变，
 * 否则会出现「第一名 Token 最多但费用最低」这种自相矛盾的榜单。</p>
 */
function topBy(rows: DistRow[]): DistRow[] {
  return [...rows]
    .sort((a, b) => (rankMetric.value === 'token' ? b.totalTokens - a.totalTokens : b.cost - a.cost))
    .slice(0, RANK_TOP_N);
}

const modelRankTop5 = computed(() => topBy(modelDist.value));
const appRankTop5 = computed(() => topBy(appDist.value));

function rankValue(r: DistRow): string {
  return rankMetric.value === 'token' ? fmtToken(r.totalTokens) : `${currencySymbol.value}${money(r.cost)}`;
}

/** 相对榜首的条长：以第一名为满格，视觉上直接读出差距 */
function rankBarWidth(r: DistRow, list: DistRow[]): string {
  const top = list[0];
  if (!top) return '0%';
  const v = rankMetric.value === 'token' ? r.totalTokens : r.cost;
  const t = rankMetric.value === 'token' ? top.totalTokens : top.cost;
  if (!t || t <= 0) return '0%';
  return `${Math.max(2, Math.round((v / t) * 100))}%`;
}

/** 占**全量**的百分比，而不是占榜首的 —— 占比要回答「这一项吃掉多少」 */
function rankPct(r: DistRow, list: DistRow[]): string {
  const total = list.reduce((s, x) => s + (rankMetric.value === 'token' ? x.totalTokens : x.cost), 0);
  if (!total || total <= 0) return '—';
  const v = rankMetric.value === 'token' ? r.totalTokens : r.cost;
  return `${((v / total) * 100).toFixed(1)}%`;
}

/** 应用标识多为英文小写，补中文名；未收录的软件名原样显示，别藏起来 */
const APP_LABELS: Record<string, string> = {
  'self-console': '本控制台',
  local: '本地工具',
  'unknown-app': '未知应用',
  opencode: 'OpenCode',
  'claude-code': 'Claude Code',
  codex: 'Codex CLI',
  'gemini-cli': 'Gemini CLI',
  qwen: 'Qwen Code',
  droid: 'Droid',
  goose: 'Goose',
  kilo: 'Kilo Code',
  'roo-code': 'Roo Code',
  cline: 'Cline',
  'copilot-cli': 'Copilot CLI',
  zed: 'Zed',
  lmstudio: 'LM Studio',
};
function appLabel(name: string): string {
  return APP_LABELS[name] || name;
}

// ==================== 实时用量（SSE） ====================
/** 实时开关：默认开启。关掉必须由用户主动操作，否则用户可能不知道数字在实时跳 */
const liveEnabled = ref(true);
/** connecting | live | paused | error */
const liveState = ref<'connecting' | 'live' | 'paused' | 'error'>('connecting');
const liveTodayTokens = ref(0);
const liveRangeTokens = ref(0);
/** 每分钟 token 速率（滑窗计算）；0 表示当前没有活动 */
const liveRate = ref(0);

let liveEs: { close: () => void } | null = null;
/** 上一次收到快照的时刻与区间 token，用于算速率 */
let lastSample = { at: 0, tokens: 0 };
/** 速率滑窗样本：保留最近 60 秒的增量 */
const rateWindow: Array<{ at: number; delta: number }> = [];

const liveLabel = computed(() => {
  switch (liveState.value) {
    case 'connecting': return '实时连接中…';
    case 'live': return '实时';
    case 'paused': return '已暂停';
    default: return '连接失败，已退回定时刷新';
  }
});

function closeLiveStream() {
  if (liveEs) {
    liveEs.close();
    liveEs = null;
  }
}

/**
 * 速率按 60 秒滑窗算，而不是「上一帧差值」。
 *
 * <p>后端是**按秒合并**推送的，单帧差值在两次推送间隔抖动时会剧烈跳动
 * （这一秒 8k、下一秒 0、下一秒 30k），读数根本没法看。滑窗给出的是
 * 「最近一分钟大致烧了多少」，这才是人真正想知道的量。</p>
 */
function pushRateSample(now: number, total: number) {
  if (lastSample.at > 0 && total >= lastSample.tokens) {
    rateWindow.push({ at: now, delta: total - lastSample.tokens });
  }
  lastSample = { at: now, tokens: total };
  const cutoff = now - 60_000;
  while (rateWindow.length && rateWindow[0].at < cutoff) rateWindow.shift();
  const sum = rateWindow.reduce((s, x) => s + x.delta, 0);
  liveRate.value = sum;
}

function handleLiveFrame(d: any) {
  if (!d || typeof d !== 'object') return;
  const today = Number(d.todayTokens);
  if (Number.isFinite(today)) liveTodayTokens.value = today;
  const range = Number(d.totalTokens);
  if (Number.isFinite(range)) {
    pushRateSample(Date.now(), range);
    liveRangeTokens.value = range;
  }
  liveState.value = 'live';
}

function openLiveStream() {
  closeLiveStream();
  liveState.value = 'connecting';
  /**
   * 用共享的 {@code http().sse()} 而不是裸 {@code EventSource}。
   *
   * <p>裸 EventSource **不能带自定义 header**，而本项目所有 /v2/** 都靠
   * {@code x-oauth-token} 鉴权 —— 建连会直接 401，控制台只留一条不显眼的报错，
   * 页面表现是「实时灯一直闪、数字永远不动」。共享客户端走 fetch-based SSE，
   * 鉴权头与自动重连都已经在里面。</p>
   */
  /**
   * 必须把当前筛选的时间窗带上：否则实时条的「区间 Token」永远是**全时段**总量，
   * 选「今天」时它却显示几个月的数 —— 与同页 KPI 卡片自相矛盾，用户无从判断哪个是真的。
   * 空对象即「全部时间」，与 REST 侧 {@code timeParams} 的口径完全一致。
   */
  liveEs = http()
    // 参数走链式的 .query()，sse() 会把 config.params 拼进最终 URL。
    // get() 只收一个 url 形参，写成 .get(url, { params }) 的第二个实参会被直接丢掉
    // （TS2554），运行时就是「筛选条件没生效」。
    .get('/v2/usage/live/stream')
    .query({ ...timeParams.value })
    .sse<unknown>({
      onOpen: () => {
        liveState.value = 'live';
      },
      onMessage: (ev) => {
        // 后端事件名：首帧 snapshot、后续 update。两者载荷同构，统一处理。
        if (ev.event !== 'snapshot' && ev.event !== 'update') return;
        handleLiveFrame(ev.data);
      },
      onError: () => {
        liveState.value = 'error';
      },
      onClose: () => {
        // 只有主动 close 才是 paused；被动断开走 onError，这里不动状态
      },
      // 后端重启/网关抖动后重连；给足次数，避免短暂抖动就永久断流
      maxReconnectAttempts: 10,
      reconnectInterval: 3000,
    });
}

// 暂停/恢复的 watcher：只有开关真的变了才重连，避免每次渲染都建一条新连接
watch(liveEnabled, (on) => {
  if (on) {
    rateWindow.length = 0;
    lastSample = { at: 0, tokens: 0 };
    openLiveStream();
  } else {
    closeLiveStream();
    liveRate.value = 0;
    liveState.value = 'paused';
  }
});

/**
 * 时间窗变化时重订阅。
 *
 * <p>SSE 的时间窗是<b>建连时固化</b>的：不重连的话，切「今天」之后实时条还在推
 * 全时段的口径，而且速率滑窗会把两个时间窗的增量混在一起算出一个毫无意义的数字。
 * 这里顺带清空滑窗样本 —— 跨口径的增量不能相加。</p>
 */
watch(timeParams, () => {
  if (!liveEnabled.value) return;
  rateWindow.length = 0;
  lastSample = { at: 0, tokens: 0 };
  openLiveStream();
}, { deep: true });

// 表面色（用于饼图切片间隔，随主题 / 深色变化）
const surfaceBg = ref('#ffffff');
function readSurfaceBg() {
  const host = document.querySelector('.usage-page') || document.documentElement;
  const v = getComputedStyle(host).getPropertyValue('--el-bg-color').trim();
  surfaceBg.value = v || '#ffffff';
}
let themeObserver: MutationObserver | null = null;
onMounted(() => {
  readSurfaceBg();
  themeObserver = new MutationObserver(readSurfaceBg);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  // 实时流与主题无关，但要等首屏数据先落定再连，
  // 否则订阅建立瞬间的快照会覆盖掉刚拉回来的完整数据
  void nextTick(() => {
    if (liveEnabled.value) openLiveStream();
  });
});
onBeforeUnmount(() => {
  themeObserver?.disconnect();
  // 必须显式断开：EventSource 会一直挂在 window 上，
  // 离开页面不关的话连接数只增不减，服务端的订阅列表也随之膨胀
  closeLiveStream();
});

function pieOption(dist: DistRow[], type: ChartType): EChartsOption {
  const sorted = [...dist].sort((a, b) =>
    type === 'token' ? b.totalTokens - a.totalTokens : b.cost - a.cost,
  );
  const top = sorted.slice(0, 9);
  const rest = sorted.slice(9);
  const data = top.map((x) => ({
    name: x.name,
    value: type === 'token' ? x.totalTokens : Number(x.cost.toFixed(4)),
  }));
  if (rest.length) {
    const rv = rest.reduce((s, x) => s + (type === 'token' ? x.totalTokens : x.cost), 0);
    if (rv > 0) data.push({ name: '其他', value: type === 'token' ? rv : Number(rv.toFixed(4)) });
  }
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      valueFormatter: (v: any) => (type === 'token' ? fmtToken(v) : `${currencySymbol.value}${money(v)}`),
    },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 'middle', icon: 'circle' },
    series: [
      {
        type: 'pie',
        radius: ['38%', '58%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: surfaceBg.value, borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
        data,
      },
    ],
  };
}

const modelPieOption = computed(() => pieOption(modelDist.value, modelChartType.value));
const groupPieOption = computed(() => pieOption(groupDist.value, groupChartType.value));

function percentNum(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): number {
  const total = all.reduce((s, x) => s + (type === 'token' ? x.totalTokens : x.cost), 0);
  if (total <= 0) return 0;
  const v = (type === 'token' ? row.totalTokens : row.cost) ?? 0;
  return (v / total) * 100;
}

/** row 来自 el-table 的默认插槽，类型被弱化；这里用结构化类型直接接收，避免断言 */
function percent(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): string {
  return percentNum(row, all, type).toFixed(1) + '%';
}

function distRowStyle(all: DistRow[], type: ChartType) {
  return ({ row }: any) => {
    const pct = Math.min(100, Math.max(0, percentNum(row, all, type)));
    return {
      background: 'linear-gradient(to right, var(--el-color-primary-light-9) ' + pct + '%, transparent ' + pct + '%)',
    };
  };
}

// ==================== 每日模型用量（堆叠柱状图） ====================
/**
 * 后端按「天 + 模型」返回多行，这里归并成「一天一根柱、柱内按模型分段」。
 * 数据形态：{ date -> Map<model, number> }，metric 决定取 Token 还是费用。
 */
const modelTrendRows = ref<Array<{ date: string; model: string; provider: string; totalTokens: number; totalCost: number }>>([]);
const modelBarMetric = ref<ChartType>('token');

/** 同一模型在不同日期必须拿到同一个颜色，故颜色按模型名做稳定映射而非按下标 */
const MODEL_COLORS = [
  '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#6F5EF9',
  '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3',
  '#269A99', '#8D6DFF', '#E8684A', '#4EA3D1', '#C9A227',
];
/** 模型名 -> 颜色。按首次出现顺序占坑，保证跨刷新/跨筛选不跳色 */
const modelColorMap = new Map<string, string>();
function colorOfModel(model: string): string {
  const key = model || '未知模型';
  let c = modelColorMap.get(key);
  if (!c) {
    c = MODEL_COLORS[modelColorMap.size % MODEL_COLORS.length];
    modelColorMap.set(key, c);
  }
  return c;
}

/** 参与堆叠的模型：按区间内总量取前 N 个，其余并成「其他」，避免几十段互相挤压 */
const MODEL_BAR_TOP_N = 8;

const modelBarMatrix = computed(() => {
  const metric = modelBarMetric.value;
  // 先按模型汇总区间总量，用于挑出 Top N 与计算「其他」
  const totals = new Map<string, number>();
  const byDate = new Map<string, Map<string, number>>();
  for (const r of modelTrendRows.value) {
    const date = String(r.date || '').slice(0, 10);
    const model = String(r.model || '').trim() || '未知模型';
    const v = metric === 'token' ? Number(r.totalTokens) || 0 : Number(r.totalCost) || 0;
    if (!date) continue;
    if (v <= 0) continue;
    totals.set(model, (totals.get(model) || 0) + v);
    let day = byDate.get(date);
    if (!day) { day = new Map(); byDate.set(date, day); }
    day.set(model, (day.get(model) || 0) + v);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const keep = ranked.slice(0, MODEL_BAR_TOP_N).map(([m]) => m);
  const keepSet = new Set(keep);
  const dates = [...byDate.keys()].sort();
  /** 某一天的「其他」= 当日所有非 Top 模型之和；Top 模型取自身原值，两者不重叠 */
  const otherOf = (day: Map<string, number>) => {
    let sum = 0;
    for (const [m, v] of day) if (!keepSet.has(m)) sum += v;
    return sum;
  };
  const series = keep.map((model) => ({
    model,
    data: dates.map((d) => byDate.get(d)!.get(model) || 0),
  }));
  if (ranked.length > MODEL_BAR_TOP_N) {
    series.push({ model: '其他', data: dates.map((d) => otherOf(byDate.get(d)!)) });
  }
  return { dates, series };
});

const modelBarDates = computed(() => modelBarMatrix.value.dates);

const modelBarOption = computed<EChartsOption>(() => {
  const { dates, series } = modelBarMatrix.value;
  const metric = modelBarMetric.value;
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
      // 堆叠柱按轴触发时默认给每个 series 一行；这里把「当日合计」顶到第一行，
      // 否则用户要自己加才能知道这根柱的总高
      valueFormatter: (v: any) => (metric === 'token' ? fmtToken(v) : `${currencySymbol.value}${money(v)}`),
    },
    legend: { type: 'scroll', top: 0, icon: 'circle' },
    grid: { left: 60, right: 24, top: 40, bottom: 40, containLabel: false },
    xAxis: {
      type: 'category',
      data: dates,
      // 一天一个柱；区间很长时抽稀刻度，避免标签叠字
      axisLabel: {
        hideOverlap: true,
        formatter: (v: string) => (dates.length > 14 ? String(v).slice(5) : v),
      },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: metric === 'token' ? 'Token' : `费用(${currencySymbol.value})`,
      nameTextStyle: { fontSize: 11, color: 'var(--el-text-color-secondary)' },
      axisLabel: {
        formatter: (v: number) => (metric === 'token' ? fmtToken(v) : money(v)),
      },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: series.map((s) => ({
      name: s.model,
      type: 'bar',
      stack: 'usage',
      barMaxWidth: 34,
      // 圆角只加在栈顶，否则每一段都圆角会露出内部缝隙
      itemStyle: {
        color: colorOfModel(s.model),
        borderColor: surfaceBg.value,
        borderWidth: 1,
      },
      emphasis: { focus: 'series' },
      data: s.data,
    })),
  };
});

const trendOption = computed<EChartsOption>(() => {
  const rows = trendData.value;
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'line', lineStyle: { type: 'dashed' } },
      valueFormatter: (v: any) => fmtToken(v),
    },
    legend: { data: ['输入 Token', '输出 Token'], top: 0 },
    grid: { left: 56, right: 24, top: 40, bottom: 32 },
    xAxis: { type: 'category', boundaryGap: false, data: rows.map((r) => r.date.length > 10 ? r.date.slice(11, 16) : r.date) },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtToken(v) },
    },
    series: [
      {
        name: '输入 Token',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.input),
        areaStyle: { opacity: 0.12 },
      },
      {
        name: '输出 Token',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.output),
        areaStyle: { opacity: 0.12 },
      },
    ],
  };
});

async function loadData() {
  try {
    // 服务商名称映射与用量快照并行：映射失败不阻断表格（providerDisplay 兜底显示原始 id）。
    // 注意：http.get 会拼 /v2 前缀（v2Http），AiProviderController 挂在 /v2/providers 下，
    // 不要写全路径或 /api 前缀。
    if (!providerNameLoaded) {
      providerNameLoaded = true;
      // 新接口未部署时会 404：映射失败静默，服务商列显示原始 id，不弹错
      usageApi.usageProviders().then((res: any) => {
        // unwrap:false 的 client 返回的是整包 {code, data, msg, ...}（见 context.createClient），
        // AiProviderController.list 本体直接返回 List（无 data 壳），所以取 res.data 即数组。
        const list: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        for (const p of list) {
          const id = p?.id ?? p?.provider_id;
          const name = p?.name;
          if (id && name) providerNameMap.value[String(id)] = String(name);
        }
      }).catch(() => { /* 兜底显示原始 id，不弹错 */ });
    }
    const [statRes, sumRes, trendRes, modelTrendRes]: any[] = await Promise.all([
      usageApi.statistics(timeParams.value),
      usageApi.list(timeParams.value),
      usageApi.trend(timeParams.value),
      usageApi.modelTrend(timeParams.value),
    ]);
    Object.assign(stats, statRes.data || {});
    summaryRows.value = sumRes.data || [];
    modelTrendRows.value = (modelTrendRes?.data || []).map((r: any) => ({
      date: String(r?.date || '').slice(0, 10),
      model: r?.model,
      provider: r?.provider,
      totalTokens: Number(r?.totalTokens) || 0,
      totalCost: Number(r?.totalCost) || 0,
    }));
    const dailyRows: any[] = trendRes.data || [];
    const map = new Map<string, { date: string; input: number; output: number; total: number }>();
    for (const r of dailyRows) {
      const raw = String(r.date || ''); const d = raw.length > 10 && raw.includes(':') ? raw.slice(0, 13) : raw.slice(0, 10);
      if (!d) continue;
      if (!map.has(d)) map.set(d, { date: d, input: 0, output: 0, total: 0 });
      const a = map.get(d)!;
      a.input += Number(r.promptTokens) || 0;
      a.output += Number(r.completionTokens) || 0;
      a.total += Number(r.totalTokens) || 0;
    }
    trendData.value = [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    modelPage.value = 1;
    groupPage.value = 1;
  } catch (e: any) {
    message.error('加载用量数据失败: ' + (e?.message || e));
  }
}

async function reloadDetails() {
  detailLoading.value = true;
  try {
    const params: any = {
      page: detailPage.value,
      size: detailPageSize,
      ...timeParams.value,
    };
    if (detailModelFilter.value) {
      params.model = detailModelFilter.value;
    }
    const res: any = await usageApi.detailList(params);
    const payload = res.data || {};
    detailRecords.value = payload.records || [];
    detailTotal.value = payload.total || 0;
  } catch (e: any) {
    message.error('加载明细失败: ' + (e?.message || e));
  } finally {
    detailLoading.value = false;
  }
}

// ---------- 数字格式化 ----------
function money(v: number | null | undefined): string {
  return convertCost(v).toFixed(2);
}

function formatNumber(v: number | null | undefined): string {
  const n = Number(v) || 0;
  return n.toLocaleString('en-US');
}

/**
 * 缓存读取占总 Token 的比例（百分数，未夹取），不可算时返回 -1。
 *
 * <p>「不可算」指的是总 Token 缺失或非正——这和「真的是 0%」是两回事：
 * 缓存类模型上报的 totalTokens 有时不含缓存部分，甚至干脆不报，
 * 此时算出来的比例要么越界、要么除零，所以统一用 -1 把两种情况分开，
 * 由 {@link cacheRatePct} / {@link cacheRateText} 分别决定
 * 「进度条画多宽」和「文案写什么」。</p>
 */
function cacheRateNum(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
  const total = Number(row?.sysAiUsageTotalTokens) || 0;
  if (!(total > 0)) return -1;
  const cached = Number(row?.sysAiUsageCachedTokens) || 0;
  return Math.min(100, Math.max(0, (cached / total) * 100));
}

/** 缓存率进度条宽度（0–100）；不可算时画 0 宽，但文案会显示「—」。 */
function cacheRatePct(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): number {
  const v = cacheRateNum(row);
  return v < 0 ? 0 : v;
}

/** 缓存率文案，一位小数；不可算时显示「—」而不是 0.0%。 */
function cacheRateText(row: { sysAiUsageTotalTokens?: number | null; sysAiUsageCachedTokens?: number | null }): string {
  const v = cacheRateNum(row);
  return v < 0 ? '—' : v.toFixed(1) + '%';
}

function formatLatency(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return Math.round(ms) + 'ms';
  const s = ms / 1000;
  if (s < 60) return (Math.round(s * 100) / 100) + 's';
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  if (m < 60) return m + 'm ' + rs + 's';
  const h = Math.floor(m / 60);
  const rm = Math.round(m % 60);
  return h + 'h ' + rm + 'm';
}

/** 速率格式化：无效或缺失值显示占位符 */
function formatSpeed(v: number | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return n.toFixed(1) + ' tok/s';
}

/**
 * 速率着色：解码速率阈值参考实测基线（约 80~105 tok/s）。
 *
 * <p>≥阈值上限为快（绿），中间为中（橙），低于下限为慢（红）。
 * 解码缺失时读不到速率的场景（非流式）显示占位符，不猜速度。</p>
 */
function speedColor(row: any): string {
  const n = Number(row?.sysAiUsageTokensPerSecond);
  if (!Number.isFinite(n) || n <= 0) return 'var(--el-text-color-placeholder)';
  // 口径假象保护：解码窗口被批量块压到 1s 内时，存储值是总耗时口径近似值
  // （见 AiUsage.tokensPerSecond 窗口保护注释），>1000 的标灰不参与快慢着色。
  // 2026-10-14：历史脏数据（如 3109.9）同样命中此分支，标灰即提示"不可信"。
  // 2026-10-14 扩展：整请求总耗时<1s（秒回/缓存/回放）同样标灰，不误读成模型快。
  if (isSuspiciousSpeed(row)) return 'var(--el-text-color-placeholder)';
  const ok = 80;
  const warn = 40;
  if (n >= ok) return 'var(--el-color-success)';
  if (n >= warn) return 'var(--el-color-warning)';
  return 'var(--el-color-danger)';
}

/**
 * 速率悬浮提示：标灰的不可信速率给出原因与总耗时口径近似值。
 *
 * <p>3109.9 这类值来自批量推送的窄窗口（总耗时−首字耗时<1s），
 * 悬浮时直接展示 按输出÷总耗时 的保守近似（如 32.7 tok/s），
 * 用户不必靠猜或除以魔法数字。</p>
 */
function speedTitle(row: any): string {
  if (!isSuspiciousSpeed(row)) return '';
  const out = Number(row?.sysAiUsageCompletionTokens);
  const total = Number(row?.sysAiUsageTotalLatency);
  let extra = '';
  if (Number.isFinite(out) && out > 0 && Number.isFinite(total) && total > 0) {
    extra = `；按总耗时口径约 ${(out / (total / 1000)).toFixed(1)} tok/s`;
  }
  const n = Number(row?.sysAiUsageTokensPerSecond);
  const shortTotal = isShortTotalLatency(row);
  if (n > SPEED_SUSPICIOUS && shortTotal) {
    return `解码窗口不足 1s（服务商批量推送的口径假象），且总耗时不足 1s（疑似缓存命中或回放），此速率不可信${extra}`;
  }
  if (n > SPEED_SUSPICIOUS) {
    return `解码窗口不足 1s（服务商批量推送的口径假象），此速率不可信${extra}`;
  }
  return `总耗时不足 1s，疑似缓存命中或回放，不能作为模型解码能力参考${extra}`;
}

/**
 * 解码窗口 = 总耗时 − 首字耗时；任一缺失或首字≥总耗时时退化为总耗时。
 */
function decodeWindowMs(row: any): number | null {
  const total = Number(row?.sysAiUsageTotalLatency);
  const ttft = Number(row?.sysAiUsageFirstTokenLatency);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (Number.isFinite(ttft) && ttft > 0 && ttft < total) return total - ttft;
  return total;
}

/** 解码窗口着色：<1s 多为批量推送假象，标灰（与速率标灰同口径） */
function decodeWindowColor(row: any): string {
  const ms = decodeWindowMs(row);
  if (ms == null || ms <= 0) return 'var(--el-text-color-placeholder)';
  if (ms < 1000) return 'var(--el-text-color-placeholder)';
  if (ms < 2000) return 'var(--el-color-success)';
  if (ms < 6000) return 'var(--el-color-warning)';
  return 'var(--el-color-danger)';
}

// ---------- 延迟指示器：上下两段 + 阈值变色 ----------
const FIRST_THRESHOLDS = { ok: 1500, warn: 4000 };
const TOTAL_THRESHOLDS = { ok: 8000, warn: 25000 };

function latencyColor(ms: number | null | undefined, t: { ok: number; warn: number }): string {
  if (ms == null || ms <= 0) return 'var(--el-text-color-placeholder)';
  if (ms < t.ok) return 'var(--el-color-success)';
  if (ms < t.warn) return 'var(--el-color-warning)';
  return 'var(--el-color-danger)';
}
function getFirstColor(row: any): string {
  return latencyColor(row?.sysAiUsageFirstTokenLatency, FIRST_THRESHOLDS);
}
function getTotalColor(row: any): string {
  return latencyColor(row?.sysAiUsageTotalLatency, TOTAL_THRESHOLDS);
}

// ---------- 来源类型中文标签 ----------
/**
 * 2026-10-14 补齐漏网取值：chat_stream（流式会话）、memory-extract
 * （记忆提取）。库里 memory-extract 用的是**连字符**，查找前统一把
 * 连字符归一成下划线并转小写，否则该类型会裸显英文（用户反馈
 * 「类型没有翻译」即此）。
 */
const TYPE_LABEL_MAP: Record<string, string> = {
  chat: '会话',
  chat_stream: '流式会话',
  bot: '连接器',
  memory_extract: '记忆提取',
  optimize: '优化',
  optimization: '优化',
  external: '三方',
  third_party: '三方',
  service: '服务',
};
function formatTypeLabel(t: string | null | undefined): string {
  if (t == null || t === '') return '—';
  const key = String(t).trim().replace(/-/g, '_').toLowerCase();
  return TYPE_LABEL_MAP[key] || t;
}

/**
 * 调用类型（流式口径）。
 *
 * <p>库里的 call_type 由调用方声明（chat / chat_stream / bot /
 * memory-extract），DDL 原意是 sync/async，但实际落库与 type 同值，
 * 无法直接区分同步/异步。这里按「是否流式」展示：类型含 stream
 * 标记即流式，未声明或无法识别时默认流式（控制台对话默认走
 * SSE 流式）。</p>
 */
function callModeLabel(row: any): string {
  const t = String(row?.sysAiUsageType || row?.sysAiUsageCallType || '').toLowerCase();
  if (t.includes('non_stream') || t.includes('nostream') || t.includes('nonstream')) return '非流式';
  return '流式';
}

function callModeTag(row: any): 'success' | 'info' {
  return callModeLabel(row) === '流式' ? 'success' : 'info';
}

/**
 * 端点展示：统一加「入站:」前缀；缺失时兜底控制台默认对话端点。
 *
 * <p>存量 333 行全是 /v1/chat/completions（控制台与三方工具共用
 * 的入站对话端点），缺省值与之一致，避免空单元格误读为「无端点」。</p>
 */
function endpointDisplay(row: any): string {
  const ep = String(row?.sysAiUsageEndpoint || '').trim();
  return '入站:' + (ep || '/v1/chat/completions');
}

function typeTagType(t: string | null | undefined): 'primary' | 'info' | 'warning' | 'success' {
  if (t === 'chat_stream' || t === 'chat') return 'primary';
  if (t === 'external' || t === 'third_party') return 'info';
  if (t === 'memory_extract' || t === 'summary') return 'warning';
  return 'success';
}

function formatCompact(v: number | null | undefined): string {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return String(n);
}

// ---------- 单位设置（来自用量配置，保存后联动）----------
type CurrencyCode = 'CNY' | 'USD' | 'EUR';
const currency = ref<CurrencyCode>('CNY');
const currencySymbol = ref('¥');
const autoConvert = ref(true);
const rateUsd = ref(7.1);
const rateEur = ref(7.8);
const tokenScale = ref<'auto' | 'raw'>('auto');
const fmtToken = (v: number | null | undefined): string =>
  tokenScale.value === 'raw' ? formatNumber(v) : formatCompact(v);

// ---------- ReTable 列配置（统一走 :columns + #col-* 插槽） ----------
function distColumnDefs(nameLabel: string): ReTableColumn[] {
  return [
    {
      prop: 'name',
      label: nameLabel,
      minWidth: 140,
      showOverflowTooltip: true,
      slot: 'name',
    },
    { prop: 'requests', label: '请求', width: 90, align: 'right', slot: 'requests' },
    { prop: 'totalTokens', label: 'Token', width: 110, align: 'right', slot: 'totalTokens' },
    { prop: 'cost', label: `费用(${currencySymbol.value})`, width: 100, align: 'right', slot: 'cost' },
    { prop: 'percent', label: '占比', width: 90, align: 'right', slot: 'percent' },
  ];
}
const modelDistColumns = computed<ReTableColumn[]>(() => distColumnDefs('模型'));
const groupDistColumns = computed<ReTableColumn[]>(() => distColumnDefs('分组'));

const detailColumns = computed<ReTableColumn[]>(() => [
  { prop: 'time', label: '时间', width: 160, slot: 'time' },
  { prop: 'model', label: '模型', minWidth: 180, showOverflowTooltip: true, slot: 'model' },
  { prop: 'group', label: '分组', width: 140, showOverflowTooltip: true, slot: 'group' },
  { prop: 'user', label: '账号', width: 90, slot: 'user' },
  { prop: 'provider', label: '服务商', width: 100, slot: 'provider' },
  { prop: 'endpoint', label: '端点', width: 185, showOverflowTooltip: true, slot: 'endpoint' },
  { prop: 'strength', label: '强度', width: 90, slot: 'strength' },
  { prop: 'ip', label: '请求 IP', width: 130, showOverflowTooltip: true, slot: 'ip' },
  { prop: 'tokens', label: 'Token', width: 170, align: 'right', slot: 'tokens' },
  { prop: 'cost', label: `费用(${currencySymbol.value})`, width: 90, align: 'right', slot: 'cost' },
  { prop: 'latency', label: '耗时', width: 150, slot: 'latency' },
  { prop: 'type', label: '类型', width: 130, slot: 'type' },
  { prop: 'callType', label: '调用类型', width: 95, slot: 'callType' },
]);

// 费用以人民币（元 CNY）入库；按当前货币与汇率换算显示
function convertCost(v: number | null | undefined): number {
  const n = Number(v) || 0;
  if (!autoConvert.value || currency.value === 'CNY') return n;
  if (currency.value === 'USD') return n / rateUsd.value;
  if (currency.value === 'EUR') return n / rateEur.value;
  return n;
}

async function loadUnits() {
  try {
    const res: any = await usageApi.config();
    const list = res?.data || res;
    if (Array.isArray(list)) {
      const symMap = { CNY: '¥', USD: '$', EUR: '€' } as Record<string, string>;
      for (const row of list) {
        if (row.field === 'usage_currency') {
          const code = (['CNY', 'USD', 'EUR'].includes(row.value) ? row.value : 'CNY') as CurrencyCode;
          currency.value = code;
          currencySymbol.value = symMap[code];
        }
        if (row.field === 'usage_currency_auto_convert') {
          autoConvert.value = String(row.value) === 'true';
        }
        if (row.field === 'usage_rate_usd') {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateUsd.value = r;
        }
        if (row.field === 'usage_rate_eur') {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateEur.value = r;
        }
        if (row.field === 'usage_token_scale') {
          tokenScale.value = row.value === 'raw' ? 'raw' : 'auto';
        }
      }
    }
  } catch {
    /* 读取失败沿用默认单位 */
  }
}

function formatTime(v: any): string {
  if (v == null) return '-';
  if (Array.isArray(v)) {
    const p = (x: number) => String(x).padStart(2, '0');
    return `${v[0]}-${p(v[1])}-${p(v[2])} ${p(v[3] || 0)}:${p(v[4] || 0)}:${p(v[5] || 0)}`;
  }
  return String(v).replace('T', ' ').slice(0, 19);
}

onMounted(() => {
  loadUnits();
  setQuickFilter('today');
});
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余组件统一）：
   1. --mp-radius 来自 src/styles/modern-polish.css，而 main.js 从未引入该文件，
      是取不到值的空令牌，实际一直靠兜底的 14px 在渲染 → 收敛到 --el-radius-xl。
   2. rgba(0,0,0,.08) 这类手写投影色改用 color-mix + --el-text-color-primary，
      暗色下不会糊成黑块；投影只出现在「选中指示 / 悬浮浮起」两类允许的场景。
   3. 过渡统一 var(--el-transition-duration-fast, 0.2s)。
   注意：本文件 <script> 里的 ECharts option 颜色是 canvas 语境，var() 不生效，
   属于刻意保留，不得令牌化。
   ============================================================================ */
.usage-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
}

.usage-page > * {
  flex-shrink: 0;
}

/* ===== 英雄区 ===== */
.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}
.hero-text { display: flex; flex-direction: column; gap: 6px; }
.page-title {
  font-size: 22px; font-weight: 700; margin: 0;
  letter-spacing: -0.01em; color: var(--el-text-color-primary);
}
.page-subtitle {
  margin: 0; display: inline-flex; align-items: center; gap: 7px;
  font-size: 12.5px; color: var(--el-text-color-secondary);
}
.sub-dot {
  width: 7px; height: 7px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.quick-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.seg-pills {
  display: inline-flex; align-items: center; gap: 2px; padding: 3px;
  background: var(--el-fill-color-light);
  /* 原值 10px（距 8/12 等距，本仓统一取 lg 档） */
  border-radius: var(--el-radius-lg, 12px);
}
.pill {
  appearance: none; border: 0; cursor: pointer;
  /* 原值 8px → md 档 */
  padding: 6px 14px; border-radius: var(--el-radius-md, 8px);
  font-size: 12.5px; font-weight: 500; white-space: nowrap;
  color: var(--el-text-color-secondary); background: transparent;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.pill:hover { color: var(--el-text-color-primary); }
.pill.active {
  color: var(--el-color-primary); background: var(--el-bg-color);
  font-weight: 600;
  /* 分段控件的「选中」指示：1px 描边 + 极浅投影，属于允许的选中态标识而非卡片投影 */
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--el-text-color-primary) 8%, transparent),
    0 0 0 1px var(--el-border-color-lighter);
}
.hero-date { width: 268px; }
/* 原值 9px（离 8 更近）→ md 档 */
.hero-date :deep(.el-range-editor.el-input__wrapper) { height: 34px; border-radius: var(--el-radius-md, 8px); }

/* ===== KPI 卡 ===== */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  position: relative; overflow: hidden;
  padding: 16px 18px 15px 20px;
  /* 原值 var(--mp-radius, 14px)：--mp-radius 是空令牌，实为 14px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.kpi-card::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 3px;
  background: var(--kpi-accent, var(--el-color-primary)); opacity: 0.9;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-border-color);
}
.kpi-top { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.kpi-icon {
  width: 30px; height: 30px; display: inline-flex;
  align-items: center; justify-content: center;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px); color: var(--kpi-accent);
  background: var(--kpi-accent-soft, var(--el-color-primary-light-9));
}
.kpi-icon svg { width: 17px; height: 17px; }
.kpi-label { font-size: 12.5px; color: var(--el-text-color-secondary); font-weight: 500; }
.kpi-value {
  font-size: 25px; font-weight: 700; line-height: 1.15;
  color: var(--el-text-color-primary); letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}
.kpi-value.cost { color: var(--el-color-success); }
.kpi-value .unit {
  font-size: 13px; font-weight: 500;
  color: var(--el-text-color-secondary); margin-left: 3px;
}
.kpi-sub {
  margin-top: 10px; display: flex; gap: 12px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--el-text-color-secondary);
}

/* KPI 语义色 */
.tone-primary { --kpi-accent: var(--el-color-primary); --kpi-accent-soft: var(--el-color-primary-light-9); }
.tone-success { --kpi-accent: var(--el-color-success); --kpi-accent-soft: var(--el-color-success-light-9); }
.tone-warning { --kpi-accent: var(--el-color-warning); --kpi-accent-soft: var(--el-color-warning-light-9); }
.tone-info { --kpi-accent: var(--el-color-info); --kpi-accent-soft: var(--el-color-info-light-9); }

.dist-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.page-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  padding: 18px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.seg-toggle {
  display: inline-flex;
  background: var(--el-fill-color-light);
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  padding: 2px;
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 4px 12px;
  font-size: 12px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

.seg-btn.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
}

.dist-table-wrap,
.detail-table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}

.dist-table,
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.dist-table th,
.detail-table th {
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  white-space: nowrap;
}

.dist-table td,
.detail-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.dist-table tbody tr:hover,
.detail-table tbody tr:hover {
  background: var(--el-fill-color-light);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.model-name {
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-cell {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.empty-cell,
.chart-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 28px 0;
  font-size: 13px;
}

/* ==================== 实时用量条 ====================
   常驻页头下方而非塞进 KPI 卡片：它是一个「状态」而不是一个「统计值」，
   需要一个能被一眼扫到的位置（连接断开时颜色会变），不能混在数字里。 */
.live-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--el-color-info);
}

.live-dot.is-pulsing {
  background: var(--el-color-success);
  animation: live-pulse 1.4s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 60%, transparent); }
  50% { opacity: 0.55; box-shadow: 0 0 0 5px transparent; }
}

/* 连接断开时整条转为警示色：静默失效的「实时」比没有实时更糟，
   必须让用户一眼看出数字不再更新 */
.live-bar.is-error {
  border-color: color-mix(in srgb, var(--el-color-warning) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 8%, var(--el-bg-color));
}
.live-bar.is-error .live-dot { background: var(--el-color-warning); }
.live-bar.is-paused { opacity: 0.72; }

.live-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.live-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-left: auto;
}

.live-metric b {
  margin-left: 4px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.live-metric.is-rate b { color: var(--el-color-primary); }

/* ==================== Top5 排行 ==================== */
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.rank-no {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.rank-no.is-1 { color: #fff; background: #e6a23c; }
.rank-no.is-2 { color: #fff; background: #909399; }
.rank-no.is-3 { color: #fff; background: #b5a08a; }

.rank-name {
  flex: 0 0 30%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-bar {
  flex: 1 1 auto;
  min-width: 40px;
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.rank-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}

.rank-value {
  flex: 0 0 auto;
  min-width: 78px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.rank-pct {
  flex: 0 0 auto;
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

/* 图表读法说明，压在图上方，避免用户误把堆叠段当成绝对值 */
.chart-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.pager-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.filter-input {
  width: 180px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dist-grid {
    grid-template-columns: 1fr;
  }
}
/* 耗时列（截图口径）：竖条 + 右侧两行 首字/总耗，着色沿用首字/总耗时阈值 */
.latency-inline { display: inline-flex; align-items: stretch; gap: 8px; cursor: default; }
.latency-vbar { width: 4px; border-radius: var(--el-radius-full, 9999px); background: var(--el-color-danger); flex-shrink: 0; }
.latency-lines { display: flex; flex-direction: column; gap: 2px; }
.latency-line { display: flex; align-items: baseline; gap: 6px; }
.latency-k { font-size: 11px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.latency-v { font-size: 12px; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }
/* 模型列：名 + 解码速率 subtitle（速率着色沿用 speedColor，快慢一眼可辨） */
.model-cell { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.model-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.model-sub { font-size: 11px; line-height: 14px; white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
/* Token 列第二行：缓存 */
.tk-cache-line { color: var(--el-color-info); }
.cell-muted { color: var(--el-text-color-placeholder); }
/* 原值 2px（4px 宽细条的一半，视觉上就是胶囊）→ full 档 */
.latency-bar { width: 4px; height: 14px; border-radius: var(--el-radius-full, 9999px); background: var(--el-color-danger); flex-shrink: 0; }
.latency-value { color: var(--el-text-color-primary); }
.latency-popover {
  display: none;
  position: absolute;
  min-width: 150px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  /* 下方又写了一次 6px 并覆盖之，属既有事实，此处只做令牌化保持原生效值 */
  border-radius: var(--el-radius-sm, 6px);
  padding: 8px 12px;
  box-shadow: var(--el-box-shadow);
  white-space: nowrap;
  z-index: 100;
  font-size: 12px;
  line-height: 1.6;
}
.latency-cell:hover .latency-popover { display: block; }
.latency-popover-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.latency-popover-row { display: flex; align-items: center; gap: 8px; height: 22px; }
/* 原值 2px（4px 宽色块）→ full 档 */
.latency-popover-row::before { content: ''; width: 4px; height: 16px; border-radius: var(--el-radius-full, 9999px); background: var(--el-color-danger); flex-shrink: 0; }
.latency-popover-label { color: var(--el-text-color-secondary); font-size: 12px; }
.latency-popover-value { margin-left: auto; color: var(--el-color-danger); font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; }

/* 固定上下段延迟指示器（flex 两端对齐） */
.latency-indicator {
  display: inline-flex;
  align-items: stretch;
  justify-content: space-between;
  width: 46px;
  height: 39px;
  cursor: default;
}
.latency-track {
  width: 5px;
  height: 39px;
  /* 原值 3px（5px 宽细条，略大于半高即胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.latency-seg-first,
.latency-seg-rest { width: 100%; flex-shrink: 0; }
.latency-times {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 39px;
  text-align: right;
}
.latency-time-first,
.latency-time-total,
.latency-time-speed {
  font-size: 11px;
  line-height: 13px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.latency-time-speed { font-weight: 600; }
.latency-popover-content { font-size: 12px; }
.latency-popover-content .latency-popover-row { display: flex; align-items: center; gap: 8px; height: 22px; }
/* 原值 50%（正圆）→ full 档 */
.latency-popover-dot { width: 8px; height: 8px; border-radius: var(--el-radius-full, 9999px); flex-shrink: 0; }
.latency-popover-content .latency-popover-label { color: var(--el-text-color-secondary); }
.latency-popover-content .latency-popover-value { margin-left: auto; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; font-weight: 500; }
.latency-popover-hint { margin-top: 6px; font-size: 11px; color: var(--el-text-color-placeholder); }
.latency-popover-divider { height: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }
/* 耗时 popover 内的异常速率说明（批量推送口径假象） */
.latency-popover-note { margin-top: 6px; font-size: 11px; color: var(--el-color-warning); line-height: 1.5; }
/* 速率 popover（模型列解码速率 hover）：阶段明细 + Token 明细 + 异常说明 */
.speed-popover-content { font-size: 12px; }
.speed-popover-title { font-weight: 600; margin-bottom: 6px; }
.speed-popover-row { display: flex; align-items: center; gap: 8px; height: 22px; }
.speed-popover-content .sp-label { color: var(--el-text-color-secondary); font-size: 12px; }
.speed-popover-content .sp-val { margin-left: auto; font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.speed-popover-divider { height: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }
.speed-popover-note { margin-top: 6px; font-size: 11px; color: var(--el-color-warning); line-height: 1.5; }
.speed-popover-hint { margin-top: 6px; font-size: 11px; color: var(--el-text-color-placeholder); }
/* 端点列 */
.endpoint-cell { font-size: 12px; font-variant-numeric: tabular-nums; }
/* 费用敏感数据：隐藏态眼睛图标 / 开关按钮 / 金额 */
.cost-toggle { margin-left: 8px; }
.cost-eye { color: var(--el-text-color-placeholder); }
.cost-val { font-variant-numeric: tabular-nums; }
/* 模型列速率 subtitle：hover 弹阶段明细 */
.model-sub.is-speed { cursor: default; }

.token-estimated { border-bottom: 1px dashed var(--el-color-warning); cursor: help; }

/* 合并后的 Token 列：第一行输入/输出，第二行缓存（有缓存才渲染） */
.token-cell { position: relative; display: inline-flex; align-items: center; justify-content: flex-end; cursor: default; }
.token-cell.token-estimated { cursor: help; }
.token-col { display: inline-flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.token-inline { display: inline-flex; align-items: center; gap: 10px; }
.token-cell .tk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
.tk-ic { width: 13px; height: 13px; flex-shrink: 0; }
.tk-in { color: var(--el-color-success); }
.tk-out { color: var(--el-color-primary); }
.tk-cache { color: var(--el-color-info); }
.token-detail {
  display: none; position: absolute; min-width: 172px; bottom: calc(100% + 6px); right: 0;
  /* 原值 8px → md 档 */
  padding: 10px 12px; border-radius: var(--el-radius-md, 8px); background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light); box-shadow: var(--el-box-shadow);
  z-index: 100; font-size: 12px;
}
.token-cell:hover .token-detail { display: block; }
.token-detail-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; display: flex; align-items: center; }
/* 标题前的色块：与下方缓存率/缓存读数同色，一眼看出「这一坨都是缓存相关」 */
.td-dot { width: 6px; height: 6px; margin-right: 6px; border-radius: 1px; background: var(--el-color-info); flex-shrink: 0; }
.token-detail-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; height: 22px; }
.td-label { color: var(--el-text-color-secondary); }
.td-val { font-variant-numeric: tabular-nums; font-weight: 500; }
.td-total .td-label { color: var(--el-text-color-primary); font-weight: 600; }
.td-total .td-val { color: var(--el-text-color-primary); font-weight: 700; }
.token-detail-divider { height: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }
/* 缓存率：进度条 + 百分比。底槽与填充都用竖向条纹（2px 实 / 2px 空），
   比纯色条更能看出「几乎打满」还是「才一半」，也不必再配文字说明。 */
.td-rate-body { display: flex; align-items: center; gap: 8px; }
.td-rate-bar {
  width: 72px; height: 8px; border-radius: 2px; overflow: hidden; flex-shrink: 0;
  background: repeating-linear-gradient(90deg, var(--el-fill-color) 0 2px, transparent 2px 4px);
}
.td-rate-bar > i {
  display: block; height: 100%; border-radius: 2px;
  background: repeating-linear-gradient(90deg, var(--el-color-info) 0 2px, transparent 2px 4px);
}
.td-est-note { margin-top: 6px; font-size: 11px; line-height: 1.4; color: var(--el-color-warning); }

/* 尊重系统「减少动态效果」偏好。
   KPI 卡与分段按钮的选中态都靠底色 + 1px 描边表达，关掉过渡后依然可辨。 */
@media (prefers-reduced-motion: reduce) {
  .kpi-card,
  .pill,
  .seg-btn {
    transition: none;
  }
}
</style>
