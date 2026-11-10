<template>
  <CustomPopover :show="!!model" :position="position || undefined" :width="width" :max-height="maxHeight"
    popper-class="model-info-popover" @update:show="onShowChange" @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')">
    <div v-if="model" class="mic">
      <!-- 模型名 + 供应商 -->
      <header class="mic-head">
        <div class="mic-name" :title="displayTitle">{{ displayName }}</div>
        <div v-if="providerName" class="mic-provider" :title="providerName">{{ providerName }}</div>
      </header>

      <!-- 能力：附加特性图标（工具调用 / 深度思考 / 在线检索） -->
      <section v-if="features.length" class="mic-sec">
        <div class="mic-sec-title">能力</div>
        <div class="mic-feats">
          <el-icon v-for="(f, i) in features" :key="i" class="mic-feat" :size="14" :title="featureLabel(f)">
            <component :is="FEATURE_ICONS[f] || FEATURE_ICONS.default" />
          </el-icon>
        </div>
      </section>

      <!-- 模态：输入 / 输出 各自的种类图标 -->
      <section class="mic-sec">
        <div class="mic-sec-title">模态</div>
        <div class="mic-row">
          <span class="mic-k">输入</span>
          <span class="mic-v">
            <el-icon v-for="(k, i) in inputKinds" :key="'in-' + i" class="mic-kind" :class="'kind-' + k" :size="14"
              :title="kindLabel(k)">
              <component :is="KIND_ICONS[k] || KIND_ICONS.text" />
            </el-icon>
          </span>
        </div>
        <div class="mic-row">
          <span class="mic-k">输出</span>
          <span class="mic-v">
            <el-icon v-for="(k, i) in outputKinds" :key="'out-' + i" class="mic-kind" :class="'kind-' + k" :size="14"
              :title="kindLabel(k)">
              <component :is="KIND_ICONS[k] || KIND_ICONS.text" />
            </el-icon>
          </span>
        </div>
      </section>

      <!-- 成本：官方估价（USD / 百万 token） -->
      <section class="mic-sec">
        <div class="mic-sec-title">成本 ($/100万 TOKENS)</div>
        <div v-for="row in costRows" :key="row.label" class="mic-row" :title="row.title">
          <span class="mic-k">{{ row.label }}</span>
          <span class="mic-v">{{ row.value }}</span>
        </div>
      </section>

      <!-- 限制：上下文窗口 / 单次输出上限 -->
      <section class="mic-sec">
        <div class="mic-sec-title">限制</div>
        <div v-for="row in limitRows" :key="row.label" class="mic-row" :title="row.title">
          <span class="mic-k">{{ row.label }}</span>
          <span class="mic-v">{{ row.value }}</span>
        </div>
      </section>

      <!-- 元数据：知识截止 / 发布时间 -->
      <section class="mic-sec">
        <div class="mic-sec-title">元数据</div>
        <div v-for="row in metaRows" :key="row.label" class="mic-row" :title="row.title">
          <span class="mic-k">{{ row.label }}</span>
          <span class="mic-v">{{ row.value }}</span>
        </div>
      </section>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import {
  TextT24Regular, Image24Regular, Speaker224Regular, Video24Regular, Group24Regular, DocumentText24Regular,
  WrenchScrewdriver24Regular, LightbulbFilament24Regular, Globe24Regular, Sparkle24Regular,
} from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import { getModelDisplayName } from '@/utils/modelUtils'
import { deriveModelTraits } from '../../models/model.utils'

/** 缺失值的占位符 */
const DASH = '—'

/** 悬停卡消费的数据源：后端 /api/providers 的模型行（含 capabilities / metrics） */
interface ModelInfoSource {
  id?: string
  model?: string
  modelName?: string
  /** 用户配置的模型别名：有则优先展示 */
  alias?: string
  modelType?: string
  providerId?: string
  provider_id?: string
  capabilities?: unknown
  context_window?: number | null
  max_tokens?: number | null
  config?: Record<string, any>
  metrics?: Record<string, any>
}

const props = withDefaults(defineProps<{
  /** 为 null 时整卡隐藏（未悬停任何条目） */
  model: ModelInfoSource | null
  /** 视口坐标（fixed），由调用方按条目位置算出 */
  position?: { left: number; top: number } | null
  /** 供应商展示名，由调用方按 provider_id 关联得到 */
  providerName?: string
  /** 卡片宽度：调用方负责定位，宽度需与它的边界计算一致 */
  width?: number | string
  /** 卡片最大高度：超出由 CustomPopover 内部滚动 */
  maxHeight?: number | string
}>(), {
  position: null,
  providerName: '',
  width: 252,
  maxHeight: 420,
})

const emit = defineEmits<{
  mouseenter: []
  mouseleave: []
  close: []
}>()

/** 模态种类 → 图标（与模型管理卡片 KIND_ICONS 同一套） */
const KIND_ICONS: Record<string, any> = {
  text: TextT24Regular,
  image: Image24Regular,
  audio: Speaker224Regular,
  video: Video24Regular,
  vector: Group24Regular,
  file: DocumentText24Regular,
}

const KIND_LABELS: Record<string, string> = {
  text: '文本',
  image: '图片',
  audio: '音频',
  video: '视频',
  vector: '向量',
  file: '文档',
}

/** 附加特性 → 图标 */
const FEATURE_ICONS: Record<string, any> = {
  tools: WrenchScrewdriver24Regular,
  thinking: LightbulbFilament24Regular,
  'web-search': Globe24Regular,
  default: Sparkle24Regular,
}

const FEATURE_LABELS: Record<string, string> = {
  tools: '工具调用',
  thinking: '深度思考',
  'web-search': '在线检索',
}

const kindLabel = (k: string): string => KIND_LABELS[k] || k
const featureLabel = (f: string): string => FEATURE_LABELS[f] || f

const modelIdLabel = computed(() =>
  getModelDisplayName(props.model?.modelName || props.model?.model || props.model?.id || ''),
)

/** 有别名优先显示别名；悬停标题仍给出真实模型 ID */
const displayName = computed(() => props.model?.alias || modelIdLabel.value)
const displayTitle = computed(() =>
  props.model?.alias && props.model.alias !== modelIdLabel.value
    ? `${props.model.alias} · ${modelIdLabel.value}`
    : modelIdLabel.value,
)

const metrics = computed<Record<string, any>>(() => props.model?.metrics || {})

const traits = computed(() => deriveModelTraits(props.model || {}))
const inputKinds = computed(() => traits.value.inputCapabilities)
const outputKinds = computed(() => traits.value.outputCapabilities)
const features = computed(() => traits.value.features)

/** 宽松数值解析：空值 / 非数字返回 null（区分「未采集」与 0） */
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') {
    return null
  }
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** 单价（USD / 百万 token）：0.15 → US$0.15；未采集 → — */
function price(v: unknown): string {
  const n = numOrNull(v)
  return n === null ? DASH : `US$${n.toFixed(2)}`
}

/** token 量级：1049000 → 104.9万；524000 → 52.4万；不足 1 万按千分位 */
function tokens(v: unknown): string {
  const n = numOrNull(v)
  if (n === null) {
    return DASH
  }
  if (n >= 1e8) {
    return `${String(Number((n / 1e8).toFixed(1)))}亿`
  }
  if (n >= 1e4) {
    return `${String(Number((n / 1e4).toFixed(1)))}万`
  }
  return n.toLocaleString('zh-CN')
}

/** 中文日期：2026-09-23 → 2026年9月23日 */
function cnDate(v: unknown): string {
  if (!v) {
    return DASH
  }
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? DASH : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 卡片里的一行：左标签 / 右值 / 悬停说明 */
interface InfoRow {
  label: string
  value: string
  title: string
}

/** 单价行：指标表 sys_ai_model_metrics 的官方估价，单位 USD / 百万 token */
const costRows = computed<InfoRow[]>(() => {
  const mt = metrics.value
  const row = (label: string, key: string): InfoRow => ({
    label,
    value: price(mt[key]),
    title: `${label}单价（USD / 100 万 token）：${price(mt[key])}`,
  })
  return [
    row('Input', 'price_input_per_musd'),
    row('Output', 'price_output_per_musd'),
    row('Cache read', 'price_cache_hit_per_musd'),
    row('Cache write', 'price_cache_write_per_musd'),
  ]
})

/** 限制行：上下文窗口手填优先、缺失回退指标表；输出上限手填优先、缺失同样回退指标表 */
const limitRows = computed<InfoRow[]>(() => {
  const cfg = props.model?.config || {}
  const manualCtx = numOrNull(cfg.contextWindow ?? props.model?.context_window)
  const ctx = manualCtx ?? numOrNull(metrics.value.context_window_tokens)
  const manualOut = numOrNull(cfg.maxOutputTokens ?? props.model?.max_tokens)
  const out = manualOut ?? numOrNull(metrics.value.max_output_tokens)
  return [
    {
      label: 'Context',
      value: tokens(ctx),
      title: ctx === null
        ? '上下文窗口：指标源未采集'
        : `上下文窗口：${ctx.toLocaleString('zh-CN')} token${manualCtx !== null ? '（手动填写）' : '（指标表）'}`,
    },
    {
      label: 'Output',
      value: tokens(out),
      title: out === null
        ? '单次输出上限：未指定'
        : `单次输出上限：${out.toLocaleString('zh-CN')} token${manualOut !== null ? '（手动填写）' : '（指标表）'}`,
    },
  ]
})

/** 元数据行：知识截止 / 发布时间（指标源尚未采集时显示 —） */
const metaRows = computed<InfoRow[]>(() => {
  const mt = metrics.value
  const cutoff = mt.knowledge_cutoff ? String(mt.knowledge_cutoff) : DASH
  return [
    { label: '知识', value: cutoff, title: `知识截止时间：${cutoff}` },
    { label: '发布时间', value: cnDate(mt.release_date), title: `模型发布时间：${cnDate(mt.release_date)}` },
  ]
})

/** CustomPopover 内部点击外部 / Esc 时广播关闭 */
function onShowChange(next: boolean) {
  if (!next) {
    emit('close')
  }
}
</script>

<style scoped>
.mic {
  display: flex;
  flex-direction: column;
  padding: 10px 12px 12px;
  font-size: 12px;
  line-height: 1.5;
}

/* 模型名 + 供应商（按参考图不画分隔线，用留白分段） */
.mic-head {
  margin-bottom: 2px;
}
.mic-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mic-provider {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 区块 */
.mic-sec {
  padding-top: 9px;
}
.mic-sec-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

/* 标签 / 值 一行 */
.mic-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 20px;
}
.mic-k {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mic-v {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

/* 能力图标 */
.mic-feats {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 18px;
}
.mic-feat {
  color: var(--el-text-color-regular);
}

/* 模态种类图标：与模型管理卡片同一套语义色 */
.mic-kind.kind-text {
  color: var(--el-color-primary);
}
.mic-kind.kind-image {
  color: var(--el-color-warning);
}
.mic-kind.kind-audio {
  color: var(--el-color-info);
}
.mic-kind.kind-video {
  color: var(--el-color-danger);
}
.mic-kind.kind-vector {
  color: var(--el-color-success);
}
.mic-kind.kind-file {
  color: var(--el-color-info);
}
</style>

<style>
/* CustomPopover 外壳：teleport 到 body，本组件 scoped 命中不到，只能放在非 scoped 块里。
   外壳默认带 18px 大圆角 / 毛玻璃 / 内边距，信息卡要的是小圆角实心面；
   选择器多带一层 body 提高特异度，覆盖不依赖样式表先后顺序。 */
body .model-info-popover {
  border-radius: var(--rm-radius, 12px);
  padding: 0;
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-lighter);
  /* 弹层是浮层，必须浮起，投影改用令牌 */
  box-shadow: var(--el-box-shadow);
}
</style>
