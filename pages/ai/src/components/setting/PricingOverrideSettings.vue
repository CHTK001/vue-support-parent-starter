<template>
  <SettingsCard
    title="人工单价覆盖"
    subtitle="手动指定模型的成本单价，取价优先级高于官方同步价与指标估算价；删除后该模型恢复自动价。价格按「每百万 token」填写。"
  >
    <template #actions>
      <div class="pricing-actions">
        <el-input v-model="keyword" clearable class="pricing-search"
          placeholder="搜索厂商 / 模型" @input="load" @clear="load">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="openCreate">新增人工单价</el-button>
      </div>
    </template>

    <div class="table-scroll">
      <ReTable
        :data="rows"
        :columns="tableColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        row-key="id"
        empty-text="暂无人工单价，成本按同步价 / 估算价折算"
        style="width: 100%"
      >
        <template #col-inputPricePer1k="{ row }">
          {{ fmtPerMillion(row.inputPricePer1k) }}
        </template>
        <template #col-outputPricePer1k="{ row }">
          {{ fmtPerMillion(row.outputPricePer1k) }}
        </template>
        <template #col-effectiveDate="{ row }">
          {{ fmtTime(row.effectiveDate) }}
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton layout="square" type="primary" :icon="EditPen" tip="编辑" @click="openEdit(row)" />
            <ReButton layout="square" type="default" :icon="Delete" tip="删除（恢复同步价）" @click="removeRow(row)" />
          </div>
        </template>
      </ReTable>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId == null ? '新增人工单价' : '编辑人工单价'"
      width="460px" :close-on-click-modal="false" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-form-item label="厂商" required>
          <el-input v-model="form.provider" :disabled="editingId != null"
            placeholder="如 deepseek / openai（统一转小写）" />
        </el-form-item>
        <el-form-item label="模型" required>
          <el-input v-model="form.model" :disabled="editingId != null"
            placeholder="模型名称，如 deepseek-chat" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="form.currency" style="width: 180px">
            <el-option label="USD（美元）" value="USD" />
            <el-option label="CNY（人民币）" value="CNY" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入单价">
          <el-input-number v-model="form.inputPrice" :min="0" :precision="4" :step="0.1"
            controls-position="right" style="width: 200px" />
          <span class="unit-hint">{{ form.currency }} / 百万 token</span>
        </el-form-item>
        <el-form-item label="输出单价">
          <el-input-number v-model="form.outputPrice" :min="0" :precision="4" :step="0.1"
            controls-position="right" style="width: 200px" />
          <span class="unit-hint">{{ form.currency }} / 百万 token</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </SettingsCard>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { ref, onMounted } from 'vue'
import { Search, EditPen, Delete } from '@element-plus/icons-vue'

import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReButton from '@repo/ui/re-button'

import SettingsCard from './SettingsCard.vue'
import { modelMetricsApi } from '@/services/javaApi'

interface PricingRow {
  id: number
  provider: string
  model: string
  inputPricePer1k: number | null
  outputPricePer1k: number | null
  currency: string
  effectiveDate: string | null
}

// 库内单价为 币种/千 token，界面按「每百万 token」填写与展示（×/÷ 1000 换算）
const per1kToPerMillion = (v: number | null | undefined): number | null =>
  v == null ? null : Number((v * 1000).toFixed(6))

const perMillionToPer1k = (v: number | null | undefined): number | null =>
  v == null ? null : Number((v / 1000).toFixed(10))

const fmtPerMillion = (v: number | null | undefined): string =>
  v == null ? '—' : String(per1kToPerMillion(v))

const fmtTime = (s: string | null | undefined): string =>
  s ? String(s).replace('T', ' ').slice(0, 19) : '—'

const tableColumns: ReTableColumn[] = [
  { prop: 'provider', label: '厂商', minWidth: 110 },
  { prop: 'model', label: '模型', minWidth: 190, showOverflowTooltip: true },
  { prop: 'inputPricePer1k', label: '输入单价（/百万）', width: 140, align: 'right', slot: 'inputPricePer1k' },
  { prop: 'outputPricePer1k', label: '输出单价（/百万）', width: 140, align: 'right', slot: 'outputPricePer1k' },
  { prop: 'currency', label: '币种', width: 80, align: 'center' },
  { prop: 'effectiveDate', label: '生效时间', width: 165, slot: 'effectiveDate' },
  { prop: 'actions', label: '操作', width: 110, align: 'center', slot: 'actions' },
]

const rows = ref<PricingRow[]>([])
const loading = ref(false)
const keyword = ref('')

const load = async () => {
  loading.value = true
  try {
    const res: any = await modelMetricsApi.listPricing(
      keyword.value.trim() ? { keyword: keyword.value.trim() } : undefined)
    const data = res?.data ?? res
    rows.value = Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : [])
  } catch (e) {
    console.error('加载人工单价失败:', e)
    message.error('加载人工单价失败')
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({
  provider: '',
  model: '',
  currency: 'USD',
  inputPrice: null as number | null,
  outputPrice: null as number | null,
})

const openCreate = () => {
  editingId.value = null
  form.value = { provider: '', model: '', currency: 'USD', inputPrice: null, outputPrice: null }
  dialogVisible.value = true
}

const openEdit = (row: PricingRow) => {
  editingId.value = row.id
  form.value = {
    provider: row.provider,
    model: row.model,
    currency: row.currency || 'USD',
    inputPrice: per1kToPerMillion(row.inputPricePer1k),
    outputPrice: per1kToPerMillion(row.outputPricePer1k),
  }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.provider.trim() || !form.value.model.trim()) {
    message.warning('请填写厂商与模型名称')
    return
  }
  if (form.value.inputPrice == null && form.value.outputPrice == null) {
    message.warning('输入单价与输出单价至少填写一项')
    return
  }
  saving.value = true
  try {
    await modelMetricsApi.savePricing({
      provider: form.value.provider.trim(),
      model: form.value.model.trim(),
      currency: form.value.currency,
      inputPricePer1k: perMillionToPer1k(form.value.inputPrice),
      outputPricePer1k: perMillionToPer1k(form.value.outputPrice),
    })
    message.success('人工单价已保存，成本折算按新单价生效')
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    console.error('保存人工单价失败:', e)
    message.error(e?.message || '保存人工单价失败')
  } finally {
    saving.value = false
  }
}

const removeRow = async (row: PricingRow) => {
  try {
    await message.confirm(
      `确定删除模型「${row.provider}/${row.model}」的人工单价？删除后成本恢复按同步价 / 估算价折算。`,
      '删除人工单价', '删除', '取消', 'warning')
  } catch {
    return // 用户取消
  }
  try {
    await modelMetricsApi.deletePricing(row.id)
    message.success('已删除人工单价')
    await load()
  } catch (e) {
    console.error('删除人工单价失败:', e)
    message.error('删除人工单价失败')
  }
}

onMounted(load)
</script>

<style scoped>
.pricing-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pricing-search {
  width: 200px;
}

.table-scroll {
  width: 100%;
}

.op-cell {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.unit-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>
