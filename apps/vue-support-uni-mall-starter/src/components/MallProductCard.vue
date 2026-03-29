<script setup lang="ts">
import type { MallProduct } from "@/data/catalog";
import { formatPrice } from "@/data/catalog";
import { computed } from "vue";

const props = defineProps<{
  product: MallProduct;
}>();

const emit = defineEmits<{
  select: [productId: string];
  add: [productId: string];
}>();

const coverStyle = computed(
  () =>
    `background: linear-gradient(135deg, ${props.product.palette[0]}, ${props.product.palette[1]});`
);

const selectProduct = () => emit("select", props.product.id);
const addProduct = () => emit("add", props.product.id);
</script>

<template>
  <view class="mall-product-card glass-panel" @tap="selectProduct">
    <view class="mall-product-card__cover" :style="coverStyle">
      <text class="mall-product-card__cover-label">
        {{ product.tags[0] || "推荐" }}
      </text>
      <text class="mall-product-card__cover-title">{{ product.title }}</text>
      <text class="mall-product-card__cover-subtitle">{{ product.subtitle }}</text>
    </view>
    <view class="mall-product-card__body">
      <view class="mall-product-card__meta">
        <text class="mall-product-card__title">{{ product.title }}</text>
        <text class="mall-product-card__subtitle">{{ product.subtitle }}</text>
      </view>
      <view class="mall-product-card__tags">
        <text v-for="tag in product.tags" :key="tag" class="mall-product-card__tag">
          {{ tag }}
        </text>
      </view>
      <view class="mall-product-card__footer">
        <view class="mall-product-card__price-group">
          <text class="mall-product-card__price">{{ formatPrice(product.price) }}</text>
          <text class="mall-product-card__market">
            {{ formatPrice(product.marketPrice) }}
          </text>
        </view>
        <view
          class="mall-product-card__action"
          hover-class="is-hovered"
          @tap.stop="addProduct"
        >
          <text>加入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.mall-product-card {
  overflow: hidden;
  border-radius: 28rpx;
}

.mall-product-card__cover {
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8rpx;
  padding: 24rpx;
  color: #fffaf4;
}

.mall-product-card__cover-label {
  align-self: flex-start;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  font-size: 20rpx;
}

.mall-product-card__cover-title {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.15;
}

.mall-product-card__cover-subtitle {
  font-size: 22rpx;
  opacity: 0.9;
}

.mall-product-card__body {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 22rpx;
}

.mall-product-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.mall-product-card__title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.mall-product-card__subtitle {
  font-size: 23rpx;
  color: var(--uni-text-muted);
  line-height: 1.5;
}

.mall-product-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.mall-product-card__tag {
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(22, 107, 90, 0.08);
  color: var(--uni-accent);
  font-size: 20rpx;
}

.mall-product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.mall-product-card__price-group {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.mall-product-card__price {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--uni-primary);
}

.mall-product-card__market {
  font-size: 22rpx;
  color: #9f9387;
  text-decoration: line-through;
}

.mall-product-card__action {
  min-width: 96rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--uni-primary);
  color: #fffaf4;
  font-size: 22rpx;
}
</style>
