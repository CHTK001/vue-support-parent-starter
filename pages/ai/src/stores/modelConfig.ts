/**
 * 模型配置门禁 store（人脸识别 / 以图搜图 / 图像上色 / 音频识别）。
 *
 * <p>真配置口径：只认「当前用户本人覆盖」（origin === 'USER'），系统种子默认值
 * （origin === 'SYSTEM_DEFAULT'）一律视为未配置，fail-closed。</p>
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAccessToken } from '@repo/utils'
import { toMergedMap, isFieldConfigured, configuredValue, getItem, type MergedMapLike, type MergedSettingItem } from '../utils/modelConfigStatus'

/** 可被选为默认模型的注册 id 集合，来自 /api/providers（仅前端发货用的原始字段）。 */
interface RegisteredOnnxModel {
  provider_id?: string
  platform?: string
  model?: string
  available?: boolean
  external?: boolean
}

const FACE_REQUIRED = ['detector_model', 'feature_model'] as const
const IMAGE_REQUIRED = ['default_image_feature_model'] as const
const COLORIZE_REQUIRED = ['colorize_model'] as const
/**
 * 音频识别必需项：ASR 默认模型。
 *
 * <p>只要求 default_model 一项：provider 缺省时后端走 whisper 本地推理，
 * 密钥/地址仅云端 ASR 才需要，作为必需门禁会把「本地 whisper」也一并挡掉。
 */
const ASR_REQUIRED = ['default_model'] as const
/**
 * 语音合成必需项：TTS 默认模型。
 *
 * <p>与 ASR 同口径：provider 缺省时后端回落配置文件 {@code ai.tts.provider}，
 * 密钥/地址仅云端 TTS 才需要，作为必需门禁会把「本地合成」也一并挡掉。
 */
const TTS_REQUIRED = ['default_model'] as const
/**
 * OCR 必需项：文字检测 + 文字识别。
 *
 * <p>两级管线缺任一级都必然失败：只有检测、没有识别，出不了文本；只有识别、没有检测，
 * 不知道该去哪儿认。所以两项都进同一道门禁，与 face 的 detector+feature 同口径。</p>
 */
const OCR_REQUIRED = ['detector_model', 'recognizer_model'] as const

export const useModelConfigStore = defineStore('modelConfig', () => {
  const faceReady = ref(false)
  const imageReady = ref(false)
  const colorizeReady = ref(false)
  const asrReady = ref(false)
  const ttsReady = ref(false)
  const ocrReady = ref(false)
  const faceDetectorModel = ref('')
  const faceFeatureModel = ref('')
  const imageFeatureModel = ref('')
  const colorizeModel = ref('')
  const asrModel = ref('')
  const asrLanguage = ref('')
  const asrProvider = ref('')
  const ttsModel = ref('')
  const ttsVoice = ref('')
  const ttsProvider = ref('')
  const ocrDetectorModel = ref('')
  const ocrRecognizerModel = ref('')
  const faceMerged = ref<Record<string, any>>({})
  const imageMerged = ref<Record<string, any>>({})
  const colorizeMerged = ref<Record<string, any>>({})
  const asrMerged = ref<Record<string, any>>({})
  const ttsMerged = ref<Record<string, any>>({})
  const ocrMerged = ref<Record<string, any>>({})
  const faceMissing = ref<string[]>([])
  const imageMissing = ref<string[]>([])
  const colorizeMissing = ref<string[]>([])
  const asrMissing = ref<string[]>([])
  const ttsMissing = ref<string[]>([])
  const ocrMissing = ref<string[]>([])
  /** 后端当前仍注册且有可推断 id 的模型集合（providerId:modelName）。 */
  const registeredModelIds = ref<Set<string>>(new Set())
  /** 人脸服务专用可用模型名集合（来自 /v2/face/config/models 的 detector/feature/landmark）。 */
  const faceAvailableModelNames = ref<Set<string>>(new Set())
  /** 注册清单加载是否完成；失败时保持失败前状态，入口按“非空且未知”放行。 */
  const registeredLoaded = ref(false)
  /** 已配置但当前不在注册清单里的模型 id 列表（含未匹配上的字段） */
  const unregisteredConfigured = ref<string[]>([])
  const loaded = ref(false)
  let inflight: Promise<void> | null = null

  async function fetchMerged(group: string): Promise<MergedSettingItem[]> {
    const tk = getAccessToken()
    const r = await fetch(`/v2/settings/${group}/merged`, {
      headers: { 'x-oauth-token': tk || '' },
    })
    const j = await r.json()
    const items = (j?.data?.data || j?.data || []) as MergedSettingItem[]
    return Array.isArray(items) ? items : []
  }

  /** 拉取 /api/providers，收集当前注册且可用的模型 id（providerId:modelName）。 */
  async function fetchRegisteredModelIds(): Promise<void> {
    try {
      const tk = getAccessToken()
      const r = await fetch('/api/providers', { headers: { 'x-oauth-token': tk || '' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      const providers = Array.isArray(j) ? j : (j?.data ?? [])
      const ids = new Set<string>()
      if (Array.isArray(providers)) {
        for (const p of providers as Array<Record<string, unknown>>) {
          const providerId = String(p.provider_id ?? p.id ?? p.provider ?? '')
          const models = p.models ?? []
          if (!Array.isArray(models)) continue
          for (const m of models as RegisteredOnnxModel[]) {
            const modelName = m.model ?? m.modelName ?? m.id
            if (!providerId || !modelName) continue
            const isOnnx = String(p.provider_id) === 'onnx' || String(p.platform) === 'onnx'
            // 与模型选择弹框同口径：ONNX 内置模型 available=true（权重在）或 external=true（已绑定目录）才真正可用
            if (isOnnx && m.available !== true && m.external !== true) continue
            ids.add(`${providerId}:${modelName}`)
          }
        }
      }
      registeredModelIds.value = ids
      registeredLoaded.value = true
    } catch (e) {
      // 清单拉不到不能把门禁锁死：保留未知状态，后续仍由后端判定
      console.warn('加载注册模型清单失败，跳过存在性预检:', e)
      registeredLoaded.value = false
    }
  }

  /** 拉取 /v2/face/config/models，收集人脸服务实际可用的裸模型名。 */
  async function fetchFaceAvailableModelNames(): Promise<void> {
    try {
      const tk = getAccessToken()
      const r = await fetch('/v2/face/config/models', { headers: { 'x-oauth-token': tk || '' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      const data = j?.data ?? j ?? {}
      const names = new Set<string>()
      for (const key of ['detector', 'feature', 'landmark']) {
        const list = data?.[key]
        if (Array.isArray(list)) {
          for (const n of list) if (String(n ?? '').trim()) names.add(String(n))
        }
      }
      faceAvailableModelNames.value = names
    } catch (e) {
      console.warn('加载人脸可用模型清单失败，跳过存在性预检:', e)
      faceAvailableModelNames.value = new Set()
    }
  }

  function modelIsRegistered(id: string): boolean {
    if (!registeredLoaded.value) return true
    const raw = String(id ?? '')
    if (!raw.trim()) return false
    const idx = raw.indexOf(':')
    const bare = idx > -1 ? raw.slice(idx + 1) : raw
    // face 管线只认裸模型名：配置若带 provider 前缀（如 onnx:scrfd-face-detector），
    // 即使 /api/providers 目录里有，后端 FaceClientManager 到 ModelRegistry 查 session
    // 仍会报「模型未注册」→ 按未注册拦下并引导重选。
    if (faceAvailableModelNames.value.size) {
      return faceAvailableModelNames.value.has(raw) || (idx === -1 && faceAvailableModelNames.value.has(bare))
    }
    return registeredModelIds.value.has(raw) || registeredModelIds.value.has(bare)
  }

  function refreshUnregistered(map: MergedMapLike) {
    const unreg: string[] = []
    for (const f of FACE_REQUIRED) {
      if (isFieldConfigured(map, f) && !modelIsRegistered(String(getItem(map, f)?.value ?? ''))) {
        unreg.push(f)
      }
    }
    unregisteredConfigured.value = unreg
  }

  function applyFace(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    faceMerged.value = Object.fromEntries(map)
    faceDetectorModel.value = configuredValue(map, 'detector_model')
    faceFeatureModel.value = configuredValue(map, 'feature_model')
    faceReady.value = FACE_REQUIRED.every((f) => isFieldConfigured(map, f))
    faceMissing.value = FACE_REQUIRED.filter((f) => !isFieldConfigured(map, f))
    // 再判一层“注册可用”：字段配了、但模型已从 /api/providers 删除/停用，登记必然后端报“模型未注册”
    refreshUnregistered(map)
  }

  function applyImage(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    imageMerged.value = Object.fromEntries(map)
    imageFeatureModel.value = configuredValue(map, 'default_image_feature_model')
    imageReady.value = IMAGE_REQUIRED.every((f) => isFieldConfigured(map, f))
    imageMissing.value = IMAGE_REQUIRED.filter((f) => !isFieldConfigured(map, f))
  }

  function applyColorize(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    colorizeMerged.value = Object.fromEntries(map)
    colorizeModel.value = configuredValue(map, 'colorize_model')
    colorizeReady.value = COLORIZE_REQUIRED.every((f) => isFieldConfigured(map, f))
    colorizeMissing.value = COLORIZE_REQUIRED.filter((f) => !isFieldConfigured(map, f))
  }

  function applyAsr(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    asrMerged.value = Object.fromEntries(map)
    asrModel.value = configuredValue(map, 'default_model')
    asrLanguage.value = configuredValue(map, 'language')
    asrProvider.value = configuredValue(map, 'provider')
    asrReady.value = ASR_REQUIRED.every((f) => isFieldConfigured(map, f))
    asrMissing.value = ASR_REQUIRED.filter((f) => !isFieldConfigured(map, f))
  }

  function applyTts(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    ttsMerged.value = Object.fromEntries(map)
    ttsModel.value = configuredValue(map, 'default_model')
    ttsVoice.value = configuredValue(map, 'tts_voice')
    ttsProvider.value = configuredValue(map, 'provider')
    ttsReady.value = TTS_REQUIRED.every((f) => isFieldConfigured(map, f))
    ttsMissing.value = TTS_REQUIRED.filter((f) => !isFieldConfigured(map, f))
  }

  function applyOcr(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    ocrMerged.value = Object.fromEntries(map)
    ocrDetectorModel.value = configuredValue(map, 'detector_model')
    ocrRecognizerModel.value = configuredValue(map, 'recognizer_model')
    ocrReady.value = OCR_REQUIRED.every((f) => isFieldConfigured(map, f))
    ocrMissing.value = OCR_REQUIRED.filter((f) => !isFieldConfigured(map, f))
  }

  async function load(force = false) {
    if (!force && loaded.value) return
    if (inflight) return inflight
    inflight = (async () => {
      const [faceItems, imageItems, colorizeItems, asrItems, ttsItems, ocrItems] = await Promise.all([
        fetchMerged('face'),
        fetchMerged('image_search'),
        fetchMerged('image'),
        fetchMerged('asr'),
        fetchMerged('tts'),
        fetchMerged('ocr'),
      ])
      applyFace(faceItems)
      applyImage(imageItems)
      applyColorize(colorizeItems)
      applyAsr(asrItems)
      applyTts(ttsItems)
      applyOcr(ocrItems)
      await fetchRegisteredModelIds()
      await fetchFaceAvailableModelNames()
      // 注册清单就绪后重算一次“未注册”状态（face 先按旧清单算过，这里收敛）
      refreshUnregistered(toMergedMap(faceItems))
      loaded.value = true
    })().finally(() => {
      inflight = null
    })
    return inflight
  }

  async function refresh() {
    await load(true)
  }

  return {
    faceReady,
    imageReady,
    colorizeReady,
    asrReady,
    ttsReady,
    ocrReady,
    registeredModelIds,
    registeredLoaded,
    faceAvailableModelNames,
    unregisteredConfigured,
    faceDetectorModel,
    faceFeatureModel,
    imageFeatureModel,
    colorizeModel,
    asrModel,
    asrLanguage,
    asrProvider,
    ttsModel,
    ttsVoice,
    ttsProvider,
    ocrDetectorModel,
    ocrRecognizerModel,
    faceMerged,
    imageMerged,
    colorizeMerged,
    asrMerged,
    ttsMerged,
    ocrMerged,
    faceMissing,
    imageMissing,
    colorizeMissing,
    asrMissing,
    ttsMissing,
    ocrMissing,
    load,
    refresh,
  }
})
