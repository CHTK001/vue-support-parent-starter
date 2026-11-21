<template>
  <ReDialog :close-on-click-modal="true" :model-value="visible" title="选择模型" width="600px"
    @update:model-value="$emit('update:visible', $event)">
    <div class="dms-mp-body">
      <el-input v-model="search" placeholder="搜索模型..." clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="dms-mp-list">
        <div v-for="provider in filteredProviders" :key="provider.id">
          <div class="dms-mp-provider">{{ provider.name }}</div>
          <div v-for="model in provider.models" :key="model.id" class="dms-mp-row"
            tabindex="0" @click="pick(model.id)" @keydown.enter="pick(model.id)">
            <div class="dms-mp-row-left">
              <!-- 图标回退链与模型管理卡片一致：模型 logo → 上游通道 → 供应商 logo。
                   此前只按模型名取图，免费渠道里绝大多数行取不到，整列都是空白。 -->
              <ModelRowLogo :model="model" :provider="providerOf(model)" :size="28" />
              <div class="dms-mp-main">
                <div class="dms-mp-line">
                  <span class="dms-mp-name">{{ model.model }}</span>
                  <span class="dms-mp-tags">
                    <ReTag v-for="tag in model.displayTags" :key="tag.value" :type="tag.tagType">
                      {{ tag.label }}
                    </ReTag>
                  </span>
                </div>
                <!-- 副信息：输入 → 输出模态图标条（中间必须有箭头，与模型管理卡片同一口径）+ 延迟 -->
                <div v-if="ioKindsOf(model).input.length || ioKindsOf(model).output.length || latencyTextOf(model)"
                  class="dms-mp-meta">
                  <span v-if="ioKindsOf(model).input.length || ioKindsOf(model).output.length" class="dms-mp-io"
                    :title="ioTitleOf(model)">
                    <el-icon v-for="(k, i) in ioKindsOf(model).input" :key="'mp-in-' + i" class="io-i"
                      :class="'kind-' + k" :size="12">
                      <component :is="MODALITY_ICON[k] || DocumentText24Regular" />
                    </el-icon>
                    <el-icon class="io-arrow" :size="10">
                      <ArrowRight24Regular />
                    </el-icon>
                    <el-icon v-for="(k, i) in ioKindsOf(model).output" :key="'mp-out-' + i" class="io-i"
                      :class="'kind-' + k" :size="12">
                      <component :is="MODALITY_ICON[k] || DocumentText24Regular" />
                    </el-icon>
                  </span>
                  <span v-if="latencyTextOf(model)" class="dms-mp-latency">{{ latencyTextOf(model) }}</span>
                </div>
              </div>
            </div>
            <el-icon v-if="selectedId === model.id" class="dms-mp-check" :size="18">
              <CheckCircleFilled />
            </el-icon>
          </div>
        </div>

        <div v-if="filteredProviders.length === 0" class="dms-mp-empty">
          <div class="dms-mp-empty-main">{{ emptyText || '没有匹配的模型' }}</div>
          <div class="dms-mp-empty-sub">请先在「模型管理」中添加对应类型的模型</div>
        </div>
      </div>
    </div>
    <template #footer>
      <ReButton type="default" @click="$emit('clear')">清空（使用默认）</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 模型选择对话框：搜索 + 按供应商分组 + 类型/子类型标签 + 清空。
 * 纯展示 + 本地搜索状态；命中结果与 logo 由父级注入。
 */
import { ref, computed, watch } from 'vue'
import { Search } from "@element-plus/icons-vue"
import { CheckCircleFilled } from "@vicons/material"
import {
  TextT24Regular, Image24Regular, Speaker224Regular, Video24Regular,
  Folder24Regular, DocumentText24Regular, ArrowRight24Regular,
} from "@vicons/fluent"
import ReDialog from '@repo/ui/re-dialog'
import ReButton from '@/components/ui/ReButton.vue'
import ReTag from '@/components/ui/ReTag.vue'
import ModelRowLogo from '@/components/models/ModelRowLogo.vue'

const props = defineProps<{
  visible: boolean
  /** 最终可选的供应商列表（已按类型/子类型过滤、含 models） */
  providers: any[]
  /** 当前临时选中的模型 id */
  selectedId?: string | null
  emptyText?: string
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  select: [modelId: string]
  clear: []
}>()

const search = ref('')

/**
 * 每次打开都从空搜索开始。
 *
 * <p>选择器实例在多次打开之间是复用的，`search` 不会随关闭自动清空：
 * 上一项搜过「clip」后关掉，再打开另一项时列表是上一项的关键词过滤后的结果 ——
 * 有候选的字段会显示成空态，看起来像「这个类型的模型一个都没有」。</p>
 */
watch(
  () => props.visible,
  (v) => {
    if (v) search.value = ''
  },
)

const filteredProviders = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.providers
  return props.providers
    .map((p) => ({ ...p, models: (p.models || []).filter((m: any) =>
      String(m.model || '').toLowerCase().includes(q) || String(m.modelName || '').toLowerCase().includes(q)) }))
    .filter((p) => p.models.length > 0)
})

/** 行所属供应商（回退图标用；按 providerId 在分组里找，找不到就用行的 providerName 兜底） */
const providerOf = (model: any) =>
  props.providers.find((p) => p.id === model?.providerId) || null

// 输入 / 输出模态 → 图标（与模型管理拉取弹框 ModelFetchDialog 同一映射）
const MODALITY_ICON: Record<string, any> = {
  text: TextT24Regular,
  image: Image24Regular,
  audio: Speaker224Regular,
  video: Video24Regular,
  file: DocumentText24Regular,
  vector: Folder24Regular,
}

// 模态中文标签（与模型管理卡片 ModelInfoCard 的 KIND_LABELS 一致），tooltip 用
const KIND_LABELS: Record<string, string> = {
  text: '文本',
  image: '图片',
  audio: '音频',
  video: '视频',
  vector: '向量',
  file: '文档',
}

/**
 * 行内副信息：输入 → 输出模态图标条 + 延迟。
 *
 * <p>此前是「入 X · 出 Y」纯文字；现改为与模型管理卡片 / 会话页选择面板同一口径的
 * 「输入图标 → 箭头 → 输出图标」，中文含义收进 tooltip。只画模型真实声明
 * （inputKinds / outputKinds）的模态，没有时不渲染，不做假能力；延迟取最近一次
 * 实测（Host 侧 loadModels 已把 metrics.probe_latency_ms 等归一到 latencyMs），
 * 未采集时不显示。</p>
 */
const ioKindsOf = (model: any): { input: string[]; output: string[] } => {
  const norm = (list: any) =>
    (Array.isArray(list) ? list : []).map((v: any) => String(v).toLowerCase()).filter(Boolean)
  return { input: norm(model?.inputKinds), output: norm(model?.outputKinds) }
}

/** 图标条整行 tooltip：形如「输入：文本 + 图片 → 输出：文本」 */
const ioTitleOf = (model: any): string => {
  const io = ioKindsOf(model)
  const label = (list: string[]) =>
    list.length ? list.map((v) => KIND_LABELS[v] || v).join(' + ') : '—'
  return `输入：${label(io.input)} → 输出：${label(io.output)}`
}

/** 延迟文案：取最近一次实测，未采集时不显示 */
const latencyTextOf = (model: any): string => {
  const latency = Number(model?.latencyMs)
  return Number.isFinite(latency) && latency > 0 ? `延迟 ${Math.round(latency)}ms` : ''
}

function pick(id: string) {
  if (!id) return
  search.value = ''
  emit('select', id)
}
</script>

<style scoped>
.dms-mp-body { display: flex; flex-direction: column; gap: 14px; }
.dms-mp-list { max-height: 384px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.dms-mp-provider { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.dms-mp-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 12px; border-radius: var(--el-radius-lg, 12px); cursor: pointer;
  outline: none; transition: background 0.16s ease;
}
.dms-mp-row:hover { background: var(--el-fill-color-light); }
.dms-mp-row:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.dms-mp-row-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
/* 副信息（输入/输出/延迟）与模型名、标签纵向排列，不挤压弹框行宽 */
.dms-mp-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.dms-mp-line { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.dms-mp-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; }
/* 输入 → 输出模态图标条：与模型管理拉取弹框 / 会话页选择面板同一口径（中间必须有箭头） */
.dms-mp-io { display: inline-flex; align-items: center; gap: 3px; line-height: 18px; color: var(--el-text-color-regular); flex-shrink: 0; }
.dms-mp-io .io-arrow { color: var(--el-text-color-placeholder); margin: 0 1px; }
.dms-mp-io .io-i.kind-text { color: var(--el-color-primary); }
.dms-mp-io .io-i.kind-image { color: var(--el-color-warning); }
.dms-mp-io .io-i.kind-audio { color: var(--el-color-info); }
.dms-mp-io .io-i.kind-video { color: var(--el-color-danger); }
.dms-mp-io .io-i.kind-file { color: var(--el-color-info); }
.dms-mp-io .io-i.kind-vector { color: var(--el-color-success); }
.dms-mp-latency { overflow: hidden; text-overflow: ellipsis; }
.dms-mp-name { font-size: 13px; color: var(--el-text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dms-mp-tags { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.dms-mp-check { color: var(--el-color-primary); flex-shrink: 0; }
.dms-mp-empty { padding: 40px 0; text-align: center; }
.dms-mp-empty-main { font-size: 13px; color: var(--el-text-color-regular); }
.dms-mp-empty-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

@media (prefers-reduced-motion: reduce) {
  .dms-mp-row { transition: none; }
}
</style>
