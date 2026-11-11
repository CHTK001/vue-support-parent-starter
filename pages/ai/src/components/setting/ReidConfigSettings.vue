<template>
  <div class="reid-config-page">
    <!--
      分流示意 + 分流阈值。
      三档不是「两条管线都跑完再合并」：检测置信度先落档，同一张脸只由达标的那条回答，
      所以阈值必须并排展示 —— 分开放在两段里，用户看不出它们是一条线上的两个刻度。
    -->
    <SettingsCard
      title="三档分流"
      subtitle="同一张脸只由达标的那条管线回答：先按检测置信度落档，再看该档的阈值"
    >
      <div class="rc-flow">
        <div class="rc-flow-tier is-face">
          <div class="rc-flow-tier-head">
            <span class="rc-flow-tier-name">人脸识别管线</span>
            <span class="rc-flow-tier-range">置信度 ≥ {{ fmt(faceThreshold) }}</span>
          </div>
          <p class="rc-flow-tier-desc">库里认人：1:N 检索人脸特征，返回命中的姓名。未命中仍是本档结果，不降级去走 ReID。</p>
        </div>
        <div class="rc-flow-tier is-reid">
          <div class="rc-flow-tier-head">
            <span class="rc-flow-tier-name">ReID 管线</span>
            <span class="rc-flow-tier-range">{{ fmt(reidThreshold) }} ≤ 置信度 &lt; {{ fmt(faceThreshold) }}</span>
          </div>
          <p class="rc-flow-tier-desc">跨帧归并：用人脸重识别特征把同一个人在不同画面里的出现串成轨迹，并用 ReID 特征检索底库。</p>
        </div>
        <div class="rc-flow-tier is-invalid">
          <div class="rc-flow-tier-head">
            <span class="rc-flow-tier-name">不合规</span>
            <span class="rc-flow-tier-range">置信度 &lt; {{ fmt(reidThreshold) }}</span>
          </div>
          <p class="rc-flow-tier-desc">提示「图片不合规：人脸质量低于 ReID 阈值」，不产生识别结果、不写底库、不记轨迹。</p>
        </div>
      </div>

      <SettingsRow
        label="人脸阈值（分流的中间那条线）"
        description="检测置信度不低于此值走人脸识别管线（1:N 认人）；调高会把更多人打进 ReID 档"
        :badge="badgeOf('face_threshold')"
        risk="medium"
        risk-tip="这条线同时决定两档的边界：改它等于同时改变人脸识别与 ReID 各自接收的人脸质量"
      >
        <el-input-number
          :model-value="numberModel('face_threshold')"
          :min="0"
          :max="1"
          :step="0.05"
          :precision="2"
          :disabled="saving"
          class="rc-number"
          aria-label="人脸阈值（分流线）"
          @change="onNumberChange('face_threshold', $event)"
        />
      </SettingsRow>

      <SettingsRow
        label="ReID 阈值（分流的下限）"
        description="置信度低于人脸阈值、但不低于此值时走 ReID 管线；低于此值判为「图片不合规」。必须 ≤ 人脸阈值"
        :badge="badgeOf('reid_threshold')"
        risk="medium"
        risk-tip="必须 ≤ 人脸阈值，否则中间那一档是空集，ReID 永远不会被选中"
      >
        <el-input-number
          :model-value="numberModel('reid_threshold')"
          :min="0"
          :max="1"
          :step="0.05"
          :precision="2"
          :disabled="saving"
          class="rc-number"
          aria-label="ReID 阈值（分流下限）"
          @change="onNumberChange('reid_threshold', $event)"
        />
      </SettingsRow>

      <SettingsRow
        label="ReID 检测下限"
        description="低于此值的检测框在检测阶段就被丢掉，连「不合规」都进不来。必须 ≤ ReID 阈值"
        :badge="badgeOf('reid_detector_threshold')"
      >
        <el-input-number
          :model-value="numberModel('reid_detector_threshold')"
          :min="0"
          :max="1"
          :step="0.05"
          :precision="2"
          :disabled="saving"
          class="rc-number"
          aria-label="ReID 检测下限"
          @change="onNumberChange('reid_detector_threshold', $event)"
        />
      </SettingsRow>

      <p class="rc-note">
        <span class="rc-note-icon"><el-icon><InfoFilled /></el-icon></span>
        <span>
          三档是<b>一次判定</b>的结果：不会「两条管线都跑完再挑一条」。所以三条线的顺序必须是
          <code>ReID 检测下限 ≤ ReID 阈值 ≤ 人脸阈值</code>，写反了中间或最后一档会永远不可达。
        </span>
      </p>
    </SettingsCard>

    <!-- 人脸识别管线 -->
    <SettingsCard
      title="人脸识别管线"
      subtitle="检测 → 裁脸 → 人脸特征 → 1:N 认人；这一段的模型与阈值决定「这张脸是谁」"
    >
      <SettingsRow
        v-for="item in FACE_FIELDS"
        :key="item.field"
        :label="item.label"
        :description="item.description"
        :badge="badgeOf(item.field)"
        :risk="item.risk"
        :risk-tip="item.riskTip"
        :control-flex="item.type === 'model'"
      >
        <el-input
          v-if="item.type === 'model'"
          :model-value="modelDisplay(item.field)"
          readonly
          class="rc-model-input cursor-pointer"
          :aria-label="item.label"
          @click="openModelPicker(item)"
        >
          <template #prefix>
            <img v-if="modelLogo(item.field)" :src="modelLogo(item.field) ?? undefined" alt="" class="w-4 h-4 object-contain" />
            <el-icon v-else><Avatar /></el-icon>
          </template>
          <template #suffix>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </template>
        </el-input>
        <el-input-number
          v-else-if="item.type === 'number'"
          :model-value="numberModel(item.field)"
          :min="item.min"
          :max="item.max"
          :step="item.step ?? 1"
          :precision="item.integer ? 0 : 2"
          :disabled="saving"
          class="rc-number"
          :aria-label="item.label"
          @change="onNumberChange(item.field, $event)"
        />
      </SettingsRow>
    </SettingsCard>

    <!-- ReID 管线 -->
    <SettingsCard
      title="ReID 管线"
      subtitle="裁脸 → 重识别特征 → 跨帧归并；这一段的模型与参数决定「这个人去过哪」，两套特征分别入库"
    >
      <SettingsRow
        v-for="item in REID_FIELDS"
        :key="item.field"
        :label="item.label"
        :description="item.description"
        :badge="badgeOf(item.field)"
        :risk="item.risk"
        :risk-tip="item.riskTip"
        :control-flex="item.type === 'model' || item.type === 'text'"
      >
        <el-input
          v-if="item.type === 'model'"
          :model-value="modelDisplay(item.field)"
          readonly
          class="rc-model-input cursor-pointer"
          :aria-label="item.label"
          @click="openModelPicker(item)"
        >
          <template #prefix>
            <img v-if="modelLogo(item.field)" :src="modelLogo(item.field) ?? undefined" alt="" class="w-4 h-4 object-contain" />
            <el-icon v-else><Fingerprint24Regular /></el-icon>
          </template>
          <template #suffix>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </template>
        </el-input>
        <el-input-number
          v-else-if="item.type === 'number'"
          :model-value="numberModel(item.field)"
          :min="item.min"
          :max="item.max"
          :step="item.step ?? 1"
          :precision="item.integer ? 0 : 2"
          :disabled="saving"
          class="rc-number"
          :aria-label="item.label"
          @change="onNumberChange(item.field, $event)"
        />
        <el-input
          v-else
          :model-value="String(values[item.field] ?? '')"
          :disabled="saving"
          :aria-label="item.label"
          placeholder="留空表示不指定"
          @change="onTextChange(item.field, $event)"
        />
      </SettingsRow>

      <p class="rc-note">
        <span class="rc-note-icon"><el-icon><InfoFilled /></el-icon></span>
        <span>
          底库里一条记录存<b>两个特征值</b>：人脸特征给人脸识别用，ReID 特征给重识别用。
          「ReID 特征模型」留空时复用「人脸特征模型」，此时两套特征相同但仍分两条库写入 ——
          换 ReID 模型不会把人脸识别一起换掉。
        </span>
      </p>
    </SettingsCard>

    <ModelPickerDialog
      v-model:visible="pickerVisible"
      :providers="pickerProviders"
      :selected-id="pickerSelected"
      :empty-text="pickerEmptyText"
      @select="onModelSelect"
      @clear="onModelClear"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 人脸重识别配置面板。
 *
 * <p><b>为什么不复用 DefaultModelSettings。</b>后者是「一个分组一张表单」的通用渲染器，
 * 它按后端定义顺序平铺 face 分组 38 项 —— 检测、活体、超分、属性与重识别参数混在同一列里，
 * 用户看不出「哪些项属于人脸识别、哪些属于 ReID」，更看不出两条管线是靠阈值分流的。
 * 本面板按<b>管线</b>分段：三档分流（含分流阈值）→ 人脸识别管线 → ReID 管线，
 * 每段只放该段真正消费的字段。</p>
 *
 * <p><b>保存方式。</b>逐字段即改即存（没有「保存」按钮）：管理员写全局层，普通用户写本人覆盖层。
 * 阈值类字段写库前先做关系校验（{@code ReID 检测下限 ≤ ReID 阈值 ≤ 人脸阈值}），
 * 文案与后端 {@code ReidController.validateThresholds} 保持一致，避免前端放过去、后端又拒绝。</p>
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { InfoFilled, ArrowDown, Avatar } from '@element-plus/icons-vue'
import { Fingerprint24Regular } from '@vicons/fluent'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import { adminApi, api } from '@/framework/context'
import { isAdmin } from '@repo/core'
import { getModelAvatarPath } from '@/utils/modelUtils'
import { inferModelType, inferSubType } from '@/components/models/model.utils'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import ModelPickerDialog from './dms/ModelPickerDialog.vue'

const { t } = useI18n()
const { notify, toast } = usePopup()

/** 配置分组：与后端 FaceGlobalSettingProvider.GROUP 一致 */
const GROUP = 'face'

/** 阈值兜底值：与后端 FaceGlobalSettingProvider 的默认值对齐，取不到值时不让输入框空着 */
const DEFAULT_FACE_THRESHOLD = 0.5
const DEFAULT_REID_THRESHOLD = 0.3
const DEFAULT_REID_DETECTOR_THRESHOLD = 0.2

interface FieldSpec {
  field: string
  label: string
  description: string
  type: 'model' | 'number' | 'text'
  /** 模型字段要求的细分类型（与 DefaultModelSettings.SUBTYPE_FOR_FIELD 同口径） */
  subtype?: string
  min?: number
  max?: number
  step?: number
  integer?: boolean
  risk?: 'high' | 'medium'
  riskTip?: string
}

/**
 * 人脸识别管线的字段。
 *
 * <p>不含 {@code face_threshold}：它是两条管线的分界，已放到上面的「三档分流」卡里，
 * 放在这一段的末尾会让人以为它只影响人脸识别。</p>
 */
const FACE_FIELDS: FieldSpec[] = [
  {
    field: 'detector_model',
    label: '人脸检测模型',
    description: '在场景图里找脸。ReID 与人脸识别共用这一批检测框，换掉等于两条管线一起换',
    type: 'model',
    subtype: 'face_detection',
    risk: 'high',
    riskTip: '换检测模型会改变检出框的位置与数量，已有轨迹与底库向量不再对应同一批裁剪',
  },
  {
    field: 'detector_threshold',
    label: '检测置信度阈值',
    description: '人脸识别这一侧的常规检测阈值（0~1）。重识别还有一条更低的「ReID 检测下限」，见上方三档分流',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    field: 'nms_threshold',
    label: 'NMS 阈值',
    description: '去掉重叠框（0~1）。调低会合并更多相邻框，合影场景容易漏人',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    field: 'feature_model',
    label: '人脸特征模型',
    description: '把人脸裁图变成特征向量，用于 1:N 认人；底库的「人脸特征」这一列由它产出',
    type: 'model',
    subtype: 'face_feature',
    risk: 'high',
    riskTip: '换特征模型后旧向量与新向量不在同一空间，底库里已有的人脸会全部认不出来，需重新入库',
  },
  {
    field: 'match_threshold',
    label: '1:N 检索相似度阈值',
    description: '人脸特征命中底库所需的最低相似度；与「ReID 检索阈值」分开，两者各查各的库',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    field: 'top_k',
    label: '返回 TopK',
    description: '1:N 检索最多返回多少条候选（按相似度倒序）',
    type: 'number',
    min: 1,
    max: 100,
    integer: true,
  },
  {
    field: 'min_face_size',
    label: '最小人脸尺寸',
    description: '小于这个像素尺寸的人脸直接丢弃，避免把远景小人脸当识别对象',
    type: 'number',
    min: 1,
    max: 2000,
    integer: true,
  },
]

/** ReID 管线的字段（模型、分流阈值以外的检索/归并参数） */
const REID_FIELDS: FieldSpec[] = [
  {
    field: 'reid_feature_model',
    label: 'ReID 特征模型',
    description: '产出重识别特征（与「人脸特征模型」是两套特征、两个库）；留空则复用人脸特征模型',
    type: 'model',
    subtype: 'face_feature',
    risk: 'high',
    riskTip: '换 ReID 模型后旧的重识别向量失效，已有轨迹无法与新观测归并，底库的 ReID 特征列需重新入库',
  },
  {
    field: 'reid_feature_dimension',
    label: 'ReID 特征维度',
    description: '留空复用人脸特征维度；ReID 模型输出维度不同时必须填，否则向量库写入会错位',
    type: 'number',
    min: 1,
    max: 8192,
    integer: true,
  },
  {
    field: 'reid_match_threshold',
    label: 'ReID 检索相似度阈值',
    description: '重识别特征命中底库所需的最低相似度；与人脸 1:N 的检索阈值分开',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    field: 'track_threshold',
    label: '同人判定阈值',
    description: '相邻两次观测的余弦相似度高于此值才并入同一条轨迹（越高越严格，越不容易串人）',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    field: 'track_gap_seconds',
    label: '跨帧归并时间窗',
    description: '超过这么多秒没有再出现，就不再并入同一条轨迹（单位：秒）',
    type: 'number',
    min: 1,
    max: 86400,
    integer: true,
  },
  {
    field: 'track_max_tracks',
    label: '轨迹容量上限',
    description: '同时保留多少条轨迹，超出后淘汰最久未出现的（内存占用随此值增长）',
    type: 'number',
    min: 1,
    max: 1000000,
    integer: true,
  },
  {
    field: 'track_ttl_seconds',
    label: '轨迹保留时长',
    description: '轨迹最多保留多少秒；0 表示永久保留',
    type: 'number',
    min: 0,
    max: 2592000,
    integer: true,
  },
  {
    field: 'default_camera_id',
    label: '默认摄像头标识',
    description: '调用方未指定摄像头时用它归属观测；留空表示不指定',
    type: 'text',
  },
]

/** 合并视图：field -> { value, defaultValue, overridden, origin } */
const values = ref<Record<string, string>>({})
const meta = ref<Record<string, any>>({})

/**
 * 数值输入框的显示值。
 *
 * <p>与 {@link values} 分开存：输入框改到一半要能回退（例如阈值关系校验不通过），
 * 而 values 是「已经落库/读回来的那份」，回退时直接把这一份写回输入框即可。</p>
 */
const numberModels = ref<Record<string, number | undefined>>({})

const saving = ref(false)
const loading = ref(false)

/** 错误提示：与后端文案逐字一致（后端拒绝时用户看到的也是这一句） */
const ERROR_REID_GT_FACE = (reid: number, face: number) =>
  `ReID 阈值不能高于人脸识别阈值：reid_threshold(${reid}) > face_threshold(${face})，请满足 reid_threshold ≤ face_threshold`
const ERROR_DETECTOR_GT_REID = (detector: number, reid: number) =>
  `ReID 检测阈值不能高于 ReID 阈值：reid_detector_threshold(${detector}) > reid_threshold(${reid})，否则「不合规」这一档不可达`

/** 阈值展示：统一两位小数，便于看出上下两条线的间隔 */
const fmt = (v: number): string => (Number.isFinite(v) ? v.toFixed(2) : '--')

/**
 * 取当前生效的阈值：输入框里的值优先，其次读回的值，最后用内置默认。
 *
 * @param field 字段名
 * @param fallback 兜底值
 */
const effectiveNumber = (field: string, fallback: number): number => {
  const local = numberModels.value[field]
  if (Number.isFinite(local)) return Number(local)
  const raw = Number(values.value[field])
  return Number.isFinite(raw) && String(values.value[field] ?? '') !== '' ? raw : fallback
}

const faceThreshold = computed(() => effectiveNumber('face_threshold', DEFAULT_FACE_THRESHOLD))
const reidThreshold = computed(() => effectiveNumber('reid_threshold', DEFAULT_REID_THRESHOLD))

/** 输入框绑定值（取不到时用兜底，避免 el-input-number 显示空白） */
const numberModel = (field: string): number | undefined => numberModels.value[field]

/**
 * 「继承」标记：overridden=false 表示这个值来自全局默认，改它等于给自己加一条覆盖。
 *
 * @param field 字段名
 */
const badgeOf = (field: string): string => (meta.value[field]?.overridden === false ? '继承' : '')

/**
 * 从 merged 响应里取出字段项（响应是双层信封，数组/对象两种形态都要兜住）。
 *
 * @param response 接口响应
 */
const pickItems = (response: any): any[] => {
  const first = response?.data ?? response
  return Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : []
}

/** 需要按数值读回的全部字段：两段管线 + 三条分流阈值 */
const FIELDS_WITH_SPLIT: FieldSpec[] = [
  ...FACE_FIELDS,
  ...REID_FIELDS,
  { field: 'face_threshold', label: '', description: '', type: 'number' },
  { field: 'reid_threshold', label: '', description: '', type: 'number' },
  { field: 'reid_detector_threshold', label: '', description: '', type: 'number' },
]

/** 加载 face 分组的合并视图（全局默认 + 本人覆盖） */
const load = async () => {
  loading.value = true
  try {
    const response = await apiService.fetchMergedGroupSettings(GROUP)
    const items = pickItems(response)
    const valueMap: Record<string, string> = {}
    const metaMap: Record<string, any> = {}
    for (const item of items) {
      if (!item?.field) continue
      valueMap[item.field] = item.value ?? ''
      metaMap[item.field] = {
        overridden: item.overridden === true,
        defaultValue: item.defaultValue ?? '',
        origin: item.origin ?? (item.overridden === true ? 'USER' : 'GLOBAL'),
      }
    }
    values.value = valueMap
    meta.value = metaMap

    const numeric: Record<string, number | undefined> = {}
    for (const item of FIELDS_WITH_SPLIT) {
      if (item.type !== 'number') continue
      const raw = String(valueMap[item.field] ?? '').trim()
      numeric[item.field] = raw === '' ? undefined : Number(raw)
    }
    numberModels.value = numeric
  } catch (error) {
    console.error('[ReID 配置] 获取 face 分组设置失败:', error)
    notify.error(t('settings.loadFailed'), error)
  } finally {
    loading.value = false
  }
}

/**
 * 写一个字段。
 *
 * <p>管理员写全局层（对所有人生效），普通用户写本人覆盖层 —— 与设置中心其它面板同口径。</p>
 *
 * @param field 字段名
 * @param value 值；null 表示撤销本人覆盖（回落到继承值）
 * @returns 是否写入成功
 */
const saveField = async (field: string, value: unknown): Promise<boolean> => {
  saving.value = true
  try {
    const payload = { [field]: value }
    if (isAdmin()) {
      await apiService.updateGroupSettings(GROUP, payload)
    } else {
      await apiService.updateUserGroupOverrides(GROUP, payload)
    }
    toast.success('设置已保存')
    await load()
    return true
  } catch (error) {
    console.error(`[ReID 配置] 保存 face.${field} 失败:`, error)
    notify.error('保存设置失败', error)
    return false
  } finally {
    saving.value = false
  }
}

/**
 * 阈值关系校验（提交前）。
 *
 * <p>候选值 = 本次改动 + 其余字段当前生效值，两条约束：</p>
 * <ul>
 *   <li>{@code reid_threshold ≤ face_threshold}：否则「低于人脸、高于 ReID」是空集；</li>
 *   <li>{@code reid_detector_threshold ≤ reid_threshold}：否则低质量人脸在检测阶段就被丢掉。</li>
 * </ul>
 *
 * @param field 本次改动的字段
 * @param value 改动后的数值
 * @returns 违规说明；合法返回 null
 */
const validateThreshold = (field: string, value: number): string | null => {
  const face = field === 'face_threshold' ? value : effectiveNumber('face_threshold', DEFAULT_FACE_THRESHOLD)
  const reid = field === 'reid_threshold' ? value : effectiveNumber('reid_threshold', DEFAULT_REID_THRESHOLD)
  const detector = field === 'reid_detector_threshold'
    ? value
    : effectiveNumber('reid_detector_threshold', DEFAULT_REID_DETECTOR_THRESHOLD)
  if (reid > face) return ERROR_REID_GT_FACE(reid, face)
  if (detector > reid) return ERROR_DETECTOR_GT_REID(detector, reid)
  return null
}

/**
 * 数值字段变更：先校验阈值关系，通过后即改即存；不通过则把输入框退回原值。
 *
 * @param field 字段名
 * @param raw   el-input-number 给出的值（清空时为 null/undefined）
 */
const onNumberChange = async (field: string, raw: number | undefined | null) => {
  const previous = numberModels.value[field]
  if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) {
    // 清空：只有「可留空」的字段才允许（ReID 特征维度），其余字段清空视为非法输入，回退
    if (field === 'reid_feature_dimension') {
      numberModels.value[field] = undefined
      await saveField(field, null)
      return
    }
    numberModels.value[field] = previous
    return
  }
  const value = Number(raw)
  if (field === 'face_threshold' || field === 'reid_threshold' || field === 'reid_detector_threshold') {
    const violation = validateThreshold(field, value)
    if (violation) {
      toast.error(violation)
      numberModels.value[field] = previous
      return
    }
  }
  numberModels.value[field] = value
  const ok = await saveField(field, value)
  if (!ok) {
    numberModels.value[field] = previous
  }
}

/** 文本字段变更：即改即存；空串写成 null（撤销覆盖，回落继承） */
const onTextChange = async (field: string, raw: string) => {
  const value = String(raw ?? '').trim()
  await saveField(field, value === '' ? null : value)
}

// ===================== 模型选择 =====================

/** 候选模型（已按细分类型过滤，结构与 ModelPickerDialog 约定一致） */
const models = ref<any[]>([])
const providers = ref<any[]>([])
let modelsLoadPromise: Promise<void> | null = null

const pickerVisible = ref(false)
const pickerField = ref('')
const pickerSelected = ref('')
const pickerSubtype = ref('')

/** 人脸槽位对应的引擎清单分组：face_detection → detector，face_feature → feature */
const ENGINE_LIST_BY_SUBTYPE: Record<string, { key: string; label: string }> = {
  face_detection: { key: 'detector', label: '人脸检测' },
  face_feature: { key: 'feature', label: '人脸特征' },
}

/**
 * 加载候选模型。
 *
 * <p>候选来自两处，缺一不可：</p>
 * <ul>
 *   <li>{@code /api/providers}：已登记在模型管理里的条目，带 logo 与展示名；</li>
 *   <li>{@code /v2/face/models}：<b>引擎真正能加载的模型清单</b>（{@code FaceDetector.listModels()}
 *       与 {@code FeatureExtractor} 的注册表视图）。很多人脸模型（{@code scrfd-face-detector}、
 *       {@code arc-face} 等）只登记在 ModelRegistry 里，权重未绑定外部目录时不出现在
 *       {@code /api/providers}，只问一边会让「人脸检测模型」弹框里一个候选都没有 ——
 *       用户看着空清单，无从配置。</li>
 * </ul>
 *
 * <p>两处按<b>裸模型名</b>去重：人脸分组的值必须写裸模型名（后端用 ModelRegistry 的裸 key
 * 查会话），带 {@code providerId:} 前缀的复合键登记时会报「模型未注册」。</p>
 */
const loadModels = () => {
  if (modelsLoadPromise) return modelsLoadPromise
  modelsLoadPromise = (async () => {
    try {
      const body = await adminApi.get('/api/providers')
      const data = Array.isArray(body) ? body : body?.data || []
      const all: any[] = []
      const provs: any[] = []
      for (const p of data) {
        const isOnnx = p.provider_id === 'onnx' || p.platform === 'onnx'
        const list = (p.models || [])
          .filter((m: any) => m.enabled !== false)
          .filter((m: any) => (isOnnx ? (m.external === true || m.available === true) : true))
          .map((m: any) => {
            const type = inferModelType(m)
            const subTypes = new Set<string>()
            ;(Array.isArray(m.capabilities) ? m.capabilities : []).forEach((c: any) => {
              const sub = typeof c === 'object' ? c?.subtype ?? c?.subType : undefined
              if (sub) subTypes.add(String(sub))
            })
            const inferred = inferSubType(m, type)
            if (inferred) subTypes.add(inferred)
            return {
              // id 与存取口径一致：face 分组的模型槽位只认裸模型名
              id: m.model,
              model: m.model,
              providerId: p.provider_id,
              providerName: p.name,
              subTypes: [...subTypes],
              displayTags: [...subTypes].includes('face_feature')
                ? [{ value: 'sub:face_feature', label: '人脸特征', tagType: 'info' }]
                : [...subTypes].includes('face_detection')
                  ? [{ value: 'sub:face_detection', label: '人脸检测', tagType: 'info' }]
                  : [],
            }
          })
        if (list.length) {
          all.push(...list)
          provs.push({ id: p.provider_id, name: p.name, models: list })
        }
      }

      // 引擎清单兜底：补上只登记在 ModelRegistry、未进模型管理的那些模型
      await mergeEngineModels(all, provs)
      models.value = all
      providers.value = provs
    } catch (e) {
      console.error('[ReID 配置] 获取模型列表失败:', e)
    } finally {
      modelsLoadPromise = null
    }
  })()
  return modelsLoadPromise
}

/**
 * 把引擎清单里缺的模型补进候选。
 *
 * @param all   已收集的候选行（就地追加）
 * @param provs 已收集的供应商分组（就地追加/合并）
 */
const mergeEngineModels = async (all: any[], provs: any[]) => {
  let payload: any
  try {
    payload = await api.get('/face/models')
  } catch (e) {
    console.warn('[ReID 配置] 获取引擎模型清单失败，仅用模型管理中的条目:', e)
    return
  }
  const data = payload?.data ?? payload ?? {}
  const existing = new Set(all.map((m) => String(m.model || '')))
  const fresh: any[] = []
  for (const [subtype, spec] of Object.entries(ENGINE_LIST_BY_SUBTYPE)) {
    const names: string[] = Array.isArray(data?.[spec.key]) ? data[spec.key] : []
    for (const name of names) {
      const bare = String(name || '').trim()
      if (!bare || existing.has(bare)) continue
      existing.add(bare)
      fresh.push({
        // id 就用裸模型名：保存时直接落库，不需要再剥前缀
        id: bare,
        model: bare,
        providerId: 'onnx',
        providerName: 'ONNX 本地推理',
        subTypes: [subtype],
        displayTags: [{ value: `sub:${subtype}`, label: spec.label, tagType: 'info' }],
      })
    }
  }
  if (!fresh.length) return
  all.push(...fresh)
  const onnx = provs.find((p) => p.id === 'onnx')
  if (onnx) {
    onnx.models.push(...fresh)
  } else {
    provs.push({ id: 'onnx', name: 'ONNX 本地推理', models: fresh })
  }
}

/** 候选模型按当前字段的细分类型过滤（face_detection / face_feature） */
const pickerProviders = computed(() => {
  const subtype = pickerSubtype.value
  if (!subtype) return providers.value
  return providers.value
    .map((p) => ({ ...p, models: p.models.filter((m: any) => (m.subTypes || []).includes(subtype)) }))
    .filter((p) => p.models.length > 0)
})

/** 弹框空态文案：说清缺的是哪一类模型，而不是笼统的「没有匹配的模型」 */
const pickerEmptyText = computed(() => (
  pickerSubtype.value === 'face_detection'
    ? '没有可用的人脸检测模型'
    : '没有可用的人脸特征模型'
))

/** 当前字段已配置的值；SYSTEM_DEFAULT 视为未配置 */
const currentModelValue = (field: string): string => {
  const item = meta.value[field]
  const raw = String(values.value[field] ?? '')
  if (!raw || item?.origin === 'SYSTEM_DEFAULT') return ''
  return raw
}

/**
 * 模型字段的展示文本：未配置时说「请选择模型」，已配置时带出继承/已设状态。
 *
 * @param field 字段名
 */
const modelDisplay = (field: string): string => {
  const value = currentModelValue(field)
  if (!value) return '请选择模型'
  return meta.value[field]?.overridden === false ? `继承全局：${value}` : value
}

/** 模型字段的 logo（值为裸模型名；兼容历史 providerId:model 写法，剥前缀后取本地图标） */
const modelLogo = (field: string): string | null => {
  const value = currentModelValue(field)
  if (!value) return null
  const name = value.includes(':') ? value.split(':').slice(1).join(':') : value
  return getModelAvatarPath(name)
}

/**
 * 打开模型选择弹框。
 *
 * @param spec 字段定义
 */
const openModelPicker = async (spec: FieldSpec) => {
  pickerField.value = spec.field
  pickerSubtype.value = spec.subtype || ''
  pickerSelected.value = currentModelValue(spec.field)
  pickerVisible.value = true
  if (models.value.length === 0) await loadModels()
}

/** 选中模型：写该字段 */
const onModelSelect = async (modelId: string) => {
  const field = pickerField.value
  pickerVisible.value = false
  if (!field || !modelId) return
  await saveField(field, modelId)
}

/** 清空模型：null = 撤销覆盖，回落到继承/未配置 */
const onModelClear = async () => {
  const field = pickerField.value
  pickerVisible.value = false
  if (!field) return
  await saveField(field, null)
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.reid-config-page {
  display: flex;
  flex-direction: column;
}

/* 三档分流示意：三条横带，从上到下依次是「质量最好 → 最差」 */
.rc-flow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rc-flow-tier {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  border-left-width: 3px;
  background: var(--el-fill-color-lighter, #fafafa);
}

.rc-flow-tier.is-face {
  border-left-color: var(--el-color-success);
}
.rc-flow-tier.is-reid {
  border-left-color: var(--el-color-warning);
}
.rc-flow-tier.is-invalid {
  border-left-color: var(--el-color-danger);
}

.rc-flow-tier-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rc-flow-tier-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.rc-flow-tier-range {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  padding: 1px 10px;
}

.rc-flow-tier-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 底部说明：与 SettingsRow 的分隔线同源，避免文字直接贴边 */
.rc-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 14px 18px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.rc-note-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--el-text-color-placeholder);
}

.rc-note b {
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.rc-note code {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11.5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

/* 数值输入框：跟设置行的固定列宽一致，不额外撑宽 */
.rc-number {
  width: 100%;
}

/* 模型选择框表现得像下拉：只读 + 指针 + 右侧箭头 */
.rc-model-input :deep(.el-input__inner) {
  cursor: pointer;
}

.rc-model-input :deep(.el-input__prefix) {
  display: inline-flex;
  align-items: center;
}
</style>
