<template>
  <div ref="containerRef" class="image-compare-container" :class="[direction]" :style="containerStyle">
    <div class="image-wrapper before-image">
      <img :src="beforeSrc" alt="Before" @load="handleImageLoad" />
      <div class="image-label before-label">原图</div>
    </div>
    <div class="image-wrapper after-image" :style="afterImageStyle">
      <img :src="afterSrc" alt="After" @load="handleImageLoad" />
      <div class="image-label after-label">对比图</div>
    </div>
    <div ref="sliderRef" class="compare-slider" :class="{ dragging: isDragging }" :style="sliderStyle" @mousedown="handleMouseDown" @touchstart="handleTouchStart">
      <div class="slider-line">
        <div class="slider-handle">
          <el-icon>
            <component :is="useRenderIcon(direction === 'horizontal' ? 'ep:d-caret' : 'ep:caret-top')" />
          </el-icon>
          <el-icon>
            <component :is="useRenderIcon(direction === 'horizontal' ? 'ep:d-caret' : 'ep:caret-bottom')" />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRenderIcon } from "../../ReIcon/src/hooks";

const props = defineProps({
  beforeSrc: {
    type: String,
    required: true
  },
  afterSrc: {
    type: String,
    required: true
  },
  compareValue: {
    type: Number,
    default: 50
  },
  direction: {
    type: String,
    default: "horizontal", // horizontal | vertical
    validator: value => ["horizontal", "vertical"].includes(value)
  },
  width: {
    type: String,
    default: "100%"
  },
  height: {
    type: String,
    default: "100%"
  }
});

const emit = defineEmits(["update:compareValue", "change"]);

const containerRef = ref(null);
const sliderRef = ref(null);
const isDragging = ref(false);
const currentValue = ref(props.compareValue);
const imagesLoaded = ref(0);

const containerStyle = computed(() => ({
  width: props.width,
  height: props.height
}));

const sliderStyle = computed(() => {
  if (props.direction === "horizontal") {
    return {
      left: `${currentValue.value}%`,
      top: "0",
      height: "100%"
    };
  } else {
    return {
      top: `${currentValue.value}%`,
      left: "0",
      width: "100%"
    };
  }
});

const afterImageStyle = computed(() => {
  if (props.direction === "horizontal") {
    return {
      clip: `rect(0, auto, auto, ${currentValue.value}%)`
    };
  } else {
    return {
      clip: `rect(${currentValue.value}%, auto, auto, 0)`
    };
  }
});

watch(
  () => props.compareValue,
  newValue => {
    currentValue.value = newValue;
  }
);

watch(currentValue, newValue => {
  emit("update:compareValue", newValue);
  emit("change", newValue);
});

const handleImageLoad = () => {
  imagesLoaded.value++;
};

const updateValue = (clientX, clientY) => {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  let value;

  if (props.direction === "horizontal") {
    const x = clientX - rect.left;
    value = (x / rect.width) * 100;
  } else {
    const y = clientY - rect.top;
    value = (y / rect.height) * 100;
  }

  currentValue.value = Math.max(0, Math.min(100, value));
};

const handleMouseDown = e => {
  e.preventDefault();
  isDragging.value = true;
  updateValue(e.clientX, e.clientY);
};

const handleTouchStart = e => {
  e.preventDefault();
  isDragging.value = true;
  const touch = e.touches[0];
  updateValue(touch.clientX, touch.clientY);
};

const handleMouseMove = e => {
  if (!isDragging.value) return;
  e.preventDefault();
  updateValue(e.clientX, e.clientY);
};

const handleTouchMove = e => {
  if (!isDragging.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  updateValue(touch.clientX, touch.clientY);
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleTouchEnd = () => {
  isDragging.value = false;
};

onMounted(() => {
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", handleTouchEnd);
});

defineExpose({
  updateValue,
  currentValue
});
</script>

<style scoped>
.image-compare-container {
  position: relative;
  overflow: hidden;
  user-select: none;
  border-radius: 6px;
}

.image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.before-image {
  z-index: 1;
}

.after-image {
  z-index: 2;
}

.image-label {
  position: absolute;
  top: 16px;
  padding: 4px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  z-index: 10;
}

.before-label {
  left: 16px;
}

.after-label {
  right: 16px;
}

.compare-slider {
  position: absolute;
  z-index: 3;
  cursor: ew-resize;
  transform: translateX(-50%);
}

.image-compare-container.vertical .compare-slider {
  cursor: ns-resize;
  transform: translateY(-50%);
}

.slider-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.image-compare-container.horizontal .slider-line {
  width: 4px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.image-compare-container.vertical .slider-line {
  height: 4px;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.slider-handle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.3s;
}

.compare-slider.dragging .slider-handle,
.compare-slider:hover .slider-handle {
  background-color: var(--el-color-primary);
  color: white;
  transform: translate(-50%, -50%) scale(1.1);
}

.slider-handle .el-icon {
  font-size: 16px;
}

.image-compare-container.vertical .slider-handle {
  flex-direction: column;
}

/* 拖拽状态 */
.compare-slider.dragging {
  cursor: grabbing;
}

.compare-slider.dragging .slider-line {
  background-color: var(--el-color-primary);
}

/* 响应式 */
@media (max-width: 768px) {
  .slider-handle {
    width: 40px;
    height: 40px;
  }

  .slider-handle .el-icon {
    font-size: 14px;
  }

  .image-label {
    font-size: 12px;
    padding: 2px 8px;
    top: 8px;
  }

  .before-label {
    left: 8px;
  }

  .after-label {
    right: 8px;
  }
}
</style>
