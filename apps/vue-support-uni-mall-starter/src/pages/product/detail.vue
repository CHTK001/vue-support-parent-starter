<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { addToCart, getCart } from "@/api/cart";
import { getProductById, getProductPage } from "@/api/product";
import { useCartAnimation } from "@/composables/useCartAnimation";
import type { MallProduct } from "@/data/catalog";
import { toMallProduct, toMallProductList } from "@/transform/product";
import { ensureSuccess } from "@/utils/api";
import { formatPrice } from "@/utils/price";
import { UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const errorText = ref("");
const quantity = ref(1);
const cartCount = ref(0);
const product = ref<MallProduct | null>(null);
const recommendedProducts = ref<MallProduct[]>([]);
const { flyVisible, flyStyle, animate } = useCartAnimation(".detail-hero__icon--cart");

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "商品加载失败";

const savings = computed(() =>
  product.value ? Math.max(0, product.value.marketPrice - product.value.price) : 0,
);

const syncCartCount = async () => {
  try {
    const summary = ensureSuccess(await getCart(), "获取购物车失败");
    cartCount.value = summary.totalCount;
  } catch {
    cartCount.value = 0;
  }
};

const loadProduct = async (id?: string) => {
  if (!id) {
    loading.value = false;
    errorText.value = "缺少商品编号";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = toMallProduct(ensureSuccess(await getProductById(id), "获取商品详情失败"));
    product.value = detail;
    const relatedResponse = await getProductPage({
      categoryId: detail.categoryId,
      page: 1,
      pageSize: 4,
    });
    recommendedProducts.value = toMallProductList(
      ensureSuccess(relatedResponse, "获取推荐商品失败").list,
    ).filter((item) => item.id !== detail.id);
    quantity.value = 1;
    await syncCartCount();
  } catch (error) {
    product.value = null;
    recommendedProducts.value = [];
    errorText.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const changeQuantity = (delta: number) => {
  if (!product.value) {
    return;
  }
  quantity.value = Math.max(1, Math.min(product.value.stock, quantity.value + delta));
};

const handleAddToCart = async (event?: any) => {
  if (!product.value) {
    return;
  }
  try {
    ensureSuccess(await addToCart(product.value.id, quantity.value), "加入购物车失败");
    await syncCartCount();
    void animate(event);
    uni.showToast({ title: `已加入购物车 x${quantity.value}`, icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  }
};

const goCart = () => uni.reLaunch({ url: "/pages/cart/index" });
const goHome = () => uni.reLaunch({ url: "/pages/home/index" });
const openProduct = (id: string) => uni.redirectTo({ url: `/pages/product/detail?id=${id}` });
const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
    return;
  }
  goHome();
};

onLoad((options) => {
  const id = typeof options?.id === "string" ? options.id : undefined;
  void loadProduct(id);
});

onShow(() => {
  void syncCartCount();
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset is-condensed">
    <view class="uni-page-shell__content">
      <view v-if="loading" class="detail-state">
        <UniLoading text="正在载入商品详情..." />
      </view>

      <view v-else-if="product" class="detail">
        <view
          class="detail-hero"
          :style="`background:linear-gradient(150deg,${product.palette[0]} 0%,${product.palette[1]} 100%)`"
        >
          <view class="detail-hero__toolbar">
            <view class="detail-hero__icon" @tap="goBack">
              <text>‹</text>
            </view>
            <view class="detail-hero__icon detail-hero__icon--cart" @tap="goCart">
              <text>车</text>
              <view v-if="cartCount" class="detail-hero__cart-badge">
                <text>{{ cartCount }}</text>
              </view>
            </view>
          </view>

          <view class="detail-hero__tags">
            <text v-for="tag in product.tags" :key="tag" class="detail-hero__tag">{{ tag }}</text>
          </view>

          <view class="detail-hero__copy">
            <text class="detail-hero__title">{{ product.title }}</text>
            <text class="detail-hero__sub">{{ product.subtitle }}</text>
            <text class="detail-hero__desc">{{ product.description }}</text>
          </view>
        </view>

        <view class="detail-price glass-panel">
          <view>
            <text class="detail-price__label">到手价</text>
            <view class="detail-price__row">
              <text class="detail-price__value">{{ formatPrice(product.price) }}</text>
              <text class="detail-price__market">{{ formatPrice(product.marketPrice) }}</text>
            </view>
          </view>
          <view class="detail-price__stock">
            <text class="detail-price__stock-value">{{ product.stock }}</text>
            <text class="detail-price__stock-label">库存可下单</text>
          </view>
        </view>

        <view class="detail-summary">
          <view class="detail-summary__item glass-panel">
            <text class="detail-summary__value">{{ product.highlights.length }}</text>
            <text class="detail-summary__label">核心卖点</text>
          </view>
          <view class="detail-summary__item glass-panel">
            <text class="detail-summary__value">{{ formatPrice(savings) }}</text>
            <text class="detail-summary__label">单件立省</text>
          </view>
          <view class="detail-summary__item glass-panel">
            <text class="detail-summary__value">{{ quantity }}</text>
            <text class="detail-summary__label">当前数量</text>
          </view>
        </view>

        <UniSection title="商品亮点" subtitle="适合作为详情页上方的信息强化区域" />
        <view class="detail-highlights">
          <view v-for="item in product.highlights" :key="item" class="detail-highlights__item glass-panel">
            <view class="detail-highlights__dot" />
            <text class="detail-highlights__text">{{ item }}</text>
          </view>
        </view>

        <UniSection title="规格参数" subtitle="当前展示的是 mock 和真实接口共用的数据结构" />
        <view class="detail-specs glass-panel">
          <view
            v-for="(spec, index) in product.specs"
            :key="spec.name"
            class="detail-specs__row"
            :class="{ 'is-last': index === product.specs.length - 1 }"
          >
            <text class="detail-specs__key">{{ spec.name }}</text>
            <text class="detail-specs__value">{{ spec.value }}</text>
          </view>
        </view>

        <UniSection
          v-if="recommendedProducts.length"
          title="同类推荐"
          subtitle="点击卡片会直接切到新的详情页"
        />
        <view v-if="recommendedProducts.length" class="detail-related">
          <view
            v-for="item in recommendedProducts.slice(0, 2)"
            :key="item.id"
            class="detail-related__card glass-panel"
            @tap="openProduct(item.id)"
          >
            <view
              class="detail-related__cover"
              :style="`background:linear-gradient(135deg,${item.palette[0]},${item.palette[1]})`"
            />
            <text class="detail-related__title">{{ item.title }}</text>
            <text class="detail-related__price">{{ formatPrice(item.price) }}</text>
          </view>
        </view>

        <view class="uni-sticky-action-bar">
          <view class="detail-bar">
            <view class="detail-bar__price">
              <text class="detail-bar__price-main">{{ formatPrice(product.price) }}</text>
              <text class="detail-bar__price-sub">已省 {{ formatPrice(savings) }}</text>
            </view>
            <view class="detail-bar__stepper">
              <view class="detail-bar__step" @tap="changeQuantity(-1)">
                <text>−</text>
              </view>
              <text class="detail-bar__step-value">{{ quantity }}</text>
              <view class="detail-bar__step detail-bar__step--plus" @tap="changeQuantity(1)">
                <text>+</text>
              </view>
            </view>
            <view class="detail-bar__cta primary-button" @tap="handleAddToCart($event)">
              <text>加入购物车</text>
            </view>
          </view>
        </view>

        <view v-if="flyVisible" class="cart-fly-ball" :style="flyStyle">
          <text>+{{ quantity }}</text>
        </view>
      </view>

      <view v-else class="detail-state">
        <UniEmptyState
          title="没有找到这件商品"
          :description="errorText || '可能已经下架，或者编号不存在。'"
          action-text="返回首页"
          @action="goHome"
        />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail-state {
  padding-top: 120rpx;
}

.detail-hero {
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  border-radius: 44rpx;
  min-height: 520rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 24rpx 80rpx rgba(31, 21, 15, 0.22);
}

.detail-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.24));
}

.detail-hero__toolbar,
.detail-hero__tags,
.detail-hero__copy {
  position: relative;
  z-index: 1;
}

.detail-hero__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-hero__icon {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 34rpx;
  position: relative;
}

.detail-hero__cart-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--uni-radius-full);
  background: #fff;
  color: var(--uni-primary-dark);
  font-size: 18rpx;
  font-weight: 800;
}

.detail-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: auto;
}

.detail-hero__tag {
  padding: 8rpx 18rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 248, 243, 0.94);
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
}

.detail-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 18rpx;
}

.detail-hero__title {
  font-size: 52rpx;
  line-height: 1.16;
  font-weight: 800;
  color: #fffaf4;
}

.detail-hero__sub {
  font-size: 26rpx;
  color: rgba(255, 244, 234, 0.84);
}

.detail-hero__desc {
  font-size: 24rpx;
  line-height: 1.8;
  color: rgba(255, 245, 238, 0.72);
}

.detail-price {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  padding: 26rpx 28rpx;
  border-radius: 32rpx;
}

.detail-price__label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.detail-price__row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 8rpx;
}

.detail-price__value {
  font-size: 48rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.detail-price__market {
  font-size: 22rpx;
  color: var(--uni-text-placeholder);
  text-decoration: line-through;
}

.detail-price__stock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.detail-price__stock-value {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--uni-accent);
}

.detail-price__stock-label {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.detail-summary__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 22rpx 14rpx;
  border-radius: 28rpx;
}

.detail-summary__value {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.detail-summary__label {
  font-size: 21rpx;
  color: var(--uni-text-muted);
  text-align: center;
}

.detail-highlights {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.detail-highlights__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 14rpx;
  border-radius: 30rpx;
  text-align: center;
}

.detail-highlights__dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--uni-primary), var(--uni-accent));
}

.detail-highlights__text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--uni-text-secondary);
}

.detail-specs {
  border-radius: 32rpx;
  overflow: hidden;
}

.detail-specs__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--uni-border-color);
}

.detail-specs__row.is-last {
  border-bottom: none;
}

.detail-specs__key {
  font-size: 24rpx;
  color: var(--uni-text-muted);
}

.detail-specs__value {
  flex: 1;
  text-align: right;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.detail-related {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.detail-related__card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 16rpx;
  border-radius: 30rpx;
}

.detail-related__cover {
  height: 180rpx;
  border-radius: 24rpx;
}

.detail-related__title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.detail-related__price {
  font-size: 24rpx;
  color: var(--uni-primary);
  font-weight: 800;
}

.detail-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.detail-bar__price {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.detail-bar__price-main {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.detail-bar__price-sub {
  font-size: 20rpx;
  color: var(--uni-text-muted);
}

.detail-bar__stepper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-left: auto;
  padding: 8rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.62);
}

.detail-bar__step {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(76, 52, 32, 0.08);
  color: var(--uni-text-strong);
  font-size: 28rpx;
}

.detail-bar__step--plus {
  background: rgba(201, 108, 45, 0.18);
  color: var(--uni-primary-dark);
}

.detail-bar__step-value {
  min-width: 34rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.detail-bar__cta {
  height: 76rpx;
  padding: 0 28rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
}

.cart-fly-ball {
  position: fixed;
  z-index: 90;
  width: 60rpx;
  height: 60rpx;
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
