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
              :draggable="draggable" :scroll-wheel="scrollWheel"  ref="mapRef" @map-loaded="onMapLoaded"
              @marker-click="onMarkerClick" @map-click="onMapClick" @shape-created="onShapeCreated"
              @shape-click="onShapeClick" @shape-deleted="onShapeDeleted" @zoom-changed="onZoomChanged"
              @center-changed="onCenterChanged" @marker-created="onMarkerCreated" @cluster-click="onClusterClick"
              @hover-popover-show="onHoverPopoverShow" @hover-popover-hide="onHoverPopoverHide"
              @click-popover-show="onClickPopoverShow" @click-popover-hide="onClickPopoverHide"
              @marker-deleted="onMarkerDeleted">
            </ScMap>

            <div class="action-buttons mt-4">
              <el-button-group>
                <el-button type="primary" @click="addRandomMarker">添加随机标记</el-button>
                <el-button type="danger" @click="clearMarkers">清除标记</el-button>
                <el-button type="success" @click="restoreDefaultMarkers">恢复默认标记</el-button>
                <el-button type="info" @click="showAllMarkers">显示所有标记点</el-button>
                <el-button type="success" @click="showViewBounds">获取可视区域</el-button>
                <el-button type="primary" @click="getVisibleMarkers">获取可视范围内标记</el-button>
                <el-button type="primary" @click="drawJiaojiangBoundary">绘制椒江边界</el-button>
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
                    <el-checkbox v-model="toolsOptions.showMarkers" @change="toggleMarkersVisibility">显示标记</el-checkbox>
                    <el-checkbox v-model="toolsOptions.showShapes" @change="toggleShapesVisibility">显示图形</el-checkbox>
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
                </div>

                <div class="shape-info mt-2" v-if="drawnShapes.length > 0">
                  <div class="shape-info-label mb-1">已绘制图形 ({{ drawnShapes.length }})</div>
                  <el-button type="danger" size="small" @click="clearShapes">清除所有图形</el-button>
                </div>
              </el-form-item>

              <!-- 行程轨迹选项 -->
              <el-form-item label="行程轨迹">
                <el-collapse-transition>
                  <div class="journey-options-panel">
                    <div class="journey-options-header">
                      <el-button size="small" type="text" @click="toggleJourneyOptions">
                        {{ showJourneyOptions ? '收起选项' : '详细选项' }}
                        <i :class="showJourneyOptions ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                      </el-button>
                    </div>
                    
                    <div v-if="showJourneyOptions" class="journey-options">
                      <el-form-item label="轨迹线颜色" size="small">
                        <el-color-picker v-model="journeyOptions.strokeColor" show-alpha size="small"></el-color-picker>
                      </el-form-item>
                      <el-form-item label="轨迹线宽度" size="small">
                        <el-slider v-model="journeyOptions.strokeWeight" :min="1" :max="10" :step="1"></el-slider>
                      </el-form-item>
                      <div class="journey-checkbox-group">
                        <el-checkbox v-model="journeyOptions.showStartEndMarkers">显示起终点标记</el-checkbox>
                        <el-checkbox v-model="journeyOptions.showPointMarkers">显示途经点</el-checkbox>
                        <el-checkbox v-model="journeyOptions.animation">启用轨迹动画</el-checkbox>
                        <el-checkbox v-model="journeyOptions.animationAutoPlay">自动播放动画</el-checkbox>
                        <el-checkbox v-model="journeyOptions.autoFit">自动适应视图</el-checkbox>
                      </div>
                      <el-form-item v-if="journeyOptions.showPointMarkers" label="途经点间隔" size="small">
                        <el-slider v-model="journeyOptions.pointMarkersInterval" :min="1" :max="10" :step="1"></el-slider>
                      </el-form-item>
                      <el-form-item v-if="journeyOptions.animation" label="动画时长(秒)" size="small">
                        <el-slider v-model="journeyOptions.animationDurationInSeconds" :min="3" :max="30" :step="1"></el-slider>
                      </el-form-item>
                      <el-form-item v-if="journeyOptions.animationAutoPlay" label="循环次数" size="small">
                        <el-slider v-model="journeyOptions.loopCount" :min="0" :max="10" :step="1" :marks="{0: '无限', 1: '1次', 5: '5次', 10: '10次'}"></el-slider>
                        <div class="loop-count-hint">{{ journeyOptions.loopCount === 0 ? '无限循环' : `循环${journeyOptions.loopCount}次` }}</div>
                      </el-form-item>
                      <el-form-item v-if="journeyOptions.animationAutoPlay" label="实时跟踪" size="small">
                        <el-checkbox v-model="journeyOptions.realTimeTracking"></el-checkbox>
                      </el-form-item>
                    </div>
                    
                    <div class="journey-buttons mt-2">
                      <el-button-group>
                        <el-button size="small" type="primary" @click="createJourneyTrack">创建轨迹</el-button>
                        <el-button size="small" type="success" @click="generateRandomTrack" :disabled="!!journeyTrackInstance">随机轨迹</el-button>
                        <el-button size="small" type="danger" @click="clearJourneyTrack" v-if="journeyTrackInstance">清除轨迹</el-button>
                      </el-button-group>
                    </div>
                    
                    <div class="journey-animation-controls mt-2" v-if="journeyTrackInstance && journeyOptions.animation">
                      <el-button size="small" type="primary" icon="el-icon-video-pause" @click="pauseJourneyAnimation" v-if="!isJourneyAnimationPaused">暂停</el-button>
                      <el-button size="small" type="success" icon="el-icon-video-play" @click="resumeJourneyAnimation" v-else>继续</el-button>
                      <el-button size="small" type="danger" icon="el-icon-close" @click="stopJourneyAnimation">停止</el-button>
                    </div>
                  </div>
                </el-collapse-transition>
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
import { ref, computed, watch, onMounted, nextTick } from "vue";
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
  showMarkers: true,
  showShapes: true,
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

onMounted(() => {
  nextTick(() => {
    console.log("地图实例", mapRef.value);
    /**
     * {
  "description": "创建的图形信息",
  "type": "圆形",
  "id": "shape_1745052041418_152",
  "properties": {
    "center": [
      116.249456,
      39.945563
    ],
    "radius": 5182.38
  }
}
     */
  });
});
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
    clickPopover: true,  // 同时启用点击弹窗
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
  
  // 延迟添加默认图形，确保地图已完全初始化
  setTimeout(() => {
    if (mapRef.value) {
      try {
        // 添加第一个圆形 - 蓝色
        const circle1 = mapRef.value.addCircle(
          [mapCenter.value[0] - 0.02, mapCenter.value[1] + 0.02], // 中心点坐标 - 左上角
          1000, // 半径（米）
          { 
            strokeColor: '#1890ff', 
            strokeWeight: 2, 
            strokeOpacity: 0.8,
            fillColor: '#1890ff', 
            fillOpacity: 0.2
          },
          'demo-circle-1' // 图形ID
        );
        
        // 添加第二个圆形 - 绿色
        const circle2 = mapRef.value.addCircle(
          [mapCenter.value[0] + 0.02, mapCenter.value[1] + 0.02], // 中心点坐标 - 右上角
          800, // 半径（米）
          { 
            strokeColor: '#52c41a', 
            strokeWeight: 2, 
            strokeOpacity: 0.8,
            fillColor: '#52c41a', 
            fillOpacity: 0.2
          },
          'demo-circle-2' // 图形ID
        );
        
        // 添加一个矩形 - 橙色
        const rectangle = mapRef.value.addRectangle(
          [
            [mapCenter.value[0] - 0.02, mapCenter.value[1] - 0.02], // 左下角
            [mapCenter.value[0] + 0.02, mapCenter.value[1] - 0.01]  // 右上角
          ],
          { 
            strokeColor: '#faad14', 
            strokeWeight: 2, 
            strokeOpacity: 0.8,
            fillColor: '#faad14', 
            fillOpacity: 0.2
          },
          'demo-rectangle-1' // 图形ID
        );
        
        console.log("已添加演示图形：2个圆形和1个矩形");
        
        // 显示图形数据
        markerData.value = {
          description: "地图初始化默认图形",
          shapes: [
            {
              id: "demo-circle-1",
              type: "circle",
              center: [mapCenter.value[0] - 0.02, mapCenter.value[1] + 0.02],
              radius: 1000,
              color: "#1890ff"
            },
            {
              id: "demo-circle-2",
              type: "circle",
              center: [mapCenter.value[0] + 0.02, mapCenter.value[1] + 0.02],
              radius: 800,
              color: "#52c41a"
            },
            {
              id: "demo-rectangle-1",
              type: "rectangle",
              bounds: [
                [mapCenter.value[0] - 0.02, mapCenter.value[1] - 0.02],
                [mapCenter.value[0] + 0.02, mapCenter.value[1] - 0.01]
              ],
              color: "#faad14"
            }
          ]
        };
        
        // 自动展开数据面板
        if (!showMarkerPanel.value) {
          toggleMarkerPanel();
        }
      } catch (error) {
        console.error("添加默认图形失败:", error);
        ElMessage.error("添加默认图形失败");
      }
    }
  }, 500);
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

  // 检查标记标签显示状态
  const shouldShowLabels = !!document.querySelector('.sc-map-marker-label');

  // 如果有标签并且当前显示标签，则为标记点添加标签
  if (marker.label && shouldShowLabels) {
    try {
      const label = new window.T.Label({
        text: marker.label,
        position: marker.position,
        offset: new window.T.Point(20, -10)
      });

      mapRef.value.addOverLay(label);
      currentMarker.value.__labelInstance = label;
    } catch (err) {
      console.error('创建标记标签时出错:', err);
    }
  }
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
    clickPopover: true,
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

  // 检查标记标签显示状态
  const shouldShowLabels = !!document.querySelector('.sc-map-marker-label');

  // 如果有标签并且当前显示标签，则为标记点添加标签
  if (newMarker.label && shouldShowLabels) {
    try {
      const label = new window.T.Label({
        text: newMarker.label,
        position: newMarker.position,
        offset: new window.T.Point(20, -10)
      });

      mapRef.value.addOverLay(label);
      newMarker.__labelInstance = label;
    } catch (err) {
      console.error('创建标记标签时出错:', err);
    }
  }
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

// 开始轨迹动画
const startTrackAnimation = () => {
  if (mapRef.value) {
    // 如果当前中心点是北京，先移动到椒江区域以便于演示
    if (centerLocation.value === "beijing") {
      mapRef.value.setCenter([121.480, 28.640]);
      mapRef.value.setZoom(13);
      // 延迟执行轨迹动画，等待地图完成移动
      setTimeout(() => {
        playTrackAnimationInCurrentView();
      }, 500);
    } else {
      // 直接播放轨迹
      playTrackAnimationInCurrentView();
    }
  } else {
    ElMessage.warning("地图组件未初始化");
  }
};

// 在当前视图中播放轨迹动画
const playTrackAnimationInCurrentView = () => {
  if (!mapRef.value) {
    ElMessage.warning("地图组件未初始化");
    return;
  }
  
  const center = mapRef.value.getCenter ? mapRef.value.getCenter() : mapCenter.value;
  
  try {
    // 创建椒江区域周边的模拟轨迹路径
    const points = [
      // 起点：椒江区中心
      [121.480, 28.640],
      // 向东北方向前进
      [121.490, 28.645],
      [121.498, 28.652],
      [121.505, 28.660],
      // 向东南方向转弯
      [121.510, 28.655],
      [121.515, 28.648],
      [121.518, 28.639],
      // 向南方向
      [121.515, 28.630],
      [121.508, 28.625],
      // 向西南方向
      [121.500, 28.620],
      [121.490, 28.615],
      // 向西
      [121.475, 28.618],
      [121.465, 28.622],
      // 向西北方向
      [121.460, 28.630],
      [121.465, 28.638],
      // 回到接近起点
      [121.472, 28.638],
      [121.480, 28.640]
    ];

    // 设置动画选项
    const options = {
      duration: animationDuration.value,
      loopCount: animationLoopCount.value,
      autoRotation: true,
      icon: animationIconUrl.value, // 自定义图标
      iconSize: [30, 30], // 图标大小
      passedLineColor: "#FF8800" // 已经走过的路径颜色为橙色
    };

    // 启动轨迹动画
    const result = mapRef.value.startTrackAnimation(points, options);
    
    if (!result) {
      ElMessage.error("启动轨迹动画失败，请检查地图组件是否支持该功能");
      return;
    }
    
    // 更新状态
    isTrackAnimationPlaying.value = true;
    isTrackAnimationPaused.value = false;

    // 在数据面板中显示轨迹点信息
    markerData.value = {
      description: "轨迹动画信息",
      count: points.length,
      center: {
        lng: Number(center[0].toFixed(6)),
        lat: Number(center[1].toFixed(6)),
      },
      duration: options.duration,
      loopCount: options.loopCount === Infinity ? "无限循环" : `${options.loopCount}次`,
      points: points.slice(0, 5).map((point, index) => {
        return {
          id: index + 1,
          position: [Number(point[0].toFixed(6)), Number(point[1].toFixed(6))],
        };
      }),
      note: `显示${points.length}个轨迹点中的前5个...`,
    };

    // 自动展开数据面板
    if (!showMarkerPanel.value) {
      toggleMarkerPanel();
    }

    ElMessage.success("轨迹动画开始播放");
  } catch (error) {
    console.error("播放轨迹动画失败:", error);
    ElMessage.error("播放轨迹动画失败，发生错误");
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

// 根据当前配置生成代码
const codeExample = computed(() => {
  // 简单的版本，避免模板字符串嵌套问题
  return `<template>
  <ScMap
    type="${mapType.value}"
    api-key="${apiKey.value[mapType.value]}"
    :center="[${mapCenter.value[0]}, ${mapCenter.value[1]}]"
    :zoom="${zoomLevel.value}"
    height="${height.value}"
    view-type="${viewType.value}"
    :script-config="scriptConfig"
    @map-loaded="onMapLoaded"
    @marker-click="onMarkerClick">
  </ScMap>
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

// 切换标记点显示/隐藏
const toggleMarkersVisibility = () => {
  if (mapRef.value) {
    // 根据选项的值切换标记点的可见性
    mapRef.value.toggleMarkers(toolsOptions.value.showMarkers);
    ElMessage.success(`${toolsOptions.value.showMarkers ? '显示' : '隐藏'}所有标记点`);
  }
};

// 切换图形显示/隐藏
const toggleShapesVisibility = () => {
  if (mapRef.value) {
    // 根据选项的值切换图形的可见性
    mapRef.value.toggleShapes(toolsOptions.value.showShapes);
    ElMessage.success(`${toolsOptions.value.showShapes ? '显示' : '隐藏'}所有图形`);
  }
};

// 标记点删除事件
const onMarkerDeleted = (event) => {
  console.log("标记点删除事件", event);
};

// 椒江区边界坐标数据 (简化版)
const jiaojiangBoundaryCoords = [
  [121.442624, 28.681966],
  [121.461807, 28.689873],
  [121.479145, 28.684521],
  [121.491462, 28.673816],
  [121.503265, 28.661657],
  [121.515411, 28.648412],
  [121.527213, 28.635082],
  [121.533607, 28.620613],
  [121.528458, 28.606143],
  [121.513481, 28.594414],
  [121.492157, 28.587824],
  [121.476322, 28.592316],
  [121.461029, 28.601300],
  [121.449226, 28.614312],
  [121.441040, 28.629237],
  [121.436920, 28.646298],
  [121.438904, 28.664227],
  [121.442624, 28.681966]
];

// 绘制椒江边界
const drawJiaojiangBoundary = () => {
  if (!mapRef.value) {
    ElMessage.warning("地图组件未初始化");
    return;
  }
  
  try {
    // 将中心点设置到椒江区域
    mapRef.value.setCenter([121.480, 28.640]);
    mapRef.value.setZoom(12);
    
    console.log("开始绘制椒江边界...");
    
    // 绘制多边形边界，只有边框没有填充
    const polygonId = mapRef.value.addPolygon(
      jiaojiangBoundaryCoords,
      {
        strokeColor: '#f5222d',  // 红色边框
        strokeWeight: 3,         // 边框宽度
        strokeOpacity: 0.9,      // 边框不透明度
        fillColor: '#f5222d',    // 填充颜色（实际上不会显示）
        fillOpacity: 0           // 关键设置：填充完全透明
      },
      'jiaojiang-boundary'
    );
    
    console.log("椒江边界绘制结果:", polygonId);
    
    // 显示提示信息
    ElMessage.success("已绘制椒江区边界");
    
    // 更新显示数据
    markerData.value = {
      description: "已绘制椒江区边界",
      id: polygonId,
      type: "polygon",
      boundary: "椒江区",
      points: jiaojiangBoundaryCoords.length,
      coordinates: jiaojiangBoundaryCoords,
      style: {
        strokeColor: '#f5222d',
        strokeWeight: 3,
        strokeOpacity: 0.9,
        fillOpacity: 0
      }
    };
    
    // 显示数据面板
    showMarkerPanel.value = true;
    
  } catch (error) {
    console.error("绘制椒江边界失败:", error);
    ElMessage.error("绘制椒江边界失败");
  }
};

// 动画控制状态
const isTrackAnimationPlaying = ref(false);
const isTrackAnimationPaused = ref(false);

// 行程轨迹功能相关状态
const showJourneyOptions = ref(true); // 是否显示行程轨迹详细选项
const journeyOptions = ref({
  strokeColor: '#1890FF',
  strokeWeight: 5,
  strokeOpacity: 0.8,
  strokeStyle: 'solid',
  showStartEndMarkers: true,
  showPointMarkers: false,
  pointMarkersInterval: 3,
  animation: true, // 修改为true，默认启用动画
  animationDurationInSeconds: 10,
  loopCount: 1,  // 新增循环次数属性
  startTitle: '起点',
  endTitle: '终点',
  autoFit: true,
  realTimeTracking: false, // 新增实时跟踪选项
  animationAutoPlay: true, // 添加自动播放属性
  ensureVisible: true, // 确保所有轨迹点在视图内
  fitPadding: [100, 100, 100, 100], // 调整视图时的内边距
});
const journeyTrackInstance = ref(null);
const isJourneyAnimationPaused = ref(false);



// 创建行程轨迹
const createJourneyTrack = (customPoints = null) => {
  if (!mapRef.value) {
    ElMessage.warning('地图组件未初始化');
    return;
  }
  
  // 记录当前中心点，以便在出现问题时恢复
  let originalCenter = null;
  try {
    if (mapRef.value.getCenter && typeof mapRef.value.getCenter === 'function') {
      const center = mapRef.value.getCenter();
      if (center && Array.isArray(center) && center.length === 2 && 
          !isNaN(center[0]) && !isNaN(center[1]) && 
          !(center[0] === 0 && center[1] === 0)) {
        originalCenter = center;
        console.log('创建轨迹前记录地图中心点:', originalCenter);
      }
    }
  } catch (e) {
    console.warn('获取地图中心点失败:', e);
  }
  
  // 先清除之前可能存在的轨迹
  if (journeyTrackInstance.value) {
    journeyTrackInstance.value.clear();
    journeyTrackInstance.value = null;
  }
  
  // 使用示例点或自定义点
  const points = customPoints || demoJourneyPoints;
  
  // 转换journeyOptions中的值
  const options = {
    strokeColor: journeyOptions.value.strokeColor,
    strokeWeight: journeyOptions.value.strokeWeight,
    showStartEndMarkers: journeyOptions.value.showStartEndMarkers,
    showPointMarkers: journeyOptions.value.showPointMarkers,
    pointMarkersInterval: journeyOptions.value.pointMarkersInterval,
    animation: journeyOptions.value.animation,
    animationDuration: journeyOptions.value.animationDurationInSeconds * 1000, // 转换为毫秒
    followMarker: journeyOptions.value.realTimeTracking,
    loopCount: journeyOptions.value.loopCount,
    animationAutoPlay: journeyOptions.value.animationAutoPlay, // 添加自动播放选项
    ensureVisible: journeyOptions.value.ensureVisible, // 确保轨迹在视图中
    fitPadding: journeyOptions.value.fitPadding, // 视图适配内边距
    correctMarkerPosition: true, // 启用轨迹点位修正，确保点位在轨迹线上
    passedLineColor: '#FF8800', // 橙色，确保与轨迹路线形成鲜明对比
    useExactPathPoints: true, // 使用精确的路径点
  };
  
  // 创建轨迹
  console.log('创建轨迹，共', points.length, '个点，选项:', options);
  // 添加详细日志
  console.log('轨迹动画参数:', {
    animation: options.animation, // 是否启用动画
    animationAutoPlay: options.animationAutoPlay, // 是否自动播放
    animationDuration: options.animationDuration, // 动画持续时间
    loopCount: options.loopCount // 循环次数
  });
  
  const trackInstance = mapRef.value.createJourneyTrack(points, options);
  
  if (trackInstance) {
    journeyTrackInstance.value = trackInstance;
    isJourneyAnimationPaused.value = false;
    
    // 自动开启数据面板显示轨迹信息
    markerData.value = {
      description: '行程轨迹信息',
      type: '轨迹路线',
      pointCount: points.length,
      journeyOptions: options,
      points: points.map((p, i) => ({
        index: i,
        position: p,
        type: i === 0 ? '起点' : (i === points.length - 1 ? '终点' : '途经点')
      }))
    };
    
    // 显示数据面板
    showMarkerPanel.value = true;
    
    ElMessage.success('行程轨迹创建成功');
    
    // 安全检查：防止地图中心点被错误地设置为[0,0]
    if (originalCenter) {
      setTimeout(() => {
        try {
          if (mapRef.value && mapRef.value.getCenter) {
            const currentCenter = mapRef.value.getCenter();
            if (currentCenter && Array.isArray(currentCenter) && 
                currentCenter.length === 2 && 
                currentCenter[0] === 0 && currentCenter[1] === 0) {
              console.warn('检测到地图中心点被设置为[0,0]，恢复到原始位置');
              mapRef.value.setCenter(originalCenter);
            }
          }
        } catch (e) {
          console.warn('中心点安全检查失败:', e);
        }
      }, 100);
    }
  } else {
    ElMessage.error('行程轨迹创建失败');
  }
};

// 清除行程轨迹
const clearJourneyTrack = () => {
  // 记录当前中心点，以便在出现问题时恢复
  let originalCenter = null;
  try {
    if (mapRef.value && mapRef.value.getCenter && typeof mapRef.value.getCenter === 'function') {
      const center = mapRef.value.getCenter();
      if (center && Array.isArray(center) && center.length === 2 && 
          !isNaN(center[0]) && !isNaN(center[1]) && 
          !(center[0] === 0 && center[1] === 0)) {
        originalCenter = center;
        console.log('清除轨迹前记录地图中心点:', originalCenter);
      }
    }
  } catch (e) {
    console.warn('获取地图中心点失败:', e);
  }
  
  if (journeyTrackInstance.value) {
    // 清除轨迹
    journeyTrackInstance.value.clear();
    journeyTrackInstance.value = null;
    isJourneyAnimationPaused.value = false;
    
    // 重置数据面板
    markerData.value = {
      description: '行程轨迹已清除',
      timestamp: new Date().toISOString()
    };
    
    ElMessage.success('行程轨迹已清除');
    
    // 安全检查：防止地图中心点被错误地设置为[0,0]
    if (originalCenter) {
      setTimeout(() => {
        try {
          if (mapRef.value && mapRef.value.getCenter) {
            const currentCenter = mapRef.value.getCenter();
            if (currentCenter && Array.isArray(currentCenter) && 
                currentCenter.length === 2 && 
                currentCenter[0] === 0 && currentCenter[1] === 0) {
              console.warn('检测到地图中心点被设置为[0,0]，恢复到原始位置');
              mapRef.value.setCenter(originalCenter);
            }
          }
        } catch (e) {
          console.warn('中心点安全检查失败:', e);
        }
      }, 100);
    }
  } else {
    ElMessage.warning('无轨迹可清除');
  }
};

// 暂停行程轨迹动画
const pauseJourneyAnimation = () => {
  if (journeyTrackInstance.value) {
    journeyTrackInstance.value.pause();
    isJourneyAnimationPaused.value = true;
    ElMessage.info('行程轨迹动画已暂停');
  }
};

// 恢复行程轨迹动画
const resumeJourneyAnimation = () => {
  if (journeyTrackInstance.value && isJourneyAnimationPaused.value) {
    journeyTrackInstance.value.play();
    isJourneyAnimationPaused.value = false;
    ElMessage.success('行程轨迹动画已继续');
  }
};

// 停止行程轨迹动画
const stopJourneyAnimation = () => {
  if (journeyTrackInstance.value) {
    journeyTrackInstance.value.stop();
    isJourneyAnimationPaused.value = false;
    ElMessage.warning('行程轨迹动画已停止');
  }
};

// 切换行程轨迹选项显示/隐藏
const toggleJourneyOptions = () => {
  showJourneyOptions.value = !showJourneyOptions.value;
};

// 生成随机轨迹
const generateRandomTrack = () => {
  if (!mapRef.value) {
    ElMessage.warning('地图组件未初始化');
    return;
  }
  
  // 获取当前地图中心
  let center = [121.480, 28.640]; // 默认中心点坐标，确保不是[0,0]
  
  // 尝试获取地图实例中心，并验证有效性
  if (mapRef.value.getCenter && typeof mapRef.value.getCenter === 'function') {
    const currentCenter = mapRef.value.getCenter();
    // 确保获取的中心点是有效的坐标
    if (currentCenter && 
        Array.isArray(currentCenter) && 
        currentCenter.length === 2 && 
        !isNaN(currentCenter[0]) && 
        !isNaN(currentCenter[1]) && 
        (currentCenter[0] !== 0 || currentCenter[1] !== 0)) { // 确保不是[0,0]点
      center = currentCenter;
    } else {
      console.warn('获取到无效的地图中心点，使用默认值', currentCenter);
    }
  } else if (Array.isArray(mapCenter.value) && 
             mapCenter.value.length === 2 && 
             !isNaN(mapCenter.value[0]) && 
             !isNaN(mapCenter.value[1]) && 
             (mapCenter.value[0] !== 0 || mapCenter.value[1] !== 0)) {
    center = mapCenter.value;
  }
  
  console.log('使用中心点生成随机轨迹:', center);
  
  // 清除之前的轨迹实例，防止内存泄漏和冲突
  if (journeyTrackInstance.value) {
    journeyTrackInstance.value.clear();
    journeyTrackInstance.value = null;
  }
  
  // 生成围绕中心点的随机轨迹
  const generateRandomPoint = (center, radiusKm) => {
    const earthRadius = 6371; // 地球半径，单位：千米
    const lat = center[1];
    const lng = center[0];
    
    // 随机距离，在0到指定半径之间
    const distance = Math.random() * radiusKm;
    
    // 随机角度，0到360度
    const angle = Math.random() * Math.PI * 2;
    
    // 计算偏移量（近似计算）
    const latOffset = (distance / earthRadius) * (180 / Math.PI);
    const lngOffset = (distance / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    // 计算新坐标
    const newLat = lat + latOffset * Math.sin(angle);
    const newLng = lng + lngOffset * Math.cos(angle);
    
    // 确保不会生成[0,0]坐标点
    if (newLng === 0 && newLat === 0) {
      return [center[0] + 0.01, center[1] + 0.01]; // 轻微偏移防止[0,0]
    }
    
    return [newLng, newLat];
  };
  
  // 生成随机点数量，5-15个点
  const pointCount = 5 + Math.floor(Math.random() * 10);
  const points = [];
  
  // 生成起点（当前地图中心）
  points.push(center);
  
  // 生成中间点
  for (let i = 0; i < pointCount; i++) {
    points.push(generateRandomPoint(center, 3)); // 3千米半径内的随机点
  }
  
  // 最后一个点回到起点附近
  const lastPoint = generateRandomPoint(center, 0.5); // 0.5千米半径内的随机点
  points.push(lastPoint);
  
  // 设置选项
  journeyOptions.value.animation = true; // 启用动画
  journeyOptions.value.showStartEndMarkers = true; // 显示起终点
  
  // 创建轨迹
  createJourneyTrack(points);
  
  ElMessage.success(`已生成包含${points.length}个点的随机轨迹`);
};

</script>

<style scoped>
.sc-map-example {
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
  flex-direction: row; /* 改为行布局，使地图在左边，配置在右边 */
  gap: 20px;
  margin-bottom: 20px;
  height: auto;
}

.map-section {
  flex: 3;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  order: 1; /* 确保地图区域在左侧 */
}

.config-section {
  flex: 2;
  min-width: 300px;
  max-width: 400px; /* 限制配置面板的最大宽度 */
  display: flex;
  flex-direction: column;
  order: 2; /* 确保配置区域在右侧 */
}

.preview-container {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-container .action-buttons {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.preview-container .action-buttons .el-button {
  margin: 4px; /* 给按钮增加一些间距 */
}

.config-scroll-container {
  height: 700px; /* 减小配置面板的高度，与地图更匹配 */
  overflow-y: auto;
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(250, 250, 250, 0.8);
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
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.code-example h4 {
  display: flex;
  align-items: center;
}

.code-example h4::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.code-example pre {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  overflow-x: auto;
  max-height: 300px;
}

@media (max-width: 1200px) {
  .main-container {
    flex-direction: column; /* 在小屏幕上改回列布局 */
  }

  .map-section,
  .config-section {
    width: 100%;
    min-width: 100%; /* 确保在小屏幕上占据全宽 */
    max-width: 100%; /* 确保在小屏幕上占据全宽 */
    order: 0; /* 重置排序 */
  }
  
  .map-section {
    order: 1; /* 在小屏幕上地图在上方 */
  }
  
  .config-section {
    order: 2; /* 在小屏幕上配置在下方 */
  }
  
  .config-scroll-container {
    height: 400px; /* 减小配置面板的高度以适应小屏幕 */
  }
  
  .preview-container .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .preview-container .action-buttons .el-button-group {
    display: flex;
    flex-wrap: wrap;
  }
  
  .preview-container .action-buttons .el-button {
    flex: 1;
    margin: 2px;
  }
  
  .code-example pre {
    max-height: 200px; /* 在小屏幕上减小代码示例的高度 */
  }
}

.journey-track-controls {
  margin-top: 15px;
  padding: 15px;
  background: rgba(250, 250, 250, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.journey-track-controls h5 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.journey-options {
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.journey-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
}

.journey-options-panel {
  background: rgba(250, 250, 250, 0.6);
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 10px;
  margin-top: 5px;
}

.journey-options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.journey-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
}

.journey-buttons {
  display: flex;
  justify-content: flex-start;
}

.journey-animation-controls {
  display: flex;
  gap: 5px;
}

.loop-count-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 14px;
  text-align: center;
}
</style>