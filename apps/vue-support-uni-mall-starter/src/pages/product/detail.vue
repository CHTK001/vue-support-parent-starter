<script setup lang="ts">
import {
  UniEmptyState,
  UniPageShell,
  UniSection,
  UniStickyActionBar
} from "@layout/uni";
import {
  addCartItem,
  formatPrice,
  getProductById,
  type MallProduct
} from "@/data/catalog";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const product = ref<MallProduct | null>(null);

const addCurrentToCart = () => {
  if (!product.value) {
    return;
  }
  addCartItem(product.value.id, 1);
  uni.showToast({
    title: "已加入购物袋",
    icon: "success"
  });
};

const openCart = () => {
  uni.reLaunch({ url: "/pages/cart/index" });
};

const goBackHome = () => {
  uni.reLaunch({ url: "/pages/home/index" });
};

onLoad((options) => {
  if (typeof options?.id === "string") {
    product.value = getProductById(options.id);
  }
});
</script>

<template>
  <UniPageShell :with-bottom-inset="true" :condensed="true">
    <view v-if="product" class="detail-page">
      <view
        class="detail-hero glass-panel"
        :style="`background: linear-gradient(135deg, ${product.palette[0]}, ${product.palette[1]});`"
      >
        <text class="detail-hero__badge">{{ product.tags[0] || "精选" }}</text>
        <text class="detail-hero__title">{{ product.title }}</text>
        <text class="detail-hero__subtitle">{{ product.subtitle }}</text>
      </view>

      <view class="detail-price glass-panel">
        <view class="detail-price__main">
          <text class="detail-price__value">{{ formatPrice(product.price) }}</text>
          <text class="detail-price__market">
            {{ formatPrice(product.marketPrice) }}
          </text>
        </view>
        <text class="detail-price__stock">库存 {{ product.stock }} 件</text>
      </view>

      <UniSection
        title="商品亮点"
        subtitle="先用标签和说明块验证详情页的信息展开方式。"
      />

      <view class="detail-highlights">
        <view
          v-for="highlight in product.highlights"
          :key="highlight"
          class="detail-highlights__item glass-panel"
        >
          <text>{{ highlight }}</text>
        </view>
      </view>

      <UniSection title="详细说明" subtitle="用更接近真实商品页的结构把核心信息铺开。" />

      <view class="detail-description glass-panel">
        <text class="detail-description__text">{{ product.description }}</text>
      </view>

      <UniSection title="规格参数" subtitle="基础规格放成可读性更强的双列结构。" />

      <view class="detail-specs glass-panel">
        <view v-for="spec in product.specs" :key="spec.name" class="detail-specs__row">
          <text class="detail-specs__label">{{ spec.name }}</text>
          <text class="detail-specs__value">{{ spec.value }}</text>
        </view>
      </view>

      <UniStickyActionBar>
        <view class="detail-action-bar">
          <view class="detail-action-bar__meta">
            <text class="detail-action-bar__label">到手价</text>
            <text class="detail-action-bar__price">{{ formatPrice(product.price) }}</text>
          </view>
          <view class="detail-action-bar__buttons">
            <view class="detail-action-bar__secondary secondary-button" @tap="openCart">
              <text>购物袋</text>
            </view>
            <view class="detail-action-bar__primary primary-button" @tap="addCurrentToCart">
              <text>加入购物袋</text>
            </view>
          </view>
        </view>
      </UniStickyActionBar>
    </view>

    <view v-else class="detail-empty">
      <UniEmptyState
        title="没有找到对应商品"
        description="当前传入的商品标识不存在，先回到首页重新选择一件商品。"
        action-text="返回首页"
        @action="goBackHome"
      />
    </view>
  </UniPageShell>
</template>

<style scoped lang="scss">
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail-hero {
  min-height: 340rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12rpx;
  padding: 28rpx;
  border-radius: 36rpx;
  color: #fffaf4;
}

.detail-hero__badge {
  align-self: flex-start;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  font-size: 20rpx;
}

.detail-hero__title {
  font-size: 46rpx;
  font-weight: 700;
  line-height: 1.16;
}

.detail-hero__subtitle {
  font-size: 24rpx;
  opacity: 0.92;
}

.detail-price {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 30rpx;
}

.detail-price__main {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.detail-price__value {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--uni-primary);
}

.detail-price__market {
  font-size: 24rpx;
  color: #9f9387;
  text-decoration: line-through;
}

.detail-price__stock {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.detail-highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.detail-highlights__item {
  min-height: 104rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--uni-text-primary);
  font-size: 22rpx;
}

.detail-description,
.detail-specs {
  padding: 24rpx;
  border-radius: 28rpx;
}

.detail-description__text {
  font-size: 24rpx;
  line-height: 1.9;
  color: var(--uni-text-primary);
}

.detail-specs {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.detail-specs__row {
  display: grid;
  grid-template-columns: 160rpx 1fr;
  gap: 18rpx;
  padding-bottom: 14rpx;
  border-bottom: 1rpx solid rgba(64, 54, 46, 0.06);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
}

.detail-specs__label {
  font-size: 23rpx;
  color: var(--uni-text-muted);
}

.detail-specs__value {
  font-size: 23rpx;
  color: var(--uni-text-strong);
}

.detail-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.detail-action-bar__meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.detail-action-bar__label {
  font-size: 20rpx;
  color: var(--uni-text-muted);
}

.detail-action-bar__price {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-primary);
}

.detail-action-bar__buttons {
  display: flex;
  gap: 12rpx;
}

.detail-action-bar__primary,
.detail-action-bar__secondary {
  min-width: 140rpx;
  min-height: 68rpx;
  padding: 0 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
}

.detail-empty {
  padding-top: 120rpx;
}
</style>
