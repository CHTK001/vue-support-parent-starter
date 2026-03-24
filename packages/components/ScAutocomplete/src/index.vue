<template>
  <component
    :is="currentComponent || ElAutocomplete"
    v-model="currentValue"
    :fetch-suggestions="fetchSuggestions"
    :placeholder="placeholder"
    :disabled="disabled"
    :value-key="valueKey"
    :debounce="debounce"
    :placement="placement"
    :popper-class="popperClass"
    :trigger-on-focus="triggerOnFocus"
    :select-when-unmatched="selectWhenUnmatched"
    :name="name"
    :id="id"
    :size="size"
    :clearable="clearable"
    :fit-input-width="fitInputWidth"
    :hide-loading="hideLoading"
    :popper-append-to-body="popperAppendToBody"
    :highlight-first-item="highlightFirstItem"
    :teleported="teleported"
    @select="handleSelect"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
  >
    <template v-if="$slots.default" #default="{ item }">
      <slot :item="item" />
    </template>
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import { ElAutocomplete } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type SuggestionItem = Record<string, any>;

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ""
  },
  fetchSuggestions: {
    type: Function as PropType<(queryString: string, callback: (suggestions: SuggestionItem[]) => void) => void>,
    required: true
  },
  placeholder: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  valueKey: {
    type: String,
    default: "value"
  },
  debounce: {
    type: Number,
    default: 300
  },
  placement: {
    type: String,
    default: "bottom-start"
  },
  popperClass: {
    type: String,
    default: ""
  },
  triggerOnFocus: {
    type: Boolean,
    default: true
  },
  selectWhenUnmatched: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: ""
  },
  id: {
    type: String,
    default: ""
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  clearable: {
    type: Boolean,
    default: false
  },
  fitInputWidth: {
    type: Boolean,
    default: false
  },
  hideLoading: {
    type: Boolean,
    default: false
  },
  popperAppendToBody: {
    type: Boolean,
    default: undefined
  },
  highlightFirstItem: {
    type: Boolean,
    default: false
  },
  teleported: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "select", "change", "input", "focus", "blur", "clear"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElAutocomplete");



const handleSelect = (item: SuggestionItem) => {
  emit("select", item);
};

const handleChange = (val: string | number) => {
  emit("change", val);
};

const handleInput = (val: string | number) => {
  emit("input", val);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleClear = () => {
  emit("clear");
};
</script>
