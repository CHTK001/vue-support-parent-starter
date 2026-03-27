<template>
  <div class="sc-select-position-layout">
    <!-- 9 格模式：3x3，8 个可选位置（中心不可选） -->
    <div v-if="mode === '9'" class="position-grid grid-9">
      <div class="position-cell" :class="{ active: modelValue === 'top-left', 'is-disabled': disabled }" title="左上" @click="!disabled && handleSelect('top-left')" />
      <div class="position-cell" :class="{ active: modelValue === 'top-center', 'is-disabled': disabled }" title="中上" @click="!disabled && handleSelect('top-center')" />
      <div class="position-cell" :class="{ active: modelValue === 'top-right', 'is-disabled': disabled }" title="右上" @click="!disabled && handleSelect('top-right')" />
      <div class="position-cell" :class="{ active: modelValue === 'left-center', 'is-disabled': disabled }" title="左中" @click="!disabled && handleSelect('left-center')" />
      <div class="position-cell center-disabled" />
      <div class="position-cell" :class="{ active: modelValue === 'right-center', 'is-disabled': disabled }" title="右中" @click="!disabled && handleSelect('right-center')" />
      <div class="position-cell" :class="{ active: modelValue === 'bottom-left', 'is-disabled': disabled }" title="左下" @click="!disabled && handleSelect('bottom-left')" />
      <div class="position-cell" :class="{ active: modelValue === 'bottom-center', 'is-disabled': disabled }" title="中下" @click="!disabled && handleSelect('bottom-center')" />
      <div class="position-cell" :class="{ active: modelValue === 'bottom-right', 'is-disabled': disabled }" title="右下" @click="!disabled && handleSelect('bottom-right')" />
      <div class="screen-content-mock" />
    </div>

    <!-- 4 格模式：2x2，仅四角 -->
    <div v-else class="position-grid grid-4">
      <div class="position-cell" :class="{ active: modelValue === 'top-left', 'is-disabled': disabled }" title="左上" @click="!disabled && handleSelect('top-left')" />
      <div class="position-cell" :class="{ active: modelValue === 'top-right', 'is-disabled': disabled }" title="右上" @click="!disabled && handleSelect('top-right')" />
      <div class="position-cell" :class="{ active: modelValue === 'bottom-left', 'is-disabled': disabled }" title="左下" @click="!disabled && handleSelect('bottom-left')" />
      <div class="position-cell" :class="{ active: modelValue === 'bottom-right', 'is-disabled': disabled }" title="右下" @click="!disabled && handleSelect('bottom-right')" />
      <div class="screen-content-mock" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  /** 布局模式：9=3x3九格（含四边中点），4=2x2四角 */
  mode: {
    type: String as () => "4" | "9",
    default: "9"
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const handleSelect = (value: string) => {
  if (props.disabled) return;
  emit("update:modelValue", value);
  emit("change", value);
};
</script>

<style scoped lang="scss">
.sc-select-position-layout {
  display: flex;
  justify-content: center;
  padding: 4px;

  .position-grid {
    gap: 4px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 4px;
    position: relative;

    /* 9 格：3x3 */
    &.grid-9 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
      width: 90px;
      height: 70px;
    }

    /* 4 格：2x2 */
    &.grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      width: 64px;
      height: 52px;
    }

    .screen-content-mock {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      height: 50%;
      background: var(--el-border-color-lighter);
      border-radius: 2px;
      pointer-events: none;
      opacity: 0.5;
    }

    .position-cell {
      background: var(--el-fill-color-light);
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 1;

      &:hover {
        background: var(--el-color-primary-light-8);
      }

      &.active {
        background: var(--el-color-primary);
        box-shadow: 0 0 4px var(--el-color-primary-light-5);
      }

      &.is-disabled {
        cursor: not-allowed;
        opacity: 0.6;

        &:hover {
          background: var(--el-fill-color-light);
        }

        &.active {
          background: var(--el-fill-color-darker);
        }
      }

      &.center-disabled {
        background: transparent;
        cursor: default;
        &:hover {
          background: transparent;
        }
      }
    }
  }
}
</style>
