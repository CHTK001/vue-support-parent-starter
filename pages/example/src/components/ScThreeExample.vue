<template>
  <div class="sc-three-example">
    <h2 class="example-title">ScThree 3D 渲染组件示例</h2>
    <p class="example-desc">
      基于 Three.js 的 Vue 3D 渲染组件，支持模型加载（glTF/glb 格式）、场景预设、相机控制等功能
    </p>

    <ScDivider content-position="left">基础用法</ScDivider>

    <DemoBlock title="基础场景" :code="codes.basic">
      <div class="demo-container">
        <ScThree
          :width="600"
          :height="400"
          :camera-position="[0, 0, 5]"
          @ready="onBasicReady"
        />
      </div>
    </DemoBlock>

    <ScDivider content-position="left">模型加载</ScDivider>

    <DemoBlock title="本地模型选择" :code="codes.localModel">
      <div class="demo-container">
        <ScThree
          :width="600"
          :height="400"
          :model-urls="localModelUrls"
          :model-config="localModelConfig"
          :camera-position="[0, 2, 5]"
          :camera-look-at="[0, 0, 0]"
          @model-loaded="onLocalModelLoaded"
        />
      </div>
      <div class="demo-controls">
        <ScForm label-width="100px" :inline="true">
          <ScFormItem label="选择模型">
            <ScSelect
              v-model="selectedLocalModel"
              :options="localModelOptions"
              placeholder="请选择本地模型"
              style="width: 300px"
              clearable
              @change="onLocalModelChange"
            />
          </ScFormItem>
        </ScForm>
        <ScForm label-width="100px" :inline="true" style="margin-top: 12px">
          <ScFormItem label="位置 X">
            <ScInputNumber v-model="localModelConfig.position[0]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="位置 Y">
            <ScInputNumber v-model="localModelConfig.position[1]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="位置 Z">
            <ScInputNumber v-model="localModelConfig.position[2]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="缩放">
            <ScInputNumber v-model="localModelScale" :step="0.1" :min="0.1" :max="10" />
          </ScFormItem>
        </ScForm>
      </div>
    </DemoBlock>

    <DemoBlock title="远程模型加载" :code="codes.modelLoading">
      <div class="demo-container">
        <ScThree
          :width="600"
          :height="400"
          :model-urls="modelUrls"
          :model-config="modelConfig"
          :camera-position="[0, 2, 5]"
          :camera-look-at="[0, 0, 0]"
          @model-loaded="onModelLoaded"
        />
      </div>
      <div class="demo-controls">
        <ScForm label-width="100px" :inline="true">
          <ScFormItem label="模型地址">
            <ScInput
              v-model="modelUrlInput"
              placeholder="输入 glb/gltf 模型地址（支持远程 URL）"
              style="width: 300px"
            />
          </ScFormItem>
          <ScFormItem>
            <ScButton type="primary" @click="addModel">添加模型</ScButton>
            <ScButton @click="clearModels">清空模型</ScButton>
          </ScFormItem>
        </ScForm>
        <ScForm label-width="100px" :inline="true" style="margin-top: 12px">
          <ScFormItem label="位置 X">
            <ScInputNumber v-model="modelConfig.position[0]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="位置 Y">
            <ScInputNumber v-model="modelConfig.position[1]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="位置 Z">
            <ScInputNumber v-model="modelConfig.position[2]" :step="0.1" />
          </ScFormItem>
          <ScFormItem label="缩放">
            <ScInputNumber v-model="modelScale" :step="0.1" :min="0.1" :max="10" />
          </ScFormItem>
        </ScForm>
      </div>
    </DemoBlock>

    <ScDivider content-position="left">预设场景</ScDivider>

    <DemoBlock title="预设场景类型" :code="codes.preset">
      <div class="demo-container">
        <ScThree
          :width="600"
          :height="400"
          :preset="currentPreset"
          :camera-position="presetCameraPositions[currentPreset]"
        />
      </div>
      <div class="demo-controls">
        <ScRadioGroup v-model="currentPreset">
          <ScRadio label="none">无预设</ScRadio>
          <ScRadio label="chinaMap">中国地图</ScRadio>
          <ScRadio label="interior">室内装潢</ScRadio>
        </ScRadioGroup>
      </div>
    </DemoBlock>

    <ScDivider content-position="left">透明背景</ScDivider>

    <DemoBlock title="透明背景模式" :code="codes.alpha" dark>
      <div class="demo-container alpha-bg">
        <ScThree
          :width="600"
          :height="400"
          :alpha="true"
          :camera-position="[0, 0, 5]"
          @ready="onAlphaReady"
        />
      </div>
    </DemoBlock>

    <ScDivider content-position="left">属性说明</ScDivider>

    <ScTable :data="propsData" border stripe class="props-table">
      <ScTableColumn prop="name" label="属性名" width="180" />
      <ScTableColumn prop="type" label="类型" width="200" />
      <ScTableColumn prop="default" label="默认值" width="150" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import * as THREE from "three";
import { ScThree } from "@repo/components";
import ScSelect from "@repo/components/ScSelect/index.vue";
import DemoBlock from "./DemoBlock.vue";

/**
 * ScThree 组件示例
 * 展示 Three.js 3D 渲染组件的各种用法，包括模型加载、预设场景等
 */

// 基础场景示例
function onBasicReady(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 添加方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  // 添加网格辅助线
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);

  // 添加坐标轴辅助线
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // 添加一个旋转的立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0.5, 0);
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

// 本地模型配置
const localModelOptions = [
  { label: "蜜蜂模型 (bee_minecraft.glb)", value: "/models/bee_minecraft.glb" },
  { label: "狐狸模型 (fox_minecraft.glb)", value: "/models/fox_minecraft.glb" }
];

const selectedLocalModel = ref<string>("");
const localModelUrls = ref<string[]>([]);
const localModelConfig = ref({
  position: [0, 0, 0] as [number, number, number],
  scale: 1 as number,
  rotation: [0, 0, 0] as [number, number, number]
});

const localModelScale = computed({
  get: () => (typeof localModelConfig.value.scale === "number" ? localModelConfig.value.scale : 1),
  set: (val: number) => {
    localModelConfig.value.scale = val;
  }
});

function onLocalModelChange(value: string) {
  if (value) {
    localModelUrls.value = [value];
  } else {
    localModelUrls.value = [];
  }
}

function onLocalModelLoaded(models: THREE.Object3D[]) {
  console.log("[ScThreeExample] 本地模型加载完成", models);
}

// 远程模型加载示例
const modelUrls = ref<string[]>([]);
const modelUrlInput = ref("");
const modelConfig = ref({
  position: [0, 0, 0] as [number, number, number],
  scale: 1 as number,
  rotation: [0, 0, 0] as [number, number, number]
});

const modelScale = computed({
  get: () => (typeof modelConfig.value.scale === "number" ? modelConfig.value.scale : 1),
  set: (val: number) => {
    modelConfig.value.scale = val;
  }
});

function addModel() {
  if (modelUrlInput.value.trim()) {
    modelUrls.value.push(modelUrlInput.value.trim());
    modelUrlInput.value = "";
  }
}

function clearModels() {
  modelUrls.value = [];
}

function onModelLoaded(models: THREE.Object3D[]) {
  console.log("[ScThreeExample] 远程模型加载完成", models);
}

// 预设场景示例
const currentPreset = ref<"none" | "chinaMap" | "interior">("none");
const presetCameraPositions = {
  none: [0, 0, 5] as [number, number, number],
  chinaMap: [0, 15, 15] as [number, number, number],
  interior: [8, 8, 12] as [number, number, number]
};

// 透明背景示例
function onAlphaReady(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // 添加点光源
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  // 添加一个发光的球体
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00f6ff,
    emissive: 0x004444,
    metalness: 0.8,
    roughness: 0.2
  });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.x += 0.005;
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

// 代码示例
const codes = {
  basic: `<ScThree
  :width="600"
  :height="400"
  :camera-position="[0, 0, 5]"
  @ready="onReady"
/>

<script setup>
import { ScThree } from "@repo/components";
import * as THREE from "three";

function onReady(scene, camera, renderer) {
  // 添加光源和几何体
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  scene.add(light);
  
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
}
<\/script>`,
  localModel: `<ScThree
  :width="600"
  :height="400"
  :model-urls="['/models/bee_minecraft.glb']"
  :model-config="{
    position: [0, 0, 0],
    scale: 1,
    rotation: [0, 0, 0]
  }"
  :camera-position="[0, 2, 5]"
  @model-loaded="onModelLoaded"
/>`,
  modelLoading: `<ScThree
  :width="600"
  :height="400"
  :model-urls="['https://example.com/model.glb']"
  :model-config="{
    position: [0, 0, 0],
    scale: 1,
    rotation: [0, 0, 0]
  }"
  :camera-position="[0, 2, 5]"
  @model-loaded="onModelLoaded"
/>`,
  preset: `<ScThree
  :width="600"
  :height="400"
  preset="chinaMap"
  :camera-position="[0, 15, 15]"
/>`,
  alpha: `<ScThree
  :width="600"
  :height="400"
  :alpha="true"
  :camera-position="[0, 0, 5]"
  @ready="onReady"
/>`
};

// 属性说明
const propsData = [
  {
    name: "width",
    type: "string | number",
    default: "800",
    description: "容器宽度"
  },
  {
    name: "height",
    type: "string | number",
    default: "600",
    description: "容器高度"
  },
  {
    name: "backgroundColor",
    type: "string | number",
    default: "0x000000",
    description: "背景颜色"
  },
  {
    name: "alpha",
    type: "boolean",
    default: "false",
    description: "是否透明背景"
  },
  {
    name: "modelUrls",
    type: "string[]",
    default: "[]",
    description: "模型地址列表，支持 glTF/glb 格式（.glb, .gltf）"
  },
  {
    name: "modelConfig",
    type: "object",
    default: "{ position: [0,0,0], scale: 1, rotation: [0,0,0] }",
    description: "模型加载配置：位置、缩放、旋转"
  },
  {
    name: "preset",
    type: "'none' | 'chinaMap' | 'interior'",
    default: "'none'",
    description: "预设场景类型"
  },
  {
    name: "cameraPosition",
    type: "[number, number, number]",
    default: "[0, 0, 5]",
    description: "相机位置"
  },
  {
    name: "cameraLookAt",
    type: "[number, number, number]",
    default: "[0, 0, 0]",
    description: "相机朝向"
  }
];
</script>

<style scoped lang="scss">
.sc-three-example {
  padding: 20px;

  .example-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .example-desc {
    margin: 0 0 24px 0;
    color: var(--el-text-color-regular);
    line-height: 1.6;
  }

  .demo-container {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);

    &.alpha-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  .demo-controls {
    margin-top: 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .props-table {
    margin-top: 24px;
  }
}
</style>

