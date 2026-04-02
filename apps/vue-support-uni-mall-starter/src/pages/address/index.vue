<script setup lang="ts">
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { getAddressList, setDefaultAddress } from "@/api/address";
import type { AddressEntity } from "@/entity/order";
import { ensureSuccess } from "@/utils/api";
import { UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const pendingId = ref("");
const errorText = ref("");
const addresses = ref<AddressEntity[]>([]);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "地址加载失败";

const refreshAddressPage = () => {
  uni.redirectTo({ url: "/pages/address/index" });
};

const loadAddresses = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
  }
  errorText.value = "";
  try {
    addresses.value = ensureSuccess(await getAddressList(), "获取地址失败");
  } catch (error) {
    errorText.value = getErrorMessage(error);
    addresses.value = [];
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const applyDefault = async (id: string) => {
  if (pendingId.value) {
    return;
  }
  pendingId.value = id;
  try {
    ensureSuccess(await setDefaultAddress(id), "设置默认地址失败");
    uni.showToast({ title: "默认地址已更新", icon: "success" });
    setTimeout(refreshAddressPage, 80);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error), icon: "none" });
  } finally {
    pendingId.value = "";
  }
};

onShow(() => {
  void loadAddresses();
});

onPullDownRefresh(() => {
  void loadAddresses(false);
});
</script>

<template>
  <view class="uni-page-shell">
    <view class="uni-page-shell__content">
      <view class="address-hero glass-panel">
        <text class="address-hero__eyebrow">ADDRESS BOOK</text>
        <text class="address-hero__title">收货地址现在也是完整页面</text>
        <text class="address-hero__desc">
          列表、默认地址切换和购物车结算使用的是同一批 API 数据，不再是页面硬编码。
        </text>
      </view>

      <UniSection title="地址列表" subtitle="默认地址会被购物车结算自动读取" />

      <view v-if="loading" class="address-state">
        <UniLoading text="正在同步地址..." />
      </view>

      <view v-else-if="errorText && !addresses.length" class="address-state">
        <UniEmptyState
          title="地址列表暂时不可用"
          :description="errorText"
          action-text="重新加载"
          @action="loadAddresses"
        />
      </view>

      <view v-else class="address-list">
        <view v-for="item in addresses" :key="item.id" class="address-card glass-panel">
          <view class="address-card__header">
            <view class="address-card__person">
              <text class="address-card__name">{{ item.name }}</text>
              <text class="address-card__phone">{{ item.phone }}</text>
            </view>
            <view v-if="item.isDefault" class="address-card__badge">
              <text>默认</text>
            </view>
          </view>
          <text class="address-card__detail">
            {{ item.province }}{{ item.city }}{{ item.district }}{{ item.detail }}
          </text>
          <view class="address-card__footer">
            <text class="address-card__hint">结算时默认读取这条地址</text>
            <view
              class="address-card__action"
              :class="{ 'is-disabled': item.isDefault }"
              @tap="!item.isDefault && applyDefault(item.id)"
            >
              <text>{{ item.isDefault ? "已是默认" : pendingId === item.id ? "处理中..." : "设为默认" }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.address-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 28rpx;
  border-radius: 36rpx;
}

.address-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--uni-text-muted);
}

.address-hero__title {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.address-hero__desc {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.address-state {
  padding-top: 40rpx;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.address-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 26rpx;
  border-radius: 34rpx;
}

.address-card__header,
.address-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.address-card__person {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.address-card__name {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.address-card__phone,
.address-card__hint {
  font-size: 22rpx;
  color: var(--uni-text-muted);
}

.address-card__badge {
  padding: 10rpx 16rpx;
  border-radius: var(--uni-radius-full);
  background: rgba(22, 107, 90, 0.12);
  color: var(--uni-accent);
  font-size: 22rpx;
  font-weight: 700;
}

.address-card__detail {
  font-size: 24rpx;
  line-height: 1.8;
  color: var(--uni-text-primary);
}

.address-card__action {
  min-width: 152rpx;
  height: 64rpx;
  padding: 0 22rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--uni-radius-full);
  background: linear-gradient(135deg, var(--uni-primary), var(--uni-primary-light));
  color: #fffaf4;
  font-size: 22rpx;
  font-weight: 700;
}

.address-card__action.is-disabled {
  background: rgba(255, 255, 255, 0.62);
  color: var(--uni-text-muted);
}
</style>
