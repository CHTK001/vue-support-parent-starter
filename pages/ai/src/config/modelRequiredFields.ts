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
 *
 * <p>必选项<b>不一定是模型槽位</b>：音频两个分组的硬门禁其实是服务商（{@code provider}），
 * 后端在它为空的瞬间就抛「未配置 ASR/TTS 服务商」，而默认模型留空是有兜底的（自动档位）。
 * 所以这两组登记的是 {@code provider}，界面上「必选」徽标挂在服务商那一行 —— 按模型字段
 * 推导会得出「全部选配」，与门禁正好相反。</p>
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
   * 语音识别：ASR 服务商。
   *
   * <p>门禁落在 {@code provider} 上，不是 {@code default_model}：后端
   * {@code ApiAsrController.transcribe()} 在 provider 为空时直接抛「未配置 ASR 服务商」；
   * 而 default_model 的声明就是「留空/auto=由所选引擎自动使用推荐档位」，属于选配。</p>
   */
  asr: {
    capability: '语音识别',
    fields: ['provider'],
  },
  /**
   * 语音合成：TTS 服务商。
   *
   * <p>与 ASR 同口径：{@code ApiTtsController.tts()} 先取分组里的 provider，
   * 取不到再回落配置文件 {@code ai.tts.provider}，两处都空就抛「未配置 TTS 服务商」；
   * default_model 留空回落 {@code ai.tts.default-model}，同样是选配。</p>
   */
  tts: {
    capability: '语音合成',
    fields: ['provider'],
  },
  /**
   * RAG 知识库：Embedding 模型标识。
   *
   * <p>这一项留空不会报错，但比报错更糟：{@code RagClientManager} 会降级成
   * MemoryEmbeddingClient（伪向量，检索恒 0 命中），{@code embeddingIssue()} 与
   * {@code RagStatusController} 都把「知识库不可用」标在 {@code embedding_configured} 上，
   * 知识库页也是按它拦门禁。所以它属于「不配这项，检索能力就不可用」。</p>
   */
  rag: {
    capability: 'RAG 知识库检索',
    fields: ['rag_embedding_model_name'],
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
   * 都是「留空关闭」，故本组是三态里的「含必选项」，不是「全部必选」。</p>
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
 * 字段是否属于该分组的必选项（模型槽位或服务商字段都算）。
 *
 * @param group 分组标识
 * @param field 字段名
 * @return true 表示必选
 */
export function isRequiredField(group: string, field: string): boolean {
  if (!field) return false
  return requiredFieldsOf(group).includes(field)
}

/**
 * 分组的三态：含必选项 / 全部选配 / 无需配置。
 *
 * <p>按「页面实际渲染出来的字段」推导，而不是按后端定义推导：
 * 拆分组页面可能只放行部分字段（如人脸重识别页用 fields 白名单只取 ReID 那几项），
 * 若按后端定义算，会把没渲染的必选项也算进来，徽标就说谎了。</p>
 */
export type GroupModelRequirement = 'required' | 'optional' | 'none'

/**
 * 推导分组的必选三态。
 *
 * @param group 分组标识
 * @param displayedBadgeFields 该分组当前渲染的、需要挂徽标的字段
 *        （模型槽位 + 必选项；服务商这类必选项不是模型槽位，但同样要计入）
 * @return required=组内含必选项；optional=有模型字段但都可留空；none=没有可挂徽标的字段
 */
export function resolveGroupRequirement(
  group: string,
  displayedBadgeFields: readonly string[],
): GroupModelRequirement {
  if (!displayedBadgeFields || displayedBadgeFields.length === 0) {
    return 'none'
  }
  return displayedBadgeFields.some((field) => isRequiredField(group, field))
    ? 'required'
    : 'optional'
}
