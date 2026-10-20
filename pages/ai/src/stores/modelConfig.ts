/**
 * 模型配置门禁 store（人脸识别 / 以图搜图）。
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

export const useModelConfigStore = defineStore('modelConfig', () => {
  const faceReady = ref(false)
  const imageReady = ref(false)
  const colorizeReady = ref(false)
  const faceDetectorModel = ref('')
  const faceFeatureModel = ref('')
  const imageFeatureModel = ref('')
  const colorizeModel = ref('')
  const faceMerged = ref<Record<string, any>>({})
  const imageMerged = ref<Record<string, any>>({})
  const colorizeMerged = ref<Record<string, any>>({})
  const faceMissing = ref<string[]>([])
  const imageMissing = ref<string[]>([])
  const colorizeMissing = ref<string[]>([])
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

  async function load(force = false) {
    if (!force && loaded.value) return
    if (inflight) return inflight
    inflight = (async () => {
      const [faceItems, imageItems, colorizeItems] = await Promise.all([
        fetchMerged('face'),
        fetchMerged('image_search'),
        fetchMerged('image'),
      ])
      applyFace(faceItems)
      applyImage(imageItems)
      applyColorize(colorizeItems)
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
    faceDetectorModel,
    faceFeatureModel,
    imageFeatureModel,
    colorizeModel,
    faceMerged,
    imageMerged,
    colorizeMerged,
    faceMissing,
    imageMissing,
    colorizeMissing,
    load,
    refresh,
  }
})
