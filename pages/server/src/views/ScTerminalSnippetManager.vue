<script setup lang="ts">
/**
 * 片段管理 —— 命令片段的检索台
 *
 * <p>重构前这一页只能看到「编号 / 名称 / 备注」三列，命令正文一个字都没有；
 * 而片段这个概念的全部内容就是那段命令。这里把正文当成主角：三个档位都在
 * 第一屏就把正文摊出来，区别只是摊在哪。</p>
 *
 * <ul>
 *   <li><b>三栏指挥台</b>（默认）：分面栏按正文形态分档，中间密集列表（首行命令），
 *       右侧常驻全文。找一条命令时不用点进编辑框。</li>
 *   <li><b>状态看板</b>：单行命令 / 多行脚本 / 空正文三列 —— 单行命令可以直接
 *       粘到终端，脚本要先读一遍，这两类混在一列里会误操作。</li>
 *   <li><b>泳道 / 矩阵不开</b>：片段没有起止时刻，硬画时间轴只会得到一排等长装饰条。
 *       少一个不适用的档位，比多一个骗人的档位好。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import OpsDesk from '../components/opsdesk/OpsDesk.vue'
import type {
  OpsFacetGroup,
  OpsFilterField,
  OpsItem,
  OpsMode,
  OpsModeMeta,
  OpsTone,
} from '../components/opsdesk/types'
import {
  getSnippets,
  saveSnippet as apiSaveSnippet,
  updateSnippet as apiUpdateSnippet,
  delSnippet as apiDelSnippet,
  type TerminalSnippetPayload,
} from '../api'
import {
  filterSnippets,
  lineBuckets,
  snippetStats,
  toSnippetViews,
  type SnippetRow,
  type SnippetView,
} from './snippet/snippetView'

/** 工作区页签嵌入：hostId 用于从「主机」出发时的过滤入口（页面内暂不消费，保留占位） */
defineProps<{ hostId?: number }>()

/* ==================== 档位 ==================== */

const MODES: OpsModeMeta[] = [
  { id: 'deck', label: '三栏指挥台', thesis: '分面栏 + 密集列表 + 常驻全文，找命令不用点开编辑框' },
  { id: 'kanban', label: '形态看板', thesis: '单行命令 / 多行脚本 / 空正文三列，误粘风险一眼可见' },
]

/** 档位记忆键（按页持久化） */
const MODE_KEY = 'ops-mode:server.snippets'

/**
 * 读取已存档位。
 *
 * <p>收窄档位后旧值可能落在开放集外（此前这一页开过四个方向），
 * 这里收敛而不是直接信任。</p>
 */
function readMode(): OpsMode {
  try {
    const raw = localStorage.getItem(MODE_KEY)
    return MODES.some(m => m.id === raw) ? (raw as OpsMode) : 'deck'
  } catch {
    return 'deck'
  }
}

const mode = ref<OpsMode>(readMode())
watch(mode, v => {
  try {
    localStorage.setItem(MODE_KEY, v)
  } catch {
    /* 无痕模式忽略 */
  }
})

/* ==================== 数据 ==================== */

/** 后端原样行 */
const rows = ref<SnippetRow[]>([])

/** 加载态 */
const loading = ref(false)

/** 错误文案 */
const error = ref('')

/** 筛选：关键字 + 正文形态分面 */
const keyword = ref('')
const shape = ref('')

/** 新增 / 编辑弹窗 */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<TerminalSnippetPayload>({
  msTerminalSnippetName: '',
  msTerminalSnippetContent: '',
  msTerminalSnippetRemark: '',
})

/* ==================== 派生 ==================== */

/** 全量展示行 */
const allViews = computed(() => toSnippetViews(rows.value))

/**
 * 形态判定。
 *
 * <p>三档刻意是「空 / 单行 / 多行」而不是按行数连续分：这三种在用法上是
 * 完全不同的事 —— 空的不能用、单行的可以直接粘、多行的必须先读。</p>
 *
 * @param v 展示行
 */
function shapeOf(v: SnippetView): string {
  if (v.empty) return 'empty'
  return v.lines <= 1 ? 'one' : 'multi'
}

/** 已筛选的展示行 */
const views = computed(() => {
  let list = filterSnippets(allViews.value, keyword.value)
  if (shape.value) list = list.filter(v => shapeOf(v) === shape.value)
  return list
})

/** 统计（全量口径） */
const stats = computed(() => snippetStats(allViews.value))

/** 行数分布（全量口径） */
const buckets = computed(() => lineBuckets(allViews.value))

/** 控制栏筛选项 */
const FILTER_FIELDS: OpsFilterField[] = [
  { key: 'keyword', kind: 'search', placeholder: '搜索名称 / 命令内容 / 备注', width: 240 },
]

/** 控制栏筛选模型 */
const filterModel = computed<Record<string, string>>(() => ({ keyword: keyword.value }))

/**
 * 展示行 → 外壳条目。
 *
 * <p>tone 用「空正文 = 警告色」：一条没有正文的片段插进终端不会做任何事，
 * 这是数据缺陷而不是中性状态，得让人看见。</p>
 *
 * @param v 展示行
 */
function toItem(v: SnippetView): OpsItem {
  const s = shapeOf(v)
  return {
    id: v.id,
    title: v.name,
    sub: v.empty ? '（无正文）' : v.firstLine,
    tone: (v.empty ? 'warn' : s === 'one' ? 'info' : 'brand') as OpsTone,
    statusText: v.empty ? '无正文' : `${v.lines} 行`,
    badge: v.remark || '',
    column: s,
    meta: [
      { label: '行数', value: String(v.lines) },
      { label: '字符数', value: String(v.chars) },
      { label: '形态', value: v.empty ? '无正文' : s === 'one' ? '单行命令' : '多行脚本' },
      { label: '备注', value: v.remark || '—' },
    ],
    code: v.empty ? '' : v.content,
    searchText: `${v.name} ${v.content} ${v.remark}`,
  }
}

/* ==================== 分面栏 ==================== */

/**
 * 分面栏：正文形态 + 长度档。
 *
 * <p>计数用全量口径（不受自身筛选影响），否则点进「单行」后其它档位数字
 * 变 0，用户再也点不回去。</p>
 */
const facets = computed<OpsFacetGroup[]>(() => {
  const all = allViews.value
  const one = all.filter(v => shapeOf(v) === 'one').length
  const multi = all.filter(v => shapeOf(v) === 'multi').length
  const empty = all.length - one - multi
  return [
    {
      key: 'shape',
      label: '正文形态',
      options: [
        { value: '', label: '全部', count: all.length },
        { value: 'one', label: '单行命令', count: one, tone: 'info' as OpsTone },
        { value: 'multi', label: '多行脚本', count: multi, tone: 'brand' as OpsTone },
        { value: 'empty', label: '无正文', count: empty, tone: 'warn' as OpsTone },
      ],
    },
    {
      key: 'lines',
      label: '长度',
      options: [
        { value: '', label: '全部', count: all.length },
        ...buckets.value.map((b, i) => ({
          value: String(i),
          label: b.label,
          count: b.count,
        })),
      ],
    },
  ]
})

/** 长度档过滤值 */
const lineBand = ref('')

/** 分面模型 */
const facetModel = computed<Record<string, string>>(() => ({
  shape: shape.value,
  lines: lineBand.value,
}))

/** 看板列 */
const columns = [
  { key: 'one', label: '单行命令', tone: 'info' as OpsTone },
  { key: 'multi', label: '多行脚本', tone: 'brand' as OpsTone },
  { key: 'empty', label: '无正文', tone: 'warn' as OpsTone },
]

/* ==================== 交互 ==================== */

/**
 * 分面筛选变化。
 *
 * @param key   字段（shape / lines）
 * @param value 值
 */
function onFacet(key: string, value: string): void {
  if (key === 'shape') shape.value = value
  else if (key === 'lines') lineBand.value = value
}

/**
 * 长度档过滤。
 *
 * <p>分面栏只给档位序号，真实判定在展示行上：与 {@link lineBuckets} 的分档
 * 保持同一口径（1 / 2–3 / 4–10 / 10 以上）。</p>
 */
const bandedViews = computed(() => {
  const band = lineBand.value
  if (!band) return views.value
  const index = Number(band)
  return views.value.filter(v => {
    if (v.lines <= 0) return false
    if (index === 0) return v.lines === 1
    if (index === 1) return v.lines >= 2 && v.lines <= 3
    if (index === 2) return v.lines >= 4 && v.lines <= 10
    return v.lines > 10
  })
})

/** 最终展示行（形态 + 长度 + 关键字） */
const shownViews = computed(() => bandedViews.value)

/** 最终条目 */
const shownItems = computed<OpsItem[]>(() => shownViews.value.map(toItem))

/**
 * 控制栏筛选变化。
 *
 * @param key   字段
 * @param value 值
 */
function onFilterField(key: string, value: string): void {
  if (key === 'keyword') keyword.value = value
}

/** 清除全部条件 */
function clearFilters(): void {
  keyword.value = ''
  shape.value = ''
  lineBand.value = ''
}

/**
 * 由条目找展示行（详情栏按钮只拿到 OpsItem）
 *
 * @param item 条目
 */
function viewOf(item: OpsItem): SnippetView | null {
  return allViews.value.find(v => v.id === Number(item.id)) ?? null
}

/** 加载列表 */
async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await getSnippets()) ?? []
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

/**
 * 打开弹窗（不传则新增）
 *
 * @param view 展示行
 */
function openEditor(view?: SnippetView): void {
  editingId.value = view?.id ?? null
  formData.value = {
    msTerminalSnippetName: view?.name && view.name !== '未命名片段' ? view.name : '',
    msTerminalSnippetContent: view?.content ?? '',
    msTerminalSnippetRemark: view?.remark ?? '',
  }
  dialogVisible.value = true
}

/**
 * 详情栏编辑
 *
 * @param item 条目
 */
function onEditItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) openEditor(view)
}

/** 保存 */
async function save(): Promise<void> {
  if (!formData.value.msTerminalSnippetName.trim()) {
    message.warning('片段名称不能为空')
    return
  }
  try {
    const payload: TerminalSnippetPayload = {
      msTerminalSnippetName: formData.value.msTerminalSnippetName.trim(),
      msTerminalSnippetContent: formData.value.msTerminalSnippetContent ?? '',
      msTerminalSnippetRemark: formData.value.msTerminalSnippetRemark ?? '',
    }
    if (editingId.value) await apiUpdateSnippet(editingId.value, payload)
    else await apiSaveSnippet(payload)
    message.success('已保存')
    dialogVisible.value = false
    await load()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 删除
 *
 * @param view 展示行
 */
async function remove(view: SnippetView): Promise<void> {
  try {
    await message.confirm(`确认删除片段「${view.name}」？`, '删除')
  } catch {
    return
  }
  try {
    await apiDelSnippet(view.id)
    message.success('已删除')
    await load()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 详情栏删除
 *
 * @param item 条目
 */
function onRemoveItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) void remove(view)
}

onMounted(load)
</script>

<template>
  <OpsDesk
    v-model:mode="mode"
    title="片段管理"
    desc="常用终端命令片段：按命令内容找，而不只是按你当年起的名字找。"
    :modes="MODES"
    :items="shownItems"
    :facets="facets"
    :facet-model="facetModel"
    :filters="FILTER_FIELDS"
    :filter-model="filterModel"
    :columns="columns"
    :count-text="shownItems.length === stats.total ? `共 ${stats.total} 个片段` : `筛选出 ${shownItems.length} / ${stats.total} 个`"
    :loading="loading"
    :error="error"
    empty-text="还没有命令片段"
    empty-hint="点右上角「新增片段」把常用的命令存下来，之后在批量作业里可以直接插入。"
    @facet="onFacet"
    @filter="onFilterField"
    @refresh="load"
  >
    <template #actions>
      <button
        v-if="keyword || shape || lineBand"
        type="button"
        class="op-btn"
        @click="clearFilters"
      >
        清除筛选
      </button>
      <button type="button" class="op-btn is-primary" @click="openEditor()">新增片段</button>
    </template>

    <template #detail="{ item }">
      <button type="button" class="op-btn" @click="onEditItem(item)">编辑</button>
      <button type="button" class="op-btn is-bad" @click="onRemoveItem(item)">删除</button>
      <span class="op-dim" style="font-size: 11px">片段 #{{ item.id }}</span>
    </template>
  </OpsDesk>

  <!-- 新增 / 编辑 -->
  <ReDialog
    v-model="dialogVisible"
    :title="editingId ? '编辑片段' : '新增片段'"
    width="560"
    :height="420"
    confirm-text="保存"
    cancel-text="取消"
    :footer-hidden="false"
    @confirm="save"
    @cancel="dialogVisible = false"
  >
    <ReForm :model="formData" label-width="90px" label-position="right">
      <ReFormItem label="片段名称" required>
        <ReInput v-model="formData.msTerminalSnippetName" placeholder="例如：重启 Nginx" />
      </ReFormItem>
      <ReFormItem label="命令内容">
        <ReInput
          v-model="formData.msTerminalSnippetContent"
          type="textarea"
          :rows="7"
          placeholder="粘贴或输入要执行的命令，支持多行"
        />
      </ReFormItem>
      <ReFormItem label="备注">
        <ReInput v-model="formData.msTerminalSnippetRemark" placeholder="什么时候用它" />
      </ReFormItem>
    </ReForm>
  </ReDialog>
</template>

<style scoped lang="scss">
@use "../components/opsdesk/_ops-kit.scss";

.op-btn.is-primary {
  color: var(--el-color-primary, #5a4bd9);
  border-color: var(--el-color-primary-light-5, #b3a9fe);
  background: var(--el-color-primary-light-9, #f6f4ff);
  font-weight: 600;
}
</style>
