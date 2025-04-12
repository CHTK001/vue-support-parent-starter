<template>
  <div class="sc-map-example">
    <h3>地图组件示例</h3>
    <div class="map-container">
      <ScMap :type="mapType" :api-key="apiKey[mapType]" :center="center" :zoom="zoom" :markers="markers" :initial-shapes="shapes" @marker-click="handleMarkerClick" @shape-click="handleShapeClick" />
    </div>
    <div class="map-controls">
      <div class="control-group">
        <span>地图类型:</span>
        <select v-model="mapType">
          <option value="amap">高德地图</option>
          <option value="bmap">百度地图</option>
          <option value="tmap">腾讯地图</option>
        </select>
      </div>
      <div class="control-group">
        <button @click="addRandomMarker">添加标记点</button>
        <button @click="addRandomShape">添加形状</button>
        <button @click="clearAll">清除所有</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import ScMap from "@repo/components/ScMap/index.vue";

// 地图配置
const mapType = ref("amap");
const apiKey = reactive({
  amap: "5f969bed06ed949108d2ec7916dcffc4", // 高德地图API密钥
  bmap: "your_bmap_key", // 替换为您的百度地图API密钥
  tmap: "050980b15bce7aa8c13fb4a4c7b1a5e5", // 腾讯地图API密钥
});
const center = ref([116.397428, 39.90923]);
const zoom = ref(11);

// 标记点和形状
const markers = ref([
  {
    position: [116.397428, 39.90923],
    title: "标记点1",
    data: {
      id: "marker-1",
    },
    content: "这是一个示例标记点",
  },
]);

const shapes = ref([
  {
    id: "shape-1",
    type: "circle",
    center: [116.397428, 39.90923],
    radius: 1000,
    style: {
      strokeColor: "#FF5722",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#FF9800",
      fillOpacity: 0.3,
    },
  },
]);

// 事件处理
const handleMarkerClick = (marker) => {
  console.log("标记点被点击：", marker);
  alert(`点击了标记点: ${marker.title || marker.data?.id}`);
};

const handleShapeClick = (shape) => {
  console.log("形状被点击：", shape);
  alert(`点击了形状: ${shape.id}`);
};

// 添加随机标记点
const addRandomMarker = () => {
  const lng = 116.397428 + (Math.random() - 0.5) * 0.1;
  const lat = 39.90923 + (Math.random() - 0.5) * 0.1;

  markers.value.push({
    position: [lng, lat],
    title: `标记点 ${markers.value.length + 1}`,
    data: {
      id: `marker-${Date.now()}`,
    },
    content: `这是随机添加的标记点 ${markers.value.length + 1}`,
  });
};

// 添加随机形状
const addRandomShape = () => {
  const lng = 116.397428 + (Math.random() - 0.5) * 0.1;
  const lat = 39.90923 + (Math.random() - 0.5) * 0.1;
  const shapeTypes = ["circle", "rectangle", "polygon"];
  const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

  let shape = {
    id: `shape-${Date.now()}`,
    type: randomType,
    style: {
      strokeColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      fillOpacity: 0.3,
    },
  };

  // 根据形状类型设置不同的属性
  if (randomType === "circle") {
    shape.center = [lng, lat];
    shape.radius = 500 + Math.random() * 1000;
  } else if (randomType === "rectangle") {
    shape.bounds = [
      [lng - 0.01, lat - 0.01],
      [lng + 0.01, lat + 0.01],
    ];
  } else if (randomType === "polygon") {
    shape.path = [
      [lng, lat],
      [lng + 0.01, lat],
      [lng + 0.01, lat + 0.01],
      [lng, lat + 0.01],
    ];
  }

  shapes.value.push(shape);
};

// 清除所有标记点和形状
const clearAll = () => {
  markers.value = [];
  shapes.value = [];
};
</script>

<style scoped>
.sc-map-example {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.map-container {
  width: 100%;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.map-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

button {
  padding: 6px 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #40a9ff;
}

select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}
</style>
