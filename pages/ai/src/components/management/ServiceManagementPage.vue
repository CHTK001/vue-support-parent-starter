<template>
  <div class="svc" :class="{ 'is-focus': focusConsole }">
    <!-- ==================== 00 页头 ==================== -->
    <header class="svc-head">
      <div class="svc-head__text">
        <h2 class="svc-head__title">服务配置</h2>
        <p class="svc-head__sub">
          对外服务实例、访问记录与进程运行日志。<b>{{ instances.length }}</b> 个实例 ·
          <b>{{ runningCount }}</b> 个运行中
        </p>
      </div>
      <div class="svc-head__actions">
        <!-- 静默轮询的「数据新鲜度」信号：6px 圆点 + 等宽时间戳，不遮罩正在读的那行 -->
        <span class="svc-stamp" :class="{ 'is-live': runtimeLoading }">
          <i class="svc-stamp__dot" aria-hidden="true"></i>更新于 <b>{{ lastSyncText }}</b>
        </span>
        <el-button class="svc-btn" @click="loadAll" :loading="instLoading">
          <el-icon v-if="!instLoading" class="svc-btn__icon" aria-hidden="true"><RefreshIcon /></el-icon>
          全部刷新
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
          新建服务实例
        </el-button>
      </div>
    </header>

    <!-- ==================== 00b 状态带（Q1 的唯一答案） ==================== -->
    <section class="svc-band" aria-label="服务健康概览">
      <div class="svc-band__cell">
        <span class="svc-band__num">{{ runningCount }}<i>/{{ instances.length }}</i></span>
        <span class="svc-band__label">实例运行中</span>
      </div>
      <div class="svc-band__cell is-warn" v-if="downCount > 0">
        <span class="svc-band__num">{{ downCount }}</span>
        <span class="svc-band__label">启动失败</span>
      </div>
      <div class="svc-band__cell">
        <span class="svc-band__num">{{ logs.length }}<i> 条</i></span>
        <span class="svc-band__label">已加载访问记录</span>
      </div>
      <div class="svc-band__cell is-danger" v-if="errorCount > 0">
        <span class="svc-band__num">{{ errorCount }}<i> 次</i></span>
        <span class="svc-band__label">{{ errorCountScopeLabel }}</span>
      </div>
      <div class="svc-band__cell">
        <span class="svc-band__num">{{ formatCompact(totalTokens) }}</span>
        <span class="svc-band__label">Token 合计 · 均耗时 {{ avgLatency }}</span>
      </div>
    </section>

    <!-- ==================== 01 服务实例（瓦片横排，单选联动） ==================== -->
    <section class="svc-inst" aria-labelledby="svc-inst-t">
      <div class="svc-sect__head">
        <span class="svc-sect__no">01</span>
        <h3 class="svc-sect__title" id="svc-inst-t">服务实例</h3>
        <div class="svc-sect__extra">
          <span class="svc-sect__hint">点击卡片，下方访问日志切换到该实例</span>
        </div>
      </div>

      <!-- 内联错误条：旧数据不清空（实例瓦片继续可读） -->
      <div class="svc-alert is-danger" v-if="instError" style="margin-bottom: 12px">
        <span class="svc-alert__text">服务实例加载失败：{{ instError }}</span>
        <button class="svc-alert__act" @click="loadInstances">重试</button>
      </div>

      <!-- 首屏骨架：3 片，不遮罩 -->
      <ul class="svc-tiles" v-if="instLoading && !instances.length">
        <li v-for="n in 3" :key="'skel' + n" class="svc-tile is-skeleton" aria-hidden="true">
          <span class="svc-tile__state"></span>
          <div class="svc-tile__body">
            <div class="svc-tile__line"><b class="svc-skel" style="width: 140px; height: 15px"></b></div>
            <div class="svc-tile__meta">
              <b class="svc-skel" style="width: 62px; height: 18px"></b>
              <b class="svc-skel" style="width: 108px; height: 14px"></b>
            </div>
          </div>
        </li>
      </ul>

      <!-- 空态：虚线框 + 引导 CTA -->
      <div class="svc-empty" v-else-if="!instances.length">
        <span class="svc-empty__mark" aria-hidden="true"></span>
        <b>还没有服务实例</b>
        <i>创建后即可对外提供 OpenAI / Claude / Gemini 兼容接口</i>
        <el-button type="primary" class="svc-btn" style="margin-top: 6px"
                   @click="showCreateDialog = true">
            <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
            新建服务实例
          </el-button>
      </div>

      <ul class="svc-tiles" v-else>
        <li v-for="t in instances" :key="t.id"
            class="svc-tile"
            :class="{ 'is-active': isActive(t), 'is-ok': t.running === true, 'is-down': isDown(t), 'is-flash': flashId === t.id }"
            tabindex="0" role="button"
            :aria-current="isActive(t) ? 'true' : undefined"
            :aria-label="`${t.name} 端口 ${t.port}，${statusBadgeText(t)}，回车查看该实例的访问日志`"
            @click="selectInstance(t.id)"
            @keydown.enter.prevent="selectInstance(t.id)"
            @keydown.space.prevent="selectInstance(t.id)">
          <span class="svc-tile__state" aria-hidden="true"></span>
          <div class="svc-tile__body">
            <div class="svc-tile__line">
              <b class="svc-tile__name" :title="t.name">{{ t.name }}</b>
              <span class="svc-badge" :class="statusBadgeClass(t)"><i aria-hidden="true"></i>{{ statusBadgeText(t) }}</span>
            </div>
            <div class="svc-tile__meta">
              <span class="svc-tile__port">:{{ t.port }}</span>
              <span class="svc-tile__protos">
                <span class="svc-chip is-protocol" v-if="t.enableGpt">GPT</span>
                <span class="svc-chip is-protocol" v-if="t.enableCc">CC</span>
                <span class="svc-chip is-protocol" v-if="t.enableGemini">GEMINI</span>
                <span class="svc-chip is-empty" v-if="!protoCount(t)">无协议</span>
              </span>
              <span class="svc-tile__usage">用量 {{ t.logUsage ? '开' : '关' }}</span>
            </div>
          </div>
          <!-- 操作组：阻止冒泡，点「删除」不能同时切换选中 -->
          <div class="svc-tile__acts" @click.stop @keydown.stop>
            <button class="svc-ico" :disabled="busy[t.id] === true"
                    :title="t.running === true ? '停止该实例' : '启动该实例'"
                    :aria-label="t.running === true ? '停止该实例' : '启动该实例'"
                    @click="toggleInstance(t)">
              <el-icon><component :is="t.running === true ? StopIcon : PlayIcon" /></el-icon>
            </button>
            <button class="svc-ico" title="访问令牌" aria-label="访问令牌" @click="goTokens(t)">
              <el-icon><KeyIcon /></el-icon>
            </button>
            <button class="svc-ico svc-ico--danger" :disabled="t.running === true || busy[t.id] === true"
                    :title="t.running === true ? '请先停止该服务实例，再删除' : '删除该实例'"
                    :aria-label="t.running === true ? '请先停止该服务实例，再删除' : '删除该实例'"
                    @click="deleteInstance(t)">
              <el-icon><DeleteIcon /></el-icon>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- ==================== 02 + 03 两栏工作区 ==================== -->
    <div class="svc-grid">
      <!-- ---------- 02 访问日志 ---------- -->
      <section class="svc-panel svc-panel--access" aria-labelledby="svc-access-t">
        <div class="svc-sect__head">
          <span class="svc-sect__no">02</span>
          <h3 class="svc-sect__title" id="svc-access-t">访问日志</h3>
          <div class="svc-sect__extra">
            <el-select v-model="logInstanceId" class="svc-select" @change="onScopeChange">
              <el-option label="全部实例" value="" />
              <el-option v-for="i in instances" :key="i.id" :label="`${i.name} :${i.port}`" :value="i.id" />
            </el-select>
            <el-input v-model="logKeyword" class="svc-search" placeholder="过滤端点 / 模型" clearable />
            <span class="svc-count"><b>{{ filteredLogs.length }}</b> 条</span>
            <el-button class="svc-btn" @click="loadLogs">刷新</el-button>
          </div>
        </div>

        <div class="svc-alert is-danger" v-if="logsError" style="margin: 0 16px 10px">
          <span class="svc-alert__text">访问日志加载失败：{{ logsError }}（该实例可能已停止）</span>
          <button class="svc-alert__act" @click="loadLogs">重试</button>
        </div>

        <div class="svc-tablewrap" :class="{ 'is-busy': logsLoading }">
          <!-- 顶部 2px 扫描条替代 v-loading 遮罩：旧数据保持可读 -->
          <span class="svc-scanline" v-if="logsLoading" aria-hidden="true"></span>

          <!-- 首屏骨架：6 行灰条（ReTable 无骨架插槽，置于表外同尺寸占位） -->
          <div class="svc-skelrows" v-if="logsLoading && !logs.length" aria-hidden="true">
            <div class="svc-skelrow" v-for="n in 6" :key="'r' + n">
              <b class="svc-skel svc-skelcell" style="width: 108px"></b>
              <b class="svc-skel svc-skelcell"></b>
              <b class="svc-skel svc-skelcell" style="width: 52px"></b>
              <b class="svc-skel svc-skelcell" style="width: 92px"></b>
              <b class="svc-skel svc-skelcell" style="width: 78px"></b>
            </div>
          </div>

          <ReTable v-else
                   :data="filteredLogs" :columns="logColumns"
                   engine="element" :pagination="false" :toolbar="false"
                   :layout-table="{ maxHeight: 336 }"
                   :settings="{ border: false, stripe: true }"
                   row-key="logId" class="svc-table">
            <template #col-callTime="{ row }">
              <div class="svc-time">
                <b class="svc-time__main">{{ timeMain(row.callTime) }}</b>
                <i class="svc-time__sub">{{ timeSub(row.callTime) }}</i>
              </div>
            </template>
            <template #col-endpoint="{ row }">
              <!-- 行悬浮详情：4 字段任一缺失 → popover 整体不出现 -->
              <el-tooltip placement="top" :disabled="!hasDetail(row)" :show-after="180">
                <template #content>
                  <div class="svc-logdetail">
                    <div><span class="svc-logdetail__k">端点</span>{{ row.endpoint }}</div>
                    <div><span class="svc-logdetail__k">方法</span>{{ row.method }}</div>
                    <div><span class="svc-logdetail__k">来源</span>{{ row.clientIp }}</div>
                    <div><span class="svc-logdetail__k">用户</span>{{ row.userId }}</div>
                    <div><span class="svc-logdetail__k">logId</span>{{ row.logId }}</div>
                  </div>
                </template>
                <div class="svc-ep">
                  <span class="svc-ep__method">{{ row.method || '—' }}</span>
                  <span class="svc-ep__path" :title="row.endpoint">{{ tailPath(row.endpoint) }}</span>
                </div>
              </el-tooltip>
            </template>
            <template #col-protocol="{ row }">
              <span class="svc-chip is-protocol" v-if="row.protocol">{{ protoLabel(row.protocol) }}</span>
            </template>
            <template #col-status="{ row }">
              <span class="svc-status" :class="httpClass(row.status)">
                <b>{{ row.status == null || row.status === 0 ? '—' : row.status }}</b><i>{{ httpText(row.status) }}</i>
              </span>
            </template>
            <template #col-totalTokens="{ row }">
              <div class="svc-tok">
                <b>{{ rowTotalTokens(row) }}</b>
                <i v-if="row.promptTokens != null">{{ row.promptTokens }} / {{ row.completionTokens ?? 0 }}</i>
              </div>
            </template>
            <template #col-latency="{ row }">
              <span class="svc-num">{{ formatLatency(row.latency) }}</span>
            </template>
            <template #empty>
              <div class="svc-empty">
                <span class="svc-empty__mark" aria-hidden="true"></span>
                <b>{{ emptyAccessText }}</b>
                <i>{{ emptyAccessHint }}</i>
              </div>
            </template>
          </ReTable>
        </div>
      </section>

      <!-- ---------- 03 运行日志 ---------- -->
      <section class="svc-panel svc-panel--console" aria-labelledby="svc-rt-t">
        <div class="svc-sect__head">
          <span class="svc-sect__no">03</span>
          <h3 class="svc-sect__title" id="svc-rt-t">运行日志</h3>
          <div class="svc-sect__extra">
            <el-select v-model="runtimeSource" class="svc-select svc-select--fixed">
              <el-option label="标准输出" value="out" />
              <el-option label="标准错误" value="err" />
            </el-select>
            <el-select v-model.number="runtimeLines" class="svc-select svc-select--fixed">
              <el-option label="最近 200 行" :value="200" />
              <el-option label="最近 500 行" :value="500" />
              <el-option label="最近 1000 行" :value="1000" />
            </el-select>
            <div class="svc-seg" role="group" aria-label="日志级别过滤">
              <button v-for="lv in LEVELS" :key="lv.v" class="svc-seg__btn"
                      :class="{ 'is-active': levelFilter === lv.v }"
                      :aria-pressed="levelFilter === lv.v" @click="levelFilter = lv.v">{{ lv.t }}</button>
            </div>
            <el-input v-model="runtimeKeyword" class="svc-search" placeholder="过滤日志文本" clearable />
            <label class="svc-switch"><el-switch v-model="runtimeAutoRefresh" size="small" /> 自动</label>
            <el-select v-model.number="pollMs" class="svc-select svc-select--fixed" :disabled="!runtimeAutoRefresh">
              <el-option label="3 秒" :value="3000" />
              <el-option label="5 秒" :value="5000" />
              <el-option label="10 秒" :value="10000" />
              <el-option label="30 秒" :value="30000" />
            </el-select>
            <button ref="focusBtnRef" class="svc-ico" :title="focusConsole ? '退出聚焦 (Esc)' : '聚焦日志 (F)'"
                    :aria-label="focusConsole ? '退出聚焦 (Esc)' : '聚焦日志 (F)'"
                    :aria-pressed="focusConsole" @click="toggleFocus">
              <el-icon><component :is="focusConsole ? MinimizeIcon : FullscreenIcon" /></el-icon>
            </button>
            <el-button class="svc-btn" @click="refreshRuntimeNow">刷新</el-button>
          </div>
        </div>

        <!-- 作用域提示条：明确「这份进程日志对应哪个实例」，且声明它不按实例过滤 -->
        <div class="svc-scope" v-if="activeInstance">
          <span class="svc-scope__tag">正在排查</span>
          <b>{{ activeInstance.name }}</b>
          <span class="svc-scope__port">:{{ activeInstance.port }}</span>
          <span class="svc-scope__dot">·</span>
          <span class="svc-scope__text">{{ failedForActive }} 次失败请求</span>
          <span class="svc-scope__dot">·</span>
          <span class="svc-scope__text">进程级日志，不按实例过滤</span>
        </div>
        <p class="svc-panel__back" role="button" tabindex="0"
           @click="toggleFocus" @keydown.enter.prevent="toggleFocus">← 返回服务配置</p>

        <!-- meta 条：路径（JS 中段截断）+ 文件状态 + 新鲜度 + 行数 -->
        <div class="svc-console__meta">
          <span class="svc-path" :title="runtimePath">{{ midTruncate(runtimePath, 18, 26) }}</span>
          <span class="svc-chip is-danger" v-if="runtimeLoaded && runtimeExists === false">文件未生成</span>
          <span class="svc-chip is-warn" v-if="runtimeTruncated">已截断</span>
          <span class="svc-meta">更新 <b>{{ lastSyncText }}</b></span>
          <span class="svc-meta">{{ runtimeLogLines.length }} 行</span>
          <span class="svc-meta" v-if="filteredRuntimeLines.length !== runtimeLogLines.length">
            命中 {{ filteredRuntimeLines.length }}
          </span>
        </div>

        <!-- 深色代码面 -->
        <div ref="consoleRef" class="svc-console" :class="{ 'is-busy': runtimeActive }"
             tabindex="0" role="log" aria-live="off" aria-label="运行日志内容"
             @scroll="onConsoleScroll">
          <span class="svc-scanline" v-if="runtimeActive" aria-hidden="true"></span>
          <!-- R4：后端非管理员返 200 + {ok:false}，必须与「暂无日志」区分 -->
          <div class="svc-console__denied" v-if="runtimeDenied">{{ runtimeDenied }}</div>
          <div class="svc-console__empty" v-else-if="!runtimeLogLines.length">
            <span class="svc-empty__mark" aria-hidden="true"></span>
            <b>{{ runtimeLoaded && runtimeExists === false ? '日志文件尚未生成' : '暂无日志输出' }}</b>
            <i>{{ runtimeLoaded && runtimeExists === false ? '检查服务启动配置是否写入了日志路径' : '该文件存在但没有可用内容' }}</i>
            <code v-if="runtimePath">{{ runtimePath }}</code>
          </div>
          <div class="svc-empty" v-else-if="!filteredRuntimeLines.length">
            <span class="svc-empty__mark" aria-hidden="true"></span>
            <b>无匹配行</b><i>共 {{ runtimeLogLines.length }} 行中 0 行命中</i>
            <button class="svc-alert__act" @click="clearRuntimeFilter">清除过滤</button>
          </div>
          <template v-else>
            <div v-for="(l, idx) in filteredRuntimeLines" :key="idx"
                 class="svc-line" :class="levelClass(l.level)">
              <span class="svc-line__no">{{ idx + 1 }}</span>
              <span class="svc-line__lv" :class="levelClass(l.level)">{{ levelText(l.level) }}</span>
              <span class="svc-line__raw">{{ l.raw }}</span>
            </div>
          </template>
        </div>

        <!-- 静默跟随：用户上滚后不硬拽回底，浮出「N 行新日志」药丸 -->
        <button v-show="!pinned && pendingLines > 0" class="svc-jump"
                @click="jumpToBottom">↓ {{ pendingLines }} 行新日志</button>
      </section>
    </div>

    <!-- 新建实例对话框（本次不纳入设计层范围，见 N10） -->
    <ReDialog v-model="showCreateDialog" title="新建服务实例" width="min(500px, 92vw)" append-to-body>
      <el-form :model="newInstance" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="newInstance.name" placeholder="如：我的AGNES服务" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="newInstance.port" :min="8000" :max="9999" />
        </el-form-item>
        <el-form-item label="协议开关">
          <el-checkbox v-model="newInstance.enableGpt">GPT (OpenAI兼容)</el-checkbox>
          <el-checkbox v-model="newInstance.enableCc">CC (Claude兼容)</el-checkbox>
          <el-checkbox v-model="newInstance.enableGemini">Gemini兼容</el-checkbox>
        </el-form-item>
        <el-form-item label="记录用量">
          <el-switch v-model="newInstance.logUsage" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createInstance">创建</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { createClient, v2Http } from '@/framework/context'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import {
  Play20Regular, Stop20Regular, Key20Regular, Delete20Regular,
  ArrowMaximize20Regular, ArrowMinimize20Regular,
  ArrowClockwise20Regular, Add24Regular,
} from '@vicons/fluent'

const http = createClient(v2Http, { unwrap: false })
const router = useRouter()

const PlayIcon = Play20Regular
const StopIcon = Stop20Regular
const KeyIcon = Key20Regular
const DeleteIcon = Delete20Regular
const FullscreenIcon = ArrowMaximize20Regular
const MinimizeIcon = ArrowMinimize20Regular
const RefreshIcon = ArrowClockwise20Regular
const AddIcon = Add24Regular

// ============================================================================
// §4.3 六个纯函数（无副作用、不碰接口字段、可独立单测）
// ============================================================================

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const pad2 = (n: number) => (n < 10 ? '0' + n : String(n))

/**
 * 路径中段截断：头 n 字符 + … + 尾 m 字符。
 * 替掉现状 `.runtime-log-meta` 的 `direction: rtl` hack —— 它对 `/` 开头的
 * POSIX 路径会把分隔符的视觉顺序打乱，看起来像路径写错了。
 */
function midTruncate(s: unknown, head = 18, tail = 26): string {
  const str = s == null ? '' : String(s)
  if (!str) return ''
  if (str.length <= head + tail) return str
  return str.slice(0, head) + '…' + str.slice(-tail)
}

/** 取路径尾两段（?query 与 #hash 一律丢弃），用于访问日志端点列 */
function tailPath(p: unknown): string {
  if (p == null) return '—'
  let s = String(p).trim()
  if (!s) return '—'
  const h = s.indexOf('#')
  if (h >= 0) s = s.slice(0, h)
  const q = s.indexOf('?')
  if (q >= 0) s = s.slice(0, q)
  const segs = s.split('/').filter(Boolean)
  if (segs.length <= 2) return s || '—'
  return '/' + segs.slice(-2).join('/')
}

/** 后端协议值 → 显示词：openai→GPT / cc→CC / gemini→GEMINI / 其他→大写原值 */
function protoLabel(v: unknown): string {
  const s = v == null ? '' : String(v).trim()
  if (!s) return ''
  const k = s.toLowerCase()
  if (k === 'openai') return 'GPT'
  if (k === 'cc' || k === 'claude') return 'CC'
  if (k === 'gemini') return 'GEMINI'
  return s.toUpperCase()
}

/** 耗时：<1ms / 842ms / 1.28s（等宽渲染，禁止出现 NaN/undefined） */
function formatLatency(ms: unknown): string {
  if (ms == null || ms === '') return '—'
  const n = Number(ms)
  if (!isFinite(n) || n < 0) return '—'
  if (n < 1) return '<1ms'
  if (n < 1000) return Math.round(n) + 'ms'
  return (n / 1000).toFixed(2) + 's'
}

/** 12345 → 12.3k；1.2e6 → 1.2M。状态带用，避免长数字把 24px 等宽格撑破 */
function formatCompact(n: unknown): string {
  const v = Number(n)
  if (!isFinite(v) || v <= 0) return '0'
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1e4) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(v))
}

/** 时间戳 → HH:mm:ss；超过 60s 改为「N 分前 / N 小时前 / N 天前」 */
function toClock(ms: number): string {
  if (!ms) return '—'
  const d = new Date(ms)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - ms
  if (diff > 60000) {
    const m = Math.floor(diff / 60000)
    if (m < 60) return m + ' 分前'
    const h = Math.floor(m / 60)
    if (h < 24) return h + ' 小时前'
    return Math.floor(h / 24) + ' 天前'
  }
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
}

// ============================================================================
// R3：无时区 LocalDateTime 解析
// ============================================================================

/**
 * 解析后端 `LocalDateTime`（形如 "2026-12-28 14:03:11.123"）。
 * ⚠️ 绝不 `new Date(str)`：Chrome 能解析带空格的变体，Firefox / Safari 会给
 * Invalid Date（实测坑）。这里按 `yyyy-MM-dd HH:mm:ss[.SSS]` 手动 split 后
 * 用数字构造本地 Date，解析失败返回 null，由调用方降级为「原样显示 + 次行 —」。
 */
function parseLocalDateTime(raw: unknown): Date | null {
  if (raw == null) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  const s = String(raw).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0)
  return isNaN(d.getTime()) ? null : d
}

/** 时间列主行：12-28 14:03:11；解析失败 → 原文；null → — */
function timeMain(raw: unknown): string {
  if (raw == null || raw === '') return '—'
  const d = parseLocalDateTime(raw)
  if (!d) return String(raw)
  return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
    pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
}

/** 时间列次行：12月28日 周一；解析失败 → —；null → 空（省略该行） */
function timeSub(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const d = parseLocalDateTime(raw)
  if (!d) return '—'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEK_CN[d.getDay()]
}

// ============================================================================
// 数据映射
// ============================================================================

const toBool = (v: any) => v === 1 || v === true
/** 三态布尔：字段缺失返回 null（走 is-unknown 徽标），不猜默认值 */
const toBoolOrNull = (v: any) => (v == null ? null : v === 1 || v === true || v === '1')

function asList(payload: any, key: string): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload[key])) return payload[key]
  if (payload && Array.isArray(payload.records)) return payload.records
  return []
}

function mapInstance(r: any) {
  return {
    id: r.instanceId ?? r.id,
    name: r.instanceName ?? r.name,
    port: r.port,
    enableGpt: toBool(r.openaiEnabled ?? r.enableGpt),
    enableCc: toBool(r.ccEnabled ?? r.enableCc),
    enableGemini: toBool(r.geminiEnabled ?? r.enableGemini),
    logUsage: toBool(r.recordUsage ?? r.logUsage),
    // R6：`enabled` 是数据库里的「期望启用」，`running` 是实时探测结果，两者语义不同。
    // 现状写 `enabled: toBool(r.enabled ?? 1)` —— 字段缺失时默认 1，会把「主动停掉的实例」
    // 误判成「未启动」。这里保留 null，由 statusBadgeClass 走 is-unknown。
    running: toBoolOrNull(r.running),
    enabled: toBoolOrNull(r.enabled),
  }
}

function mapLog(r: any) {
  return {
    // R8：现状 mapLog 没映射 logId，而 row-key 默认取 'id' → 全部行 key 为 undefined。
    logId: r.logId ?? r.id ?? null,
    // 带出 instanceId：作用域可能是「全部实例」，此时「正在排查 X 的失败请求」
    // 必须按实例筛，不能把别的实例的失败也算进去。
    instanceId: r.instanceId ?? r.id ?? null,
    callTime: r.createTime ?? r.callTime,
    endpoint: r.endpoint,
    method: r.method,
    protocol: r.protocol,
    model: r.model,
    status: r.status,
    promptTokens: r.promptTokens,
    completionTokens: r.completionTokens,
    totalTokens: r.totalTokens,
    latency: r.latencyMs ?? r.latency,
    clientIp: r.clientIp,
    userId: r.userId,
  }
}

// ============================================================================
// §4.1 访问日志列：9 列 → 6 列常驻，来源IP/方法/userId/logId 下沉到行悬浮详情
// ============================================================================
const logColumns: ReTableColumn[] = [
  { prop: 'callTime', label: '时间', minWidth: 132, fixed: 'left', slot: 'callTime' },
  { prop: 'endpoint', label: '端点', minWidth: 190, slot: 'endpoint' },
  { prop: 'protocol', label: '协议', width: 76, slot: 'protocol' },
  { prop: 'status', label: '状态', width: 116, slot: 'status' },
  { prop: 'totalTokens', label: 'Token', width: 118, align: 'right', slot: 'totalTokens' },
  { prop: 'latency', label: '耗时', width: 84, align: 'right', slot: 'latency' },
]

// ============================================================================
// 状态
// ============================================================================
const instLoading = ref(false)
const instError = ref('')
const instances = ref<any[]>([])
const busy = ref<Record<string, boolean>>({})
const flashId = ref<any>(null)
const showCreateDialog = ref(false)
const creating = ref(false)
const activeId = ref<any>(null)

const logs = ref<any[]>([])
const logsLoading = ref(false)
const logsError = ref('')
const logInstanceId = ref<any>('')
const logKeyword = ref('')

const lastSyncAt = ref(0)
const lastSyncText = computed(() => toClock(lastSyncAt.value))

const newInstance = ref({
  name: '',
  port: 8790,
  enableGpt: true,
  enableCc: true,
  enableGemini: true,
  logUsage: true,
})

// ============================================================================
// 徽标 / 状态映射（形状 + 文字 + 颜色三重编码，颜色永不唯一载体）
// ============================================================================

/** is-down：配置为开机自启（enabled=1）但进程没起来 —— 「配置与现实不一致」 */
function isDown(t: any): boolean {
  return t.running === false && t.enabled === true
}
function statusBadgeClass(t: any): string {
  if (t.running === true) return 'is-ok'
  if (t.running === false && t.enabled === true) return 'is-down'
  if (t.running === false && t.enabled === false) return 'is-stopped'
  return 'is-unknown'
}
function statusBadgeText(t: any): string {
  switch (statusBadgeClass(t)) {
    case 'is-ok': return '运行中'
    case 'is-down': return '未启动'
    case 'is-stopped': return '已停止'
    default: return '状态未知'
  }
}
function protoCount(t: any): number {
  return (t.enableGpt ? 1 : 0) + (t.enableCc ? 1 : 0) + (t.enableGemini ? 1 : 0)
}
function isActive(t: any): boolean {
  return activeId.value != null && String(t.id) === String(activeId.value)
}

/** HTTP 状态：码 + 语义文字两段都在，颜色只是第三重编码 */
function httpClass(s: unknown): string {
  const n = Number(s)
  if (s == null || s === '' || !isFinite(n) || n === 0) return 'is-unknown'
  if (n >= 200 && n < 300) return 'is-ok'
  if (n >= 400 && n < 500) return 'is-warn'
  if (n >= 500) return 'is-err'
  return 'is-unknown'
}
function httpText(s: unknown): string {
  const n = Number(s)
  if (s == null || s === '' || !isFinite(n) || n === 0) return ''
  if (n >= 200 && n < 300) return '成功'
  if (n >= 400 && n < 500) return '客户端错误'
  if (n >= 500) return '上游错误'
  return ''
}

function rowTotalTokens(row: any): string {
  const t = Number(row.totalTokens)
  if (isFinite(t) && t > 0) return String(Math.round(t))
  const p = Number(row.promptTokens) || 0
  const c = Number(row.completionTokens) || 0
  const sum = p + c
  return sum > 0 ? String(sum) : '—'
}

/** 悬浮详情：4 字段任一缺失 → 整个 popover 不出现（宁可不显示，不显示半截） */
function hasDetail(row: any): boolean {
  return !!(row.endpoint && row.method && row.clientIp && row.userId != null && row.logId != null)
}

// ============================================================================
// 状态带聚合
// ============================================================================
const runningCount = computed(() => instances.value.filter((i) => i.running === true).length)
const downCount = computed(() => instances.value.filter(isDown).length)
const filteredLogs = computed(() => {
  const kw = logKeyword.value.trim().toLowerCase()
  if (!kw) return logs.value
  return logs.value.filter((r) =>
    ((r.endpoint || '') + ' ' + (r.model || '')).toLowerCase().includes(kw))
})
const errorCount = computed(() => logs.value.filter((r) => {
  const n = Number(r.status)
  return isFinite(n) && n >= 400
}).length)
/** 失败计数的口径必须写清：只看当前作用域这 50 条，不是全量历史 */
const errorCountScopeLabel = computed(() =>
  logInstanceId.value ? '该实例失败请求' : '全部实例失败请求')
const totalTokens = computed(() => logs.value.reduce((sum, r) => {
  const t = Number(r.totalTokens)
  if (isFinite(t) && t > 0) return sum + t
  return sum + (Number(r.promptTokens) || 0) + (Number(r.completionTokens) || 0)
}, 0))
const avgLatency = computed(() => {
  const arr = logs.value.map((r) => Number(r.latency)).filter((n) => isFinite(n) && n > 0)
  if (!arr.length) return '—'
  return formatLatency(arr.reduce((a, b) => a + b, 0) / arr.length)
})
const activeInstance = computed(() =>
  instances.value.find((i) => String(i.id) === String(activeId.value)) || null)
const failedForActive = computed(() => {
  if (activeId.value == null) return 0
  return logs.value.filter((r) => {
    // 作用域是单个实例时 logs 已天然只含它；「全部实例」时才需要按 instanceId 收窄
    if (String(r.instanceId) !== String(activeId.value)) return false
    const n = Number(r.status)
    return isFinite(n) && n >= 400
  }).length
})

const emptyAccessText = computed(() => {
  if (logsError.value) return '访问日志加载失败'
  if (!instances.value.length) return '尚未创建服务实例'
  if (!logs.value.length && activeInstance.value && !activeInstance.value.logUsage) {
    return '该实例未开启用量记录'
  }
  return '该实例还没有访问记录'
})
const emptyAccessHint = computed(() => {
  if (!instances.value.length) return '创建后即可对外提供 OpenAI / Claude / Gemini 兼容接口'
  if (!logs.value.length && activeInstance.value && !activeInstance.value.logUsage) {
    return '在实例卡片上开启「用量」后才会记录'
  }
  return '请求打进来后会出现在这里'
})

// ============================================================================
// 运行日志（控制台）
// ============================================================================
const runtimeSource = ref<'out' | 'err'>('out')
const runtimeLines = ref(200)
const runtimeAutoRefresh = ref(false)
const pollMs = ref(3000)
const runtimeLoading = ref(false)
/** 用户主动行为（切 source/行数、点刷新）才置灰 + 扫描条；静默轮询两者都不做 */
const runtimeActive = ref(false)
const runtimeLogLines = ref<Array<{ raw: string; level: string | null }>>([])
const runtimePath = ref('')
/** 后端 TailResult 明确区分「文件不存在」(exists=false) 与「文件存在但没内容」 */
const runtimeExists = ref<boolean | null>(null)
const runtimeTruncated = ref(false)
const runtimeLoaded = ref(false)
/** R4：HTTP 200 + {ok:false, error}（非管理员）。空串 = 正常 */
const runtimeDenied = ref('')

const LEVELS = [
  { v: 'all', t: '全部' },
  { v: 'info', t: 'INFO+' },
  { v: 'warn', t: 'WARN+' },
  { v: 'error', t: 'ERROR+' },
]
const levelFilter = ref('all')
const runtimeKeyword = ref('')
const runtimeKeywordDebounced = ref('')
let kwTimer: ReturnType<typeof setTimeout> | null = null

function levelClass(level: unknown): string {
  const l = level == null ? '' : String(level).toUpperCase()
  if (l === 'ERROR' || l === 'FATAL') return 'is-error'
  if (l === 'WARN') return 'is-warn'
  if (l === 'DEBUG' || l === 'TRACE') return 'is-debug'
  return 'is-muted'
}
function levelText(level: unknown): string {
  const c = levelClass(level)
  if (c === 'is-error') return 'ERR'
  if (c === 'is-warn') return 'WRN'
  if (c === 'is-debug') return 'DBG'
  return '·'
}
function levelPass(level: unknown, filter: string): boolean {
  if (filter === 'all') return true
  const l = level == null ? '' : String(level).toUpperCase()
  const isErr = l === 'ERROR' || l === 'FATAL'
  const isWarn = l === 'WARN'
  if (filter === 'error') return isErr
  if (filter === 'warn') return isWarn || isErr
  return true
}
const filteredRuntimeLines = computed(() => {
  const kw = runtimeKeywordDebounced.value.trim().toLowerCase()
  return runtimeLogLines.value.filter((l) => {
    if (!levelPass(l.level, levelFilter.value)) return false
    if (kw && !String(l.raw ?? '').toLowerCase().includes(kw)) return false
    return true
  })
})
function clearRuntimeFilter() {
  levelFilter.value = 'all'
  runtimeKeyword.value = ''
  runtimeKeywordDebounced.value = ''
}
watch(runtimeKeyword, (v) => {
  if (kwTimer) clearTimeout(kwTimer)
  kwTimer = setTimeout(() => { runtimeKeywordDebounced.value = v }, 120)
})

const consoleRef = ref<HTMLElement | null>(null)
const focusBtnRef = ref<HTMLElement | null>(null)
const focusConsole = ref(false)
const pinned = ref(true)
const pendingLines = ref(0)
/** 贴底判定阈值 24px：低于它才算「用户还在底部看」 */
const PIN_THRESHOLD = 24

function onConsoleScroll() {
  const el = consoleRef.value
  if (!el) return
  pinned.value = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD
  if (pinned.value) pendingLines.value = 0
}
function jumpToBottom() {
  const el = consoleRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  pinned.value = true
  pendingLines.value = 0
}

/**
 * 拉一次运行日志。
 * @param force 用户主动行为（切 source / 切行数 / 点刷新）→ 强制贴底。
 *   轮询路径不传 force：用户上滚查历史时，绝不把他硬拽回底部。
 */
async function loadRuntimeLogs(opts?: { force?: boolean }) {
  const force = opts?.force === true
  const prevCount = runtimeLogLines.value.length
  // 只有「用户主动行为」才亮扫描条 + 置灰；静默轮询必须不遮罩、不置灰（规格 §3.3）
  if (force) runtimeActive.value = true
  runtimeLoading.value = true
  try {
    const res = await http.get('/service/runtime-logs', {
      params: { source: runtimeSource.value, lines: runtimeLines.value },
    })
    const d = res.data || {}
    // R4：非管理员返 HTTP 200 + {ok:false, error}。不读 ok 就会渲染成「暂无日志」。
    if (d.ok === false) {
      runtimeDenied.value = d.error || '无权限：仅管理员可查看运行日志'
      runtimeLogLines.value = []
      runtimePath.value = ''
      runtimeExists.value = null
      runtimeTruncated.value = false
      runtimeLoaded.value = true
      lastSyncAt.value = Date.now()
      return
    }
    runtimeDenied.value = ''
    runtimeLogLines.value = Array.isArray(d.lines) ? d.lines : []
    runtimePath.value = d.path || ''
    runtimeExists.value = d.exists === undefined ? true : !!d.exists
    runtimeTruncated.value = d.truncated === true
    runtimeLoaded.value = true
    lastSyncAt.value = Date.now()
    await nextTick()
    const el = consoleRef.value
    if (!el) return
    const grew = runtimeLogLines.value.length - prevCount
    if (force || pinned.value) {
      el.scrollTop = el.scrollHeight
      pendingLines.value = 0
    } else if (grew > 0) {
      pendingLines.value += grew
    }
  } catch (e: any) {
    message.error('加载运行日志失败: ' + (e?.message || e))
  } finally {
    runtimeLoading.value = false
    runtimeActive.value = false
  }
}

/** 用户主动刷新 → 强制贴底 */
function refreshRuntimeNow() {
  loadRuntimeLogs({ force: true })
}

function applyAutoRefresh() {
  if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null }
  if (!runtimeAutoRefresh.value) return
  runtimeTimer = setInterval(() => {
    // 挂在后台标签页里 3s 一次 tail IO 是纯浪费
    if (typeof document !== 'undefined' && document.hidden) return
    loadRuntimeLogs()
  }, Math.max(1000, pollMs.value))
}

function onVisibilityChange() {
  if (document.hidden) return
  // 恢复可见时补拉一次，别让用户对着停更的日志排查
  if (runtimeAutoRefresh.value) loadRuntimeLogs()
}

function toggleFocus() {
  focusConsole.value = !focusConsole.value
  nextTick(() => {
    if (focusConsole.value) consoleRef.value?.focus()
    else focusBtnRef.value?.focus()
  })
}

function onGlobalKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && focusConsole.value) {
    e.preventDefault()
    toggleFocus()
    return
  }
  const t = e.target as HTMLElement | null
  const tag = (t?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || t?.isContentEditable) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault()
    toggleFocus()
  }
}

// ============================================================================
// 数据加载
// ============================================================================

async function loadInstances() {
  instLoading.value = true
  instError.value = ''
  try {
    const res = await http.get('/service/instances')
    const list = asList(res.data, 'instances').map(mapInstance)
    instances.value = list
    // 选中的实例被删掉 → 作用域回落到第一个（或清空）
    if (list.length && !list.some((i) => String(i.id) === String(activeId.value))) {
      activeId.value = list[0].id
      logInstanceId.value = list[0].id
      loadLogs()
    } else if (!list.length) {
      activeId.value = null
      logInstanceId.value = ''
      logs.value = []
    }
  } catch (e: any) {
    // 旧数据不清空：实例瓦片继续可读，只在区块内加错误条
    instError.value = e?.message || String(e)
  } finally {
    instLoading.value = false
  }
}

async function loadLogs() {
  if (!logInstanceId.value) { logs.value = []; logsError.value = ''; return }
  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await http.get('/service/logs', {
      params: { instanceId: logInstanceId.value, limit: 50 },
    })
    logs.value = asList(res.data, 'logs').map(mapLog)
    lastSyncAt.value = Date.now()
  } catch (e: any) {
    logsError.value = e?.message || String(e)
  } finally {
    logsLoading.value = false
  }
}

function loadAll() {
  loadInstances()
  loadLogs()
  loadRuntimeLogs({ force: true })
}

function onScopeChange() {
  // 手动改作用域不改瓦片选中态：瓦片选中还兼任「正在排查」提示条的来源
  loadLogs()
}

function selectInstance(id: any) {
  activeId.value = id
  logInstanceId.value = id
  loadLogs()
}

// ============================================================================
// 实例操作（R5：必须检查 ok === false，否则会显示「已启动」但其实没启动）
// ============================================================================

let calibrateTimer: ReturnType<typeof setTimeout> | null = null

async function toggleInstance(t: any) {
  const key = String(t.id)
  if (busy.value[key]) return
  const wasRunning = t.running === true
  const nextRunning = !wasRunning

  // 乐观更新：先让瓦片竖条与徽标即时变色
  busy.value[key] = true
  t.running = nextRunning
  if (nextRunning) t.enabled = true

  try {
    const res = await http.post(`/service/instances/${t.id}/${wasRunning ? 'stop' : 'start'}`)
    const d = res.data || {}
    if (d.ok === false) {
      t.running = wasRunning      // 回滚乐观更新
      message.error(d.error || '操作失败')
      return
    }
    message.success(`${nextRunning ? '已启动' : '已停止'} :${t.port}`)
    // 6s 后静默校准（不弹任何提示）
    if (calibrateTimer) clearTimeout(calibrateTimer)
    calibrateTimer = setTimeout(() => { calibrateTimer = null; loadInstances() }, 6000)
  } catch (e: any) {
    t.running = wasRunning          // 回滚乐观更新
    message.error('操作失败: ' + (e?.message || e))
  } finally {
    busy.value[key] = false
  }
}

async function deleteInstance(t: any) {
  try {
    await ElMessageBox.confirm('确定删除该实例？关联的令牌与访问日志会一并清理。', '提示', { type: 'warning' })
    const res = await http.delete(`/service/instances/${t.id}`)
    const d = res.data || {}
    if (d.ok === false) {
      message.warning(d.error || '请先停止该服务实例，再删除')
      return
    }
    message.success('已删除')
    if (String(t.id) === String(activeId.value)) {
      activeId.value = null
      logInstanceId.value = ''
      logs.value = []
    }
    loadInstances()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') message.error('删除失败: ' + (e?.message || e))
  }
}

async function createInstance() {
  const name = newInstance.value.name.trim()
  if (!name) {
    message.warning('请填写实例名称')
    return
  }
  creating.value = true
  try {
    await http.post('/service/instances', {
      name,
      port: newInstance.value.port,
      openai: newInstance.value.enableGpt,
      cc: newInstance.value.enableCc,
      gemini: newInstance.value.enableGemini,
      recordUsage: newInstance.value.logUsage,
    })
    message.success('创建成功')
    showCreateDialog.value = false
    newInstance.value = { name: '', port: 8790, enableGpt: true, enableCc: true, enableGemini: true, logUsage: true }
    await loadInstances()
    // 新瓦片高亮 600ms + 自动成为 activeId + 自动拉一次访问日志
    const created = instances.value.find((i) => i.name === name)
    if (created) {
      flashId.value = created.id
      selectInstance(created.id)
      setTimeout(() => { flashId.value = null }, 600)
    }
  } catch (e: any) {
    message.error('创建失败: ' + (e?.message || e))
  } finally {
    creating.value = false
  }
}

function goTokens(t: any) {
  router.push({
    name: 'SystemSettings',
    params: { tab: 'service-tokens' },
    query: { instanceId: t.id },
  })
}

// ============================================================================
// 生命周期
// ============================================================================

let runtimeTimer: ReturnType<typeof setInterval> | null = null

watch(runtimeAutoRefresh, applyAutoRefresh)
watch(pollMs, applyAutoRefresh)
watch(runtimeSource, () => loadRuntimeLogs({ force: true }))
watch(runtimeLines, () => loadRuntimeLogs({ force: true }))

onMounted(() => {
  loadInstances()
  loadRuntimeLogs({ force: true })
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('keydown', onGlobalKey)
  }
})

onUnmounted(() => {
  if (runtimeTimer) clearInterval(runtimeTimer)
  if (calibrateTimer) clearTimeout(calibrateTimer)
  if (kwTimer) clearTimeout(kwTimer)
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    document.removeEventListener('keydown', onGlobalKey)
  }
})
</script>

<style scoped>
/* 全部视觉样式在 pages/ai/src/styles/svc-refactor.css（全局、作用域 .svc）。
   本页刻意不留 scoped 规则 —— 旧 .sm-* / .panel-card / .runtime-* 一整套已随
   DOM 重排删除，避免两套设计层并存。
   仅保留两条 scoped 兜底：内联错误条的外边距，与骨架行的栅格。 */
.svc-alert { margin: 0 0 10px; }
.svc-tablewrap .svc-alert { margin: 10px 16px; }
.svc-skelrows {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px 16px;
}
.svc-skelrow {
  height: 38px; display: grid;
  grid-template-columns: 108px minmax(0, 1fr) 52px 92px 78px;
  gap: 12px; align-items: center;
}
.svc-skelcell { height: 12px; display: block; }
/* 新建实例后新瓦片的 600ms 高亮闪一下，让用户看到插到哪儿了 */
.svc-tile.is-flash { animation: svc-flash 600ms var(--svc-ease); }
@keyframes svc-flash {
  from { background: var(--svc-accent-soft); border-color: var(--svc-accent); }
  to { background: var(--svc-surface); border-color: var(--svc-rule); }
}
@media (prefers-reduced-motion: reduce) {
  .svc-tile.is-flash { animation: none; }
}
</style>