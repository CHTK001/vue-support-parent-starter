<template>
  <component
    :is="currentComponent || ElCascader"
    v-model="currentValue"
    :options="options"
    :props="cascaderProps"
    :size="size"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :separator="separator"
    :filterable="filterable"
    :filter-method="filterMethod"
    :debounce="debounce"
    :before-filter="beforeFilter"
    :popper-class="popperClass"
    :teleported="teleported"
    :tag-type="tagType"
    :validate-event="validateEvent"
    @change="handleChange"
    @expand-change="handleExpandChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @visible-change="handleVisibleChange"
    @remove-tag="handleRemoveTag"
  >
    <template v-if="$slots.default" #default="{ node, data }">
      <slot :node="node" :data="data" />
    </template>
    <template v-if="$slots.empty" #empty>
      <slot name="empty" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import { ElCascader } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type CascaderValue = string | number | (string | number)[];
type CascaderOption = Record<string, any>;

const props = defineProps({
  modelValue: {
    type: [String, Number, Array] as PropType<CascaderValue>,
    default: ""
  },
  options: {
    type: Array as PropType<CascaderOption[]>,
    default: () => []
  },
  props: {
    type: Object,
    default: undefined
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  placeholder: {
    type: String,
    default: "Select"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  showAllLevels: {
    type: Boolean,
    default: true
  },
  collapseTags: {
    type: Boolean,
    default: false
  },
  collapseTagsTooltip: {
    type: Boolean,
    default: false
  },
  separator: {
    type: String,
    default: " / "
  },
  filterable: {
    type: Boolean,
    default: false
  },
  filterMethod: {
    type: Function,
    default: undefined
  },
  debounce: {
    type: Number,
    default: 300
  },
  beforeFilter: {
    type: Function as PropType<(value: string) => boolean | Promise<boolean>>,
    default: undefined
  },
  popperClass: {
    type: String,
    default: ""
  },
  teleported: {
    type: Boolean,
    default: true
  },
  tagType: {
    type: String as PropType<"" | "success" | "info" | "warning" | "danger">,
    default: "info"
  },
  validateEvent: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "change", "expand-change", "blur", "focus", "visible-change", "remove-tag"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElCascader");



const cascaderProps = computed(() => props.props);

const handleChange = (val: CascaderValue) => {
  emit("change", val);
};

const handleExpandChange = (val: CascaderValue) => {
  emit("expand-change", val);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};

const handleRemoveTag = (val: CascaderValue) => {
  emit("remove-tag", val);
};
</script>
