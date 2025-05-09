<template>
  <div class="layer-panel" :class="[`position-${position}`, { active }]">
    <div class="layer-panel-arrow" :class="getArrowPositionClass()"></div>
    <div class="layer-panel-content">
      <div class="layer-grid">
        <div 
          v-for="(layer, key) in availableLayers" 
          :key="key" 
          class="layer-item"
          :class="{ active: currentMapType === mapType && currentMapTile === key }"
          @click="selectLayer(key)"
        >
          <div class="layer-icon">
            <img v-if="layer?.image" :src="layer.image" alt="图层图标" />
            <div v-else class="layer-icon-placeholder"></div>
            <div v-if="currentMapType === mapType && currentMapTile === key" class="layer-selected-indicator">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L9 12L13 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="layer-name">{{ layer.name }}</div>
          <div v-if="layer.description" class="layer-description">{{ layer.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LayerPanel'
};
</script>

<script setup lang="ts">
import { MapTile, MapType } from '../types';
import { computed } from 'vue';
import { DEFAULT_MAP_CONFIG, MapUrlConfig } from '../types/map';

// 定义组件属性
const props = defineProps<{
  active: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  mapType: MapType;
  mapTile: MapTile;
  mapConfig: Record<MapType, Record<string, MapUrlConfig>>;
}>();

// 定义事件
const emit = defineEmits(['close', 'layer-change']);

// 当前地图类型和图层
const currentMapType = computed(() => props.mapType);
const currentMapTile = computed(() => props.mapTile);

// 根据面板位置确定箭头位置类名
const getArrowPositionClass = () => {
  switch(props.position) {
    case 'top-left': return 'arrow-top-left';
    case 'top-right': return 'arrow-top-right';
    case 'bottom-left': return 'arrow-bottom-left';
    case 'bottom-right': return 'arrow-bottom-right';
    default: return 'arrow-top-left';
  }
};

// 可用图层
const availableLayers = computed(() => {
  const mapConfig = props.mapConfig[props.mapType] || {};
  
  // 为每个图层添加预览图和描述信息
  const layersWithMetadata: Record<string, any> = {};
  
  Object.keys(mapConfig).forEach(key => {
    layersWithMetadata[key] = {
      ...mapConfig[key],
      image: getLayerPreviewImage(key),
      description: getLayerDescription(key)
    };
  });
  
  return layersWithMetadata;
});

// 选择图层
const selectLayer = (layerKey: string) => {
  if (layerKey === props.mapTile) return;
  
  // 将字符串转换为MapTile枚举值
  const mapTile = layerKey as MapTile;
  
  emit('layer-change', {
    mapType: props.mapType,
    mapTile: mapTile
  });
};

// 获取图层预览图
const getLayerPreviewImage = (layerKey: string): string => {
  // 这里可以根据图层类型返回不同的预览图
  const previewImages = {
    'normal': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNlNmU2ZTYiLz48cGF0aCBkPSJNMTAgMTBIMjBWMjBIMTBWMTBaIiBmaWxsPSIjZjVmNWY1Ii8+PHBhdGggZD0iTTMwIDEwSDQwVjIwSDMwVjEwWiIgZmlsbD0iI2Y1ZjVmNSIvPjxwYXRoIGQ9Ik01MCAxMEg2MFYyMEg1MFYxMFoiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNMjAgMjBIMzBWMzBIMjBWMjBaIiBmaWxsPSIjZjVmNWY1Ii8+PHBhdGggZD0iTTQwIDIwSDUwVjMwSDQwVjIwWiIgZmlsbD0iI2Y1ZjVmNSIvPjxwYXRoIGQ9Ik0xMCAzMEgyMFY0MEgxMFYzMFoiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNMzAgMzBINDBWNDBIMzBWMzBaIiBmaWxsPSIjZjVmNWY1Ii8+PHBhdGggZD0iTTUwIDMwSDYwVjQwSDUwVjMwWiIgZmlsbD0iI2Y1ZjVmNSIvPjxwYXRoIGQ9Ik0yMCA0MEgzMFY1MEgyMFY0MFoiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNNDAgNDBINTBWNTBINDBWNDBaIiBmaWxsPSIjZjVmNWY1Ii8+PHBhdGggZD0iTTEwIDUwSDIwVjYwSDEwVjUwWiIgZmlsbD0iI2Y1ZjVmNSIvPjxwYXRoIGQ9Ik0zMCA1MEg0MFY2MEgzMFY1MFoiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNNTAgNTBINjBWNjBINTBWNTBaIiBmaWxsPSIjZjVmNWY1Ii8+PC9zdmc+',
    'satellite': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMzMzMzMzMiLz48cGF0aCBkPSJNMCAwSDYwVjYwSDBWMFoiIGZpbGw9IiMxNTU3MjQiLz48cGF0aCBkPSJNMTAgMTBIMjBWMjBIMTBWMTBaIiBmaWxsPSIjMmQ4YTM5Ii8+PHBhdGggZD0iTTMwIDEwSDQwVjIwSDMwVjEwWiIgZmlsbD0iIzM5OWI0NiIvPjxwYXRoIGQ9Ik01MCAxMEg2MFYyMEg1MFYxMFoiIGZpbGw9IiMzOTliNDYiLz48cGF0aCBkPSJNMjAgMjBIMzBWMzBIMjBWMjBaIiBmaWxsPSIjMTU1NzI0Ii8+PHBhdGggZD0iTTQwIDIwSDUwVjMwSDQwVjIwWiIgZmlsbD0iIzJkOGEzOSIvPjxwYXRoIGQ9Ik0xMCAzMEgyMFY0MEgxMFYzMFoiIGZpbGw9IiMzOTliNDYiLz48cGF0aCBkPSJNMzAgMzBINDBWNDBIMzBWMzBaIiBmaWxsPSIjMzk5YjQ2Ii8+PHBhdGggZD0iTTUwIDMwSDYwVjQwSDUwVjMwWiIgZmlsbD0iIzE1NTcyNCIvPjxwYXRoIGQ9Ik0yMCA0MEgzMFY1MEgyMFY0MFoiIGZpbGw9IiMyZDhhMzkiLz48cGF0aCBkPSJNNDAgNDBINTBWNTBINDBWNDBaIiBmaWxsPSIjMzk5YjQ2Ii8+PHBhdGggZD0iTTEwIDUwSDIwVjYwSDEwVjUwWiIgZmlsbD0iIzE1NTcyNCIvPjxwYXRoIGQ9Ik0zMCA1MEg0MFY2MEgzMFY1MFoiIGZpbGw9IiMxNTU3MjQiLz48cGF0aCBkPSJNNTAgNTBINjBWNjBINTBWNTBaIiBmaWxsPSIjMmQ4YTM5Ii8+PC9zdmc+',
    'hybrid': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMxNTU3MjQiLz48cGF0aCBkPSJNMTUgMEg0NVY2MEgxNVYwWiIgZmlsbD0iIzJkOGEzOSIgZmlsbC1vcGFjaXR5PSIwLjUiLz48cGF0aCBkPSJNMCAxNUg2MFY0NUgwVjE1WiIgZmlsbD0iIzM5OWI0NiIgZmlsbC1vcGFjaXR5PSIwLjMiLz48cGF0aCBkPSJNMjAgMEg0MFY2MEgyMFYwWiIgZmlsbD0iI2U2ZTZlNiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48cGF0aCBkPSJNMCAyMEg2MFY0MEgwVjIwWiIgZmlsbD0iI2U2ZTZlNiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4='
  };
  
  return previewImages[layerKey] || '';
};

// 获取图层描述
const getLayerDescription = (layerKey: string): string => {
  const descriptions = {
    'normal': '标准地图，显示街道和基础地理信息',
    'satellite': '卫星影像图，显示真实地貌',
    'hybrid': '混合地图，卫星影像与标注结合'
  };
  
  return descriptions[layerKey] || '';
};
</script>

<style lang="scss" scoped>
// 定义变量
$layer-panel-bg: #fff;
$layer-panel-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
$layer-panel-border-radius: 8px;
$layer-item-border-radius: 6px;
$layer-item-active-bg: #1890ff;
$layer-item-active-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
$layer-item-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
$layer-item-border: 1px solid #eee;

.layer-panel {
  position: absolute;
  background-color: $layer-panel-bg;
  border-radius: $layer-panel-border-radius;
  box-shadow: $layer-panel-shadow;
  padding: 12px;
  z-index: 3000;
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 添加箭头样式 */
  .layer-panel-arrow {
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: #fff;
    transform: rotate(45deg);
    z-index: 3001;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }

  .arrow-top-left {
    top: -7px;
    left: 50px;
  }

  .arrow-top-right {
    top: -7px;
    right: 50px;
  }

  .arrow-bottom-left {
    bottom: -7px;
    left: 50px;
  }

  .arrow-bottom-right {
    bottom: -7px;
    right: 50px;
  }
  
  &.active {
    transform: scale(1);
    opacity: 1;
    pointer-events: auto;
  }
  
  // 按位置调整面板显示位置，增加距离防止与按钮重叠
  &.position-top-left {
    top: 50px; // 增加距离
    left: 15px;
  }
  
  &.position-top-right {
    top: 50px; // 增加距离
    right: 15px;
  }
  
  &.position-bottom-left {
    bottom: 50px; // 增加距离
    left: 15px;
  }
  
  &.position-bottom-right {
    bottom: 50px; // 增加距离
    right: 15px;
  }
  
  .layer-panel-content {
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
    
    .layer-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 310px;
      
      .layer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border-radius: $layer-item-border-radius;
        cursor: pointer;
        transition: all 0.25s ease;
        border: $layer-item-border;
        position: relative;
        overflow: hidden;
        
        &:hover {
          transform: translateY(-3px);
          box-shadow: $layer-item-hover-shadow;
          border-color: #ddd;
        }
        
        &.active {
          background-color: #f0f9ff;
          border-color: $layer-item-active-bg;
          box-shadow: $layer-item-active-shadow;
          
          .layer-name {
            color: $layer-item-active-bg;
            font-weight: 600;
          }
          
          .layer-icon {
            border-color: $layer-item-active-bg;
            
            &::after {
              opacity: 1;
            }
          }
        }
        
        .layer-icon {
          width: 80px;
          height: 56px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
          border: 2px solid transparent;
          transition: all 0.25s ease;
          position: relative;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.25s ease;
          }
          
          .layer-icon-placeholder {
            width: 100%;
            height: 100%;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 24px;
          }
          
          // 选中标记
          .layer-selected-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background-color: $layer-item-active-bg;
            border-top-left-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            svg {
              width: 16px;
              height: 16px;
            }
          }
        }
        
        .layer-name {
          font-weight: 500;
          font-size: 13px;
          color: #333;
          text-align: center;
          margin: 4px 0 2px;
          transition: color 0.25s ease;
        }
        
        .layer-description {
          font-size: 11px;
          color: #999;
          text-align: center;
          margin-top: 2px;
          display: none; // 默认隐藏描述，避免占用太多空间
        }
      }
    }
  }
}
</style> 