<script setup lang="ts">
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { getCart } from "@/api/cart";
import { getOrderPage } from "@/api/order";
import { getUserInfo } from "@/api/user";
import { createMallBottomNav } from "@/config/navigation";
import { toOrderViewList } from "@/transform/order";
import { toUserView } from "@/transform/user";
import { ensureSuccess } from "@/utils/api";
import { formatPrice } from "@/utils/price";
import { UniBottomNav, UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const errorText = ref("");
const cartCount = ref(0);
const cartTotal = ref(0);
const user = ref<ReturnType<typeof toUserView> | null>(null);
const recentOrders = ref<ReturnType<typeof toOrderViewList>>([]);

const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));
const orderStats = computed(() => [
  {
    key: "pending_shipment",
    label: "待发货",
    value: recentOrders.value.filter((item) => item.statusLabel === "待发货").length,
  },
  {
    key: "pending_receipt",
    label: "待收货",
    value: recentOrders.value.filter((item) => item.statusLabel === "待收货").length,
  },
  {
    key: "completed",
    label: "已完成",
    value: recentOrders.value.filter((item) => item.statusLabel === "已完成").length,
  },
  {
    key: "all",
    label: "总订单",
    value: recentOrders.value.length,
  },
]);

const menus = [
  { icon: "订", label: "订单中心", sub: "查看订单流转与状态", action: () => openOrders() },
  { icon: "址", label: "收货地址", sub: "管理默认地址和收件信息", action: () => openAddress() },
  { icon: "客", label: "客户支持", sub: "热线、微信、邮箱和 FAQ", action: () => openSupport() },
];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "个人中心加载失败";

const openOrders = (status: string = "all", highlight = "") => {
  const query = [`status=${status}`];
  if (highlight) {
    query.push(`highlight=${highlight}`);
  }
  uni.navigateTo({ url: `/pages/order/index?${query.join("&")}` });
};

const openAddress = () => uni.navigateTo({ url: "/pages/address/index" });
const openSupport = () => uni.navigateTo({ url: "/pages/support/index" });
const goCart = () => uni.reLaunch({ url: "/pages/cart/index" });

const loadProfile = async () => {
  loading.value = true;
  errorText.value = "";
  try {
    const [userResponse, cartResponse, orderResponse] = await Promise.all([
      getUserInfo(),
      getCart(),
      getOrderPage({ page: 1, pageSize: 3 }),
    ]);
    user.value = toUserView(ensureSuccess(userResponse, "获取用户信息失败"));
    const cartSummary = ensureSuccess(cartResponse, "获取购物车失败");
    cartCount.value = cartSummary.totalCount;
    cartTotal.value = cartSummary.total;
    recentOrders.value = toOrderViewList(ensureSuccess(orderResponse, "获取订单失败").list);
  } catch (error) {
    errorText.value = getErrorMessage(error);
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

onShow(() => {
  void loadProfile();
});

onPullDownRefresh(() => {
  void loadProfile();
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset">
    <view class="uni-page-shell__content">
      <view v-if="loading" class="profile-state">
        <UniLoading text="正在载入个人中心..." />
      </view>

      <view v-else-if="errorText && !user" class="profile-state">
        <UniEmptyState
          title="个人中心暂时不可用"
          :description="errorText"
          action-text="重新加载"
          @action="loadProfile"
        />
      </view>

      <template v-else-if="user">
        <view class="profile-hero">
          <view class="profile-hero__avatar">
            <text>{{ user.nickname.slice(0, 1) }}</text>
          </view>
          <view class="profile-hero__content">
            <text class="profile-hero__name">{{ user.nickname }}</text>
            <text class="profile-hero__desc">{{ user.phone }} · {{ user.genderLabel }}</text>
            <view class="profile-hero__meta">
              <text class="profile-hero__chip">LV.{{ user.level }}</text>
              <text class="profile-hero__chip">{{ user.points }} 积分</text>
            </view>
          </view>
          <view class="profile-hero__action accent-button" @tap="openSupport">
            <text>联系支持</text>
          </view>
        </view>

        <view class="profile-wallet">
          <view class="profile-wallet__item glass-panel" @tap="goCart">
            <text class="profile-wallet__value">{{ cartCount }}</text>
            <text class="profile-wallet__label">购物车</text>
          </view>
          <view class="profile-wallet__item glass-panel" @tap="openOrders()">
            <text class="profile-wallet__value">{{ recentOrders.length }}</text>
            <text class="profile-wallet__label">近期开单</text>
          </view>
          <view class="profile-wallet__item glass-panel" @tap="goCart">
            <text class="profile-wallet__value">{{ formatPrice(cartTotal) }}</text>
            <text class="profile-wallet__label">待结算</text>
          </view>
        </view>

        <UniSection title="订单状态" subtitle="这里展示的是 mock 订单页返回的聚合结果" />
        <view class="profile-orders">
          <view
            v-for="item in orderStats"
            :key="item.key"
            class="profile-orders__item glass-panel"
            @tap="openOrders(item.key)"
          >
            <text class="profile-orders__value">{{ item.value }}</text>
            <text class="profile-orders__label">{{ item.label }}</text>
          </view>
        </view>

        <UniSection title="近期订单" subtitle="用来验证个人中心和订单数据的联动展示" />
        <view class="profile-history glass-panel">
          <view
            v-for="(order, index) in recentOrders"
            :key="order.id"
            class="profile-history__item"
            :class="{ 'is-last': index === recentOrders.length - 1 }"
            @tap="openOrders('all', order.id)"
          >
            <view class="profile-history__main">
              <text class="profile-history__title">{{ order.orderNo }}</text>
              <text class="profile-history__sub">{{ order.items[0]?.title ?? "暂无商品" }}</text>
            </view>
            <view class="profile-history__meta">
              <text class="profile-history__status">{{ order.statusLabel }}</text>
              <text class="profile-history__amount">{{ formatPrice(order.total) }}</text>
            </view>
          </view>
        </view>

        <UniSection title="常用入口" subtitle="全部是可落地的页面入口，不再挂空链路" />
        <view class="profile-menu glass-panel">
          <view
            v-for="(item, index) in menus"
            :key="item.label"
            class="profile-menu__item"
            :class="{ 'is-last': index === menus.length - 1 }"
            @tap="item.action()"
          >
            <view class="profile-menu__icon">
              <text>{{ item.icon }}</text>
            </view>
            <view class="profile-menu__content">
              <text class="profile-menu__label">{{ item.label }}</text>
              <text class="profile-menu__sub">{{ item.sub }}</text>
            </view>
            <text class="profile-menu__arrow">›</text>
          </view>
        </view>
      </template>
    </view>

    <UniBottomNav :items="bottomNavItems" current-key="profile" />
  </view>
</template>

<style scoped lang="scss">
.profile-state {
  padding-top: 120rpx;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx;
  border-radius: 40rpx;
  background:
    linear-gradient(145deg, rgba(40, 26, 16, 0.96), rgba(90, 54, 28, 0.92)),
    linear-gradient(160deg, #3d2515, #714422);
  box-shadow: 0 24rpx 84rpx rgba(44, 27, 16, 0.24);
}

.profile-hero__avatar {
  width: 104rpx;
  height: 104rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 34rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
  color: #fffaf4;
  font-size: 34rpx;
  font-weight: 800;
}

.profile-hero__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-hero__name {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff9f1;
}

.profile-hero__desc {
  font-size: 22rpx;
  color: rgba(255, 241, 229, 0.72);
}

.profile-hero__meta {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.profile-hero__chip {
  padding: 8rpx 14rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 245, 236, 0.92);
  font-size: 20rpx;
}

.profile-hero__action {
  flex-shrink: 0;
  height: 64rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  font-size: 22rpx;
  font-weight: 700;
}

.profile-wallet {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.profile-wallet__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 10rpx;
  border-radius: 30rpx;
}

.profile-wallet__value {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.profile-wallet__label {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.profile-orders {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.profile-orders__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 22rpx 8rpx;
  border-radius: 28rpx;
}

.profile-orders__value {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--uni-primary);
}

.profile-orders__label {
  font-size: 20rpx;
  color: var(--uni-text-muted);
}

.profile-history {
  border-radius: 34rpx;
  overflow: hidden;
}

.profile-history__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx 26rpx;
  border-bottom: 1rpx solid var(--uni-border-color);
}

.profile-history__item.is-last {
  border-bottom: none;
}

.profile-history__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.profile-history__title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.profile-history__sub {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.profile-history__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.profile-history__status {
  font-size: 22rpx;
  color: var(--uni-accent);
  font-weight: 700;
}

.profile-history__amount {
  font-size: 24rpx;
  color: var(--uni-text-strong);
  font-weight: 800;
}

.profile-menu {
  border-radius: 34rpx;
  overflow: hidden;
}

.profile-menu__item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 26rpx;
  border-bottom: 1rpx solid var(--uni-border-color);
}

.profile-menu__item.is-last {
  border-bottom: none;
}

.profile-menu__icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: rgba(201, 108, 45, 0.1);
  color: var(--uni-primary);
  font-size: 24rpx;
  font-weight: 800;
}

.profile-menu__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.profile-menu__label {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.profile-menu__sub {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.profile-menu__arrow {
  font-size: 34rpx;
  color: var(--uni-text-muted);
}
</style>
