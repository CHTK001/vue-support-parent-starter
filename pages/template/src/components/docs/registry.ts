/**
 * 组件库示例站注册表
 *
 * 集中维护每个 Re* 组件在「示例站」中可见的元信息：
 *  - name / title：组件名与中文名
 *  - category：分类
 *  - props：所有参数 + 示例默认值
 *  - code：该示例在「实时代码」Tab 中暴露的 Vue 源文件
 *
 * 这些是示例站引用的目标文件，实际渲染由 `examples/ReXxx.vue` 提供。
 */
export interface DocComponent {
  /** 组件名（如 `ReButton`） */
  name: string;
  /** 分类 */
  category: "基础" | "反馈" | "数据" | "编辑" | "展示" | "媒体" | "主题";
  /** 中文名称 */
  title: string;
  /** 参数列表，每项：目标 key / 示例值 */
  props: Record<string, unknown>;
  /** 示例页面使用的代码片段（展示用，与 examples/ReXxx.vue 对应） */
  code: string;
  /** 示例文件（页面自动加载） */
  example: () => Promise<any>;
}

/** 分类 → 中文名 */
export const DOC_CATEGORY_MAP: Record<string, string> = {
  基础: "基础控件",
  反馈: "反馈/加载",
  数据: "数据展示",
  编辑: "编辑/表单",
  展示: "展示卡片",
  媒体: "媒体/特效",
  主题: "主题/布局",
};

/** 按名字样时，从内部 imports 处动态映射组件 */
export const DOC_COMPONENTS: DocComponent[] = [];
