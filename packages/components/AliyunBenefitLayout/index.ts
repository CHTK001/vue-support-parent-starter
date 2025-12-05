/**
 * 阿里云权益中心布局组件导出
 * @author CH
 * @since 2024-12-05
 */
import AliyunBenefitLayout from "./index.vue";

export { AliyunBenefitLayout };
export default AliyunBenefitLayout;

// 类型导出
export interface BenefitCard {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  unit?: string;
  tag?: string;
  tagType?: "hot" | "new" | "discount" | "free" | "limit";
  icon?: string;
  image?: string;
  features?: string[];
  buttonText?: string;
  buttonType?: "primary" | "default" | "text";
  link?: string;
}

export interface BenefitSection {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: string;
  cards: BenefitCard[];
  layout?: "grid" | "flex" | "carousel";
  columns?: number;
}

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}
