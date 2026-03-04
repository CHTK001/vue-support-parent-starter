/**
 * 路由加载动画样式管理
 * @description 提供给设置面板使用的加载动画元数据（名称、预览 HTML、CSS）
 * 实际加载时仍由 ScRouteLoading 组件根据 localStorage(sys-loader-style) 渲染
 */

export interface LoaderStyleDefinition {
  /** 样式唯一 key */
  key: string;
  /** 样式展示名称 */
  name: string;
  /** 简要说明 */
  description: string;
  /** 预览使用的 HTML 片段 */
  html: string;
  /** 按需注入的 CSS，当前以内联样式为主，CSS 可为空字符串 */
  css: string;
}

/**
 * 加载动画样式列表
 * 说明：
 * - key 需要与 ScRouteLoading 中的 loader 类型保持一致，便于双向联动
 * - html 使用的是迷你预览版本，方便在设置面板中展示
 */
export const LOADER_STYLES: Record<string, LoaderStyleDefinition> = {
  default: {
    key: "default",
    name: "三个圆点",
    description: "简洁的三个圆点跳动动画，适合大多数场景",
    html:
      '<div style="display:flex;gap:4px;align-items:center;justify-content:center">' +
      '<div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div>' +
      '<div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div>' +
      '<div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div>' +
      "</div>",
    css: "",
  },
  rings: {
    key: "rings",
    name: "彩色圆环",
    description: "多层旋转圆环效果，科技感更强",
    html:
      '<div style="width:30px;height:30px;border:2px solid #ff6b6b;border-radius:50%;border-right-color:transparent"></div>',
    css: "",
  },
  simple: {
    key: "simple",
    name: "简约圆环",
    description: "单一旋转圆环，干净利落",
    html:
      '<div style="width:30px;height:30px;border:3px solid rgba(64,110,235,0.2);border-top-color:#406eeb;border-radius:50%"></div>',
    css: "",
  },
  pulse: {
    key: "pulse",
    name: "脉冲圆点",
    description: "单个圆点的呼吸脉冲效果",
    html:
      '<div style="width:16px;height:16px;background:#406eeb;border-radius:50%"></div>',
    css: "",
  },
  blocks: {
    key: "blocks",
    name: "跳动方块",
    description: "三个方块依次跳动，节奏感较强",
    html:
      '<div style="display:flex;gap:3px;align-items:flex-end">' +
      '<div style="width:8px;height:8px;background:#406eeb;border-radius:2px"></div>' +
      '<div style="width:8px;height:12px;background:#406eeb;border-radius:2px"></div>' +
      '<div style="width:8px;height:16px;background:#406eeb;border-radius:2px"></div>' +
      "</div>",
    css: "",
  },
  book: {
    key: "book",
    name: "翻书",
    description: "模拟翻书的加载效果，适合文档类场景",
    html:
      '<div style="width:24px;height:20px;border-radius:2px;border:1px solid #e5e7eb;background:linear-gradient(90deg,#f3f4f6 0%,#ffffff 50%,#f3f4f6 100%);position:relative;overflow:hidden">' +
      '<div style="position:absolute;inset:2px 4px;border-radius:2px;border-left:1px solid #d1d5db"></div>' +
      "</div>",
    css: "",
  },
  writing: {
    key: "writing",
    name: "书写进度条",
    description: "模拟书写进度条的加载效果，适合表单/提交场景",
    html:
      '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:32px">' +
      '<div style="width:100%;height:2px;background:#e5e7eb;border-radius:999px;overflow:hidden"><div style="width:60%;height:100%;background:#406eeb"></div></div>' +
      '<div style="width:80%;height:2px;background:#e5e7eb;border-radius:999px"></div>' +
      '<div style="width:50%;height:2px;background:#e5e7eb;border-radius:999px"></div>' +
      "</div>",
    css: "",
  },
  dinoGame: {
    key: "dinoGame",
    name: "像素恐龙",
    description: "类似浏览器离线小游戏的像素恐龙动画",
    html:
      '<div style="font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center">🦖</div>',
    css: "",
  },
};


