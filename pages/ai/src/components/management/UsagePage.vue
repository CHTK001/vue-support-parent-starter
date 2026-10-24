<template>
  <div class="usage-page" data-page="usage">
    <!-- §1 页面头：统一用 RePageHead（全站共用一份实现） -->
    <RePageHead title="用量管理">
      <template #meta>
        <!-- 实时状态：微呼吸绿点 + 文案；有流量时补一枚速率胶囊 -->
        <div class="live-status" :class="`is-${liveState}`" :title="liveState === 'error' ? '实时连接失败，已退回手动刷新' : rangeLabel">
          <span class="live-dot" :class="{ 'is-pulsing': liveState === 'live' }" />
          <span class="live-text">{{ liveLabel }}</span>
          <span v-if="liveRate > 0" class="live-rate">{{ fmtToken(liveRate) }}/分</span>
          <!-- 暂停/恢复：图标开关，不占横向空间 -->
          <button type="button" class="live-toggle" :class="{ 'is-off': !liveEnabled }"
            :title="liveEnabled ? '暂停实时推送' : '恢复实时推送'" :aria-pressed="liveEnabled"
            @click="liveEnabled = !liveEnabled">
            <svg v-if="liveEnabled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" />
              <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8.5 5.6a1 1 0 0 1 1.52-.85l8.2 6.4a1 1 0 0 1 0 1.7l-8.2 6.4a1 1 0 0 1-1.52-.85V5.6Z" />
            </svg>
          </button>
        </div>
      </template>
      <template #actions>
        <!-- 胶囊时间切换 -->
        <div class="time-pills" role="tablist">
          <button v-for="f in quickFilters" :key="f.key" type="button" class="time-pill"
            role="tab" :class="{ active: activeFilter === f.key }"
            :aria-selected="activeFilter === f.key" @click="setQuickFilter(f.key)">
            {{ f.label }}
          </button>
        </div>
        <!-- 日历图标日期框 (已废弃，保留以兼容后续迁移) -->
        <el-date-picker
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-picker"
          value-format="YYYY-MM-DD"
          @change="onCustomRange"
        />
        <!-- 导出 & 刷新图标按钮 -->
        <div class="action-buttons">
          <button type="button" class="icon-btn" title="导出当前区间用量" aria-label="导出" @click="handleExport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3.5v11.2M7.6 10.4 12 14.8l4.4-4.4M4.5 19.5h15" />
            </svg>
          </button>
          <button type="button" class="icon-btn" title="刷新数据" aria-label="刷新" @click="refreshAll">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4.2v4.6h-4.6" />
            </svg>
          </button>
        </div>
      </template>
      <!-- 刷新进度条：贴页面头底边的一条 2px 流光。请求进行时才出现，
           解决「点完刷新后页面没有任何反馈」的问题（此前只有表格内有转圈，
           而 KPI 数字也要等接口回来才变，中间这几秒像没反应）。 -->
      <template #foot>
        <div class="refresh-bar" :class="{ 'is-on': refreshing }" aria-hidden="true"><i /></div>
      </template>
    </RePageHead>

    <!-- §3 1 主 3 辅指标卡矩阵 -->
    <div class="stats-grid">
      <!-- 主卡：总 Token (宽度 2×) -->
      <div class="kpi-card kpi-primary" :class="`tone-${statCards[0].tone}`">
        <div class="kpi-top">
          <span class="kpi-icon-wrapper">
            <span class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M12 2.8 19 6.4v6.2c0 4.3-2.9 6.7-7 8.6-4.1-1.9-7-4.3-7-8.6V6.4L12 2.8Z M9.2 11.6l2 2 3.8-4" />
              </svg>
            </span>
          </span>
          <span class="kpi-label">{{ statCards[0].label }}</span>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-main-value" :class="statCards[0].cls">
            <span class="value-anim">{{ statCards[0].value }}</span>
            <span class="unit">tokens</span>
          </div>
          <div class="kpi-mini-ring">
            <ReEcharts :option="miniRingOption('input')" height="60px" width="80px" notMerge />
          </div>
        </div>
        <div class="kpi-sub">
          <span class="sub-item sub-input">输入 <b>{{ fmtToken(stats.totalPromptTokens) }}</b></span>
          <span class="sub-item sub-output">输出 <b>{{ fmtToken(stats.totalCompletionTokens) }}</b></span>
        </div>
      </div>

      <!-- 辅卡：总请求数 -->
      <div class="kpi-card" :class="`tone-${statCards[1].tone}`">
        <div class="kpi-top">
          <span class="kpi-icon-wrapper">
            <span class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M2 12h3.2l2.4 7.5 4.2-15 3.3 9.2H14M15 12h7" />
              </svg>
            </span>
          </span>
          <span class="kpi-label">{{ statCards[1].label }}</span>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-main-value" :class="statCards[1].cls">
            <span class="value-anim">{{ statCards[1].value }}</span>
          </div>
        </div>
        <div class="kpi-sub">
          <span class="sub-item sub-cached">缓存 <b>{{ fmtToken(stats.totalCachedTokens) }} tokens</b></span>
        </div>
      </div>

      <!-- 辅卡：总消费 -->
      <div class="kpi-card" :class="`tone-${statCards[2].tone}`">
        <div class="kpi-top">
          <span class="kpi-icon-wrapper">
            <span class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 14.5v-7ZM3 9.5h18M15 12h3.2" />
              </svg>
            </span>
          </span>
          <span class="kpi-label">{{ statCards[2].label }}</span>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-main-value cost">
            <span class="value-anim">{{ statCards[2].value }}</span>
          </div>
        </div>
        <div class="kpi-sub">
          <span class="sub-item sub-standard">标准价 <b>{{ statCards[2].sub[0] }}</b></span>
        </div>
      </div>

      <!-- 辅卡：平均耗时 -->
      <div class="kpi-card" :class="`tone-${statCards[3].tone}`">
        <div class="kpi-top">
          <span class="kpi-icon-wrapper">
            <span class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3 2" />
              </svg>
            </span>
          </span>
          <span class="kpi-label">{{ statCards[3].label }}</span>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-main-value">
            <span class="value-anim">{{ statCards[3].value }}</span>
            <span class="unit">ms</span>
          </div>
        </div>
        <div class="kpi-sub">
          <span class="sub-item sub-first">首字 <b>{{ statCards[3].sub[0] }}</b></span>
        </div>
      </div>
    </div>


    <!--
      §4 双栏看板：左「模型用量分析」/ 右「分组用量分析」。

      每栏是一张**整卡**，上半「环形总览 + 右侧图例」、下半「明细表」，
      不再像此前那样把图和表拆成两个互不相干的块 —— 图和表回答的是同一个问题，
      拆开后用户得自己在两块之间对账。

      环形中心直接内嵌 Top1 占比：不读图例也能一眼拿到「谁占大头、占多少」。
    -->
    <div class="board-grid board-grid--analysis">
      <!-- ===== 左栏：模型用量分析 ===== -->
      <section class="board-card">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">模型用量分析</h3>
            <span class="board-hint">{{ modelBoard.items.length }} 个模型</span>
          </div>
          <div class="board-tabs" role="tablist">
            <button v-for="t in boardTabs" :key="t.key" type="button" class="board-tab"
              role="tab" :class="{ active: modelChartType === t.key }"
              :aria-selected="modelChartType === t.key" @click="modelChartType = t.key">{{ t.label }}</button>
          </div>
        </header>

        <div class="board-viz">
          <div class="board-ring">
            <!-- hover 扇区 → 环心数值同步（§6）。mouseout / globalout 都要复位：
                 从扇区直接移出画布时只会派发 globalout。 -->
            <ReEcharts :option="modelRingOption" height="176px" notMerge
              @mouseover="(p: any) => onRingHover('model', p)"
              @mouseout="() => onRingHover('model', null)"
              @globalout="() => onRingHover('model', null)" />
            <div class="ring-center">
              <span class="ring-pct">{{ ringTop(modelBoard, modelHover).pct }}</span>
              <span class="ring-name" :title="ringTop(modelBoard, modelHover).name">{{ ringTop(modelBoard, modelHover).name }}</span>
            </div>
          </div>
          <ul class="board-legend">
            <!-- 与环形图的 slices 同源同序：环上几个扇区，图例就几行 -->
            <li v-for="it in modelBoard.slices" :key="it.name" class="legend-item"
              :class="{ 'is-top': it === modelBoard.slices[0], 'is-hover': modelHover?.name === it.name, 'is-other': it.color === OTHER_SLICE_COLOR }"
              @mouseenter="onLegendHover('model', it)" @mouseleave="onLegendHover('model', null)">
              <i class="legend-dot" :style="{ background: it.color }" />
              <span class="legend-name" :title="it.name">{{ it.name }}</span>
              <span class="legend-pct">{{ it.pct.toFixed(1) }}%</span>
            </li>
            <li v-if="modelBoard.slices.length === 0" class="legend-empty">
              <el-empty description="暂无数据" :image-size="40" />
            </li>
          </ul>
        </div>

        <div class="board-table">
          <ReTable
            :data="modelDist"
            :columns="boardColumns('模型')"
            :show-index="false"
            :stripe="false"
            size="small"
            :pagination="false"
            empty-text="暂无模型用量"
          >
            <template #col-name="{ row }">
              <div class="name-cell" :class="{ 'is-zero': isZeroCost(row, modelChartType) }">
                <i class="name-dot" :style="{ background: boardColorOf(modelBoard, row.name) }" />
                <span class="name-text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, modelChartType) }">{{ formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, modelChartType) }">{{ fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, modelChartType) }">{{ money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="pct-cell">
                <span class="pct-track">
                  <i class="pct-fill"
                    :style="{ width: barWidth(percentNum(row, modelDist, modelChartType)), background: boardColorOf(modelBoard, row.name) }" />
                </span>
                <span class="pct-text">{{ percent(row, modelDist, modelChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </section>

      <!-- ===== 右栏：分组用量分析 ===== -->
      <section class="board-card">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">分组用量分析</h3>
            <span class="board-hint">{{ groupBoard.items.length }} 个分组</span>
          </div>
          <div class="board-tabs" role="tablist">
            <button v-for="t in boardTabs" :key="t.key" type="button" class="board-tab"
              role="tab" :class="{ active: groupChartType === t.key }"
              :aria-selected="groupChartType === t.key" @click="groupChartType = t.key">{{ t.label }}</button>
          </div>
        </header>

        <div class="board-viz">
          <div class="board-ring">
            <ReEcharts :option="groupRingOption" height="176px" notMerge
              @mouseover="(p: any) => onRingHover('group', p)"
              @mouseout="() => onRingHover('group', null)"
              @globalout="() => onRingHover('group', null)" />
            <div class="ring-center">
              <span class="ring-pct">{{ ringTop(groupBoard, groupHover).pct }}</span>
              <span class="ring-name" :title="ringTop(groupBoard, groupHover).name">{{ ringTop(groupBoard, groupHover).name }}</span>
            </div>
          </div>
          <ul class="board-legend">
            <li v-for="it in groupBoard.slices" :key="it.name" class="legend-item"
              :class="{ 'is-top': it === groupBoard.slices[0], 'is-hover': groupHover?.name === it.name, 'is-other': it.color === OTHER_SLICE_COLOR }"
              @mouseenter="onLegendHover('group', it)" @mouseleave="onLegendHover('group', null)">
              <i class="legend-dot" :style="{ background: it.color }" />
              <span class="legend-name" :title="it.name">{{ it.name }}</span>
              <span class="legend-pct">{{ it.pct.toFixed(1) }}%</span>
            </li>
            <li v-if="groupBoard.slices.length === 0" class="legend-empty">
              <el-empty description="暂无数据" :image-size="40" />
            </li>
          </ul>
        </div>

        <div class="board-table">
          <ReTable
            :data="groupDist"
            :columns="boardColumns('分组')"
            :show-index="false"
            :stripe="false"
            size="small"
            :pagination="false"
            empty-text="暂无分组用量"
          >
            <template #col-name="{ row }">
              <div class="name-cell" :class="{ 'is-zero': isZeroCost(row, groupChartType) }">
                <i class="name-dot" :style="{ background: boardColorOf(groupBoard, row.name) }" />
                <span class="name-text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, groupChartType) }">{{ formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, groupChartType) }">{{ fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="num-cell" :class="{ 'is-zero': isZeroCost(row, groupChartType) }">{{ money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="pct-cell">
                <span class="pct-track">
                  <i class="pct-fill"
                    :style="{ width: barWidth(percentNum(row, groupDist, groupChartType)), background: boardColorOf(groupBoard, row.name) }" />
                </span>
                <span class="pct-text">{{ percent(row, groupDist, groupChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </section>
    </div>

    <!--
      Top5 排行：模型 / 应用（使用模型的软件）。

      「应用」= 消耗模型的软件：opencode / claude-code / codex 这类三方工具，
      以及本控制台自己（对话 + 机器人合并）。口径见下方 appDist 注释。
    -->
    <div class="board-grid">
      <section class="board-card panel">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">模型排行 Top5</h3>
          </div>
          <div class="board-tabs" role="tablist">
            <button v-for="t in boardTabs" :key="t.key" type="button" class="board-tab"
              role="tab" :class="{ active: rankMetric === t.key }"
              :aria-selected="rankMetric === t.key" @click="rankMetric = t.key">{{ t.label }}</button>
          </div>
        </header>
        <div class="panel-body">
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
          <div v-if="modelRankTop5.length === 0" class="legend-empty">
            <el-empty description="暂无模型用量" :image-size="56" />
          </div>
        </div>
      </section>

      <section class="board-card panel">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">应用排行 Top5</h3>
          </div>
          <div class="board-tabs" role="tablist">
            <button v-for="t in boardTabs" :key="t.key" type="button" class="board-tab"
              role="tab" :class="{ active: rankMetric === t.key }"
              :aria-selected="rankMetric === t.key" @click="rankMetric = t.key">{{ t.label }}</button>
          </div>
        </header>
        <div class="panel-body">
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
          <div v-if="appRankTop5.length === 0" class="legend-empty">
            <el-empty description="暂无应用用量" :image-size="56" />
          </div>
        </div>
      </section>
    </div>

    <!-- 每日模型用量：一天一个柱，柱内按模型分段（每模型一色，段高按用量占比） -->
    <section class="board-card panel">
      <header class="board-head">
        <div class="board-title-wrap">
          <h3 class="board-title">每日模型用量</h3>
          <span class="board-hint">柱内分段 = 该模型当天占比</span>
        </div>
        <div class="board-tabs" role="tablist">
          <button v-for="t in boardTabs" :key="t.key" type="button" class="board-tab"
            role="tab" :class="{ active: modelBarMetric === t.key }"
            :aria-selected="modelBarMetric === t.key" @click="modelBarMetric = t.key">{{ t.label }}</button>
        </div>
      </header>
      <div class="panel-body">
        <ReEcharts v-if="modelBarDates.length > 0" :option="modelBarOption" height="360px" not-merge />
        <div v-else class="chart-empty"><el-empty description="暂无按天模型用量数据" :image-size="72" /></div>
      </div>
    </section>

    <!-- Token 趋势 + 模型延迟：两列并排；窄屏自动堆叠（见 .trend-row 的媒体查询） -->
    <div class="trend-row">
      <section class="board-card panel">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">Token 趋势</h3>
            <span class="board-hint">缓存读取属输入子集，不相加</span>
          </div>
        </header>
        <div class="panel-body">
          <ReEcharts :option="trendOption" height="320px" not-merge v-if="trendData.length > 0" />
          <div v-else class="chart-empty"><el-empty description="暂无趋势数据" :image-size="72" /></div>
        </div>
      </section>

      <section class="board-card panel">
        <header class="board-head">
          <div class="board-title-wrap">
            <h3 class="board-title">模型延迟</h3>
            <span class="board-hint">按天平均首字延迟，缺测断线不补 0</span>
          </div>
        </header>
        <div class="panel-body">
          <ReEcharts :option="latencyOption" height="320px" not-merge v-if="latencyDates.length && latencyModelCount > 0" />
          <div v-else class="chart-empty"><el-empty description="暂无延迟数据" :image-size="72" /></div>
        </div>
      </section>
    </div>

    <!-- 用量明细 -->
    <section class="board-card panel">
      <header class="board-head">
        <div class="board-title-wrap">
          <h3 class="board-title">用量明细</h3>
          <span class="board-hint">{{ rangeLabel }}</span>
        </div>
        <div class="board-actions">
          <!-- 模型过滤：值进了 detailQueryParams，ReTable 会 watch params 变化
               自动回到第 1 页重新取数，无需再手动触发（此前 @keyup/@clear 手动拉，
               与组件的自动重载叠加会打两次接口）。 -->
          <el-input v-model="detailModelFilter" placeholder="按模型筛选" clearable class="filter-input" />
          <!-- 敏感数据（费用）显示开关：默认隐藏，点眼睛才露出金额 -->
          <el-button link type="primary" class="cost-toggle" @click="costVisible = !costVisible"
            :title="costVisible ? '隐藏费用等敏感数据' : '显示费用等敏感数据'">
            <el-icon><Eye24Regular v-if="costVisible" /><EyeOff24Regular v-else /></el-icon>
            {{ costVisible ? '隐藏费用' : '显示费用' }}
          </el-button>
        </div>
      </header>
      <div class="panel-body panel-body--table">
        <!-- 明细表：分页交给 ReTable 自带的 RePagination（不再自写 el-pagination）。
             后端分页走 ReTable 的 **loader 模式**：传 loader 后组件进入远程模式，
             把 data 当作「当前页数据」直接渲染，页数按 loader 返回的 total 算。
             （此前传 data + total 而不传 loader → 被当成本地分页再切一遍，
               点页码无反应。） -->
        <ReTable
          :data="detailRecords"
          :loading="detailLoading"
          :columns="detailColumns"
          :show-index="false"
          class="detail-table"
          row-key="sysAiUsageId"
          :pagination="true"
          :loader="loadDetailPage"
          :params="detailQueryParams"
          :page-sizes="[10, 20, 50, 100, 200, 500]"
        >
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
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

import ReEcharts from '@repo/ui/re-echarts';
import { http } from '@repo/utils';
import type { EChartsOption } from 'echarts';
import ReTable from '@/components/re/ReTable.vue';
import type { ReTableColumn } from '@repo/ui/re-table';
import ReTag from '@/components/re/ReTag.vue';
import RePageHead from '@/components/re/RePageHead.vue';
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

/**
 * 数字滚动递增进场（§6 交互）。
 *
 * <p>KPI 数字直接从 0 跳到终值会显得"页面卡了一下才出数"，也看不出数据是新来的；
 * 用 rAF 在 ~520ms 内插值到目标值，既提示"这是刚更新的"，又不至于让人等动画。</p>
 *
 * <p>只对**数值型**指标做动画（Token / 请求数）；费用与耗时是格式化字符串，
 * 动画中间态会出现 ¥0.0、0.0ms 这类无意义读数，反而干扰，直接给终值。</p>
 */
const COUNT_UP_MS = 520;
const animatedTokens = ref('—');
const animatedCalls = ref('—');
let countUpRaf = 0;

/** 尊重系统「减少动态效果」偏好：关掉动画时直接落终值 */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runCountUp() {
  if (countUpRaf) cancelAnimationFrame(countUpRaf);
  const toTokens = Number(stats.totalTokens) || 0;
  const toCalls = Number(stats.totalCalls) || 0;
  if (prefersReducedMotion() || (toTokens === 0 && toCalls === 0)) {
    animatedTokens.value = fmtToken(toTokens);
    animatedCalls.value = formatNumber(toCalls);
    return;
  }
  // 起点取**当前显示值的数值近似**：连续刷新时从屏幕上的数继续往上走，
  // 而不是每次都从 0 重来（后者在实时推送下会一直闪烁）。
  const fromTokens = parseCompact(animatedTokens.value);
  const fromCalls = parseCompact(animatedCalls.value);
  const t0 = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / COUNT_UP_MS);
    // easeOutCubic：开头快、收尾缓，读数停得稳
    const e = 1 - Math.pow(1 - p, 3);
    animatedTokens.value = fmtToken(fromTokens + (toTokens - fromTokens) * e);
    animatedCalls.value = formatNumber(Math.round(fromCalls + (toCalls - fromCalls) * e));
    if (p < 1) countUpRaf = requestAnimationFrame(tick);
    else countUpRaf = 0;
  };
  countUpRaf = requestAnimationFrame(tick);
}

/** 把 fmtToken 的紧凑读数（3.85M / 145.02K / 453）反解成数值，作为滚动起点 */
function parseCompact(text: string): number {
  const s = String(text || '').replace(/,/g, '').trim();
  const m = /^(-?\d+(?:\.\d+)?)\s*([KMBT])?$/i.exec(s);
  if (!m) return 0;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = (m[2] || '').toUpperCase();
  const scale = unit === 'K' ? 1e3 : unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'T' ? 1e12 : 1;
  return n * scale;
}

/**
 * 指标卡数据。
 *
 * <p><b>顺序即权重</b>：第 0 项是主卡（宽度 2×、28px 等宽数字、带迷你环形图），
 * 其余三项为辅卡。总 Token 放主位 —— 它是这个页面唯一"必须一眼看到"的量，
 * 请求数/费用/耗时都是围绕它的解释性指标。</p>
 */
const statCards = computed(() => [
  {
    key: 'token', label: '总 Token', value: animatedTokens.value, unit: 'tokens', cls: '', tone: 'primary',
    sub: ['输入 ' + fmtToken(stats.totalPromptTokens), '输出 ' + fmtToken(stats.totalCompletionTokens)],
  },
  {
    key: 'requests', label: '总请求数', value: animatedCalls.value, unit: '', cls: '', tone: 'info',
    sub: ['缓存 ' + fmtToken(stats.totalCachedTokens) + ' tokens'],
  },
  {
    key: 'cost', label: '总消费', value: currencySymbol.value + money(stats.totalCost), unit: '', cls: 'cost', tone: 'success',
    sub: ['标准价 ' + currencySymbol.value + money(stats.standardCost)],
  },
  {
    key: 'latency', label: '平均耗时', value: money(stats.avgLatency), unit: 'ms', cls: '', tone: 'warning',
    sub: ['首字 ' + money(stats.avgFirstTokenLatency) + 'ms'],
  },
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
const trendData = ref<Array<{ date: string; input: number; output: number; cached: number; total: number }>>([]);

const modelChartType = ref<ChartType>('token');
const groupChartType = ref<ChartType>('token');

// 明细
const detailRecords = ref<any[]>([]);
const detailLoading = ref(false);
const detailTotal = ref(0);
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
  // 明细表不用在这里再拉一次：loader 模式下 ReTable 会 watch params 变化
  // （时间范围 / 模型过滤都在 detailQueryParams 里）并自动回到第 1 页重新取数。
  // 此处再调 reloadDetails 会打两次接口。
}

/**
 * 导出当前区间的用量明细（顶部操作栏最右侧图标）。
 *
 * <p>走 `/usage/export` 拿 blob，再触发一次 `<a download>`。为什么不用
 * `window.open(url)`：该接口要带鉴权头，直接开新窗口拿不到 token，只会下回一个
 * 401 的 JSON。这里复用已装配的请求管线（含鉴权拦截器），拿到二进制后本地存盘。</p>
 *
 * <p>文件名带上时间范围：连续导几个区间时不会互相覆盖，也省得回头猜是哪个区间。</p>
 */
const exporting = ref(false);
/**
 * 是否正在拉数（驱动顶栏底边的 2px 流光条）。
 *
 * <p>只覆盖 {@link loadData}（KPI/图表/分布这几路并行请求）；明细表有自己的
 * 表格内 loading，不重复提示。</p>
 */
const refreshing = ref(false);
async function handleExport() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const res: any = await usageApi.export({ ...timeParams.value });
    // createClient(unwrap:false) 返回的是 axios 的 body；responseType=blob 时即 Blob。
    // 后端若因鉴权/参数返回 JSON 错误，body 也会是 Blob（type=application/json），
    // 这里读出来当错误处理，避免"下载了一个坏文件却毫无提示"。
    const blob: Blob = res instanceof Blob ? res : new Blob([res]);
    if (blob.type.includes('json')) {
      const text = await blob.text();
      let msg = text;
      try {
        const parsed = JSON.parse(text);
        msg = parsed?.msg || parsed?.message || text;
      } catch { /* 非 JSON 就原样展示 */ }
      throw new Error(msg || '导出失败');
    }
    const suffix = (() => {
      const { startTime, endTime } = timeParams.value;
      if (startTime && endTime) return `${startTime.slice(0, 10)}_${endTime.slice(0, 10)}`;
      return 'all';
    })();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage_${suffix}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 立刻 revoke 会让部分浏览器来不及读流，延后一拍更稳
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.success('导出已开始下载');
  } catch (e: any) {
    message.error('导出失败: ' + (e?.message || e));
  } finally {
    exporting.value = false;
  }
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

// 注：模型/分组分布表的前端分页已交给 ReTable 内部完成
// （页面此前自己 slice + 自写 el-pagination，两处都要维护，现已收口到组件内）。

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

/* ==================== §4 双栏看板：环形总览 + 图例 ==================== */

/**
 * 看板调色板（§5 视觉体系指定色值）。
 *
 * <p>为什么不用 `--el-color-primary` 这类 CSS 变量：ECharts 是 canvas 渲染，
 * `var()` 在 canvas 语境里不生效，必须给真实色值。这里集中一处，
 * 图例色点、明细表进度条、环形扇区取同一个函数 —— 三处颜色永远一致。</p>
 */
const BOARD_PALETTE = [
  '#165DFF', // 主色蓝
  '#00B42A', // 成功绿
  '#FF7D00', // 警示橙
  '#722ED1', // 辅助紫
  '#F53F3F', // 危险红
  '#14C9C9', // 青
  '#F7BA1E', // 黄
  '#3491FA', // 浅蓝
  '#9FDB1D', // 黄绿
  '#D91AD9', // 品红
];
/** 第 n 项的稳定配色：按**排序后的名次**取色，不按数组下标，切指标时不跳色 */
function boardColorByIndex(i: number): string {
  return BOARD_PALETTE[i % BOARD_PALETTE.length];
}

const boardTabs = [
  { key: 'token' as ChartType, label: '按 Token' },
  { key: 'cost' as ChartType, label: '按费用' },
];

interface BoardItem {
  name: string;
  value: number;
  pct: number;
  color: string;
  row: DistRow;
}
interface BoardData {
  /** 全部条目（明细表用，按当前指标降序） */
  items: BoardItem[];
  /**
   * 环形图/图例共用的切片（Top N + 「其他」聚合）。
   *
   * <p>为什么单独一份：环形图只画前 8 个扇区，再多就分不清了；但图例此前渲染的是
   * <b>全部</b>条目 —— 于是「图例 14 行、环上 9 个扇区」对不上，用户按图例找扇区会找不到。
   * 切片列表让图例与环严格一一对应，「其他」显示聚合后的项数与占比。</p>
   */
  slices: BoardItem[];
  total: number;
}

/** 环形图最多画几个扇区（其余聚合成「其他」） */
const RING_TOP_N = 8;
/** 「其他」扇区的固定色（中性灰，不占调色板名次） */
const OTHER_SLICE_COLOR = '#C9CDD4';

/**
 * 把分布数据整理成看板要的形状：按当前指标降序、算占比、分配稳定颜色。
 *
 * <p>图例按降序排（§4 要求），所以「颜色 = 名次」是稳定的：切「按 Token / 按费用」
 * 时同一名次换人，但颜色位置不变，视觉不会整片跳。</p>
 */
function buildBoard(rows: DistRow[], type: ChartType): BoardData {
  const metric = (r: DistRow) => (type === 'token' ? r.totalTokens : r.cost);
  const sorted = [...rows].sort((a, b) => metric(b) - metric(a));
  const total = sorted.reduce((s, r) => s + Math.max(0, metric(r)), 0);
  const items = sorted.map((r, i) => ({
    name: r.name,
    value: metric(r),
    pct: total > 0 ? (Math.max(0, metric(r)) / total) * 100 : 0,
    color: boardColorByIndex(i),
    row: r,
  }));
  const slices = items.slice(0, RING_TOP_N);
  const rest = items.slice(RING_TOP_N);
  if (rest.length) {
    slices.push({
      name: `其他 ${rest.length} 项`,
      value: rest.reduce((s, it) => s + it.value, 0),
      pct: rest.reduce((s, it) => s + it.pct, 0),
      color: OTHER_SLICE_COLOR,
      row: rest[0].row,
    });
  }
  return { items, slices, total };
}

const modelBoard = computed(() => buildBoard(modelDist.value, modelChartType.value));
const groupBoard = computed(() => buildBoard(groupDist.value, groupChartType.value));

/** 当前悬停的扇区（null = 没悬停，环心回落到 Top1） */
interface HoverSlice { name: string; pct: number }
const modelHover = ref<HoverSlice | null>(null);
const groupHover = ref<HoverSlice | null>(null);

/**
 * 环形图 hover → 环心数值联动（§6）。
 *
 * <p>为什么要联动：环心平时显示 Top1 占比，但用户真正想问的是"我现在指着的这块占多少"。
 * 让他去右侧图例里对名字太绕，直接把指着的这块写进环心。</p>
 *
 * <p>{@code params.componentType} 过滤掉非扇区事件（标题、图例等），
 * 否则 hover 到空白也会把环心改成空。</p>
 */
function onRingHover(which: 'model' | 'group', params: any) {
  const target = which === 'model' ? modelHover : groupHover;
  if (!params || params.componentType !== 'series' || params.name == null) {
    target.value = null;
    return;
  }
  const pct = Number(params.percent);
  target.value = { name: String(params.name), pct: Number.isFinite(pct) ? pct : 0 };
}

/**
 * 图例 → 环心联动（与 {@link onRingHover} 反向）。
 *
 * <p>只挂鼠标、不挂环上的高亮：从环移到图例的瞬间环会先派发 mouseout 把状态清掉，
 * 紧接着图例的 mouseenter 又设回来 —— 顺序天然正确，不需要额外去抖。</p>
 */
function onLegendHover(which: 'model' | 'group', item: BoardItem | null) {
  const target = which === 'model' ? modelHover : groupHover;
  target.value = item ? { name: item.name, pct: item.pct } : null;
}

/** 环心显示内容：有 hover 用 hover 的，否则用 Top1；空数据给占位符 */
function ringTop(board: BoardData, hover: HoverSlice | null): { pct: string; name: string } {
  if (hover) return { pct: hover.pct.toFixed(1) + '%', name: hover.name };
  if (!board.items.length) return { pct: '—', name: '暂无数据' };
  const top = board.items[0];
  return { pct: top.pct.toFixed(1) + '%', name: top.name };
}

/** 环心 Top1 占比（旧入口，保留给测试与外部引用） */
function topPct(b: BoardData): string {
  return b.items.length ? b.items[0].pct.toFixed(1) + '%' : '—';
}
function topName(b: BoardData): string {
  return b.items.length ? b.items[0].name : '暂无数据';
}

/** 名次 → 颜色（明细表用；找不到按末档兜底，避免 undefined 让背景变透明） */
function boardColorOf(b: BoardData, name: string): string {
  const idx = b.items.findIndex((it) => it.name === name);
  return idx >= 0 ? b.items[idx].color : BOARD_PALETTE[BOARD_PALETTE.length - 1];
}

/** 占比条宽度：0% 也留 2px，否则「有一点点」和「真的没有」看起来一样 */
function barWidth(pct: number): string {
  const v = Math.min(100, Math.max(0, pct));
  if (v <= 0) return '0%';
  return Math.max(2, v) + '%';
}

/** 该行在当前指标下是否为 0（¥0 / 0 token 的行按 §4 要求淡化成浅灰） */
function isZeroCost(row: DistRow, type: ChartType): boolean {
  const v = type === 'token' ? row.totalTokens : row.cost;
  return !(Number(v) > 0);
}

/**
 * 看板环形图。
 *
 * <p>三点与旧饼图不同：</p>
 * <ol>
 *   <li><b>不要图例</b>：图例改由右侧 DOM 列表承担 —— 能放百分比、能对齐行高、
 *       还能跟着表格行高严格对齐，canvas 图例做不到。</li>
 *   <li><b>中心留空</b>：留给 DOM 覆盖层显示 Top1 占比（内嵌在环里，不读图例也懂）。</li>
 *   <li><b>只画 {@link RING_TOP_N} 项</b>：再多扇区就分不清了，其余并成「其他」保留总量口径；
 *       右侧图例渲染的是<b>同一份</b> {@code b.slices}，两者永远一一对应。</li>
 * </ol>
 */
function ringOption(b: BoardData, type: ChartType): EChartsOption {
  const data = b.slices.map((it) => ({
    name: it.name,
    value: Number(it.value.toFixed(4)),
    itemStyle: { color: it.color },
  }));
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#E5E6EB',
      borderWidth: 1,
      textStyle: { color: '#1D2129', fontSize: 12 },
      extraCssText: 'box-shadow:0 6px 20px rgba(15,23,42,.12);border-radius:8px;padding:8px 10px;',
      formatter: (p: any) => {
        const v = type === 'token' ? fmtToken(p.value) : `${currencySymbol.value}${money(p.value)}`;
        return `${p.marker}${p.name}<br/><b style="font-size:13px">${v}</b>&nbsp;&nbsp;<span style="color:#86909C">${Number(p.percent).toFixed(1)}%</span>`;
      },
    },
    // 关掉图例：右侧 DOM 列表即图例
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['62%', '86%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        // 扇区间隙用页面卡片色（不写死白色，深色模式下才不会露出一圈白边）
        itemStyle: { borderColor: surfaceBg.value, borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scaleSize: 6,
          itemStyle: { shadowBlur: 14, shadowColor: 'rgba(22,93,255,0.22)' },
        },
        data,
      },
    ],
  };
}

const modelRingOption = computed(() => ringOption(modelBoard.value, modelChartType.value));
const groupRingOption = computed(() => ringOption(groupBoard.value, groupChartType.value));

/**
 * 主卡右下角的迷你环形图：输入 / 输出占比。
 *
 * <p>主卡数字回答「总共多少」，这只小环回答「里面怎么分的」——
 * 两个问题挨着放，比让用户在下面找副标题读两个数字快得多。</p>
 */
function miniRingOption(_kind: 'input'): EChartsOption {
  const input = Math.max(0, Number(stats.totalPromptTokens) || 0);
  const output = Math.max(0, Number(stats.totalCompletionTokens) || 0);
  const rest = Math.max(0, input + output);
  const data = rest > 0
    ? [
      { name: '输入', value: input, itemStyle: { color: '#165DFF' } },
      { name: '输出', value: output, itemStyle: { color: '#00B42A' } },
    ]
    : [{ name: '暂无', value: 1, itemStyle: { color: '#E5E6EB' } }];
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p: any) => `${p.marker}${p.name} ${fmtToken(p.value)}（${Number(p.percent).toFixed(1)}%）`,
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['66%', '92%'],
        center: ['50%', '50%'],
        silent: true,
        itemStyle: { borderColor: surfaceBg.value, borderWidth: 1.5 },
        label: { show: false },
        labelLine: { show: false },
        data,
      },
    ],
  };
}

/** 看板明细表的列定义（比原分布表更紧凑；占比列由插槽画进度条） */
function boardColumns(nameLabel: string): ReTableColumn[] {
  return [
    { prop: 'name', label: nameLabel, minWidth: 120, showOverflowTooltip: true, slot: 'name' },
    { prop: 'requests', label: '请求', width: 76, align: 'right', slot: 'requests', sortable: true },
    { prop: 'totalTokens', label: 'Token', width: 92, align: 'right', slot: 'totalTokens', sortable: true },
    { prop: 'cost', label: `费用(${currencySymbol.value})`, width: 92, align: 'right', slot: 'cost', sortable: true },
    { prop: 'percent', label: '占比', width: 132, slot: 'percent' },
  ];
}

function percentNum(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): number {
  const total = all.reduce((s, x) => s + (type === 'token' ? x.totalTokens : x.cost), 0);
  if (total <= 0) return 0;
  const v = (type === 'token' ? row.totalTokens : row.cost) ?? 0;
  return (v / total) * 100;
}

function percent(row: { totalTokens?: number; cost?: number }, all: DistRow[], type: ChartType): string {
  return percentNum(row, all, type).toFixed(1) + '%';
}

// ==================== 每日模型用量（堆叠柱状图） ====================
/**
 * 后端按「天 + 模型」返回多行，这里归并成「一天一根柱、柱内按模型分段」。
 * 数据形态：{ date -> Map<model, number> }，metric 决定取 Token 还是费用。
 */
/**
 * 延迟字段保留 null 语义：后端 AVG 在没有实测样本时返回 null，
 * 这里不要 `Number(x) || 0` 兜成 0 —— 0ms 会被画成「延迟极低」的假象。
 */
const modelTrendRows = ref<Array<{
  date: string; model: string; provider: string;
  totalTokens: number; totalCost: number;
  avgFirstTokenLatency: number | null; avgTotalLatency: number | null;
}>>([]);
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
    legend: { data: ['输入 Token', '输出 Token', '缓存读取'], top: 0 },
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
      {
        // 缓存读取是「输入 Token 里命中缓存的那部分」，属于输入的子集，
        // 不是额外叠加的量。所以用虚线单独画、不堆叠 —— 堆叠会让人以为
        // 总量 = 输入 + 输出 + 缓存，凭空多算一笔。
        name: '缓存读取',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: rows.map((r) => r.cached),
        lineStyle: { type: 'dashed', width: 2 },
        areaStyle: { opacity: 0.06 },
      },
    ],
  };
});

/**
 * 模型延迟图：一天一个点、一个模型一条线，纵轴为「平均首字延迟（ms）」。
 *
 * 为什么画首字延迟而不是总耗时：总耗时随输出长度线性增长，同一个模型写得长一点
 * 就会显得「更慢」，跨模型比较没有意义；首字延迟衡量的是「多久开始响应」，
 * 与生成长度无关，才是用户真正感知到的那个「卡不卡」。
 *
 * 缺测的格子返回 null 而不是 0：ECharts 遇 null 会断线，正好表达「这天没测到」；
 * 填 0 会画出一条贴着底部的假线。
 */
const MODEL_LATENCY_TOP_N = 6;

const latencyMatrix = computed(() => {
  /** 模型 -> 区间内 Token 总量，只用来挑「画哪几条线」 */
  const weight = new Map<string, number>();
  /** 日期 -> 模型 -> 平均首字延迟（ms） */
  const cell = new Map<string, Map<string, number>>();
  for (const r of modelTrendRows.value) {
    const date = String(r.date || '').slice(0, 10);
    const model = String(r.model || '').trim() || '未知模型';
    if (!date) continue;
    weight.set(model, (weight.get(model) || 0) + (Number(r.totalTokens) || 0));
    const v = r.avgFirstTokenLatency;
    if (v == null || !Number.isFinite(v) || v <= 0) continue;
    let day = cell.get(date);
    if (!day) { day = new Map(); cell.set(date, day); }
    day.set(model, Math.round(v));
  }
  const keep = [...weight.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MODEL_LATENCY_TOP_N)
    .map(([m]) => m);
  const dates = [...cell.keys()].sort();
  const series = keep.map((model) => ({
    model,
    data: dates.map((d) => cell.get(d)?.get(model) ?? null),
  }));
  return { dates, series };
});

const latencyDates = computed(() => latencyMatrix.value.dates);
/** 有延迟样本的模型数（用来区分「没数据」与「有数据但都没测到延迟」） */
const latencyModelCount = computed(() => latencyMatrix.value.series.length);

const latencyOption = computed<EChartsOption>(() => {
  const { dates, series } = latencyMatrix.value;
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (v: any) => (v == null ? '—' : formatLatency(v)),
    },
    // 模型名可能很长，用 scroll 图例避免挤成两行把图压扁
    legend: { top: 0, type: 'scroll' },
    grid: { left: 56, right: 24, top: 40, bottom: 32 },
    xAxis: { type: 'category', boundaryGap: false, data: dates.map((d) => (d.length > 10 ? d.slice(11, 16) : d)) },
    yAxis: { type: 'value', name: 'ms', axisLabel: { formatter: (v: number) => `${v}` } },
    series: series.map((s) => ({
      name: s.model,
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbolSize: 5,
      // 断点保留：中间缺测不要用直线连过去，那会掩盖「这段没数据」
      connectNulls: false,
      data: s.data,
      color: colorOfModel(s.model),
    })),
  };
});

async function loadData() {
  refreshing.value = true;
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
    // 数字滚动：数据落定后再动画，否则会滚到一半被下一次刷新打断
    runCountUp();
    summaryRows.value = sumRes.data || [];
    modelTrendRows.value = (modelTrendRes?.data || []).map((r: any) => ({
      date: String(r?.date || '').slice(0, 10),
      model: r?.model,
      provider: r?.provider,
      totalTokens: Number(r?.totalTokens) || 0,
      totalCost: Number(r?.totalCost) || 0,
      // null 保持 null（而不是 0）：没实测样本时延迟图应断点，不能画成 0ms
      avgFirstTokenLatency: r?.avgFirstTokenLatency == null ? null : Number(r.avgFirstTokenLatency),
      avgTotalLatency: r?.avgTotalLatency == null ? null : Number(r.avgTotalLatency),
    }));
    const dailyRows: any[] = trendRes.data || [];
    const map = new Map<string, { date: string; input: number; output: number; cached: number; total: number }>();
    for (const r of dailyRows) {
      const raw = String(r.date || ''); const d = raw.length > 10 && raw.includes(':') ? raw.slice(0, 13) : raw.slice(0, 10);
      if (!d) continue;
      if (!map.has(d)) map.set(d, { date: d, input: 0, output: 0, cached: 0, total: 0 });
      const a = map.get(d)!;
      a.input += Number(r.promptTokens) || 0;
      a.output += Number(r.completionTokens) || 0;
      // cachedTokens 后端 /usage/trend 早就返回了，只是之前没接进图里
      a.cached += Number(r.cachedTokens) || 0;
      a.total += Number(r.totalTokens) || 0;
    }
    trendData.value = [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  } catch (e: any) {
    message.error('加载用量数据失败: ' + (e?.message || e));
  } finally {
    refreshing.value = false;
  }
}

/**
 * 明细表的查询参数（时间范围 + 模型过滤）。
 *
 * <p>作为 ReTable 的 {@code params} 传下去，loader 收到的 {@code params} 里
 * 会带上它（组件会把 params 与 page/pageSize 合并后交给 loader）。</p>
 */
const detailQueryParams = computed(() => {
  const p: Record<string, unknown> = { ...timeParams.value };
  if (detailModelFilter.value) {
    p.model = detailModelFilter.value;
  }
  return p;
});

/**
 * ReTable 的 loader（后端分页）。
 *
 * <p>组件在远程模式下会自己调它取当前页数据，并按返回的 total 算页数 ——
 * 这才是后端分页的正确接法。返回 {@code { total, records }}。</p>
 */
async function loadDetailPage({ page, pageSize, params }: { page: number; pageSize: number; params: Record<string, unknown> }) {
  detailLoading.value = true;
  try {
    // 组件给的 params 里已含 page / pageSize（它把二者写进 params 一起传），
    // 这里只透传业务参数，避免请求里同时出现 pageSize 与 size 两份。
    const { page: _p, pageSize: _ps, ...rest } = params as Record<string, unknown>;
    const res: any = await usageApi.detailList({ ...rest, page, size: pageSize });
    const payload = res.data || res || {};
    const records = payload.records || payload.data || payload.list || [];
    detailRecords.value = Array.isArray(records) ? records : [];
    detailTotal.value = Number(payload.total ?? res?.total ?? 0) || 0;
    return { total: detailTotal.value, records: detailRecords.value };
  } catch (e: any) {
    message.error('加载明细失败: ' + (e?.message || e));
    return { total: 0, records: [] };
  } finally {
    detailLoading.value = false;
  }
}

// 注：loader 模式下明细表的数据由 ReTable 自己管（首屏 + 翻页 + params 变化），
// 页面不再需要 reloadDetails —— 保留它会与组件的自动重载叠加、打两次接口。

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
// 分布表的列定义已收口到 boardColumns()（见「双栏看板」段），此处只留明细表。

const detailColumns = computed<ReTableColumn[]>(() => [
  // 时间列固定在左侧：明细表有 13 列、横滚是常态，时间不钉住的话滚到右边
  // 就不知道这一行是什么时候的记录了。
  { prop: 'time', label: '时间', width: 160, slot: 'time', fixed: 'left' },
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
  /* ===== 页面级色板（§5 + 精修）=====
     此前这套色值是散落在各条规则里的字面量（#165DFF 出现十余次、rgba(22,93,255,…)
     若干次、#00B42A/#FF7D00 各几处）。散落有两个后果：
       ① 改一处色号要全页搜索，容易漏；
       ② 暗色模式下这些字面量**不会提亮** —— #165DFF 压在 #161C27 上对比度只有
          ~2.9，蓝色小字（速率、Tabs 选中态）在暗色里几乎读不出来。
     这里收成一组 --u-* 令牌，暗色只在下面覆盖一次，全页自动跟随。 */
  --u-primary: #165dff;
  --u-primary-weak: rgba(22, 93, 255, 0.08);
  --u-primary-weak-2: rgba(22, 93, 255, 0.12);
  --u-primary-shadow: rgba(22, 93, 255, 0.28);
  --u-success: #00b42a;
  --u-warning: #ff7d00;
  --u-danger: #f53f3f;
  --u-purple: #722ed1;
  --u-page: #f5f7fa;
  --u-card: #ffffff;
  --u-border: #e5e6eb;
  --u-text: #1d2129;
  --u-text-2: #4e5969;
  --u-text-3: #86909c;
  --u-radius: 8px;
  --u-hover-lift: 0 6px 18px rgba(15, 23, 42, 0.09);

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

/* 暗色：只覆盖令牌。主色必须提亮（深底上的 #165DFF 对比度不足），
   弱底色改用「白叠一层」而不是蓝叠一层 —— 深底上蓝色叠加会发灰绿。 */
html.dark .usage-page {
  --u-primary: #4080ff;
  --u-primary-weak: rgba(64, 128, 255, 0.16);
  --u-primary-weak-2: rgba(64, 128, 255, 0.24);
  --u-primary-shadow: rgba(64, 128, 255, 0.3);
  --u-success: #23c343;
  --u-warning: #ff9a2e;
  --u-danger: #f76560;
  --u-purple: #8d4eda;
  --u-page: #0f172a;
  --u-card: #161c27;
  --u-border: rgba(255, 255, 255, 0.12);
  --u-text: #e2e8f0;
  --u-text-2: #a9b6c8;
  --u-text-3: #7c8899;
  --u-hover-lift: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.usage-page > * {
  flex-shrink: 0;
}

/* ===== §1 页面头 =====
   头部本体已统一到 RePageHead（浅灰通栏、标题 16px 半粗、右侧控制器一行对齐）。
   这里只保留头部内部的子元素（实时状态、时间胶囊、图标按钮）样式。 */

/* 刷新流光：贴在顶栏底边内侧，不占布局（absolute），只在请求期间出现。
   用「一段高光从左滑到右」而不是转圈，是因为它表达的是「进度未知但还在动」，
   而且贴边的一条不会遮住任何内容。 */
.refresh-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  overflow: hidden;
  opacity: 0;
  border-bottom-left-radius: var(--u-radius);
  border-bottom-right-radius: var(--u-radius);
  transition: opacity 0.2s var(--ease-out, ease);
  pointer-events: none;
}
.refresh-bar.is-on { opacity: 1; }
.refresh-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  width: 34%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--u-primary) 45%,
    var(--u-primary) 55%,
    transparent 100%
  );
  animation: refresh-slide 1.1s ease-in-out infinite;
}
@keyframes refresh-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(320%); }
}

/* 实时状态：绿点微呼吸 + 文案 + 速率胶囊 + 暂停/恢复按钮 */
.live-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 8px;
  border-radius: 999px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.live-dot {
  width: 7px; height: 7px; flex-shrink: 0;
  border-radius: 999px;
  background: var(--el-text-color-placeholder);
}
.live-dot.is-pulsing {
  background: var(--u-success);
  animation: live-breathe 2.2s ease-in-out infinite;
}
@keyframes live-breathe {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--u-success) 42%, transparent);
  }
  50% {
    opacity: 0.68;
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--u-success) 0%, transparent);
  }
}
.live-status.is-error { border-color: color-mix(in srgb, var(--u-warning) 48%, transparent); }
.live-status.is-error .live-dot { background: var(--u-warning); }
.live-status.is-paused { opacity: 0.75; }
.live-text { font-weight: 600; color: var(--el-text-color-primary); }
.live-rate {
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--u-primary) 12%, transparent);
  color: var(--u-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.live-toggle {
  appearance: none; border: 0; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; padding: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.live-toggle svg { width: 11px; height: 11px; }
.live-toggle:hover { color: var(--u-primary); background: color-mix(in srgb, var(--u-primary) 12%, transparent); }
.live-toggle.is-off { color: var(--u-warning); }


/* 胶囊时间切换：选中态为实底 + 白字（§2） */
.time-pills {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.time-pill {
  appearance: none; border: 0; cursor: pointer;
  padding: 5px 13px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.time-pill:hover { color: var(--u-primary); background: color-mix(in srgb, var(--u-primary) 8%, transparent); }
.time-pill.active {
  background: var(--u-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px var(--u-primary-shadow);
}

/* 单个日期框：日历图标 + 区间文本合成一个输入框（§2 合并为一个组合输入） */
.date-picker { width: 250px; }
.date-picker :deep(.el-range-editor.el-input__wrapper) {
  height: 32px;
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.date-picker :deep(.el-range-editor.el-input__wrapper.is-active) {
  box-shadow: 0 0 0 1px var(--u-primary) inset;
}
.date-picker :deep(.el-range-input) { font-size: 12.5px; }
.date-picker :deep(.el-range-separator) { font-size: 12px; color: var(--el-text-color-placeholder); }

/* 导出 / 刷新图标按钮 */
.action-buttons { display: inline-flex; align-items: center; gap: 6px; }
.icon-btn {
  appearance: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  transition: color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.icon-btn svg { width: 16px; height: 16px; }
.icon-btn:hover {
  color: var(--u-primary);
  border-color: color-mix(in srgb, var(--u-primary) 40%, transparent);
  background: color-mix(in srgb, var(--u-primary) 6%, var(--el-bg-color));
}
.icon-btn:active { transform: translateY(1px); }

/* ===== §3 1 主 3 辅指标卡矩阵 =====
   主卡（总 Token）占 2 列宽，其余三张各占 1 列 —— 一眼就能分出"主指标"和"解释性指标"。
   四张卡等宽时，用户得逐个读标题才知道哪个最重要。 */
.stats-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 14px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}
/* hover 轻微上浮 + 阴影加深（§3）；不用大位移，避免整屏数字跟着晃 */
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--el-text-color-primary) 9%, transparent);
  border-color: var(--el-border-color);
}

.kpi-top { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
/* 渐变图标块：从本色到本色浅档，深色下依然有层次（纯色块在深色里会糊成一片） */
.kpi-icon-wrapper {
  display: inline-flex;
  padding: 1px;
  border-radius: 8px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--kpi-accent) 26%, transparent),
    color-mix(in srgb, var(--kpi-accent) 8%, transparent));
}
.kpi-icon {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(135deg,
    var(--kpi-accent) 0%,
    color-mix(in srgb, var(--kpi-accent) 72%, #fff) 100%);
}
.kpi-icon svg { width: 16px; height: 16px; }
.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.kpi-value-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
/* 28px 等宽粗体数字（§5）：等宽保证刷新时数字不左右跳 */
.kpi-main-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.kpi-main-value.cost { color: var(--u-success); }
.kpi-main-value .unit {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--el-text-color-placeholder);
}
.kpi-mini-ring { flex-shrink: 0; }

/* 辅助信息 12px 浅灰（§5） */
.kpi-sub {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.kpi-sub b {
  font-weight: 600;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}
.kpi-sub .sub-input b { color: var(--u-primary); }
.kpi-sub .sub-output b { color: var(--u-success); }
.kpi-sub .sub-cached b { color: var(--u-purple); }
.kpi-sub .sub-standard b { color: var(--el-text-color-regular); }
.kpi-sub .sub-first b { color: var(--u-warning); }

/* KPI 语义色（§5 指定的四个色值） */
.tone-primary { --kpi-accent: var(--u-primary); }
.tone-info { --kpi-accent: var(--u-primary); }
.tone-success { --kpi-accent: var(--u-success); }
.tone-warning { --kpi-accent: var(--u-warning); }

/* 数字滚动动画：宽度变化时用 tabular-nums 已能稳住，这里只做淡入提示"这是新数据" */
.value-anim { display: inline-block; }

/* ==================== §4 双栏看板 ====================
   左「模型用量分析」/ 右「分组用量分析」—— 两栏等高（grid 默认 stretch），
   每栏内部「环形总览 + 图例」在上、「明细表」在下，图与表回答同一个问题。

   为什么不做成「图表块 + 表格块」两个独立卡片（此前的做法）：拆开后用户得自己
   在上下两块之间对账「图里那个大扇区到底是表里哪一行」，而现在图例和表格行
   共用同一套配色与名次，扫一眼就对上了。 */
.board-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}

.board-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--u-radius);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  /* 只描边变化、不做位移/投影：大卡片浮起会晃眼，而边框一深就足够提示"指针在这块" */
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.board-card:hover { border-color: var(--el-border-color); }

/* 通用面板：排行榜 / 每日用量 / 趋势 / 明细都用它，与看板两栏同一套头与身 */
.board-card.panel > .panel-body { padding: 0 16px 16px; }
.board-card.panel > .panel-body--table { padding: 0 6px 8px; }

.board-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
}
.board-title-wrap { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
/* 16px 半粗标题（§5） */
.board-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.board-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* 胶囊 Tabs：选中态平滑过渡（§6） */
.board-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.board-tab {
  appearance: none; border: 0; cursor: pointer;
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.board-tab:hover { color: var(--u-primary); }
.board-tab.active {
  background: var(--el-bg-color);
  color: var(--u-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 9%, transparent);
}

/* 环形总览区：左侧圆环（中心内嵌 Top1 占比）+ 右侧图例列表 */
.board-viz {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 0 16px 12px;
}
.board-ring { position: relative; width: 176px; height: 176px; }
/* 环心覆盖层：绝对定位在圆心，指针事件放行（否则挡住扇区 hover） */
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  pointer-events: none;
  text-align: center;
  padding: 0 22px;
}
.ring-pct {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.ring-name {
  max-width: 100%;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 图例：按当前指标降序（§4），只有色点 + 名称 + 占比 */
.board-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  max-height: 176px;
  overflow-y: auto;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 4px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.legend-item:hover { background: var(--el-fill-color-light); }
.legend-item.is-top .legend-name { font-weight: 600; color: var(--el-text-color-primary); }
/* 与环心联动：hover 的扇区在图例里同高亮，两处指向同一项 */
.legend-item.is-hover {
  background: color-mix(in srgb, var(--u-primary) 8%, transparent);
}
.legend-item.is-hover .legend-name { color: var(--u-primary); font-weight: 600; }
/* 「其他 N 项」是聚合行，弱化成辅助色，避免被当成某个具体模型 */
.legend-item.is-other .legend-name { color: var(--el-text-color-placeholder); }
.legend-item.is-other .legend-pct { color: var(--el-text-color-placeholder); }
.legend-dot {
  width: 8px; height: 8px;
  flex-shrink: 0;
  border-radius: 2px;
}
.legend-name {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legend-pct {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
/* 空态一律 el-empty（插图 + 描述）。图表区的空态给一个与图表相近的最小高度，
   否则「有数据 → 没数据」切换时卡片会突然塌下去一大截。 */
.legend-empty {
  padding: 4px 0;
}
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}
.legend-empty :deep(.el-empty) {
  padding: 8px 0;
}
.legend-empty :deep(.el-empty__description) {
  margin-top: 2px;
  font-size: 12px;
}
.legend-empty :deep(.el-empty__description p) {
  margin: 0;
  color: var(--el-text-color-placeholder);
}

/* 明细表：去掉外边框，只留表头细线与行分隔线（§5） */
.board-table { padding: 0 6px 8px; }
.board-table :deep(.re-table-wrapper) { border-radius: 0; }
.board-table :deep(.vxe-table--border-line),
.board-table :deep(.vxe-table--render-default) { border: 0; }
.board-table :deep(.vxe-table--header-wrapper) { background: transparent; }
/* 表头：深灰半粗 + 一条细下划线，不用浅灰块（§4「深灰加粗表头」） */
.board-table :deep(.vxe-header--column) {
  background: transparent;
  color: var(--el-text-color-regular);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.board-table :deep(.vxe-body--column) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.board-table :deep(.vxe-body--row:last-child .vxe-body--column) { border-bottom: 0; }
/* 行高收紧：用组件自带的 compact 档（size="small" → .re-table--compact），
   而不是在页面里 :deep 覆盖单元格内边距 —— 基础 ReTable 的行高由
   `.re-table .vxe-body--column { padding: 10px 0 !important }` 决定，页面侧想压
   就得打一场 !important 特异性官司；组件既然提供了档位，就用档位。 */
.board-table :deep(.re-table--compact .vxe-body--column) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
.board-table :deep(.vxe-body--column .vxe-cell) {
  line-height: 1.4;
}
.board-table :deep(.vxe-header--column) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
/* 行 hover → 浅蓝底（§4） */
.board-table :deep(.vxe-body--row.row--hover),
.board-table :deep(.vxe-body--row:hover) {
  background: color-mix(in srgb, var(--u-primary) 5%, transparent);
}

/* 名称单元格：色点与图例同色，便于把行和图例对上 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.name-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
.name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 12.5px;
}
.num-cell {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
}
/* ¥0 / 0 token 行整体淡化成浅灰（§4）：一眼看出"这行没花钱" */
.name-cell.is-zero .name-text,
.num-cell.is-zero { color: var(--el-text-color-placeholder); }

/* 占比列：彩色进度条 + 百分比（§4） */
.pct-cell { display: flex; align-items: center; gap: 8px; }
.pct-track {
  flex: 1 1 auto;
  min-width: 30px;
  height: 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pct-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.pct-text {
  flex: 0 0 auto;
  min-width: 42px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.detail-table th {
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  white-space: nowrap;
}

.detail-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

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

/* Token 趋势 + 模型延迟两列并排。
   用 minmax(0, 1fr) 而不是 1fr：flex/grid 子项默认 min-width:auto，
   ECharts 的 canvas 撑出来的宽度会让两列互相挤压、右侧被裁掉。 */
.trend-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

@media (max-width: 1100px) {
  /* 窄屏堆叠：两列并排时每侧不到 400px，坐标轴标签会挤成一团 */
  .trend-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

.filter-input {
  width: 180px;
}

@media (max-width: 1280px) {
  /* 主卡 2 列在 1280 以下会和辅卡一起挤窄，回到 2×2（主卡仍占整行） */
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .kpi-card.kpi-primary {
    grid-column: span 3;
  }
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-card.kpi-primary {
    grid-column: span 2;
  }
  .board-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .board-viz {
    grid-template-columns: 160px minmax(0, 1fr);
  }
  .board-ring { width: 160px; height: 160px; }
}

/* 手机/极窄屏：全部改单列，顶栏控件换行后左对齐（否则右对齐会留一大块空洞） */
@media (max-width: 760px) {
  .usage-page { padding: 14px; gap: 12px; }
  .stats-grid { grid-template-columns: minmax(0, 1fr); }
  .kpi-card.kpi-primary { grid-column: auto; }
  .board-viz { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .board-legend { width: 100%; max-height: none; }
  .date-picker { width: 100%; }
  .time-pills { flex-wrap: wrap; }
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
   指标卡、时间胶囊、看板 Tabs 的选中态都靠底色 + 描边表达，关掉过渡后依然可辨；
   数字滚动动画在脚本里已经跳过（prefersReducedMotion），这里只收过渡与呼吸动画。 */
@media (prefers-reduced-motion: reduce) {
  .kpi-card,
  .time-pill,
  .board-tab,
  .legend-item,
  .pct-fill,
  .icon-btn,
  .live-dot.is-pulsing {
    transition: none;
    animation: none;
  }
}
</style>
