/**
 * 多媒体组件模板：ReImage / ReImageGroup
 *
 * ReImageGroup：图片画廊，IntersectionObserver 视口内异步加载，
 * 避免一次性加载全部图片造成首屏阻塞。
 */
import type { TemplateMeta } from "./types";

/** ReImage —— 示例图片 URL（picsum，随机尺寸但带缓存） */
const demoImage = "https://picsum.photos/seed/ch-image/640/360";

export const reImageMeta: TemplateMeta = {
  name: "ReImage",
  component: () => import("@repo/ui/re-image").then((m) => ({ default: m.default })),
  title: "图片",
  description: "单图组件（懒加载 + 预览 + 错误占位）",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "src", label: "图片地址", type: "string", default: demoImage },
    { key: "alt", label: "替代文本", type: "string", default: "示例图片" },
    { key: "width", label: "宽度", type: "string", default: "100%" },
    { key: "height", label: "高度", type: "string", default: "240px" },
    { key: "radius", label: "圆角", type: "number", default: 8, min: 0, max: 64, step: 1 },
    {
      key: "fit",
      label: "对象适配",
      type: "select",
      default: "cover",
      options: [
        { label: "fill", value: "fill" },
        { label: "contain", value: "contain" },
        { label: "cover", value: "cover" },
        { label: "none", value: "none" },
        { label: "scale-down", value: "scale-down" },
      ],
    },
    { key: "preview", label: "可预览", type: "boolean", default: true },
    { key: "lazy", label: "懒加载", type: "boolean", default: true },
    { key: "loading", label: "显示加载占位", type: "boolean", default: true },
    { key: "fallbackText", label: "失败文案", type: "string", default: "加载失败" },
  ],
};

/** 示例图片数据：模拟瀑布流场景 */
const masonryDemo = [
  { src: "https://picsum.photos/seed/a/600/400", width: 600, height: 400, alt: "示例 A" },
  { src: "https://picsum.photos/seed/b/600/800", width: 600, height: 800, alt: "示例 B" },
  { src: "https://picsum.photos/seed/c/600/500", width: 600, height: 500, alt: "示例 C" },
  { src: "https://picsum.photos/seed/d/600/700", width: 600, height: 700, alt: "示例 D" },
  { src: "https://picsum.photos/seed/e/600/450", width: 600, height: 450, alt: "示例 E" },
  { src: "https://picsum.photos/seed/f/600/900", width: 600, height: 900, alt: "示例 F" },
  { src: "https://picsum.photos/seed/g/600/380", width: 600, height: 380, alt: "示例 G" },
  { src: "https://picsum.photos/seed/h/600/600", width: 600, height: 600, alt: "示例 H" },
  { src: "https://picsum.photos/seed/i/600/520", width: 600, height: 520, alt: "示例 I" },
  { src: "https://picsum.photos/seed/j/600/720", width: 600, height: 720, alt: "示例 J" },
  { src: "https://picsum.photos/seed/k/600/440", width: 600, height: 440, alt: "示例 K" },
  { src: "https://picsum.photos/seed/l/600/860", width: 600, height: 860, alt: "示例 L" },
];

export const reImageGroupMeta: TemplateMeta = {
  name: "ReImageGroup",
  component: () => import("@repo/ui/re-image-group").then((m) => ({ default: m.default })),
  title: "图片组（异步懒加载）",
  description: "图片列表/画廊，IntersectionObserver 视口内按需加载，避免一次性加载全部图片",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    {
      key: "layoutMode",
      label: "布局模式",
      type: "select",
      default: "grid",
      options: [
        { label: "grid（等高网格）", value: "grid" },
        { label: "masonry（瀑布流）", value: "masonry" },
      ],
    },
    { key: "srcList", label: "图片列表", type: "json", default: masonryDemo },
    { key: "columns", label: "列数", type: "number", default: 4, min: 1, max: 8, step: 1 },
    { key: "gap", label: "间距（px）", type: "number", default: 8, min: 0, max: 32, step: 1 },
    { key: "rowHeight", label: "行高（px，grid 模式）", type: "number", default: 160, min: 60, max: 400, step: 10 },
    { key: "radius", label: "圆角", type: "number", default: 6, min: 0, max: 32, step: 1 },
    {
      key: "fit",
      label: "对象适配",
      type: "select",
      default: "cover",
      options: [
        { label: "fill", value: "fill" },
        { label: "contain", value: "contain" },
        { label: "cover", value: "cover" },
        { label: "none", value: "none" },
        { label: "scale-down", value: "scale-down" },
      ],
    },
    { key: "preview", label: "可预览", type: "boolean", default: true },
    { key: "lazy", label: "异步懒加载", type: "boolean", default: true, description: "关闭后所有图片立即加载（首屏全量加载）" },
    { key: "rootMargin", label: "预加载外扩", type: "string", default: "200px", description: "IntersectionObserver rootMargin，提前触发加载" },
    { key: "loading", label: "显示加载占位", type: "boolean", default: true },
    { key: "fallbackText", label: "失败文案", type: "string", default: "加载失败" },
  ],
};

export const mediaTemplates: TemplateMeta[] = [
  reImageMeta,
  reImageGroupMeta,
];
