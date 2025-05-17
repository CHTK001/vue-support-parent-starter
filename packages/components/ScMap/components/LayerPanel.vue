/**
 * 图层面板组件
 * @description 用于切换底图类型
 */
<template>
  <div class="layer-panel" :class="[positionClass, { active }]">
    <div class="layer-panel-header">
      <div class="layer-panel-title">图层设置</div>
      <div class="layer-panel-actions">
        <button class="close-btn" @click="handleClose" title="关闭">
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path
              d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="layer-panel-content">
      <div class="layer-section">
        <div class="section-title">地图类型</div>
        <div class="section-content">
        <div 
            v-for="(item, key) in mapTypes" 
          :key="key" 
            :class="['map-type-item', { active: currentMapType === key }]"
            @click="handleMapTypeChange(key)"
        >
            <div class="map-type-icon">
              <img :src="item.icon" :alt="item.label" />
            </div>
            <div class="map-type-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
      
      <div class="layer-section">
        <div class="section-title">图层类型</div>
        <div class="section-content">
          <div 
            v-for="(item, key) in getMapTiles(currentMapType)" 
            :key="key"
            :class="['map-tile-item', { active: currentMapTile === key }]"
            @click="handleMapTileChange(key)"
          >
            <div class="map-tile-icon">
              <img :src="item.icon" :alt="item.label" />
            </div>
            <div class="map-tile-label">{{ item.label }}</div>
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
import { ref, computed, onMounted } from 'vue';
import { MapType, MapTile, MapConfig } from '../types';

// 组件属性
const props = defineProps<{
  active: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  mapType: MapType;
  mapTile: MapTile;
  mapConfig?: MapConfig['map'];
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'layer-change', payload: { mapType: MapType; mapTile: MapTile }): void;
}>();

// 组件状态
const currentMapType = ref<MapType>(props.mapType);
const currentMapTile = ref<MapTile>(props.mapTile);

// 计算位置样式类
const positionClass = computed(() => props.position ? `position-${props.position}` : 'position-top-right');

// 地图类型配置
const mapTypes = {
  [MapType.GAODE]: {
    label: '高德地图',
    icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
  },
  [MapType.GOOGLE]: {
    label: '谷歌地图',
    icon: 'https://www.gstatic.com/images/branding/product/2x/maps_round_512dp.png'
  },
  [MapType.OSM]: {
    label: 'OpenStreetMap',
    icon: 'https://www.openstreetmap.org/assets/osm_logo-b7e82afdcc98412733e1c609adc05c8907eb69ee35a2175a760055c6ef182059.svg'
  },
  [MapType.TENCENT]: {
    label: '腾讯地图',
    icon: 'https://mapapi.qq.com/web/lbs/logo/qqlbs.png'
  },
  [MapType.TIANDITU]: {
    label: '天地图',
    icon: 'https://api.tianditu.gov.cn/img/lo.png'
  },
  [MapType.BAIDU]: {
    label: '百度地图',
    icon: 'https://api.map.baidu.com/images/logo.png'
  }
};

// 图层类型配置（按地图类型分组）
const mapTiles = {
  [MapType.GAODE]: {
    [MapTile.NORMAL]: {
      label: '标准地图',
      icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/normal.png'
    },
    [MapTile.SATELLITE]: {
      label: '卫星地图',
      icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/satellite.png'
    },
    [MapTile.TERRAIN]: {
      label: '地形图',
      icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/terrain.png'
    }
  },
  [MapType.GOOGLE]: {
    [MapTile.NORMAL]: {
      label: '标准地图',
      icon: 'https://developers.google.com/static/maps/images/landing/terrain_512.png'
    },
    [MapTile.SATELLITE]: {
      label: '卫星地图',
      icon: 'https://developers.google.com/static/maps/images/landing/satellite_512.png'
    },
    [MapTile.TERRAIN]: {
      label: '地形图',
      icon: 'https://developers.google.com/static/maps/images/landing/hybrid_512.png'
    }
  },
  [MapType.OSM]: {
    [MapTile.NORMAL]: {
      label: '标准地图',
      icon: 'https://assets.openstreetmap.org/assets/osm-logo-512x512-20d76fc3.png'
    }
  },
  [MapType.TENCENT]: {
    [MapTile.NORMAL]: {
      label: '标准地图',
      icon: 'https://mapapi.qq.com/web/lbs/demoCenter/img/map.png'
    },
    [MapTile.SATELLITE]: {
      label: '卫星地图',
      icon: 'https://mapapi.qq.com/web/lbs/demoCenter/img/satellite.png'
    }
  },
  [MapType.TIANDITU]: {
    [MapTile.NORMAL]: {
      label: '矢量地图',
      icon: 'https://t0.tianditu.gov.cn/img/map/vector.png'
    },
    [MapTile.SATELLITE]: {
      label: '影像地图',
      icon: 'https://t0.tianditu.gov.cn/img/map/satellite.png'
    },
    [MapTile.TERRAIN]: {
      label: '地形地图',
      icon: 'https://t0.tianditu.gov.cn/img/map/terrain.png'
    }
  },
  [MapType.BAIDU]: {
    [MapTile.NORMAL]: {
      label: '标准地图',
      icon: 'https://api.map.baidu.com/images/normal.png'
    },
    [MapTile.SATELLITE]: {
      label: '卫星地图',
      icon: 'https://api.map.baidu.com/images/satellite.png'
    }
  }
};
  
// 获取当前地图类型的图层列表
const getMapTiles = (mapType: MapType) => {
  return mapTiles[mapType] || {};
};

// 处理地图类型变更
const handleMapTypeChange = (type: MapType) => {
  currentMapType.value = type;
  
  // 检查当前地图类型是否支持当前选择的图层类型
  const availableTiles = getMapTiles(type);
  if (!availableTiles[currentMapTile.value]) {
    // 如果不支持，则选择第一个可用的图层类型
    const firstTileKey = Object.keys(availableTiles)[0] as MapTile;
    currentMapTile.value = firstTileKey;
  }
  
  // 触发图层变更事件
  emit('layer-change', {
    mapType: currentMapType.value,
    mapTile: currentMapTile.value
  });
};

// 处理图层类型变更
const handleMapTileChange = (tile: MapTile) => {
  currentMapTile.value = tile;
  
  // 触发图层变更事件
  emit('layer-change', {
    mapType: currentMapType.value,
    mapTile: currentMapTile.value
  });
};

// 关闭面板
const handleClose = () => {
  emit('close');
};

// 组件挂载
onMounted(() => {
  // 初始化当前选择的地图类型和图层类型
  currentMapType.value = props.mapType;
  currentMapTile.value = props.mapTile;
});
</script>

<style scoped>
.layer-panel {
  position: absolute;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-width: 90%;
  z-index: 1000;
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.layer-panel.active {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
  }

.position-top-left {
  top: 10px;
  left: 10px;
  }

.position-top-right {
  top: 10px;
  right: 10px;
  }

.position-bottom-left {
  bottom: 10px;
  left: 10px;
  }

.position-bottom-right {
  bottom: 10px;
  right: 10px;
  }
  
.layer-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #1890ff;
  color: #fff;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  }
  
.layer-panel-title {
  font-size: 14px;
  font-weight: 500;
  }
  
.layer-panel-actions {
  display: flex;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.1);
  }
  
  .layer-panel-content {
  padding: 16px;
  max-height: 60vh;
    overflow-y: auto;
}

.layer-section {
  margin-bottom: 20px;
}

.layer-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
        position: relative;
  padding-left: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background-color: #1890ff;
  border-radius: 1px;
}

.section-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.map-type-item,
.map-tile-item {
              display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-type-item:hover,
.map-tile-item:hover {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
}

.map-type-item.active,
.map-tile-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
          }
          
.map-type-icon,
.map-tile-icon {
  width: 32px;
  height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
  margin-bottom: 8px;
          }
          
.map-type-icon img,
.map-tile-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
          }
          
.map-type-label,
.map-tile-label {
            font-size: 12px;
            color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style> 