<template>
  <div class="custom-overview-map" :class="{ 'visible': visible }">
    <div class="custom-overview-map-header">
      <span>鹰眼图</span>
      <button @click="onClose" class="close-btn">×</button>
    </div>
    <div ref="overviewMapContainer" class="custom-overview-map-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';
import logger from '../composables/LogObject';

const props = defineProps({
  mainMapObj: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const overviewMapContainer = ref<HTMLElement | null>(null);
let overviewMap: Map | null = null;

// 创建鹰眼地图
const createOverviewMap = () => {
  if (!overviewMapContainer.value || !props.mainMapObj) return;
  
  try {
    // 获取主地图视图信息
    const mainMap = props.mainMapObj.getMapInstance();
    if (!mainMap) {
      logger.warn('[Overview] 主地图实例不存在，无法创建鹰眼地图');
      return;
    }
    
    const mainView = mainMap.getView();
    const center = mainView.getCenter();
    const zoom = mainView.getZoom();
    const projection = mainView.getProjection();
    
    // 创建鹰眼地图
    overviewMap = new Map({
      target: overviewMapContainer.value,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: center,
        zoom: zoom ? zoom - 2 : 2,
        projection: projection
      }),
      controls: []
    });
    
    logger.debug('[Overview] 自定义鹰眼地图已创建');
    
    // 监听主地图的视图变化
    const updateOverviewMap = () => {
      if (!overviewMap || !mainMap) return;
      
      const mainView = mainMap.getView();
      const overviewView = overviewMap.getView();
      
      // 同步中心点和缩放级别
      overviewView.setCenter(mainView.getCenter());
      overviewView.setZoom(mainView.getZoom() ? mainView.getZoom() - 2 : 2);
    };
    
    // 添加主地图视图变化监听
    mainMap.getView().on('change:center', updateOverviewMap);
    mainMap.getView().on('change:resolution', updateOverviewMap);
    
    // 将当前鹰眼地图变更保存到对象，以便清理
    overviewMap._mainMapListeners = {
      center: updateOverviewMap,
      resolution: updateOverviewMap
    };
    
  } catch (error) {
    logger.error('[Overview] 创建自定义鹰眼地图失败:', error);
  }
};

// 销毁鹰眼地图
const destroyOverviewMap = () => {
  if (!overviewMap) return;
  
  try {
    // 移除监听器
    if (props.mainMapObj) {
      const mainMap = props.mainMapObj.getMapInstance();
      if (mainMap && overviewMap._mainMapListeners) {
        mainMap.getView().un('change:center', overviewMap._mainMapListeners.center);
        mainMap.getView().un('change:resolution', overviewMap._mainMapListeners.resolution);
      }
    }
    
    // 销毁地图
    overviewMap.setTarget(null);
    overviewMap = null;
    
    logger.debug('[Overview] 自定义鹰眼地图已销毁');
  } catch (error) {
    logger.error('[Overview] 销毁自定义鹰眼地图失败:', error);
  }
};

// 监听显示状态变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 延迟创建，确保DOM已就绪
    setTimeout(createOverviewMap, 50);
  } else {
    destroyOverviewMap();
  }
});

const onClose = () => {
  emit('close');
};

onMounted(() => {
  if (props.visible) {
    createOverviewMap();
  }
});

onBeforeUnmount(() => {
  destroyOverviewMap();
});
</script>

<style lang="scss" scoped>
.custom-overview-map {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 180px;
  height: 180px;
  background-color: white;
  border: 2px solid rgba(24, 144, 255, 0.8);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  display: none;
  overflow: hidden;
  z-index: 1001;
  
  &.visible {
    display: block;
  }
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 6px;
    background-color: rgba(24, 144, 255, 0.1);
    border-bottom: 1px solid #e8e8e8;
    font-size: 12px;
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #999;
      
      &:hover {
        color: #f00;
      }
    }
  }
  
  &-container {
    width: 100%;
    height: calc(100% - 25px);
  }
}
</style> 