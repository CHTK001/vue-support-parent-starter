<template>
  <div class="map-examples">
    <h2 class="title">ScMap 地图组件示例</h2>
    
    <el-tabs type="border-card">
      <el-tab-pane label="高德地图">
        <div class="map-container">
          <sc-map
            type="amap"
            api-key="您的高德地图API密钥"
            :center="[116.397428, 39.90923]"
            :zoom="12"
            :markers="amapMarkers"
            height="500px"
            width="100%"
            @marker-click="onMarkerClick"
            @map-click="onMapClick"
          ></sc-map>
        </div>
        <div class="map-info">
          <p>高德地图是国内领先的数字地图内容、导航和位置服务解决方案提供商。</p>
          <p>功能包括：</p>
          <ul>
            <li>支持卫星地图和混合地图</li>
            <li>支持自定义标记点和信息窗口</li>
            <li>支持自定义地图样式</li>
          </ul>
          <p>注意：需要在高德开放平台申请API密钥才能使用。</p>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="百度地图">
        <div class="map-container">
          <sc-map
            type="bmap"
            api-key="您的百度地图API密钥"
            :center="[116.404, 39.915]"
            :zoom="13"
            :markers="bmapMarkers"
            height="500px"
            width="100%"
            @marker-click="onMarkerClick"
            @map-click="onMapClick"
          ></sc-map>
        </div>
        <div class="map-info">
          <p>百度地图是中国领先的互联网地图服务平台，为用户提供专业、权威的地图服务。</p>
          <p>功能包括：</p>
          <ul>
            <li>支持卫星地图和混合地图</li>
            <li>支持自定义覆盖物和信息窗口</li>
            <li>支持自定义地图样式</li>
          </ul>
          <p>注意：需要在百度地图开放平台申请API密钥才能使用。</p>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="天地图">
        <div class="map-container">
          <sc-map
            type="tmap"
            api-key="您的天地图API密钥"
            :center="[116.46, 39.92]"
            :zoom="12"
            :markers="tmapMarkers"
            height="500px"
            width="100%"
            @marker-click="onMarkerClick"
            @map-click="onMapClick"
          ></sc-map>
        </div>
        <div class="map-info">
          <p>天地图是国家测绘地理信息局建设的公益性地理信息服务平台。</p>
          <p>功能包括：</p>
          <ul>
            <li>支持卫星地图、混合地图和地形图</li>
            <li>支持自定义标记点和信息窗口</li>
            <li>官方提供的中国标准地图资源</li>
          </ul>
          <p>注意：需要在天地图开发者中心申请API密钥才能使用。</p>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="地图配置">
        <div class="map-config">
          <h3>地图配置选项</h3>
          
          <el-form label-width="120px">
            <el-form-item label="地图类型">
              <el-select v-model="currentMapType" placeholder="请选择地图类型">
                <el-option label="高德地图" value="amap"></el-option>
                <el-option label="百度地图" value="bmap"></el-option>
                <el-option label="天地图" value="tmap"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="视图类型">
              <el-select v-model="currentViewType" placeholder="请选择视图类型">
                <el-option label="普通" value="normal"></el-option>
                <el-option label="卫星" value="satellite"></el-option>
                <el-option label="混合" value="hybrid"></el-option>
                <el-option label="地形" value="terrain"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="缩放级别">
              <el-slider v-model="currentZoom" :min="3" :max="18"></el-slider>
            </el-form-item>
            
            <el-form-item label="控件显示">
              <el-checkbox v-model="showZoomControl">缩放控件</el-checkbox>
              <el-checkbox v-model="showScaleControl">比例尺控件</el-checkbox>
            </el-form-item>
            
            <el-form-item label="交互设置">
              <el-checkbox v-model="enableDragging">允许拖动</el-checkbox>
              <el-checkbox v-model="enableScrollWheel">允许滚轮缩放</el-checkbox>
            </el-form-item>
          </el-form>
          
          <div class="map-preview">
            <sc-map
              :type="currentMapType"
              :api-key="getApiKey()"
              :center="[116.397428, 39.90923]"
              :zoom="currentZoom"
              :view-type="currentViewType"
              :zoom-control="showZoomControl"
              :scale-control="showScaleControl"
              :draggable="enableDragging"
              :scroll-wheel="enableScrollWheel"
              height="300px"
              width="100%"
            ></sc-map>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ScMap from '../index.vue';
import { ElMessage } from 'element-plus';

// 示例数据 - 高德地图标记点
const amapMarkers = ref([
  {
    position: [116.397428, 39.90923],
    title: '天安门',
    label: '天安门',
    icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
  },
  {
    position: [116.327428, 39.99923],
    title: '北京大学',
    label: '北京大学',
    icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
  },
  {
    position: [116.417428, 39.88923],
    title: '中国科技馆',
    label: '中国科技馆',
    icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png'
  }
]);

// 示例数据 - 百度地图标记点
const bmapMarkers = ref([
  {
    position: [116.404, 39.915],
    title: '故宫博物院',
    label: '故宫博物院'
  },
  {
    position: [116.334, 39.955],
    title: '清华大学',
    label: '清华大学'
  },
  {
    position: [116.454, 39.875],
    title: '朝阳公园',
    label: '朝阳公园'
  }
]);

// 示例数据 - 天地图标记点
const tmapMarkers = ref([
  {
    position: [116.46, 39.92],
    title: '北京工人体育场',
    label: '北京工人体育场'
  },
  {
    position: [116.48, 39.91],
    title: '三里屯',
    label: '三里屯'
  },
  {
    position: [116.44, 39.93],
    title: '北京国际会议中心',
    label: '北京国际会议中心'
  }
]);

// 地图配置
const currentMapType = ref('amap');
const currentViewType = ref('normal');
const currentZoom = ref(12);
const showZoomControl = ref(true);
const showScaleControl = ref(true);
const enableDragging = ref(true);
const enableScrollWheel = ref(true);

// 获取对应地图类型的API密钥
const getApiKey = () => {
  switch (currentMapType.value) {
    case 'amap':
      return '您的高德地图API密钥';
    case 'bmap':
      return '您的百度地图API密钥';
    case 'tmap':
      return '您的天地图API密钥';
    default:
      return '';
  }
};

// 标记点点击事件
const onMarkerClick = (marker: any) => {
  ElMessage.info(`点击了标记点: ${marker.title}`);
};

// 地图点击事件
const onMapClick = (e: any) => {
  console.log('地图点击坐标:', e.position);
};
</script>

<style scoped>
.map-examples {
  padding: 20px;
}

.title {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.map-container {
  margin-bottom: 20px;
}

.map-info {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.map-info ul {
  padding-left: 20px;
  margin: 10px 0;
}

.map-config {
  padding: 15px;
}

.map-preview {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

h3 {
  margin-bottom: 20px;
  color: #333;
}
</style> 