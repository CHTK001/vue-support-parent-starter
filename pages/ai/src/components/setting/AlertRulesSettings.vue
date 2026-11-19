<template>
  <div class="alert-rules">
    <SettingsCard
      title="告警规则"
      subtitle="针对 AppKey 用量 / 费用 / 异常的阈值告警。规则声明「触发条件 + 阈值 + 通知渠道」，由后端按规则判定与投递；此处只做规则的增删改查与启停。"
    >
      <template #actions>
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新建规则</el-button>
      </template>

      <!-- 筛选行：名称关键字 / 作用范围 / 启用状态 -->
      <div class="alert-filter">
        <el-input
          v-model="filterKeyword"
          class="alert-filter__keyword"
          placeholder="按规则名称搜索"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="filterScope" class="alert-filter__scope" placeholder="作用范围" clearable>
          <el-option label="全局" :value="0" />
          <el-option v-for="k in appKeys" :key="k.id" :label="appKeyLabel(k)" :value="k.id" />
        </el-select>
        <el-select v-model="filterEnabled" class="alert-filter__state" placeholder="状态" clearable>
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <span class="alert-filter__count">{{ filteredRules.length }} / {{ rules.length }} 条</span>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredRules"
        row-key="id"
        style="width: 100%"
      >
        <el-table-column prop="name" label="规则名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="作用范围" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ scopeLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="210" show-overflow-tooltip>
          <template #default="{ row }">{{ conditionSummary(row) }}</template>
        </el-table-column>
        <el-table-column label="通知渠道" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ channelsLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="165" />
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="alert-empty">
            <p class="alert-empty__text">{{ hasFilter ? '没有匹配的告警规则' : '暂无告警规则' }}</p>
            <el-button v-if="hasFilter" link type="primary" @click="clearFilters">清除筛选条件</el-button>
            <el-button v-else type="primary" @click="openCreate">新建规则</el-button>
          </div>
        </template>
      </el-table>
    </SettingsCard>

    <!-- 新建 / 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑告警规则' : '新建告警规则'"
      width="560px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="form.appKeyId === 0"
        class="alert-scope-tip"
        type="warning"
        show-icon
        :closable="false"
        title="全局规则对当前所有 AppKey 生效，请确认阈值口径对所有账号都合适。"
      />
      <el-form label-width="92px" @submit.prevent>
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" maxlength="60" show-word-limit placeholder="如：OpenAI 日费用告警" />
        </el-form-item>
        <el-form-item label="作用范围">
          <el-select v-model="form.appKeyId" style="width: 100%" filterable>
            <el-option label="全局（所有 AppKey）" :value="0" />
            <el-option v-for="k in appKeys" :key="k.id" :label="appKeyLabel(k)" :value="k.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件" required>
          <el-select
            v-model="form.condition"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            placeholder="选择常用条件，或直接输入条件表达式"
          >
            <el-option
              v-for="c in CONDITION_PRESETS"
              :key="c.value"
              :label="`${c.label}（${c.value}）`"
              :value="c.value"
            />
          </el-select>
          <div class="alert-form-hint">
            <span>表达式长度 {{ form.condition.length }}/128（后端上限）</span>
            <span v-if="form.condition.length > 128" class="alert-form-hint--error">超出上限，请缩短表达式</span>
          </div>
        </el-form-item>
        <el-form-item label="阈值" required>
          <div class="alert-threshold">
            <el-input-number v-model="form.threshold" :min="0" :step="1" step-strictly />
            <span v-if="activeUnit" class="alert-threshold__unit">{{ activeUnit }}</span>
          </div>
        </el-form-item>
        <el-form-item label="通知渠道">
          <el-select
            v-model="form.channelList"
            style="width: 100%"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入渠道，保存为 JSON 数组"
          >
            <el-option v-for="c in CHANNEL_PRESETS" :key="c" :label="c" :value="c" />
          </el-select>
          <div class="alert-form-hint">
            <span>序列化后长度 {{ channelsJson.length }}/512（后端上限）</span>
            <span v-if="channelsJson.length > 512" class="alert-form-hint--error">超出上限，请减少渠道</span>
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 告警规则管理面板（设置中心 · 系统分组）。
 *
 * <p>数据源 {@code /v2/alerts}（AiAlertController，全接口 {@code @Permission("admin")}）。
 * 后端当前提供规则的 CRUD 与启停：condition 为触发条件表达式字符串（VARCHAR(128)），
 * channels 为通知渠道 JSON 数组字符串（VARCHAR(512)），appKeyId=0 表示全局。
 * 前端只做展示与交互、按契约序列化，不实现后端的判定规则。</p>
 *
 * <p>展示增强：预设条件带单位（费用 ¥ / tokens / 次 / %），表格把「条件 + 阈值」
 * 合成一句可读语义；阈值单位随所选条件自适应。校验只对齐后端列宽（128/512），
 * 不做业务判重（业务规则归后端）。</p>
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from '@repo/core'
import { ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { appKeyApi } from '@/services/javaApi'
import SettingsCard from './SettingsCard.vue'

defineOptions({ name: 'AlertRulesSettings' })

/** 常用触发条件预设（allow-create：后端不校验枚举，可输入任意表达式；unit 仅用于展示） */
const CONDITION_PRESETS = [
  { label: '当日费用', value: 'daily_cost', unit: '¥' },
  { label: '当日 Token 用量', value: 'daily_tokens', unit: 'tokens' },
  { label: '当日请求数', value: 'daily_requests', unit: '次' },
  { label: '错误率', value: 'error_rate', unit: '%' },
]

/** 常用通知渠道预设（可自由输入） */
const CHANNEL_PRESETS = ['站内消息', '邮件', 'Webhook']

/** 后端列宽约束（V7.0__init_all_ai.sql：condition VARCHAR(128)、channels VARCHAR(512)） */
const CONDITION_MAX = 128
const CHANNELS_JSON_MAX = 512

const loading = ref(false)
const saving = ref(false)
const rules = ref<any[]>([])
const appKeys = ref<any[]>([])

// ==================== 筛选 ====================
const filterKeyword = ref('')
const filterScope = ref<number | ''>('')
const filterEnabled = ref<boolean | ''>('')

/** clearable 清空后是 ''；null/undefined/'' 都视为未选 */
const isSet = (v: any) => v !== null && v !== undefined && v !== ''

const hasFilter = computed(
  () => filterKeyword.value.trim() !== '' || isSet(filterScope.value) || isSet(filterEnabled.value)
)

const filteredRules = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase()
  return rules.value.filter((r) => {
    if (kw && !String(r?.name ?? '').toLowerCase().includes(kw)) return false
    if (isSet(filterScope.value) && Number(r?.appKeyId ?? 0) !== Number(filterScope.value)) return false
    if (isSet(filterEnabled.value) && Boolean(r?.enabled) !== Boolean(filterEnabled.value)) return false
    return true
  })
})

const clearFilters = () => {
  filterKeyword.value = ''
  filterScope.value = ''
  filterEnabled.value = ''
}

// ==================== 展示辅助 ====================
const conditionMeta = (cond: any) =>
  CONDITION_PRESETS.find((c) => c.value === cond)

/** 阈值 + 单位（随条件自适应；无预设单位时不加后缀） */
const thresholdText = (threshold: any, cond?: any) => {
  const unit = conditionMeta(cond)?.unit ?? ''
  return `${threshold ?? 0}${unit ? ` ${unit}` : ''}`
}

/** 表格「触发条件」列：预设条件合成「当日费用 > 100 ¥」；自定义表达式原文 + 阈值并列 */
const conditionSummary = (row: any) => {
  const meta = conditionMeta(row?.condition)
  if (meta) return `${meta.label} > ${thresholdText(row?.threshold, row?.condition)}`
  return `${row?.condition || '—'}（阈值 ${row?.threshold ?? 0}）`
}

/** appKeyId → 名称（下拉未加载到时退化为 #id） */
const appKeyName = (id: any) => {
  const hit = appKeys.value.find((k) => Number(k.id) === Number(id))
  return hit ? String(hit.name ?? `#${id}`) : `#${id}`
}

/** 作用范围：0 = 全局，其余显示 AppKey 名称 */
const scopeLabel = (row: any) =>
  Number(row?.appKeyId) > 0 ? appKeyName(row.appKeyId) : '全局'

/** channels 是 JSON 数组字符串；解析失败按原文展示，不给前端吞数据 */
const channelsLabel = (row: any) => {
  try {
    const parsed =
      typeof row?.channels === 'string' && row.channels.trim()
        ? JSON.parse(row.channels)
        : row?.channels
    return Array.isArray(parsed) && parsed.length ? parsed.join('、') : '—'
  } catch {
    return row?.channels || '—'
  }
}

const appKeyLabel = (k: any) => {
  const name = k?.name ? String(k.name) : `#${k?.id}`
  return k?.providerName ? `${name} · ${k.providerName}` : name
}

// ==================== 表单 ====================
const dialogVisible = ref(false)
const form = reactive({
  id: null as number | null,
  name: '',
  appKeyId: 0,
  condition: '',
  threshold: 0,
  channelList: [] as string[],
  enabled: true,
})

/** 当前所选条件的单位（阈值输入框旁展示） */
const activeUnit = computed(() => conditionMeta(form.condition)?.unit ?? '')

/** channels 序列化结果（对话框内实时展示长度，对齐后端 VARCHAR(512)） */
const channelsJson = computed(() => JSON.stringify(form.channelList.filter((c) => String(c).trim())))

const load = async () => {
  loading.value = true
  try {
    const res: any = await apiService.fetchAlertRules()
    rules.value = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  } catch (e: any) {
    message.error(e?.message || '加载告警规则失败')
  } finally {
    loading.value = false
  }
}

const loadAppKeys = async () => {
  try {
    // /v2/app-keys 回 {code,data,msg} 信封（javaApi 不解包）；兼容裸数组形态
    const res: any = await appKeyApi.list()
    appKeys.value = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
  } catch {
    // 下拉只是辅助信息，失败不阻塞规则管理
    appKeys.value = []
  }
}

const openCreate = () => {
  Object.assign(form, {
    id: null,
    name: '',
    appKeyId: 0,
    condition: '',
    threshold: 0,
    channelList: [],
    enabled: true,
  })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  let channelList: string[] = []
  try {
    const parsed =
      typeof row?.channels === 'string' && row.channels.trim()
        ? JSON.parse(row.channels)
        : row?.channels
    if (Array.isArray(parsed)) channelList = parsed.map(String)
  } catch {
    // 非法 JSON 留空，保存时按空数组处理
  }
  Object.assign(form, {
    id: row.id,
    name: row.name ?? '',
    appKeyId: Number(row.appKeyId) > 0 ? Number(row.appKeyId) : 0,
    condition: row.condition ?? '',
    threshold: Number(row.threshold) || 0,
    channelList,
    enabled: row.enabled !== false,
  })
  dialogVisible.value = true
}

const save = async () => {
  if (!form.name.trim()) {
    message.warning('请填写规则名称')
    return
  }
  const condition = String(form.condition).trim()
  if (!condition) {
    message.warning('请填写触发条件表达式')
    return
  }
  if (condition.length > CONDITION_MAX) {
    message.warning(`触发条件表达式不能超过 ${CONDITION_MAX} 个字符（后端列宽限制）`)
    return
  }
  if (form.threshold === null || form.threshold === undefined) {
    message.warning('请填写告警阈值')
    return
  }
  const channels = JSON.stringify(form.channelList.filter((c) => String(c).trim()))
  if (channels.length > CHANNELS_JSON_MAX) {
    message.warning(`通知渠道序列化后不能超过 ${CHANNELS_JSON_MAX} 个字符（后端列宽限制）`)
    return
  }
  const payload = {
    name: form.name.trim(),
    appKeyId: form.appKeyId,
    condition,
    threshold: form.threshold,
    channels,
    enabled: form.enabled,
  }
  saving.value = true
  try {
    if (form.id) {
      await apiService.updateAlertRule(form.id, payload)
      message.success('告警规则已更新')
    } else {
      await apiService.createAlertRule(payload)
      message.success('告警规则已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    message.error(e?.message || '保存告警规则失败')
  } finally {
    saving.value = false
  }
}

const onToggle = async (row: any) => {
  try {
    await apiService.toggleAlertRule(row.id, row.enabled !== false)
    message.success(row.enabled !== false ? '已启用' : '已停用')
  } catch (e: any) {
    // 失败回退开关，避免页面状态与后端不一致
    row.enabled = !row.enabled
    message.error(e?.message || '切换失败')
  }
}

const remove = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除告警规则「${row.name}」？删除后不可恢复。`, '删除告警规则', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户取消
  }
  try {
    await apiService.deleteAlertRule(row.id)
    message.success('删除成功')
    await load()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(() => {
  load()
  loadAppKeys()
})
</script>

<style scoped>
.alert-rules {
  width: 100%;
}

.alert-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.alert-filter__keyword {
  width: 220px;
}

.alert-filter__scope {
  width: 200px;
}

.alert-filter__state {
  width: 120px;
}

.alert-filter__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.alert-empty {
  padding: 20px 0;
}

.alert-empty__text {
  margin: 0 0 10px;
  color: var(--el-text-color-secondary);
}

.alert-scope-tip {
  margin-bottom: 12px;
}

.alert-form-hint {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.alert-form-hint--error {
  color: var(--el-color-danger);
}

.alert-threshold {
  display: flex;
  align-items: center;
  width: 100%;
}

.alert-threshold__unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
