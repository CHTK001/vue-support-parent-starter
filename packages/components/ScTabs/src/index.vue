<template>
  <component
    :is="currentComponent || ElTabs"
    v-model="currentValue"
    :type="type"
    :closable="closable"
    :addable="addable"
    :editable="editable"
    :tab-position="tabPosition"
    :stretch="stretch"
    :before-leave="beforeLeave"
    :lazy="lazy"
    :tab-class="tabClass"
    :tab-style="tabStyle"
    :popper-class="popperClass"
    :nav-prev-icon="navPrevIcon"
    :nav-next-icon="navNextIcon"
    :edit-icon="editIcon"
    :close-icon="closeIcon"
    @tab-click="handleTabClick"
    @tab-change="handleTabChange"
    @edit="handleEdit"
    @tab-remove="handleTabRemove"
    @tab-add="handleTabAdd"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTabs 标签页组件
 * 封装 Element Plus Tabs 与 PixelUI PxTabs
 * 在 data-skin 为 8bit 时自动切换为像素风标签页
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElTabs } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ""
  },
  type: {
    type: String as PropType<"card" | "border-card" | "">,
    default: ""
  },
  closable: {
    type: Boolean,
    default: false
  },
  addable: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: false
  },
  tabPosition: {
    type: String as PropType<"top" | "right" | "bottom" | "left">,
    default: "top"
  },
  stretch: {
    type: Boolean,
    default: false
  },
  beforeLeave: {
    type: Function as PropType<(newTabName: string | number, oldTabName: string | number) => boolean | Promise<boolean>>,
    default: undefined
  },
  lazy: {
    type: Boolean,
    default: false
  },
  tabClass: {
    type: String,
    default: ""
  },
  tabStyle: {
    type: Object,
    default: () => ({})
  },
  popperClass: {
    type: String,
    default: ""
  },
  navPrevIcon: {
    type: [String, Object],
    default: ""
  },
  navNextIcon: {
    type: [String, Object],
    default: ""
  },
  editIcon: {
    type: [String, Object],
    default: ""
  },
  closeIcon: {
    type: [String, Object],
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "tab-click", "tab-change", "edit", "tab-remove", "tab-add"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElTabs");



const handleTabClick = (tab: any, event: Event) => {
  emit("tab-click", tab, event);
};

const handleTabChange = (name: string | number) => {
  emit("tab-change", name);
};

const handleEdit = (targetName: string | number, action: "add" | "remove") => {
  emit("edit", targetName, action);
};

const handleTabRemove = (name: string | number) => {
  emit("tab-remove", name);
};

const handleTabAdd = () => {
  emit("tab-add");
};
</script>
