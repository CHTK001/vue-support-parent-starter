<template>
  <div class="layer-panel" :class="[`position-${position}`, { active }]">
    <div class="layer-panel-arrow" :class="getArrowPositionClass()"></div>
    <div class="layer-panel-content">
      <div class="layer-list">
        <div v-for="(layer, key) in availableLayers" :key="key" class="layer-item"
          :class="{ active: currentMapType === mapType && currentMapTile === key }" :data-key="key"
          @click="selectLayer(key)">
          <div class="layer-preview">
            <img v-if="layer?.image" :src="layer.image" alt="图层图标" />
            <div v-else class="layer-preview-placeholder"></div>
            <div v-if="currentMapType === mapType && currentMapTile === key" class="layer-selected-indicator">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L9 12L13 8" stroke="white" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
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
  switch (props.position) {
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
    'satellite': 'https://ts1.tc.mm.bing.net/th/id/OIP-C.RrTFSOvnk9EVe1k7zxzSbAHaGQ?rs=1&pid=ImgDetMain',
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
// 定义变量
$layer-panel-bg: #fff;
$layer-panel-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
$layer-panel-border-radius: 8px;
$layer-item-border-radius: 4px;
$layer-item-active-bg: #1890ff;
$layer-item-active-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
$layer-item-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
$layer-item-border: 1px solid #eaeaea;

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
    max-height: 550px;
    overflow-y: auto;

    .layer-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      width: 100%;
      justify-content: center;

      .layer-item {
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;

        &:hover {
          transform: translateY(-2px);
        }

        &.active {
          .layer-preview {
            border: 2px solid $layer-item-active-bg;
            box-shadow: $layer-item-active-shadow;

            .layer-selected-indicator {
              display: flex;
            }
          }
        }

        .layer-preview {
          width: 160px;
          height: 105px;
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid #eaeaea;
          transition: all 0.25s ease;
          position: relative;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.25s ease;
          }

          .layer-preview-placeholder {
            width: 100%;
            height: 100%;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 24px;
          }

          .layer-selected-indicator {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 18px;
            height: 18px;
            background-color: $layer-item-active-bg;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;

            svg {
              width: 14px;
              height: 14px;
            }
          }

          .layer-name {
            position: absolute;
            right: 0;
            bottom: 0;
            padding: 4px 6px;
            border-radius: 6px 0 0 0;
            font-size: 12px;
            color: #333;
            background-color: rgba(255, 255, 255, 0.8);
            text-align: right;
            transition: all 0.25s ease;

            &.active {
              background-color: $layer-item-active-bg;
              color: white;
            }
          }
        }
      }
    }
  }
}
</style>