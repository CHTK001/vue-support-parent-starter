<template>
  <div class="tmap-container" :style="{ height: height, width: width }">
    <div class="map-container" ref="mapContainer"></div>

    <!-- 工具面板已移到父组件中统一管理，这里不再需要 -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick, PropType, onBeforeUnmount } from 'vue';
import { Marker, MapViewType, Shape, ShapeStyle, ShapeType, ToolType, DistanceResultEvent, ClusterOptions, ClusterClickEvent } from '../types';
import { info } from '@repo/utils';
import { DEFAULT_MARKER_SIZE } from '../types/default';
// 引入lodash的防抖函数
import { debounce } from 'lodash-es';

// 声明全局类型
declare global {
  interface Window {
    T: any;
    _tmap_overlays?: Map<string, any>;
    _tmap_track_animation?: import('../types').TrackAnimation | null;
  }
}

const props = withDefaults(defineProps<{
  apiKey: string;
  center: [number, number];
  zoom: number;
  markers: Marker[];
  height: string;
  width: string;
  draggable: boolean;
  scrollWheel: boolean;
  zoomControl: boolean;
  scaleControl: boolean;
  mapStyle: string;
  viewType: MapViewType;
  initialShapes: Shape[];
  // 聚合选项
  clusterOptions: ClusterOptions;
  showMarkerLabels?: boolean;
}>(), {
  center: () => [116.397428, 39.90923],
  zoom: 12,
  markers: () => [],
  height: '500px',
  width: '100%',
  draggable: true,
  scrollWheel: true,
  zoomControl: true,
  scaleControl: true,
  mapStyle: '',
  viewType: MapViewType.NORMAL,
  initialShapes: () => [],
  clusterOptions: () => ({ enable: false }),
  showMarkerLabels: true
});

const emit = defineEmits([
  'map-loaded',
  'marker-click',
  'map-click',
  'zoom-changed',
  'center-changed',
  'bounds-changed',
  'shape-created',
  'shape-click',
  'cluster-click',
  'distance-result',
  'marker-created',
  'marker-mouseenter',
  'marker-mouseleave',
  'hover-popover-show',
  'hover-popover-hide',
  'click-popover-show',
  'click-popover-hide',
  'shape-contextmenu',  // 添加图形右键菜单事件
  'marker-contextmenu',  // 添加标记点右键菜单事件
  'shape-deleted'  // 添加图形删除事件
]);

const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const markersInstances = ref<any[]>([]);
const currentTool = ref<ToolType | ''>('');
const distanceResult = ref<DistanceResultEvent | null>(null);
const distanceComponents = ref<any | null>(null);
const addMarkerEnabled = ref<boolean>(true);
const clusterManager = ref<any>(null);

// 添加悬停弹窗相关的变量和方法（仅保留，不依赖于全局props）
const activePopover = ref<HTMLElement | null>(null);
const popoverTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const activeMarker = ref<any>(null);
const clickPopover = ref<HTMLElement | null>(null);

// 用于解析模板字符串的辅助函数
const parseTemplate = (template: string, marker: any): string => {
  return template.replace(/\${([^}]+)}/g, (match, key) => {
    try {
      // 支持访问嵌套属性，如 data.id
      const keys = key.trim().split('.');
      let value = marker;
      for (const k of keys) {
        value = value[k];
        if (value === undefined || value === null) return '';
      }
      return value;
    } catch (err) {
      console.warn(`解析模板变量 ${key} 失败:`, err);
      return '';
    }
  });
};

// 创建并显示弹窗
const showPopover = (marker: any, event: MouseEvent, isClick: boolean = false) => {
  const markerData = (marker as any).__markerData;
  if (!markerData) return;

  // 确认是否启用了相应的弹窗
  const isHoverEnabled = markerData.hoverPopover === true && !isClick;
  const isClickEnabled = markerData.clickPopover === true && isClick;

  if (!isHoverEnabled && !isClickEnabled) return;

  // 如果是悬停弹窗，清除可能存在的定时器
  if (!isClick && popoverTimer.value) {
    clearTimeout(popoverTimer.value);
    popoverTimer.value = null;
  }

  // 如果是悬停弹窗，先隐藏现有的，避免同时显示多个
  if (!isClick) hidePopover(false);

  // 如果是点击弹窗，则移除可能存在的点击弹窗
  if (isClick && clickPopover.value) {
    hidePopover(true);
  }

  // 设置显示逻辑
  const showPopoverAction = () => {
    try {
      // 设置当前激活的标记
      if (!isClick) {
        activeMarker.value = marker;
      }

      // 创建弹窗元素
      const popoverEl = document.createElement('div');
      popoverEl.className = isClick ? 'sc-map-marker-click-popover' : 'sc-map-marker-hover-popover';

      // 选择使用的模板
      let template = markerData.clickPopoverTemplate || '<div>${marker.title || ""}</div>';

      // 解析模板并设置内容
      popoverEl.innerHTML = parseTemplate(template, markerData);

      // 样式设置
      popoverEl.style.position = 'absolute';
      popoverEl.style.zIndex = isClick ? '1001' : '1000';
      popoverEl.style.backgroundColor = 'white';
      popoverEl.style.boxShadow = '0 2px 12px 0 rgba(0, 0, 0, 0.1)';
      popoverEl.style.padding = '10px';
      popoverEl.style.borderRadius = '4px';
      popoverEl.style.maxWidth = '300px';
      popoverEl.style.overflowWrap = 'break-word';

      // 如果是点击弹窗，添加关闭按钮
      if (isClick) {
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '8px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.lineHeight = '16px';
        closeBtn.style.color = '#909399';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hidePopover(true);
        });
        popoverEl.appendChild(closeBtn);
      }

      // 添加到地图容器
      const mapContainer = mapInstance.value.getContainer();
      mapContainer.appendChild(popoverEl);

      // 计算位置
      const markerPos = marker.getLngLat();
      const pixelPos = mapInstance.value.lngLatToContainerPoint(markerPos);

      // 设置位置，显示在标记上方
      popoverEl.style.left = `${pixelPos.x}px`;
      popoverEl.style.top = `${pixelPos.y - 10 - popoverEl.offsetHeight}px`;

      // 保存弹窗引用
      if (isClick) {
        clickPopover.value = popoverEl;
      } else {
        activePopover.value = popoverEl;
      }

      // 触发弹窗显示事件
      emit(isClick ? 'click-popover-show' : 'hover-popover-show', {
        marker: markerData,
        element: popoverEl,
        position: [markerPos.lng, markerPos.lat]
      });

      // 如果是点击弹窗，添加点击地图时关闭弹窗的事件
      if (isClick) {
        const mapClickHandler = (e: any) => {
          // 检查点击是否在弹窗内
          const isClickInPopover = e.target === popoverEl || popoverEl.contains(e.target);
          if (!isClickInPopover) {
            hidePopover(true);
            // 移除事件监听
            mapInstance.value.removeEventListener('click', mapClickHandler);
          }
        };

        // 延迟添加事件监听，避免当前点击立即触发关闭
        setTimeout(() => {
          mapInstance.value.addEventListener('click', mapClickHandler);
        }, 100);
      }
    } catch (err) {
      console.error('创建弹窗失败:', err);
    }
  };

  // 悬停弹窗的延迟显示
  if (!isClick) {
    const delay = markerData.hoverPopoverDelay !== undefined ? markerData.hoverPopoverDelay : 300;
    popoverTimer.value = setTimeout(showPopoverAction, delay);
  } else {
    // 点击弹窗立即显示
    showPopoverAction();
  }
};

// 隐藏弹窗
const hidePopover = (isClick: boolean = false) => {
  if (!isClick && popoverTimer.value) {
    clearTimeout(popoverTimer.value);
    popoverTimer.value = null;
  }

  if (!isClick && activePopover.value) {
    try {
      const popoverEl = activePopover.value;
      const mapContainer = mapInstance.value?.getContainer();

      if (mapContainer && mapContainer.contains(popoverEl)) {
        mapContainer.removeChild(popoverEl);
      }

      activePopover.value = null;

      // 如果有激活的标记，触发弹窗隐藏事件
      if (activeMarker.value) {
        const markerData = (activeMarker.value as any).__markerData;
        emit('hover-popover-hide', { marker: markerData });
        activeMarker.value = null;
      }
    } catch (err) {
      console.error('移除悬停弹窗失败:', err);
    }
  }

  if (isClick && clickPopover.value) {
    try {
      const popoverEl = clickPopover.value;
      const mapContainer = mapInstance.value?.getContainer();

      if (mapContainer && mapContainer.contains(popoverEl)) {
        mapContainer.removeChild(popoverEl);
      }

      clickPopover.value = null;

      // 触发点击弹窗隐藏事件
      emit('click-popover-hide', {});
    } catch (err) {
      console.error('移除点击弹窗失败:', err);
    }
  }
};

// 在标记创建时添加悬停和点击事件
const addPopoverListeners = (marker: any, markerData: Marker) => {
  // 点击事件
  marker.addEventListener('click', (e: any) => {
    try {
      // 添加点击动画效果
      const markerElement = marker.getElement ?
        marker.getElement() :
        marker.getContainer ? marker.getContainer() : null;

      if (markerElement && markerElement instanceof HTMLElement) {
        // 添加点击波纹效果
        addClickRippleEffect(markerElement);
      }
    } catch (error) {
      console.warn('添加标记点动画效果失败:', error);
    }

    // 触发标记点点击事件
    emit('marker-click', markerData, {
      originalEvent: e,
      target: marker,
      // 传递DOM元素引用
      markerElement: marker.getElement ? marker.getElement() :
        marker.getContainer ? marker.getContainer() : null
    }, marker.Fr);
  });
  
  // 添加右键菜单事件
  marker.addEventListener('contextmenu', (e: any) => {
    info('标记点右键菜单事件: {} ({}, {})', markerData.title || markerData.markerId || markerData.data?.id, 
      e.lnglat.lng, e.lnglat.lat);
    
    // 构造完整的事件对象，确保包含所有必要的属性
    const eventObject = {
      marker: {
        ...markerData,
        position: [e.lnglat.lng, e.lnglat.lat]
      },
      originalEvent: {
        // 添加originEvent属性，这是ScMap.vue中onMarkerContextmenu方法所需要的
        originEvent: {
          ...(e.domEvent || e),
          // 确保preventDefault方法存在
          preventDefault: () => {
            if (e.domEvent && e.domEvent.preventDefault) {
              e.domEvent.preventDefault();
            }
          },
          stopPropagation: () => {
            if (e.domEvent && e.domEvent.stopPropagation) {
              e.domEvent.stopPropagation();
            }
          }
        },
        clientX: e.domEvent ? e.domEvent.clientX : (e.clientX || 0),
        clientY: e.domEvent ? e.domEvent.clientY : (e.clientY || 0),
      }
    };
    
    // 触发标记点右键菜单事件
    emit('marker-contextmenu', marker, eventObject, marker.Fr || marker.getElement());
    
    // 防止事件冒泡和默认行为
    const domEvent = e.domEvent || e;
    if (domEvent && domEvent.preventDefault) {
      domEvent.preventDefault();
    }
    if (domEvent && domEvent.stopPropagation) {
      domEvent.stopPropagation();
    }
  });

};

// 添加点击波纹效果
const addClickRippleEffect = (element: HTMLElement) => {
  // 创建波纹容器，不影响标记点原始位置
  const rippleContainer = document.createElement('div');
  rippleContainer.className = 'marker-ripple-container';
  rippleContainer.style.position = 'absolute';
  rippleContainer.style.left = '0';
  rippleContainer.style.top = '0';
  rippleContainer.style.width = '100%';
  rippleContainer.style.height = '100%';
  rippleContainer.style.pointerEvents = 'none';
  rippleContainer.style.zIndex = '999';
  rippleContainer.style.overflow = 'visible';

  // 创建波纹元素
  const ripple = document.createElement('div');
  ripple.className = 'marker-click-ripple';
  ripple.style.position = 'absolute';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(24, 144, 255, 0.2)';
  ripple.style.border = '2px solid rgba(24, 144, 255, 0.8)';
  ripple.style.pointerEvents = 'none';
  ripple.style.opacity = '1';

  // 添加到波纹容器
  rippleContainer.appendChild(ripple);

  // 先保存元素原来的position属性
  const originalPosition = element.style.position;
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }

  // 添加波纹容器到标记元素
  element.appendChild(rippleContainer);

  // 应用动画
  ripple.animate(
    [
      { width: '0px', height: '0px', opacity: 1 },
      { width: '40px', height: '40px', opacity: 0 }
    ],
    {
      duration: 600,
      easing: 'ease-out'
    }
  );

  // 添加标记缩放动画，但不改变原始定位
  const originalTransform = element.style.transform || '';

  // 确保缩放时标记点中心不变
  element.style.transformOrigin = 'center center';

  // 创建标记缩放动画
  const scaleAnimation = element.animate(
    [
      { transform: `${originalTransform} scale(1)` },
      { transform: `${originalTransform} scale(1.2)` },
      { transform: `${originalTransform} scale(1)` }
    ],
    {
      duration: 300,
      easing: 'ease-in-out'
    }
  );

  // 动画结束后移除波纹容器
  setTimeout(() => {
    if (element.contains(rippleContainer)) {
      element.removeChild(rippleContainer);
    }

    // 如果元素原来不是相对定位，恢复原始定位方式
    if (!originalPosition || originalPosition === 'static') {
      // 给动画一点时间完成
      setTimeout(() => {
        element.style.position = originalPosition;
      }, 100);
    }
  }, 600);
};

// 初始化地图
const initMap = () => {
  if (window.T) {
    // 创建地图实例
    try {
      // 销毁旧的地图实例（如果存在）
      if (mapInstance.value && mapInstance.value.destroy) {
        mapInstance.value.destroy();
      }

      // 确保地图容器存在
  if (!mapContainer.value) {
    console.error('地图容器不存在');
    return;
  }

      // 初始化地图
  mapInstance.value = new window.T.Map(mapContainer.value);

  // 验证center坐标是否为[0,0]
  let mapCenter = props.center;
  if (props.center[0] === 0 && props.center[1] === 0) {
    console.warn('TMap: 检测到center坐标为[0,0]，使用默认北京中心坐标');
    mapCenter = [116.397428, 39.90923]; // 默认北京中心
  }

  // 设置中心点和缩放级别
  mapInstance.value.centerAndZoom(new window.T.LngLat(mapCenter[0], mapCenter[1]), props.zoom);

      // 设置地图视图类型
      // viewMode: BMAP_NORMAL_MAP-普通地图、BMAP_PERSPECTIVE_MAP-透视图、BMAP_SATELLITE_MAP-卫星图、BMAP_HYBRID_MAP-混合地图
      try {
        switch (props.viewType) {
          case 'satellite':
            info('TMap初始化: 设置卫星图（类型值：1）');
            mapInstance.value.setMapType(5); // 使用数字常量1表示卫星图
            break;
          case 'hybrid':
            info('TMap初始化: 设置混合地图（类型值：2）');
            mapInstance.value.setMapType(3); // 使用数字常量2表示混合地图
            break;
          default:
            info('TMap初始化: 设置普通地图（类型值：0）');
            mapInstance.value.setMapType(0); // 使用数字常量0表示普通地图
        }
      } catch (error) {
        console.error('TMap初始化: 设置地图类型失败', error);
      }

      // 设置是否允许拖拽
  if (props.draggable) {
        mapInstance.value.enableDrag(); // 启用拖拽
  } else {
        mapInstance.value.disableDrag(); // 禁用拖拽
  }

      // 设置是否允许鼠标滚轮缩放
  if (props.scrollWheel) {
        mapInstance.value.enableScrollWheelZoom(); // 启用滚轮缩放
  } else {
        mapInstance.value.disableScrollWheelZoom(); // 禁用滚轮缩放
  }

      // 设置是否显示缩放控件
  if (props.zoomControl) {
        // 天地图缩放控件
    const zoomControl = new window.T.Control.Zoom();
        zoomControl.setPosition("bottomright"); // 设置控件位置为右下角
        mapInstance.value.addControl(zoomControl);

        // 调整缩放控件的zIndex，使其显示在其他元素下方
        nextTick(() => {
          try {
            // 尝试找到缩放控件的DOM元素
            const zoomContainer = document.querySelector('.tdt-zoom-container') ||
              document.querySelector('.tdt-control-zoom') ||
              document.querySelector('.tmap-control-zoom');

            if (zoomContainer && zoomContainer instanceof HTMLElement) {
              info('TMap: 调整缩放控件zIndex');
              // 设置较低的zIndex值，使其显示在更底层
              zoomContainer.style.zIndex = '10';
              // 移动到底部位置
              zoomContainer.style.bottom = '20px';
              zoomContainer.style.right = '15px';
      } else {
              // 如果无法直接找到元素，尝试应用全局样式
              const styleEl = document.createElement('style');
              styleEl.innerHTML = `
                .tdt-zoom-container, .tdt-control-zoom, .tmap-control-zoom {
                  z-index: 10 !important;
                  bottom: 20px !important;
                  right: 15px !important;
                }
              `;
              document.head.appendChild(styleEl);
              info('TMap: 通过全局样式调整缩放控件层级');
            }
          } catch (error) {
            console.error('TMap: 调整缩放控件位置失败', error);
          }
        });
      }

      // 设置是否显示比例尺控件
  if (props.scaleControl) {
        // 天地图比例尺控件
        mapInstance.value.addControl(new window.T.Control.Scale());
  }

  // 绑定事件
  bindMapEvents();

      // 添加初始标记点
      if (props.markers.length > 0) {
        addMarkers(props.markers);
      }

  // 触发地图加载完成事件
  emit('map-loaded', mapInstance.value);

      // 地图加载完成后，显示标记标签（如果配置了显示）
      if (props.showMarkerLabels && props.markers.length > 0) {
        // 使用nextTick确保组件完全挂载后再执行标签显示
        nextTick(() => {
          info('TMap: 正在初始化地图时显示标记标签');
          toggleMarkerLabels(true);
        });
      }
    } catch (error) {
      console.error('天地图初始化失败:', error);
    }
  } else {
    console.error('天地图API未加载');
  }
};

// 添加标记点
const addMarkers = (markers?: Marker[]) => {
  if (!mapInstance.value) return;

  const markersToAdd = markers || localMarkers.value;

  // 如果没有提供标记点数组，默认清除现有标记点
  if (!markers) {
    clearMarkers();
  }

  markersToAdd.forEach(marker => {
    try {
      // 创建标记点实例
      const position = new window.T.LngLat(marker.position[0], marker.position[1]);

      // 准备标记点选项
      const options: any = {
        title: marker.title || '',
        draggable: !!marker.draggable
      };
      marker.data = {
        id: marker.markerId || marker.data?.id || '',
        markerId: marker.markerId || marker.data?.id || '',
        type: 'marker',
        properties: {},
      }

      // 处理图标，支持SVG和URL
      if (marker.icon) {
        // 区分三种情况：
        // 1. 内联SVG (以<svg开头的字符串)
        // 2. SVG URL (以data:image/svg+xml开头的URL)
        // 3. 普通图片URL
        if (typeof marker.icon === 'string' && (
             marker.icon.trim().startsWith('<svg') || 
             marker.icon.trim().startsWith('data:image/svg+xml')
           )) {
          // SVG图标 (内联或URL)
          info('处理SVG图标: {}', marker.icon.substring(0, 40) + '...');
          let svgContainer;
          
          if (marker.icon.trim().startsWith('<svg')) {
            var svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(marker.icon)));
            marker.icon = svgUrl;
          }
          // SVG URL
          svgContainer = document.createElement('div');
          const img = document.createElement('img');
          img.src = marker.icon;
          img.style.width = '100%';
          img.style.height = '100%';
          svgContainer.appendChild(img);
          
          svgContainer.style.width = (marker.size?.[0] || DEFAULT_MARKER_SIZE[0]) + 'px';
          svgContainer.style.height = (marker.size?.[1] || DEFAULT_MARKER_SIZE[1]) + 'px';

          // 创建无图标的标记点，后续设置内容
          const markerInstance = new window.T.Marker(position, options);
          
          // 添加对markerInstance和setContent方法的检查
          if (markerInstance && typeof markerInstance.setContent === 'function') {
            markerInstance.setContent(svgContainer);
          } else {
            console.warn('无法设置标记内容: setContent方法不可用', marker);
          }
          // 添加到地图
          mapInstance.value.addOverLay(markerInstance);

          // 为标记点DOM元素添加data-marker-id属性
          setTimeout(() => {
            try {
              const markerId = marker.markerId || marker.data?.id || '';
              const element = markerInstance.getElement ? markerInstance.getElement() :
                (markerInstance.getContainer ? markerInstance.getContainer() : null);
              if (element && markerId) {
                element.setAttribute('data-marker-id', String(markerId));
                // 添加更多属性以便于识别和定位
                element.setAttribute('data-map-type', 'tmap');
                if (marker.title) {
                  element.setAttribute('data-marker-title', marker.title);
                }
                // 添加类名以便于CSS选择器识别
                element.classList.add('sc-map-marker');
              }
            } catch (error) {
              console.warn('为标记点DOM元素添加data-marker-id属性失败:', error);
            }
          }, 100); // 延迟添加，确保DOM元素已创建

          // 绑定事件
          addPopoverListeners(markerInstance, marker);

          // 存储标记点实例和数据，以便后续操作
          markerInstance.__markerData = marker;
          markersInstances.value.push(markerInstance);
        } else {
          // URL图标
          try {
            info('正在创建URL图标标记: {}', marker.icon);
            
            // 确保URL不为空
            if (!marker.icon || typeof marker.icon !== 'string') {
              console.error('图标URL无效:', marker.icon);
              throw new Error('无效的图标URL');
            }
            
          const icon = new window.T.Icon({
            iconUrl: marker.icon,
            iconSize: new window.T.Point(marker.size?.[0] || DEFAULT_MARKER_SIZE[0], marker.size?.[1] || DEFAULT_MARKER_SIZE[1])
          });

            // 检查icon是否正确创建
            if (!icon) {
              console.error('创建图标对象失败');
              throw new Error('图标对象创建失败');
            }
            
            info('图标对象创建成功，设置到options');
          options.icon = icon;

          const markerInstance = new window.T.Marker(position, options);

            // 检查markerInstance是否正确创建
            if (!markerInstance) {
              console.error('创建标记实例失败');
              throw new Error('标记实例创建失败');
            }
            
            info('标记实例创建成功，添加到地图');
          // 添加到地图
          mapInstance.value.addOverLay(markerInstance);
            
            // 为标记点DOM元素添加data-marker-id属性
            setTimeout(() => {
              try {
                const markerId = marker.markerId || marker.data?.id || '';
                const element = markerInstance.getElement ? markerInstance.getElement() :
                  (markerInstance.getContainer ? markerInstance.getContainer() : null);
                if (element && markerId) {
                  element.setAttribute('data-marker-id', String(markerId));
                  // 添加更多属性以便于识别和定位
                  element.setAttribute('data-map-type', 'tmap');
                  if (marker.title) {
                    element.setAttribute('data-marker-title', marker.title);
                  }
                  // 添加类名以便于CSS选择器识别
                  element.classList.add('sc-map-marker');
                }
              } catch (error) {
                console.warn('为标记点DOM元素添加data-marker-id属性失败:', error);
              }
            }, 100); // 延迟添加，确保DOM元素已创建

          // 绑定事件
          addPopoverListeners(markerInstance, marker);

          // 存储标记点实例和数据，以便后续操作
          markerInstance.__markerData = marker;
          markersInstances.value.push(markerInstance);
          } catch (iconError) {
            console.error('URL图标创建或设置失败:', iconError, marker);
            
            // 创建默认标记点作为后备
            try {
              info('使用默认标记作为后备');
              const defaultMarkerInstance = new window.T.Marker(position, {
                title: marker.title || '',
                draggable: !!marker.draggable
              });
              
              mapInstance.value.addOverLay(defaultMarkerInstance);
              
              // 设置事件和存储
              addPopoverListeners(defaultMarkerInstance, marker);
              defaultMarkerInstance.__markerData = marker;
              markersInstances.value.push(defaultMarkerInstance);
            } catch (backupError) {
              console.error('创建后备标记点也失败:', backupError);
            }
          }
        }
      } else {
        // 无图标或默认图标
        const markerInstance = new window.T.Marker(position, options);

        // 添加到地图
        mapInstance.value.addOverLay(markerInstance);

        // 为标记点DOM元素添加data-marker-id属性
        setTimeout(() => {
          try {
            const markerId = marker.markerId || marker.data?.id || '';
            const element = markerInstance.getElement ? markerInstance.getElement() :
              (markerInstance.getContainer ? markerInstance.getContainer() : null);
            if (element && markerId) {
              element.setAttribute('data-marker-id', String(markerId));
              // 添加更多属性以便于识别和定位
              element.setAttribute('data-map-type', 'tmap');
              if (marker.title) {
                element.setAttribute('data-marker-title', marker.title);
              }
              // 添加类名以便于CSS选择器识别
              element.classList.add('sc-map-marker');
            }
          } catch (error) {
            console.warn('为标记点DOM元素添加data-marker-id属性失败:', error);
          }
        }, 100); // 延迟添加，确保DOM元素已创建

        // 绑定事件
        addPopoverListeners(markerInstance, marker);

        // 存储标记点实例和数据，以便后续操作
        markerInstance.__markerData = marker;
        markersInstances.value.push(markerInstance);
      }
    } catch (error) {
      console.error('创建标记点失败:', error, marker);
    }
  });

  // 添加完所有标记后检查是否需要显示标签
  if (props.showMarkerLabels && shouldShowLabels.value) {
    nextTick(() => toggleMarkerLabels(true));
  }

  // 如果启用了聚合，重新应用聚合
  if (props.clusterOptions?.enable) {
    enableCluster(props.clusterOptions);
  }
};

// 清除标记点
const clearMarkers = () => {
  if (!mapInstance.value) return;

  // 先禁用聚合
  disableCluster();

  markersInstances.value.forEach(marker => {
    // 移除标记点
    mapInstance.value.removeOverLay(marker);

    // 移除标签（如果有）
    const labelInstance = (marker as any).__labelInstance;
    if (labelInstance) {
      mapInstance.value.removeOverLay(labelInstance);
    }
  });

  markersInstances.value = [];
};

/**
 * 设置标记点（先清空再添加）
 * @param markers 标记点数组
 */
const setMarkers = (markers: Marker[]) => {
  if (!mapInstance.value) return;

  // 先清空现有标记点
  clearMarkers();

  // 处理标记点ID去重逻辑
  const uniqueIds = new Set();
  const uniqueMarkers = markers.filter(marker => {
    const markerId = marker.data?.id;

    // 如果没有ID，或者ID没有重复，则保留
    if (!markerId) return true;

    if (uniqueIds.has(markerId)) {
      return false; // 丢弃重复ID的标记点
    } else {
      uniqueIds.add(markerId);
      return true;
    }
  });

  // 添加去重后的标记点
  if (uniqueMarkers.length > 0) {
    addMarkers(uniqueMarkers);
  }

  // 确保在设置标记后检查标签状态
  if (props.showMarkerLabels) {
    nextTick(() => toggleMarkerLabels(true));
  }
};

/**
 * 根据id删除指定的标记点
 * @param markerId 要删除的标记点ID
 * @returns 删除是否成功
 */
const removeMarker = (markerId: string) => {
  if (!mapInstance.value) return false;

  // 查找要删除的标记点索引
  const markerIndex = markersInstances.value.findIndex(marker => {
    const markerData = (marker as any).__markerData;
    return markerData &&
      (markerData.markerId === markerId || markerData.id === markerId ||
        (markerData.data && markerData.data.id === markerId));
  });

  // 如果找到了对应的标记点
  if (markerIndex !== -1) {
    const marker = markersInstances.value[markerIndex];
    
    // 删除标记点标签（如果有）
    try {
      const markerId = (marker as any).__markerData?.markerId || (marker as any).__markerData?.data?.id;
      if (marker.__labelInstance) {
        mapInstance.value.removeOverLay(marker.__labelInstance);
      }
    } catch (e) {
      console.warn('删除标记点标签失败:', e);
    }
    
    // 移除地图上的标记点
    mapInstance.value.removeOverLay(markersInstances.value[markerIndex]);
    // 从标记点实例数组中移除
    markersInstances.value.splice(markerIndex, 1);
    return true;
  }

  return false;
};

/**
 * 根据标记点数据删除标记点
 * @param marker 要删除的标记点数据
 * @returns 删除是否成功
 */
const removeMarkerByData = (marker: Marker) => {
  if (!marker || !mapInstance.value) return false;
  
  // 优先使用markerId，其次使用data.id
  const markerId = marker.markerId || (marker.data && marker.data.id);
  if (markerId) {
    return removeMarker(markerId);
  }
  
  // 如果没有ID，尝试通过位置匹配
  const markerIndex = markersInstances.value.findIndex(m => {
    const mData = (m as any).__markerData;
    if (!mData || !mData.position || !marker.position) return false;
    
    // 比较位置是否相同
    return mData.position[0] === marker.position[0] && 
           mData.position[1] === marker.position[1];
  });
  
  if (markerIndex !== -1) {
    const m = markersInstances.value[markerIndex];
    mapInstance.value.removeOverLay(m);
    markersInstances.value.splice(markerIndex, 1);
    return true;
  }
  
  return false;
};

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return;
  mapInstance.value.addEventListener('click', (e: any) => {
    emit('map-click', {
      position: [e.lnglat.lng, e.lnglat.lat],
      lat: e.lnglat.lat, // 为了兼容父组件的事件处理
      lng: e.lnglat.lng,
      originalEvent: e
    });
  });

  mapInstance.value.addEventListener('zoomend', () => {
    emit('zoom-changed', mapInstance.value.getZoom());
  });

  mapInstance.value.addEventListener('moveend', () => {
    const center = mapInstance.value.getCenter();
    emit('center-changed', [center.lng, center.lat]);
  });
};

// 设置地图中心点
const setCenter = (center: [number, number]) => {
  if (!mapInstance.value) return;
  
  // 验证center坐标是否为[0,0]
  if (center[0] === 0 && center[1] === 0) {
    console.warn('TMap: 尝试设置center为[0,0]，这可能是错误值，忽略此次设置');
    return;
  }
  
  const tPoint = new window.T.LngLat(center[0], center[1]);
  mapInstance.value.panTo(tPoint);
};

// 设置缩放级别
const setZoom = (zoom: number) => {
  if (!mapInstance.value) return;
  mapInstance.value.setZoom(zoom);
};

/**
 * 存储测距相关组件
 */
interface DistanceComponents {
  markers: any[];
  line: any;
  label: any;
  handleClick: (e: any) => void;
  handleRightClick: (e: any) => void;
}

// 开始测量距离
const startMeasure = () => {
  if (!mapInstance.value) return;

  // 先清除之前的测量数据（如果有）
  stopMeasure();

  // 禁用其他工具
  stopDrawing();
  disableAddMarker();

  // 记录当前工具状态
  currentTool.value = ToolType.DISTANCE;

  // 设置鼠标样式为十字形
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = 'crosshair';
  }

  info('天地图开始测距');

  // 创建测距相关变量
  const pointsArray: Array<[number, number]> = [];
  let measureLineObj: any = null;
  let markersArray: any[] = [];
  let totalDistance = 0;
  let distanceLabel: any = null;

  // 处理地图点击事件
  const handleMeasureClick = (e: any) => {
    if (!e.lnglat) return;

    try {
      // 安全地获取经纬度
      const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
      const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);

      info('测距点击点: {}', lngValue, latValue);

      // 添加点到数组
      pointsArray.push([lngValue, latValue]);

      // 添加标记点
      try {
        const markerPoint = new window.T.LngLat(lngValue, latValue);
        const marker = new window.T.Marker(markerPoint, {
          icon: new window.T.Icon({
            iconUrl: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
            iconSize: new window.T.Point(20, 20),
            iconAnchor: new window.T.Point(10, 10)
          })
        });
        mapInstance.value.addOverLay(marker);
        markersArray.push(marker);
      } catch (err) {
        console.error('创建标记点失败:', err);
      }

      // 更新线段
      if (pointsArray.length >= 2) {
        // 如果已有测距线，则移除
        if (measureLineObj) {
          mapInstance.value.removeOverLay(measureLineObj);
        }

        try {
          // 创建新的测距线
          const tPoints = pointsArray.map(p => {
            return new window.T.LngLat(p[0], p[1]);
          });

          measureLineObj = new window.T.Polyline(tPoints, {
            color: '#FF0000',
            weight: 3,
            opacity: 0.8
          });
          mapInstance.value.addOverLay(measureLineObj);

          // 计算总距离
          totalDistance = 0;
          for (let i = 1; i < pointsArray.length; i++) {
            const p1 = new window.T.LngLat(pointsArray[i - 1][0], pointsArray[i - 1][1]);
            const p2 = new window.T.LngLat(pointsArray[i][0], pointsArray[i][1]);
            totalDistance += p1.distanceTo(p2);
          }

          // 更新距离标签
          if (distanceLabel) {
            mapInstance.value.removeOverLay(distanceLabel);
          }

          // 添加距离标签
          const lastPoint = pointsArray[pointsArray.length - 1];
          distanceLabel = new window.T.Label({
            position: new window.T.LngLat(lastPoint[0], lastPoint[1]),
            text: `总距离: ${(totalDistance / 1000).toFixed(3)} 公里`,
            offset: new window.T.Point(5, 5)
          });
          mapInstance.value.addOverLay(distanceLabel);

          info('测距线更新: {}', totalDistance);
        } catch (err) {
          console.error('更新测距线失败:', err);
        }
      }
    } catch (err) {
      console.error('测距处理点击事件失败:', err);
    }
  };

  // 处理右键点击完成测距
  const handleMeasureRightClick = () => {
    try {
      // 移除事件监听
      if (mapInstance.value) {
        mapInstance.value.removeEventListener('click', handleMeasureClick);
        mapInstance.value.removeEventListener('rightclick', handleMeasureRightClick);

        // 恢复鼠标样式
        if (mapInstance.value.getContainer()) {
          mapInstance.value.getContainer().style.cursor = '';
        }
      }

      // 触发测距结果事件
      if (pointsArray.length >= 2) {
        const result: DistanceResultEvent = {
          distance: totalDistance,
          path: pointsArray,
          originalEvent: null
        } as any;

        distanceResult.value = result;
        emit('distance-result', result);
        info('测距完成, 总距离: {}', totalDistance);
      }

      // 重置当前工具
      currentTool.value = '';
    } catch (err) {
      console.error('测距处理右键事件失败:', err);
    }
  };

  // 添加事件监听
  mapInstance.value.addEventListener('click', handleMeasureClick);
  mapInstance.value.addEventListener('rightclick', handleMeasureRightClick);

  // 存储测距组件供后续清除使用
  distanceComponents.value = {
    markers: markersArray,
    line: measureLineObj,
    label: distanceLabel,
    handleClick: handleMeasureClick,
    handleRightClick: handleMeasureRightClick
  };
};

// 停止测量距离
const stopMeasure = () => {
  if (!mapInstance.value) return;

  info('天地图停止测距');

  // 清除当前工具状态
  currentTool.value = '';

  // 恢复鼠标样式
  setCursorStyle('default');

  // 移除事件监听和清理组件
  if (distanceComponents.value) {
    // 移除事件监听
    mapInstance.value.removeEventListener('click', distanceComponents.value.handleClick);
    mapInstance.value.removeEventListener('rightclick', distanceComponents.value.handleRightClick);

    // 清除标记点
    if (distanceComponents.value.markers) {
      distanceComponents.value.markers.forEach(marker => {
        if (marker && mapInstance.value) {
          mapInstance.value.removeOverLay(marker);
        }
      });
    }

    // 清除测距线
    if (distanceComponents.value.line && mapInstance.value) {
      mapInstance.value.removeOverLay(distanceComponents.value.line);
    }

    // 清除距离标签
    if (distanceComponents.value.label && mapInstance.value) {
      mapInstance.value.removeOverLay(distanceComponents.value.label);
    }

    // 重置距离组件
    distanceComponents.value = null;
  }

  // 重置测距结果
  distanceResult.value = null;

  info('天地图测距已完全清除');
};

// 开始绘制图形
const startDrawing = (type: ToolType) => {
  if (!mapInstance.value) return;

  info('开始绘制 {}', type);

  // 先停止其他工具
  stopMeasure();
  disableAddMarker();

  // 首先清除可能的上一次绘制遗留的事件处理函数
  if ((mapInstance.value as any).__drawingHandlers) {
    const handlers = (mapInstance.value as any).__drawingHandlers;
    mapInstance.value.removeEventListener('click', handlers.handleClick);
    mapInstance.value.removeEventListener('mousemove', handlers.handleMouseMove);
    mapInstance.value.removeEventListener('rightclick', handlers.handleRightClick);
    mapInstance.value.removeEventListener('dblclick', handlers.handleDblClick);
  }

  // 设置当前工具
  currentTool.value = type;

  // 设置鼠标样式为十字形
  setCursorStyle('crosshair');

  // 创建绘图所需的变量 - 每次开始新的绘制都重置这些变量
  const pointsArray: Array<[number, number]> = [];
  let drawingShape: any = null;
  let tempShape: any = null;

  // 只清理临时形状，不清理已保存的图形
  const cleanupTemporaryShapes = () => {
    try {
      // 获取地图上的所有覆盖物
      const allOverlays = mapInstance.value.getOverlays?.() || [];

      for (let i = 0; i < allOverlays.length; i++) {
        const overlay = allOverlays[i];

        // 跳过已保存的图形(有__shapeId标记的)
        if ((overlay as any).__shapeId) {
          continue;
        }

        // 判断是否为临时绘图相关的图形
        let isTemporaryOverlay = false;

        if (overlay instanceof window.T.Circle && !window._tmap_overlays?.has(overlay)) {
          isTemporaryOverlay = true;
        } else if (overlay instanceof window.T.Polygon && !window._tmap_overlays?.has(overlay)) {
          isTemporaryOverlay = true;
        } else if (overlay instanceof window.T.Polyline && !window._tmap_overlays?.has(overlay)) {
          isTemporaryOverlay = true;
        }

        // 只移除临时图形
        if (isTemporaryOverlay) {
          info('清除未保存的临时绘图对象');
          mapInstance.value.removeOverLay(overlay);
        }
      }
    } catch (err) {
      console.error('清理临时绘图对象失败:', err);
    }
  };

  // 清理之前的临时图形，但保留已保存的图形
  cleanupTemporaryShapes();

  // 处理点击事件 - 收集点
  const handleDrawingClick = (e: any) => {
    if (!e.lnglat) return;

    try {
      // 安全地获取经纬度
      const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
      const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);

      info('绘图点击点: {}', lngValue, latValue);

      // 添加点到数组
      pointsArray.push([lngValue, latValue]);

      // 根据类型和点的数量进行不同处理
      switch (type) {
        case 'circle':
          // 圆形需要两个点：中心点和半径点
          if (pointsArray.length === 1) {
            // 第一个点是圆心
            info('选择圆心: {}', lngValue, latValue);
          } else if (pointsArray.length === 2) {
            // 第二个点用来计算半径
            const centerPoint = new window.T.LngLat(pointsArray[0][0], pointsArray[0][1]);
            const radiusPoint = new window.T.LngLat(lngValue, latValue);
            const radius = centerPoint.distanceTo(radiusPoint);

            info('创建圆形，半径: {}', radius);

            // 移除任何可能的临时预览图形
            if (tempShape) {
              info('清除临时预览图形');
              mapInstance.value.removeOverLay(tempShape);
              tempShape = null;
            }

            // 创建当前绘制的形状变量 - 不再清除之前的绘图形状
            // 确保每次都创建新的圆形实例，而不重用之前的

            // 样式配置
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.9,
              fillColor: '#1890FF',
              fillOpacity: 0.5
            };

            // 创建新的圆形实例
            const circleShape = new window.T.Circle(centerPoint, radius, styleOptions);

            // 不再尝试清除已有的圆形，允许多个圆形共存

            // 添加新圆形到地图
            mapInstance.value.addOverLay(circleShape);
            drawingShape = circleShape;

            // 完成绘制，清除临时状态并触发事件
            finishDrawing(drawingShape, [pointsArray[0], [lngValue, latValue]], radius);

            // 重置点数组，准备下一次绘制
            pointsArray.length = 0;
          }
          break;

        case 'rectangle':
          // 矩形需要两个点：对角点
          if (pointsArray.length === 1) {
            // 第一个点是起始点
            info('选择矩形起始点: {}', lngValue, latValue);
          } else if (pointsArray.length === 2) {
            // 第二个点是对角点，创建矩形
            // 获取西南和东北角点
            const minLng = Math.min(pointsArray[0][0], pointsArray[1][0]);
            const maxLng = Math.max(pointsArray[0][0], pointsArray[1][0]);
            const minLat = Math.min(pointsArray[0][1], pointsArray[1][1]);
            const maxLat = Math.max(pointsArray[0][1], pointsArray[1][1]);

            const sw = [minLng, minLat];
            const ne = [maxLng, maxLat];

            info('创建矩形，从 {}', sw, '到', ne);

            // 移除任何临时预览图形
            if (tempShape) {
              info('清除临时预览图形');
              mapInstance.value.removeOverLay(tempShape);
              tempShape = null;
            }

            // 创建当前绘制的形状变量 - 不再清除之前的绘图形状
            // 确保每次都创建新的矩形实例，而不重用之前的

            // 构建矩形四个角点
            const path = [
              [sw[0] as number, sw[1] as number],
              [ne[0] as number, sw[1] as number],
              [ne[0] as number, ne[1] as number],
              [sw[0] as number, ne[1] as number],
              [sw[0] as number, sw[1] as number] // 闭合
            ].map(point => new window.T.LngLat(Number(point[0]), Number(point[1])));

            // 样式配置
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.9,
              fillColor: '#1890FF',
              fillOpacity: 0.5
            };

            // 创建多边形实例（矩形）
            const rectShape = new window.T.Polygon(path, styleOptions);
            mapInstance.value.addOverLay(rectShape);
            drawingShape = rectShape;

            // 完成绘制，清除临时状态
            finishDrawing(drawingShape, [[sw[0], sw[1]], [ne[0], ne[1]]]);

            // 重置点数组，准备下一次绘制
            pointsArray.length = 0;
          }
          break;

        case 'polyline':
          // 折线需要至少两个点
          if (pointsArray.length >= 2) {
            info('更新或创建折线点');

            // 移除临时预览图形
            if (tempShape) {
              info('清除临时预览图形');
              mapInstance.value.removeOverLay(tempShape);
              tempShape = null;
            }

            const path = pointsArray.map(point => new window.T.LngLat(point[0], point[1]));

            // 样式配置
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.9
            };

            // 创建折线实例 - 每次创建新实例，不再重用旧实例
            const polylineShape = new window.T.Polyline(path, styleOptions);
            mapInstance.value.addOverLay(polylineShape);

            // 更新当前绘制的形状
            drawingShape = polylineShape;

            if (pointsArray.length > 2) {
              // 右键完成绘制，这里先保留当前状态
              info('继续添加折线点，右键或双击可完成绘制');
            }
          }
          break;

        case 'polygon':
          // 多边形需要至少三个点
          if (pointsArray.length >= 3) {
            info('更新或创建多边形点');

            // 移除临时预览图形
            if (tempShape) {
              info('清除临时预览图形');
              mapInstance.value.removeOverLay(tempShape);
              tempShape = null;
            }

            // 闭合多边形路径
            const closedPath = [...pointsArray];
            if (pointsArray.length >= 3 &&
              (closedPath[0][0] !== closedPath[closedPath.length - 1][0] ||
                closedPath[0][1] !== closedPath[closedPath.length - 1][1])) {
              closedPath.push(closedPath[0]);
            }

            const path = closedPath.map(point => new window.T.LngLat(point[0], point[1]));

            // 样式配置
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.9,
              fillColor: '#1890FF',
              fillOpacity: 0.5
            };

            // 创建多边形实例 - 每次创建新实例，不再重用旧实例
            const polygonShape = new window.T.Polygon(path, styleOptions);

            // 为图形添加ID标记，便于后续识别
            (polygonShape as any).__shapeId = `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            // 添加图形数据，用于右键菜单等功能
            (polygonShape as any).__shapeData = {
              id: polygonShape.id,
              type: 'polygon',
              path: path,
              style: styleOptions,
              data: {}
            };

            // 使用统一的事件处理函数
            addShapeEventListeners(polygonShape, (polygonShape as any).__shapeData, 'polygon');

            // 添加到地图
            mapInstance.value.addOverLay(polygonShape);
            drawingShape = polygonShape;

            // 完成绘制，清除临时状态
            finishDrawing(drawingShape, pointsArray);

            // 重置点数组，准备下一次绘制
            pointsArray.length = 0;
          }
          break;
      }
    } catch (err) {
      console.error('绘图处理点击事件失败:', err);
    }
  };

  // 处理鼠标移动 - 实时预览
  const handleDrawingMouseMove = (e: any) => {
    if (!e.lnglat || pointsArray.length === 0) return;

    try {
      // 获取当前鼠标位置
      const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
      const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);

      // 根据不同绘图类型处理预览
      switch (type) {
        case 'circle':
          // 只有在已有起始点时才显示预览
          if (pointsArray.length === 1) {
            // 计算半径
            const centerPoint = new window.T.LngLat(pointsArray[0][0], pointsArray[0][1]);
            const currentPoint = new window.T.LngLat(lngValue, latValue);
            const radius = centerPoint.distanceTo(currentPoint);

            // 更新或创建预览圆形
            if (tempShape) {
              mapInstance.value.removeOverLay(tempShape);
            }

            // 样式配置 - 透明度降低表示预览状态
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.6,
              fillColor: '#1890FF',
              fillOpacity: 0.3
            };

            // 创建预览圆形
            tempShape = new window.T.Circle(centerPoint, radius, styleOptions);
            mapInstance.value.addOverLay(tempShape);
          }
          break;

        case 'rectangle':
          // 只有在已有起始点时才显示预览
          if (pointsArray.length === 1) {
            // 获取西南和东北角点
            const minLng = Math.min(pointsArray[0][0], lngValue);
            const maxLng = Math.max(pointsArray[0][0], lngValue);
            const minLat = Math.min(pointsArray[0][1], latValue);
            const maxLat = Math.max(pointsArray[0][1], latValue);

            const sw = [minLng, minLat];
            const ne = [maxLng, maxLat];

            // 构建矩形四个角点
            const path = [
              [sw[0] as number, sw[1] as number],
              [ne[0] as number, sw[1] as number],
              [ne[0] as number, ne[1] as number],
              [sw[0] as number, ne[1] as number],
              [sw[0] as number, sw[1] as number] // 闭合
            ].map(point => new window.T.LngLat(Number(point[0]), Number(point[1])));

            // 更新或创建预览矩形
            if (tempShape) {
              mapInstance.value.removeOverLay(tempShape);
            }

            // 样式配置 - 透明度降低表示预览状态
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.6,
              fillColor: '#1890FF',
              fillOpacity: 0.3
            };

            // 创建预览矩形
            tempShape = new window.T.Polygon(path, styleOptions);
            mapInstance.value.addOverLay(tempShape);
          }
          break;

        case 'polyline':
          // 只有在已有至少一个点时才显示预览
          if (pointsArray.length >= 1) {
            // 构建包含当前鼠标位置的路径
            const previewPath = [...pointsArray, [lngValue, latValue]];
            const path = previewPath.map(point => new window.T.LngLat(point[0], point[1]));

            // 更新或创建预览折线
            if (tempShape) {
              mapInstance.value.removeOverLay(tempShape);
            }

            // 样式配置 - 透明度降低表示预览状态
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.6
            };

            // 创建预览折线
            tempShape = new window.T.Polyline(path, styleOptions);
            mapInstance.value.addOverLay(tempShape);
          }
          break;

        case 'polygon':
          // 只有在已有至少两个点时才显示预览
          if (pointsArray.length >= 2) {
            // 构建包含当前鼠标位置的路径并闭合
            const previewPath = [...pointsArray, [lngValue, latValue], pointsArray[0]];
            const path = previewPath.map(point => new window.T.LngLat(point[0], point[1]));

            // 更新或创建预览多边形
            if (tempShape) {
              mapInstance.value.removeOverLay(tempShape);
            }

            // 样式配置 - 透明度降低表示预览状态
            const styleOptions = {
              color: '#1890FF',
              weight: 2,
              opacity: 0.6,
              fillColor: '#1890FF',
              fillOpacity: 0.3
            };

            // 创建预览多边形
            tempShape = new window.T.Polygon(path, styleOptions);
            mapInstance.value.addOverLay(tempShape);
          }
          break;
      }
    } catch (err) {
      console.error('绘图处理鼠标移动事件失败:', err);
    }
  };

  // 处理右键完成绘制
  const handleDrawingRightClick = (e: any) => {
    // 对于折线和多边形，右键点击完成绘制
    if ((type === 'polyline' && pointsArray.length >= 2) ||
      (type === 'polygon' && pointsArray.length >= 3)) {

      // 移除临时预览形状
      if (tempShape) {
        mapInstance.value.removeOverLay(tempShape);
        tempShape = null;
      }

      // 对于多边形，确保路径闭合
      if (type === 'polygon') {
        // 闭合多边形路径
        const closedPath = [...pointsArray];
        if (closedPath[0][0] !== closedPath[closedPath.length - 1][0] ||
          closedPath[0][1] !== closedPath[closedPath.length - 1][1]) {
          closedPath.push(closedPath[0]);
        }

        // 完成多边形绘制
        finishDrawing(drawingShape, pointsArray);
      } else {
        // 完成折线绘制
        finishDrawing(drawingShape, pointsArray);
      }
    }
  };

  // 处理双击完成绘制
  const handleDrawingDblClick = (e: any) => {
    // 对于折线和多边形，双击完成绘制
    if ((type === 'polyline' && pointsArray.length >= 2) ||
      (type === 'polygon' && pointsArray.length >= 3)) {

      info('双击完成绘制 {}', type);

      // 移除临时预览形状
      if (tempShape) {
        mapInstance.value.removeOverLay(tempShape);
        tempShape = null;
      }

      // 对于多边形，确保路径闭合
      if (type === 'polygon') {
        // 闭合多边形路径
        const closedPath = [...pointsArray];
        if (closedPath[0][0] !== closedPath[closedPath.length - 1][0] ||
          closedPath[0][1] !== closedPath[closedPath.length - 1][1]) {
          closedPath.push(closedPath[0]);
        }

        // 完成多边形绘制
        finishDrawing(drawingShape, pointsArray);
      } else {
        // 完成折线绘制
        finishDrawing(drawingShape, pointsArray);
      }

      // 阻止事件传播
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 完成绘制，生成最终形状
  const finishDrawing = (shape: any, path: [number, number][], radius?: number) => {
    if (!shape) return;

    // 生成唯一ID
    let shapeId: string;
    let resultShape: Shape;

    // 根据形状类型构建最终的形状数据
    switch (type) {
      case 'circle':
        shapeId = `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        resultShape = {
          id: shapeId,
          type: 'circle',
          path: [path[0]],
          radius: radius || 0,
          style: {
            strokeColor: '#1890FF',
            strokeWeight: 2,
            strokeOpacity: 0.9,
            fillColor: '#1890FF',
            fillOpacity: 0.5
          }
        };
        break;

      case 'rectangle':
        shapeId = `rectangle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        resultShape = {
          id: shapeId,
          type: 'rectangle',
          path: path,
          style: {
            strokeColor: '#1890FF',
            strokeWeight: 2,
            strokeOpacity: 0.9,
            fillColor: '#1890FF',
            fillOpacity: 0.5
          }
        };
        break;

      case 'polyline':
        shapeId = `polyline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        resultShape = {
          id: shapeId,
          type: 'polyline',
          path: path,
          style: {
            strokeColor: '#1890FF',
            strokeWeight: 2,
            strokeOpacity: 0.9
          }
        };
        break;

      case 'polygon':
        shapeId = `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        resultShape = {
          id: shapeId,
          type: 'polygon',
          path: path,
          style: {
            strokeColor: '#1890FF',
            strokeWeight: 2,
            strokeOpacity: 0.9,
            fillColor: '#1890FF',
            fillOpacity: 0.5
          }
        };
        break;

      default:
        return;
    }

    // 确保shape存在且已添加到地图
    if (shape && mapInstance.value) {
      // 检查是否已经存在于地图中
      let isAlreadyAdded = false;
      const existingOverlays = mapInstance.value.getOverlays?.() || [];

      for (let i = 0; i < existingOverlays.length; i++) {
        if (existingOverlays[i] === shape) {
          isAlreadyAdded = true;
          break;
        }
      }

      // 如果未添加，则添加到地图
      if (!isAlreadyAdded) {
        mapInstance.value.addOverLay(shape);
      }

      // 确保全局存储对象存在
      if (!window._tmap_overlays) {
        window._tmap_overlays = new Map();
      }

      // 为图形添加ID标记，便于后续识别
      (shape as any).__shapeId = shapeId;

      // 存储图形
      window._tmap_overlays.set(shapeId, shape);

      // 确保在下次检查时，此图形会被识别为已保存的图形
      info('图形已保存，ID: {}，类型: {}，共 {} 个已保存图形', shapeId, type, window._tmap_overlays.size);

      // 触发形状创建事件
      emit('shape-created', resultShape);
    }

    // 重置绘图状态，但保持工具激活状态以便继续绘制
    // 除非是圆形和矩形，它们已经在点击处理中重置了
    if (type !== 'circle' && type !== 'rectangle') {
      pointsArray.length = 0;
    }
    drawingShape = null;

    // 保持十字光标，表示可以继续绘制
    if (mapInstance.value && mapInstance.value.getContainer()) {
      mapInstance.value.getContainer().style.cursor = 'crosshair';
    }

    // 为用户提供绘图完成的反馈
    info('{} 绘制完成，可以继续绘制，或右键/双击/切换工具结束', type);
  };

  // 绑定绘图相关事件
  mapInstance.value.addEventListener('click', handleDrawingClick);
  mapInstance.value.addEventListener('mousemove', handleDrawingMouseMove);
  mapInstance.value.addEventListener('rightclick', handleDrawingRightClick);
  mapInstance.value.addEventListener('dblclick', handleDrawingDblClick);

  // 存储事件处理函数，用于后续移除
  (mapInstance.value as any).__drawingHandlers = {
    handleClick: handleDrawingClick,
    handleMouseMove: handleDrawingMouseMove,
    handleRightClick: handleDrawingRightClick,
    handleDblClick: handleDrawingDblClick
  };
};

// 停止绘制图形
const stopDrawing = () => {
  if (!mapInstance.value) return;

  // 重置当前工具
  currentTool.value = '';

  // 恢复鼠标样式
  setCursorStyle('default');

  // 移除绘图事件监听
  if ((mapInstance.value as any).__drawingHandlers) {
    const handlers = (mapInstance.value as any).__drawingHandlers;
    mapInstance.value.removeEventListener('click', handlers.handleClick);
    mapInstance.value.removeEventListener('mousemove', handlers.handleMouseMove);
    mapInstance.value.removeEventListener('rightclick', handlers.handleRightClick);
    mapInstance.value.removeEventListener('dblclick', handlers.handleDblClick);

    // 清除引用
    delete (mapInstance.value as any).__drawingHandlers;
  }
};

// 添加形状
const addShape = (shape: Shape): string | undefined => {
  if (!mapInstance.value) return;
  
  let shapeId: string | undefined;
  
  // 根据图形类型调用相应的添加方法
  switch (shape.type) {
    case 'polygon':
      // 确保path是有效的点数组
      if (Array.isArray(shape.path)) {
        // 处理嵌套数组情况
        const points = Array.isArray(shape.path[0]) && Array.isArray(shape.path[0][0]) 
          ? (shape.path as unknown as [number, number][][])[0] 
          : (shape.path as [number, number][]);
        shapeId = addPolygon(points, shape.style, shape.id);
      }
      break;
      
    case 'circle':
      // 确保有中心点和半径
      if (Array.isArray(shape.path) && shape.path.length > 0 && typeof shape.radius === 'number') {
        const center = shape.path[0] as [number, number];
        shapeId = addCircle(center, shape.radius, shape.style, shape.id);
      }
      break;
      
    case 'rectangle':
      // 矩形需要西南和东北角点
      if (Array.isArray(shape.path) && shape.path.length >= 2) {
        // 从path中获取bounds
        const bounds: [[number, number], [number, number]] = [
          shape.path[0] as [number, number],
          shape.path[2] as [number, number] // 对角点
        ];
        shapeId = addRectangle(bounds, shape.style, shape.id);
      }
      break;
      
    case 'polyline':
      // 折线需要至少两个点
      if (Array.isArray(shape.path) && shape.path.length >= 2) {
        shapeId = addPolyline(shape.path as [number, number][], shape.style, shape.id);
      }
      break;
  }
  
  if (shapeId) {
    // 确保触发shape-created事件
    emit('shape-created', { ...shape, id: shapeId });
    return shapeId;
  }
  
  console.warn('添加图形失败：图形数据不完整或类型不支持', shape);
  return undefined;
};

// 添加多边形
const addPolygon = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  const shapeId = id || `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 转换点坐标为T-Map格式
  const tPoints = points.map(point => new window.T.LngLat(point[0], point[1]));

  // 样式配置
  const styleOptions = {
    color: style?.strokeColor,
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity,
    fillColor: style?.fillColor,
    fillOpacity: style?.fillOpacity
  };

  // 创建多边形实例
  const polygon = new window.T.Polygon(tPoints, styleOptions);

  // 为图形添加ID标记，便于后续识别
  (polygon as any).__shapeId = shapeId;
  
  // 添加图形数据，用于右键菜单等功能
  (polygon as any).__shapeData = {
    id: shapeId,
    type: 'polygon',
    path: points,
    style: styleOptions,
    data: {}
  };

  // 使用统一的事件处理函数
  addShapeEventListeners(polygon, (polygon as any).__shapeData, 'polygon');

  // 添加到地图
  mapInstance.value.addOverLay(polygon);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, polygon);

  info('添加多边形成功，ID: {}，点数: {}', shapeId, points.length);

  return shapeId;
};

// 添加圆形
const addCircle = (center: [number, number], radius: number, style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  const shapeId = id || `circle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 转换中心点为T-Map格式
  const tCenter = new window.T.LngLat(center[0], center[1]);

  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9,
    fillColor: style?.fillColor || '#1890FF',
    fillOpacity: style?.fillOpacity || 0.5
  };

  // 创建圆形实例
  const circle = new window.T.Circle(tCenter, radius, styleOptions);

  // 为图形添加ID标记，便于后续识别
  (circle as any).__shapeId = shapeId;
  
  // 添加图形数据，用于右键菜单等功能
  (circle as any).__shapeData = {
    id: shapeId,
    type: 'circle',
    path: [center],
    radius: radius,
    style: styleOptions,
    data: {}
  };
  
  // 添加点击事件
  circle.addEventListener('click', (e: any) => {
    emit('shape-click', {
      shape: (circle as any).__shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: e
    });
  });
  
  // 添加右键菜单事件
  circle.addEventListener('rightclick', (e: any) => {
    info('图形右键菜单事件: {} (circle)', shapeId);
    
    // 构造完整的事件对象，确保包含所有必要的属性
    const eventObject = {
      shape: (circle as any).__shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: {
        // 添加originEvent属性，这是ScMap.vue中onShapeContextmenu方法所需要的
        originEvent: e.domEvent || e,
        clientX: e.domEvent ? e.domEvent.clientX : (e.clientX || 0),
        clientY: e.domEvent ? e.domEvent.clientY : (e.clientY || 0),
        // 确保preventDefault方法存在
        preventDefault: () => {
          if (e.domEvent && e.domEvent.preventDefault) {
            e.domEvent.preventDefault();
          }
        },
        stopPropagation: () => {
          if (e.domEvent && e.domEvent.stopPropagation) {
            e.domEvent.stopPropagation();
          }
        },
        // 添加target属性
        target: e.target || e.domEvent?.target || circle
      }
    };
    
    // 触发图形右键菜单事件
    emit('shape-contextmenu', eventObject);
    
    // 防止事件冒泡和默认行为
    const domEvent = e.domEvent || e;
    if (domEvent && domEvent.preventDefault) {
      domEvent.preventDefault();
    }
    if (domEvent && domEvent.stopPropagation) {
      domEvent.stopPropagation();
    }
  });

  // 添加到地图
  mapInstance.value.addOverLay(circle);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, circle);

  info('添加圆形成功，ID: {}，半径: {}', shapeId, radius);

  return shapeId;
};

// 添加矩形
const addRectangle = (bounds: [[number, number], [number, number]], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  const [sw, ne] = bounds;

  // 将西南-东北坐标转换为四个顶点坐标
  const path: [number, number][] = [
    [sw[0], sw[1]], // 西南
    [ne[0], sw[1]], // 东南
    [ne[0], ne[1]], // 东北
    [sw[0], ne[1]], // 西北
    [sw[0], sw[1]]  // 闭合多边形
  ];

  // 使用多边形方法创建矩形
  return addPolygon(path, style, id);
};

// 添加折线
const addPolyline = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value || !points || points.length < 2) return;

  const shapeId = id || `polyline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 转换点坐标为T-Map格式
  const tPoints = points.map(point => new window.T.LngLat(point[0], point[1]));

  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9
  };

  // 创建折线实例
  const polyline = new window.T.Polyline(tPoints, styleOptions);

  // 为图形添加ID标记，便于后续识别
  (polyline as any).__shapeId = shapeId;
  
  // 添加图形数据，用于右键菜单等功能
  (polyline as any).__shapeData = {
    id: shapeId,
    type: 'polyline',
    path: points,
    style: styleOptions,
    data: {}
  };
  
  // 添加点击事件
  polyline.addEventListener('click', (e: any) => {
    emit('shape-click', {
      shape: (polyline as any).__shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: e
    });
  });
  
  // 添加右键菜单事件
  polyline.addEventListener('rightclick', (e: any) => {
    info('图形右键菜单事件: {} (polyline)', shapeId);
    
    // 构造完整的事件对象，确保包含所有必要的属性
    const eventObject = {
      shape: (polyline as any).__shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: {
        // 添加originEvent属性，这是ScMap.vue中onShapeContextmenu方法所需要的
        originEvent: e.domEvent || e,
        clientX: e.domEvent ? e.domEvent.clientX : (e.clientX || 0),
        clientY: e.domEvent ? e.domEvent.clientY : (e.clientY || 0),
        // 确保preventDefault方法存在
        preventDefault: () => {
          if (e.domEvent && e.domEvent.preventDefault) {
            e.domEvent.preventDefault();
          }
        },
        stopPropagation: () => {
          if (e.domEvent && e.domEvent.stopPropagation) {
            e.domEvent.stopPropagation();
          }
        },
        // 添加target属性
        target: e.target || e.domEvent?.target || polyline
      }
    };
    
    // 触发图形右键菜单事件
    emit('shape-contextmenu', eventObject);
    
    // 防止事件冒泡和默认行为
    const domEvent = e.domEvent || e;
    if (domEvent && domEvent.preventDefault) {
      domEvent.preventDefault();
    }
    if (domEvent && domEvent.stopPropagation) {
      domEvent.stopPropagation();
    }
  });

  // 添加到地图
  mapInstance.value.addOverLay(polyline);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, polyline);

  info('添加折线成功，ID: {}，点数: {}', shapeId, points.length);

  return shapeId;
};

// 移除图形
const removeShape = (shapeId: string): boolean => {
  if (!window._tmap_overlays) return false;
  
  const shapeInstance = window._tmap_overlays.get(shapeId);
  if (shapeInstance) {
    try {
      mapInstance.value.removeOverLay(shapeInstance);
      window._tmap_overlays.delete(shapeId);
      emit('shape-deleted', shapeId);
      return true;
    } catch (error) {
      console.error('移除图形失败:', error, shapeId);
      return false;
    }
  }
  return false;
};

// 清除所有图形
const clearShapes = (excludeIds?: string[]) => {
  if (!mapInstance.value) return;

  // 如果_tmap_overlays不存在，则直接返回
  if (!window._tmap_overlays) {
    info('没有需要清除的图形');
    return;
  }

  const shapesToRemove: any[] = [];
  const overlays = window._tmap_overlays;

  // 收集需要移除的图形
  overlays.forEach((shape, id) => {
    // 如果提供了排除ID列表，检查当前图形ID是否需要保留
    if (excludeIds && excludeIds.includes(id)) {
      info('保留图形: {}', id);
      return; // 跳过此图形
    }

    shapesToRemove.push({ id, shape });
  });

  // 移除图形
  shapesToRemove.forEach(item => {
    try {
      // 从地图移除图形
      mapInstance.value.removeOverLay(item.shape);

      // 从_tmap_overlays中移除记录
      overlays.delete(item.id);

      info('已移除图形: {}', item.id);
    } catch (err) {
      console.error(`移除图形 ${item.id} 失败:`, err);
    }
  });

  info('清除完成，剩余图形数量: {}', overlays.size);
};

// 获取所有图形
const getShapes = () => {
  if (!window._tmap_overlays) return [];

  const shapes: Shape[] = [];

  window._tmap_overlays.forEach((overlay, id) => {
    // 由于T地图API限制，这里只能获取简化信息
    // 在实际应用中，可能需要更复杂的逻辑来获取完整的图形信息
    let type: ShapeType = 'polygon';
    let path: [number, number][] = [];

    if (overlay instanceof window.T.Circle) {
      type = 'circle';
      const center = overlay.getCenter();
      path = [[center.lng, center.lat]];
    } else if (overlay instanceof window.T.Polygon) {
      type = 'polygon';
    } else if (overlay instanceof window.T.Polyline) {
      type = 'polyline';
    }

    shapes.push({
      id,
      type,
      path
    });
  });

  return shapes;
};

// 监听属性变化
watch(() => props.center, (newCenter) => {
  // 验证newCenter坐标是否为[0,0]
  if (newCenter[0] === 0 && newCenter[1] === 0) {
    console.warn('TMap: 检测到尝试将center设置为[0,0]，这可能是错误值，忽略此次更新');
    return;
  }
  
  if (mapInstance.value) {
    setCenter(newCenter);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value) {
    setZoom(newZoom);
  }
});

// 定义一个本地响应式变量存储标记点数据
const localMarkers = ref([...props.markers]);

// 使用防抖函数处理标记点更新
const debouncedAddMarkers = debounce(() => {
  if (mapInstance.value) {
    addMarkers();
  }
}, 300);

// 只在关键属性变化时更新标记点
watch(() => props.markers, (newMarkers) => {
  // 将markers转换为简单对象以便于比较
  const simpleNewMarkers = newMarkers.map(marker => ({
    markerId: marker.markerId,
    position: marker.position,
    title: marker.title,
    icon: marker.icon,
    visible: marker.visible
  }));
  
  // 对比本地存储的markers是否有实质性变化
  const simpleLocalMarkers = localMarkers.value.map(marker => ({
    markerId: marker.markerId,
    position: marker.position,
    title: marker.title,
    icon: marker.icon,
    visible: marker.visible
  }));
  
  if (JSON.stringify(simpleNewMarkers) !== JSON.stringify(simpleLocalMarkers)) {
    localMarkers.value = [...newMarkers];
    debouncedAddMarkers();
  }
}, { deep: true });

// 为避免初始加载时重复渲染，单独监听地图实例
watch(mapInstance, (newInstance) => {
  if (newInstance && localMarkers.value.length > 0) {
    // 地图实例初始化后延迟添加标记点
    setTimeout(() => {
      addMarkers();
    }, 500);
  }
});

// 监听视图类型变化
watch(() => props.viewType, (newViewType) => {
  if (!mapInstance.value) return;
  info('TMap: 视图类型变更为 {}', newViewType);
  setMapViewType(newViewType);
});

// 设置地图视图类型
const setMapViewType = (viewType: MapViewType) => {
  if (!mapInstance.value) return;

  info('TMap: 设置地图视图类型 {}', viewType);

  try {
    // 根据视图类型设置地图类型
    // 天地图API使用数字常量来表示地图类型：
    // 0 - 普通地图
    // 1 - 卫星地图
    // 2 - 混合地图 (卫星+路网)
    switch (viewType) {
      case 'satellite':
        info('TMap: 切换到卫星图（类型值：1）');
        mapInstance.value.setMapType(1); // 使用数字常量1表示卫星图
        break;
      case 'hybrid':
        info('TMap: 切换到混合地图（类型值：2）');
        mapInstance.value.setMapType(2); // 使用数字常量2表示混合地图
        break;
      case 'normal':
      default:
        info('TMap: 切换到普通地图（类型值：0）');
        mapInstance.value.setMapType(0); // 使用数字常量0表示普通地图
        break;
    }
  } catch (error) {
    console.error('TMap: 设置地图类型失败', error);
  }
};

// 存储鼠标移动事件句柄的引用
const mouseMoveListenerRef = ref<((e: any) => void) | null>(null);

// 添加鼠标移动事件监听
const addMouseMoveListener = (callback: (e: any) => void) => {
  if (!mapInstance.value) return;

  // 先移除可能存在的监听器
  removeMouseMoveListener();

  // 添加鼠标移动事件监听
  const mouseMoveHandler = (e: any) => {
    if (callback && e.lnglat) {
      // 获取经纬度
      const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
      const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);

      callback({
        lat: latValue,
        lng: lngValue,
        lnglat: [lngValue, latValue]
      });
    }
  };

  // 存储事件句柄用于后续移除
  mouseMoveListenerRef.value = mouseMoveHandler;
  mapInstance.value.addEventListener('mousemove', mouseMoveHandler);

  info('添加天地图鼠标移动监听器');
};

// 移除鼠标移动事件监听
const removeMouseMoveListener = () => {
  if (!mapInstance.value || !mouseMoveListenerRef.value) return;

  // 移除鼠标移动事件监听
  mapInstance.value.removeEventListener('mousemove', mouseMoveListenerRef.value);
  mouseMoveListenerRef.value = null;

  info('移除天地图鼠标移动监听器');
};

// 设置鼠标样式
const setCursorStyle = (style: string) => {
  if (!mapInstance.value) return;

  try {
    const container = mapInstance.value.getContainer();
    if (container) {
      container.style.cursor = style;
    }
  } catch (err) {
    console.error('设置鼠标样式失败:', err);
  }
};

// 启用添加标记
const enableAddMarker = () => {
  if (!mapInstance.value) return;

  // 禁用其他工具
  stopDrawing();
  stopMeasure();

  // 记录当前工具
  currentTool.value = 'marker' as ToolType;

  // 设置为启用添加标记模式
  addMarkerEnabled.value = true;

  // 设置鼠标样式为十字形
  setCursorStyle('crosshair');

  // 添加点击事件监听
  mapInstance.value.addEventListener('click', handleMapClickForMarker);
};

// 禁用添加标记
const disableAddMarker = () => {
  if (!mapInstance.value) return;

  // 恢复鼠标光标
  setCursorStyle('default');
  
  // 移除地图点击事件
  mapInstance.value.removeEventListener('click', handleMapClickForMarker);

  // 重置当前工具
  if (currentTool.value === 'marker') {
    currentTool.value = '';
  }

  // 标记为不启用添加标记模式
  addMarkerEnabled.value = false;

  info('TMap已禁用添加标记模式');
};

// 处理地图点击添加标记
const handleMapClickForMarker = (e: any) => {
  // 确保当前工具为marker且启用了添加标记模式
  if (currentTool.value !== 'marker' || !addMarkerEnabled.value) return;

  info('TMap点击添加标记 {}', e);

  try {
    // 获取点击位置
    const lngValue = typeof e.lnglat.lng === 'function' ? e.lnglat.lng() : Number(e.lnglat.lng);
    const latValue = typeof e.lnglat.lat === 'function' ? e.lnglat.lat() : Number(e.lnglat.lat);

    // 创建一个基础标记
    const newMarker: Marker = {
      markerId: `marker_${Date.now()}`,
      position: [lngValue, latValue],
      title: '新标记点',
      label: '新标记点',
      clusterable: true,
      data: {
        id: `marker_${Date.now()}`,
        createTime: new Date().toISOString()
      }
    };

    // 触发标记创建事件
    emit('marker-created', newMarker);

    info('TMap标记创建成功 {}', newMarker);
  } catch (error) {
    console.error('TMap创建标记失败:', error);
  }
};

// 添加类型定义并修复集群相关代码
// 在startDrawing方法上方添加接口定义
// 定义集群组接口
interface ClusterGroup {
  center: [number, number] | number[];
  markers: any[];
  marker?: any; // 聚合标记实例
}

// 定义集群标记接口
interface ClusterMarker {
  marker: any;
  count: number;
}

// 启用标记点聚合
const enableCluster = (options: ClusterOptions) => {
  if (!mapInstance.value) return;

  // 先禁用聚合
  disableCluster();

  // 过滤出允许聚合的标记点
  const clusterableMarkers = markersInstances.value.filter((markerInstance, index) => {
    const markerData = (markerInstance as any).__markerData;
    return markerData?.clusterable !== false;
  });

  // 如果没有可聚合的标记点，或者没有启用聚合，则直接返回
  if (clusterableMarkers.length === 0 || !options.enable) {
    info('聚合条件不满足，跳过聚合 {}', clusterableMarkers.length, options.enable);
    return;
  }

  try {
    info('开始天地图标记点聚合: {}个标记点，配置: {}', clusterableMarkers.length, options);

    // 自定义实现简单的聚合逻辑
    // 1. 先按照距离将标记点分组
    const gridSize = options.gridSize || 60; // 默认网格大小60像素
    const maxZoom = options.maxZoom || 18;   // 默认最大缩放级别18
    const minClusterSize = options.minClusterSize || 2; // 最小聚合数量

    // 如果当前缩放级别大于最大聚合缩放级别，则不执行聚合
    const currentZoom = mapInstance.value.getZoom();
    if (currentZoom >= maxZoom) {
      info('当前缩放级别({})已超过最大聚合级别({})，不执行聚合', currentZoom, maxZoom);
      // 显示所有原始标记点
      clusterableMarkers.forEach(marker => {
        if (!(marker as any).getMap()) {
          mapInstance.value.addOverLay(marker);
        }
      });
      return;
    }

    // 隐藏所有原始标记点
    clusterableMarkers.forEach(marker => {
      try {
        mapInstance.value.removeOverLay(marker);
      } catch (err) {
        console.warn('移除标记点失败，可能已被移除', err);
      }
    });

    // 2. 根据像素距离进行聚合分组
    const clusters: ClusterGroup[] = [];
    const markersMap = new Map(); // 用于记录标记点所属的聚合组

    // 清除之前的聚合点
    if (clusterManager.value && clusterManager.value.clusters) {
      clusterManager.value.clusters.forEach((cluster: ClusterGroup) => {
        if (cluster.marker) {
          try {
            mapInstance.value.removeOverLay(cluster.marker);
          } catch (err) {
            console.warn('移除聚合标记失败，可能已被移除', err);
          }
        }
      });
    }

    clusterableMarkers.forEach(marker => {
      try {
        const pos = marker.getLngLat();
        let foundCluster = false;

        // 检查是否可以加入现有聚合组
        for (let i = 0; i < clusters.length; i++) {
          const cluster = clusters[i];
          const clusterCenter = new window.T.LngLat(cluster.center[0], cluster.center[1]);
          const point1 = mapInstance.value.lngLatToContainerPoint(clusterCenter);
          const point2 = mapInstance.value.lngLatToContainerPoint(pos);

          // 计算两点在屏幕上的像素距离
          const dx = point1.x - point2.x;
          const dy = point1.y - point2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= gridSize) {
            // 将标记点加入此聚合组
            cluster.markers.push(marker);
            // 更新聚合中心点（简单平均）
            const sumLng = cluster.center[0] * (cluster.markers.length - 1) + pos.lng;
            const sumLat = cluster.center[1] * (cluster.markers.length - 1) + pos.lat;
            cluster.center = [sumLng / cluster.markers.length, sumLat / cluster.markers.length];
            // 记录标记点所属的聚合组
            markersMap.set(marker, i);
            foundCluster = true;
            break;
          }
        }

        // 如果没有合适的聚合组，创建新的聚合组
        if (!foundCluster) {
          const newCluster = {
            center: [pos.lng, pos.lat],
            markers: [marker]
          };
          markersMap.set(marker, clusters.length);
          clusters.push(newCluster);
        }
      } catch (err) {
        console.error('聚合处理标记点时出错', err);
      }
    });

    // 3. 创建聚合标记点
    const clusterMarkers: ClusterMarker[] = [];

    clusters.forEach(cluster => {
      try {
        // 如果聚合组内标记点数量小于最小聚合数量，则显示原始标记点
        if (cluster.markers.length < minClusterSize) {
          cluster.markers.forEach(marker => {
            try {
              mapInstance.value.addOverLay(marker);
            } catch (err) {
              console.warn('添加原始标记点失败', err);
            }
          });
          return;
        }

        // 创建聚合标记点
        const clusterCenter = new window.T.LngLat(cluster.center[0], cluster.center[1]);

        // 计算聚合图标大小和颜色
        // 根据聚合内标记点数量确定样式
        let iconSize = 40; // 默认图标大小
        let bgColor = '#1890FF'; // 默认背景色
        let textColor = '#FFFFFF'; // 默认文字颜色

        // 根据聚合大小选择样式
        if (options.styles && options.styles.length > 0) {
          let styleIndex = 0;
          const count = cluster.markers.length;

          if (count < 10) styleIndex = 0;
          else if (count < 50) styleIndex = Math.min(1, options.styles.length - 1);
          else if (count < 100) styleIndex = Math.min(2, options.styles.length - 1);
          else styleIndex = Math.min(3, options.styles.length - 1);

          const style = options.styles[styleIndex];

          if (style) {
            iconSize = style.size || iconSize;
            bgColor = style.backgroundColor || bgColor;
            textColor = style.textColor || textColor;
          }
        }

        // 创建自定义HTML内容作为聚合图标
        const clusterDiv = document.createElement('div');
        clusterDiv.style.width = `${iconSize}px`;
        clusterDiv.style.height = `${iconSize}px`;
        clusterDiv.style.lineHeight = `${iconSize}px`;
        clusterDiv.style.textAlign = 'center';
        clusterDiv.style.borderRadius = '50%';
        clusterDiv.style.backgroundColor = bgColor;
        clusterDiv.style.color = textColor;
        clusterDiv.style.fontWeight = 'bold';
        clusterDiv.style.fontSize = '14px';
        clusterDiv.style.display = 'flex';
        clusterDiv.style.justifyContent = 'center';
        clusterDiv.style.alignItems = 'center';
        clusterDiv.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        clusterDiv.innerHTML = cluster.markers.length.toString();

        // 创建聚合标记
        const clusterMarker = new window.T.Marker(clusterCenter, {
          icon: null  // 不使用默认图标
        });

        // 设置自定义内容
        if (clusterMarker && typeof clusterMarker.setContent === 'function') {
        clusterMarker.setContent(clusterDiv);
        } else {
          console.warn('无法设置聚合标记内容: setContent方法不可用');
        }

        // 将聚合标记保存到聚合组中
        cluster.marker = clusterMarker;

        // 为聚合标记添加悬停事件，检查聚合内是否有标记启用了悬停弹窗
        const hasHoverMarkers = cluster.markers.some(m => {
          const markerData = (m as any).__markerData;
          return markerData && markerData.hoverPopover;
        });

        // 为聚合标记添加点击事件，检查聚合内是否有标记启用了点击弹窗
        const hasClickMarkers = cluster.markers.some(m => {
          const markerData = (m as any).__markerData;
          return markerData && markerData.clickPopover;
        });

        // 为聚合标记添加自定义数据，用于悬停弹窗
        const clusterData = {
          isCluster: true,
          count: cluster.markers.length,
          position: [cluster.center[0], cluster.center[1]],
          title: `包含 ${cluster.markers.length} 个标记`,
          markers: cluster.markers.map(m => (m as any).__markerData).filter(Boolean),
          // 默认启用相同的弹窗功能
          clickPopover: hasClickMarkers,
          clickPopoverTemplate: '<div class="cluster-popover"><h3>聚合点</h3><p>包含 ${marker.count} 个标记点</p><p>点击查看详情</p></div>'
        };

        (clusterMarker as any).__markerData = clusterData;

        // 绑定点击事件
        clusterMarker.addEventListener('click', (event: MouseEvent) => {
          // 如果聚合组内有启用点击弹窗的标记，则为聚合标记也添加点击弹窗
          if (hasClickMarkers) {
            showPopover(clusterMarker, event, true);
          }

          // 计算聚合内的标记点边界
          let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

          cluster.markers.forEach(marker => {
            try {
              const pos = marker.getLngLat();
              minLng = Math.min(minLng, pos.lng);
              maxLng = Math.max(maxLng, pos.lng);
              minLat = Math.min(minLat, pos.lat);
              maxLat = Math.max(maxLat, pos.lat);
            } catch (err) {
              console.warn('获取标记位置失败', err);
            }
          });

          // 如果聚合范围太小，进行适当放大
          const deltaLng = maxLng - minLng;
          const deltaLat = maxLat - minLat;

          if (deltaLng < 0.01) {
            minLng -= 0.005;
            maxLng += 0.005;
          }

          if (deltaLat < 0.01) {
            minLat -= 0.005;
            maxLat += 0.005;
          }

          try {
            // 设置地图视野以包含所有聚合内的标记点
            const southWest = new window.T.LngLat(minLng, minLat);
            const northEast = new window.T.LngLat(maxLng, maxLat);
            const bounds = new window.T.LngLatBounds(southWest, northEast);

            // 缩放地图到合适的级别以显示所有标记点
            mapInstance.value.fitBounds(bounds);
          } catch (err) {
            console.error('设置地图边界失败', err);
          }

          // 触发聚合点击事件
          const markerDataList = cluster.markers.map(m => (m as any).__markerData).filter(Boolean);
          const clusterClickEvent = {
            position: [cluster.center[0], cluster.center[1]],
            count: cluster.markers.length,
            markers: markerDataList,
            originalEvent: null
          };

          emit('cluster-click', clusterClickEvent);
        });

        // 保存生成的聚合标记实例
        clusterMarkers.push({
          marker: clusterMarker,
          count: cluster.markers.length
        });

        // 添加到地图
        mapInstance.value.addOverLay(clusterMarker);
      } catch (err) {
        console.error('创建聚合标记失败', err);
      }
    });

    // 保存聚合状态
    clusterManager.value = {
      markers: clusterableMarkers,
      clusters: clusters,
      options: options,
      markersMap: markersMap
    };

    info('天地图标记点聚合已启用，共创建 {} 个聚合组', clusterMarkers.length);
  } catch (error) {
    console.error('启用天地图标记点聚合失败', error);
    // 出错时，确保所有原始标记点可见
    clusterableMarkers.forEach(marker => {
      try {
        if (!(marker as any).getMap()) {
          mapInstance.value.addOverLay(marker);
        }
      } catch (err) {
        console.warn('添加标记失败', err);
      }
    });
  }
};

// 禁用标记点聚合
const disableCluster = () => {
  if (clusterManager.value) {
    try {
      info('禁用天地图标记点聚合');

      // 清除所有聚合标记
      if (clusterManager.value.clusters) {
        clusterManager.value.clusters.forEach((cluster: ClusterGroup) => {
          if (cluster.marker) {
            try {
              mapInstance.value.removeOverLay(cluster.marker);
            } catch (err) {
              console.warn('移除聚合标记失败', err);
            }
          }
        });
      }

      // 确保所有原始标记点可见
      if (clusterManager.value.markers) {
        clusterManager.value.markers.forEach(marker => {
          try {
            if (!(marker as any).getMap()) {
              mapInstance.value.addOverLay(marker);
            }
          } catch (err) {
            console.warn('添加标记失败', err);
          }
        });
      }

      // 清除聚合管理器
      clusterManager.value = null;
    } catch (error) {
      console.error('禁用天地图标记点聚合失败', error);
    }
  }
};

// 添加监听缩放级别变化，重新应用聚合
watch(() => mapInstance.value?.getZoom(), (newZoom) => {
  if (props.clusterOptions?.enable && clusterManager.value) {
    info('缩放级别变化: {}', newZoom, '重新应用聚合');
    enableCluster(props.clusterOptions);
  }
});

// 在ref变量声明区域添加一个控制是否显示标签的变量
const shouldShowLabels = ref(true);

/**
 * 切换标记标签的显示与隐藏
 * @param show 是否显示标签
 */
const toggleMarkerLabels = (show: boolean) => {
  info('TMap组件: 切换标记标签显示状态为 {}', show ? '显示' : '隐藏');
  if (!mapInstance.value) return;

  // 更新标签显示状态控制变量
  shouldShowLabels.value = show;

  markersInstances.value.forEach(marker => {
    const markerData = (marker as any).__markerData;
    if (!markerData) return;

    // 先删除现有标签（如果有）
    const existingLabel = (marker as any).__labelInstance;
    if (existingLabel) {
      mapInstance.value.removeOverLay(existingLabel);
      (marker as any).__labelInstance = null;
    }

    // 如果需要显示标签，则创建新标签
    if (show) {
      try {
        const position = marker.getLngLat();
        // 使用 label 字段，如果不存在则使用 title 字段
        const labelText = markerData.label || markerData.title || '';

        // 如果没有文本可显示，则跳过
        if (!labelText) return;

        // 获取标记点尺寸信息，用于计算偏移
        let markerHeight = 25; // 默认标记点高度
        if (markerData.size && markerData.size[1]) {
          markerHeight = markerData.size[1];
        }

        // 创建标签，设置偏移量
        // 水平偏移为-50（向左偏移50px），垂直偏移为-markerHeight（标记点的高度）再减去5像素的额外间隙
        const verticalOffset = -(markerHeight + 5);
        const horizontalOffset = -50; // 向左偏移50px

        const label = new window.T.Label({
          text: labelText,
          position: position,
          offset: new window.T.Point(horizontalOffset, verticalOffset) // 左偏移50px，垂直向上偏移
        });

        // 添加到地图前尝试设置样式
        try {
          // 在nextTick中设置样式，确保DOM已经创建
          nextTick(() => {
            try {
              // 为新添加的标签添加样式
              const labels = document.querySelectorAll('.T_label');
              if (labels && labels.length > 0) {
                // 查找最后一个添加的标签
                const labelElement = labels[labels.length - 1];
                if (labelElement) {
                  // 添加自定义类名
                  labelElement.classList.add('sc-map-marker-label');

                  // 直接设置样式，使用类型断言
                  const stylableElement = labelElement as HTMLElement;
                  stylableElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  stylableElement.style.padding = '2px 5px';
                  stylableElement.style.borderRadius = '2px';
                  stylableElement.style.fontSize = '12px';
                  stylableElement.style.textAlign = 'center';
                  stylableElement.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
                  stylableElement.style.whiteSpace = 'nowrap';
                }
              }
            } catch (styleError) {
              console.warn('设置标签样式失败:', styleError);
            }
          });
        } catch (styleError) {
          console.warn('获取标签DOM对象失败:', styleError);
        }

        // 添加到地图
        mapInstance.value.addOverLay(label);
        (marker as any).__labelInstance = label;
        info('添加标签: {}，左偏移: {}px', labelText, horizontalOffset);
      } catch (err) {
        console.error('创建标记标签时出错:', err);
      }
    }
  });
};

/**
 * 获取地图可视范围内的标记点
 * @returns 返回当前可视范围内的标记点数组
 */
const getVisibleMarkers = () => {
  if (!mapInstance.value) {
    return [];
  }

  try {
    // 获取地图当前可视边界
    const bounds = getVisibleBounds();
    if (!bounds || bounds.length !== 4) {
      return [];
    }

    // 提取边界坐标
    const [northWest, northEast, southEast, southWest] = bounds;

    // 获取边界经纬度范围
    const minLng = Math.min(northWest[0], southWest[0]);
    const maxLng = Math.max(northEast[0], southEast[0]);
    const minLat = Math.min(southWest[1], southEast[1]);
    const maxLat = Math.max(northWest[1], northEast[1]);

    // 获取所有标记的数据
    const allMarkers = markersInstances.value.map(marker => {
      return marker.__markerData;
    }).filter(Boolean);

    // 过滤出在可视范围内的标记点
    return allMarkers.filter(marker => {
      const [lng, lat] = marker.position;
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    });
  } catch (error) {
    console.error('获取可视范围内标记点失败:', error);
    return [];
  }
};

// 获取地图当前可视区域的四个角坐标
const getVisibleBounds = () => {
  if (!mapInstance.value) {
    return null;
  }

  try {
    const bounds = mapInstance.value.getBounds();
    if (!bounds) return null;

    // 天地图的getBounds返回的是LatLngBounds对象
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // 组合经纬度获取西北角和东南角
    const nw: [number, number] = [sw.lng, ne.lat];
    const se: [number, number] = [ne.lng, sw.lat];

    return [
      nw,                        // 西北
      [ne.lng, ne.lat],          // 东北
      se,                        // 东南
      [sw.lng, sw.lat]           // 西南
    ];
  } catch (error) {
    console.error('获取地图可视区域边界失败', error);
    return null;
  }
};

// 处理标记鼠标进入事件
const onMarkerMouseenter = (marker: Marker) => {
  // 为标记添加视觉反馈
  if (!marker.markerId) return;

  // 查找标记实例
  const markerInstance = markersInstances.value.find((m: any) => {
    const markerData = m.__markerData;
    return markerData && (markerData.markerId === marker.markerId ||
      (markerData.data && markerData.data.id === marker.markerId));
  });

  if (markerInstance) {
    try {
      // 天地图特有的悬停效果
      const el = markerInstance.getElement();
      if (el) {
        el.style.zIndex = '999'; // 提升悬停标记的层级
        el.style.transform = 'scale(1.2)';
        el.style.transition = 'transform 0.2s ease';
      }
    } catch (error) {
      console.warn('为标记添加悬停效果失败', error);
    }
  }
};

// 处理标记鼠标离开事件
const onMarkerMouseleave = (marker: Marker) => {
  // 恢复标记的原始样式
  if (!marker.markerId) return;

  // 查找标记实例
  const markerInstance = markersInstances.value.find((m: any) => {
    const markerData = m.__markerData;
    return markerData && (markerData.markerId === marker.markerId ||
      (markerData.data && markerData.data.id === marker.markerId));
  });

  if (markerInstance) {
    try {
      // 天地图特有的样式恢复
      const el = markerInstance.getElement();
      if (el) {
        el.style.zIndex = '';
        el.style.transform = '';
      }
    } catch (error) {
      console.warn('恢复标记原始样式失败', error);
    }
  }
};

// 开始测距
const startMeasureDistance = () => {
  startMeasure();
};

// 停止测距
const stopMeasureDistance = () => {
  stopMeasure();
};

// 清除距离测量结果
const clearDistance = () => {
  if (distanceResult.value) {
    distanceResult.value = null;
  }
  // 如果有测距线，清除它
  if (distanceComponents.value) {
    try {
      mapInstance.value.removeOverLay(distanceComponents.value);
      distanceComponents.value = null;
    } catch (error) {
      console.error('清除测距组件失败', error);
    }
  }
};

// 轨迹动画相关全局类型
interface AnimationState {
  startTime: number | null;
  lastFrameTime: number | null;
  totalDistance: number;
  elapsedDistance: number;
  finished: boolean;
  loopCount: number;
  requestId: number;
  paused: boolean;
  pausedTime: number;
  pauseStartTime: number;
  segments: {start: [number, number], end: [number, number], distance: number}[];
}

interface TrackAnimation {
  polyline: any;
  passedPolyline: any;
  marker: any;
  passedPath: any[];
  currentIndex: number;
  paused: boolean;
  options: any;
  state: AnimationState;
}


// 轨迹动画相关方法
const startTrackAnimation = (points: [number, number][], options: any = {}) => {
  if (!mapInstance.value) {
    console.error('地图实例未初始化');
    return null;
  }

  info('开始天地图轨迹动画播放，点数: {}', points.length);

  try {
    // 停止已有的动画
    stopTrackAnimation();

    // 验证点数组
    if (!points || points.length < 2) {
      console.error('轨迹点数量不足');
      return null;
    }

    // 为了更平滑的动画体验，增加中间插值点
    let enhancedPoints: [number, number][] = [];
    let enhancedSegments: { start: [number, number], end: [number, number], distance: number }[] = [];
    let totalDistance = 0;

    // 简化插值逻辑，确保轨迹线和经过线使用相同的点集
    // 直接使用原始点作为基础，避免生成过多额外的点导致偏差
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      // 添加起始点
      enhancedPoints.push(start);

      // 计算两点之间的直线距离（米）
      const lngLat1 = new window.T.LngLat(start[0], start[1]);
      const lngLat2 = new window.T.LngLat(end[0], end[1]);
      const segmentDistance = lngLat1.distanceTo(lngLat2);

      // 仅当距离非常远时添加少量必要的插值点
      if (segmentDistance > 1000) { // 增加阈值到1000米，减少不必要的插值点
        const interpolationCount = Math.min(
          Math.max(1, Math.floor(segmentDistance / 500)), // 每500米一个点，最多3个
          3
        );

        for (let j = 1; j < interpolationCount; j++) {
          const ratio = j / interpolationCount;
          const interpolatedPoint: [number, number] = [
            start[0] + (end[0] - start[0]) * ratio,
            start[1] + (end[1] - start[1]) * ratio
          ];
          enhancedPoints.push(interpolatedPoint);
        }
      }
    }

    // 添加终点
    enhancedPoints.push(points[points.length - 1]);

    // 基于增强的点阵重新计算路径段
    for (let i = 0; i < enhancedPoints.length - 1; i++) {
      const start = enhancedPoints[i];
      const end = enhancedPoints[i + 1];

      const lngLat1 = new window.T.LngLat(start[0], start[1]);
      const lngLat2 = new window.T.LngLat(end[0], end[1]);
      const distance = lngLat1.distanceTo(lngLat2);

      enhancedSegments.push({
        start,
        end,
        distance
      });

      totalDistance += distance;
    }

    // 保存动画状态，用于控制动画进行
    const animationState: AnimationState = {
      startTime: null,
      lastFrameTime: null,
      totalDistance,
      elapsedDistance: 0,
      finished: false,
      loopCount: 1, // 新增循环次数属性
      requestId: 0,
      paused: false,
      pausedTime: 0,
      pauseStartTime: 0,
      segments: enhancedSegments
    };

    // 转换点坐标为T-Map格式 - 使用相同的点集
    const tPoints = enhancedPoints.map(point => new window.T.LngLat(point[0], point[1]));

    // 使用更高性能的绘制方式
    const polylineOptions = {
      color: options.lineColor || '#3366FF',
      weight: options.lineWidth || 4,
      opacity: options.lineOpacity || 0.8
    };

    const passedPolylineOptions = {
      color: options?.passedLineColor || '#FFCC00', // 默认黄色
      weight: options?.lineWidth || 4,
      opacity: options?.lineOpacity || 0.8,
      zIndex: 20
    };

    // 创建轨迹线 - 使用相同点集避免不重合
    const polyline = new window.T.Polyline(tPoints, polylineOptions);
    mapInstance.value.addOverLay(polyline);

    // 创建已走过的轨迹线 - 初始只有起点
    const passedPolyline = new window.T.Polyline([tPoints[0]], passedPolylineOptions);
    mapInstance.value.addOverLay(passedPolyline);

    // 创建移动的标记点 - 确保初始位置精确在轨迹线上
    let marker = null;

    // 如果提供了图标URL，则使用自定义图标
    if (options.icon) {
      const iconSize = options.iconSize || [25, 34];
      const markerIcon = new window.T.Icon({
        iconUrl: options.icon,
        iconSize: new window.T.Point(iconSize[0], iconSize[1]),
        iconAnchor: new window.T.Point(iconSize[0] / 2, iconSize[1])
      });

      marker = new window.T.Marker(tPoints[0], {
        icon: markerIcon
      });
    } else {
      // 创建默认标记
      marker = new window.T.Marker(tPoints[0]);
    }

    mapInstance.value.addOverLay(marker);

    // 如果需要自动调整视图以适应路径
    if (options.autoFit) {
      try {
        // 天地图不支持直接的fitBounds方法，手动计算适合的视图
        if (tPoints.length > 0) {
          // 获取所有点的经纬度范围
          let minLat = tPoints[0].lat, maxLat = tPoints[0].lat;
          let minLng = tPoints[0].lng, maxLng = tPoints[0].lng;
          
          tPoints.forEach(point => {
            const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
            const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
            
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
          
          // 计算中心点
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const center = new window.T.LngLat(centerLng, centerLat);
          
          // 设置地图中心
          mapInstance.value.panTo(center);
          
          // 计算合适的缩放级别
          // 通常需要考虑经纬度跨度和地图容器大小
          // 这是一个简化的算法，实际应用可能需要更复杂的逻辑
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          const maxDiff = Math.max(latDiff, lngDiff);
          
          // 根据经纬度跨度估算缩放级别
          // 不同地图API的缩放级别计算方式可能不同
          // 以下是一个粗略估计
          let zoomLevel = 12; // 默认值
          
          if (maxDiff > 10) zoomLevel = 3;
          else if (maxDiff > 5) zoomLevel = 5;
          else if (maxDiff > 2) zoomLevel = 7;
          else if (maxDiff > 1) zoomLevel = 9;
          else if (maxDiff > 0.5) zoomLevel = 10;
          else if (maxDiff > 0.2) zoomLevel = 11;
          else if (maxDiff > 0.1) zoomLevel = 12;
          else if (maxDiff > 0.05) zoomLevel = 13;
          else if (maxDiff > 0.02) zoomLevel = 14;
          else if (maxDiff > 0.01) zoomLevel = 15;
          else if (maxDiff > 0.005) zoomLevel = 16;
          else zoomLevel = 17;
          
          // 设置缩放级别
          mapInstance.value.setZoom(zoomLevel);
          
          info('已自动调整视图以适应路径，中心点: {}, {}, 缩放级别: {}', centerLng, centerLat, zoomLevel);
        }
      } catch (error) {
        console.error('自动调整视图失败:', error);
      }
    }

    // 创建平滑轨迹动画的缓存数组
    const passedPathCache: any[] = [tPoints[0]];

    // 保存轨迹动画相关对象
    window._tmap_track_animation = {
      polyline,
      passedPolyline,
      marker,
      passedPath: passedPathCache,
      currentIndex: 0,
      paused: false,
      options,
      state: animationState,
      tPoints // 保存所有的天地图坐标点，用于更新
    } as any;

    // 动画配置
    const duration = options.duration || 5000; // 默认5秒
    const maxLoopCount = options.loopCount === Infinity || options.loopCount === 0 ? Infinity : (options.loopCount || 1);

    // 使用高性能动画帧函数
    const animate = (timestamp: number) => {
      const animation = window._tmap_track_animation as any;
      if (!animation || animation.paused) {
        return;
      }

      const state = animation.state as any;

      // 初始化开始时间
      if (!state.startTime) {
        state.startTime = timestamp;
        state.lastFrameTime = timestamp;
        state.requestId = requestAnimationFrame(animate);

        // 调用开始回调
        if (options.onStart) {
          options.onStart();
        }
        return;
      }

      // 计算动画进度 - 使用高精度时间
      const elapsedTime = timestamp - (state.startTime || 0) - state.pausedTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // 应用缓动函数使动画更平滑
      // 使用缓入缓出效果让起始和结束更自然，但保持中间过程线性平滑
      const easedProgress = progress < 0.1
        ? progress * 10 * progress / 2
        : progress > 0.9
          ? 0.9 + (progress - 0.9) * (1 - (1 - (progress - 0.9) * 10) / 2)
          : progress;

      // 计算当前应该走过的距离
      const targetDistance = state.totalDistance * easedProgress;

      // 如果动画完成一次循环
      if (progress >= 1) {
        // 检查是否达到循环次数上限
        if (maxLoopCount !== Infinity && state.loopCount >= maxLoopCount) {
          // 达到上限，结束动画
          // 确保标记在终点
          if (animation.marker) {
            // 获取准确的终点坐标（最后一个轨迹点）
            const finalPoint = animation.tPoints[animation.tPoints.length - 1];
            // 使用setPosition将标记移动到准确的终点位置
            animation.marker.setPosition(finalPoint);
            
            // 记录日志
            info('轨迹动画完成，已将标记移动到终点位置: {}, {}', 
              typeof finalPoint.lng === 'function' ? finalPoint.lng() : finalPoint.lng,
              typeof finalPoint.lat === 'function' ? finalPoint.lat() : finalPoint.lat
            );
          }

          // 绘制完整的已走过路径 - 使用完整的tPoints数组
          try {
            // 完全重建折线，确保100%重合
            if (mapInstance.value && animation.passedPolyline) {
              // 从地图中移除旧的经过线
              mapInstance.value.removeOverLay(animation.passedPolyline);
              
              // 创建新的经过线，使用完整的点集
              const newPassedLine = new window.T.Polyline(animation.tPoints, {
                color: options?.passedLineColor || '#FFCC00',
                weight: options?.lineWidth || 4,
                opacity: options?.lineOpacity || 0.8,
                zIndex: 20
              });
              
              // 添加到地图
              mapInstance.value.addOverLay(newPassedLine);
              
              // 更新引用
              animation.passedPolyline = newPassedLine;
            }
          } catch (error) {
            console.error('更新终点路径失败:', error);
          }

          // 标记为完成
          state.finished = true;

          // 调用完成回调
          if (options.onComplete) {
            options.onComplete();
          }

          // 停止动画
          cancelAnimationFrame(state.requestId);
          return;
        } else {
          state.loopCount++; // 递增循环次数
          // 重置动画进行下一次循环
          state.startTime = timestamp;
          state.pausedTime = 0;
          
          // 重置路径状态
          animation.passedPath.length = 0;
          animation.passedPath.push(tPoints[0]);
          
          // 重置经过线为起点
          try {
            // 完全重建折线，确保点位准确
            if (mapInstance.value && animation.passedPolyline) {
              // 从地图中移除旧的经过线
              mapInstance.value.removeOverLay(animation.passedPolyline);
              
              // 创建新的经过线，只包含起点
              const newPassedLine = new window.T.Polyline([tPoints[0]], {
                color: options?.passedLineColor || '#FFCC00',
                weight: options?.lineWidth || 4,
                opacity: options?.lineOpacity || 0.8,
                zIndex: 20
              });
              
              // 添加到地图
              mapInstance.value.addOverLay(newPassedLine);
              
              // 更新引用
              animation.passedPolyline = newPassedLine;
              animation.passedPath = [tPoints[0]];
            }
          } catch (error) {
            console.error('重置路径状态失败:', error);
          }

          info('轨迹动画完成一次循环，开始下一次循环，当前循环次数: {}', state.loopCount);
          
          // 调用循环回调
          if (options.onLoop) {
            options.onLoop(state.loopCount);
          }
        }
      }
      
      // 计算当前位置
      let accumulatedDistance = 0;
      let currentSegmentIndex = 0;
      let segmentProgress = 0;

      // 找到当前所在路径段
      for (let i = 0; i < state.segments.length; i++) {
        const segment = state.segments[i];

        if (accumulatedDistance + segment.distance >= targetDistance) {
          // 找到当前段
          currentSegmentIndex = i;

          // 计算在当前段内的进度
          segmentProgress = (targetDistance - accumulatedDistance) / segment.distance;
          break;
        }

        accumulatedDistance += segment.distance;
      }

      // 计算当前精确位置（线性插值）
      const currentSegment = state.segments[currentSegmentIndex];
      const currentPosition: [number, number] = [
        currentSegment.start[0] + (currentSegment.end[0] - currentSegment.start[0]) * segmentProgress,
        currentSegment.start[1] + (currentSegment.end[1] - currentSegment.start[1]) * segmentProgress
      ];

      // 确保当前点位准确地在轨迹线段上
      // 使用线性插值保证点位精确在线段上，无需额外校正
      const lngLat = new window.T.LngLat(currentPosition[0], currentPosition[1]);
      
      // 更新标记位置 - 使用天地图的原生对象
      if (animation.marker) {
        // 修复：使用正确的方法设置标记位置
        if (typeof animation.marker.setLngLat === 'function') {
          animation.marker.setLngLat(lngLat);
        } else if (typeof animation.marker.setPosition === 'function') {
          animation.marker.setPosition(lngLat);
        } else if (animation.marker.setLatLng) {
          animation.marker.setLatLng(lngLat);
        } else {
          // 如果以上方法都不存在，尝试重新创建标记
          try {
            if (mapInstance.value) {
              mapInstance.value.removeOverLay(animation.marker);
              const newMarker = new window.T.Marker(lngLat);
              mapInstance.value.addOverLay(newMarker);
              animation.marker = newMarker;
            }
          } catch (error) {
            console.error('更新标记位置失败:', error);
          }
        }
      }

      // 更新已走过的路径 - 使用段索引直接确定当前应包含哪些原始点
      try {
        // 清空当前路径集合
        animation.passedPath.length = 0;
        
        // 添加所有完全经过的段的点
        for (let i = 0; i <= currentSegmentIndex; i++) {
          animation.passedPath.push(animation.tPoints[i]);
        }
        
        // 如果还没到终点，添加当前插值点
        if (currentSegmentIndex < animation.tPoints.length - 1) {
          const currentLngLat = new window.T.LngLat(currentPosition[0], currentPosition[1]);
          animation.passedPath.push(currentLngLat);
        }
        
        // 使用完全重建的方式更新经过线
        if (mapInstance.value && animation.passedPolyline) {
          // 从地图中移除旧的经过线
          mapInstance.value.removeOverLay(animation.passedPolyline);
          
          // 创建新的经过线
          const newPassedLine = new window.T.Polyline(animation.passedPath, {
            color: options?.passedLineColor || '#FFCC00',
            weight: options?.lineWidth || 4,
            opacity: options?.lineOpacity || 0.8,
            zIndex: 20
          });
          
          // 添加到地图
          mapInstance.value.addOverLay(newPassedLine);
          
          // 更新引用
          animation.passedPolyline = newPassedLine;
        }
      } catch (error) {
        console.error('更新路径失败:', error);
      }

      // 如果启用了实时跟踪移动标识，将地图中心设置为当前位置
      if (animation.options.followMarker && mapInstance.value) {
        const currentLngLat = new window.T.LngLat(currentPosition[0], currentPosition[1]);
        mapInstance.value.panTo(currentLngLat);
      }

      // 调用步骤回调
      if (animation.options.onStep) {
        animation.options.onStep({
          position: currentPosition,
          progress,
          segmentIndex: currentSegmentIndex,
          totalSegments: state.segments.length
        });
      }

      // 记录最后一帧时间
      state.lastFrameTime = timestamp;

      // 使用动画帧请求继续动画
      state.requestId = requestAnimationFrame(animate);
    };

    // 开始动画
    if (options.autoPlay !== false) {
      animationState.requestId = requestAnimationFrame(animate);
    }

    return { polyline, passedPolyline, marker, animationState };
  } catch (error) {
    console.error('启动轨迹动画失败:', error);
    return null;
  }
};

// 停止轨迹动画 - 改进释放资源
const stopTrackAnimation = () => {
  if (!window._tmap_track_animation) return;

  info('停止天地图轨迹动画');

  const animation = window._tmap_track_animation;

  // 取消动画帧请求
  if (animation.state && animation.state.requestId) {
    cancelAnimationFrame(animation.state.requestId);
  }

  // 移除地图上的对象 - 顺序很重要，先移除标记再移除线
  if (mapInstance.value) {
    try {
      if (animation.marker) {
        mapInstance.value.removeOverLay(animation.marker);
        animation.marker = null;
      }

      if (animation.passedPolyline) {
        mapInstance.value.removeOverLay(animation.passedPolyline);
        animation.passedPolyline = null;
      }

      if (animation.polyline) {
        mapInstance.value.removeOverLay(animation.polyline);
        animation.polyline = null;
      }
    } catch (e) {
      console.error('清理轨迹动画资源失败:', e);
    }
  }

  // 重置轨迹动画对象
  window._tmap_track_animation = null;
};

// 暂停轨迹动画 - 改进性能
const pauseTrackAnimation = () => {
  if (!window._tmap_track_animation) return;

  info('暂停天地图轨迹动画');

  const animation = window._tmap_track_animation;

  // 如果已经是暂停状态，不做任何处理
  if (animation.paused) return;

  animation.paused = true;

  // 记录暂停开始时间
  if (animation.state) {
    animation.state.pauseStartTime = performance.now();

    // 取消动画帧请求
    if (animation.state.requestId) {
      cancelAnimationFrame(animation.state.requestId);
      animation.state.requestId = 0;
    }
  }
};

// 继续轨迹动画 - 改进平滑度
const resumeTrackAnimation = () => {
  if (!window._tmap_track_animation || !window._tmap_track_animation.paused) return;

  info('恢复天地图轨迹动画');

  const animation = window._tmap_track_animation as any;

  // 计算暂停的时间
  if (animation.state) {
    const now = performance.now();
    animation.state.pausedTime += (now - animation.state.pauseStartTime);
    animation.state.pauseStartTime = 0;
  }

  animation.paused = false;

  // 继续动画 - 使用与原始animate相同的完整逻辑
  const continuedAnimate = (timestamp: number) => {
    if (!animation || animation.paused) return;

    const state = animation.state as any;

    // 初始化时间 - 特殊处理恢复后的第一帧
    if (!state.lastFrameTime) {
      state.lastFrameTime = timestamp;
      state.requestId = requestAnimationFrame(continuedAnimate);
      return;
    }

    // 计算动画进度
    const duration = animation.options.duration || 5000;
    const elapsedTime = (state.startTime !== null) 
      ? timestamp - state.startTime - state.pausedTime
      : 0;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // 应用缓动函数使动画更平滑
    const easedProgress = progress < 0.1
      ? progress * 10 * progress / 2
      : progress > 0.9
        ? 0.9 + (progress - 0.9) * (1 - (1 - (progress - 0.9) * 10) / 2)
        : progress;

    // 计算当前应该走过的距离
    const targetDistance = state.totalDistance * easedProgress;

    // 如果已经结束，重新从开始执行，否则会从暂停位置继续
    if (progress >= 1) {
      // 重置动画并开始新循环
      state.startTime = timestamp;
      state.pausedTime = 0;
      state.loopCount++; // 递增循环次数
      
      // 重置路径状态以便重新开始
      animation.passedPath.length = 0;
      animation.passedPath.push(animation.passedPolyline.getPath()[0]);
      
      // 调用循环回调
      if (animation.options.onLoop) {
        animation.options.onLoop(state.loopCount);
      }
      
      // 检查是否达到循环次数上限
      const maxLoopCount = animation.options.loopCount === Infinity || animation.options.loopCount === 0
        ? Infinity 
        : (animation.options.loopCount || 1);
        
      if (maxLoopCount !== Infinity && state.loopCount >= maxLoopCount) {
        // 达到上限，结束动画
        if (animation.options.onComplete) {
          animation.options.onComplete();
        }
        stopTrackAnimation();
        return;
      }
      
      // 继续下一帧
      state.requestId = requestAnimationFrame(continuedAnimate);
      return;
    }

    // 计算当前位置
    let accumulatedDistance = 0;
    let currentSegmentIndex = 0;
    let segmentProgress = 0;

    // 找到当前所在路径段
    for (let i = 0; i < state.segments.length; i++) {
      const segment = state.segments[i];

      if (accumulatedDistance + segment.distance >= targetDistance) {
        // 找到当前段
        currentSegmentIndex = i;

        // 计算在当前段内的进度
        segmentProgress = (targetDistance - accumulatedDistance) / segment.distance;
        break;
      }

      accumulatedDistance += segment.distance;
    }

    // 计算当前精确位置（线性插值）
    const currentSegment = state.segments[currentSegmentIndex];
    const currentPosition: [number, number] = [
      currentSegment.start[0] + (currentSegment.end[0] - currentSegment.start[0]) * segmentProgress,
      currentSegment.start[1] + (currentSegment.end[1] - currentSegment.start[1]) * segmentProgress
    ];

    // 确保当前点位准确地在轨迹线段上
    // 使用线性插值保证点位精确在线段上，无需额外校正
    const lngLat = new window.T.LngLat(currentPosition[0], currentPosition[1]);
    
    // 更新标记位置 - 使用天地图的原生对象
    if (animation.marker) {
      // 修复：使用正确的方法设置标记位置
      if (typeof animation.marker.setLngLat === 'function') {
        animation.marker.setLngLat(lngLat);
      } else if (typeof animation.marker.setPosition === 'function') {
        animation.marker.setPosition(lngLat);
      } else if (animation.marker.setLatLng) {
        animation.marker.setLatLng(lngLat);
      } else {
        // 如果以上方法都不存在，尝试重新创建标记
        try {
          if (mapInstance.value) {
            mapInstance.value.removeOverLay(animation.marker);
            const newMarker = new window.T.Marker(lngLat);
            mapInstance.value.addOverLay(newMarker);
            animation.marker = newMarker;
          }
        } catch (error) {
          console.error('更新标记位置失败:', error);
        }
      }
    }

    // 更新已走过的路径 - 使用更高效的方法避免重建整个数组
    const enhancedTPoints = state.segments.map(segment => new window.T.LngLat(segment.start[0], segment.start[1]));
    enhancedTPoints.push(new window.T.LngLat(
      state.segments[state.segments.length-1].end[0], 
      state.segments[state.segments.length-1].end[1]
    ));
    
    if (currentSegmentIndex > 0) {
      // 确保已添加了所有已完全经过的段
      while (animation.passedPath.length - 1 < currentSegmentIndex) {
        const nextPoint = enhancedTPoints[animation.passedPath.length];
        if (nextPoint) {
          animation.passedPath.push(nextPoint);
        } else {
          break;
        }
      }
    }

    // 更新最后一个点为当前精确位置
    const currentLngLat = new window.T.LngLat(currentPosition[0], currentPosition[1]);

    // 检查当前位置是否已经是路径的最后一个点
    if (animation.passedPath.length <= currentSegmentIndex + 1) {
      animation.passedPath.push(currentLngLat);
    } else {
      animation.passedPath[currentSegmentIndex + 1] = currentLngLat;
      // 截断数组，仅保留到当前段的部分
      animation.passedPath.length = currentSegmentIndex + 2;
    }

    // 使用更高效的方式更新路径
    animation.passedPolyline.setPath(animation.passedPath);

    // 如果启用了实时跟踪移动标识，将地图中心设置为当前位置
    if (animation.options.followMarker && mapInstance.value) {
      mapInstance.value.panTo(currentLngLat);
    }

    // 调用步骤回调
    if (animation.options.onStep) {
      animation.options.onStep({
        position: currentPosition,
        progress,
        segmentIndex: currentSegmentIndex,
        totalSegments: state.segments.length
      });
    }

    // 记录最后一帧时间
    state.lastFrameTime = timestamp;

    // 使用动画帧请求继续动画
    state.requestId = requestAnimationFrame(continuedAnimate);
  };

  // 启动动画循环
  animation.state.requestId = requestAnimationFrame(continuedAnimate);
};
onMounted(() => {
  // 由父组件确保TMap已加载
  initMap();
});

onUnmounted(() => {
  // 不再需要清理弹窗，已经移除了相关逻辑
  // hidePopover(false);
  // hidePopover(true);

  // 清理地图实例
  if (mapInstance.value) {
    if (mapInstance.value.destroy) {
      mapInstance.value.destroy();
    }
    mapInstance.value = null;
  }
});

// 在onBeforeUnmount钩子中添加清理代码
onBeforeUnmount(() => {
  // 确保取消防抖函数以避免内存泄漏
  if (debouncedAddMarkers && typeof debouncedAddMarkers.cancel === 'function') {
    debouncedAddMarkers.cancel();
  }
});


// 暴露组件方法
defineExpose({
  addMouseMoveListener,
  removeMouseMoveListener,
  mapInstance: computed(() => mapInstance.value),
  markersInstances,
  addMarkers,
  setMarkers,
  clearMarkers,
  removeMarker,
  setCenter,
  setZoom,
  enableAddMarker,
  disableAddMarker,
  addShape,
  removeShape,
  clearShapes,
  getShapes,
  addPolygon,
  addCircle,
  addRectangle,
  addPolyline,
  startDrawing,
  stopDrawing,
  enableCluster,
  disableCluster,
  startMeasureDistance,
  stopMeasureDistance,
  clearDistance,
  setCursorStyle,
  toggleMarkerLabels,
  getVisibleBounds,
  getVisibleMarkers,
  onMarkerMouseenter,
  onMarkerMouseleave,
  startTrackAnimation,
  pauseTrackAnimation,
  resumeTrackAnimation,
  stopTrackAnimation,
  getPixelFromCoordinate: (coord: [number, number]) => {
    if (!mapInstance.value) {
      return null;
    }

    try {
      // 使用天地图API将经纬度转换为像素坐标
      const latlng = new window.T.LngLat(coord[0], coord[1]);

      // 使用正确的方法获取像素坐标
      // 先验证两种可能使用的方法
      let pixel: { x: number; y: number } | null = null;
      if (typeof mapInstance.value.lngLatToContainerPoint === 'function') {
        pixel = mapInstance.value.lngLatToContainerPoint(latlng);
      } else if (typeof mapInstance.value.lngLatToPixel === 'function') {
        pixel = mapInstance.value.lngLatToPixel(latlng);
      }

      // 获取地图容器偏移
      const container = document.querySelector('.tmap-container');
      const containerOffset = container ? container.getBoundingClientRect() : { left: 0, top: 0 };

      if (pixel && typeof pixel === 'object' && 'x' in pixel && 'y' in pixel) {
        // 返回相对于地图容器的坐标
        return [
          pixel.x + (containerOffset.left || 0),
          pixel.y + (containerOffset.top || 0)
        ] as [number, number];
      }
    } catch (error) {
      console.error('转换坐标到像素失败:', error);
    }

    return null;
  },
  // 根据标记ID获取DOM元素
  getMarkerElement: (markerId: string) => {
    if (!mapInstance.value) return null;
    try {
      // 从标记实例列表中查找对应的标记
      const marker = markersInstances.value.find(m => {
        const markerData = (m as any).__markerData;
        return markerData &&
          (markerData.markerId === markerId ||
            (markerData.data && markerData.data.id === markerId));
      });

      if (marker) {
        // 先尝试使用getElement或getContainer方法
        let element = marker.getElement ? marker.getElement() :
          (marker.getContainer ? marker.getContainer() : null);

        // 如果没有获取到元素，尝试使用DOM选择器
        if (!element) {
          element = document.querySelector(`[data-marker-id="${markerId}"][data-map-type="tmap"]`);

          // 尝试其他方法查找标记元素
          if (!element) {
            // 如果所有方法都失败，尝试使用天地图特有的DOM结构
            const markersInDom = document.querySelectorAll('.tmap-marker');
            for (let i = 0; i < markersInDom.length; i++) {
              if (markersInDom[i].getAttribute('title') === (marker as any).__markerData?.title) {
                element = markersInDom[i];
                break;
              }
            }
          }
        }

        return element;
      }

      // 如果通过实例找不到，尝试直接通过DOM选择器查找
      return document.querySelector(`[data-marker-id="${markerId}"]`) ||
        document.querySelector(`.tmap-marker[data-marker-id="${markerId}"]`);
    } catch (error) {
      console.error('获取标记DOM元素失败', error);
      return null;
    }
  },
  // 根据标记数据获取DOM元素
  getMarkerElementByData: (marker: Marker) => {
    if (!mapInstance.value) return null;
    try {
      const markerId = marker.markerId || (marker.data && marker.data.id);
      if (!markerId) {
        // 如果没有ID，尝试使用标题查找
        if (marker.title) {
          // 查找所有天地图标记，通过标题匹配
          const markersInDom = document.querySelectorAll('.tmap-marker');
          for (let i = 0; i < markersInDom.length; i++) {
            if (markersInDom[i].getAttribute('title') === marker.title) {
              return markersInDom[i];
            }
          }
        }
        return null;
      }

      // 主方法：使用data-marker-id属性查找DOM元素
      let element = document.querySelector(`[data-marker-id="${markerId}"][data-map-type="tmap"]`);

      // 如果找不到，尝试不带map-type的选择器
      if (!element) {
        element = document.querySelector(`[data-marker-id="${markerId}"]`);
      }

      // 如果依然找不到，尝试获取对应实例中的DOM元素
      if (!element) {
        const markerInstance = markersInstances.value.find(m => {
          const markerData = (m as any).__markerData;
          return markerData &&
            (markerData.markerId === markerId ||
              (markerData.data && markerData.data.id === markerId));
        });

        if (markerInstance) {
          element = markerInstance.getElement ? markerInstance.getElement() :
            (markerInstance.getContainer ? markerInstance.getContainer() : null);
        }
      }

      return element;
    } catch (error) {
      console.error('获取标记DOM元素失败', error);
      return null;
    }
  },
  // 显示或隐藏所有标记点
  showHideMarkers: (show: boolean) => {
    if (!mapInstance.value) return;
    
    info('尝试{}所有标记点，共 {} 个', show ? '显示' : '隐藏', markersInstances.value.length);
    
    // 隐藏标记点同时隐藏标签
    if (!show) {
      toggleMarkerLabels(false);
    }
    
    markersInstances.value.forEach(marker => {
      try {
        if (show) {
          marker.show();
        } else {
          marker.hide();
        }
      } catch (e) {
        console.warn('无法控制天地图标记点可见性:', e);
        
        // 备用方法：尝试使用设置样式隐藏
        try {
          const element = marker.getContainer ? marker.getContainer() : null;
          if (element && element instanceof HTMLElement) {
            element.style.display = show ? '' : 'none';
          }
        } catch (domError) {
          console.error('无法通过DOM控制标记点可见性:', domError);
        }
      }
    });

    // 如果重新显示标记点且原本设置为显示标签，则重新显示标签
    if (show && shouldShowLabels.value) {
      toggleMarkerLabels(true);
      nextTick(() => toggleMarkerLabels(true));
    }
  },
  // 显示或隐藏所有图形
  showHideShapes: (show: boolean) => {
    if (!mapInstance.value || !window._tmap_overlays) return;
    
    info('尝试{}所有图形，共 {} 个', show ? '显示' : '隐藏', window._tmap_overlays.size);
    
    window._tmap_overlays.forEach((overlay, id) => {
      try {
        if (show) {
          overlay.show();
        } else {
          overlay.hide();
        }
      } catch (e) {
        console.warn(`无法控制图形可见性(ID: ${id}):`, e);
        
        // 备用方法：如果图形是DOM元素，尝试设置CSS
        try {
          // 尝试获取天地图图形的DOM元素（不同图形类型可能有不同实现）
          const element = overlay.getElement ? overlay.getElement() :
            (overlay.getContainer ? overlay.getContainer() : null);
          
          if (element && element instanceof HTMLElement) {
            element.style.display = show ? '' : 'none';
          }
        } catch (domError) {
          console.error('无法通过DOM控制图形可见性:', domError);
        }
      }
    });
  },
  getAllMarkersInstances: () => markersInstances.value,
  // 添加supportsCluster属性，表明天地图不支持聚合功能
  supportsCluster: false,
  
  // 从标记点获取原始数据
  getMarkerOriginalData: (marker: any): any => {
    // 如果marker为空，返回null
    if (!marker) return null;
    
    // 1. 首先尝试从__markerData中获取数据
    if (marker.__markerData) {
      // 如果__markerData有data属性，返回data
      if (marker.__markerData.data) {
        return marker.__markerData.data;
      }
      // 否则返回__markerData本身
      return marker.__markerData;
    }
    
    // 2. 尝试从marker的extData属性获取
    if (marker.extData) {
      return marker.extData;
    }
    
    // 3. 尝试从存储在marker上的任何数据属性获取
    if (marker.data) {
      return marker.data;
    }
    
    // 4. 尝试通过marker的DOM元素获取数据
    try {
      const element = marker.getElement ? marker.getElement() : 
                    (marker.getContainer ? marker.getContainer() : null);
      
      if (element && element instanceof HTMLElement) {
        // 尝试从data-*属性中获取数据
        const id = element.getAttribute('data-marker-id');
        const title = element.getAttribute('data-marker-title');
        
        if (id || title) {
          return {
            id: id,
            title: title,
            // 可以添加更多从DOM属性中获取的字段
          };
        }
      }
    } catch (error) {
      console.warn('通过DOM获取标记点数据失败:', error);
    }
    
    // 5. 如果所有方法都失败，返回marker自身作为数据
    return marker;
  },
  // 添加获取地图中心点坐标的方法
  getCenter: () => {
    if (!mapInstance.value) return props.center; // 改为返回传入的center属性值
    try {
      const center = mapInstance.value.getCenter();
      if (center && typeof center === 'object' && center.lng !== undefined && center.lat !== undefined) {
        // 验证获取的坐标是否为[0,0]，如果是且props.center不是[0,0]，则返回props.center
        if ((center.lng === 0 && center.lat === 0) && 
            (props.center[0] !== 0 || props.center[1] !== 0)) {
          console.warn('地图中心坐标获取到了[0,0]，可能是错误值，使用props.center替代');
          return props.center;
        }
        return [center.lng, center.lat];
      }
    } catch (error) {
      console.error('获取地图中心坐标失败:', error);
    }
    // 确保返回有效的中心点坐标，避免返回[0,0]
    if (props.center[0] === 0 && props.center[1] === 0) {
      // 如果props.center也是[0,0]，返回一个有效的默认值
      return [116.397428, 39.90923]; // 默认北京中心
    }
    return props.center; // 改为返回传入的center属性值而不是 [0, 0]
  },
  // 添加新方法
  removeMarkerByData,
});

// 添加统一的图形事件处理函数
/**
 * 为图形添加事件监听器
 * @param shapeInstance 图形实例
 * @param shapeData 图形数据
 * @param shapeType 图形类型
 */
const addShapeEventListeners = (shapeInstance: any, shapeData: any, shapeType: string) => {
  if (!shapeInstance) return;
  
  // 添加点击事件
  shapeInstance.addEventListener('click', (e: any) => {
    emit('shape-click', {
      shape: shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: e
    });
  });
  
  // 添加右键菜单事件
  shapeInstance.addEventListener('contextmenu', (e: any) => {
    info(`图形右键菜单事件: ${shapeData.id} (${shapeType})`);
    
    // 构造完整的事件对象，确保包含所有必要的属性
    const eventObject = {
      shape: shapeData,
      position: [e.lnglat.lng, e.lnglat.lat],
      originalEvent: {
        // 添加originEvent属性，这是ScMap.vue中onShapeContextmenu方法所需要的
        originEvent: e.domEvent || e,
        target: (e.domEvent || e)?.originalEvent?.target,
        clientX: e.domEvent ? e.domEvent.clientX : (e.clientX || 0),
        clientY: e.domEvent ? e.domEvent.clientY : (e.clientY || 0),
        // 确保preventDefault方法存在
        preventDefault: () => {
          if (e.domEvent && e.domEvent.preventDefault) {
            e.domEvent.preventDefault();
          }
        },
        stopPropagation: () => {
          if (e.domEvent && e.domEvent.stopPropagation) {
            e.domEvent.stopPropagation();
          }
        },
      }
    };
    
    // 触发图形右键菜单事件
    emit('shape-contextmenu', eventObject);
    
    // 防止事件冒泡和默认行为
    const domEvent = e.domEvent || e;
    if (domEvent && domEvent.preventDefault) {
      domEvent.preventDefault();
    }
    if (domEvent && domEvent.stopPropagation) {
      domEvent.stopPropagation();
    }
  });
  
};
</script>

<style scoped>
.tmap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 工具栏相关样式已移除，统一由父组件管理 */
</style>

<style>
/* 非scoped全局样式，确保能影响到动态创建的标签 */
.T_label {
  background-color: rgba(255, 255, 255, 0.9) !important;
  padding: 2px 5px !important;
  border-radius: 2px !important;
  font-size: 12px !important;
  text-align: center !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
  white-space: nowrap !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  pointer-events: none !important;
  /* 防止标签拦截鼠标事件 */
}

/* 给已添加sc-map-marker-label类的标签设置不同样式 */
.sc-map-marker-label {
  font-weight: bold !important;
  background-color: rgba(255, 255, 255, 0.95) !important;
}

/* TMap 缩放控件样式覆盖 */
.tdt-zoom-container,
.tdt-control-zoom,
.tmap-control-zoom {
  z-index: 10 !important;
  bottom: 20px !important;
  right: 15px !important;
  position: absolute !important;
}

/* 确保缩放按钮显示在其他地图元素之下 */
.tdt-zoom-in,
.tdt-zoom-out,
.tmap-zoom-in,
.tmap-zoom-out {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #ccc !important;
  border-radius: 2px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  margin-bottom: 5px !important;
}

/* 悬停效果 */
.tdt-zoom-in:hover,
.tdt-zoom-out:hover,
.tmap-zoom-in:hover,
.tmap-zoom-out:hover {
  background-color: #f0f0f0 !important;
}
</style>