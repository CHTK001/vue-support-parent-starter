<template>
  <div class="pure-segmented" :class="{ 'pure-segmented-block': block, 'pure-segmented--large': size === 'large', 'pure-segmented--small': size === 'small' }">
    <div class="pure-segmented-group">
      <div class="pure-segmented-item-selected" :style="{ width: `${width}px`, transform: `translateX(${translateX}px)`, display: initStatus ? 'block' : 'none' }" />
      <label
        v-for="(option, index) in options"
        :key="index"
        ref="labelRef${index}"
        class="pure-segmented-item"
        :class="{ 'pure-segmented-item-disabled': disabled || option.disabled, 'pure-segmented-item-active': curMouseActive === index }"
        @mouseenter="handleMouseenter({ option, index }, $event)"
        @mouseleave="handleMouseleave($event)"
        @click="handleChange({ option, index }, $event)"
      >
        <input type="radio" name="segmented" />
        <div v-tippy="{ content: option.tip, zIndex: 41000 }" class="pure-segmented-item-label">
          <span v-if="typeof option.label !== 'function' && option.icon" class="pure-segmented-item-icon" :style="{ marginRight: option.label ? '6px' : 0 }">
            <component :is="useRenderIcon(option.icon, option.iconAttrs)" />
          </span>
          <span v-if="typeof option.label !== 'function' && option.label">{{ typeof option.label === "function" ? option.label() : option.label }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { isNumber, useDark } from "@pureadmin/utils";
import { defineComponent, ref, toRef, watch } from "vue";

export default defineComponent({
  name: "ReSegmented",
  props: {
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Number],
      default: "0"
    },
    block: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: "default"
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

  setup(props, { emit, instance }) {
    const width = ref(0);
    const translateX = ref(0);
    const { isDark } = useDark();
    const initStatus = ref(false);
    const curMouseActive = ref(-1);
    const segmentedItembg = ref("");
    const segmentedItemColor = ref("");
    const curIndex = isNumber(props.modelValue) ? toRef(props, "modelValue") : ref(0);

    const handleChange = ({ option, index }, event) => {
      /* Your implementation */
    };

    const handleMouseenter = ({ option, index }, event) => {
      /* Your implementation */
    };

    const handleMouseleave = (_, event) => {
      /* Your implementation */
    };

    const handleInit = (index = curIndex.value) => {
      /* Your implementation */
    };

    const handleResizeInit = () => {
      /* Your implementation */
    };

    (props.block || props.resize) && handleResizeInit();

    watch(
      curIndex,
      index => {
        /* Your implementation */
      },
      { immediate: true }
    );

    watch(() => props.size, handleResizeInit, { immediate: true });

    return {
      width,
      translateX,
      isDark,
      initStatus,
      curMouseActive,
      segmentedItembg,
      segmentedItemColor,
      curIndex,
      handleChange,
      handleMouseenter,
      handleMouseleave,
      handleInit
    };
  },
  methods: { useRenderIcon }
});
</script>
