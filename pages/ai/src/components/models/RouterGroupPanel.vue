<template>
  <section class="rg-panel">
    <!-- 头部：策略摘要 + 配置入口（齿轮）/ 刷新 / 保存 -->
    <div class="rg-head">
      <div class="rg-head-text">
        <div class="rg-head-title">路由策略</div>
        <div class="rg-head-desc">
          会话里选中这个路由组的任意模型时，由组内策略挑选真正调用的成员模型。
        </div>
        <!-- 策略本体收进弹框后，这里只留一行摘要，保证不进弹框也能看清当前口径 -->
        <div class="rg-head-summary">{{ strategySummary }}</div>
      </div>
      <div class="rg-head-actions">
        <el-tooltip content="路由配置" placement="bottom" :show-after="300">
          <el-button class="rg-cfg-btn" circle :disabled="!canWrite" @click="openConfig">
            <el-icon :size="16"><SettingsOutlined /></el-icon>
          </el-button>
        </el-tooltip>
        <el-button :loading="loading" round @click="load">刷新</el-button>
        <el-button type="primary" round :loading="saving" :disabled="!canWrite" @click="save">
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 成员表：页面上只保留「谁在这个组里、按什么顺序、什么 effort」 -->
    <div class="rg-members">
      <div class="rg-members-head">
        <span class="rg-members-title">成员模型</span>
        <span class="rg-members-count">{{ members.length }}</span>
        <span class="rg-members-desc">来自已添加的模型库；顺序即「按顺序」策略的优先顺序。</span>
        <el-button
          v-if="canWrite"
          class="rg-add-btn"
          type="primary"
          plain
          round
          size="small"
          @click="openPicker"
        >
          <el-icon :size="14"><AddOutlined /></el-icon>
          <span>添加成员</span>
        </el-button>
      </div>

      <div v-if="members.length === 0" class="rg-empty">
        还没有成员。点右上角「添加成员」，从模型库里挑几个进来。
      </div>

      <ul v-else class="rg-member-list">
        <li v-for="(m, idx) in members" :key="m.label" class="rg-member">
          <span class="rg-member-order">{{ idx + 1 }}</span>
          <ProviderLogo :pid="brandFor(m)" :name="m.provider_name" size="sm" />
          <div class="rg-member-info">
            <div class="rg-member-name">
              {{ m.alias || m.model }}
              <span v-if="m.model !== (m.alias || m.model)" class="rg-member-raw">{{ m.model }}</span>
              <span v-if="!m.exists" class="rg-badge rg-badge-warn">已删除</span>
              <span v-if="isFreeMember(m)" class="rg-badge rg-badge-free">免费</span>
            </div>
            <div class="rg-member-meta">
              <span>{{ m.provider_name }}</span>
              <span v-for="f in candidateFacts(m)" :key="f">· {{ f }}</span>
            </div>
            <div v-if="describeMember(m)" class="rg-member-desc">{{ describeMember(m) }}</div>
          </div>
          <div class="rg-member-effort">
            <span class="rg-effort-label">effort</span>
            <el-select
              :model-value="m.effort || ''"
              size="small"
              :disabled="!canWrite"
              class="rg-effort-select"
              @update:model-value="(v: string) => (m.effort = v || null)"
            >
              <el-option label="跟随上游" value="" />
              <el-option v-for="e in EFFORT_OPTIONS" :key="e" :label="e" :value="e" />
            </el-select>
          </div>
          <div class="rg-member-ops">
            <el-button size="small" text :disabled="!canWrite || idx === 0" title="上移" @click="move(idx, -1)">
              <el-icon :size="14"><ArrowUpwardOutlined /></el-icon>
            </el-button>
            <el-button size="small" text :disabled="!canWrite || idx === members.length - 1" title="下移" @click="move(idx, 1)">
              <el-icon :size="14"><ArrowDownwardOutlined /></el-icon>
            </el-button>
            <el-button size="small" text type="danger" :disabled="!canWrite" title="移除成员" @click="removeMember(idx)">
              <el-icon :size="14"><DeleteOutlined /></el-icon>
            </el-button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 路由配置弹框：策略 / 限流 / 延迟 / 全忙 / 上下文 -->
    <ReDialog
      v-model="configVisible"
      title="路由配置"
      width="640px"
      append-to-body
      show-footer
      :confirm-loading="saving"
      ok-text="保存"
      @ok="confirmConfig"
    >
      <div class="rg-cfg-grid">
        <label class="rg-field">
          <span class="rg-label">路由策略</span>
          <el-select v-model="draft.strategy" :disabled="!canWrite">
            <el-option v-for="item in STRATEGY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <span class="rg-hint">{{ activeStrategyHint }}</span>
        </label>

        <label class="rg-field">
          <span class="rg-label">被限流时</span>
          <el-select v-model="draft.on_rate_limit" :disabled="!canWrite">
            <el-option label="默认" value="default" />
            <el-option label="保持原位" value="keep_position" />
            <el-option label="排到最后" value="move_to_end" />
          </el-select>
          <span class="rg-hint">成员被上游限流后怎么排：保持原位不变，或排到顺序末尾。</span>
        </label>

        <label class="rg-field">
          <span class="rg-label">延迟不出字</span>
          <el-select v-model="draft.on_slow" :disabled="!canWrite">
            <el-option label="默认" value="default" />
            <el-option label="一直等" value="wait" />
            <el-option label="30 秒" value="30s" />
            <el-option label="1 分钟" value="1m" />
            <el-option label="2 分钟" value="2m" />
            <el-option label="自定义" value="custom" />
          </el-select>
          <span v-if="draft.on_slow === 'custom'" class="rg-inline">
            <el-input-number v-model="draftSlowSeconds" :min="5" :step="5" :disabled="!canWrite" controls-position="right" />
            <span class="rg-unit">秒</span>
          </span>
          <span v-else class="rg-hint">首字迟迟不出时最多等多久再换下一个成员。</span>
        </label>

        <label class="rg-field">
          <span class="rg-label">成员全都忙</span>
          <el-select v-model="draft.on_busy" :disabled="!canWrite">
            <el-option label="默认" value="default" />
            <el-option label="关闭" value="off" />
            <el-option label="1 分钟" value="1m" />
            <el-option label="2 分钟" value="2m" />
            <el-option label="4 分钟" value="4m" />
          </el-select>
          <span class="rg-hint">所有成员都在冷却时的等待时长，等不到就全部放行。</span>
        </label>

        <label class="rg-field rg-field-wide">
          <span class="rg-label">上下文</span>
          <el-select v-model="draft.on_context" :disabled="!canWrite">
            <el-option label="最大模型的" value="max" />
            <el-option label="最小模型的" value="min" />
            <el-option label="自定义" value="custom" />
          </el-select>
          <span v-if="draft.on_context === 'custom'" class="rg-inline">
            <el-input-number v-model="draftContext" :min="1024" :step="1024" :disabled="!canWrite" controls-position="right" />
            <span class="rg-unit">token</span>
          </span>
          <span v-else class="rg-hint">{{ contextHint }}</span>
        </label>
      </div>
    </ReDialog>

    <!-- 选择模型弹框：搜索模型库，勾选后一次性加入成员 -->
    <ReDialog
      v-model="pickerVisible"
      title="选择模型"
      width="720px"
      append-to-body
      show-footer
      :ok-text="pickerCount ? `添加 ${pickerCount} 个` : '添加'"
      :show-ok="pickerCount > 0"
      @ok="confirmPicker"
    >
      <div class="rg-pick-bar">
        <el-input
          v-model="pickerKeyword"
          placeholder="按模型名 / 供应商搜索模型库"
          clearable
          @keyup.enter="loadPicker"
          @clear="loadPicker"
        >
          <template #prefix><el-icon :size="14"><SearchOutlined /></el-icon></template>
        </el-input>
        <el-button round :loading="pickerLoading" @click="loadPicker">搜索</el-button>
      </div>

      <div v-if="pickerLoading" class="rg-pick-empty">正在读取模型库…</div>
      <div v-else-if="pickerList.length === 0" class="rg-pick-empty">
        没有可添加的模型。模型库里的模型都已在这个组里，或换个关键词再搜。
      </div>
      <ul v-else class="rg-pick-list">
        <li
          v-for="c in pickerList"
          :key="c.label"
          class="rg-pick-row"
          :class="{ 'is-picked': pickerSelected.includes(c.label) }"
          @click="togglePick(c.label)"
        >
          <el-checkbox
            :model-value="pickerSelected.includes(c.label)"
            @click.stop
            @change="togglePick(c.label)"
          />
          <ProviderLogo :pid="brandFor(c)" :name="c.provider_name" size="sm" />
          <div class="rg-pick-info">
            <div class="rg-pick-name">
              {{ c.alias || c.model }}
              <span v-if="isFreeMember(c)" class="rg-badge rg-badge-free">免费</span>
              <span v-if="c.model !== (c.alias || c.model)" class="rg-pick-model">{{ c.model }}</span>
            </div>
            <div class="rg-pick-meta">
              <span class="rg-pick-provider">{{ c.provider_name }}</span>
              <span v-for="f in candidateFacts(c)" :key="f">· {{ f }}</span>
            </div>
            <div v-if="describeMember(c)" class="rg-pick-desc">{{ describeMember(c) }}</div>
          </div>
        </li>
      </ul>
    </ReDialog>
  </section>
</template>

<script setup lang="ts">
/**
 * 路由组配置面板。
 *
 * <p>成员来自「已添加的模型库」：这里只做引用（provider_id + model），
 * 不新建模型行。成员被删时后端会把它从组里摘掉，这里读到的不存在成员
 * 会标「已删除」，保存时自动丢弃。</p>
 *
 * <p>每模型 effort 只作用于该成员的请求；会话层不支持 effort 覆盖
 * （路由组客户端忽略 thinkingEffort），避免整组被同一档位绑死。</p>
 *
 * <p><b>版式（2026-11-12）：</b>策略五件套（策略 / 限流 / 延迟 / 全忙 / 上下文）
 * 收进右上角齿轮打开的「路由配置」弹框，页面上只留一行摘要；成员不再把候选模型
 * 平铺成一堆 chip（一屏塞十几个，反而找不到自己关心的成员），改成「添加成员」
 * 弹框里搜索 + 勾选。</p>
 */
import { computed, onMounted, ref, watch } from 'vue'
import {
  AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined,
  DeleteOutlined, SearchOutlined, SettingsOutlined,
} from '@vicons/material'
import { message } from '@repo/core'
import ReDialog from '@repo/ui/re-dialog'
import { adminApi } from '@/framework/context'
import { describeFetchRow, modelPriceOf, resolveProviderBrand } from './model.utils'
import ProviderLogo from './ProviderLogo.vue'

interface GroupMember {
  provider_id: string
  provider_name?: string
  platform?: string
  model: string
  alias?: string
  label: string
  effort: string | null
  context_window?: number | null
  metrics?: Record<string, any> | null
  exists?: boolean
}

interface GroupSetting {
  strategy: string
  on_rate_limit: string
  on_slow: string
  on_busy: string
  on_context: string
  context_window: number | null
  slow_ms: number | null
  busy_ms: number | null
}

const props = withDefaults(defineProps<{ providerId: string; canWrite?: boolean }>(), { canWrite: true })

const STRATEGY_OPTIONS = [
  { value: 'smart', label: '智能', hint: '按价格、延迟、成功率打分：轻活给便宜的，重活给更强的。' },
  { value: 'order', label: '按顺序', hint: '永远先试列表第一个，失败再往下。' },
  { value: 'until_exhausted', label: '用完再换', hint: '一直用当前成员，直到它被限流或报错才换。' },
  { value: 'round_robin', label: '轮流', hint: '每个请求换一个成员，把配额摊平。' },
  { value: 'least_used', label: '最少使用', hint: '优先派给累计调用次数最少的成员。' },
  { value: 'expire_first', label: '到期前用完', hint: '离额度到期最近的先派出去，避免额度白白过期。' },
  { value: 'free_first', label: '免费优先', hint: '免费成员用尽才用付费成员。' },
  { value: 'speed_first', label: '速度优先', hint: '优先派给实测首字延迟最低的成员。' },
  { value: 'cheapest_first', label: '最便宜优先', hint: '优先派给价格最低的成员。' },
  { value: 'free_quota_first', label: '免费额度先到先用', hint: '免费成员按额度到期时间先后使用。' },
  { value: 'weighted', label: '按权重', hint: '按成员配置的权重分配请求。' },
  { value: 'manual', label: '手动', hint: '只调用手动选中的那一个，不自动切换。' },
]

const EFFORT_OPTIONS = ['low', 'medium', 'high', 'minimal', 'none']

const RATE_LIMIT_LABEL: Record<string, string> = {
  default: '默认', keep_position: '保持原位', move_to_end: '排到最后',
}
const SLOW_LABEL: Record<string, string> = {
  default: '默认', wait: '一直等', '30s': '30 秒', '1m': '1 分钟', '2m': '2 分钟',
}
const BUSY_LABEL: Record<string, string> = {
  default: '默认', off: '关闭', '1m': '1 分钟', '2m': '2 分钟', '4m': '4 分钟',
}

const setting = ref<GroupSetting>({
  strategy: 'smart',
  on_rate_limit: 'default',
  on_slow: 'default',
  on_busy: 'default',
  on_context: 'max',
  context_window: null,
  slow_ms: null,
  busy_ms: null,
})

/** 配置弹框里的草稿：点「保存」才写回 setting 并提交 */
const draft = ref<GroupSetting>({ ...setting.value })
const configVisible = ref(false)

const members = ref<GroupMember[]>([])
const loading = ref(false)
const saving = ref(false)

/* ---------- 选择模型弹框 ---------- */
const pickerVisible = ref(false)
const pickerKeyword = ref('')
const pickerLoading = ref(false)
const pickerList = ref<GroupMember[]>([])
const pickerSelected = ref<string[]>([])
const pickerCount = computed(() => pickerSelected.value.length)

const draftSlowSeconds = computed({
  get: () => Math.round((draft.value.slow_ms || 30000) / 1000),
  set: (v: number) => { draft.value.slow_ms = Math.max(5, Math.round(v || 30)) * 1000 },
})

const draftContext = computed({
  get: () => draft.value.context_window || 32000,
  set: (v: number) => { draft.value.context_window = Math.max(1024, Math.round(v || 32000)) },
})

const activeStrategyHint = computed(
  () => STRATEGY_OPTIONS.find((s) => s.value === draft.value.strategy)?.hint || '',
)

const contextHint = computed(() => {
  if (draft.value.on_context === 'min') return '按成员里最小的上下文窗口计算，保证任何成员都吃得下。'
  return '按成员里最大的上下文窗口计算。'
})

const customSlowLabel = computed(() => `自定义 ${Math.round((setting.value.slow_ms || 30000) / 1000)} 秒`)

/** 头部摘要：不进弹框也能看清当前策略口径 */
const strategySummary = computed(() => {
  const strategy = STRATEGY_OPTIONS.find((s) => s.value === setting.value.strategy)?.label || setting.value.strategy
  const slow = setting.value.on_slow === 'custom'
    ? `${customSlowLabel.value}`
    : (SLOW_LABEL[setting.value.on_slow] || setting.value.on_slow)
  const context = setting.value.on_context === 'custom'
    ? `自定义 ${formatContext(setting.value.context_window || 32000)}`
    : setting.value.on_context === 'min' ? '最小模型' : '最大模型'
  return [
    `策略 ${strategy}`,
    `限流 ${RATE_LIMIT_LABEL[setting.value.on_rate_limit] || setting.value.on_rate_limit}`,
    `首字 ${slow}`,
    `全忙 ${BUSY_LABEL[setting.value.on_busy] || setting.value.on_busy}`,
    `上下文 ${context}`,
  ].join(' · ')
})

const formatContext = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value))

/** 任务类型的中文说明：模型能干什么（候选行里直接可读） */
const TASK_LABEL: Record<string, string> = {
  chat: '文本对话', completion: '文本补全', image_generation: '图像生成', image: '图像生成',
  video_generation: '视频生成', video: '视频生成', embedding: '向量化', rerank: '重排序',
  tts: '语音合成', asr: '语音识别', detection: '目标检测', ocr: 'OCR 识别', colorize: '图像上色',
}

/** 模型「能干什么」：description 优先，否则把 capabilities 的任务翻成中文 */
const describeMember = (m: any) => {
  const text = describeFetchRow(m)
  if (!text) return ''
  return TASK_LABEL[text] || text
}

/** 价格摘要：$/M token；未给价格时不显示（不写「未知」占位，避免噪音） */
const priceText = (m: any) => {
  const p = modelPriceOf(m)
  if (!p.known) return ''
  if (p.free) return '免费'
  const fmt = (v: number | null) => (v == null ? '—' : `$${v}`)
  return `${fmt(p.input)} / ${fmt(p.output)} 每百万 token`
}

/** 候选行的事实行：上下文 / 最大输出 / 价格 */
const candidateFacts = (m: any) => {
  const facts: string[] = []
  if (m.platform) facts.push(String(m.platform))
  if (m.context_window) facts.push(`上下文 ${formatContext(m.context_window)}`)
  if (m.max_tokens) facts.push(`输出 ${formatContext(m.max_tokens)}`)
  const price = priceText(m)
  if (price) facts.push(price)
  return facts
}

/** 成员品牌：由成员类别 + 供应商名解析品牌，取到 logo，取不到 fall 首字母 */
const brandFor = (m: any) => resolveProviderBrand({
  platform: m.platform,
  provider_id: m.provider_id,
  name: m.provider_name,
  base_url: '',
})

const isFreeMember = (m: GroupMember) => {
  const metrics = m.metrics || {}
  const price = Number(metrics.price_input_per_musd ?? metrics.price_input ?? metrics.input_price ?? NaN)
  return Number.isFinite(price) ? price <= 0 : false
}

/** 读取配置 */
const load = async () => {
  if (!props.providerId) return
  loading.value = true
  try {
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(props.providerId)}/router-group`)
    const data = res?.data ?? res
    const s = data?.setting || {}
    setting.value = {
      strategy: s.strategy || 'smart',
      on_rate_limit: s.on_rate_limit || 'default',
      on_slow: s.on_slow || 'default',
      on_busy: s.on_busy || 'default',
      on_context: s.on_context || 'max',
      context_window: s.context_window ?? null,
      slow_ms: s.slow_ms ?? null,
      busy_ms: s.busy_ms ?? null,
    }
    members.value = (data?.members || []).map((m: any) => ({
      ...m,
      label: m.label || `${m.provider_id}:${m.model}`,
      effort: m.effort || null,
    }))
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || '读取路由组失败')
  } finally {
    loading.value = false
  }
}

/** 打开配置弹框：从当前配置拷一份草稿，取消不影响页面 */
const openConfig = () => {
  draft.value = { ...setting.value }
  configVisible.value = true
}

/** 配置弹框「保存」：写回页面并立即落库（避免改完忘了点右上角保存） */
const confirmConfig = async () => {
  const prev = { ...setting.value }
  setting.value = { ...draft.value }
  configVisible.value = false
  const ok = await save()
  if (!ok) setting.value = prev
}

/** 打开选择模型弹框：每次都从模型库重新拉候选 */
const openPicker = async () => {
  pickerSelected.value = []
  pickerKeyword.value = ''
  pickerVisible.value = true
  await loadPicker()
}

/** 读取模型库里还没进组的候选模型 */
const loadPicker = async () => {
  pickerLoading.value = true
  try {
    const res: any = await adminApi.get('/api/router-groups/candidates', {
      params: { keyword: pickerKeyword.value || undefined },
    })
    const data = res?.data ?? res
    const picked = new Set(members.value.map((m) => m.label))
    pickerList.value = (Array.isArray(data) ? data : [])
      .map((c: any) => ({ ...c, label: `${c.provider_id}:${c.model}`, effort: c.effort || null }))
      .filter((c: any) => !picked.has(c.label))
      .slice(0, 50)
    pickerSelected.value = pickerSelected.value.filter((label) =>
      pickerList.value.some((c) => c.label === label))
  } catch {
    pickerList.value = []
  } finally {
    pickerLoading.value = false
  }
}

const togglePick = (label: string) => {
  const idx = pickerSelected.value.indexOf(label)
  if (idx >= 0) pickerSelected.value.splice(idx, 1)
  else pickerSelected.value.push(label)
}

/** 选择模型弹框「添加」：勾选的按当前顺序追加到成员末尾 */
const confirmPicker = () => {
  const chosen = pickerList.value.filter((c) => pickerSelected.value.includes(c.label))
  for (const c of chosen) {
    if (!members.value.some((m) => m.label === c.label)) {
      members.value.push({ ...c, effort: c.effort || null, exists: true })
    }
  }
  pickerSelected.value = []
  pickerVisible.value = false
}

const removeMember = (idx: number) => {
  members.value.splice(idx, 1)
}

/** 调整顺序 */
const move = (idx: number, delta: number) => {
  const target = idx + delta
  if (target < 0 || target >= members.value.length) return
  const [item] = members.value.splice(idx, 1)
  members.value.splice(target, 0, item)
}

/** 保存配置（已删除的成员不提交）；返回是否成功，供配置弹框回滚 */
const save = async (): Promise<boolean> => {
  saving.value = true
  try {
    const body = {
      ...setting.value,
      members: members.value
        .filter((m) => m.exists !== false)
        .map((m) => ({
          provider_id: m.provider_id,
          model: m.model,
          effort: m.effort || null,
        })),
    }
    const res: any = await adminApi.put(
      `/api/providers/${encodeURIComponent(props.providerId)}/router-group`,
      body,
    )
    const data = res?.data ?? res
    if (data?.members) {
      members.value = data.members.map((m: any) => ({ ...m, effort: m.effort || null }))
    }
    message.success('路由组配置已保存')
    return true
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || '保存路由组失败')
    return false
  } finally {
    saving.value = false
  }
}

watch(() => props.providerId, () => { load() })

onMounted(load)

defineExpose({ load })
</script>

<style scoped>
.rg-panel { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }
.rg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.rg-head-title { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.rg-head-desc { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); max-width: 620px; line-height: 1.6; }
.rg-head-summary {
  margin-top: 6px; font-size: 11px; color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums; line-height: 1.6;
}
.rg-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rg-cfg-btn { color: var(--el-text-color-regular); }
.rg-cfg-btn:hover { color: var(--el-color-primary); }
.rg-field { display: flex; flex-direction: column; gap: 6px; }
.rg-label { font-size: 12px; font-weight: 600; color: var(--el-text-color-regular); }
.rg-hint { font-size: 11px; color: var(--el-text-color-secondary); line-height: 1.5; }
.rg-inline { display: flex; align-items: center; gap: 6px; }
.rg-unit { font-size: 12px; color: var(--el-text-color-secondary); }
.rg-members { border-top: 1px solid var(--el-border-color-lighter); padding-top: 14px; }
.rg-members-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rg-members-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.rg-members-count { font-size: 11px; padding: 0 6px; border-radius: 8px; background: var(--el-fill-color); color: var(--el-text-color-secondary); }
.rg-members-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.rg-add-btn { margin-left: auto; }
.rg-empty { margin-top: 12px; padding: 18px; text-align: center; font-size: 12px; color: var(--el-text-color-secondary); border: 1px dashed var(--el-border-color); border-radius: 8px; }
.rg-member-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.rg-member { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.rg-member-order { width: 20px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); }
.rg-member-info { min-width: 0; flex: 1; }
.rg-member-name { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--el-text-color-primary); }
.rg-member-meta { margin-top: 2px; font-size: 11px; color: var(--el-text-color-secondary); display: flex; gap: 4px; flex-wrap: wrap; }
.rg-member-desc { margin-top: 2px; font-size: 11px; color: var(--el-text-color-secondary); opacity: .85; }
.rg-member-raw { font-size: 10px; color: var(--el-text-color-disabled); }
.rg-badge { font-size: 10px; padding: 0 5px; border-radius: 8px; line-height: 16px; }
.rg-badge-warn { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.rg-badge-free { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.rg-member-effort { display: flex; align-items: center; gap: 6px; }
.rg-effort-label { font-size: 11px; color: var(--el-text-color-secondary); }
.rg-effort-select { width: 118px; }
.rg-member-ops { display: flex; align-items: center; gap: 2px; }

/* 配置弹框 */
.rg-cfg-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px; padding: 4px 0 2px; }
.rg-field-wide { grid-column: 1 / -1; }

/* 选择模型弹框 */
.rg-pick-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.rg-pick-list {
  list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px;
  max-height: 46vh; overflow-y: auto;
}
.rg-pick-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter); border-radius: 8px; cursor: pointer;
}
.rg-pick-row:hover { border-color: var(--el-color-primary-light-5); }
.rg-pick-row.is-picked { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.rg-pick-info { min-width: 0; flex: 1; }
.rg-pick-name { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--el-text-color-primary); }
.rg-pick-meta { margin-top: 2px; font-size: 11px; color: var(--el-text-color-secondary); display: flex; gap: 4px; flex-wrap: wrap; }
.rg-pick-provider { color: var(--el-text-color-regular); }
.rg-pick-desc { margin-top: 2px; font-size: 11px; line-height: 1.5; color: var(--el-text-color-secondary); }
.rg-pick-model { font-size: 10px; color: var(--el-text-color-disabled); }
.rg-pick-empty { padding: 26px 12px; text-align: center; font-size: 12px; color: var(--el-text-color-secondary); }
</style>
