<!--
  TShark 安装进度（下载 / 解压 / 自检）

  入口两处：
    ① 服务端启动即自动补齐，页面探测到「未就绪」时自动弹出并接上进度流；
    ② 状态标未就绪时点击，或失败后点「重试」，手动打开。

  为什么要有这个框而不是只在状态标上写一句：安装包含下载（几十到上百 MB），
  只写「未就绪」的话，运维既不知道在不在装、也不知道卡在哪、更不知道失败原因。
  这里把服务端推来的 state / progress / message 原样展示 —— 进度来自 SSE，
  断线时数据层会退回轮询，不会停在一个不动的百分比上。
-->
<template>
  <ReDialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <div class="ti-head">
      <span class="ti-dot" :class="tone" />
      <span class="ti-state">{{ stateText }}</span>
      <span class="spacer" />
      <span v-if="percentText" class="ti-percent">{{ percentText }}</span>
    </div>

    <ReProgress
      :progress="barValue"
      :color="barColor"
      :status="barStatus"
      :height="8"
      class="ti-bar"
    />

    <p class="ti-message">{{ message }}</p>

    <div v-if="metaRows.length" class="ti-meta">
      <div v-for="row in metaRows" :key="row.label" class="ti-meta__row">
        <span class="ti-meta__label">{{ row.label }}</span>
        <span class="ti-meta__value tshark-mono">{{ row.value }}</span>
      </div>
    </div>

    <!-- 缺抓包驱动：能解析但不能实时抓，必须说清楚，否则用户只会看到「启动抓包失败」 -->
    <p v-if="status?.ready && !status?.captureReady" class="ti-warn">
      未检测到抓包驱动（Windows 需 Npcap，Linux 需 libpcap 与抓包权限）。
      导入 pcap 与分析功能不受影响，但<b>实时抓包不可用</b>。
    </p>

    <!-- 失败 / 缺包：给出可执行的处理办法，而不是只说「失败」 -->
    <div v-if="showHint" class="ti-hint">
      <p class="ti-hint__title">处理办法</p>
      <pre class="ti-hint__code">plugin:
  monitor:
    tshark:
      package-path: /path/to/tshark.zip   # 离线：放一个含 tshark 与依赖的 zip
      # 或 package-url: http://内网镜像/tshark.zip</pre>
      <p class="ti-hint__note">配置后点「重试」，不需要重启服务。</p>
    </div>

    <div class="ti-retention">
      <header class="ti-retention__head">
        <h4>数据保留</h4>
        <span class="ti-retention__text">
          会话 + 报文 + pcap + SQLite 报文 + 日志：超过 {{ retentionDays }} 天或目录空间达
          {{ retentionSizeMb }} MB 时自动清理（每 30 分钟一次，不在业务高峰跑），也可以手动清一次。
        </span>
      </header>
      <div class="ti-retention__actions">
        <ReButton type="primary" @click="onCleanup" :loading="cleanupLoading">立即清理</ReButton>
      </div>
    </div>

    <div class="ti-actions">
      <ReButton
        v-if="canRetry"
        type="primary"
        icon="Refresh"
        :loading="status?.state === 'CHECKING'"
        @click="emit('retry')"
      >
        重试
      </ReButton>
      <ReButton @click="emit('update:modelValue', false)">关闭</ReButton>
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReProgress from '@repo/ui/re-progress'
import type { TsharkRuntimeStatus } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 运行时状态；为 null 表示还没取到 */
    status: TsharkRuntimeStatus | null
    /** 保留天数 */
    retentionDays?: number
    /** 保留空间（MB） */
    retentionSizeMb?: number
    /** 立即清理按钮 Loading */
    cleanupLoading?: boolean
  }>(),
  {
    retentionDays: 7,
    retentionSizeMb: 512,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'retry'): void
  (e: 'cleanup'): void
}>()

const onCleanup = () => emit('cleanup')

/** 进度条取值 0~1（ReProgress 约定） */
const barValue = computed(() => Math.max(0, Math.min(100, props.status?.progress ?? 0)) / 100)

const barStatus = computed(() => {
  const state = props.status?.state
  if (state === 'READY') return 'success' as const
  if (state === 'FAILED' || state === 'MISSING') return 'failed' as const
  return 'running' as const
})

const barColor = computed(() => {
  const state = props.status?.state
  if (state === 'READY') return 'success' as const
  if (state === 'FAILED' || state === 'MISSING') return 'danger' as const
  return 'primary' as const
})

/** 状态标配色：绿=可用 / 红=失败 / 灰=未装 / 蓝=进行中 */
const tone = computed(() => {
  const state = props.status?.state
  if (state === 'READY') return 'is-ok'
  if (state === 'FAILED') return 'is-bad'
  if (state === 'MISSING') return 'is-idle'
  return 'is-busy'
})

const stateText = computed(() => {
  const state = props.status?.state
  if (state === 'READY') return 'TShark 已就绪'
  if (state === 'MISSING') return 'TShark 未安装'
  if (state === 'FAILED') return '安装失败'
  if (state === 'DOWNLOADING') return '正在下载'
  if (state === 'EXTRACTING') return '正在解压'
  return '正在探测'
})

/** 下载阶段才显示百分比；解压阶段进度是定值，写数字反而误导 */
const percentText = computed(() =>
  props.status?.state === 'DOWNLOADING' ? `${Math.round(barValue.value * 100)}%` : '')

const message = computed(() => props.status?.message || '正在获取 tshark 状态…')

const title = computed(() => (props.status?.state === 'READY' ? 'TShark 安装完成' : 'TShark 安装进度'))

/** 就绪时给出「用的是哪个、哪个版本」；运维排障时这两项最常被问 */
const metaRows = computed(() => {
  const s = props.status
  if (!s) return []
  const rows: Array<{ label: string; value: string }> = []
  if (s.version) rows.push({ label: '版本', value: s.version.trim() })
  if (s.binPath) rows.push({ label: '可执行文件', value: s.binPath })
  if (s.ready) rows.push({ label: '实时抓包', value: s.captureReady ? '可用' : '不可用（缺抓包驱动）' })
  return rows
})

const canRetry = computed(() => {
  const state = props.status?.state
  return state === 'MISSING' || state === 'FAILED'
})

const showHint = computed(() => props.status?.state === 'MISSING' || props.status?.state === 'FAILED')

function onOpenChange(v: unknown) {
  emit('update:modelValue', !!v)
}
</script>

<style scoped>
.spacer { flex: 1 1 auto; }

.ti-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ti-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.ti-dot.is-ok { background: var(--el-color-success); }
.ti-dot.is-bad { background: var(--el-color-danger); }
.ti-dot.is-idle { background: var(--el-color-info); }
.ti-dot.is-busy {
  background: var(--el-color-primary);
  animation: ti-pulse 1.2s ease-in-out infinite;
}
@keyframes ti-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.ti-state {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ti-percent {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}
.ti-bar { margin-bottom: 12px; }
.ti-message {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-all;
}
.ti-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  margin-bottom: 12px;
}
.ti-meta__row {
  display: flex;
  gap: 10px;
  font-size: 12px;
}
.ti-meta__label {
  flex: 0 0 72px;
  color: var(--el-text-color-secondary);
}
.ti-meta__value {
  flex: 1 1 auto;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.ti-warn {
  margin: 0 0 12px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 6px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}
.ti-hint {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}
.ti-hint__title {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ti-hint__code {
  margin: 0 0 6px;
  padding: 8px 10px;
  overflow-x: auto;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11.5px;
  line-height: 1.6;
  border-radius: 4px;
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-regular);
}
.ti-hint__note {
  margin: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.ti-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
