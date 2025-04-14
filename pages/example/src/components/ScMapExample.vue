<template>
  <div class="sc-map-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>地图组件 (ScMap)</h3>
          <p class="text-secondary">一个多功能地图组件，支持高德、百度、天地图等多种地图类型</p>
        </div>
      </template>

      <!-- 内容区域容器 -->
      <div class="main-container">
        <!-- 地图区域 (左侧) -->
        <div class="map-section">
          <h4>组件预览</h4>
          <div class="preview-container">
            <ScMap :key="mapKey" :type="mapType" :api-key="apiKey[mapType]" :center="mapCenter" :zoom="zoomLevel"
              :markers="markers" :height="height" :view-type="viewType" :drawing-control="drawingControl"
              :tools-options="toolsOptions" :tools-position="toolsPosition" :tools-collapsed="toolsCollapsed"
              :draggable="draggable" :scroll-wheel="scrollWheel" ref="mapRef" @map-loaded="onMapLoaded"
              @marker-click="onMarkerClick" @map-click="onMapClick" @shape-created="onShapeCreated"
              @shape-click="onShapeClick" @shape-deleted="onShapeDeleted" @zoom-changed="onZoomChanged"
              @center-changed="onCenterChanged" @marker-created="onMarkerCreated" @cluster-click="onClusterClick"
              @hover-popover-show="onHoverPopoverShow" @hover-popover-hide="onHoverPopoverHide"
              @click-popover-show="onClickPopoverShow" @click-popover-hide="onClickPopoverHide">
            </ScMap>

            <div class="action-buttons mt-4">
              <el-button-group>
                <el-button type="primary" @click="addRandomMarker">添加随机标记</el-button>
                <el-button type="danger" @click="clearMarkers">清除标记</el-button>
                <el-button type="success" @click="restoreDefaultMarkers">恢复默认标记</el-button>
                <el-button type="warning" @click="startTrackAnimation" v-if="mapType === 'amap'">播放轨迹</el-button>
                <el-button type="info" @click="showAllMarkers">显示所有标记点</el-button>
                <el-button type="success" @click="showViewBounds">获取可视区域</el-button>
                <el-button type="primary" @click="getVisibleMarkers">获取可视范围内标记</el-button>
              </el-button-group>
            </div>
          </div>
        </div>

        <!-- 配置面板 (右侧) -->
        <div class="config-section">
          <h4>配置选项</h4>
          <div class="config-scroll-container thin-scrollbar">
            <el-form label-position="top" size="default">
              <el-form-item label="地图类型">
                <el-radio-group v-model="mapType">
                  <el-radio label="amap">高德地图</el-radio>
                  <el-radio label="tmap">天地图</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="视图类型">
                <el-select v-model="viewType" class="w-100">
                  <el-option label="普通视图" value="normal" />
                  <el-option label="卫星视图" value="satellite" />
                  <el-option label="混合视图" value="hybrid" />
                </el-select>
              </el-form-item>

              <el-form-item label="地图高度">
                <el-slider v-model="heightValue" :min="200" :max="600" :step="50" show-stops />
                <div class="height-hint">{{ height }}</div>
              </el-form-item>

              <el-form-item label="API密钥">
                <el-input v-model="apiKey[mapType]" placeholder="输入地图API密钥" />
              </el-form-item>

              <el-form-item label="缩放级别">
                <el-slider v-model="zoomLevel" :min="3" :max="19" :step="1" show-stops />
              </el-form-item>

              <el-form-item label="中心位置">
                <el-radio-group v-model="centerLocation" class="mb-2">
                  <el-radio-button label="beijing">北京</el-radio-button>
                  <el-radio-button label="shanghai">上海</el-radio-button>
                  <el-radio-button label="guangzhou">广州</el-radio-button>
                </el-radio-group>
                <div class="center-coords">
                  <el-input v-model="mapCenter[0]" placeholder="经度" disabled>
                    <template #prepend>经度</template>
                  </el-input>
                  <el-input v-model="mapCenter[1]" placeholder="纬度" disabled>
                    <template #prepend>纬度</template>
                  </el-input>
                </div>
              </el-form-item>

              <el-form-item label="功能控制">
                <div class="control-options">
                  <el-checkbox v-model="draggable">允许拖动</el-checkbox>
                  <el-checkbox v-model="scrollWheel">允许滚轮缩放</el-checkbox>
                </div>
              </el-form-item>

              <el-form-item label="绘图工具" v-if="mapType === 'amap'">
                <el-checkbox v-model="drawingControl" class="mb-2">启用绘图工具</el-checkbox>
                <div v-if="drawingControl" class="drawing-tools-options">
                  <div class="tools-option-title mb-1">绘图工具选项：</div>
                  <div class="tools-checkbox-group">
                    <el-checkbox v-model="toolsOptions.circle">圆形</el-checkbox>
                    <el-checkbox v-model="toolsOptions.polygon">多边形</el-checkbox>
                    <el-checkbox v-model="toolsOptions.rectangle">矩形</el-checkbox>
                    <el-checkbox v-model="toolsOptions.polyline">线段</el-checkbox>
                    <el-checkbox v-model="toolsOptions.distance">测距</el-checkbox>
                    <el-checkbox v-model="toolsOptions.marker">标记点</el-checkbox>
                    <el-checkbox v-model="toolsOptions.clear">清除</el-checkbox>
                    <el-checkbox v-model="toolsOptions.debug">调试</el-checkbox>
                    <el-checkbox v-model="toolsOptions.position">显示坐标</el-checkbox>
                    <el-checkbox v-model="toolsOptions.cluster">点聚合</el-checkbox>
                  </div>
                  <el-checkbox v-model="showCustomTools" class="mt-2">使用自定义工具按钮</el-checkbox>

                  <div class="tools-position-options mt-2">
                    <div class="tools-option-title mb-1">工具面板位置：</div>
                    <el-radio-group v-model="toolsPosition" size="small">
                      <el-radio-button label="left-top">左上</el-radio-button>
                      <el-radio-button label="right-top">右上</el-radio-button>
                      <el-radio-button label="left-bottom">左下</el-radio-button>
                      <el-radio-button label="right-bottom">右下</el-radio-button>
                    </el-radio-group>
                  </div>

                  <div class="tools-collapse-option mt-2">
                    <el-checkbox v-model="toolsCollapsed">初始折叠工具面板</el-checkbox>
                  </div>
                </div>

                <div class="shape-info mt-2" v-if="drawnShapes.length > 0">
                  <div class="shape-info-label mb-1">已绘制图形 ({{ drawnShapes.length }})</div>
                  <el-button type="danger" size="small" @click="clearShapes">清除所有图形</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <h4>代码示例</h4>
        <el-alert type="info" :closable="false" class="mb-3">
          <div class="code-desc">根据当前配置生成的代码示例</div>
        </el-alert>
        <pre><code class="language-html">{{ codeExample }}</code></pre>
      </div>
    </el-card>

    <!-- 数据显示窗口 (左下角) -->
    <div class="marker-data-panel" :class="{ expanded: showMarkerPanel }">
      <div class="panel-header" @click="toggleMarkerPanel">
        <span>数据显示面板</span>
        <i :class="showMarkerPanel ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
      </div>
      <div class="panel-content thin-scrollbar" v-if="showMarkerPanel">
        <div v-if="isLoadingMarkers" class="loading-data">
          <i class="el-icon-loading"></i>
          <span>正在加载数据...</span>
        </div>
        <pre v-else class="json-content">{{ JSON.stringify(markerData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import ScMap from "@repo/components/ScMap/index.vue";

// 配置选项
const mapType = ref("amap");
const apiKey = ref({
  amap: "5f969bed06ed949108d2ec7916dcffc4",
  tmap: "050980b15bce7aa8c13fb4a4c7b1a5e5",
});
const viewType = ref("normal");
const zoomLevel = ref(11);
const heightValue = ref(600);
const height = computed(() => `${heightValue.value}px`);
const draggable = ref(true);
const scrollWheel = ref(true);
const drawingControl = ref(true);
const showCustomTools = ref(true);
const toolsPosition = ref("left-top");
const toolsCollapsed = ref(false);
const toolsOptions = ref({
  circle: true,
  polygon: true,
  rectangle: true,
  polyline: true,
  distance: true,
  marker: true,
  clear: true,
  debug: true,
  position: true,
  cluster: true,
});

// 图形类型名称映射
const shapeTypeNames = {
  circle: "圆形",
  polygon: "多边形",
  rectangle: "矩形",
  polyline: "线段",
};

// 地图实例参考
const mapRef = ref(null);
const mapKey = ref(0); // 用于强制重新渲染地图组件

// 当前位置
const centerLocation = ref("beijing");
const locationMap = {
  beijing: [116.397428, 39.90923],
  shanghai: [121.473701, 31.230416],
  guangzhou: [113.264385, 23.129112],
};
const mapCenter = ref(locationMap.beijing);

// 监听选中的位置变化
watch(centerLocation, (newLocation) => {
  mapCenter.value = locationMap[newLocation];
});

// 标记点数据
const defaultMarkers = [
  {
    position: [116.397428, 39.90923],
    title: "北京市中心",
    label: "北京市中心",
    size: [16, 25],
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
    data: { id: "BJ001" },
  },
  {
    position: [116.326661, 39.897413],
    title: "北京西站",
    label: "北京西站",
    size: [16, 25],
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
    data: { id: "BJ002" },
  },
  {
    position: [116.383223, 39.939108],
    title: "北京动物园",
    label: "北京动物园",
    size: [16, 25],
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png",
    data: { id: "BJ003" },
  },
];
const markers = ref([
  {
    markerId: '1',
    position: [116.397428, 39.90923],
    title: '北京市中心',
    label: '天安门广场',
    icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
    data: { id: 'BJ001' },
    hoverPopover: true,  // 启用悬停弹窗
    hoverPopoverDelay: 300,  // 悬停弹窗延迟显示时间
    hoverPopoverTemplate: `
      <div style="padding:8px;">
        <h3 style="margin:0;color:#1890FF;font-size:14px;">\${marker.title}</h3>
        <p style="margin:5px 0;font-size:12px;">\${marker.label}</p>
      </div>
    `
  },
  {
    markerId: '2',
    position: [116.331398, 39.897445],
    title: '北京动物园',
    label: '北京动物园',
    icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png',
    data: { id: 'BJ002' },
    clickPopover: true,  // 启用点击弹窗
    clickPopoverTemplate: `
      <div style="padding:8px;">
        <h3 style="margin:0;color:#52c41a;font-size:16px;">\${marker.title}</h3>
        <p style="margin:5px 0;font-size:13px;">\${marker.label}</p>
        <div style="margin-top:8px;font-size:12px;color:#999;">ID: \${marker.data.id}</div>
      </div>
    `
  },
  {
    markerId: '3',
    position: [116.442348, 39.908127],
    title: '朝阳公园',
    label: '朝阳公园',
    icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png',
    data: { id: 'BJ003' },
    hoverPopover: true,  // 启用悬停弹窗
    clickPopover: true,  // 同时启用点击弹窗
    hoverPopoverTemplate: `
      <div style="padding:5px;">
        <p style="margin:0;font-size:13px;">\${marker.title}</p>
      </div>
    `,
    clickPopoverTemplate: `
      <div style="padding:10px;">
        <h3 style="margin:0;color:#722ed1;font-size:16px;">\${marker.title}</h3>
        <p style="margin:5px 0;font-size:13px;">\${marker.label}</p>
        <div style="margin-top:10px;font-size:12px;color:#666;">
          <p>ID: \${marker.data.id}</p>
          <p>位置: \${marker.position[0].toFixed(6)}, \${marker.position[1].toFixed(6)}</p>
        </div>
      </div>
    `
  }
]);
const currentMarker = ref(null);

// 监听地图类型变化
watch(mapType, () => {
  // 修改key值，强制重新渲染地图组件
  mapKey.value += 1;
  drawnShapes.value = [];
  selectedShape.value = null;
  currentDrawing.value = "";
});

// 地图加载完成事件
const onMapLoaded = (map) => {
  console.log("地图加载完成", map);
  ElMessage.success("地图加载完成");
};

// 标记点点击事件
const onMarkerClick = (marker) => {
  currentMarker.value = marker;
  // 显示新创建的标记点数据
  markerData.value = {
    description: "onMarkerClick新创建的标记点",
    marker: {
      position: [Number(marker.position[0].toFixed(6)), Number(marker.position[1].toFixed(6))],
      title: marker.title,
      id: marker.markerId,
    },
  };
  console.log("标记点点击", marker);
  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }
};

// 地图点击事件
const onMapClick = (event) => {
  console.log("地图点击", event);
};

// 缩放级别变化事件
const onZoomChanged = (zoom) => {
  zoomLevel.value = zoom;
  console.log("缩放级别变化", zoom);
};

// 中心点变化事件
const onCenterChanged = (center) => {
  mapCenter.value = center;
  console.log("中心点变化", center);
};

// 标记点创建事件
const onMarkerCreated = (marker) => {
  console.log("标记点创建", marker);
  // 将新创建的标记添加到标记数组中
  markers.value.push(marker);

  // 显示新创建的标记点数据
  markerData.value = {
    description: "onMarkerCreated新创建的标记点",
    marker: {
      position: [Number(marker.position[0].toFixed(6)), Number(marker.position[1].toFixed(6))],
      title: marker.title,
      id: marker.data?.id,
    },
  };

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  ElMessage.success("标记点创建成功");
};

// 添加随机标记
const addRandomMarker = () => {
  // 在当前中心点附近随机生成坐标
  const randomLng = mapCenter.value[0] + (Math.random() - 0.5) * 0.1;
  const randomLat = mapCenter.value[1] + (Math.random() - 0.5) * 0.1;

  // 随机决定弹窗类型
  const randomPopoverType = Math.floor(Math.random() * 3); // 0: 无弹窗, 1: 悬停弹窗, 2: 点击弹窗, 3: 两者都有

  const newMarker = {
    position: [randomLng, randomLat],
    title: `随机标记 ${markers.value.length + 1}`,
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
    data: { id: `RANDOM_${Date.now()}` },
    size: [16, 25],
    hoverPopover: randomPopoverType === 1 || randomPopoverType === 3,
    clickPopover: true,
    hoverPopoverTemplate: `<div style="padding:5px;"><p>\${marker.title}</p></div>`,
    clickPopoverTemplate: `
      <div style="padding:8px;">
        <h3 style="margin:0;color:#f5222d;font-size:14px;">\${marker.title}</h3>
        <p style="margin:5px 0;font-size:12px;">随机位置: \${marker.position[0].toFixed(6)}, \${marker.position[1].toFixed(6)}</p>
        <div style="margin-top:8px;font-size:12px;color:#999;">ID: \${marker.data.id}</div>
      </div>
    `
  };

  markers.value.push(newMarker);

  // 显示新标记点数据
  markerData.value = {
    description: "新添加的随机标记点",
    marker: {
      position: [Number(randomLng.toFixed(6)), Number(randomLat.toFixed(6))],
      title: newMarker.title,
      id: newMarker.data.id,
      popoverType: randomPopoverType === 0 ? "无弹窗" :
        randomPopoverType === 1 ? "悬停弹窗" :
          randomPopoverType === 2 ? "点击弹窗" : "悬停+点击弹窗"
    }
  };

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  ElMessage.success("已添加随机标记");
};

// 清除所有标记
const clearMarkers = () => {
  markers.value = [];
  currentMarker.value = null;

  // 清空数据面板
  markerData.value = {
    description: "标记点操作",
    action: "已清除所有标记点",
  };

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  ElMessage.success("已清除所有标记");
};

// 恢复默认标记
const restoreDefaultMarkers = () => {
  markers.value = [...defaultMarkers];
  currentMarker.value = null;

  // 显示默认标记点数据
  markerData.value = {
    description: "已恢复默认标记点",
    count: defaultMarkers.length,
    markers: defaultMarkers.map((marker, index) => {
      return {
        id: index + 1,
        position: [Number(marker.position[0].toFixed(6)), Number(marker.position[1].toFixed(6))],
        title: marker.title,
        dataId: marker.data?.id,
      };
    }),
  };

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  ElMessage.success("已恢复默认标记");
};

// 开始绘制图形
const startDrawing = (type) => {
  if (mapRef.value) {
    currentDrawing.value = type;
    mapRef.value.startDrawing(type);
    ElMessage.info(`开始绘制${shapeTypeNames[type]}`);
  }
};

// 停止绘制
const stopDrawing = () => {
  if (mapRef.value) {
    mapRef.value.stopDrawing();
    currentDrawing.value = "";
    ElMessage.info("已停止绘制");
  }
};

// 图形创建事件
const onShapeCreated = (shape) => {
  console.log("图形创建", shape);
  drawnShapes.value.push(shape);
  selectedShape.value = shape;
  currentDrawing.value = "";

  // 在数据面板中显示创建的图形信息
  markerData.value = {
    description: "创建的图形信息",
    type: shapeTypeNames[shape.type] || shape.type,
    id: shape.id,
    properties: {},
  };

  // 根据图形类型添加不同的属性信息
  if (shape.type === "circle") {
    markerData.value.properties.center = [Number(shape.path[0][0].toFixed(6)), Number(shape.path[0][1].toFixed(6))];
    markerData.value.properties.radius = Number(shape.radius.toFixed(2));
  } else {
    markerData.value.properties.points = shape.path.map((point) => [Number(point[0].toFixed(6)), Number(point[1].toFixed(6))]);
  }

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  ElMessage.success(`${shapeTypeNames[shape.type]}创建成功`);
};

// 图形点击事件
const onShapeClick = (event) => {
  console.log("图形点击", event);
  selectedShape.value = event.shape;

  // 在数据面板中显示点击的图形信息
  markerData.value = {
    description: "点击的图形信息",
    type: shapeTypeNames[event.shape.type] || event.shape.type,
    id: event.shape.id,
    clickPosition: [Number(event.position[0].toFixed(6)), Number(event.position[1].toFixed(6))],
    properties: {},
  };

  // 根据图形类型添加不同的属性信息
  if (event.shape.type === "circle") {
    markerData.value.properties.center = [Number(event.shape.path[0][0].toFixed(6)), Number(event.shape.path[0][1].toFixed(6))];
    markerData.value.properties.radius = Number(event.shape.radius.toFixed(2));
  } else {
    markerData.value.properties.points = event.shape.path.map((point) => [Number(point[0].toFixed(6)), Number(point[1].toFixed(6))]);
  }

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }
};

// 图形删除事件
const onShapeDeleted = (shapeId) => {
  console.log("图形删除", shapeId);
  drawnShapes.value = drawnShapes.value.filter((shape) => shape.id !== shapeId);
  if (selectedShape.value && selectedShape.value.id === shapeId) {
    selectedShape.value = null;
  }
  ElMessage.success("图形已删除");
};

// 删除图形
const removeShape = (shapeId) => {
  if (mapRef.value) {
    mapRef.value.removeShape(shapeId);
    drawnShapes.value = drawnShapes.value.filter((shape) => shape.id !== shapeId);
    if (selectedShape.value && selectedShape.value.id === shapeId) {
      selectedShape.value = null;
    }
    ElMessage.success("图形已删除");
  }
};

// 获取所有标记点
const getAllMarkers = () => {
  if (mapRef.value) {
    return mapRef.value.getAllMarkers();
  }
  return markers.value;
};

// 显示所有标记点信息
const showAllMarkers = () => {
  const allMarkers = getAllMarkers();
  const count = allMarkers.length;

  if (count === 0) {
    ElMessage.warning("地图上没有标记点");
    return;
  }

  // 清空并设置加载状态
  markerData.value = [];
  isLoadingMarkers.value = true;

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  setTimeout(() => {
    // 将标记点信息格式化
    markerData.value = {
      description: "地图上的所有标记点",
      count: count,
      markers: allMarkers.map((marker, index) => {
        return {
          id: index + 1,
          position: [Number(marker.position[0].toFixed(6)), Number(marker.position[1].toFixed(6))],
          title: marker.title || `标记点${index + 1}`,
          data: marker.data || {},
        };
      }),
    };

    isLoadingMarkers.value = false;

    // 显示提示
    ElMessage.success(`地图上共有 ${count} 个标记点`);
  }, 300);
};

// 清除所有图形
const clearShapes = () => {
  if (mapRef.value) {
    mapRef.value.clearShapes();
    drawnShapes.value = [];
    selectedShape.value = null;

    // 在数据面板中显示清除图形的信息
    markerData.value = {
      description: "图形操作",
      action: "已清除所有图形",
    };

    // 自动展开数据面板
    if (!showMarkerPanel.value) {
      toggleMarkerPanel();
    }

    ElMessage.success("已清除所有图形");
  }
};

// 播放轨迹动画
const startTrackAnimation = () => {
  if (mapRef.value && mapType.value === "amap") {
    // 创建轨迹路径（围绕当前中心点）
    const center = mapCenter.value;
    const radius = 0.02;
    const points = [];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const lng = center[0] + Math.cos(angle) * radius;
      const lat = center[1] + Math.sin(angle) * radius;
      points.push([lng, lat]);
    }

    // 添加起点和终点
    points.push(points[0]);

    // 设置轨迹动画选项
    const options = {
      icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
      iconSize: [25, 34],
      duration: 8000,
      loopCount: 1,
      lineColor: "#1890ff",
      lineWidth: 4,
      showTrack: true,
      showDirection: true,
      autoFit: true,
    };

    // 启动轨迹动画
    mapRef.value.startTrackAnimation(points, options);

    // 在数据面板中显示轨迹点信息
    markerData.value = {
      description: "轨迹动画信息",
      count: points.length,
      center: {
        lng: Number(center[0].toFixed(6)),
        lat: Number(center[1].toFixed(6)),
      },
      radius: radius * 111000, // 粗略转换为米
      duration: options.duration,
      points: points.slice(0, 5).map((point, index) => {
        return {
          id: index + 1,
          position: [Number(point[0].toFixed(6)), Number(point[1].toFixed(6))],
        };
      }),
      note: "仅显示前5个轨迹点...",
    };

    // 自动展开数据面板
    if (!showMarkerPanel.value) {
      toggleMarkerPanel();
    }

    ElMessage.success("轨迹动画开始播放");
  } else {
    ElMessage.warning("轨迹动画仅支持高德地图");
  }
};

// 格式化图形坐标
const formatShapeCoordinates = (shape) => {
  if (!shape) return "";

  if (shape.type === "circle") {
    return `中心点: [${shape.path[0][0].toFixed(6)}, ${shape.path[0][1].toFixed(6)}]\n半径: ${shape.radius.toFixed(2)}米`;
  } else {
    let result = "";
    shape.path.forEach((point, index) => {
      result += `点${index + 1}: [${point[0].toFixed(6)}, ${point[1].toFixed(6)}]\n`;
    });
    return result;
  }
};

// 生成代码示例
const codeExample = computed(() => {
  const toolsOptionsStr = Object.entries(toolsOptions.value)
    .filter(([key, value]) => value)
    .map(([key]) => key)
    .join(", ");

  const clusterOptionsStr = "";

  return `<template>
  <ScMap
    type="${mapType.value}"
    api-key="${apiKey.value[mapType.value]}"
    :center="[${mapCenter.value[0]}, ${mapCenter.value[1]}]"
    :zoom="${zoomLevel.value}"
    :markers="markers"
    height="${height.value}"
    view-type="${viewType.value}"
    :drawing-control="${drawingControl.value}"
    :tools-options="{
      ${toolsOptionsStr.split(", ").map(tool => `${tool}: true`).join(",\n      ")}
    }"
    tools-position="${toolsPosition.value}"
    ${toolsCollapsed.value ? ':tools-collapsed="true"' : ""}
    ${draggable.value ? '' : ':draggable="false"'}
    ${scrollWheel.value ? '' : ':scroll-wheel="false"'}
    @map-loaded="onMapLoaded"
    @marker-click="onMarkerClick"
    @map-click="onMapClick"
    @shape-created="onShapeCreated"
    @shape-click="onShapeClick"
    @shape-deleted="onShapeDeleted"
    @zoom-changed="onZoomChanged"
    @center-changed="onCenterChanged"
    @marker-created="onMarkerCreated"
    @cluster-click="onClusterClick"
  />
</template>`;
});

// 标记点数据面板
const showMarkerPanel = ref(false);
const markerData = ref([]);
const isLoadingMarkers = ref(false);

// 切换标记点数据面板显示/隐藏
const toggleMarkerPanel = () => {
  showMarkerPanel.value = !showMarkerPanel.value;
};

// 显示地图可视区域的四个角坐标
const showViewBounds = () => {
  if (!mapRef.value) {
    ElMessage.warning("地图组件未初始化");
    return;
  }

  const bounds = mapRef.value.getVisibleBounds();
  if (!bounds) {
    ElMessage.warning("获取可视区域边界失败");
    return;
  }

  // 清空并设置加载状态
  markerData.value = [];
  isLoadingMarkers.value = true;

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  setTimeout(() => {
    // 格式化坐标数据，便于查看
    const formattedBounds = {
      description: "当前地图可视区域边界坐标",
      northWest: {
        lng: Number(bounds[0][0].toFixed(6)),
        lat: Number(bounds[0][1].toFixed(6)),
      },
      northEast: {
        lng: Number(bounds[1][0].toFixed(6)),
        lat: Number(bounds[1][1].toFixed(6)),
      },
      southEast: {
        lng: Number(bounds[2][0].toFixed(6)),
        lat: Number(bounds[2][1].toFixed(6)),
      },
      southWest: {
        lng: Number(bounds[3][0].toFixed(6)),
        lat: Number(bounds[3][1].toFixed(6)),
      },
      center: {
        lng: Number(((bounds[0][0] + bounds[2][0]) / 2).toFixed(6)),
        lat: Number(((bounds[0][1] + bounds[2][1]) / 2).toFixed(6)),
      },
    };

    // 更新数据
    markerData.value = formattedBounds;
    isLoadingMarkers.value = false;

    // 显示提示
    ElMessage.success("已获取地图可视区域坐标");
  }, 300);
};

// 获取可视范围内标记点
const getVisibleMarkers = () => {
  if (!mapRef.value) {
    ElMessage.warning("地图组件未初始化");
    return;
  }

  // 清空并设置加载状态
  markerData.value = [];
  isLoadingMarkers.value = true;

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  setTimeout(() => {
    try {
      // 调用地图组件的方法获取可视范围内的标记点
      const visibleMarkers = mapRef.value.getVisibleMarkers();
      const count = visibleMarkers.length;

      if (count === 0) {
        markerData.value = {
          description: "可视范围内没有标记点",
          count: 0,
        };
        ElMessage.warning("可视范围内没有标记点");
      } else {
        // 将标记点信息格式化
        markerData.value = {
          description: "可视范围内的标记点",
          count: count,
          markers: visibleMarkers.map((marker, index) => {
            return {
              id: index + 1,
              position: [Number(marker.position[0].toFixed(6)), Number(marker.position[1].toFixed(6))],
              title: marker.title || `标记点${index + 1}`,
              data: marker.data || {},
            };
          }),
        };

        // 显示提示
        ElMessage.success(`可视范围内共有 ${count} 个标记点`);
      }
    } catch (error) {
      console.error("获取可视范围内标记点失败:", error);
      markerData.value = {
        description: "获取可视范围内标记点失败",
        error: error.message,
      };
      ElMessage.error("获取可视范围内标记点失败");
    } finally {
      isLoadingMarkers.value = false;
    }
  }, 300);
};

// 添加聚合点击事件处理函数
const onClusterClick = (event) => {
  console.log("聚合点击事件", event);

  // 在数据面板中显示聚合点信息
  markerData.value = {
    description: "聚合点信息",
    position: [Number(event.position[0].toFixed(6)), Number(event.position[1].toFixed(6))],
    count: event.count,
    totalWeight: event.totalWeight,
    markers: event.markers.slice(0, 5).map((marker, index) => {
      return {
        id: index + 1,
        position: marker.position ? [
          Number(marker.position[0].toFixed(6)),
          Number(marker.position[1].toFixed(6))
        ] : "未知",
        title: marker.title || `标记点${index + 1}`,
        weight: marker.weight || 1,
        data: marker.data || {}
      };
    }),
    note: event.markers.length > 5 ? `仅显示前5个标记点，共${event.markers.length}个` : ""
  };

  // 自动展开数据面板
  if (!showMarkerPanel.value) {
    toggleMarkerPanel();
  }

  // 记录日志
  console.log(`聚合点被点击，包含${event.count}个标记点，位置: [${event.position[0].toFixed(6)}, ${event.position[1].toFixed(6)}]`);

  ElMessage.info(`点击了包含${event.count}个标记点的聚合点`);
};

const currentDrawing = ref("");
const drawnShapes = ref([]);
const selectedShape = ref(null);

// 生成随机经纬度
const randomPosition = (center, radius) => {
  const [lng, lat] = center;
  const lngRadius = radius / 111000 * Math.cos(lat * Math.PI / 180);
  const latRadius = radius / 111000;

  const randomLng = lng + (Math.random() * 2 - 1) * lngRadius;
  const randomLat = lat + (Math.random() * 2 - 1) * latRadius;

  return [randomLng, randomLat];
};

// 添加弹窗事件处理
const onHoverPopoverShow = (data) => {
  console.log("悬停弹窗显示:", data);
};

const onHoverPopoverHide = (data) => {
  console.log("悬停弹窗隐藏:", data);
};

const onClickPopoverShow = (data) => {
  console.log("点击弹窗显示:", data);
};

const onClickPopoverHide = (data) => {
  console.log("点击弹窗隐藏:", data);
  console.trace('点击弹窗隐藏');
};
</script>

<style scoped>
.sc-map-example {
  padding: 20px 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
  color: #909399;
  margin: 0;
}

.main-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  height: auto;
}

.map-section {
  flex: 3;
  min-width: 500px;
  display: flex;
  flex-direction: column;
}

.config-section {
  flex: 2;
  min-width: 300px;
  display: flex;
  flex-direction: column;
}

.config-scroll-container {
  height: 800px;
  overflow-y: auto;
  padding-right: 15px;
  padding-left: 5px;
  border-radius: 8px;
  background-color: rgba(250, 250, 250, 0.6);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.05);
}

/* 自定义滚动条样式 */
.config-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.config-scroll-container::-webkit-scrollbar-track {
  background: rgba(240, 240, 240, 0.5);
  border-radius: 10px;
}

.config-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.7);
  border-radius: 10px;
}

.config-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 180, 180, 0.9);
}

/* 确保表单元素在滚动容器中有适当的间距 */
.config-scroll-container .el-form {
  padding: 10px 5px;
}

h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #303133;
}

.preview-container {
  margin-bottom: 20px;
}

.w-100 {
  width: 100%;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-1 {
  margin-bottom: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.height-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
}

.center-coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.control-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tools-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.shape-info-label {
  font-weight: 500;
  font-size: 14px;
}

.custom-drawing-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cluster-param-control {
  margin-bottom: 12px;
}

.param-label {
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

.marker-data-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(235, 235, 235, 0.8);
}

.marker-data-panel.expanded {
  height: 400px;
}

.marker-data-panel:not(.expanded) {
  height: 42px;
}

.panel-header {
  padding: 10px 15px;
  background: rgba(245, 247, 250, 0.8);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  user-select: none;
}

.panel-header:hover {
  background: rgba(235, 242, 250, 0.9);
}

.panel-content {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
}

.json-content {
  background: rgba(248, 249, 250, 0.7);
  padding: 12px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  border: 1px solid #ebeef5;
}

.loading-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #909399;
}

.loading-data i {
  margin-right: 8px;
  font-size: 18px;
}

.code-example {
  margin-top: 20px;
}

@media (max-width: 1200px) {
  .main-container {
    flex-direction: column;
  }

  .map-section,
  .config-section {
    width: 100%;
  }
}
</style>
