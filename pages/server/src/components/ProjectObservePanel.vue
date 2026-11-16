<!--
  项目观测面板（Actuator 指标 / 日志管理 / 链路追踪 / 其它端点）。

  为什么不再只弹一个「有没有 Actuator」的对话框：运维真正要看的是数字和开关 ——
  内存/线程/连接数是多少、某个包的日志级别能不能当场调、一次请求慢在哪个 span。
  这里把这些能力收进一个页签，入口仍在左侧项目右键的「观测与诊断」二级菜单。

  数据来源分两类，不能混：
    · Actuator（指标 / 日志级别 / 链路记录 / 其它端点）—— 项目自己暴露的端点，
      后端在目标主机内 curl，前端只传项目 id + 端点路径；
    · 链路追踪 —— 优先走 APM 引擎（SkyWalking 等）的 span 树；APM 未接入时
      回退读项目 Actuator 的 httptrace / httpexchanges 请求记录，不假装有链路。
-->
<template>
  <div class="obs">
    <!-- 档案头：运行档案 / 项目 -->
    <header class="obs-top">
      <div class="obs-crumb">
        <span class="obs-logo" aria-hidden="true">▤</span>
        <b>运行档案</b>
        <span class="obs-sep">/</span>
        <span class="mono obs-project">{{ props.projectName || '项目' }}</span>
        <span class="mono obs-dim">· Actuator 观测</span>
      </div>
      <span class="obs-grow"></span>
      <span v-if="currentUrl" class="obs-url mono" :title="currentUrl">{{ currentUrl }}</span>
      <span class="obs-stamp mono">
        <template v-if="loading">读取中…</template>
        <template v-else-if="readAt">{{ readAt }} · 累计读取 {{ fmtReadTotal(readElapsed) }}</template>
        <template v-else>未读取</template>
      </span>
      <button type="button" class="obs-btn" :disabled="loading" @click="refresh">刷新档案</button>
    </header>

    <!-- 档案分类 -->
    <nav class="obs-tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="obs-tab"
        :class="{ 'is-on': tab === t.key }"
        @click="switchTab(t.key)"
      >
        {{ t.label }}
        <em v-if="tabCounts[t.key]">{{ tabCounts[t.key] }}</em>
      </button>
    </nav>

    <!--
      本轮读取总览：两行必须分开 ——
        第一行是「我们读得多快」（前端到应用的往返，含网络）；
        第二行是「应用自己跑得多慢」（http.server.requests 里的 COUNT/TOTAL_TIME/MAX）。
      混成一行会把网络往返当成业务耗时，这是两个量。
    -->
    <div v-if="readEntries.length" class="obs-readsum">
      <div class="obs-readsum-row">
        <span class="obs-readsum-proj mono">{{ props.projectName || '项目' }}</span>
        <span class="obs-dim">·</span>
        <span class="obs-cap">读取耗时</span>
        <b class="mono">{{ fmtReadTotal(readElapsed) }}</b>
        <span class="obs-dim">共 {{ readEntries.length }} 次端点读取</span>
        <template v-if="readSlowest">
          <span class="obs-dim">· 最慢</span>
          <b class="mono obs-readsum-slow">{{ readChipName(readSlowest.name) }} {{ fmtReadTotal(readSlowest.ms) }}</b>
        </template>
        <span class="obs-grow"></span>
        <span
          v-for="e in readEntries.slice(0, 3)"
          :key="e.name"
          class="obs-readchip mono"
          :title="e.name"
        >
          {{ readChipName(e.name) }} {{ fmtReadTotal(e.ms) }}
        </span>
      </div>
      <div v-if="appTiming.count" class="obs-readsum-row obs-readsum-app">
        <span class="obs-dim">·</span>
        <span class="obs-cap">应用执行</span>
        <b class="mono">平均 {{ fmtMs(appTiming.avgMs || 0) }}/次</b>
        <span class="obs-dim">
          · 峰值 <b class="mono">{{ fmtMs(appTiming.maxMs || 0) }}</b>
          · 样本 {{ appTiming.count }}
        </span>
        <template v-if="appTiming.startedMs !== null">
          <span class="obs-dim">· 启动</span>
          <b class="mono">{{ fmtMs(appTiming.startedMs) }}</b>
        </template>
        <span class="obs-grow"></span>
        <span class="obs-dim">http.server.requests 自记，非网络往返</span>
      </div>
    </div>

    <!-- ==================== 指标（剖面档案） ==================== -->
    <div v-if="tab === 'metrics'" class="obs-body">
      <section class="obs-sheet">
        <div class="obs-profile">
          <div class="obs-profile-main">
            <div class="obs-cap">指标剖面 · {{ metricGroup || 'Actuator' }}</div>
            <h1 class="mono">{{ metricName || '未选择指标' }}</h1>
            <p class="obs-lead">
              采样自 <code>/actuator/metrics{{ metricName ? `/${metricName}` : '' }}</code>，
              采集耗时 {{ metricElapsed ? `${metricElapsed}ms` : '—' }}<template v-if="loadError">；{{ loadError }}</template>
            </p>
          </div>
          <div class="obs-profile-read">
            <b class="obs-rnum">{{ metricCurrentValue }}</b>
            <span class="obs-badge" :class="metricIsWarn ? 'is-warn' : 'is-ok'">
              <i class="obs-dot" :class="metricIsWarn ? 'is-warn' : 'is-ok'"></i>{{ metricIsWarn ? '无读数' : '已采集' }}
            </span>
          </div>
        </div>

        <div class="obs-facts">
          <div v-for="f in metricFacts" :key="f.k">
            <span>{{ f.k }}</span><b class="mono" :title="f.v">{{ f.v }}</b>
          </div>
        </div>

        <div class="obs-meas">
          <div v-for="m in metricMeasurements" :key="m.statistic">
            <span class="obs-cap">{{ m.statistic }}</span>
            <b class="mono">{{ metricStatText(m.statistic, m.value) }}</b>
          </div>
          <div v-if="!metricMeasurements.length">
            <span class="obs-cap">统计量</span><b class="mono">—</b>
          </div>
        </div>

        <div class="obs-rule"><span>标签构成</span></div>
        <div class="obs-tags">
          <div v-for="t in metricTags" :key="t.tag" class="obs-tagrow">
            <span class="mono">{{ t.tag }}</span>
            <span class="obs-dim">{{ (t.values && t.values.length ? t.values.slice(0, 8) : []).join(' · ') || '—' }}</span>
          </div>
          <div v-if="!metricTags.length" class="obs-empty-sm">该指标没有可用标签</div>
        </div>

        <div class="obs-rule">
          <span>同一目标下的其它档案</span>
          <b class="mono obs-dim">{{ filteredMetrics.length }} 个指标</b>
        </div>
        <div class="obs-catalog">
          <input
            v-model="metricKeyword"
            class="obs-search obs-search--inline"
            type="text"
            placeholder="搜索指标名"
          />
          <button
            v-for="name in filteredMetrics"
            :key="name"
            type="button"
            class="obs-cat"
            :class="{ 'is-on': name === metricName }"
            :title="name"
            @click="openMetric(name)"
          >
            <span class="mono">{{ name }}</span>
            <span class="obs-dim">{{ metricGroupOf(name) }}</span>
          </button>
          <div v-if="!filteredMetrics.length && !loading" class="obs-empty-sm">
            {{ loadError || '没有读到指标，确认 management.endpoints.web.exposure.include 含 metrics' }}
          </div>
        </div>

        <div
          class="obs-rule is-grip"
          title="上下拖拽调整「原始返回」高度"
          @pointerdown.prevent="startRawDrag"
        >
          <span>原始返回</span>
          <b class="mono obs-dim">拖拽调高</b>
        </div>
        <pre class="obs-json" :style="{ height: `${rawHeight}px` }">{{ pretty(metricDetail) }}</pre>
      </section>
    </div>

    <!-- ==================== 日志管理（剖面档案） ==================== -->
    <div v-else-if="tab === 'loggers'" class="obs-body">
      <section class="obs-sheet">
        <div class="obs-profile">
          <div class="obs-profile-main">
            <div class="obs-cap">日志级别剖面 · {{ loggerRows.length }} 条档案</div>
            <h1 class="mono">日志级别档案</h1>
            <p class="obs-lead">
              改级别走 Actuator <code>POST /actuator/loggers/{name}</code>，立即生效、不用重启；
              「继承」表示清掉项目级配置、回落到上级（通常是 ROOT）。
            </p>
          </div>
          <div class="obs-profile-read">
            <b class="obs-rnum">{{ filteredLoggers.length }}</b>
            <span class="obs-badge is-ok"><i class="obs-dot is-ok"></i>生效中</span>
          </div>
        </div>

        <div class="obs-facts">
          <div><span>档案总数</span><b class="mono">{{ loggerRows.length }}</b></div>
          <div><span>当前可见</span><b class="mono">{{ visibleLoggers.length }}</b></div>
          <div><span>已单独设置</span><b class="mono">{{ configuredCount }}</b></div>
          <div><span>截断</span><b class="mono">{{ loggersTruncated ? '是' : '否' }}</b></div>
          <div><span>热更新</span><b class="mono">无需重启</b></div>
        </div>

        <div class="obs-rule">
          <span>级别明细</span>
          <b class="mono obs-dim">{{ filteredLoggers.length }} 个</b>
        </div>
        <div class="obs-logger-bar">
          <input
            v-model="loggerKeyword"
            class="obs-search obs-search--inline"
            type="text"
            placeholder="搜索日志名称，如 com.chua（回车精确查询）"
            @keyup.enter="lookupLogger(loggerKeyword)"
          />
          <label class="obs-check">
            <input v-model="onlyConfigured" type="checkbox" />
            只看已单独设置
          </label>
          <span class="obs-count">{{ filteredLoggers.length }} 个</span>
        </div>
        <div v-if="loggersTruncated" class="obs-warn">
          日志列表过大已被截断（只显示前一部分）：需要调整哪个就在搜索框输入完整名字后回车，会单独查出它的级别。
        </div>
        <div class="obs-table">
          <div class="obs-tr obs-th">
            <span class="obs-c-name">日志名称</span>
            <span class="obs-c-level">生效级别</span>
            <span class="obs-c-level">项目级配置</span>
            <span class="obs-c-op">设为</span>
          </div>
          <div v-for="row in visibleLoggers" :key="row.name" class="obs-tr">
            <span class="obs-c-name mono" :title="row.name">{{ row.name }}</span>
            <span class="obs-c-level">{{ row.effectiveLevel || '—' }}</span>
            <span class="obs-c-level" :class="{ 'is-set': !!row.configuredLevel }">
              {{ row.configuredLevel || '继承' }}
            </span>
            <span class="obs-c-op">
              <select
                class="obs-select"
                :value="row.configuredLevel || ''"
                :disabled="!!savingLogger[row.name]"
                @change="onLevelChangeEvent(row.name, $event)"
              >
                <option value="">继承</option>
                <option v-for="lv in levels" :key="lv" :value="lv">{{ lv }}</option>
              </select>
            </span>
          </div>
          <div v-if="!filteredLoggers.length" class="obs-empty-sm">
            {{ loadError || '没有读到日志列表，确认 exposure.include 含 loggers' }}
          </div>
        </div>
      </section>
    </div>

    <!-- ==================== 链路追踪（剖面档案：APM span 树 / Actuator 请求记录降级） ==================== -->
    <div v-else-if="tab === 'traces'" class="obs-body obs-split">
      <aside class="obs-side">
        <div class="obs-cap obs-side-cap">链路档案 · {{ traceSource === 'apm' ? 'APM span 树' : 'Actuator 请求记录' }}</div>
        <div class="obs-trace-bar">
          <select v-model.number="traceMinutes" class="obs-select" @change="loadTraces">
            <option :value="15">近 15 分钟</option>
            <option :value="30">近 30 分钟</option>
            <option :value="60">近 1 小时</option>
            <option :value="180">近 3 小时</option>
          </select>
          <span class="obs-count">{{ traceSource === 'apm' ? traces.length : httpRecords.length }} 条</span>
        </div>
        <div class="obs-hint obs-trace-note">
          APM span 树优先；未接入时自动回退读取项目 Actuator 的请求记录，不做假链路。
          <template v-if="traceSource === 'apm'">
            左侧层级树选一条链路，右侧按 span 开始时间排成时间轴瀑布。
          </template>
          <template v-if="traceSource === 'actuator'">
            <code>{{ httpTraceEndpoint }}</code> 请求记录；需要完整 span 调用链时再为项目注入 SkyWalking / 平台 APM agent。
            <span v-if="httpTraceTruncated">记录过多，已截断展示。</span>
          </template>
        </div>
        <div class="obs-list">
          <template v-if="traceSource === 'apm'">
            <div
              v-for="row in traceTree"
              :key="row.traceId"
              class="obs-item obs-trace-item obs-trace-tree"
              :class="{ 'is-root': row.depth === 0 }"
              @click="row.depth === 0 ? openTrace(row.traceId) : null"
            >
              <span class="obs-trace-ms mono">{{ fmtMs(row.durationMs) }}</span>
              <span
                class="obs-trace-name"
                :title="`${row.serviceName || ''} · ${row.endpointName || ''}`"
              >
                {{ row.endpointName || row.serviceName || row.traceId }}
              </span>
              <span v-if="row.depth > 0" class="obs-trace-child mono obs-dim" title="子 span">· 子 span</span>
              <span class="obs-trace-time">{{ fmtClock(row.startTime) }}</span>
            </div>
          </template>
          <template v-else>
            <button
              v-for="r in httpRecords"
              :key="r.key"
              type="button"
              class="obs-item obs-trace-item obs-trace-http"
              :class="{ 'is-on': r.key === httpRecordKey, 'is-error': r.status >= 500 }"
              :title="`${r.method} ${r.uri} · 耗时 ${fmtMs(r.timeTaken)}`"
              @click="openHttpRecord(r)"
            >
              <span class="obs-trace-status mono">{{ r.status ? r.status : '—' }}</span>
              <span class="obs-trace-name">{{ r.method }} {{ r.uri }}</span>
              <span class="obs-trace-lat mono">{{ fmtMs(r.timeTaken) }}</span>
              <span class="obs-trace-time">{{ r.timestamp ? fmtClock(r.timestamp) : '' }}</span>
            </button>
          </template>
          <div
            v-if="(traceSource === 'apm' ? !traces.length : !httpRecords.length) && !loading"
            class="obs-empty-sm"
          >
            {{ traceEmpty }}
          </div>
        </div>
      </aside>
      <section class="obs-main">
        <section class="obs-sheet">
          <template v-if="traceSource === 'actuator'">
            <div class="obs-profile">
              <div class="obs-profile-main">
                <div class="obs-cap">请求记录剖面 · {{ httpTraceEndpoint }}</div>
                <h1 class="mono">{{ currentHttpRecord ? `${currentHttpRecord.method} ${currentHttpRecord.uri}` : '未选择记录' }}</h1>
                <p class="obs-lead">
                  Actuator <code>{{ httpTraceEndpoint }}</code> 的请求记录（Actuator 语境，非 span 链路）。
                  需要完整 span 调用链时再为项目注入 SkyWalking / 平台 APM agent。
                </p>
              </div>
              <div class="obs-profile-read">
                <b class="obs-rnum">{{ currentHttpRecord ? currentHttpRecord.status || '—' : '—' }}</b>
                <span class="obs-badge" :class="currentHttpRecord && currentHttpRecord.status >= 500 ? 'is-warn' : 'is-ok'">
                  <i class="obs-dot" :class="currentHttpRecord && currentHttpRecord.status >= 500 ? 'is-warn' : 'is-ok'"></i>
                  {{ currentHttpRecord && currentHttpRecord.status >= 500 ? '失败' : '成功' }}
                </span>
              </div>
            </div>

            <div class="obs-facts">
              <div><span>状态码</span><b class="mono">{{ currentHttpRecord ? currentHttpRecord.status || '—' : '—' }}</b></div>
              <div><span>耗时</span><b class="mono">{{ currentHttpRecord ? fmtMs(currentHttpRecord.timeTaken) : '—' }}</b></div>
              <div><span>时间</span><b class="mono">{{ currentHttpRecord && currentHttpRecord.timestamp ? fmtClock(currentHttpRecord.timestamp) : '—' }}</b></div>
              <div><span>记录总数</span><b class="mono">{{ httpRecords.length }}</b></div>
              <div><span>截断</span><b class="mono">{{ httpTraceTruncated ? '是' : '否' }}</b></div>
            </div>

            <div class="obs-rule">
              <span>请求时间轴</span>
              <b class="mono obs-dim">{{ httpRecords.length }} 条 · {{ fmtMs(httpTimeline.span) }} 窗口</b>
            </div>
            <div class="obs-wf">
              <div class="obs-wf-head">
                <span class="obs-cap">请求</span>
                <span class="obs-cap">耗时（按时间戳定位）</span>
              </div>
              <div
                v-for="r in httpRecords"
                :key="r.key"
                class="obs-wf-row"
                :class="{ 'is-on': r.key === httpRecordKey, 'is-error': r.status >= 500 }"
                @click="openHttpRecord(r)"
              >
                <div class="obs-wf-label">
                  <span class="obs-wf-status mono">{{ r.status || '—' }}</span>
                  <span class="obs-wf-name mono" :title="`${r.method} ${r.uri}`">{{ r.method }} {{ r.uri }}</span>
                </div>
                <div class="obs-wf-track">
                  <i
                    class="obs-wf-bar"
                    :class="r.status >= 500 ? 'is-error' : 'is-http'"
                    :style="barStyle(r.timestamp || httpTimeline.t0, Math.max(r.timeTaken || 0, 1), httpTimeline.t0, httpTimeline.span)"
                  ></i>
                </div>
                <span class="obs-wf-ms mono">{{ fmtMs(r.timeTaken) }}</span>
              </div>
            </div>

            <div class="obs-rule"><span>原始返回</span></div>
            <pre class="obs-json">{{ currentHttpRecord ? currentHttpRecord.raw : '左侧选一条请求记录查看详情' }}</pre>
          </template>

          <template v-else>
            <div class="obs-profile">
              <div class="obs-profile-main">
                <div class="obs-cap">链路剖面 · APM span 树</div>
                <h1 class="mono">{{ traceId || '未选择链路' }}</h1>
                <p class="obs-lead">
                  按 span 开始时间排成时间轴瀑布，条长即耗时；左侧层级树选一条链路即可看到慢在哪一段。
                </p>
              </div>
              <div class="obs-profile-read">
                <b class="obs-rnum">{{ traceDuration }}</b>
                <span class="obs-badge is-ok"><i class="obs-dot is-ok"></i>{{ spanRows.length }} 个 span</span>
              </div>
            </div>

            <div class="obs-facts">
              <div><span>span 数</span><b class="mono">{{ spanRows.length }}</b></div>
              <div><span>总耗时</span><b class="mono">{{ traceDuration }}</b></div>
              <div><span>链路总数</span><b class="mono">{{ traces.length }}</b></div>
              <div><span>窗口</span><b class="mono">近 {{ traceMinutes }} 分钟</b></div>
              <div><span>来源</span><b class="mono">APM</b></div>
            </div>

            <div class="obs-rule">
              <span>span 时间轴</span>
              <b class="mono obs-dim">{{ traceTimeline.spanText }} 窗口</b>
              <button type="button" class="obs-btn obs-rule-btn" @click="toggleAll">{{ allExpanded ? '全部收起' : '全部展开' }}</button>
            </div>
            <div v-if="!traceId" class="obs-empty">左侧选一条链路，按时间轴展开成瀑布</div>
            <div v-else-if="loading && !spanRows.length" class="obs-empty">读取链路…</div>
            <div v-else-if="!spanRows.length" class="obs-empty">这条链路没有 span（可能已过保留期）</div>
            <div v-else class="obs-wf">
              <div class="obs-wf-head">
                <span class="obs-cap">span · 按层级缩进</span>
                <span class="obs-cap">耗时（按开始时间定位）</span>
              </div>
              <div
                v-for="row in visibleSpanRows"
                :key="row.key"
                class="obs-wf-row"
                :class="{ 'is-error': row.span.error, 'is-remote': !row.span.parentSpanId }"
              >
                <div class="obs-wf-label" :style="{ paddingLeft: row.depth * 14 + 'px' }">
                  <button
                    type="button"
                    class="obs-wf-toggle"
                    :class="{ 'is-hidden': !row.hasChildren }"
                    @click.stop="toggleNode(row.key)"
                  >
                    {{ expanded[row.key] ? '▾' : '▸' }}
                  </button>
                  <span class="obs-wf-svc mono" :title="row.span.serviceName || ''">
                    {{ row.span.serviceName || '—' }}
                  </span>
                  <span class="obs-wf-name" :title="row.span.endpointName || ''">
                    {{ row.span.endpointName || row.span.component || row.span.spanId }}
                  </span>
                </div>
                <div class="obs-wf-track">
                  <i
                    class="obs-wf-bar"
                    :class="`is-${spanKind(row.span)}`"
                    :style="barStyle(row.span.startTime, row.span.durationMs, traceTimeline.t0, traceTimeline.span)"
                  ></i>
                </div>
                <span class="obs-wf-ms mono">{{ fmtMs(row.span.durationMs) }}</span>
              </div>
            </div>
          </template>
        </section>
      </section>
    </div>

    <!-- ==================== 其它端点（剖面档案） ==================== -->
    <div v-else class="obs-body obs-split">
      <aside class="obs-side">
        <div class="obs-cap obs-side-cap">端点档案 · {{ OTHER_ENDPOINTS.length }} 个</div>
        <div class="obs-list">
          <button
            v-for="e in OTHER_ENDPOINTS"
            :key="e"
            type="button"
            class="obs-item"
            :class="{ 'is-on': e === otherEndpoint }"
            @click="openOther(e)"
          >
            {{ e }}
          </button>
        </div>
      </aside>
      <section class="obs-main">
        <section class="obs-sheet">
          <div class="obs-profile">
            <div class="obs-profile-main">
              <div class="obs-cap">端点剖面 · Actuator</div>
              <h1 class="mono">{{ otherEndpoint ? `/actuator/${otherEndpoint}` : '未选择端点' }}</h1>
              <p class="obs-lead">
                数据取自目标主机进程，通常 5–20 秒；读取失败会保留后端给出的原始原因。
              </p>
            </div>
            <div class="obs-profile-read">
              <b class="obs-rnum">{{ loading ? '…' : otherStatus || '—' }}</b>
              <span class="obs-badge" :class="otherStatus && otherStatus < 400 ? 'is-ok' : 'is-warn'">
                <i class="obs-dot" :class="otherStatus && otherStatus < 400 ? 'is-ok' : 'is-warn'"></i>
                {{ loading ? '读取中' : otherStatus && otherStatus < 400 ? '可读' : '异常' }}
              </span>
            </div>
          </div>

          <div class="obs-facts">
            <div><span>端点</span><b class="mono">{{ otherEndpoint || '—' }}</b></div>
            <div><span>HTTP</span><b class="mono">{{ loading ? '—' : otherStatus || '—' }}</b></div>
            <div><span>耗时</span><b class="mono">{{ loading ? '—' : `${otherElapsed}ms` }}</b></div>
            <div><span>返回体</span><b class="mono">{{ otherBody ? `${otherBody.length} 字符` : '（空返回）' }}</b></div>
            <div><span>端点总数</span><b class="mono">{{ OTHER_ENDPOINTS.length }}</b></div>
          </div>

          <!-- 启动阶段：startup 端点自带每个阶段的 duration（秒），比原始 JSON 有用得多。
               响应体常超过 512KB 被后端截断，JSON.parse 会失败，这时按文本抽取而不是整块不给。 -->
          <template v-if="startupSteps.length">
            <div class="obs-rule">
              <span>启动阶段耗时</span>
              <b class="mono obs-dim">
                Top {{ startupSteps.length }} · {{ startupTruncated ? '响应被截断，按文本抽取' : '按阶段耗时倒序' }}
              </b>
            </div>
            <div class="obs-table">
              <div class="obs-tr obs-tr-startup obs-th">
                <span class="obs-c-name">阶段</span>
                <span class="obs-c-level">耗时</span>
                <span class="obs-c-level">开始</span>
              </div>
              <div v-for="s in startupSteps" :key="s.key" class="obs-tr obs-tr-startup">
                <span class="obs-c-name mono" :title="s.name">{{ s.name }}</span>
                <span class="obs-c-level mono">{{ fmtMs(s.durationMs) }}</span>
                <span class="obs-c-level mono obs-dim">{{ s.startTime || '—' }}</span>
              </div>
            </div>
          </template>

          <div
            class="obs-rule is-grip"
            title="上下拖拽调整「原始返回」高度"
            @pointerdown.prevent="startRawDrag"
          >
            <span>原始返回</span>
            <b class="mono obs-dim">拖拽调高</b>
          </div>
          <div v-if="otherMessage" class="obs-warn">{{ otherMessage }}</div>
          <!-- 这些端点是「向目标主机的进程要数据」，绝非毫秒级：health 就要几秒，
               threaddump/startup 更高。没有读取中状态时，用户看到的是上一轮残留的
               HTTP 200 和「（空返回）」，会误判成端点坏了。 -->
          <div v-if="loading" class="obs-empty">读取中…（数据取自目标主机进程，通常 5–20 秒）</div>
          <pre v-else class="obs-json" :style="{ height: `${rawHeight}px` }">{{ otherBody || '（空返回）' }}</pre>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目观测面板。
 *
 * <p>四个页签的数据来源不同，但都在同一个页签里切换：运维排查时「指标 → 日志级别 →
 * 链路」是一条连贯的路径，切来切去反而丢上下文。</p>
 *
 * <p>链路追踪只读 APM 引擎：没接入时给出明确原因，不做假数据兜底。</p>
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from '@repo/core';
import { fetchActuator, setActuatorLogLevel, type ActuatorHttpRecord } from '../api/releaseActuator';
import { getApmStatus, getTrace, listTraces } from '@pages/apm/src/api/apmApi';
import type { ApmSpan, ApmTrace } from '@pages/apm/src/api/apmApi';
import { toastError } from '../utils/errors';

defineOptions({ name: 'ProjectObservePanel' });

const props = withDefaults(
  defineProps<{
    projectId: number;
    projectName?: string;
    /** APM 服务名（用于筛链路）；空串表示没有可用的 APM 上下文 */
    apmService?: string;
    /** 首次落地的页签：metrics / loggers / traces / other */
    initialTab?: string;
  }>(),
  { projectName: '', apmService: '', initialTab: 'metrics' },
);

/** 页签定义 */
const TABS = [
  { key: 'metrics', label: 'Actuator 指标' },
  { key: 'loggers', label: '日志管理' },
  { key: 'traces', label: '链路追踪' },
  { key: 'other', label: '其它端点' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** 页签分类计数（档案视图右上角的档案数量） */
const tabCounts = computed<Record<string, number>>(() => ({
  metrics: metrics.value.length,
  loggers: loggerRows.value.length,
  traces: traceSource.value === 'apm' ? traces.value.length : httpRecords.value.length,
  other: OTHER_ENDPOINTS.length,
}));

/** 本轮读取时间戳（档案头的水位） */
const readAt = ref('');

/**
 * 本轮读取过的端点耗时（按端点路径记，重复读取取最新值）。
 *
 * <p>关联到项目之后要回答的是「这次观测一共花了多久、慢在哪个端点」：
 * 单个端点自己的 {@code elapsedMs} 只能说明它自己，汇总必须单独记账，
 * 否则档案头永远只显示最后一次读取的耗时。</p>
 */
const readStats = reactive<Record<string, number>>({});

/** 本轮读取总耗时（各端点之和，ms） */
const readElapsed = computed(() => Object.values(readStats).reduce((sum, ms) => sum + (ms || 0), 0));

/** 本轮读过的端点（按耗时倒序） */
const readEntries = computed(() =>
  Object.entries(readStats)
    .map(([name, ms]) => ({ name, ms }))
    .sort((a, b) => b.ms - a.ms),
);

/** 本轮最慢的端点 */
const readSlowest = computed(() => readEntries.value[0] || null);

/**
 * 应用自己的执行时间（来自 {@code http.server.requests} 与 {@code application.started.time}）。
 *
 * <p>和上面的 {@code readStats} 是两个量：这里记的是应用服务端处理的耗时
 * （COUNT / TOTAL_TIME / MAX，单位秒），不含网络往返；读不到也不影响观测，
 * 只是少一行参考。</p>
 */
const appTiming = reactive<{
  avgMs: number | null;
  maxMs: number | null;
  count: number | null;
  startedMs: number | null;
}>({ avgMs: null, maxMs: null, count: null, startedMs: null });

/** 取 measurements 里某个统计量的值（拿不到返回 null） */
function statOf(detail: any, name: string): number | null {
  const list = Array.isArray(detail?.measurements) ? detail.measurements : [];
  const hit = list.find((m: any) => String(m?.statistic || '').toUpperCase() === name);
  const n = Number(hit?.value);
  return Number.isFinite(n) ? n : null;
}

/** 读应用的执行时间（平均 / 峰值 / 样本数 / 启动耗时） */
async function loadAppTiming() {
  try {
    const req = await fetchActuator(props.projectId, 'metrics/http.server.requests');
    markRead(req.elapsedMs, 'metrics/http.server.requests');
    if (req.status === 200) {
      const detail = parseJson<any>(req.body);
      const count = statOf(detail, 'COUNT');
      const total = statOf(detail, 'TOTAL_TIME');
      const max = statOf(detail, 'MAX');
      appTiming.count = count;
      appTiming.maxMs = max === null ? null : max * 1000;
      appTiming.avgMs = count && total !== null ? (total / count) * 1000 : null;
    }
  } catch {
    /* 只是补充说明：读不到就不显示这一行，别让它挡住观测 */
  }
  try {
    const started = await fetchActuator(props.projectId, 'metrics/application.started.time');
    markRead(started.elapsedMs, 'metrics/application.started.time');
    if (started.status === 200) {
      const value = statOf(parseJson<any>(started.body), 'VALUE');
      appTiming.startedMs = value === null ? null : value * 1000;
    }
  } catch {
    /* 同上 */
  }
}

const OTHER_ENDPOINTS = [
  'health',
  'info',
  'env',
  'beans',
  'mappings',
  'configprops',
  'scheduledtasks',
  'conditions',
  'threaddump',
  'startup',
  'httptrace',
  'httpexchanges',
];

const tab = ref<TabKey>((props.initialTab as TabKey) || 'metrics');
const loading = ref(false);
const loadError = ref('');
const currentUrl = ref('');

/** 各页签只在首次进入时拉数据，切回来不重复请求 */
const loaded = reactive<Record<string, boolean>>({});

function switchTab(next: TabKey) {
  if (tab.value === next) return;
  tab.value = next;
  ensureLoaded();
}

function refresh() {
  // 刷新档案 = 新的一轮读取：清掉上一轮各端点的耗时，重新累计
  for (const key of Object.keys(readStats)) delete readStats[key];
  loaded[tab.value] = false;
  ensureLoaded();
  void loadAppTiming();
}

function ensureLoaded() {
  if (loaded[tab.value]) return;
  loaded[tab.value] = true;
  if (tab.value === 'metrics') void loadMetrics();
  else if (tab.value === 'loggers') void loadLoggers();
  else if (tab.value === 'traces') void loadTracePage();
  else if (tab.value === 'other') void openOther(otherEndpoint.value || 'health');
}

// ==================== 指标 ====================

const metrics = ref<string[]>([]);
const metricKeyword = ref('');
const metricName = ref('');
const metricDetail = ref<any>(null);

const filteredMetrics = computed(() => {
  const kw = metricKeyword.value.trim().toLowerCase();
  return kw ? metrics.value.filter((n) => n.toLowerCase().includes(kw)) : metrics.value;
});

const metricMeasurements = computed<any[]>(() => {
  const list = metricDetail.value?.measurements;
  return Array.isArray(list) ? list : [];
});

const metricTags = computed<any[]>(() => {
  const list = metricDetail.value?.availableTags;
  return Array.isArray(list) ? list : [];
});

/** 当前指标的采集耗时（ms） */
const metricElapsed = ref(0);

/** 按指标名前缀归组（剖面档案的分组口径） */
function metricGroupOf(name: string): string {
  const n = String(name || '');
  if (n.startsWith('jvm.')) return 'JVM';
  if (n.startsWith('http.')) return 'HTTP';
  if (n.startsWith('process.')) return '进程';
  if (n.startsWith('system.')) return '系统';
  if (n.startsWith('hikaricp') || n.startsWith('datasource')) return '连接池';
  return '其它';
}

/** 当前指标的分组 */
const metricGroup = computed(() => (metricName.value ? metricGroupOf(metricName.value) : 'Actuator'));

/** 按统计量名取一条测量值 */
function metricStat(name: string): number | null {
  const hit = metricMeasurements.value.find((m: any) => String(m.statistic || '').toUpperCase() === name);
  if (!hit) return null;
  const n = Number(hit.value);
  return Number.isFinite(n) ? n : null;
}

/** 指标单位：baseUnit=seconds 的指标（http.server.requests 等）测量值是秒 */
const metricUnit = computed(() => String(metricDetail.value?.baseUnit || ''));

/** 秒值按毫秒文案展示（null 表示没有该统计量） */
function fmtSec(sec: number | null): string {
  return sec === null ? '—' : fmtMs(sec * 1000);
}

/** 单条统计量的展示文案：时间类换算成 ms/s，计数类保持原值 */
function metricStatText(statistic: string, value: number): string {
  const s = String(statistic || '').toUpperCase();
  const isTime = metricUnit.value === 'seconds' && (s === 'VALUE' || s === 'MAX' || s.includes('TOTAL'));
  return isTime ? fmtSec(Number(value)) : fmtNum(value);
}

/** 内存类指标按字节折算，其余按原值 */
function fmtMetricValue(name: string, value: number | null): string {
  if (value === null) return '—';
  const n = String(name || '');
  if (/memory|bytes/i.test(n)) {
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
    if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${value} B`;
  }
  return fmtNum(value);
}

/** 当前指标读数（时间类指标没有 VALUE，用「平均耗时」当主读数） */
const metricCurrentValue = computed(() => {
  if (metricUnit.value === 'seconds') {
    const count = metricStat('COUNT');
    const total = metricStat('TOTAL_TIME');
    if (count && total !== null) return fmtSec(total / count);
    return fmtSec(metricStat('VALUE'));
  }
  return fmtMetricValue(metricName.value, metricStat('VALUE'));
});

/** 当前指标是否缺统计量（缺数据时不做「正常」的假结论） */
const metricIsWarn = computed(() => !metricMeasurements.value.length);

/** 指标事实区（时间类补平均/峰值/样本数，其余按原口径） */
const metricFacts = computed(() => {
  const name = metricName.value;
  const tags = metricTags.value.length
    ? metricTags.value
        .map((t: any) => `${t.tag}${t.values && t.values.length ? `=${t.values.slice(0, 3).join(',')}` : ''}`)
        .join(' · ')
    : '—';
  if (metricUnit.value === 'seconds') {
    const count = metricStat('COUNT');
    const total = metricStat('TOTAL_TIME');
    return [
      { k: '样本数', v: count === null ? '—' : fmtNum(count) },
      { k: '平均耗时', v: count && total !== null ? fmtSec(total / count) : '—' },
      { k: '峰值', v: fmtSec(metricStat('MAX')) },
      { k: '累计耗时', v: fmtSec(total) },
      { k: '可用标签', v: tags },
    ];
  }
  return [
    { k: '当前值', v: fmtMetricValue(name, metricStat('VALUE')) },
    { k: '统计量', v: metricStat('COUNT') === null ? '—' : fmtNum(metricStat('COUNT')) },
    { k: '峰值', v: fmtMetricValue(name, metricStat('MAX')) },
    { k: '累计', v: metricStat('TOTAL') === null ? '—' : fmtMetricValue(name, metricStat('TOTAL')) },
    { k: '可用标签', v: tags },
  ];
});

async function loadMetrics() {
  loading.value = true;
  loadError.value = '';
  try {
    const payload = await fetchActuator(props.projectId, 'metrics');
    currentUrl.value = payload.url || '';
    markRead(payload.elapsedMs, 'metrics');
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
      metrics.value = [];
      return;
    }
    const parsed = parseJson<any>(payload.body);
    const names = Array.isArray(parsed?.names) ? parsed.names : [];
    metrics.value = names.map((n: unknown) => String(n)).sort();
    if (!metricName.value && metrics.value.length) {
      void openMetric(metrics.value[0]);
    }
  } catch (e: any) {
    loadError.value = e?.message || '读取指标失败';
  } finally {
    loading.value = false;
  }
}

async function openMetric(name: string) {
  if (!name) return;
  metricName.value = name;
  loading.value = true;
  try {
    const payload = await fetchActuator(props.projectId, `metrics/${name}`);
    currentUrl.value = payload.url || currentUrl.value;
    metricElapsed.value = payload.elapsedMs || 0;
    metricDetail.value = payload.status === 200 ? parseJson<any>(payload.body) || { raw: payload.body } : null;
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
    }
    markRead(payload.elapsedMs, `metrics/${name}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 记录本轮读取水位（档案头的时间戳与总耗时）。
 *
 * @param elapsedMs 本次读取耗时（ms）
 * @param endpoint  本次读取的端点路径（用于本轮耗时汇总）
 */
function markRead(elapsedMs?: number, endpoint?: string) {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  readAt.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (endpoint && elapsedMs && elapsedMs > 0) readStats[endpoint] = elapsedMs;
}

/** 耗时文案：秒级换成 s，避免档案头出现 9120ms 这种长串 */
function fmtReadTotal(ms: number): string {
  if (!ms) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

/** 汇总条上的端点名（指标路径去掉 metrics/ 前缀，避免整行都是同前缀） */
function readChipName(name: string): string {
  return String(name || '').replace(/^metrics\//, '');
}

// ==================== 日志级别 ====================

interface LoggerRow {
  name: string;
  effectiveLevel: string;
  configuredLevel: string;
}

const levels = ref<string[]>(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF']);
const loggerRows = ref<LoggerRow[]>([]);
const loggerKeyword = ref('');
const onlyConfigured = ref(false);
const savingLogger = reactive<Record<string, boolean>>({});
/** 后端因响应体过大截断了列表 */
const loggersTruncated = ref(false);
/** 精确查询单个 logger（列表被截断时用） */
const loggerLookupLoading = ref(false);

const filteredLoggers = computed(() => {
  const kw = loggerKeyword.value.trim().toLowerCase();
  let rows = loggerRows.value;
  if (kw) rows = rows.filter((r) => r.name.toLowerCase().includes(kw));
  if (onlyConfigured.value) rows = rows.filter((r) => !!r.configuredLevel);
  return rows;
});

/** 列表最多渲染 300 行：一个应用动辄上千个 logger，全画出来会卡住滚动 */
const visibleLoggers = computed(() => filteredLoggers.value.slice(0, 300));

/** 已在项目级单独设置过的日志数 */
const configuredCount = computed(() => loggerRows.value.filter((r) => !!r.configuredLevel).length);

async function loadLoggers() {
  loading.value = true;
  loadError.value = '';
  loggersTruncated.value = false;
  try {
    const payload = await fetchActuator(props.projectId, 'loggers');
    currentUrl.value = payload.url || '';
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
      loggerRows.value = [];
      return;
    }
    if (Array.isArray(payload.levels) && payload.levels.length) {
      levels.value = payload.levels;
    }
    loggersTruncated.value = !!payload.truncated;
    markRead(payload.elapsedMs, 'loggers');
    // 后端已把列表压成 name/级别三列；老后端没有该字段时退回解析原文
    const rows: LoggerRow[] = Array.isArray(payload.loggers)
      ? payload.loggers.map((row) => ({
          name: String(row.name || ''),
          effectiveLevel: String(row.effectiveLevel || ''),
          configuredLevel: String(row.configuredLevel || ''),
        }))
      : parseLoggersFromBody(payload.body);
    loggerRows.value = rows
      .filter((row) => row.name)
      .sort((a, b) => {
        // ROOT 与已单独设置过的排前面，其余按名字排
        if (a.name === 'ROOT') return -1;
        if (b.name === 'ROOT') return 1;
        const ac = a.configuredLevel ? 0 : 1;
        const bc = b.configuredLevel ? 0 : 1;
        return ac - bc || a.name.localeCompare(b.name);
      });
    if (!loggerRows.value.length && !loggersTruncated.value) {
      loadError.value = '没有读到日志列表，确认 exposure.include 含 loggers';
    }
  } catch (e: any) {
    loadError.value = e?.message || '读取日志级别失败';
  } finally {
    loading.value = false;
  }
}

/**
 * 兜底解析：老后端只回原始 JSON 时，按 {name: {configuredLevel, effectiveLevel}} 取。
 *
 * @param body 原始响应体
 * @returns 日志行
 */
function parseLoggersFromBody(body: string): LoggerRow[] {
  const parsed = parseJson<any>(body);
  const map = parsed?.loggers && typeof parsed.loggers === 'object' ? parsed.loggers : {};
  return Object.keys(map).map((name) => ({
    name,
    effectiveLevel: String(map[name]?.effectiveLevel || ''),
    configuredLevel: String(map[name]?.configuredLevel || ''),
  }));
}

/**
 * 精确查询一个 logger（列表被截断或名字不在列表里时用）。
 *
 * @param name 完整日志名，如 com.chua.demo
 */
async function lookupLogger(name: string) {
  const target = name.trim();
  if (!target || loggerLookupLoading.value) return;
  loggerLookupLoading.value = true;
  try {
    const payload = await fetchActuator(props.projectId, `loggers/${target}`);
    if (payload.status !== 200) {
      message.warning(payload.message || `没查到 ${target}（HTTP ${payload.status}）`);
      return;
    }
    const parsed = parseJson<any>(payload.body) || {};
    const row: LoggerRow = {
      name: target,
      effectiveLevel: String(parsed.effectiveLevel || ''),
      configuredLevel: String(parsed.configuredLevel || ''),
    };
    const exists = loggerRows.value.find((r) => r.name === target);
    if (exists) {
      exists.effectiveLevel = row.effectiveLevel;
      exists.configuredLevel = row.configuredLevel;
    } else {
      loggerRows.value = [row, ...loggerRows.value];
    }
    message.success(`已定位 ${target}`);
  } catch (e: any) {
    toastError(e, '查询日志名失败');
  } finally {
    loggerLookupLoading.value = false;
  }
}

/**
 * 下拉变更入口：把 DOM 事件里的值转出来再走业务逻辑。
 *
 * @param name 日志名称
 * @param ev   变更事件
 */
function onLevelChangeEvent(name: string, ev: Event) {
  const value = (ev.target as HTMLSelectElement).value;
  void onLevelChange(name, value);
}

/**
 * 热更新一个 logger 的级别。
 *
 * @param name  日志名称
 * @param level 目标级别；空串表示继承上级
 */
async function onLevelChange(name: string, level: string) {
  savingLogger[name] = true;
  try {
    const res = await setActuatorLogLevel(props.projectId, name, level);
    if (res.ok) {
      message.success(`${name} → ${level || '继承'}`);
      const row = loggerRows.value.find((r) => r.name === name);
      if (row) row.configuredLevel = level;
      // 生效级别由服务端合并上级后决定，回读一次才准
      void reloadLoggersQuiet();
    } else {
      message.error(res.message || `修改失败（HTTP ${res.status}）`);
    }
  } catch (e: any) {
    toastError(e, '修改日志级别失败');
  } finally {
    savingLogger[name] = false;
  }
}

/** 静默回读：只刷新行数据，不切 loading，避免表格闪一下 */
async function reloadLoggersQuiet() {
  try {
    const payload = await fetchActuator(props.projectId, 'loggers');
    if (Array.isArray(payload.loggers)) {
      for (const row of loggerRows.value) {
        const hit = payload.loggers.find((r) => r.name === row.name);
        if (hit) {
          row.effectiveLevel = String(hit.effectiveLevel || row.effectiveLevel);
          row.configuredLevel = String(hit.configuredLevel || '');
        }
      }
      return;
    }
    const parsed = parseJson<any>(payload.body);
    const map = parsed?.loggers && typeof parsed.loggers === 'object' ? parsed.loggers : {};
    for (const row of loggerRows.value) {
      if (map[row.name]) {
        row.effectiveLevel = String(map[row.name].effectiveLevel || row.effectiveLevel);
        row.configuredLevel = String(map[row.name].configuredLevel || '');
      }
    }
  } catch {
    // 回读失败保留本地值：用户刚看到成功提示，不该因为一次刷新失败又跳回去
  }
}

// ==================== 链路追踪 ====================

const traces = ref<ApmTrace[]>([]);
const traceId = ref('');
const traceSpans = ref<ApmSpan[]>([]);
const traceMinutes = ref(30);
const traceEmpty = ref('');

/** 树节点：span + 深度 + 是否有子节点（按 parentSpanId 建树） */
interface SpanRow {
  key: string;
  span: ApmSpan;
  depth: number;
  hasChildren: boolean;
  parentKey: string;
}

/** 链路层级树节点（左侧列表，层级树 IA：入口根 + 子 span 缩进） */
interface TraceTreeNode {
  traceId: string;
  key: string;
  depth: number;
  durationMs: number;
  endpointName?: string | null;
  serviceName?: string | null;
  startTime: number;
  error: boolean;
}

const spanRows = computed<SpanRow[]>(() => buildRows(traceSpans.value));

/** 左侧链路层级树：第一条为入口根，其余按顺序作为子 span（与层级树 IA 一致） */
const traceTree = computed<TraceTreeNode[]>(() => {
  const list = traces.value;
  if (!list.length) return [];
  const node = (t: ApmTrace, depth: number): TraceTreeNode => ({
    traceId: t.traceId,
    key: t.traceId,
    depth,
    durationMs: t.durationMs,
    endpointName: t.endpointName || '',
    serviceName: t.serviceName || '',
    startTime: t.startTime,
    error: t.error,
  });
  return [node(list[0], 0), ...list.slice(1).map((t, i) => node(t, 1 + i))];
});

/** 展开状态：默认全部展开，用户收起某个节点后只隐藏它的子树 */
const expanded = reactive<Record<string, boolean>>({});

const visibleSpanRows = computed(() => {
  const rows = spanRows.value;
  const out: SpanRow[] = [];
  const hidden = new Set<string>();
  for (const row of rows) {
    if (row.parentKey && hidden.has(row.parentKey)) {
      hidden.add(row.key);
      continue;
    }
    out.push(row);
    if (row.hasChildren && expanded[row.key] === false) {
      hidden.add(row.key);
    }
  }
  return out;
});

const allExpanded = computed(() => spanRows.value.every((r) => expanded[r.key] !== false));

const traceDuration = computed(() => {
  const list = traceSpans.value;
  if (!list.length) return '—';
  return fmtMs(Math.max(...list.map((s) => s.durationMs)));
});

/**
 * 追踪效果的时间轴窗口（span 的最早开始 → 最晚结束）。
 *
 * <p>把「目录树」变成「瀑布」的关键：所有 span 条都按同一条时间轴定位，
 * 父子关系用缩进 + 覆盖关系表达，才能看出「慢在哪一段」。</p>
 */
const traceTimeline = computed(() => {
  // 用完整 span 集算窗口：收起某个节点只隐藏它的行，不能让整条时间轴跟着缩放
  const rows = spanRows.value;
  if (!rows.length) return { t0: 0, span: 1, spanText: '—' };
  const t0 = Math.min(...rows.map((r) => r.span.startTime));
  const t1 = Math.max(...rows.map((r) => r.span.endTime || r.span.startTime + r.span.durationMs));
  const span = Math.max(t1 - t0, 1);
  return { t0, span, spanText: fmtMs(span) };
});

/**
 * Actuator 请求记录的时间轴窗口。
 *
 * <p>请求记录只有「时间戳 + 耗时」，没有 span 树；按时间戳定位、按耗时定宽，
 * 就是这条链路被追踪到的样子。</p>
 */
const httpTimeline = computed(() => {
  const list = httpRecords.value;
  if (!list.length) return { t0: 0, span: 1 };
  const stamps = list.map((r) => r.timestamp || 0).filter((v) => v > 0);
  const t0 = stamps.length ? Math.min(...stamps) : 0;
  const t1 = Math.max(...list.map((r) => (r.timestamp || t0) + Math.max(r.timeTaken || 0, 1)));
  return { t0, span: Math.max(t1 - t0, 1) };
});

/**
 * 时间轴条的位置与宽度（百分比）。
 *
 * @param start    起点毫秒
 * @param duration 耗时毫秒
 * @param t0       时间轴起点
 * @param span     时间轴总跨度
 * @returns 可直接绑到 :style 的 left / width
 */
function barStyle(start: number, duration: number, t0: number, span: number) {
  const left = ((start - t0) / span) * 100;
  const width = (duration / span) * 100;
  return {
    left: `${Math.min(Math.max(left, 0), 99.6)}%`,
    width: `${Math.min(Math.max(width, 0.6), 100)}%`,
  };
}

/** span 类型：决定时间轴条的颜色（错误 > 远程 > DB > HTTP > 内部） */
function spanKind(span: ApmSpan): string {
  if (span.error) return 'error';
  if (span.peer) return 'remote';
  const c = `${span.component || ''} ${span.layer || ''}`.toLowerCase();
  if (/db|jdbc|mysql|redis|mongo|sql|elastic|cache/.test(c)) return 'db';
  if (/http|rpc|dubbo|grpc|feign|gateway/.test(c)) return 'http';
  return 'inner';
}

/**
 * 按 parentSpanId 把 span 排成树（先序），同一层按开始时间。
 *
 * @param spans 链路里的 span
 * @returns 扁平化的树行
 */
function buildRows(spans: ApmSpan[]): SpanRow[] {
  if (!spans.length) return [];
  const keyOf = (s: ApmSpan) => `${s.segmentId || ''}:${s.spanId}`;
  const byKey = new Map<string, ApmSpan>();
  for (const s of spans) byKey.set(keyOf(s), s);

  const children = new Map<string, ApmSpan[]>();
  const roots: ApmSpan[] = [];
  for (const s of spans) {
    const parentKey = s.parentSpanId ? `${s.segmentId || ''}:${s.parentSpanId}` : '';
    if (parentKey && byKey.has(parentKey)) {
      const list = children.get(parentKey) || [];
      list.push(s);
      children.set(parentKey, list);
    } else {
      roots.push(s);
    }
  }
  const sortByStart = (a: ApmSpan, b: ApmSpan) => a.startTime - b.startTime || b.durationMs - a.durationMs;
  roots.sort(sortByStart);

  const out: SpanRow[] = [];
  const walk = (span: ApmSpan, depth: number, parentKey: string) => {
    const key = keyOf(span);
    const kids = children.get(key) || [];
    out.push({ key, span, depth, hasChildren: kids.length > 0, parentKey });
    kids.sort(sortByStart).forEach((kid) => walk(kid, depth + 1, key));
  };
  roots.forEach((root) => walk(root, 0, ''));
  return out;
}

function toggleNode(key: string) {
  expanded[key] = expanded[key] === false;
}

function toggleAll() {
  const next = !allExpanded.value;
  for (const row of spanRows.value) expanded[row.key] = next;
}

async function loadTracePage() {
  await loadTraces();
  if (traceSource.value === 'apm' && !traceId.value && traces.value.length) {
    await openTrace(traces.value[0].traceId);
  } else if (traceSource.value === 'actuator' && !currentHttpRecord.value && httpRecords.value.length) {
    openHttpRecord(httpRecords.value[0]);
  }
}

/** 当前链路数据来源：apm = APM 引擎 span 树；actuator = Actuator httptrace/httpexchanges 请求记录 */
const traceSource = ref<'apm' | 'actuator'>('apm');

/** Actuator 请求记录（httptrace/httpexchanges） */
interface HttpRecord {
  key: string;
  method: string;
  uri: string;
  status: number;
  timeTaken: number;
  timestamp: number;
  raw: string;
}
const httpRecords = ref<HttpRecord[]>([]);
const currentHttpRecord = ref<HttpRecord | null>(null);
const httpRecordKey = ref('');
/** 实际读取到的记录端点（httptrace / httpexchanges 由后端探测决定） */
const httpTraceEndpoint = ref('httptrace');
/** 记录是否被后端压缩时截断（响应体 >64KB，远端命令通道会截断） */
const httpTraceTruncated = ref(false);
/** 端点是否真的暴露（200 也算，即使一条记录都没有——区分「未暴露」与「无记录」） */
const httpTraceExposed = ref(false);

/**
 * 解析 Actuator httptrace / httpexchanges 响应。
 *
 * <p>优先用后端压缩好的 {@code records}（body 已清空，见 releaseActuator.ts）；
 * 后端未升级或 body 仍是原始 JSON 时，两种端点结构不同——httptrace 是
 * {@code {traces:[...]}}（Spring Boot 2.x），httpexchanges 是 {@code {exchanges:[...]}}
 * （Spring Boot 3.x 起）。这里两个都认，字段统一成 method/uri/status/timeTaken/timestamp
 * 供列表展示。</p>
 *
 * @param payload 端点返回
 * @returns 解析出的记录
 */
function parseHttpTrace(payload: { body?: string; records?: ActuatorHttpRecord[] }): HttpRecord[] {
  const compact = Array.isArray(payload?.records) ? payload.records : [];
  if (compact.length || payload?.records) {
    return compact.map((e: ActuatorHttpRecord, idx: number) => {
      const method = String(e.method || 'GET');
      let uri = String(e.uri || '');
      try {
        uri = new URL(uri).pathname + new URL(uri).search;
      } catch {
        /* 保持原样 */
      }
      const status = Number(e.status || 0);
      const timeTaken = Number(e.timeTaken || 0);
      let timestamp = Number(e.timestamp || 0);
      if (!timestamp && e.timestamp) {
        const ms = Date.parse(String(e.timestamp));
        if (Number.isFinite(ms)) timestamp = ms;
      }
      return {
        key: `${idx}:${method}:${uri}:${status}`,
        method,
        uri,
        status,
        timeTaken,
        timestamp,
        raw: prettyText(JSON.stringify(e, null, 2)),
      };
    });
  }
  const parsed = parseJson<any>(payload?.body || '');
  const list = Array.isArray(parsed?.exchanges) ? parsed.exchanges : Array.isArray(parsed?.traces) ? parsed.traces : [];
  return list.map((e: any, idx: number) => {
    const req = e?.request || {};
    const res = e?.response || {};
    const method = String(req.method || 'GET');
    let uri = String(req.uri || '');
    try {
      uri = new URL(uri).pathname + new URL(uri).search;
    } catch {
      /* 保持原样 */
    }
    const status = Number(res.status || 0);
    const timeTaken = Number(e?.timeTaken || 0);
    let timestamp = Number(e?.timestamp || 0);
    if (!timestamp && e?.timestamp) {
      const ms = Date.parse(String(e.timestamp));
      if (Number.isFinite(ms)) timestamp = ms;
    }
    return {
      key: `${idx}:${method}:${uri}:${status}`,
      method,
      uri,
      status,
      timeTaken,
      timestamp,
      raw: prettyText(JSON.stringify(e, null, 2)),
    };
  });
}

/**
 * 探测并读取 Actuator 请求记录端点（httptrace 优先，404 再试 httpexchanges）。
 *
 * @returns 读到的记录；端点都没暴露时返回空数组
 */
async function loadHttpTraceFallback(): Promise<HttpRecord[]> {
  httpTraceExposed.value = false;
  for (const ep of ['httptrace', 'httpexchanges']) {
    const payload = await fetchActuator(props.projectId, ep);
    if (payload.status === 200) {
      httpTraceExposed.value = true;
      httpTraceEndpoint.value = ep;
      httpTraceTruncated.value = !!payload.truncated;
      markRead(payload.elapsedMs, ep);
      const records = parseHttpTrace(payload);
      if (records.length) {
        return records;
      }
    }
  }
  return [];
}

async function loadTraces() {
  loading.value = true;
  traceEmpty.value = '';
  try {
    const status = await getApmStatus();
    if (!status.present || !status.capabilities?.includes('traces')) {
      // APM 没接入：回退到项目自己的 Actuator 请求记录，用户在这里打开的就是 Actuator 语境，
      // 不该被一句「先去注入 agent」挡在门外。
      const records = await loadHttpTraceFallback();
      traces.value = [];
      traceSpans.value = [];
      if (records.length) {
        traceSource.value = 'actuator';
        httpRecords.value = records;
        if (!currentHttpRecord.value && records.length) openHttpRecord(records[0]);
        return;
      }
      traceSource.value = 'apm';
      httpRecords.value = [];
      if (httpTraceExposed.value) {
        traceEmpty.value = `项目 Actuator 已暴露 ${httpTraceEndpoint.value}，但近期没有请求记录`
          + '（应用可能刚启动或没有流量）；要完整 span 链路可注入 SkyWalking / 平台 APM agent';
      } else {
        traceEmpty.value = 'APM 未接入，且项目 Actuator 未暴露 httptrace / httpexchanges：'
          + '要完整 span 链路可注入 SkyWalking / 平台 APM agent；'
          + '或确认 management.endpoints.web.exposure.include 含 httptrace';
      }
      return;
    }
    traceSource.value = 'apm';
    httpRecords.value = [];
    httpTraceEndpoint.value = 'httptrace';
    traces.value = await listTraces({
      service: props.apmService || undefined,
      minutes: traceMinutes.value,
      pageSize: 50,
      orderByDuration: true,
    });
    if (!traces.value.length) {
      traceEmpty.value = `近 ${traceMinutes.value} 分钟没有链路`;
    }
  } catch (e: any) {
    traces.value = [];
    traceEmpty.value = e?.message || '读取链路失败';
  } finally {
    loading.value = false;
  }
}

function openHttpRecord(r: HttpRecord) {
  httpRecordKey.value = r.key;
  currentHttpRecord.value = r;
}

async function openTrace(id: string) {
  if (!id) return;
  traceId.value = id;
  loading.value = true;
  try {
    const detail = await getTrace(id);
    traceSpans.value = detail?.spans || [];
    for (const row of buildRows(traceSpans.value)) expanded[row.key] = true;
  } catch (e: any) {
    traceSpans.value = [];
    traceEmpty.value = e?.message || '读取链路详情失败';
  } finally {
    loading.value = false;
  }
}

// ==================== 其它端点 ====================

const otherEndpoint = ref('health');
const otherBody = ref('');
const otherStatus = ref(0);
const otherElapsed = ref(0);
const otherMessage = ref('');

async function openOther(endpoint: string) {
  otherEndpoint.value = endpoint;
  loading.value = true;
  // 换端点先清掉上一个端点的状态，避免读取期间把旧状态当成新结果
  otherStatus.value = 0;
  otherElapsed.value = 0;
  otherMessage.value = '';
  otherBody.value = '';
  try {
    const payload = await fetchActuator(props.projectId, endpoint);
    currentUrl.value = payload.url || '';
    otherStatus.value = payload.status;
    otherElapsed.value = payload.elapsedMs;
    otherMessage.value = payload.message || '';
    // httptrace / httpexchanges 后端会压成 records（body 已清空），
    // 这里直接展示压缩后的记录，别让用户看到「（空返回）」
    const compact = Array.isArray(payload.records) ? payload.records : [];
    otherBody.value =
      compact.length || payload.records
        ? prettyText(JSON.stringify(payload.records, null, 2))
        : prettyText(payload.body);
    markRead(payload.elapsedMs, endpoint);
  } catch (e: any) {
    otherMessage.value = e?.message || '读取失败';
    otherBody.value = '';
  } finally {
    loading.value = false;
  }
}

interface StartupStepRow {
  key: string;
  name: string;
  durationMs: number;
  startTime: string;
}

/** 后端是否因为响应体过大截断了原始返回（startup 常超 512KB） */
const startupTruncated = computed(
  () => otherEndpoint.value === 'startup' && /过大|截断/.test(otherMessage.value),
);

/**
 * startup 端点的启动阶段耗时（TopN，按 duration 倒序）。
 *
 * <p>{@code /actuator/startup} 的每个事件自己带 {@code duration}（单位秒），
 * 这才是「关联项目启动慢在哪一步」的直接答案；原始 JSON 几百 KB，看不动。</p>
 *
 * <p>响应体超过后端 512KB 上限时 JSON 一定解析失败，这时按文本抽取
 * {@code duration} 与 {@code name} 的配对 —— 宁可标注「已截断」，也不整块不给。</p>
 */
const startupSteps = computed<StartupStepRow[]>(() => {
  if (otherEndpoint.value !== 'startup' || !otherBody.value) return [];
  const rows: StartupStepRow[] = [];
  const parsed = parseJson<any>(otherBody.value);
  if (parsed?.timeline?.events && Array.isArray(parsed.timeline.events)) {
    parsed.timeline.events.forEach((e: any, i: number) => {
      const dur = Number(e?.duration);
      const start = Date.parse(String(e?.startTime || ''));
      rows.push({
        key: `${i}`,
        name: String(e?.startupStep?.name || '—'),
        durationMs: Number.isFinite(dur) ? dur * 1000 : 0,
        startTime: Number.isFinite(start) ? fmtClock(start) : '',
      });
    });
  } else {
    const re = /"duration"\s*:\s*([0-9.eE+-]+)[\s\S]{0,400}?"name"\s*:\s*"([^"]+)"/g;
    let hit: RegExpExecArray | null;
    while ((hit = re.exec(otherBody.value))) {
      const dur = Number(hit[1]);
      rows.push({
        key: `t${rows.length}`,
        name: hit[2],
        durationMs: Number.isFinite(dur) ? dur * 1000 : 0,
        startTime: '',
      });
    }
  }
  return rows.sort((a, b) => b.durationMs - a.durationMs).slice(0, 8);
});

// ==================== 公共 ====================

/**
 * 「原始返回」的高度（px）。
 *
 * <p>原始 JSON 动辄几百行，固定高度里只能看到开头几行；用一条可拖拽的分隔条
 * 让用户按当前要看的字段把版面拉高，比再开一个弹层轻。</p>
 */
const rawHeight = ref(240);

/** 拖拽「原始返回」上沿调整高度（120px ~ 视口下方留 220px） */
function startRawDrag(ev: PointerEvent) {
  const startY = ev.clientY;
  const startHeight = rawHeight.value;
  const move = (e: PointerEvent) => {
    const next = startHeight - (e.clientY - startY);
    rawHeight.value = Math.min(Math.max(next, 120), Math.max(200, window.innerHeight - 240));
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.style.userSelect = '';
  };
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

/** JSON.parse 容错：文本不是 JSON 时返回 null */
function parseJson<T>(text: string): T | null {
  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

/** 能解析就格式化，不能就原样输出 */
function prettyText(text: string): string {
  if (!text) return '';
  const parsed = parseJson<unknown>(text);
  return parsed === null ? text : JSON.stringify(parsed, null, 2);
}

/** 指标明细整体展示用（表格已覆盖常用字段，原始 JSON 留给排障） */
function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function fmtNum(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 10) return `${ms.toFixed(0)}ms`;
  return `${ms.toFixed(1)}ms`;
}

function fmtClock(ms: number): string {
  const d = new Date(ms);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

onMounted(() => {
  if (!TABS.some((t) => t.key === tab.value)) tab.value = 'metrics';
  ensureLoaded();
  void loadAppTiming();
});
</script>

<style scoped>
.obs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12.5px;
}

/* ============ 档案头 ============ */
.obs-top {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.obs-crumb {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.obs-logo {
  color: var(--el-color-primary);
  font-size: 14px;
}

.obs-crumb b {
  font-size: 13.5px;
  font-weight: 650;
}

.obs-sep {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

/* 弱化文字：档案里的次级信息（分组名、计数、标签值等） */
.obs-dim {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.obs-project {
  overflow: hidden;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-crumb .obs-dim {
  font-size: 11px;
}

.obs-stamp {
  color: var(--el-text-color-placeholder);
  font-size: 10.5px;
  white-space: nowrap;
}

.obs-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  /* 页签靠左：档案是从左往右读的，居中会让人找不到起点 */
  align-self: flex-start;
  margin: 8px 20px 0;
  width: fit-content;
}

.obs-tab {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
}

.obs-tab em {
  margin-left: 4px;
  color: var(--el-text-color-placeholder);
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-style: normal;
}

.obs-tab.is-on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.obs-grow {
  flex: 1;
}

/* ============ 本轮读取总览 ============ */
.obs-readsum {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 8px 20px 0;
  padding: 5px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  font-size: 11.5px;
}

.obs-readsum-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

/* 第二行是应用自己的执行时间，和「读取耗时」区分开：弱一档底色与字号 */
.obs-readsum-app {
  padding-top: 2px;
  border-top: 1px dashed var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.obs-readsum-proj {
  overflow: hidden;
  max-width: 180px;
  color: var(--el-color-primary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-readsum b {
  font-size: 12px;
}

.obs-readsum-slow {
  color: var(--el-color-warning-dark-2);
}

.obs-readchip {
  overflow: hidden;
  max-width: 190px;
  padding: 1px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-url {
  max-width: 34%;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-btn {
  padding: 3px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.obs-btn:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.obs-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 20px 16px;
}

.obs-split {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  gap: 14px;
  overflow: hidden;
  padding: 10px 20px 16px;
}

.obs-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.obs-side-cap {
  padding: 0 2px 2px;
}

/* ============ 档案纸（剖面档案主体） ============ */
.obs-sheet {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 0;
  padding: 16px 20px 14px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.obs-profile {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.obs-profile-main {
  min-width: 0;
}

.obs-cap {
  color: var(--el-text-color-placeholder);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.obs-profile h1 {
  margin: 3px 0 4px;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.02em;
  word-break: break-all;
}

.obs-lead {
  max-width: 620px;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  line-height: 1.65;
}

.obs-lead code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
}

.obs-profile-read {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  margin-left: auto;
}

.obs-rnum {
  font-size: 30px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
}

.obs-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.obs-badge.is-ok {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
}

.obs-badge.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}

.obs-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.obs-dot.is-ok {
  background: var(--el-color-success);
}

.obs-dot.is-warn {
  background: var(--el-color-warning);
}

.obs-facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 13px;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.obs-facts div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.obs-facts span {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.obs-facts b {
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-meas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.obs-meas div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.obs-meas b {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-rule {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 13px 0 7px;
}

.obs-rule span {
  font-size: 12px;
  font-weight: 650;
}

.obs-rule b {
  color: var(--el-text-color-placeholder);
  font-size: 10.5px;
  font-weight: 400;
}

.obs-rule-btn {
  order: 2;
  padding: 2px 9px;
  font-size: 11px;
}

.obs-rule::after {
  content: "";
  order: 1;
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

/* 可拖拽的分隔条：把细线加粗成抓手，悬停变主色，提示「这里能拖」 */
.obs-rule.is-grip {
  cursor: ns-resize;
  user-select: none;
}

.obs-rule.is-grip::after {
  height: 3px;
  border-radius: 2px;
  background: var(--el-border-color);
  transition: background 0.15s ease;
}

.obs-rule.is-grip:hover::after {
  background: var(--el-color-primary);
}

.obs-tr-startup {
  grid-template-columns: minmax(0, 1fr) 88px 84px;
}

.obs-tags {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.obs-tagrow {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-height: 20px;
  border-bottom: 1px dotted var(--el-border-color-light);
  font-size: 11px;
}

.obs-tagrow span:first-child {
  flex: none;
  width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-tagrow span:last-child {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-catalog {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.obs-search--inline {
  width: 200px;
  margin-bottom: 2px;
}

.obs-cat {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 320px;
  padding: 3px 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 11px;
  cursor: pointer;
}

.obs-cat span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-cat span:last-child {
  flex: none;
  font-size: 10px;
}

.obs-cat:hover {
  border-color: var(--el-border-color);
}

.obs-cat.is-on {
  border-color: var(--el-color-primary-light-8);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.obs-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.obs-search {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.obs-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.obs-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.obs-item:hover {
  background: var(--el-fill-color-light);
}

.obs-item.is-on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.obs-empty,
.obs-empty-sm {
  padding: 16px 10px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-align: center;
}

.obs-empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.obs-json {
  flex: none;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.obs-hint {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  line-height: 1.6;
}

.obs-hint code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.obs-logger-bar,
.obs-trace-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.obs-logger-bar .obs-search {
  width: 260px;
}

.obs-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.obs-count {
  color: var(--el-text-color-placeholder);
  font-size: 11.5px;
}

.obs-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.obs-tr {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 96px 96px;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.obs-tr:last-child {
  border-bottom: none;
}

.obs-th {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
}

.obs-c-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-c-level.is-set {
  color: var(--el-color-warning);
  font-weight: 600;
}

.obs-select {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 11.5px;
}

.obs-trace-item {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 58px;
  gap: 6px;
}

/* Actuator 请求记录（左侧列表）：状态 / 请求 / 延迟 / 时间 四列。
   延迟必须进列表——排查时第一眼要的就是「哪条慢」，再点进去看瀑布。 */
.obs-trace-http {
  grid-template-columns: 34px minmax(0, 1fr) 52px 44px;
  gap: 4px;
}

.obs-trace-status {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.obs-trace-lat {
  color: var(--el-color-warning-dark-2);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.obs-trace-http .obs-trace-time {
  font-size: 10px;
}

/* 链路追踪层级树（左侧）：入口根 + 子 span 缩进，4 列布局 */
.obs-trace-tree {
  grid-template-columns: 62px minmax(0, 1fr) 1fr 58px;
}
.obs-trace-tree.is-root .obs-trace-name {
  color: var(--el-color-primary);
  font-weight: 600;
}
.obs-trace-child {
  flex: none;
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
}

.obs-trace-item.is-error .obs-trace-ms {
  color: var(--el-color-danger);
}

.obs-trace-ms {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.obs-trace-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-trace-time {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-align: right;
}

/* ============ 追踪效果：时间轴瀑布 ============ */
.obs-wf {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.obs-wf-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.obs-wf-row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) 56px;
  align-items: center;
  gap: 8px;
  padding: 2px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  cursor: pointer;
}

.obs-wf-row:last-child {
  border-bottom: none;
}

.obs-wf-row:hover {
  background: var(--el-fill-color-light);
}

.obs-wf-row.is-on {
  background: var(--el-color-primary-light-9);
}

.obs-wf-row.is-remote {
  background: color-mix(in srgb, var(--el-color-primary) 4%, transparent);
}

.obs-wf-row.is-error .obs-wf-name {
  color: var(--el-color-danger);
}

.obs-wf-label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.obs-wf-svc {
  flex: none;
  max-width: 110px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-wf-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-wf-status {
  flex: none;
  width: 30px;
  color: var(--el-color-success-dark-2);
  font-size: 11px;
  font-weight: 600;
}

.obs-wf-row.is-error .obs-wf-status {
  color: var(--el-color-danger);
}

.obs-wf-track {
  position: relative;
  height: 10px;
  overflow: hidden;
  border-radius: var(--el-radius-full);
  background: var(--el-fill-color-light);
}

.obs-wf-bar {
  position: absolute;
  top: 0;
  height: 100%;
  min-width: 2px;
  border-radius: var(--el-radius-full);
  background: var(--el-color-info);
}

.obs-wf-bar.is-inner {
  background: var(--el-color-info);
}

.obs-wf-bar.is-http {
  background: var(--el-color-primary);
}

.obs-wf-bar.is-db {
  background: var(--el-color-warning);
}

.obs-wf-bar.is-remote {
  background: var(--el-color-primary-light-3);
}

.obs-wf-bar.is-error {
  background: var(--el-color-danger);
}

.obs-wf-toggle {
  width: 14px;
  flex: none;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  cursor: pointer;
}

.obs-wf-toggle.is-hidden {
  visibility: hidden;
}

.obs-wf-ms {
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.obs-warn {
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  font-size: 11.5px;
}

.mono {
  font-family: var(--font-mono, monospace);
}
</style>
