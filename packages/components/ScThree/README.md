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
| modelUrls | `string[]` | `[]` | 模型地址列表，支持 glTF/glb 格式 |

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

