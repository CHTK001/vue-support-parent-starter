<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { addToCart, getCart } from "@/api/cart";
import { getCategoryList } from "@/api/category";
import { IS_MOCK } from "@/api/mock";
import { getFeaturedProducts, getProductPage } from "@/api/product";
import MallProductCard from "@/components/MallProductCard.vue";
import { useCartAnimation } from "@/composables/useCartAnimation";
import { getCategoryPagePath } from "@/config/category";
import { createMallBottomNav } from "@/config/navigation";
import type { MallCategory, MallProduct } from "@/data/catalog";
import { toMallCategoryList } from "@/transform/category";
import { toMallProductList } from "@/transform/product";
import { ensureSuccess } from "@/utils/api";
import { safeRelaunch } from "@/utils/navigation";
import { formatPrice } from "@/utils/price";
import { UniBottomNav, UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const errorText = ref("");
const cartCount = ref(0);
const categories = ref<MallCategory[]>([]);
const featuredProducts = ref<MallProduct[]>([]);
const latestProducts = ref<MallProduct[]>([]);
const activeAddId = ref("");

const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));
const headlineProduct = computed(() => featuredProducts.value[0] ?? latestProducts.value[0] ?? null);
const totalStock = computed(() => featuredProducts.value.reduce((sum, item) => sum + item.stock, 0));
const { flyVisible, flyStyle, pulseKey, animate } = useCartAnimation("[data-nav-key='cart'] .uni-nav__pill");

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "加载失败，请稍后重试";

const syncCartCount = async () => {
  try {
    const summary = ensureSuccess(await getCart(), "获取购物车失败");
    cartCount.value = summary.totalCount;
  } catch {
    cartCount.value = 0;
  }
};

const loadHome = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
  }
  errorText.value = "";
  try {
    const [categoryResponse, featuredResponse, latestResponse] = await Promise.all([
      getCategoryList(),
      getFeaturedProducts(),
      getProductPage({ page: 1, pageSize: 4 }),
      syncCartCount(),
    ]);
    categories.value = toMallCategoryList(ensureSuccess(categoryResponse, "获取分类失败"));
    featuredProducts.value = toMallProductList(
      ensureSuccess(featuredResponse, "获取精选商品失败"),
    );
    latestProducts.value = toMallProductList(
      ensureSuccess(latestResponse, "获取最新商品失败").list,
    );
  } catch (error) {
    errorText.value = getErrorMessage(error);
    uni.showToast({ title: "首页加载失败", icon: "none" });
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const openProduct = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
const openCategory = (id: string) => safeRelaunch(getCategoryPagePath(id));
const goCategory = () => uni.reLaunch({ url: "/pages/category/index" });
const goCart = () => uni.reLaunch({ url: "/pages/cart/index" });

const handleAddToCart = async (id: string, event?: any) => {
  if (activeAddId.value) {
    return;
  }
  activeAddId.value = id;
  try {
    ensureSuccess(await addToCart(id, 1), "加入购物车失败");
    await syncCartCount();
    void animate(event);
    uni.showToast({ title: "已加入购物车", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    activeAddId.value = "";
  }
};

onLoad(() => {
  void loadHome();
});

onShow(() => {
  void syncCartCount();
});

onPullDownRefresh(() => {
  void loadHome(false);
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset">
    <view class="uni-page-shell__content">
      <view class="home-hero">
        <view class="home-hero__mesh home-hero__mesh--warm" />
        <view class="home-hero__mesh home-hero__mesh--cool" />
        <view class="home-hero__top">
          <view class="home-hero__badge">
            <text>{{ IS_MOCK ? "Mock Mode" : "Live Mode" }}</text>
          </view>
          <view class="home-hero__badge home-hero__badge--ghost">
            <text>{{ cartCount }} 件待处理</text>
          </view>
        </view>

        <view class="home-hero__body">
          <text class="home-hero__eyebrow">MOBILE BOUTIQUE</text>
          <text class="home-hero__title">把移动商城做成一间有节奏感的选品店</text>
          <text class="home-hero__sub">
            统一数据流、统一组件气质，首页、分类、详情和购物车都直接走 API/mock，
            你现在看到的是一套可直接用于联调和回归测试的 H5 演示面板。
          </text>
        </view>

        <view v-if="headlineProduct" class="home-hero__feature">
          <view class="home-hero__feature-copy">
            <text class="home-hero__feature-label">本周焦点</text>
            <text class="home-hero__feature-title">{{ headlineProduct.title }}</text>
            <text class="home-hero__feature-sub">{{ headlineProduct.subtitle }}</text>
          </view>
          <view class="home-hero__feature-price">
            <text class="home-hero__feature-value">{{ formatPrice(headlineProduct.price) }}</text>
            <text class="home-hero__feature-market">{{ formatPrice(headlineProduct.marketPrice) }}</text>
          </view>
        </view>

        <view class="home-hero__actions">
          <view class="home-hero__cta primary-button" @tap="goCategory">
            <text>进入选品区</text>
          </view>
          <view class="home-hero__cta home-hero__cta--ghost" @tap="goCart">
            <text>查看购物车</text>
          </view>
        </view>
      </view>

      <view class="home-insight">
        <view class="home-insight__item glass-panel">
          <text class="home-insight__value">{{ categories.length }}</text>
          <text class="home-insight__label">主题分区</text>
        </view>
        <view class="home-insight__item glass-panel">
          <text class="home-insight__value">{{ featuredProducts.length }}</text>
          <text class="home-insight__label">精选单品</text>
        </view>
        <view class="home-insight__item glass-panel">
          <text class="home-insight__value">{{ totalStock }}</text>
          <text class="home-insight__label">可售库存</text>
        </view>
      </view>

      <view v-if="loading" class="home-state">
        <UniLoading text="正在整理首页陈列..." />
      </view>

      <view v-else-if="errorText && !featuredProducts.length" class="home-state">
        <UniEmptyState
          title="首页暂时没有加载出来"
          :description="errorText"
          action-text="重新加载"
          @action="loadHome"
        />
      </view>

      <template v-else>
        <UniSection title="场景分类" subtitle="按使用情境浏览，而不是按冷冰冰的 SKU 列表" />
        <view class="home-cats">
          <view class="home-cats__track">
            <view
              v-for="cat in categories"
              :key="cat.id"
              class="home-cats__item glass-panel"
              :style="`--cat-accent:${cat.accent}`"
              @tap="openCategory(cat.id)"
            >
              <view class="home-cats__icon">
                <view class="home-cats__dot" />
              </view>
              <text class="home-cats__name">{{ cat.label }}</text>
              <text class="home-cats__desc">{{ cat.description }}</text>
              <text class="home-cats__action">进入专区</text>
            </view>
          </view>
        </view>

        <UniSection title="主推好物" subtitle="适合直接拿来做首页转化卡位" />
        <view class="home-grid">
          <MallProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
            @select="openProduct"
            @add="handleAddToCart"
          />
        </view>

        <UniSection title="最近上新" subtitle="同一套 mock 数据也会驱动详情页和购物车" />
        <view class="home-list">
          <view
            v-for="product in latestProducts"
            :key="product.id"
            class="home-list__row glass-panel"
            @tap="openProduct(product.id)"
          >
            <view
              class="home-list__thumb"
              :style="`background:linear-gradient(135deg,${product.palette[0]},${product.palette[1]})`"
            >
              <text class="home-list__thumb-tag">{{ product.tags[0] ?? "新品" }}</text>
            </view>
            <view class="home-list__body">
              <text class="home-list__title">{{ product.title }}</text>
              <text class="home-list__sub">{{ product.subtitle }}</text>
              <view class="home-list__meta">
                <text class="home-list__price">{{ formatPrice(product.price) }}</text>
                <text class="home-list__market">{{ formatPrice(product.marketPrice) }}</text>
              </view>
            </view>
            <view
              class="home-list__add primary-button"
              :class="{ 'is-loading': activeAddId === product.id }"
              @tap.stop="handleAddToCart(product.id, $event)"
            >
              <text>{{ activeAddId === product.id ? "..." : "加入" }}</text>
            </view>
          </view>
        </view>
      </template>

      <view v-if="flyVisible" class="cart-fly-ball" :style="flyStyle">
        <text>+1</text>
      </view>
    </view>

    <UniBottomNav :items="bottomNavItems" :pulse-key="pulseKey" current-key="home" />
  </view>
</template>

<style scoped lang="scss">
.home-hero {
  position: relative;
  overflow: hidden;
  padding: 34rpx;
  border-radius: 44rpx;
  background:
    linear-gradient(145deg, rgba(30, 18, 12, 0.96), rgba(76, 40, 18, 0.92)),
    linear-gradient(160deg, #352114, #70411f);
  box-shadow: 0 24rpx 80rpx rgba(54, 31, 14, 0.26);
}

.home-hero__mesh {
  position: absolute;
  border-radius: 50%;
  filter: blur(12rpx);
  pointer-events: none;
}

.home-hero__mesh--warm {
  top: -80rpx;
  right: -36rpx;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(255, 177, 97, 0.45), transparent 72%);
}

.home-hero__mesh--cool {
  bottom: -100rpx;
  left: -60rpx;
  width: 360rpx;
  height: 360rpx;
  background: radial-gradient(circle, rgba(75, 155, 133, 0.38), transparent 74%);
}

.home-hero__top,
.home-hero__body,
.home-hero__feature,
.home-hero__actions {
  position: relative;
  z-index: 1;
}

.home-hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.home-hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
  color: rgba(255, 247, 240, 0.9);
  letter-spacing: 1.5rpx;
}

.home-hero__badge--ghost {
  background: rgba(255, 255, 255, 0.08);
}

.home-hero__body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 36rpx;
}

.home-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 5rpx;
  color: rgba(255, 237, 220, 0.62);
}

.home-hero__title {
  font-size: 52rpx;
  line-height: 1.14;
  font-weight: 800;
  color: #fffaf4;
}

.home-hero__sub {
  font-size: 25rpx;
  line-height: 1.8;
  color: rgba(255, 244, 235, 0.72);
}

.home-hero__feature {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 22rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

.home-hero__feature-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.home-hero__feature-label {
  font-size: 20rpx;
  color: rgba(255, 238, 223, 0.7);
}

.home-hero__feature-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #fffaf4;
}

.home-hero__feature-sub {
  font-size: 22rpx;
  color: rgba(255, 242, 231, 0.68);
}

.home-hero__feature-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.home-hero__feature-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffd9ab;
}

.home-hero__feature-market {
  font-size: 20rpx;
  color: rgba(255, 240, 225, 0.45);
  text-decoration: line-through;
}

.home-hero__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.home-hero__cta {
  height: 82rpx;
  padding: 0 34rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 27rpx;
  font-weight: 700;
}

.home-hero__cta--ghost {
  color: #fff7ef;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.14);
  border-radius: var(--uni-radius-full);
}

.home-insight {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.home-insight__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 18rpx;
  border-radius: 30rpx;
}

.home-insight__value {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.home-insight__label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.home-state {
  padding-top: 32rpx;
}

.home-cats {
  overflow-x: auto;
  white-space: nowrap;
}

.home-cats__track {
  display: inline-flex;
  gap: 16rpx;
  padding-bottom: 6rpx;
}

.home-cats__item {
  width: 284rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.55);
}

.home-cats__icon {
  width: 58rpx;
  height: 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.62);
}

.home-cats__dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--cat-accent, var(--uni-primary));
}

.home-cats__name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.home-cats__desc {
  min-height: 74rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--uni-text-secondary);
  white-space: normal;
}

.home-cats__action {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--cat-accent, var(--uni-primary));
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.home-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.home-list__row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 16rpx;
  border-radius: 30rpx;
}

.home-list__thumb {
  width: 118rpx;
  height: 118rpx;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  padding: 12rpx;
  border-radius: 26rpx;
}

.home-list__thumb-tag {
  padding: 6rpx 12rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.22);
  color: #fffaf4;
  font-size: 18rpx;
}

.home-list__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.home-list__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.home-list__sub {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.home-list__meta {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-top: 6rpx;
}

.home-list__price {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.home-list__market {
  font-size: 20rpx;
  color: var(--uni-text-placeholder);
  text-decoration: line-through;
}

.home-list__add {
  width: 96rpx;
  height: 66rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.home-list__add.is-loading {
  opacity: 0.72;
}

.cart-fly-ball {
  position: fixed;
  z-index: 90;
  width: 54rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--uni-primary), var(--uni-highlight));
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 28rpx rgba(201, 108, 45, 0.28);
  pointer-events: none;
  transition:
    left 620ms cubic-bezier(0.2, 0.8, 0.2, 1),
    top 620ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 620ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 620ms ease;
}
</style>
