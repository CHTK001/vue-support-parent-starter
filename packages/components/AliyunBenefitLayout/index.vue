<script setup lang="ts">
/**
 * 阿里云权益中心风格布局组件
 * 参考阿里云权益中心页面设计
 * @author CH
 * @since 2024-12-05
 */
import { ref, computed } from "vue";

// 定义Props
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

interface BenefitSection {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: string;
  cards: BenefitCard[];
  layout?: "grid" | "flex" | "carousel";
  columns?: number;
}

interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

interface Props {
  // 标题
  title?: string;
  // 副标题
  subtitle?: string;
  // Tab列表
  tabs?: TabItem[];
  // 区块数据
  sections?: BenefitSection[];
  // 背景渐变
  backgroundGradient?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "权益中心",
  subtitle: "专属优惠，助力上云",
  backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  tabs: () => [
    { key: "cloud", label: "云产品权益", icon: "ri:cloud-line" },
    { key: "ai", label: "AI 产品权益", icon: "ri:robot-line" }
  ],
  sections: () => []
});

// 当前激活的Tab
const activeTab = ref(props.tabs?.[0]?.key || "cloud");

// 定义事件
const emit = defineEmits<{
  (e: "tab-change", key: string): void;
  (e: "card-click", card: BenefitCard): void;
  (e: "button-click", card: BenefitCard): void;
}>();

// 切换Tab
function handleTabChange(key: string) {
  activeTab.value = key;
  emit("tab-change", key);
}

// 卡片点击
function handleCardClick(card: BenefitCard) {
  emit("card-click", card);
}

// 按钮点击
function handleButtonClick(card: BenefitCard, event: Event) {
  event.stopPropagation();
  emit("button-click", card);
}

// 获取标签样式类
function getTagClass(tagType?: string) {
  const typeMap: Record<string, string> = {
    hot: "tag-hot",
    new: "tag-new",
    discount: "tag-discount",
    free: "tag-free",
    limit: "tag-limit"
  };
  return typeMap[tagType || ""] || "tag-default";
}
</script>

<template>
  <div class="aliyun-benefit-layout">
    <!-- 顶部Banner区域 -->
    <div class="benefit-header" :style="{ background: backgroundGradient }">
      <!-- 装饰元素 -->
      <div class="header-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>

      <div class="header-content">
        <h1 class="header-title">{{ title }}</h1>
        <p class="header-subtitle">{{ subtitle }}</p>

        <!-- Tab切换 -->
        <div class="header-tabs">
          <div v-for="tab in tabs" :key="tab.key" class="tab-item" :class="{ 'is-active': activeTab === tab.key }" @click="handleTabChange(tab.key)">
            <IconifyIconOnline v-if="tab.icon" :icon="tab.icon" class="tab-icon" />
            <span class="tab-label">{{ tab.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="benefit-content">
      <!-- 插槽：自定义顶部内容 -->
      <slot name="top"></slot>

      <!-- 区块列表 -->
      <div v-for="section in sections" :key="section.id" class="benefit-section">
        <!-- 区块标题 -->
        <div class="section-header">
          <div class="section-title-wrapper">
            <IconifyIconOnline v-if="section.icon" :icon="section.icon" class="section-icon" />
            <h2 class="section-title">{{ section.title }}</h2>
            <span v-if="section.subtitle" class="section-subtitle">{{ section.subtitle }}</span>
          </div>
          <slot :name="`section-${section.id}-extra`"></slot>
        </div>

        <!-- 卡片网格 -->
        <div class="section-cards" :class="[`layout-${section.layout || 'grid'}`, `columns-${section.columns || 4}`]">
          <div v-for="card in section.cards" :key="card.id" class="benefit-card" @click="handleCardClick(card)">
            <!-- 标签 -->
            <div v-if="card.tag" class="card-tag" :class="getTagClass(card.tagType)">
              {{ card.tag }}
            </div>

            <!-- 卡片图片 -->
            <div v-if="card.image" class="card-image">
              <img :src="card.image" :alt="card.title" />
            </div>

            <!-- 卡片图标 -->
            <div v-else-if="card.icon" class="card-icon-wrapper">
              <IconifyIconOnline :icon="card.icon" class="card-icon" />
            </div>

            <!-- 卡片内容 -->
            <div class="card-body">
              <h3 class="card-title">{{ card.title }}</h3>
              <p v-if="card.subtitle" class="card-subtitle">{{ card.subtitle }}</p>
              <p v-if="card.description" class="card-description">
                {{ card.description }}
              </p>

              <!-- 特性列表 -->
              <ul v-if="card.features?.length" class="card-features">
                <li v-for="(feature, idx) in card.features" :key="idx">
                  <IconifyIconOnline icon="ri:check-line" class="feature-icon" />
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <!-- 价格区域 -->
              <div v-if="card.price" class="card-price">
                <span class="price-current">
                  <span class="price-symbol">¥</span>
                  <span class="price-value">{{ card.price }}</span>
                  <span v-if="card.unit" class="price-unit">{{ card.unit }}</span>
                </span>
                <span v-if="card.originalPrice" class="price-original">¥{{ card.originalPrice }}</span>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div v-if="card.buttonText" class="card-footer">
              <el-button :type="card.buttonType || 'primary'" class="card-button" @click="handleButtonClick(card, $event)">
                {{ card.buttonText }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 插槽：自定义底部内容 -->
      <slot name="bottom"></slot>

      <!-- 默认插槽 -->
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.aliyun-benefit-layout {
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

/* 顶部Banner */
.benefit-header {
  position: relative;
  padding: 60px 40px 80px;
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 20s ease-in-out infinite;
  }

  .circle-1 {
    width: 400px;
    height: 400px;
    top: -200px;
    right: -100px;
    animation-delay: 0s;
  }

  .circle-2 {
    width: 300px;
    height: 300px;
    bottom: -150px;
    left: 10%;
    animation-delay: -5s;
  }

  .circle-3 {
    width: 200px;
    height: 200px;
    top: 50%;
    left: 30%;
    animation-delay: -10s;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -20px) scale(1.05);
  }
  50% {
    transform: translate(-10px, 10px) scale(0.95);
  }
  75% {
    transform: translate(-20px, -10px) scale(1.02);
  }
}

.header-content {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  z-index: 1;
}

.header-title {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  letter-spacing: 2px;
}

.header-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 40px;
  font-weight: 400;
}

/* Tab切换 */
.header-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  font-size: 15px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &.is-active {
    background: #fff;
    color: var(--el-color-primary);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    .tab-icon {
      color: var(--el-color-primary);
    }
  }
}

.tab-icon {
  font-size: 20px;
}

/* 内容区域 */
.benefit-content {
  max-width: 1400px;
  margin: -40px auto 0;
  padding: 0 40px 60px;
  position: relative;
  z-index: 2;
}

/* 区块 */
.benefit-section {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 8px;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  font-size: 28px;
  color: var(--el-color-primary);
  padding: 10px;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1) 0%, rgba(var(--el-color-primary-rgb), 0.05) 100%);
  border-radius: 12px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
}

.section-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-lighter);
}

/* 卡片网格 */
.section-cards {
  display: grid;
  gap: 20px;

  &.layout-grid {
    &.columns-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    &.columns-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    &.columns-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    &.columns-5 {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &.layout-flex {
    display: flex;
    flex-wrap: wrap;

    .benefit-card {
      flex: 1 1 280px;
      max-width: 350px;
    }
  }
}

/* 卡片 */
.benefit-card {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.08),
      0 8px 16px rgba(0, 0, 0, 0.04);
    border-color: transparent;

    &::before {
      opacity: 1;
    }
  }
}

/* 标签 */
.card-tag {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &.tag-hot {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: #fff;
  }

  &.tag-new {
    background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%);
    color: #fff;
  }

  &.tag-discount {
    background: linear-gradient(135deg, #feca57 0%, #ff9f43 100%);
    color: #fff;
  }

  &.tag-free {
    background: linear-gradient(135deg, #54a0ff 0%, #2e86de 100%);
    color: #fff;
  }

  &.tag-limit {
    background: linear-gradient(135deg, #a55eea 0%, #8854d0 100%);
    color: #fff;
  }

  &.tag-default {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
  }
}

/* 卡片图标 */
.card-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1) 0%, rgba(var(--el-color-primary-rgb), 0.05) 100%);
  margin-bottom: 16px;
}

.card-icon {
  font-size: 28px;
  color: var(--el-color-primary);
}

/* 卡片图片 */
.card-image {
  margin: -24px -24px 16px;
  height: 140px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
}

.benefit-card:hover .card-image img {
  transform: scale(1.05);
}

/* 卡片内容 */
.card-body {
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
  line-height: 1.4;
}

.card-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
}

.card-description {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 0 0 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 特性列表 */
.card-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .feature-icon {
    font-size: 14px;
    color: var(--el-color-success);
  }
}

/* 价格区域 */
.card-price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
}

.price-current {
  display: flex;
  align-items: baseline;
  color: #ff4d4f;
  font-weight: 700;
}

.price-symbol {
  font-size: 16px;
}

.price-value {
  font-size: 32px;
  line-height: 1;
}

.price-unit {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
  font-weight: 400;
}

.price-original {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  text-decoration: line-through;
}

/* 卡片底部 */
.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.card-button {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .section-cards.layout-grid {
    &.columns-4,
    &.columns-5 {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: 900px) {
  .benefit-header {
    padding: 40px 24px 60px;
  }

  .header-title {
    font-size: 32px;
  }

  .benefit-content {
    padding: 0 24px 40px;
  }

  .section-cards.layout-grid {
    &.columns-3,
    &.columns-4,
    &.columns-5 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 600px) {
  .benefit-header {
    padding: 32px 16px 50px;
  }

  .header-title {
    font-size: 26px;
  }

  .header-tabs {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }

  .tab-item {
    justify-content: center;
  }

  .benefit-content {
    padding: 0 16px 32px;
    margin-top: -30px;
  }

  .section-cards.layout-grid {
    grid-template-columns: 1fr;
  }

  .benefit-card {
    padding: 20px;
  }
}

/* 深色模式 */
html.dark {
  .benefit-header {
    .header-decoration .decoration-circle {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .benefit-card {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color-dark);

    &:hover {
      box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.3),
        0 8px 16px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
