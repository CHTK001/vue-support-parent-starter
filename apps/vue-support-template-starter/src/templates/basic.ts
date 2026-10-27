/**
 * 基础组件模板：ReSwitch / ReButton / ReInput / ReTag / ReBadge / ReText / ReCard / ReIcon
 *
 * 每个模板定义：
 *   - 组件引用（懒加载）
 *   - 标题
 *   - props 字段（含默认值），layout 为每个组件首个参数
 *   - 插槽（如有）
 *   - 是否使用 v-model
 *
 * 表单类组件（ReSelect / ReDatePicker / ReCron / ReTree ...）见 form.ts。
 */
import type { TemplateMeta } from "./types";

/** ReSelect 各布局预设的测试数据（key 为 ReSelect layout 值） */
export const selectDataByLayout: Record<string, unknown[]> = {
  default: [
    { label: "ChatGPT-4o", value: "gpt-4o" },
    { label: "Claude 3.5 Sonnet", value: "claude-3.5" },
    { label: "DeepSeek-V3", value: "deepseek-v3" },
    { label: "Qwen-Max", value: "qwen-max" },
    { label: "Llama-3.1-405B", value: "llama-405b" },
    { label: "Kimi-Moonshot", value: "kimi" },
  ],
  card: [
    { label: "ChatGPT-4o", value: "gpt-4o", icon: "MagicStick", description: "旗舰多模态模型，推理最强", tag: "升级", premium: true, consumption: "4 倍消耗" },
    { label: "Claude 3.5 Sonnet", value: "claude-3.5", icon: "ChatLineRound", description: "长文本代理编程专家", tag: "Pro" },
    { label: "DeepSeek-V3", value: "deepseek-v3", icon: "Odometer", description: "高性价比通用模型", tag: "Balanced" },
    { label: "Qwen-Max", value: "qwen-max", icon: "Box", description: "通义千问旗舰版", tag: "Beta", consumption: "2 倍消耗" },
    { label: "Llama-3.1-405B", value: "llama-405b", icon: "Mickey", description: "Meta 开源旗舰", group: "开源" },
    { label: "Kimi-Moonshot", value: "kimi", icon: "Star", description: "长上下文新锐", group: "开源" },
  ],
  table: [
    { label: "ChatGPT-4o", value: "gpt-4o", icon: "MagicStick", model: "gpt-4o", ctx: 128000, price: 5 },
    { label: "Claude 3.5 Sonnet", value: "claude-3.5", icon: "ChatLineRound", model: "claude-3-5-sonnet", ctx: 200000, price: 3 },
    { label: "DeepSeek-V3", value: "deepseek-v3", icon: "Odometer", model: "deepseek-chat", ctx: 64000, price: 1 },
  ],
  square: [
    { label: "ChatGPT-4o", value: "gpt-4o", icon: "MagicStick" },
    { label: "Claude 3.5 Sonnet", value: "claude-3.5", icon: "ChatLineRound" },
    { label: "DeepSeek-V3", value: "deepseek-v3", icon: "Odometer" },
    { label: "Qwen-Max", value: "qwen-max", icon: "Box" },
    { label: "Llama-3.1-405B", value: "llama-405b", icon: "Mickey" },
    { label: "Kimi-Moonshot", value: "kimi", icon: "Star" },
  ],
  "card-dropdown": [
    { label: "ChatGPT-4o", value: "gpt-4o", icon: "MagicStick", description: "旗舰多模态模型，推理最强", tag: "升级", premium: true, consumption: "4 倍消耗" },
    { label: "Claude 3.5 Sonnet", value: "claude-3.5", icon: "ChatLineRound", description: "长文本代理编程专家", tag: "Pro" },
    { label: "DeepSeek-V3", value: "deepseek-v3", icon: "Odometer", description: "高性价比通用模型", tag: "Balanced" },
    { label: "Qwen-Max", value: "qwen-max", icon: "Box", description: "通义千问旗舰版", tag: "Beta", consumption: "2 倍消耗" },
  ],
};

/** ReSelect 默认数据（default 布局） */
export const defaultSelectData = selectDataByLayout.default;

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
        { label: "square（正方形）", value: "square", icon: "Grid" },
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
      key: "cardHideSwitch",
      label: "隐藏开关",
      type: "boolean",
      default: false,
      description: "card 布局：隐藏内部 el-switch，仅展示卡片信息（点击卡片整体切换）",
    },
    {
      key: "preset",
      label: "图标集（preset）",
      type: "select",
      default: "bulb",
      description:
        "square 布局的两态图标集。bulb = 同一颗灯泡点亮/熄灭（默认，无动画、无中间态）；sunmoon = 太阳/月亮两套图形交叉切换",
      options: [
        { label: "bulb（灯泡亮/灭，默认）", value: "bulb", icon: "Opportunity" },
        { label: "sunmoon（太阳/月亮）", value: "sunmoon", icon: "Sunny" },
        { label: "check（对勾/叉）", value: "check", icon: "Select" },
        { label: "star（实心/空心星）", value: "star", icon: "StarFilled" },
        { label: "bell（实心/空心铃）", value: "bell", icon: "BellFilled" },
        { label: "arrow（上/下箭头）", value: "arrow", icon: "ArrowUp" },
        { label: "anim（上游动画图标）", value: "anim", icon: "MagicStick" },
        { label: "none（关闭内置）", value: "none", icon: "Hide" },
      ],
    },
    {
      key: "activeIcon",
      label: "激活态图标",
      type: "string",
      default: "",
      description: "square 布局：激活态图标名（如 Sunny / ep:star / ri:xxx）；留空则走 preset",
    },
    {
      key: "inactiveIcon",
      label: "非激活态图标",
      type: "string",
      default: "",
      description: "square 布局：非激活态图标名（如 Moon / ep:star）；留空则走 preset",
    },
    {
      key: "iconAnimate",
      label: "图标切换动画",
      type: "boolean",
      default: false,
      description:
        "两态图标是否交叉淡入切换。默认关闭 —— 开关是高频控件，状态应当即时生效；交叉淡入会让人看到两个图形叠在一起的中间态",
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
    if (values.cardHideSwitch) props.push(`card-hide-switch`);
    if (values.preset) props.push(`preset="${values.preset}"`);
    if (values.activeIcon) props.push(`active-icon="${values.activeIcon}"`);
    if (values.inactiveIcon) props.push(`inactive-icon="${values.inactiveIcon}"`);
    if (values.iconAnimate) props.push(`icon-animate`);
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
    { key: "icon", label: "图标", type: "string", default: "Search", description: "有 icon 且有插槽文字时默认显示文字；:show-text=\"false\" 才降级为纯图标+tooltip" },
  ],
  // 默认插槽：配合 icon 可验证「有文字就显示文字」（showText 默认自动）
  slots: [{ name: "default", label: "按钮文字", defaultText: "查询" }],
};

export const reInputMeta: TemplateMeta = {
  name: "ReInput",
  component: () => import("@repo/ui/re-input").then((m) => ({ default: m.default })),
  title: "输入框",
  modelable: true,
  modelDefault: "Hello Template",
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "el",
      options: [
        { label: "el（原生 el-input）", value: "el", icon: "Switch" },
        { label: "modern（扁平 + 专注编辑）", value: "modern", icon: "MagicStick" },
      ],
    },
    { key: "placeholder", label: "占位符", type: "string", default: "请输入内容" },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "readonly", label: "只读", type: "boolean", default: false },
    { key: "showPassword", label: "密码框", type: "boolean", default: false },
    { key: "prefixIcon", label: "前缀图标", type: "string", default: "" },
    {
      key: "focusRight",
      label: "专注模式",
      type: "boolean",
      default: false,
      description:
        "modern 布局生效：输入框右侧出现专注图标，点开弹出编辑框（textarea + 确定/取消），适合窄列里编辑长文本",
    },
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
      key: "text",
      label: "文本内容",
      type: "string",
      default: "这是一段用于预览的文本内容",
      description:
        "组件同时支持 text 属性与默认插槽；这里填什么，预览区就显示什么。留空则预览区没有内容可看",
    },
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
    { key: "layout", label: "布局", type: "select", default: "default", options: [
      { label: "default（标准带框）", value: "default", icon: "Postcard" },
      { label: "simple（无边框浮起）", value: "simple", icon: "Crop" },
    ] },
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