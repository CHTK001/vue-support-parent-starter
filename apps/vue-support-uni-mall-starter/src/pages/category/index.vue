<script setup lang="ts">
import { UniBottomNav, UniPageShell, UniSection } from "@layout/uni";
import MallProductCard from "@/components/MallProductCard.vue";
import { createMallBottomNav } from "@/config/navigation";
import {
  addCartItem,
  getCartCount,
  getProductsByCategory,
  mallCategories
} from "@/data/catalog";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";

const selectedCategoryId = ref(mallCategories[0].id);
const cartCount = ref(0);

const syncCartCount = () => {
  cartCount.value = getCartCount();
};

const currentCategory = computed(
  () =>
    mallCategories.find((item) => item.id === selectedCategoryId.value) ??
    mallCategories[0]
);

const products = computed(() => getProductsByCategory(selectedCategoryId.value));
const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));

const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
};

const openProduct = (productId: string) => {
  uni.navigateTo({
    url: `/pages/product/detail?id=${productId}`
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

onLoad((options) => {
  if (typeof options?.categoryId === "string") {
    const matched = mallCategories.find((item) => item.id === options.categoryId);
    if (matched) {
      selectedCategoryId.value = matched.id;
    }
  }
});

syncCartCount();
onShow(syncCartCount);
</script>

<template>
  <UniPageShell :with-bottom-inset="true">
    <view class="category-summary glass-panel">
      <text class="category-summary__eyebrow">CATEGORY</text>
      <text class="category-summary__title">{{ currentCategory.label }}</text>
      <text class="category-summary__desc">{{ currentCategory.description }}</text>
    </view>

    <UniSection
      title="分类切换"
      subtitle="通过轻量标签切换商品集合，先验证 uni-app 页面间参数和局部状态。"
    />

    <scroll-view class="category-tabs" scroll-x="true" show-scrollbar="false">
      <view class="category-tabs__track">
        <view
          v-for="category in mallCategories"
          :key="category.id"
          class="category-tabs__item"
          :class="{ 'is-active': category.id === selectedCategoryId }"
          @tap="selectCategory(category.id)"
        >
          <text>{{ category.label }}</text>
        </view>
      </view>
    </scroll-view>

    <UniSection
      title="分类商品"
      :subtitle="`当前共 ${products.length} 件商品，先验证列表滚动与商品卡片复用。`"
    />

    <view class="category-grid">
      <MallProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @select="openProduct"
        @add="addToCart"
      />
    </view>

    <template #footer>
      <UniBottomNav :items="bottomNavItems" current-key="category" />
    </template>
  </UniPageShell>
</template>

<style scoped lang="scss">
.category-summary {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 28rpx;
  border-radius: 32rpx;
}

.category-summary__eyebrow {
  font-size: 20rpx;
  letter-spacing: 2rpx;
  color: var(--uni-accent);
}

.category-summary__title {
  font-size: 42rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.category-summary__desc {
  font-size: 24rpx;
  line-height: 1.75;
  color: var(--uni-text-muted);
}

.category-tabs {
  width: 100%;
  white-space: nowrap;
}

.category-tabs__track {
  display: inline-flex;
  gap: 14rpx;
  padding-right: 24rpx;
}

.category-tabs__item {
  min-height: 64rpx;
  padding: 0 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-text-muted);
  font-size: 24rpx;

  &.is-active {
    background: rgba(201, 108, 45, 0.14);
    border-color: rgba(201, 108, 45, 0.2);
    color: var(--uni-primary);
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}
</style>
