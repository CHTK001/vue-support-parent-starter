<template>
  <div class="example-container">
    <h2 class="example-title">ScEchartsMap3D 3D 地图组件示例</h2>
    <p class="example-desc">
      基于 ECharts GL 的 3D 地图组件，支持经纬度点位、飞线、自定义 GeoJSON 等
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="addRandomPoints">
          <IconifyIconOnline icon="ri:map-pin-add-line" class="mr-1" />
          添加随机点位
        </el-button>
        <el-button @click="addRandomLines">
          <IconifyIconOnline icon="ri:flight-takeoff-line" class="mr-1" />
          添加飞线
        </el-button>
        <el-button @click="clearAll">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清除所有
        </el-button>
        <el-button @click="toggleTheme">
          <IconifyIconOnline icon="ri:palette-line" class="mr-1" />
          切换主题
        </el-button>
      </div>

      <ScEchartsMap3D
        ref="map3dRef"
        map-name="china-province"
        map-url="/data/china-province.json"
        :points="points"
        :lines="lines"
        :theme="currentTheme"
        :height="config.height"
        style="width: 100%; border-radius: 8px; overflow: hidden"
      />

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="地图高度">
              <el-input v-model="config.height" placeholder="如 600px" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="点位数量">
              <el-input-number v-model="pointCount" :min="1" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="飞线数量">
              <el-input-number v-model="lineCount" :min="0" :max="20" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import ScEchartsMap3D from "@repo/components/ScEchartsMap3D/index.vue";
import CodePreview from "./CodePreview.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 类型定义（与组件中的接口保持一致）
type Map3DPoint = {
  name?: string;
  lng: number;
  lat: number;
  value?: number;
};

type Map3DLine = {
  from: [number, number];
  to: [number, number];
  name?: string;
  value?: number;
};

/**
 * ScEchartsMap3D 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-01-XX
 */

const map3dRef = ref<InstanceType<typeof ScEchartsMap3D>>();
const config = reactive({
  height: "600px",
});

const points = ref<Map3DPoint[]>([]);
const lines = ref<Map3DLine[]>([]);
const pointCount = ref(5);
const lineCount = ref(3);
const currentTheme = ref<"T" | "dark">("T");

// 属性说明
const propsData = [
  {
    name: "mapUrl",
    type: "string",
    default: "'/data/china-province.json'",
    description: "地图 GeoJSON URL",
  },
  {
    name: "mapName",
    type: "string",
    default: "'china-province'",
    description: "registerMap 的名称",
  },
  {
    name: "mapData",
    type: "object",
    default: "undefined",
    description: "直接传入 GeoJSON（传了就不会再 fetch mapUrl）",
  },
  {
    name: "points",
    type: "Map3DPoint[]",
    default: "[]",
    description: "经纬度点位数据（scatter3D）",
  },
  {
    name: "lines",
    type: "Map3DLine[]",
    default: "[]",
    description: "经纬度线数据（lines3D）",
  },
  {
    name: "option",
    type: "object",
    default: "{}",
    description: "允许业务侧完全覆盖 option（会与默认 option 合并）",
  },
  {
    name: "width",
    type: "string | number",
    default: "'100%'",
    description: "容器宽度",
  },
  {
    name: "height",
    type: "string | number",
    default: "'100%'",
    description: "容器高度",
  },
  {
    name: "autoResize",
    type: "boolean",
    default: "true",
    description: "是否自动调整大小",
  },
  {
    name: "theme",
    type: "string",
    default: "'T'",
    description: "主题名称",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScEchartsMap3D
  map-name="china-province"
  map-url="/data/china-province.json"
  :points="points"
  :lines="lines"
  :height="'600px'"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ScEchartsMap3D } from "@repo/components";

// 点位数据
const points = [
  { name: "北京", lng: 116.4, lat: 39.9, value: 80 },
  { name: "上海", lng: 121.47, lat: 31.23, value: 60 }
];

// 飞线数据
const lines = [
  { name: "北京->上海", from: [116.4, 39.9], to: [121.47, 31.23], value: 1 }
];`,
  },
]);

/**
 * 添加随机点位
 */
function addRandomPoints() {
  const newPoints: Map3DPoint[] = [];
  const cities = [
    { name: "北京", lng: 116.4, lat: 39.9 },
    { name: "上海", lng: 121.47, lat: 31.23 },
    { name: "广州", lng: 113.23, lat: 23.16 },
    { name: "深圳", lng: 114.07, lat: 22.62 },
    { name: "杭州", lng: 120.19, lat: 30.26 },
    { name: "成都", lng: 104.06, lat: 30.67 },
    { name: "武汉", lng: 114.31, lat: 30.52 },
    { name: "西安", lng: 108.95, lat: 34.27 },
  ];

  for (let i = 0; i < pointCount.value; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const offsetLng = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    newPoints.push({
      name: `${city.name}-${i + 1}`,
      lng: city.lng + offsetLng,
      lat: city.lat + offsetLat,
      value: Math.floor(Math.random() * 100),
    });
  }

  points.value = [...points.value, ...newPoints];
}

/**
 * 添加随机飞线
 */
function addRandomLines() {
  const newLines: Map3DLine[] = [];
  const cities = [
    { lng: 116.4, lat: 39.9 },
    { lng: 121.47, lat: 31.23 },
    { lng: 113.23, lat: 23.16 },
    { lng: 114.07, lat: 22.62 },
    { lng: 120.19, lat: 30.26 },
    { lng: 104.06, lat: 30.67 },
  ];

  for (let i = 0; i < lineCount.value; i++) {
    const fromCity = cities[Math.floor(Math.random() * cities.length)];
    const toCity = cities[Math.floor(Math.random() * cities.length)];
    if (fromCity !== toCity) {
      newLines.push({
        name: `飞线-${i + 1}`,
        from: [fromCity.lng, fromCity.lat],
        to: [toCity.lng, toCity.lat],
        value: Math.floor(Math.random() * 100),
      });
    }
  }

  lines.value = [...lines.value, ...newLines];
}

/**
 * 清除所有数据
 */
function clearAll() {
  points.value = [];
  lines.value = [];
}

/**
 * 切换主题
 */
function toggleTheme() {
  currentTheme.value = currentTheme.value === "T" ? "dark" : "T";
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}

.mr-1 {
  margin-right: 4px;
}
</style>

