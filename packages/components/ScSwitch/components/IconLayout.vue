<template>
  <button
    type="button"
    class="sc-switch-icon"
    :class="[
      `sc-switch-icon--${size}`,
      `indicator-${indicator}`,
      {
        'is-active': isChecked,
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
    :disabled="disabled || loading"
    :style="indicator === 'ribbon' ? { '--indicator-color': activeColor || 'var(--el-color-primary)' } : {}"
    @click="toggleSwitch"
  >
    <span class="sc-switch-icon__glyph">
      <IconifyIconOnline :icon="currentIcon" />
    </span>
    <span v-if="isChecked && indicator === 'checkmark'" class="sc-switch-icon__marker">
      <IconifyIconOnline icon="ri:check-line" />
    </span>
    <span v-if="isChecked && indicator === 'ribbon'" class="sc-switch-icon__ribbon" />
    <span v-if="isChecked && indicator === 'checkmark'" class="sc-switch-icon__badge" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: "default"
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  activeIcon: {
    type: String,
    default: ""
  },
  inactiveIcon: {
    type: String,
    default: ""
  },
  indicator: {
    type: String,
    default: "checkmark"
  },
  activeColor: {
    type: String,
    default: ""
  },
  inactiveColor: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const isChecked = computed(() => props.modelValue === props.activeValue);

const currentIcon = computed(() => {
  if (isChecked.value) {
    return props.activeIcon || "ri:toggle-fill";
  }
  return props.inactiveIcon || "ri:toggle-line";
});

const toggleSwitch = () => {
  if (props.disabled || props.loading) {
    return;
  }
  const next = isChecked.value ? props.inactiveValue : props.activeValue;
  emit("update:modelValue", next);
  emit("change", next);
};
</script>

<style scoped lang="scss">
.sc-switch-icon {
  position: relative;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.04);

  &:hover:not(.is-disabled):not(.is-loading) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
    color: var(--el-color-primary);
    box-shadow: 0 14px 24px rgba(15, 23, 42, 0.08);
  }

  &.is-active {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 32%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-color-primary) 11%, white),
      color-mix(in srgb, var(--el-color-primary) 6%, white)
    );
    box-shadow: 0 14px 24px rgba(37, 99, 235, 0.12);
  }

  &.is-disabled,
  &.is-loading {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--small {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  &--large {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }
}

.sc-switch-icon__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}

.sc-switch-icon--small .sc-switch-icon__glyph {
  font-size: 18px;
}

.sc-switch-icon--large .sc-switch-icon__glyph {
  font-size: 22px;
}

.sc-switch-icon__marker {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  color: #fff;
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.25);
  font-size: 10px;
  line-height: 1;
}

.sc-switch-icon__badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-color-success);
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  z-index: 1;
}

/* ── Ribbon indicator ── */

.sc-switch-icon.indicator-ribbon.is-active {
  border-color: var(--indicator-color, var(--el-color-primary));
}

.sc-switch-icon__ribbon {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 14px 14px;
  border-color: transparent transparent var(--indicator-color, var(--el-color-primary)) transparent;
  z-index: 2;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}
</style>
