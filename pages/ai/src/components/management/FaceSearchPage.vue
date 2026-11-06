<template>
  <div class="fs-root" data-page="face">
    <div class="fs-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="fs-stage">
        <div class="fs-stage-inner">
          <!--
            分组条：分组是第一层隔离（每组一套向量库），登记/识别/取图都只作用于当前分组。
            allow-create 允许直接敲一个新分组名 —— 分组没有独立的「建库」动作，
            第一次登记落进去即存在。
          -->
          <div class="fs-group">
            <el-icon class="fs-group-icon"><Collection /></el-icon>
            <span class="fs-group-label">分组</span>
            <el-select
              v-model="groups"
              class="fs-group-select"
              placeholder="选择或输入分组"
              filterable
              multiple
              collapse-tags
              allow-create
              default-first-option
              :disabled="busy"
              @change="onGroupChange"
            >
              <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
            </el-select>
            <span class="fs-group-hint">不同分组各有一套人脸库，互不可见</span>
          </div>

          <!-- 空态：引导上传 -->
          <div v-if="!previewUrl" class="fs-drop" @click="pickImage">
            <el-icon :size="46" class="fs-drop-icon"><Picture /></el-icon>
            <p class="fs-drop-title">上传一张照片，开始识别人脸</p>
            <p class="fs-drop-desc">点击选择图片，或把照片拖到这里</p>
            <el-button type="primary" class="fs-drop-btn" :disabled="!faceUsable" @click.stop="pickImage">
              <el-icon><FolderOpened /></el-icon>选择图片
            </el-button>
          </div>

          <!-- 图片 + 检测叠加层 -->
          <div v-else class="fs-canvas" :class="{ 'is-busy': detecting }">
            <img :src="previewUrl" class="fs-img" alt="待识别人脸" />

            <!--
              叠加层与图片用同一 viewBox + 同一 preserveAspectRatio，
              二者缩放/留白完全一致，检测框坐标即可直接落在原图像素上。
            -->
            <svg
              v-if="mainHit && showBox"
              class="fs-overlay"
              :viewBox="`0 0 ${natural.w} ${natural.h}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- 人脸框：青色虚线圆角 -->
              <rect
                class="fs-box"
                :x="mainHit.box.x"
                :y="mainHit.box.y"
                :width="mainHit.box.width"
                :height="mainHit.box.height"
                rx="26"
              />
              <!-- 关键点 -->
              <circle
                v-for="(kp, i) in showLandmark ? landmarks : []"
                :key="i"
                class="fs-kp"
                :cx="kp[0]"
                :cy="kp[1]"
                r="7"
              />
            </svg>

            <!-- 106 点特征点：独立 landmark 模型，单独一层，可与检测器 5 点各自开关 -->
            <svg
              v-if="landmarks106.length && showLandmark106"
              class="fs-overlay"
              :viewBox="`0 0 ${natural.w} ${natural.h}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <circle
                v-for="(kp, i) in landmarks106"
                :key="'lm' + i"
                class="fs-kp106"
                :cx="kp[0]"
                :cy="kp[1]"
                r="2.6"
              />
            </svg>

            <!-- 106 点层的状态说明：推理中 / 不可用的原因（不打断检测与识别） -->
            <div v-if="showLandmark106 && (landmark106Busy || landmark106Error)" class="fs-lm-hint">
              <!-- 小尺寸内联用双环：圆点在这个体量下留白偏多，读不出在转 -->
              <ReLoader v-if="landmark106Busy" loading size="sm" :fullscreen="false" :mask="false" />
              <span>{{ landmark106Busy ? '正在提取 106 点特征点…' : landmark106Error }}</span>
            </div>

            <!-- 识别中遮罩：统一走 ReLoader 的默认加载动画（三个圆点） -->
            <div v-if="detecting" class="fs-mask">
              <ReLoader loading size="lg" :fullscreen="false" />
              <span class="fs-mask-text">正在识别人脸…</span>
            </div>

            <!-- 角标：找到相似脸 -->
            <div v-if="mainHit && !detecting" class="fs-found">
              <div class="fs-found-title">
                <el-icon><Search /></el-icon>找到相似脸
              </div>
              <div class="fs-found-sub">{{ foundSub }}</div>
            </div>

            <!-- 未检出人脸 -->
            <div v-else-if="previewUrl && !detecting && !mainHit" class="fs-noface">
              <el-icon :size="20"><Warning /></el-icon>
              <span>未检测到人脸，请换一张正面清晰的照片</span>
            </div>
          </div>

          <!-- 操作条 -->
          <div v-if="previewUrl" class="fs-actions">
            <el-button class="fs-btn fs-btn-ghost" :disabled="busy" @click="pickImage">
              <el-icon><FolderOpened /></el-icon>更换图片
            </el-button>
            <el-button
              class="fs-btn fs-btn-accent"
              :disabled="busy || !mainHit"
              @click="recognizeCrop"
            >
              <el-icon><Crop /></el-icon>裁剪脸部
            </el-button>
            <el-button
              class="fs-btn fs-btn-brand"
              :disabled="busy || !mainHit"
              :loading="identifying"
              @click="runIdentify"
            >
              <el-icon v-if="!identifying"><component :is="identifyDone ? Refresh : Search" /></el-icon
              >{{ identifyDone ? '重新识别' : '识别' }}
            </el-button>
          </div>
        </div>
      </section>

      <!-- ==================== 右：相似面孔推荐 ==================== -->
      <aside class="fs-panel">
        <header class="fs-panel-head">
          <h2 class="fs-panel-title">相似面孔推荐</h2>
          <span class="fs-dots"><i v-for="n in 5" :key="n" /></span>
        </header>

        <!-- 分类切换：按登记档案信息筛选 -->
        <nav class="fs-tabs">
          <button
            v-for="t in TABS"
            :key="t.key"
            class="fs-tab"
            :class="{ 'is-active': activeTab === t.key }"
            :title="t.hint"
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </button>
        </nav>

        <!-- 结果网格 -->
        <div v-if="visibleHits.length" class="fs-grid">
          <article
            v-for="item in visibleHits"
            :key="item.id"
            class="fs-card"
            :class="{ 'is-picked': pickedId === item.id }"
            @click="pickedId = item.id"
          >
            <div class="fs-card-face">
              <img v-if="item.thumb" :src="item.thumb" :alt="item.name" class="fs-card-img" />
              <div v-else class="fs-card-fallback"><el-icon><User /></el-icon></div>
              <!-- 相似度环 -->
              <svg v-if="showRing" class="fs-ring" viewBox="0 0 120 120">
                <circle class="fs-ring-track" cx="60" cy="60" r="54" />
                <circle
                  class="fs-ring-bar"
                  cx="60"
                  cy="60"
                  r="54"
                  :stroke-dasharray="RING_C"
                  :stroke-dashoffset="ringOffset(item.score)"
                />
              </svg>
              <span v-if="pickedId === item.id" class="fs-check"><el-icon><Check /></el-icon></span>
            </div>
            <p class="fs-card-name" :title="item.name || item.id">{{ item.name || '未命名' }}</p>
            <p class="fs-card-cap">
              <b class="fs-card-score">{{ percent(item.score) }}%</b>
              <span class="fs-card-sep">|</span>
              <span class="fs-card-tag">{{ item.caption }}</span>
            </p>
            <p v-if="item.idCardMasked" class="fs-card-id">证件 {{ item.idCardMasked }}</p>
          </article>
        </div>

        <!-- 无结果 -->
        <div v-else class="fs-blank">
          <el-icon :size="34" class="fs-blank-icon"><User /></el-icon>
          <p class="fs-blank-title">{{ blankTitle }}</p>
          <p class="fs-blank-desc">{{ blankDesc }}</p>
        </div>

        <!-- 相册：已登记档案（以服务端列表为权威，本地登记簿只为有缩略图的条目补图） -->
        <div v-if="serverFaceCount > 0" class="fs-gallery">
          <button
            v-for="f in serverFaces"
            :key="f.id"
            class="fs-thumb"
            :class="{ 'is-active': galleryKey === f.id }"
            :title="`${f.name} · ${ageBucket(f.age)}`"
            @click="galleryKey = f.id"
          >
            <img v-if="galleryThumb(f.id)" :src="galleryThumb(f.id)" :alt="f.name" />
            <el-icon v-else><User /></el-icon>
          </button>
        </div>

        <!-- 主行动 -->
        <el-button class="fs-cta" :disabled="busy || !faceUsable" @click="openEnroll">
          <el-icon><Star /></el-icon>人脸登记入库
        </el-button>
        <p class="fs-gallery-hint">
          已选分组 <b>{{ groupTags }}</b>（检索范围） · 已登记 <b>{{ serverFaceCount }}</b> 张
          <span v-if="serverFaceCount && !cards.length && !identifying">· 向量库可能已随服务重启清空，需重新登记</span>
        </p>

        <!-- 当前模型（只读，取自系统设置；未配置时明确显示「未配置」而不是种子模型名） -->
        <p class="fs-model">
          <el-icon><Setting /></el-icon>
          <span>检测模型 <b>{{ faceDetectorModel || '未配置' }}</b></span>
          <span class="fs-dot">·</span>
          <span>特征模型 <b>{{ faceFeatureModel || '未配置' }}</b></span>
        </p>

        <!--
          模型未配齐 → 本页不可用。
          与以图搜图的 .is-hint 同一套语言：说清「差哪几项」和「去哪儿配」，
          而不是让用户上传一张图之后才在后端报「模型未注册」。
        -->
        <div v-if="!faceUsable" class="fs-gate">
          <el-icon><Warning /></el-icon>
          <div>
            <p class="fs-gate-title">人脸识别未启用</p>
            <p class="fs-gate-desc">
              还需配置{{ faceMissingLabels }}。请到「系统设置 → 默认模型 → 人脸识别」中选择模型，保存后立即生效。
            </p>
          </div>
        </div>
      </aside>

      <!-- ==================== 右缘悬浮工具条 ==================== -->
      <div class="fs-rail">
        <button
          v-for="tool in railItems"
          :key="tool.key"
          class="fs-rail-btn"
          :class="[{ 'is-on': tool.active() }, tool.cls || '']"
          :title="tool.title"
          :disabled="tool.disabled ? tool.disabled() : false"
          @click="tool.toggle"
        >
          <el-icon :size="18"><component :is="tool.icon" /></el-icon>
        </button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="fs-hidden" @change="onFilePicked" />
    <FaceEnrollDialog v-model="enrollVisible" :group="group" @enrolled="onEnrolled" />
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import {
  Aim, Check, Collection, Crop, Delete, FolderOpened, Picture, Refresh, Search, Setting, Star, User, View, Warning,
} from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import type { FaceHit, FaceMatch } from '@/services/modules/face.api'
import { useFaceRegistry, ageBucket, isSameAgeRange, maskIdCard, normalizeGroupName, type FaceRecord } from '@/composables/useFaceRegistry'
import { useLibraryGroups, DEFAULT_GROUP } from '@/composables/useLibraryGroups'
import { useModelConfigStore } from '@/stores/modelConfig'
import { configuredValue } from '@/utils/modelConfigStatus'
import ReLoader from '@repo/ui/re-loader'
import FaceEnrollDialog from './FaceEnrollDialog.vue'

/** 相似度环周长：r=54 → 2πr */
const RING_C = 2 * Math.PI * 54

const previewUrl = ref('')
const natural = ref({ w: 1, h: 1 })
const hits = ref<FaceHit[]>([])
const matches = ref<FaceMatch[]>([])

/**
 * 模型门禁 store。
 *
 * <p><b>为什么改用它。</b>原先这里本地读 {@code GET /v2/face/config}（业务配置口），
 * 它回的是**数据库原值**，2026-09-30 那批一次性种子行（{@code configuredBy} 全为空）
 * 也一并返回 —— 于是「从没配过模型」的账号，界面上照样显示
 * {@code 检测模型 scrfd-face-detector · 特征模型 arc-face}，与设置中心的
 * 「请选择模型」自相矛盾，用户会以为已经配好了。</p>
 *
 * <p>store 的判据是设置中心同源的合并视图（{@code /v2/settings/face/merged}）+
 * {@code origin !== 'SYSTEM_DEFAULT'}，侧栏徽标与本页门禁因此共用同一口径。</p>
 */
const modelConfig = useModelConfigStore()

/** 底栏展示用真实配置名：经 store 合并视图过滤系统种子，未配置时为空串 */
const faceDetectorModel = computed(() => modelConfig.faceDetectorModel)
const faceFeatureModel = computed(() => modelConfig.faceFeatureModel)

/** face 分组合并视图（field -> {value, origin}），供关键点等逐字段判据读取 */
const faceMerged = computed(() => modelConfig.faceMerged)

/**
 * 关键点模型是否已配置（对当前用户生效值非空白、且不是系统种子）。
 *
 * <p>未配置时**特征点业务入口不渲染** —— 一个必然回「能力未启用」的按钮不该出现在
 * 界面上；后端那道校验仍然保留（防直连 API）。合并视图读失败时 faceMerged 为空
 * → 隐藏（fail-closed）：宁可暂时不给入口，也不显示一个点了必然报错的按钮。</p>
 */
const landmarkReady = computed(() => configuredValue(faceMerged.value, 'landmark_model') !== '')

/**
 * 人脸识别是否可用：检测模型 + 特征模型都已**真正**配置（缺一不可）。
 *
 * <p>与后端 {@code FaceClientManager.isModelConfigured} 同口径（留空即该能力未启用），
 * 外加「种子值不算配置」这一条。未配齐时本页不上传、不识别、不登记，
 * 只在右栏说明差哪几项、去哪儿配。</p>
 */
const faceReady = computed(() => modelConfig.faceReady)

/** 已配置但当前不在 /api/providers 注册清单里的模型字段（登记/识别会报“模型未注册”） */
const faceUnregistered = computed(() => modelConfig.unregisteredConfigured)

/** 页面主入口可用：字段配齐且注册清单可用（清单加载失败时放行，交给后端兜底） */
const faceUsable = computed(() => modelConfig.faceReady && modelConfig.unregisteredConfigured.length === 0)

/** 缺失模型字段的中文名（与设置中心的 labelMap 同套文案） */
const FACE_FIELD_LABELS: Record<string, string> = {
  detector_model: '人脸检测模型',
  feature_model: '人脸特征模型',
}

/** 缺失的必需模型（中文名，用于提示） */
const faceMissingLabels = computed(() =>
  modelConfig.faceMissing.map((f) => FACE_FIELD_LABELS[f] ?? f).join('、'),
)

/** 已配置但未注册的模型字段（中文名，用于提示） */
const faceUnregisteredLabels = computed(() =>
  faceUnregistered.value.map((f) => FACE_FIELD_LABELS[f] ?? f).join('、'),
)

/** 未注册时的统一提示：引导去设置中心换模型，而不是反复上传重试 */
const NOT_REGISTERED_MSG = computed(
  () =>
    `人脸识别模型当前不可用：${faceUnregisteredLabels.value} 已配置的模型未在后端注册。` +
    '请到「系统设置 → 默认模型 → 人脸识别」重新选择当前可用的模型',
)

/** 门禁拦截时的提示：未配置 / 已配置但未注册，各给各的文案 */
function gateWarning(): string {
  if (faceUnregistered.value.length) return NOT_REGISTERED_MSG.value
  return '人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型'
}
const pickedId = ref('')
const galleryKey = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const enrollVisible = ref(false)

const detecting = ref(false)
const identifying = ref(false)
/**
 * 当前照片是否已完成过一次识别。
 *
 * <p>用于按钮文案：首次显示「识别」，出过结果后显示「重新识别」——
 * 此前恒定叫「重新识别」，但上传后并不会自动识别，用户没点过就显示
 * 「重新识别」属于文案撒谎。配合 {@link loadFile} 的上传后自动识别。</p>
 */
const identifyDone = ref(false)

/** 叠加层显隐，由右缘悬浮条控制 */
const showBox = ref(true)
const showLandmark = ref(true)
const showRing = ref(true)

/**
 * 106 点人脸特征点（独立 landmark 模型）。
 *
 * <p>与检测器自带的 5 点不同：5 点（眼/鼻/嘴）随 `detect` 一起返回；106 点是
 * 脸型轮廓 + 眉眼 + 嘴部的稠密点，要单独调 `POST /v2/face/landmark`，
 * 且**该模型未配置时不可用**。推理有开销，故默认关闭，由右缘悬浮条按需开启，
 * 开启后才请求（也才在换图后重新请求）。</p>
 */
const landmarks106 = ref<number[][]>([])
const showLandmark106 = ref(false)
const landmark106Busy = ref(false)
const landmark106Error = ref('')

const registry = useFaceRegistry()

/**
 * 服务端档案索引（id → metadata）。
 *
 * <p>为什么要它：`/v2/face/identify` 的 hit 只有 `{id, score}`（后端契约如此，
 * 见 `FaceStores` 的注释：档案的权威只有快照一处，调用方拿 hit 的 id 回列表取档案）。
 * 而这里原来只回落到**浏览器本地登记簿** `useFaceRegistry` —— 于是换浏览器 / 清缓存 /
 * 换账号之后，识别命中了却显示不出姓名等信息（只剩一串裸 id）。
 * 现在以服务端 `GET /v2/face/list` 为权威来源，本地登记簿只用来补服务端不存的缩略图。</p>
 */
const serverMeta = ref<Record<string, Record<string, unknown>>>({})
/** 服务端人脸库条目（全量；计数与图廊以它为准，本地登记簿只补缩略图） */
const serverFaces = ref<Array<{ id: string; name: string; age: number | null }>>([])
/** 服务端人脸库总数（服务端权威的「已登记 N 张」） */
const serverFaceCount = ref(0)

/**
 * 当前分组。
 *
 * <p>分组是第一层隔离：列表、识别、删除、取图都只作用于它。
 * 默认 default 与后端「不带分组」的语义一致（历史数据也归属 default）。</p>
 */
const { group, groups, groupOptions, loadGroups, rememberGroups, setGroups, joinGroups } = useLibraryGroups('face')

/** 当前检索范围（多选分组）的展示名 */
const groupTags = computed(() => {
  const list = groups.value.filter((g) => String(g ?? '').trim() !== '')
  return list.length ? list : [DEFAULT_GROUP]
})

/**
 * 按 id 在选中的所有分组里捞本地档案（缩略图）。
 *
 * <p>登记簿的入口是服务端的全体命中（不含分组，只有 hit 的 id），而缩略图是
 * 本地登记的私有字段（按组分片）—— 多选检索时不能只卡在当前组，否则会漏掉
 * 同一个人其他组里存的图。没命中任何选中的组时回落第一条记录，和旧行为一致。</p>
 *
 * @param id 人脸标识
 * @returns 档案（成员）
 */
function registryLookup(id: string): FaceRecord | undefined {
  const list = registry.records.value.filter((r) => r.id === id)
  if (!list.length) return undefined
  const keep = list.filter((r) => groups.value.includes(normalizeGroupName(r.group)))
  return keep.length ? keep[0] : list[0]
}

/** 图廊缩略图：优先取本地登记簿（登记该条目的浏览器存过图），没有则回退为 User 占位图标 */
function galleryThumb(id: string): string {
  return registryLookup(id)?.thumb ?? ''
}

async function loadServerMeta() {
  try {
    const selected = joinGroups() === ''
      ? [DEFAULT_GROUP]
      : groups.value
    // 多选检索时逐组拉全量列表再合并（去重按 id），单组时回到原来的一条路
    const list = selected.length === 1
      ? [await apiService.listFaces({ group: selected[0] })]
      : await Promise.all(selected.map((g) => apiService.listFaces({ group: g })))
    const map: Record<string, Record<string, unknown>> = {}
    const faces: Array<{ id: string; name: string; age: number | null }> = []
    const serverIds = new Set<string>()
    for (const { items } of list) {
      for (const it of items) {
        const id = String((it as Record<string, unknown>)?.id ?? '')
        if (!id) continue
        serverIds.add(id)
        // 条目带回的分组名一并并进下拉：后端 groups 接口没列到的分组也不该在下拉里缺席
        rememberGroups([(it as Record<string, unknown>)?.group as string | undefined])
        const md = (it as Record<string, unknown>)?.metadata
        const meta = md && typeof md === 'object' ? (md as Record<string, unknown>) : {}
        map[id] = meta
        const local = registryLookup(id)
        const ageRaw = meta.age ?? local?.age
        faces.push({
          id,
          name: String(meta.name ?? meta.label ?? local?.name ?? id),
          age: typeof ageRaw === 'number' && Number.isFinite(ageRaw) ? ageRaw
            : ageRaw == null || ageRaw === '' ? null : Number(ageRaw),
        })
      }
    }
    serverMeta.value = map
    serverFaces.value = faces
    // 服务端不传分页即返回全量，total 即真实底库数；个别后端缺 total 时按 items 长度兜底
    const counts: number[] = list.map(({ items, total }) =>
      typeof total === 'number' && total >= 0 ? total : items.length)
    serverFaceCount.value = counts.reduce((n, c) => n + c, 0)
    // 以服务端为权威清理本地登记簿幽灵条目（服务端已删、本地 localStorage 残留）——
    // 注意：图廊与「已登记 N 张」都以服务端列表渲染，清理本地不影响计数显示。
    // 只清**选中的分组**：别的分组的档案在服务端同样存在，拿本组列表去比对会把它们误判成幽灵。
    if (list.length > 0 || registry.records.value.length > 0) {
      let changed = false
      for (const r of [...registry.records.value]) {
        if (groups.value.includes(normalizeGroupName(r.group))) continue
        if (!serverIds.has(r.id)) {
          registry.remove(r.id, normalizeGroupName(r.group))
          changed = true
        }
      }
      if (changed) console.info('[人脸识别] 已按服务端列表清理本地登记簿幽灵条目')
    }
  } catch {
    // 拉不到就退回本地登记簿（不阻断识别本身）；计数保持上次值
    serverMeta.value = {}
  }
}

/**
 * 切换分组（多选检索范围）。
 *
 * <p>防止参数被误传：多选选择器把完整的组名列表写入 {@link groups} 并调用
 * {@link setGroups}（让 {@link group} 与第一组分选同步），这里只做副作用
 * （手输的新分组进选项；换组 = 换了一整套人脸库，清空本次识别结果），
 * 这样接口改动不污染调用方的函数签名解析。</p>
 *
 * @param selected 选中的分组（多选时为列表，单值时为字符串，不传则沿用当前列表）
 */
function onGroupChange(selected?: string | string[]) {
  const current = Array.isArray(selected) ? selected : (typeof selected === 'string' ? [selected] : groups.value)
  setGroups(current)
  // 已选组全部进选项（手输的新分组尤其要进，否则下次打开下拉又选不到它）
  rememberGroups(current)
  // 换组 = 换了一整套人脸库：上一组的命中结果留在屏幕上会与「已登记 N 张」自相矛盾
  matches.value = []
  hits.value = []
  pickedId.value = ''
  identifyDone.value = false
  void loadServerMeta()
}

/** 目标人脸（取面积最大的一张） */
const mainHit = computed<FaceHit | null>(() => {
  if (!hits.value.length) return null
  return hits.value.reduce((a, b) => (b.box.width * b.box.height > a.box.width * a.box.height ? b : a))
})

const landmarks = computed<number[][]>(() => {
  const kp = mainHit.value?.box.keypoints
  if (!Array.isArray(kp)) return []
  return kp.filter((p) => Array.isArray(p) && p.length >= 2).map((p) => [Number(p[0]), Number(p[1])])
})

const busy = computed(() => detecting.value || identifying.value)

/**
 * 推荐卡片。
 *
 * <p>档案字段优先取后端命中回传的 {@code metadata}（登记时随向量一起存的），
 * 缺失时回落到前端登记簿 —— 因为向量库没有列举接口，metadata 不一定带得回来。</p>
 */
interface HitCard {
  id: string
  score: number
  name: string
  caption: string
  thumb: string
  age: number | null
  hair: string
  photogenic: number
  idCardMasked: string
}

const cards = computed<HitCard[]>(() =>
  matches.value.map((m) => {
    // 档案优先取**服务端列表**（权威，换浏览器也在），其次 hit 自带metadata（当前后端不回），
    // 最后才落到本地登记簿 —— 本地只用来补缩略图。
    const sv = serverMeta.value[String(m.id)] ?? {}
    const meta = (Object.keys(sv).length ? sv : (m.metadata ?? {})) as Record<string, any>
    const local = registryLookup(String(m.id))
    const name = String(meta.name ?? meta.label ?? local?.name ?? m.id)
    const age = meta.age ?? local?.age ?? null
    const gender = String(meta.gender ?? local?.gender ?? '')
    const hair = String(meta.hair ?? local?.hair ?? '')
    const photogenic = Number(meta.photogenic ?? local?.photogenic ?? 0)
    const idCard = String(meta.idCard ?? local?.idCard ?? '')

    // 真实字段拼说明文案；没有档案字段就用占位符 —— 姓名已单独渲染在 .fs-card-name，
    // 这里不再回落成姓名，否则同一张卡片会把姓名显示两遍
    const bits: string[] = []
    if (gender && gender !== '未知') bits.push(gender)
    if (age != null && Number.isFinite(Number(age))) bits.push(`${age}岁`)
    if (hair) bits.push(hair)
    const caption = bits.length ? bits.join(' · ') : '—'

    return {
      id: String(m.id),
      score: Number(m.score ?? 0),
      name,
      caption,
      thumb: local?.thumb ?? (typeof meta.thumb === 'string' ? meta.thumb : ''),
      age: age == null ? null : Number(age),
      hair,
      photogenic,
      idCardMasked: maskIdCard(idCard),
    }
  }),
)

/**
 * 分类页签：全部按登记档案信息筛选。
 *
 * <p>属性/发型/上镜感<b>不是模型推理出来的</b> —— 年龄性别表情的 onnx 权重本地是空的，
 * 这里筛的是登记时人工录入的档案字段。</p>
 */
const TABS = [
  { key: 'all', label: '全部', hint: '全部命中' },
  { key: 'age', label: '同年龄段', hint: '按登记年龄，差 5 岁内' },
  { key: 'hair', label: '相似发型', hint: '按登记发型' },
  { key: 'shot', label: '上镜感', hint: '按登记的上镜感评分（4 星以上）' },
] as const

const activeTab = ref<string>('all')

/** 当前查询图自己的档案（若它也在登记簿里，用于同龄段比较） */
const queryRecord = computed<FaceRecord | undefined>(() => registryLookup(galleryKey.value))

const visibleHits = computed<HitCard[]>(() => {
  const list = cards.value
  if (activeTab.value === 'age') {
    const base = queryRecord.value?.age
    return list.filter((c) => c.age != null && isSameAgeRange(base ?? c.age, c.age))
  }
  if (activeTab.value === 'hair') {
    const hair = queryRecord.value?.hair
    if (!hair) return list.filter((c) => !!c.hair)
    return list.filter((c) => c.hair === hair)
  }
  if (activeTab.value === 'shot') {
    return list.filter((c) => c.photogenic >= 4).sort((a, b) => b.photogenic - a.photogenic)
  }
  return list
})

const blankTitle = computed(() => {
  if (identifying.value) return '正在比对…'
  if (!previewUrl.value) return '等待上传照片'
  if (cards.value.length && !visibleHits.value.length) return '该分类下没有结果'
  if (registry.records.value.length) return '人脸库为空或已重置'
  return '还没有登记任何人脸'
})

const blankDesc = computed(() => {
  if (identifying.value) return '正在与已登记人脸逐一比对'
  if (!previewUrl.value) return '上传一张含人脸的照片，这里会给出最像的几张'
  if (cards.value.length && !visibleHits.value.length) return '换个分类看看，或先登记更多档案'
  if (registry.records.value.length) return '向量库是内存存储，后端重启后会清空，需要重新登记'
  return '先点「人脸登记入库」录入档案（含年龄、身份证等），再上传照片（自动识别）或点「识别」'
})

/** 右缘悬浮工具条的一项 */
interface RailTool {
  key: string
  title: string
  icon: any
  active: () => boolean
  toggle: () => void
  /** 返回 false 时该按钮**不渲染**（如 landmark 模型未配置就不显示特征点开关） */
  visible?: () => boolean
  /** 返回 true 时该按钮置灰（常驻但当前不可用，如空态的清空） */
  disabled?: () => boolean
  /** 附加样式类（如清空按钮的 is-danger 危险色悬停） */
  cls?: string
}

/** 右缘悬浮工具条 */
const RAIL: RailTool[] = [
  { key: 'box', title: '显示/隐藏人脸框', icon: Crop, active: () => showBox.value, toggle: () => { showBox.value = !showBox.value } },
  { key: 'landmark', title: '显示/隐藏关键点', icon: Aim, active: () => showLandmark.value, toggle: () => { showLandmark.value = !showLandmark.value } },
  { key: 'ring', title: '显示/隐藏相似度环', icon: View, active: () => showRing.value, toggle: () => { showRing.value = !showRing.value } },
  {
    key: 'landmark106',
    title: '显示/隐藏 106 点人脸特征点（需 landmark 模型已配置）',
    icon: Aim,
    active: () => showLandmark106.value,
    toggle: () => {
      showLandmark106.value = !showLandmark106.value
      if (showLandmark106.value) void runLandmark106()
      else { landmarks106.value = []; landmark106Error.value = '' }
    },
    // 关键点模型没配置 → 整个入口不显示（不是置灰：没配置时点了也只会得到业务错误）
    visible: () => landmarkReady.value,
  },
  {
    key: 'pick',
    title: '选择/更换上传图片',
    icon: FolderOpened,
    active: () => false,
    toggle: () => pickImage(),
  },
  {
    key: 'enroll',
    title: '人脸登记入库',
    icon: Star,
    active: () => enrollVisible.value,
    toggle: () => { openEnroll() },
    // 检测/特征模型未配齐或已配置但未注册时登记必然失败，入口不渲染
    visible: () => faceUsable.value,
  },
  {
    key: 'clear',
    title: '清空当前图片与识别结果（不影响已登记底库）',
    icon: Delete,
    // 动作类按钮：不表示"开启中"，只借 active 关闭态做置灰
    active: () => false,
    toggle: () => { clearWorkspace() },
    // 常驻置灰：空态保留按钮位置，有内容才可点
    disabled: () => !hasWorkspace.value,
    // 危险动作：悬停给红色，避免与旁边几个"开关"混淆
    cls: 'is-danger',
  },
]

/** 右缘工具条：按当前配置过滤（如 landmark 模型未配置就不显示 106 点开关） */
const railItems = computed(() => RAIL.filter((t) => (t.visible ? t.visible() : true)))

/** 余弦相似度 → 百分比展示 */
function percent(score: number): number {
  const v = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(v)))
}

function ringOffset(score: number): number {
  return RING_C * (1 - Math.max(0, Math.min(1, score <= 1 ? score : score / 100)))
}

/**
 * 角标副文案：显示识别的真实结果数据。
 *
 * <p>此前这里是恒定的「匹配度参考」四个字，没有任何信息量。现在按状态给出
 * 最高匹配度、命中张数；识别中/未识别/未命中各有对应文案。</p>
 */
const foundSub = computed(() => {
  if (identifying.value) return '正在与人脸库比对…'
  if (!identifyDone.value) return '已检出人脸'
  if (!matches.value.length) return '未命中库中人脸'
  const top = Math.max(...matches.value.map((m) => m.score))
  return `最高匹配度 ${percent(top)}% · 命中 ${matches.value.length} 张`
})

function openEnroll() {
  // 登记同样依赖检测 + 特征模型：未配齐或不注册时不打开对话框，
  // 否则用户填完档案才在第一步（检测）失败。
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  enrollVisible.value = true
}

function onEnrolled() {
  galleryKey.value = ''
  matches.value = []
}

/**
 * 加载模型门禁状态。
 *
 * <p>不再读 {@code /face/config}：那个口回数据库原值，2026-09-30 的一次性种子行
 * 也在里面，「从没配过」也会返回 {@code scrfd-face-detector} / {@code arc-face}，
 * 与设置中心的「请选择模型」自相矛盾。判据统一走 store 的合并视图。</p>
 */
async function loadModels() {
  await modelConfig.load()
}

function pickImage() {
  // 模型未配齐或未注册：连文件选择器都不弹（不是选完才拦）——「选择图片」按钮已 disabled，
  // 空态区点击与拖放同样走这里，一句话说清差哪几项、去哪儿配。
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  fileInput.value?.click()
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) void loadFile(f)
  input.value = ''
}

async function loadFile(file: File) {
  // 模型未配齐或未注册：不进入识别流程（上传/拖放两条入口都经过这里）
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  revokePreview()
  previewUrl.value = URL.createObjectURL(file)
  galleryKey.value = ''
  pickedId.value = ''
  matches.value = []
  hits.value = []
  landmarks106.value = []
  landmark106Error.value = ''
  identifyDone.value = false
  await runDetect(file)
  // 上传后自动识别一次：此前上传完还必须再手动点一次「重新识别」才出比对结果
  if (hits.value.length) await runIdentify()
}

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

/**
 * 清空当前工作区：当前图片 + 检测/识别结果 + 叠加数据。
 *
 * <p>只清「这一次上传的临时状态」，**不动已登记的人脸库** —— 底库是用户长期资产，
 * 用一个悬浮条按钮就抹掉属于误导性破坏。底库管理在「系统设置 → 底库 → 人脸底库」。</p>
 *
 * <p>顺带把叠加层开关恢复默认：清空后画面回到初始空态，用户下一次上传
 * 期望看到的是默认标注（人脸框/关键点/相似度环都开），而不是上次调过的组合。</p>
 */
function clearWorkspace() {
  revokePreview()
  natural.value = { w: 1, h: 1 }
  hits.value = []
  matches.value = []
  pickedId.value = ''
  galleryKey.value = ''
  identifyDone.value = false
  landmarks106.value = []
  landmark106Error.value = ''
  landmark106Busy.value = false
  showBox.value = true
  showLandmark.value = true
  showRing.value = true
}

/** 是否有可清空的内容（决定按钮是否可点、要不要置灰） */
const hasWorkspace = computed(
  () => !!previewUrl.value || hits.value.length > 0 || matches.value.length > 0,
)

/** 读图片原始尺寸，作为叠加层 viewBox */
function readNaturalSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 })
    im.onerror = () => resolve({ w: 1, h: 1 })
    im.src = url
  })
}

async function runDetect(file: File) {
  // 双保险：门禁可能在会话中途被改空（设置中心清空了模型），这里再挡一次
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  detecting.value = true
  try {
    natural.value = await readNaturalSize(previewUrl.value)
    const res = await apiService.detectFace(file, file.name)
    hits.value = res.faces ?? []
    if (!hits.value.length) {
      message.warning('未检测到人脸，请换一张正面清晰的照片')
    }
  } catch (e: any) {
    message.error(`人脸检测失败：${e?.message ?? e}`)
  } finally {
    detecting.value = false
  }
  // 开关已打开时，换图后同步刷新 106 点特征点
  if (showLandmark106.value) void runLandmark106()
}

/**
 * 拉当前图的 106 点特征点（后端已映射回**原图像素**）。
 *
 * <p>失败**不打断主流程**（检测/识别照常）：把原因记在 `landmark106Error`
 * 里，界面上给一句可见的说明 —— 最常见的原因是 landmark 模型没配（后端会回业务错误）。</p>
 */
async function runLandmark106() {
  if (!previewUrl.value) return
  // 双保险：开关此刻本不该渲染（landmarkReady=false），但配置可能在会话中途被改空，
  // 这里再挡一次，不让一个必然回「能力未启用」的请求打到后端。
  if (!landmarkReady.value) {
    landmark106Error.value = '人脸关键点模型未配置（系统配置 → 人脸识别 → landmark_model）'
    return
  }
  landmark106Busy.value = true
  landmark106Error.value = ''
  try {
    const blob = await (await fetch(previewUrl.value)).blob()
    const res = await apiService.landmarkFace(blob, 'landmark.png')
    if (!res.matched || !res.points.length) {
      landmarks106.value = []
      landmark106Error.value = '未返回特征点（landmark 模型未配置或未检出人脸）'
      return
    }
    const pts: number[][] = []
    for (let i = 0; i + 1 < res.points.length; i += 2) pts.push([res.points[i], res.points[i + 1]])

    // 坐标自校验（不信任后端口径，也不相信自己）：管线方法应当把点映射回原图像素，
    // 因此绝大多数点必须同时落在「原图范围内」且「人脸框内」。任一不成立都拒画并说明，
    // 绝不在界面上画出错误图形 —— 这是「判据只加强不放松」在 UI 侧的同一条口径。
    const w = natural.value.w || 1
    const h = natural.value.h || 1
    const inImage = pts.every(([x, y]) => x >= -2 && y >= -2 && x <= w + 2 && y <= h + 2)
    let inBox = true
    const box = res.box
    if (box && Number.isFinite(Number(box.x)) && Number(box.width) > 0) {
      const pad = Math.max(6, Number(box.width) * 0.3)
      const inner = pts.filter(
        ([x, y]) =>
          x >= Number(box.x) - pad &&
          y >= Number(box.y) - pad &&
          x <= Number(box.x) + Number(box.width) + pad &&
          y <= Number(box.y) + Number(box.height) + pad,
      ).length
      inBox = inner >= Math.ceil(pts.length * 0.8)
    }
    if (!inImage || !inBox) {
      landmarks106.value = []
      landmark106Error.value = '特征点坐标校验未通过（未落在原图/人脸框内），已拒绝绘制'
      return
    }
    landmarks106.value = pts
  } catch (e: any) {
    landmarks106.value = []
    landmark106Error.value = String(e?.message ?? e).slice(0, 120)
  } finally {
    landmark106Busy.value = false
  }
}

/** 1:N 识别：拿当前照片与向量库比对 */
async function runIdentify() {
  if (!previewUrl.value) return
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  identifying.value = true
  try {
    const blob = await (await fetch(previewUrl.value)).blob()
    // 多选检索范围：后端收逗号分隔，这边直接把选中的分组集合扔过去
    const res = await apiService.identifyFace(blob, 'query.png', groups.value)
    matches.value = res.hits ?? []
    void loadServerMeta()
    pickedId.value = matches.value.length ? String(matches.value[0].id) : ''
    identifyDone.value = true
    if (!matches.value.length) {
      message.info(
        registry.records.value.length
          ? '没有命中任何已登记人脸（向量库可能已随服务重启清空）'
          : '人脸库为空，先点「人脸登记入库」录入档案',
      )
    }
  } catch (e: any) {
    message.error(`识别失败：${e?.message ?? e}`)
  } finally {
    identifying.value = false
  }
}

/** 裁剪脸部：用检测返回的裁剪图再识别一次，聚焦面部区域 */
async function recognizeCrop() {
  if (!faceUsable.value) {
    message.warning(gateWarning())
    return
  }
  const hit = mainHit.value
  if (!hit?.faceImage) {
    message.warning('没有拿到裁剪图，请重新检测')
    return
  }
  identifying.value = true
  try {
    const bin = atob(hit.faceImage)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i)
    const res = await apiService.identifyFace(new Blob([buf], { type: 'image/jpeg' }), 'crop.jpg', groups.value)
    matches.value = res.hits ?? []
    void loadServerMeta()
    pickedId.value = matches.value.length ? String(matches.value[0].id) : ''
    identifyDone.value = true
    message.success(matches.value.length ? `裁剪后命中 ${matches.value.length} 张` : '裁剪后未命中')
  } catch (e: any) {
    message.error(`裁剪识别失败：${e?.message ?? e}`)
  } finally {
    identifying.value = false
  }
}

onMounted(async () => {
  void loadModels()
  // 先拉分组选项再拉列表：否则下拉里只有 default，用户看不到自己已有的分组
  await loadGroups()
  void loadServerMeta()
})

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 结构色由 --color-* 收敛到 refactor.css 已映射好的 --el-*：
        --color-bg            → --el-bg-color
        --color-surface       → --el-bg-color
        --color-text          → --el-text-color-primary
        --color-text-gray     → --el-text-color-secondary
        --color-surface-border→ --el-border-color-lighter
        --color-surface-hover → --el-fill-color-light
   2. 品牌色（橙 + 青）是本页的**身份标识**：人脸框、关键点、相似度环、目录图标
      都靠「主橙 / 辅青」这一组固定色相被识别（且与 SVG 的 stroke 一致），
      换成语义色会和主题主色混成一片、失去「检测标记」的中性含义，
      故 --fs-brand / --fs-accent 系列**刻意保留色值**，
      亮暗两套取值在下方 :global(html.dark) 分支里各自固定。
   3. 卡片 / 容器不加投影。原 --fs-shadow（--mp-shadow-pop）只挂在三处，
      全部是「浮起来」的元素（悬空角标 / 右侧面板 / 右缘悬浮条），属 koi
      允许的第二类投影，只把色源从写死 rgba 换成随模式派生。
   4. 圆角、过渡统一取 --el-radius-* / --el-transition-duration-fast 令牌。
   ============================================================================ */
.fs-root {
  --fs-brand: #f97316;
  --fs-brand-2: #fb923c;
  --fs-accent: #06b6d4;
  --fs-accent-2: #14b8a6;

  --fs-bg: var(--el-bg-color);
  --fs-card: var(--el-bg-color);
  --fs-text: var(--el-text-color-primary);
  --fs-muted: var(--el-text-color-secondary);
  --fs-border: var(--el-border-color-lighter);
  --fs-hover: var(--el-fill-color-light);
  /* 原值 var(--mp-radius-lg, 14px) —— --mp-radius-lg 只在未被引入的
     modern-polish.css 里定义，故此前一直取兜底 14px；14 距 lg(12px)/xl(16px)
     各 2px，页面主容器取 lg 档（与 ReCard 同档） */
  --fs-radius: var(--el-radius-lg, 12px);
  /* 原值 var(--mp-radius, 11px) —— 同上，一直取兜底 11px；11 距 sm(6px)/md(8px)/
     lg(12px) 中 lg 更近，取 lg 档 */
  --fs-radius-sm: var(--el-radius-lg, 12px);
  /* 悬浮层投影：原值 --mp-shadow-pop（同样未被引入，实际吃兜底 0 10px 30px -10px
     rgba(16,24,40,.22)）。改从正文色派生，深色模式下自动变暗，不会糊成黑块 */
  --fs-shadow: 0 10px 30px -10px color-mix(in srgb, var(--el-text-color-primary) 22%, transparent);

  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--fs-bg);
  color: var(--fs-text);
}

:global(html.dark) .fs-root {
  --fs-brand: #fb923c;
  --fs-brand-2: #fdba74;
  --fs-accent: #22d3ee;
  --fs-accent-2: #2dd4bf;
  /* 深色下原值 0 14px 36px -10px rgba(0,0,0,.6) 的黑色投影在深底上完全不可见，
     改从正文色（此时是浅色）派生才能继续表达「浮起」 */
  --fs-shadow: 0 14px 36px -10px color-mix(in srgb, var(--el-text-color-primary) 22%, transparent);
}

.fs-body {
  position: relative;
  display: flex;
  gap: 24px;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

/* ---------------- 分组条 ---------------- */
/*
 * 分组是「当前工作库」的选择器，不属于任何一次识别参数，
 * 因此独立成条常驻在舞台顶部（不随 previewUrl 显隐）。
 */
.fs-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--fs-border);
  border-radius: var(--fs-radius);
  background: var(--fs-card);
}

.fs-group-icon {
  color: var(--fs-accent);
}

.fs-group-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--fs-muted);
}

.fs-group-select {
  width: 200px;
  flex: 0 0 200px;
}

.fs-group-hint {
  font-size: 12px;
  color: var(--fs-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------------- 左侧舞台 ---------------- */
.fs-stage {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fs-stage-inner {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.fs-canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: var(--fs-radius);
  overflow: hidden;
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
}

.fs-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.fs-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.fs-box {
  fill: none;
  stroke: var(--fs-accent);
  stroke-width: 4;
  stroke-dasharray: 14 10;
  filter: drop-shadow(0 0 6px var(--fs-accent));
}

/* SVG 关键点填充：盖在照片上必须是纯白才能在任何肤色/背景下都看得见，
   故这里的 #fff 是功能性固定色，不参与换肤（描边才是本页身份色 --fs-accent） */
.fs-kp {
  fill: #fff;
  stroke: var(--fs-accent);
  stroke-width: 3;
}

/* 106 点特征点：点必须比检测器那 5 点小得多（106 个挤在脸上），
   用本页身份色（主橙）+ 白描边，保证在任意肤色/背景上都看得清 */
.fs-kp106 {
  fill: var(--fs-brand);
  stroke: #fff;
  stroke-width: 1;
}

/* 106 点层的状态说明：贴舞台顶部居中，与 .fs-noface 同风格 */
.fs-lm-hint {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
  color: var(--fs-muted);
  font-size: 13px;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 识别中遮罩：盖在用户照片上，色源从卡片底派生（半透明），
   照片明暗不可控，所以用 --fs-card 而不是固定黑 */
.fs-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: color-mix(in srgb, var(--fs-card) 72%, transparent);
  color: var(--fs-muted);
  font-size: 14px;
}

/* 遮罩文字：跟 ReLoader 动画本体的文字区分开，这里是说明性长句 */
.fs-mask-text {
  font-size: 14px;
  color: var(--fs-muted);
}

.fs-found {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 12px 18px;
  border-radius: var(--fs-radius-sm);
  background: var(--fs-card);
  box-shadow: var(--fs-shadow);
  text-align: center;
}

.fs-found-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--fs-brand);
  font-size: 15px;
}

.fs-found-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--fs-accent);
}

.fs-noface {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
  color: var(--fs-muted);
  font-size: 13px;
  white-space: nowrap;
}

/* 空态 */
.fs-drop {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--fs-radius);
  border: 2px dashed var(--fs-border);
  background: var(--fs-card);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 空态拖放区是 div + @click：补键盘焦点环 */
.fs-drop:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-drop:hover {
  border-color: var(--fs-accent);
  background: var(--fs-hover);
}

.fs-drop-icon { color: var(--fs-accent); }
.fs-drop-title { margin: 4px 0 0; font-size: 16px; font-weight: 600; }
.fs-drop-desc { margin: 0; font-size: 13px; color: var(--fs-muted); }
.fs-drop-btn { margin-top: 10px; }

/* 操作条 */
.fs-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
}

/* 三个胶囊按钮的实底（主橙 / 主青渐变），文字一律纯白保证对比；
   底色是本页身份色，故白字是唯一可行的前景色 */
.fs-btn {
  height: 46px;
  padding: 0 30px;
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 15px;
  font-weight: 600;
  border: none;
  color: var(--el-color-white);
}

.fs-btn-ghost {
  background: var(--fs-card);
  color: var(--fs-brand);
  border: 2px solid var(--fs-brand);
}

.fs-btn-accent {
  background: linear-gradient(135deg, var(--fs-accent-2), var(--fs-accent));
}

.fs-btn-brand {
  background: linear-gradient(135deg, var(--fs-brand-2), var(--fs-brand));
}

.fs-btn:disabled { opacity: 0.5; }

/* ---------------- 右侧面板 ---------------- */
/* 右侧面板：原带 box-shadow(--fs-shadow)。它是与舞台并列的**常驻侧栏**，
   不是浮层也不是卡片，按 koi 规约去掉投影，层次改由 1px 边框 + 留白表达 */
.fs-panel {
  width: 400px;
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  box-sizing: border-box;
  border-radius: var(--fs-radius);
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
  overflow-y: auto;
}

.fs-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fs-panel-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.fs-dots { display: flex; gap: 4px; }
.fs-dots i {
  width: 5px; height: 5px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--fs-accent);
}

/* 页签 */
.fs-tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--fs-hover);
}

.fs-tab {
  flex: 1 1 0;
  height: 34px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  color: var(--fs-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

.fs-tab:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 选中项从凹槽里「抬起」，投影在这里是功能必需的（不是卡片投影）：
   四个页签底色与凹槽几乎同色，去掉就分不清选中的是哪一个 */
.fs-tab.is-active {
  background: var(--fs-card);
  color: var(--fs-brand);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
}

/* 结果网格 */
.fs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fs-card {
  padding: 10px;
  border-radius: var(--fs-radius-sm);
  border: 1px solid var(--fs-border);
  background: var(--fs-card);
  cursor: pointer;
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 卡片是 div + @click（可选中的人脸）：补键盘焦点环 */
.fs-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* hover 上浮：koi 允许的第二类投影（悬浮反馈） */
.fs-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--fs-shadow);
}

.fs-card.is-picked { border-color: var(--fs-brand); }

.fs-card-face {
  position: relative;
  aspect-ratio: 1;
  /* 原值 50%（正圆头像）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  overflow: hidden;
  background: var(--fs-hover);
}

.fs-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fs-card-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; color: var(--fs-muted);
}

/* 相似度环 */
.fs-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  pointer-events: none;
}

.fs-ring-track {
  fill: none;
  stroke: color-mix(in srgb, var(--fs-brand) 22%, transparent);
  stroke-width: 7;
}

.fs-ring-bar {
  fill: none;
  stroke: var(--fs-brand);
  stroke-width: 7;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--el-transition-duration-fast, 0.2s) ease;
}

/* 选中勾：实心身份色圆底上的对勾，底色恒为主橙，故前景固定纯白 */
.fs-check {
  position: absolute;
  top: 6px; right: 6px;
  width: 22px; height: 22px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--fs-brand);
  color: var(--el-color-white);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}

.fs-card-cap {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--fs-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 姓名行：与 .fs-card-cap 分开渲染 —— 姓名是主体，属性位是补充；
   卡片高亮主橙用于区分「这个人」和「相似度/属性」三组信息 */
.fs-card-name {
  margin: 0 0 2px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--fs-brand);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.3em;
}

.fs-card-score { color: var(--fs-brand); font-size: 13px; }
.fs-card-sep { margin: 0 4px; }

.fs-card-id {
  margin: 3px 0 2px;
  text-align: center;
  font-size: 11px;
  color: var(--fs-muted);
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空态 */
.fs-blank {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 12px;
  text-align: center;
}

.fs-blank-icon { color: var(--fs-border); }
.fs-blank-title { margin: 4px 0 0; font-weight: 600; }
.fs-blank-desc { margin: 0; font-size: 12px; color: var(--fs-muted); line-height: 1.7; }

/* 相册 */
.fs-gallery {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.fs-thumb {
  width: 52px; height: 52px;
  flex: 0 0 52px;
  padding: 0;
  border-radius: var(--fs-radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--fs-hover);
  color: var(--fs-muted);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.fs-thumb:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-thumb.is-active { border-color: var(--fs-brand); }
.fs-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 主行动 */
.fs-cta {
  height: 50px;
  border: none;
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--fs-accent-2), var(--fs-accent));
}

.fs-cta:disabled { opacity: 0.5; }

.fs-gallery-hint {
  margin: -6px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--fs-muted);
}

.fs-gallery-hint b { color: var(--fs-accent); }

/* 模型说明 */
.fs-model {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--fs-muted);
}

.fs-model b { color: var(--fs-accent); font-weight: 600; }
.fs-dot { opacity: 0.5; }

/* 模型未配齐的门禁提示：与以图搜图的 .is-hint 同一套语言（图标 + 标题 + 说明），
   配色取告警语义色而非品牌橙 —— 这里是「缺配置」的提示，不是人脸检测标记。 */
.fs-gate {
  margin-top: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  text-align: left;
  border: 1px solid var(--el-color-warning-light-5, #e6a23c);
  border-radius: var(--fs-radius);
  background: var(--el-color-warning-light-9, #fdf6ec);
  color: var(--el-text-color-primary);
}

.fs-gate > .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-warning, #e6a23c);
}

.fs-gate-title {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
}

.fs-gate-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--fs-muted);
}

/* ---------------- 右缘悬浮工具条 ---------------- */
.fs-rail {
  position: absolute;
  right: 440px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 5;
}

/* 右缘悬浮工具条：整条压在舞台之上，投影是「浮起来」的功能性提示，
   属 koi 允许的第二类 */
.fs-rail-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--fs-radius-sm);
  border: 1px solid var(--fs-border);
  background: var(--fs-card);
  color: var(--fs-muted);
  cursor: pointer;
  outline: none;
  box-shadow: var(--fs-shadow);
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

.fs-rail-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-rail-btn:hover { transform: translateY(-1px); }

.fs-rail-btn.is-on {
  color: var(--el-color-white);
  border-color: transparent;
  background: linear-gradient(135deg, var(--fs-accent-2), var(--fs-accent));
}

.fs-rail-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 清空是「动作」不是「开关」：常态与开关一致，只在悬停时转成危险色，
   让用户点之前就知道这一步是丢弃当前结果 */
.fs-rail-btn.is-danger:hover {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--fs-card));
}

.fs-hidden { display: none; }

/* 尊重系统「减少动态效果」偏好。
   ReLoader 的动画变体内部已自行降级（保留旋转/摆动但放慢，避免"看着没动"），
   这里只停原本地组件自身的过渡与悬浮位移。 */
@media (prefers-reduced-motion: reduce) {
  .fs-drop,
  .fs-tab,
  .fs-card,
  .fs-thumb,
  .fs-ring-bar,
  .fs-rail-btn {
    transition: none;
  }
  .fs-card:hover,
  .fs-rail-btn:hover {
    transform: none;
  }
}
</style>


