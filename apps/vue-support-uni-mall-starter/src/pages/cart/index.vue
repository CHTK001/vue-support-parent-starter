<script setup lang="ts">
import {
  UniBottomNav,
  UniEmptyState,
  UniPageShell,
  UniSection
} from "@layout/uni";
import { createMallBottomNav } from "@/config/navigation";
import {
  changeCartQuantity,
  clearCart,
  formatPrice,
  getCartCount,
  getCartLines,
  getCartSummary,
  removeCartItem
} from "@/data/catalog";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";

const cartLines = ref(getCartLines());
const summary = ref(getCartSummary());

const refreshCart = () => {
  cartLines.value = getCartLines();
  summary.value = getCartSummary();
};

const bottomNavItems = computed(() => createMallBottomNav(getCartCount()));

const increase = (productId: string) => {
  changeCartQuantity(productId, 1);
  refreshCart();
};

const decrease = (productId: string) => {
  changeCartQuantity(productId, -1);
  refreshCart();
};

const removeLine = (productId: string) => {
  removeCartItem(productId);
  refreshCart();
};

const resetCart = () => {
  clearCart();
  refreshCart();
};

const goHome = () => {
  uni.reLaunch({ url: "/pages/home/index" });
};

const checkout = () => {
  uni.showToast({
    title: "演示版暂未接入结算",
    icon: "none"
  });
};

refreshCart();
onShow(refreshCart);
</script>

<template>
  <UniPageShell :with-bottom-inset="true">
    <view v-if="cartLines.length === 0" class="cart-empty">
      <UniEmptyState
        title="购物袋还是空的"
        description="先从首页或分类页挑几件商品加入，这里会自动读取本地购物袋数据。"
        action-text="去首页看看"
        @action="goHome"
      />
    </view>

    <template v-else>
      <UniSection
        title="购物袋"
        :subtitle="`当前共 ${summary.count} 件商品，结算前可直接调整数量。`"
        action-text="清空"
        @action="resetCart"
      />

      <view class="cart-list">
        <view
          v-for="line in cartLines"
          :key="line.product.id"
          class="cart-list__item glass-panel"
        >
          <view
            class="cart-list__cover"
            :style="`background: linear-gradient(135deg, ${line.product.palette[0]}, ${line.product.palette[1]});`"
          />
          <view class="cart-list__content">
            <text class="cart-list__title">{{ line.product.title }}</text>
            <text class="cart-list__subtitle">{{ line.product.subtitle }}</text>
            <text class="cart-list__price">{{ formatPrice(line.subtotal) }}</text>
            <view class="cart-list__controls">
              <view
                class="cart-list__stepper secondary-button"
                @tap="decrease(line.product.id)"
              >
                <text>-</text>
              </view>
              <text class="cart-list__quantity">{{ line.quantity }}</text>
              <view
                class="cart-list__stepper primary-button"
                @tap="increase(line.product.id)"
              >
                <text>+</text>
              </view>
            </view>
          </view>
          <view class="cart-list__remove" @tap="removeLine(line.product.id)">
            <text>删除</text>
          </view>
        </view>
      </view>

      <view class="cart-summary glass-panel">
        <text class="cart-summary__title">结算摘要</text>
        <view class="cart-summary__row">
          <text>商品金额</text>
          <text>{{ formatPrice(summary.subtotal) }}</text>
        </view>
        <view class="cart-summary__row">
          <text>配送费用</text>
          <text>{{ formatPrice(summary.delivery) }}</text>
        </view>
        <view class="cart-summary__row is-total">
          <text>合计</text>
          <text>{{ formatPrice(summary.total) }}</text>
        </view>
        <view class="cart-summary__cta primary-button" @tap="checkout">
          <text>去结算</text>
        </view>
      </view>
    </template>

    <template #footer>
      <UniBottomNav :items="bottomNavItems" current-key="cart" />
    </template>
  </UniPageShell>
</template>

<style scoped lang="scss">
.cart-empty {
  padding-top: 120rpx;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.cart-list__item {
  display: grid;
  grid-template-columns: 120rpx 1fr auto;
  gap: 16rpx;
  align-items: center;
  padding: 18rpx;
  border-radius: 28rpx;
}

.cart-list__cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 22rpx;
}

.cart-list__content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cart-list__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.cart-list__subtitle {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.cart-list__price {
  font-size: 28rpx;
  color: var(--uni-primary);
  font-weight: 700;
}

.cart-list__controls {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
}

.cart-list__stepper {
  width: 56rpx;
  height: 56rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.cart-list__quantity {
  min-width: 40rpx;
  text-align: center;
  font-size: 24rpx;
}

.cart-list__remove {
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  color: #a45b4f;
  background: rgba(164, 91, 79, 0.1);
  font-size: 22rpx;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 32rpx;
}

.cart-summary__title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: var(--uni-text-primary);

  &.is-total {
    font-size: 30rpx;
    font-weight: 700;
    color: var(--uni-text-strong);
  }
}

.cart-summary__cta {
  margin-top: 8rpx;
  min-height: 72rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
</style>
