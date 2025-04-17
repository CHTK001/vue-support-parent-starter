<template>
  <div class="button-switch" :class="[size, { 'is-disabled': disabled }]">
    <el-button
      :type="isActive ? 'primary' : 'default'" 
      :size="size"
      :disabled="disabled"
      :loading="loading"
      :class="{ 'active-button': isActive }"
      @click="toggle"
    >
      <template #default>
        <div class="button-content">
          <component v-if="activeIcon && isActive" :is="activeIcon" class="icon" />
          <component v-else-if="inactiveIcon && !isActive" :is="inactiveIcon" class="icon" />
          <span v-if="isActive">{{ activeText || '开启' }}</span>
          <span v-else>{{ inactiveText || '关闭' }}</span>
        </div>
      </template>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, ref, watch } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    default: false,
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
  activeText: {
    type: String,
    default: ""
  },
  inactiveText: {
    type: String,
    default: ""
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  activeColor: {
    type: String,
    default: ""
  },
  inactiveColor: {
    type: String,
    default: ""
  },
  activeIcon: {
    type: String,
    default: ""
  },
  inactiveIcon: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 是否处于激活状态
const isActive = computed(() => {
  return props.modelValue === props.activeValue;
});

// 切换状态
const toggle = () => {
  if (props.disabled || props.loading) return;
  
  const newValue = isActive.value ? props.inactiveValue : props.activeValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<style lang="scss" scoped>
.button-switch {
  display: inline-flex;
  align-items: center;
  
  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  
  .icon {
    font-size: 16px;
  }
  
  &.small .icon {
    font-size: 14px;
  }
  
  &.large .icon {
    font-size: 18px;
  }
  
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .active-button {
    background-color: v-bind("activeColor ? activeColor : null");
    border-color: v-bind("activeColor ? activeColor : null");
  }
}
</style> 