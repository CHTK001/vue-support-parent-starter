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
import { isNumber, useDark, useResizeObserver } from "@pureadmin/utils";
import { defineComponent, nextTick, ref, toRef, watch } from "vue";

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
      if (props.disabled || option.disabled) return;
      event.preventDefault();
      isNumber(props.modelValue) ? emit("update:modelValue", index) : (curIndex.value = index);
      segmentedItembg.value = "";
      segmentedItemColor.value = "rgba(255, 255, 255, 0.85)";
      emit("change", { index, option });
    };

    const handleMouseenter = ({ option, index }, event) => {
      if (props.disabled) return;
      event.preventDefault();
      curMouseActive.value = index;
      if (option.disabled || curIndex.value === index) {
        segmentedItembg.value = "";
        segmentedItemColor.value = "rgba(255, 255, 255, 0.85)";
      } else {
        segmentedItembg.value = isDark.value ? "#1f1f1f" : "rgba(0, 0, 0, 0.06)";
        segmentedItemColor.value = "rgba(255,255,255,.88)";
      }
    };

    const handleMouseleave = event => {
      if (props.disabled) return;
      event.preventDefault();
      curMouseActive.value = -1;
    };

    const handleInit = (index = curIndex.value) => {
      nextTick(() => {
        const curLabelRef = instance?.proxy?.$refs[`labelRef${index}`];
        if (!curLabelRef) return;
        width.value = curLabelRef.clientWidth;
        translateX.value = curLabelRef.offsetLeft;
        initStatus.value = true;
      });
    };

    const handleResizeInit = () => {
      useResizeObserver(".pure-segmented", () => {
        nextTick(() => {
          handleInit(curIndex.value);
        });
      });
    };

    (props.block || props.resize) && handleResizeInit();

    watch(
      curIndex,
      index => {
        nextTick(() => {
          handleInit(index);
        });
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
