<template>
  <div class="sc-map-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>地图组件 (ScMap)</h3>
          <p class="text-secondary">一个多功能地图组件，支持高德、百度、天地图等多种地图类型</p>
        </div>
      </template>

      <!-- 预览区域 -->
      <div class="preview-area">
        <h4>组件预览</h4>
        <div class="preview-container">
          <ScMap
            :key="mapKey"
            :type="mapType"
            :api-key="apiKey[mapType]"
            :center="mapCenter"
            :zoom="zoomLevel"
            :markers="markers"
            :height="height"
            :view-type="viewType"
            :drawing-control="drawingControl"
            :tools-options="toolsOptions"
            :tools-position="toolsPosition"
            :tools-collapsed="toolsCollapsed"
            :draggable="draggable"
            :scroll-wheel="scrollWheel"
            :enable-cluster="enableCluster"
            :cluster-options="clusterOptions"
            ref="mapRef"
            @map-loaded="onMapLoaded"
            @marker-click="onMarkerClick"
            @map-click="onMapClick"
            @shape-created="onShapeCreated"
            @shape-click="onShapeClick"
            @shape-deleted="onShapeDeleted"
            @zoom-changed="onZoomChanged"
            @center-changed="onCenterChanged"
          >
            <template #drawingTools v-if="drawingControl && showCustomTools">
              <div class="custom-drawing-tools">
                <el-button type="primary" size="small" @click="startDrawing('circle')"> <i class="el-icon-circle-plus"></i> 绘制圆形 </el-button>
                <el-button type="success" size="small" @click="startDrawing('polygon')"> <i class="el-icon-share"></i> 绘制多边形 </el-button>
                <el-button type="warning" size="small" @click="startDrawing('rectangle')"> <i class="el-icon-crop"></i> 绘制矩形 </el-button>
                <el-button type="danger" size="small" @click="clearShapes()"> <i class="el-icon-delete"></i> 清除图形 </el-button>
              </div>
            </template>
          </ScMap>

          <div class="action-buttons mt-4">
            <el-button-group>
              <el-button type="primary" @click="addRandomMarker">添加随机标记</el-button>
              <el-button type="danger" @click="clearMarkers">清除标记</el-button>
              <el-button type="success" @click="restoreDefaultMarkers">恢复默认标记</el-button>
              <el-button type="warning" @click="startTrackAnimation" v-if="mapType === 'amap'">播放轨迹</el-button>
            </el-button-group>
          </div>
        </div>
      </div>

      <!-- 配置面板 -->
      <div class="config-panel mt-4">
        <h4>配置选项</h4>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
              <el-form-item label="地图类型">
                <el-radio-group v-model="mapType">
                  <el-radio label="amap">高德地图</el-radio>
                  <el-radio label="bmap">百度地图</el-radio>
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

              <el-form-item label="标记点聚合">
                <div class="cluster-options">
                  <el-checkbox v-model="enableCluster">启用聚合</el-checkbox>
                  <div v-if="enableCluster" class="mt-2">
                    <div class="cluster-param-control">
                      <div class="param-label">聚合半径 (px)</div>
                      <el-slider v-model="clusterOptions.radius" :min="30" :max="200" :step="10" />
                    </div>
                    <div class="cluster-param-control">
                      <div class="param-label">最小聚合数量</div>
                      <el-slider v-model="clusterOptions.minClusterSize" :min="2" :max="10" :step="1" />
                    </div>
                    <div class="cluster-param-control">
                      <div class="param-label">最大聚合缩放级别</div>
                      <el-slider v-model="clusterOptions.maxZoom" :min="10" :max="19" :step="1" />
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
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
                    <el-checkbox v-model="toolsOptions.marker">标记点</el-checkbox>
                    <el-checkbox v-model="toolsOptions.clear">清除</el-checkbox>
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
          </el-col>
        </el-row>
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
const heightValue = ref(400);
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
  position: true,
});
const enableCluster = ref(false);
const clusterOptions = ref({
  radius: 80,
  minClusterSize: 2,
  gridSize: 60,
  maxZoom: 18,
});
const currentDrawing = ref("");
const drawnShapes = ref([]);
const selectedShape = ref(null);

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
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
    data: { id: "BJ001" },
  },
  {
    position: [116.326661, 39.897413],
    title: "北京西站",
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
    data: { id: "BJ002" },
  },
  {
    position: [116.383223, 39.939108],
    title: "北京动物园",
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png",
    data: { id: "BJ003" },
  },
];
const markers = ref([...defaultMarkers]);
const currentMarker = ref(null);

// 监听地图类型变化，重新加载地图
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
  console.log("标记点点击", marker);
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

// 添加随机标记
const addRandomMarker = () => {
  // 在当前中心点附近随机生成坐标
  const randomLng = mapCenter.value[0] + (Math.random() - 0.5) * 0.1;
  const randomLat = mapCenter.value[1] + (Math.random() - 0.5) * 0.1;

  const newMarker = {
    position: [randomLng, randomLat],
    title: `随机标记 ${markers.value.length + 1}`,
    icon: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
    data: { id: `RANDOM_${Date.now()}` },
  };

  markers.value.push(newMarker);
  ElMessage.success("已添加随机标记");
};

// 清除所有标记
const clearMarkers = () => {
  markers.value = [];
  currentMarker.value = null;
  ElMessage.success("已清除所有标记");
};

// 恢复默认标记
const restoreDefaultMarkers = () => {
  markers.value = [...defaultMarkers];
  currentMarker.value = null;
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
  ElMessage.success(`${shapeTypeNames[shape.type]}创建成功`);
};

// 图形点击事件
const onShapeClick = (event) => {
  console.log("图形点击", event);
  selectedShape.value = event.shape;
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

// 清除所有图形
const clearShapes = () => {
  if (mapRef.value) {
    mapRef.value.clearShapes();
    drawnShapes.value = [];
    selectedShape.value = null;
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
  const clusterOptionsStr = enableCluster.value ? `:cluster-options="{radius: ${clusterOptions.value.radius}, minClusterSize: ${clusterOptions.value.minClusterSize}, maxZoom: ${clusterOptions.value.maxZoom}}"` : "";

  // 工具栏配置字符串
  const toolsPositionStr = drawingControl.value ? `:tools-position="'${toolsPosition.value}'"` : "";
  const toolsCollapsedStr = drawingControl.value ? `:tools-collapsed="${toolsCollapsed.value}"` : "";

  return `<template>
  <ScMap
    type="${mapType.value}"
    api-key="YOUR_API_KEY_HERE"
    :center="[${mapCenter.value[0].toFixed(6)}, ${mapCenter.value[1].toFixed(6)}]"
    :zoom="${zoomLevel.value}"
    height="${height.value}"
    view-type="${viewType.value}"
    :draggable="${draggable.value}"
    :scroll-wheel="${scrollWheel.value}"
    ${drawingControl.value ? ':drawing-control="true"' : ""}
    ${toolsPositionStr}
    ${toolsCollapsedStr}
    ${enableCluster.value ? ':enable-cluster="true"' : ""}
    ${clusterOptionsStr}
    @map-loaded="onMapLoaded"
    @marker-click="onMarkerClick"
  /></template>`;
});
</script>

<style scoped>
.sc-map-example {
  padding: 20px 0;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
  color: #909399;
  margin: 0;
}

.preview-area,
.config-panel,
.code-example {
  margin-bottom: 20px;
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
</style>
