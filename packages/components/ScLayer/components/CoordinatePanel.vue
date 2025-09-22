/**
 * 坐标面板组件
 * 用于显示鼠标在地图上的坐标信息
 */
<template>
  <div class="coordinate-panel" :class="positionClass">
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

<style scoped>
.coordinate-panel {
  position: absolute;
  min-width: 200px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  z-index: 2000;
  border: 1px solid #e8e8e8;
  backdrop-filter: blur(4px);
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
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.coordinate-title {
  font-weight: bold;
  font-size: 14px;
}

.coordinate-close {
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: #999;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 10px;
  }

.coordinate-close:hover {
  background-color: #f0f0f0;
  color: var(--el-text-color-primary);
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
  color: rgba(24, 144, 255, 0.9);
  font-weight: 500;
}

.coordinate-projection {
  margin-top: 2px;
  font-size: 11px;
  color: #999;
}
</style> 

<script lang="ts">
export default {
  name: 'CoordinatePanel'
};
</script> 