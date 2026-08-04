/**
 * 基础组件模板：ReSwitch / ReButton / ReInput / ReTag / ReBadge / ReText / ReCard / ReIcon
 *
 * 每个模板定义：
 *   - 组件引用（懒加载）
 *   - 标题
 *   - props 字段（含默认值）
 *   - 插槽（如有）
 *   - 是否使用 v-model
 */
import type { TemplateMeta } from "./types";

export const reSwitchMeta: TemplateMeta = {
  name: "ReSwitch",
  component: () => import("@repo/ui/re-switch").then((m) => ({ default: m.default })),
  title: "开关（卡片布局）",
  description: "卡片式开关组件，支持主标题 + 问号提示 + 副标题说明",
  modelable: true,
  modelDefault: true,
  props: [
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
      key: "card",
      label: "卡片样式",
      type: "boolean",
      default: true,
      description: "false 时退化为纯行内开关",
    },
  ],
  slots: [
    {
      name: "default",
      label: "默认插槽",
      defaultText: "",
    },
  ],
  generate(state) {
    const props: string[] = [];
    const values = state.values;
    if (values.title && values.title !== "多标签导航") props.push(`title="${values.title}"`);
    if (values.tip && values.tip !== "开启后页面顶部生成标签栏")
      props.push(`tip="${values.tip}"`);
    if (values.description && values.description !== "主内容区顶部多标签导航，可快速切换页面")
      props.push(`description="${values.description}"`);
    if (values.card === false) props.push(`:card="${JSON.stringify(values.card)}"`);
    const vmodel = state.model !== true ? ` v-model="${state.model}"` : " v-model";
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
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "primary",
      options: [
        { label: "primary", value: "primary" },
        { label: "success", value: "success" },
        { label: "warning", value: "warning" },
        { label: "danger", value: "danger" },
        { label: "info", value: "info" },
        { label: "default", value: "default" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large" },
        { label: "default", value: "default" },
        { label: "small", value: "small" },
      ],
    },
    { key: "plain", label: "朴素按钮", type: "boolean", default: false },
    { key: "round", label: "圆角按钮", type: "boolean", default: false },
    { key: "circle", label: "圆形按钮", type: "boolean", default: false },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "loading", label: "加载中", type: "boolean", default: false },
    { key: "icon", label: "图标", type: "string", default: "" },
  ],
  slots: [{ name: "default", label: "按钮文字", defaultText: "按钮" }],
};

export const reInputMeta: TemplateMeta = {
  name: "ReInput",
  component: () => import("@repo/ui/re-input").then((m) => ({ default: m.default })),
  title: "输入框",
  modelable: true,
  modelDefault: "Hello Template",
  props: [
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
        { label: "large", value: "large" },
        { label: "default", value: "default" },
        { label: "small", value: "small" },
      ],
    },
  ],
  slots: [
    { name: "prefix", label: "prefix 插槽", defaultText: "" },
    { name: "suffix", label: "suffix 插槽", defaultText: "" },
  ],
};

export const reTagMeta: TemplateMeta = {
  name: "ReTag",
  component: () => import("@repo/ui/re-tag").then((m) => ({ default: m.default })),
  title: "标签",
  modelable: false,
  props: [
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "primary",
      options: [
        { label: "primary", value: "primary" },
        { label: "success", value: "success" },
        { label: "warning", value: "warning" },
        { label: "danger", value: "danger" },
        { label: "info", value: "info" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large" },
        { label: "default", value: "default" },
        { label: "small", value: "small" },
      ],
    },
    {
      key: "effect",
      label: "主题",
      type: "select",
      default: "light",
      options: [
        { label: "light", value: "light" },
        { label: "dark", value: "dark" },
        { label: "plain", value: "plain" },
      ],
    },
    { key: "round", label: "圆角", type: "boolean", default: false },
    { key: "closable", label: "可关闭", type: "boolean", default: false },
    { key: "disableTransitions", label: "禁用动画", type: "boolean", default: false },
  ],
  slots: [{ name: "default", label: "标签文字", defaultText: "标签" }],
};

export const reBadgeMeta: TemplateMeta = {
  name: "ReBadge",
  component: () => import("@repo/ui/re-badge").then((m) => ({ default: m.default })),
  title: "徽标",
  modelable: false,
  props: [
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
        { label: "primary", value: "primary" },
        { label: "success", value: "success" },
        { label: "warning", value: "warning" },
        { label: "danger", value: "danger" },
        { label: "info", value: "info" },
      ],
    },
  ],
  slots: [{ name: "default", label: "default 插槽", defaultText: "消息中心" }],
};

export const reTextMeta: TemplateMeta = {
  name: "ReText",
  component: () => import("@repo/ui/re-text").then((m) => ({ default: m.default })),
  title: "文本",
  modelable: false,
  props: [
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "default",
      options: [
        { label: "default", value: "default" },
        { label: "primary", value: "primary" },
        { label: "success", value: "success" },
        { label: "warning", value: "warning" },
        { label: "danger", value: "danger" },
        { label: "info", value: "info" },
      ],
    },
    {
      key: "size",
      label: "尺寸",
      type: "select",
      default: "default",
      options: [
        { label: "large", value: "large" },
        { label: "default", value: "default" },
        { label: "small", value: "small" },
      ],
    },
    { key: "truncated", label: "单行省略", type: "boolean", default: false },
    {
      key: "lineClamp",
      label: "多行省略",
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
    },
    {
      key: "tag",
      label: "渲染标签",
      type: "select",
      default: "span",
      options: [
        { label: "span", value: "span" },
        { label: "p", value: "p" },
        { label: "div", value: "div" },
      ],
    },
  ],
  slots: [{ name: "default", label: "文本内容", defaultText: "这是一段文本内容" }],
};

export const reCardMeta: TemplateMeta = {
  name: "ReCard",
  component: () => import("@repo/ui/re-card").then((m) => ({ default: m.default })),
  title: "卡片",
  modelable: false,
  props: [
    {
      key: "shadow",
      label: "阴影",
      type: "select",
      default: "always",
      options: [
        { label: "always", value: "always" },
        { label: "hover", value: "hover" },
        { label: "never", value: "never" },
      ],
    },
    { key: "header", label: "卡片标题", type: "string", default: "卡片标题" },
    {
      key: "bodyStyle",
      label: "body 样式",
      type: "json",
      default: { padding: "20px" },
    },
  ],
  slots: [
    { name: "default", label: "default 内容", defaultText: "卡片主体内容" },
    { name: "header", label: "header 插槽", defaultText: "" },
    { name: "footer", label: "footer 插槽", defaultText: "" },
  ],
};

export const reIconMeta: TemplateMeta = {
  name: "ReIcon",
  component: () => import("@repo/ui/re-icon").then((m) => ({ default: m.default })),
  title: "图标",
  modelable: false,
  props: [
    { key: "name", label: "图标名", type: "string", default: "Setting" },
    { key: "size", label: "尺寸", type: "number", default: 20, min: 8, max: 128, step: 1 },
    { key: "color", label: "颜色", type: "string", default: "" },
  ],
  slots: [],
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
];