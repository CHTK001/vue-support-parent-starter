<script setup lang="ts">
import { UniBottomNav, UniPageShell, UniSection } from "@layout/uni";
import MallProductCard from "@/components/MallProductCard.vue";
import { createMallBottomNav } from "@/config/navigation";
import {
  addCartItem,
  getCartCount,
  getFeaturedProducts,
  mallCategories,
  mallProducts
} from "@/data/catalog";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";

const cartCount = ref(0);
const featuredProducts = getFeaturedProducts();
const latestProducts = mallProducts.slice(0, 4);

const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));

const syncCartCount = () => {
  cartCount.value = getCartCount();
};

const openProduct = (productId: string) => {
  uni.navigateTo({
    url: `/pages/product/detail?id=${productId}`
  });
};

const openCategory = (categoryId: string) => {
  uni.reLaunch({
    url: `/pages/category/index?categoryId=${categoryId}`
  });
};

const addToCart = (productId: string) => {
  addCartItem(productId, 1);
  syncCartCount();
  uni.showToast({
    title: "已加入购物袋",
    icon: "success"
  });
};

const goCategory = () => {
  uni.reLaunch({ url: "/pages/category/index" });
};

syncCartCount();
onShow(syncCartCount);
</script>

<template>
  <UniPageShell :with-bottom-inset="true">
    <template #hero>
      <view class="home-hero glass-panel">
        <view class="home-hero__eyebrow">
          <text>UNI MALL FRAME</text>
        </view>
        <view class="home-hero__main">
          <text class="home-hero__title">为移动端准备的一套轻量商城底板</text>
          <text class="home-hero__subtitle">
            这里先完成商品列表、分类浏览、详情页和购物袋，用来验证 layout/uni 的页面骨架与交互节奏。
          </text>
        </view>
        <view class="home-hero__actions">
          <view class="home-hero__primary primary-button" @tap="goCategory">
            <text>立即浏览</text>
          </view>
          <view class="home-hero__secondary secondary-button">
            <text>{{ cartCount }} 件待结算</text>
          </view>
        </view>
      </view>
    </template>

    <view class="home-metrics">
      <view class="home-metrics__item glass-panel">
        <text class="home-metrics__value">24H</text>
        <text class="home-metrics__label">发货准备</text>
      </view>
      <view class="home-metrics__item glass-panel">
        <text class="home-metrics__value">7</text>
        <text class="home-metrics__label">天无忧退换</text>
      </view>
      <view class="home-metrics__item glass-panel">
        <text class="home-metrics__value">99%</text>
        <text class="home-metrics__label">页面可复用</text>
      </view>
    </view>

    <UniSection
      title="人气分类"
      subtitle="先用几组轻量分类验证移动端信息密度和跳转链路。"
      action-text="查看全部"
      @action="goCategory"
    />

    <scroll-view class="home-categories" scroll-x="true" show-scrollbar="false">
      <view class="home-categories__track">
        <view
          v-for="category in mallCategories"
          :key="category.id"
          class="home-categories__card glass-panel"
          @tap="openCategory(category.id)"
        >
          <text class="home-categories__name">{{ category.label }}</text>
          <text class="home-categories__desc">{{ category.description }}</text>
          <text class="home-categories__link">进入分类</text>
        </view>
      </view>
    </scroll-view>

    <UniSection
      title="精选商品"
      subtitle="突出展示 4 个产品卡片，验证首页首屏信息的表达方式。"
    />

    <view class="home-product-grid">
      <MallProductCard
        v-for="product in featuredProducts"
        :key="product.id"
        :product="product"
        @select="openProduct"
        @add="addToCart"
      />
    </view>

    <UniSection
      title="最新上架"
      subtitle="用另一组商品列表测试卡片复用和列表滚动体验。"
    />

    <view class="home-latest-list">
      <view
        v-for="product in latestProducts"
        :key="product.id"
        class="home-latest-list__item glass-panel"
        @tap="openProduct(product.id)"
      >
        <view
          class="home-latest-list__cover"
          :style="`background: linear-gradient(135deg, ${product.palette[0]}, ${product.palette[1]});`"
        />
        <view class="home-latest-list__content">
          <text class="home-latest-list__title">{{ product.title }}</text>
          <text class="home-latest-list__subtitle">{{ product.subtitle }}</text>
        </view>
        <view class="home-latest-list__cta" @tap.stop="addToCart(product.id)">
          <text>加入</text>
        </view>
      </view>
    </view>

    <template #footer>
      <UniBottomNav :items="bottomNavItems" current-key="home" />
    </template>
  </UniPageShell>
</template>

<style scoped lang="scss">
.home-hero {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 28rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at top right, rgba(201, 108, 45, 0.24), transparent 32%),
    linear-gradient(145deg, rgba(255, 252, 248, 0.94), rgba(255, 245, 232, 0.92));
}

.home-hero__eyebrow {
  display: inline-flex;
  align-self: flex-start;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(22, 107, 90, 0.1);
  color: var(--uni-accent);
  font-size: 20rpx;
  letter-spacing: 2rpx;
}

.home-hero__main {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.home-hero__title {
  font-size: 46rpx;
  font-weight: 700;
  line-height: 1.18;
  color: var(--uni-text-strong);
}

.home-hero__subtitle {
  font-size: 25rpx;
  line-height: 1.8;
  color: var(--uni-text-muted);
}

.home-hero__actions {
  display: flex;
  gap: 14rpx;
}

.home-hero__primary,
.home-hero__secondary {
  min-height: 72rpx;
  padding: 0 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.home-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.home-metrics__item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: 24rpx;
}

.home-metrics__value {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.home-metrics__label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.home-categories {
  width: 100%;
  white-space: nowrap;
}

.home-categories__track {
  display: inline-flex;
  gap: 16rpx;
  padding-right: 20rpx;
}

.home-categories__card {
  width: 300rpx;
  min-height: 180rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.home-categories__name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.home-categories__desc {
  font-size: 23rpx;
  line-height: 1.7;
  color: var(--uni-text-muted);
}

.home-categories__link {
  margin-top: auto;
  font-size: 22rpx;
  color: var(--uni-primary);
}

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.home-latest-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.home-latest-list__item {
  display: grid;
  grid-template-columns: 120rpx 1fr auto;
  gap: 16rpx;
  align-items: center;
  padding: 18rpx;
  border-radius: 26rpx;
}

.home-latest-list__cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
}

.home-latest-list__content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.home-latest-list__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.home-latest-list__subtitle {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.home-latest-list__cta {
  min-width: 92rpx;
  height: 60rpx;
  padding: 0 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(201, 108, 45, 0.12);
  color: var(--uni-primary);
  font-size: 22rpx;
}
</style>
