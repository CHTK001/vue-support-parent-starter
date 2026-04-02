<script setup lang="ts">
import { computed } from "vue";
import type { MallProduct } from "@/data/catalog";
import { formatPrice } from "@/utils/price";

const props = defineProps<{ product: MallProduct }>();
const emit = defineEmits<{
  select: [id: string];
  add: [id: string, event?: any];
}>();

const coverStyle = computed(
  () => `background:linear-gradient(150deg,${props.product.palette[0]},${props.product.palette[1]})`,
);
const savings = computed(() => Math.max(0, props.product.marketPrice - props.product.price));
</script>

<template>
  <view class="product-card glass-panel" @tap="emit('select', product.id)">
    <view class="product-card__cover" :style="coverStyle">
      <view class="product-card__header">
        <text class="product-card__tag">{{ product.tags[0] ?? "推荐" }}</text>
        <text v-if="product.featured" class="product-card__tag product-card__tag--hot">精选</text>
      </view>
      <view class="product-card__cover-copy">
        <text class="product-card__title">{{ product.title }}</text>
        <text class="product-card__subtitle">{{ product.subtitle }}</text>
      </view>
    </view>

    <view class="product-card__body">
      <view class="product-card__meta">
        <text class="product-card__desc">{{ product.description }}</text>
        <view class="product-card__pills">
          <text v-for="tag in product.tags.slice(0, 2)" :key="tag" class="product-card__pill">
            {{ tag }}
          </text>
        </view>
      </view>

      <view class="product-card__footer">
        <view class="product-card__price-group">
          <text class="product-card__price">{{ formatPrice(product.price) }}</text>
          <text class="product-card__market">{{ formatPrice(product.marketPrice) }}</text>
          <text class="product-card__save">省 {{ formatPrice(savings) }}</text>
        </view>
        <view class="product-card__cta primary-button" @tap.stop="emit('add', product.id, $event)">
          <text>加购</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 34rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.65);
}

.product-card__cover {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 248rpx;
  padding: 20rpx;
  position: relative;
}

.product-card__cover::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.24));
}

.product-card__header,
.product-card__cover-copy {
  position: relative;
  z-index: 1;
}

.product-card__header {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.product-card__tag {
  padding: 6rpx 14rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 250, 244, 0.92);
  font-size: 19rpx;
}

.product-card__tag--hot {
  background: rgba(42, 148, 120, 0.32);
}

.product-card__cover-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.product-card__title {
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.2;
  color: #fffaf4;
}

.product-card__subtitle {
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(255, 244, 234, 0.84);
}

.product-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18rpx;
  padding: 20rpx;
}

.product-card__meta {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.product-card__desc {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.product-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.product-card__pill {
  padding: 6rpx 12rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(22, 107, 90, 0.1);
  color: var(--uni-accent);
  font-size: 19rpx;
}

.product-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: auto;
}

.product-card__price-group {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.product-card__price {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.product-card__market {
  font-size: 19rpx;
  color: var(--uni-text-placeholder);
  text-decoration: line-through;
}

.product-card__save {
  font-size: 19rpx;
  color: var(--uni-accent);
}

.product-card__cta {
  height: 62rpx;
  padding: 0 22rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}
</style>
