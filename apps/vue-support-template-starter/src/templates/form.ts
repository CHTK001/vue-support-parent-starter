/**
 * 表单类组件模板：ReSelect / ReDatePicker / ReTree / ReFilePicker / ReUpload / ReUploadChunk
 *                   ReSearch / ReCode / ReIp / ReIconSelect / ReCron
 *
 * 注：ReSelect 历史放在 basic.ts 中，本文件将其余表单类集中管理，
 * 模板登记后，调试页进入「结构化参数面板」模式（否则为通用 JSON 调试）。
 */
import type { TemplateMeta } from "./types";
import { selectDataByLayout, defaultSelectData } from "./basic";

export { selectDataByLayout, defaultSelectData };

export const reSelectMeta: TemplateMeta = {
  name: "ReSelect",
  component: () => import("@repo/ui/re-select").then((m) => ({ default: m.default })),
  title: "下拉选择",
  description: "多布局选择器（default/card/table/square）",
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
        { label: "card（卡片下拉）", value: "card", icon: "Postcard" },
        { label: "table（表格）", value: "table", icon: "Grid" },
        { label: "square（正方形）", value: "square", icon: "Stopwatch" },
      ],
    },
    { key: "placeholder", label: "占位符", type: "string", default: "请选择", description: "未选中的提示文字" },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "multiple", label: "多选", type: "boolean", default: false },
    { key: "filterable", label: "可搜索", type: "boolean", default: false },
    { key: "loading", label: "加载中", type: "boolean", default: false, description: "远程加载时显示 loading" },
    { key: "iconOnly", label: "纯图标", type: "boolean", default: true, description: "square 布局：仅显示图标（默认），关闭则图标+文字" },
    { key: "compact", label: "紧凑", type: "boolean", default: false, description: "square 默认开启，其余布局开关对应下拉框宽度自适应" },
    { key: "bulkActions", label: "全选反选", type: "boolean", default: false, description: "card 多选时显示全选 / 反选" },
    { key: "title", label: "弹窗标题", type: "string", default: "模型", description: "card 布局弹窗顶部分类标题" },
    { key: "popoverWidth", label: "弹窗宽度", type: "number", default: 300, min: 200, max: 600, description: "card 布局弹窗宽度（px）" },
    {
      key: "tableColumns",
      label: "表格列",
      type: "json",
      default: [
        { key: "model", label: "模型标识" },
        { key: "ctx", label: "上下文" },
        { key: "price", label: "价格" },
      ],
      description: "table 布局列配置 { key, label, width? }",
    },
    { key: "data", label: "选项数据", type: "json", default: defaultSelectData, description: "切换布局自动加载对应预设数据", defaultBy: { watch: "layout", presets: selectDataByLayout } },
  ],
  generate(state) {
    const props: string[] = [];
    const values = state.values;
    if (values.layout && values.layout !== "default") props.push(`layout="${values.layout}"`);
    if (values.placeholder && values.placeholder !== "请选择")
      props.push(`placeholder="${values.placeholder}"`);
    if (values.clearable) props.push(`clearable`);
    if (values.disabled) props.push(`disabled`);
    if (values.multiple) props.push(`multiple`);
    if (values.filterable) props.push(`filterable`);
    if (values.loading) props.push(`loading`);
    if (values.iconOnly === false) props.push(`:icon-only="false"`);
    if (values.compact === true) props.push(`compact`);
    if (values.bulkActions === true) props.push(`bulk-actions`);
    if (values.title && values.title !== "模型") props.push(`title="${values.title}"`);
    if (values.popoverWidth && values.popoverWidth !== 300)
      props.push(`:popover-width="${values.popoverWidth}"`);
    const tcols = values.tableColumns;
    const defaultTcols = [
      { key: "model", label: "模型标识" },
      { key: "ctx", label: "上下文" },
      { key: "price", label: "价格" },
    ];
    if (Array.isArray(tcols) && JSON.stringify(tcols) !== JSON.stringify(defaultTcols)) {
      props.push(`:table-columns='${JSON.stringify(tcols).replaceAll("'", "\\'")}'`);
    }
    const dataStr = JSON.stringify(values.data ?? []);
    props.push(`:data='${dataStr.replaceAll("'", "\\'")}'`);
    const vmodel = ` v-model="value"`;
    const propStr = props.length ? "\n  " + props.join("\n  ") + vmodel : ` v-model`;
    return `<ReSelect${propStr}
/>`;
  },
};

export const reDatePickerMeta: TemplateMeta = {
  name: "ReDatePicker",
  component: () => import("@repo/ui/re-date-picker").then((m) => ({ default: m.default })),
  title: "日期选择",
  modelable: true,
  modelDefault: "",
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "el",
      options: [
        { label: "el（原生）", value: "el", icon: "Calendar" },
        { label: "modern（现代化扁平）", value: "modern", icon: "Brush" },
      ],
    },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "date",
      options: [
        { label: "year", value: "year", icon: "Document" },
        { label: "month", value: "month", icon: "Document" },
        { label: "date", value: "date", icon: "Calendar" },
        { label: "datetime", value: "datetime", icon: "Clock" },
        { label: "daterange", value: "daterange", icon: "Connection" },
        { label: "monthrange", value: "monthrange", icon: "Connection" },
      ],
    },
    { key: "placeholder", label: "占位符", type: "string", default: "请选择日期" },
    { key: "startPlaceholder", label: "起始占位符", type: "string", default: "开始日期" },
    { key: "endPlaceholder", label: "结束占位符", type: "string", default: "结束日期" },
    { key: "format", label: "显示格式", type: "string", default: "YYYY-MM-DD" },
    { key: "valueFormat", label: "绑定格式", type: "string", default: "YYYY-MM-DD" },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "readonly", label: "只读", type: "boolean", default: false },
  ],
};

export const reCronMeta: TemplateMeta = {
  name: "ReCron",
  component: () => import("@repo/ui/re-cron").then((m) => ({ default: m.default })),
  title: "Cron 表达式",
  description: "Cron 表达式生成器（card 卡片式 / default 默认）",
  modelable: true,
  modelDefault: "0 0 12 * * ?",
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "card",
      options: [
        { label: "card（rin-card 风格）", value: "card", icon: "Postcard" },
        { label: "default（el-popover）", value: "default", icon: "Menu" },
      ],
    },
    {
      key: "fields",
      label: "字段数",
      type: "select",
      default: 6,
      options: [
        { label: "6 字段（秒 分 时 日 月 周）", value: 6, icon: "Clock" },
        { label: "5 字段（分 时 日 月 周）", value: 5, icon: "Calendar" },
      ],
      description: "quartz 风格 6 字段 / Linux 风格 5 字段",
    },
    { key: "placeholder", label: "占位符", type: "string", default: "请选择 cron 表达式" },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
    { key: "width", label: "宽度（px）", type: "number", default: 0, min: 0, max: 1200, step: 10, description: "0 = 自适应" },
  ],
  generate(state) {
    const props: string[] = [];
    const values = state.values;
    if (values.layout && values.layout !== "card") props.push(`layout="${values.layout}"`);
    if (values.fields && values.fields !== 6) props.push(`:fields="${values.fields}"`);
    if (values.placeholder && values.placeholder !== "请选择 cron 表达式")
      props.push(`placeholder="${values.placeholder}"`);
    if (values.disabled) props.push(`disabled`);
    if (values.width && Number(values.width) > 0) props.push(`:width="${values.width}"`);
    const vmodel = ` v-model="cron"`;
    const propStr = props.length ? "\n  " + props.join("\n  ") + vmodel : ` v-model`;
    return `<ReCron${propStr}
/>`;
  },
};

export const reTreeMeta: TemplateMeta = {
  name: "ReTree",
  component: () => import("@repo/ui/re-tree").then((m) => ({ default: m.default })),
  title: "树形控件",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Share" }] },
    { key: "data", label: "树数据", type: "json", default: [
      { id: 1, label: "一级 1", children: [{ id: 11, label: "二级 1-1" }, { id: 12, label: "二级 1-2" }] },
      { id: 2, label: "一级 2", children: [{ id: 21, label: "二级 2-1" }] },
    ] },
    { key: "showCheckbox", label: "复选框", type: "boolean", default: true },
    { key: "defaultExpandAll", label: "默认展开全部", type: "boolean", default: true },
    { key: "nodeKey", label: "节点 key 字段", type: "string", default: "id" },
    { key: "props.label", label: "label 字段", type: "string", default: "label", description: "el-tree props.label" },
    { key: "props.children", label: "children 字段", type: "string", default: "children" },
  ],
};

export const reFilePickerMeta: TemplateMeta = {
  name: "ReFilePicker",
  component: () => import("@repo/ui/re-file-picker").then((m) => ({ default: m.default })),
  title: "文件选择",
  modelable: true,
  modelDefault: "",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "FolderOpened" }] },
    { key: "placeholder", label: "占位符", type: "string", default: "请选择文件" },
    { key: "multiple", label: "多选", type: "boolean", default: false },
    { key: "accept", label: "accept", type: "string", default: "*/*" },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
  ],
};

export const reUploadMeta: TemplateMeta = {
  name: "ReUpload",
  component: () => import("@repo/ui/re-upload").then((m) => ({ default: m.default })),
  title: "上传",
  modelable: false,
  props: [
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "default",
      options: [
        { label: "default（原生）", value: "default", icon: "UploadFilled" },
        { label: "card（卡片式）", value: "card", icon: "Postcard" },
      ],
    },
    { key: "action", label: "上传地址", type: "string", default: "/api/upload" },
    { key: "multiple", label: "多选", type: "boolean", default: false },
    { key: "drag", label: "拖拽上传", type: "boolean", default: false },
    { key: "accept", label: "accept", type: "string", default: "" },
    { key: "listType", label: "列表类型", type: "select", default: "text", options: [
      { label: "text", value: "text", icon: "Tickets" },
      { label: "picture", value: "picture", icon: "Picture" },
      { label: "picture-card", value: "picture-card", icon: "Postcard" },
    ] },
    { key: "autoUpload", label: "自动上传", type: "boolean", default: true },
    { key: "limit", label: "最大数量", type: "number", default: 1, min: 1, max: 99, step: 1 },
    { key: "tip", label: "提示文案", type: "string", default: "" },
  ],
};

export const reUploadChunkMeta: TemplateMeta = {
  name: "ReUploadChunk",
  component: () => import("@repo/ui/re-upload-chunk").then((m) => ({ default: m.default })),
  title: "分片上传",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Upload" }] },
    { key: "action", label: "上传地址", type: "string", default: "/api/upload/chunk" },
    { key: "chunkSize", label: "分片大小（字节）", type: "number", default: 2 * 1024 * 1024, min: 65536, max: 50 * 1024 * 1024, step: 65536 },
    { key: "multiple", label: "多选", type: "boolean", default: false },
    { key: "drag", label: "拖拽上传", type: "boolean", default: true },
    { key: "concurrent", label: "并发数", type: "number", default: 3, min: 1, max: 10, step: 1 },
  ],
};

export const reSearchMeta: TemplateMeta = {
  name: "ReSearch",
  component: () => import("@repo/ui/re-search").then((m) => ({ default: m.default })),
  title: "搜索",
  modelable: true,
  modelDefault: "",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Search" }] },
    { key: "placeholder", label: "占位符", type: "string", default: "请输入搜索关键词" },
    { key: "showHistory", label: "显示历史", type: "boolean", default: true },
    { key: "showSuggest", label: "显示建议", type: "boolean", default: true },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
  ],
};

export const reCodeMeta: TemplateMeta = {
  name: "ReCode",
  component: () => import("@repo/ui/re-code").then((m) => ({ default: m.default })),
  title: "验证码",
  modelable: true,
  modelDefault: "",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Key" }] },
    { key: "length", label: "位数", type: "number", default: 6, min: 4, max: 8, step: 1 },
    { key: "type", label: "字符类型", type: "select", default: "number", options: [
      { label: "number（纯数字）", value: "number", icon: "Cellphone" },
      { label: "letter（纯字母）", value: "letter", icon: "Edit" },
      { label: "mix（数字+字母）", value: "mix", icon: "Lock" },
    ] },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
  ],
};

export const reIpMeta: TemplateMeta = {
  name: "ReIp",
  component: () => import("@repo/ui/re-ip").then((m) => ({ default: m.default })),
  title: "IP 输入",
  modelable: true,
  modelDefault: "192.168.1.1",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Position" }] },
    { key: "separator", label: "分隔符", type: "string", default: "." },
    { key: "placeholder", label: "占位符", type: "string", default: "" },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
  ],
};

export const reIconSelectMeta: TemplateMeta = {
  name: "ReIconSelect",
  component: () => import("@repo/ui/re-icon-select").then((m) => ({ default: m.default })),
  title: "图标选择",
  modelable: true,
  modelDefault: "Setting",
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Star" }] },
    { key: "source", label: "图标源", type: "select", default: "element", options: [
      { label: "element（el-icon）", value: "element", icon: "ElementPlus" },
      { label: "local（本地 svg）", value: "local", icon: "Picture" },
      { label: "all（合并）", value: "all", icon: "Files" },
    ] },
    { key: "clearable", label: "可清空", type: "boolean", default: true },
    { key: "disabled", label: "禁用", type: "boolean", default: false },
  ],
};

export const formTemplates: TemplateMeta[] = [
  reSelectMeta,
  reDatePickerMeta,
  reCronMeta,
  reTreeMeta,
  reFilePickerMeta,
  reUploadMeta,
  reUploadChunkMeta,
  reSearchMeta,
  reCodeMeta,
  reIpMeta,
  reIconSelectMeta,
];