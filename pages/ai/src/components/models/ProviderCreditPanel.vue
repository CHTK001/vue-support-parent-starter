<template>
  <!--
    吸底条（模型管理 07 版式）：整块常驻在模型区底部，一行放完「汇总 + 每个 Key」。
    多 Key 详情卡在页面里滚走时余额就看不见了，所以这里不再是一张卡，
    而是贴住右栏底边的一条状态栏 —— 滚多少模型它都在。
  -->
  <div class="pc-host">
  <section v-if="compact" class="pc-bar" :class="{ 'is-loading': loading }">
    <!-- 整条余额栏就是展开开关：点下方任意位置（标题 / 汇总 / Key 胶囊）直接展开 / 收起详情卡 -->
    <div
      class="pc-bar__main"
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      :aria-controls="compact ? 'pc-detail-pop' : undefined"
      @click="expanded = !expanded"
      @keydown.enter.prevent="expanded = !expanded"
      @keydown.space.prevent="expanded = !expanded"
    >
      <span class="pc-bar__title">
        余额与用量
        <!-- 余额低量告警徽标：后端按 extra.credit_warn_threshold 判定，触发时整条栏上可见 -->
        <span
          v-if="warnTriggered"
          class="pc-bar__warn"
          role="button"
          tabindex="0"
          title="余额已低于告警阈值，点这里查看 / 修改告警设置"
          @click.stop="openAlertFromBar"
          @keydown.enter.stop.prevent="openAlertFromBar"
          @keydown.space.stop.prevent="openAlertFromBar"
        >低于阈值</span>
        <svg
          class="pc-bar__chev"
          :class="{ 'is-open': expanded }"
          viewBox="0 0 10 6"
          width="10"
          height="6"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span v-if="kindLabel" class="pc-kind">{{ kindLabel }}</span>
      <span v-if="levelLabel" class="pc-level" :title="levelHint">{{ levelLabel }}</span>
      <span v-if="rows.length" class="pc-scope">{{ rows.length }} 个 Key</span>
      <span v-if="cacheText" class="pc-cache" :title="cacheTitle">{{ cacheText }}</span>

      <span
        v-for="t in totals"
        :key="t.currency || 'unknown'"
        class="pc-bar__total"
        :class="toneClass(t.percent)"
        :title="t.title"
      >
        <span class="pc-bar__label">总余额</span>
        <span class="pc-bar__value">{{ t.text }}</span>
        <span
          v-if="t.percent !== null"
          class="pc-bar__bar"
          role="progressbar"
          :aria-valuenow="t.percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ><i :style="{ width: t.percent + '%' }" /></span>
        <span v-if="t.percent !== null" class="pc-bar__pct">{{ t.percent }}%</span>
        <span v-if="t.counted > 1" class="pc-bar__scope">{{ t.counted }} 个 Key 合计</span>
      </span>

      <!-- 每个 Key 一枚小胶囊：够看清「哪个 Key 快见底」，明细点这行余额栏浮出详情卡看 -->
      <span
        v-for="row in rowsView"
        :key="row.index"
        class="pc-bar__key"
        :class="[{ 'is-bad': !row.ok }, toneClass(row.ok ? row.percent : null)]"
        :title="pillTitle(row)"
      >
        <span class="pc-bar__mask">{{ row.mask }}</span>
        <b v-if="row.ok && row.percent !== null">{{ row.percent }}%</b>
        <b v-else>—</b>
      </span>

      <span v-if="error" class="pc-bar__err" :title="error">{{ error }}</span>
      <span v-else-if="!rows.length" class="pc-bar__err">
        {{ loading ? '正在查询余额…' : '没有可查的 Key' }}
      </span>
      <!-- 全部 Key 都没查到数：把自动识别试过哪几条口径摆出来（单条失败原因在胶囊的 tooltip 里） -->
      <span v-else-if="!anyOk && attempted" class="pc-bar__chain" :title="firstError">
        已尝试：{{ attempted }}
      </span>

      <!-- .stop：刷新只刷新，不触发整条栏的展开 / 收起 -->
      <button class="pc-reload pc-bar__reload" type="button" :disabled="loading" @click.stop="load(true)" @keydown.stop>
        {{ loading ? '查询中…' : '刷新' }}
      </button>
    </div>
  </section>

  <section
    v-if="detailVisible"
    :id="compact ? 'pc-detail-pop' : undefined"
    class="pc"
    :class="{ 'is-pinned': pinned && !compact, 'is-pop': compact, 'is-loading': loading }"
  >
    <header class="pc-head">
      <div class="pc-head-main">
        <span class="pc-title">余额与用量</span>
        <!-- 口径写在屏上：这里是「N 个 Key 汇总」，卡片是「单个 Key」，两个数字本来就不会相等 -->
        <span v-if="kindLabel" class="pc-kind">{{ kindLabel }}</span>
        <span v-if="levelLabel" class="pc-level" :title="levelHint">{{ levelLabel }}</span>
        <span v-if="rows.length" class="pc-scope">{{ rows.length }} 个 Key</span>
        <span v-if="cacheText" class="pc-cache" :title="cacheTitle">{{ cacheText }}</span>
        <!-- 余额低量告警徽标：后端按 extra.credit_warn_threshold 实时判定，触发时详情卡头部可见；点开告警设置浮层 -->
        <span
          v-if="warnTriggered"
          class="pc-warn-badge"
          role="button"
          tabindex="0"
          title="查看 / 修改告警设置"
          @click="openAlertSettings"
          @keydown.enter.prevent="openAlertSettings"
          @keydown.space.prevent="openAlertSettings"
        >低于告警阈值</span>
      </div>
      <button class="pc-reload" type="button" :disabled="loading" @click="load(true)">
        {{ loading ? '查询中…' : '刷新' }}
      </button>
    </header>

    <!--
      顶部汇总：剩余 / 总量 + 64×5 进度条 + 百分比。
      没有总量（上游只给余额）时退化成数字，不画 0% 的条。
    -->
    <div v-if="totals.length" class="pc-total">
      <div v-for="t in totals" :key="t.currency || 'unknown'" class="pc-total__item" :title="t.title">
        <span class="pc-total__label">总余额</span>
        <span class="pc-total__value">{{ t.text }}</span>
        <span
          v-if="t.percent !== null"
          class="pc-total__bar"
          :class="toneClass(t.percent)"
          role="progressbar"
          :aria-valuenow="t.percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ><i :style="{ width: t.percent + '%' }" /></span>
        <span v-if="t.percent !== null" class="pc-total__pct">{{ t.percent }}%</span>
        <span v-if="t.counted > 1" class="pc-total__scope">{{ t.counted }} 个 Key 合计</span>
      </div>
    </div>

    <!--
      余额走势（近 7 天）：每次回源追加一行历史，按回源时刻聚合各 Key 剩余画迷你折线。
      渐变面积垫出体量感，末点标注最新余额；悬停读数与末点用 HTML 百分比定位，
      与 preserveAspectRatio="none" 的横向拉伸坐标保持一致。
    -->
    <div v-if="trend.length >= 2" class="pc-trend">
      <span class="pc-trend__label">
        余额走势 · 近 {{ trendDays }} 天
        <b v-if="trendDeltaText" class="pc-trend__delta">{{ trendDeltaText }}</b>
        <!-- 消耗速率外推：按当前窗口首尾斜率估「还能用几天」；余额持平/净增加（充值）时不显示 -->
        <b v-if="burnText" class="pc-trend__burn" :title="burnTitle">{{ burnText }}</b>
      </span>
      <!-- 时间窗切换：切窗即按新窗口重拉历史（后端 days 夹取 1~90） -->
      <span class="pc-trend__seg" role="group" aria-label="走势时间窗">
        <button
          v-for="d in TREND_WINDOWS"
          :key="d"
          type="button"
          class="pc-trend__seg-btn"
          :class="{ 'is-active': trendDays === d }"
          :aria-pressed="trendDays === d"
          @click="setTrendWindow(d)"
        >{{ d }}天</button>
      </span>
      <!-- 导出当前窗口余额历史（含逐 Key 读数），便于线下对账 -->
      <button class="pc-trend__export" type="button" :disabled="!history.length" @click="exportHistoryCsv">导出 CSV</button>
      <div
        class="pc-trend__plot"
        tabindex="0"
        :aria-label="`余额走势：近 ${trendDays} 天 ${trend.length} 个读数点，左右方向键逐点查看读数，Esc 退出`"
        @mousemove="onTrendMove"
        @mouseleave="onTrendLeave"
        @focus="onTrendFocus"
        @blur="onTrendBlur"
        @keydown="onTrendKeydown"
      >
        <svg
          class="pc-trend__line"
          :viewBox="`0 0 ${TREND_W} ${TREND_H}`"
          preserveAspectRatio="none"
          role="img"
          :aria-label="`近 ${trendDays} 天余额走势，${trend.length} 个读数点`"
        >
          <defs>
            <linearGradient :id="trendGradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.26" />
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <path :d="trendAreaPath" :fill="`url(#${trendGradId})`" stroke="none" />
          <!-- 多 Key 分线：每个 Key 一条淡线（时间定标），总量主线保持最醒目 -->
          <path
            v-for="kl in trendKeyLines"
            :key="`kline-${kl.mask}`"
            :d="kl.path"
            fill="none"
            :stroke="kl.color"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.5"
          />
          <path :d="trendPath" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <!-- y 轴参考：顶 / 半程 / 零三条淡网格线 + 数值刻度（HTML 定位，避免 viewBox 拉伸把文字压扁） -->
        <span v-for="g in trendGrid" :key="`grid-${g.key}`" class="pc-trend__grid" :style="{ top: g.top }" aria-hidden="true"></span>
        <span v-for="g in trendGrid" :key="`tick-${g.key}`" class="pc-trend__tick" :style="{ top: g.top }">{{ g.text }}</span>
        <span class="pc-trend__dot" :style="trendLastStyle" aria-hidden="true"></span>
        <span v-if="trendTip" class="pc-trend__tip" :style="trendTip.style">{{ trendTip.text }}</span>
        <!-- 读数竖线：悬停 / 键盘焦点所在的采样点，配合读数快速对位 -->
        <span v-if="cursorLeft" class="pc-trend__cursor" :style="{ left: cursorLeft }" aria-hidden="true"></span>
        <!-- 失败回源断点：窗口内回源失败的时点在底缘标红点，解释折线缺口从哪来 -->
        <span
          v-for="(f, fi) in trendFailMarks"
          :key="`fm-${fi}`"
          class="pc-trend__fail"
          :style="{ left: f.left }"
          :title="f.text"
        ></span>
      </div>
      <span class="pc-trend__range">{{ trendRangeText }}</span>
    </div>
    <div v-else-if="!loading" class="pc-trend-empty">
      <span>暂无足够历史数据——余额每次刷新后开始积累走势</span>
      <button class="pc-trend-empty__refresh" type="button" title="强制回源刷新一次余额，并追加一条走势读数" @click="refreshTrend">立即刷新</button>
    </div>
    <!-- 加载骨架屏：历史首拉期间占位，避免走势区空白跳变 -->
    <div v-else class="pc-trend-skeleton" aria-hidden="true">
      <span class="pc-trend-skeleton__line"></span>
      <span class="pc-trend-skeleton__line is-short"></span>
    </div>
    <!-- 多 Key 分线图例：色点对线，掩码超长省略；单 Key 不画分线也就无图例 -->
    <div v-if="trendKeyLines.length" class="pc-trend-legend">
      <span v-for="kl in trendKeyLines" :key="`lg-${kl.mask}`" class="pc-trend-legend-item" :title="`Key ${kl.mask}`">
        <i :style="{ background: kl.color }" aria-hidden="true"></i>{{ kl.mask }}
      </span>
    </div>
    <!-- 预测性低量提醒：按日均消耗外推跌破阈值时点；阈值未知 / 已触发 / 一个月开外时不提示 -->
    <p v-if="creditForecast" class="pc-trend-forecast" :class="{ 'is-urgent': creditForecast.urgent }" :title="creditForecast.title">
      {{ creditForecast.text }}
    </p>
    <!-- 消耗统计：从当前窗口走势聚合，跟随时间窗换算；两项都算不出时不显示 -->
    <div v-if="trendStats.length" class="pc-trend-stats">
      <span v-for="s in trendStats" :key="s.label" class="pc-trend-stat" :title="s.title">
        <i>{{ s.label }}</i>
        <b>{{ s.value }}</b>
      </span>
    </div>
    <!-- 定时采样可观测：走势由后台时间轮定时喂，把采样任务的运行状态写在屏上 -->
    <p v-if="sampleText" class="pc-sample" title="后台余额定时刷新的运行状态">定时采样：{{ sampleText }}</p>

    <!--
      用量归因：窗口内余额消耗的两个维度——按 Key（余额读数差分，精确归因）与
      按模型（用量日汇总，只统计本渠道模型清单内的模型）。默认收起，展开才拉数据；
      归因是分析型信息，不与余额主链路抢加载。
    -->
    <div class="pc-attr">
      <div class="pc-attr__head">
        <span class="pc-attr__label">用量归因 · 近 {{ attributionDays }} 天</span>
        <span class="pc-trend__seg" role="group" aria-label="归因时间窗">
          <button
            v-for="d in ATTRIBUTION_WINDOWS"
            :key="d"
            type="button"
            class="pc-trend__seg-btn"
            :class="{ 'is-active': attributionDays === d }"
            :aria-pressed="attributionDays === d"
            @click="setAttributionWindow(d)"
          >{{ d }}天</button>
        </span>
        <button class="pc-trend__export" type="button" :disabled="attributionLoading" @click="loadAttribution(true)">
          {{ attributionLoading ? '统计中…' : '刷新' }}
        </button>
        <button class="pc-attr__toggle" type="button" :aria-expanded="attrOpen" @click="toggleAttribution">
          {{ attrOpen ? '收起' : '展开' }}
        </button>
      </div>
      <template v-if="attrOpen">
        <p v-if="attributionLoading && !attribution" class="pc-attr__hint">正在统计窗口内消耗…</p>
        <p v-else-if="attributionError" class="pc-attr__hint is-err">{{ attributionError }}</p>
        <template v-else-if="attribution">
          <p v-if="!attribution.keys.length && !attribution.models.length" class="pc-attr__hint">
            窗口内暂无余额读数或用量记录
          </p>
          <template v-else>
            <!-- 耗尽预测：由本窗口归因数据线性外推，纯前端估算，不另发请求 -->
            <p v-if="attrForecast" class="pc-attr__forecast" :title="attrForecastTitle">
              <span class="pc-attr__forecast-label">耗尽预测</span>
              <template v-if="attrForecast.burn > 0">
                <span>
                  当前余额合计 <b>{{ money(attrForecast.remain) }}</b>，按近 {{ attributionDays }} 天日均
                  {{ money(attrForecast.burn) }} 消耗，预计 <b>{{ attrDaysLeftText(attrForecast.daysLeft) }}</b>后耗尽<template v-if="attrForecast.dateText">（约 {{ attrForecast.dateText }}）</template>
                </span>
              </template>
              <span v-else>窗口内无净消耗，暂无耗尽风险（当前余额合计 {{ money(attrForecast.remain) }}）</span>
            </p>
            <div v-if="attribution.keys.length" class="pc-attr__sec">
              <span class="pc-attr__sec-label" title="按窗口内逐 Key 的期初/期末成功读数差分：消耗 = 期初 − 期末，正数表示余额增加（充值）">
                按 Key · 余额读数差分
              </span>
              <div class="pc-attr__table is-keys" role="table" aria-label="按 Key 的余额消耗归因">
                <div class="pc-attr__row is-head" role="row">
                  <span role="columnheader">Key</span>
                  <span role="columnheader">读数</span>
                  <span role="columnheader">期初 → 期末</span>
                  <span role="columnheader">消耗</span>
                  <span role="columnheader">币种</span>
                  <span role="columnheader" title="按该 Key 窗口内读数差分线性外推的可用天数；充值后以最新读数为准">预计可用</span>
                </div>
                <div
                  v-for="k in attribution.keys"
                  :key="k.key_mask"
                  class="pc-attr__row"
                  role="row"
                  :title="attrKeyTitle(k)"
                >
                  <span role="cell" class="pc-attr__mask" :title="k.key_mask">{{ k.key_mask }}</span>
                  <span role="cell">{{ k.samples }}</span>
                  <span role="cell">{{ attrRangeText(k) }}</span>
                  <span role="cell" class="pc-attr__consumed" :class="attrConsumedTone(k)">
                    {{ attrConsumedText(k) }}<i v-if="attrIsRecharge(k)">充值</i>
                  </span>
                  <span role="cell">{{ k.currency || '—' }}</span>
                  <span role="cell" class="pc-attr__forecast-cell" :class="attrKeyForecastTone(k)">{{ attrKeyForecastText(k) }}</span>
                </div>
              </div>
            </div>
            <div v-if="attribution.models.length" class="pc-attr__sec">
              <span class="pc-attr__sec-label" :title="attrModelTitle">按模型 · 用量日汇总</span>
              <div class="pc-attr__table is-models" role="table" aria-label="按模型的余额消耗归因">
                <div class="pc-attr__row is-head" role="row">
                  <span role="columnheader">模型</span>
                  <span role="columnheader">调用</span>
                  <span role="columnheader">Tokens</span>
                  <span role="columnheader">成本(元)</span>
                </div>
                <div
                  v-for="m in attribution.models"
                  :key="m.model"
                  class="pc-attr__row"
                  role="row"
                  :title="attrModelRowTitle(m)"
                >
                  <span role="cell" class="pc-attr__mask" :title="m.model">{{ m.model }}</span>
                  <span role="cell">{{ m.calls }}</span>
                  <span role="cell" :title="`输入 ${m.prompt_tokens} / 输出 ${m.completion_tokens}`">{{ m.total_tokens }}</span>
                  <span role="cell" class="pc-attr__cost">{{ money(m.cost) }}</span>
                </div>
              </div>
            </div>
            <p v-if="attribution.model_note" class="pc-attr__note">{{ attribution.model_note }}</p>
          </template>
        </template>
      </template>
    </div>

    <p v-if="error" class="pc-error">{{ error }}</p>
    <p v-if="!loading && !anyOk && attempted" class="pc-chain">已尝试：{{ attempted }}</p>

    <div v-if="!rows.length" class="pc-empty">
      {{ loading ? '正在查询余额…' : (error ? '这次没查到读数' : '没有可查的 Key。') }}
    </div>

    <!-- 一行两个 Key（容器窄于 860px 时自动退回一列，和渠道管理页同口径） -->
    <div v-else class="pc-list">
      <!-- 只看低量：多 Key 供应商快速定位「哪个 Key 快见底」；开关只影响详情卡片，不影响吸底条 -->
      <label class="pc-low-toggle" title="只显示低于告警档的 Key（后端给了告警阈值按阈值判，否则按剩余 ≤20% 判）">
        <input v-model="lowOnly" type="checkbox" />
        <span>只看低量</span>
      </label>
      <template v-if="rowsShown.length">
        <article
          v-for="row in rowsShown"
          :key="row.index"
          class="pc-card"
          :class="{ 'is-bad': !row.ok }"
        >
        <div class="pc-card__top">
          <span class="pc-card__mask" :title="row.mask">{{ row.mask }}</span>
          <span v-if="row.source" class="pc-card__src">{{ sourceLabel(row.source) }}</span>
          <!-- 余额令牌（JWT）到期徽章：临期提醒续票（商汤等令牌只有几小时有效期） -->
          <span
            v-if="row.expiry && row.expiry.at !== null"
            class="pc-card__exp"
            :class="`is-${row.expiry.tone}`"
            :title="tokenExpiryTitle(row)"
          >{{ row.expiry.text }}</span>
          <span
            v-if="row.ok && row.percent !== null"
            class="pc-card__pct"
            :class="toneClass(row.percent)"
          >剩余 {{ row.percent }}%</span>
          <!-- 较上一采样点的余额变化：↑ 增 / ↓ 减 / — 持平（±0.005 以内按持平处理） -->
          <span
            v-if="row.delta !== null && row.delta !== undefined"
            class="pc-card__delta"
            :class="row.delta > 0.005 ? 'is-up' : row.delta < -0.005 ? 'is-down' : 'is-flat'"
            :title="`较上一采样点${row.delta > 0.005 ? '增加' : row.delta < -0.005 ? '减少' : '持平'} ${money(Math.abs(row.delta))}`"
          >{{ row.delta > 0.005 ? '↑' : row.delta < -0.005 ? '↓' : '—' }} {{ money(Math.abs(row.delta)) }}</span>
        </div>

        <template v-if="row.ok">
          <div v-if="row.remain !== null && row.remain !== undefined" class="pc-card__nums">
            <span class="pc-card__value">{{ money(row.remain) }}</span>
            <span class="pc-card__of">/ {{ money(row.total) }} {{ row.currency || '' }}</span>
          </div>
          <span v-if="row.percent !== null" class="pc-card__bar" :class="toneClass(row.percent)">
            <i :style="{ width: row.percent + '%' }" />
          </span>
          <div v-if="row.used !== null && row.used !== undefined" class="pc-card__meta">
            <span>{{ row.usedLabel }} {{ money(row.used) }} {{ row.currency || '' }}</span>
          </div>
          <!-- 供应商专属结构化视图（extra.pools）：SenseNova 这类按「资源池 × 滚动窗口」给数的平台，
               每个池单独画 7 天 / 5 小时两条剩余进度；没有该结构时回退到通用 metrics 徽章 -->
          <div v-if="row.poolsView.length" class="pc-pools">
            <div class="pc-pools__head">
              <span class="pc-pools__title">{{ poolsTitleOf(row) }}</span>
              <span v-if="row.planName" class="pc-pools__plan" :title="`套餐：${row.planName}`">{{ row.planName }}</span>
              <span v-if="unitOf(row)" class="pc-pools__unit">单位：{{ unitOf(row) }}</span>
            </div>
            <div v-for="(p, i) in row.poolsView" :key="i" class="pc-pool">
              <div class="pc-pool__head">
                <span class="pc-pool__name" :title="p.name">{{ p.name }}</span>
                <span
                  v-if="p.grant !== null"
                  class="pc-pool__grant"
                  :title="`赠送余额 ${money(p.grant)} ${unitOf(row)}`"
                >赠送 {{ money(p.grant) }} {{ unitOf(row) }}</span>
              </div>
              <template v-for="w in p.windows" :key="w.label">
                <div class="pc-pool__row">
                  <span class="pc-pool__label">{{ w.label }}</span>
                  <span
                    v-if="w.percent !== null"
                    class="pc-pool__bar"
                    :class="toneClass(w.percent)"
                    role="progressbar"
                    :aria-valuenow="w.percent"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ><i :style="{ width: w.percent + '%' }" /></span>
                  <span class="pc-pool__num">
                    <b>{{ money(w.remaining) }}</b><template v-if="w.limit !== null"> / {{ money(w.limit) }}</template>
                    {{ unitOf(row) }}<template v-if="w.percent !== null">（{{ w.percent }}%）</template>
                  </span>
                </div>
                <div v-if="w.reset" class="pc-pool__reset" :title="`窗口重置时间：${w.reset}`">
                  重置于 {{ w.reset.replace('T', ' ') }}
                </div>
              </template>
            </div>
          </div>
          <!-- 供应商专属结构化视图（extra.subscriptions）：sub2api 这类订阅制中转，
               每个订阅单独画「窗口剩余」进度，并标出分组 / 窗口 / 状态 / 到期时间 -->
          <div v-else-if="row.subsView.length" class="pc-subs">
            <div class="pc-pools__head">
              <span class="pc-pools__title">订阅明细</span>
              <span v-if="unitOf(row)" class="pc-pools__unit">单位：{{ unitOf(row) }}</span>
            </div>
            <div v-for="(s, i) in row.subsView" :key="i" class="pc-sub">
              <div class="pc-sub__head">
                <span class="pc-sub__name" :title="s.name">{{ s.name }}</span>
                <span v-if="s.window" class="pc-sub__win">{{ s.window }}窗口</span>
                <span
                  v-if="s.statusLabel"
                  class="pc-sub__status"
                  :class="`is-${s.statusTone}`"
                  :title="`订阅状态：${s.status}`"
                >{{ s.statusLabel }}</span>
                <span v-if="s.expiresText" class="pc-sub__exp" :title="`到期时间：${s.expires}`">
                  <!-- 到期倒计时环：整环=刚起订，随时间流逝耗尽；秒级跳动的剩余时长贴在日期旁 -->
                  <svg
                    v-if="s.expiresAt !== null"
                    class="pc-sub__ring"
                    :class="`is-${countdownTone(s)}`"
                    viewBox="0 0 20 20"
                    width="15"
                    height="15"
                    aria-hidden="true"
                  >
                    <circle class="pc-sub__ring-track" cx="10" cy="10" r="8" fill="none" stroke-width="2.5" />
                    <circle
                      class="pc-sub__ring-value"
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      transform="rotate(-90 10 10)"
                      :stroke-dasharray="SUB_RING_LEN"
                      :stroke-dashoffset="SUB_RING_LEN * (1 - countdownFraction(s))"
                    />
                  </svg>
                  {{ s.active ? '至 ' + s.expiresText : s.expiresText }}
                  <b v-if="s.expiresAt !== null" class="pc-sub__left" :class="`is-${countdownTone(s)}`">{{ countdownText(s) }}</b>
                </span>
              </div>
              <!-- 分组未配额度（按量计费订阅）没有「剩余」可算：只显示已用，不画假余额 -->
              <div v-if="s.limit !== null || s.remain !== null" class="pc-sub__row">
                <span class="pc-sub__label">剩余</span>
                <span
                  v-if="s.percent !== null"
                  class="pc-sub__bar"
                  :class="toneClass(s.percent)"
                  role="progressbar"
                  :aria-valuenow="s.percent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ><i :style="{ width: s.percent + '%' }" /></span>
                <span class="pc-sub__num">
                  <b>{{ money(s.remain) }}</b><template v-if="s.limit !== null"> / {{ money(s.limit) }}</template>
                  {{ unitOf(row) }}<template v-if="s.percent !== null">（{{ s.percent }}%）</template>
                </span>
              </div>
              <div v-if="s.usage !== null" class="pc-sub__used">
                已用 {{ money(s.usage) }} {{ unitOf(row) }}
              </div>
            </div>
          </div>
          <div v-else-if="row.metrics.length" class="pc-card__metrics">
            <span v-for="(m, i) in row.metrics" :key="i" class="pc-metric" :title="metricTitle(m)">
              <i>{{ m.label || '读数' }}</i>
              <b>{{ money(m.amount) }}</b>
              <em v-if="m.currency">{{ m.currency }}</em>
            </span>
          </div>
          <!-- 供应商专属结构化视图（extra.mode=usage）：ModelScope 官网用量接口只有当日
               调用数、没有额度上限，不能把已用当余额画进度条；单独一行展示今日用量 -->
          <div v-else-if="row.usageText" class="pc-usage">
            <span class="pc-usage__label">今日已用</span>
            <b class="pc-usage__value">{{ row.usageText }}</b>
          </div>
          <!-- OpenRouter 普通推理 Key 兜底口径（extra.mode=key-usage）：/api/v1/key 只有
               本 Key 累计消费、没有 per-key 上限时算不出「剩余」，不能把消费当余额；
               单独一行展示累计已用 -->
          <div v-else-if="row.keyUsageText" class="pc-usage">
            <span class="pc-usage__label">本 Key 累计已用</span>
            <b class="pc-usage__value">{{ row.keyUsageText }}</b>
          </div>
          <!-- 上游多给但我们没有专属视图的余额参数：压平成小芯片原样展示，不丢信息 -->
          <div v-if="row.extraChips.length" class="pc-extra">
            <span v-for="(c, i) in row.extraChips" :key="i" class="pc-extra__chip" :title="`${c.label}：${c.value}`">
              <i>{{ c.label }}</i>
              <b>{{ c.value }}</b>
            </span>
          </div>
        </template>

        <p v-else class="pc-card__error" :title="row.error">{{ row.error }}</p>
        <button
          v-if="!row.ok"
          class="pc-card__fix"
          type="button"
          @click="emit('edit-provider', { focusSection: 'balance' })"
        >去配置余额密钥</button>
        </article>
      </template>
      <p v-else class="pc-low-empty">没有低于告警档的 Key</p>
    </div>

    <!--
      告警设置浮层：阈值 / 接收人 / 推送渠道就地改，顺带展示当前余额与上次推送时间。
      保存走 PUT /providers/{id} 的 extra（整列覆盖）—— 先 GET 取原 extra
      合并再提交，只动 credit_warn_threshold / credit_warn_receivers /
      credit_warn_channels / credit_warn_emails / credit_warn_webhook 几个键，
      credit_key 等其余配置不动。吸底条与详情卡的「低于阈值」徽标都点到这里。
    -->
    <div v-if="alertOpen" class="pc-alert-pop">
      <div class="pc-alert-head">
        <span class="pc-alert-title">告警设置</span>
        <button class="pc-alert-close" type="button" title="收起" @click="alertOpen = false">×</button>
      </div>
      <div class="pc-alert-facts">
        <span class="pc-alert-fact"><i>当前余额</i><b>{{ alertRemainText }}</b></span>
        <span class="pc-alert-fact"><i>上次推送</i><b>{{ alertLastPushedText }}</b></span>
      </div>
      <!-- 最近推送留痕：低量 / 恢复各一行，核对「推没推、推给谁、当时余额多少」 -->
      <div v-if="alertLogs.length" class="pc-alert-logs">
        <span class="pc-alert-logs__title">最近推送</span>
        <ul class="pc-alert-logs__list">
          <li
            v-for="(log, i) in alertLogs"
            :key="i"
            class="pc-alert-log"
            :class="log.type === 'RECOVERY' ? 'is-recovery' : 'is-warn'"
          >
            <span class="pc-alert-log__time">{{ alertLogTime(log.pushed_at) }}</span>
            <span class="pc-alert-log__type">{{ log.type === 'RECOVERY' ? '恢复' : '低量' }}</span>
            <span v-if="log.channels" class="pc-alert-log__chan" :title="`渠道：${log.channels}`">{{ log.channels }}</span>
            <span class="pc-alert-log__fact">余额 {{ alertLogMoney(log.remain) }} / 阈值 {{ alertLogMoney(log.threshold) }}</span>
            <span v-if="log.receivers" class="pc-alert-log__recv" :title="`接收人：${log.receivers}`">→ {{ log.receivers }}</span>
          </li>
        </ul>
      </div>
      <label class="pc-alert-field">
        <span class="pc-alert-label">告警阈值</span>
        <input
          v-model="alertThreshold"
          class="pc-alert-input"
          type="text"
          inputmode="decimal"
          placeholder="如 20，余额 ≤ 阈值时告警；留空关闭"
        />
      </label>
      <label class="pc-alert-field">
        <span class="pc-alert-label">接收人</span>
        <input
          v-model="alertReceivers"
          class="pc-alert-input"
          type="text"
          placeholder="用户 ID，逗号分隔；站内信渠道用"
        />
      </label>
      <div class="pc-alert-field">
        <span class="pc-alert-label">推送渠道</span>
        <div class="pc-alert-channels">
          <label v-for="ch in ALERT_CHANNEL_OPTIONS" :key="ch.value" class="pc-alert-channel">
            <input v-model="alertChannels" type="checkbox" :value="ch.value" />
            <span>{{ ch.label }}</span>
          </label>
        </div>
      </div>
      <label v-if="alertChannels.includes('email')" class="pc-alert-field">
        <span class="pc-alert-label">邮箱收件人</span>
        <input
          v-model="alertEmails"
          class="pc-alert-input"
          type="text"
          placeholder="邮箱地址，逗号分隔"
        />
      </label>
      <label v-if="alertChannels.includes('webhook')" class="pc-alert-field">
        <span class="pc-alert-label">Webhook 地址</span>
        <input
          v-model="alertWebhook"
          class="pc-alert-input"
          type="text"
          placeholder="钉钉 / 企微 / 飞书机器人 Webhook（https://…）"
        />
      </label>
      <p v-if="alertError" class="pc-alert-err">{{ alertError }}</p>
      <div class="pc-alert-foot">
        <button
          class="pc-alert-btn is-primary"
          type="button"
          :disabled="alertSaving || alertLoading"
          @click="saveAlertSettings"
        >{{ alertSaving ? '保存中…' : '保存' }}</button>
        <button class="pc-alert-btn" type="button" :disabled="alertSaving" @click="alertOpen = false">取消</button>
      </div>
    </div>
  </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 提供商「余额与用量」面板。
 *
 * <p>数据来自 {@code GET /api/providers/{id}/credit}：后端把这家供应商的每个 Key
 * 各查一次（复用渠道管理页的余额 SPI），本组件只负责排版，不再关心任何厂商口径。</p>
 *
 * <p>两种形态：{@code compact=false} 是详情卡（顶部汇总 pill：剩余 / 总量 + 64×5 条 +
 * 百分比，下面每个 Key 一张卡，≤20% 红徽章，容器宽于 860px 并两列）；
 * {@code compact=true} 是模型管理 07 版式的吸底条——宿主把它贴在右栏底边，
 * 一行放「汇总 + 每个 Key 的占比胶囊」，滚多少模型都看得见余额；点整条余额栏
 * （标题、汇总或 Key 胶囊任意位置）会在条上方浮出详情卡（pools / metrics 明细），
 * 点「刷新」只回源不展开，换供应商自动收起。</p>
 *
 * <p>不轮询：余额接口会逐个 Key 出网，只在打开供应商或点「刷新」时查一次。</p>
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { adminApi } from '@/framework/context'

const props = withDefaults(
  defineProps<{
    providerId?: string
    /**
     * 吸底条形态（模型管理 07 版式）。
     *
     * <p>false = 详情卡（汇总 pill + 每 Key 一张卡，吸在滚动区底部）；
     * true = 一行状态栏，由宿主贴在自己右栏底边，滚模型列表时始终可见。</p>
     */
    compact?: boolean
    /**
     * 保存后刷新信号：宿主在供应商保存成功后自增，面板借此重拉余额
     * （保存可能改了余额密钥 / 查询口径 / 告警阈值，不能继续摆旧读数）。
     */
    refreshTick?: number
  }>(),
  { providerId: '', compact: false, refreshTick: 0 },
)

const emit = defineEmits<{
  /** 点失败读数卡的「去配置余额密钥」：宿主打开供应商编辑并聚焦余额段 */
  (e: 'edit-provider', payload: { focusSection?: 'balance' }): void
}>()

/** 单条 Key 读数（后端 creditOfKey 的行结构） */
interface CreditRow {
  index: number
  mask: string
  ok: boolean
  source?: string
  remain?: number | string | null
  used?: number | string | null
  total?: number | string | null
  currency?: string | null
  parts?: Array<{ label?: string; amount?: number | string | null; currency?: string | null }>
  error?: string
  /**
   * 供应商专属结构化数据（按 source 区分形态）：如 sensenova 的
   * plan / pools（资源池 7 天 / 5 小时窗口）明细；前端据此渲染专属余额视图
   */
  extra?: {
    plan?: Record<string, unknown>
    pools?: Array<Record<string, unknown>>
    /** 池视图标题：z.ai 等供应商用 extra.pools_title 自定义标题（缺省「资源池明细」） */
    pools_title?: string
    unit?: string
    /**
     * sub2api 订阅口径：mode=subscription 时 subscriptions 为逐订阅明细
     * （group / status / starts_at / expires_at / window / limit / usage / remain）
     */
    mode?: string
    window?: string
    subscriptions?: Array<Record<string, unknown>>
    /**
     * ModelScope 官网用量口径：mode=usage 时当日调用数 / 当日限额；
     * 只给已用没有限额时按「无主余额」返回（parts 空），由 usage 视图展示
     */
    current_usage_per_day?: number | string
    request_limit_per_day?: number | string
    /**
     * OpenRouter 普通推理 Key 兜底口径：mode=key-usage 时 /api/v1/key 返回的本 Key
     * 累计消费（key_usage）与可选的本 Key 剩余（key_limit_remaining，仅配了
     * per-key 上限时才有）；只有用量时按「无主余额」返回（parts 空），由 key-usage 视图展示
     */
    key_usage?: number | string
    key_limit_remaining?: number | string
    /**
     * 余额令牌（三段式 JWT）的过期时刻（epoch 毫秒）：后端从 exp 声明解出，
     * 面板据此在临期时提醒「该续票了」（商汤等令牌只有几小时有效期）
     */
    expires_at?: number | null
  } | null
}

/** 吸底条详情展开态：点整条余额栏切换，换供应商时收起 */
const expanded = ref(false)
/** 详情卡渲染条件：非吸底宿主常驻；吸底条形态下点开后在条上方浮出 */
const detailVisible = computed(() => !props.compact || expanded.value)

const rows = ref<CreditRow[]>([])
const loading = ref(false)
const error = ref('')
const meta = ref<{
  kind?: string
  /** 本次实际尝试的实现标识（后端 candidates），全部查不到时显示出来 */
  candidates?: string[]
  /** 余额口径分级（official / openai / uncovered / relay / manual / none） */
  level?: string
  currency?: string | null
  total?: { remain?: number; used?: number; total?: number } | null
  ok?: boolean
  message?: string
  keys?: CreditRow[]
  /** 命中读数缓存：5 分钟内重复打开直接回缓存，点「刷新」强制回源 */
  cached?: boolean
  /** 缓存写入时间（epoch 毫秒） */
  cached_at?: number
  /** 缓存年龄（秒） */
  age_seconds?: number
  /** 余额低量告警判定（后端按 extra.credit_warn_threshold 算，实时回源路径才有） */
  warn?: { threshold?: number | string; remain?: number | string; triggered?: boolean }
}>({})

/** 余额低量告警是否触发（后端实时回源路径判定并随载荷返回） */
const warnTriggered = computed(() => meta.value.warn?.triggered === true)

/* ==================== 告警设置（内联浮层） ==================== */

const alertOpen = ref(false)
const alertLoading = ref(false)
const alertSaving = ref(false)
const alertError = ref('')
const alertThreshold = ref('')
const alertReceivers = ref('')
/** 推送渠道多选（value 与后端 creditWarnChannels 的合法值一致；空时后端默认 inbox） */
const alertChannels = ref<string[]>(['inbox'])
/** 邮件渠道收件人（逗号分隔文本，提交时解析成数组） */
const alertEmails = ref('')
/** Webhook 渠道机器人地址 */
const alertWebhook = ref('')

/** 推送渠道选项 */
const ALERT_CHANNEL_OPTIONS = [
  { value: 'inbox', label: '站内信' },
  { value: 'email', label: '邮件' },
  { value: 'webhook', label: 'Webhook' },
]
/** 最近一次告警 / 恢复推送时间（epoch 毫秒；null = 从未推送） */
const lastPushedAt = ref<number | null>(null)

/** 告警推送留痕行（GET /credit/alerts 的 alerts 元素，按推送时间倒序） */
interface CreditAlertLogItem {
  /** 推送类型：WARN=低量告警 / RECOVERY=恢复通知 */
  type?: string | null
  /** 推送时的剩余余额 */
  remain?: number | null
  /** 推送时的告警阈值 */
  threshold?: number | null
  /** 接收人用户 ID（逗号分隔） */
  receivers?: string | null
  /** 送达渠道（逗号分隔：inbox=站内信 / email=邮件 / webhook=机器人 Webhook） */
  channels?: string | null
  /** 推送时间（epoch 毫秒） */
  pushed_at?: number | null
}

/** 浮层里展示的最近推送留痕（最多 10 条） */
const alertLogs = ref<CreditAlertLogItem[]>([])

/** 浮层里的「当前余额」：取面板最新汇总读数，无读数显示 — */
const alertRemainText = computed(() => {
  const r = meta.value.total?.remain
  const n = Number(r)
  if (r === null || r === undefined || !Number.isFinite(n)) return '—'
  const code = String(meta.value.currency || '').trim()
  return `${n.toFixed(2)}${code ? ` ${code}` : ''}`
})

/** 毫秒 -> 「YYYY-MM-DD HH:mm」；无记录显示「从未推送」 */
const alertLastPushedText = computed(() => {
  if (!lastPushedAt.value) return '从未推送'
  const d = new Date(lastPushedAt.value)
  if (Number.isNaN(d.getTime())) return '从未推送'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

/** 留痕时间文案：毫秒 -> 「MM-DD HH:mm」；无值显示 — */
const alertLogTime = (ms?: number | null) => {
  if (!ms) return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 留痕金额文案：无值显示 — */
const alertLogMoney = (v?: number | null) => {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '—'
}

/**
 * 打开 / 收起告警设置浮层：打开时拉当前 extra（阈值 / 接收人）与上次推送时间。
 *
 * <p>extra 走 GET /providers/{id} 现取 —— 面板手里只有 providerId，
 * 保存时也要以「现值合并」为准，避免覆盖掉别的 extra 键。</p>
 */
const openAlertSettings = async () => {
  alertOpen.value = !alertOpen.value
  if (!alertOpen.value) return
  const providerId = String(props.providerId || '').trim()
  if (!providerId) return
  alertLoading.value = true
  alertError.value = ''
  try {
    const [providerRes, alertsRes] = await Promise.all([
      adminApi.get(`/api/providers/${encodeURIComponent(providerId)}`),
      adminApi.get(`/api/providers/${encodeURIComponent(providerId)}/credit/alerts?limit=10`).catch(() => null),
    ])
    const provider = providerRes?.data ?? providerRes
    const extra = provider?.extra && typeof provider.extra === 'object' ? provider.extra : {}
    const threshold = extra.credit_warn_threshold
    alertThreshold.value = threshold === null || threshold === undefined ? '' : String(threshold)
    const receivers = extra.credit_warn_receivers
    alertReceivers.value = Array.isArray(receivers) ? receivers.join(', ') : receivers ? String(receivers) : ''
    const channels = extra.credit_warn_channels
    const channelList = (Array.isArray(channels) ? channels : channels ? String(channels).split(/[,，;；\s]+/) : ['inbox'])
      .map((v) => String(v).trim().toLowerCase())
      .filter((v) => ALERT_CHANNEL_OPTIONS.some((o) => o.value === v))
    alertChannels.value = channelList.length ? channelList : ['inbox']
    const emails = extra.credit_warn_emails
    alertEmails.value = Array.isArray(emails) ? emails.join(', ') : emails ? String(emails) : ''
    alertWebhook.value = extra.credit_warn_webhook ? String(extra.credit_warn_webhook) : ''
    const alerts = alertsRes ? (alertsRes.data ?? alertsRes) : null
    lastPushedAt.value = typeof alerts?.last_pushed_at === 'number' ? alerts.last_pushed_at : null
    alertLogs.value = Array.isArray(alerts?.alerts) ? (alerts.alerts as CreditAlertLogItem[]) : []
  } catch (e: any) {
    alertError.value = e?.response?.data?.message || e?.message || '读取告警设置失败'
  } finally {
    alertLoading.value = false
  }
}

/** 吸底条徽标入口：compact 且未展开时先展开详情卡，浮层渲染在详情卡里 */
const openAlertFromBar = () => {
  if (props.compact && !expanded.value) expanded.value = true
  void nextTick(() => {
    if (!alertOpen.value) void openAlertSettings()
  })
}

/**
 * 保存告警设置：PUT /providers/{id} 的 extra 是整列覆盖，先 GET 现值合并、
 * 只改告警相关键再提交；阈值留空 = 删除该键（关闭告警），接收人留空 = 删除该键；
 * 渠道未勾选时提交 inbox（后端默认口径）。保存后强制回源重评告警。
 */
const saveAlertSettings = async () => {
  const providerId = String(props.providerId || '').trim()
  if (!providerId || alertSaving.value) return
  const thresholdText = alertThreshold.value.trim()
  let threshold: number | null = null
  if (thresholdText) {
    const n = Number(thresholdText)
    if (!Number.isFinite(n) || n < 0) {
      alertError.value = '告警阈值需为不小于 0 的数字'
      return
    }
    threshold = n
  }
  const receivers: number[] = []
  for (const part of alertReceivers.value.split(/[,，;；\s]+/)) {
    if (!part) continue
    const id = Number(part)
    if (!Number.isInteger(id) || id <= 0) {
      alertError.value = `接收人需为正整数用户 ID：「${part}」`
      return
    }
    if (!receivers.includes(id)) receivers.push(id)
  }
  const channels = alertChannels.value.filter((v) => ALERT_CHANNEL_OPTIONS.some((o) => o.value === v))
  if (!channels.length) channels.push('inbox')
  const emails: string[] = []
  for (const part of alertEmails.value.split(/[,，;；\s]+/)) {
    if (!part) continue
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
      alertError.value = `邮箱收件人格式不对：「${part}」`
      return
    }
    if (!emails.includes(part)) emails.push(part)
  }
  if (channels.includes('email') && !emails.length) {
    alertError.value = '选择了邮件渠道，请填写邮箱收件人'
    return
  }
  const webhook = alertWebhook.value.trim()
  if (channels.includes('webhook') && !/^https?:\/\//i.test(webhook)) {
    alertError.value = '选择了 Webhook 渠道，请填写 http(s) 机器人地址'
    return
  }
  if (channels.includes('inbox') && !receivers.length) {
    alertError.value = '选择了站内信渠道，请填写接收人用户 ID'
    return
  }
  alertSaving.value = true
  alertError.value = ''
  try {
    const providerRes: any = await adminApi.get(`/api/providers/${encodeURIComponent(providerId)}`)
    const provider = providerRes?.data ?? providerRes
    const extra: Record<string, any> = provider?.extra && typeof provider.extra === 'object' ? { ...provider.extra } : {}
    if (threshold === null) delete extra.credit_warn_threshold
    else extra.credit_warn_threshold = threshold
    if (!receivers.length) delete extra.credit_warn_receivers
    else extra.credit_warn_receivers = receivers
    extra.credit_warn_channels = channels
    if (emails.length) extra.credit_warn_emails = emails
    else delete extra.credit_warn_emails
    if (webhook) extra.credit_warn_webhook = webhook
    else delete extra.credit_warn_webhook
    await adminApi.put(`/api/providers/${encodeURIComponent(providerId)}`, { extra })
    alertOpen.value = false
    // 阈值变了要重评告警：强制回源走实时判定路径
    void load(true)
  } catch (e: any) {
    alertError.value = e?.response?.data?.message || e?.message || '保存告警设置失败'
  } finally {
    alertSaving.value = false
  }
}

/** 查询方式的中文名（auto 时后端会回落，页面只显示「自动识别」） */
const KIND_LABELS: Record<string, string> = {
  auto: '自动识别',
  billing: 'OpenAI 兼容计费',
  openai: 'OpenAI 官方',
  host: '厂商官方',
  expression: '自定义口径',
  shusheng: '书生·端砚',
  modelscope: '魔搭限流配额',
  zai: 'z.ai 官方',
  openrouter: 'OpenRouter 官方',
  opencode: 'OpenCode 官方',
  'opencode-console': 'OpenCode 控制台余额',
  ppio: 'PPIO 派欧云官方',
  anthropic: 'Anthropic 控制台余额',
  xai: 'xAI 管理接口余额',
  sub2api: 'sub2api 订阅',
  'new-api': 'new-api 站点额度',
}

/** 读数来源的短标签（卡片右上角） */
const SOURCE_LABELS: Record<string, string> = {
  host: '厂商官方',
  billing: '兼容计费',
  openai: 'OpenAI',
  expression: '自定义',
  sensenova: 'SenseNova',
  shusheng: '书生·端砚',
  sub2api: 'sub2api 订阅',
  'new-api': 'new-api',
  'minimax-platform': 'MiniMax',
  modelscope: 'ModelScope',
  zai: 'z.ai',
  openrouter: 'OpenRouter',
  opencode: 'OpenCode',
  'opencode-console': 'OpenCode 控制台',
  ppio: 'PPIO',
  anthropic: 'Anthropic',
  xai: 'xAI',
}

const kindLabel = computed(() => KIND_LABELS[String(meta.value.kind || '')] || '')
const pinned = computed(() => rows.value.length > 1)/** 全部 Key 都没查到数：此时把「已尝试链路」显示出来，方便判断该换哪条口径 */
const anyOk = computed(() => rows.value.some((row) => row.ok))
const attempted = computed(() => (meta.value.candidates || [])
  .map((kind) => KIND_LABELS[kind] || kind)
  .join(' → '))
/** 第一条失败原因（吸底条只放得下一行，完整原文在胶囊 tooltip 与详情卡里） */
const firstError = computed(() => {
  const bad = rows.value.find((row) => !row.ok)
  return bad && bad.error ? String(bad.error) : ''
})

/** 吸底条胶囊的悬浮说明：剩余 / 已用 / 总量 + Moss 这类一次性读数（冻结、本月、日均、预计） */
const pillTitle = (row: any) => {
  if (!row.ok) return `${row.mask}：${row.error || '未查到读数'}`
  if (row.usageText) return `${row.mask}：今日已用 ${row.usageText}`
  if (row.keyUsageText) return `${row.mask}：${row.keyUsageText}`
  const bits = [
    `剩余 ${money(row.remain)}`,
    `${row.usedLabel || '已用'} ${money(row.used)}`,
    `总量 ${money(row.total)}${row.currency ? ' ' + row.currency : ''}`,
  ]
  for (const m of row.metrics || []) {
    bits.push(`${m.label || '读数'} ${money(m.amount)}${m.currency ? ' ' + m.currency : ''}`)
  }
  return `${row.mask}：` + bits.join('，')
}

/** 指标格的悬浮说明 */
const metricTitle = (m: { label?: string; amount?: number | string | null; currency?: string | null }) =>
  `${m.label || '读数'}：${money(m.amount)}${m.currency ? ' ' + m.currency : ''}`

/** 读数缓存标识：命中时显示「缓存 · 多久前」 */
const cacheText = computed(() => {
  if (!meta.value.cached) return ''
  const s = Number(meta.value.age_seconds)
  const age = !Number.isFinite(s)
    ? ''
    : s < 90 ? '刚刚' : s < 3600 ? `${Math.round(s / 60)} 分钟前` : `${Math.round(s / 3600)} 小时前`
  return age ? `缓存 · ${age}` : '缓存'
})

const cacheTitle = computed(() => {
  if (!meta.value.cached) return ''
  const at = Number(meta.value.cached_at)
  const when = Number.isFinite(at) && at > 0 ? new Date(at).toLocaleString() : ''
  return `本次读数来自缓存（5 分钟内复用，避免逐 Key 出网）${when ? '，查询于 ' + when : ''}；点「刷新」强制回源`
})

/** 余额口径分级：告诉用户「这家凭什么能查 / 为什么查不到」 */
const LEVEL_LABELS: Record<string, string> = {
  official: '官方预设',
  openai: 'OpenAI 官方',
  uncovered: '官方站点·未收录',
  relay: '中转站探测',
  manual: '手动口径',
  none: '无上游',
}
const LEVEL_HINTS: Record<string, string> = {
  official: '这家厂商有官方余额接口，按官方地址与字段直接查',
  openai: '上游是 OpenAI 官方，走 OpenAI 额度接口',
  uncovered: '上游是厂商官方站点，但没有可用的官方余额接口；官方站点上没有中转计费协议，不做探测',
  relay: '上游不是厂商官方站点（中转 / 自建网关）：探测 OpenAI 兼容计费余额协议，第一条查到数的胜出',
  manual: '页面上指定了唯一余额实现（可覆盖地址与字段表达式）',
  none: '没有配置上游地址，没有可查的余额；先填上游地址，或在「余额」里配自定义地址',
}
const levelLabel = computed(() => LEVEL_LABELS[String(meta.value.level || '')] || '')
const levelHint = computed(() => LEVEL_HINTS[String(meta.value.level || '')] || '')

/** 金额：不写千分位、不带货币符号，货币用码单独显示（与渠道管理页一致） */
const money = (value: unknown) => {
  const n = Number(value)
  if (value === null || value === undefined || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 4
  return n.toFixed(digits)
}

/** 余额分档口径：≤20% 低（红）、≤50% 中（琥珀），其余默认主色——吸底条 / 卡片 / 池 / 订阅 / 总量条统一 */
const toneClass = (percent: number | null | undefined) => {
  const n = Number(percent)
  if (percent === null || percent === undefined || !Number.isFinite(n)) return {}
  if (n <= 20) return { 'is-low': true }
  if (n <= 50) return { 'is-mid': true }
  return {}
}

const sourceLabel = (source: string) => SOURCE_LABELS[source] || source

/** 剩余占比：没有总量（或总量为 0）时返回 null，不画 0% 的条 */
const percentOf = (remain: unknown, total: unknown): number | null => {
  const r = Number(remain)
  const t = Number(total)
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return null
  return Math.max(0, Math.min(100, Math.round((r / t) * 100)))
}

/** 资源池窗口视图（SenseNova / z.ai）：每个池按滚动窗口给剩余读数 + 赠送余额 */
interface PoolWindowView {
  label: string
  remaining: number | null
  limit: number | null
  percent: number | null
  /** 窗口重置时间（z.ai 的 nextResetTime）；没有为空串 */
  reset: string
}
interface PoolView {
  name: string
  windows: PoolWindowView[]
  grant: number | null
}

const numOrNull = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** 单个窗口 → 视图：数值统一转数；percent 优先用后端算好的，缺失时按剩余/上限算 */
const poolWindowView = (label: string, w: Record<string, any>): PoolWindowView => {
  const remaining = numOrNull(w.remaining)
  const limit = numOrNull(w.limit)
  const percent = typeof w.percent === 'number' ? w.percent : percentOf(remaining, limit)
  // 重置时间两套字段口径：z.ai 通用窗口数组是 reset，SenseNova 固定窗口是 reset_at
  return { label, remaining, limit, percent, reset: String(w.reset_at || w.reset || '') }
}

/**
 * 把后端 extra.pools 归一成模板友好的窗口视图。
 *
 * <p>上游数值可能是字符串型 token 数，这里统一转数；limit 取不到时百分比
 * 为 null（只显示数字不画条）。没有该结构（或解析后为空）时返回空数组，
 * 模板回退到通用 metrics 徽章。</p>
 *
 * <p>窗口形态两种：SenseNova 的 {@code window_7d / window_5h} 固定双窗口，
 * 以及通用 {@code windows[]} 数组（z.ai 的 Coding Plan 配额，每窗口自带
 * label / remaining / limit / percent / reset）。</p>
 */
const poolsOf = (row: CreditRow): PoolView[] => {
  const pools = row.extra?.pools
  if (!Array.isArray(pools) || !pools.length) return []
  const views: PoolView[] = []
  for (const raw of pools) {
    if (!raw || typeof raw !== 'object') continue
    const pool = raw as Record<string, any>
    const name = String(pool.name || pool.id || '资源池')
    const windows: PoolWindowView[] = []
    if (Array.isArray(pool.windows)) {
      for (const w of pool.windows) {
        if (!w || typeof w !== 'object') continue
        const win = w as Record<string, any>
        windows.push(poolWindowView(String(win.label || '窗口'), win))
      }
    } else {
      for (const [key, label] of [['window_7d', '7 天'], ['window_5h', '5 小时']] as const) {
        const w = pool[key]
        if (!w || typeof w !== 'object') continue
        windows.push(poolWindowView(label, w as Record<string, any>))
      }
    }
    const grant = numOrNull(pool.grant_balance)
    if (!windows.length && grant === null) continue
    views.push({ name, windows, grant })
  }
  return views
}

/** 池视图标题：z.ai 等 extra.pools_title 优先，缺省仍是 SenseNova 的「资源池明细」 */
const poolsTitleOf = (row: CreditRow) => String(row.extra?.pools_title || '资源池明细')

/** 订阅视图（sub2api）：每个订阅一个额度窗口 + 状态 / 到期 */
interface SubView {
  name: string
  status: string
  statusLabel: string
  /** 状态分色：ok=生效中（绿）/ warn=待生效（琥珀）/ off=过期与取消（红） */
  statusTone: 'ok' | 'warn' | 'off'
  active: boolean
  expires: string
  expiresText: string
  /** 到期时刻（epoch 毫秒）；解析不了为 null（不画倒计时环） */
  expiresAt: number | null
  /** 订阅总周期（expires_at − starts_at，毫秒）；上游没回 starts_at 时为 null（按窗口时长近似） */
  totalMs: number | null
  /** 原始窗口标识（monthly / weekly / daily / mixed / ''）：倒计时环的周期估算用 */
  windowKey: string
  window: string
  usage: number | null
  limit: number | null
  remain: number | null
  percent: number | null
}

/** 订阅额度窗口的中文短标（后端 extra.window / subscriptions[].window） */
const SUB_WINDOW_LABELS: Record<string, string> = {
  monthly: '月',
  weekly: '周',
  daily: '日',
  mixed: '混合',
}

/** 订阅状态的中文名（未知状态原样显示） */
const SUB_STATUS_LABELS: Record<string, string> = {
  active: '生效中',
  expired: '已过期',
  cancelled: '已取消',
  pending: '待生效',
}

/** 到期时间短展示：能解析成日期的取「YYYY-MM-DD」，其余原样返回 */
const subExpiresText = (value: string) => {
  const t = Date.parse(value)
  if (!Number.isFinite(t)) return value
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 倒计时环的周长（r=8 的圆）：stroke-dasharray / stroke-dashoffset 都用它 */
const SUB_RING_LEN = 2 * Math.PI * 8

/** 窗口时长的近似值：上游没回 starts_at 时，环的「总周期」按额度窗口估算 */
const SUB_WINDOW_MS: Record<string, number> = {
  monthly: 30 * 86400000,
  weekly: 7 * 86400000,
  daily: 86400000,
}

/** 秒级时钟：订阅倒计时文案与环每秒重算；组件卸载时停表 */
const now = ref(Date.now())
let subClockTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  subClockTimer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (subClockTimer !== undefined) clearInterval(subClockTimer)
})

/** 剩余时长文案：整秒跳动，「9天 03:22:41」/ 不足一天「03:22:41」/ 过期「已到期」 */
const countdownText = (sub: SubView): string => {
  if (sub.expiresAt === null) return ''
  const remain = sub.expiresAt - now.value
  if (remain <= 0) return '已到期'
  const total = Math.floor(remain / 1000)
  const days = Math.floor(total / 86400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
  return days > 0 ? `剩 ${days}天 ${clock}` : `剩 ${clock}`
}

/** 倒计时分色：余量充足绿 / 不足一天琥珀 / 已到期红 */
const countdownTone = (sub: SubView): 'ok' | 'warn' | 'off' => {
  if (sub.expiresAt === null || sub.expiresAt <= now.value) return 'off'
  return sub.expiresAt - now.value < 86400000 ? 'warn' : 'ok'
}

/** 倒计时环的剩余占比：剩余时长 / 订阅总周期（starts_at 缺失时按窗口时长近似），夹在 0..1 */
const countdownFraction = (sub: SubView): number => {
  if (sub.expiresAt === null) return 0
  const remain = Math.max(0, sub.expiresAt - now.value)
  const total = sub.totalMs && sub.totalMs > 0
    ? sub.totalMs
    : (SUB_WINDOW_MS[sub.windowKey] || 30 * 86400000)
  return Math.min(1, remain / total)
}

/** 余额令牌到期分色阈值：剩 30 分钟内转琥珀 */
const TOKEN_WARN_MS = 30 * 60 * 1000

/**
 * 余额令牌（JWT）到期视图：读 extra.expires_at（后端从 exp 解出），
 * 配合秒级时钟算剩余文案与分色——>30min 绿、≤30min 琥珀、已过期红。
 *
 * <p>没有 expires_at（非 JWT 令牌）返回 at=null，模板不渲染徽章。</p>
 */
const tokenExpiryOf = (row: CreditRow): { at: number | null; text: string; tone: 'ok' | 'warn' | 'off' } => {
  const at = Number(row.extra?.expires_at)
  if (!Number.isFinite(at) || at <= 0) return { at: null, text: '', tone: 'ok' }
  const remain = at - now.value
  if (remain <= 0) return { at, text: '令牌已过期', tone: 'off' }
  const pad = (n: number) => String(n).padStart(2, '0')
  if (remain < 3600000) {
    const totalSec = Math.floor(remain / 1000)
    return { at, text: `令牌剩 ${pad(Math.floor(totalSec / 60))}:${pad(totalSec % 60)}`, tone: 'warn' }
  }
  const totalMin = Math.floor(remain / 60000)
  const days = Math.floor(totalMin / 1440)
  const clock = `${pad(Math.floor((totalMin % 1440) / 60))}:${pad(totalMin % 60)}`
  const tone = remain < TOKEN_WARN_MS ? 'warn' : 'ok'
  return { at, text: days > 0 ? `令牌剩 ${days}天 ${clock}` : `令牌剩 ${clock}`, tone }
}

/** 到期徽章的悬浮说明（完整到期时刻） */
const tokenExpiryTitle = (row: CreditRow): string => {
  const at = Number(row.extra?.expires_at)
  return Number.isFinite(at) && at > 0 ? `余额令牌到期时间：${new Date(at).toLocaleString()}` : ''
}

/**
 * 把后端 extra.subscriptions 归一成模板友好的订阅视图。
 *
 * <p>上游数值可能是字符串型金额，这里统一转数；limit 取不到时不画百分比条。
 * 没有该结构（或解析后为空）时返回空数组，模板回退到通用 metrics 徽章。</p>
 */
const subsOf = (row: CreditRow): SubView[] => {
  const subs = row.extra?.subscriptions
  if (!Array.isArray(subs) || !subs.length) return []
  const views: SubView[] = []
  for (const raw of subs) {
    if (!raw || typeof raw !== 'object') continue
    const sub = raw as Record<string, any>
    const usage = numOrNull(sub.usage)
    const limit = numOrNull(sub.limit)
    let remain = numOrNull(sub.remain)
    if (remain === null && limit !== null && usage !== null) remain = limit - usage
    if (remain === null && usage === null) continue
    const status = String(sub.status || '').trim()
    const statusKey = status.toLowerCase()
    const expiresRaw = String(sub.expires_at || '')
    const expiresAt = Number.isFinite(Date.parse(expiresRaw)) ? Date.parse(expiresRaw) : null
    const startsRaw = String(sub.starts_at || '')
    const startsAt = Number.isFinite(Date.parse(startsRaw)) ? Date.parse(startsRaw) : null
    const windowKey = String(sub.window || '')
    views.push({
      name: String(sub.group || '订阅'),
      status,
      statusLabel: SUB_STATUS_LABELS[statusKey] || status,
      statusTone: statusKey === '' || statusKey === 'active' ? 'ok' : statusKey === 'pending' ? 'warn' : 'off',
      active: statusKey === '' || statusKey === 'active',
      expires: expiresRaw,
      expiresText: subExpiresText(expiresRaw),
      expiresAt,
      totalMs: expiresAt !== null && startsAt !== null && expiresAt > startsAt ? expiresAt - startsAt : null,
      windowKey,
      window: SUB_WINDOW_LABELS[windowKey] || '',
      usage,
      limit,
      remain,
      percent: percentOf(remain, limit),
    })
  }
  return views
}

/** 读数单位：extra.unit（如 sensenova 的 tokens）优先，其次币种码 */
const unitOf = (row: CreditRow) => String(row.extra?.unit || row.currency || '')

/** 套餐名（sensenova extra.plan）：对象取 name 字段，字符串原样；取不到返回空串 */
const planNameOf = (row: CreditRow): string => {
  const plan = row.extra?.plan as unknown
  if (!plan) return ''
  if (typeof plan === 'string') return plan.trim()
  if (typeof plan === 'object') {
    const name = (plan as Record<string, unknown>).name
    if (typeof name === 'string' || typeof name === 'number') return String(name).trim()
  }
  return ''
}

/**
 * ModelScope 官网用量口径（extra.mode=usage）：上游只有当日调用数、没有额度上限，
 * 不能把已用当余额画进度条；这里拼出「5 次」这样的展示文本。
 *
 * <p>有限额时后端已给 parts（剩余 / 已用），走通用进度条，不再重复展示。</p>
 */
const usageTextOf = (row: CreditRow): string => {
  const extra = row.extra
  if (!extra || extra.mode !== 'usage') return ''
  if (row.remain !== null && row.remain !== undefined) return ''
  const used = extra.current_usage_per_day
  if (used === null || used === undefined || used === '') return ''
  const unit = String(extra.unit || row.currency || '次')
  return `${money(used)} ${unit}`.trim()
}

/**
 * OpenRouter 普通推理 Key 兜底口径（extra.mode=key-usage）：/api/v1/key 只返回
 * 本 Key 累计消费、没有 per-key 上限时算不出「剩余」，不能把消费当余额；
 * 这里拼出「1.23 USD」这样的展示文本，页面单独一行展示。
 *
 * <p>配了 per-key 上限时后端已给 parts（本 Key 剩余 / 已用），走通用进度条，不重复展示。</p>
 */
const keyUsageTextOf = (row: CreditRow): string => {
  const extra = row.extra
  if (!extra || extra.mode !== 'key-usage') return ''
  if (row.remain !== null && row.remain !== undefined) return ''
  const used = extra.key_usage
  if (used === null || used === undefined || used === '') return ''
  return `${money(used)} ${row.currency || 'USD'}`.trim()
}

/** 通用参数芯片 */
interface ExtraChip { label: string; value: string }

/** 已被专属视图消费的 extra 键：不再重复出现在通用参数芯片里 */
const EXTRA_CONSUMED_KEYS = new Set(['pools', 'pools_title', 'subscriptions', 'plan', 'unit', 'mode', 'window', 'coding_plan', 'current_usage_per_day', 'request_limit_per_day', 'key_usage', 'key_limit_remaining', 'expires_at'])

/**
 * 上游返回但我们没有专属视图的余额参数：压平成「键: 值」小芯片原样展示。
 *
 * <p>只取标量与一层对象（如 plan 里 name 之外的其余字段），数组不展开；
 * 最多 10 条，避免个别厂商的超长返回把详情卡撑爆。</p>
 */
const extraChipsOf = (row: CreditRow): ExtraChip[] => {
  const extra = row.extra
  if (!extra || typeof extra !== 'object') return []
  const chips: ExtraChip[] = []
  const push = (label: string, value: unknown) => {
    if (chips.length >= 10) return
    if (value === null || value === undefined || value === '') return
    if (typeof value === 'object') return
    chips.push({ label, value: String(value) })
  }
  for (const [key, value] of Object.entries(extra as Record<string, unknown>)) {
    if (EXTRA_CONSUMED_KEYS.has(key)) continue
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) push(`${key}.${k2}`, v2)
    } else {
      push(key, value)
    }
  }
  return chips
}

/**
 * 每 Key 较上一采样点的余额变化（mask -> 差值）。
 *
 * <p>从逐 Key 历史里取每个掩码「最近两次成功读数」相减；不足两次或算不出
 * 的 Key 不产出，卡片就不显示涨跌徽标。纯前端汇总，/credit/history 已带逐 Key 行。</p>
 */
const keyDeltas = computed(() => {
  const seq = new Map<string, Array<{ t: number; v: number }>>()
  for (const p of history.value) {
    if (!p || !p.ok || !p.key_mask) continue
    const v = Number(p.remain)
    const t = Number(p.synced_at)
    if (!Number.isFinite(v) || !Number.isFinite(t)) continue
    const arr = seq.get(p.key_mask)
    if (arr) arr.push({ t, v })
    else seq.set(p.key_mask, [{ t, v }])
  }
  const deltas: Record<string, number> = {}
  for (const [mask, arr] of seq) {
    if (arr.length < 2) continue
    arr.sort((a, b) => a.t - b.t)
    const d = arr[arr.length - 1].v - arr[arr.length - 2].v
    if (Number.isFinite(d)) deltas[mask] = d
  }
  return deltas
})

/** 每行的占比（渲染时算一次，模板里反复用） */
const CJK_RE = /[\u4e00-\u9fa5]/

const rowsView = computed(() => rows.value.map((row) => {
  if (!row.ok) return { ...row, percent: null, delta: keyDeltas.value[row.mask] ?? null, metrics: [], usedLabel: '已用', poolsView: [] as PoolView[], subsView: [] as SubView[], planName: '', extraChips: [] as ExtraChip[], usageText: '', keyUsageText: '', expiry: tokenExpiryOf(row) }
  const total = row.total ?? row.remain
  const parts = row.parts || []
  const usedLabel = parts[1]?.label && CJK_RE.test(parts[1].label) ? parts[1].label : '已用'
  return {
    ...row,
    total,
    percent: percentOf(row.remain, total),
    /** 较上一采样点的余额变化（无两次成功读数为 null） */
    delta: keyDeltas.value[row.mask] ?? null,
    parts,
    /** 主余额与已用之外的一次性读数：冻结 / 本月已用 / 日均消费 / 预计可用天数等 */
    metrics: parts.slice(2),
    usedLabel,
    /** 供应商专属结构化视图（如 sensenova 资源池窗口）；为空时模板回退 metrics */
    poolsView: poolsOf(row),
    /** 供应商专属结构化视图（sub2api 逐订阅窗口明细）；为空时模板回退 metrics */
    subsView: subsOf(row),
    /** 套餐名（sensenova extra.plan），空串不渲染 */
    planName: planNameOf(row),
    /** 上游多给但无专属视图的余额参数芯片 */
    extraChips: extraChipsOf(row),
    /** ModelScope 官网用量口径（extra.mode=usage）的「今日已用」展示文本 */
    usageText: usageTextOf(row),
    /** OpenRouter 普通 Key 兜底口径（extra.mode=key-usage）的「本 Key 累计已用」展示文本 */
    keyUsageText: keyUsageTextOf(row),
    /** 余额令牌（JWT）到期视图（>30min 绿 / ≤30min 琥珀 / 过期红）；非 JWT 为 at=null */
    expiry: tokenExpiryOf(row),
  }
}))

/* ==================== 只看低量 ==================== */

/** 只看低量开关：开启后详情卡片只显示低于告警档的 Key */
const lowOnly = ref(false)

/** 单行是否低量：优先按后端告警阈值（绝对余额）判；阈值未知时退回「剩余 ≤20%」 */
const isLowRow = (row: (typeof rowsView.value)[number]) => {
  if (!row.ok) return false
  const threshold = Number(meta.value.warn?.threshold)
  if (Number.isFinite(threshold) && row.remain !== null && row.remain !== undefined) {
    return Number(row.remain) <= threshold
  }
  return row.percent !== null && row.percent !== undefined && row.percent <= 20
}

/** 详情卡片实际渲染的行：只看低量时过滤；过滤后为空交给模板的空提示 */
const rowsShown = computed(() => (lowOnly.value ? rowsView.value.filter(isLowRow) : rowsView.value))

/**
 * 顶部汇总。
 *
 * <p>优先用后端的 total（它只累加同币种的行）；后端没给时按当前行自己加一遍，
 * 避免「有卡片没汇总」。</p>
 */
const totals = computed(() => {
  // 只合计「有剩余读数」的行：订阅制按量分组（sub2api 的 Codex 套餐这类）没有
  // 额度上限、只有用量，不能把 0 当总余额摆出来；这类行的明细走订阅视图
  const okRows = rows.value.filter((row) => row.ok
    && row.remain !== null && row.remain !== undefined && Number.isFinite(Number(row.remain)))
  if (!okRows.length) return []
  const backend = meta.value.total
  const currency = String(meta.value.currency || okRows[0]?.currency || '')
  let remain = Number(backend?.remain)
  let used = Number(backend?.used)
  let total = Number(backend?.total)
  if (!Number.isFinite(remain) || !Number.isFinite(total)) {
    remain = 0
    used = 0
    total = 0
    for (const row of okRows) {
      const r = Number(row.remain)
      const u = Number(row.used)
      if (!Number.isFinite(r)) continue
      remain += r
      if (Number.isFinite(u)) {
        used += u
        total += r + u
      } else {
        total += r
      }
    }
  }
  const text = `${money(remain)} / ${money(total)}${currency ? ' ' + currency : ''}`
  return [{
    currency,
    text,
    percent: percentOf(remain, total),
    counted: okRows.length,
    title: `剩余 ${money(remain)}，总量 ${money(total)}${currency ? ' ' + currency : ''}`
      + `（${okRows.length} 个 Key 合计，已用 ${money(used)}）`,
  }]
})

/** 余额历史点（GET /credit/history 的行；后端契约字段保持 snake_case） */
interface CreditHistoryPoint {
  /** 回源时间（epoch 毫秒） */
  synced_at: number
  key_mask?: string
  ok?: boolean
  remain?: number | null
  used?: number | null
  currency?: string | null
  source?: string | null
}

/** 余额历史原始行（按回源时间升序） */
const history = ref<CreditHistoryPoint[]>([])

/** 走势时间窗可选值（天）：后端 /credit/history 的 days 夹取 1~90 */
const TREND_WINDOWS = [7, 30, 90] as const

/** 时间窗偏好在 localStorage 里的键：同一浏览器下次打开沿用上次选择 */
const TREND_DAYS_STORAGE_KEY = 'pc-credit-trend-days'

/** 读一次时间窗偏好；值不在候选里（或读不到，如隐私模式）时回退 7 天 */
const readStoredTrendDays = (): number => {
  try {
    const v = Number(window.localStorage.getItem(TREND_DAYS_STORAGE_KEY))
    return (TREND_WINDOWS as readonly number[]).includes(v) ? v : 7
  } catch {
    return 7
  }
}

/** 当前走势时间窗（天）：切窗即重拉历史；初值来自上次保存的偏好 */
const trendDays = ref<number>(readStoredTrendDays())

/** 切换时间窗并重拉历史；同窗口重复点击不重发请求 */
const setTrendWindow = (d: number) => {
  if (trendDays.value === d) return
  trendDays.value = d
  try {
    window.localStorage.setItem(TREND_DAYS_STORAGE_KEY, String(d))
  } catch {
    /* 存不进就算了：偏好是增值信息，不影响走势本身 */
  }
  void loadHistory()
}

/** 走势 SVG 画布尺寸（viewBox，配合 preserveAspectRatio="none" 拉伸到容器宽） */
const TREND_W = 240
const TREND_H = 48

/** 渐变 id：面板可能同页多实例，避免 SVG defs 的 id 冲突 */
let trendSeq = 0
const trendGradId = `pc-trend-fill-${++trendSeq}`

/**
 * 走势点：把逐 Key 历史按回源时刻聚合（同一时刻各 Key 剩余求和），
 * 时间升序输出——折线的一个点 = 「那一刻这家供应商的总余额」。
 */
const trend = computed(() => {
  const byTime = new Map<number, number>()
  for (const p of history.value) {
    if (!p || !p.ok) continue
    const r = Number(p.remain)
    const t = Number(p.synced_at)
    if (!Number.isFinite(r) || !Number.isFinite(t)) continue
    byTime.set(t, (byTime.get(t) || 0) + r)
  }
  return [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, v }))
})

/** 折线 y 坐标（SVG 向下为正）：按剩余值线性映射到画布高度，上下各留 4px 边距 */
const trendYOf = (v: number, min: number, span: number) =>
  span > 0 ? TREND_H - 4 - ((v - min) / span) * (TREND_H - 8) : TREND_H / 2

/** 折线路径：x 均分时间点，y 按剩余值线性映射到画布高度（上下各留 4px 边距） */
const trendPath = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return ''
  const values = pts.map((p) => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const stepX = TREND_W / (pts.length - 1)
  return pts.map((p, i) => {
    const x = (i * stepX).toFixed(1)
    const y = trendYOf(p.v, min, span).toFixed(1)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

/** 面积路径：折线闭合到底边，配合渐变垫出「余额池」的体量感 */
const trendAreaPath = computed(() => {
  const line = trendPath.value
  if (!line) return ''
  return `${line} L${TREND_W},${TREND_H} L0,${TREND_H} Z`
})

/** y 轴参考刻度：顶值 / 半程 / 零三条淡网格线（与折线同一 y 映射换算成 top%；落画布外的丢弃） */
const trendGrid = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return []
  const values = pts.map((p) => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (!(max > 0)) return []
  const span = max - min
  const out: Array<{ key: string; top: string; text: string }> = []
  ;[max, max / 2, 0].forEach((v, idx) => {
    const pct = (trendYOf(v, min, span) / TREND_H) * 100
    if (pct < 0 || pct > 100) return
    out.push({ key: `lv${idx}`, top: `${pct.toFixed(2)}%`, text: money(v) })
  })
  return out
})

/**
 * 多 Key 分线：每个 Key 一条淡线，总量主线保持最醒目。
 * x 按时间定标（与总量线的均匀分点略有差别，但各 Key 之间可比），
 * y 与总量线同一映射；Key 只有 1 个时不画——总量线就是它。
 */
const trendKeyLines = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return []
  const values = pts.map((p) => p.v)
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  const byKey = new Map<string, Array<{ t: number; v: number }>>()
  for (const p of history.value) {
    if (!p || !p.ok) continue
    const r = Number(p.remain)
    const t = Number(p.synced_at)
    if (!Number.isFinite(r) || !Number.isFinite(t)) continue
    const key = p.key_mask || '未知'
    const arr = byKey.get(key)
    if (arr) arr.push({ t, v: r })
    else byKey.set(key, [{ t, v: r }])
  }
  if (byKey.size < 2) return []
  const tMin = pts[0].t
  const tSpan = pts[pts.length - 1].t - tMin || 1
  const palette = ['#4c8dff', '#67c23a', '#e6a23c', '#f56c6c', '#9d6ff0', '#00b8a9']
  const out: Array<{ mask: string; color: string; path: string }> = []
  ;[...byKey.entries()].forEach(([mask, series], idx) => {
    if (series.length < 2) return
    series.sort((a, b) => a.t - b.t)
    const path = series.map((pt, j) => {
      const x = (((pt.t - tMin) / tSpan) * TREND_W).toFixed(1)
      const y = trendYOf(pt.v, min, span).toFixed(1)
      return `${j === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
    out.push({ mask, color: palette[idx % palette.length], path })
  })
  return out
})

/**
 * 失败回源断点：窗口内回源失败的时点，在走势底缘标红点。
 * 聚合只算 ok 的读数，全 Key 失败的轮次会在折线上留缺口——这些红点解释缺口从哪来。
 */
const trendFailMarks = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return []
  const tMin = pts[0].t
  const tMax = pts[pts.length - 1].t
  const tSpan = tMax - tMin || 1
  const seen = new Set<number>()
  const out: Array<{ left: string; text: string }> = []
  for (const p of history.value) {
    if (!p || p.ok !== false) continue
    const t = Number(p.synced_at)
    if (!Number.isFinite(t) || t < tMin || t > tMax || seen.has(t)) continue
    seen.add(t)
    out.push({ left: `${(((t - tMin) / tSpan) * 100).toFixed(2)}%`, text: `回源失败 · ${trendTimeText(t)}` })
  }
  return out.slice(0, 80)
})

/** 末点标注定位：left 恒在右边缘，top 按末点 y 比例（HTML 定位，不随 viewBox 拉伸变形） */
const trendLastStyle = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return { left: '100%', top: '50%' }
  const values = pts.map((p) => p.v)
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  const y = trendYOf(pts[pts.length - 1].v, min, span)
  return { left: '100%', top: `${((y / TREND_H) * 100).toFixed(2)}%` }
})

/** 走势点时间文案（MM-DD HH:mm） */
const trendTimeText = (t: number) => {
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 走势首尾时间（「MM-DD HH:mm → MM-DD HH:mm」） */
const trendRangeText = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return ''
  return `${trendTimeText(pts[0].t)} → ${trendTimeText(pts[pts.length - 1].t)}`
})

/** 近 7 天变化量（末点 - 首点；null = 点数不足） */
const trendDelta = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return null
  return pts[pts.length - 1].v - pts[0].v
})

/** 变化量文案：带正负号（余额减少是正常消耗，统一用弱化色，不做好坏渲染） */
const trendDeltaText = computed(() => {
  const d = trendDelta.value
  if (d === null || !Number.isFinite(d)) return ''
  return `${d > 0 ? '+' : ''}${money(d)}`
})

/**
 * 消耗速率与预计可用天数：按当前窗口走势首尾斜率线性外推（纯前端估算）。
 *
 * <p>日均消耗 =（首点余额 − 末点余额）/ 跨度天数；预计可用天数 = 末点余额 ÷ 日均消耗。
 * 余额持平或净增加（充值 / 未消耗）时返回 null，不显示估算——增长无法外推「耗尽」。</p>
 */
const burnRate = computed<{ perDay: number; daysLeft: number } | null>(() => {
  const pts = trend.value
  if (pts.length < 2) return null
  const spanMs = pts[pts.length - 1].t - pts[0].t
  if (spanMs <= 0) return null
  const drop = pts[0].v - pts[pts.length - 1].v
  if (drop <= 0) return null
  const perDay = drop / (spanMs / 86400000)
  if (!Number.isFinite(perDay) || perDay <= 0) return null
  const daysLeft = pts[pts.length - 1].v / perDay
  return Number.isFinite(daysLeft) && daysLeft >= 0 ? { perDay, daysLeft } : null
})

/** 预计可用天数文案：不足 1 天 / 999 天封顶展示，其余取整天数 */
const burnText = computed(() => {
  const b = burnRate.value
  if (!b) return ''
  if (b.daysLeft < 1) return '按当前消耗不足 1 天'
  const days = Math.round(b.daysLeft)
  return `按当前消耗约还能用 ${days > 999 ? '999+' : days} 天`
})

/** 估算口径说明（悬浮提示）：写清是「窗口首尾斜率」的粗估，充值/消耗变化都会改变结果 */
const burnTitle = computed(() => {
  const b = burnRate.value
  if (!b) return ''
  const last = trend.value[trend.value.length - 1]
  return `按近 ${trendDays.value} 天走势首尾线性外推：日均消耗约 ${money(b.perDay)}，`
    + `当前余额 ${money(last?.v)}；充值或消耗变化都会改变估算结果`
})

/** 峰值单日消耗：窗口内按自然日聚合，取「日内首尾差」最大的一天（净充值日为负不计） */
const peakDayDrop = computed(() => {
  const pts = trend.value
  if (pts.length < 2) return null
  const byDay = new Map<string, { first: number; last: number }>()
  for (const p of pts) {
    const d = new Date(p.t)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const cur = byDay.get(key)
    if (cur) cur.last = p.v
    else byDay.set(key, { first: p.v, last: p.v })
  }
  let peak: number | null = null
  for (const { first, last } of byDay.values()) {
    const drop = first - last
    if (drop > 0 && (peak === null || drop > peak)) peak = drop
  }
  return peak
})

/** 消耗统计小卡：日均消耗 + 峰值单日消耗（都算不出来时不渲染整行） */
const trendStats = computed(() => {
  const items: Array<{ label: string; value: string; title: string }> = []
  const b = burnRate.value
  if (b) items.push({ label: '日均消耗', value: money(b.perDay), title: `按近 ${trendDays.value} 天走势首尾斜率估算的日均消耗` })
  const peak = peakDayDrop.value
  if (peak !== null) items.push({ label: '峰值单日消耗', value: money(peak), title: '窗口内按自然日聚合的最大单日消耗' })
  return items
})

/**
 * 预测性低量提醒：按当前日均消耗外推「约几天后跌破告警阈值」。
 * 阈值取后端实时回传的 warn.threshold（缓存路径没有就不提示）；已触发（徽标已提示）
 * 或预计一个月开外不提示，避免常驻噪音。
 */
const creditForecast = computed(() => {
  const b = burnRate.value
  const threshold = Number(meta.value.warn?.threshold)
  const last = trend.value[trend.value.length - 1]
  const remain = Number(last?.v)
  if (!b || !Number.isFinite(threshold) || !Number.isFinite(remain) || b.perDay <= 0) return null
  const days = (remain - threshold) / b.perDay
  if (!Number.isFinite(days) || days <= 0 || days > 30) return null
  const dayText = days < 1 ? '不足 1 天' : `约 ${Math.max(1, Math.round(days))} 天`
  return {
    text: `按当前消耗速度，${dayText}后跌破告警阈值 ${money(threshold)}`,
    urgent: days <= 7,
    title: `按近 ${trendDays.value} 天日均消耗 ${money(b.perDay)} 线性外推的预测；充值或消耗变化都会改变结果`,
  }
})

/** 导出当前窗口余额历史为 CSV（带 BOM，Excel 直接打开不乱码）；纯前端拼装，失败不弹层 */
const exportHistoryCsv = () => {
  const rows = history.value
  if (!rows.length) return
  const pad = (n: number) => String(n).padStart(2, '0')
  const timeText = (ms: number) => {
    const d = new Date(ms)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    ['回源时间', 'Key 掩码', '状态', '剩余', '已用', '币种', '来源'].join(','),
    ...rows.map((r) => [
      esc(r?.synced_at ? timeText(Number(r.synced_at)) : ''),
      esc(r?.key_mask ?? ''),
      esc(r?.ok ? '成功' : '失败'),
      esc(r?.remain ?? ''),
      esc(r?.used ?? ''),
      esc(r?.currency ?? ''),
      esc(r?.source ?? ''),
    ].join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `余额走势-${String(props.providerId || 'provider')}-${trendDays.value}天.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 鼠标悬停的走势点下标（null = 未悬停） */
const hoverIdx = ref<number | null>(null)

/** 键盘聚焦的走势点下标（null = 未聚焦）；与悬停共用同一套读数与竖线 */
const focusIdx = ref<number | null>(null)

/** 展示用焦点下标：鼠标悬停优先，其次键盘焦点 */
const activeIdx = computed(() => hoverIdx.value ?? focusIdx.value)

/** 读数竖线位置：焦点点的横向百分比（null = 无焦点），与读数气泡同点对齐 */
const cursorLeft = computed(() => {
  const pts = trend.value
  const i = activeIdx.value
  if (i === null || pts.length < 2) return null
  const idx = Math.min(pts.length - 1, Math.max(0, i))
  return `${((idx / (pts.length - 1)) * 100).toFixed(2)}%`
})

/** 悬停时把鼠标位置换算成最近的数据点（x 均分，比例映射回下标） */
const onTrendMove = (e: MouseEvent) => {
  const pts = trend.value
  if (pts.length < 2) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0
  hoverIdx.value = Math.min(pts.length - 1, Math.max(0, Math.round(ratio * (pts.length - 1))))
}

/** 离开走势区：收起悬停读数与竖线（键盘焦点不受影响） */
const onTrendLeave = () => {
  hoverIdx.value = null
}

/** 走势区获得键盘焦点：默认停在最新读数点 */
const onTrendFocus = () => {
  const pts = trend.value
  if (pts.length < 2) return
  if (focusIdx.value === null) focusIdx.value = pts.length - 1
}

/** 走势区失焦：收起键盘读数与竖线 */
const onTrendBlur = () => {
  focusIdx.value = null
}

/** 键盘逐点读数：←/→ 移动、Home/End 跳首末、Esc 收起；方向键不滚动页面 */
const onTrendKeydown = (e: KeyboardEvent) => {
  const pts = trend.value
  if (pts.length < 2) return
  const lastIdx = pts.length - 1
  const cur = Math.min(lastIdx, Math.max(0, focusIdx.value ?? lastIdx))
  if (e.key === 'ArrowLeft') {
    focusIdx.value = Math.max(0, cur - 1)
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    focusIdx.value = Math.min(lastIdx, cur + 1)
    e.preventDefault()
  } else if (e.key === 'Home') {
    focusIdx.value = 0
    e.preventDefault()
  } else if (e.key === 'End') {
    focusIdx.value = lastIdx
    e.preventDefault()
  } else if (e.key === 'Escape') {
    focusIdx.value = null
    e.preventDefault()
  }
}

/** 悬停 / 键盘焦点的读数：跟随最近数据点的文字与位置（left 用百分比，配合横向拉伸坐标） */
const trendTip = computed(() => {
  const pts = trend.value
  if (activeIdx.value === null || pts.length < 2) return null
  const i = Math.min(pts.length - 1, Math.max(0, activeIdx.value))
  // 靠近左右边缘时翻转对齐，读数始终留在图内：默认居中于点，边域改为单侧贴齐
  const ratio = i / (pts.length - 1)
  const transform = ratio > 0.72
    ? 'translate(calc(-100% + 10px), -100%)'
    : ratio < 0.28
      ? 'translate(-10px, -100%)'
      : 'translate(-50%, -100%)'
  return {
    text: `${trendTimeText(pts[i].t)} · ${money(pts[i].v)}`,
    style: { left: `${(ratio * 100).toFixed(2)}%`, transform },
  }
})

/** 拉一次余额历史（失败静默：走势是增值信息，不影响余额主链路） */
const loadHistory = async () => {
  const providerId = String(props.providerId || '').trim()
  if (!providerId) return
  const days = trendDays.value
  // 窗口越大给越多配额：后端 limit 夹取 1~2000（5 分钟一采，90 天全量远超 500 条）
  const limit = days >= 90 ? 2000 : days >= 30 ? 1000 : 500
  try {
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(providerId)}/credit/history?days=${days}&limit=${limit}`)
    const data = res?.data ?? res
    // 切窗竞态防护：响应回来时窗口已再变，丢弃旧窗口数据
    if (trendDays.value !== days) return
    history.value = Array.isArray(data) ? (data as CreditHistoryPoint[]) : []
  } catch {
    if (trendDays.value === days) history.value = []
  }
}

/* ==================== 用量归因 ==================== */

/** 归因·密钥维度行（GET /credit/attribution 的 keys 元素；后端契约字段保持 snake_case） */
interface CreditKeyAttribution {
  /** 密钥掩码（后端不落明文） */
  key_mask: string
  /** 窗口内成功读数条数 */
  samples: number
  first_synced_at?: number | null
  last_synced_at?: number | null
  start_remain?: number | null
  end_remain?: number | null
  /** 余额变化（期末 − 期初；负数=消耗，正数=充值） */
  consumed?: number | null
  /** 上游已用变化（上游报了 used 才有） */
  used_delta?: number | null
  currency?: string | null
}

/** 归因·模型维度行（GET /credit/attribution 的 models 元素；cost 单位为元） */
interface CreditModelAttribution {
  model: string
  calls: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
}

/** 归因载荷（GET /credit/attribution 响应体） */
interface CreditAttributionPayload {
  provider_id: string
  days: number
  window_start?: number | null
  keys: CreditKeyAttribution[]
  models: CreditModelAttribution[]
  /** 模型维度口径说明（渠道无模型清单时后端给出提示） */
  model_note?: string | null
  /** 命中的用量服务商取值（透明展示用） */
  providers?: string[] | null
}

/** 归因时间窗可选值（天）：后端 days 夹取 1~90，这里只开常用两档 */
const ATTRIBUTION_WINDOWS = [7, 30] as const

/** 归因时间窗偏好在 localStorage 里的键 */
const ATTR_DAYS_STORAGE_KEY = 'pc-credit-attr-days'

/** 读一次归因时间窗偏好；值不在候选里（或读不到，如隐私模式）时回退 7 天 */
const readStoredAttrDays = (): number => {
  try {
    const v = Number(window.localStorage.getItem(ATTR_DAYS_STORAGE_KEY))
    return (ATTRIBUTION_WINDOWS as readonly number[]).includes(v) ? v : 7
  } catch {
    return 7
  }
}

/** 归因区块展开态：默认收起，首次展开才拉数据 */
const attrOpen = ref(false)
/** 当前归因时间窗（天）：初值来自上次保存的偏好 */
const attributionDays = ref<number>(readStoredAttrDays())
const attribution = ref<CreditAttributionPayload | null>(null)
const attributionLoading = ref(false)
const attributionError = ref('')

/**
 * 拉一次用量归因（纯只读统计，不回源上游）。
 *
 * <p>失败写进 attributionError，不影响余额主链路；同窗口已有数据时不重发，
 * 点「刷新」或切窗后 force 重拉。</p>
 */
const loadAttribution = async (force = false) => {
  const providerId = String(props.providerId || '').trim()
  if (!providerId || attributionLoading.value) return
  if (!force && attribution.value && attribution.value.days === attributionDays.value) return
  attributionLoading.value = true
  attributionError.value = ''
  const days = attributionDays.value
  try {
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(providerId)}/credit/attribution?days=${days}`)
    const data = res?.data ?? res
    // 切窗竞态防护：响应回来时窗口已再变，丢弃旧窗口数据
    if (attributionDays.value !== days) return
    attribution.value = data && typeof data === 'object' ? data : null
  } catch (e: any) {
    if (attributionDays.value === days) {
      attribution.value = null
      attributionError.value = e?.response?.data?.message || e?.message || '用量归因接口不可用'
    }
  } finally {
    attributionLoading.value = false
  }
}

/** 切换归因时间窗并持久化偏好：开着的直接重拉，收起的等展开再取 */
const setAttributionWindow = (d: number) => {
  if (attributionDays.value === d) return
  attributionDays.value = d
  try {
    window.localStorage.setItem(ATTR_DAYS_STORAGE_KEY, String(d))
  } catch {
    /* 存不进就算了：偏好是增值信息，不影响归因本身 */
  }
  if (attrOpen.value) void loadAttribution(true)
}

/** 展开 / 收起归因区块：首次展开按当前窗口拉一次 */
const toggleAttribution = () => {
  attrOpen.value = !attrOpen.value
  if (attrOpen.value) void loadAttribution()
}

/** 期初 → 期末 文案：任一端读数缺失显示 — */
const attrRangeText = (k: CreditKeyAttribution) => {
  const s = Number(k.start_remain)
  const e = Number(k.end_remain)
  return `${Number.isFinite(s) ? money(s) : '—'} → ${Number.isFinite(e) ? money(e) : '—'}`
}

/** 是否充值：consumed = 期末 − 期初 > 0 视为余额增加 */
const attrIsRecharge = (k: CreditKeyAttribution) => Number(k.consumed) > 0

/** 消耗文案：消耗取绝对值正常展示，充值带 + 号 */
const attrConsumedText = (k: CreditKeyAttribution) => {
  const c = Number(k.consumed)
  if (!Number.isFinite(c)) return '—'
  return c > 0 ? `+${money(c)}` : money(Math.abs(c))
}

/** 消耗单元格分色：充值绿、正常消耗次级文本色、无读数弱化 */
const attrConsumedTone = (k: CreditKeyAttribution) => {
  const c = Number(k.consumed)
  if (!Number.isFinite(c)) return 'is-muted'
  return c > 0 ? 'is-recharge' : 'is-spend'
}

/** Key 行悬浮说明：期初/期末时间与上游已用变化一并写清 */
const attrKeyTitle = (k: CreditKeyAttribution) => {
  const bits = [`Key ${k.key_mask}`]
  if (k.first_synced_at) bits.push(`期初 ${trendTimeText(k.first_synced_at)}`)
  if (k.last_synced_at) bits.push(`期末 ${trendTimeText(k.last_synced_at)}`)
  const used = Number(k.used_delta)
  if (Number.isFinite(used) && used !== 0) bits.push(`上游已用变化 ${money(Math.abs(used))}`)
  bits.push(`${k.samples} 条成功读数`)
  return bits.join('；')
}

/** 模型区块标题悬浮说明：口径边界透明（只统计本渠道模型清单内的模型） */
const attrModelTitle = computed(() => {
  const prov = attribution.value?.providers?.length
    ? `（用量来源：${attribution.value.providers.join('、')}）`
    : ''
  return `按用量日汇总聚合${prov}；只统计本渠道模型清单内的模型`
})

/** 模型行悬浮说明：输入/输出 token 拆分与成本 */
const attrModelRowTitle = (m: CreditModelAttribution) =>
  `${m.model}：调用 ${m.calls} 次，输入 ${m.prompt_tokens} / 输出 ${m.completion_tokens} token，成本 ${m.cost} 元`

/* ==================== 耗尽预测（由归因窗口数据线性外推，纯前端估算） ==================== */

/** 读取数值：null/undefined 一律按缺失（NaN）处理，避免 Number(null)=0 被误当成零消耗 */
const attrNum = (v: number | null | undefined) => (v == null ? Number.NaN : Number(v))

/**
 * 单 Key 消耗速率：日均消耗 = 窗口消耗 ÷ 天数。
 * Key 中途接入时按首末读数的真实跨度折算，避免速率被整窗口天数稀释。
 */
const attrKeyRate = (k: CreditKeyAttribution): { remain: number; dailyBurn: number } | null => {
  const remain = attrNum(k.end_remain)
  const consumed = attrNum(k.consumed)
  if (!Number.isFinite(remain) || !Number.isFinite(consumed)) return null
  const spanMs = attrNum(k.last_synced_at) - attrNum(k.first_synced_at)
  const spanDays = Number.isFinite(spanMs) && spanMs > 0 ? spanMs / 86400000 : 0
  const denom = spanDays >= 1 ? spanDays : attributionDays.value
  return { remain, dailyBurn: -consumed / denom }
}

/** 可用天数文案 */
const attrDaysLeftText = (days: number | null | undefined) => {
  if (days == null || !Number.isFinite(days)) return '—'
  if (days < 1) return '不足1天'
  if (days > 999) return '999+天'
  return `${Math.round(days)}天`
}

/** Key 行「预计可用」单元格文案 */
const attrKeyForecastText = (k: CreditKeyAttribution) => {
  const r = attrKeyRate(k)
  if (!r) return '—'
  if (r.remain <= 0) return '已耗尽'
  if (r.dailyBurn <= 0) return '净充值'
  return attrDaysLeftText(r.remain / r.dailyBurn)
}

/** Key 行预测单元格分档标色：≤3 天危急、≤7 天预警 */
const attrKeyForecastTone = (k: CreditKeyAttribution) => {
  const r = attrKeyRate(k)
  if (!r) return ''
  if (r.remain <= 0) return 'is-urgent'
  if (r.dailyBurn <= 0) return ''
  const days = r.remain / r.dailyBurn
  if (days <= 3) return 'is-urgent'
  if (days <= 7) return 'is-warn'
  return ''
}

/**
 * 整体耗尽预测：合计期末余额 ÷ 合计日均消耗（各 Key 按各自真实读数跨度折算后再求和）。
 * 无 keys 读数时返回 null 不展示。
 */
const attrForecast = computed(() => {
  const keys = attribution.value?.keys ?? []
  if (!keys.length) return null
  let remain = 0
  let burn = 0
  for (const k of keys) {
    const r = attrKeyRate(k)
    if (!r) continue
    if (r.remain > 0) remain += r.remain
    if (r.dailyBurn > 0) burn += r.dailyBurn
  }
  const daysLeft = burn > 0 ? remain / burn : null
  let dateText: string | null = null
  if (daysLeft != null) {
    const d = new Date(Date.now() + daysLeft * 86400000)
    dateText = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return { remain, burn, daysLeft, dateText }
})

/** 预测口径说明（悬浮展示，假设透明：线性外推、充值即失效） */
const attrForecastTitle =
  '按窗口内余额读数差分线性外推：日均消耗 = 消耗量 ÷ 天数（Key 中途接入时按首末读数真实跨度折算）；'
  + '线性预测仅供参考，中途充值会使预测失效，请以最新读数为准'

/** 余额定时采样运行状态（GET /credit/sample-status；失败静默，不影响面板主链路） */
interface CreditSampleStatus {
  enabled?: boolean
  running?: boolean
  interval_seconds?: number | null
  last_run_at?: number | null
  last_duration_ms?: number | null
  next_run_at?: number | null
  providers?: number | null
  touched?: number | null
  succeeded?: number | null
}

const sampleStatus = ref<CreditSampleStatus | null>(null)

/** 拉一次定时采样状态（全局端点，不随供应商切换变化） */
const loadSampleStatus = async () => {
  try {
    const res: any = await adminApi.get('/api/providers/credit/sample-status')
    sampleStatus.value = res?.data ?? res
  } catch {
    sampleStatus.value = null
  }
}

/** 采样状态一句话：「每 5 分钟 · 上次 14:32（6/8 个有读数）· 下次 14:37」；开关关闭时不显示 */
const sampleText = computed(() => {
  const s = sampleStatus.value
  if (!s || !s.enabled) return ''
  const parts: string[] = []
  const interval = Number(s.interval_seconds)
  if (Number.isFinite(interval) && interval > 0) {
    parts.push(interval % 60 === 0 ? `每 ${interval / 60} 分钟` : `每 ${interval} 秒`)
  }
  const fmtTime = (t?: number | null) => {
    if (!t) return ''
    const d = new Date(t)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  if (s.last_run_at) {
    let seg = `上次 ${fmtTime(s.last_run_at)}`
    if (s.touched != null) seg += `（${s.succeeded ?? 0}/${s.touched} 个有读数）`
    parts.push(seg)
  }
  if (s.next_run_at) parts.push(`下次 ${fmtTime(s.next_run_at)}`)
  return parts.join(' · ')
})

/** 拉一次余额（失败不抛：错误写进 error，面板保持可见）；force=true 跳过服务端缓存强制回源 */
const load = async (force = false) => {
  const providerId = String(props.providerId || '').trim()
  if (!providerId || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const refresh = force ? '?refresh=true' : ''
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(providerId)}/credit${refresh}`)
    const data = res?.data ?? res
    meta.value = data && typeof data === 'object' ? data : {}
    rows.value = Array.isArray(meta.value.keys) ? (meta.value.keys as CreditRow[]) : []
    if (meta.value.message) error.value = String(meta.value.message)
    // 历史走势与定时采样状态非阻塞加载：失败不影响余额主链路
    void loadHistory()
    void loadSampleStatus()
  } catch (e: any) {
    rows.value = []
    meta.value = {}
    error.value = e?.response?.data?.message || e?.message || '余额接口不可用'
  } finally {
    loading.value = false
  }
}

/** 空态「立即刷新」：强制回源一次余额（顺带重拉历史）——走势读数就是这么积累出来的 */
const refreshTrend = () => {
  void load(true)
}

watch(() => props.providerId, () => {
  rows.value = []
  meta.value = {}
  error.value = ''
  history.value = []
  expanded.value = false
  trendDays.value = readStoredTrendDays()
  alertOpen.value = false
  lastPushedAt.value = null
  attrOpen.value = false
  attribution.value = null
  attributionError.value = ''
  load()
})

// 供应商保存成功后重拉：密钥 / 口径 / 告警阈值都可能已变；force 跳过 5 分钟缓存，
// 让「保存后立即能看到新配置生效」（只改名称等与余额无关的字段也会多查一次，可接受）
watch(() => props.refreshTick, (tick, prev) => {
  if (tick !== prev && tick > 0) load(true)
})

onMounted(load)
</script>

<style scoped>
/* ===== 吸底条（07 版式）=====
   贴住宿主右栏底边：不描边、不圆角，只用一条上发丝线切分，
   避免在页面里看起来像一个「飘着的卡片」。

   底色用「抬升面」而不是容器底色：
   --el-bg-color 与宿主右栏（--color-surface / --bg-container）是同一个值，
   深色下 #161c27 压 #161c27 会完全融进背景，看起来像没有面板；
   抬升面（亮 #fbfbff / 暗 #1e293b）才是这一层「卡片」该有的颜色。
   向上的柔和投影只用来把这条压在滚动的模型列表之上，不制造悬浮卡片感。 */
.pc-bar {
  flex-shrink: 0;
  padding: 7px 16px;
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--bg-elevated, var(--el-bg-color-overlay, var(--el-bg-color)));
  box-shadow: 0 -10px 24px rgba(2, 6, 23, 0.1);
}
/* 宿主包装：详情浮层以吸底条为锚（bottom:100%）向上浮出，不挤占模型列表空间 */
.pc-host {
  position: relative;
  flex-shrink: 0;
}
/* 吸底条点开后的详情浮层：复用详情卡排版，限高内部滚动（pools / metrics 明细都在这） */
.pc.is-pop {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 12px;
  right: 12px;
  max-width: none;
  max-height: min(46vh, 460px);
  overflow: auto;
  margin: 0;
  z-index: 30;
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.12);
}
/* 整条余额栏即展开开关：点任意位置（标题 / 汇总 / Key 胶囊）浮出或收起详情卡 */
.pc-bar__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}
.pc-bar__main:hover {
  background: color-mix(in srgb, var(--el-fill-color-light, rgba(0, 0, 0, 0.04)) 55%, transparent);
}
.pc-bar__main:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.pc-bar__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
/* 余额低量告警徽标：吸底条与详情卡各一枚；warning 色唤起注意但不打断余额读数 */
.pc-bar__warn,
.pc-warn-badge {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 45%, transparent);
  white-space: nowrap;
}
/* 徽标可点开告警设置浮层：手型 + 悬停加深，不改变 warning 语义 */
.pc-bar__warn,
.pc-warn-badge {
  cursor: pointer;
}
.pc-bar__warn:hover,
.pc-warn-badge:hover {
  background: color-mix(in srgb, var(--el-color-warning) 26%, transparent);
}

/* 告警设置浮层：贴详情卡头部右下，不占布局流（.pc 有 layout containment，作定位基准） */
.pc-alert-pop {
  position: absolute;
  top: 46px;
  right: 14px;
  z-index: 30;
  width: 320px;
  max-width: calc(100% - 28px);
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 10px;
  background: var(--bg-elevated, var(--el-bg-color));
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
}
.pc-alert-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.pc-alert-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text, var(--el-text-color-primary));
}
.pc-alert-close {
  border: 0;
  background: transparent;
  font-size: 16px;
  line-height: 1;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
  cursor: pointer;
  padding: 2px 4px;
}
.pc-alert-facts {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
/* 最近推送留痕：时间 + 类型 + 余额/阈值 + 接收人，低量红点恢复绿点 */
.pc-alert-logs {
  margin-bottom: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle, var(--el-border-color-lighter));
}
.pc-alert-logs__title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
  margin-bottom: 6px;
}
.pc-alert-logs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 168px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.pc-alert-log {
  position: relative;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 8px;
  font-size: 11px;
  line-height: 1.5;
  padding-left: 12px;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
}
.pc-alert-log::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
}
.pc-alert-log.is-recovery::before {
  background: var(--el-color-success);
}
.pc-alert-log__time {
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-alert-log__type {
  font-weight: 600;
  color: var(--el-color-danger);
}
.pc-alert-log.is-recovery .pc-alert-log__type {
  color: var(--el-color-success);
}
.pc-alert-log__fact {
  font-variant-numeric: tabular-nums;
}
.pc-alert-log__recv {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-alert-fact {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}
.pc-alert-fact i {
  font-style: normal;
  font-size: 10px;
  color: var(--color-text-disabled, var(--el-text-color-placeholder));
}
.pc-alert-fact b {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text, var(--el-text-color-primary));
  font-variant-numeric: tabular-nums;
}
.pc-alert-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 8px;
}
.pc-alert-label {
  font-size: 10.5px;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
}
.pc-alert-input {
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--border-subtle, var(--el-border-color));
  border-radius: 6px;
  background: var(--bg-fill, var(--el-fill-color-blank));
  color: var(--color-text, var(--el-text-color-primary));
  font-size: 12px;
  outline: none;
}
.pc-alert-input:focus {
  border-color: var(--el-color-primary);
}
.pc-alert-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 2px 0;
}
.pc-alert-channel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text, var(--el-text-color-primary));
  cursor: pointer;
}
.pc-alert-channel input {
  margin: 0;
  accent-color: var(--el-color-primary);
}
.pc-alert-log__chan {
  flex: none;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--el-border-color));
  font-size: 10px;
  line-height: 16px;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
}
.pc-alert-err {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--el-color-danger);
}
.pc-alert-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.pc-alert-btn {
  height: 26px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, var(--el-border-color));
  background: transparent;
  color: var(--color-text, var(--el-text-color-primary));
  font-size: 12px;
  cursor: pointer;
}
.pc-alert-btn.is-primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.pc-alert-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.pc-bar__chev { display: inline-block; flex: none; }
.pc-bar__chev.is-open { transform: rotate(180deg); }
.pc-bar__total {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--el-bg-color, var(--el-fill-color-lighter));
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.pc-bar__label { color: var(--text-tertiary, var(--el-text-color-placeholder)); }
.pc-bar__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-bar__bar {
  position: relative;
  width: 52px;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-bar__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-bar__pct {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
.pc-bar__scope {
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  padding-left: 6px;
  border-left: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}
.pc-bar__key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color, var(--el-fill-color-light));
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  cursor: help;
}
.pc-bar__key b {
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.pc-bar__key.is-low {
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
}
.pc-bar__key.is-low b { color: var(--el-color-danger); }
.pc-bar__key.is-mid {
  border-color: color-mix(in srgb, var(--el-color-warning) 35%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
}
.pc-bar__key.is-mid b { color: var(--el-color-warning); }
.pc-bar__key.is-bad { opacity: 0.7; }
.pc-bar__mask {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 10.5px;
}
.pc-bar__err {
  font-size: 11px;
  color: var(--el-color-danger);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 全 Key 都没查到时的一行「已尝试」链路：灰字，不抢错误色 */
.pc-bar__chain {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}
/* 读数缓存标识：5 分钟内复用出网结果，点「刷新」强制回源 */
.pc-cache {
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px dashed var(--el-border-color);
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
  cursor: help;
}
.pc-bar__reload { margin-left: auto; }

.pc {
  position: relative;
  /*
   * 区块自己当容器：两列与否只看本块宽度，不看窗口宽度（详情的左栏可能很窄）。
   */
  container-type: inline-size;
  margin: 14px 0 4px auto;
  max-width: 980px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 10px;
  background: var(--bg-elevated, var(--el-bg-color));
}
/* 多个 Key：整块吸在底部，滚模型列表时余额一直在视野里 */
.pc.is-pinned {
  position: sticky;
  bottom: 8px;
  z-index: 3;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(6px);
}
.pc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pc-head-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pc-kind,
.pc-level,
.pc-scope {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  white-space: nowrap;
}
.pc-kind,
.pc-level {
  border: 1px dashed var(--el-border-color);
  background: transparent;
}
.pc-reload {
  margin-left: auto;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.pc-reload:hover:not(:disabled) {
  color: var(--el-color-primary);
}
.pc-reload:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 顶部汇总 pill：剩余 / 总量 + 64×5 条 + 百分比 */
.pc-total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.pc-total__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--bg-elevated, var(--el-fill-color-lighter));
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.pc-total__label {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-total__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-total__bar {
  position: relative;
  width: 64px;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-total__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-total__pct {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
.pc-total__scope {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  padding-left: 6px;
  border-left: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}

.pc-empty {
  margin-top: 10px;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 8px;
}
.pc-error {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-color-danger);
  word-break: break-all;
}
/* 全部 Key 都没查到数时的「已尝试」链路：说明自动识别试过哪几条口径 */
.pc-chain {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  word-break: break-all;
}

/* 每个 Key 一张卡：一行两列（容器够宽时） */
.pc-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
}
@container (min-width: 860px) {
  .pc-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.pc-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--el-bg-color);
  min-width: 0;
}
.pc-card.is-bad {
  background: var(--el-bg-color);
}
.pc-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pc-card__mask {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-card__src {
  padding: 0 6px;
  border: 1px dashed var(--el-border-color);
  border-radius: 999px;
  font-size: 10px;
  line-height: 16px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
}
.pc-card__pct {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  white-space: nowrap;
}
/* 只剩两成以下才变红：正常余额不该一直报警 */
.pc-card__pct.is-low {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
/* 五成以下转琥珀：低量预警分两档，避免「快见底」和「消耗过半」看起来一样紧急 */
.pc-card__pct.is-mid {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
}
/* 较上一采样点的涨跌徽标：涨绿 / 跌红 / 平灰，紧跟剩余占比之后 */
.pc-card__delta {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pc-card__delta.is-up {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.pc-card__delta.is-down {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.pc-card__delta.is-flat {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  background: var(--el-fill-color-light, transparent);
}
.pc-card__nums {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.pc-card__value {
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-card__of {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-card__bar {
  position: relative;
  display: block;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-card__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
/* Moss 这类上游一次带回的读数：冻结 / 本月已用 / 日均消费 / 预计可用天数 */
.pc-card__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pc-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.pc-metric i {
  font-style: normal;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-metric b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-metric em {
  font-style: normal;
  font-size: 10px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* ModelScope 官网用量口径：只有当日调用数，单独一行读数，不画假进度条 */
.pc-usage {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  width: fit-content;
}
.pc-usage__label {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-usage__value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
/* 供应商专属结构化视图（extra.pools）：SenseNova 的资源池 × 滚动窗口 */
.pc-pools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pc-pools__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.pc-pools__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--el-text-color-secondary);
}
.pc-pools__plan {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-pools__unit {
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-pool {
  padding: 8px 10px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 8px;
  background: var(--bg-elevated, var(--el-fill-color-lighter));
}
.pc-pool__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.pc-pool__name {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-pool__grant {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  font-variant-numeric: tabular-nums;
  cursor: help;
}
.pc-pool__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.pc-pool__row + .pc-pool__row {
  margin-top: 4px;
}
.pc-pool__label {
  min-width: 44px;
  flex-shrink: 0;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
}
/* 窗口重置时间（z.ai 的 nextResetTime）：贴在窗口行下方的小字 */
.pc-pool__reset {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
.pc-pool__bar {
  position: relative;
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-pool__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-pool__num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pc-pool__num b,
.pc-sub__num b {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
/* 剩余不足两成转红、五成以下转琥珀：进度条分档与徽章同口径 */
.pc-pool__bar.is-low i,
.pc-sub__bar.is-low i,
.pc-card__bar.is-low i,
.pc-total__bar.is-low i,
.pc-bar__bar.is-low i {
  background: var(--el-color-danger);
}
.pc-pool__bar.is-mid i,
.pc-sub__bar.is-mid i,
.pc-card__bar.is-mid i,
.pc-total__bar.is-mid i,
.pc-bar__bar.is-mid i {
  background: var(--el-color-warning);
}
/* 供应商专属结构化视图（extra.subscriptions）：sub2api 的订阅 × 额度窗口 */
.pc-subs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pc-sub {
  padding: 8px 10px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 8px;
  background: var(--bg-elevated, var(--el-fill-color-lighter));
}
.pc-sub__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  min-width: 0;
}
.pc-sub__name {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-sub__win,
.pc-sub__status {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  white-space: nowrap;
}
/* 订阅状态分色：生效绿 / 待生效琥珀 / 过期与取消红 */
.pc-sub__status.is-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.pc-sub__status.is-warn {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
}
.pc-sub__status.is-off {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}
.pc-sub__exp {
  flex-shrink: 0;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* 到期倒计时环：随剩余时间 drain；余量足绿 / 不足一天琥珀 / 到期红（与状态徽章同口径） */
.pc-sub__ring {
  flex-shrink: 0;
  color: var(--el-color-success);
}
.pc-sub__ring.is-warn {
  color: var(--el-color-warning);
}
.pc-sub__ring.is-off {
  color: var(--el-color-danger);
}
.pc-sub__ring-track {
  stroke: color-mix(in srgb, currentColor 20%, transparent);
}
.pc-sub__ring-value {
  stroke: currentColor;
  transition: stroke-dashoffset 0.5s linear;
}
.pc-sub__left {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-color-success);
}
.pc-sub__left.is-warn {
  color: var(--el-color-warning);
}
.pc-sub__left.is-off {
  color: var(--el-color-danger);
}
.pc-sub__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.pc-sub__label {
  width: 44px;
  flex-shrink: 0;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
}
.pc-sub__bar {
  position: relative;
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-sub__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-sub__num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pc-sub__used {
  margin-top: 4px;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
/* 上游多给但我们没有专属视图的余额参数：原样成列，保证信息不丢 */
.pc-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 2px;
}
.pc-extra__chip {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px dashed var(--border-subtle, var(--el-border-color-lighter));
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  max-width: 100%;
}
.pc-extra__chip i {
  font-style: normal;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-extra__chip b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-card__error {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-color-danger);
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .pc-total__bar i,
  .pc-bar__bar i,
  .pc-card__bar i,
  .pc-pool__bar i,
  .pc-sub__bar i,
  .pc-sub__ring-value,
  .pc-trend__seg-btn,
  .pc-trend__export { transition: none; }
  .pc-trend-skeleton__line { animation: none; }
}

/* ===== 余额令牌到期徽章（卡片 top）=====
   绿=余量充足（>30min）、琥珀=临期（≤30min）、红=已过期；随秒级时钟跳动 */
.pc-card__exp {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pc-card__exp.is-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.pc-card__exp.is-warn {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}
.pc-card__exp.is-off {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* ===== 失败读数卡的修复入口：把用户从「看错误」带到「改配置」===== */
.pc-card__fix {
  margin-top: 2px;
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.pc-card__fix:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.pc-card__fix:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* ===== 余额走势（近 7 天）：标签 + 迷你折线 + 首尾时间 ===== */
.pc-trend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 2px 0 10px;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 8px;
  color: var(--el-color-primary);
}
.pc-trend__label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
/* 折线容器：相对定位锚定末点标注与悬停读数；允许溢出，让末点圆心压在右边缘线上 */
.pc-trend__plot {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: visible;
}
.pc-trend__line {
  width: 100%;
  height: 48px;
  display: block;
}
/* 近 7 天变化量：余额增减是正常波动，统一弱化色只标数值 */
.pc-trend__delta {
  margin-left: 4px;
  font-weight: 600;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
/* 消耗速率估算：与变化量同级的弱化标注，悬浮说明写清估算口径 */
.pc-trend__burn {
  margin-left: 4px;
  font-weight: 600;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
  cursor: help;
}
/* 时间窗切换：迷你分段控件，选中态用主色轻底标记 */
.pc-trend__seg {
  flex-shrink: 0;
  display: inline-flex;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.pc-trend__seg-btn {
  border: 0;
  padding: 2px 8px;
  background: transparent;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.pc-trend__seg-btn + .pc-trend__seg-btn {
  border-left: 1px solid var(--el-border-color-lighter);
}
.pc-trend__seg-btn:hover {
  color: var(--el-color-primary);
}
.pc-trend__seg-btn.is-active {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  font-weight: 600;
}
.pc-trend__seg-btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
/* 历史导出：与时间窗分段同档的迷你按钮，无历史时禁用 */
.pc-trend__export {
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 2px 8px;
  background: transparent;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.pc-trend__export:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color-lighter));
}
.pc-trend__export:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pc-trend__export:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
/* y 轴参考：淡网格线 + 左侧数值刻度，HTML 定位避开 viewBox 拉伸变形 */
.pc-trend__grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-subtle, var(--el-border-color-lighter));
  opacity: 0.55;
  pointer-events: none;
}
.pc-trend__tick {
  position: absolute;
  left: 2px;
  transform: translateY(-50%);
  font-size: 9px;
  line-height: 1;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  z-index: 1;
}
/* 末点圆点：圆心压在折线终点上，外圈用面板底色断开折线 */
.pc-trend__dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 2px var(--bg-elevated, var(--el-bg-color-overlay, var(--el-bg-color)));
  pointer-events: none;
}
/* 悬停读数：跟随最近数据点，浮在折线上方 */
.pc-trend__tip {
  position: absolute;
  top: -6px;
  transform: translate(-50%, -100%);
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--bg-elevated, var(--el-bg-color-overlay, var(--el-bg-color)));
  color: var(--el-text-color-primary);
  font-size: 10.5px;
  line-height: 1.5;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
  font-variant-numeric: tabular-nums;
}
/* 悬停竖线：跟随光标的细参考线（不拦截鼠标，避免抖动） */
.pc-trend__cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: currentColor;
  opacity: 0.25;
  pointer-events: none;
}
/* 失败回源断点：底缘小红点，title 标明失败时点 */
.pc-trend__fail {
  position: absolute;
  bottom: -2px;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 50%;
  background: var(--el-color-danger);
  opacity: 0.85;
  cursor: help;
}
/* 加载骨架屏：历史首拉期间的两条占位线，微光扫过 */
.pc-trend-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 10px;
}
.pc-trend-skeleton__line {
  display: block;
  height: 46px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color-light, rgba(127, 127, 127, 0.14)) 25%,
    var(--el-fill-color, rgba(127, 127, 127, 0.24)) 37%,
    var(--el-fill-color-light, rgba(127, 127, 127, 0.14)) 63%
  );
  background-size: 400% 100%;
  animation: pc-skeleton-sweep 1.4s ease infinite;
}
.pc-trend-skeleton__line.is-short {
  height: 12px;
  width: 42%;
}
@keyframes pc-skeleton-sweep {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
.pc-trend__range {
  flex-shrink: 0;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pc-trend-empty {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 2px 0 10px;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* 空态引导的「立即刷新」：就地强制回源一次，让走势开始积累 */
.pc-trend-empty__refresh {
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 1;
  padding: 3px 10px;
  cursor: pointer;
}
.pc-trend-empty__refresh:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
/* 走势区可键盘聚焦：焦点圈只走键盘（focus-visible），鼠标点击不打圈 */
.pc-trend__plot:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
  border-radius: 6px;
}
/* 只看低量开关：贴详情列表顶部，弱化不抢戏 */
.pc-low-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  grid-column: 1 / -1;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  cursor: pointer;
  user-select: none;
  width: fit-content;
}
.pc-low-toggle input {
  accent-color: var(--el-color-primary);
}
.pc-low-empty {
  grid-column: 1 / -1;
  margin: 4px 0;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* 定时采样可观测：与走势空态同一档弱化字号，贴在走势区下方 */
.pc-sample {
  margin: -4px 0 10px;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* 消耗统计小卡：日均 / 峰值两枚，弱化描边不与余额主数字抢视觉 */
.pc-trend-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -2px 0 10px;
}
.pc-trend-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 6px;
  background: var(--el-fill-color-light, transparent);
}
.pc-trend-stat i {
  font-style: normal;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-trend-stat b {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
/* 预测性低量提醒：弱化色常驻，临近（≤7 天）转琥珀催办 */
.pc-trend-forecast {
  margin: -4px 0 10px;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-trend-forecast.is-urgent {
  color: var(--el-color-warning);
}
/* 多 Key 分线图例：色点对线，掩码超长省略 */
.pc-trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: -4px 0 10px;
}
.pc-trend-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 180px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-trend-legend-item i {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* ===== 用量归因 =====
   窗口内余额消耗按 Key（读数差分）/ 按模型（用量日汇总）拆解。
   默认收起，展开才拉数据；表格用 div 网格排，窄容器不横向溢出。 */
.pc-attr {
  margin: 2px 0 10px;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 8px;
}
.pc-attr__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.pc-attr__label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
/* 展开 / 收起：与刷新按钮同档的迷你按钮，推到行尾 */
.pc-attr__toggle {
  flex-shrink: 0;
  margin-left: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 2px 8px;
  background: transparent;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.pc-attr__toggle:hover {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color-lighter));
}
.pc-attr__toggle:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
.pc-attr__hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-attr__hint.is-err {
  color: var(--el-color-danger);
}
.pc-attr__sec {
  margin-top: 8px;
}
/* 维度小标：悬浮说明写清统计口径 */
.pc-attr__sec-label {
  display: block;
  margin-bottom: 4px;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  cursor: help;
}
.pc-attr__table {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.pc-attr__row {
  display: grid;
  gap: 8px;
  align-items: baseline;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
/* 按 Key：Key 掩码 / 读数 / 期初→期末 / 消耗 / 币种 / 预计可用 */
.pc-attr__table.is-keys .pc-attr__row {
  grid-template-columns: minmax(0, 1.4fr) 44px minmax(0, 1.15fr) 88px 48px 64px;
}
/* 按模型：模型 / 调用 / Tokens / 成本 */
.pc-attr__table.is-models .pc-attr__row {
  grid-template-columns: minmax(0, 1.8fr) 56px minmax(0, 1fr) 84px;
}
.pc-attr__row:nth-child(even) {
  background: var(--el-fill-color-lighter, transparent);
}
.pc-attr__row > span {
  min-width: 0;
}
/* 数值列统一右对齐（首列文字除外），表头随之 */
.pc-attr__row > span:not(:first-child) {
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-attr__row.is-head {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-attr__mask {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
}
/* 消耗列：充值绿 + 徽标，正常消耗次级文本色，无读数弱化 */
.pc-attr__consumed {
  font-weight: 600;
}
.pc-attr__consumed.is-spend {
  color: var(--el-text-color-secondary);
}
.pc-attr__consumed.is-recharge {
  color: var(--el-color-success);
}
.pc-attr__consumed.is-recharge i {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  font-style: normal;
  font-size: 9.5px;
  font-weight: 600;
  background: color-mix(in srgb, var(--el-color-success) 14%, transparent);
  color: var(--el-color-success);
}
.pc-attr__consumed.is-muted {
  font-weight: 400;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-attr__cost {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
/* 口径提示：与采样状态同档弱化字号 */
.pc-attr__note {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
/* ===== 耗尽预测 =====
   由归因窗口读数差分线性外推：汇总行用警示色轻底，Key 行按剩余天数分档标色。 */
.pc-attr__forecast {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 8px 0 0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  color: var(--el-text-color-secondary);
}
.pc-attr__forecast-label {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-color-warning);
}
.pc-attr__forecast b {
  font-weight: 600;
  color: var(--el-color-warning);
}
/* Key 行预测单元格：≤3 天危急红、≤7 天预警黄 */
.pc-attr__forecast-cell.is-urgent {
  font-weight: 600;
  color: var(--el-color-danger);
}
.pc-attr__forecast-cell.is-warn {
  font-weight: 600;
  color: var(--el-color-warning);
}
</style>
