<template>
  <div class="tmap-container" :style="{ height: height, width: width }">
    <div class="map-container" ref="mapContainer"></div>

    <!-- 工具面板已移到父组件中统一管理，这里不再需要 -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick, PropType } from 'vue';
import { Marker, MapViewType, Shape, ShapeStyle, ShapeType, ToolType, DistanceResultEvent, ClusterOptions, ClusterClickEvent } from '../types';

// 声明全局类型
declare global {
  interface Window {
    T: any;
    _tmap_overlays?: Map<string, any>;
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
  viewType: 'normal',
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
  'distance-result',
  'marker-created',
  'shape-created',
  'cluster-click',
  'marker-mouseenter',
  'marker-mouseleave',
  'hover-popover-show',
  'hover-popover-hide',
  'click-popover-show',
  'click-popover-hide'
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
    });
  });

  // 添加鼠标悬停事件
  marker.addEventListener('mouseover', (e: any) => {
    const domEvent = e.domEvent || e;
    emit('marker-mouseenter', markerData, domEvent);
  });

  // 添加鼠标离开事件
  marker.addEventListener('mouseout', (e: any) => {
    const domEvent = e.domEvent || e;
    emit('marker-mouseleave', markerData, domEvent);
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

      // 设置中心点和缩放级别
      mapInstance.value.centerAndZoom(new window.T.LngLat(props.center[0], props.center[1]), props.zoom);

      // 设置地图视图类型
      // viewMode: BMAP_NORMAL_MAP-普通地图、BMAP_PERSPECTIVE_MAP-透视图、BMAP_SATELLITE_MAP-卫星图、BMAP_HYBRID_MAP-混合地图
      switch (props.viewType) {
        case 'satellite':
          mapInstance.value.setMapType(window.T.SATELLITE_MAP); // 设置卫星图
          break;
        case 'hybrid':
          mapInstance.value.setMapType(window.T.HYBRID_MAP); // 设置混合地图
          break;
        default:
          mapInstance.value.setMapType(window.T.NORMAL_MAP); // 设置普通地图
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
          console.log('TMap: 正在初始化地图时显示标记标签');
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

  const markersToAdd = markers || props.markers;

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

      // 处理图标，支持SVG和URL
      if (marker.icon) {
        if (typeof marker.icon === 'string' && marker.icon.trim().startsWith('<svg')) {
          // SVG图标
          const svgContainer = document.createElement('div');
          svgContainer.innerHTML = marker.icon;
          svgContainer.style.width = (marker.size?.[0] || 25) + 'px';
          svgContainer.style.height = (marker.size?.[1] || 25) + 'px';

          // 创建无图标的标记点，后续设置内容
          const markerInstance = new window.T.Marker(position, options);
          markerInstance.setContent(svgContainer);

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
          const icon = new window.T.Icon({
            iconUrl: marker.icon,
            iconSize: new window.T.Point(marker.size?.[0] || 25, marker.size?.[1] || 25)
          });

          options.icon = icon;

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
  if (props.showMarkerLabels) {
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
    // 移除地图上的标记点
    mapInstance.value.removeOverLay(markersInstances.value[markerIndex]);
    // 从标记点实例数组中移除
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
  currentTool.value = 'distance';

  // 设置鼠标样式为十字形
  if (mapInstance.value.getContainer()) {
    mapInstance.value.getContainer().style.cursor = 'crosshair';
  }

  console.log('天地图开始测距');

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

      console.log('测距点击点:', lngValue, latValue);

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

          console.log('测距线更新:', totalDistance);
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
        };

        distanceResult.value = result;
        emit('distance-result', result);
        console.log('测距完成, 总距离:', totalDistance);
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

  console.log('天地图停止测距');

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

  console.log('天地图测距已完全清除');
};

// 开始绘制图形
const startDrawing = (type: ToolType) => {
  if (!mapInstance.value) return;

  console.log(`开始绘制 ${type}`);

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
          console.log('清除未保存的临时绘图对象');
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

      console.log('绘图点击点:', lngValue, latValue);

      // 添加点到数组
      pointsArray.push([lngValue, latValue]);

      // 根据类型和点的数量进行不同处理
      switch (type) {
        case 'circle':
          // 圆形需要两个点：中心点和半径点
          if (pointsArray.length === 1) {
            // 第一个点是圆心
            console.log('选择圆心:', lngValue, latValue);
          } else if (pointsArray.length === 2) {
            // 第二个点用来计算半径
            const centerPoint = new window.T.LngLat(pointsArray[0][0], pointsArray[0][1]);
            const radiusPoint = new window.T.LngLat(lngValue, latValue);
            const radius = centerPoint.distanceTo(radiusPoint);

            console.log('创建圆形，半径:', radius);

            // 移除任何可能的临时预览图形
            if (tempShape) {
              console.log('清除临时预览图形');
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
            console.log('选择矩形起始点:', lngValue, latValue);
          } else if (pointsArray.length === 2) {
            // 第二个点是对角点，创建矩形
            // 获取西南和东北角点
            const minLng = Math.min(pointsArray[0][0], pointsArray[1][0]);
            const maxLng = Math.max(pointsArray[0][0], pointsArray[1][0]);
            const minLat = Math.min(pointsArray[0][1], pointsArray[1][1]);
            const maxLat = Math.max(pointsArray[0][1], pointsArray[1][1]);

            const sw = [minLng, minLat];
            const ne = [maxLng, maxLat];

            console.log('创建矩形，从', sw, '到', ne);

            // 移除任何临时预览图形
            if (tempShape) {
              console.log('清除临时预览图形');
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
            console.log('更新或创建折线点');

            // 移除临时预览图形
            if (tempShape) {
              console.log('清除临时预览图形');
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
              console.log('继续添加折线点，右键或双击可完成绘制');
            }
          }
          break;

        case 'polygon':
          // 多边形需要至少三个点
          if (pointsArray.length >= 3) {
            console.log('更新或创建多边形点');

            // 移除临时预览图形
            if (tempShape) {
              console.log('清除临时预览图形');
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
            mapInstance.value.addOverLay(polygonShape);

            // 更新当前绘制的形状
            drawingShape = polygonShape;

            if (pointsArray.length > 3) {
              // 右键完成绘制，这里先保留当前状态
              console.log('继续添加多边形点，右键或双击可完成绘制');
            }
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

      console.log('双击完成绘制', type);

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
      console.log(`图形已保存，ID: ${shapeId}，类型: ${type}，共 ${window._tmap_overlays.size} 个已保存图形`);

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
    console.log(`${type} 绘制完成，可以继续绘制，或右键/双击/切换工具结束`);
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
const addShape = (shape: Shape) => {
  if (!mapInstance.value) return;

  let shapeInstance: any;

  switch (shape.type) {
    case 'circle':
      return addCircle(
        shape.path[0] as [number, number],
        shape.radius || 1000,
        shape.style
      );
    case 'polygon':
      return addPolygon(
        shape.path as [number, number][],
        shape.style
      );
    case 'rectangle':
      // 矩形通常是两个点表示的边界，但在TMap中也作为多边形处理
      if (Array.isArray(shape.path) && shape.path.length >= 2) {
        // 将边界转换为四个顶点
        const sw = shape.path[0];
        const ne = shape.path[1];
        const path: [number, number][] = [
          [Number(sw[0]), Number(sw[1])],
          [Number(ne[0]), Number(sw[1])],
          [Number(ne[0]), Number(ne[1])],
          [Number(sw[0]), Number(ne[1])],
          [Number(sw[0]), Number(sw[1])] // 闭合
        ];
        return addPolygon(path, shape.style);
      }
      return;
    case 'polyline':
      return addPolyline(
        shape.path as [number, number][],
        shape.style
      );
  }
};

// 添加多边形
const addPolygon = (points: [number, number][], style?: ShapeStyle, id?: string) => {
  if (!mapInstance.value) return;

  const shapeId = id || `polygon_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 转换点坐标为T-Map格式
  const tPoints = points.map(point => new window.T.LngLat(point[0], point[1]));

  // 样式配置
  const styleOptions = {
    color: style?.strokeColor || '#1890FF',
    weight: style?.strokeWeight || 2,
    opacity: style?.strokeOpacity || 0.9,
    fillColor: style?.fillColor || '#1890FF',
    fillOpacity: style?.fillOpacity || 0.5
  };

  // 创建多边形实例
  const polygon = new window.T.Polygon(tPoints, styleOptions);

  // 为图形添加ID标记，便于后续识别
  (polygon as any).__shapeId = shapeId;

  // 添加到地图
  mapInstance.value.addOverLay(polygon);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, polygon);

  console.log(`添加多边形成功，ID: ${shapeId}，点数: ${points.length}`);

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

  // 添加到地图
  mapInstance.value.addOverLay(circle);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, circle);

  console.log(`添加圆形成功，ID: ${shapeId}，半径: ${radius}`);

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

  // 添加到地图
  mapInstance.value.addOverLay(polyline);

  // 存储实例，用于后续操作
  if (!window._tmap_overlays) {
    window._tmap_overlays = new Map();
  }
  window._tmap_overlays.set(shapeId, polyline);

  console.log(`添加折线成功，ID: ${shapeId}，点数: ${points.length}`);

  return shapeId;
};

// 移除图形
const removeShape = (shapeId: string) => {
  if (!mapInstance.value || !window._tmap_overlays) return;

  const overlay = window._tmap_overlays.get(shapeId);
  if (overlay) {
    mapInstance.value.removeOverLay(overlay);
    window._tmap_overlays.delete(shapeId);
  }
};

// 清除所有图形
const clearShapes = (excludeIds?: string[]) => {
  if (!mapInstance.value) return;

  // 如果_tmap_overlays不存在，则直接返回
  if (!window._tmap_overlays) {
    console.log('没有需要清除的图形');
    return;
  }

  const shapesToRemove: any[] = [];
  const overlays = window._tmap_overlays;

  // 收集需要移除的图形
  overlays.forEach((shape, id) => {
    // 如果提供了排除ID列表，检查当前图形ID是否需要保留
    if (excludeIds && excludeIds.includes(id)) {
      console.log(`保留图形: ${id}`);
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

      console.log(`已移除图形: ${item.id}`);
    } catch (err) {
      console.error(`移除图形 ${item.id} 失败:`, err);
    }
  });

  console.log(`清除完成，剩余图形数量: ${overlays.size}`);
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
  if (mapInstance.value) {
    setCenter(newCenter);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value) {
    setZoom(newZoom);
  }
});

watch(() => props.markers, () => {
  if (mapInstance.value) {
    addMarkers();
  }
}, { deep: true });

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

  console.log('添加天地图鼠标移动监听器');
};

// 移除鼠标移动事件监听
const removeMouseMoveListener = () => {
  if (!mapInstance.value || !mouseMoveListenerRef.value) return;

  // 移除鼠标移动事件监听
  mapInstance.value.removeEventListener('mousemove', mouseMoveListenerRef.value);
  mouseMoveListenerRef.value = null;

  console.log('移除天地图鼠标移动监听器');
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
  currentTool.value = 'marker';

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

  // 重置当前工具
  if (currentTool.value === 'marker') {
    currentTool.value = '';
  }

  // 标记为不启用添加标记模式
  addMarkerEnabled.value = false;

  console.log('TMap已禁用添加标记模式');
};

// 处理地图点击添加标记
const handleMapClickForMarker = (e: any) => {
  // 确保当前工具为marker且启用了添加标记模式
  if (currentTool.value !== 'marker' || !addMarkerEnabled.value) return;

  console.log('TMap点击添加标记', e);

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

    console.log('TMap标记创建成功', newMarker);
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
    console.log('聚合条件不满足，跳过聚合', clusterableMarkers.length, options.enable);
    return;
  }

  try {
    console.log(`开始天地图标记点聚合: ${clusterableMarkers.length}个标记点，配置:`, options);

    // 自定义实现简单的聚合逻辑
    // 1. 先按照距离将标记点分组
    const gridSize = options.gridSize || 60; // 默认网格大小60像素
    const maxZoom = options.maxZoom || 18;   // 默认最大缩放级别18
    const minClusterSize = options.minClusterSize || 2; // 最小聚合数量

    // 如果当前缩放级别大于最大聚合缩放级别，则不执行聚合
    const currentZoom = mapInstance.value.getZoom();
    if (currentZoom >= maxZoom) {
      console.log(`当前缩放级别(${currentZoom})已超过最大聚合级别(${maxZoom})，不执行聚合`);
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
        clusterMarker.setContent(clusterDiv);

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

        // 如果聚合组内有启用悬停弹窗的标记，则为聚合标记也添加悬停弹窗
        if (hasHoverMarkers) {
          clusterMarker.addEventListener('mouseover', (event: MouseEvent) => {
            emit('marker-mouseenter', clusterData);
            showPopover(clusterMarker, event, false);
          });

          clusterMarker.addEventListener('mouseout', () => {
            emit('marker-mouseleave', clusterData);
            hidePopover();
          });
        }

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

    console.log(`天地图标记点聚合已启用，共创建 ${clusterMarkers.length} 个聚合组`);
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
      console.log('禁用天地图标记点聚合');

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
    console.log('缩放级别变化:', newZoom, '重新应用聚合');
    enableCluster(props.clusterOptions);
  }
});

/**
 * 切换标记标签的显示与隐藏
 * @param show 是否显示标签
 */
const toggleMarkerLabels = (show: boolean) => {
  console.log(`TMap组件: 切换标记标签显示状态为 ${show ? '显示' : '隐藏'}`);
  if (!mapInstance.value) return;

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
        console.log(`添加标签: ${labelText}，左偏移: ${horizontalOffset}px`);
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
  }
});


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
</style>