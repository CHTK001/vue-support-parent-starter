<template>
  <div class="info-card" :class="`info-card--${type}`">
    <div class="info-card__header">
      <div class="info-card__icon">
        <IconifyIconOnline :icon="icon" />
      </div>
      <div class="info-card__close" v-if="closable" @click="$emit('close')">
        <IconifyIconOnline icon="ri:close-line" />
      </div>
    </div>
    <div class="info-card__content">
      <h4 class="info-card__title">{{ title }}</h4>
      <p class="info-card__message">{{ message }}</p>
      <div v-if="$slots.default" class="info-card__extra">
        <slot />
      </div>
    </div>
    <div v-if="showAction" class="info-card__footer">
      <slot name="action">
        <el-button :type="type" text>{{ actionText }}</el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  title?: string;
  message?: string;
  closable?: boolean;
  showAction?: boolean;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'info',
  icon: 'ri:information-line',
  title: '提示信息',
  message: '这是一条提示消息',
  closable: false,
  showAction: false,
  actionText: '了解更多'
});

defineEmits<{
  close: [];
}>();
</script>

<style lang="scss" scoped>
.info-card {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 12px 12px 0 0;
  }

  &--info {
    &::before {
      background: var(--el-color-info);
    }
    .info-card__icon {
      color: var(--el-color-info);
      background: var(--el-color-info-light-9);
    }
  }

  &--success {
    &::before {
      background: var(--el-color-success);
    }
    .info-card__icon {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }
  }

  &--warning {
    &::before {
      background: var(--el-color-warning);
    }
    .info-card__icon {
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
    }
  }

  &--error {
    &::before {
      background: var(--el-color-danger);
    }
    .info-card__icon {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 20px;
  }

  &__close {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 16px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }
  }

  &__content {
    margin-bottom: 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  &__message {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
    margin: 0;
  }

  &__extra {
    margin-top: 12px;
  }

  &__footer {
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
