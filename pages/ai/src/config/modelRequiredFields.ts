/**
 * 「默认模型」的必选模型口径（分组 → 必选字段），单一来源。
 *
 * <p>为什么单独成模块：这份清单同时被两处消费，必须是同一份数据——</p>
 * <ul>
 *   <li>{@code stores/modelConfig.ts} 的能力门禁（faceReady / imageReady / colorizeReady /
 *       asrReady / ttsReady / ocrReady 的判定与「还缺哪几项」）；</li>
 *   <li>{@code components/setting/DefaultModelSettings.vue} 的分组徽标与字段徽标。</li>
 * </ul>
 * <p>以前门禁常量只写在 store 里，设置页上没有任何提示：用户只能把某项留空、保存、
 * 再去功能页发现「不可用」，才知道这项是必选的。若页面另抄一份清单，两处迟早漂移
 * （改了门禁忘了徽标，或徽标写「必选」、门禁其实不拦）。</p>
 *
 * <p>「必选」的口径是<b>能力门禁</b>，不是「留空会报错」：<br>
 * - 必选 = 不配这一项，对应能力就不可用（后端 {@code available()} 判定为 false，
 *   或调用时直接抛「未配置」）；<br>
 * - 选配 = 留空有兜底（自动挑第一个启用模型 / 走全局默认 / 留空即关闭该能力）。
 *   例如 {@code runtime.default_model} 留空=用第一个启用模型，{@code rag.rag_llm_model}
 *   留空走全局默认，{@code generate.image_model} 只是默认预选，都不在本表里。</p>
 */
export interface ModelRequiredGroup {
  /** 能力名，用于页面 tooltip（如「人脸识别需配置：检测模型 / 特征模型」） */
  capability: string
  /** 必选模型字段（与后端 GlobalSettingProvider.SettingItem.field 同名） */
  fields: readonly string[]
  /**
   * true = {@link fields} 任一配置即通过门禁；缺省 = 必须全部配置。
   *
   * <p>只给 OCR 用：后端 {@code OcrClientManager.available()} 的判定是
   * 「detector_model 或 recognizer_model 任一有值」，前端必须同口径，
   * 否则只配一项的用户会被卡在门外。</p>
   */
  anyOf?: boolean
}

/**
 * 分组 → 必选模型字段。
 *
 * <p>只列「存在必选模型」的分组：全部选配 / 没有模型的分组不出现，
 * 由 {@link resolveGroupRequirement} 按页面实际渲染的字段推导出另外两态。</p>
 */
export const MODEL_REQUIRED_FIELDS: Readonly<Record<string, ModelRequiredGroup>> = {
  /** 人脸识别：检测 + 特征两项都配齐才能建库/识别（FaceClientManager 到 ModelRegistry 查 session） */
  face: {
    capability: '人脸识别',
    fields: ['detector_model', 'feature_model'],
  },
  /** 以图搜图：默认图像特征模型（同一能力位的入口门禁） */
  image_search: {
    capability: '以图搜图',
    fields: ['default_image_feature_model'],
  },
  /** OCR：文字检测 / 文字识别，任一有值即可（后端 OcrClientManager.available() 同口径） */
  ocr: {
    capability: 'OCR',
    fields: ['detector_model', 'recognizer_model'],
    anyOf: true,
  },
  /**
   * 语音识别：ASR 默认模型。
   *
   * <p>只要求 default_model 一项：provider 缺省时后端走 whisper 本地推理，
   * 密钥/地址仅云端 ASR 才需要，作为必需门禁会把「本地 whisper」也一并挡掉。</p>
   */
  asr: {
    capability: '语音识别',
    fields: ['default_model'],
  },
  /**
   * 语音合成：TTS 默认模型。
   *
   * <p>与 ASR 同口径：provider 缺省时后端回落配置文件 {@code ai.tts.provider}。</p>
   */
  tts: {
    capability: '语音合成',
    fields: ['default_model'],
  },
  /** 版面分析：LayoutClientManager 在 layout_model 为空时直接抛「版面分析模型未配置」 */
  layout: {
    capability: '版面分析',
    fields: ['layout_model'],
  },
  /**
   * 图片识别：只有「图像上色」是必选（ColorizeClientManager.available() 的门禁）。
   *
   * <p>同组的 classify_model / detect_model / captioning_model / super_resolution_model
   * 都是「留空关闭」，故本组是三态里的「含必选模型」，不是「全部必选」。</p>
   */
  image: {
    capability: '图像上色',
    fields: ['colorize_model'],
  },
}

/**
 * 取分组的必选声明（不存在的分组返回 undefined）。
 *
 * @param group 分组标识（如 face / ocr / layout）
 * @return 必选声明，没有则 undefined
 */
export function requiredGroupOf(group: string): ModelRequiredGroup | undefined {
  if (!group) return undefined
  return MODEL_REQUIRED_FIELDS[group]
}

/**
 * 取分组的必选字段列表（没有必选项时返回空数组）。
 *
 * @param group 分组标识
 * @return 必选字段名列表，只读
 */
export function requiredFieldsOf(group: string): readonly string[] {
  return requiredGroupOf(group)?.fields ?? []
}

/**
 * 字段是否属于该分组的必选项。
 *
 * @param group 分组标识
 * @param field 字段名
 * @return true 表示必选
 */
export function isRequiredModelField(group: string, field: string): boolean {
  if (!field) return false
  return requiredFieldsOf(group).includes(field)
}

/**
 * 分组的三态：含必选模型 / 全部选配 / 无需模型。
 *
 * <p>按「页面实际渲染出来的模型字段」推导，而不是按后端定义推导：
 * 拆分组页面可能只放行部分字段（如人脸重识别页用 fields 白名单只取 ReID 那几项），
 * 若按后端定义算，会把没渲染的必选项也算进来，徽标就说谎了。</p>
 */
export type GroupModelRequirement = 'required' | 'optional' | 'none'

/**
 * 推导分组的必选三态。
 *
 * @param group 分组标识
 * @param displayedModelFields 该分组当前渲染的模型字段（调用方先过滤掉非模型字段）
 * @return required=组内含必选模型；optional=有模型字段但都可留空；none=没有模型字段
 */
export function resolveGroupRequirement(
  group: string,
  displayedModelFields: readonly string[],
): GroupModelRequirement {
  if (!displayedModelFields || displayedModelFields.length === 0) {
    return 'none'
  }
  return displayedModelFields.some((field) => isRequiredModelField(group, field))
    ? 'required'
    : 'optional'
}
