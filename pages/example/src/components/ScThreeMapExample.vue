<template>
  <div class="sc-three-map-example">
    <h2 class="example-title">ScThree 与地图联动示例</h2>
    <p class="example-desc">
      展示如何将 ScThree 组件中的 3D 模型显示在地图上（ScMap/ScLayer）
    </p>

    <ScDivider content-position="left">ScLayer 地图上的 3D 模型</ScDivider>

    <DemoBlock title="在 Cesium 地图上显示 3D 模型" :code="codes.layerModel">
      <div class="demo-container">
        <ScLayer
          ref="layerRef"
          :height="500"
          map-type="GAODE"
          :map-tile="MapTile.NORMAL"
          @ready="onLayerReady"
        />
      </div>
      <div class="demo-controls">
        <ScForm label-width="120px" :inline="true">
          <ScFormItem label="模型地址">
            <ScInput
              v-model="modelUrlInput"
              placeholder="输入模型地址（支持 .glb, .gltf, .obj, .fbx, .stl）"
              style="width: 400px"
            />
          </ScFormItem>
          <ScFormItem label="经度">
            <ScInputNumber v-model="modelPosition[0]" :precision="6" :step="0.0001" />
          </ScFormItem>
          <ScFormItem label="纬度">
            <ScInputNumber v-model="modelPosition[1]" :precision="6" :step="0.0001" />
          </ScFormItem>
          <ScFormItem label="高度(米)">
            <ScInputNumber v-model="modelPosition[2]" :step="1" />
          </ScFormItem>
        </ScForm>
        <ScForm label-width="120px" :inline="true" style="margin-top: 12px">
          <ScFormItem label="缩放">
            <ScInputNumber v-model="modelScale" :step="0.1" :min="0.1" :max="10" />
          </ScFormItem>
          <ScFormItem label="偏航角(度)">
            <ScInputNumber v-model="modelRotation[0]" :step="1" />
          </ScFormItem>
          <ScFormItem label="俯仰角(度)">
            <ScInputNumber v-model="modelRotation[1]" :step="1" />
          </ScFormItem>
          <ScFormItem label="翻滚角(度)">
            <ScInputNumber v-model="modelRotation[2]" :step="1" />
          </ScFormItem>
        </ScForm>
        <div style="margin-top: 12px">
          <ScButton type="primary" @click="addModelToLayer">添加模型到地图</ScButton>
          <ScButton @click="clearLayerModels">清空模型</ScButton>
          <ScButton @click="flyToModel" :disabled="!currentModelId">飞行到模型</ScButton>
        </div>
      </div>
    </DemoBlock>

    <ScDivider content-position="left">ScMap 地图上的模型标记</ScDivider>

    <DemoBlock title="在 Leaflet 地图上标记模型位置" :code="codes.mapMarker">
      <div class="demo-container">
        <ScMap
          ref="mapRef"
          :height="500"
          map-type="GAODE"
          :map-tile="MapTile.NORMAL"
          @ready="onMapReady"
        />
      </div>
      <div class="demo-controls">
        <ScForm label-width="120px" :inline="true">
          <ScFormItem label="经度">
            <ScInputNumber v-model="markerPosition[0]" :precision="6" :step="0.0001" />
          </ScFormItem>
          <ScFormItem label="纬度">
            <ScInputNumber v-model="markerPosition[1]" :precision="6" :step="0.0001" />
          </ScFormItem>
        </ScForm>
        <div style="margin-top: 12px">
          <ScButton type="primary" @click="addMarkerToMap">添加标记点</ScButton>
          <ScButton @click="clearMapMarkers">清空标记</ScButton>
        </div>
      </div>
    </DemoBlock>

    <ScDivider content-position="left">支持的模型格式</ScDivider>

    <ScTable :data="formatData" border stripe class="format-table">
      <ScTableColumn prop="format" label="格式" width="100" />
      <ScTableColumn prop="extension" label="扩展名" width="120" />
      <ScTableColumn prop="description" label="说明" />
      <ScTableColumn prop="usage" label="使用场景" />
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScLayer from "@repo/components/ScLayer/index.vue";
import ScMap from "@repo/components/ScMap/index.vue";
import { MapTile } from "@repo/components/ScLayer/types/index";
import type { Model3DOptions } from "@repo/components/ScLayer/composables/CesiumModelObject";
import DemoBlock from "./DemoBlock.vue";
import { message } from "@repo/utils";

/**
 * ScThree 与地图联动示例
 * 展示如何在地图上显示 3D 模型
 */

// ScLayer 相关
const layerRef = ref<InstanceType<typeof ScLayer> | null>(null);
const layerReady = ref(false);
const currentModelId = ref<string | null>(null);
const modelUrlInput = ref("/models/bee_minecraft.glb");
const modelPosition = ref<[number, number, number]>([116.397428, 39.90923, 10]);
const modelScale = ref(1);
const modelRotation = ref<[number, number, number]>([0, 0, 0]);

function onLayerReady() {
  layerReady.value = true;
  message.success("ScLayer 地图已就绪");
}

function addModelToLayer() {
  if (!layerRef.value || !modelUrlInput.value.trim()) {
    message.warning("请先确保地图已加载并输入模型地址");
    return;
  }

  try {
    const modelOptions: Model3DOptions = {
      id: `model_${Date.now()}`,
      url: modelUrlInput.value.trim(),
      position: {
        longitude: modelPosition.value[0],
        latitude: modelPosition.value[1],
        height: modelPosition.value[2]
      },
      scale: {
        x: modelScale.value,
        y: modelScale.value,
        z: modelScale.value
      },
      rotation: {
        heading: modelRotation.value[0],
        pitch: modelRotation.value[1],
        roll: modelRotation.value[2]
      }
    };

    const cesiumObject = layerRef.value.getCesiumObject();
    if (cesiumObject) {
      const modelObject = cesiumObject.getModelObject();
      if (modelObject) {
        const modelId = modelObject.addModel(modelOptions);
        if (modelId) {
          currentModelId.value = modelId;
          message.success("模型已添加到地图");
        } else {
          message.error("模型添加失败");
        }
      } else {
        message.error("无法获取模型对象");
      }
    } else {
      message.error("无法获取 Cesium 对象");
    }
  } catch (error) {
    console.error("[ScThreeMapExample] 添加模型失败:", error);
    message.error("添加模型失败: " + (error as Error).message);
  }
}

function clearLayerModels() {
  if (layerRef.value) {
    const cesiumObject = layerRef.value.getCesiumObject();
    if (cesiumObject) {
      const modelObject = cesiumObject.getModelObject();
      if (modelObject) {
        modelObject.clearAllModels();
        currentModelId.value = null;
        message.success("已清空所有模型");
      }
    }
  }
}

function flyToModel() {
  if (!layerRef.value || !currentModelId.value) {
    return;
  }

  const cesiumObject = layerRef.value.getCesiumObject();
  if (cesiumObject) {
    const modelObject = cesiumObject.getModelObject();
    if (modelObject) {
      modelObject.flyToModel(currentModelId.value, {
        offset: {
          heading: 0,
          pitch: -30,
          range: 100
        },
        duration: 3.0
      });
    }
  }
}

// ScMap 相关
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const mapReady = ref(false);
const markerPosition = ref<[number, number]>([116.397428, 39.90923]);

function onMapReady() {
  mapReady.value = true;
  message.success("ScMap 地图已就绪");
}

function addMarkerToMap() {
  if (!mapRef.value) {
    message.warning("请先确保地图已加载");
    return;
  }

  try {
    const markerObject = mapRef.value.getMarkerObject();
    if (markerObject) {
      markerObject.addMarker({
        id: `marker_${Date.now()}`,
        position: markerPosition.value,
        title: "3D 模型位置",
        content: `模型位置：经度 ${markerPosition.value[0]}, 纬度 ${markerPosition.value[1]}`,
        icon: {
          url: "https://api.iconify.design/mdi:cube-3d.svg?color=%23ff0000",
          size: [32, 32],
          anchor: [16, 32]
        }
      });
      message.success("标记点已添加");
    }
  } catch (error) {
    console.error("[ScThreeMapExample] 添加标记失败:", error);
    message.error("添加标记失败: " + (error as Error).message);
  }
}

function clearMapMarkers() {
  if (mapRef.value) {
    const markerObject = mapRef.value.getMarkerObject();
    if (markerObject) {
      markerObject.clearAllMarkers();
      message.success("已清空所有标记");
    }
  }
}

// 代码示例
const codes = {
  layerModel: `<ScLayer
  ref="layerRef"
  :height="500"
  map-type="GAODE"
  @ready="onLayerReady"
/>

<script setup>
import ScLayer from "@repo/components/ScLayer/index.vue";

const layerRef = ref(null);

function onLayerReady() {
  const cesiumObject = layerRef.value.getCesiumObject();
  const modelObject = cesiumObject.getModelObject();
  
  modelObject.addModel({
    id: "model_1",
    url: "/models/bee_minecraft.glb",
    position: {
      longitude: 116.397428,
      latitude: 39.90923,
      height: 10
    },
    scale: { x: 1, y: 1, z: 1 }
  });
}
<\/script>`,
  mapMarker: `<ScMap
  ref="mapRef"
  :height="500"
  map-type="GAODE"
  @ready="onMapReady"
/>

<script setup>
import ScMap from "@repo/components/ScMap/index.vue";

const mapRef = ref(null);

function onMapReady() {
  const markerObject = mapRef.value.getMarkerObject();
  
  markerObject.addMarker({
    id: "marker_1",
    position: [116.397428, 39.90923],
    title: "3D 模型位置",
    content: "模型位置标记"
  });
}
<\/script>`
};

// 支持的格式数据
const formatData = [
  {
    format: "glTF",
    extension: ".glb, .gltf",
    description: "Khronos Group 的开放标准 3D 格式，推荐使用",
    usage: "通用 3D 模型，支持动画、材质、纹理"
  },
  {
    format: "OBJ",
    extension: ".obj",
    description: "Wavefront OBJ 格式，广泛使用的 3D 模型格式",
    usage: "静态模型，需要配合 .mtl 材质文件"
  },
  {
    format: "FBX",
    extension: ".fbx",
    description: "Autodesk FBX 格式，支持动画和复杂场景",
    usage: "带动画的模型，游戏和影视制作"
  },
  {
    format: "STL",
    extension: ".stl",
    description: "STereoLithography 格式，常用于 3D 打印",
    usage: "简单几何体，3D 打印模型"
  }
];
</script>

<style scoped lang="scss">
.sc-three-map-example {
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
  }

  .demo-controls {
    margin-top: 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .format-table {
    margin-top: 24px;
  }
}
</style>

