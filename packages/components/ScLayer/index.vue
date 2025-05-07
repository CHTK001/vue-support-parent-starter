<template>
  <div class="sc-layer-container" :style="{ height: props.height + 'px' }">
    <div class="sc-layer-map" ref="mapElement"></div>
  </div>
</template>

<script setup lang="ts">
import 'ol/ol.css';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { MapObject } from './composables/MapObject';
import { ConfigObject } from './composables/ConfigObject';
import type { MapConfig } from './types';

// 定义组件属性
const props = withDefaults(defineProps<MapConfig>(), {
  height: 500,
  center: () => [39.92, 116.40],
  zoom: 12,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true
});

// 定义事件
const emit = defineEmits([
  'map-init', 
  'map-click', 
  'marker-click', 
  'update:center', 
  'update:zoom'
]);

// 地图DOM元素引用
const mapElement = ref<HTMLElement | null>(null);
//创建配置参数
const configObject = new ConfigObject(props as Partial<MapConfig>);
// 创建地图对象实例
const mapObj = new MapObject(configObject);

// 初始化地图
function initMap() {
  if (!mapElement.value) return;

  // 初始化地图对象
  mapObj.init(mapElement.value, emit);
}

// 生命周期钩子
onMounted(() => {
  initMap();
});

onBeforeUnmount(() => {
  mapObj.destroy();
});

// 向外暴露方法
defineExpose({
  mapObj
});
</script>

<style>
.sc-layer-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sc-layer-map {
  width: 100%;
  height: 100%;
}
</style>
