<template>
  <section class="rg-panel">
    <!-- 头部：策略 + 保存 -->
    <div class="rg-head">
      <div class="rg-head-text">
        <div class="rg-head-title">路由策略</div>
        <div class="rg-head-desc">
          会话里选中这个路由组的任意模型时，由组内策略挑选真正调用的成员模型。
        </div>
      </div>
      <div class="rg-head-actions">
        <el-button :loading="loading" round @click="load">刷新</el-button>
        <el-button type="primary" round :loading="saving" :disabled="!canWrite" @click="save">
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 策略区 -->
    <div class="rg-grid">
      <label class="rg-field">
        <span class="rg-label">路由策略</span>
        <el-select v-model="setting.strategy" :disabled="!canWrite" size="default">
          <el-option v-for="item in STRATEGY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <span class="rg-hint">{{ activeStrategyHint }}</span>
      </label>

      <label class="rg-field">
        <span class="rg-label">被限流时</span>
        <el-select v-model="setting.on_rate_limit" :disabled="!canWrite" size="default">
          <el-option label="默认" value="default" />
          <el-option label="保持原位" value="keep_position" />
          <el-option label="排到最后" value="move_to_end" />
        </el-select>
        <span class="rg-hint">成员被上游限流后怎么排：保持原位不变，或排到顺序末尾。</span>
      </label>

      <label class="rg-field">
        <span class="rg-label">延迟不出字</span>
        <el-select v-model="setting.on_slow" :disabled="!canWrite" size="default">
          <el-option label="默认" value="default" />
          <el-option label="一直等" value="wait" />
          <el-option label="30 秒" value="30s" />
          <el-option label="1 分钟" value="1m" />
          <el-option label="2 分钟" value="2m" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <span v-if="setting.on_slow === 'custom'" class="rg-inline">
          <el-input-number v-model="customSlowSeconds" :min="5" :step="5" :disabled="!canWrite" size="default" controls-position="right" />
          <span class="rg-unit">秒</span>
        </span>
        <span v-else class="rg-hint">首字迟迟不出时最多等多久再换下一个成员。</span>
      </label>

      <label class="rg-field">
        <span class="rg-label">成员全都忙</span>
        <el-select v-model="setting.on_busy" :disabled="!canWrite" size="default">
          <el-option label="默认" value="default" />
          <el-option label="关闭" value="off" />
          <el-option label="1 分钟" value="1m" />
          <el-option label="2 分钟" value="2m" />
          <el-option label="4 分钟" value="4m" />
        </el-select>
        <span class="rg-hint">所有成员都在冷却时的等待时长，等不到就全部放行。</span>
      </label>

      <label class="rg-field">
        <span class="rg-label">上下文</span>
        <el-select v-model="setting.on_context" :disabled="!canWrite" size="default">
          <el-option label="最大模型的" value="max" />
          <el-option label="最小模型的" value="min" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <span v-if="setting.on_context === 'custom'" class="rg-inline">
          <el-input-number v-model="customContext" :min="1024" :step="1024" :disabled="!canWrite" size="default" controls-position="right" />
          <span class="rg-unit">token</span>
        </span>
        <span v-else class="rg-hint">{{ contextHint }}</span>
      </label>
    </div>

    <!-- 成员表 -->
    <div class="rg-members">
      <div class="rg-members-head">
        <span class="rg-members-title">成员模型</span>
        <span class="rg-members-count">{{ members.length }}</span>
        <span class="rg-members-desc">来自已添加的模型库；顺序即「按顺序」策略的优先顺序。</span>
        <el-input
          v-model="candidateKeyword"
          class="rg-search"
          size="small"
          clearable
          placeholder="搜索模型库添加成员"
          @keyup.enter="searchCandidates"
          @clear="searchCandidates"
        >
          <template #prefix><el-icon :size="14"><SearchOutlined /></el-icon></template>
        </el-input>
        <el-button v-if="canWrite" size="small" round :loading="candidateLoading" @click="searchCandidates">
          搜索
        </el-button>
      </div>

      <!-- 候选（已加入模型库但不在组里） -->
      <div v-if="candidates.length > 0" class="rg-candidates">
        <span class="rg-candidates-label">可添加：</span>
        <button
          v-for="c in candidates"
          :key="c.label"
          class="rg-cand-chip"
          type="button"
          :disabled="!canWrite"
          @click="addMember(c)"
        >
          <span class="rg-cand-provider">{{ c.provider_name }}</span>
          <span class="rg-cand-model">{{ c.model }}</span>
          <el-icon :size="12"><AddOutlined /></el-icon>
        </button>
      </div>

      <div v-if="members.length === 0" class="rg-empty">
        还没有成员。先用上方搜索把模型库里的模型加进来。
      </div>

      <ul v-else class="rg-member-list">
        <li v-for="(m, idx) in members" :key="m.label" class="rg-member">
          <span class="rg-member-order">{{ idx + 1 }}</span>
          <ProviderLogo :pid="brandFor(m)" :name="m.provider_name" size="sm" />
          <div class="rg-member-info">
            <div class="rg-member-name">
              {{ m.alias || m.model }}
              <span v-if="!m.exists" class="rg-badge rg-badge-warn">已删除</span>
              <span v-if="isFreeMember(m)" class="rg-badge rg-badge-free">免费</span>
            </div>
            <div class="rg-member-meta">
              <span>{{ m.provider_name }}</span>
              <span v-if="m.context_window">· 上下文 {{ formatContext(m.context_window) }}</span>
              <span v-if="m.platform">· {{ m.platform }}</span>
              <span v-if="m.model !== (m.alias || m.model)">· {{ m.model }}</span>
            </div>
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
 */
import { computed, onMounted, ref, watch } from 'vue'
import {
  AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined,
  DeleteOutlined, SearchOutlined,
} from '@vicons/material'
import { message } from '@repo/core'
import { adminApi } from '@/framework/context'
import { resolveProviderBrand } from './model.utils'
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

const setting = ref({
  strategy: 'smart',
  on_rate_limit: 'default',
  on_slow: 'default',
  on_busy: 'default',
  on_context: 'max',
  context_window: null as number | null,
  slow_ms: null as number | null,
  busy_ms: null as number | null,
})

const members = ref<GroupMember[]>([])
const candidates = ref<(GroupMember & { provider_id: string })[]>([])
const candidateKeyword = ref('')
const candidateLoading = ref(false)
const loading = ref(false)
const saving = ref(false)

const customSlowSeconds = computed({
  get: () => Math.round((setting.value.slow_ms || 30000) / 1000),
  set: (v: number) => { setting.value.slow_ms = Math.max(5, Math.round(v || 30)) * 1000 },
})

const customContext = computed({
  get: () => setting.value.context_window || 32000,
  set: (v: number) => { setting.value.context_window = Math.max(1024, Math.round(v || 32000)) },
})

const activeStrategyHint = computed(
  () => STRATEGY_OPTIONS.find((s) => s.value === setting.value.strategy)?.hint || '',
)

const contextHint = computed(() => {
  if (setting.value.on_context === 'min') return '按成员里最小的上下文窗口计算，保证任何成员都吃得下。'
  return '按成员里最大的上下文窗口计算。'
})

const formatContext = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value))

/** 免费判定：成员显式标记，或价格键为 0 / 缺失 */
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
    await searchCandidates()
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || '读取路由组失败')
  } finally {
    loading.value = false
  }
}

/** 搜索模型库里可加入的模型 */
const searchCandidates = async () => {
  candidateLoading.value = true
  try {
    const res: any = await adminApi.get('/api/router-groups/candidates', {
      params: { keyword: candidateKeyword.value || undefined },
    })
    const data = res?.data ?? res
    const picked = new Set(members.value.map((m) => m.label))
    candidates.value = (Array.isArray(data) ? data : [])
      .map((c: any) => ({ ...c, label: `${c.provider_id}:${c.model}`, effort: c.effort || null }))
      .filter((c: any) => !picked.has(c.label))
      .slice(0, 24)
  } catch {
    candidates.value = []
  } finally {
    candidateLoading.value = false
  }
}

const addMember = (c: any) => {
  members.value.push({ ...c, effort: c.effort || null, exists: true })
  candidates.value = candidates.value.filter((x: any) => x.label !== c.label)
}

const removeMember = (idx: number) => {
  members.value.splice(idx, 1)
  searchCandidates()
}

/** 调整顺序 */
const move = (idx: number, delta: number) => {
  const target = idx + delta
  if (target < 0 || target >= members.value.length) return
  const [item] = members.value.splice(idx, 1)
  members.value.splice(target, 0, item)
}

/** 保存配置（已删除的成员不提交） */
const save = async () => {
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
    await searchCandidates()
  } catch (error: any) {
    message.error(error?.response?.data?.message || error?.message || '保存路由组失败')
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
.rg-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.rg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px 18px; }
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
.rg-search { width: 220px; margin-left: auto; }
.rg-candidates { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
.rg-candidates-label { font-size: 11px; color: var(--el-text-color-secondary); }
.rg-cand-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; font-size: 12px;
  border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular); cursor: pointer;
}
.rg-cand-chip:hover:not(:disabled) { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.rg-cand-chip:disabled { cursor: not-allowed; opacity: 0.55; }
.rg-cand-provider { color: var(--el-text-color-secondary); }
.rg-empty { margin-top: 12px; padding: 18px; text-align: center; font-size: 12px; color: var(--el-text-color-secondary); border: 1px dashed var(--el-border-color); border-radius: 8px; }
.rg-member-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.rg-member { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.rg-member-order { width: 20px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); }
.rg-member-info { min-width: 0; flex: 1; }
.rg-member-name { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--el-text-color-primary); }
.rg-member-meta { margin-top: 2px; font-size: 11px; color: var(--el-text-color-secondary); display: flex; gap: 4px; flex-wrap: wrap; }
.rg-badge { font-size: 10px; padding: 0 5px; border-radius: 8px; line-height: 16px; }
.rg-badge-warn { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.rg-badge-free { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.rg-member-effort { display: flex; align-items: center; gap: 6px; }
.rg-effort-label { font-size: 11px; color: var(--el-text-color-secondary); }
.rg-effort-select { width: 118px; }
.rg-member-ops { display: flex; align-items: center; gap: 2px; }
</style>
