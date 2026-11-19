/**
 * eduai 通用字典：学段 / 年级的码值与中文展示名。
 *
 * <p>后端落库口径不统一：{@code edu_paper.grade_level}、{@code edu_question.grade_level}
 * 存的是<b>码值</b>（PRIMARY/JUNIOR/…），而 {@code edu_grade.grade_level} 与部分历史行
 * 存的是<b>中文标签</b>（小学/初中/…）。此前各视图各写一份映射，已经出现
 * 「同一码值两处翻译不一致」「只认码值不认中文」的漂移，这里收敛为唯一词表与互转函数。</p>
 */
import type { EduGrade, GradeLevelOption } from "../api/types";

/** 学段码值 → 中文标签（与后端枚举一致，数组顺序即下拉展示顺序） */
export const GRADE_LEVEL_OPTIONS: GradeLevelOption[] = [
  { value: "PRIMARY", label: "小学" },
  { value: "JUNIOR", label: "初中" },
  { value: "SENIOR", label: "高中" },
  { value: "UNIVERSITY", label: "大学" },
  { value: "OTHER", label: "其他" },
];

/**
 * 学段 → 中文标签，用于打印抬头、列表列这类面向人的文案。
 *
 * <p>同时接受码值与中文标签；认不出时原样返回，避免把历史脏数据清空。</p>
 *
 * @param code 码值或中文标签
 * @returns 中文标签；入参为空返回空串
 */
export function gradeLevelLabel(code: unknown): string {
  const s = code == null ? "" : String(code).trim();
  if (!s) {
    return "";
  }
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === s || o.label === s)?.label ?? s;
}

/**
 * 学段 → 码值，用于回填以码值绑定的下拉与接口参数。
 *
 * <p>同时接受中文标签与码值；认不出时原样返回。</p>
 *
 * @param label 中文标签或码值
 * @returns 对应码值；入参为空返回空串
 */
export function gradeLevelToCode(label: unknown): string {
  const s = label == null ? "" : String(label).trim();
  if (!s) {
    return "";
  }
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === s || o.label === s)?.value ?? s;
}

/** 年级数字的中文写法（下标即数字；超过十二的年级罕见，回落原值） */
export const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

/**
 * edu_grade.grade_name → 中文展示名。
 *
 * <p>{@code edu_grade.grade_name} 存的是 "1"/"2"/…，而 {@code edu_paper.paper_grade}
 * 与 {@code edu_question.question_grade} 用的是「三年级」这类中文名，三处口径不一致。
 * 下拉直接把 gradeName 当标签渲染就会显示成一串数字，这里只修展示层，
 * 绑定值仍用 grade_name 原值，避免动到库里已有的两种写法。</p>
 *
 * @param name edu_grade.grade_name 原值
 * @returns 中文展示名；非纯数字时原样返回
 */
export function gradeDisplayName(name?: string): string {
  const s = (name ?? "").trim();
  if (!s) {
    return "";
  }
  if (/^\d{1,2}$/.test(s)) {
    const n = Number(s);
    return CN_NUM[n] ? `${CN_NUM[n]}年级` : s;
  }
  // 已经是中文名，但要补全「年级」后缀（有的存「三」没存「三年级」）
  return /年级$/.test(s) ? s : `${s}年级`;
}

/**
 * 把库里存的年级写法归一到给定年级候选（edu_grade.grade_name）中的一项。
 *
 * <p>库里混着 "3"（AI 组卷写进来的）与 "三年级"（历史数据）两种；
 * 下拉的 value 用的是 edu_grade.grade_name，直接绑定会出现「有值但无对应 option」
 * 从而原样显示的问题。这里双向匹配一次，匹配不上才退回原值。</p>
 *
 * @param stored 库里存的年级值
 * @param options 当前学段下的年级候选
 * @returns 能与某个 option 对应的 value
 */
export function matchGradeValue(stored: string | undefined, options: EduGrade[]): string {
  const s = (stored ?? "").trim();
  if (!s || !options.length) {
    return s;
  }
  if (options.some((g) => g.gradeName === s)) {
    return s;
  }
  // "3" -> 展示名 "三年级" -> 找到 gradeName 为 "3" 的项
  const byLabel = options.find((g) => gradeDisplayName(g.gradeName) === s);
  if (byLabel) {
    return byLabel.gradeName;
  }
  // "三年级" -> 去掉后缀 "三" -> 找到展示名匹配（覆盖存了 "三" 的情况）
  const short = s.replace(/年级$/, "");
  const byShort = options.find((g) => g.gradeName === short || gradeDisplayName(g.gradeName) === s);
  return byShort ? byShort.gradeName : s;
}
