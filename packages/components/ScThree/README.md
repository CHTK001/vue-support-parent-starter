# ScThree 组件

基于 Three.js 的 Vue 3D 渲染组件，提供基础的场景、相机和渲染器封装。

## 功能特性

- 自动初始化 Three.js 场景、相机和渲染器
- 支持透视相机和正交相机
- 自动响应式尺寸调整
- 完整的生命周期管理
- 资源自动清理
- 支持插槽自定义内容

## 基础用法

```vue
<template>
  <ScThree
    :width="800"
    :height="600"
    @ready="onReady"
  >
    <template #default="{ scene, camera, renderer }">
      <!-- 在这里添加 Three.js 对象 -->
    </template>
  </ScThree>
</template>

<script setup lang="ts">
import { ScThree } from "@repo/components";
import * as THREE from "three";

function onReady(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  // 添加一个立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // 添加动画
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
</script>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | `string \| number` | `800` | 容器宽度 |
| height | `string \| number` | `600` | 容器高度 |
| backgroundColor | `string \| number` | `0x000000` | 背景颜色 |
| antialias | `boolean` | `true` | 是否开启抗锯齿 |
| alpha | `boolean` | `false` | 是否透明背景 |
| autoResize | `boolean` | `true` | 是否自动调整尺寸 |
| cameraType | `'perspective' \| 'orthographic'` | `'perspective'` | 相机类型 |
| cameraFov | `number` | `75` | 透视相机视野角度 |
| cameraNear | `number` | `0.1` | 相机近裁剪面 |
| cameraFar | `number` | `1000` | 相机远裁剪面 |
| cameraPosition | `[number, number, number]` | `[0, 0, 5]` | 相机位置 |
| cameraLookAt | `[number, number, number]` | `[0, 0, 0]` | 相机朝向 |
| preset | `'none' \| 'chinaMap' \| 'interior'` | `'none'` | 预设场景类型：none-不做额外处理，chinaMap-中国3D地图，interior-室内装潢 |
| modelUrls | `string[]` | `[]` | 模型地址列表，支持多种格式（.glb, .gltf, .obj, .fbx, .stl）。支持远程 URL 和本地路径（如 `/models/model.glb`） |
| modelConfig | `object` | `{ position: [0,0,0], scale: 1, rotation: [0,0,0] }` | 模型加载配置：position-位置偏移[x,y,z]，scale-缩放[x,y,z]或统一值，rotation-旋转[x,y,z]（弧度） |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| ready | `(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer)` | Three 核心对象准备完成 |
| resize | `(width: number, height: number)` | 画布尺寸变化 |
| modelLoaded | `(models: THREE.Object3D[])` | 预设场景或模型加载完成 |

## Slots

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| default | `{ scene, camera, renderer }` | 默认插槽，可访问 Three.js 对象 |

## 暴露的方法

| 方法名 | 说明 |
|--------|------|
| scene | 场景对象 |
| camera | 相机对象 |
| renderer | 渲染器对象 |
| render | 手动渲染一帧 |
| resize | 手动触发尺寸调整 |

## 模型加载示例

### 远程模型加载

```vue
<template>
  <ScThree
    :width="800"
    :height="600"
    :model-urls="['https://example.com/model.glb']"
    :model-config="{
      position: [0, 0, 0],
      scale: 1,
      rotation: [0, 0, 0]
    }"
    :camera-position="[0, 2, 5]"
    :camera-look-at="[0, 0, 0]"
    @model-loaded="onModelLoaded"
  />
</template>

<script setup lang="ts">
import { ScThree } from "@repo/components";
import * as THREE from "three";

function onModelLoaded(models: THREE.Object3D[]) {
  console.log("模型加载完成", models);
}
</script>
```

### 本地模型加载

将模型文件放在 `public/models/` 目录下，然后使用相对路径加载：

```vue
<template>
  <ScThree
    :width="800"
    :height="600"
    :model-urls="['/models/bee_minecraft.glb']"
    :model-config="{
      position: [0, 0, 0],
      scale: 1,
      rotation: [0, 0, 0]
    }"
    :camera-position="[0, 2, 5]"
    :camera-look-at="[0, 0, 0]"
    @model-loaded="onModelLoaded"
  />
</template>

<script setup lang="ts">
import { ScThree } from "@repo/components";
import * as THREE from "three";

function onModelLoaded(models: THREE.Object3D[]) {
  console.log("本地模型加载完成", models);
}
</script>
```

### 使用 ScSelect 选择本地模型

```vue
<template>
  <div>
    <ScSelect
      v-model="selectedModel"
      :options="modelOptions"
      placeholder="请选择模型"
      @change="onModelChange"
    />
    <ScThree
      :width="800"
      :height="600"
      :model-urls="modelUrls"
      :camera-position="[0, 2, 5]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScThree } from "@repo/components";
import ScSelect from "@repo/components/ScSelect/index.vue";

const modelOptions = [
  { label: "蜜蜂模型", value: "/models/bee_minecraft.glb" },
  { label: "狐狸模型", value: "/models/fox_minecraft.glb" }
];

const selectedModel = ref("");
const modelUrls = ref<string[]>([]);

function onModelChange(value: string) {
  if (value) {
    modelUrls.value = [value];
  } else {
    modelUrls.value = [];
  }
}
</script>
```

## 完整示例

```vue
<template>
  <ScThree
    :width="800"
    :height="600"
    :camera-position="[0, 0, 5]"
    @ready="onReady"
  >
    <template #default="{ scene }">
      <!-- 使用插槽添加对象 -->
    </template>
  </ScThree>
</template>

<script setup lang="ts">
import { ScThree } from "@repo/components";
import * as THREE from "three";

let scene: THREE.Scene;
let camera: THREE.Camera;
let renderer: THREE.WebGLRenderer;

function onReady(s: THREE.Scene, c: THREE.Camera, r: THREE.WebGLRenderer) {
  scene = s;
  camera = c;
  renderer = r;

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // 添加网格
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);

  // 添加坐标轴
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // 添加几何体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
</script>
```

## 支持的模型格式

组件支持多种 3D 模型格式，会根据文件扩展名自动选择合适的加载器：

- **glTF** (.gltf, .glb)：Khronos Group 的开放标准 3D 格式（推荐）
  - 支持完整的 glTF 2.0 规范
  - 支持 DRACO 压缩
  - 支持动画、材质、纹理
- **OBJ** (.obj)：Wavefront OBJ 格式
  - 广泛使用的 3D 模型格式
  - 需要配合 .mtl 材质文件
  - 自动应用默认材质
- **FBX** (.fbx)：Autodesk FBX 格式
  - 支持动画和复杂场景
  - 常用于游戏和影视制作
- **STL** (.stl)：STereoLithography 格式
  - 常用于 3D 打印
  - 简单几何体模型

模型加载会根据文件扩展名自动选择对应的加载器，无需手动指定。

## 模型加载方式

组件支持两种模型加载方式：

1. **远程模型**：使用完整的 HTTP/HTTPS URL，例如 `https://example.com/model.glb`
2. **本地模型**：将模型文件放在 `public/models/` 目录下，使用相对路径，例如 `/models/model.glb`

本地模型文件会自动从项目的 public 目录加载，适合作为内部资源使用。

## 与地图组件联动

ScThree 组件可以与 ScMap 和 ScLayer 地图组件联动，在地图上显示 3D 模型。

### 在 ScLayer（Cesium）上显示模型

```vue
<template>
  <ScLayer
    ref="layerRef"
    :height="500"
    map-type="GAODE"
    @ready="onLayerReady"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScLayer from "@repo/components/ScLayer/index.vue";
import type { Model3DOptions } from "@repo/components/ScLayer/composables/CesiumModelObject";

const layerRef = ref<InstanceType<typeof ScLayer> | null>(null);

function onLayerReady() {
  const cesiumObject = layerRef.value?.getCesiumObject();
  const modelObject = cesiumObject?.getModelObject();
  
  if (modelObject) {
    const modelOptions: Model3DOptions = {
      id: "model_1",
      url: "/models/bee_minecraft.glb",
      position: {
        longitude: 116.397428,
        latitude: 39.90923,
        height: 10
      },
      scale: { x: 1, y: 1, z: 1 },
      rotation: {
        heading: 0,
        pitch: 0,
        roll: 0
      }
    };
    
    modelObject.addModel(modelOptions);
  }
}
</script>
```

### 在 ScMap（Leaflet）上标记模型位置

```vue
<template>
  <ScMap
    ref="mapRef"
    :height="500"
    map-type="GAODE"
    @ready="onMapReady"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScMap from "@repo/components/ScMap/index.vue";

const mapRef = ref<InstanceType<typeof ScMap> | null>(null);

function onMapReady() {
  const markerObject = mapRef.value?.getMarkerObject();
  
  if (markerObject) {
    markerObject.addMarker({
      id: "marker_1",
      position: [116.397428, 39.90923],
      title: "3D 模型位置",
      content: "模型位置标记",
      icon: {
        url: "https://api.iconify.design/mdi:cube-3d.svg?color=%23ff0000",
        size: [32, 32],
        anchor: [16, 32]
      }
    });
  }
}
</script>
```

### 地理坐标转换工具

组件提供了 `MapIntegration` 工具类，用于地理坐标与 Three.js 坐标之间的转换：

```typescript
import { geoToThree, threeToGeo, convertToCesiumModelOptions } from "@repo/components/ScThree/composables/MapIntegration";

// 地理坐标转 Three.js 坐标
const [x, y, z] = geoToThree(116.397428, 39.90923, 10, 116.4, 39.9);

// Three.js 坐标转地理坐标
const geo = threeToGeo(x, y, z, 116.4, 39.9);

// 转换为 Cesium 模型配置
const cesiumOptions = convertToCesiumModelOptions(
  "/models/model.glb",
  [116.397428, 39.90923, 10],
  1,
  [0, 0, 0]
);
```

更多示例请参考 `ScThreeMapExample` 组件。

