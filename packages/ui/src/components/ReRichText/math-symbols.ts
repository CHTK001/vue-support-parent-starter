/**
 * 公式符号面板（ReRichText 行内公式 / ScFormulaField 共用）
 *
 * 点击后把 tex 片段追加到光标处；latex 写法遵循 KaTeX 支持的语法。
 */

export interface MathSymbol {
  label: string;
  tex: string;
}

/** 常用符号（覆盖中小学常用写作场景） */
export const MATH_SYMBOLS: MathSymbol[] = [
  // 结构
  { label: "√", tex: "\\sqrt{}" },
  { label: "ⁿ√", tex: "\\sqrt[n]{}" },
  { label: "a/b", tex: "\\frac{}{}" },
  { label: "x²", tex: "^{2}" },
  { label: "x³", tex: "^{3}" },
  { label: "xⁿ", tex: "^{n}" },
  { label: "xₙ", tex: "_{n}" },
  { label: "x̄", tex: "\\overline{}" },
  { label: "→x", tex: "\\vec{}" },
  { label: "|x|", tex: "\\left|{}\\right|" },
  // 运算
  { label: "±", tex: "\\pm" },
  { label: "∓", tex: "\\mp" },
  { label: "×", tex: "\\times" },
  { label: "÷", tex: "\\div" },
  { label: "·", tex: "\\cdot" },
  // 关系
  { label: "≠", tex: "\\neq" },
  { label: "≈", tex: "\\approx" },
  { label: "≡", tex: "\\equiv" },
  { label: "≤", tex: "\\leq" },
  { label: "≥", tex: "\\geq" },
  { label: "∝", tex: "\\propto" },
  // 集合
  { label: "∈", tex: "\\in" },
  { label: "∉", tex: "\\notin" },
  { label: "⊂", tex: "\\subset" },
  { label: "⊆", tex: "\\subseteq" },
  { label: "∪", tex: "\\cup" },
  { label: "∩", tex: "\\cap" },
  { label: "∅", tex: "\\varnothing" },
  // 逻辑 / 箭头
  { label: "∀", tex: "\\forall" },
  { label: "∃", tex: "\\exists" },
  { label: "⇒", tex: "\\Rightarrow" },
  { label: "⇔", tex: "\\Leftrightarrow" },
  { label: "→", tex: "\\to" },
  // 希腊字母
  { label: "α", tex: "\\alpha" },
  { label: "β", tex: "\\beta" },
  { label: "γ", tex: "\\gamma" },
  { label: "δ", tex: "\\delta" },
  { label: "ε", tex: "\\varepsilon" },
  { label: "θ", tex: "\\theta" },
  { label: "λ", tex: "\\lambda" },
  { label: "μ", tex: "\\mu" },
  { label: "π", tex: "\\pi" },
  { label: "ρ", tex: "\\rho" },
  { label: "σ", tex: "\\sigma" },
  { label: "φ", tex: "\\varphi" },
  { label: "ω", tex: "\\omega" },
  // 几何
  { label: "∠", tex: "\\angle" },
  { label: "△", tex: "\\triangle" },
  { label: "∥", tex: "\\parallel" },
  { label: "⊥", tex: "\\perp" },
  { label: "≌", tex: "\\cong" },
  // 三角 / 微积分
  { label: "sin", tex: "\\sin" },
  { label: "cos", tex: "\\cos" },
  { label: "tan", tex: "\\tan" },
  { label: "lim", tex: "\\lim" },
  { label: "∑", tex: "\\sum" },
  { label: "∏", tex: "\\prod" },
  { label: "∫", tex: "\\int" },
  { label: "∂", tex: "\\partial" },
  { label: "∞", tex: "\\infty" },
  // 其他
  { label: "°", tex: "^{\\circ}" },
  { label: "%", tex: "\\%" },
];

/** 渲染「文字 + $公式$」混排为 HTML（文本转义，公式由 KaTeX 渲染） */
export function renderMixedText(text: string, render: (tex: string) => string): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  if (!text) return "";
  let out = "";
  let last = 0;
  const src = String(text);
  const re = /\$([^$]+)\$/g;
  for (const m of src.matchAll(re)) {
    const idx = m.index ?? 0;
    out += escapeHtml(src.slice(last, idx));
    out += render(m[1]);
    last = idx + m[0].length;
  }
  out += escapeHtml(src.slice(last));
  return out;
}
