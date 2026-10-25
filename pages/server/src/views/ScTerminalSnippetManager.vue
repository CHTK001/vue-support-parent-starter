<script setup lang="ts">
/**
 * 片段管理 —— 编排层
 *
 * <p>重构前这一页只能看到「编号 / 名称 / 备注」三列，命令正文一个字都没有；
 * 而片段这个概念的全部内容就是那段命令。同一份数据在四个方向里都会把正文摊出来，
 * 区别只是摊在哪里：卡片上、表格的一列里、右栏里、还是图表下的紧凑行里。</p>
 *
 * <p>为什么没有「节奏」方向：这个方向的画布是时间轴，前提是数据本身有起止时刻。
 * 片段没有生命周期，硬画一条轴只会得到一排长度相同的装饰条。少一个不适用的方向，
 * 比多一个骗人的方向好。</p>
 *
 * <p>默认方向选「卡片墙」：片段是「一段可读的内容」，而不是「一行可扫的记录」。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
import { usePageVariant } from '@repo/ui/components/RePageKit/usePageVariant'
import {
  ReCanvasCards,
  ReCanvasSplit,
  ReCanvasTable,
  ReCanvasTelemetry,
  RePageStage,
} from '@repo/ui/components/RePageKit'
import type { CanvasColumn, CanvasGroup, PageVariantId, TabItem } from '@repo/ui/components/RePageKit'
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

/** 后端原样行 */
const rows = ref<SnippetRow[]>([])

/** 加载态 */
const loading = ref(false)

/** 筛选模型：键与舞台声明的 FilterField.key 对应 */
const filters = reactive<Record<string, string>>({ keyword: '' })

/** 新增 / 编辑弹窗 */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<TerminalSnippetPayload>({
  msTerminalSnippetName: '',
  msTerminalSnippetContent: '',
  msTerminalSnippetRemark: '',
})

/** 档案柜方向的选中项 */
const pickedId = ref<number | null>(null)

/** 开放的方向：节奏不适用于没有起止时刻的数据 */
const ALLOWED: PageVariantId[] = ['wall', 'console', 'dossier', 'instrument']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.snippets',
  allowed: ALLOWED,
})

/** 全量展示行 */
const allViews = computed(() => toSnippetViews(rows.value))

/** 已筛选的展示行 */
const views = computed(() => filterSnippets(allViews.value, filters.keyword ?? ''))

/** 统计（全量口径） */
const stats = computed(() => snippetStats(allViews.value))

/** 行数分布（全量口径） */
const buckets = computed(() => lineBuckets(allViews.value))

/** 分布图的峰值，用于归一柱高 */
const bucketPeak = computed(() => Math.max(1, ...buckets.value.map(b => b.count)))

/** 舞台筛选项 */
const stageFilters = [
  { key: 'keyword', kind: 'search' as const, placeholder: '搜索名称 / 命令内容 / 备注', width: 260 },
]

/** 无分段（片段没有状态） */
const stageTabs: TabItem[] = []

/** 遥测 */
const teleCells = computed(() => [
  { label: '片段总数', value: stats.value.total },
  { label: '有正文', value: stats.value.withContent },
  { label: '平均行数', value: stats.value.avgLines },
  { label: '最长片段', value: `${stats.value.maxLines} 行` },
])

/**
 * 工单台列定义
 *
 * <p>正文列拿到 2fr：它是这一页的主角，其余列都是它的注脚。</p>
 */
const consoleCols: CanvasColumn[] = [
  { key: 'name', label: '片段名称', width: 'minmax(0, 1.1fr)' },
  { key: 'content', label: '命令内容', width: 'minmax(0, 2fr)' },
  { key: 'lines', label: '行数', width: '64px', align: 'right' },
]

/** 仪表方向的紧凑列（去掉备注与行数，只留「找得到」这件事） */
const instrumentCols: CanvasColumn[] = [
  { key: 'name', label: '片段名称', width: 'minmax(0, 1fr)' },
  { key: 'content', label: '命令内容', width: 'minmax(0, 1.8fr)' },
  { key: 'lines', label: '行数', width: '60px', align: 'right' },
]

/** 档案柜分组：单行命令与脚本片段的用法完全不同，先分开 */
const groups = computed<CanvasGroup[]>(() => [
  { key: 'one', label: '单行命令', rows: views.value.filter(v => v.lines <= 1) as unknown as CanvasGroup['rows'] },
  { key: 'multi', label: '脚本片段', rows: views.value.filter(v => v.lines > 1) as unknown as CanvasGroup['rows'] },
])

/** 档案柜当前详情 */
const picked = computed(() => views.value.find(v => v.id === pickedId.value) ?? views.value[0] ?? null)

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/**
 * 舞台筛选变化
 *
 * @param key   字段
 * @param value 值
 */
function onFilter(key: string, value: string): void {
  filters[key] = value
}

/** 加载列表 */
async function load(): Promise<void> {
  loading.value = true
  try {
    rows.value = (await getSnippets()) ?? []
  } catch (e) {
    message.error((e as Error).message)
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

onMounted(load)
</script>

<template>
  <RePageStage
    :variant="variant"
    title="片段管理"
    desc="常用终端命令片段：按命令内容找，而不只是按你当年起的名字找。"
    :variant-items="items"
    :dock-visible="dockVisible"
    :tabs="stageTabs"
    :filters="stageFilters"
    :filter-model="filters"
    :count-text="views.length === stats.total ? `共 ${stats.total} 个片段` : `筛选出 ${views.length} / ${stats.total} 个`"
    :loading="loading"
    refresh-tip="刷新片段列表"
    @update:variant="setVariant"
    @filter="onFilter"
    @refresh="load"
  >
    <template #head-actions>
      <ReButton type="primary" icon="Plus" @click="openEditor()">新增片段</ReButton>
    </template>

    <!-- ==================== 卡片墙：正文直接读 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="views as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="248"
        clickable
        :loading="loading"
        empty-text="还没有命令片段"
        empty-hint="点右上角「新增片段」把常用的命令存下来，之后在批量作业里可以直接插入。"
        @row-click="(r) => openEditor(r as unknown as SnippetView)"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ (row as unknown as SnippetView).name }}</span>
            <span class="pk-pill">{{ (row as unknown as SnippetView).lines }} 行</span>
          </header>

          <div v-if="!(row as unknown as SnippetView).empty" class="pk-card__payload">{{ (row as unknown as SnippetView).content }}</div>
          <div v-else class="card__no-content">这条片段还没有正文</div>

          <footer class="pk-card__foot">
            <span class="pk-ellipsis">{{ (row as unknown as SnippetView).remark || '无备注' }}</span>
            <span class="card__ops">
              <button type="button" class="pk-link" @click.stop="openEditor(row as unknown as SnippetView)">编辑</button>
              <button type="button" class="pk-link pk-link--danger" @click.stop="remove(row as unknown as SnippetView)">删除</button>
            </span>
          </footer>
        </template>
      </ReCanvasCards>
    </template>

    <!-- ==================== 工单台：一屏尽量多的片段 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有命令片段"
        empty-hint="点右上角「新增片段」创建第一条。"
        @row-click="(r) => openEditor(r as unknown as SnippetView)"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as SnippetView).name }}</div>
          <div class="pk-sub pk-ellipsis">{{ (row as unknown as SnippetView).remark || '无备注' }}</div>
        </template>
        <template #cell-content="{ row }">
          <span
            v-if="!(row as unknown as SnippetView).empty"
            class="pk-mono pk-ellipsis cmd-ellipsis"
          >{{ (row as unknown as SnippetView).firstLine }}</span>
          <span v-else class="pk-faint">（无正文）</span>
        </template>
        <template #cell-lines="{ row }">
          <span class="pk-num pk-dim">{{ (row as unknown as SnippetView).lines }}</span>
        </template>
        <template #row-actions="{ row }">
          <button type="button" class="pk-link" @click="openEditor(row as unknown as SnippetView)">编辑</button>
          <button type="button" class="pk-link pk-link--danger" @click="remove(row as unknown as SnippetView)">删除</button>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 仪表：先看这些片段是什么形状 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">片段长度分布</span>
          <span class="dist__note">按正文非空行数分档 · 一眼看出这里是「一堆单行命令」还是「几段脚本」</span>
        </div>
        <div class="dist__bars">
          <div v-for="b in buckets" :key="b.label" class="dist__col">
            <span class="dist__val">{{ b.count || '' }}</span>
            <span
              class="dist__bar"
              :style="{ height: `${b.count ? Math.max((b.count / bucketPeak) * 52, 3) : 0}px` }"
            />
            <span class="dist__label">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="instrumentCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有命令片段"
        @row-click="(r) => openEditor(r as unknown as SnippetView)"
      >
        <template #cell-name="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as SnippetView).name }}</span>
        </template>
        <template #cell-content="{ row }">
          <span
            v-if="!(row as unknown as SnippetView).empty"
            class="pk-mono pk-ellipsis cmd-ellipsis"
          >{{ (row as unknown as SnippetView).firstLine }}</span>
          <span v-else class="pk-faint">（无正文）</span>
        </template>
        <template #cell-lines="{ row }">
          <span class="pk-num pk-dim">{{ (row as unknown as SnippetView).lines }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏找，右栏读全文 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="views as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="236"
        :loading="loading"
        empty-text="没有匹配的片段"
        empty-hint="清掉搜索词试试，搜索会同时匹配名称、命令内容和备注。"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title pk-ellipsis">{{ (row as unknown as SnippetView).name }}</span>
          <span class="pk-rail__meta">
            <span class="pk-num">{{ (row as unknown as SnippetView).lines }} 行</span>
            <span v-if="(row as unknown as SnippetView).remark" class="pk-ellipsis">· {{ (row as unknown as SnippetView).remark }}</span>
          </span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ (row as unknown as SnippetView).name }}</div>
            <div class="pk-sub">
              {{ (row as unknown as SnippetView).lines }} 行 · {{ (row as unknown as SnippetView).chars }} 字符
            </div>
          </div>
        </template>

        <template #detail="{ row }">
          <pre v-if="!(row as unknown as SnippetView).empty" class="detail__code">{{ (row as unknown as SnippetView).content }}</pre>
          <div v-else class="pk-empty" style="padding: 20px 0">
            <span>这条片段没有正文</span>
            <span class="pk-empty__hint">只有名称与备注，插入到终端里不会有任何动作。</span>
          </div>
          <div class="pk-kv">
            <span class="pk-kv__label">备注</span>
            <span class="pk-kv__value">{{ (row as unknown as SnippetView).remark || '—' }}</span>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <ReButton @click="openEditor(row as unknown as SnippetView)">编辑</ReButton>
          <ReButton type="danger" @click="remove(row as unknown as SnippetView)">删除</ReButton>
        </template>
      </ReCanvasSplit>
    </template>

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
  </RePageStage>
</template>

<style scoped>
/* 表格里的单行命令：等宽 + 单行省略，悬停由 title 兜底（整行可点进编辑看全文） */
.cmd-ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 卡片里没有正文时的占位：不能空着，否则卡片看上去像加载失败 */
.card__no-content {
  padding: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  border-left: 2px solid var(--el-border-color);
  border-radius: var(--el-radius-xs, 4px);
}

.card__ops {
  display: inline-flex;
  gap: 10px;
  flex: none;
}

/* ===== 长度分布图 ===== */
.dist {
  flex: none;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dist__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.dist__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dist__note {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dist__bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding-top: 14px;
}

.dist__col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.dist__val {
  height: 13px;
  font-size: 10px;
  line-height: 13px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.dist__bar {
  width: 100%;
  max-width: 52px;
  background: var(--el-color-primary);
  border-radius: 2px 2px 0 0;
  transition: height var(--el-transition-duration-fast, 0.2s);
}

.dist__label {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ===== 档案柜右栏 ===== */
.detail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 命令全文：保留换行与缩进，长行横向滚动而不是折行
   （折行会把 `&&` 与参数断在不同行，读起来像两条命令） */
.detail__code {
  margin: 0;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  overflow: auto;
  white-space: pre;
  tab-size: 2;
}

@media (prefers-reduced-motion: reduce) {
  .dist__bar {
    transition: none;
  }
}
</style>
