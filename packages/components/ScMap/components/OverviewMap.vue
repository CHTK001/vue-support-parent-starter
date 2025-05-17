/**
 * 鸟瞰图组件
 * @description 显示主地图的缩略图
 */
<template>
  <div class="overview-map" :class="[positionClass, { collapsed }]">
    <div class="overview-header" @click.stop="handleToggleCollapse">
      <div class="overview-title">鸟瞰图</div>
      <div class="overview-actions">
        <button class="collapse-btn" title="展开/收起" @click.stop="handleToggleCollapse">
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path v-if="collapsed" d="M512 685.248l-278.624-278.624 45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z" fill="currentColor"></path>
            <path v-else d="M512 685.248l278.624-278.624-45.248-45.248L512 594.752l-233.376-233.376-45.248 45.248z" fill="currentColor"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="overview-content" v-show="!collapsed">
      <div ref="overviewContainer" class="overview-container"></div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'OverviewMap'
};
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';

// 定义配置接口
export interface OverviewMapConfig {
  width?: number;
  height?: number;
  zoomOffset?: number;
  baseLayer?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  visible?: boolean;
  baseTile?: 'osm' | 'gaode' | 'google' | 'tencent' | 'tianditu';
  autoActivate?: boolean;
}

// 默认配置
const DEFAULT_CONFIG: OverviewMapConfig = {
  width: 200,
  height: 150,
  zoomOffset: -5,
  position: 'bottom-right',
  visible: true,
  baseTile: 'osm',
  autoActivate: false
};

// 组件属性
const props = withDefaults(defineProps<{
  mainMap: L.Map;
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  config?: Partial<OverviewMapConfig>;
}>(), {
  visible: true,
  position: 'bottom-right',
  config: () => ({})
});

// 组件事件
const emit = defineEmits<{
  (e: 'collapse-change', collapsed: boolean): void;
}>();

// 组件状态
const overviewContainer = ref<HTMLElement | null>(null);
const collapsed = ref(false);
const overviewMap = ref<L.Map | null>(null);
const rectangle = ref<L.Rectangle | null>(null);

// 计算最终配置
const finalConfig = computed(() => {
  return {
    ...DEFAULT_CONFIG,
    ...props.config,
    position: props.position || props.config?.position || DEFAULT_CONFIG.position,
    visible: props.visible !== undefined ? props.visible : props.config?.visible !== undefined ? props.config.visible : DEFAULT_CONFIG.visible
  };
});

// 计算位置样式类
const positionClass = computed(() => `position-${finalConfig.value.position}`);

// 初始化鸟瞰图
const initOverviewMap = () => {
  if (!overviewContainer.value || !props.mainMap) return;

  // 创建鸟瞰图实例
  const map = L.map(overviewContainer.value, {
    attributionControl: false,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  // 添加底图
  const baseTile = finalConfig.value.baseTile || 'osm';
  
  if (baseTile === 'osm') {
    // OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
  } else if (baseTile === 'gaode') {
    // 高德地图
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234'
    }).addTo(map);
  } else if (baseTile === 'google') {
    // 谷歌地图
    L.tileLayer('http://mt1.google.cn/vt/lyrs=m&x={x}&y={y}&z={z}').addTo(map);
  } else if (baseTile === 'tencent') {
    // 腾讯地图
    L.tileLayer('https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0', {
      subdomains: '0123'
    }).addTo(map);
  } else if (baseTile === 'tianditu') {
    // 天地图
    L.tileLayer('https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=你的密钥', {
      subdomains: '01234567'
    }).addTo(map);
  }
  
  // 保存鸟瞰图实例
  overviewMap.value = map;
  
  // 初始化视图
  updateOverviewMap();
  
  // 添加点击事件
  map.on('click', (e) => {
    if (props.mainMap) {
      props.mainMap.setView(e.latlng, props.mainMap.getZoom());
    }
  });
};

// 更新鸟瞰图
const updateOverviewMap = () => {
  if (!overviewMap.value || !props.mainMap) return;
  
  // 获取主地图的中心点和缩放级别
  const center = props.mainMap.getCenter();
  const zoom = props.mainMap.getZoom() + (finalConfig.value.zoomOffset || -5);
      
  // 设置鸟瞰图的视图
  overviewMap.value.setView(center, Math.max(0, zoom));
  
  // 更新矩形框
  updateRectangle();
};

// 更新矩形框
const updateRectangle = () => {
  if (!overviewMap.value || !props.mainMap) return;
    
  // 获取主地图的边界
  const bounds = props.mainMap.getBounds();
  
  // 移除旧的矩形框
  if (rectangle.value) {
    rectangle.value.remove();
  }
  
  // 创建新的矩形框
  rectangle.value = L.rectangle(bounds, {
    color: '#1890ff',
    weight: 2,
    fillColor: '#1890ff',
    fillOpacity: 0.1
  }).addTo(overviewMap.value);
};

// 切换收起/展开状态
const handleToggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emit('collapse-change', collapsed.value);
  
  // 如果展开，更新鸟瞰图
  if (!collapsed.value) {
    requestAnimationFrame(() => {
      updateOverviewMap();
    
      // 如果鸟瞰图尚未初始化，初始化它
      if (!overviewMap.value) {
        initOverviewMap();
      } else {
        overviewMap.value.invalidateSize();
      }
    });
  }
};

// 组件挂载
onMounted(() => {
  // 初始化鸟瞰图
  if (finalConfig.value.visible && !collapsed.value) {
    initOverviewMap();
  }
  
  // 监听主地图的事件
  if (props.mainMap) {
    // 移动结束事件
    props.mainMap.on('moveend', updateOverviewMap);
    
    // 缩放结束事件
    props.mainMap.on('zoomend', updateOverviewMap);
    
    // 大小改变事件
    props.mainMap.on('resize', updateOverviewMap);
  }
});

// 组件销毁
onBeforeUnmount(() => {
  // 移除事件监听
  if (props.mainMap) {
    props.mainMap.off('moveend', updateOverviewMap);
    props.mainMap.off('zoomend', updateOverviewMap);
    props.mainMap.off('resize', updateOverviewMap);
  }
  
  // 移除鸟瞰图
  if (overviewMap.value) {
    overviewMap.value.remove();
    overviewMap.value = null;
    }
});

// 监听配置变化
watch(() => props.config, () => {
  if (overviewMap.value) {
    updateOverviewMap();
  }
}, { deep: true });
      
// 监听主地图变化
watch(() => props.mainMap, () => {
  if (overviewMap.value) {
    updateOverviewMap();
  }
});

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible && !overviewMap.value && !collapsed.value) {
    initOverviewMap();
  }
});

// 导出方法
defineExpose({
  updateOverviewMap,
  getOverviewMap: () => overviewMap.value
});
</script>

<style scoped>
.overview-map {
  position: absolute;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
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

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #1890ff;
  color: #fff;
    cursor: pointer;
  }
  
.overview-title {
  font-size: 14px;
  font-weight: 500;
}

.overview-actions {
    display: flex;
    align-items: center;
}

.collapse-btn {
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

.overview-map.collapsed .collapse-btn {
  transform: rotate(180deg);
    }
    
.overview-content {
  width: v-bind('finalConfig.width + "px"');
  height: v-bind('finalConfig.height + "px"');
    }
    
.overview-container {
  width: 100%;
  height: 100%;
}
</style> 