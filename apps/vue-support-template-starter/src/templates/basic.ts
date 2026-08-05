/**
 * 基础组件模板：ReSwitch / ReButton / ReInput / ReTag / ReBadge / ReText / ReCard / ReIcon
 *
 * 每个模板定义：
 *   - 组件引用（懒加载）
 *   - 标题
 *   - props 字段（含默认值），layout 为每个组件首个参数
 *   - 插槽（如有）
 *   - 是否使用 v-model
 */
import type { TemplateMeta } from "./types";

export const reSwitchMeta: TemplateMeta = {
  name: "ReSwitch",
  component: () => import("@repo/ui/re-switch").then((m) => ({ default: m.default })),
  title: "开关",
  description: "卡片式开关组件，支持主标题 + 问号提示 + 副标题说明",
  modelable: true,
  modelDefault: true,
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "default",
      options: [
        { label: "default（原生行内）", value: "default", icon: "Switch" },
        { label: "card（卡片式）", value: "card", icon: "Postcard" },
      ],
    },
    {
      key: "title",
      label: "主标题",
      type: "string",
      default: "多标签导航",
      description: "卡片左侧主标题（字号大于副标题）",
    },
    {
      key: "tip",
      label: "提示文案",
      type: "string",
      default: "开启后页面顶部生成标签栏",
      description: "标题旁问号图标 hover 显示",
    },
    {
      key: "description",
      label: "副标题",
      type: "string",
      default: "主内容区顶部多标签导航，可快速切换页面",
      description: "卡片副标题（字号较小）",
    },
    {
      key: "sub",
      label: "灰色小标题",
      type: "string",
      default: "顶部标签栏",
      description: "介于主标题与副标题之间，灰色圆角标签",
    },
    {
      key: "cardActiveBorder",
      label: "卡片激活边框",
      type: "boolean",
      default: true,
      description: "card 布局：激活时边框加粗",
    },
    {
      key: "cardHideSwitch",
      label: "隐藏开关",
      type: "boolean",
      default: false,
      description: "card 布局：隐藏内部 el-switch，仅展示卡片信息",
    },
  ],
  generate(state) {
    const props: string[] = [];
    const values = state.values;
    if (values.layout && values.layout !== "default") props.push(`layout="${values.layout}"`);
    if (values.title && values.title !== "多标签导航") props.push(`title="${values.title}"`);
    if (values.tip && values.tip !== "开启后页面顶部生成标签栏")
      props.push(`tip="${values.tip}"`);
    if (values.description && values.description !== "主内容区顶部多标签导航，可快速切换页面")
      props.push(`description="${values.description}"`);
    if (values.sub && values.sub !== "顶部标签栏") props.push(`sub="${values.sub}"`);
    if (values.cardActiveBorder === false) props.push(`:card-active-border="${JSON.stringify(values.cardActiveBorder)}"`);
    if (values.cardHideSwitch) props.push(`card-hide-switch`);
    const vmodel = state.model !== true ? ` v-model="${state.model}"` : ` v-model`;
    const propStr = props.length ? "\n  " + props.join("\n  ") + vmodel : ` v-model`;
    return `<ReSwitch${propStr}
/>`;
  },
};

export const reButtonMeta: TemplateMeta = {
  name: "ReButton",
  component: () => import("@repo/ui/re-button").then((m) => ({ default: m.default })),
  title: "按钮",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "primary",
      options: [
        { label: "primary", value: "primary", icon: "Star" },
        { label: "success", value: "success", icon: "SuccessFilled" },
        { label: "warning", value: "warning", icon: "WarningFilled" },
        { label: "danger", value: "danger", icon: "RemoveFilled" },
        { label: "info", value: "info", icon: "InfoFilled" },
        { label: "default", value: "default", icon: "CircleCheck" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large", icon: "FullScreen" },
        { label: "default", value: "default", icon: "ZoomOut" },
        { label: "small", value: "small", icon: "Minus" },
      ],
    },
    { key: "plain", label: "朴素按钮", type: "boolean", default: false },
    { key: "round", label: "圆角按钮", type: "boolean", default: false },
    { key: "circle", label: "圆形按钮", type: "boolean", default: false },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "loading", label: "加载中", type: "boolean", default: false },
    { key: "icon", label: "图标", type: "string", default: "" },
  ],
};

export const reInputMeta: TemplateMeta = {
  name: "ReInput",
  component: () => import("@repo/ui/re-input").then((m) => ({ default: m.default })),
  title: "输入框",
  modelable: true,
  modelDefault: "Hello Template",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "placeholder", label: "占位符", type: "string", default: "请输入内容" },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "readonly", label: "只读", type: "boolean", default: false },
    { key: "showPassword", label: "密码框", type: "boolean", default: false },
    { key: "prefixIcon", label: "前缀图标", type: "string", default: "" },
    {
      key: "maxlength",
      label: "最大长度",
      type: "number",
      default: 0,
      min: 0,
      max: 500,
      step: 1,
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large", icon: "FullScreen" },
        { label: "default", value: "default", icon: "ZoomOut" },
        { label: "small", value: "small", icon: "Minus" },
      ],
    },
  ],
};

export const reTagMeta: TemplateMeta = {
  name: "ReTag",
  component: () => import("@repo/ui/re-tag").then((m) => ({ default: m.default })),
  title: "标签",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "primary",
      options: [
        { label: "primary", value: "primary", icon: "Star" },
        { label: "success", value: "success", icon: "SuccessFilled" },
        { label: "warning", value: "warning", icon: "WarningFilled" },
        { label: "danger", value: "danger", icon: "RemoveFilled" },
        { label: "info", value: "info", icon: "InfoFilled" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large", icon: "FullScreen" },
        { label: "default", value: "default", icon: "ZoomOut" },
        { label: "small", value: "small", icon: "Minus" },
      ],
    },
    {
      key: "effect",
      label: "主题",
      type: "select",
      default: "light",
      options: [
        { label: "light", value: "light", icon: "Sunny" },
        { label: "dark", value: "dark", icon: "Moon" },
        { label: "plain", value: "plain", icon: "Document" },
      ],
    },
    { key: "round", label: "圆角", type: "boolean", default: false },
    { key: "closable", label: "可关闭", type: "boolean", default: false },
    { key: "disableTransitions", label: "禁用动画", type: "boolean", default: false },
  ],
};

export const reBadgeMeta: TemplateMeta = {
  name: "ReBadge",
  component: () => import("@repo/ui/re-badge").then((m) => ({ default: m.default })),
  title: "徽标",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "value", label: "数值", type: "string", default: "12" },
    { key: "max", label: "最大值", type: "number", default: 99, min: 1, max: 9999, step: 1 },
    { key: "isDot", label: "小红点", type: "boolean", default: false },
    { key: "hidden", label: "隐藏", type: "boolean", default: false },
    { key: "breath", label: "呼吸动画", type: "boolean", default: false },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "danger",
      options: [
        { label: "primary", value: "primary", icon: "Star" },
        { label: "success", value: "success", icon: "SuccessFilled" },
        { label: "warning", value: "warning", icon: "WarningFilled" },
        { label: "danger", value: "danger", icon: "RemoveFilled" },
        { label: "info", value: "info", icon: "InfoFilled" },
      ],
    },
  ],
};

export const reTextMeta: TemplateMeta = {
  name: "ReText",
  component: () => import("@repo/ui/re-text").then((m) => ({ default: m.default })),
  title: "文本",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "default",
      options: [
        { label: "default", value: "default", icon: "Switch" },
        { label: "primary", value: "primary", icon: "Star" },
        { label: "success", value: "success", icon: "SuccessFilled" },
        { label: "warning", value: "warning", icon: "WarningFilled" },
        { label: "danger", value: "danger", icon: "RemoveFilled" },
        { label: "info", value: "info", icon: "InfoFilled" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large", icon: "FullScreen" },
        { label: "default", value: "default", icon: "ZoomOut" },
        { label: "small", value: "small", icon: "Minus" },
      ],
    },
    { key: "truncated", label: "单行省略", type: "boolean", default: false },
    { key: "lineClamp", label: "多行省略", type: "number", default: 0, min: 0, max: 10, step: 1 },
    {
      key: "tag",
      label: "渲染标签",
      type: "select",
      default: "span",
      options: [
        { label: "span", value: "span", icon: "Edit" },
        { label: "p", value: "p", icon: "Document" },
        { label: "div", value: "div", icon: "Grid" },
      ],
    },
  ],
};

export const reCardMeta: TemplateMeta = {
  name: "ReCard",
  component: () => import("@repo/ui/re-card").then((m) => ({ default: m.default })),
  title: "卡片",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "shadow",
      label: "阴影",
      type: "select",
      default: "always",
      options: [
        { label: "always", value: "always", icon: "CircleCheck" },
        { label: "hover", value: "hover", icon: "Pointer" },
        { label: "never", value: "never", icon: "Minus" },
      ],
    },
    { key: "header", label: "卡片标题", type: "string", default: "卡片标题" },
    { key: "bodyStyle", label: "body 样式", type: "json", default: { padding: "20px" } },
  ],
};

export const reIconMeta: TemplateMeta = {
  name: "ReIcon",
  component: () => import("@repo/ui/re-icon").then((m) => ({ default: m.default })),
  title: "图标",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "name", label: "图标名", type: "string", default: "Setting" },
    { key: "size", label: "尺寸", type: "number", default: 20, min: 8, max: 128, step: 1 },
    { key: "color", label: "颜色", type: "string", default: "" },
  ],
};

export const reSelectMeta: TemplateMeta = {
  name: "ReSelect",
  component: () => import("@repo/ui/re-select").then((m) => ({ default: m.default })),
  title: "下拉选择",
  description: "多布局选择器（default/card/table/modern/pill/square/card-dropdown）",
  modelable: true,
  modelDefault: "",
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "default",
      options: [
        { label: "default（原生）", value: "default", icon: "Menu" },
        { label: "card（卡片）", value: "card", icon: "Postcard" },
        { label: "table（表格）", value: "table", icon: "Grid" },
        { label: "modern（现代化）", value: "modern", icon: "MagicStick" },
        { label: "pill（药丸）", value: "pill", icon: "CircleCheck" },
        { label: "square（正方形）", value: "square", icon: "Stopwatch" },
        { label: "card-dropdown（卡片下拉）", value: "card-dropdown", icon: "ChatLineSquare" },
      ],
    },
    { key: "placeholder", label: "占位符", type: "string", default: "请选择", description: "未选中的提示文字" },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "multiple", label: "多选", type: "boolean", default: false },
    { key: "filterable", label: "可搜索", type: "boolean", default: false },
    { key: "loading", label: "加载中", type: "boolean", default: false, description: "远程加载时显示 loading" },
  ],
};

export const basicTemplates: TemplateMeta[] = [
  reSwitchMeta,
  reButtonMeta,
  reInputMeta,
  reTagMeta,
  reBadgeMeta,
  reTextMeta,
  reCardMeta,
  reIconMeta,
  reSelectMeta,
];