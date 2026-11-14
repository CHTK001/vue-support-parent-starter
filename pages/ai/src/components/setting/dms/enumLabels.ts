/**
 * 枚举 key → 中文标签（设置页专用，单一来源）。
 *
 * <p>后端把可选值写在描述括号里，如「匹配模式（strict 严谨 / loose 宽松）」，
 * 前端 parseEnumOptions 只取空格前的部分作为**值**（strict / loose），直接拿来当
 * label 就会把英文 key 显示给用户。这里给这类「值是英文但含义不直观」的项补中文；
 * 未登记的选项原样显示，避免把用户本来认识的取值（模型名、provider）翻错。</p>
 *
 * <p>为什么单独成模块：同一份映射被两处消费 ——</p>
 * <ul>
 *   <li>{@code dms/FieldControl.vue} 渲染下拉选项的 label；</li>
 *   <li>{@code DefaultModelSettings.vue} 渲染每行的「当前值」只读行。</li>
 * </ul>
 * <p>两处各抄一份时，只改了一边就会出现「控件显示严谨、只读行显示 strict」，
 * 用户会以为值被改过。</p>
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
