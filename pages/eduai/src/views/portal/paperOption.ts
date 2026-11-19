/**
 * 试卷选项解析 —— 学生作答页与「查看试卷」弹窗共用的同一口径。
 *
 * <p>题库里的选项是字符串：优先按 JSON 数组存，老数据退化按换行/分号切分。
 * 两处渲染必须用同一份解析，避免「作答页 4 个选项、详情弹窗显示 JSON 原文」的错位。</p>
 */

/** 解析选项字符串为选项数组（JSON 数组优先，退化按换行/分号切分） */
export function parseOptions(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return String(raw)
      .split(/\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

/** 选项字母：A、B、C…（与老师端阅卷按字母判分的口径一致） */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
