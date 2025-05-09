<template>
  <div class="overview-map" 
    :class="{ 'visible': visible, 'collapsed': collapsed }"
    :style="overviewMapStyle"
  >
    <div ref="overviewMapContainer" class="overview-map-container"></div>
    <div 
      class="overview-collapse-btn" 
      :class="getCollapseButtonPosition()"
      @click.stop="toggleCollapse"
      :style="collapseButtonStyle"
    >
      <div class="collapse-icon">
        <span v-if="collapsed">+</span>
        <span v-else>-</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';
import logger from '../composables/LogObject';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import { Style, Fill, Stroke } from 'ol/style';
import { getCenter } from 'ol/extent';
// 导入拖动交互控件
import { DragBox, Translate } from 'ol/interaction';
import { platformModifierKeyOnly } from 'ol/events/condition';

// 定义配置接口
export interface OverviewMapConfig {
  width?: number;          // 宽度(px)
  height?: number;         // 高度(px)
  opacity?: number;        // 透明度(0-1)
  borderColor?: string;    // 边框颜色
  borderWidth?: number;    // 边框宽度(px)
  backgroundColor?: string; // 背景颜色
  boxColor?: string;       // 视图矩形框颜色
  boxOpacity?: number;     // 视图矩形框透明度(0-1)
  boxBorderColor?: string; // 视图矩形框边框颜色
  boxBorderWidth?: number; // 视图矩形框边框宽度(px)
  zoomOffset?: number;     // 缩放级别偏移量
  collapsedSize?: number;  // 折叠后的尺寸(px)
  buttonSize?: number;     // 折叠按钮尺寸(px)
  buttonColor?: string;    // 折叠按钮颜色
  buttonBgColor?: string;  // 折叠按钮背景色
}

const props = defineProps({
  mainMapObj: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: 'bottom-right', // 可选值：'top-left', 'top-right', 'bottom-left', 'bottom-right'
    validator: (value: string) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
  },
  config: {
    type: Object as () => OverviewMapConfig,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'collapse-change']);

// 合并默认配置和用户传入的配置
const defaultConfig: OverviewMapConfig = {
  width: 200,
  height: 150,
  opacity: 1,
  borderColor: 'rgba(24, 144, 255, 0.8)',
  borderWidth: 2,
  backgroundColor: '#f5f5f5',
  boxColor: 'rgba(24, 144, 255, 0.15)',
  boxOpacity: 0.15,
  boxBorderColor: 'rgba(24, 144, 255, 1)',
  boxBorderWidth: 3,
  zoomOffset: 4,
  collapsedSize: 30,
  buttonSize: 30,
  buttonColor: '#fff',
  buttonBgColor: 'rgba(24, 144, 255, 0.9)'
};

// 合并配置
const mergedConfig = computed(() => {
  return { ...defaultConfig, ...props.config };
});

// 计算鹰眼地图样式
const overviewMapStyle = computed(() => {
  const config = mergedConfig.value;
  const posStyle: Record<string, any> = {};
  
  // 根据位置设置定位样式
  switch (props.position) {
    case 'top-left':
      posStyle.top = '10px';
      posStyle.left = '10px';
      break;
    case 'top-right':
      posStyle.top = '10px';
      posStyle.right = '10px';
      break;
    case 'bottom-left':
      posStyle.bottom = '10px';
      posStyle.left = '10px';
      break;
    case 'bottom-right':
      posStyle.bottom = '10px';
      posStyle.right = '10px';
      break;
  }
  
  return {
    ...posStyle,
    width: collapsed.value ? `${config.collapsedSize}px` : `${config.width}px`,
    height: collapsed.value ? `${config.collapsedSize}px` : `${config.height}px`,
    opacity: config.opacity,
    borderColor: config.borderColor,
    borderWidth: `${config.borderWidth}px`,
    backgroundColor: config.backgroundColor,
    zIndex: 1001
  };
});

// 计算折叠按钮样式
const collapseButtonStyle = computed(() => {
  const config = mergedConfig.value;
  return {
    width: `${config.buttonSize}px`,
    height: `${config.buttonSize}px`,
    backgroundColor: config.buttonBgColor,
    color: config.buttonColor,
    borderRadius: collapsed.value ? '50%' : '4px' // 根据折叠状态自动调整
  };
});

const overviewMapContainer = ref<HTMLElement | null>(null);
let overviewMap: Map | null = null;
let isInitialized = false;
// 存储监听器引用
let mapListeners: { center: any; resolution: any; extent: any } | null = null;

// 用于视图区域矩形
let viewExtentLayer: VectorLayer<VectorSource> | null = null;
let viewExtentFeature: Feature | null = null;
// 拖动交互控件
let translateInteraction: Translate | null = null;
// 是否正在拖动
let isDragging = false;
// 是否折叠
const collapsed = ref(false);

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  
  // 通知父组件折叠状态变化
  emit('collapse-change', collapsed.value);
  
  // 如果展开，需要重新初始化地图
  if (!collapsed.value && props.visible) {
    setTimeout(() => {
      if (overviewMap) {
        overviewMap.updateSize();
        updateViewExtentRectangle();
      } else {
        createOverviewMap();
      }
    }, 300); // 等待展开动画完成
  }
  
  logger.debug(`[Overview] 鹰眼地图折叠状态: ${collapsed.value ? '已折叠' : '已展开'}`);
};

// 根据位置获取折叠按钮的位置类名
const getCollapseButtonPosition = () => {
  return `position-${props.position}`;
};

// 创建鹰眼地图
const createOverviewMap = async () => {
  if (collapsed.value) return; // 如果折叠状态，不创建
  
  if (!overviewMapContainer.value || !props.mainMapObj) {
    logger.warn('[Overview] 鹰眼地图容器或主地图对象不存在');
    return;
  }
  
  // 如果已经初始化，不重复创建
  if (overviewMap && isInitialized) {
    logger.debug('[Overview] 鹰眼地图已经存在，刷新视图');
    overviewMap.updateSize();
    return;
  }
  
  try {
    // 确保DOM已经渲染
    await nextTick();
    
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
    const config = mergedConfig.value;
    
    logger.debug('[Overview] 创建鹰眼地图, 中心点:', center, '缩放级别:', zoom);
    
    // 创建矩形图层，使用配置的样式
    viewExtentFeature = new Feature();
    const vectorSource = new VectorSource({
      features: [viewExtentFeature]
    });
    
    viewExtentLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: config.boxBorderColor,
          width: config.boxBorderWidth
        }),
        fill: new Fill({
          color: config.boxColor
        })
      }),
      // 确保矩形始终显示在顶层
      zIndex: 10
    });
    
    // 创建鹰眼地图
    overviewMap = new Map({
      target: overviewMapContainer.value,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        viewExtentLayer
      ],
      view: new View({
        center: center,
        zoom: zoom ? zoom - config.zoomOffset : 0, // 使用配置的缩放偏移
        projection: projection
      }),
      controls: []
    });
    
    // 添加拖动交互
    setupDragInteraction();
    
    logger.debug('[Overview] 自定义鹰眼地图已创建');
    isInitialized = true;
    
    // 确保地图大小正确
    setTimeout(() => {
      if (overviewMap) {
        overviewMap.updateSize();
        logger.debug('[Overview] 更新鹰眼地图大小');
        
        // 初始更新一次矩形
        updateViewExtentRectangle();
      }
    }, 100);
    
    // 监听主地图的视图变化
    const updateOverviewMap = () => {
      if (!overviewMap || !mainMap) return;
      
      // 如果正在拖动或已折叠，不更新鹰眼地图
      if (isDragging || collapsed.value) return;
      
      const mainView = mainMap.getView();
      const overviewView = overviewMap.getView();
      const config = mergedConfig.value;
      
      // 同步中心点和缩放级别
      overviewView.setCenter(mainView.getCenter());
      overviewView.setZoom(mainView.getZoom() ? mainView.getZoom() - config.zoomOffset : 0);
      
      // 更新视图矩形
      updateViewExtentRectangle();
    };
    
    // 添加主地图视图变化监听
    mainMap.getView().on('change:center', updateOverviewMap);
    mainMap.getView().on('change:resolution', updateOverviewMap);
    
    // 将当前鹰眼地图变更保存到单独的变量，以便清理
    mapListeners = {
      center: updateOverviewMap,
      resolution: updateOverviewMap,
      extent: updateViewExtentRectangle
    };
    
    // 添加鹰眼地图点击事件
    overviewMap.on('click', handleOverviewMapClick);
    
  } catch (error) {
    logger.error('[Overview] 创建自定义鹰眼地图失败:', error);
    isInitialized = false;
  }
};

// 设置拖动交互
const setupDragInteraction = () => {
  if (!overviewMap || !viewExtentLayer) return;
  
  // 创建拖动交互控件，只作用于视图矩形图层
  translateInteraction = new Translate({
    features: viewExtentLayer.getSource().getFeaturesCollection(),
    hitTolerance: 5 // 点击容差
  });
  
  // 拖动开始事件
  translateInteraction.on('translatestart', () => {
    isDragging = true;
    logger.debug('[Overview] 开始拖动视图矩形');
  });
  
  // 拖动过程中事件
  translateInteraction.on('translating', (event) => {
    // 可以在这里实时更新主地图视图
    if (!viewExtentFeature || !props.mainMapObj) return;
    
    const mainMap = props.mainMapObj.getMapInstance();
    if (!mainMap) return;
    
    const geometry = viewExtentFeature.getGeometry();
    if (geometry) {
      // 获取矩形的中心点
      const extent = geometry.getExtent();
      const center = getCenter(extent);
      
      // 更新主地图视图中心点（实时更新）
      mainMap.getView().setCenter(center);
    }
  });
  
  // 拖动结束事件
  translateInteraction.on('translateend', (event) => {
    // 获取拖动后的矩形中心点
    if (!viewExtentFeature || !props.mainMapObj) return;
    
    const mainMap = props.mainMapObj.getMapInstance();
    if (!mainMap) return;
    
    const geometry = viewExtentFeature.getGeometry();
    if (geometry) {
      // 获取矩形的中心点
      const extent = geometry.getExtent();
      const center = getCenter(extent);
      
      // 更新主地图视图中心点
      mainMap.getView().setCenter(center);
      logger.debug('[Overview] 拖动结束，更新主地图中心点:', center);
    }
    
    // 标记拖动结束
    setTimeout(() => {
      isDragging = false;
    }, 100);
  });
  
  // 添加交互控件到地图
  overviewMap.addInteraction(translateInteraction);
  logger.debug('[Overview] 已添加矩形拖动交互控件');
};

// 更新视图区域矩形
const updateViewExtentRectangle = () => {
  if (!overviewMap || !props.mainMapObj || !viewExtentFeature || collapsed.value) return;
  
  try {
    const mainMap = props.mainMapObj.getMapInstance();
    if (!mainMap) return;
    
    // 获取主地图的视图范围
    const extent = mainMap.getView().calculateExtent(mainMap.getSize());
    const config = mergedConfig.value;
    
    // 缩小矩形大小，让它显示为主视图区域的一部分
    // 计算中心点
    const center = getCenter(extent);
    // 计算缩小后的范围
    const scaleFactor = 0.25; // 缩小比例，0.25表示缩小到原来的25%
    const width = (extent[2] - extent[0]) * scaleFactor;
    const height = (extent[3] - extent[1]) * scaleFactor;
    
    // 根据中心点和新尺寸计算新的范围
    const scaledExtent = [
      center[0] - width/2,
      center[1] - height/2,
      center[0] + width/2,
      center[1] + height/2
    ];
    
    // 设置矩形几何图形，使用计算后的范围
    const polygon = new Polygon([[
      [scaledExtent[0], scaledExtent[1]],
      [scaledExtent[0], scaledExtent[3]],
      [scaledExtent[2], scaledExtent[3]],
      [scaledExtent[2], scaledExtent[1]],
      [scaledExtent[0], scaledExtent[1]]
    ]]);
    
    // 更新特征几何形状
    viewExtentFeature.setGeometry(polygon);
    
    // 更新矩形样式
    if (viewExtentLayer) {
      viewExtentLayer.setStyle(new Style({
        stroke: new Stroke({
          color: config.boxBorderColor, 
          width: config.boxBorderWidth
        }),
        fill: new Fill({
          color: config.boxColor
        })
      }));
    }
    
    logger.debug('[Overview] 更新视图矩形，原始范围:', extent, '缩放后范围:', scaledExtent);
  } catch (error) {
    logger.error('[Overview] 更新视图矩形失败:', error);
  }
};

// 处理鹰眼地图点击
const handleOverviewMapClick = (event) => {
  if (!overviewMap || !props.mainMapObj) return;
  
  const mainMap = props.mainMapObj.getMapInstance();
  if (!mainMap) return;
  
  // 获取点击坐标
  const coordinate = overviewMap.getEventCoordinate(event.originalEvent);
  
  // 将主地图视图中心设置为点击位置
  mainMap.getView().setCenter(coordinate);
  
  logger.debug('[Overview] 鹰眼地图点击，设置中心点:', coordinate);
};

// 销毁鹰眼地图
const destroyOverviewMap = () => {
  if (!overviewMap) return;
  
  try {
    // 移除交互控件
    if (translateInteraction) {
      overviewMap.removeInteraction(translateInteraction);
      translateInteraction = null;
    }
    
    // 移除点击监听器
    overviewMap.un('click', handleOverviewMapClick);
    
    // 移除监听器
    if (props.mainMapObj && mapListeners) {
      const mainMap = props.mainMapObj.getMapInstance();
      if (mainMap) {
        mainMap.getView().un('change:center', mapListeners.center);
        mainMap.getView().un('change:resolution', mapListeners.resolution);
      }
    }
    
    // 清理图层资源
    viewExtentFeature = null;
    viewExtentLayer = null;
    
    // 销毁地图
    overviewMap.setTarget(null);
    overviewMap = null;
    mapListeners = null;
    isInitialized = false;
    isDragging = false;
    
    logger.debug('[Overview] 自定义鹰眼地图已销毁');
  } catch (error) {
    logger.error('[Overview] 销毁自定义鹰眼地图失败:', error);
  }
};

// 监听显示状态变化
watch(() => props.visible, (newVisible) => {
  logger.debug(`[Overview] 鹰眼地图显示状态变更: ${newVisible ? '显示' : '隐藏'}`);
  
  if (newVisible && !collapsed.value) {
    // 延迟创建，确保DOM已就绪
    setTimeout(createOverviewMap, 50);
  } else {
    destroyOverviewMap();
  }
}, { immediate: true });

const onClose = () => {
  emit('close');
};

onMounted(() => {
  logger.debug('[Overview] 鹰眼组件已挂载, 初始显示状态:', props.visible);
  if (props.visible && !collapsed.value) {
    // 组件挂载后延迟创建鹰眼地图
    setTimeout(createOverviewMap, 100);
  }
});

onBeforeUnmount(() => {
  destroyOverviewMap();
});
</script>

<style lang="scss" scoped>
.overview-map {
  position: absolute;
  display: none;
  overflow: hidden;
  z-index: 1001;
  border-style: solid;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box; // 确保尺寸计算包含边框
  padding: 0; // 消除内边距
  
  &.visible {
    display: block;
    animation: fade-in 0.3s ease-in-out;
  }
  
  &.collapsed {
    overflow: hidden;
    border-radius: 50%; // 折叠状态为圆形
    padding: 0; // 确保没有内边距
    box-sizing: border-box; // 确保尺寸包含边框
    
    .overview-map-container {
      display: none;
    }
    
    // 折叠状态下按钮的样式
    .overview-collapse-btn {
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%; // 完全圆形
      margin: 0; // 清除可能的外边距
      transform: none !important; // 防止hover效果导致偏移
      padding: 0; // 确保没有内边距
      
      .collapse-icon {
        font-size: 20px; // 增大字体大小
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        
        span {
          position: relative;
          top: -1px; // 微调位置使其视觉上居中
          line-height: 1;
          text-align: center;
        }
      }
    }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  &-container {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  // 折叠按钮
  .overview-collapse-btn {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1002;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    
    &:hover {
      transform: scale(1.05);
    }
    
    .collapse-icon {
      font-weight: bold;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      
      span {
        position: relative;
        text-align: center;
      }
    }
    
    // 不同位置的折叠按钮
    &.position-top-left {
      top: 5px;
      left: 5px;
    }
    
    &.position-top-right {
      top: 5px;
      right: 5px;
    }
    
    &.position-bottom-left {
      bottom: 5px;
      left: 5px;
    }
    
    &.position-bottom-right {
      bottom: 5px;
      right: 5px;
    }
  }
}
</style> 