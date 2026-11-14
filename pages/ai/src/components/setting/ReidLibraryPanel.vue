<template>
  <!--
    重识别库管理（系统设置 → 底库 → 重识别库）

    ★ 与人脸底库**同源同构**：版式（页头 / 统计 / 导入区 / 列表区 / 批量条 / 底栏）与
      样式全部走 components/setting/library-panel.css，改一处三库同变。

    ★ 语义（2026-11-13 用户定稿）：**底库 = 自己导入的人**，不是观测自动落库。
      「观测」（识别页上传一帧监控画面）只回本次结果（叠框 / 命中统计），不写底库；
      底库里每一行都来自这里的「登记入库」，且**一次写入两套向量**：
      人脸特征（1:N「这是谁」）+ ReID 特征（跨帧「去过哪」）。
  -->
  <div class="lib-page">
    <!-- ── 页头 ─────────────────────────────────────────── -->
    <header class="lib-head">
      <div class="lib-head-text">
        <h2 class="lib-head-title">重识别库</h2>
        <p class="lib-head-sub">
          当前账号导入的重识别底库，一人一行；每行同时存人脸特征与 ReID 特征。
        </p>
      </div>
      <div class="lib-head-actions">
        <el-button :disabled="loading" @click="load">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button v-if="!available" @click="gotoModelConfig">
          <el-icon><Setting /></el-icon>配置模型
        </el-button>
        <el-button type="primary" :disabled="loading || !available" @click="openEnroll">
          <el-icon><Upload /></el-icon>登记入库
        </el-button>
      </div>
    </header>

    <!-- ── 能力未就绪：只提示，不挡列表（底库是存量数据，看不到比看到了更糟）── -->
    <el-alert
      v-if="!available"
      class="lib-alert"
      type="warning"
      show-icon
      :closable="false"
      :title="blockedTitle"
      :description="blockedDesc"
    />

    <!-- ── 统计（全库口径，不受筛选影响）────────────────── -->
      <section class="lib-stats">
        <div class="lib-stat">
          <el-icon class="lib-stat-icon is-primary"><UserFilled /></el-icon>
          <span class="lib-stat-label">已导入</span>
          <strong class="lib-stat-value">{{ items.length }}</strong>
        </div>
        <div class="lib-stat">
          <el-icon class="lib-stat-icon is-success"><Postcard /></el-icon>
          <span class="lib-stat-label">双特征齐全</span>
          <strong class="lib-stat-value">{{ statDual }}</strong>
        </div>
        <div class="lib-stat">
          <el-icon class="lib-stat-icon is-warning"><Warning /></el-icon>
          <span class="lib-stat-label">缺人脸特征</span>
          <strong class="lib-stat-value">{{ statNoFace }}</strong>
        </div>
        <div class="lib-stat">
          <el-icon class="lib-stat-icon is-info"><Files /></el-icon>
          <span class="lib-stat-label">分组</span>
          <strong class="lib-stat-value">{{ groupCount }}</strong>
        </div>
      </section>

      <!-- ── 导入区（与人脸底库同版式：拖放区 → 打开登记弹窗）── -->
      <section class="lib-upload">
        <div class="lib-drop" @click="openEnroll">
          <el-icon class="lib-drop-icon"><UploadFilled /></el-icon>
          <p class="lib-drop-main">点此导入新的重识别人员</p>
          <p class="lib-drop-sub">弹出登记表单，支持点击选择或把照片拖进表单</p>
        </div>
        <ul class="lib-tips">
          <li><el-icon><CircleCheck /></el-icon>一次写入人脸 + ReID 两套特征</li>
          <li><el-icon><CircleCheck /></el-icon>只收单人照，多脸会被拒绝</li>
          <li><el-icon><CircleCheck /></el-icon>观测不落库，库只放自己导入的人</li>
        </ul>
      </section>

      <!-- ── 列表区 ─────────────────────────────────────── -->
      <section class="lib-panel">
        <div class="lib-toolbar">
          <div class="lib-panel-title">
            人员列表
            <span class="lib-panel-count">共 {{ filtered.length }} 条</span>
          </div>

          <el-select
            v-model="group"
            class="lib-group"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入分组"
            title="分组是第一层隔离：不同分组各有一套向量库"
            @change="load"
          >
            <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
          </el-select>

          <el-input v-model="keyword" placeholder="按名称 / 记录名检索" clearable class="lib-search">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

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

        <!-- 网格 -->
        <div v-if="viewMode === 'grid'" v-loading="loading" class="lib-grid">
          <figure v-for="item in filtered" :key="item.id" class="lib-cell"
            :class="{ 'is-selected': selected.has(item.id) }">
            <div class="lib-thumb">
              <img v-if="item.thumbnail" :src="item.thumbnail" :alt="labelOf(item)" loading="lazy" />
              <div v-else class="rl-thumb-fallback">
                <el-icon :size="26"><UserFilled /></el-icon>
              </div>

              <span class="lib-check" @click.stop="toggleSelect(item)">
                <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
              </span>

              <span class="lib-badges">
                <span v-if="item.faceVectorId" class="lib-badge is-ok" title="人脸特征向量已写入（1:N 认得到）">人脸</span>
                <span v-else class="lib-badge is-warn" title="缺人脸特征向量：人脸识别管线检索不到本行">缺人脸</span>
                <span class="lib-badge is-dup" title="ReID 特征向量已写入（跨帧追得到）">ReID</span>
              </span>

              <div class="lib-actions">
                <button v-if="item.thumbnail" type="button" class="lib-act" title="查看大图"
                  @click.stop="preview(item)">
                  <el-icon><ZoomIn /></el-icon>
                </button>
                <button type="button" class="lib-act is-danger" title="删除" :disabled="busy"
                  @click.stop="removeOne(item)">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </div>

            <figcaption class="lib-meta">
              <span class="lib-name" :title="labelOf(item)">{{ labelOf(item) }}</span>
              <span class="lib-dim">{{ formatMeta(item) }}</span>
            </figcaption>
          </figure>

          <el-empty v-if="!loading && filtered.length === 0" class="lib-empty"
            description="还没有导入人员：点上方『登记入库』添加" />
        </div>

        <!-- 列表 -->
        <div v-else v-loading="loading" class="lib-list">
          <div v-for="item in filtered" :key="item.id" class="lib-row"
            :class="{ 'is-selected': selected.has(item.id) }">
            <span class="lib-check is-inline" @click.stop="toggleSelect(item)">
              <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
            </span>
            <img v-if="item.thumbnail" class="lib-row-thumb" :src="item.thumbnail" :alt="labelOf(item)"
              loading="lazy" @click="preview(item)" />
            <div v-else class="lib-row-thumb rl-thumb-fallback">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="lib-row-body">
              <span class="lib-name" :title="labelOf(item)">{{ labelOf(item) }}</span>
              <span class="lib-dim">{{ formatMeta(item) }}</span>
            </div>
            <span class="lib-badges is-inline">
              <span v-if="item.faceVectorId" class="lib-badge is-ok">人脸</span>
              <span v-else class="lib-badge is-warn">缺人脸</span>
              <span class="lib-badge is-dup">ReID</span>
            </span>
            <button v-if="item.thumbnail" type="button" class="lib-act is-onlight" title="查看大图"
              @click.stop="preview(item)">
              <el-icon><ZoomIn /></el-icon>
            </button>
            <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
              @click.stop="removeOne(item)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>

          <el-empty v-if="!loading && filtered.length === 0" description="还没有导入人员" />
        </div>
      </section>

      <!-- ── 批量条 ─────────────────────────────────────── -->
      <footer class="lib-batch" :class="{ 'is-visible': selected.size > 0 }">
        <span class="lib-batch-count">已选 {{ selected.size }} 条</span>
        <div class="lib-batch-actions">
          <el-button :disabled="busy" @click="clearSelection">取消选择</el-button>
          <el-button type="danger" :disabled="busy" @click="removeSelected">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </div>
      </footer>

      <!-- 底栏：把「库是导入的」这条口径写死在界面上，避免又被理解成观测落库 -->
      <div class="lib-foot">
        <span class="lib-foot-value">
          分组「{{ group }}」· 每行两套特征（人脸 + ReID）· 观测只出结果不写库
        </span>
      </div>

    <!-- ── 登记入库弹窗 ─────────────────────────────────── -->
    <ReDialog
      v-model="enrollVisible"
      title="登记入库"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      class="rl-enroll-dialog"
    >
      <div class="rl-enroll-body">
        <div class="lib-drop" :class="{ 'is-drag': false }" @click="pickEnrollImage">
          <img v-if="enrollPreview" class="rl-enroll-preview" :src="enrollPreview" alt="待登记人脸" />
          <template v-else>
            <el-icon class="lib-drop-icon"><Plus /></el-icon>
            <p class="lib-drop-main">点击选择单人脸照片</p>
            <p class="lib-drop-sub">底库一人一行，多人合影会被拒绝并要求裁剪</p>
          </template>
        </div>
        <el-form label-width="82px" class="rl-enroll-form">
          <el-form-item label="人员标识">
            <el-input v-model="enrollId" placeholder="如 staff-0001（两套特征共用）" />
          </el-form-item>
          <el-form-item label="展示名">
            <el-input v-model="enrollName" placeholder="留空用人员标识" />
          </el-form-item>
          <el-form-item label="分组">
            <el-input :model-value="group" disabled />
          </el-form-item>
          <el-form-item label="摄像头">
            <el-input v-model="enrollCamera" placeholder="非必填" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button :disabled="enrolling" @click="enrollVisible = false">取消</el-button>
        <el-button type="primary" :loading="enrolling" @click="submitEnroll">登记</el-button>
      </template>
    </ReDialog>

    <input ref="enrollInput" type="file" accept="image/*" class="lib-hidden" @change="onEnrollPicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@repo/core'
import ReDialog from '@repo/ui/re-dialog'
import { ElMessageBox } from 'element-plus'
import {
  CircleCheck, Delete, Files, Grid, Menu, Postcard, Refresh, Search, Select, Setting, Plus,
  Upload, UploadFilled, UserFilled, Warning, ZoomIn,
} from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useLibraryGroups } from '@/composables/useLibraryGroups'
import { useModelConfigStore } from '@/stores/modelConfig'

/**
 * 重识别库管理面板（设置中心「底库」分组）。
 *
 * <p><b>只做库，不做观测</b>：观测在「人脸重识别」页，结果只回本次请求；
 * 底库的每一行都来自本页的「登记入库」，一次写两套向量（人脸 + ReID）。</p>
 */

/** 底库一条人员记录。 */
interface ReidLibraryRow {
  /** 记录 ID（即向量标识） */
  id: string
  /** 所属分组 */
  group?: string | null
  /** 摄像头标识 */
  cameraId?: string | null
  /** 记录名 */
  name?: string | null
  /** 关联的人脸姓名 */
  faceName?: string | null
  /** 人脸特征向量 ID（空 = 缺人脸特征） */
  faceVectorId?: string | null
  /** 入库分流结论 */
  matchType?: 'FACE' | 'REID' | null
  /** 经纬度 */
  lat?: number | string | null
  lng?: number | string | null
  /** 缩略图（base64） */
  thumbnail?: string | null
  /** 登记时间 */
  createTime?: string | null
}

const router = useRouter()
const modelConfig = useModelConfigStore()

/** 记录列表。 */
const rows = ref<ReidLibraryRow[]>([])
/** 加载中。 */
const loading = ref(false)
/** 提交中。 */
const busy = ref(false)
/** 当前视图。 */
const viewMode = ref<'grid' | 'list'>('grid')
/** 检索词（本页内存过滤：底库接口不分页）。 */
const keyword = ref('')
/** 勾选集合（按记录 ID）。 */
const selected = ref<Set<string>>(new Set())

/** 分组状态与人脸底库同源。 */
const { group, groupOptions, loadGroups, rememberGroups } = useLibraryGroups('reid')

/** 列表数据（响应式别名，模板里沿用 items）。 */
const items = computed(() => rows.value)

/** 能力就绪：检测/特征模型都已配置。 */
const available = computed(() => modelConfig.faceReady && modelConfig.unregisteredConfigured.length === 0)

const blockedTitle = computed(() => {
  if (modelConfig.faceModelsError) return '重识别状态未知'
  if (modelConfig.faceMissing.length) return '人脸重识别未启用'
  if (modelConfig.unregisteredConfigured.length) return '人脸重识别未启用（模型未注册）'
  return '重识别配置尚未就绪'
})

const blockedDesc = computed(() => {
  if (modelConfig.faceModelsError) {
    return '人脸模型清单读取失败（接口异常），无法确认检测/特征模型是否可用。请查看服务端日志后刷新重试。'
  }
  if (modelConfig.faceMissing.length) {
    return '还需配置人脸检测模型 / 人脸特征模型。请到「系统设置 → 人脸重识别配置」中选择模型。'
  }
  if (modelConfig.unregisteredConfigured.length) {
    return '模型已填写，但后端注册清单里查不到（可能已停用、被删除或名称带 provider 前缀）。请重新选择可用模型。'
  }
  return '还没读到人脸模型配置（页面刚打开或设置接口暂时不可用）。刷新一次；仍不行就看服务端日志。'
})

/** 双特征齐全的条数。 */
const statDual = computed(() => rows.value.filter((r) => !!r.faceVectorId).length)
/** 缺人脸特征的条数。 */
const statNoFace = computed(() => rows.value.length - statDual.value)
/** 分组数。 */
const groupCount = computed(() => new Set(rows.value.map((r) => r.group || 'default')).size)

/** 关键词过滤。 */
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return rows.value
  return rows.value.filter((r) => `${r.name ?? ''} ${r.faceName ?? ''} ${r.cameraId ?? ''}`.toLowerCase().includes(k))
})

/** 展示名。 */
function labelOf(item: ReidLibraryRow) {
  return item.name || item.faceName || item.id
}

/** 元信息行：分组 · 摄像头 · 时间。 */
function formatMeta(item: ReidLibraryRow) {
  const parts = [item.group || 'default']
  if (item.cameraId) parts.push(item.cameraId)
  if (item.createTime) parts.push(String(item.createTime).replace('T', ' ').slice(0, 16))
  return parts.join(' · ')
}

/** 载入列表。 */
async function load() {
  loading.value = true
  try {
    const list = (await apiService.listReidLibrary({ group: group.value })) as unknown as ReidLibraryRow[]
    rows.value = Array.isArray(list) ? list : []
    rememberGroups(rows.value.map((it) => it.group))
    // 勾选态按新列表收敛，避免删完还留着已消失的 ID
    const ids = new Set(rows.value.map((r) => r.id))
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
  } catch (e) {
    message.error(`加载重识别库失败：${(e as Error)?.message ?? e}`)
    rows.value = []
  } finally {
    loading.value = false
  }
}

/** 勾选/取消。 */
function toggleSelect(item: ReidLibraryRow) {
  const next = new Set(selected.value)
  if (next.has(item.id)) next.delete(item.id)
  else next.add(item.id)
  selected.value = next
}

/** 清空勾选。 */
function clearSelection() {
  selected.value = new Set()
}

/** 查看大图。 */
function preview(item: ReidLibraryRow) {
  if (!item.thumbnail) return
  const w = window.open('', '_blank', 'width=720,height=560')
  if (!w) return
  w.document.write(
    `<title>${labelOf(item)}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh">`
    + `<img src="${item.thumbnail}" style="max-width:100%;max-height:100%;object-fit:contain" /></body>`,
  )
  w.document.close()
}

/** 删除一条。 */
async function removeOne(item: ReidLibraryRow) {
  const label = labelOf(item)
  try {
    await ElMessageBox.confirm(
      `确认删除「${label}」吗？人脸与 ReID 两套特征会一起删除，此动作不可恢复。`,
      '删除记录',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  busy.value = true
  try {
    await apiService.deleteReidLibrary(item.id, group.value)
    message.success('已删除')
    await load()
  } catch (e) {
    message.error(`删除失败：${(e as Error)?.message ?? e}`)
  } finally {
    busy.value = false
  }
}

/** 批量删除。 */
async function removeSelected() {
  const ids = [...selected.value]
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.length} 条记录吗？每条的两个人脸 / ReID 特征会一起删除。`,
      '批量删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  busy.value = true
  let failed = 0
  for (const id of ids) {
    try {
      await apiService.deleteReidLibrary(id, group.value)
    } catch {
      failed++
    }
  }
  busy.value = false
  failed ? message.warning(`部分删除失败（${failed} 条）`) : message.success(`已删除 ${ids.length} 条`)
  clearSelection()
  await load()
}

/** 去模型配置。 */
function gotoModelConfig() {
  router.push({ name: 'SystemSettings', params: { tab: 'reid-config' } })
}

/* ==================== 登记入库 ==================== */

/** 弹窗显隐。 */
const enrollVisible = ref(false)
/** 提交中。 */
const enrolling = ref(false)
/** 人员标识。 */
const enrollId = ref('')
/** 展示名。 */
const enrollName = ref('')
/** 摄像头。 */
const enrollCamera = ref('')
/** 选中的图片。 */
const enrollFile = ref<File | null>(null)
/** 预览地址（data URL）。 */
const enrollPreview = ref('')
/** 隐藏的文件选择器。 */
const enrollInput = ref<HTMLInputElement | null>(null)

/** 打开登记弹窗并清空上次输入。 */
function openEnroll() {
  enrollId.value = ''
  enrollName.value = ''
  enrollCamera.value = ''
  enrollFile.value = null
  enrollPreview.value = ''
  enrollVisible.value = true
}

/** 触发原生文件选择。 */
function pickEnrollImage() {
  enrollInput.value?.click()
}

/** 选图后读成 data URL 预览。 */
function onEnrollPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  enrollFile.value = file
  const reader = new FileReader()
  reader.onload = () => { enrollPreview.value = String(reader.result ?? '') }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

/** 提交登记：一次写两套向量，多脸由后端拒绝。 */
async function submitEnroll() {
  const id = enrollId.value.trim()
  if (!id) {
    message.warning('请填写人员标识')
    return
  }
  if (!enrollFile.value) {
    message.warning('请选择一张单人脸照片')
    return
  }
  enrolling.value = true
  try {
    const meta: Record<string, unknown> = {}
    const name = enrollName.value.trim()
    if (name) meta.name = name
    const cam = enrollCamera.value.trim()
    if (cam) meta.cameraId = cam
    await apiService.enrollReid(enrollFile.value, id, meta, enrollFile.value.name || 'reid-enroll.png', group.value)
    message.success(`已登记「${name || id}」`)
    enrollVisible.value = false
    await load()
  } catch (e) {
    message.error(`${(e as Error)?.message ?? e}`)
  } finally {
    enrolling.value = false
  }
}

onMounted(async () => {
  await loadGroups()
  void load()
})
</script>

<style scoped src="./library-panel.css"></style>

<style scoped>
/* 无图时的占位：与图像底库的缩略图兜底同一套观感 */
.rl-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.lib-row-thumb.rl-thumb-fallback {
  height: 40px;
  border-radius: 6px;
}

.rl-enroll-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rl-enroll-preview {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 8px;
}
</style>
