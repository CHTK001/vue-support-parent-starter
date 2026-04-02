<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { cancelOrder, confirmReceipt, getOrderPage } from "@/api/order";
import { createMallBottomNav } from "@/config/navigation";
import { toOrderViewList, orderStatusMap, type OrderView } from "@/transform/order";
import { ensureSuccess } from "@/utils/api";
import { formatPrice } from "@/utils/price";
import { UniBottomNav, UniEmptyState, UniLoading, UniSection } from "@layout/uni";

type OrderFilter = "all" | keyof typeof orderStatusMap;

const loading = ref(true);
const processingId = ref("");
const currentStatus = ref<OrderFilter>("all");
const highlightId = ref("");
const orders = ref<OrderView[]>([]);
const cartCount = ref(0);
const errorText = ref("");

const tabs: Array<{ key: OrderFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "pending_payment", label: "待付款" },
  { key: "pending_shipment", label: "待发货" },
  { key: "pending_receipt", label: "待收货" },
  { key: "completed", label: "已完成" },
];

const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));
const hasOrders = computed(() => orders.value.length > 0);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "订单加载失败";

const loadOrders = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
  }
  errorText.value = "";
  try {
    const response = await getOrderPage({
      status: currentStatus.value,
      page: 1,
      pageSize: 20,
    });
    orders.value = toOrderViewList(ensureSuccess(response, "获取订单失败").list);
  } catch (error) {
    errorText.value = getErrorMessage(error);
    orders.value = [];
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const switchStatus = (status: OrderFilter) => {
  const query = [`status=${status}`];
  if (highlightId.value) {
    query.push(`highlight=${highlightId.value}`);
  }
  uni.redirectTo({ url: `/pages/order/index?${query.join("&")}` });
};

const goCart = () => {
  uni.reLaunch({ url: "/pages/cart/index" });
};

const refreshOrderPage = () => {
  const query = [`status=${currentStatus.value}`];
  if (highlightId.value) {
    query.push(`highlight=${highlightId.value}`);
  }
  uni.redirectTo({ url: `/pages/order/index?${query.join("&")}` });
};

const runAction = async (id: string, action: () => Promise<unknown>) => {
  if (processingId.value) {
    return;
  }
  processingId.value = id;
  try {
    await action();
    setTimeout(refreshOrderPage, 80);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    processingId.value = "";
  }
};

const cancelCurrentOrder = (id: string) =>
  runAction(id, async () => {
    ensureSuccess(await cancelOrder(id), "取消订单失败");
    uni.showToast({ title: "订单已取消", icon: "success" });
  });

const confirmCurrentOrder = (id: string) =>
  runAction(id, async () => {
    ensureSuccess(await confirmReceipt(id), "确认收货失败");
    uni.showToast({ title: "已确认收货", icon: "success" });
  });

onLoad((options) => {
  currentStatus.value =
    typeof options?.status === "string" ? (options.status as OrderFilter) : "all";
  highlightId.value = typeof options?.highlight === "string" ? options.highlight : "";
  void loadOrders();
});

onShow(() => {
  void loadOrders(false);
});

onPullDownRefresh(() => {
  void loadOrders(false);
});
</script>

<template>
  <view class="uni-page-shell has-bottom-inset">
    <view class="uni-page-shell__content">
      <view class="order-hero glass-panel">
        <view>
          <text class="order-hero__eyebrow">ORDER CENTER</text>
          <text class="order-hero__title">这里承接 mock 结算后的订单结果</text>
          <text class="order-hero__desc">
            订单列表、状态筛选、取消和确认收货都走 API，同一套结构后续可直接对接 live。
          </text>
        </view>
        <view class="order-hero__badge">
          <text>{{ orders.length }} 笔订单</text>
        </view>
      </view>

      <view class="order-tabs">
        <view class="order-tabs__track">
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="order-tabs__item"
            :class="{ 'is-active': tab.key === currentStatus }"
            @tap="switchStatus(tab.key)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
      </view>

      <UniSection
        title="订单列表"
        :subtitle="currentStatus === 'all' ? '展示全部订单' : `当前筛选：${tabs.find((tab) => tab.key === currentStatus)?.label}`"
      />

      <view v-if="loading" class="order-state">
        <UniLoading text="正在同步订单..." />
      </view>

      <view v-else-if="errorText && !hasOrders" class="order-state">
        <UniEmptyState
          title="订单中心暂时不可用"
          :description="errorText"
          action-text="重新加载"
          @action="loadOrders"
        />
      </view>

      <view v-else-if="!hasOrders" class="order-state">
        <UniEmptyState
          title="当前筛选下没有订单"
          description="你可以切换其他状态，或者先去购物车做一次 mock 结算。"
          action-text="去购物车"
          @action="goCart"
        />
      </view>

      <view v-else class="order-list">
        <view
          v-for="order in orders"
          :key="order.id"
          class="order-card glass-panel"
          :class="{ 'is-highlight': highlightId === order.id }"
        >
          <view class="order-card__header">
            <view class="order-card__meta">
              <text class="order-card__no">{{ order.orderNo }}</text>
              <text class="order-card__time">{{ order.createdAt.slice(0, 10) }}</text>
            </view>
            <text class="order-card__status" :style="`color:${order.statusColor}`">
              {{ order.statusLabel }}
            </text>
          </view>

          <view v-for="item in order.items" :key="`${order.id}-${item.productId}`" class="order-card__line">
            <view class="order-card__thumb" />
            <view class="order-card__body">
              <text class="order-card__title">{{ item.title }}</text>
              <text class="order-card__sub">x{{ item.quantity }}</text>
            </view>
            <text class="order-card__price">{{ formatPrice(item.subtotal) }}</text>
          </view>

          <view class="order-card__footer">
            <text class="order-card__address">{{ order.address }}</text>
            <text class="order-card__total">合计 {{ formatPrice(order.total) }}</text>
          </view>

          <view class="order-card__actions">
            <view
              v-if="order.statusLabel === '待付款'"
              class="order-card__btn order-card__btn--ghost"
              @tap="cancelCurrentOrder(order.id)"
            >
              <text>{{ processingId === order.id ? "处理中..." : "取消订单" }}</text>
            </view>
            <view
              v-if="order.statusLabel === '待收货'"
              class="order-card__btn primary-button"
              @tap="confirmCurrentOrder(order.id)"
            >
              <text>{{ processingId === order.id ? "处理中..." : "确认收货" }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <UniBottomNav :items="bottomNavItems" current-key="profile" />
  </view>
</template>

<style scoped lang="scss">
.order-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx;
  border-radius: 36rpx;
}

.order-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--uni-text-muted);
}

.order-hero__title {
  display: block;
  margin-top: 12rpx;
  font-size: 42rpx;
  line-height: 1.2;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.order-hero__desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.order-hero__badge {
  flex-shrink: 0;
  padding: 14rpx 18rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(22, 107, 90, 0.12);
  color: var(--uni-accent);
  font-size: 22rpx;
  font-weight: 700;
}

.order-tabs {
  overflow-x: auto;
  white-space: nowrap;
}

.order-tabs__track {
  display: inline-flex;
  gap: 12rpx;
}

.order-tabs__item {
  height: 70rpx;
  padding: 0 28rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--uni-radius-full);
  background: rgba(255, 255, 255, 0.64);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-text-secondary);
  font-size: 24rpx;
}

.order-tabs__item.is-active {
  background: linear-gradient(135deg, var(--uni-primary), var(--uni-primary-light));
  color: #fffaf4;
  border-color: transparent;
}

.order-state {
  padding-top: 40rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 26rpx;
  border-radius: 34rpx;
}

.order-card.is-highlight {
  border: 2rpx solid rgba(201, 108, 45, 0.3);
}

.order-card__header,
.order-card__footer,
.order-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.order-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.order-card__no {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.order-card__time {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.order-card__status {
  font-size: 24rpx;
  font-weight: 700;
}

.order-card__line {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.order-card__thumb {
  width: 84rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, rgba(201, 108, 45, 0.2), rgba(22, 107, 90, 0.18));
}

.order-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.order-card__title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.order-card__sub,
.order-card__address {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.order-card__price,
.order-card__total {
  font-size: 24rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.order-card__actions {
  justify-content: flex-end;
}

.order-card__btn {
  min-width: 164rpx;
  height: 68rpx;
  padding: 0 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--uni-radius-full);
  font-size: 24rpx;
  font-weight: 700;
}

.order-card__btn--ghost {
  background: rgba(255, 255, 255, 0.68);
  border: 1rpx solid var(--uni-border-color);
  color: var(--uni-text-secondary);
}
</style>
