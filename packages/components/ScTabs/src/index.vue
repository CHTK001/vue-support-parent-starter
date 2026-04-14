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
    <template v-if="isRailLayout" #default>
      <ElTabPane
        v-for="item in railItems"
        :key="String(item.name)"
        :name="item.name"
      >
        <template #label>
          <span
            class="sc-tabs__rail-label"
            :title="item.title || item.label || String(item.name)"
          >
            <ElIcon v-if="item.icon">
              <component :is="item.icon" />
            </ElIcon>
            <span v-else>{{ item.label }}</span>
            <span
              v-if="item.closable"
              class="sc-tabs__rail-close"
              @click.stop="handleTabRemove(item.name)"
            >
              ×
            </span>
          </span>
        </template>
      </ElTabPane>
    </template>
    <template v-else-if="$slots.default" #default>
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
import { computed } from "vue";
import type { PropType } from "vue";
import { ElIcon, ElTabPane, ElTabs } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

export interface ScTabsRailItem {
  closable?: boolean;
  icon?: any;
  label?: string;
  name: string | number;
  title?: string;
}

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
  },
  layout: {
    type: String as PropType<"default" | "rail">,
    default: "default"
  },
  railItems: {
    type: Array as PropType<ScTabsRailItem[]>,
    default: () => []
  },
  railRound: {
    type: Boolean,
    default: false
  },
  railCloseButtonMode: {
    type: String as PropType<"always" | "hover">,
    default: "hover"
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

const isRailLayout = computed(() => props.layout === "rail");

const tabsClass = computed(() => {
  if (!isRailLayout.value) return [];
  return [
    "sc-tabs--layout-rail",
    { "is-round": props.railRound },
    `close-mode-${props.railCloseButtonMode}`
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
.sc-tabs--layout-rail {
  height: 100%;
}

.sc-tabs--layout-rail :deep(.el-tabs) {
  height: 100%;
}

.sc-tabs--layout-rail :deep(.el-tabs__header) {
  margin: 0;
  height: 100%;
}

.sc-tabs--layout-rail :deep(.el-tabs__nav-wrap),
.sc-tabs--layout-rail :deep(.el-tabs__nav-scroll),
.sc-tabs--layout-rail :deep(.el-tabs__nav),
.sc-tabs--layout-rail :deep(.el-tabs__content) {
  height: 100%;
}

.sc-tabs--layout-rail :deep(.el-tabs__content),
.sc-tabs--layout-rail :deep(.el-tabs__nav-wrap::after),
.sc-tabs--layout-rail :deep(.el-tabs__active-bar) {
  display: none;
}

.sc-tabs--layout-rail :deep(.el-tabs__item) {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
  color: #5f7686;
}

.sc-tabs--layout-rail.is-round :deep(.el-tabs__item) {
  border-radius: 999px;
}

.sc-tabs--layout-rail :deep(.el-tabs__item.is-active) {
  background: rgba(37, 99, 235, 0.14);
  color: #1252aa;
}

.sc-tabs__rail-label {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
}

.sc-tabs__rail-close {
  position: absolute;
  top: -3px;
  right: -3px;
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fef2f2;
  color: #b42318;
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.sc-tabs--layout-rail.close-mode-hover .sc-tabs__rail-close {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.92);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sc-tabs--layout-rail.close-mode-hover
  :deep(.el-tabs__item:hover)
  .sc-tabs__rail-close,
.sc-tabs--layout-rail.close-mode-hover
  :deep(.el-tabs__item.is-active)
  .sc-tabs__rail-close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.sc-tabs__rail-close:hover {
  background: #fee2e2;
}
</style>
