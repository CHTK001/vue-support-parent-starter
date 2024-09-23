```vue
<template>
  <div class="pure-segmented" :class="{ 'pure-segmented-block': block, 'pure-segmented--large': size === 'large', 'pure-segmented--small': size === 'small' }">
    <div class="pure-segmented-group">
      <div class="pure-segmented-item-selected" :style="{ width: `${width}px`, transform: `translateX(${translateX}px)`, display: initStatus ? 'block' : 'none' }" />
      <label
        v-for="(option, index) in options"
        :key="index"
        ref="labelRef"
        :class="['pure-segmented-item', { 'pure-segmented-item-disabled': disabled || option.disabled }]"
        :style="{
          background: curMouseActive === index ? segmentedItembg : '',
          color: disabled
            ? null
            : !option.disabled && (curIndex === index || curMouseActive === index)
              ? isDark
                ? 'rgba(255, 255, 255, 0.85)'
                : curMouseActive === index
                  ? segmentedItembg
                    ? 'rgba(0,0,0,0.88)'
                    : 'var(--el-color-white)'
                  : 'var(--el-color-white)'
              : ''
        }"
        @mouseenter="handleMouseenter(index, $event)"
        @mouseleave="handleMouseleave($event)"
        @click="handleChange(index, $event)"
      >
        <input type="radio" name="segmented" />
        <div v-tippy="{ content: option.tip, zIndex: 41000 }" class="pure-segmented-item-label">
          <span v-if="option.icon && typeof option.label !== 'function'" class="pure-segmented-item-icon" :style="{ marginRight: option.label ? '6px' : 0 }">
            <component :is="useRenderIcon(option.icon, { ...option?.iconAttrs })" />
          </span>
          <span v-if="option.label && typeof option.label !== 'function'">{{ option.label }}</span>
          <component :is="option.label" v-if="option.label && typeof option.label === 'function'" />
        </div>
      </label>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick, getCurrentInstance } from "vue";
import { useDark, isNumber, isFunction, useResizeObserver } from "@pureadmin/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
export default defineComponent({
  props: {
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [Number, String],
      default: "0"
    },
    block: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      validator: val => ["small", "default", "large"].includes(val)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    resize: {
      type: Boolean,
      default: false
    }
  },
  emits: ["change", "update:modelValue"],
  setup(props, { emit }) {
    const width = ref(0);
    const translateX = ref(0);
    const { isDark } = useDark();
    const initStatus = ref(false);
    const curMouseActive = ref(-1);
    const segmentedItembg = ref("");
    const instance = getCurrentInstance();
    const curIndex = isNumber(props.modelValue) ? ref(props.modelValue) : ref(0);

    function handleChange(index, event) {
      const option = props.options[index];
      if (props.disabled || option.disabled) return;
      event.preventDefault();
      isNumber(props.modelValue) ? emit("update:modelValue", index) : (curIndex.value = index);
      segmentedItembg.value = "";
      emit("change", { index, option });
    }

    function handleMouseenter(index, event) {
      const option = props.options[index];
      if (props.disabled) return;
      event.preventDefault();
      curMouseActive.value = index;
      if (option.disabled || curIndex.value === index) {
        segmentedItembg.value = "";
      } else {
        segmentedItembg.value = isDark.value ? "#1f1f1f" : "rgba(255, 255, 255, 0.06)";
      }
    }

    function handleMouseleave(event) {
      if (props.disabled) return;
      event.preventDefault();
      curMouseActive.value = -1;
    }

    function handleInit(index = curIndex.value) {
      nextTick(() => {
        const curLabelRef = instance?.refs["labelRef"];
        if (!curLabelRef) return;
        width.value = curLabelRef.clientWidth;
        translateX.value = curLabelRef.offsetLeft;
        initStatus.value = true;
      });
    }

    function handleResizeInit() {
      useResizeObserver(".pure-segmented", () => {
        nextTick(() => {
          handleInit(curIndex.value);
        });
      });
    }

    (props.block || props.resize) && handleResizeInit();

    watch(
      () => curIndex.value,
      index => {
        nextTick(() => {
          handleInit(index);
        });
      },
      {
        immediate: true
      }
    );

    watch(() => props.size, handleResizeInit, {
      immediate: true
    });

    return {
      width,
      translateX,
      isDark,
      initStatus,
      curMouseActive,
      segmentedItembg,
      curIndex,
      handleChange,
      handleMouseenter,
      handleMouseleave
    };
  },
  methods: {
    useRenderIcon
  }
});
</script>
```
