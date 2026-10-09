/**
 * Nginx 自定义看板：卡片模型与常量。
 *
 * <p>布局复用 home 插件的网格编辑器（HomePreview + WidgetLibrary），卡片配置挂在
 * {@link WidgetItem} 的扩展字段 {@code ngx} 上随布局一起持久化。后端只存 JSON 文本，
 * 所以卡片模型演进不需要动表结构。</p>
 *
 * <p>与 Prometheus 看板（{@code promTypes.ts}）刻意分文件：两边的卡片配置字段
 * 语义不同（PromQL 对 nginx 四类数据源），共用一份类型只会靠注释维系虚假的一致。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import type { InjectionKey } from "vue";
import type { GridPosition, WidgetCatalogItem, WidgetItem } from "@repo/theme/koi/views/home/types";
import type { NgxDataContext } from "../../../api/nginx/api";

/** 卡片种类（widget.type） */
export type NgxCardKind = "ngx-stat" | "ngx-chart" | "ngx-table" | "ngx-script";

/** 状态卡可选指标（stub_status 字段） */
export const STAT_METRICS: Array<{ value: string; label: string }> = [
  { value: "activeConnections", label: "活跃连接（Active）" },
  { value: "accepts", label: "已接受连接（Accepts，累计）" },
  { value: "handled", label: "已处理连接（Handled，累计）" },
  { value: "requests", label: "已处理请求（Requests，累计）" },
  { value: "reading", label: "读请求（Reading）" },
  { value: "writing", label: "写响应（Writing）" },
  { value: "waiting", label: "空闲等待（Waiting）" },
];

/** 趋势图可选指标（后台 30s 采集的指标名） */
export const TREND_METRICS: Array<{ value: string; label: string }> = [
  { value: "active", label: "活跃连接（active）" },
  { value: "accepts", label: "接受连接速率（accepts/s）" },
  { value: "handled", label: "处理连接速率（handled/s）" },
  { value: "requests", label: "请求速率（requests/s）" },
  { value: "reading", label: "读请求（reading）" },
  { value: "writing", label: "写响应（writing）" },
  { value: "waiting", label: "空闲等待（waiting）" },
];

/** 表格卡可选维度（访问日志 Top 统计） */
export const TABLE_DIMENSIONS: Array<{ value: "paths" | "ips" | "statuses"; label: string }> = [
  { value: "paths", label: "热点路径 Top" },
  { value: "ips", label: "来源 IP Top" },
  { value: "statuses", label: "状态码分布" },
];

/** 卡片配置：表单模式与自定义 JSON 模式操作的是同一份对象 */
export interface NgxCardConfig {
  /** 状态卡指标名（ngx-stat 使用，见 STAT_METRICS） */
  metric?: string;
  /** 趋势图指标集合（ngx-chart 使用，见 TREND_METRICS） */
  metrics?: string[];
  /** 图表类型（ngx-chart 使用） */
  chartType?: "line" | "bar" | "area";
  /** 回看小时数（ngx-chart 使用，缺省 6） */
  hours?: number;
  /** 采样间隔分钟（ngx-chart 使用，空 = 后端自动） */
  interval?: number;
  /** 表格维度（ngx-table 使用） */
  dimension?: "paths" | "ips" | "statuses";
  /** 表格条数（ngx-table 使用） */
  topN?: number;
  /** 日志尾部扫描行数（ngx-table 使用） */
  lines?: number;
  /** 只统计最近 N 分钟（ngx-table 使用，0 = 不限） */
  minutes?: number;
  /** ECharts 参数（JSON 文本，深合并到自动生成的 option 上；ngx-chart 使用） */
  echarts?: string;
  /** 数据采集脚本（ngx-script 使用，JS 函数体，参数为 ctx） */
  script?: string;
  /** 卡片背景色（CSS 颜色） */
  background?: string;
  /** 卡片文字色（CSS 颜色） */
  textColor?: string;
  /** 自定义 CSS（作用于卡片根元素） */
  css?: string;
  /** 刷新间隔（秒），0 或空 = 不自动刷新 */
  refreshSeconds?: number;
  /** 数值单位（ngx-stat 使用，如 conn / req） */
  unit?: string;
  /** 小数位（ngx-stat 使用） */
  decimals?: number;
}

/** 带 Nginx 卡片配置的 widget 条目 */
export type NgxWidgetItem = WidgetItem & { ngx?: NgxCardConfig };

/** 布局状态（持久化到 dashboard_config） */
export interface NgxLayoutState {
  /** 布局模型版本，便于将来迁移 */
  version: number;
  widgets: NgxWidgetItem[];
  grid: GridPosition[];
}

/** 卡片类型元数据 */
export interface NgxCardMeta {
  label: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  defaultCard: NgxCardConfig;
}

/** 卡片类型目录 */
export const NGX_CARD_META: Record<NgxCardKind, NgxCardMeta> = {
  "ngx-stat": {
    label: "状态卡",
    description: "stub_status 单值（活跃连接、请求速率等）",
    icon: "Odometer",
    defaultSize: { w: 3, h: 3 },
    defaultCard: { metric: "activeConnections", refreshSeconds: 30 },
  },
  "ngx-chart": {
    label: "趋势图",
    description: "指标采集趋势（ECharts 折线/柱/面积）",
    icon: "TrendCharts",
    defaultSize: { w: 6, h: 5 },
    defaultCard: {
      metrics: ["active", "requests"],
      chartType: "line",
      hours: 6,
      refreshSeconds: 60,
    },
  },
  "ngx-table": {
    label: "访问 Top",
    description: "热点路径 / 来源 IP / 状态码分布",
    icon: "Grid",
    defaultSize: { w: 6, h: 5 },
    defaultCard: { dimension: "paths", topN: 10, refreshSeconds: 60 },
  },
  "ngx-script": {
    label: "脚本卡",
    description: "自定义脚本采集并渲染",
    icon: "Cpu",
    defaultSize: { w: 4, h: 3 },
    defaultCard: {
      script: [
        "// ctx.status() / ctx.trend(hours, interval) / ctx.accessTop(lines, minutes, topN) / ctx.urlTrend(lines, topN)",
        "const st = await ctx.status();",
        "if (!st.available) return st.message;",
        "return `活跃 ${st.activeConnections} · 累计请求 ${st.requests}`;",
      ].join("\n"),
      refreshSeconds: 30,
    },
  },
};

/** 组件目录（给 WidgetLibrary 用；与 home 注册表解耦，只过滤出 Nginx 卡片） */
export const NGX_CARD_CATALOG: WidgetCatalogItem[] = (Object.keys(NGX_CARD_META) as NgxCardKind[]).map(type => {
  const meta = NGX_CARD_META[type];
  return {
    type,
    title: meta.label,
    description: meta.description,
    icon: meta.icon,
    defaultSize: meta.defaultSize,
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 24,
  };
});

/** 卡片取数上下文注入键 */
export const NGX_CTX_KEY: InjectionKey<NgxDataContext> = Symbol("ngx-context");

/** 新建一个空布局 */
export const emptyNgxLayout = (): NgxLayoutState => ({ version: 1, widgets: [], grid: [] });

/** 解析持久化配置为布局；宽容处理坏数据 */
export const parseNgxLayout = (config: string | null | undefined): NgxLayoutState => {
  if (!config) {
    return emptyNgxLayout();
  }
  try {
    const raw = JSON.parse(config);
    if (raw && Array.isArray(raw.widgets) && Array.isArray(raw.grid)) {
      return { version: raw.version ?? 1, widgets: raw.widgets, grid: raw.grid };
    }
  } catch {
    // 坏 JSON 一律按空布局处理：看板不该因为一段脏数据整个打不开
  }
  return emptyNgxLayout();
};

/** 序列化布局 */
export const serializeNgxLayout = (layout: NgxLayoutState): string =>
  JSON.stringify({ version: layout.version ?? 1, widgets: layout.widgets, grid: layout.grid });

/** 生成卡片 id */
export const newNgxCardId = (): string =>
  `nw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
