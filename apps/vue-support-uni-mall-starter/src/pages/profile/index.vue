<script setup lang="ts">
import { UniBottomNav, UniPageShell, UniSection } from "@layout/uni";
import { createMallBottomNav } from "@/config/navigation";
import { formatPrice, getCartCount, getCartSummary } from "@/data/catalog";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";

const cartCount = ref(0);
const cartTotal = ref(0);

const syncProfileMetrics = () => {
  cartCount.value = getCartCount();
  cartTotal.value = getCartSummary().total;
};

const bottomNavItems = computed(() => createMallBottomNav(cartCount.value));

const notReady = () => {
  uni.showToast({
    title: "演示版先保留静态入口",
    icon: "none"
  });
};

syncProfileMetrics();
onShow(syncProfileMetrics);
</script>

<template>
  <UniPageShell :with-bottom-inset="true">
    <view class="profile-card glass-panel">
      <view class="profile-card__avatar">
        <text>UI</text>
      </view>
      <view class="profile-card__main">
        <text class="profile-card__title">移动商城演示账户</text>
        <text class="profile-card__subtitle">
          这里先验证个人中心页的卡片排版和常见入口布局。
        </text>
      </view>
    </view>

    <view class="profile-metrics">
      <view class="profile-metrics__item glass-panel">
        <text class="profile-metrics__value">{{ cartCount }}</text>
        <text class="profile-metrics__label">购物袋数量</text>
      </view>
      <view class="profile-metrics__item glass-panel">
        <text class="profile-metrics__value">{{ formatPrice(cartTotal) }}</text>
        <text class="profile-metrics__label">待结算金额</text>
      </view>
    </view>

    <UniSection
      title="常用入口"
      subtitle="保留移动商城常见模块，先占位为静态入口，后续可继续扩展。"
    />

    <view class="profile-actions">
      <view class="profile-actions__item glass-panel" @tap="notReady">
        <text class="profile-actions__name">收货地址</text>
        <text class="profile-actions__desc">维护常用地址与偏好信息</text>
      </view>
      <view class="profile-actions__item glass-panel" @tap="notReady">
        <text class="profile-actions__name">订单记录</text>
        <text class="profile-actions__desc">查看最近提交的购物清单</text>
      </view>
      <view class="profile-actions__item glass-panel" @tap="notReady">
        <text class="profile-actions__name">通知中心</text>
        <text class="profile-actions__desc">接入发货提醒与活动消息</text>
      </view>
      <view class="profile-actions__item glass-panel" @tap="notReady">
        <text class="profile-actions__name">客服支持</text>
        <text class="profile-actions__desc">后续可扩展会话或工单入口</text>
      </view>
    </view>

    <template #footer>
      <UniBottomNav :items="bottomNavItems" current-key="profile" />
    </template>
  </UniPageShell>
</template>

<style scoped lang="scss">
.profile-card {
  display: grid;
  grid-template-columns: 104rpx 1fr;
  gap: 18rpx;
  align-items: center;
  padding: 24rpx;
  border-radius: 32rpx;
}

.profile-card__avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 28rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c96c2d, #166b5a);
  color: #fff9f3;
  font-size: 34rpx;
  font-weight: 700;
}

.profile-card__main {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.profile-card__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.profile-card__subtitle {
  font-size: 23rpx;
  line-height: 1.7;
  color: var(--uni-text-muted);
}

.profile-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.profile-metrics__item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 28rpx;
}

.profile-metrics__value {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.profile-metrics__label {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.profile-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.profile-actions__item {
  min-height: 180rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 28rpx;
}

.profile-actions__name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--uni-text-strong);
}

.profile-actions__desc {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--uni-text-muted);
}
</style>
