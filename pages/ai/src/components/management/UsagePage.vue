<template>
  <!--
    用量管理 —— 侦察时间轴（04）

    <p>主干结构是顶部那条 30 天刻度尺：每根竖条是一天的 Token 强度，点某一天
    整页下钻到该日（区间、读数、构成、趋势、分布、每日模型、延迟、排行、明细
    全部跟着切），再点同一天或「返回区间」退出并还原原来的筛选。</p>

    <p>版面自下而上收成固定高度的一屏：40 顶栏 / 44 刻度尺 / 64 核心读数 /
    30 派生读数 / 168 构成 + 趋势 / 156 分布 + 每日模型 + 延迟 / 124 双 Top5 +
    实时 / 明细（最低 280px，有富余高度时继续长高），长内容各块内部滚动，
    整体超出视口时整页滚动。</p>

    <p>业务数据 100% 来自共享 {@link useUsageBoard}（SSE 实时 / 加载 / 图表 /
    明细 / 单位设置），本文件只负责版面与视觉；treemap 的切片直接复用
    {@code modelBoard.items}，颜色与占比和其他图表完全一致。</p>
  -->
  <div v-if="isAdminUser" class="usage-page" data-page="usage">
    <!-- ── 顶栏：标题 + 区间 + 实时入口 + 时间筛选 + 操作 ── -->
    <header class="usage-head usage-card">
      <div class="usage-head__lead">
        <h1 class="usage-title">用量管理</h1>
        <span class="usage-range">{{ board.rangeLabel }}</span>
        <!-- 下钻中：给一个就地出口，不用回到刻度尺找那一天 -->
        <button
          v-if="board.drillDay"
          type="button"
          class="usage-back"
          title="回到下钻前的区间"
          @click="board.clearDrill()"
        >← 返回区间</button>
      </div>

      <div class="usage-head__tools">
        <div class="usage-seg" role="tablist" aria-label="时间范围">
          <button
            v-for="f in board.quickFilters"
            :key="f.key"
            type="button"
            role="tab"
            class="usage-seg__btn"
            :class="{ 'is-on': board.activeFilter === f.key }"
            :aria-selected="board.activeFilter === f.key"
            @click="board.setQuickFilter(f.key)"
          >
            {{ f.label }}
          </button>
        </div>

        <el-date-picker
          v-model="board.customRange"
          class="usage-date"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          size="small"
          @change="board.onCustomRange"
        />

        <el-button
          class="usage-icon"
          text
          circle
          :loading="board.exporting"
          title="导出当前区间用量"
          aria-label="导出当前区间用量"
          @click="board.handleExport"
        >
          <el-icon v-if="!board.exporting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3.5v11M7.6 10.2 12 14.6l4.4-4.4M4.5 19.5h15" />
            </svg>
          </el-icon>
        </el-button>

        <el-button
          class="usage-icon"
          text
          circle
          :loading="board.importing"
          title="导入用量统计 CSV"
          aria-label="导入用量统计 CSV"
          @click="triggerImport"
        >
          <el-icon v-if="!board.importing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 15.5v-11M7.6 8.8 12 4.4l4.4 4.4M4.5 19.5h15" />
            </svg>
          </el-icon>
        </el-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".csv"
          hidden
          @change="onImportFileChange"
        />

        <el-button
          class="usage-icon"
          text
          circle
          :loading="board.refreshing"
          title="刷新数据"
          aria-label="刷新数据"
          @click="board.refreshAll({ detail: true })"
        >
          <el-icon v-if="!board.refreshing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
            </svg>
          </el-icon>
        </el-button>
      </div>

      <span v-if="board.refreshing" class="usage-head__scan" aria-hidden="true" />
    </header>

    <!-- ── 刻度尺：近 30 天，一天一根，点某天整页下钻 ── -->
    <section class="usage-spine usage-card" aria-label="近 30 天用量刻度尺">
      <div class="usage-spine__side">
        <span class="usage-spine__cap">近 30 天</span>
        <span class="usage-spine__sum">{{ board.fmtToken(board.spineTotal) }}</span>
        <span class="usage-spine__unit">tokens</span>
      </div>

      <div class="usage-spine__track">
        <button
          v-for="(d, i) in board.spineView"
          :key="d.date"
          type="button"
          class="usage-spine__day"
          :class="{
            'is-on': board.drillDay === d.date,
            'is-out': !board.isSpineInRange(d.date),
            'is-today': d.date === todayKey,
            'is-empty': !(d.tokens > 0),
          }"
          :title="`${d.date} · ${board.fmtToken(d.tokens)} tokens · ${board.formatNumber(d.calls)} 次请求（点击下钻）`"
          :aria-label="`${d.date}，${board.fmtToken(d.tokens)} tokens`"
          @click="board.selectSpineDay(d.date)"
        >
          <span class="usage-spine__slot">
            <i class="usage-spine__bar" :style="{ height: spineH(d.tokens) }" />
          </span>
          <span class="usage-spine__tick">{{ showTick(i) ? d.date.slice(5) : '' }}</span>
        </button>
      </div>

      <button
        v-if="board.drillDay"
        type="button"
        class="usage-spine__back"
        title="回到下钻前的区间"
        @click="board.clearDrill()"
      >返回区间</button>
      <span v-else class="usage-spine__hint">点某一天下钻</span>
    </section>

    <!-- 当前区间有用量时铺满整版式；无用量时收敛成一块整页空态（见下方 v-else） -->
    <template v-if="board.hasAnyUsage">
    <!-- 预算阈值横幅：≥80% 预警 / ≥100% 超支；未启用或未达阈值不出现 -->
    <div
      v-if="board.budgetState.enabled && board.budgetState.pct >= 80"
      class="usage-budget-banner"
      :class="board.budgetState.pct >= 100 ? 'is-error' : 'is-warning'"
      role="status"
    >
      <span class="usage-budget-banner__dot" aria-hidden="true" />
      <span class="usage-budget-banner__text">
        {{ board.budgetState.pct >= 100 ? '今日预算已超支' : '今日预算已接近上限' }}
        · 已用 {{ board.budgetState.pct }}%（{{ board.budgetState.label }}）
      </span>
    </div>
    <!-- ── 核心读数：四格横带，Token 格带输入/输出迷你环 ── -->
    <section class="usage-kpis">
      <article
        v-for="card in board.statCards"
        :key="card.key"
        class="usage-kpi usage-card"
        :class="[`is-${card.tone}`, { 'has-ring': card.spark === 'ring', 'has-spark': card.spark !== 'ring' }]"
      >
        <div class="usage-kpi__head">
          <i class="usage-kpi__mark" />
          <span class="usage-kpi__label">{{ card.label }}</span>
          <!-- 区间环比：当前区间 vs 等长上一窗口；无上一窗基数（首窗/全部时间）不显示 -->
          <span
            v-if="deltaText(card.key)"
            class="usage-kpi__delta"
            :class="deltaCls(card.key)"
            :title="deltaTitle(card.key)"
          >{{ deltaText(card.key) }}</span>
        </div>
        <div class="usage-kpi__value">
          {{ card.value }}<span v-if="card.unit" class="usage-kpi__unit">{{ card.unit }}</span>
        </div>
        <div class="usage-kpi__sub">{{ card.sub.join(' · ') }}</div>
        <!-- 纯装饰性小图：不承载读数（数值已在上方文字里），对辅助技术隐藏 -->
        <div v-if="card.spark === 'ring'" class="usage-kpi__ring" aria-hidden="true">
          <ReEcharts :option="board.miniRingOption('input')" height="38px" width="56px" notMerge />
        </div>
        <div v-else class="usage-kpi__ring usage-kpi__ring--spark" aria-hidden="true">
          <ReEcharts :option="board.miniSparkOption(card.spark)" height="34px" width="92px" notMerge />
        </div>
      </article>
    </section>

    <!-- ── 派生读数：把「用了多少」翻译成「贵不贵」 ── -->
    <ul class="usage-deriv usage-card">
      <li v-for="d in derivedReadouts" :key="d.key" class="usage-deriv__item">
        <span class="usage-deriv__label">{{ d.label }}</span>
        <span
          class="usage-deriv__value"
          :class="{ 'is-good': d.tone === 'good', 'is-warn': d.tone === 'warn' }"
        >{{ d.value }}</span>
        <span class="usage-deriv__hint">{{ d.hint }}</span>
      </li>
    </ul>

    <!-- ── 预算与预测：今日预算消耗 + 本月费用外推 ── -->
    <section class="usage-budget" aria-label="今日预算与本月费用预测">
      <article class="usage-budget__card usage-card">
        <div class="usage-budget__head">
          <span class="usage-budget__title">今日预算</span>
          <span class="usage-budget__badge" :class="`is-${board.budgetState.tone}`">
            {{ board.budgetState.enabled ? (board.budgetState.pct >= 100 ? '已超支' : board.budgetState.pct >= 80 ? '接近上限' : '正常') : '未启用' }}
          </span>
        </div>
        <div
          class="usage-budget__bar"
          role="progressbar"
          :aria-valuenow="board.budgetState.pct"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`今日预算已用 ${board.budgetState.pct}%`"
        >
          <i class="usage-budget__fill" :class="`is-${board.budgetState.tone}`" :style="{ width: `${board.budgetState.pct}%` }" />
        </div>
        <div class="usage-budget__foot">
          <span>{{ board.budgetState.label }}</span>
          <span v-if="board.budgetState.enabled" class="usage-budget__pct">{{ board.budgetState.pct }}%</span>
        </div>
      </article>

      <article class="usage-budget__card usage-card">
        <div class="usage-budget__head">
          <span class="usage-budget__title">本月费用预测</span>
          <span v-if="board.costForecast" class="usage-budget__badge is-info">
            日均 {{ board.currencySymbol }}{{ board.money(board.costForecast.dailyAvg) }}
          </span>
        </div>
        <div class="usage-budget__forecast">
          <template v-if="board.costForecast">
            <span class="usage-budget__forecast-num">{{ board.currencySymbol }}{{ board.money(board.costForecast.forecast) }}</span>
            <span class="usage-budget__forecast-hint">
              按本月 {{ board.costForecast.daysElapsed }}/{{ board.costForecast.daysInMonth }} 天日均外推 · 月累计 {{ board.currencySymbol }}{{ board.money(board.costForecast.mtd) }}
            </span>
          </template>
          <span v-else class="usage-budget__forecast-hint">本月暂无费用数据，暂无法预测</span>
        </div>
        <div v-if="board.costForecastWindows" class="usage-budget__windows" aria-label="未来费用预测">
          <span>未来7天 <b>{{ board.currencySymbol }}{{ board.money(board.costForecastWindows.next7) }}</b></span>
          <span>未来30天 <b>{{ board.currencySymbol }}{{ board.money(board.costForecastWindows.next30) }}</b></span>
        </div>
      </article>
    </section>

    <!-- ── 用量构成：按调用类型拆分，工具/记忆各自独立成行 ── -->
    <section class="usage-calltype usage-card" aria-label="用量构成（按调用类型）">
      <header class="usage-calltype__head">
        <div class="usage-panel__title-wrap">
          <h2 class="usage-panel__title">用量构成</h2>
          <span class="usage-panel__meta">
            按调用类型拆分 · 工具 {{ board.fmtToken(board.callTypeToolTokens) }} ·
            记忆 {{ board.fmtToken(board.callTypeMemoryTokens) }} ·
            合计 {{ board.fmtToken(board.callTypeTotal) }} tokens
          </span>
        </div>
        <span class="usage-calltype__hint">工具/记忆/外部均为独立明细，不并入对话</span>
      </header>
      <ul class="usage-calltype__list">
        <li v-for="r in board.callTypeRows" :key="r.key" class="usage-calltype__row">
          <i class="usage-calltype__dot" :style="{ background: r.color }" />
          <span class="usage-calltype__name">{{ r.label }}</span>
          <span class="usage-calltype__bar" aria-hidden="true">
            <i :style="{ width: board.callTypeWidth(r), background: r.color }" />
          </span>
          <span class="usage-calltype__pct">{{ r.pct.toFixed(1) }}%</span>
          <span class="usage-calltype__num">{{ board.fmtToken(r.totalTokens) }}</span>
          <span class="usage-calltype__num">{{ board.formatNumber(r.calls) }} 次</span>
          <span class="usage-calltype__num">{{ board.money(r.cost) }}</span>
        </li>
      </ul>
    </section>
    <!-- ── TopK 速度榜：模型 / 供应商 / Agent 三维切换，按请求数加权 ── -->
    <section class="usage-speed usage-card" aria-label="TopK 速度榜">
      <header class="usage-speed__head">
        <div class="usage-panel__title-wrap">
          <h2 class="usage-panel__title">TopK 速度榜</h2>
          <span class="usage-panel__meta">平均解码速度 · 按请求数加权 · 前 {{ board.topkRows.length || 0 }} 名 · 命中率 / 失败暂无分模型统计</span>
        </div>
        <div class="usage-seg usage-seg--sm" role="tablist" aria-label="速度榜维度" @keydown="onTabKeydown">
          <button
            v-for="s in board.TOPK_SCOPES"
            :key="s.key"
            type="button"
            role="tab"
            class="usage-seg__btn"
            :class="{ 'is-on': board.topkScope === s.key }"
            :aria-selected="board.topkScope === s.key"
            @click="board.topkScope = s.key"
          >{{ s.label }}</button>
        </div>
      </header>
      <ol v-if="board.topkRows.length" class="usage-speed__list">
        <li v-for="(r, i) in board.topkRows" :key="r.key" class="usage-speed__row">
          <!-- 相对速度条：以榜首为 100%，纯装饰（数值已在右侧文字里） -->
          <i
            class="usage-speed__bar"
            aria-hidden="true"
            :style="{
              width: speedBarPct(r.speed),
              background: board.topkColor(i),
            }"
          />
          <i class="usage-speed__dot" :style="{ background: board.topkColor(i) }" />
          <div class="usage-speed__main">
            <div class="usage-speed__title">
              <span class="usage-speed__name" :title="r.name">{{ r.name }}</span>
              <span class="usage-speed__rate">{{ Math.round(r.speed ?? 0) }} token/秒</span>
              <span class="usage-speed__ticks">· {{ board.formatNumber(r.ticks) }} 计时</span>
            </div>
            <div class="usage-speed__sub">
              {{ board.formatNumber(r.calls) }} 个请求 · {{ board.fmtToken(r.tokens) }} token ·
              {{ board.currencySymbol }}{{ board.money(r.cost) }} · 首字
              {{ r.firstMs == null ? '—' : board.formatLatency(r.firstMs) }} ·
              <span class="usage-speed__na">命中率 —</span> ·
              <span class="usage-speed__na">失败 —</span>
            </div>
          </div>
          <span class="usage-speed__rank">{{ i + 1 }}</span>
        </li>
      </ol>
      <div v-else class="usage-speed__empty">
        {{ board.routeErrors.trend || board.routeErrors.modelTrend ? '速度数据加载失败，点右上角刷新重试' : '当前区间暂无可比较的实测速度' }}
      </div>
    </section>

    <!-- ── 构成 + 趋势：面积看分布，曲线看走势 ── -->
    <section class="usage-mid">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">模型构成</h2>
            <span class="usage-panel__meta">
              {{ board.treemapBlocks.total }} 个模型 ·
              <a class="usage-link" @click="board.onTreemapMore">全部</a>
            </span>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="构成口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.modelChartType === t.key }"
              :aria-selected="board.modelChartType === t.key"
              @click="board.modelChartType = t.key"
            >{{ t.label }}</button>
          </div>
        </header>

        <div class="usage-panel__chart usage-panel__chart--tight">
          <ReEcharts
            v-if="board.treemapBlocks.blocks.length"
            :option="treemapOption"
            height="178px"
            notMerge
            @click="board.onTreemapClick"
          />
          <div v-else class="usage-empty usage-empty--sm">
            <el-empty
              :description="board.routeErrors.list ? '模型用量加载失败，点右上角刷新重试' : '暂无模型用量'"
              :image-size="40"
            />
          </div>
        </div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">用量趋势</h2>
            <span class="usage-panel__meta">{{ trendDesc }}</span>
          </div>
          <div class="usage-panel__tools">
            <div class="usage-seg usage-seg--sm" role="tablist" aria-label="趋势口径">
              <button
                v-for="m in trendMetrics"
                :key="m.key"
                type="button"
                role="tab"
                class="usage-seg__btn"
                :class="{ 'is-on': board.trendMetric === m.key }"
                :aria-selected="board.trendMetric === m.key"
                @click="board.trendMetric = m.key"
              >{{ m.label }}</button>
            </div>
            <div class="usage-seg usage-seg--sm" role="tablist" aria-label="图形类型">
              <button
                type="button"
                role="tab"
                class="usage-seg__btn"
                :class="{ 'is-on': board.trendChartType === 'bar' }"
                :aria-selected="board.trendChartType === 'bar'"
                title="柱状图"
                @click="board.trendChartType = 'bar'"
              >柱</button>
              <button
                type="button"
                role="tab"
                class="usage-seg__btn"
                :class="{ 'is-on': board.trendChartType === 'line' }"
                :aria-selected="board.trendChartType === 'line'"
                title="折线图"
                @click="board.trendChartType = 'line'"
              >线</button>
            </div>
          </div>
        </header>

        <div class="usage-panel__chart usage-panel__chart--tight" title="点击某天的柱/点，整页下钻到该日">
          <ReEcharts v-if="board.trendData.length" :option="board.trendOption" height="178px" notMerge @click="onTrendClick" />
          <div v-else class="usage-empty usage-empty--sm">
            <el-empty
              :description="board.routeErrors.trend ? '趋势加载失败，点右上角刷新重试' : '暂无趋势数据'"
              :image-size="40"
            />
          </div>
        </div>
      </article>
    </section>

    <!-- ── 缓存命中率：缓存读取 / 总 Token 的日走势（与趋势图同源，不额外发请求） ── -->
    <section class="usage-panel usage-card usage-cache" aria-label="缓存命中率">
      <header class="usage-panel__head">
        <div class="usage-panel__title-wrap">
          <h2 class="usage-panel__title">缓存命中率</h2>
          <span class="usage-panel__meta">
            区间命中 {{ cacheSummary.pct }} · 缓存读取 {{ board.fmtToken(cacheSummary.cached) }} token
          </span>
        </div>
      </header>
      <div class="usage-panel__chart usage-panel__chart--tight usage-cache__chart">
        <ReEcharts v-if="board.trendData.length" :option="board.cacheTrendOption" height="132px" notMerge />
        <div v-else class="usage-empty usage-empty--sm">
          <el-empty description="暂无缓存数据" :image-size="40" />
        </div>
      </div>
    </section>

    <!-- ── 分布（占两行） + 每日模型（占两列） + 模型延迟 ── -->
    <section class="usage-triple usage-triple--dist">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">分布</h2>
            <span class="usage-panel__meta">{{ board.distSorted.length }} 项</span>
          </div>
          <div class="usage-panel__tools">
            <div class="usage-seg usage-seg--sm" role="tablist" aria-label="分布口径">
              <button
                v-for="s in board.distScopes"
                :key="s.key"
                type="button"
                role="tab"
                class="usage-seg__btn"
                :class="{ 'is-on': board.distScope === s.key }"
                :aria-selected="board.distScope === s.key"
                @click="board.distScope = s.key"
              >{{ s.label }}</button>
            </div>
            <div class="usage-seg usage-seg--sm" role="tablist" aria-label="分布指标">
              <button
                v-for="t in board.boardTabs"
                :key="t.key"
                type="button"
                role="tab"
                class="usage-seg__btn"
                :class="{ 'is-on': board.distMetric === t.key }"
                :aria-selected="board.distMetric === t.key"
                @click="board.distMetric = t.key"
              >{{ t.label.replace('按 ', '') }}</button>
            </div>
          </div>
        </header>

        <div class="usage-dist__headrow">
          <span class="usage-dist__c-name">名称</span>
          <span>请求</span>
          <span>Token</span>
          <span>费用</span>
          <span class="usage-dist__c-pct">占比</span>
        </div>
        <ul class="usage-dist__list">
          <li v-for="it in board.distSorted" :key="it.name" class="usage-dist__row">
            <span class="usage-dist__c-name" :title="board.distName(it.name)">
              <i class="usage-dist__dot" :style="{ background: it.color }" />
              <span class="usage-dist__name">{{ board.distName(it.name) }}</span>
            </span>
            <span class="usage-dist__num">{{ board.formatNumber(it.row.requests) }}</span>
            <span class="usage-dist__num">{{ board.fmtToken(it.row.totalTokens) }}</span>
            <span class="usage-dist__num">{{ board.money(it.row.cost) }}</span>
            <span class="usage-dist__c-pct">
              <i class="usage-dist__track">
                <i class="usage-dist__fill" :style="{ width: board.barWidth(it.pct), background: it.color }" />
              </i>
              <b>{{ it.pct.toFixed(1) }}%</b>
            </span>
          </li>
          <li v-if="!board.distSorted.length" class="usage-dist__empty">暂无数据</li>
        </ul>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">每日模型用量</h2>
            <span class="usage-panel__meta">堆叠保留最活跃 8 个</span>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="每日模型口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.modelBarMetric === t.key }"
              :aria-selected="board.modelBarMetric === t.key"
              @click="board.modelBarMetric = t.key"
            >{{ t.label.replace('按 ', '') }}</button>
          </div>
        </header>
        <div class="usage-panel__chart usage-panel__chart--tight">
          <ReEcharts v-if="board.modelBarDates.length" :option="board.modelBarOption" height="168px" notMerge />
          <div v-else class="usage-empty usage-empty--sm">
            <el-empty description="暂无按天模型用量数据" :image-size="40" />
          </div>
        </div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">模型延迟</h2>
            <span class="usage-panel__meta">首字 + 平均 tok/s</span>
          </div>
        </header>
        <div class="usage-panel__chart usage-panel__chart--tight">
          <ReEcharts
            v-if="board.latencyDates.length && board.latencyModelCount > 0"
            :option="board.latencyOption"
            height="168px"
            notMerge
          />
          <div v-else class="usage-empty usage-empty--sm">
            <el-empty description="暂无延迟数据" :image-size="40" />
          </div>
        </div>
      </article>
    </section>

    <!-- ── 双 Top5 + 实时用量 ── -->
    <section class="usage-triple usage-triple--ranks">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">模型 Top5</h2>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="排行口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key"
              @click="board.rankMetric = t.key"
            >{{ t.label.replace('按 ', '') }}</button>
          </div>
        </header>
        <ol class="usage-ranks__list">
          <li v-for="(r, i) in board.modelRankTop5" :key="r.name" class="usage-rank">
            <span class="usage-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span
              class="usage-rank__name is-link"
              :title="`${r.name}（点击查看该模型明细）`"
              @click="jumpToDetail(r.name)"
            >{{ r.name }}</span>
            <span class="usage-rank__bar"><i :style="{ width: board.rankBarWidth(r, board.modelRankTop5) }" /></span>
            <span class="usage-rank__value">{{ board.rankValue(r) }}</span>
            <span class="usage-rank__pct">{{ board.rankPct(r, board.modelRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.modelRankTop5.length === 0" class="usage-ranks__empty">暂无模型用量</div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">应用 Top5</h2>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="排行口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key"
              @click="board.rankMetric = t.key"
            >{{ t.label.replace('按 ', '') }}</button>
          </div>
        </header>
        <ol class="usage-ranks__list">
          <li v-for="(r, i) in board.appRankTop5" :key="r.name" class="usage-rank">
            <span class="usage-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="usage-rank__name" :title="board.appLabel(r.name)">{{ board.appLabel(r.name) }}</span>
            <span class="usage-rank__bar"><i :style="{ width: board.rankBarWidth(r, board.appRankTop5) }" /></span>
            <span class="usage-rank__value">{{ board.rankValue(r) }}</span>
            <span class="usage-rank__pct">{{ board.rankPct(r, board.appRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.appRankTop5.length === 0" class="usage-ranks__empty">暂无应用用量</div>
      </article>

      <article class="usage-panel usage-card usage-livecard">
        <header class="usage-panel__head">
          <div class="usage-panel__title-wrap">
            <h2 class="usage-panel__title">实时用量</h2>
          </div>
          <div class="usage-live" :class="`is-${board.liveState}`">
            <span class="usage-live__dot" />
            <span class="usage-live__label">{{ board.liveLabel }}</span>
            <button
              type="button"
              class="usage-live__toggle"
              :title="board.liveEnabled ? '暂停实时刷新' : '恢复实时刷新'"
              :aria-label="board.liveEnabled ? '暂停实时刷新' : '恢复实时刷新'"
              @click="board.liveEnabled = !board.liveEnabled"
            >
              <svg v-if="board.liveEnabled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="7" y="6" width="3.4" height="12" rx="1" />
                <rect x="13.6" y="6" width="3.4" height="12" rx="1" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.6a1 1 0 0 1 1.53-.85l8.2 5.4a1 1 0 0 1 0 1.7l-8.2 5.4A1 1 0 0 1 8 18.4Z" />
              </svg>
            </button>
          </div>
        </header>
        <div class="usage-live__stats">
          <div class="usage-live__stat">
            <span class="usage-live__k">今日</span>
            <b class="usage-live__v">{{ board.fmtToken(board.liveTodayTokens) }}</b>
          </div>
          <div class="usage-live__stat">
            <span class="usage-live__k">区间</span>
            <b class="usage-live__v">{{ board.fmtToken(board.liveRangeTokens) }}</b>
          </div>
          <div class="usage-live__stat">
            <span class="usage-live__k">每分钟</span>
            <b class="usage-live__v is-rate">{{ board.fmtToken(board.liveRate) }}</b>
          </div>
        </div>
        <p class="usage-live__hint">SSE 实时推送 · 速率按 60 秒滑窗</p>
      </article>
    </section>

    <!-- ── 失败请求分析：成功/失败按天堆叠 + 失败率走势（右轴） ── -->
    <section class="usage-panel usage-card usage-fail" aria-label="失败请求分析">
      <header class="usage-panel__head">
        <div class="usage-panel__title-wrap">
          <h2 class="usage-panel__title">失败请求分析</h2>
          <span class="usage-panel__meta">
            <template v-if="board.failureSummary.total > 0">
              失败 {{ board.formatNumber(board.failureSummary.failedCalls) }} / {{ board.formatNumber(board.failureSummary.total) }} 次
              · 失败率 {{ board.failureSummary.rate }}%
              <template v-if="board.failureSummary.worstDay">· 最集中 {{ board.failureSummary.worstDay }}</template>
            </template>
            <template v-else>当前区间暂无失败记录</template>
          </span>
        </div>
        <span v-if="board.failureSummary.failedCalls > 0" class="usage-fail__loss">
          失败消耗 {{ board.fmtToken(board.failureSummary.failedTokens) }} tokens · {{ board.currencySymbol }}{{ board.money(board.failureSummary.failedCost) }}
        </span>
      </header>
      <div v-if="board.failurePoints.length" class="usage-panel__chart usage-panel__chart--tight">
        <ReEcharts :option="board.failureTrendOption" height="168px" notMerge />
      </div>
      <div v-else class="usage-empty usage-empty--sm">
        <el-empty
          :description="board.routeErrors.failures ? '失败分析加载失败，点右上角刷新重试' : '当前区间暂无失败请求'"
          :image-size="40"
        />
      </div>
    </section>

    <!-- ── 用量热力图：最近 53 周的每日用量（GitHub 风格，与时间筛选无关） ── -->
    <section class="usage-panel usage-card usage-heat" aria-label="近 53 周用量热力图">
      <header class="usage-panel__head">
        <div class="usage-panel__title-wrap">
          <h2 class="usage-panel__title">用量热力图</h2>
          <span class="usage-panel__meta">最近 53 周的每日用量 · 周一至周日</span>
        </div>
        <div class="usage-seg usage-seg--sm" role="tablist" aria-label="热力图口径" @keydown="onTabKeydown">
          <button
            v-for="m in heatmapMetrics"
            :key="m.key"
            type="button"
            role="tab"
            class="usage-seg__btn"
            :class="{ 'is-on': board.heatmapMetric === m.key }"
            :aria-selected="board.heatmapMetric === m.key"
            @click="board.heatmapMetric = m.key"
          >{{ m.label }}</button>
        </div>
      </header>
      <div v-loading="board.heatmapLoading" class="usage-heat__body">
        <ReEcharts :option="board.heatmapOption" height="196px" notMerge @click="onHeatmapClick" />
      </div>
    </section>

    <!-- ── 明细（默认 9 列，其余在「列」里按需打开，内部滚动） ── -->
    <div ref="detailWrapRef" class="usage-detail-wrap">
      <UsageDetailTable :board="board" compact />
    </div>
    </template>
    <section v-else class="usage-page__empty usage-card" aria-live="polite">
      <div class="usage-page__empty-box">
        <span class="usage-page__empty-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19V5M4 19h16" />
            <path d="M7 15l3-4 3 2 4-6" />
          </svg>
        </span>
        <h2 v-if="board.refreshing" class="usage-page__empty-title">正在加载用量数据…</h2>
        <h2 v-else class="usage-page__empty-title">
          {{ (board.routeErrors.list || board.routeErrors.statistics) ? '用量数据加载失败' : '当前区间暂无用量记录' }}
        </h2>
        <p v-if="board.refreshing" class="usage-page__empty-desc">正在汇总当前区间的 Token、费用与延迟。</p>
        <p v-else-if="board.routeErrors.list || board.routeErrors.statistics" class="usage-page__empty-desc">点「重新加载」再试一次，或切换时间范围。</p>
        <p v-else class="usage-page__empty-desc">近 30 天的用量会在这里卷成时间轴；发起一次对话或接口调用后即可看到 Token、费用、模型分布与延迟。</p>
        <div v-if="!board.refreshing" class="usage-page__empty-actions">
          <el-button size="small" @click="board.refreshAll({ detail: true })">重新加载</el-button>
          <el-button v-if="board.activeFilter !== 'all'" size="small" type="primary" plain @click="board.setQuickFilter('all')">查看全部区间</el-button>
        </div>
      </div>
    </section>

    <!-- treemap click detail dialog: node level for natural blocks, member list for aggregate blocks (6.1) -->
    <ReDialog
      v-model="board.treemapDetailVisible"
      :title="board.treemapSelected?.name"
      :width="420"
      :close-on-click-modal="false"
      @closed="board.closeTreemapDialog()"
    >
      <div v-if="board.treemapSelected" class="usage-treemap-detail">
        <div class="usage-treemap-detail__head">
          <span class="usage-treemap-detail__name" :title="board.treemapSelected.name">
            {{ board.treemapSelected.name }}
          </span>
          <span class="usage-treemap-detail__pct">{{ board.treemapSelected.pct.toFixed(1) }}%</span>
        </div>
        <div class="usage-treemap-detail__metrics">
          <div class="usage-treemap-detail__metric">
            <div class="usage-treemap-detail__metric-label">请求</div>
            <div class="usage-treemap-detail__metric-value">{{ board.formatNumber(board.treemapSelected.requests) }}</div>
          </div>
          <div class="usage-treemap-detail__metric">
            <div class="usage-treemap-detail__metric-label">输入词数</div>
            <div class="usage-treemap-detail__metric-value">{{ board.fmtToken(board.treemapSelected.promptTokens) }}</div>
          </div>
          <div class="usage-treemap-detail__metric">
            <div class="usage-treemap-detail__metric-label">输出词数</div>
            <div class="usage-treemap-detail__metric-value">{{ board.fmtToken(board.treemapSelected.completionTokens) }}</div>
          </div>
          <div class="usage-treemap-detail__metric">
            <div class="usage-treemap-detail__metric-label">词数总计</div>
            <div class="usage-treemap-detail__metric-value">{{ board.fmtToken(board.treemapSelected.totalTokens) }}</div>
          </div>
        </div>
        <div class="usage-treemap-detail__cost">
          <span class="usage-treemap-detail__cost-label">当前口径费用</span>
          <span class="usage-treemap-detail__cost-value">{{ board.money(board.treemapSelected.cost) }}</span>
        </div>
        <div v-if="board.treemapSelected.members" class="usage-treemap-detail__members">
          <div class="usage-treemap-detail__members-title">
            该块由其包的 {{ board.treemapSelected.members.length }} 个模型组成
          </div>
          <div v-for="m in board.treemapSelected.members" :key="m.name" class="usage-treemap-detail__member">
            <span class="usage-treemap-detail__member-name" :title="m.name">{{ m.name }}</span>
            <div class="usage-treemap-detail__member-stats">
              <span>{{ board.modelChartType === 'token' ? board.fmtToken(m.value) : `${board.currencySymbol}${board.money(m.value)}` }}</span>
              <span>{{ m.pct.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button
          v-if="board.treemapSelected && !board.treemapSelected.name.startsWith('其他 ')"
          type="primary"
          @click="jumpToDetail(board.treemapSelected.name)"
        >查看该模型明细</el-button>
        <el-button @click="board.closeTreemapDialog()">关</el-button>
      </template>
    </ReDialog>

    <!-- all-models list dialog (6.3 expand) -->
    <ReDialog
      v-model="board.treemapMoreVisible"
      title="全部模型"
      :width="760"
      :close-on-click-modal="false"
      @closed="board.treemapMoreVisible = false"
    >
      <div v-if="board.modelBoard.items.length" class="usage-treemap-all">
        <table class="usage-treemap-all__table">
          <thead>
            <tr>
              <th class="usage-treemap-all__name">模型</th>
              <th class="usage-treemap-all__num">当前口径</th>
              <th class="usage-treemap-all__num">占比</th>
              <th class="usage-treemap-all__num">请求</th>
              <th class="usage-treemap-all__num">词数</th>
              <th class="usage-treemap-all__num">费用</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in board.modelBoard.items" :key="r.name">
              <td class="usage-treemap-all__name">
                <i class="usage-treemap-all__dot" :style="{ background: board.boardColorOf(board.modelBoard, r.name) }" />
                <span class="usage-treemap-all__name-text" :title="r.name">{{ r.name }}</span>
              </td>
              <td class="usage-treemap-all__num">
                {{ board.modelChartType === 'token' ? board.fmtToken(r.row.totalTokens) : `${board.currencySymbol}${board.money(r.row.cost)}` }}
              </td>
              <td class="usage-treemap-all__num">
                <i class="usage-pct__track"><i class="usage-pct__fill" :style="pctStyle(r.row)" /></i>{{ board.percent(r.row, board.modelDist, board.modelChartType) }}
              </td>
              <td class="usage-treemap-all__num">{{ board.formatNumber(r.row.requests) }}</td>
              <td class="usage-treemap-all__num">{{ board.fmtToken(r.row.totalTokens) }}</td>
              <td class="usage-treemap-all__num">{{ board.money(r.row.cost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="usage-treemap-all--empty"><el-empty description="暂无模型数据" :image-size="56" /></div>
      <template #footer>
        <el-button @click="board.treemapMoreVisible = false">关</el-button>
      </template>
    </ReDialog>
  </div>

  <!-- 用量是全租户的经营数据：非管理员直接不给看，避免「能进来就能看到别人的花费」 -->
  <div v-else class="usage-page usage-denied" data-page="usage">
    <el-empty description="用量数据仅管理员可见" :image-size="72" />
  </div>
</template>
<script setup lang="ts">
/**
 * 用量管理 · 侦察时间轴（04）。
 *
 * <p>所有业务逻辑来自共享 {@link useUsageBoard}（SSE 实时 / 数据加载 / 图表 /
 * 明细分页 / 格式化 / 单位设置），本文件只负责版面与视觉。</p>
 *
 * <p>刻度尺的取数、下钻与还原都在组合式函数里；这里只做像素换算（柱高、
 * 刻度标签密度）与派生读数文案。构成图仍用 ECharts treemap 画：切片直接取
 * {@code modelBoard.items}，颜色、占比、排序与分布表完全一致。</p>
 */
import { computed, reactive, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import ReEcharts from '@repo/ui/re-echarts'
import ReDialog from '@repo/ui/re-dialog'
import { isAdmin, message } from '@repo/core'
import { useUsageBoard } from '@/composables/useUsageBoard'
import UsageDetailTable from './UsageDetailTable.vue'

/** 用量只对管理员开放：页面级硬门，非管理员渲染无权限空态 */
const isAdminUser = isAdmin()

const board = reactive(useUsageBoard())

/** 导入用量统计：隐藏文件选择器；覆盖更新有风险，选完文件先确认再上传 */
const importInputRef = ref<HTMLInputElement | null>(null)
function triggerImport() {
  importInputRef.value?.click()
}
async function onImportFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重复选择同一个文件
  if (!file) return
  try {
    await message.confirm(
      '导入按「日期 + 分组 + 服务商 + 模型」覆盖写入日汇总表，同维度已有统计会被替换。确定导入吗？',
      '导入用量统计',
    )
  } catch {
    return // 用户取消
  }
  await board.handleImportFile(file)
}

// ==================== 用量页增强：环比徽标 / 图表下钻 / Top5→明细联动 ====================

/** 明细区锚点：Top5 / 构成点击后滚动到这里 */
const detailWrapRef = ref<HTMLElement | null>(null)

/**
 * KPI 环比（当前区间 vs 等长上一窗口）。
 *
 * <p>费用是成本项：涨=坏（红）、跌=好（绿）；Token/请求数是经营量，只标方向不评判。
 * 没有上一窗基数（首次进入 / 全部时间 / 上一窗查询失败）时不显示，宁缺毋假。</p>
 */
function deltaOf(key: string): { text: string; cls: string; title: string } | null {
  const d = board.statDeltas?.[key]
  if (d == null || !Number.isFinite(d)) return null
  const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '→'
  const sign = d > 0 ? '+' : ''
  return {
    text: `${arrow} ${Math.abs(d)}%`,
    cls: key === 'cost' ? (d > 0 ? 'is-bad' : d < 0 ? 'is-good' : 'is-neutral') : 'is-neutral',
    title: `较上一等长区间${sign}${d}%`,
  }
}
/** 模板取值：text 为空即不渲染徽标（避免模板里做非空断言） */
function deltaText(key: string): string { return deltaOf(key)?.text ?? '' }
function deltaCls(key: string): string { return deltaOf(key)?.cls ?? '' }
function deltaTitle(key: string): string { return deltaOf(key)?.title ?? '' }

/**
 * 趋势图点击下钻：按 dataIndex 找回完整日期（小时桶也落回当天），
 * 复用刻度尺的下钻/还原逻辑，不另开一条筛选通道。图例/标注点击不触发。
 */
function onTrendClick(params: any) {
  if (params?.componentType !== 'series') return
  const i = Number(params?.dataIndex)
  if (!Number.isInteger(i) || i < 0 || i >= board.trendData.length) return
  const date = String(board.trendData[i]?.date || '').slice(0, 10)
  if (date) board.selectSpineDay(date)
}

/**
 * 热力图点击下钻：点某格 = 点那一天，复用刻度尺的下钻/还原链路。
 * 图例（色阶）与坐标轴标签点击不触发。
 */
function onHeatmapClick(params: any) {
  const date = board.heatmapCellDate(params)
  if (date) board.selectSpineDay(date)
}

/** Top5 / 构成 → 明细联动：切明细的模型过滤 + 关闭弹层 + 滚动到明细表 */
function jumpToDetail(model?: string | null) {
  if (model) board.selectDetailModel(String(model))
  if (board.treemapDetailVisible) board.treemapDetailVisible = false
  detailWrapRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 趋势图的口径（与 composable 的 trendMetric 一一对应）与说明文案 */
const trendMetrics = [
  { key: 'token', label: 'Token' },
  { key: 'cost', label: '费用' },
  { key: 'calls', label: '请求' },
  { key: 'speed', label: '速度' },
] as const

const trendDesc = computed(() => {
  // 单日下钻时后端把 /trend 切成小时桶，趋势图就是当日 24 小时走势
  if (board.drillDay) return '当日 24 小时走势'
  const map: Record<string, string> = {
    token: '输入 / 输出 / 缓存读取按日走势',
    cost: '每日消费（按各模型费用汇总）',
    calls: '每日请求次数',
    speed: '每日平均解码速率（按 Token 加权）',
  }
  return map[board.trendMetric] ?? ''
})

/** 热力图口径：Token / 请求 / 费用（写入 board.heatmapMetric，option 自动跟随） */
const heatmapMetrics = [
  { key: 'token', label: 'Token' },
  { key: 'calls', label: '请求' },
  { key: 'cost', label: '费用' },
] as const

/** 缓存命中率面板的头部摘要：区间内 命中率 + 缓存读取 token（来自统计快照） */
const cacheSummary = computed(() => {
  const total = Number(board.stats.totalTokens) || 0
  const cached = Number(board.stats.totalCachedTokens) || 0
  return {
    pct: total > 0 ? `${((cached / total) * 100).toFixed(1)}%` : '—',
    cached,
    total,
  }
})

/**
 * Tab 键盘导航（WAI-ARIA Tabs 模式）：←/→/Home/End 在 tab 间移动并激活。
 * 只挂在本次新增的 tablist 上；激活通过点击目标按钮复用既有 @click 逻辑，
 * 不改任何既有 tab 的行为、不引入焦点 roving tabindex 状态，纯增量。
 */
function onTabKeydown(e: KeyboardEvent) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(e.key)) return
  const list = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')
  if (!list.length) return
  const cur = Array.prototype.indexOf.call(list, document.activeElement)
  if (cur < 0) return
  e.preventDefault()
  let next = cur
  if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = list.length - 1
  else if (e.key === 'ArrowLeft') next = (cur - 1 + list.length) % list.length
  else next = (cur + 1) % list.length
  list[next].focus()
  list[next].click()
}

/**
 * 速度榜相对条宽度：以当前榜首（topkRows 已按速度降序）为 100%。
 * 纯视觉编码，数值本身以右侧文字为准；最小 6% 保证末位也能看见一条底衬。
 */
function speedBarPct(speed: number | null | undefined): string {
  const top = board.topkRows.length ? (board.topkRows[0].speed ?? 0) : 0
  const v = Number(speed) || 0
  if (!(top > 0) || !(v > 0)) return '0%'
  return `${Math.max(6, Math.round((v / top) * 100))}%`
}

/** 今天（本地时区），刻度尺上高亮最后一根 */
const todayKey = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

/**
 * 单根刻度的高度百分比。
 *
 * <p>有量的日子至少留 6%，否则「用了一点」和「完全没用」在刻度尺上分不出来；
 * 没量的日子只留 2% 的基线，让时间轴保持连续。</p>
 */
function spineH(tokens: number): string {
  const max = Number(board.spineMax) || 1
  const ratio = Math.max(0, Number(tokens) || 0) / max
  if (!(ratio > 0)) return '2%'
  return `${Math.max(6, Math.round(ratio * 100))}%`
}

/** 刻度标签只标首尾与每 5 天，30 根全标会糊成一片 */
function showTick(i: number): boolean {
  const n = board.spineView.length
  if (!n) return false
  return i === 0 || i === n - 1 || (n - 1 - i) % 5 === 0
}

/**
 * 模型构成面积图。
 *
 * <p>只画一层：模型 = 面积。高度压到 128px 后只给占比 ≥ 3% 的块留标签，
 * 其余块保留面积与 tooltip —— 名字挤在一起比没有名字更糟。</p>
 */
const treemapOption = computed<EChartsOption>(() => {
  const blocks = board.treemapBlocks.blocks
  const metricText = (v: number) =>
    board.modelChartType === 'token' ? board.fmtToken(v) : `${board.currencySymbol}${board.money(v)}`
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
        const total = blocks.reduce((s, b) => s + Number(b.value), 0)
        const pct = total > 0 ? (Number(p.value) / total) * 100 : 0
        return `<span style="font-weight:600">${p.name}</span><br/><b>${metricText(p.value)}</b>&nbsp;&nbsp;<span style="opacity:.6">${pct.toFixed(1)}%</span>`
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        itemStyle: {
          borderColor: 'rgba(255,255,255,0.22)',
          borderWidth: 1,
          gapWidth: 2,
          borderRadius: 6,
        },
        label: {
          show: true,
          formatter: (p: any) => {
            // 128px 高的小块放不下两行字，面积太小的块不进标签
            if (Number(p.percent) < 3) return ''
            const name = String(p.name)
            const cut = name.length > 12 ? `${name.slice(0, 11)}…` : name
            return `{n|${cut}}\n{v|${metricText(p.value)}}`
          },
          rich: {
            n: { fontSize: 11, fontWeight: 600, lineHeight: 14, color: '#1D2129', padding: [4, 6, 1, 6] },
            v: { fontSize: 10, lineHeight: 12, color: '#4A5059', padding: [0, 6, 4, 6] },
          },
        },
        upperLabel: { show: false },
        emphasis: { focus: 'self', itemStyle: { borderColor: 'rgba(255,255,255,0.95)', borderWidth: 2 } },
        blur: { itemStyle: { opacity: 0.18 } },
        data: blocks.map((b) => ({ name: b.name, value: b.value, itemStyle: { color: b.color } })),
      },
    ],
  }
})

interface DerivedReadout {
  key: string
  label: string
  value: string
  hint: string
  tone?: 'good' | 'warn'
}

/**
 * 派生效率读数：把「用了多少」翻译成「贵不贵」。
 *
 * <p>五项都由 {@code stats} 现算，不额外请求接口。分母为 0 时给「—」而不是
 * 0% / 0 元 —— 空区间里 0 是个会骗人的读数。</p>
 */
const derivedReadouts = computed<DerivedReadout[]>(() => {
  const tokens = Number(board.stats.totalTokens) || 0
  const calls = Number(board.stats.totalCalls) || 0
  const cached = Number(board.stats.totalCachedTokens) || 0
  const cost = Number(board.stats.totalCost) || 0
  const standard = Number(board.stats.standardCost) || 0
  const sym = board.currencySymbol

  const perK = tokens > 0 ? (cost / tokens) * 1000 : null
  // 每千 Token 成本通常只有 0.0001~0.01 量级，两位小数会一律显示 ¥0.00
  const perKText = perK === null
    ? '—'
    : Math.abs(perK) < 0.01
      ? `${sym}${perK.toFixed(4)}`
      : `${sym}${board.money(perK)}`

  const cachePct = tokens > 0 ? (cached / tokens) * 100 : null
  const perReq = calls > 0 ? tokens / calls : null
  // 实际消费低于标准价即为节省，高于则是溢价
  const saving = standard - cost
  const savingPct = standard > 0 ? (Math.abs(saving) / standard) * 100 : null

  return [
    {
      key: 'per-k',
      label: '每千 Token 成本',
      value: perKText,
      hint: perK === null ? '暂无消费' : `${sym}${board.money(cost)} / ${board.fmtToken(tokens)}`,
    },
    {
      key: 'cache',
      label: '缓存命中率',
      value: cachePct === null ? '—' : `${cachePct.toFixed(1)}%`,
      hint: cachePct === null ? '暂无 Token' : `读取 ${board.fmtToken(cached)}`,
    },
    {
      key: 'per-request',
      label: '每请求 Token',
      value: perReq === null ? '—' : board.fmtToken(Math.round(perReq)),
      hint: perReq === null ? '暂无请求' : `共 ${board.formatNumber(calls)} 次`,
    },
    {
      key: 'vs-standard',
      label: '相对标准价',
      value: standard <= 0 ? '—' : `${((cost / standard) * 100).toFixed(1)}%`,
      hint: standard <= 0 ? '暂无标准价' : `标准价 ${sym}${board.money(standard)}`,
    },
    {
      key: 'saving',
      label: '节省',
      value: standard <= 0
        ? '—'
        : `${saving >= 0 ? '省' : '超'} ${sym}${board.money(Math.abs(saving))}`,
      hint: savingPct === null
        ? '暂无标准价'
        : `${savingPct.toFixed(1)}% ${saving >= 0 ? '低于' : '高于'}标准`,
      tone: standard <= 0 ? undefined : saving >= 0 ? 'good' : 'warn',
    },
  ]
})

/** 占比条：宽度 + 颜色的单一 style 对象（供「全部模型」列表里的占比格复用） */
function pctStyle(r: any) {
  return {
    width: board.barWidth(board.percentNum(r, board.modelDist, board.modelChartType)),
    background: board.boardColorOf(board.modelBoard, r.name),
  }
}
</script>

<style scoped>
/* ============================================================================
   用量管理 —— 侦察时间轴（04）视觉体系
   骨架：40 顶栏 / 94 刻度尺 / 114 核心读数 / 80 派生读数 / 218 构成 + 趋势 /
   206 分布（两行）+ 每日模型（两列）+ 延迟 / 174 双 Top5 + 实时 / 明细（最低 800px + 剩余高度）。
   全部沿用控制台既有的 --el-* / --u-* 令牌（暗色自动跟随），不新造皮肤。

   <p>2026-11-16：每个卡片块统一长高 50px（原 44/64/30/168/156/124 → 94/114/80/
   218/206/174），明细块 280 → 400；图表高度同步 +50，否则卡片长高只会多出一条空白。</p>
   ============================================================================ */
.usage-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px 12px;
  background: var(--el-bg-color-page, var(--u-page));
}
/* 固定高度的一屏：子块不参与压缩，超出时整页滚动而不是把图表压成一条线 */
.usage-page > * { flex-shrink: 0; }

.usage-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--u-radius, 8px);
}

/* ── 顶栏 ── */
.usage-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  overflow: hidden;
}
.usage-head__lead { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.usage-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.usage-range {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-back {
  appearance: none;
  border: 0;
  padding: 3px 9px;
  border-radius: 6px;
  background: var(--u-primary-weak, rgba(22, 93, 255, 0.08));
  color: var(--u-primary, #165dff);
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-back:hover { background: rgba(22, 93, 255, 0.16); }
.usage-head__tools { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.usage-head__scan {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 34%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--u-primary, #165dff), transparent);
  animation: usage-scan 1.2s linear infinite;
}
@keyframes usage-scan {
  from { transform: translateX(-100%); }
  to { transform: translateX(300%); }
}

.usage-date { width: 208px; }
.usage-icon { color: var(--el-text-color-secondary); }
.usage-icon :deep(.el-icon) { font-size: 15px; }
.usage-icon svg { width: 15px; height: 15px; }

/* 分段控件：紧凑版，面板头里也塞得下 */
.usage-seg {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.usage-seg__btn {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition: color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)),
    background-color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-seg__btn:hover { color: var(--u-primary, #165dff); }
.usage-seg__btn.is-on { background: var(--u-primary, #165dff); color: #fff; font-weight: 600; }
.usage-seg__btn.is-on:hover { color: #fff; }
.usage-seg--sm .usage-seg__btn { padding: 2px 6px; font-size: 10.5px; }

/* ── 刻度尺（30 天主干） ── */
.usage-spine { display: flex; align-items: stretch; gap: 10px; height: 94px; padding: 4px 10px; }
.usage-spine__side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 84px;
  flex-shrink: 0;
  line-height: 1.15;
  min-width: 0;
}
.usage-spine__cap { font-size: 9.5px; color: var(--el-text-color-placeholder); }
.usage-spine__sum {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-spine__unit { font-size: 9px; color: var(--el-text-color-placeholder); }
.usage-spine__track { flex: 1 1 auto; display: flex; align-items: stretch; gap: 2px; min-width: 0; }
.usage-spine__day {
  appearance: none;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.usage-spine__slot {
  flex: 1 1 auto;
  display: flex;
  align-items: flex-end;
  min-height: 0;
  border-radius: 3px 3px 0 0;
  background: var(--el-fill-color-lighter, #f5f6f8);
  overflow: hidden;
}
.usage-spine__bar {
  display: block;
  width: 100%;
  border-radius: 3px 3px 0 0;
  background: var(--u-primary, #165dff);
  opacity: 0.5;
  transition: opacity 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-spine__day:hover .usage-spine__bar { opacity: 0.9; }
.usage-spine__day.is-out .usage-spine__bar { opacity: 0.14; }
.usage-spine__day.is-empty .usage-spine__bar { background: var(--el-text-color-placeholder); opacity: 0.24; }
.usage-spine__day.is-today .usage-spine__slot { background: var(--u-primary-weak, rgba(22, 93, 255, 0.1)); }
.usage-spine__day.is-on .usage-spine__slot {
  background: var(--u-primary-weak, rgba(22, 93, 255, 0.14));
  box-shadow: inset 0 0 0 1px var(--u-primary, #165dff);
}
.usage-spine__day.is-on .usage-spine__bar { opacity: 1; }
.usage-spine__tick {
  height: 10px;
  font-size: 9px;
  line-height: 10px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
}
.usage-spine__back,
.usage-spine__hint {
  align-self: center;
  flex-shrink: 0;
  font-size: 10.5px;
  white-space: nowrap;
  color: var(--el-text-color-placeholder);
}
.usage-spine__back {
  appearance: none;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--u-primary, #165dff);
  padding: 2px 8px;
  border-radius: 5px;
  cursor: pointer;
}
.usage-spine__back:hover { border-color: var(--u-primary, #165dff); }

/* ── 核心读数（四格） ── */
.usage-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; height: 114px; }
.usage-kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: 5px 12px;
  overflow: hidden;
}
.usage-kpi.is-primary { --usage-tone: var(--u-primary, #165dff); }
.usage-kpi.is-info { --usage-tone: var(--status-info, #3b82f6); }
.usage-kpi.is-success { --usage-tone: var(--u-success, #00b42a); }
.usage-kpi.is-warning { --usage-tone: var(--u-warning, #ff7d00); }
.usage-kpi__head { display: flex; align-items: center; gap: 6px; }

/* ── KPI 环比徽标（当前区间 vs 等长上一窗口） ── */
.usage-kpi__delta {
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.2;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.usage-kpi__delta.is-good { color: #2fbf71; background: rgba(47, 191, 113, 0.14); }
.usage-kpi__delta.is-bad { color: #f56c6c; background: rgba(245, 108, 108, 0.14); }
.usage-kpi__delta.is-neutral { color: var(--el-text-color-secondary, #909399); background: var(--el-fill-color, rgba(144, 147, 153, 0.12)); }

/* ── 预算与费用预测（双卡横带） ── */
.usage-budget { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.usage-budget__card { padding: 10px 14px; display: flex; flex-direction: column; gap: 7px; }
.usage-budget__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.usage-budget__title { font-size: 11px; font-weight: 650; color: var(--el-text-color-primary); }
.usage-budget__badge {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color, rgba(144, 147, 153, 0.12));
  white-space: nowrap;
}
.usage-budget__badge.is-success { color: #2fbf71; background: rgba(47, 191, 113, 0.14); }
.usage-budget__badge.is-warning { color: #e6a23c; background: rgba(230, 162, 60, 0.16); }
.usage-budget__badge.is-error { color: #f56c6c; background: rgba(245, 108, 108, 0.16); }
.usage-budget__badge.is-info { color: var(--el-color-primary, #165dff); background: var(--el-color-primary-light-9, rgba(22, 93, 255, 0.1)); }
.usage-budget__bar { height: 6px; border-radius: 999px; background: var(--el-fill-color-light); overflow: hidden; }
.usage-budget__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-success, #2fbf71);
  transition: width 0.35s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-budget__fill.is-warning { background: #e6a23c; }
.usage-budget__fill.is-error { background: #f56c6c; }
.usage-budget__fill.is-info { background: var(--el-fill-color-dark, #909399); }
.usage-budget__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.usage-budget__pct { font-weight: 650; color: var(--el-text-color-primary); }
.usage-budget__forecast { display: flex; align-items: baseline; gap: 8px; min-height: 6px; }
.usage-budget__forecast-num {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.usage-budget__forecast-hint { font-size: 10.5px; color: var(--el-text-color-placeholder); }
.usage-budget__windows { display: flex; gap: 16px; font-size: 10.5px; color: var(--el-text-color-secondary); }
.usage-budget__windows b { font-weight: 650; color: var(--el-text-color-primary); }

/* 预算阈值横幅：页内提示条，随预算档位变色（≥80% 预警 / ≥100% 超支） */
.usage-budget-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px; margin-bottom: 8px;
  border-radius: var(--el-border-radius-base, 6px); font-size: 12px;
}
.usage-budget-banner.is-warning { color: #e6a23c; background: rgba(230, 162, 60, 0.12); border: 1px solid rgba(230, 162, 60, 0.35); }
.usage-budget-banner.is-error { color: #f56c6c; background: rgba(245, 108, 108, 0.12); border: 1px solid rgba(245, 108, 108, 0.35); }
.usage-budget-banner__dot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.usage-budget-banner__text { font-weight: 600; }

/* ── 失败请求分析 ── */
.usage-fail__loss {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── Top5 → 明细联动：模型名可点 ── */
.usage-rank__name.is-link { cursor: pointer; }
.usage-rank__name.is-link:hover { text-decoration: underline; color: var(--u-primary, #165dff); }
.usage-kpi__mark { width: 6px; height: 6px; flex-shrink: 0; border-radius: 2px; background: var(--usage-tone); }
.usage-kpi__label { font-size: 11px; font-weight: 500; color: var(--el-text-color-secondary); white-space: nowrap; }
.usage-kpi__value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-kpi__unit { margin-left: 4px; font-size: 10px; font-weight: 500; color: var(--el-text-color-placeholder); }
.usage-kpi__sub {
  font-size: 10px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-kpi.has-ring .usage-kpi__sub { padding-right: 58px; }
.usage-kpi__ring { position: absolute; right: 8px; bottom: 2px; pointer-events: none; opacity: 0.9; }
/* 请求/费用/耗时三卡的静态走势小图：比迷你环更宽，副行给它们让位 */
.usage-kpi__ring--spark { right: 10px; bottom: 5px; opacity: 0.85; }
.usage-kpi.has-spark .usage-kpi__sub { padding-right: 100px; }

/* ── 派生读数（五格横带） ── */
.usage-deriv {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  height: 80px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}
.usage-deriv__item {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
  padding: 0 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.usage-deriv__item:first-child { border-left: 0; }
.usage-deriv__label { font-size: 10px; color: var(--el-text-color-placeholder); white-space: nowrap; flex-shrink: 0; }
.usage-deriv__value {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.usage-deriv__value.is-good { color: var(--u-success, #00b42a); }
.usage-deriv__value.is-warn { color: var(--u-warning, #ff7d00); }
.usage-deriv__hint {
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* ── 用量构成（按调用类型：对话 / 工具 / 记忆 / 外部） ── */
.usage-calltype { padding: 8px 12px 10px; }
.usage-calltype__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.usage-calltype__hint {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
.usage-calltype__list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.usage-calltype__row {
  display: grid;
  grid-template-columns: 8px 44px minmax(60px, 1fr) 52px 84px 68px 84px;
  align-items: center;
  gap: 8px;
  height: 24px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}
.usage-calltype__dot { width: 8px; height: 8px; border-radius: 2px; }
.usage-calltype__name { font-weight: 600; color: var(--el-text-color-primary); }
.usage-calltype__bar {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.usage-calltype__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.usage-calltype__pct { text-align: right; color: var(--el-text-color-secondary); }
.usage-calltype__num { text-align: right; white-space: nowrap; }

/* ── TopK 速度榜：模型 / 供应商 / Agent ── */
.usage-speed { padding: 6px 10px 8px; }
.usage-speed__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 26px;
  padding: 2px 2px 4px;
}
.usage-speed__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.usage-speed__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  position: relative;
  overflow: hidden;
  padding: 5px 8px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}
.usage-speed__row:hover { background: var(--el-fill-color-light); }
/* 相对速度条：贴在行底的低透明度底衬，宽度=本行速度/榜首。
   纯装饰、不承载读数；isolation 保证它压在文字之下，不抢可读性。 */
.usage-speed__bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  opacity: 0.32;
  border-radius: 0 2px 2px 0;
  pointer-events: none;
  transition: width 0.25s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)), opacity 0.15s ease;
}
.usage-speed__row:hover .usage-speed__bar { opacity: 0.55; }
.usage-speed__dot,
.usage-speed__main,
.usage-speed__rank { position: relative; z-index: 1; }
.usage-speed__dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.usage-speed__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.usage-speed__title { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.usage-speed__name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.usage-speed__rate {
  font-size: 12px;
  font-weight: 650;
  color: var(--u-primary, #165dff);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.usage-speed__ticks { font-size: 10.5px; color: var(--el-text-color-placeholder); flex-shrink: 0; }
.usage-speed__sub {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-speed__na { color: var(--el-text-color-placeholder); cursor: help; }
.usage-speed__rank {
  width: 18px;
  flex-shrink: 0;
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
/* 前三名名次用主色点亮，强化「榜」的语义 */
.usage-speed__row:nth-child(-n+3) .usage-speed__rank { color: var(--u-primary, #165dff); }
.usage-speed__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ── 用量热力图 ── */
.usage-heat__body { padding: 0 8px 8px; min-height: 204px; }

/* 缓存率图：空态 el-empty 与 132px 图表两态等高，数据异步到达时不跳版。
   只作用于本面板（子 .usage-empty--sm 已有 height:100% 会填满），
   不改共用的 --tight 规则、不波及既有图表。 */
.usage-cache__chart { min-height: 140px; }

/* 新增区块的动效降级：全局 tokens.css 只收敛 animation-*，这里补齐 transition-*。
   仅作用于本次新增的 speed/heat/cache 面板，不改动既有区块与全局规则。 */
@media (prefers-reduced-motion: reduce) {
  .usage-speed__row,
  .usage-speed__bar,
  .usage-seg__btn { transition: none; }
}

/* ── 面板通用 ── */
.usage-panel { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.usage-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 26px;
  padding: 5px 10px 3px;
}
.usage-panel__title-wrap { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.usage-panel__title {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.usage-panel__meta {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.usage-panel__tools { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.usage-panel__chart { min-width: 0; padding: 0 8px 6px; }
.usage-panel__chart--tight { padding: 0 6px 4px; }
.usage-link { color: var(--u-primary, #165dff); cursor: pointer; }
.usage-link:hover { text-decoration: underline; }
.usage-empty { display: flex; align-items: center; justify-content: center; min-height: 120px; }
.usage-empty--sm { min-height: 0; height: 100%; }
.usage-empty--sm :deep(.el-empty) { padding: 0; }
.usage-empty--sm :deep(.el-empty__image) { width: 40px; }
.usage-empty--sm :deep(.el-empty__description p) { margin: 4px 0 0; font-size: 11px; }

/* ── 整页空态：当前区间没有用量时，不铺一整面 0 和空图，收敛成一块引导面板 ── */
.usage-page > .usage-page__empty {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.usage-page__empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  max-width: 420px;
}
.usage-page__empty-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: var(--u-primary, #165dff);
  background: var(--u-primary-weak, rgba(22, 93, 255, 0.1));
}
.usage-page__empty-ico svg { width: 26px; height: 26px; }
.usage-page__empty-title {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}
.usage-page__empty-desc {
  margin: 0;
  max-width: 380px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.usage-page__empty-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

/* ── 构成 + 趋势 ── */
.usage-mid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.14fr); gap: 8px; height: 218px; }

/* ── 分布 + 每日模型 + 延迟 ── */
.usage-triple {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(0, 1fr) minmax(0, 0.94fr);
  gap: 8px;
  height: 206px;
}
/*
 * 分布占左列两行，每日模型横跨右侧两列，延迟落在右下、同样横跨两列：
 * 分布是逐项列表（项数多、要滚动），给它整列高度才看得全；
 * 每日模型是堆叠柱，横向越宽日期越不挤。
 * 两行等高（202px），正好容纳 27 抬头 + 168 图表 + 4 内边距 + 余量。
 */
.usage-triple--dist {
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr) minmax(0, 0.98fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  height: 412px;
}
.usage-triple--dist > :nth-child(1) { grid-column: 1; grid-row: 1 / span 2; }
.usage-triple--dist > :nth-child(2) { grid-column: 2 / span 2; grid-row: 1; }
.usage-triple--dist > :nth-child(3) { grid-column: 2 / span 2; grid-row: 2; }
/*
 * 窄屏降级：三列时分布卡只剩 ~285px，扣掉固定的四列数字（44+50+58+64）后
 * 名称列不足一个字，模型名被截成 "n…"。视口 1460px 以下改为
 * 「分布横跨两列占第一行 + 每日模型/延迟在第二行各占一列」，
 * 分布拿回整行宽度，两张图仍等分下方。行高沿用 206px，与左侧单卡等高。
 */
@media (max-width: 1460px) {
  .usage-triple--dist {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: 206px 206px;
    height: auto;
  }
  .usage-triple--dist > :nth-child(1) { grid-column: 1 / span 2; grid-row: 1; }
  .usage-triple--dist > :nth-child(2) { grid-column: 1; grid-row: 2; }
  .usage-triple--dist > :nth-child(3) { grid-column: 2; grid-row: 2; }
}
.usage-triple--ranks {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.84fr);
  height: 174px;
}

.usage-dist__headrow,
.usage-dist__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px 50px 58px 64px;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
}
.usage-dist__headrow {
  height: 16px;
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
  text-align: right;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.usage-dist__headrow .usage-dist__c-name { text-align: left; }
.usage-dist__list {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
}
.usage-dist__row {
  height: 19px;
  font-size: 11px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f2f3f5);
}
.usage-dist__row:hover { background: var(--el-fill-color-light); }
.usage-dist__c-name { display: flex; align-items: center; gap: 5px; min-width: 0; text-align: left; }
.usage-dist__dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 2px; }
.usage-dist__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-primary); }
.usage-dist__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}
.usage-dist__c-pct { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.usage-dist__track {
  flex: 0 1 24px;
  height: 4px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.usage-dist__fill { display: block; height: 100%; border-radius: 999px; }
.usage-dist__c-pct b {
  min-width: 30px;
  text-align: right;
  font-size: 10px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.usage-dist__empty { padding: 10px; text-align: center; font-size: 11px; color: var(--el-text-color-placeholder); }

/* ── 双 Top5 ── */
.usage-ranks__list {
  list-style: none;
  margin: 0;
  padding: 1px 10px 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 0;
  overflow-y: auto;
}
.usage-rank { display: flex; align-items: center; gap: 6px; height: 16px; font-size: 11px; }
.usage-rank__no {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.usage-rank__no.is-1 { color: #fff; background: #e6a23c; }
.usage-rank__no.is-2 { color: #fff; background: #909399; }
.usage-rank__no.is-3 { color: #fff; background: #b5a08a; }
.usage-rank__name {
  flex: 0 0 30%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}
.usage-rank__bar {
  flex: 1 1 auto;
  min-width: 30px;
  height: 4px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.usage-rank__bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--u-primary, #165dff);
  transition: width 0.25s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-rank__value {
  flex: 0 0 auto;
  min-width: 50px;
  text-align: right;
  font-size: 10.5px;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.usage-rank__pct {
  flex: 0 0 auto;
  min-width: 36px;
  text-align: right;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.usage-ranks__empty { padding: 8px 10px; font-size: 11px; color: var(--el-text-color-placeholder); }

/* ── 实时用量卡 ── */
.usage-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 2px 0 7px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 10.5px;
  color: var(--el-text-color-regular);
}
.usage-live__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--u-success, #00b42a);
}
.usage-live.is-connecting .usage-live__dot { background: var(--u-warning, #ff7d00); animation: usage-blink 1.1s ease-in-out infinite; }
.usage-live.is-paused .usage-live__dot { background: var(--el-text-color-placeholder); }
.usage-live.is-error .usage-live__dot { background: var(--u-danger, #f53f3f); }
.usage-live__label { white-space: nowrap; }
.usage-live__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.usage-live__toggle:hover { background: var(--el-fill-color); color: var(--u-primary, #165dff); }
.usage-live__toggle svg { width: 11px; height: 11px; }
@keyframes usage-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.usage-live__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 2px 10px 0; }
.usage-live__stat { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.usage-live__k { font-size: 9.5px; color: var(--el-text-color-placeholder); }
.usage-live__v {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-live__v.is-rate { color: var(--u-primary, #165dff); }
.usage-live__hint { margin: 4px 10px 0; font-size: 9.5px; color: var(--el-text-color-placeholder); }

/* ── 明细：最低 800px（表头 + 十余行 + 分页条都在卡片内），父级有富余时继续长高；
      表体内部滚动 ── */
.usage-detail-wrap { display: flex; flex: 1 1 800px; min-height: 800px; min-width: 0; }
.usage-detail-wrap > * { flex: 1 1 auto; min-width: 0; }
.usage-detail-wrap :deep(.ud-head) { padding: 5px 10px 3px; }
.usage-detail-wrap :deep(.ud-title) { font-size: 13px; }
.usage-detail-wrap :deep(.ud-hint) { font-size: 10px; }
.usage-detail-wrap :deep(.ud-filter) { width: 140px; }
.usage-detail-wrap :deep(.ud-body) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 0 2px;
}
.usage-detail-wrap :deep(.ud-body > *) { flex: 1 1 auto; min-height: 0; }

/* 窄屏：派生读数只留标签与值，刻度尺右侧提示让位给刻度 */
@media (max-width: 1180px) {
  .usage-deriv__hint { display: none; }
  .usage-spine__side { width: 70px; }
  .usage-head__tools { gap: 6px; }
  .usage-speed__list { grid-template-columns: 1fr; }
}
/* ── 色块详情弹窗：模型级指标或汇总块的成员名单 ── */
.usage-treemap-detail { padding: 4px 0 0; }
.usage-treemap-detail__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 12px;
  margin-bottom: 14px;
  padding: 0 2px;
}
.usage-treemap-detail__name {
  font-size: 15px;
  font-weight: 650;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-treemap-detail__pct {
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}
.usage-treemap-detail__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.usage-treemap-detail__metric-label {
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
  margin-bottom: 3px;
}
.usage-treemap-detail__metric-value {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.usage-treemap-detail__cost {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 10px;
  margin-bottom: 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.usage-treemap-detail__cost-label { font-size: 11.5px; color: var(--el-text-color-placeholder); }
.usage-treemap-detail__cost-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-danger, #cf3a2a);
  font-variant-numeric: tabular-nums;
}
.usage-treemap-detail__members { max-height: 260px; overflow-y: auto; }
.usage-treemap-detail__members-title {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 6px;
  padding-left: 2px;
}
.usage-treemap-detail__member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0 10px;
  padding: 5px 2px;
  font-size: 12px;
  line-height: 1.5;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f2f3f5);
}
.usage-treemap-detail__member:last-child { border-bottom: 0; }
.usage-treemap-detail__member-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}
.usage-treemap-detail__member-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

/* ── 全部模型弹窗 ── */
.usage-treemap-all { max-height: 62vh; overflow-y: auto; }
.usage-treemap-all__table { width: 100%; border-collapse: collapse; font-size: 12px; }
.usage-treemap-all__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 8px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.usage-treemap-all__table tbody td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f2f3f5);
  color: var(--el-text-color-primary);
}
.usage-treemap-all__table tbody tr:hover td { background: var(--el-fill-color-light); }
.usage-treemap-all__name { text-align: left; }
.usage-treemap-all__dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 2px;
  vertical-align: middle;
}
.usage-treemap-all__name-text {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.usage-treemap-all__num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.usage-treemap-all__table .usage-pct__track {
  display: inline-flex;
  width: 40px;
  height: 4px;
  margin-right: 6px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
  vertical-align: middle;
}
.usage-treemap-all__table .usage-pct__fill { display: block; height: 100%; border-radius: 999px; }
.usage-treemap-all--empty { padding: 24px 0; }

/* 复合占比条（明细里的小格子沿用原有观感） */
.usage-pct { display: flex; align-items: center; gap: 8px; }
.usage-pct__track {
  flex: 1 1 auto;
  min-width: 30px;
  height: 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.usage-pct__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-pct__text {
  flex: 0 0 auto;
  min-width: 42px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
