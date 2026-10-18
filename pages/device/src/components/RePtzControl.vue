<template>
  <div class="ptz">
    <!-- 方向控制 -->
    <section class="ptz-panel">
      <header class="ptz-panel__head">
        <span class="ptz-panel__bar" />
        <span>云台方向</span>
        <span class="ptz-panel__hint">按住方向键持续转动，松开或点中心停止</span>
      </header>

      <div class="ptz-pad">
        <span />
        <button
          class="ptz-pad__btn"
          type="button"
          title="上"
          @mousedown="emit('move', 'UP')"
          @mouseup="emit('move', 'STOP')"
          @mouseleave="emit('move', 'STOP')"
        >
          <el-icon><Top /></el-icon>
        </button>
        <span />

        <button
          class="ptz-pad__btn"
          type="button"
          title="左"
          @mousedown="emit('move', 'LEFT')"
          @mouseup="emit('move', 'STOP')"
          @mouseleave="emit('move', 'STOP')"
        >
          <el-icon><Back /></el-icon>
        </button>
        <button class="ptz-pad__btn ptz-pad__btn--stop" type="button" title="停止" @click="emit('move', 'STOP')">
          <span class="ptz-pad__stop-dot" />
        </button>
        <button
          class="ptz-pad__btn"
          type="button"
          title="右"
          @mousedown="emit('move', 'RIGHT')"
          @mouseup="emit('move', 'STOP')"
          @mouseleave="emit('move', 'STOP')"
        >
          <el-icon><Right /></el-icon>
        </button>

        <span />
        <button
          class="ptz-pad__btn"
          type="button"
          title="下"
          @mousedown="emit('move', 'DOWN')"
          @mouseup="emit('move', 'STOP')"
          @mouseleave="emit('move', 'STOP')"
        >
          <el-icon><Bottom /></el-icon>
        </button>
        <span />
      </div>
    </section>

    <!-- 变倍 / 变焦 -->
    <section class="ptz-panel">
      <header class="ptz-panel__head">
        <span class="ptz-panel__bar" />
        <span>镜头</span>
      </header>
      <div class="ptz-sliders">
        <label class="ptz-slider">
          <span class="ptz-slider__label">变倍</span>
          <el-slider :model-value="zoom" :min="0" :max="100" @input="(v: number) => emit('zoom', v)" />
          <span class="ptz-slider__value">{{ zoom ?? 0 }}</span>
        </label>
        <label class="ptz-slider">
          <span class="ptz-slider__label">变焦</span>
          <el-slider :model-value="focus" :min="0" :max="100" @input="(v: number) => emit('focus', v)" />
          <span class="ptz-slider__value">{{ focus ?? 0 }}</span>
        </label>
      </div>
    </section>

    <!-- 预置位 -->
    <section class="ptz-panel">
      <header class="ptz-panel__head">
        <span class="ptz-panel__bar" />
        <span>预置位</span>
        <span class="ptz-panel__count">{{ presets.length }}</span>
        <div class="ptz-panel__ops">
          <ReButton icon="Plus" :show-text="true" type="primary" @click="emit('addPreset')">添加预置位</ReButton>
        </div>
      </header>

      <div v-if="presets.length" class="ptz-presets">
        <div v-for="p in presets" :key="p.devicePresetNo" class="ptz-presets__item">
          <span class="ptz-presets__no">#{{ p.devicePresetNo }}</span>
          <span class="ptz-presets__name">{{ p.devicePresetName || '未命名预置位' }}</span>
          <div class="ptz-presets__ops">
            <ReButton icon="Position" layout="square" tip="调用预置位" @click="emit('callPreset', p.devicePresetNo)" />
            <ReButton icon="Delete" layout="square" tip="删除预置位" @click="emit('deletePreset', p.devicePresetNo)" />
          </div>
        </div>
      </div>
      <ReEmpty v-else description="暂无预置位" :image-size="62" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { Back, Bottom, Top, Right } from '@element-plus/icons-vue'
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import type { Preset } from '@/types/device'

defineProps<{
  presets: Preset[]
  zoom?: number
  focus?: number
}>()

const emit = defineEmits<{
  (e: 'move', cmd: string): void
  (e: 'zoom', v: number): void
  (e: 'focus', v: number): void
  (e: 'addPreset'): void
  (e: 'callPreset', id: number): void
  (e: 'deletePreset', id: number): void
}>()
</script>

<style scoped>
.ptz {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ptz-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.ptz-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ptz-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.ptz-panel__hint,
.ptz-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.ptz-panel__ops {
  margin-left: auto;
}

/* 方向键盘 */
.ptz-pad {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  grid-template-rows: repeat(3, 56px);
  gap: 10px;
  justify-content: center;
}
.ptz-pad__btn {
  display: grid;
  place-items: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-fill-color-light, var(--el-bg-color));
  color: var(--el-text-color-primary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ptz-pad__btn:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.ptz-pad__btn:active {
  transform: scale(0.96);
}
.ptz-pad__btn--stop {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}
.ptz-pad__stop-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--el-color-danger);
}

/* 滑杆 */
.ptz-sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ptz-slider {
  display: grid;
  grid-template-columns: 44px 1fr 40px;
  align-items: center;
  gap: 12px;
}
.ptz-slider__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ptz-slider__value {
  font-size: 13px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* 预置位 */
.ptz-presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ptz-presets__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--el-radius-base, 10px);
  background: color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
}
.ptz-presets__no {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ptz-presets__name {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}
.ptz-presets__ops {
  margin-left: auto;
  display: inline-flex;
  gap: 6px;
}
</style>
