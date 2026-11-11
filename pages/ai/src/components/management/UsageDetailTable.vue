<template>
  <!--
    用量管理 · 明细表（业务区块，三个变体共享）

    <p>原 {@code UsagePage.vue} 用量明细区块原样抽出：13 列全部保留（时间钉左 +
    模型速率 popover + Token 明细 + 耗时指示 + 费用敏感开关 + 类型/调用标签 +
    ReIpText 等），数据/loader 全部来自 {@code board}（由各变体 {@code reactive(useUsageBoard())} 注入）。</p>
  -->
  <section class="usage-detail">
    <header class="ud-head">
      <div class="ud-title-wrap">
        <h3 class="ud-title">用量明细</h3>
        <span class="ud-hint">{{ board.rangeLabel }}</span>
      </div>
      <div class="ud-actions">
        <!-- 模型过滤：值进了 detailQueryParams，ReTable 会 watch params 变化
             自动回到第 1 页重新取数，无需再手动触发 -->
        <el-input v-model="board.detailModelFilter" placeholder="按模型筛选" clearable class="ud-filter" />
        <!-- 敏感数据（费用）显示开关：默认隐藏，点眼睛才露出金额 -->
        <el-button link type="primary" class="ud-cost-toggle" @click="board.costVisible = !board.costVisible"
          :title="board.costVisible ? '隐藏费用等敏感数据' : '显示费用等敏感数据'">
          <el-icon><Eye24Regular v-if="board.costVisible" /><EyeOff24Regular v-else /></el-icon>
          {{ board.costVisible ? '隐藏费用' : '显示费用' }}
        </el-button>
      </div>
    </header>
    <div class="ud-body">
      <ReTable
        :data="board.detailRecords"
        :loading="board.detailLoading"
        :columns="board.detailColumns"
        :show-index="false"
        class="ud-table"
        row-key="sysAiUsageId"
        :pagination="true"
        :layout-table="{ minHeight: 0 }"
        :loader="board.loadDetailPage"
        :params="board.detailQueryParams"
        :page-sizes="[10, 20, 50, 100, 200, 500]"
      >
        <template #col-time="{ row }"><span class="ud-cell-time">{{ board.formatTime(row.sysAiUsageCallTime) }}</span></template>
        <template #col-model="{ row }">
          <div class="ud-cell-model">
            <span class="ud-model-name" :title="row.sysAiUsageModel || '-'">{{ row.sysAiUsageModel || '-' }}</span>
            <!-- 解码速率：hover 弹完整阶段明细（首字/解码窗口/总耗 + Token 明细 + 速率）。 -->
            <el-popover trigger="hover" placement="top" :show-arrow="true" :width="265">
              <template #reference>
                <span class="ud-model-sub is-speed" :style="{ color: board.speedColor(row) }">{{ board.formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
              </template>
              <div class="speed-pop">
                <div class="speed-pop-title">速率阶段明细</div>
                <div class="speed-pop-row">
                  <span class="sp-label">首字耗时</span>
                  <span class="sp-val" :style="{ color: board.getFirstColor(row) }">{{ board.formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
                </div>
                <div class="speed-pop-row">
                  <span class="sp-label">解码窗口</span>
                  <span class="sp-val" :style="{ color: board.decodeWindowColor(row) }">{{ board.formatLatency(board.decodeWindowMs(row)) }}</span>
                </div>
                <div class="speed-pop-row">
                  <span class="sp-label">总耗时</span>
                  <span class="sp-val" :style="{ color: board.getTotalColor(row) }">{{ board.formatLatency(row.sysAiUsageTotalLatency) }}</span>
                </div>
                <div class="speed-pop-divider"></div>
                <div class="speed-pop-row">
                  <span class="sp-label">输入 Token</span>
                  <span class="sp-val">{{ board.formatNumber(row.sysAiUsagePromptTokens) }}</span>
                </div>
                <div class="speed-pop-row">
                  <span class="sp-label">输出 Token</span>
                  <span class="sp-val">{{ board.formatNumber(row.sysAiUsageCompletionTokens) }}</span>
                </div>
                <div class="speed-pop-row">
                  <span class="sp-label">缓存读取</span>
                  <span class="sp-val">{{ board.formatNumber(row.sysAiUsageCachedTokens) }}</span>
                </div>
                <div class="speed-pop-row">
                  <span class="sp-label">总 Token</span>
                  <span class="sp-val">{{ board.formatNumber(row.sysAiUsageTotalTokens) }}</span>
                </div>
                <div class="speed-pop-divider"></div>
                <div class="speed-pop-row">
                  <span class="sp-label">解码速率</span>
                  <span class="sp-val" :style="{ color: board.speedColor(row) }">{{ board.formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
                </div>
                <div v-if="board.isSuspiciousSpeed(row)" class="speed-pop-note">{{ board.speedTitle(row) }}</div>
                <div class="speed-pop-hint">绿/橙/红 = 快/中/慢；解码窗口或总耗时不足 1s 标灰（批量推送假象/疑似缓存回放）</div>
              </div>
            </el-popover>
          </div>
        </template>
        <template #col-group="{ row }">{{ row.sysAiUsageGroupName }}</template>
        <template #col-user="{ row }">
          <ReTag :type="row.sysAiUsageUserId ? 'primary' : 'info'">{{ row.sysAiUsageUserId || '三方' }}</ReTag>
        </template>
        <template #col-provider="{ row }"><span :title="row.sysAiUsageProvider || ''">{{ board.providerDisplay(row.sysAiUsageProvider) }}</span></template>
        <template #col-endpoint="{ row }">
          <span class="ud-cell-endpoint">{{ board.endpointDisplay(row) }}</span>
        </template>
        <template #col-strength="{ row }">
          <ReTag v-if="row.sysAiUsageInferenceStrength && row.sysAiUsageInferenceStrength !== '默认'"
            type="info">{{ row.sysAiUsageInferenceStrength }}</ReTag>
          <span v-else class="ud-cell-muted">默认</span>
        </template>
        <template #col-ip="{ row }">
          <ReIpText v-if="row.sysAiUsageIp" :ip="row.sysAiUsageIp" :address="row.sysAiUsageLocation" />
          <span v-else class="ud-cell-muted">—</span>
        </template>
        <template #col-tokens="{ row }">
          <el-popover trigger="hover" placement="top" :show-arrow="true" :width="200">
            <template #reference>
              <div class="ud-cell-tokens" :class="{ 'is-estimated': row.sysAiUsageEstimatedTokens === 1 }">
                <span class="ud-tk-col">
                  <span class="ud-tk-inline">
                    <span class="ud-tk tk-in">
                      <svg class="ud-tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8.2M4.6 7.3 8 10.8l3.4-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ board.fmtToken(row.sysAiUsagePromptTokens) }}
                    </span>
                    <span class="ud-tk tk-out">
                      <svg class="ud-tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5V5.3M4.6 8.7 8 5.2l3.4 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ board.fmtToken(row.sysAiUsageCompletionTokens) }}
                    </span>
                  </span>
                  <span v-if="Number(row.sysAiUsageCachedTokens) > 0" class="ud-tk tk-cache-line" :title="'缓存读取 ' + board.formatNumber(row.sysAiUsageCachedTokens)">
                    <svg class="ud-tk-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.5h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6ZM3 5.5 8 3l5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ board.fmtToken(row.sysAiUsageCachedTokens) }}
                  </span>
                </span>
              </div>
            </template>
            <div class="tk-detail">
              <div class="tk-detail-title"><i class="td-dot" />Token 明细</div>
              <div class="tk-detail-row"><span class="td-label">输入</span><span class="td-val tk-in">{{ board.formatNumber(row.sysAiUsagePromptTokens) }}</span></div>
              <div class="tk-detail-row"><span class="td-label">输出</span><span class="td-val tk-out">{{ board.formatNumber(row.sysAiUsageCompletionTokens) }}</span></div>
              <div class="tk-detail-row"><span class="td-label">缓存读取</span><span class="td-val tk-cache">{{ board.formatNumber(row.sysAiUsageCachedTokens) }}</span></div>
              <div class="tk-detail-divider"></div>
              <div class="tk-detail-row is-total"><span class="td-label">总计</span><span class="td-val">{{ board.formatNumber(row.sysAiUsageTotalTokens) }}</span></div>
              <div class="tk-detail-row is-rate">
                <span class="td-label">缓存率</span>
                <span class="td-rate-body">
                  <span class="td-rate-bar"><i :style="{ width: board.cacheRatePct(row) + '%' }" /></span>
                  <span class="td-val">{{ board.cacheRateText(row) }}</span>
                </span>
              </div>
              <div v-if="row.sysAiUsageEstimatedTokens === 1" class="tk-detail-note">Token 为估算值（Qoder 按积分计费，未上报真实 token）</div>
            </div>
          </el-popover>
        </template>
        <template #col-cost="{ row }">
          <!-- 敏感数据：默认只给眼睛图标，由「用量明细」头部的显示费用开关统一控制 -->
          <span v-if="board.costVisible" class="ud-cell-cost">{{ board.money(row.sysAiUsageTotalCost) }}</span>
          <el-icon v-else class="ud-cost-eye" title="费用已隐藏，点击上方「显示费用」查看"><EyeOff24Regular /></el-icon>
        </template>
        <template #col-latency="{ row }">
          <el-popover trigger="hover" placement="top" :show-arrow="true" :width="220">
            <template #reference>
              <div class="ud-latency-inline">
                <span class="ud-latency-vbar" :style="{ backgroundColor: board.getTotalColor(row) }"></span>
                <div class="ud-latency-lines">
                  <div class="ud-latency-line"><span class="ud-latency-k">首字</span><span class="ud-latency-v" :style="{ color: board.getFirstColor(row) }">{{ board.formatLatency(row.sysAiUsageFirstTokenLatency) }}</span></div>
                  <div class="ud-latency-line"><span class="ud-latency-k">总耗</span><span class="ud-latency-v" :style="{ color: board.getTotalColor(row) }">{{ board.formatLatency(row.sysAiUsageTotalLatency) }}</span></div>
                </div>
              </div>
            </template>
            <div class="latency-pop">
              <div class="latency-pop-row">
                <span class="latency-pop-dot" :style="{ background: board.getFirstColor(row) }"></span>
                <span class="latency-pop-label">首字</span>
                <span class="latency-pop-value" :style="{ color: board.getFirstColor(row) }">{{ board.formatLatency(row.sysAiUsageFirstTokenLatency) }}</span>
              </div>
              <div class="latency-pop-row">
                <span class="latency-pop-dot" :style="{ background: board.getTotalColor(row) }"></span>
                <span class="latency-pop-label">总耗时</span>
                <span class="latency-pop-value" :style="{ color: board.getTotalColor(row) }">{{ board.formatLatency(row.sysAiUsageTotalLatency) }}</span>
              </div>
              <div class="latency-pop-row">
                <span class="latency-pop-dot" :style="{ background: board.speedColor(row) }"></span>
                <span class="latency-pop-label">解码速率</span>
                <span class="latency-pop-value" :style="{ color: board.speedColor(row) }">{{ board.formatSpeed(row.sysAiUsageTokensPerSecond) }}</span>
              </div>
              <div class="latency-pop-divider"></div>
              <div class="latency-pop-row">
                <span class="latency-pop-dot" style="background: var(--el-color-success)"></span>
                <span class="latency-pop-label">输入 Token</span>
                <span class="latency-pop-value">{{ board.formatNumber(row.sysAiUsagePromptTokens) }}</span>
              </div>
              <div class="latency-pop-row">
                <span class="latency-pop-dot" style="background: var(--el-color-primary)"></span>
                <span class="latency-pop-label">输出 Token</span>
                <span class="latency-pop-value">{{ board.formatNumber(row.sysAiUsageCompletionTokens) }}</span>
              </div>
              <div class="latency-pop-row">
                <span class="latency-pop-dot" style="background: var(--el-text-color-primary)"></span>
                <span class="latency-pop-label">总 Token</span>
                <span class="latency-pop-value">{{ board.formatNumber(row.sysAiUsageTotalTokens) }}</span>
              </div>
              <div v-if="board.isSuspiciousSpeed(row)" class="latency-pop-note">{{ board.speedTitle(row) }}</div>
              <div class="latency-pop-hint">绿/橙/红=快/中/慢（耗时与速率）</div>
            </div>
          </el-popover>
        </template>
        <template #col-type="{ row }">
          <ReTag :type="board.typeTagType(row.sysAiUsageType)">{{ board.formatTypeLabel(row.sysAiUsageType) }}</ReTag>
        </template>
        <template #col-callType="{ row }">
          <ReTag :type="board.callModeTag(row)">{{ board.callModeLabel(row) }}</ReTag>
        </template>
      </ReTable>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 用量明细表（业务区块）。
 *
 * <p>props.board 由各变体 {@code reactive(useUsageBoard())} 注入 —— 复用了同一份
 * 业务逻辑（loader 分页 / 格式化 / 压缩开关），本组件不持有任何状态。</p>
 */
import ReTable from '@/components/ui/ReTable.vue';
import ReTag from '@/components/ui/ReTag.vue';
import ReIpText from '@repo/ui/re-ip-text';
import { Eye24Regular, EyeOff24Regular } from '@vicons/fluent';

defineProps<{ board: any }>();
</script>

<style scoped>
/* ============================================================================
   明细表区块 —— 三个变体共用，样式收敛在 scoped 内，避免各变体重复
   ============================================================================ */
.usage-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--u-radius, 8px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}
.ud-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
}
.ud-title-wrap { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.ud-title { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: var(--el-text-color-primary); white-space: nowrap; }
.ud-hint { font-size: 12px; color: var(--el-text-color-placeholder); white-space: nowrap; }
.ud-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ud-filter { width: 180px; }
.ud-cost-toggle { margin-left: 8px; }
.ud-body { padding: 0 6px 8px; min-width: 0; }

.ud-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.ud-table :deep(.re-table-wrapper) { border-radius: 0; }
.ud-table :deep(.vxe-table--border-line),
.ud-table :deep(.vxe-table--render-default) { border: 0; }
.ud-table :deep(.vxe-table--header-wrapper) { background: transparent; }
.ud-table :deep(.vxe-header--column) {
  background: transparent;
  color: var(--el-text-color-regular);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ud-table :deep(.vxe-body--column) { border-bottom: 1px solid var(--el-border-color-lighter); }
.ud-table :deep(.vxe-body--row:last-child .vxe-body--column) { border-bottom: 0; }
.ud-table :deep(.re-table--compact .vxe-body--column) { padding-top: 4px !important; padding-bottom: 4px !important; }
.ud-table :deep(.vxe-body--column .vxe-cell) { line-height: 1.4; }
.ud-table :deep(.vxe-header--column) { padding-top: 2px !important; padding-bottom: 2px !important; }
.ud-table :deep(.vxe-body--row.row--hover),
.ud-table :deep(.vxe-body--row:hover) { background: color-mix(in srgb, var(--u-primary) 5%, transparent); }

.ud-cell-time { font-variant-numeric: tabular-nums; }
.ud-cell-model { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ud-model-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; max-width: 180px; }
.ud-model-sub { font-size: 11px; line-height: 14px; white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
.ud-model-sub.is-speed { cursor: default; }
.ud-cell-muted { color: var(--el-text-color-placeholder); }
.ud-cell-endpoint { font-size: 12px; font-variant-numeric: tabular-nums; }
.ud-cell-cost { font-variant-numeric: tabular-nums; }
.ud-cost-eye { color: var(--el-text-color-placeholder); }
.ud-cell-tokens { position: relative; display: inline-flex; align-items: center; justify-content: flex-end; cursor: default; }
.ud-cell-tokens.is-estimated { border-bottom: 1px dashed var(--el-color-warning); cursor: help; }
.ud-tk-col { display: inline-flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.ud-tk-inline { display: inline-flex; align-items: center; gap: 10px; }
.ud-tk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
.ud-tk-ic { width: 13px; height: 13px; flex-shrink: 0; }
.ud-tk .tk-in { color: var(--el-color-success); }
.ud-tk .tk-out { color: var(--el-color-primary); }
.ud-tk .tk-cache { color: var(--el-color-info); }
.ud-tk .tk-cache-line { color: var(--el-color-info); }

.ud-latency-inline { display: inline-flex; align-items: stretch; gap: 8px; cursor: default; }
.ud-latency-vbar { width: 4px; border-radius: var(--el-radius-full, 9999px); flex-shrink: 0; }
.ud-latency-lines { display: flex; flex-direction: column; gap: 2px; }
.ud-latency-line { display: flex; align-items: baseline; gap: 6px; }
.ud-latency-k { font-size: 11px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.ud-latency-v { font-size: 12px; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }

/* —— popover 内容（速率/Token/耗时共用外观） —— */
.speed-pop,
.tk-detail,
.latency-pop { font-size: 12px; }
.speed-pop-title { font-weight: 600; margin-bottom: 6px; }
.speed-pop-row,
.tk-detail-row,
.latency-pop-row { display: flex; align-items: center; gap: 8px; height: 22px; }
.speed-pop-row .sp-label,
.tk-detail-row .td-label,
.latency-pop-label { color: var(--el-text-color-secondary); font-size: 12px; flex-shrink: 0; }
.speed-pop-row .sp-val,
.tk-detail-row .td-val,
.latency-pop-value { margin-left: auto; font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.speed-pop-divider,
.tk-detail-divider,
.latency-pop-divider { height: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }
.speed-pop-note,
.latency-pop-note { margin-top: 6px; font-size: 11px; color: var(--el-color-warning); line-height: 1.5; }
.speed-pop-hint,
.latency-pop-hint { margin-top: 6px; font-size: 11px; color: var(--el-text-color-placeholder); }
.tk-detail-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; display: flex; align-items: center; }
.td-dot { width: 6px; height: 6px; margin-right: 6px; border-radius: 1px; background: var(--el-color-info); flex-shrink: 0; }
.tk-detail-row.is-total .td-label { color: var(--el-text-color-primary); font-weight: 600; }
.tk-detail-row.is-total .td-val { color: var(--el-text-color-primary); font-weight: 700; }
.tk-detail-row.is-rate .td-label { color: var(--el-text-color-secondary); }
.td-rate-body { display: flex; align-items: center; gap: 8px; }
.td-rate-bar { width: 72px; height: 8px; border-radius: 2px; overflow: hidden; flex-shrink: 0; background: repeating-linear-gradient(90deg, var(--el-fill-color) 0 2px, transparent 2px 4px); }
.td-rate-bar > i { display: block; height: 100%; border-radius: 2px; background: repeating-linear-gradient(90deg, var(--el-color-info) 0 2px, transparent 2px 4px); }
.tk-detail-note { margin-top: 6px; font-size: 11px; line-height: 1.4; color: var(--el-color-warning); }
.latency-pop-dot { width: 8px; height: 8px; border-radius: var(--el-radius-full, 9999px); flex-shrink: 0; }

/* token 明细分色（与明细表内联一致） */
.tk-in { color: var(--el-color-success); }
.tk-out { color: var(--el-color-primary); }
.tk-cache { color: var(--el-color-info); }
.tk-detail-row .td-val.tk-in { color: var(--el-color-success); font-weight: 500; }
.tk-detail-row .td-val.tk-out { color: var(--el-color-primary); font-weight: 500; }
.tk-detail-row .td-val.tk-cache { color: var(--el-color-info); font-weight: 500; }
</style>