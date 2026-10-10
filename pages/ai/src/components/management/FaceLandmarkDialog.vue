<template>
  <!--
    人脸特征点查看/绘制弹窗（底库「特征点」动作）。

    为什么要有它：底库以前只能看**浏览器本地**存的缩略图，换浏览器/换账号就没有图，
    更谈不上在图上画特征点。后端现在会在登记时落存那张裁剪脸（`GET /v2/face/{id}/image`），
    本弹窗就是把它取回来、叠加关键点管线返回的 106 点。

    坐标口径：后端 `POST /v2/face/landmark-pipeline` 已经把点映射回**原图像素**
    （先按检测框裁脸取点、再映射回去），所以这里可以直接按原图尺寸做 viewBox 叠加，
    并且仍然做一次「点必须落在原图与人脸框内」的校验（判据只加强不放松：宁可拒画也不画错）。
  -->
  <el-dialog
    :model-value="modelValue"
    :title="`人脸特征点 · ${faceName || faceId || ''}`"
    width="720px"
    class="flm-dialog"
    append-to-body
    destroy-on-close
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @closed="cleanup"
  >
    <div class="flm-body">
      <div class="flm-stage">
        <img v-if="imgUrl" :src="imgUrl" class="flm-img" alt="人脸登记图" />
        <div v-else class="flm-empty">
          <el-icon :size="30"><Warning /></el-icon>
          <p>{{ emptyText }}</p>
        </div>
        <svg
          v-if="imgUrl && points.length"
          class="flm-overlay"
          :viewBox="`0 0 ${natural.w} ${natural.h}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            v-if="box"
            class="flm-box"
            :x="box.x"
            :y="box.y"
            :width="box.width"
            :height="box.height"
            rx="6"
          />
          <circle v-for="(p, i) in points" :key="'p' + i" class="flm-kp" :cx="p[0]" :cy="p[1]" r="2.4" />
        </svg>
      </div>

      <div class="flm-side">
        <div class="flm-stat">
          <span class="flm-stat-label">关键点</span>
          <strong class="flm-stat-value">{{ loading ? '…' : points.length }}</strong>
        </div>
        <div class="flm-stat">
          <span class="flm-stat-label">坐标口径</span>
          <strong class="flm-stat-value">{{ points.length ? '原图像素' : '—' }}</strong>
        </div>
        <div class="flm-stat">
          <span class="flm-stat-label">模型归一化</span>
          <strong class="flm-stat-value">{{ signed == null ? '—' : signed ? '[-1,1]' : '[0,1]' }}</strong>
        </div>

        <el-alert
          v-if="hint"
          class="flm-alert"
          :type="points.length ? 'success' : 'warning'"
          :closable="false"
          show-icon
          :title="hint"
        />
        <p class="flm-tip">
          特征点需要「人脸关键点模型」已配置（系统配置 → 人脸识别 → 关键点模型）；未配置时后端会返回明确原因。
        </p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 人脸特征点弹窗。
 *
 * <p>数据来源有两条路，按优先级回落：</p>
 * <ol>
 *   <li>服务端登记图（`GET /v2/face/{id}/image`，登记时落存的裁剪脸）—— 跨浏览器可见；</li>
 *   <li>本浏览器的本地缩略图（base64 data URL）—— 老数据（服务端还没落存图）时的兜底。</li>
 * </ol>
 *
 * <p>拿到图后调 `POST /v2/face/landmark-pipeline` 取**原图像素**坐标并叠加。</p>
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'

const props = defineProps<{
  modelValue: boolean
  faceId: string
  faceName?: string
  /** 本浏览器本地缩略图（data URL），服务端没图时兜底 */
  fallbackThumb?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const loading = ref(false)
const imgUrl = ref('')
const points = ref<number[][]>([])
const box = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const natural = ref({ w: 1, h: 1 })
const signed = ref<boolean | null>(null)
const hint = ref('')
const emptyText = ref('')

/** data URL → Blob（本地缩略图兜底路径用） */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl)
  if (!m) return null
  const mime = m[1] || 'image/png'
  const isB64 = !!m[2]
  const payload = m[3]
  try {
    if (isB64) {
      const bin = atob(payload)
      const buf = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i)
      return new Blob([buf], { type: mime })
    }
    return new Blob([decodeURIComponent(payload)], { type: mime })
  } catch {
    return null
  }
}

function readNaturalSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 })
    im.onerror = () => resolve({ w: 1, h: 1 })
    im.src = url
  })
}

function cleanup() {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value)
  imgUrl.value = ''
  points.value = []
  box.value = null
  signed.value = null
  hint.value = ''
  emptyText.value = ''
}

async function load() {
  cleanup()
  loading.value = true
  let objectUrl = ''
  try {
    let blob = await apiService.faceImageBlob(props.faceId)
    let source = '服务端登记图'
    if (!blob && props.fallbackThumb) {
      blob = dataUrlToBlob(props.fallbackThumb)
      source = '本机缩略图'
    }
    if (!blob) {
      emptyText.value = '该条没有服务端登记图（改造前登记的老数据），本浏览器也没有缩略图，无法绘制特征点'
      hint.value = '重新登记一次即可把裁剪脸落存到服务端'
      return
    }
    objectUrl = URL.createObjectURL(blob)
    imgUrl.value = objectUrl
    natural.value = await readNaturalSize(objectUrl)

    const res = await apiService.landmarkFace(blob, 'face.png')
    signed.value = res.signed ?? null
    if (!res.matched || !res.points.length) {
      hint.value = '未取到特征点：关键点模型未配置，或该图未检出人脸'
      return
    }
    const pts: number[][] = []
    for (let i = 0; i + 1 < res.points.length; i += 2) pts.push([res.points[i], res.points[i + 1]])
    // 坐标校验：必须落在原图范围内，且绝大多数点落在人脸框内；否则拒画（宁可空着也不画错）
    const w = natural.value.w || 1
    const h = natural.value.h || 1
    const inImage = pts.every(([x, y]) => x >= -2 && y >= -2 && x <= w + 2 && y <= h + 2)
    let inBox = true
    if (res.box && Number.isFinite(Number(res.box.x)) && Number(res.box.width) > 0) {
      const b = res.box
      const pad = Math.max(6, Number(b.width) * 0.3)
      const inner = pts.filter(
        ([x, y]) =>
          x >= Number(b.x) - pad &&
          y >= Number(b.y) - pad &&
          x <= Number(b.x) + Number(b.width) + pad &&
          y <= Number(b.y) + Number(b.height) + pad,
      ).length
      inBox = inner >= Math.ceil(pts.length * 0.8)
    }
    if (!inImage || !inBox) {
      hint.value = '特征点坐标校验未通过（未落在原图/人脸框内），已拒绝绘制'
      return
    }
    points.value = pts
    box.value = res.box
      ? { x: Number(res.box.x), y: Number(res.box.y), width: Number(res.box.width), height: Number(res.box.height) }
      : null
    hint.value = `已绘制 ${pts.length} 个特征点（取自${source}）`
  } catch (e: any) {
    hint.value = String(e?.message ?? e).slice(0, 120)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      void load()
    } else {
      cleanup()
    }
  },
)
</script>

<style scoped>
.flm-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
}
.flm-stage {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  height: 420px;
  overflow: hidden;
}
/*
 * 关键：图片与叠加层必须**同一盒**缩放，点的坐标才会落在图上。
 * 旧实现 img 只设 max-width/max-height（小图不放大），而 SVG 的
 * preserveAspectRatio=meet 会把 viewBox 放大铺满 stage —— 小于 stage 的
 * 登记图（如 112×112 的裁剪脸）上点会被放大 2~3 倍，偏到脸外。
 * 现在与识别页一致：img 铺满 stage 且 object-fit:contain，
 * SVG meet 与 contain 是同一套「等比缩放 + 居中留白」语义，二者严格重合。
 */
.flm-img {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.flm-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.flm-kp {
  fill: #ff7a1a;
  stroke: #fff;
  stroke-width: 0.8;
}
.flm-box {
  fill: none;
  stroke: #22d3ee;
  stroke-width: 1.6;
  stroke-dasharray: 6 5;
}
.flm-empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.flm-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.flm-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.flm-stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.flm-stat-value {
  font-size: 13px;
}
.flm-alert {
  margin-top: 2px;
}
.flm-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
