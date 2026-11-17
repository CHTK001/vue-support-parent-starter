/**
 * 可视化大屏模块的公共类型。
 *
 * <p>「大屏」是 three-screen-lab 七屏（风电 / 工厂 / 人口 / 巡检 / 农业 / 工业 / 园区）
 * 整体迁入的展示模块：屏幕本体是<strong>逐字节保留</strong>的原始 HTML/JS/CSS，
 * 由 {@code lib/assemble.ts} 在运行时按 three-screen-lab 的构建规则拼装成完整
 * HTML 文档，再用 iframe srcdoc 承载。注册项因此带两种渲染入口之一：
 * {@link BigScreenRegistration.document}（文档工厂）或
 * {@link BigScreenRegistration.component}（Vue 组件，供模块贡献方使用）。</p>
 *
 * @since 4.0.0.52
 */
import type { Component } from "vue";

/** 大屏分类（与 three-screen-lab 的 config/screens.json 口径一致） */
export type BigScreenCategory = "3d" | "geo" | "operations";

/** 大屏目录元数据（不含渲染入口，供菜单 / 画廊展示） */
export interface BigScreenCatalogItem {
  /** 屏标识（three-screen-lab 的 screen id，如 {@code "wind"}） */
  id: string;
  /** 屏标题（中文） */
  title: string;
  /** 一句话介绍 */
  description: string;
  /** 分类 */
  category: BigScreenCategory;
  /** 英文角标（如 {@code "WIND ENERGY"}） */
  label: string;
  /** 舞台设计宽度（px） */
  width: number;
  /** 舞台设计高度（px） */
  height: number;
  /** 预览图 URL（构建期解析的绝对地址） */
  preview: string;
  /** 标签（1~5 个） */
  tags: string[];
}

/** 文档工厂：返回完整 HTML 文档文本（three-screen-lab 拼装产物），由 iframe srcdoc 承载 */
export type BigScreenDocumentFactory = () => Promise<string> | string;

/** 组件工厂：返回 Vue 组件（模块贡献自定义大屏时的渲染入口），归一规则同 monitor-cards */
export type BigScreenComponentFactory = () =>
  | Component
  | { default: Component }
  | Promise<Component | { default: Component }>;

/** 大屏注册项：元数据 + 渲染入口（document 与 component 二选一） */
export interface BigScreenRegistration extends BigScreenCatalogItem {
  /** 贡献该大屏的模块标识（内置七屏为 {@code "bigscreen"}） */
  source?: string;
  /** 文档工厂（内置七屏走这里） */
  document?: BigScreenDocumentFactory;
  /** 组件工厂（模块贡献 Vue 大屏走这里） */
  component?: BigScreenComponentFactory;
}

/** 大屏贡献器：与 {@code @repo/app} 的 AppContribution（namespace + register）对齐 */
export interface BigScreenContribution {
  namespace: string;
  register: () => void;
}
