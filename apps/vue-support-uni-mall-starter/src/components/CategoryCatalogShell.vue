<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { addToCart, getCart } from "@/api/cart";
import { getCategoryList } from "@/api/category";
import { getProductPage } from "@/api/product";
import MallProductCard from "@/components/MallProductCard.vue";
import { useCartAnimation } from "@/composables/useCartAnimation";
import { getCategoryPagePath } from "@/config/category";
import { createMallBottomNav } from "@/config/navigation";
import type { MallCategory, MallProduct } from "@/data/catalog";
import { toMallCategoryList } from "@/transform/category";
import { toMallProductList } from "@/transform/product";
import { ensureSuccess } from "@/utils/api";
import { safeRelaunch } from "@/utils/navigation";
import { UniBottomNav, UniEmptyState } from "@layout/uni";

const props = withDefaults(
  defineProps<{
    initialCategoryId?: string;
  }>(),
  {
    initialCategoryId: "kitchen",
  },
);

const loading = ref(true);
const cartCount = ref(0);
const errorText = ref("");
const categories = ref<MallCategory[]>([]);
const products = ref<MallProduct[]>([]);
const selectedId = ref(props.initialCategoryId);

const currentCat = computed(
  () => categories.value.find((item) => item.id === selectedId.value) ?? categories.value[0] ?? null,
);
const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));
const totalStock = computed(() => products.value.reduce((sum, item) => sum + item.stock, 0));
const sectionTitle = computed(() => currentCat.value?.label ?? "分类商品");
const sectionSubtitle = computed(() =>
  currentCat.value ? `共 ${products.value.length} 件，支持直接加购` : "请先选择分类",
);
const showErrorState = computed(() => Boolean(errorText.value) && !products.value.length);
const showEmptyState = computed(() => !loading.value && !errorText.value && !products.value.length);
const { flyVisible, flyStyle, pulseKey, animate } = useCartAnimation("[data-nav-key='cart'] .uni-nav__pill");

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "分类加载失败";

const syncCartCount = async () => {
  try {
    const summary = ensureSuccess(await getCart(), "获取购物车失败");
    cartCount.value = summary.totalCount;
  } catch {
    cartCount.value = 0;
  }
};

const loadProducts = async () => {
  if (!selectedId.value) {
    products.value = [];
    return;
  }
  errorText.value = "";
  try {
    const response = await getProductPage({
      categoryId: selectedId.value,
      page: 1,
      pageSize: 50,
    });
    products.value = toMallProductList(ensureSuccess(response, "获取商品失败").list);
  } catch (error) {
    errorText.value = getErrorMessage(error);
    uni.showToast({ title: "商品加载失败", icon: "none" });
  }
};

const initialize = async () => {
  loading.value = true;
  errorText.value = "";
  try {
    const response = await getCategoryList();
    categories.value = toMallCategoryList(ensureSuccess(response, "获取分类失败"));
    selectedId.value =
      categories.value.find((item) => item.id === props.initialCategoryId)?.id
      ?? categories.value[0]?.id
      ?? "";
    await loadProducts();
    loading.value = false;
    await syncCartCount();
  } catch (error) {
    errorText.value = getErrorMessage(error);
    uni.showToast({ title: "分类页加载失败", icon: "none" });
  } finally {
    if (loading.value) {
      loading.value = false;
    }
    uni.stopPullDownRefresh();
  }
};

const selectCat = (id: string) => {
  if (selectedId.value === id) {
    return;
  }
  safeRelaunch(getCategoryPagePath(id));
};

const openProduct = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
const goHome = () => uni.reLaunch({ url: "/pages/home/index" });

const handleAddToCart = async (id: string, event?: any) => {
  try {
    ensureSuccess(await addToCart(id, 1), "加入购物车失败");
    await syncCartCount();
    void animate(event);
    uni.showToast({ title: "已加入购物车", icon: "success" });
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  }
};

onMounted(() => {
  void initialize();
});

onShow(() => {
  void syncCartCount();
});

onPullDownRefresh(() => {
  void initialize();
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset">
    <view class="uni-page-shell__content">
      <view class="category-hero" :style="`--cat-accent:${currentCat?.accent ?? '#c96c2d'}`">
        <view class="category-hero__content">
          <text class="category-hero__eyebrow">CURATED ZONES</text>
          <text class="category-hero__title">{{ currentCat?.label ?? "分类浏览" }}</text>
          <text class="category-hero__desc">
            {{ currentCat?.description ?? "根据使用场景挑选商品，每个分区都保持独立气质。" }}
          </text>
        </view>
        <view class="category-hero__stats">
          <view class="category-hero__stat">
            <text class="category-hero__stat-value">{{ products.length }}</text>
            <text class="category-hero__stat-label">当前商品</text>
          </view>
          <view class="category-hero__stat">
            <text class="category-hero__stat-value">{{ totalStock }}</text>
            <text class="category-hero__stat-label">剩余库存</text>
          </view>
        </view>
      </view>

      <view class="category-tabs">
        <view class="category-tabs__track">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="category-tabs__item"
            :class="{ 'is-active': cat.id === selectedId }"
            :style="cat.id === selectedId ? `--tab-accent:${cat.accent}` : ''"
            @tap="selectCat(cat.id)"
          >
            <text>{{ cat.label }}</text>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="category-section__title-row">
          <view class="category-section__mark" />
          <text class="category-section__title">{{ sectionTitle }}</text>
        </view>
        <text class="category-section__subtitle">{{ sectionSubtitle }}</text>
      </view>

      <view v-if="showErrorState" class="category-state">
        <UniEmptyState
          title="分类内容暂时不可用"
          :description="errorText"
          action-text="重新加载"
          @action="initialize"
        />
      </view>

      <view v-else-if="showEmptyState" class="category-state">
        <UniEmptyState
          title="这个分区还没有商品"
          description="可以切换其他分类，或者稍后再回来看看。"
          action-text="返回首页"
          @action="goHome"
        />
      </view>

      <view v-else class="category-grid">
        <MallProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @select="openProduct"
          @add="handleAddToCart"
        />
      </view>

      <view v-if="flyVisible" class="cart-fly-ball" :style="flyStyle">
        <text>+1</text>
      </view>
    </view>

    <UniBottomNav :items="bottomNavItems" :pulse-key="pulseKey" current-key="category" />
  </view>
</template>

<style scoped lang="scss">
.category-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 30rpx;
  border-radius: 40rpx;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(255, 249, 243, 0.72)),
    linear-gradient(160deg, #f7efe6, #f5ede2);
  border: 1rpx solid rgba(255, 255, 255, 0.76);
  box-shadow: var(--uni-shadow-soft);
}

.category-hero::after {
  content: "";
  position: absolute;
  right: -90rpx;
  top: -80rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--cat-accent) 26%, white), transparent 68%);
  opacity: 0.9;
}

.category-hero__content,
.category-hero__stats {
  position: relative;
  z-index: 1;
}

.category-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--uni-text-muted);
}

.category-hero__title {
  margin-top: 10rpx;
  font-size: 48rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.category-hero__desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.75;
  color: var(--uni-text-secondary);
}

.category-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.category-hero__stat {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.68);
}

.category-hero__stat-value {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--cat-accent);
}

.category-hero__stat-label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.category-tabs {
  overflow-x: auto;
  white-space: nowrap;
}

.category-tabs__track {
  display: inline-flex;
  gap: 12rpx;
  padding-bottom: 6rpx;
}

.category-tabs__item {
  height: 72rpx;
  padding: 0 28rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.62);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-text-secondary);
  font-size: 25rpx;
  transition: transform 160ms ease;
}

.category-tabs__item.is-active {
  color: #fffaf4;
  background: linear-gradient(135deg, var(--tab-accent, var(--uni-primary)), color-mix(in srgb, var(--tab-accent, var(--uni-primary)) 70%, white));
  border-color: transparent;
  box-shadow: 0 14rpx 36rpx rgba(36, 22, 12, 0.14);
}

.category-state {
  padding-top: 36rpx;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.category-section__title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-section__mark {
  width: 12rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, var(--uni-primary), var(--uni-accent));
}

.category-section__title {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.category-section__subtitle {
  font-size: 24rpx;
  color: var(--uni-text-muted);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
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
