<template>
  <div class="reid-lib">
    <div class="reid-lib-head">
      <div>
        <h3 class="reid-lib-title">重识别库</h3>
        <p class="reid-lib-desc">
          每次观测一行记录，跨帧轨迹由这些记录按轨迹 ID 汇聚而来。删掉一行等于把那次观测从轨迹中移除。
        </p>
      </div>
      <div class="reid-lib-actions">
        <!--
          登记入库：底库层的唯一写入口（识别页的「观测并入库」是识别入口，允许任意图逐脸成行）。
          底库一行对应一个人，所以这里只收单人图，多脸由后端拒绝并提示裁剪。
        -->
        <el-button type="primary" class="reid-lib-enroll" @click="openEnroll">
          <el-icon><Plus /></el-icon>登记入库
        </el-button>
        <!--
          分组筛选：分组是第一层隔离（每组一套轨迹库），本面板只在当前分组内查看/删除。
          allow-create 与识别页一致：允许直接敲一个还没数据的分组名。
        -->
        <el-select
          v-model="group"
          class="reid-lib-group"
          filterable
          allow-create
          default-first-option
          placeholder="选择或输入分组"
          title="分组是第一层隔离：不同分组各有一套轨迹库"
          @change="load"
        >
          <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
        </el-select>
        <el-button :disabled="loading" @click="load">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button :disabled="loading || !items.length" type="danger" plain @click="clearAll">
          <el-icon><Delete /></el-icon>清空
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!items.length && !loading"
      type="info"
      show-icon
      :closable="false"
      title="重识别库为空"
      description="到「人脸重识别」页上传一帧监控画面，观测记录会自动落库。"
    />

    <ReTable
      v-else
      :data="items"
      :columns="tableColumns"
      :loading="loading"
      size="small"
      stripe
      :border="false"
      empty-text="暂无观测记录"
      :layout-table="{ minHeight: 0 }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #group="{ row }">
        <span>{{ row.group || 'default' }}</span>
      </template>
      <template #faceName="{ row }">
        <span v-if="row.faceName">{{ row.faceName }}</span>
        <span v-else class="reid-lib-muted">未关联</span>
      </template>
      <!--
        特征库：一条底库记录同时存人脸特征与 ReID 特征（两个特征值），
        这里标出这条记录是以哪套特征登记的 —— 检索时走的是哪条管线。
      -->
      <template #feature="{ row }">
        <el-tag :type="row.matchType === 'FACE' ? 'success' : 'info'" size="small" effect="plain">
          {{ row.matchType === 'FACE' ? '人脸特征' : 'ReID 特征' }}
        </el-tag>
      </template>
      <template #latlng="{ row }">
        <span v-if="row.lat != null && row.lng != null">{{ row.lat }}, {{ row.lng }}</span>
        <span v-else class="reid-lib-muted">未填写</span>
      </template>
      <template #createTime="{ row }">{{ formatTime(row.createTime) }}</template>
      <template #actions="{ row }">
        <el-button link type="danger" @click="remove(row)">删除</el-button>
      </template>
    </ReTable>

    <!--
      登记入库弹窗。底库入口的唯一写入口：
      只收单人图，多脸由后端拒绝并回「请裁剪到只含目标人脸后重试」，前端原样转述。
    -->
    <ReDialog
      v-model="enrollVisible"
      title="登记入库"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      class="reid-enroll-dialog"
    >
      <div class="reid-enroll-body">
        <div class="reid-enroll-pick">
          <div class="reid-enroll-preview" :class="{ 'is-empty': !enrollPreview }" @click="pickEnrollImage">
            <img v-if="enrollPreview" :src="enrollPreview" alt="待登记人脸" />
            <div v-else class="reid-enroll-placeholder">
              <el-icon :size="26"><Plus /></el-icon>
              <p>点击选择单人脸照片</p>
            </div>
          </div>
          <p class="reid-enroll-tip">底库一人一行，只接受<b>单人脸</b>照片；多人合影会被拒绝并要求裁剪。</p>
        </div>
        <el-form label-width="82px" class="reid-enroll-form">
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
        <el-button type="primary" :loading="enrolling" class="reid-enroll-submit" @click="submitEnroll">
          登记
        </el-button>
      </template>
    </ReDialog>

    <input ref="enrollInput" type="file" accept="image/*" class="reid-enroll-hidden" @change="onEnrollPicked" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from '@repo/core'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useLibraryGroups } from '@/composables/useLibraryGroups'

/**
 * 重识别库管理面板（设置中心「底库」分组）。
 *
 * <p>职责边界与「人脸底库」一致：<b>这里只管库，不负责观测</b>。
 * 观测与轨迹展示在外侧「人脸重识别」页；本面板负责查看已落库的观测记录、
 * 删除单条或清空。</p>
 *
 * <p>为什么观测要落库而不是只放内存：内存里的轨迹一重启就没了，
 * 而「这个人几小时前从哪个摄像头走过」属于需要留痕的事实。</p>
 */

/**
 * 观测记录。
 *
 * <p>刻意在本文件内声明、不复用 `reid.api` 的同名类型：本面板只读「库」这一侧
 * （谁在何时被哪个摄像头看到），api 那个类型还带着检索侧字段（similarity /
 * matchType / lastSeen 等），两者同名但不该互相牵制 —— 之前两处都声明，
 * TS 直接报「import 与本地声明冲突」，这里保留本地这份窄定义。</p>
 */
interface ReidLibraryItem {
  id: string
  trackId?: string | null
  /** 所属分组（历史数据缺失时按 default 展示） */
  group?: string | null
  cameraId?: string | null
  name?: string | null
  faceName?: string | null
  /** 双特征底库：人脸特征向量 ID（与 ReID 特征同一条记录） */
  faceVectorId?: string | null
  /** 登记时走的分流：FACE = 人脸识别管线，REID = 重识别管线 */
  matchType?: 'FACE' | 'REID' | null
  lat?: number | string | null
  lng?: number | string | null
  createTime?: string | null
}

/** 记录列表。 */
const items = ref<ReidLibraryItem[]>([])

/** 加载中。 */
const loading = ref(false)

/**
 * 当前分组。
 *
 * <p>与识别页同源：分组是第一层隔离，列表/删除/清空都只作用于当前分组 ——
 * 「清空」尤其不能越界，别把别的分组的观测一起抹掉。</p>
 */
const { group, groupOptions, loadGroups, rememberGroups } = useLibraryGroups('reid')

/** 加载列表。 */
async function load() {
  loading.value = true
  try {
    // 底部观测记录全部由底库接口供给：不用再拆信封
    items.value = await apiService.listReidLibrary({ group: group.value })
    // 记录里带回的分组名一并并进下拉：后端 groups 接口没列到的历史分组也不该缺席
    rememberGroups(items.value.map((it) => it.group))
  } catch (e) {
    message.error(`加载重识别库失败：${(e as Error)?.message ?? e}`)
    items.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 表格列。
 *
 * <p>必须走 {@code columns} prop 的 schema 写法：仓库里的 ReTable 是本项目封装版，
 * 它<b>不导出</b> {@code ReTableColumn} 组件（index.ts 只装了 ReTable/Toolbar/CardView），
 * 用 {@code <ReTableColumn>} 子节点会「组件解析失败」→ 渲染中断 → 整张表不出现。
 * 单元格里的自定义内容用 {@code slot} 名字 + 同名具名插槽给。</p>
 */
const tableColumns: ReTableColumn[] = [
  { prop: 'trackId', label: '轨迹 ID', width: 150 },
  { prop: 'group', label: '分组', width: 120, slot: 'group', showOverflowTooltip: true },
  { prop: 'cameraId', label: '摄像头', width: 140 },
  { prop: 'name', label: '记录名', minWidth: 160, showOverflowTooltip: true },
  { prop: 'faceName', label: '关联人脸', width: 120, slot: 'faceName' },
  { prop: 'matchType', label: '特征库', width: 110, slot: 'feature' },
  { prop: 'lat', label: '经纬度', width: 190, slot: 'latlng' },
  { prop: 'createTime', label: '观测时间', width: 180, slot: 'createTime' },
  { prop: 'actions', label: '操作', width: 90, slot: 'actions', fixed: 'right' },
]

/**
 * 删除一条观测。
 *
 * <p>参数用 {@code any} 而不是 {@link ReidLibraryItem}：el-table 的 slot 传出的是
 * Element Plus 的 {@code DefaultRow}（本质 {@code Record<string, any>}），
 * 与业务接口类型不构成结构兼容，强行声明会报「不可赋值」。这里只取 {@code id}，
 * 用宽松类型即可，不必为了通过检查做无意义的结构体操。</p>
 *
 * @param row 表格行
 */
async function remove(row: any) {
  const id = row?.id
  if (!id) {
    message.warning('该记录缺少 ID，无法删除')
    return
  }
  try {
    await (apiService as any)._request(`/reid/library/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      params: { group: group.value },
    })
    message.success('已删除')
    await load()
  } catch (e) {
    message.error(`删除失败：${(e as Error)?.message ?? e}`)
  }
}

/** 清空当前分组的全部观测。 */
async function clearAll() {
  try {
    const res: any = await (apiService as any)._request('/reid/tracks', {
      method: 'DELETE',
      params: { group: group.value },
    })
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    message.success(`已清空分组「${group.value}」的 ${data?.cleared ?? 0} 条记录`)
    await load()
  } catch (e) {
    message.error(`清空失败：${(e as Error)?.message ?? e}`)
  }
}

/**
 * 时间格式化。
 *
 * @param value 后端返回的 LocalDateTime 字符串
 * @returns 本地可读时间
 */
function formatTime(value?: string | null) {
  if (!value) return '-'
  // 后端 LocalDateTime.toString() 形如 2026-10-24T15:30:00，直接展示即可读
  return String(value).replace('T', ' ')
}

/* ==================== 登记入库 ==================== */

/** 弹窗显隐。 */
const enrollVisible = ref(false)

/** 提交中（防重复提交）。 */
const enrolling = ref(false)

/** 人员标识（两套特征共用同一标识）。 */
const enrollId = ref('')

/** 展示名（留空用人员标识）。 */
const enrollName = ref('')

/** 摄像头（非必填）。 */
const enrollCamera = ref('')

/** 选中的图片。 */
const enrollFile = ref<File | null>(null)

/** 预览地址（data URL，避免 blob 泄漏）。 */
const enrollPreview = ref('')

/** 隐藏的文件选择器。 */
const enrollInput = ref<HTMLInputElement | null>(null)

/** 打开登记弹窗并清空上一次的输入。 */
function openEnroll() {
  enrollId.value = ''
  enrollName.value = ''
  enrollCamera.value = ''
  enrollFile.value = null
  enrollPreview.value = ''
  enrollVisible.value = true
}

/** 触发原生文件选择器。 */
function pickEnrollImage() {
  enrollInput.value?.click()
}

/**
 * 选图后读成 data URL 预览。
 *
 * @param e input change 事件
 */
function onEnrollPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  enrollFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    enrollPreview.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
  // 允许重复选同一张图（input 的 value 不清空就不会再触发 change）
  ;(e.target as HTMLInputElement).value = ''
}

/**
 * 提交登记。
 *
 * <p>只走 {@code POST /v2/reid/enroll}：底库入口必须单人图，
 * 多脸时后端拒绝，这里把后端原话（含「请裁剪」）直接给用户。</p>
 */
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
    // 多脸 / 不合规都由后端给原因，原样展示比「登记失败」有用得多
    message.error(`${(e as Error)?.message ?? e}`)
  } finally {
    enrolling.value = false
  }
}

onMounted(async () => {
  // 先拉分组选项再拉列表：否则下拉里只有 default，用户看不到自己已有的分组
  await loadGroups()
  void load()
})
</script>

<style scoped>
.reid-lib {
  padding: 4px 2px;
}

.reid-lib-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.reid-lib-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.reid-lib-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 720px;
  line-height: 1.6;
}

.reid-lib-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.reid-lib-muted {
  color: var(--el-text-color-secondary);
}

/* ==================== 登记入库弹窗 ==================== */

.reid-enroll-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reid-enroll-pick {
  margin: 0;
}

.reid-enroll-preview {
  height: 176px;
  border-radius: 10px;
  border: 1px dashed var(--el-border-color);
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.reid-enroll-preview:hover {
  border-color: var(--el-color-primary);
}

.reid-enroll-preview img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.reid-enroll-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.reid-enroll-placeholder p {
  margin: 0;
}

.reid-enroll-tip {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.reid-enroll-hidden {
  display: none;
}
</style>
