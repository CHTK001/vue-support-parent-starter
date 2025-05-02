<template>
  <div ref="mapContainer" class="sc-map" :style="{ height: height }">
    <!-- 工具面板 -->
    <map-toolbar ref="mapToolbarRef" v-if="showToolbar" :toolbar-config="computedToolbarConfig"
      @tool-click="handleToolClick" @tool-activated="handleToolActivated" @tool-deactivated="handleToolDeactivated" />
    <!-- 坐标显示面板 -->
    <coordinate-panel :visible="showCoordinatePanel" :longitude="currentLng" :latitude="currentLat" />
    <!-- 图层选择下拉框 -->
    <map-layer-dropdown :map-types="props.mapType" :current-layer="selectedLayerTypeString"
      :position="layerDropdownPosition" :visible="showLayerDropdown" :placement="layerDropdownPlacement"
      @select="handleLayerSelect" @close="closeLayerDropdown" />
    <!-- 轨迹播放控制面板 -->
    <track-player v-if="trackPlayerState.enabled && trackPlayerState.visible" :visible="trackPlayerState.visible"
      :tracks="availableTracks" :current-track-id="trackPlayerState.currentTrackId || ''"
      :progress="trackPlayerState.progress" :current-time="trackPlayerState.currentTime"
      :is-playing="trackPlayerState.isPlaying" :speed="trackPlayerState.speed" :loop="trackPlayerState.loop"
      :theme="trackPlayerState.theme" :position="props.trackPlayerConfig?.position || 'topright'" @play="playTrack" @pause="pauseTrack"
      @set-current-track="setCurrentTrack" @set-progress="setTrackProgress" @set-speed="setTrackSpeed"
      @toggle-loop="toggleTrackLoop" @toggle-follow-camera="toggleTrackFollowCamera" @track-remove="handleTrackRemove" 
      @track-delete="handleTrackDelete" @update:theme="updateTrackPlayerTheme" 
      @center-on-track="handleCenterOnTrack" @track-hide-others="hideAllTracksExcept"
      @track-show-all="showAllTracks" />
    <!-- 添加调试面板组件 -->
    <MapDebugPanel v-if="debugPanelVisible" :visible="debugPanelVisible" @close="closeDebugPanel" ref="debugPanelRef" />
    <!-- 标记详情弹窗 -->
    <MarkerDetailsPopup v-if="markerTool?.getVisible()" :visible="markerTool?.getVisible()"
      :marker="markerTool?.getClickedMarker()" :customData="markerTool?.getClickedMarker()?.data" :map="mapInstance"
      @close="markerTool?.closeDetailsPopup()">
      
      <template #marker="{ latlng, data }">
        <slot name="marker" :latlng="latlng" :data="data"></slot>
      </template>

      <template #marker-header="{ data }">
        <slot name="marker-header" :data="data"></slot>
      </template>
    </MarkerDetailsPopup>
    
    <!-- 形状详情弹窗 -->
    <!-- <ShapeDetailsPopup v-if="shapeTool?.getVisible()" :visible="shapeTool?.getVisible()"
      :shapeData="shapeTool?.getClickedShape()" 
      :shapeType="shapeTool?.getClickedShape()?.type" 
      :shapeOptions="shapeTool?.getClickedShape()?.options"
      :shapeId="shapeTool?.getClickedShape()?.id"
      :center="shapeTool?.getClickedShape()?.center"
      :map="mapInstance"
      @close="shapeTool?.closeDetailsPopup()">
      
      <template #shape="{ data, type }">
        <slot name="shape" :data="data" :type="type"></slot>
      </template>

      <template #shape-header="{ data }">
        <slot name="shape-header" :data="data"></slot>
      </template>
    </ShapeDetailsPopup> -->
    
  </div>
</template>

<script lang="ts">
export default {
  name: "ScMap"
};
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, reactive } from "vue";
import type { LatLng } from 'leaflet';
import "leaflet/dist/leaflet.css";
import type { Ref } from "vue";
import CoordinatePanel from './components/CoordinatePanel.vue';
import MarkerDetailsPopup from './components/MarkerDetailsPopup.vue';
import ShapeDetailsPopup from './components/ShapeDetailsPopup.vue';
import MapLayerDropdown from './components/MapLayerDropdown.vue';
import MapToolbar from './components/MapToolbar.vue';
import MapDebugPanel from './components/MapDebugPanel.vue';
import TrackPlayer from './components/TrackPlayer.vue';
import type { CustomMarkerOptions, MarkerLatLng } from './plugin/Marker';
import { Marker } from './plugin/Marker';
import { Measure } from './plugin/Measure';
import { Overview } from './plugin/Overview';
import type { OverviewOptions } from './plugin/Overview';
import { ShapeType } from './plugin/Shape';
import ShapeEditable from "./plugin/ShapeEditable";
import { TrackPlayer as TrackPlayerController } from './plugin/TrackPlayer';
import { Aggregation } from './plugin/Aggregation';
import type { AggregationOptions, HeatMapOptions, HeatPoint, Track, TrackPlayerConfig, TrackPlayerOptions } from './types';
import { HeatMap } from './plugin/HeatMap';
import type { AddToolOptions, ScMapProps, ToolbarConfig } from './types';
import { LayerType, OpenStatus } from './types';
import { DEFAULT_TOOL_ITEMS, MAP_TYPES, DEFAULT_TRACK_PLAYER_OPTIONS, TRACK_PLAYER_THEMES } from './types/default';
// 导入日志工具
import { error, warn, info } from '@repo/utils';
// 导入飞线图插件和基础接口
import { Migration } from './plugin/Migration';
import { EchartsMigration } from './plugin/EchartsMigration';
import type { MigrationPoint } from './plugin/MigrationBase';
import type { MigrationOptions } from './plugin/Migration';
import type { MigrationBase } from './plugin/MigrationBase';
// 导入leaflet类型但动态加载实现
let L: any = null;

/**
 * 问题修复说明：
 * 
 * 修复了 "点击marker显示弹框后在新增新marker，缩放地图会出现Cannot read properties of null 
 * (reading '_latLngToNewLayerPoint')" 错误。
 * 
 * 这个问题发生在popup存在的情况下进行地图缩放操作时，主要是因为Leaflet尝试为已经不在DOM中
 * 或没有正确初始化的popup元素计算新位置导致。
 * 
 * 最新的解决方案更彻底：
 * 
 * 完全摒弃使用Leaflet自带的popup机制，改为使用自定义DOM元素和Vue组件实现标记弹窗。
 * 我们现在直接在地图外部DOM中创建弹窗元素，并使用createApp手动挂载Vue组件。
 * 这样的实现有以下优点：
 * 
 * 1. 完全避免了Leaflet popup的内部缓存和引用问题
 * 2. 在地图缩放、平移时可以手动更新弹窗位置，更加可控
 * 3. 当地图开始缩放时可以立即清除弹窗，避免任何引用错误
 * 4. 组件卸载时能够彻底清理所有资源，避免内存泄漏
 * 5. 可以完全自定义弹窗的样式和行为，不受Leaflet内部实现的限制
 * 
 * 这些修改彻底解决了"_latLngToNewLayerPoint"相关错误，使地图操作更加流畅可靠。
 */

// 添加坐标相关状态
const showCoordinatePanel = ref(false);
const currentLat = ref(0);
const currentLng = ref(0);
const coordinateMode = ref(false);

// 图层下拉框相关状态
const showLayerDropdown = ref(false);
const layerDropdownPosition = ref<{
  x: number;
  y: number;
  mapWidth?: number;
  mapHeight?: number;
  buttonWidth?: number;
  buttonHeight?: number;
  isRightSide?: boolean;
  isBottomSide?: boolean;
}>({ x: 0, y: 0 });
const layerDropdownPlacement = ref<'top' | 'bottom'>('bottom');

const props = withDefaults(defineProps<ScMapProps>(), {
  height: "600px",
  mapType: () => MAP_TYPES,
  layerType: LayerType.NORMAL,
  url: "",
  center: () => [39.92, 116.40],
  zoom: 12,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: "",
  showToolbar: true,
  toolbarConfig: () => ({
    position: "top-left",
    direction: "horizontal",
    itemsPerLine: 8,
    size: 36
  } as ToolbarConfig),
  overviewConfig: () => ({
    position: "bottomright",
    height: 150,
    width: 150,
    zoomLevelOffset: -5,
    zoomAnimation: false,
    toggleDisplay: true,
    minimized: false,
    aimingRectOptions: { color: '#ff7800', weight: 1, interactive: false },
    strings: { hideText: '收起鹰眼', showText: '展开鹰眼' },
    autoActivate: false
  } as OverviewOptions),
  aggregationConfig: () => ({
    enabled: true,
    options: {},
    defaultSize: 40,
    colorRanges: [
      { value: 10, color: '#5470c6' },  // 聚合点数量≥10时使用蓝色
      { value: 50, color: '#91cc75' },  // 聚合点数量≥50时使用绿色
      { value: 100, color: '#fac858' }, // 聚合点数量≥100时使用黄色
      { value: 200, color: '#ee6666' }  // 聚合点数量≥200时使用红色
    ]
  } as AggregationOptions),
  trackPlayerConfig: () => ({
    position: 'topright',
    trackList: []
  } as TrackPlayerConfig),
  // 添加热力图配置
  heatMapConfig: () => ({
    enabled: false,
    options: {}
  } as HeatMapOptions),
  // 添加飞线图配置
  migrationConfig: () => ({
    enabled: false,
    options: {},
    autoStart: false
  }),
  // 飞线图实现类型，可选 'antPath' 或 'echarts'
  migrationImpl: 'echarts'
});

const selectedLayerTypeString = ref(props.layerType);
// 发出事件
const emit = defineEmits<{
  (e: 'update:layerType', value: string): void;
  (e: 'update:zoom', value: number): void;
  (e: 'update:center', value: [number, number]): void;
  (e: 'update:dragging', value: boolean): void;
  (e: 'tool-activated', toolId: string): void;
  (e: 'tool-deactivated', toolId: string): void;
  (e: 'coordinate-change', latlng: { lat: number, lng: number }): void;
  (e: 'layer-change', layerType: string): void;
  (e: 'shape-created', shapeData: any): void;
  (e: 'shape-click', event: { id: string, type: string, center: [number, number], options: any, data: any }): void;
  (e: 'shape-removed', shapeData: { id: string, type?: string, options?: any }): void;
  (e: 'marker-created', markerData: { id: string, latlng: [number, number], options: any }): void;
  (e: 'marker-click', markerData: { id: string, latlng: [number, number], data: any }): void;
  (e: 'marker-removed', markerData: { id: string, options?: any }): void;
  (e: 'map-click', event: any): void;
  (e: 'marker-detail-view', data: { marker: any, id: string, position: [number, number], data: any }): void;
}>();

// 计算当前使用的瓦片URL
const tileUrl = computed((): string => {
  // 如果提供了自定义URL，优先使用
  if (props.url) {
    return props.url;
  }
  
  // 否则根据图层类型从mapType中获取
  const currentLayer = props.mapType[props.layerType] || props.mapType.NORMAL;
  return currentLayer.url;
});

// 获取当前图层的attribution
const attribution = computed((): string => {
  if (props.url) {
    return '&copy; Map data';
  }
  
  const currentLayer = props.mapType[props.layerType] || props.mapType.NORMAL;
  return currentLayer.attribution || ''; // 添加空字符串作为后备值
});

const mapContainer: Ref<HTMLElement | null> = ref(null);
const mapInstance: Ref<any> = ref(null);
const tileLayer: Ref<any> = ref(null);
const internalZoom = ref(props.zoom); // 内部跟踪的缩放级别
const internalDragging = ref(props.dragging); // 内部跟踪的拖动状态
const measureTool: Ref<Measure | null> = ref(null); // 测距工具
const markerTool: Ref<Marker | null> = ref(null); // 标记工具
const overviewTool: Ref<Overview | null> = ref(null); // 鹰眼工具
const shapeTool: Ref<ShapeEditable | null> = ref(null); // 绘制图形工具
const aggregationTool: Ref<Aggregation | null> = ref(null); // 聚合工具
const mapToolbarRef = ref<InstanceType<typeof MapToolbar> | null>(null); // 工具栏组件引用
// 调试面板相关
const debugPanelVisible = ref(false);
const debugPanelRef = ref<InstanceType<typeof MapDebugPanel> | null>(null);

// 热力图工具
const heatMapTool: Ref<HeatMap | null> = ref(null);

// 飞线图工具
const migrationTool: Ref<MigrationBase | null> = ref(null);

// 轨迹播放器内部状态
const trackPlayerState = reactive({
  // 状态控制
  enabled: false,
  visible: false, 
  // 播放控制
  currentTrackId: null as string | null,
  progress: 0,
  currentTime: 0,
  isPlaying: false,
  speed: 600,
  loop: false,
  followCamera: false,
  // UI配置
  theme: TRACK_PLAYER_THEMES.light,
  tracks: [] as Track[]
});
const trackPlayerController: Ref<TrackPlayerController | null> = ref(null);

// 计算当前可用的轨迹列表
const availableTracks = computed(() => {
  if (trackPlayerController.value) {
    return trackPlayerController.value.getAllTracks();
  }
  // 回退到props中的轨迹列表
  return props.trackPlayerConfig?.trackList || [];
});

// 兼容旧版本，将toolbar、toolbarPosition等属性转换为toolbarConfig
const computedToolbarConfig = computed((): ToolbarConfig => {
  // 从props.toolbarConfig复制基础配置
  const config: ToolbarConfig = props.toolbarConfig ? { ...props.toolbarConfig } : {
    position: 'top-left' as const,
    direction: 'horizontal' as const,
    itemsPerLine: 4,
    size: 36,
    items: []
  };

  // 使用props.toolbar覆盖items，如果存在
  if (props.toolbar) {
    config.items = props.toolbar;
  }

  if (!config.items || config.items.length == 0) {
    config.items = DEFAULT_TOOL_ITEMS;
  }

  // 返回合并后的配置
  return config;
});

// 日志处理函数，用于记录地图组件的操作日志
const logEvents: any[] = [];
const addLog = (message: any, data?: any) => {
  // 保存日志到日志数组，用于调试
  if (logEvents.length > 100) {
    // 只保留最新的100条日志
    logEvents.shift();
  }
  logEvents.push({
    time: new Date().toISOString(),
    message,
    data
  });

  // 如果调试面板可见，同步日志到面板
  if (debugPanelRef.value) {
    debugPanelRef.value.addLog('info', message, data);
  }
};

// 安全关闭所有弹窗的函数
const safeCloseAllPopups = (): void => {
  try {
    if (mapInstance.value) {
      // 关闭所有弹窗
      mapInstance.value.closePopup();
      
      // 如果存在标记工具，清理所有marker上的popup
      if (markerTool.value) {
        const markers = markerTool.value.getMarkers();
        markers.forEach(marker => {
          if (marker.getPopup()) {
            marker.closePopup();
            marker.unbindPopup();
          }
        });
      }
      
      addLog('安全关闭所有弹窗');
    }
  } catch (e) {
    error('关闭弹窗时发生错误:', e);
  }
};
// 辅助函数：从工具ID获取形状类型
const getShapeTypeFromToolId = (toolId: string): ShapeType | null => {
  switch (toolId) {
    case 'drawCircle': return ShapeType.CIRCLE;
    case 'drawRectangle': return ShapeType.RECTANGLE;
    case 'drawPolygon': return ShapeType.POLYGON;
    case 'drawPolyline': return ShapeType.POLYLINE;
    default: return null;
  }
};
// 处理工具激活事件
const handleToolActivated = (toolId: string) => {
  emit('tool-activated', toolId);
  addLog(`工具激活: ${toolId}`);

  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  const instantToolIds = ['zoomIn', 'zoomOut', 'fullView']; // 即时执行工具
  const editToolId = 'edit'; // 添加编辑工具ID
  
  // 取消激活其他绘图工具 - 确保同时只有一种绘图工具处于激活状态
  if (mapToolbarRef.value && (drawToolIds.includes(toolId) || toolId === 'measure' || toolId === 'drawPoint')) {
      const tools = mapToolbarRef.value.getTools();
      const updatedTools = tools.map(tool => {
      // 如果是绘图工具，并且不是当前激活的工具，取消其激活状态
      if (drawToolIds.includes(tool.id) && tool.id !== toolId) {
        return { ...tool, active: false };
        }
        return tool;
      });
      mapToolbarRef.value.setTools(updatedTools);
    addLog('确保其他绘图工具未被激活');
    
    // 取消任何进行中的绘制
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      
      if (mapInstance.value && mapInstance.value.editTools) {
        mapInstance.value.editTools.stopDrawing();
      }
      addLog('取消当前绘制以激活新工具');
    }
  }
  
  // 如果是绘图工具被激活（确保编辑工具不会触发绘图）
  if (drawToolIds.includes(toolId) && toolId !== editToolId) {
    // 确保地图双击缩放被禁用
    if (mapInstance.value) {
      mapInstance.value.doubleClickZoom.disable();
      info('绘图工具激活时禁用双击缩放');
      addLog('禁用地图双击缩放');
    }
    
    // 获取对应的形状类型
    const shapeType = getShapeTypeFromToolId(toolId);
    
    // 确保先完全停止任何可能的绘制
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      // 额外确保停止绘制
      if (mapInstance.value && mapInstance.value.editTools) {
        mapInstance.value.editTools.stopDrawing();
        // 清理drawer引用
        mapInstance.value.editTools._currentDrawer = null;
      }
      addLog('强制停止任何可能的绘制活动');
    }
    
    // 使用setTimeout确保前一个绘图工具完全停用后再启动新的
    setTimeout(() => {
      // 如果成功获取形状类型，并且绘图工具已初始化
    if (shapeType && shapeTool.value) {
        try {
          // 再次确认绘制状态
          if (shapeTool.value.isDrawing()) {
            shapeTool.value.cancelDrawing();
            // 额外确保停止绘制
            if (mapInstance.value && mapInstance.value.editTools) {
              mapInstance.value.editTools.stopDrawing();
              // 清理drawer引用
              if (mapInstance.value.editTools._currentDrawer) {
                mapInstance.value.editTools._currentDrawer = null;
              }
            }
            addLog('再次确认取消当前绘制');
          }
          
          // 开始绘制
          shapeTool.value.startDrawing(shapeType);
          addLog(`开始绘制形状: ${shapeType}`);
          info(`开始绘制形状: ${shapeType}`);
        } catch (e) {
          error(`激活绘图工具${toolId}时出错:`, e);
          addLog(`激活绘图工具${toolId}失败`, e);
        }
      } else {
        warn(`无法激活绘图工具${toolId}，绘图工具未初始化或形状类型无效`);
        addLog(`激活绘图工具${toolId}失败: 工具未初始化或形状类型无效`);
      }
    }, 100); // 增加延迟时间到100ms，确保有足够时间清理前一个绘图状态
  } else if (toolId === 'measure' && measureTool.value) {
    // 激活测量工具
    measureTool.value.start();
    addLog('测距工具已启动');
  } else if (toolId === 'drawPoint' && markerTool.value) {
    // 激活标记绘制
    markerTool.value.activate();
    addLog('标记点绘制模式已启用');
  } else if (toolId === 'debug') {
    // 打开调试面板
    openDebugPanel();
    addLog('打开调试面板');
  } else if (toolId === 'coordinate') {
    // 启用坐标显示模式
    enableCoordinateMode();
    addLog('坐标显示模式已启用');
  } else if (toolId === 'clear') {
    // 清除所有绘制的图形
    if (shapeTool.value) {
      shapeTool.value.clearShapes();
      addLog('所有图形已清除');
    }
    // 清除所有测量
    if (measureTool.value) {
      measureTool.value.clear();
      addLog('所有测量已清除');
    }
  } else if (toolId === 'zoomIn' && mapInstance.value) {
    // 放大地图
    mapInstance.value.zoomIn();
    addLog('地图放大');
  } else if (toolId === 'zoomOut' && mapInstance.value) {
    // 缩小地图
    mapInstance.value.zoomOut();
    addLog('地图缩小');
  } else if (toolId === 'fullView' && mapInstance.value) {
    // 全图显示
    mapInstance.value.fitBounds(mapInstance.value.getBounds());
    addLog('切换到全图视图');
  } else if (toolId === 'layerSwitch') {
    // 显示图层选择下拉菜单
    showLayerDropdown.value = true;
    // 更新下拉菜单位置
    nextTick(() => {
    updateLayerDropdownPosition();
    });
    addLog('显示图层选择下拉菜单');
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 启用聚合
    aggregationTool.value.enable();
    addLog('标记聚合已启用');
  } else if (toolId === 'showMarkers' && markerTool.value) {
    // 显示所有标记
    markerTool.value.showAllMarkers();
    addLog('所有标记已显示');
  } else if (toolId === 'hideMarkers' && markerTool.value) {
    // 隐藏所有标记
    markerTool.value.hideAllMarkers();
    addLog('所有标记已隐藏');
  } else if (toolId === 'showShapes' && shapeTool.value) {
    // 如果有显示图形的功能，可以在这里实现
    addLog('显示图形功能未实现');
  } else if (toolId === 'hideShapes' && shapeTool.value) {
    // 如果有隐藏图形的功能，可以在这里实现
    addLog('隐藏图形功能未实现');
  } else if (toolId === 'viewTrack' && trackPlayerController.value) {
    // 显示轨迹播放控制器
    trackPlayerState.visible = true;
    addLog('轨迹播放控制器已显示');
  } else if (toolId === 'edit' && shapeTool.value) {
    // 处理编辑工具激活，但不启动绘图
    addLog('编辑工具激活');
    
    // 更改鼠标样式为pointer，表示可以点击编辑
    if (mapInstance.value && mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = 'pointer';
      addLog('更新鼠标样式为pointer，表示可以编辑');
    }
    
    // 监听地图点击事件，用于处理编辑模式下的图形选择
    if (mapInstance.value) {
      // 注册shape-click事件，当点击图形时，将启用该图形的编辑功能
      shapeTool.value.on('shape-click', (data) => {
        // 如果编辑工具处于激活状态，则启用点击的图形编辑功能
        const editButton = mapToolbarRef.value?.getTools().find(tool => tool.id === 'edit');
        if (editButton && editButton.active === true && data.id) {
          try {
            // 先禁用所有图形的编辑功能
            shapeTool.value?.disableAllEditing();
            
            // 然后启用当前点击图形的编辑功能
            const editSuccess = shapeTool.value?.enableEditing(data.id);
            if (editSuccess) {
              addLog(`启用图形编辑: ${data.id}, 类型: ${data.type}`);
              info(`启用图形 ${data.id} 的编辑功能`);
            } else {
              warn(`无法启用图形 ${data.id} 的编辑功能`);
              addLog(`启用图形编辑失败: ${data.id}`);
            }
          } catch (e) {
            error(`启用图形编辑时出错:`, e);
            addLog(`启用图形编辑出错: ${data.id}`, e);
          }
        }
      });
    }
  } else if (toolId === 'delete' && shapeTool.value) {
    // 处理删除工具激活
    addLog('删除工具激活');
    
    // 更改鼠标样式为pointer，表示可以点击删除
    if (mapInstance.value && mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = 'pointer';
      addLog('更新鼠标样式为pointer，表示可以删除');
    }
    
    // 注册图形点击事件
    if (shapeTool.value) {
      shapeTool.value.on('shape-click', (data) => {
        // 如果删除工具处于激活状态，则删除被点击的图形
        const deleteButton = mapToolbarRef.value?.getTools().find(tool => tool.id === 'delete');
        if (deleteButton && deleteButton.active === true && data.id) {
          try {
            // 删除被点击的图形
            const removeSuccess = shapeTool.value?.removeShape(data.id);
            if (removeSuccess) {
              addLog(`删除图形: ${data.id}, 类型: ${data.type}`);
              info(`删除图形 ${data.id} 成功`);
              
              // 触发shape-removed事件，传递已删除的图形信息
              emit('shape-removed', {
                id: data.id,
                type: data.type,
                options: data.options || {}
              });
            } else {
              warn(`无法删除图形 ${data.id}`);
              addLog(`删除图形失败: ${data.id}`);
            }
          } catch (e) {
            error(`删除图形时出错:`, e);
            addLog(`删除图形出错: ${data.id}`, e);
          }
        }
      });
    }
    
    // 注册标记点点击事件
        if (markerTool.value) {
      // 使用marker-click事件处理删除标记点
      markerTool.value.on('marker-click', (marker) => {
        // 如果删除工具处于激活状态，则删除被点击的标记点
        const deleteButton = mapToolbarRef.value?.getTools().find(tool => tool.id === 'delete');
        if (deleteButton && deleteButton.active === true && marker && marker.options && marker.options.markerId) {
          try {
            // 删除被点击的标记点
            const removeSuccess = markerTool.value?.removeMarker(marker.options.markerId);
            if (removeSuccess) {
              addLog(`删除标记点: ${marker.options.markerId}`);
              info(`删除标记点 ${marker.options.markerId} 成功`);
              
              // 触发marker-removed事件，传递已删除的标记点信息
              emit('marker-removed', {
                id: marker.options.markerId,
                options: marker.options || {}
              });
            } else {
              warn(`无法删除标记点 ${marker.options.markerId}`);
              addLog(`删除标记点失败: ${marker.options.markerId}`);
            }
          } catch (e) {
            error(`删除标记点时出错:`, e);
            addLog(`删除标记点出错: ${marker.options.markerId}`, e);
          }
        }
      });
    }
  }  // 标记点显示/隐藏
  else if (toolId === 'toggleMarkers') {
    if (markerTool.value) {
      markerTool.value.hideAllMarkers();
      info('隐藏所有标记点');
      addLog('隐藏所有标记点');
    }
  }
  // 标签显示/隐藏
  else if (toolId === 'toggleLabels') {
    if (markerTool.value) {
      markerTool.value.hideAllLabels();
      info('隐藏所有标记点标签');
      addLog('隐藏所有标记点标签');
    }
  }else if (toolId === 'overview' && overviewTool.value) {
    // 禁用鹰眼控件
    overviewTool.value.enable();
    addLog('启用鹰眼控件'); // 添加日志记录
    info('通过工具栏启用鹰眼控件');
  }  
  else if (toolId === 'trackPlay') {
    // 停止轨迹播放
    if (trackPlayerController.value) {
      trackPlayerController.value.pause();
      addLog('停止轨迹播放'); // 添加日志记录
      info('通过工具栏停止轨迹播放');
    }
    // 隐藏轨迹播放器面板
    showTrackPlayerPanel();
    addLog('显示轨迹播放器面板'); // 添加日志记录
    info('显示轨迹播放器面板');
  }
}

// 辅助函数：重置即时工具按钮状态
const resetInstantToolButtonState = (toolId: string): void => {
  if (mapToolbarRef.value) {
    const tools = mapToolbarRef.value.getTools();
    const updatedTools = tools.map(tool => {
      if (tool.id === toolId) {
        return { ...tool, active: false };
      }
      return tool;
    });
    mapToolbarRef.value.setTools(updatedTools);
  }
};


// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  emit('tool-deactivated', toolId);
  addLog(`工具停用: ${toolId}`); // 添加日志记录
  
  const drawToolIds = ['drawCircle', 'drawRectangle', 'drawPolygon', 'drawPolyline'];
  
  // 处理绘图工具的停用
  if (drawToolIds.includes(toolId)) {
    // 用户明确停用绘图工具，停止当前绘制
    if (shapeTool.value) {
      // 然后通过shapeTool取消绘制
      shapeTool.value.cancelDrawing();
      addLog(`停止绘制: ${toolId}`); // 添加日志记录
      info(`停止绘制: ${toolId}`);
    }
  } else if (toolId === 'edit' && shapeTool.value) {
    // 停用编辑工具时，禁用所有图形的编辑功能
    shapeTool.value.disableAllEditing();
    
    // 恢复鼠标样式
    if (mapInstance.value && mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = '';
      addLog('恢复默认鼠标样式');
    }
    
    addLog('禁用所有图形的编辑功能');
  } else if (toolId === 'delete' && shapeTool.value) {
    // 停用删除工具时，恢复默认鼠标样式
    if (mapInstance.value && mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = '';
      addLog('停用删除工具，恢复默认鼠标样式');
    }
    
    addLog('删除工具已停用');
  } else if (toolId === 'measure' && measureTool.value) {
    // 停止测量工具
    measureTool.value.stop();
    measureTool.value.clear();
    addLog('停止测距工具'); // 添加日志记录
  } else if (toolId === 'drawPoint') {
    // 停用点绘制模式
    disableDrawPoint();
    addLog('停用标记点绘制模式'); // 添加日志记录
  } else if (toolId === 'debug') {
    closeDebugPanel();
    addLog('关闭调试面板'); // 添加日志记录
  } else if (toolId === 'coordinate') {
    // 停用坐标模式
    disableCoordinateMode();
    addLog('停用坐标模式'); // 添加日志记录
  } else if (toolId === 'layerSwitch') {
    // 关闭图层下拉菜单
    showLayerDropdown.value = false;
    addLog('关闭图层下拉菜单'); // 添加日志记录
  } else if (toolId === 'overview' && overviewTool.value) {
    // 禁用鹰眼控件
    overviewTool.value.disable();
    addLog('禁用鹰眼控件'); // 添加日志记录
    info('通过工具栏禁用鹰眼控件');
  } else if (toolId === 'cluster' && aggregationTool.value) {
    // 禁用聚合功能
    aggregationTool.value.disable();
    addLog('禁用标记点聚合功能'); // 添加日志记录
    info('通过工具栏禁用标记点聚合功能');
  } else if (toolId === 'zoomIn' || toolId === 'zoomOut' || toolId === 'fullView') {
    // 对于即时执行工具，确保停用按钮状态
    resetInstantToolButtonState(toolId);
    addLog(`即时工具完成操作: ${toolId}`); // 添加日志记录
    info(`即时工具已完成操作: ${toolId}`);
  } else if (toolId === 'trackPlay') {
    // 停止轨迹播放
    if (trackPlayerController.value) {
      trackPlayerController.value.pause();
      addLog('停止轨迹播放'); // 添加日志记录
      info('通过工具栏停止轨迹播放');
    }
    // 隐藏轨迹播放器面板
    hideTrackPlayerPanel();
    addLog('隐藏轨迹播放器面板'); // 添加日志记录
    info('隐藏轨迹播放器面板');
  } else if (toolId === 'heatmap') {
    if (heatMapTool.value && heatMapTool.value.isEnabled()) {
      heatMapTool.value.disable();
      addLog('热力图已禁用');
    }
  } 
  // 标记点显示/隐藏
  else if (toolId === 'toggleMarkers') {
    if (markerTool.value) {
      markerTool.value.showAllMarkers();
      info('显示所有标记点');
      addLog('显示所有标记点');
    }
  }
  // 标签显示/隐藏
  else if (toolId === 'toggleLabels') {
    if (markerTool.value) {
      markerTool.value.showAllLabels();
      info('显示所有标记点标签');
      addLog('显示所有标记点标签');
    }
  }
};

// 检查工具栏中是否有激活的鹰眼按钮
const checkOverviewButtonActive = (): boolean => {
  // 检查工具栏配置中是否有鹰眼按钮
  if (!computedToolbarConfig.value || !computedToolbarConfig.value.items) {
    return false;
  }
  
  // 查找ID为'overview'的工具项
  const overviewButton = computedToolbarConfig.value.items.find(item => item.id === 'overview');
  
  // 如果找到了鹰眼按钮并且它是激活状态，返回true
  return !!overviewButton && overviewButton.active === true;
};

// 清除测量结果
const clearMeasurement = (): void => {
  if (measureTool.value) {
    measureTool.value.clear();
  }
};

onMounted(async () => {
  addLog('地图组件挂载开始');
  // 动态导入leaflet
  if (!L) {
    info('动态导入Leaflet');
    addLog('开始动态导入Leaflet');
    try {
      L = (await import("leaflet")).default;
      info('Leaflet导入成功:', !!L);
      addLog('Leaflet导入成功');
      
      // 动态导入leaflet-minimap
      try {
        await import("leaflet-minimap");
        info('leaflet-minimap导入成功');
        addLog('leaflet-minimap导入成功');
        
        // 尝试加载CSS样式
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet-minimap@3.6.1/dist/Control.MiniMap.min.css';
        document.head.appendChild(link);
      } catch (miniMapError) {
        console.error('导入leaflet-minimap失败:', miniMapError);
        addLog('导入leaflet-minimap失败', miniMapError);
      }
      
      // 尝试加载leaflet.markercluster插件
      try {
        // 尝试加载CSS样式
        const clusterCssLink1 = document.createElement('link');
        clusterCssLink1.rel = 'stylesheet';
        clusterCssLink1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
        document.head.appendChild(clusterCssLink1);
        
        const clusterCssLink2 = document.createElement('link');
        clusterCssLink2.rel = 'stylesheet';
        clusterCssLink2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
        document.head.appendChild(clusterCssLink2);
        
        await import("leaflet.markercluster");
        info('leaflet.markercluster导入成功');
        addLog('leaflet.markercluster导入成功');
      } catch (clusterError) {
        console.error('导入leaflet.markercluster失败:', clusterError);
        warn('标记点聚合功能将不可用，请安装leaflet.markercluster依赖');
        addLog('导入leaflet.markercluster失败', clusterError);
      }
    } catch (e) {
      console.error('导入Leaflet失败:', e);
      addLog('导入Leaflet失败', e);
    }
  }
  
  await nextTick();
  initMap();
  addLog('地图组件挂载完成');
});

onUnmounted(() => {
  addLog('地图组件开始卸载');
  
  // 如果坐标模式处于激活状态，先停止它
  if (coordinateMode.value) {
    disableCoordinateMode();
  }
  
  // 关闭所有弹窗，特别是防止_latLngToNewLayerPoint错误
  safeCloseAllPopups();
  
  // 停止所有正在进行的工具操作
  if (measureTool.value) {
    measureTool.value.stop();
  }
  
  if (markerTool.value) {
    markerTool.value.deactivate();
  }
  
  if (shapeTool.value && shapeTool.value.isDrawing()) {
    shapeTool.value.cancelDrawing();
  }
  
  // 销毁地图实例
  if (mapInstance.value) {
    // 先停止所有动画和回调
    if (trackPlayerController.value) {
      trackPlayerController.value.stop();
      trackPlayerController.value.destroy();
      trackPlayerController.value = null;
    }
    
    if (heatMapTool.value) {
      heatMapTool.value.destroy();
      heatMapTool.value = null;
    }
    
    if (migrationTool.value) {
      migrationTool.value.destroy();
      migrationTool.value = null;
    }
    
    if (markerTool.value) {
      markerTool.value.destroy();
    markerTool.value = null;
    }
    
    if (aggregationTool.value) {
      aggregationTool.value.destroy();
      aggregationTool.value = null;
    }
    
  if (shapeTool.value) {
      // 取消当前绘图
      if (shapeTool.value.isDrawing()) {
    shapeTool.value.cancelDrawing();
      }
      // 清除所有图形
      shapeTool.value.clearShapes();
    shapeTool.value = null;
    }
    
    if (measureTool.value) {
      measureTool.value = null;
    }
    
    if (overviewTool.value) {
      // Overview类没有destroy和disable方法
      overviewTool.value = null;
    }
    
    // 清除所有事件监听器
    unregisterMapEvents();
    
    // 移除所有图层
    if (tileLayer.value) {
      mapInstance.value.removeLayer(tileLayer.value);
      tileLayer.value = null;
    }
    
    // 显式关闭所有弹窗
    mapInstance.value.closePopup();
    
    // 移除所有缩放事件监听，确保不会引发_latLngToNewLayerPoint错误
    mapInstance.value.off('zoomstart');
    mapInstance.value.off('zoom');
    mapInstance.value.off('zoomend');
    
    // 销毁地图实例
    mapInstance.value.remove();
    mapInstance.value = null;
    
    addLog('地图实例已销毁');
  }
  
  addLog('地图组件卸载完成');
});

// 注册地图事件处理函数
const registerMapEvents = (): void => {
  if (!mapInstance.value) return;
  
  // 监听地图缩放事件
  mapInstance.value.on('zoomend', () => {
    if (!mapInstance.value) return;
    const newZoom = mapInstance.value.getZoom();
    internalZoom.value = newZoom;
    emit('update:zoom', newZoom);
    // 记录缩放动画结束
    addLog('地图缩放动画结束', {zoom: newZoom});
  });
  
  // 监听地图缩放过程事件
  mapInstance.value.on('zoom', () => {
    // 在缩放过程中关闭所有弹窗，防止出现错误
    safeCloseAllPopups();
  });
  
  // 监听地图移动事件
  mapInstance.value.on('moveend', () => {
    if (!mapInstance.value) return;
    const center = mapInstance.value.getCenter();
    emit('update:center', [center.lat, center.lng]);
  });
  
  // 监听点击事件，用于获取坐标
  mapInstance.value.on('click', (e: any) => handleMapClick(e));
  
  // 添加缩放动画开始事件监听
  mapInstance.value.on('zoomstart', () => {
    addLog('地图缩放动画开始');
  });
};

// 注销地图事件监听
const unregisterMapEvents = (): void => {
  if (!mapInstance.value) return;
  
  mapInstance.value.off('zoomend');
  mapInstance.value.off('moveend');
  mapInstance.value.off('dragend');
};

// 更新拖动状态
const updateDraggingState = (): void => {
  if (!mapInstance.value) return;
  
  if (props.dragging) {
    mapInstance.value.dragging.enable();
  } else {
    mapInstance.value.dragging.disable();
  }
  
  internalDragging.value = props.dragging;
};

// 处理工具点击事件
const handleToolClick = (event: { id: string; active: boolean; toggleState?: boolean }): void => {
  //记录日志
  info(`工具点击事件: ${event.id}, 激活状态: ${event.active}`);
  addLog('工具点击事件', {id: event.id, active: event.active, toggleState: event.toggleState});
  
  // 注意：toggleMarkers和toggleLabels的功能已移至handleToolActivated和handleToolDeactivated
};

// 启用绘制点功能
const enableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  try {
    // 停止其他可能正在进行的绘图操作
    if (shapeTool.value && shapeTool.value.isDrawing()) {
      shapeTool.value.cancelDrawing();
      addLog('取消当前绘制，准备添加标记点');
    }
    
    // 设置鼠标为十字光标
    if (mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = 'crosshair';
    }
    
    // 激活标记工具
    markerTool.value.activate();
    addLog('启用添加标记点模式');
    info('启用添加标记点模式');
  } catch (e) {
    error('启用标记点模式失败:', e);
    addLog('启用标记点模式失败', e);
  }
};

// 禁用绘制点功能
const disableDrawPoint = (): void => {
  if (!mapInstance.value || !markerTool.value) return;
  
  try {
    // 恢复默认鼠标样式
    if (mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = '';
    }
    
    // 停用标记工具
    markerTool.value.deactivate();
    addLog('禁用添加标记点模式');
    info('禁用添加标记点模式');
  } catch (e) {
    error('禁用标记点模式失败:', e);
    addLog('禁用标记点模式失败', e);
  }
};

// 启用坐标模式
const enableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  try {
    coordinateMode.value = true;
    showCoordinatePanel.value = true;
    
    // 监听鼠标移动事件，实时更新坐标
    mapInstance.value.on('mousemove', updateCoordinates);
    addLog('启用坐标模式');
  } catch (e) {
    error('启用坐标模式失败:', e);
    addLog('启用坐标模式失败', e);
  }
};

// 禁用坐标模式
const disableCoordinateMode = (): void => {
  if (!mapInstance.value) return;
  
  try {
    coordinateMode.value = false;
    showCoordinatePanel.value = false;
    
    // 移除鼠标移动事件监听
    mapInstance.value.off('mousemove', updateCoordinates);
    addLog('禁用坐标模式');
  } catch (e) {
    error('禁用坐标模式失败:', e);
    addLog('禁用坐标模式失败', e);
  }
};

// 更新坐标显示
const updateCoordinates = (e: any): void => {
  if (!coordinateMode.value) return;
  
  const { lat, lng } = e.latlng;
  currentLat.value = lat;
  currentLng.value = lng;
  
  // 发出坐标变化事件
  emit('coordinate-change', { lat, lng });
  // 坐标变化太频繁，不记录日志，避免日志爆炸
};


// 关闭图层下拉菜单
const closeLayerDropdown = (): void => {
  showLayerDropdown.value = false;
  addLog('关闭图层下拉菜单');
  
  // 重置图层切换按钮的状态，确保按钮不会保持激活状态
  if (mapToolbarRef.value) {
    const tools = mapToolbarRef.value.getTools();
    const newTools = tools.map(tool => {
      if (tool.id === 'layerSwitch') {
        return { ...tool, active: false };
      }
      return tool;
    });
    mapToolbarRef.value.setTools(newTools);
  }
};

// 处理图层选择事件
const handleLayerSelect = (layerType: string): void => {
  // 确保layerType是字符串类型
  const layerTypeString = String(layerType);
  
  // 检查该图层类型是否存在于mapType中
  if (layerTypeString && props.mapType[layerTypeString]) {
    emit('update:layerType', layerTypeString);
    emit('layer-change', layerTypeString);
    addLog('图层切换', {layerType: layerTypeString});

    selectedLayerTypeString.value = layerTypeString;
    // 当图层类型改变时，更新瓦片图层
    if (mapInstance.value && tileLayer.value) {
      tileLayer.value.setUrl(props.mapType[layerTypeString].url);
    }
  }
};

// 初始化地图
const initMap = (): void => {
  if (!mapContainer.value) {
    error('地图容器元素不存在');
    addLog('初始化地图失败: 容器元素不存在');
    return;
  }
  
  try {
    // 创建地图实例
    info('正在创建地图实例...');
    addLog('正在创建地图实例');
    info('L对象状态:', !!L);
    info('地图容器状态:', !!mapContainer.value);
    
    // 创建地图实例前打印容器尺寸
    const containerElement = mapContainer.value;
    if (containerElement) {
      const containerSize = {
        width: containerElement.clientWidth,
        height: containerElement.clientHeight,
        offsetWidth: containerElement.offsetWidth,
        offsetHeight: containerElement.offsetHeight
      };
      info('容器尺寸:', containerSize);
      addLog('地图容器尺寸', containerSize);
    }
    
    mapInstance.value = L.map(mapContainer.value, {
      center: props.center,
      editable: true,
      zoom: props.zoom,
      dragging: props.dragging,
      scrollWheelZoom: props.scrollWheelZoom,
      zoomControl: false, // 禁用默认的缩放控件
      attributionControl: false,
      doubleClickZoom: false // 全局禁用双击缩放
    });
    
    // 添加防止缩放时出现popup错误的保护措施
    mapInstance.value.on('zoomstart', () => {
      safeCloseAllPopups();
    });
    
    // 检查地图实例是否创建成功
    info('地图实例创建:', !!mapInstance.value);
    addLog('地图实例创建状态', {success: !!mapInstance.value});
    
    // 添加一个测试事件监听，检测地图点击是否能正常工作
    if (mapInstance.value) {
      mapInstance.value.once('click', (e: any) => {
        info('地图实例化后测试点击事件:', e.latlng);
        addLog('地图测试点击', {lat: e.latlng.lat, lng: e.latlng.lng});
      });
      
      // 添加测试双击事件监听器
      mapInstance.value.on('dblclick', (e: any) => {
        info('地图实例化后测试双击事件:', e.latlng);
        addLog('地图测试双击', {lat: e.latlng.lat, lng: e.latlng.lng});
        console.log('地图双击事件触发', e);
      });
      
      // 确保双击缩放被禁用
      mapInstance.value.doubleClickZoom.disable();
      info('初始化时确保双击缩放被禁用');
    }
    
    // 初始化内部状态
    internalZoom.value = props.zoom;
    internalDragging.value = props.dragging;
    info('地图初始化完成');
    addLog('地图初始化完成', {zoom: props.zoom, center: props.center});
    
    // 注册事件监听
    registerMapEvents();
    info('地图事件监听注册完成');
    addLog('地图事件监听注册完成');
    
    // 添加瓦片图层
    addTileLayer();
    info('瓦片图层添加完成');
    addLog('瓦片图层添加完成', {url: tileUrl.value});
    
    // 等待地图加载完成后再初始化工具
    mapInstance.value.whenReady(() => {
      info('地图准备就绪，开始初始化工具...');
      addLog('地图准备就绪，开始初始化工具');
      
      initializeAfterMapLoaded();
    });
  } catch (e) {
    console.error('初始化地图失败:', e);
    error('初始化地图失败:', e);
    addLog('初始化地图失败', {error: String(e)});
  }
};

// 添加瓦片图层
const addTileLayer = (): void => {
  if (!mapInstance.value) return;
  
  // 先移除已有图层
  if (tileLayer.value) {
    mapInstance.value.removeLayer(tileLayer.value);
  }
  
  // 添加新图层
  let url = tileUrl.value;
  if (props.apiKey) {
    url += url.includes('?') ? `&key=${props.apiKey}` : `?key=${props.apiKey}`;
  }
  
  tileLayer.value = L.tileLayer(url, {
    attribution: attribution.value
  }).addTo(mapInstance.value);
};

// 监听图层类型变化
watch(() => props.layerType, () => {
  addTileLayer();
});

// 监听自定义URL变化
watch(() => props.url, () => {
  addTileLayer();
});

// 监听中心点变化
watch(() => props.center, (newVal) => {
  if (mapInstance.value) {
    mapInstance.value.setView(newVal, mapInstance.value.getZoom());
  }
}, { deep: true });

// 监听缩放级别变化
watch(() => props.zoom, (newVal) => {
  if (mapInstance.value && newVal !== internalZoom.value) {
    internalZoom.value = newVal;
    mapInstance.value.setZoom(newVal);
  }
});

// 监听拖动状态变化
watch(() => props.dragging, (newVal) => {
  if (newVal !== internalDragging.value) {
    updateDraggingState();
  }
});

// 监听滚轮缩放状态变化
watch(() => props.scrollWheelZoom, (newVal) => {
  if (!mapInstance.value) return;
  
  if (newVal) {
    mapInstance.value.scrollWheelZoom.enable();
  } else {
    mapInstance.value.scrollWheelZoom.disable();
  }
});

// 等待地图加载完成后初始化各种工具
watch(() => mapInstance.value, (newVal) => {
  if (newVal) {
    info('地图实例已加载，设置监听器和初始工具');
    
    // 初始化各种工具
    initializeAfterMapLoaded();
    
    // 监听地图事件
    newVal.on('moveend', handleMapMoveEnd);
    newVal.on('zoomend', handleMapZoomEnd);
    newVal.on('mousemove', handleCoordinateChange);
    
    // 设置初始图层
    setLayer(selectedLayerTypeString.value);
    
    // 添加比例尺控件
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(newVal);
  }
}, { immediate: true });

// 在初始化绘图工具函数中调用扩展方法
const initShapeTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 创建基于 leaflet-editable 的绘图工具实例
    shapeTool.value = new ShapeEditable(mapInstance.value, addLog, mapToolbarRef.value);
    addLog('绘图工具实例化成功 (使用leaflet-editable)');
    info('绘图工具 ShapeEditable 实例化成功');
    
    // 注册事件监听
    // 形状创建完成事件
    shapeTool.value.on('shape-created', (data) => {
      try {
        info('形状创建完成:', data);
        // 提取形状数据
        const shapeData = {
          id: data.id,
          type: data.type,
          options: data.options,
          layer: data.layer
        };
        
        // 触发事件
        emit('shape-created', shapeData);
        addLog('形状创建完成', {id: data.id, type: data.type});
      } catch (e) {
        error('处理形状创建事件时出错:', e);
        addLog('处理形状创建事件失败', e);
      }
    });
    
    // 形状编辑事件
    shapeTool.value.on('shape-edited', (data) => {
      try {
        info('形状编辑完成:', data);
        addLog('形状编辑完成', {layer: data});
      } catch (e) {
        error('处理形状编辑事件时出错:', e);
        addLog('处理形状编辑事件失败', e);
      }
    });
    
    // 形状删除事件
    shapeTool.value.on('shape-removed', (data) => {
      try {
        info('形状已删除:', data.id);
        // 触发删除事件
        emit('shape-removed', {
          id: data.id,
          options: data.options
        });
        addLog('形状已删除', {id: data.id});
      } catch (e) {
        error('处理形状删除事件时出错:', e);
        addLog('处理形状删除事件失败', e);
      }
    });
    
    // 形状绘制开始事件
    shapeTool.value.on('drawing-start', (data) => {
      try {
        info('开始绘制形状:', data.type);
        addLog('开始绘制形状', {type: data.type});
      } catch (e) {
        error('处理绘制开始事件时出错:', e);
        addLog('处理绘制开始事件失败', e);
      }
    });
    
    // 形状绘制结束事件
    shapeTool.value.on('drawing-end', (data) => {
      try {
        info('绘制结束:', data);
        addLog('绘制结束', {id: data.id, type: data.type});
        if(shapeTool.value && shapeTool.value.isDrawing() && shapeTool.value.getCurrentDrawingType()) {
           shapeTool.value.startDrawing(shapeTool.value.getCurrentDrawingType() as ShapeType);
        }
      } catch (e) {
        error('处理绘制结束事件时出错:', e);
        addLog('处理绘制结束事件失败', e);
      }
    });
    
    // 形状绘制取消事件
    shapeTool.value.on('drawing-cancel', () => {
      try {
        info('绘制已取消');
        addLog('绘制已取消');
      } catch (e) {
        error('处理绘制取消事件时出错:', e);
        addLog('处理绘制取消事件失败', e);
      }
    });

    // 添加形状点击事件处理
    shapeTool.value.on('shape-click', (data) => {
      try {
        info('形状点击:', data);
        addLog('形状点击', {id: data.id, type: data.type});
        
        // 可以在这里发出自定义事件，通知父组件
        emit('shape-click', {
          id: data.id,
          type: data.type,
          center: data.center,
          options: data.options,
          data: data.options?.data || {}
        });
      } catch (e) {
        error('处理形状点击事件时出错:', e);
        addLog('处理形状点击事件失败', e);
      }
    });
    
  } catch (e) {
    error('初始化绘图工具失败:', e);
    addLog('初始化绘图工具失败', e);
  }
};

// 在地图加载完成后初始化各种工具
const initializeAfterMapLoaded = () => {
  if (!mapInstance.value) return;
  
  initMapTools();
};

/**
 * 初始化轨迹播放器
 */
const initTrackPlayer = (options?: Partial<TrackPlayerOptions>): boolean => {
  if (!mapInstance.value) {
    warn('地图尚未初始化，无法创建轨迹播放器');
    addLog('轨迹播放器初始化失败: 地图尚未初始化');
    return false;
  }

  try {
    // 创建轨迹播放控制器
    const playerOptions = {
      ...DEFAULT_TRACK_PLAYER_OPTIONS,
      ...props.trackPlayerConfig,
      autoCenter: props.trackPlayerConfig?.autoCenter ?? DEFAULT_TRACK_PLAYER_OPTIONS.autoCenter ?? false
    };

    trackPlayerController.value = new TrackPlayerController(mapInstance.value, playerOptions);
    addLog('轨迹播放器控制器创建成功', playerOptions);

    // 轨迹列表初始化
    if (props.trackPlayerConfig?.trackList && props.trackPlayerConfig.trackList.length > 0) {
      const tracksCount = props.trackPlayerConfig.trackList.length;
      props.trackPlayerConfig.trackList.forEach(track => {
        trackPlayerController.value?.addTrack(track);
      });
      addLog(`初始化添加${tracksCount}条轨迹到播放器`);
    }

    // 更新状态
    trackPlayerState.enabled = true;

    // 事件监听
    if (trackPlayerController.value) {
      // 处理轨迹进度更新
      trackPlayerController.value.on('play-progress', (data: any) => {
        if (data) {
          trackPlayerState.progress = data.progress || 0;
          trackPlayerState.currentTime = data.currentTime || 0;
          // 进度更新事件太频繁，不记录日志
        }
      });

      // 处理播放状态变化
      trackPlayerController.value.on('play-start', (data: any) => {
        trackPlayerState.isPlaying = true;
        if (data && data.trackId) {
          trackPlayerState.currentTrackId = data.trackId;
          addLog('轨迹播放开始', { trackId: data.trackId });
        } else {
          addLog('轨迹播放开始');
        }
      });

      trackPlayerController.value.on('play-pause', () => {
        trackPlayerState.isPlaying = false;
        addLog('轨迹播放暂停');
      });

      // 处理轨迹完成
      trackPlayerController.value.on('play-finished', () => {
        trackPlayerState.isPlaying = false;
        trackPlayerState.progress = trackPlayerState.loop ? 0 : 1;
        addLog('轨迹播放完成', { loopEnabled: trackPlayerState.loop });
      });

      // 处理速度变化
      trackPlayerController.value.on('speed-change', (data: any) => {
        if (data && data.speed) {
          trackPlayerState.speed = data.speed;
          addLog('轨迹播放速度变更', { speed: data.speed });
        }
      });

      // 处理当前轨迹变化
      trackPlayerController.value.on('current-track-change', (data: any) => {
        if (data && data.trackId) {
          trackPlayerState.currentTrackId = data.trackId;
          addLog('当前轨迹变更', { trackId: data.trackId });
        }
      });
    }

    info('轨迹播放器初始化完成');
    addLog('轨迹播放器初始化完成');
    return true;
  } catch (e) {
    error('初始化轨迹播放器失败:', e);
    addLog('初始化轨迹播放器失败', e);
    return false;
  }
};
// 处理地图移动结束事件
const handleMapMoveEnd = (e: any) => {
  // 获取新的中心点
  if (mapInstance.value) {
    const center = mapInstance.value.getCenter();
    // 触发中心点更新事件
    emit('update:center', [center.lat, center.lng]);
    addLog('地图移动结束', {lat: center.lat, lng: center.lng});
  }
};

// 处理地图缩放结束事件
const handleMapZoomEnd = (e: any) => {
  // 获取新的缩放级别
  if (mapInstance.value) {
    const zoom = mapInstance.value.getZoom();
    internalZoom.value = zoom;
    // 触发缩放级别更新事件
    emit('update:zoom', zoom);
    addLog('地图缩放结束', {zoom});
  }
};

// 处理坐标变化事件
const handleCoordinateChange = (e: any) => {
  if (!mapInstance.value || !coordinateMode.value) return;
  
  // 更新坐标值
  currentLat.value = e.latlng.lat;
  currentLng.value = e.latlng.lng;
  
  // 触发坐标变化事件
  emit('coordinate-change', { lat: e.latlng.lat, lng: e.latlng.lng });
};

// 设置地图图层
const setLayer = (layerType: string) => {
  if (!mapInstance.value) return;
  
  info(`设置地图图层: ${layerType}`);
  
  // 获取图层配置
  const layerConfig = props.mapType[layerType] || props.mapType.NORMAL;
  
  // 移除现有图层
  if (tileLayer.value) {
    mapInstance.value.removeLayer(tileLayer.value);
  }
  
  // 创建新图层
  tileLayer.value = L.tileLayer(layerConfig.url, {
    attribution: layerConfig.attribution,
    maxZoom: 18
  }).addTo(mapInstance.value);
  
  // 更新当前图层类型
  selectedLayerTypeString.value = layerType;
  
  // 触发图层变化事件
  emit('update:layerType', layerType);
  emit('layer-change', layerType);
};

// 更新图层下拉菜单位置
const updateLayerDropdownPosition = () => {
  if (!mapInstance.value || !mapToolbarRef.value) return;
  
  try {
    const tools = mapToolbarRef.value.getTools();
    const layerSwitchTool = tools.find(tool => tool.id === 'layerSwitch');
    
    if (!layerSwitchTool) return;
    
    // 获取工具栏元素
    const toolbarElement = mapToolbarRef.value.$el as HTMLElement;
    
    // 查找图层切换按钮元素
    const toolbarItems = Array.from(toolbarElement.querySelectorAll('.toolbar-item'));
    let layerSwitchElement: HTMLElement | null = null;
    
    for (let i = 0; i < toolbarItems.length; i++) {
      const item = toolbarItems[i] as HTMLElement;
      // 如果工具项包含了正确的ID或工具提示文本
      if (item.innerText.includes(layerSwitchTool.tooltip || '')) {
        layerSwitchElement = item;
        break;
      }
    }
    
    if (!layerSwitchElement) {
      addLog('图层切换按钮元素未找到');
      return;
    }
    
    // 获取按钮位置
    const buttonRect = layerSwitchElement.getBoundingClientRect();
    const mapRect = mapInstance.value.getContainer().getBoundingClientRect();
    
    // 获取工具栏位置
    const toolbarPosition = props.toolbarConfig?.position || 'top-left';
    
    // 计算下拉菜单应该出现的位置
    let dropdownX = buttonRect.left - mapRect.left;
    let dropdownY = buttonRect.bottom - mapRect.top;
    
    // 确定放置方向（顶部或底部）
    let placement: 'top' | 'bottom' = 'bottom';
    
    // 根据工具栏位置调整下拉框位置
    if (toolbarPosition.includes('right')) {
      // 如果工具栏在右侧
      // 使用按钮的相对水平位置
      // 将下拉框对齐到按钮的右侧
      dropdownX = buttonRect.right - mapRect.left - 460; // 460是下拉框的宽度
    }
    
    if (toolbarPosition.includes('bottom')) {
      // 如果工具栏在底部，下拉框应该向上展开
      dropdownY = buttonRect.top - mapRect.top;
      placement = 'top';
    }
    
    // 确保下拉框不会超出地图边界
    const mapWidth = mapRect.width;
    dropdownX = Math.max(10, Math.min(dropdownX, mapWidth - 470)); // 保持10px边距
    
    // 设置下拉框位置并传递额外信息
    layerDropdownPosition.value = {
      x: dropdownX,
      y: dropdownY,
      mapWidth: mapRect.width,
      mapHeight: mapRect.height,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      isRightSide: toolbarPosition.includes('right'),
      isBottomSide: toolbarPosition.includes('bottom')
    };
    
    // 设置放置方式
    layerDropdownPlacement.value = placement;
    
    addLog('图层下拉菜单位置更新', {
      placement,
      position: {x: dropdownX, y: dropdownY},
      toolbarPosition
    });
  } catch (error) {
    console.error('更新图层下拉位置失败:', error);
    addLog('更新图层下拉位置失败', error);
  }
};

// 初始化测距工具
const initMeasureTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化测距工具
    measureTool.value = new Measure(mapInstance.value);
    addLog('测距工具初始化成功');
  } catch (e) {
    error('测距工具初始化失败:', e);
    addLog('测距工具初始化失败', e);
  }
};

// 初始化标记工具
const initMarkerTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化标记工具
    markerTool.value = new Marker(mapInstance.value, addLog);
    
    // 监听标记事件
    if (markerTool.value) {
      // 标记点击事件
      markerTool.value.on('marker-click', (marker: any, eventData: any) => {
        if (marker && marker.options && marker.options.markerId) {
          const position = marker.getLatLng();
          emit('marker-click', {
            id: marker.options.markerId,
            latlng: [position.lat, position.lng],
            data: marker.options.markerCustomData || {}
          });
          addLog('标记点击事件触发', { id: marker.options.markerId });
        }
      });
      
      // 标记添加事件
      markerTool.value.on('marker-add', (marker: any) => {
        if (marker && marker.options && marker.options.markerId) {
          const position = marker.getLatLng();
          emit('marker-created', {
            id: marker.options.markerId,
            latlng: [position.lat, position.lng],
            options: {
              ...marker.options,
              // 移除非数据属性
              icon: undefined
            }
          });
          addLog('标记创建事件触发', { id: marker.options.markerId });
        }
      });
      
      // 标记移除事件
      markerTool.value.on('marker-remove', (marker: any) => {
        if (marker && marker.options && marker.options.markerId) {
          emit('marker-removed', {
            id: marker.options.markerId
          });
          addLog('标记移除事件触发', { id: marker.options.markerId });
        }
      });
    }
    
    addLog('标记工具初始化成功');
  } catch (e) {
    error('标记工具初始化失败:', e);
    addLog('标记工具初始化失败', e);
  }
};

// 初始化鹰眼控件
const initOverviewTool = () => {
  if (!mapInstance.value) return;
  
  try {
    // 实例化鹰眼控件并配置
    overviewTool.value = new Overview(mapInstance.value, props.overviewConfig);
    addLog('鹰眼控件初始化成功', props.overviewConfig);
    
    // 如果配置了自动激活，则启用鹰眼
    if (props.overviewConfig && props.overviewConfig.autoActivate) {
      overviewTool.value.enable();
      addLog('鹰眼控件自动激活');
    }
  } catch (e) {
    error('鹰眼控件初始化失败:', e);
    addLog('鹰眼控件初始化失败', e);
  }
};

// 初始化聚合工具
const initAggregationTool = () => {
  if (!mapInstance.value || !markerTool.value) {
    warn('地图或标记工具未初始化，无法初始化聚合工具');
    return;
  }
  
  try {
    // 合并用户配置和默认配置
    const mergedConfig = { ...(props.aggregationConfig || {}) };
    
    // 实例化聚合工具
    aggregationTool.value = new Aggregation(
      mapInstance.value, 
      markerTool.value['markerLayerGroup'], 
      mergedConfig as AggregationOptions
    );
    
    // 如果配置了自动启用，则启用聚合功能
    if (mergedConfig.enabled) {
          aggregationTool.value.enable();
          
          // 更新工具栏聚合按钮状态
          if (mapToolbarRef.value) {
            const tools = mapToolbarRef.value.getTools();
            const updatedTools = tools.map(tool => {
              if (tool.id === 'cluster') {
                return { ...tool, active: true };
              }
              return tool;
            });
            mapToolbarRef.value.setTools(updatedTools);
          }
    }
  } catch (e) {
    error('初始化聚合工具失败:', e);
  }
};

const handleCenterOnTrack = (data: { latlng: [number, number], bounds: L.LatLngBounds }) => {
  if (mapInstance.value) {
    try {
      // 定位到轨迹起点
      mapInstance.value.setView(data.latlng, mapInstance.value.getZoom());
      // 自适应缩放以显示整个轨迹
      mapInstance.value.fitBounds(data.bounds, {
        padding: [50, 50], // 添加一些内边距
        maxZoom: 18 // 限制最大缩放级别
      });
      addLog('居中显示轨迹', {
        center: data.latlng,
        bounds: [
          [data.bounds.getSouth(), data.bounds.getWest()],
          [data.bounds.getNorth(), data.bounds.getEast()]
        ]
      });
    } catch (e) {
      error('居中显示轨迹失败:', e);
      addLog('居中显示轨迹失败', e);
    }
  }
}; 
/**
 * 添加轨迹到播放器
 */
const addTrack = (track: Track): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('添加轨迹失败: 轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.addTrack(track);
    
    if (result) {
      info(`成功添加轨迹: ${track.id}`);
      addLog(`成功添加轨迹: ${track.id}`, {trackId: track.id, pointsCount: track.points?.length});
      return true;
    } else {
      warn(`添加轨迹失败: ${track.id}`);
      addLog(`添加轨迹失败: ${track.id}`);
      return false;
    }
  } catch (e) {
    error('添加轨迹出错:', e);
    addLog('添加轨迹出错', e);
    return false;
  }
};

/**
 * 从播放器中移除轨迹
 */
const removeTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.removeTrack(trackId);
    
    if (result) {
      info(`成功移除轨迹: ${trackId}`);
      return true;
    } else {
      warn(`移除轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('移除轨迹出错:', e);
    return false;
  }
};

/**
 * 播放轨迹
 */
const playTrack = (trackId?: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('播放轨迹失败: 轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    const result = trackPlayerController.value.play(trackId);
    
    if (result) {
      const logMessage = trackId ? `开始播放轨迹: ${trackId}` : '开始播放当前轨迹';
      info(logMessage);
      addLog(logMessage);
      trackPlayerState.isPlaying = true;
      
      if (trackId) {
        trackPlayerState.currentTrackId = trackId;
      }
      
      return true;
    } else {
      const errorMessage = trackId ? `播放轨迹失败: ${trackId}` : '播放当前轨迹失败';
      warn(errorMessage);
      addLog(errorMessage);
      return false;
    }
  } catch (e) {
    error('播放轨迹出错:', e);
    addLog('播放轨迹出错', e);
    return false;
  }
};

/**
 * 暂停轨迹播放
 */
const pauseTrack = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    trackPlayerController.value.pause();
    info('轨迹播放已暂停');
    trackPlayerState.isPlaying = false;
    return true;
  } catch (e) {
    error('暂停轨迹播放出错:', e);
    return false;
  }
};

/**
 * 设置轨迹播放进度
 */
const setTrackProgress = (progress: number): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('设置轨迹播放进度失败: 播放器未初始化');
    return false;
  }
  
  if (progress < 0 || progress > 1) {
    warn('轨迹播放进度必须在0-1之间');
    addLog('设置轨迹播放进度失败: 进度值超出范围', {progress});
    return false;
  }
  
  try {
    const result = trackPlayerController.value.setProgress(progress);
    
    if (result) {
      trackPlayerState.progress = progress;
      info(`轨迹播放进度已设置为: ${progress}`);
      addLog('设置轨迹播放进度成功', {progress});
      return true;
    } else {
      warn('设置轨迹播放进度失败');
      addLog('设置轨迹播放进度失败');
      return false;
    }
  } catch (e) {
    error('设置轨迹播放进度出错:', e);
    addLog('设置轨迹播放进度出错', e);
    return false;
  }
};

/**
 * 设置轨迹播放速度
 */
const setTrackSpeed = (speed: number): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('设置轨迹播放速度失败: 播放器未初始化');
    return false;
  }
  
  if (speed <= 0) {
    warn('轨迹播放速度必须大于0');
    addLog('设置轨迹播放速度失败: 速度值超出范围', {speed});
    return false;
  }
  
  try {
    const result = trackPlayerController.value.setSpeed(speed);
    
    if (result) {
      trackPlayerState.speed = speed;
      info(`轨迹播放速度已设置为: ${speed}`);
      addLog('设置轨迹播放速度成功', {speed});
      return true;
    } else {
      warn('设置轨迹播放速度失败');
      addLog('设置轨迹播放速度失败');
      return false;
    }
  } catch (e) {
    error('设置轨迹播放速度出错:', e);
    addLog('设置轨迹播放速度出错', e);
    return false;
  }
};

/**
 * 切换轨迹循环播放
 */
const toggleTrackLoop = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('切换轨迹循环播放失败: 播放器未初始化');
    return false;
  }
  
  try {
    // 切换循环状态
    trackPlayerState.loop = !trackPlayerState.loop;
    
    // 更新轨迹播放器控制器选项
    trackPlayerController.value.updateOptions({
      loop: trackPlayerState.loop
    });
    
    info(`轨迹循环播放已${trackPlayerState.loop ? '开启' : '关闭'}`);
    addLog('切换轨迹循环播放', {enabled: trackPlayerState.loop});
    return true;
  } catch (e) {
    error('切换轨迹循环播放出错:', e);
    addLog('切换轨迹循环播放出错', e);
    return false;
  }
};

/**
 * 切换轨迹镜头跟随
 */
const toggleTrackFollowCamera = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('切换轨迹镜头跟随失败: 播放器未初始化');
    return false;
  }
  
  try {
    // 切换镜头跟随状态
    trackPlayerState.followCamera = !trackPlayerState.followCamera;
    
    // 更新轨迹播放器控制器选项
    trackPlayerController.value.updateOptions({
      followCamera: trackPlayerState.followCamera
    });
    
    info(`轨迹镜头追踪已${trackPlayerState.followCamera ? '开启' : '关闭'}`);
    addLog('切换轨迹镜头跟随', {enabled: trackPlayerState.followCamera});
    return true;
  } catch (e) {
    error('切换轨迹镜头追踪出错:', e);
    addLog('切换轨迹镜头跟随出错', e);
    return false;
  }
};

/**
 * 显示轨迹播放器面板
 */
const showTrackPlayerPanel = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('显示轨迹播放器面板失败: 播放器未初始化');
    return false;
  }
  
  trackPlayerState.visible = true;
  addLog('显示轨迹播放器面板');
  return true;
};

/**
 * 隐藏轨迹播放器面板
 */
const hideTrackPlayerPanel = (): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    addLog('隐藏轨迹播放器面板失败: 播放器未初始化');
    return false;
  }
  
  trackPlayerState.visible = false;
  addLog('隐藏轨迹播放器面板');
  return true;
};

/**
 * 更新轨迹播放器主题
 */
const updateTrackPlayerTheme = (theme: 'light' | 'dark'): void => {
  // 确保theme是有效的主题类型
  if (theme === 'light' || theme === 'dark') {
    trackPlayerState.theme = TRACK_PLAYER_THEMES[theme];
    addLog('更新轨迹播放器主题', {theme});
  } else {
    addLog('更新轨迹播放器主题失败: 无效的主题', {theme});
  }
};

/**
 * 设置当前轨迹
 * @param trackId 轨迹ID
 */
const setCurrentTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    // 获取当前所有轨迹
    const tracks = trackPlayerController.value.getAllTracks();
    const currentTrack = tracks.find(t => t.id === trackId);
    
    // 检查轨迹是否存在
    if (!currentTrack) {
      warn(`轨迹未找到: ${trackId}`);
      return false;
    }
    
    // 使用setCurrentTrack方法设置当前轨迹
    const result = trackPlayerController.value.setCurrentTrack(trackId);
    
    if (result && currentTrack.points && currentTrack.points.length > 0) {
      // 轨迹设置成功，将地图中心点设置到轨迹起始点
      const startPoint = currentTrack.points[0];
      if (mapInstance.value && startPoint) {
        mapInstance.value.setView([startPoint.lat, startPoint.lng], mapInstance.value.getZoom());
        info(`地图中心点已设置到轨迹 ${trackId} 的起始位置`);
      }
      
      // 更新状态
      trackPlayerState.currentTrackId = trackId;
      trackPlayerState.progress = 0;
      trackPlayerState.currentTime = startPoint.time;
      
      return true;
    } else {
      warn(`设置当前轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('设置当前轨迹出错:', e);
    return false;
  }
};

// 打开调试面板
const openDebugPanel = () => {
  try {
    debugPanelVisible.value = true;
    addLog('打开调试面板');
  } catch (e) {
    error('打开调试面板失败:', e);
  }
};

// 关闭调试面板
const closeDebugPanel = () => {
  try {
    debugPanelVisible.value = false;
    addLog('关闭调试面板');
  } catch (e) {
    error('关闭调试面板失败:', e);
  }
};

// 初始化热力图工具
const initHeatMap = () => {
  if (mapInstance.value) {
    // 记录初始化热力图工具
    addLog('初始化热力图工具');
    // 创建热力图工具实例
    heatMapTool.value = new HeatMap(mapInstance.value, props.heatMapConfig || {});
    // 如果配置了启用，则启用热力图
    if (props.heatMapConfig.enabled) {
      heatMapTool.value.enable();
    }
  }
};

// 暴露热力图功能的方法
const setHeatMapDataWithLog = (data: HeatPoint[]): boolean => {
  if (!heatMapTool.value) {
    addLog('设置热力图数据失败：热力图工具未初始化');
    return false;
  }

  try {
    const result = heatMapTool.value.setData(data);
    if (result) {
      addLog(`热力图数据已更新，共${data.length}个点`);
    }
    return result;
  } catch (e) {
    error('设置热力图数据失败:', e);
    addLog('设置热力图数据失败', e);
    return false;
  }
};

// 更新热力图配置
const updateHeatMapOptions = (options: Partial<HeatMapOptions>): boolean => {
  if (!heatMapTool.value) {
    // 热力图工具尚未初始化
    warn('热力图工具未初始化，无法更新配置');
    return false;
  }
  
  try {
    const result = heatMapTool.value.updateOptions(options);
    if (result) {
      addLog('热力图配置已更新');
    }
    return result;
  } catch (e) {
    error('更新热力图配置失败:', e);
    addLog('更新热力图配置失败', e);
    return false;
  }
};

// 处理地图点击事件
const handleMapClick = (e: any): void => {
  // 更新当前坐标
  currentLat.value = e.latlng.lat;
  currentLng.value = e.latlng.lng;
  
  // 发出坐标变化事件
  emit('coordinate-change', { lat: e.latlng.lat, lng: e.latlng.lng });
  
  // 如果坐标模式启用，则显示坐标面板
  if (coordinateMode.value) {
    showCoordinatePanel.value = true;
  }
  
  // 发出地图点击事件
  emit('map-click', e);
};

// 初始化迁徙图工具
const initMigration = () => {
  try {
    if (!mapInstance.value) {
      warn('地图实例未初始化，无法创建迁徙图工具');
      return;
    }
    
    // 记录初始化迁徙图工具
    addLog(`初始化飞线图工具，使用${props.migrationImpl}实现`);
    
    // 确保有正确的配置选项
    const options = props.migrationConfig?.options || {};
    
    // 根据migrationImpl属性选择使用的实现类
    if (props.migrationImpl === 'echarts') {
      // 使用基于ECharts的飞线图实现
      migrationTool.value = new EchartsMigration(mapInstance.value, options) as MigrationBase;
      addLog('使用ECharts实现飞线图，已创建Leaflet图层');
    } else {
      // 默认使用AntPath实现飞线图
      migrationTool.value = new Migration(mapInstance.value, options) as MigrationBase;
      addLog('使用AntPath实现飞线图');
    }
    
    // 如果配置了数据点，设置数据
    if (props.migrationConfig?.dataPoints && props.migrationConfig.dataPoints.length > 0) {
      try {
        if (migrationTool.value) {
          // 暂不启动动画，仅设置数据
          migrationTool.value.setData(props.migrationConfig.dataPoints, false);
          addLog(`飞线图数据点已加载: ${props.migrationConfig.dataPoints.length}个`);
        }
      } catch (e) {
        error('设置飞线图数据失败:', e);
        addLog('设置飞线图数据失败', e);
      }
    }
    
    // 如果配置了启用，则启用迁徙图
    if (props.migrationConfig?.enabled) {
      try {
        if (migrationTool.value) {
          migrationTool.value.enable();
          addLog('飞线图功能已启用');
        }
      } catch (e) {
        error('启用飞线图功能失败:', e);
        addLog('启用飞线图功能失败', e);
      }
    } else {
      addLog('飞线图功能未启用（配置设置为禁用）');
    }
  } catch (e) {
    error('初始化飞线图工具失败:', e);
    addLog('初始化飞线图工具失败', e);
  }
};

// 初始化所有地图工具
const initMapTools = (): void => {
  try {
    // 初始化标记工具
    initMarkerTool();
    // 初始化图形绘制工具
    initShapeTool();
    // 初始化测距工具
    initMeasureTool();
    // 初始化鹰眼控件
    initOverviewTool();
    // 初始化聚合工具
    initAggregationTool();
    // 初始化轨迹播放工具
    initTrackPlayer();
    // 初始化热力图工具
    initHeatMap();
    nextTick(() => {
      // 初始化飞线图工具
      initMigration();
    });
    
    addLog('地图工具初始化完成');
    } catch (e) {
    error('初始化地图工具失败:', e);
    addLog('初始化地图工具失败', e);
  }
};

// API - 设置热力图数据
const setHeatMapData = (data: HeatPoint[]): boolean => {
  if (!heatMapTool.value) {
    warn('热力图工具未初始化，无法设置数据');
    return false;
  }
  
  return setHeatMapDataWithLog(data);
};

// API - 启用/禁用热力图
const toggleHeatMap = (enable?: boolean): boolean => {
  if (!heatMapTool.value) {
    warn('热力图工具未初始化，无法切换状态');
    return false;
  }
  
  if (enable === undefined) {
    return heatMapTool.value.toggle();
  } else if (enable) {
    return heatMapTool.value.enable();
  } else {
    return heatMapTool.value.disable();
  }
};

// API - 更新飞线图选项
const updateMigrationOptions = (options: any): boolean => {
  if (!migrationTool.value) {
    warn('飞线图工具未初始化，无法更新选项');
    return false;
  }
  
  return migrationTool.value.updateOptions(options);
};

// API - 设置飞线图数据
const setMigrationData = (data: MigrationPoint[], startAnimation: boolean = true): boolean => {
  if (!migrationTool.value) {
    warn('飞线图工具未初始化，无法设置数据');
    return false;
  }
  
  try {
    // 检查数据格式
    if (!Array.isArray(data)) {
      warn('飞线图数据必须是数组');
      return false;
    }
    
    // 验证数据格式
    const validData = data.filter(point => 
      point && 
      Array.isArray(point.from) && 
      Array.isArray(point.to) && 
      point.from.length >= 2 && 
      point.to.length >= 2
    );
    
    if (validData.length !== data.length) {
      warn(`飞线图数据格式有误, 共${data.length}条数据，有效数据${validData.length}条`);
    }
    
    if (validData.length === 0) {
      warn('没有有效的飞线图数据点');
      return false;
    }
    
    const result = migrationTool.value.setData(validData, startAnimation);
    if (result) {
      addLog(`飞线图数据已更新，共${validData.length}条有效路径`);
    }
    return result;
    } catch (e) {
    error('设置飞线图数据失败:', e);
    addLog('设置飞线图数据失败', e);
    return false;
  }
};

// API - 启用/禁用飞线图
const toggleMigration = (enable?: boolean): boolean => {
  if (!migrationTool.value) {
    warn('飞线图工具未初始化，无法切换状态');
    return false;
  }
  
  if (enable === undefined) {
    return migrationTool.value.toggle();
  } else if (enable) {
    return migrationTool.value.enable();
  } else {
    return migrationTool.value.disable();
  }
};

// API - 开始飞线动画
const startMigration = (): boolean => {
  if (!migrationTool.value) {
    warn('飞线图工具未初始化，无法开始动画');
    return false;
  }
  
  return migrationTool.value.start();
};

// API - 停止飞线动画
const stopMigration = (): boolean => {
  if (!migrationTool.value) {
    warn('飞线图工具未初始化，无法停止动画');
    return false;
  }
  
  return migrationTool.value.stop();
};

// 以下是缺失的API方法实现
// ===== 地图基本操作 =====

// 设置地图中心点
const setCenter = (center: [number, number]): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法设置中心点');
    return;
  }
  
  mapInstance.value.setView(center, mapInstance.value.getZoom());
  addLog('地图中心点已设置', {center});
};

// 设置地图缩放级别
const setZoom = (zoom: number): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法设置缩放级别');
    return;
  }
  
  mapInstance.value.setZoom(zoom);
  internalZoom.value = zoom;
  addLog('地图缩放级别已设置', {zoom});
};

// 设置地图视图（中心点和缩放级别）
const setView = (center: [number, number], zoom: number): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法设置视图');
    return;
  }
  
  mapInstance.value.setView(center, zoom);
  internalZoom.value = zoom;
  addLog('地图视图已设置', {center, zoom});
};

// 设置地图范围
const fitBounds = (bounds: [[number, number], [number, number]], options?: {padding?: number; maxZoom?: number}): void => {
  if (!mapInstance.value || !L) {
    warn('地图实例未初始化，无法设置地图范围');
    return;
  }
  
  const latLngBounds = L.latLngBounds(
    L.latLng(bounds[0][0], bounds[0][1]),
    L.latLng(bounds[1][0], bounds[1][1])
  );
  mapInstance.value.fitBounds(latLngBounds, options);
  addLog('地图范围已设置', {bounds});
};

// 平滑移动地图到指定位置
const panTo = (center: [number, number], options?: {duration?: number; easeLinearity?: number}): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法平移地图');
    return;
  }
  
  mapInstance.value.panTo(center, options);
  addLog('地图已平移到指定位置', {center});
};

// 启用地图拖动
const enableDragging = (): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法启用拖动');
    return;
  }
  
  mapInstance.value.dragging.enable();
  internalDragging.value = true;
  emit('update:dragging', true);
  addLog('地图拖动已启用');
};

// 禁用地图拖动
const disableDragging = (): void => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法禁用拖动');
    return;
  }
  
  mapInstance.value.dragging.disable();
  internalDragging.value = false;
  emit('update:dragging', false);
  addLog('地图拖动已禁用');
};

// 切换地图拖动状态
const toggleDragging = (): void => {
  if (internalDragging.value) {
    disableDragging();
  } else {
    enableDragging();
  }
};

// ===== 标记相关方法 =====

// 添加标记
const addMarker = (latlng: MarkerLatLng, options: CustomMarkerOptions): string | null => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法添加标记');
    return null;
  }
  // 创建LatLng对象
  const _latlng = L.latLng(latlng.lat, latlng.lng);
  return markerTool.value.addMarker(_latlng, options);
};

// 批量添加标记
const addMarkers = (latlngs: MarkerLatLng[], options: CustomMarkerOptions): string[] => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法批量添加标记');
      return [];
    }
  
  // 转换为可以处理的格式
  const markers: string[] = [];
  for (const latlng of latlngs) {
    // 使用addMarker方法添加每个标记
    const markerId = addMarker(latlng, options);
    if (markerId) {
      markers.push(markerId);
    }
  }
  
  addLog(`已批量添加${markers.length}个标记`);
  return markers;
};

// 移除标记
const removeMarker = (markerId: string): boolean => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法移除标记');
     return false;
  }
  
  const result = markerTool.value.removeMarker(markerId);
  if (result) {
    addLog('标记已移除', {markerId});
  }
  return result;
};

// 移除所有标记
const removeAllMarkers = (): void => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法移除所有标记');
    return;
  }
  
  // 获取所有标记并逐个移除
  const markers = markerTool.value.getMarkers();
  for (const marker of markers) {
    if (marker && marker.options && marker.options.markerId) {
      markerTool.value.removeMarker(marker.options.markerId);
    }
  }
  
  addLog('所有标记已移除');
};

// 显示所有标记
const showAllMarkers = (): void => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法显示所有标记');
    return;
  }
  
      markerTool.value.showAllMarkers();
  addLog('所有标记已显示');
};

// 隐藏所有标记
const hideAllMarkers = (): void => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法隐藏所有标记');
    return;
  }
  
          markerTool.value.hideAllMarkers();
  addLog('所有标记已隐藏');
};

// 按分组显示标记
const showMarkersByGroup = (groupName: string): void => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法按分组显示标记');
    return;
  }
  
  // 获取指定分组的标记
  const markers = markerTool.value.getMarkersByGroup(groupName);
  
  // 显示这些标记
  for (const marker of markers) {
    if (marker && marker.options && marker.options.markerId) {
      const markerId = marker.options.markerId;
      const m = markerTool.value.getMarkerById(markerId);
      if (m) {
        m.setOpacity(1);
        if (m.getElement()) {
          m.getElement().style.display = '';
        }
      }
    }
  }
  
  addLog(`分组"${groupName}"的标记已显示`);
};

// 按分组隐藏标记
const hideMarkersByGroup = (groupName: string): void => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法按分组隐藏标记');
    return;
  }
  
  // 获取指定分组的标记
  const markers = markerTool.value.getMarkersByGroup(groupName);
  
  // 隐藏这些标记
  for (const marker of markers) {
    if (marker && marker.options && marker.options.markerId) {
      const markerId = marker.options.markerId;
      const m = markerTool.value.getMarkerById(markerId);
      if (m) {
        m.setOpacity(0);
        if (m.getElement()) {
          m.getElement().style.display = 'none';
        }
      }
    }
  }
  
  addLog(`分组"${groupName}"的标记已隐藏`);
};

// 获取所有标记分组
const getMarkerGroups = (): string[] => {
  if (!markerTool.value) {
    warn('标记工具未初始化，无法获取标记分组');
    return [];
  }
  
  // 手动从所有标记中提取分组
  const groupSet = new Set<string>();
  const markers = markerTool.value.getMarkers();
  
  for (const marker of markers) {
    if (marker && marker.options && marker.options.markerGroup) {
      groupSet.add(marker.options.markerGroup);
    }
  }
  
  return Array.from(groupSet);
};

// 将地图缩放到包含所有标记的视图
const fitToMarkers = (options?: {padding?: number, maxZoom?: number}): void => {
  if (!markerTool.value || !mapInstance.value) {
    warn('标记工具或地图实例未初始化，无法将视图缩放到标记');
    return;
  }
  
  // 获取所有标记
  const markers = markerTool.value.getMarkers();
  if (markers.length === 0) {
    warn('没有标记点，无法执行缩放操作');
    return;
  }
  
  // 创建边界对象
  const bounds = L.latLngBounds([]);
  
  // 将所有标记的位置添加到边界中
  markers.forEach(marker => {
    if (marker && marker.getLatLng) {
      bounds.extend(marker.getLatLng());
    }
  });
  
  // 如果边界有效，执行缩放
  if (bounds.isValid()) {
    mapInstance.value.fitBounds(bounds, options);
    addLog('地图已缩放到包含所有标记的视图');
        } else {
    warn('无法确定标记边界，缩放操作失败');
  }
};

// ===== 坐标显示相关方法 =====

// 打开坐标显示
const openCoordinate = (): void => {
  enableCoordinateMode();
};

// 关闭坐标显示
const closeCoordinate = (): void => {
  disableCoordinateMode();
};

// 切换坐标显示
const toggleCoordinate = (): void => {
  if (coordinateMode.value) {
    closeCoordinate();
      } else {
    openCoordinate();
  }
};

// 获取坐标显示状态
const isCoordinateVisible = (): boolean => {
  return coordinateMode.value;
};

// ===== 测量相关方法 =====

// 开始测量
const startMeasure = (): void => {
  if (!measureTool.value) {
    warn('测量工具未初始化，无法开始测量');
    return;
  }
  
  measureTool.value.start();
  addLog('测量工具已启动');
};

// 停止测量
const stopMeasure = (): void => {
  if (!measureTool.value) {
    warn('测量工具未初始化，无法停止测量');
    return;
  }
  
  measureTool.value.stop();
  addLog('测量工具已停止');
};

// 切换测量状态
const toggleMeasure = (): void => {
  if (!measureTool.value) {
    warn('测量工具未初始化，无法切换测量状态');
    return;
  }
  
  if (measureTool.value.isActive()) {
    measureTool.value.stop();
    addLog('测量工具已停止');
  } else {
    measureTool.value.start();
    addLog('测量工具已启动');
  }
};

// 清除测量结果
const clearMeasure = (): void => {
  if (!measureTool.value) {
    warn('测量工具未初始化，无法清除测量结果');
    return;
  }
  
  measureTool.value.clear();
  addLog('测量结果已清除');
};

// 获取测量状态
const isMeasuring = (): boolean => {
  if (!measureTool.value) {
    return false;
  }
  
  return measureTool.value.isActive();
};

// ===== 绘图相关方法 =====

// 清除所有形状
const clearShapes = (): void => {
  if (!shapeTool.value) {
    warn('绘图工具未初始化，无法清除形状');
    return;
  }
  
  shapeTool.value.clearShapes();
  addLog('所有形状已清除');
};

// 获取绘图状态
const isDrawing = (): boolean => {
  if (!shapeTool.value) {
      return false;
    }
    
  return shapeTool.value.isDrawing();
};

// 添加现有形状
const addShapes = (shapes: any[]): void => {
  if (!shapeTool.value) {
    warn('绘图工具未初始化，无法添加形状');
    return;
  }
  
  let addedCount = 0;
  
  // 逐个添加形状
  for (const shape of shapes) {
    if (shape && shape.type && shape.coordinates) {
      const result = shapeTool.value.addShape(shape.type, shape.coordinates, shape.options);
      if (result) {
        addedCount++;
      }
    }
  }
  
  addLog(`已添加${addedCount}个形状`);
};

// 设置绘图模式
const setDrawMode = (mode: 'create' | 'edit' | 'view'): void => {
  if (!shapeTool.value) {
    warn('绘图工具未初始化，无法设置绘图模式');
    return;
  }
  
  // Shape类没有setMode方法，根据模式执行相应操作
  switch (mode) {
    case 'create':
      // 可以在这里设置创建模式
      if (shapeTool.value.isDrawing()) {
        shapeTool.value.cancelDrawing();
      }
      addLog('绘图工具已设置为创建模式');
      break;
    case 'edit':
      // 如果有编辑模式，可以在这里设置
      if (shapeTool.value.isDrawing()) {
        shapeTool.value.cancelDrawing();
      }
      addLog('绘图工具已设置为编辑模式');
      break;
    case 'view':
      // 如果有查看模式，可以在这里设置
      if (shapeTool.value.isDrawing()) {
        shapeTool.value.cancelDrawing();
      }
      addLog('绘图工具已设置为查看模式');
      break;
    default:
      warn(`未知的绘图模式: ${mode}`);
  }
};

// ===== 鹰眼相关方法 =====

// 启用鹰眼
const enableOverview = (): void => {
  if (!overviewTool.value) {
    warn('鹰眼工具未初始化，无法启用鹰眼');
    return;
  }
  
  overviewTool.value.enable();
  addLog('鹰眼已启用');
};

// 禁用鹰眼
const disableOverview = (): void => {
  if (!overviewTool.value) {
    warn('鹰眼工具未初始化，无法禁用鹰眼');
    return;
  }
  
  overviewTool.value.disable();
  addLog('鹰眼已禁用');
};

// 切换鹰眼状态
const toggleOverview = (): void => {
  if (!overviewTool.value) {
    warn('鹰眼工具未初始化，无法切换鹰眼状态');
    return;
  }
  
  overviewTool.value.toggle();
  addLog('鹰眼状态已切换');
};

// 获取鹰眼启用状态
const isOverviewEnabled = (): boolean => {
  if (!overviewTool.value) {
        return false;
      }
  
  // Overview类没有isEnabled方法，使用isActive代替
  return overviewTool.value.isActive();
};

// ===== 聚合相关方法 =====

// 启用聚合
const enableAggregation = (): void => {
  if (!aggregationTool.value) {
    warn('聚合工具未初始化，无法启用聚合');
    return;
  }
  
  aggregationTool.value.enable();
  addLog('聚合功能已启用');
};

// 禁用聚合
const disableAggregation = (): void => {
  if (!aggregationTool.value) {
    warn('聚合工具未初始化，无法禁用聚合');
    return;
  }
  
  aggregationTool.value.disable();
  addLog('聚合功能已禁用');
};

// 切换聚合状态
const toggleAggregation = (): void => {
  if (!aggregationTool.value) {
    warn('聚合工具未初始化，无法切换聚合状态');
    return;
  }
  
  if (aggregationTool.value.isEnabled()) {
    aggregationTool.value.disable();
    addLog('聚合功能已禁用');
  } else {
    aggregationTool.value.enable();
    addLog('聚合功能已启用');
  }
};

// 更新聚合选项
const updateAggregationOptions = (options: Partial<AggregationOptions>): void => {
  if (!aggregationTool.value) {
    warn('聚合工具未初始化，无法更新聚合选项');
    return;
  }
  
  aggregationTool.value.updateOptions(options);
  addLog('聚合选项已更新');
};

// 获取聚合启用状态
const isAggregationEnabled = (): boolean => {
  if (!aggregationTool.value) {
      return false;
    }
  
  return aggregationTool.value.isEnabled();
};

// ===== 轨迹播放相关方法 =====

// 启动轨迹播放器
const startTrackPlayer = (trackId?: string): boolean => {
  return playTrack(trackId);
};

// 暂停轨迹播放器
const pauseTrackPlayer = (): boolean => {
  return pauseTrack();
};

// 停止轨迹播放器
const stopTrackPlayer = (): boolean => {
    if (!trackPlayerController.value) {
    warn('轨迹播放器未初始化，无法停止播放');
      return false;
    }
    
  const result = trackPlayerController.value.stop();
      if (result) {
    addLog('轨迹播放已停止');
  }
  return result;
};

// 更新轨迹播放器选项
const updateTrackPlayerOptions = (options: Partial<TrackPlayerOptions>): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器未初始化，无法更新选项');
        return false;
      }
  
  try {
    // updateOptions方法返回void，我们手动返回成功
    trackPlayerController.value.updateOptions(options);
    addLog('轨迹播放器选项已更新');
    return true;
    } catch (e) {
    error('更新轨迹播放器选项失败:', e);
      return false;
    }
};

// 根据时间设置轨迹进度
const setTrackProgressByTime = (time: number): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器未初始化，无法设置进度');
    return false;
  }
  
  try {
    // TrackPlayer类中不存在setProgressByTime方法，我们使用setProgress代替
    const currentTrack = trackPlayerController.value.getCurrentTrackId();
    if (!currentTrack) {
      warn('当前没有选中的轨迹，无法设置进度');
      return false;
    }
    
    const track = trackPlayerController.value.getAllTracks().find(t => t.id === currentTrack);
    if (!track || !track.points || track.points.length < 2) {
      warn('轨迹数据无效，无法设置进度');
      return false;
    }
    
    // 计算进度值（0-1之间）
    const startTime = track.points[0].time;
    const endTime = track.points[track.points.length - 1].time;
    
    if (endTime <= startTime) {
      warn('轨迹时间数据无效，无法设置进度');
    return false;
    }
    
    // 计算相对进度
    const progress = Math.max(0, Math.min(1, (time - startTime) / (endTime - startTime)));
    
    // 设置进度
    trackPlayerController.value.setProgress(progress);
    trackPlayerState.currentTime = time;
    addLog('轨迹播放进度已设置', {time, progress});
    
    return true;
    } catch (e) {
    error('设置轨迹播放进度失败:', e);
    return false;
  }
};

// ===== 调试相关方法 =====

// 显示调试面板
const showDebugPanel = (): void => {
  openDebugPanel();
};

// 隐藏调试面板
const hideDebugPanel = (): void => {
  closeDebugPanel();
};

// 切换调试面板
const toggleDebugPanel = (): void => {
  if (debugPanelVisible.value) {
    closeDebugPanel();
  } else {
    openDebugPanel();
  }
};

// 处理"查看更多"按钮点击事件
const handleViewMoreMarkerDetails = () => {
  if (markerTool.value && markerTool.value.getClickedMarker()) {
    const marker = markerTool.value.getClickedMarker();
    const markerId = marker.options.markerId;
    const position = marker.getLatLng();
    
    // 在这里，你可以根据业务需求执行不同的操作
    // 例如：打开一个详情对话框，跳转到详情页等
    
    // 这里仅做示例，输出日志
    addLog('查看更多标记详情', {
      markerId,
      position: [position.lat, position.lng],
      data: marker.options.markerCustomData
    });
    
    // 如果需要，可以先关闭气泡
    // markerTool.value.closeDetailsPopup();
    
    // 也可以触发一个自定义事件，让父组件处理
    emit('marker-detail-view', {
      marker: marker,
      id: markerId,
      position: [position.lat, position.lng],
      data: marker.options.markerCustomData
    });
  }
};
// 获取当前地图可视区域的边界坐标
const getVisibleBounds = (): [[number, number], [number, number]] | null => {
  if (!mapInstance.value) {
    warn('地图实例未初始化，无法获取可视区域');
    return null;
  }

  try {
    // 获取当前地图的边界
    const bounds = mapInstance.value.getBounds();

    // 转换为坐标点数组 [[西南点latitude, 西南点longitude], [东北点latitude, 东北点longitude]]
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    return [
      [southWest.lat, southWest.lng],
      [northEast.lat, northEast.lng]
    ];
  } catch (e) {
    error('获取地图可视区域失败:', e);
    addLog('获取地图可视区域失败', e);
    return null;
  }
};

/**
 * 从地图上移除轨迹但保留数据
 */
const hideTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    // 使用 trackPlayerController 中的 hideTrack 方法
    // 现在这是 TrackPlayer 类中的公有方法
    const result = trackPlayerController.value.hideTrack(trackId);
    
    if (result) {
      info(`成功从地图上移除轨迹: ${trackId}（数据已保留）`);
      addLog('轨迹已从地图上移除', {trackId});
      return true;
    } else {
      warn(`从地图上移除轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('从地图上移除轨迹出错:', e);
    return false;
  }
};

/**
 * 完全删除轨迹（从数据和地图上都移除）
 */
const deleteTrack = (trackId: string): boolean => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return false;
  }
  
  try {
    // 先确保从地图上移除轨迹（即使数据删除失败，也要尝试从地图上移除）
    trackPlayerController.value.hideTrack(trackId);
    
    // 然后从数据中删除轨迹
    const result = trackPlayerController.value.removeTrack(trackId);
    
    if (result) {
      info(`成功删除轨迹: ${trackId}`);
      addLog('轨迹已删除', {trackId});
      return true;
    } else {
      warn(`删除轨迹失败: ${trackId}`);
      return false;
    }
  } catch (e) {
    error('删除轨迹出错:', e);
    return false;
  }
};

/**
 * 处理轨迹从地图上移除事件
 */
const handleTrackRemove = (trackId: string): void => {
  // 调用 hideTrack 方法，从地图上移除轨迹但保留数据
  hideTrack(trackId);
};

/**
 * 处理轨迹删除事件
 */
const handleTrackDelete = (trackId: string): void => {
  // 调用 deleteTrack 方法，从数据和地图上都移除轨迹
  deleteTrack(trackId);
};

/**
 * 隐藏除了指定轨迹外的所有轨迹
 * @param data 包含 activeTrackId 和 otherTrackIds 的对象
 */
const hideAllTracksExcept = (data: { activeTrackId: string, otherTrackIds: string[] }): void => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return;
  }
  
  // 遍历其他轨迹ID并隐藏它们
  data.otherTrackIds.forEach(trackId => {
    trackPlayerController.value?.hideTrack(trackId);
  });
  
  addLog('已隐藏其他轨迹，仅显示当前激活的轨迹', { activeTrackId: data.activeTrackId });
  info(`已隐藏其他轨迹，仅显示轨迹: ${data.activeTrackId}`);
}

/**
 * 显示所有轨迹
 */
const showAllTracks = (): void => {
  if (!trackPlayerController.value) {
    warn('轨迹播放器尚未初始化');
    return;
  }
  
  // 从轨迹播放器控制器获取所有轨迹
  const tracks = trackPlayerController.value.getAllTracks();
  
  // 遍历所有轨迹并显示它们
  tracks.forEach(track => {
    // 为每个轨迹创建播放器实例并显示在地图上
    trackPlayerController.value?.setCurrentTrack(track.id);
  });
  
  addLog('已显示所有轨迹');
  info('已显示所有轨迹');
}

// 导出方法和常量供外部使用
defineExpose({
  MAP_TYPES,
  LayerType,
  ShapeType,
  addToolItem: (options: AddToolOptions) => mapToolbarRef.value && mapToolbarRef.value.addToolItem(options),
  removeTool: () => mapToolbarRef.value && mapToolbarRef.value.removeTool(),
  removeToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.removeToolItem(toolId),
  showToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.showToolItem(toolId),
  hideToolItem: (toolId: string) => mapToolbarRef.value && mapToolbarRef.value.hideToolItem(toolId),
  showToolbar: () => mapToolbarRef.value && mapToolbarRef.value.showToolbar(),
  hideToolbar: () => mapToolbarRef.value && mapToolbarRef.value.hideToolbar(),
  clearMeasurement,
  getMap: () => mapInstance.value,
  getMapContainer: () => mapContainer.value,
  
  // 地图基本操作
  setCenter,
  setZoom,
  setView,
  fitBounds,
  panTo,
  enableDragging,
  disableDragging,
  toggleDragging,
  getVisibleBounds, // 添加获取可视区域边界方法
  
  // 标记相关方法
  hideGroup: (groupName: string) => {
    if (!markerTool.value) {
      warn('标记工具未初始化，无法隐藏标记分组');
      return;
    }
    markerTool.value.hideGroup(groupName);
  },
  showGroup: (groupName: string) => {
    if (!markerTool.value) {
      warn('标记工具未初始化，无法显示标记分组');
      return;
    }
    markerTool.value.showGroup(groupName);
  },
  addMarker,
  addMarkers,
  removeMarker,
  removeAllMarkers,
  showAllMarkers,
  hideAllMarkers,
  showMarkersByGroup,
  hideMarkersByGroup,
  getMarkerGroups,
  fitToMarkers,
  
  // 坐标显示相关方法
  openCoordinate,
  closeCoordinate,
  toggleCoordinate,
  isCoordinateVisible,
  
  // 测量相关方法
  startMeasure,
  stopMeasure,
  toggleMeasure,
  clearMeasure,
  isMeasuring,
  
  // 绘图相关方法
  clearShapes,
  isDrawing,
  addShapes,
  setDrawMode,
  removeShape: (shapeId: string): boolean => {
    if (!shapeTool.value) {
      warn('绘图工具未初始化，无法删除图形');
      addLog('删除图形失败: 绘图工具未初始化');
      return false;
    }
    
    try {
      const result = shapeTool.value.removeShape(shapeId);
      if (result) {
        addLog(`删除图形成功: ${shapeId}`);
        return true;
      } else {
        warn(`删除图形失败: 未找到ID为 ${shapeId} 的图形`);
        addLog(`删除图形失败: ${shapeId}`);
        return false;
      }
    } catch (e) {
      error('删除图形时出错:', e);
      addLog('删除图形失败', e);
      return false;
    }
  },
  
  // 鹰眼相关方法
  enableOverview,
  disableOverview,
  toggleOverview,
  isOverviewEnabled,
  
  // 聚合相关方法
  enableAggregation,
  disableAggregation,
  toggleAggregation,
  updateAggregationOptions,
  isAggregationEnabled,
  
  // 轨迹播放相关方法
  startTrackPlayer,
  pauseTrackPlayer,
  stopTrackPlayer,
  updateTrackPlayerOptions,
  setTrackProgressByTime,
  
  // 热力图相关方法
  updateHeatMapOptions,
  setHeatMapData,
  toggleHeatMap,
  
  // 飞线图相关方法
  updateMigrationOptions,
  setMigrationData,
  toggleMigration,
  migrationStatus: () => {
    if (!migrationTool.value) {
      warn('飞线图控制器未初始化，无法获取飞线图状态');
      return OpenStatus.CLOSE;
    }
    return migrationTool.value.isEnabled() ? OpenStatus.OPEN : OpenStatus.CLOSE;
  },
  enableMigration: () => {
    if (!migrationTool.value) {
      warn('飞线图控制器未初始化，无法启用飞线图');
      return;
    }
    migrationTool.value.enable();
  },
  disableMigration: () => {
    if (!migrationTool.value) {
      warn('飞线图控制器未初始化，无法禁用飞线图');
      return;
    }
    migrationTool.value.disable();
  },
  startMigration,
  stopMigration,
  
  // 调试相关方法
  showDebugPanel,
  hideDebugPanel,
  toggleDebugPanel,
  addLog,
  // 轨迹相关方法
  addTrack,
  hideTrack,
  deleteTrack,
  hideAllTracksExcept,
  showAllTracks
});
</script>

<style scoped>
.sc-map {
  width: 100%;
  height: 500px;
  position: relative;
}

/* Leaflet-ECharts容器样式 */
.leaflet-echarts-container {
  pointer-events: none;
  z-index: 650;
}

/* 标记详情弹框底部样式 */
.marker-popup-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  text-align: center;
}

.marker-popup-action-btn {
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.marker-popup-action-btn:hover {
  background-color: #1976d2;
}
</style> 

<!-- 添加全局CSS样式 -->
<style>
@import "./styles/migration.scss";
/* 全局自定义弹窗动画样式 */
@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -90%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

/* 自定义弹窗容器样式 */
.sc-map-custom-popup {
  position: absolute;
  z-index: 1000;
  box-shadow: 0 3px 14px rgba(0,0,0,0.4);
  background: white;
  border-radius: 4px;
  padding: 10px;
  max-width: 300px;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  transform: translate(-50%, -100%);
  animation: popup-fade-in 0.2s ease-out;
}

/* 自定义弹窗关闭按钮样式 */
.custom-popup-close-button {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  color: #555;
}

.custom-popup-close-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #000;
}
.rotated-svg-icon,
:deep(.rotated-svg-icon) {
  background-color: transparent !important;
  border: none !important;
}
</style>
