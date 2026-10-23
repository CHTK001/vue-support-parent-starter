/**
 * 骨架屏结构推导。
 *
 * <p>问题：固定 4 条骨架条只适合"列表"场景。换成表格/卡片/表单时，
 * 骨架形状与最终内容对不上 —— 加载完成的瞬间布局会明显跳动（这是骨架屏
 * 最常见的体验问题，比"没有骨架"更糟）。</p>
 *
 * <p>做法：调用方描述内容结构（行数、列数、是否有头像等），据此生成对应形状
 * 的骨架。不做 DOM 嗅探 —— 那样既慢又脆（内容还没渲染时嗅探不到什么）。</p>
 */

/** 骨架布局类型 */
export type SkeletonLayout = "list" | "table" | "card" | "form" | "article";

/** 骨架结构描述 */
export interface SkeletonShape {
  /** 布局类型 */
  layout?: SkeletonLayout;
  /** 行数（list/form/article 用） */
  rows?: number;
  /** 列数（table 用） */
  columns?: number;
  /** 是否有头像/缩略图（card/list 用） */
  avatar?: boolean;
  /** 是否有标题块 */
  title?: boolean;
  /** 单元格高度（px，默认 18） */
  rowHeight?: number;
  /** 行间距（px，默认 12） */
  gap?: number;
}

/** 单个骨架块 */
export interface SkeletonBlock {
  type: "avatar" | "title" | "text" | "cell";
  /** CSS 类名后缀，供模板区分形状 */
  kind: string;
  /** 宽度比例（0-1）或固定尺寸描述 */
  width?: string;
  height?: string;
}

/**
 * 按结构描述生成骨架块序列。
 *
 * @param shape 结构描述
 * @returns 块序列（按渲染顺序）
 */
export function buildSkeleton(shape: SkeletonShape = {}): SkeletonBlock[] {
  const layout = shape.layout ?? "list";
  const rowHeight = shape.rowHeight ?? 18;
  const gap = shape.gap ?? 12;
  const out: SkeletonBlock[] = [];

  const text = (kind: string, width?: string): SkeletonBlock => ({
    type: "text",
    kind,
    width: width ?? "100%",
    height: `${rowHeight}px`,
  });

  switch (layout) {
    case "table": {
      const columns = Math.max(1, shape.columns ?? 3);
      // 表头行 + 数据行
      for (let c = 0; c < columns; c++) {
        out.push({ type: "cell", kind: "head", width: `${Math.round(100 / columns)}%`, height: `${rowHeight}px` });
      }
      const rows = Math.max(1, shape.rows ?? 3);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          // 末列窄一点，视觉上更像真实表格（末列常是操作按钮）
          const w = c === columns - 1 && columns > 2 ? "60%" : `${Math.round(100 / columns)}%`;
          out.push({ type: "cell", kind: "cell", width: w, height: `${rowHeight}px` });
        }
      }
      return out;
    }

    case "card": {
      const count = Math.max(1, shape.rows ?? 2);
      for (let i = 0; i < count; i++) {
        if (shape.avatar !== false) {
          out.push({ type: "avatar", kind: "avatar", width: "40px", height: "40px" });
        }
        if (shape.title !== false) {
          out.push(text("title", "45%"));
        }
        out.push(text("text", i === count - 1 ? "72%" : "100%"));
      }
      return out;
    }

    case "form": {
      const rows = Math.max(1, shape.rows ?? 3);
      for (let i = 0; i < rows; i++) {
        // 标签（窄）+ 输入框（宽）成对，形状与真实表单一致
        out.push({ type: "text", kind: "label", width: "96px", height: "16px" });
        out.push({ type: "cell", kind: "field", width: "100%", height: `${rowHeight + 8}px` });
      }
      return out;
    }

    case "article": {
      if (shape.title !== false) {
        out.push(text("title", "62%"));
      }
      const rows = Math.max(2, shape.rows ?? 5);
      for (let i = 0; i < rows; i++) {
        // 末行短一些，像真段落的收尾
        out.push(text("text", i === rows - 1 ? "48%" : "100%"));
      }
      return out;
    }

    case "list":
    default: {
      const rows = Math.max(1, shape.rows ?? 4);
      for (let i = 0; i < rows; i++) {
        if (shape.avatar) {
          out.push({ type: "avatar", kind: "avatar", width: "36px", height: "36px" });
        }
        out.push(text("text", i === rows - 1 ? "55%" : "100%"));
      }
      return out;
    }
  }
}

/**
 * 生成骨架容器的 CSS 变量（间距统一在这里定）。
 *
 * @param shape 结构描述
 * @returns CSS 变量集合
 */
export function skeletonVars(shape: SkeletonShape = {}): Record<string, string> {
  return {
    "--rl-sk-gap": `${shape.gap ?? 12}px`,
  };
}
