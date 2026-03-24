<template>
  <div class="layer-panel" :class="[`position-${position}`, { active }]">
    <div class="layer-panel-arrow" :class="getArrowPositionClass()"></div>
    <div class="layer-panel-content">
      <div class="layer-list">
        <div 
          v-for="(layer, key) in availableLayers" 
          :key="key" 
          class="layer-item"
          :class="{ active: currentMapType === mapType && currentMapTile === key }"
          :data-key="key"
          @click="selectLayer(key)"
        >
          <div class="layer-preview">
            <img v-if="layer?.image" :src="layer.image" alt="图层图标" />
            <div v-else class="layer-preview-placeholder"></div>
            <div v-if="currentMapType === mapType && currentMapTile === key" class="layer-selected-indicator">
              <IconifyIconOnline icon="ep:check" style="color: white; font-size: 14px;" />
            </div>
            <div class="layer-name" :class="{ active: currentMapType === mapType && currentMapTile === key }">
              {{ getLayerDisplayName(key) }}
            </div>
          </div>
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
import { IconifyIconOnline } from "@repo/components/ReIcon";

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
  // 如果点击的是当前激活的图层，不做任何操作
  if (layerKey === props.mapTile) {
    console.log('已选择当前图层，无需切换');
    return;
  }
  
  // 将字符串转换为MapTile枚举值
  const mapTile = layerKey as MapTile;
  
  // 记录已选择的图层，用于UI反馈
  const selectedElement = document.querySelector(`.layer-item.active`);
  const newElement = document.querySelector(`.layer-item[data-key="${layerKey}"]`);
  
  // 移除旧选择的激活样式，添加到新选择的元素
  if (selectedElement) {
    selectedElement.classList.remove('active');
  }
  
  if (newElement) {
    newElement.classList.add('active');
  }
  
  // 发出图层变更事件
  emit('layer-change', {
    mapType: props.mapType,
    mapTile: mapTile
  });
};

// 获取图层预览图
const getLayerPreviewImage = (layerKey: string): string => {
  // 根据不同类型返回相应地图类型的预览图
  // 使用占位图像，实际项目中应替换为真实的预览图
  const baseUrl = 'data:image/svg+xml;base64,';
  const previewImages = {
    'normal': 'http://myui.vtj.pro/my/assets/img/ChinaOnlineCommunity.df7d8c00.png',
    'satellite':'https://ts1.tc.mm.bing.net/th/id/OIP-C.RrTFSOvnk9EVe1k7zxzSbAHaGQ?rs=1&pid=ImgDetMain',
    'grey': baseUrl + 'PHN2ZyB3aWR0aD0iMjA3IiBoZWlnaHQ9IjEzNyIgdmlld0JveD0iMCAwIDIwNyAxMzciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwNyIgaGVpZ2h0PSIxMzciIGZpbGw9IiNlMWUxZTEiLz48cGF0aCBkPSJNMCAwSDIwN1YxMzdIMFYwWiIgZmlsbD0iI2UxZTFlMSIvPjxwYXRoIGQ9Ik01MCAzMEgxMDBWNjBINTBWMzBaIiBmaWxsPSIjZDBkMGQwIi8+PHBhdGggZD0iTTEyMCA0MEgxNjBWOTBIMTIwVjQwWiIgZmlsbD0iI2QwZDBkMCIvPjxwYXRoIGQ9Ik0yMCA3MEg3MFYxMDBIMjBWNzBaIiBmaWxsPSIjZDBkMGQwIi8+PC9zdmc+',
    'dark': baseUrl + 'PHN2ZyB3aWR0aD0iMjA3IiBoZWlnaHQ9IjEzNyIgdmlld0JveD0iMCAwIDIwNyAxMzciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwNyIgaGVpZ2h0PSIxMzciIGZpbGw9IiMyYTJhMmEiLz48cGF0aCBkPSJNMCAwSDIwN1YxMzdIMFYwWiIgZmlsbD0iIzJhMmEyYSIvPjxwYXRoIGQ9Ik01MCAzMEgxMDBWNjBINTBWMzBaIiBmaWxsPSIjM2EzYTNhIi8+PHBhdGggZD0iTTEyMCA0MEgxNjBWOTBIMTIwVjQwWiIgZmlsbD0iIzNhM2EzYSIvPjxwYXRoIGQ9Ik0yMCA3MEg3MFYxMDBIMjBWNzBaIiBmaWxsPSIjM2EzYTNhIi8+PC9zdmc+',
    'blue': baseUrl + 'PHN2ZyB3aWR0aD0iMjA3IiBoZWlnaHQ9IjEzNyIgdmlld0JveD0iMCAwIDIwNyAxMzciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwNyIgaGVpZ2h0PSIxMzciIGZpbGw9IiMxMjIwMzUiLz48cGF0aCBkPSJNMCAwSDIwN1YxMzdIMFYwWiIgZmlsbD0iIzEyMjAzNSIvPjxwYXRoIGQ9Ik01MCAzMEgxMDBWNjBINTBWMzBaIiBmaWxsPSIjMWQzMjUwIi8+PHBhdGggZD0iTTEyMCA0MEgxNjBWOTBIMTIwVjQwWiIgZmlsbD0iIzFkMzI1MCIvPjxwYXRoIGQ9Ik0yMCA3MEg3MFYxMDBIMjBWNzBaIiBmaWxsPSIjMWQzMjUwIi8+PC9zdmc+',
    'hybrid': baseUrl + 'PHN2ZyB3aWR0aD0iMjA3IiBoZWlnaHQ9IjEzNyIgdmlld0JveD0iMCAwIDIwNyAxMzciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwNyIgaGVpZ2h0PSIxMzciIGZpbGw9IiMzMDQ0MzAiLz48cGF0aCBkPSJNMCAwSDIwN1YxMzdIMFYwWiIgZmlsbD0iIzMwNDQzMCIvPjxwYXRoIGQ9Ik0yMCAyMEg4MFY2MEgyMFYyMFoiIGZpbGw9IiMxZDMyMWQiLz48cGF0aCBkPSJNMTIwIDMwSDE4MFY4MEgxMjBWMzBaIiBmaWxsPSIjMWQzMjFkIi8+PHBhdGggZD0iTTUwIDcwSDEyMFYxMjBINTBWNzBaIiBmaWxsPSIjMWQzMjFkIi8+PHBhdGggZD0iTTAgMEgyMDdWNTBIMFYwWiIgZmlsbD0iIzMwNDQzMCIgZmlsbC1vcGFjaXR5PSIwLjMiLz48cGF0aCBkPSJNNjAgMEgxNDBWMTM3SDYwVjBaIiBmaWxsPSIjZTZlNmU2IiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg=='
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

// 获取图层显示名称
const getLayerDisplayName = (layerKey: string): string => {
  const nameMap = {
    'normal': '彩色版',
    'satellite': '卫星版',
    'hybrid': '混合版',
    'en': '彩色英文版',
    'dark': '暗色版',
    'light': '亮色版',
    'grey': '灰色版',
    'blue': '蓝黑版'
  };
  
  return nameMap[layerKey] || layerKey;
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

// 定义变量
$layer-panel-bg: var(--el-bg-color-overlay);
$layer-panel-shadow: var(--el-box-shadow-dark);
$layer-panel-border: 1px solid var(--el-border-color);
$layer-panel-border-radius: 12px;
$layer-item-border-radius: 8px;
$layer-item-active-bg: var(--el-color-primary);
$layer-item-active-border: var(--el-color-primary);
$layer-item-active-shadow: var(--el-box-shadow);
$layer-item-hover-shadow: var(--el-box-shadow-light);
$layer-item-border: 1px solid var(--el-border-color-lighter);
$text-color-primary: var(--el-text-color-primary);
$text-color-secondary: var(--el-text-color-secondary);

.layer-panel {
  position: absolute;
  background-color: $layer-panel-bg;
  backdrop-filter: blur(12px);
  border: $layer-panel-border;
  border-radius: $layer-panel-border-radius;
  box-shadow: $layer-panel-shadow;
  padding: 16px;
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
    background-color: $layer-panel-bg;
    border-left: $layer-panel-border;
    border-top: $layer-panel-border;
    transform: rotate(45deg);
    z-index: 3001;
    box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.1);
  }

  .arrow-top-left {
    top: -8px;
    left: 50px;
    border-bottom: none;
    border-right: none;
  }

  .arrow-top-right {
    top: -8px;
    right: 50px;
    border-bottom: none;
    border-right: none;
  }

  .arrow-bottom-left {
    bottom: -8px;
    left: 50px;
    border-top: none;
    border-left: none;
    border-bottom: $layer-panel-border;
    border-right: $layer-panel-border;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  }

  .arrow-bottom-right {
    bottom: -8px;
    right: 50px;
    border-top: none;
    border-left: none;
    border-bottom: $layer-panel-border;
    border-right: $layer-panel-border;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    transform: scale(1);
    opacity: 1;
    pointer-events: auto;
  }
  
  // 按位置调整面板显示位置，增加距离防止与按钮重叠
  &.position-top-left {
    top: 60px;
    left: 20px;
  }
  
  &.position-top-right {
    top: 60px;
    right: 20px;
  }
  
  &.position-bottom-left {
    bottom: 60px;
    left: 20px;
  }
  
  &.position-bottom-right {
    bottom: 60px;
    right: 20px;
  }
  
  .layer-panel-content {
    padding: 0;
    max-height: 550px;
    overflow-y: auto;
    
    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 3px;
      &:hover {
        background: var(--el-border-color-dark);
      }
    }
    
    .layer-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
      justify-content: center;
      
      .layer-item {
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        border-radius: $layer-item-border-radius;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: $layer-item-hover-shadow;
          
          .layer-preview {
            border-color: var(--el-border-color-hover);
          }
        }
        
        &.active {
          .layer-preview {
            border: 2px solid $layer-item-active-border;
            box-shadow: $layer-item-active-shadow;
            
            .layer-selected-indicator {
              display: flex;
              animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
          }
          
          .layer-name {
            background-color: $layer-item-active-bg;
            color: var(--el-color-white);
            backdrop-filter: blur(4px);
          }
        }
        
        .layer-preview {
          width: 160px;
          height: 105px;
          border-radius: $layer-item-border-radius;
          overflow: hidden;
          border: $layer-item-border;
          transition: all 0.3s ease;
          position: relative;
          background-color: var(--el-fill-color-darker);
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.5s ease;
            opacity: 0.8;
          }
          
          &:hover img {
            transform: scale(1.1);
            opacity: 1;
          }
          
          .layer-preview-placeholder {
            width: 100%;
            height: 100%;
            background-color: var(--el-fill-color-darker);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-placeholder);
            font-size: 24px;
          }
          
          .layer-selected-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            background-color: $layer-item-active-border;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: var(--el-box-shadow-light);
            z-index: 10;
            
            svg {
              width: 14px;
              height: 14px;
              stroke: var(--el-color-white);
              stroke-width: 3;
            }
          }
          
          .layer-name {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: $text-color-primary;
            background: linear-gradient(to top, var(--el-overlay-color-lighter) 0%, transparent 100%);
            text-align: left;
            transition: all 0.3s ease;
            text-shadow: 0 1px 2px var(--el-color-black);
            
            &.active {
              background-color: $layer-item-active-bg;
              color: var(--el-color-white);
              text-align: center;
            }
          }
        }
      }
    }
  }
}

@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style> 