<template>
 <!-- 使用天地图 -->
<sc-map
  type="tmap"
  api-key="您的天地图API密钥"
  :center="[116.397428, 39.90923]"
  :zoom="12"
  view-type="satellite"
  :markers="markers"
  height="500px"
/>

<!-- 使用离线地图 -->
<sc-map
  type="offline"
  :center="[116.397428, 39.90923]"
  :zoom="12"
  :offline-config="{
    tileUrlTemplate: '/tiles/{z}/{x}/{y}.png',
    minZoom: 3,
    maxZoom: 18,
    attribution: '© 自定义离线地图'
  }"
  :markers="markers"
  height="500px"
/>

<!-- 使用高德卫星地图 -->
<sc-map
  type="amap"
  api-key="您的高德地图API密钥"
  :center="[116.397428, 39.90923]"
  :zoom="12"
  view-type="satellite"
  :markers="markers"
  height="500px"
/>
</template>

<script setup>
import { ref } from 'vue';
import ScMap from '@repo/components/ScMap/index.vue';

const markers = ref([
  {
    position: [116.397428, 39.90923],
    title: '天安门',
    label: '天安门广场',
    data: { id: 1 }
  },
  {
    position: [116.330484, 39.897452],
    title: '北京西站',
    label: '北京西站',
    data: { id: 2 }
  }
]);

const onMapLoaded = (mapInstance) => {
  console.log('地图加载完成', mapInstance);
};

const onMarkerClick = (marker) => {
  console.log('点击了标记点', marker);
};

const onMapClick = (event) => {
  console.log('点击了地图', event.position);
};
</script>