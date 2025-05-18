<!-- 
  MarkerPanel组件
  用于显示marker的内容，点击marker时展示
-->
<template>
  <div v-if="visible" class="marker-panel" :style="panelStyle">
    <div class="marker-panel-content">
      <div class="marker-panel-header">
        <span class="title">{{ title || '标记点信息' }}</span>
        <span class="close-btn" @click="handleClose">×</span>
      </div>
      <div class="marker-panel-body">
        <div v-if="clickContentTemplate" v-html="clickContentTemplate"></div>
        <div v-else-if="content" v-html="content"></div>
        <div v-else class="default-content">
          <div v-if="coords" class="coords-info">
            <div>经度: {{ coords[0].toFixed(6) }}</div>
            <div>纬度: {{ coords[1].toFixed(6) }}</div>
          </div>
          <div v-else>无详细信息</div>
        </div>
      </div>
    </div>
    <div class="marker-panel-arrow"></div>
  </div>
</template>

<script setup lang="ts">
//@ts-ignore
import { computed, ref, watch } from 'vue';

// 定义组件属性
const props = defineProps<{
  visible: boolean;
  position: {
    x: number;
    y: number;
  };
  title?: string;
  content?: string;
  clickContentTemplate?: string;
  coords?: [number, number]; // [lng, lat]
  offset?: {
    x: number;
    y: number;
  };
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 计算面板样式
const panelStyle = computed(() => {
  const { x, y } = props.position;
  const offsetX = props.offset?.x || 0;
  const offsetY = props.offset?.y || -10; // 默认向上偏移10px
  
  return {
    left: `${x + offsetX}px`,
    top: `${y + offsetY - 10}px`,
  };
});

// 处理关闭事件
const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.marker-panel {
  position: absolute;
  z-index: 1000;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  min-width: 200px;
  max-width: 300px;
}

.marker-panel-content {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.marker-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.marker-panel-header .title {
  font-weight: bold;
  color: #303133;
}

.marker-panel-header .close-btn {
  cursor: pointer;
  font-size: 18px;
  color: #909399;
}

.marker-panel-header .close-btn:hover {
  color: #409eff;
}

.marker-panel-body {
  padding: 12px;
  color: #606266;
}

.default-content {
  color: #909399;
}

.coords-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.marker-panel-arrow {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid white;
  width: 0;
  height: 0;
}
</style> 