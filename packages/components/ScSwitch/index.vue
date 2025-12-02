<template>
  <div class="sc-switch">
    <!-- 视觉卡片布局 -->
    <VisualCardLayout
      v-if="layout === 'visual-card'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      :label="label"
      :description="description"
      :show-ribbon="showRibbon"
      :ribbon-text="ribbonText"
      :ribbon-color="ribbonColor"
      :wide="wide"
      @change="handleChange"
    >
      <template v-if="$slots.default" #default>
        <slot />
      </template>
      <template v-if="$slots.icon" #icon>
        <slot name="icon" />
      </template>
    </VisualCardLayout>

    <!-- 卡片布局 -->
    <CardLayout
      v-else-if="layout === 'card'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />

    <!-- 滑块布局 -->
    <SliderLayout
      v-else-if="layout === 'slider'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />

    <!-- 现代布局 -->
    <ModernLayout
      v-else-if="layout === 'modern'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />

    <!-- 默认布局 -->
    <el-switch
      v-else
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="showText ? activeText : ''"
      :inactive-text="showText ? inactiveText : ''"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ScSwitch 开关组件
 * 支持多种布局模式：default、card、slider、modern、visual-card
 * @author CH
 * @date 2025-12-02
 * @version 2.0.0
 */
import { computed } from "vue";
import CardLayout from "./components/CardLayout.vue";
import SliderLayout from "./components/SliderLayout.vue";
import ModernLayout from "./components/ModernLayout.vue";
import VisualCardLayout from "./components/VisualCardLayout.vue";

const props = defineProps({
  /**
   * 绑定值
   */
  modelValue: {
    type: [Boolean, String, Number],
    default: false
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 是否加载中
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 布局模式
   * - default: 默认 el-switch
   * - card: 卡片布局
   * - slider: 滑块布局
   * - modern: 现代布局
   * - visual-card: 视觉效果卡片布局
   */
  layout: {
    type: String,
    default: "default",
    validator: (val: string) => ["default", "card", "slider", "modern", "visual-card"].includes(val)
  },
  /**
   * 尺寸
   */
  size: {
    type: String,
    default: "default",
    validator: (val: string) => ["large", "default", "small"].includes(val)
  },
  /**
   * 激活时显示的文字
   */
  activeText: {
    type: String,
    default: ""
  },
  /**
   * 非激活时显示的文字
   */
  inactiveText: {
    type: String,
    default: ""
  },
  /**
   * 激活时的值
   */
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  /**
   * 非激活时的值
   */
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  /**
   * 激活时的颜色
   */
  activeColor: {
    type: String,
    default: ""
  },
  /**
   * 非激活时的颜色
   */
  inactiveColor: {
    type: String,
    default: ""
  },
  /**
   * 激活时的图标
   */
  activeIcon: {
    type: String,
    default: ""
  },
  /**
   * 非激活时的图标
   */
  inactiveIcon: {
    type: String,
    default: ""
  },
  /**
   * 是否显示文字（仅 default 布局）
   */
  showText: {
    type: Boolean,
    default: false
  },
  /**
   * 名称
   */
  name: {
    type: String,
    default: ""
  },
  // ========== visual-card 布局专用属性 ==========
  /**
   * 标签文本（visual-card 布局）
   */
  label: {
    type: String,
    default: ""
  },
  /**
   * 描述文本（visual-card 布局）
   */
  description: {
    type: String,
    default: ""
  },
  /**
   * 是否显示角标（visual-card 布局）
   */
  showRibbon: {
    type: Boolean,
    default: true
  },
  /**
   * 角标文本（visual-card 布局）
   */
  ribbonText: {
    type: String,
    default: "开启"
  },
  /**
   * 角标颜色（visual-card 布局）
   */
  ribbonColor: {
    type: String,
    default: "var(--el-color-primary)"
  },
  /**
   * 是否横向撑满（visual-card 布局）
   */
  wide: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 内部值，用于双向绑定
const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
  }
});

// 处理变更事件
const handleChange = (val: boolean | string | number) => {
  emit("change", val);
};
</script>

<style lang="scss" scoped>
.sc-switch {
  display: inline-block;
}
</style>
