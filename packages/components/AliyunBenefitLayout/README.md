# AliyunBenefitLayout 阿里云权益中心布局组件

参考阿里云权益中心页面设计的独立布局组件。

## 特性

- 🎨 **现代化设计**：渐变背景、浮动动画、卡片悬停效果
- 📱 **响应式布局**：自适应不同屏幕尺寸
- 🌙 **深色模式**：完整的深色主题支持
- 🔧 **高度可定制**：通过Props和插槽灵活配置

## 安装使用

```vue
<script setup lang="ts">
import AliyunBenefitLayout from "@repo/components/AliyunBenefitLayout";
import type { BenefitSection, TabItem } from "@repo/components/AliyunBenefitLayout";

const tabs: TabItem[] = [
  { key: "cloud", label: "云产品权益", icon: "ri:cloud-line" },
  { key: "ai", label: "AI 产品权益", icon: "ri:robot-line" }
];

const sections: BenefitSection[] = [
  {
    id: "hot",
    title: "新人限时抢购",
    subtitle: "首购专享",
    icon: "ri:fire-line",
    columns: 4,
    cards: [
      {
        id: 1,
        title: "云服务器 ECS",
        price: "38",
        originalPrice: "600",
        unit: "/年",
        tag: "爆款",
        tagType: "hot",
        icon: "ri:server-line",
        buttonText: "立即抢购"
      }
    ]
  }
];
</script>

<template>
  <AliyunBenefitLayout title="权益中心" subtitle="专属优惠，助力上云" :tabs="tabs" :sections="sections" @tab-change="handleTabChange" @card-click="handleCardClick" @button-click="handleButtonClick" />
</template>
```

## Props

| 属性               | 类型             | 默认值               | 说明         |
| ------------------ | ---------------- | -------------------- | ------------ |
| title              | string           | "权益中心"           | 页面标题     |
| subtitle           | string           | "专属优惠，助力上云" | 副标题       |
| backgroundGradient | string           | 渐变色               | 顶部背景渐变 |
| tabs               | TabItem[]        | []                   | Tab切换配置  |
| sections           | BenefitSection[] | []                   | 区块数据     |

## 事件

| 事件名       | 参数                | 说明           |
| ------------ | ------------------- | -------------- |
| tab-change   | (key: string)       | Tab切换时触发  |
| card-click   | (card: BenefitCard) | 点击卡片时触发 |
| button-click | (card: BenefitCard) | 点击按钮时触发 |

## 插槽

| 插槽名             | 说明                 |
| ------------------ | -------------------- |
| top                | 内容区域顶部         |
| bottom             | 内容区域底部         |
| default            | 默认插槽             |
| section-{id}-extra | 区块标题右侧额外内容 |

## 类型定义

### TabItem

```typescript
interface TabItem {
  key: string;
  label: string;
  icon?: string;
}
```

### BenefitCard

```typescript
interface BenefitCard {
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
```

### BenefitSection

```typescript
interface BenefitSection {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: string;
  cards: BenefitCard[];
  layout?: "grid" | "flex" | "carousel";
  columns?: number; // 1-5
}
```

## 标签类型

| tagType  | 样式                  |
| -------- | --------------------- |
| hot      | 红色渐变（爆款/热门） |
| new      | 绿色渐变（新品/推荐） |
| discount | 橙色渐变（折扣）      |
| free     | 蓝色渐变（免费）      |
| limit    | 紫色渐变（限时）      |
