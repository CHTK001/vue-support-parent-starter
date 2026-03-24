/**
 * 坐标面板组件
 * 用于显示鼠标在地图上的坐标信息
 */
<template>
  <div class="coordinate-panel" :class="positionClass">
    <div class="coordinate-header">
      <span class="coordinate-title">{{ $t('坐标信息') }}</span>
      <div class="coordinate-close" @click="handleClose">
        <IconifyIconOnline icon="ep:close" />
      </div>
    </div>
    <div class="coordinate-content">
      <div class="coordinate-item">
        <div class="coordinate-label">{{ $t('经度') }}:</div>
        <div class="coordinate-value">{{ formatCoordinate(coordinateInfo.longitude) }}</div>
      </div>
      <div class="coordinate-item">
        <div class="coordinate-label">{{ $t('纬度') }}:</div>
        <div class="coordinate-value">{{ formatCoordinate(coordinateInfo.latitude) }}</div>
      </div>
      <template v-if="showProjected">
        <div class="coordinate-item">
          <div class="coordinate-label">{{ $t('投影X') }}:</div>
          <div class="coordinate-value">{{ formatCoordinate(coordinateInfo.projectedX, 2) }}</div>
        </div>
        <div class="coordinate-item">
          <div class="coordinate-label">{{ $t('投影Y') }}:</div>
          <div class="coordinate-value">{{ formatCoordinate(coordinateInfo.projectedY, 2) }}</div>
        </div>
        <div class="coordinate-item coordinate-projection">
          <div class="coordinate-label">{{ $t('投影') }}:</div>
          <div class="coordinate-value">{{ coordinateInfo.projection }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { CoordinateInfo } from '../composables/CoordinateObject';

// 定义组件属性
const props = defineProps<{
  active: boolean;
  coordinateInfo: CoordinateInfo;
  showProjected?: boolean;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 计算坐标面板位置类
const positionClass = computed(() => {
  return `position-${props.coordinateInfo.position || 'bottom-right'}`;
});

// 格式化坐标值
const formatCoordinate = (value: number, fractionDigits: number = 6): string => {
  if (typeof value !== 'number') return '0';
  return value.toFixed(fractionDigits);
};

// 处理关闭按钮点击
const handleClose = () => {
  emit('close');
};
</script>

<style scoped lang="scss">
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.coordinate-panel {
  position: absolute;
  min-width: 200px;
  background-color: var(--el-bg-color-overlay);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  padding: 8px 12px;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-primary);
  z-index: 2000;
  border: 1px solid var(--el-border-color-light);
  backdrop-filter: blur(8px);
}

.coordinate-panel.position-top-left {
  top: 10px;
  left: 10px;
}

.coordinate-panel.position-top-right {
  top: 10px;
  right: 10px;
}

.coordinate-panel.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.coordinate-panel.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.coordinate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}

.coordinate-title {
  font-weight: bold;
  font-size: var(--el-font-size-base);
}

.coordinate-close {
  cursor: pointer;
  font-size: var(--el-font-size-medium);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--el-border-radius-base);
  transition: all 0.3s;
}

.coordinate-close:hover {
  background-color: var(--el-fill-color);
  color: var(--el-color-primary);
}

.coordinate-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coordinate-item {
  display: flex;
  align-items: center;
}

.coordinate-label {
  width: 40px;
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.coordinate-value {
  font-family: 'Courier New', monospace;
  color: var(--el-color-primary);
  font-weight: 500;
}

.coordinate-projection {
  margin-top: 2px;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}
</style> 

<script lang="ts">
export default {
  name: 'CoordinatePanel',
  components: {
    IconifyIconOnline
  }
};
</script> 