<template>
  <div
    :class="[
      're-switch-card',
      {
        're-switch-card--active': isActive,
        're-switch-card--hidden': cardHideSwitch,
        're-switch-card--clickable': !cardShowRadio,
      },
    ]"
    @click="handleCardClick"
  >
    <div class="re-switch-card__body">
      <div v-if="title || tip" class="re-switch-card__head">
        <span class="re-switch-card__title">{{ title }}</span>
        <span v-if="sub" class="re-switch-card__sub">{{ sub }}</span>
        <el-tooltip v-if="tip" :content="tip" placement="top">
          <el-icon class="re-switch-card__tip"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <p v-if="description" class="re-switch-card__desc">{{ description }}</p>
    </div>
    <div v-if="!cardHideSwitch" class="re-switch-card__switch" @click.stop>
      <ElSwitch v-bind="$attrs" v-model="modelValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElSwitch } from "element-plus";
import { computed, toRefs } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "CardReSwitch", inheritAttrs: true });

const props = defineProps<{
  title?: string;
  sub?: string;
  tip?: string;
  description?: string;
  cardHideSwitch?: boolean;
  cardShowRadio?: boolean;
}>();

const { cardHideSwitch, cardShowRadio } = toRefs(props);

const modelValue = defineModel<boolean | string | number>({ default: false });
const isActive = computed(() => Boolean(modelValue.value));

/**
 * 卡片整体点击切换：
 *  - 默认（cardShowRadio=false）：点击卡片任意位置切换开关
 *  - radio 模式（cardShowRadio=true）：点击卡片仅设置为激活状态，不再 toggle off
 */
function handleCardClick() {
  if (cardShowRadio.value) {
    modelValue.value = true;
  } else {
    modelValue.value = !isActive.value;
  }
}
</script>

<style lang="scss" scoped>
.re-switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--rm-bg) 90%, transparent);
  border: 1px solid var(--rm-border);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.25s var(--rm-ease),
    box-shadow 0.25s var(--rm-ease),
    background-color 0.25s var(--rm-ease),
    transform 0.25s var(--rm-ease);

  &--clickable {
    cursor: pointer;
    user-select: none;
  }

  &:hover:not(.re-switch-card--active) {
    border-color: color-mix(in srgb, var(--rm-primary) 35%, var(--rm-border));
  }

  &--active {
    border: 1px solid color-mix(in srgb, var(--rm-primary) 60%, var(--rm-border));
    padding: 14px 16px;
    background: color-mix(in srgb, var(--rm-primary) 5%, var(--rm-bg));
    box-shadow: none;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: var(--rm-primary);
      border-radius: 0 4px 4px 0;
    }

    .re-switch-card__title {
      color: var(--rm-primary);
    }
  }

  &--hidden {
    gap: 0;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__switch {
    flex-shrink: 0;
  }

  &__head {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--rm-text);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s var(--rm-ease);
  }

  &__sub {
    font-size: 11px;
    font-weight: 500;
    color: var(--rm-text-secondary);
    letter-spacing: 0.3px;
    padding: 2px 7px;
    background: color-mix(in srgb, var(--rm-bg-subtle) 80%, transparent);
    border-radius: 4px;
    line-height: 1.4;
    align-self: center;
    flex-shrink: 0;
  }

  &__tip {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--rm-text-secondary);
    cursor: help;
    transition: color 0.2s var(--rm-ease);
    align-self: center;

    &:hover {
      color: var(--rm-primary);
    }
  }

  &__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--rm-text-secondary);
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .re-switch-card,
  .re-switch-card__title,
  .re-switch-card__tip {
    transition: none;
  }
  .re-switch-card:hover:not(.re-switch-card--active) {
    transform: none;
  }
}
</style>