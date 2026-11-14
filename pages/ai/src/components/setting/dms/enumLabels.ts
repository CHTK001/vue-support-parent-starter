/**
 * 设置项枚举的单一来源：从后端描述里解析**可选值**，以及把值翻成中文标签。
 *
 * <p>为什么单独成模块：同一份逻辑被三处消费 ——</p>
 * <ul>
 *   <li>{@code DefaultModelSettings.vue}（默认模型页）判定哪些 STRING 字段是下拉；</li>
 *   <li>{@code GeneralSettings.vue}（通用设置页）判定压缩等字段是不是下拉；</li>
 *   <li>{@code dms/FieldControl.vue} 渲染下拉选项的 label 与只读行的「当前值」。</li>
 * </ul>
 * <p>各抄一份时改了一边就会出现「控件是下拉、只读行是纯文本」这种自相矛盾。</p>
 */

/**
 * 合法枚举值的形状：ASCII 机器标识（{@code whisper} / {@code alibaba-asr} /
 * {@code COSINE} / {@code wav} / {@code qwen3:8b}）。
 *
 * <p>本仓库所有真实枚举值都是 ASCII，而描述里的**散文**同样用括号和斜杠
 * （「生成文件根目录（相对工作目录的基路径，其下按 账号 / 类型 / 上传目录 分层）」）。
 * 所以「括号里能按 / 切成 2~10 段」根本不足以判定枚举 —— 这条规则曾把 7 个文本字段
 * 渲染成下拉：选中「类型」这种碎片，就会把非法路径写进 {@code media_base_path}。</p>
 */
const ENUM_VALUE = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/

/** 单个描述段的最大长度（超过就是散文，不是取值） */
const MAX_VALUE_LENGTH = 50

/**
 * 从后端描述里解析枚举候选项。
 *
 * <p>约定：取值写在第一个括号里，用 {@code /} 分隔，每段是「值 + 可选中文说明」，
 * 如「匹配模式（strict 严谨 / loose 宽松）」。</p>
 *
 * <p>判定要求**每一段**都合格，任一段不合格就整体返回空数组（= 按普通文本渲染）：
 * 值是 ASCII 标识；说明一旦出现，必须以非 ASCII 字符开头（中文/全角标点）。
 * 后半条是关键：{@code asr.language} 的「（ISO 639-1，如 zh / en…）」首段值是
 * {@code ISO}、说明是 {@code 639-1，如 zh}，说明以 ASCII 开头 → 判为散文；
 * 而 {@code image_search.keyword_extractor} 的「ocr 使用 OCR」说明以中文开头 → 仍认作枚举。</p>
 *
 * @param description 后端字段描述（可能为空）
 * @return 可选值（按描述顺序）；不像枚举时返回空数组
 */
export function parseEnumOptions(description?: string | null): string[] {
  if (!description) return []
  const match = String(description).match(/[（(]([^）)]+)[）)]/)
  if (!match) return []
  const options: string[] = []
  for (const segment of match[1].split('/')) {
    const text = segment.trim()
    const value = text.split(/\s+/)[0] ?? ''
    const rest = text.slice(value.length).trim()
    if (!value || value.length >= MAX_VALUE_LENGTH || !ENUM_VALUE.test(value)) return []
    // 说明以 ASCII 字母/数字开头 → 这一段是散文（如「ISO 639-1，如 zh」），不是「值 + 中文说明」
    if (/^[A-Za-z0-9]/.test(rest)) return []
    options.push(value)
  }
  return options
}

/** 一个设置项的最小形状（只用到判定枚举的两列，便于纯逻辑自检） */
export interface EnumCandidate {
  valueType?: string | null
  description?: string | null
}

/**
 * 该字段是否应渲染成下拉（STRING 且描述里确实列了 2~10 个取值）。
 *
 * <p>固定选项字段（如 {@code rag_client_provider} 只有 pipeline）由调用方先行判定，
 * 因为固定项列表各页不同。</p>
 *
 * @param item 设置项定义
 * @return true 表示渲染下拉
 */
export function isEnumDefinition(item?: EnumCandidate | null): boolean {
  if (!item || item.valueType !== 'STRING') return false
  const count = parseEnumOptions(item.description).length
  return count >= 2 && count <= 10
}

/**
 * 枚举 key → 中文标签。
 *
 * <p>后端把可选值写在描述括号里，如「匹配模式（strict 严谨 / loose 宽松）」，
 * {@link parseEnumOptions} 只取空格前的部分作为**值**（strict / loose），直接拿来当
 * label 就会把英文 key 显示给用户。这里给这类「值是英文但含义不直观」的项补中文；
 * 未登记的选项原样显示，避免把用户本来认识的取值（模型名、provider）翻错。</p>
 */
export const ENUM_LABELS: Readonly<Record<string, string>> = {
  strict: '严谨',
  loose: '宽松',
  whole: '整卷',
  region: '按版面区域分块',
}

/**
 * 取枚举值的显示文本。
 *
 * @param value 枚举原始值（英文 key）
 * @return 中文标签；未登记则原样返回
 */
export function enumLabel(value: string): string {
  return ENUM_LABELS[value] ?? value
}
