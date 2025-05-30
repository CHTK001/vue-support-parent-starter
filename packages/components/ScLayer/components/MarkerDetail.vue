<template>
  <div class="marker-detail" v-if="visible" :style="detailStyle">
    <div class="marker-detail-arrow"></div>
    <div class="marker-detail-header">
      <div class="marker-detail-title">{{ title }}</div>
      <el-button class="close-button" type="text" @click="handleClose">
        <i class="el-icon-close"></i>
      </el-button>
    </div>
    <div class="marker-detail-content">
      <!-- 默认内容区域 -->
      <div v-if="!hasDefaultSlot" class="marker-detail-default-content">
        <div v-if="marker" class="marker-info">
          <div class="marker-position">
            <span class="label">位置:</span>
            <span class="value">{{ formatPosition(marker.position) }}</span>
          </div>
          <div v-if="marker.description" class="marker-description">
            <span class="label">描述:</span>
            <span class="value">{{ marker.description }}</span>
          </div>
          <div v-if="marker.data" class="marker-data">
            <span class="label">数据:</span>
            <pre class="value">{{ JSON.stringify(marker.data, null, 2) }}</pre>
          </div>
        </div>
        <div v-else class="no-marker-selected">
          未选择标记点
        </div>
      </div>
      
      <!-- 用户自定义内容插槽 -->
      <slot :marker="marker"></slot>
      
      <!-- 底部操作区域插槽 -->
      <div class="marker-detail-footer">
        <slot name="footer" :marker="marker" :close="handleClose"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted, defineExpose } from 'vue';
import type { MarkerOptions } from '../types';

const props = defineProps<{
  marker: MarkerOptions | null;
  visible: boolean;
  title?: string;
  markerPosition?: { x: number; y: number } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:visible', value: boolean): void;
}>();

// 获取插槽信息，检查是否有默认插槽
const slots = useSlots();
const hasDefaultSlot = computed(() => !!slots.default);

// 计算标题
const title = computed(() => {
  return props.title || (props.marker?.title || '标记点详情');
});

// 计算详情面板样式
const detailStyle = computed(() => {
  if (props.markerPosition) {
    // 在marker上方显示，并留出一些空间给箭头
    return {
      position: 'absolute' as const,
      left: `${props.markerPosition.x - 160}px`, // 居中显示，宽度320px的一半
      top: `${props.markerPosition.y - 34}px`, // 向上偏移，避免遮挡marker，再往上移动4px
      transform: 'translateY(-100%)' as const, // 向上移动自身高度
    };
  }
  // 默认位置在右上角
  return {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
  };
});

// 格式化位置信息
const formatPosition = (position: [number, number] | undefined) => {
  if (!position || !Array.isArray(position) || position.length !== 2) {
    return '未知位置';
  }
  return `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`;
};

// 关闭详情面板
const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

// 暴露更新位置的方法，供父组件调用
defineExpose({
  // 可以添加其他需要暴露的方法
});
</script>

<style scoped>
.marker-detail {
  width: 320px;
  max-height: calc(100% - 20px);
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  transition: all 0.3s;
}

.marker-detail-arrow {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #fff;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

.marker-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.marker-detail-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.close-button {
  padding: 0;
  font-size: 18px;
}

.marker-detail-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.marker-detail-default-content {
  min-height: 100px;
}

.marker-info .label {
  font-weight: bold;
  color: #606266;
  margin-right: 8px;
}

.marker-info .value {
  color: #303133;
}

.marker-position, .marker-description, .marker-data {
  margin-bottom: 12px;
}

.marker-data pre {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  overflow: auto;
  margin: 8px 0 0 0;
}

.no-marker-selected {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.marker-detail-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style> 