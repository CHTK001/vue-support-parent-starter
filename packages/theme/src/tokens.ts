/**
 * 设计令牌（框架无关）
 *
 * 换框架时令牌不变，各框架适配器（element-plus / koi / naive ...）共用同一份。
 * 修改这里的值即可全局换肤。
 */

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  /** 明暗模式 */
  mode: ThemeMode;
  /** 品牌色 */
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryActive: string;
  /** 中性色 */
  colorBg: string;
  colorBgContainer: string;
  colorText: string;
  colorTextSecondary: string;
  colorBorder: string;
  /** 功能色 */
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  /** 圆角 */
  borderRadius: string;
  /** 字号 */
  fontSize: string;
}

/**
 * 亮色模式默认令牌
 *
 * <p>主色三档取 #2563C9 / #1D57A8 / #174A90，是无障碍换色的结果，不是随手选的。
 * 原值 #409EFF / #79BBFF / #337ECC（Element 默认）在白底上只有 2.78 / 2.03 /
 * 4.20 : 1，全部低于 WCAG AA 对 14px 普通文本要求的 4.5 : 1 —— 实测全站因此有
 * 406 个 color-contrast 违规节点（主色按钮、主色文字、菜单选中态都算在内）。</p>
 *
 * <p>三档都满足：白字在填充上 >= 4.5 : 1、主色作文字在白底 >= 4.5 : 1、
 * 在菜单选中底 #EAF4FF 上 >= 4.5 : 1（分别为 5.67 / 7.04 / 8.68）。</p>
 *
 * <p>注意 hover 比 base <b>更深</b>（常规做法是更浅）。因为按钮文字是白字，
 * 底色越浅白字越看不清；可访问性优先于「hover 变浅」的视觉惯例。
 * 若要恢复「hover 变浅」的观感，只能把 hover 态文字改成深色。</p>
 *
 * <p><b>本文件不是 --el-color-primary 的强制点。</b>实测（2026-10-02）注入链是
 * {@code DEFAULT_THEME}（packages/config/src/constants.ts）→ themeColor.ts 的
 * applyPrimaryColorVars() 写入 &lt;html&gt; 行内变量；本文件的 colorPrimary
 * 是设计令牌层的同源声明，两处必须同值，否则换肤时会跳变。
 * Element 自带 CSS 的 :root 默认值 #409EFF 会被行内变量盖掉，不需要改它。</p>
 *
 * <p>文本灰阶的 AA 加固不在本文件，而在
 * {@code packages/theme/src/themes/koi/styles/element.scss} —— 因为真正被大量
 * 引用的是 Element 的 --el-text-color-secondary / --el-text-color-placeholder，
 * 本文件的 colorTextSecondary(#606266) 本就达标（5.29 : 1）。</p>
 */
export const lightTokens: ThemeTokens = {
  mode: "light",
  colorPrimary: "#2563C9",
  colorPrimaryHover: "#1D57A8",
  colorPrimaryActive: "#174A90",
  colorBg: "#f5f7fa",
  colorBgContainer: "#ffffff",
  colorText: "#303133",
  colorTextSecondary: "#606266",
  colorBorder: "#dcdfe6",
  colorSuccess: "#67c23a",
  colorWarning: "#e6a23c",
  colorError: "#f56c6c",
  colorInfo: "#909399",
  borderRadius: "4px",
  fontSize: "14px",
};

/** 暗色模式默认令牌（主色与亮色模式一致，避免两套值各自漂移） */
export const darkTokens: ThemeTokens = {
  mode: "dark",
  colorPrimary: "#2563C9",
  colorPrimaryHover: "#1D57A8",
  colorPrimaryActive: "#174A90",
  colorBg: "#141414",
  colorBgContainer: "#1d1e1f",
  colorText: "#e5eaf3",
  colorTextSecondary: "#a3a6ad",
  colorBorder: "#4c4d4f",
  colorSuccess: "#67c23a",
  colorWarning: "#e6a23c",
  colorError: "#f56c6c",
  colorInfo: "#909399",
  borderRadius: "4px",
  fontSize: "14px",
};

/** 预设令牌集合，便于扩展更多主题 */
export const presetTokens: Record<string, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
};
