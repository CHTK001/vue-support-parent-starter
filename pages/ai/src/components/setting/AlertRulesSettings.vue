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

      <el-table
        v-loading="loading"
        :data="rules"
        row-key="id"
        empty-text="暂无告警规则，点击右上角「新建规则」创建"
        style="width: 100%"
      >
        <el-table-column prop="name" label="规则名称" min-width="170" show-overflow-tooltip />
        <el-table-column label="作用范围" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ scopeLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="condition" label="触发条件" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.condition || '—' }}</template>
        </el-table-column>
        <el-table-column prop="threshold" label="阈值" width="110" />
        <el-table-column label="通知渠道" min-width="150" show-overflow-tooltip>
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
      </el-table>
    </SettingsCard>

    <!-- 新建 / 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑告警规则' : '新建告警规则'"
      width="540px"
      append-to-body
      :close-on-click-modal="false"
    >
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
        </el-form-item>
        <el-form-item label="阈值" required>
          <el-input-number v-model="form.threshold" :min="0" :step="1" step-strictly style="width: 100%" />
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
 */
import { ref, reactive, onMounted } from 'vue'
import { message } from '@repo/core'
import { ElMessageBox } from 'element-plus'
import { apiService } from '@/services/ApiService'
import { appKeyApi } from '@/services/javaApi'
import SettingsCard from './SettingsCard.vue'

defineOptions({ name: 'AlertRulesSettings' })

/** 常用触发条件预设（allow-create：后端不校验枚举，可输入任意表达式） */
const CONDITION_PRESETS = [
  { label: '当日费用', value: 'daily_cost' },
  { label: '当日 Token 用量', value: 'daily_tokens' },
  { label: '当日请求数', value: 'daily_requests' },
  { label: '错误率', value: 'error_rate' },
]

/** 常用通知渠道预设（可自由输入） */
const CHANNEL_PRESETS = ['站内消息', '邮件', 'Webhook']

const loading = ref(false)
const saving = ref(false)
const rules = ref<any[]>([])
const appKeys = ref<any[]>([])

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
  if (!String(form.condition).trim()) {
    message.warning('请填写触发条件表达式')
    return
  }
  if (form.threshold === null || form.threshold === undefined) {
    message.warning('请填写告警阈值')
    return
  }
  const payload = {
    name: form.name.trim(),
    appKeyId: form.appKeyId,
    condition: String(form.condition).trim(),
    threshold: form.threshold,
    channels: JSON.stringify(form.channelList.filter((c) => String(c).trim())),
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
</style>
