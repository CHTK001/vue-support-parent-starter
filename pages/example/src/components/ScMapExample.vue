<template>
  <div class="sc-map-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础用法</h3>
        <p class="example-desc">基础的地图组件，支持多种地图类型</p>

        <div class="example-block">
          <h4>高德地图</h4>
          <ScMap type="amap" :api-key="apiKey" :center="[116.397428, 39.90923]" :zoom="11" height="400px" @map-loaded="onMapLoaded" @map-click="onMapClick" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScMap
  type="amap"
  api-key="您的高德地图API密钥"
  :center="[116.397428, 39.90923]"
  :zoom="11"
  height="400px"
  @map-loaded="onMapLoaded"
  @map-click="onMapClick"
/&gt;

&lt;script setup&gt;
const onMapLoaded = (mapInstance) => {
  console.log('地图加载完成', mapInstance);
};

const onMapClick = (event) => {
  console.log('点击了地图', event.position);
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="标记点">
        <h3>标记点</h3>
        <p class="example-desc">在地图上添加标记点，支持自定义标记点样式和点击事件</p>

        <div class="example-block">
          <ScMap type="amap" :api-key="apiKey" :center="[116.397428, 39.90923]" :zoom="12" :markers="markers" height="400px" @marker-click="onMarkerClick" />

          <div class="mt-4">
            <p>点击标记点查看信息：</p>
            <div v-if="currentMarker" class="marker-info">
              <h4>{{ currentMarker.title }}</h4>
              <p>位置：{{ currentMarker.position.join(", ") }}</p>
              <p v-if="currentMarker.data">ID：{{ currentMarker.data.id }}</p>
            </div>
            <div v-else class="marker-info">
              <p>请点击地图上的标记点</p>
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScMap
  type="amap"
  api-key="您的高德地图API密钥"
  :center="[116.397428, 39.90923]"
  :zoom="12"
  :markers="markers"
  height="400px"
  @marker-click="onMarkerClick"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

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

const currentMarker = ref(null);

const onMarkerClick = (marker) => {
  currentMarker.value = marker;
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="地图类型">
        <h3>地图类型</h3>
        <p class="example-desc">支持多种地图类型，包括高德地图、百度地图、谷歌地图、天地图和离线地图</p>

        <div class="example-block">
          <el-radio-group v-model="mapType" class="mb-4">
            <el-radio-button label="amap">高德地图</el-radio-button>
            <el-radio-button label="bmap">百度地图</el-radio-button>
            <el-radio-button label="tmap">天地图</el-radio-button>
            <el-radio-button label="offline">离线地图</el-radio-button>
          </el-radio-group>

          <ScMap :type="mapType" :api-key="getApiKey(mapType)" :center="[116.397428, 39.90923]" :zoom="11" :offline-config="offlineConfig" height="400px" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;el-radio-group v-model="mapType" class="mb-4"&gt;
  &lt;el-radio-button label="amap"&gt;高德地图&lt;/el-radio-button&gt;
  &lt;el-radio-button label="bmap"&gt;百度地图&lt;/el-radio-button&gt;
  &lt;el-radio-button label="tmap"&gt;天地图&lt;/el-radio-button&gt;
  &lt;el-radio-button label="offline"&gt;离线地图&lt;/el-radio-button&gt;
&lt;/el-radio-group&gt;

&lt;ScMap
  :type="mapType"
  :api-key="getApiKey(mapType)"
  :center="[116.397428, 39.90923]"
  :zoom="11"
  :offline-config="offlineConfig"
  height="400px"
/&gt;

&lt;script setup&gt;
const mapType = ref('amap');

const getApiKey = (type) => {
  // 根据地图类型返回对应的API密钥
  const keys = {
    amap: '您的高德地图API密钥',
    bmap: '您的百度地图API密钥',
    tmap: '您的天地图API密钥',
    offline: ''
  };
  return keys[type] || '';
};

const offlineConfig = {
  tileUrlTemplate: '/tiles/{z}/{x}/{y}.png',
  minZoom: 3,
  maxZoom: 18,
  attribution: '© 自定义离线地图'
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="视图控制">
        <h3>视图控制</h3>
        <p class="example-desc">控制地图的视图类型、缩放级别和中心点</p>

        <div class="example-block">
          <div class="control-panel mb-4">
            <div class="control-item">
              <span>视图类型：</span>
              <el-select v-model="viewType" placeholder="选择视图类型">
                <el-option label="普通视图" value="normal" />
                <el-option label="卫星视图" value="satellite" />
                <el-option label="混合视图" value="hybrid" />
              </el-select>
            </div>

            <div class="control-item">
              <span>缩放级别：</span>
              <el-slider v-model="zoomLevel" :min="3" :max="19" :step="1" show-stops />
            </div>

            <div class="control-item">
              <el-button type="primary" @click="moveToBeijing">北京</el-button>
              <el-button type="primary" @click="moveToShanghai">上海</el-button>
              <el-button type="primary" @click="moveToGuangzhou">广州</el-button>
            </div>
          </div>

          <ScMap key="mapRefUios" ref="mapRef" type="amap" :api-key="apiKey" :center="mapCenter" :zoom="zoomLevel" :view-type="viewType" height="400px" @zoom-changed="onZoomChanged" @center-changed="onCenterChanged" />
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScMap
  ref="mapRef"
  type="amap"
  api-key="您的高德地图API密钥"
  :center="mapCenter"
  :zoom="zoomLevel"
  :view-type="viewType"
  height="400px"
  @zoom-changed="onZoomChanged"
  @center-changed="onCenterChanged"
/&gt;

&lt;script setup&gt;
const mapRef = ref(null);
const viewType = ref('normal');
const zoomLevel = ref(11);
const mapCenter = ref([116.397428, 39.90923]);

const moveToBeijing = () => {
  mapCenter.value = [116.397428, 39.90923];
};

const moveToShanghai = () => {
  mapCenter.value = [121.473701, 31.230416];
};

const moveToGuangzhou = () => {
  mapCenter.value = [113.264385, 23.129112];
};

const onZoomChanged = (zoom) => {
  console.log('缩放级别变化:', zoom);
};

const onCenterChanged = (center) => {
  console.log('中心点变化:', center);
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScMap 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="type">地图类型，可选值：amap(高德)、bmap(百度)、gmap(谷歌)、tmap(天地图)、offline(离线)，默认：amap</el-descriptions-item>
          <el-descriptions-item label="apiKey">地图API密钥，类型：String</el-descriptions-item>
          <el-descriptions-item label="center">地图中心点坐标，类型：Array [经度, 纬度]，默认：[116.397428, 39.90923]</el-descriptions-item>
          <el-descriptions-item label="zoom">缩放级别，类型：Number，默认：11</el-descriptions-item>
          <el-descriptions-item label="markers">标记点数组，类型：Array</el-descriptions-item>
          <el-descriptions-item label="height">地图高度，类型：String，默认：500px</el-descriptions-item>
          <el-descriptions-item label="width">地图宽度，类型：String，默认：100%</el-descriptions-item>
          <el-descriptions-item label="viewType">视图类型，可选值：normal(普通)、satellite(卫星)、hybrid(混合)，默认：normal</el-descriptions-item>
          <el-descriptions-item label="zoomControl">是否显示缩放控件，类型：Boolean，默认：true</el-descriptions-item>
          <el-descriptions-item label="scaleControl">是否显示比例尺控件，类型：Boolean，默认：true</el-descriptions-item>
          <el-descriptions-item label="draggable">是否允许拖动，类型：Boolean，默认：true</el-descriptions-item>
          <el-descriptions-item label="scrollWheel">是否允许滚轮缩放，类型：Boolean，默认：true</el-descriptions-item>
          <el-descriptions-item label="mapStyle">地图样式，类型：String</el-descriptions-item>
          <el-descriptions-item label="offlineConfig">离线地图配置，类型：Object</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="map-loaded">地图加载完成事件，参数：mapInstance</el-descriptions-item>
          <el-descriptions-item label="marker-click">标记点点击事件，参数：marker</el-descriptions-item>
          <el-descriptions-item label="map-click">地图点击事件，参数：event</el-descriptions-item>
          <el-descriptions-item label="zoom-changed">缩放级别变化事件，参数：zoom</el-descriptions-item>
          <el-descriptions-item label="center-changed">中心点变化事件，参数：center</el-descriptions-item>
          <el-descriptions-item label="bounds-changed">视野范围变化事件，参数：bounds</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">标记点对象格式</h4>
        <pre><code class="language-javascript">
{
  position: [116.397428, 39.90923], // 位置坐标 [经度, 纬度]
  title: '标记点标题',            // 标记点标题
  label: '标记点标签',            // 标记点标签
  icon: 'custom-icon.png',        // 自定义图标（可选）
  data: { id: 1, ... }            // 自定义数据（可选）
}
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import ScMap from "@repo/components/ScMap/index.vue";
const apiKey = ref("5f969bed06ed949108d2ec7916dcffc4");
// 标记点数据
const markers = ref([
  {
    position: [116.397428, 39.90923],
    title: "天安门",
    label: "天安门广场",
    data: { id: 1 },
  },
  {
    position: [116.330484, 39.897452],
    title: "北京西站",
    label: "北京西站",
    data: { id: 2 },
  },
  {
    position: [116.286968, 39.916527],
    title: "北京动物园",
    label: "北京动物园",
    data: { id: 3 },
  },
  {
    position: [116.391373, 39.940111],
    title: "北京大学",
    label: "北京大学",
    data: { id: 4 },
  },
]);

// 当前选中的标记点
const currentMarker = ref(null);

// 地图类型
const mapType = ref("amap");

// 离线地图配置
const offlineConfig = {
  tileUrlTemplate: "/tiles/{z}/{x}/{y}.png",
  minZoom: 3,
  maxZoom: 18,
  attribution: "© 自定义离线地图",
};

// 视图控制
const mapRef = ref(null);
const viewType = ref("normal");
const zoomLevel = ref(11);
const mapCenter = ref([116.397428, 39.90923]);

// 事件处理函数
const onMapLoaded = (mapInstance) => {
  console.log("地图加载完成", mapInstance);
  ElMessage.success("地图加载完成");
};

const onMarkerClick = (marker) => {
  currentMarker.value = marker;
  ElMessage.success(`点击了标记点: ${marker.title}`);
};

const onMapClick = (event) => {
  console.log("点击了地图", event.position);
};

const onZoomChanged = (zoom) => {
  console.log("缩放级别变化:", zoom);
  zoomLevel.value = zoom;
};

const onCenterChanged = (center) => {
  console.log("中心点变化:", center);
  mapCenter.value = center;
};

// 移动地图中心点
const moveToBeijing = () => {
  mapCenter.value = [116.397428, 39.90923];
  ElMessage.info("已将地图中心移动到北京");
};

const moveToShanghai = () => {
  mapCenter.value = [121.473701, 31.230416];
  ElMessage.info("已将地图中心移动到上海");
};

const moveToGuangzhou = () => {
  mapCenter.value = [113.264385, 23.129112];
  ElMessage.info("已将地图中心移动到广州");
};

// 获取API密钥
const getApiKey = (type) => {
  // 根据地图类型返回对应的API密钥
  const keys = {
    amap: apiKey.value,
    bmap: "您的百度地图API密钥",
    tmap: "您的天地图API密钥",
    offline: "",
  };
  return keys[type] || "";
};
</script>

<style scoped>
.sc-map-example {
  padding: 20px 0;
}

.example-desc {
  color: #666;
  margin-bottom: 20px;
}

.example-block {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", monospace;
  font-size: 14px;
  color: #333;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  flex: 1 1 auto;
}

.marker-info {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.marker-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #409eff;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

/* 响应式布局支持 */
@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 15px;
  }

  .control-item {
    width: 100%;
  }

  .example-block {
    padding: 15px;
  }
}
</style>
