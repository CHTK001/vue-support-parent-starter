<template>
  <ReDialog
    v-model="visible"
    title="从配置导入"
    width="720px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="!importing"
    :show-close="!importing"
    class="config-import"
  >
    <template #header>
      <div class="ci-header">
        <div class="ci-header-ico">
          <el-icon :size="20"><UploadOutlined /></el-icon>
        </div>
        <div class="ci-header-text">
          <span class="ci-header-title">从配置导入供应商</span>
          <span class="ci-header-sub">读取 opencode / cc-switch 配置文件，批量创建供应商与模型</span>
        </div>
      </div>
    </template>

    <!-- 第一步：选择文件 -->
    <div v-if="entries.length === 0" class="ci-pick">
      <p class="ci-pick-desc">支持两种配置文件：</p>
      <ul class="ci-pick-list">
        <li><b>opencode</b>：opencode.json / opencode.jsonc（读取其中的 provider 配置）</li>
        <li><b>cc-switch</b>：cc-switch.db / .sqlite（读取 providers 表）</li>
      </ul>
      <p v-if="parseError" class="ci-error">{{ parseError }}</p>
      <div class="ci-pick-actions">
        <el-button type="primary" round :loading="reading" @click="fileInput?.click()">
          <template #icon><UploadOutlined /></template>
          选择配置文件
        </el-button>
        <input
          ref="fileInput"
          type="file"
          accept=".json,.jsonc,.db,.sqlite,.sqlite3"
          class="ci-file-input"
          @change="onFileChange"
        />
      </div>
      <p class="ci-pick-hint">解析在浏览器本地完成；确认预览后才会创建供应商，可随时取消。</p>
    </div>

    <!-- 第二步：预览确认 -->
    <div v-else class="ci-preview">
      <div class="ci-summary">
        <span>共 <b>{{ entries.length }}</b> 项</span>
        <span class="ci-sep">·</span>
        <span>可导入 <b>{{ importable.length }}</b> 项</span>
        <span v-if="skippedCount" class="ci-sep">·</span>
        <span v-if="skippedCount">跳过 <b>{{ skippedCount }}</b> 项</span>
        <span v-if="dupCount" class="ci-sep">·</span>
        <span v-if="dupCount"><b>{{ dupCount }}</b> 项与现有供应商同地址</span>
        <el-button size="small" text round class="ci-repick" :disabled="importing" @click="resetFile">
          换一个文件
        </el-button>
      </div>

      <div class="ci-toolbar">
        <el-checkbox
          :model-value="allChecked"
          :indeterminate="someChecked && !allChecked"
          :disabled="importing"
          @change="toggleAll"
        >
          全选可导入项
        </el-checkbox>
      </div>

      <div class="ci-list">
        <div
          v-for="e in entries"
          :key="e.key"
          class="ci-row"
          :class="{ skip: !!e.skip }"
        >
          <el-checkbox
            class="ci-row-check"
            :model-value="!!checked[e.key]"
            :disabled="!!e.skip || importing"
            @change="(v: any) => setChecked(e, v)"
          />
          <div class="ci-row-main">
            <div class="ci-row-line1">
              <span class="ci-row-name">{{ e.name }}</span>
              <span class="ci-row-tag src">{{ e.source }}</span>
              <span class="ci-row-tag plat">{{ e.platform }}</span>
              <span class="ci-row-tag" :class="e.hasKey ? 'key-ok' : 'key-none'">
                {{ e.hasKey ? '含密钥' : '无密钥' }}
              </span>
              <span v-if="isDup(e)" class="ci-row-tag dup">已存在同地址</span>
            </div>
            <div class="ci-row-line2">
              <span class="ci-row-url" :title="e.baseUrl">{{ e.baseUrl || '（无地址）' }}</span>
            </div>
            <div class="ci-row-line3">
              <span v-if="e.models.length" class="ci-row-models" :title="modelSummary(e)">
                {{ e.models.length }} 个模型：{{ modelSummary(e) }}
              </span>
              <span v-else class="ci-row-models none">无模型（可稍后手动添加）</span>
            </div>
            <div v-if="e.skip" class="ci-row-skip">跳过：{{ e.skip }}</div>
          </div>
        </div>
      </div>

      <p v-if="importError" class="ci-error">{{ importError }}</p>
      <p v-if="importing" class="ci-progress">{{ progressText }}</p>
    </div>

    <template #footer>
      <div class="ci-footer">
        <span v-if="entries.length" class="ci-footer-tip">
          将创建 {{ selectedEntries.length }} 个供应商、{{ selectedModelCount }} 个模型
        </span>
        <span class="ci-footer-btns">
          <el-button v-if="entries.length" round :disabled="importing" @click="visible = false">
            取消
          </el-button>
          <el-button
            v-if="entries.length"
            type="primary"
            round
            :loading="importing"
            :disabled="selectedEntries.length === 0"
            @click="startImport"
          >
            开始导入
          </el-button>
          <el-button v-else round @click="visible = false">关闭</el-button>
        </span>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 从配置文件批量导入供应商（opencode jsonc / cc-switch SQLite）。
 *
 * <p>交互：选文件 → 本地解析（opencode 走 JSONC 剥离；cc-switch 走 sql.js WASM）
 * → 预览（与现有供应商按地址判重、标注无密钥 / 跳过原因）→ 确认后逐个
 * createProvider + createModel。解析与创建的共用逻辑分别在
 * {@link module:configImport} 与 model.api.ts，本组件只做编排。</p>
 */
import { ref, computed } from 'vue'
import { UploadOutlined } from '@vicons/material'
import ReDialog from '@repo/ui/re-dialog'
import { message } from '@repo/core'
import { adminApi } from '@/framework/context'
import { apiService } from '../../services/ApiService'
import initSqlJs from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import {
  parseOpencodeConfig,
  ccSwitchRowsToEntries,
  dedupeEntryNames,
  type ImportEntry,
} from './configImport'

const emit = defineEmits<{ imported: [count: number] }>()

const visible = ref(false)
/** 解析出的全部条目（含跳过项，预览时透明展示） */
const entries = ref<ImportEntry[]>([])
/** 勾选状态（key → 是否导入） */
const checked = ref<Record<string, boolean>>({})
/** 现有供应商地址集合（判重用） */
const existingUrls = ref<Set<string>>(new Set())
const parseError = ref('')
const importError = ref('')
const reading = ref(false)
const importing = ref(false)
const progressText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const importable = computed(() => entries.value.filter((e) => !e.skip))
const skippedCount = computed(() => entries.value.filter((e) => e.skip).length)
const dupCount = computed(() => entries.value.filter((e) => isDup(e)).length)
const selectedEntries = computed(() => importable.value.filter((e) => checked.value[e.key]))
const selectedModelCount = computed(() =>
  selectedEntries.value.reduce((n, e) => n + e.models.length, 0),
)
const allChecked = computed(
  () => importable.value.length > 0 && importable.value.every((e) => checked.value[e.key]),
)
const someChecked = computed(() => importable.value.some((e) => checked.value[e.key]))

const open = () => {
  entries.value = []
  checked.value = {}
  parseError.value = ''
  importError.value = ''
  progressText.value = ''
  visible.value = true
  loadExisting()
}
defineExpose({ open })

/** 拉现有供应商地址，用于预览判重（失败不打断，只是少了重复标记） */
const loadExisting = async () => {
  try {
    const body: any = await adminApi.get('/api/providers?enabled_only=0')
    const list = Array.isArray(body) ? body : body?.data || []
    existingUrls.value = new Set(
      list
        .map((p: any) => normUrl(p.base_url ?? p.baseUrl))
        .filter((u: string) => !!u),
    )
  } catch {
    existingUrls.value = new Set()
  }
}

/** 地址归一化：小写、去尾斜杠，仅用于重复提示 */
const normUrl = (u: unknown) => String(u ?? '').trim().toLowerCase().replace(/\/+$/, '')

const isDup = (e: ImportEntry) => !!e.baseUrl && existingUrls.value.has(normUrl(e.baseUrl))

const setChecked = (e: ImportEntry, v: unknown) => {
  checked.value[e.key] = !!v
}

const toggleAll = (v: unknown) => {
  const on = !!v
  for (const e of importable.value) checked.value[e.key] = on
}

const modelSummary = (e: ImportEntry) => {
  const names = e.models.map((m) => m.name)
  const s = names.join('、')
  return s.length > 80 ? `${s.slice(0, 80)}…` : s
}

const resetFile = () => {
  entries.value = []
  checked.value = {}
  parseError.value = ''
  importError.value = ''
}

// ==================== 文件读取与解析 ====================

const onFileChange = async (ev: Event) => {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  reading.value = true
  parseError.value = ''
  importError.value = ''
  try {
    const name = file.name.toLowerCase()
    let parsed: ImportEntry[] = []
    if (/\.(db|sqlite|sqlite3)$/.test(name)) {
      parsed = await parseSqliteFile(await file.arrayBuffer())
    } else {
      const text = await file.text()
      // 扩展名不可信时的兜底：内容带 SQLite 魔数就按 cc-switch 库解析
      if (text.slice(0, 15) === 'SQLite format 3') {
        parsed = await parseSqliteFile(await file.arrayBuffer())
      } else {
        parsed = parseOpencodeConfig(text)
      }
    }
    if (!parsed.length) parseError.value = '没有从文件中解析出供应商配置'
    entries.value = parsed
    checked.value = {}
    for (const e of parsed) if (!e.skip) checked.value[e.key] = true
  } catch (err: any) {
    parseError.value = `解析失败：${err?.message || err}`
    entries.value = []
  } finally {
    reading.value = false
    // 清空选择，同一文件重新选择也能触发 change
    input.value = ''
  }
}

/** cc-switch SQLite → providers 行 → 导入草稿（sql.js WASM，同 filesystem 预览口径） */
const parseSqliteFile = async (buf: ArrayBuffer): Promise<ImportEntry[]> => {
  const SQL = await initSqlJs({ locateFile: (f: string) => (f.endsWith('.wasm') ? sqlWasmUrl : f) })
  const db = new SQL.Database(new Uint8Array(buf))
  try {
    const res = db.exec(
      'SELECT id, app_type, name, settings_config, website_url, category FROM providers',
    )
    if (!res.length) return []
    const cols = res[0].columns
    const rows = res[0].values.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])))
    const list = ccSwitchRowsToEntries(rows)
    dedupeEntryNames(list)
    return list
  } finally {
    db.close()
  }
}

// ==================== 导入执行 ====================

const startImport = async () => {
  const list = selectedEntries.value
  if (!list.length || importing.value) return
  importing.value = true
  importError.value = ''
  let ok = 0
  const failures: string[] = []
  for (let i = 0; i < list.length; i++) {
    const e = list[i]
    progressText.value = `正在导入（${i + 1}/${list.length}）：${e.name}`
    try {
      const payload: Record<string, unknown> = {
        platform: e.platform,
        name: e.name,
        base_url: e.baseUrl,
        auth_scheme: e.hasKey ? 'api_key' : 'none',
        enabled: true,
        initial_model: null,
        extra: {},
      }
      // 无密钥时不带 credentials：空 {api_key:''} 会被后端当成「已配置 1 个 key」
      if (e.hasKey) payload.credentials = { api_key: e.apiKey }
      const res: any = await apiService.createProvider(payload)
      // rawApi 不解包：正常是 { success/code, data } 信封，真正实体在 data 里
      const data = res && typeof res === 'object' && 'data' in res ? res.data : res
      const pid = String(data?.provider_id || data?.id || '')
      if (!pid) throw new Error('创建供应商未返回 id')
      for (const m of e.models) {
        await apiService.createModel({
          providerId: pid,
          modelName: m.id,
          alias: m.name || m.id,
          sort_order: 0,
          config: { contextWindow: m.contextWindow, maxOutputTokens: m.maxOutputTokens },
          capabilities: [{ task: m.task, traits: [] }],
          enabled: true,
        })
      }
      ok++
    } catch (err: any) {
      failures.push(`${e.name}：${err?.message || err}`)
    }
  }
  importing.value = false
  progressText.value = ''
  if (failures.length) {
    importError.value = `导入完成：成功 ${ok} 个，失败 ${failures.length} 个 —— ${failures.join('；')}`
    return
  }
  message.success(`已从配置导入 ${ok} 个供应商`)
  visible.value = false
  emit('imported', ok)
}
</script>

<style scoped>
.ci-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.ci-header-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--el-radius-lg, 12px);
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  flex-shrink: 0;
}
.ci-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ci-header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.ci-header-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---- 第一步：选文件 ---- */
.ci-pick {
  padding: 6px 2px 2px;
}
.ci-pick-desc {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.ci-pick-list {
  margin: 0 0 14px;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--el-text-color-secondary);
}
.ci-pick-actions {
  display: flex;
  align-items: center;
}
.ci-file-input {
  display: none;
}
.ci-pick-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 第二步：预览 ---- */
.ci-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ci-summary b {
  color: var(--el-color-primary);
}
.ci-sep {
  opacity: 0.5;
}
.ci-repick {
  margin-left: auto;
}
.ci-toolbar {
  padding: 2px 2px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ci-list {
  max-height: 320px;
  overflow-y: auto;
}
.ci-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ci-row:last-child {
  border-bottom: none;
}
.ci-row.skip {
  opacity: 0.55;
}
.ci-row-check {
  margin-top: 2px;
}
.ci-row-main {
  flex: 1;
  min-width: 0;
}
.ci-row-line1 {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ci-row-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.ci-row-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  height: 18px;
  border-radius: 9px;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.ci-row-tag.plat {
  font-family: var(--el-font-family, monospace);
}
.ci-row-tag.key-ok {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.ci-row-tag.key-none {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.ci-row-tag.dup {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}
.ci-row-line2 {
  margin-top: 3px;
}
.ci-row-url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
.ci-row-line3 {
  margin-top: 2px;
}
.ci-row-models {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ci-row-models.none {
  color: var(--el-text-color-placeholder);
}
.ci-row-skip {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.ci-error {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-color-danger);
  word-break: break-all;
}
.ci-progress {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--el-color-primary);
}

/* ---- footer ---- */
.ci-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.ci-footer-tip {
  flex: 1;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.ci-footer-btns {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
</style>
