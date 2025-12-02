<template>
  <div
    class="pricing-card"
    :class="{ 'is-featured': featured, 'is-popular': popular }"
  >
    <div v-if="popular" class="pricing-card__badge">
      <IconifyIconOnline icon="ri:fire-fill" />
      <span>最受欢迎</span>
    </div>
    <div class="pricing-card__header">
      <div class="pricing-card__icon">
        <IconifyIconOnline :icon="icon" />
      </div>
      <h3 class="pricing-card__title">{{ title }}</h3>
      <p class="pricing-card__subtitle">{{ subtitle }}</p>
    </div>
    <div class="pricing-card__price">
      <span class="pricing-card__currency">¥</span>
      <span class="pricing-card__amount">{{ price }}</span>
      <span class="pricing-card__period">/{{ period }}</span>
    </div>
    <ul class="pricing-card__features">
      <li
        v-for="(feature, index) in features"
        :key="index"
        class="pricing-card__feature"
      >
        <IconifyIconOnline
          :icon="
            feature.included !== false
              ? 'ri:checkbox-circle-fill'
              : 'ri:close-circle-fill'
          "
          :class="
            feature.included !== false
              ? 'feature-icon--included'
              : 'feature-icon--excluded'
          "
        />
        <span>{{ feature.label || feature }}</span>
      </li>
    </ul>
    <div class="pricing-card__action">
      <slot name="action">
        <el-button
          :type="featured ? 'primary' : 'default'"
          size="large"
          class="pricing-card__btn"
        >
          {{ actionText }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Feature {
  label?: string;
  included?: boolean;
}

interface Props {
  icon?: string;
  title?: string;
  subtitle?: string;
  price?: string | number;
  period?: string;
  features?: Array<string | Feature>;
  featured?: boolean;
  popular?: boolean;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  icon: "ri:vip-crown-line",
  title: "套餐名称",
  subtitle: "套餐描述",
  price: "99",
  period: "月",
  features: () => [],
  featured: false,
  popular: false,
  actionText: "立即购买",
});
</script>

<style lang="scss" scoped>
.pricing-card {
  position: relative;
  padding: 32px;
  background: var(--el-bg-color-overlay);
  border-radius: 24px;
  border: 2px solid var(--el-border-color-lighter);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.02) 0%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
    border-color: var(--el-color-primary);

    &::before {
      opacity: 1;
    }
  }

  &.is-featured {
    border-color: var(--el-color-primary);
    box-shadow: 0 12px 32px rgba(var(--el-color-primary-rgb), 0.2);

    &::before {
      opacity: 1;
    }
  }

  &.is-popular {
    transform: scale(1.05);
    z-index: 1;
  }

  &__badge {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    font-size: 12px;
    font-weight: 700;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }

  &__header {
    text-align: center;
    margin-bottom: 28px;
  }

  &__icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border-radius: 20px;
    font-size: 40px;
    color: var(--el-color-primary);
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  &__price {
    text-align: center;
    margin-bottom: 32px;
    padding: 24px 0;
    border-top: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__currency {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    vertical-align: top;
  }

  &__amount {
    font-size: 56px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1;
  }

  &__period {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
  }

  &__features {
    list-style: none;
    padding: 0;
    margin: 0 0 32px 0;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);

    .feature-icon--included {
      color: var(--el-color-success);
      font-size: 18px;
    }

    .feature-icon--excluded {
      color: var(--el-text-color-placeholder);
      font-size: 18px;
    }
  }

  &__action {
    .pricing-card__btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
    }
  }
}
</style>
