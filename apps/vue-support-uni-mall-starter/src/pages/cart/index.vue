<script setup lang="ts">
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { getDefaultAddress } from "@/api/address";
import { clearCart, getCart, removeCartItem, updateCartQuantity } from "@/api/cart";
import { createOrder } from "@/api/order";
import { getProductById } from "@/api/product";
import { createMallBottomNav } from "@/config/navigation";
import { toCartViewSummary, type CartViewSummary } from "@/transform/cart";
import { toMallProduct } from "@/transform/product";
import { ensureSuccess } from "@/utils/api";
import { formatPrice } from "@/utils/price";
import { UniBottomNav, UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const pendingId = ref("");
const checkouting = ref(false);
const clearing = ref(false);
const errorText = ref("");
const summary = ref<CartViewSummary>({
  lines: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  delivery: 0,
  total: 0,
});

const bottomNavItems = computed(() => createMallBottomNav(summary.value.count));
const lines = computed(() => summary.value.lines);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "购物车操作失败";

const refreshCartPage = () => {
  uni.redirectTo({ url: "/pages/cart/index" });
};

const loadCart = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
  }
  errorText.value = "";
  try {
    const cart = ensureSuccess(await getCart(), "获取购物车失败");
    const productIds = [...new Set(cart.lines.map((line) => line.item.productId))];
    const products = await Promise.all(
      productIds.map(async (id) => {
        const response = await getProductById(id);
        return toMallProduct(ensureSuccess(response, "获取商品详情失败"));
      }),
    );
    summary.value = toCartViewSummary(cart, products);
  } catch (error) {
    errorText.value = getErrorMessage(error);
    summary.value = {
      lines: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      delivery: 0,
      total: 0,
    };
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const runAction = async (id: string, handler: () => Promise<unknown>) => {
  if (pendingId.value || clearing.value || checkouting.value) {
    return;
  }
  pendingId.value = id;
  try {
    await handler();
    setTimeout(refreshCartPage, 80);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    pendingId.value = "";
  }
};

const increase = (itemId: string, quantity: number) =>
  runAction(itemId, async () => {
    ensureSuccess(await updateCartQuantity(itemId, quantity + 1), "更新数量失败");
  });

const decrease = (itemId: string, quantity: number) =>
  runAction(itemId, async () => {
    if (quantity <= 1) {
      ensureSuccess(await removeCartItem(itemId), "删除商品失败");
      return;
    }
    ensureSuccess(await updateCartQuantity(itemId, quantity - 1), "更新数量失败");
  });

const removeLine = (itemId: string) =>
  runAction(itemId, async () => {
    ensureSuccess(await removeCartItem(itemId), "删除商品失败");
  });

const resetCart = async () => {
  if (clearing.value || checkouting.value) {
    return;
  }
  clearing.value = true;
  try {
    ensureSuccess(await clearCart(), "清空购物车失败");
    setTimeout(refreshCartPage, 80);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    clearing.value = false;
  }
};

const checkout = async () => {
  if (checkouting.value || !lines.value.length) {
    return;
  }
  checkouting.value = true;
  try {
    const address = ensureSuccess(await getDefaultAddress(), "获取默认地址失败");
    const order = ensureSuccess(
      await createOrder({ addressId: address.id, remark: "mock checkout" }),
      "模拟结算失败",
    );
    uni.showToast({ title: "结算完成，订单已创建", icon: "success" });
    setTimeout(() => {
      uni.navigateTo({ url: `/pages/order/index?highlight=${order.id}` });
    }, 320);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    checkouting.value = false;
  }
};

const goHome = () => uni.reLaunch({ url: "/pages/home/index" });

onShow(() => {
  void loadCart();
});

onPullDownRefresh(() => {
  void loadCart(false);
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset">
    <view class="uni-page-shell__content">
      <view class="cart-hero glass-panel">
        <view>
          <text class="cart-hero__eyebrow">CART SUMMARY</text>
          <text class="cart-hero__title">购物车里的每一项都能走完整 mock 链路</text>
          <text class="cart-hero__desc">
            数量调整、删除、清空和模拟结算都来自统一 API，方便直接做联调回归。
          </text>
        </view>
        <view class="cart-hero__badge">
          <text>{{ summary.count }} 件商品</text>
        </view>
      </view>

      <view class="cart-metrics">
        <view class="cart-metrics__item glass-panel">
          <text class="cart-metrics__value">{{ formatPrice(summary.subtotal) }}</text>
          <text class="cart-metrics__label">商品金额</text>
        </view>
        <view class="cart-metrics__item glass-panel">
          <text class="cart-metrics__value">{{ formatPrice(summary.delivery) }}</text>
          <text class="cart-metrics__label">配送费用</text>
        </view>
        <view class="cart-metrics__item glass-panel">
          <text class="cart-metrics__value">{{ formatPrice(summary.total) }}</text>
          <text class="cart-metrics__label">当前合计</text>
        </view>
      </view>

      <view v-if="loading" class="cart-state">
        <UniLoading text="正在同步购物车..." />
      </view>

      <view v-else-if="errorText && !lines.length" class="cart-state">
        <UniEmptyState
          title="购物车暂时打不开"
          :description="errorText"
          action-text="重新加载"
          @action="loadCart"
        />
      </view>

      <view v-else-if="!lines.length" class="cart-state">
        <UniEmptyState
          title="购物车还是空的"
          description="先去首页或分类页挑几件商品，再回来测试加购和结算。"
          action-text="去首页逛逛"
          @action="goHome"
        />
      </view>

      <template v-else>
        <UniSection
          title="购物车明细"
          :subtitle="`共 ${summary.count} 件商品，可直接做删改和结算回归`"
          action-text="清空"
          @action="resetCart"
        />

        <view class="cart-list">
          <view v-for="line in lines" :key="line.itemId" class="cart-item glass-panel">
            <view
              class="cart-item__thumb"
              :style="`background:linear-gradient(150deg,${line.product.palette[0]},${line.product.palette[1]})`"
            />
            <view class="cart-item__body">
              <text class="cart-item__title">{{ line.product.title }}</text>
              <text class="cart-item__sub">{{ line.product.subtitle }}</text>
              <view class="cart-item__meta">
                <text class="cart-item__price">{{ formatPrice(line.subtotal) }}</text>
                <text class="cart-item__unit">
                  {{ line.quantity }} x {{ formatPrice(line.product.price) }}
                </text>
              </view>
              <view class="cart-item__stepper">
                <view class="cart-item__step" @tap="decrease(line.itemId, line.quantity)">
                  <text>−</text>
                </view>
                <text class="cart-item__qty">{{ line.quantity }}</text>
                <view class="cart-item__step cart-item__step--plus" @tap="increase(line.itemId, line.quantity)">
                  <text>+</text>
                </view>
              </view>
            </view>
            <view class="cart-item__remove" @tap="removeLine(line.itemId)">
              <text>{{ pendingId === line.itemId ? "..." : "移除" }}</text>
            </view>
          </view>
        </view>

        <view class="cart-summary glass-panel">
          <view class="cart-summary__row">
            <text class="cart-summary__key">商品小计</text>
            <text class="cart-summary__value">{{ formatPrice(summary.subtotal) }}</text>
          </view>
          <view class="cart-summary__row">
            <text class="cart-summary__key">优惠抵扣</text>
            <text class="cart-summary__value">{{ formatPrice(summary.discount) }}</text>
          </view>
          <view class="cart-summary__row">
            <text class="cart-summary__key">配送费用</text>
            <text class="cart-summary__value">{{ formatPrice(summary.delivery) }}</text>
          </view>
          <view class="cart-summary__divider" />
          <view class="cart-summary__row cart-summary__row--total">
            <text class="cart-summary__key">合计</text>
            <text class="cart-summary__total">{{ formatPrice(summary.total) }}</text>
          </view>
          <view class="cart-summary__address">
            <text>结算会自动使用默认收货地址，mock 模式下也会生成真实结构的订单数据。</text>
          </view>
          <view class="cart-summary__cta primary-button" @tap="checkout">
            <text>{{ checkouting ? "结算中..." : "模拟结算" }}</text>
          </view>
        </view>
      </template>
    </view>

    <UniBottomNav :items="bottomNavItems" current-key="cart" />
  </view>
</template>

<style scoped lang="scss">
.cart-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx;
  border-radius: 36rpx;
}

.cart-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--uni-text-muted);
}

.cart-hero__title {
  display: block;
  margin-top: 12rpx;
  font-size: 42rpx;
  line-height: 1.2;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.cart-hero__desc {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.cart-hero__badge {
  flex-shrink: 0;
  padding: 14rpx 18rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(201, 108, 45, 0.12);
  color: var(--uni-primary);
  font-size: 22rpx;
  font-weight: 700;
}

.cart-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.cart-metrics__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 22rpx 14rpx;
  border-radius: 28rpx;
}

.cart-metrics__value {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.cart-metrics__label {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.cart-state {
  padding-top: 40rpx;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.cart-item {
  display: flex;
  gap: 18rpx;
  padding: 18rpx;
  border-radius: 32rpx;
}

.cart-item__thumb {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  border-radius: 26rpx;
}

.cart-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cart-item__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.cart-item__sub {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.cart-item__meta {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.cart-item__price {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.cart-item__unit {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.cart-item__stepper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: auto;
}

.cart-item__step {
  width: 54rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(82, 59, 39, 0.08);
  font-size: 28rpx;
  color: var(--uni-text-strong);
}

.cart-item__step--plus {
  background: rgba(201, 108, 45, 0.15);
  color: var(--uni-primary-dark);
}

.cart-item__qty {
  min-width: 36rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
}

.cart-item__remove {
  flex-shrink: 0;
  padding: 8rpx 0 0;
  color: var(--uni-text-muted);
  font-size: 22rpx;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 28rpx;
  border-radius: 36rpx;
}

.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-summary__key {
  font-size: 25rpx;
  color: var(--uni-text-muted);
}

.cart-summary__value {
  font-size: 25rpx;
  color: var(--uni-text-primary);
}

.cart-summary__divider {
  height: 1rpx;
  background: var(--uni-border-color);
}

.cart-summary__row--total .cart-summary__key {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.cart-summary__total {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.cart-summary__address {
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.62);
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.cart-summary__cta {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10rpx;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
