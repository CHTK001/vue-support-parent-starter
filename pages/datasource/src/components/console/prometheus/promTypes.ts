/**
 * Prometheus 自定义看板：卡片模型与常量。
 *
 * <p>布局复用 home 插件的网格编辑器（HomePreview + WidgetLibrary），卡片配置挂在
 * {@link WidgetItem} 的扩展字段 {@code prom} 上随布局一起持久化。后端只存 JSON 文本，
 * 所以卡片模型演进不需要动表结构。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import type { InjectionKey } from "vue";
import type { GridPosition, WidgetCatalogItem, WidgetItem } from "@repo/theme/koi/views/home/types";
import type { PromDataContext } from "../../../api/prometheus/api";

/** 卡片种类（widget.type） */
export type PromCardKind = "prom-stat" | "prom-chart" | "prom-table" | "prom-script";

/** 卡片配置：表单模式与自定义 JSON 模式操作的是同一份对象 */
export interface PromCardConfig {
  /** 数据模式：即时（instant）或范围（range） */
  mode?: "instant" | "range";
  /** PromQL（stat/chart/table 使用） */
  promql?: string;
  /** 图表类型（chart 使用） */
  chartType?: "line" | "bar" | "area";
  /** ECharts 参数（JSON 文本，深合并到自动生成的 option 上；chart 使用） */
  echarts?: string;
  /** 数据采集脚本（script 使用，JS 函数体，参数为 ctx） */
  script?: string;
  /** 卡片背景色（CSS 颜色） */
  background?: string;
  /** 卡片文字色（CSS 颜色） */
  textColor?: string;
  /** 自定义 CSS（作用于卡片根元素） */
  css?: string;
  /** 刷新间隔（秒），0 或空 = 不自动刷新 */
  refreshSeconds?: number;
  /** 范围查询回看时长（分钟） */
  durationMinutes?: number;
  /** 范围查询步长（如 30s / 1m），空 = 按跨度自动 */
  step?: string;
  /** 数值单位（stat 使用，如 % / req/s） */
  unit?: string;
  /** 小数位（stat 使用） */
  decimals?: number;
}

/** 带 Prometheus 卡片配置的 widget 条目 */
export type PromWidgetItem = WidgetItem & { prom?: PromCardConfig };

/** 布局状态（持久化到 dashboard_config） */
export interface PromLayoutState {
  /** 布局模型版本，便于将来迁移 */
  version: number;
  widgets: PromWidgetItem[];
  grid: GridPosition[];
}

/** 卡片类型元数据 */
export interface PromCardMeta {
  label: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  defaultCard: PromCardConfig;
}

/** 卡片类型目录 */
export const PROM_CARD_META: Record<PromCardKind, PromCardMeta> = {
  "prom-stat": {
    label: "指标卡",
    description: "单值展示（目标数、QPS 等）",
    icon: "Odometer",
    defaultSize: { w: 3, h: 3 },
    defaultCard: { mode: "instant", promql: "up", refreshSeconds: 30, decimals: 2 },
  },
  "prom-chart": {
    label: "趋势图",
    description: "ECharts 折线/柱状/面积图",
    icon: "TrendCharts",
    defaultSize: { w: 6, h: 5 },
    defaultCard: {
      mode: "range",
      promql: 'rate(prometheus_http_requests_total{code="200"}[5m])',
      chartType: "line",
      durationMinutes: 60,
      refreshSeconds: 30,
    },
  },
  "prom-table": {
    label: "数据表",
    description: "查询结果明细表",
    icon: "Grid",
    defaultSize: { w: 6, h: 5 },
    defaultCard: { mode: "instant", promql: "up", refreshSeconds: 60 },
  },
  "prom-script": {
    label: "脚本卡",
    description: "自定义脚本采集并渲染",
    icon: "Cpu",
    defaultSize: { w: 4, h: 3 },
    defaultCard: {
      script: [
        "// ctx.query(promql) / ctx.queryRange(promql, minutes, step)",
        "const res = await ctx.query('up');",
        "const list = res.data?.result || [];",
        "const down = list.filter(s => s.value && s.value[1] !== '1').length;",
        "return `在线 ${list.length - down} / 共 ${list.length}`;",
      ].join("\n"),
      refreshSeconds: 30,
    },
  },
};

/** 组件目录（给 WidgetLibrary 用；与 home 注册表解耦，只过滤出 Prometheus 卡片） */
export const PROM_CARD_CATALOG: WidgetCatalogItem[] = (Object.keys(PROM_CARD_META) as PromCardKind[]).map(type => {
  const meta = PROM_CARD_META[type];
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
export const PROM_CTX_KEY: InjectionKey<PromDataContext> = Symbol("prom-context");

/** 新建一个空布局 */
export const emptyLayout = (): PromLayoutState => ({ version: 1, widgets: [], grid: [] });

/** 解析持久化配置为布局；宽容处理坏数据 */
export const parseLayout = (config: string | null | undefined): PromLayoutState => {
  if (!config) {
    return emptyLayout();
  }
  try {
    const raw = JSON.parse(config);
    if (raw && Array.isArray(raw.widgets) && Array.isArray(raw.grid)) {
      return { version: raw.version ?? 1, widgets: raw.widgets, grid: raw.grid };
    }
  } catch {
    // 坏 JSON 一律按空布局处理：看板不该因为一段脏数据整个打不开
  }
  return emptyLayout();
};

/** 序列化布局 */
export const serializeLayout = (layout: PromLayoutState): string =>
  JSON.stringify({ version: layout.version ?? 1, widgets: layout.widgets, grid: layout.grid });

/** 生成卡片 id */
export const newCardId = (): string =>
  `pw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 把标签集合排版成 `job="x", instance="y"` */
export const formatMetric = (metric?: Record<string, string>): string => {
  if (!metric) {
    return "{}";
  }
  const keys = Object.keys(metric);
  if (keys.length === 0) {
    return "{}";
  }
  return keys.map(k => `${k}="${metric[k]}"`).join(", ");
};

/** 从范围查询的 series 里取「自动步长」：按跨越时长选择常用粒度 */
export const autoStep = (startSec: number, endSec: number): string => {
  const span = Math.max(1, endSec - startSec);
  if (span <= 1800) {
    return "15s";
  }
  if (span <= 3600 * 3) {
    return "30s";
  }
  if (span <= 3600 * 12) {
    return "1m";
  }
  if (span <= 3600 * 48) {
    return "5m";
  }
  return "15m";
};

/** 格式化数字（小数位 + 单位） */
export const formatNumber = (value: number, decimals = 2, unit = ""): string => {
  if (!Number.isFinite(value)) {
    return `-${unit}`;
  }
  const fixed = Number(value.toFixed(Math.max(0, Math.min(6, decimals))));
  return `${fixed}${unit}`;
};
