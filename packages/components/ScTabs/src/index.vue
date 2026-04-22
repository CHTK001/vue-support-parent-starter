<template>
  <component
    :is="currentComponent || ElTabs"
    class="sc-tabs"
    :class="tabsClass"
    v-model="currentValue"
    :type="type"
    :closable="closable"
    :addable="addable"
    :editable="editable"
    :tab-position="tabPositionResolved"
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
    <template v-if="isRailLayout && $slots.default" #default>
      <slot />
    </template>
    <template v-else-if="isRailLayout && railItems.length" #default>
      <ScTabsRailSlot
        :rail-items="railItems"
        :rail-closable="railClosable"
        @tab-remove="handleTabRemove"
      />
    </template>
    <template v-else-if="!isRailLayout && $slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTabs 标签页组件
 * 封装 Element Plus Tabs
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed, useSlots } from "vue";
import type { PropType } from "vue";
import { ElTabs } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import ScTabsRailSlot from "../components/ScTabsRailSlot.vue";
import type { ScTabsRailItem } from "../types";

export type { ScTabsRailItem };

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String as PropType<"card" | "border-card" | "">,
    default: "",
  },
  closable: {
    type: Boolean,
    default: false,
  },
  addable: {
    type: Boolean,
    default: false,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  /** 未传时：default 布局为 top；rail 布局默认为 right */
  tabPosition: {
    type: String as PropType<"top" | "right" | "bottom" | "left" | undefined>,
    default: undefined,
  },
  stretch: {
    type: Boolean,
    default: false,
  },
  beforeLeave: {
    type: Function as PropType<
      (
        newTabName: string | number,
        oldTabName: string | number,
      ) => boolean | Promise<boolean>
    >,
    default: undefined,
  },
  lazy: {
    type: Boolean,
    default: false,
  },
  tabClass: {
    type: String,
    default: "",
  },
  tabStyle: {
    type: Object,
    default: () => ({}),
  },
  popperClass: {
    type: String,
    default: "",
  },
  navPrevIcon: {
    type: [String, Object],
    default: "",
  },
  navNextIcon: {
    type: [String, Object],
    default: "",
  },
  editIcon: {
    type: [String, Object],
    default: "",
  },
  closeIcon: {
    type: [String, Object],
    default: "",
  },
  layout: {
    type: String as PropType<"default" | "rail">,
    default: "default",
  },
  railItems: {
    type: Array as PropType<ScTabsRailItem[]>,
    default: () => [],
  },
  railRound: {
    type: Boolean,
    default: false,
  },
  railCloseButtonMode: {
    type: String as PropType<"always" | "hover">,
    default: "hover",
  },
  railClosable: {
    type: Boolean,
    default: false,
  },
  /** rail 下图标与格尺寸：compact | normal | large */
  railSize: {
    type: String as PropType<"compact" | "normal" | "large">,
    default: "normal",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "tab-click",
  "tab-change",
  "edit",
  "tab-remove",
  "tab-add",
]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

const { currentComponent } = useThemeComponent("ElTabs");
const slots = useSlots();

const isRailLayout = computed(() => props.layout === "rail");
const railClosable = computed(() => props.railClosable);

const tabPositionResolved = computed((): "top" | "right" | "bottom" | "left" => {
  const p = props.tabPosition;
  if (isRailLayout.value) return p ?? "right";
  return p ?? "top";
});

/** 仅 railItems、无默认插槽时隐藏内容区（如 ScTabsRailLayout 仅作侧栏导航） */
const isRailItemsOnly = computed(
  () => isRailLayout.value && !slots.default && props.railItems.length > 0,
);

const tabsClass = computed(() => {
  if (!isRailLayout.value) return [];
  return [
    "sc-tabs--layout-rail",
    `sc-tabs--rail-size-${props.railSize}`,
    {
      "is-round": props.railRound,
      "sc-tabs--rail-items-only": isRailItemsOnly.value,
    },
    `close-mode-${props.railCloseButtonMode}`,
  ];
});

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

<style scoped lang="scss">
@import "./styles/sc-tabs-rail.scss";
@import "./styles/sc-tabs-default.scss";
</style>
