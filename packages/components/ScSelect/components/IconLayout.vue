<template>
  <el-tooltip :content="tooltipContent" :show-after="120" :disabled="!tooltipContent">
    <button
      type="button"
      class="icon-selector-item"
      :class="{ active: isSelected, disabled: isDisabled }"
      :disabled="isDisabled"
      @click="handleSelect"
    >
      <span class="icon-selector-item__glyph" :class="{ 'is-text': !icon }">
        <IconRenderer v-if="icon" :icon="icon" />
        <span v-else>{{ fallbackLabel }}</span>
      </span>
      <span v-if="isSelected" class="icon-selector-item__marker">
        <IconRenderer icon="ri:check-line" />
      </span>
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconRenderer from "./IconRenderer.vue";

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isDisabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["select"]);

const fallbackLabel = computed(() => {
  const text = props.label.trim();
  return text ? text.slice(0, 2).toUpperCase() : "?";
});

const tooltipContent = computed(() =>
  [props.label, props.description].filter(Boolean).join(" · ")
);

const handleSelect = () => {
  if (!props.isDisabled) {
    emit("select", props.value);
  }
};
</script>

<style scoped lang="scss">
.icon-selector-item {
  position: relative;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.04);

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
    color: var(--el-color-primary);
    box-shadow: 0 14px 24px rgba(15, 23, 42, 0.08);
  }

  &.active {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 32%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--el-color-primary) 11%, white),
        color-mix(in srgb, var(--el-color-primary) 6%, white)
      );
    box-shadow: 0 14px 24px rgba(37, 99, 235, 0.12);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.icon-selector-item__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 18px;
  line-height: 1;
}

.icon-selector-item__glyph.is-text {
  width: auto;
  min-width: 24px;
  padding: 0 2px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.icon-selector-item__marker {
  position: absolute;
  right: -4px;
  top: -4px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--el-color-primary);
  color: white;
  font-size: 10px;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.24);
}
</style>
