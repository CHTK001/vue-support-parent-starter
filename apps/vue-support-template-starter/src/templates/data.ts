/**
 * 数据展示类组件模板：ReStat / ReTrend / ReCountup / ReTime / ReTypeIt / RePagination / ReTagFilter
 *
 * 每个模板首参数为 layout，默认 "default"。
 */
import type { TemplateMeta } from "./types";

export const reStatMeta: TemplateMeta = {
  name: "ReStat",
  component: () => import("@repo/ui/re-stat").then((m) => ({ default: m.default })),
  title: "统计数值",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "title", label: "标题", type: "string", default: "今日访问" },
    { key: "value", label: "数值", type: "number", default: 12345, min: 0, max: 999999999, step: 1 },
    { key: "precision", label: "小数位", type: "number", default: 0, min: 0, max: 6, step: 1 },
    { key: "prefix", label: "前缀", type: "string", default: "" },
    { key: "suffix", label: "后缀", type: "string", default: "" },
  ],
};

export const reTrendMeta: TemplateMeta = {
  name: "ReTrend",
  component: () => import("@repo/ui/re-trend").then((m) => ({ default: m.default })),
  title: "趋势",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "value", label: "百分比", type: "number", default: 12.5, min: -100, max: 100, step: 0.1, description: "正数=上涨，负数=下跌" },
    { key: "reverseColor", label: "反转颜色", type: "boolean", default: false },
  ],
};

export const reCountupMeta: TemplateMeta = {
  name: "ReCountup",
  component: () => import("@repo/ui/re-countup").then((m) => ({ default: m.default })),
  title: "数字滚动",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "value", label: "目标数值", type: "number", default: 1234, min: 0, max: 999999999, step: 1 },
    { key: "decimals", label: "小数位", type: "number", default: 0, min: 0, max: 6, step: 1 },
    { key: "duration", label: "时长（ms）", type: "number", default: 1500, min: 100, max: 10000, step: 100 },
    { key: "prefix", label: "前缀", type: "string", default: "" },
    { key: "suffix", label: "后缀", type: "string", default: "" },
  ],
};

export const reTimeMeta: TemplateMeta = {
  name: "ReTime",
  component: () => import("@repo/ui/re-time").then((m) => ({ default: m.default })),
  title: "时间",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "time", label: "时间", type: "string", default: new Date().toISOString() },
    { key: "format", label: "格式", type: "string", default: "YYYY-MM-DD HH:mm:ss" },
    { key: "relative", label: "相对时间", type: "boolean", default: false },
  ],
};

export const reTypeItMeta: TemplateMeta = {
  name: "ReTypeIt",
  component: () => import("@repo/ui/re-type-it").then((m) => ({ default: m.default })),
  title: "打字机",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "speed", label: "速度（ms）", type: "number", default: 100, min: 10, max: 1000, step: 10 },
    { key: "cursor", label: "光标字符", type: "string", default: "|" },
  ],
};

export const rePaginationMeta: TemplateMeta = {
  name: "RePagination",
  component: () => import("@repo/ui/re-pagination").then((m) => ({ default: m.default })),
  title: "分页",
  modelable: false,
  props: [
    { key: "total", label: "总数", type: "number", default: 100, min: 0, max: 9999999, step: 1 },
    { key: "pageSize", label: "每页条数", type: "number", default: 10, min: 1, max: 100, step: 1 },
    { key: "currentPage", label: "当前页", type: "number", default: 1, min: 1, max: 9999, step: 1 },
    { key: "background", label: "背景按钮", type: "boolean", default: true },
    { key: "layout", label: "布局", type: "string", default: "prev, pager, next, jumper, total" },
  ],
};

export const reTagFilterMeta: TemplateMeta = {
  name: "ReTagFilter",
  component: () => import("@repo/ui/re-tag-filter").then((m) => ({ default: m.default })),
  title: "标签筛选",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "multiple", label: "多选", type: "boolean", default: true },
    { key: "clearable", label: "可清空", type: "boolean", default: false },
  ],
};

export const dataTemplates: TemplateMeta[] = [
  reStatMeta,
  reTrendMeta,
  reCountupMeta,
  reTimeMeta,
  reTypeItMeta,
  rePaginationMeta,
  reTagFilterMeta,
];