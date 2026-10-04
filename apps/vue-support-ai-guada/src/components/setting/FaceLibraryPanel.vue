<template>
  <!--
    人脸底库管理（系统设置 → 底库 → 人脸底库）

    版面与「图像底库」保持一致：页头 + 统计卡 + 拖放区 + 列表区（工具栏 / 网格 / 列表 / 翻页）
    + 批量操作条 + 底栏。样式与图像底库**同源**（components/setting/library-panel.css），
    改动样式只改那一份，两个面板一起生效，不会漂移。

    与图像底库的差异只有「业务动作」：
      · 图像底库的拖放区直接把图上传入库；人脸登记需要档案字段（姓名/身份证等，身份证为必填），
        所以拖放区改为**打开登记弹窗**，视觉与交互形态保持与图像底库一致。
      · 状态筛选按「有缩略图 / 缺缩略图」分（人脸缩略图只存在登记它的浏览器里；图像底库按 hasOriginal）。

    数据来源：服务端 GET /v2/face/list 是**权威**（跨浏览器/账号以它为准），
    本地登记簿只补服务端不存的缩略图 thumb；按 id 合并，服务端优先。
  -->
  <div class="lib-page">
    <!-- ── 页头 ───────────────────────────────────────────── -->
    <header class="lib-head">
      <div class="lib-head-text">
        <h2 class="lib-head-title">人脸底库</h2>
        <p class="lib-head-sub">当前账号的人脸底库，登记后可用于 1:N 人脸识别与检索</p>
      </div>
      <div class="lib-head-actions">
        <el-button :disabled="loading" @click="load">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="primary" :disabled="loading" @click="openEnroll">
          <el-icon><Upload /></el-icon>人脸登记入库
        </el-button>
      </div>
    </header>

    <!-- ── 统计卡 ─────────────────────────────────────────── -->
    <section class="lib-stats">
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-primary"><UserFilled /></el-icon>
        <span class="lib-stat-label">已登记</span>
        <strong class="lib-stat-value">{{ rows.length }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-success"><Picture /></el-icon>
        <span class="lib-stat-label">有缩略图</span>
        <strong class="lib-stat-value">{{ withThumb }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-warning"><Warning /></el-icon>
        <span class="lib-stat-label">仅无缩略图</span>
        <strong class="lib-stat-value">{{ rows.length - withThumb }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-info"><Postcard /></el-icon>
        <span class="lib-stat-label">身份证已填</span>
        <strong class="lib-stat-value">{{ withIdCard }}</strong>
      </div>
    </section>

    <!-- 服务端有条目、本地无缩略图：说清原因，别让人以为底库丢了 -->
    <el-alert
      v-if="rows.length - withThumb > 0"
      class="fl-alert"
      type="info"
      :closable="false"
      show-icon
      :title="`有 ${rows.length - withThumb} 条在本浏览器没有缩略图`"
      description="缩略图只存在登记它的那个浏览器里（后端不存）。底库条目本身以服务端为准，1:N 识别不受影响。"
    />

    <!-- ── 登记区（与图像底库的拖放区同版式）──────────────── -->
    <section class="lib-upload">
      <div
        class="lib-drop"
        :class="{ 'is-drag': false }"
        @click="openEnroll"
      >
        <el-icon class="lib-drop-icon"><UploadFilled /></el-icon>
        <p class="lib-drop-main">点此登记新人脸</p>
        <p class="lib-drop-sub">弹出登记表单，支持点击选择或把照片拖进表单</p>
      </div>
      <ul class="lib-tips">
        <li><el-icon><CircleCheck /></el-icon>自动检测并提取特征向量</li>
        <li><el-icon><CircleCheck /></el-icon>未检出人脸的图片不会入库</li>
        <li><el-icon><CircleCheck /></el-icon>身份证号必填（展示时脱敏）</li>
      </ul>
    </section>

    <FaceEnrollDialog v-model="enrollVisible" :record="editItem" @enrolled="load" />

    <!-- ── 列表区 ─────────────────────────────────────────── -->
    <section class="lib-panel">
      <div class="lib-toolbar">
        <div class="lib-panel-title">
          人脸列表
          <span class="lib-panel-count">共 {{ total }} 条</span>
        </div>

        <el-input v-model="keyword" placeholder="按姓名/身份证检索" clearable class="lib-search">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="statusFilter" class="lib-filter">
          <el-option label="全部状态" value="all" />
          <el-option label="有缩略图" value="thumb" />
          <el-option label="无缩略图" value="noThumb" />
        </el-select>

        <div class="lib-view-toggle">
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'grid' }"
            title="网格视图" @click="viewMode = 'grid'">
            <el-icon><Grid /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图" @click="viewMode = 'list'">
            <el-icon><Menu /></el-icon>
          </button>
        </div>
      </div>

      <!-- 网格视图：viewerjs 挂在本容器上，点任意图即可缩放/左右切换 -->
      <div v-if="viewMode === 'grid'" ref="gridRef" v-loading="loading" class="lib-grid">
        <figure v-for="item in visibleItems" :key="item.id" class="lib-cell"
          :class="{ 'is-selected': selected.has(item.id) }">
          <div class="lib-thumb">
            <img v-if="item.thumb" :src="item.thumb" :alt="item.name" loading="lazy" />
            <div v-else class="fl-thumb-fallback"><el-icon :size="26"><UserFilled /></el-icon></div>

            <span class="lib-check" @click.stop="toggleSelect(item)">
              <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
            </span>

            <span class="lib-badges">
              <span v-if="item.thumb" class="lib-badge is-ok">有缩略图</span>
              <span v-else class="lib-badge is-warn">无缩略图</span>
            </span>

            <div class="lib-actions">
              <button type="button" class="lib-act" title="编辑信息" @click.stop="openEdit(item)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="lib-act" title="查看大图" @click.stop="preview(item)">
                <el-icon><ZoomIn /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger" title="删除" :disabled="busy"
                @click.stop="removeOne(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>

          <figcaption class="lib-meta">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </figcaption>
        </figure>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸"
          class="lib-empty" />
      </div>

      <!-- 列表视图 -->
      <div v-else v-loading="loading" class="lib-list">
        <div v-for="item in visibleItems" :key="item.id" class="lib-row"
          :class="{ 'is-selected': selected.has(item.id) }">
          <span class="lib-check is-inline" @click.stop="toggleSelect(item)">
            <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
          </span>
          <img v-if="item.thumb" class="lib-row-thumb" :src="item.thumb" :alt="item.name" loading="lazy"
            @click="preview(item)" />
          <div v-else class="lib-row-thumb fl-thumb-fallback" @click="preview(item)">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="lib-row-body">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </div>
          <span class="lib-badges is-inline">
            <span v-if="item.thumb" class="lib-badge is-ok">有缩略图</span>
            <span v-else class="lib-badge is-warn">无缩略图</span>
          </span>
          <button type="button" class="lib-act is-onlight" title="编辑信息" @click.stop="openEdit(item)">
            <el-icon><EditPen /></el-icon>
          </button>
          <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
            @click.stop="removeOne(item)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸" />
      </div>

      <!-- 翻页 -->
      <div v-if="total > pageSize" class="lib-pager">
        <el-button :disabled="page <= 1 || loading" @click="page--">上一页</el-button>
        <span class="lib-pager-text">{{ page }} / {{ pageCount }}</span>
        <el-button :disabled="page >= pageCount || loading" @click="page++">下一页</el-button>
      </div>
    </section>

    <!-- ── 批量操作条 ─────────────────────────────────────── -->
    <footer class="lib-batch" :class="{ 'is-visible': selected.size > 0 }">
      <span class="lib-batch-count">已选 {{ selected.size }} 条</span>
      <div class="lib-batch-actions">
        <el-button :disabled="busy" @click="clearSelection">取消选择</el-button>
        <el-button type="danger" :disabled="busy" @click="removeSelected">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
    </footer>

    <!-- 底栏：把当前生效的识别参数亮出来，排查「搜不到」时先看这两个值 -->
    <div class="lib-foot">
      人脸检测模型：{{ detectorModel || '未配置' }} · 特征模型：{{ featureModel || '未配置' }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 人脸底库管理面板。
 *
 * <p>版面与 {@link ImageLibraryPanel} 同源（共用 `library-panel.css`），
 * 差别只在业务动作：图像底库的拖放区直接上传入库，人脸登记需要档案字段
 * （身份证已改为必填），故拖放区改为打开登记弹窗。</p>
 *
 * <p>数据：服务端 `GET /v2/face/list` 权威（每条 `{id, metadata}`），
 * 本地登记簿只补服务端不存的缩略图 `thumb`，按 id 合并、字段服务端优先。</p>
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck, Delete, EditPen, Grid, Menu, Picture, Postcard, Refresh, Search, Select, Upload,
  UploadFilled, UserFilled, Warning, ZoomIn,
} from '@element-plus/icons-vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, ageBucket, maskIdCard, type FaceRecord } from '@/composables/useFaceRegistry'
import FaceEnrollDialog from '../management/FaceEnrollDialog.vue'

/** 合并后的展示行 */
interface Row {
  id: string
  name: string
  age: number | null
  gender: string
  hair: string
  idCard: string
  photogenic: number
  note: string
  thumb: string
}

const loading = ref(false)
const busy = ref(false)
const enrollVisible = ref(false)
/** 正在编辑的行；null = 新增登记模式 */
const editItem = ref<FaceRecord | null>(null)
const keyword = ref('')
const statusFilter = ref<'all' | 'thumb' | 'noThumb'>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const page = ref(1)
const pageSize = 24
const selected = ref<Set<string>>(new Set())
const serverItems = ref<Array<Record<string, unknown>>>([])
const detectorModel = ref('')
const featureModel = ref('')
const registry = useFaceRegistry()
const gridRef = ref<HTMLElement | null>(null)
let viewer: InstanceType<typeof Viewer> | null = null

const rows = computed<Row[]>(() =>
  serverItems.value.map((s) => {
    const id = String(s.id ?? '')
    const meta = (s.metadata && typeof s.metadata === 'object' ? s.metadata : {}) as Record<string, unknown>
    const local = registry.byId(id)
    const pick = (k: string): unknown => (meta[k] != null && meta[k] !== '' ? meta[k] : (local as any)?.[k])
    const ageRaw = pick('age')
    const photoRaw = pick('photogenic')
    return {
      id,
      name: String(pick('name') ?? pick('label') ?? ''),
      age: typeof ageRaw === 'number' ? ageRaw : ageRaw == null || ageRaw === '' ? null : Number(ageRaw),
      gender: String(pick('gender') ?? ''),
      hair: String(pick('hair') ?? ''),
      idCard: String(pick('idCard') ?? ''),
      photogenic: typeof photoRaw === 'number' ? photoRaw : photoRaw == null || photoRaw === '' ? 3 : Number(photoRaw),
      note: String(pick('note') ?? ''),
      thumb: local?.thumb ?? '',
    }
  }),
)

const withThumb = computed(() => rows.value.filter((r) => !!r.thumb).length)
const withIdCard = computed(() => rows.value.filter((r) => !!r.idCard.trim()).length)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (statusFilter.value === 'thumb' && !r.thumb) return false
    if (statusFilter.value === 'noThumb' && r.thumb) return false
    if (!kw) return true
    return (
      r.name.toLowerCase().includes(kw) ||
      r.idCard.toLowerCase().includes(kw) ||
      r.id.toLowerCase().includes(kw)
    )
  })
})
const total = computed(() => filtered.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const visibleItems = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([keyword, statusFilter, viewMode], () => { page.value = 1 })

/** 元信息一行：年龄段 · 性别 · 发型 · 身份证(脱敏) */
function formatMeta(item: Row): string {
  const parts = [ageBucket(item.age), item.gender || '未知']
  if (item.hair) parts.push(item.hair)
  const id = maskIdCard(item.idCard)
  if (id) parts.push(id)
  return parts.join(' · ')
}

async function load() {
  loading.value = true
  try {
    const { items } = await apiService.listFaces()
    serverItems.value = items as Array<Record<string, unknown>>
    // 底栏显示当前生效的模型（读 face 分组配置，失败不阻断列表）
    try {
      const s = (await apiService.getFaceSettings()) as Record<string, unknown>
      detectorModel.value = String(s.detector_model ?? '')
      featureModel.value = String(s.feature_model ?? '')
    } catch { /* 配置读不到不影响底库列表 */ }
    await mountViewer()
  } catch (e: any) {
    ElMessage.error('加载人脸底库失败：' + (e?.message ?? e))
  } finally {
    loading.value = false
  }
}

/** viewerjs 挂到网格容器；网格重渲染后需要重建 */
async function mountViewer() {
  await nextTick()
  viewer?.destroy()
  viewer = null
  if (gridRef.value) {
    viewer = new Viewer(gridRef.value, { navbar: false, toolbar: true, title: false })
  }
}

function openEnroll() {
  editItem.value = null
  enrollVisible.value = true
}

/**
 * 打开「编辑信息」：把当前行转成 FaceEnrollDialog 需要的 record 形状。
 *
 * <p>编辑只改档案字段，不重跑检测 —— 所以不需要照片在本地。</p>
 *
 * @param item 列表行
 */
function openEdit(item: Row) {
  editItem.value = {
    id: item.id,
    name: item.name,
    age: item.age,
    gender: item.gender,
    hair: item.hair,
    idCard: item.idCard,
    photogenic: item.photogenic,
    note: item.note,
    thumb: item.thumb,
    enrolledAt: 0,
  }
  enrollVisible.value = true
}

function toggleSelect(item: Row) {
  const s = selected.value
  if (s.has(item.id)) s.delete(item.id)
  else s.add(item.id)
  // Set 是浅响应：换一个实例触发更新
  selected.value = new Set(s)
}

function clearSelection() {
  selected.value = new Set()
}

function preview(item: Row) {
  if (viewer && item.thumb) {
    const idx = visibleItems.value.findIndex((r) => r.id === item.id)
    if (idx >= 0) viewer.view(idx)
    return
  }
  // 列表视图 / 无缩略图：viewerjs 未挂载时，直接提示
  if (!item.thumb) ElMessage.info('该条在本浏览器没有缩略图')
}

/**
 * 删除一条：先删服务端，成功后再清本地缩略图。
 *
 * <p>顺序不能反 —— 先清本地再删服务端，一旦服务端失败，
 * 会留下「列表里有、永远没头像」的条目。</p>
 */
async function removeOne(item: Row) {
  const label = item.name || item.id
  try {
    await ElMessageBox.confirm(
      `确定把「${label}」从人脸底库删除？删除后不再参与 1:N 识别，且无法恢复。`,
      '删除人脸',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch { return }
  busy.value = true
  try {
    const ok = await apiService.deleteFace(item.id)
    if (!ok) { ElMessage.error('删除失败：底库未确认删除'); return }
    registry.remove(item.id)
    selected.value.delete(item.id)
    selected.value = new Set(selected.value)
    ElMessage.success(`已删除：${label}`)
    await load()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  } finally {
    busy.value = false
  }
}

async function removeSelected() {
  const ids = [...selected.value]
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条人脸？删除后无法恢复。`, '批量删除', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch { return }
  busy.value = true
  let okCount = 0
  try {
    for (const id of ids) {
      try {
        if (await apiService.deleteFace(id)) { registry.remove(id); okCount++ }
      } catch { /* 单条失败继续，最后统一报数 */ }
    }
    ElMessage[okCount === ids.length ? 'success' : 'warning'](`已删除 ${okCount}/${ids.length} 条`)
    clearSelection()
    await load()
  } finally {
    busy.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => { viewer?.destroy(); viewer = null })
</script>

<style scoped src="./library-panel.css"></style>

<style scoped>
/* 仅有的一处人脸专有样式：无缩略图时的占位（图像底库恒有图，不需要） */
.fl-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}

.fl-alert {
  margin: 0;
}
</style>
