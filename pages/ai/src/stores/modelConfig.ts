/**
 * 模型配置门禁 store（人脸识别 / 以图搜图 / 图像上色 / 音频识别）。
 *
 * <p>真配置口径：只认「当前用户本人覆盖」（origin === 'USER'），系统种子默认值
 * （origin === 'SYSTEM_DEFAULT'）一律视为未配置，fail-closed。</p>
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAccessToken } from '@repo/utils'
import { toMergedMap, isFieldConfigured, configuredValue, type MergedSettingItem } from '../utils/modelConfigStatus'

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

export const useModelConfigStore = defineStore('modelConfig', () => {
  const faceReady = ref(false)
  const imageReady = ref(false)
  const colorizeReady = ref(false)
  const asrReady = ref(false)
  const faceDetectorModel = ref('')
  const faceFeatureModel = ref('')
  const imageFeatureModel = ref('')
  const colorizeModel = ref('')
  const asrModel = ref('')
  const asrLanguage = ref('')
  const asrProvider = ref('')
  const faceMerged = ref<Record<string, any>>({})
  const imageMerged = ref<Record<string, any>>({})
  const colorizeMerged = ref<Record<string, any>>({})
  const asrMerged = ref<Record<string, any>>({})
  const faceMissing = ref<string[]>([])
  const imageMissing = ref<string[]>([])
  const colorizeMissing = ref<string[]>([])
  const asrMissing = ref<string[]>([])
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

  function applyFace(items: MergedSettingItem[]) {
    const map = toMergedMap(items)
    faceMerged.value = Object.fromEntries(map)
    faceDetectorModel.value = configuredValue(map, 'detector_model')
    faceFeatureModel.value = configuredValue(map, 'feature_model')
    faceReady.value = FACE_REQUIRED.every((f) => isFieldConfigured(map, f))
    faceMissing.value = FACE_REQUIRED.filter((f) => !isFieldConfigured(map, f))
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

  async function load(force = false) {
    if (!force && loaded.value) return
    if (inflight) return inflight
    inflight = (async () => {
      const [faceItems, imageItems, colorizeItems, asrItems] = await Promise.all([
        fetchMerged('face'),
        fetchMerged('image_search'),
        fetchMerged('image'),
        fetchMerged('asr'),
      ])
      applyFace(faceItems)
      applyImage(imageItems)
      applyColorize(colorizeItems)
      applyAsr(asrItems)
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
    faceDetectorModel,
    faceFeatureModel,
    imageFeatureModel,
    colorizeModel,
    asrModel,
    asrLanguage,
    asrProvider,
    faceMerged,
    imageMerged,
    colorizeMerged,
    asrMerged,
    faceMissing,
    imageMissing,
    colorizeMissing,
    asrMissing,
    load,
    refresh,
  }
})
