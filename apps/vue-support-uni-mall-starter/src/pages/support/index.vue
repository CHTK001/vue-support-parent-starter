<script setup lang="ts">
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { getSupportCenter } from "@/api/support";
import type { SupportCenterEntity } from "@/entity/support";
import { ensureSuccess } from "@/utils/api";
import { UniEmptyState, UniLoading, UniSection } from "@layout/uni";

const loading = ref(true);
const errorText = ref("");
const support = ref<SupportCenterEntity | null>(null);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "客服中心加载失败";

const loadSupport = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
  }
  errorText.value = "";
  try {
    support.value = ensureSuccess(await getSupportCenter(), "获取客服中心失败");
  } catch (error) {
    errorText.value = getErrorMessage(error);
    support.value = null;
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const handleContact = async (value: string, label: string) => {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      await uni.setClipboardData({ data: value });
    }
    uni.showToast({ title: `${label}已复制`, icon: "success" });
  } catch {
    uni.showToast({ title: "复制失败", icon: "none" });
  }
};

onShow(() => {
  void loadSupport();
});

onPullDownRefresh(() => {
  void loadSupport(false);
});
</script>

<template>
  <view class="uni-page-shell">
    <view class="uni-page-shell__content">
      <view class="support-hero glass-panel">
        <text class="support-hero__eyebrow">SERVICE DESK</text>
        <text class="support-hero__title">客户支持已经接成可用页面</text>
        <text class="support-hero__desc">
          联系方式、服务时间和 FAQ 都来自 API。mock 模式下先走复制动作，后续切 live 也能平滑替换。
        </text>
      </view>

      <view v-if="loading" class="support-state">
        <UniLoading text="正在拉取客服信息..." />
      </view>

      <view v-else-if="errorText || !support" class="support-state">
        <UniEmptyState
          title="客服中心暂时不可用"
          :description="errorText || '暂无支持数据'"
          action-text="重新加载"
          @action="loadSupport"
        />
      </view>

      <template v-else>
        <view class="support-metrics">
          <view class="support-metrics__item glass-panel">
            <text class="support-metrics__value">{{ support.serviceHours }}</text>
            <text class="support-metrics__label">服务时间</text>
          </view>
          <view class="support-metrics__item glass-panel">
            <text class="support-metrics__value">{{ support.responseSla }}</text>
            <text class="support-metrics__label">响应 SLA</text>
          </view>
        </view>

        <view class="support-notice glass-panel">
          <text>{{ support.notice }}</text>
        </view>

        <UniSection title="联系通道" subtitle="点一下就能复制到剪贴板，不再是假入口" />
        <view class="support-list">
          <view v-for="item in support.contacts" :key="item.id" class="support-card glass-panel">
            <view class="support-card__main">
              <text class="support-card__label">{{ item.label }}</text>
              <text class="support-card__value">{{ item.value }}</text>
              <text class="support-card__desc">{{ item.description }}</text>
            </view>
            <view class="support-card__action primary-button" @tap="handleContact(item.value, item.label)">
              <text>{{ item.actionText }}</text>
            </view>
          </view>
        </view>

        <UniSection title="常见问题" subtitle="FAQ 也按接口格式返回，后续可直接接后台配置" />
        <view class="faq-list glass-panel">
          <view
            v-for="(item, index) in support.faqs"
            :key="item.id"
            class="faq-list__item"
            :class="{ 'is-last': index === support.faqs.length - 1 }"
          >
            <text class="faq-list__category">{{ item.category }}</text>
            <text class="faq-list__question">{{ item.question }}</text>
            <text class="faq-list__answer">{{ item.answer }}</text>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.support-hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 28rpx;
  border-radius: 36rpx;
}

.support-hero__eyebrow {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--uni-text-muted);
}

.support-hero__title {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.support-hero__desc,
.support-notice {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}

.support-state {
  padding-top: 40rpx;
}

.support-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.support-metrics__item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 22rpx 20rpx;
  border-radius: 28rpx;
}

.support-metrics__value {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.support-metrics__label {
  font-size: 21rpx;
  color: var(--uni-text-muted);
}

.support-notice {
  padding: 22rpx 24rpx;
  border-radius: 28rpx;
}

.support-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.support-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 30rpx;
}

.support-card__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.support-card__label {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.support-card__value {
  font-size: 24rpx;
  color: var(--uni-primary);
  font-weight: 700;
}

.support-card__desc {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--uni-text-muted);
}

.support-card__action {
  min-width: 168rpx;
  height: 68rpx;
  padding: 0 22rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
}

.faq-list {
  border-radius: 32rpx;
  overflow: hidden;
}

.faq-list__item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--uni-border-color);
}

.faq-list__item.is-last {
  border-bottom: none;
}

.faq-list__category {
  font-size: 20rpx;
  color: var(--uni-accent);
  font-weight: 700;
}

.faq-list__question {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--uni-text-strong);
}

.faq-list__answer {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--uni-text-secondary);
}
</style>
