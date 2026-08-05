/**
 * 反馈类组件模板：ReEmpty / ReSkeleton / ReLoading / ReStatusIndicator / ReStationMessage
 *
 * 每个模板首参数为 layout，默认 "default"。
 */
import type { TemplateMeta } from "./types";

export const reEmptyMeta: TemplateMeta = {
  name: "ReEmpty",
  component: () => import("@repo/ui/re-empty").then((m) => ({ default: m.default })),
  title: "空状态",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "description", label: "描述文本", type: "string", default: "暂无数据" },
    { key: "imageSize", label: "图片尺寸", type: "number", default: 80, min: 40, max: 200, step: 1 },
  ],
};

export const reSkeletonMeta: TemplateMeta = {
  name: "ReSkeleton",
  component: () => import("@repo/ui/re-skeleton").then((m) => ({ default: m.default })),
  title: "骨架屏",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "rows", label: "行数", type: "number", default: 4, min: 1, max: 20, step: 1 },
    { key: "animated", label: "动画", type: "boolean", default: true },
    { key: "throttle", label: "节流（ms）", type: "number", default: 0, min: 0, max: 5000, step: 100 },
  ],
};

export const reLoadingMeta: TemplateMeta = {
  name: "ReLoading",
  component: () => import("@repo/ui/re-loading").then((m) => ({ default: m.default })),
  title: "加载中",
  modelable: true,
  modelDefault: true,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "text", label: "提示文字", type: "string", default: "加载中..." },
    { key: "background", label: "遮罩背景色", type: "string", default: "rgba(255,255,255,0.7)" },
    { key: "spinner", label: "spinner 文本", type: "string", default: "" },
  ],
};

export const reStatusIndicatorMeta: TemplateMeta = {
  name: "ReStatusIndicator",
  component: () => import("@repo/ui/re-status-indicator").then((m) => ({ default: m.default })),
  title: "状态指示",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "status",
      label: "状态",
      type: "select",
      default: "online",
      options: [
        { label: "online", value: "online", icon: "Connection" },
        { label: "offline", value: "offline", icon: "Remove" },
        { label: "busy", value: "busy", icon: "Clock" },
        { label: "away", value: "away", icon: "Position" },
      ],
    },
    { key: "text", label: "文案", type: "string", default: "在线" },
    { key: "pulse", label: "脉冲", type: "boolean", default: true },
  ],
};

export const reStationMessageMeta: TemplateMeta = {
  name: "ReStationMessage",
  component: () => import("@repo/ui/re-station-message").then((m) => ({ default: m.default })),
  title: "站内消息",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "title", label: "标题", type: "string", default: "系统通知" },
    { key: "content", label: "内容", type: "string", default: "您有一条新的消息" },
    {
      key: "type",
      label: "类型",
      type: "select",
      default: "info",
      options: [
        { label: "info", value: "info", icon: "InfoFilled" },
        { label: "success", value: "success", icon: "SuccessFilled" },
        { label: "warning", value: "warning", icon: "WarningFilled" },
        { label: "danger", value: "danger", icon: "RemoveFilled" },
      ],
    },
  ],
};

export const feedbackTemplates: TemplateMeta[] = [
  reEmptyMeta,
  reSkeletonMeta,
  reLoadingMeta,
  reStatusIndicatorMeta,
  reStationMessageMeta,
];