<template>
  <!-- Tech 主题模式 -->
  <div v-if="theme === 'tech'" class="sc-panel-group sc-panel-group--tech">
    <slot />
  </div>

  <!-- Element Plus 原生模式 -->
  <el-collapse v-else v-model="activeNamesModel" :accordion="accordion" @change="handleChange">
    <slot />
  </el-collapse>
</template>

<script setup lang="ts">
/**
 * ScPanelGroup 面板组容器
 * 封装 el-collapse 并支持 tech 主题
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { ref, provide, watch } from "vue";
import { ElCollapse } from "element-plus";

interface Props {
  /** 当前激活的面板 */
  modelValue?: string | number | Array<string | number>;
  /** 是否手风琴模式 */
  accordion?: boolean;
  /** 主题风格 */
  theme?: "default" | "tech";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accordion: false,
  theme: "default"
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | Array<string | number>];
  change: [value: string | number | Array<string | number>];
}>();

const activeNamesModel = ref(props.modelValue);

watch(
  () => props.modelValue,
  val => {
    activeNamesModel.value = val;
  }
);

watch(activeNamesModel, val => {
  emit("update:modelValue", val);
  emit("change", val);
});

const handleChange = (val: string | number | Array<string | number>) => {
  activeNamesModel.value = val;
};

const handleItemClick = (name: string | number) => {
  if (props.accordion) {
    activeNamesModel.value = activeNamesModel.value === name ? "" : name;
  } else {
    const names = Array.isArray(activeNamesModel.value) ? [...activeNamesModel.value] : activeNamesModel.value ? [activeNamesModel.value] : [];

    const index = names.indexOf(name);
    if (index > -1) {
      names.splice(index, 1);
    } else {
      names.push(name);
    }
    activeNamesModel.value = names;
  }
};

provide("collapseActiveNames", activeNamesModel);
provide("collapseHandleItemClick", handleItemClick);
</script>

<style lang="scss" scoped>
.sc-panel-group {
  &--tech {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
