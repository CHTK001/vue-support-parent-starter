# face-api 插件与工具说明

## 目标

为前端提供统一的人脸检测、人脸特征提取与特征比对能力，避免业务侧重复直接操作 `face-api.js` 与 `@tensorflow/tfjs`。

## 能力入口

### 1. 工具层

文件：

- `packages/utils/src/face/index.ts`

导出：

- `createFaceApiService`
- `ensureFaceApiBackend`
- `loadFaceApiModels`
- `calculateFaceDescriptorDistance`
- `isFaceDescriptorMatch`

### 2. Vue 插件层

文件：

- `packages/plugins/faceApi.ts`

导出：

- `createFaceApiPlugin`
- `FACE_API_INJECTION_KEY`

默认全局属性：

- `$faceApi`

## 基础用法

### 1. 直接创建服务

```ts
import { createFaceApiService } from "@repo/utils";

const faceApi = createFaceApiService({
  modelPath: "/models/face-api",
  backend: "webgl",
  autoLoadModels: true,
  defaultDetector: "tiny",
});
```

### 2. 注册为 Vue 插件

```ts
import { createApp } from "vue";
import { createFaceApiPlugin } from "@repo/plugins";
import App from "./App.vue";

const app = createApp(App);

app.use(
  createFaceApiPlugin({
    modelPath: "/models/face-api",
    backend: "webgl",
  }),
);

app.mount("#app");
```

注册后可直接在组件实例中使用：

```ts
const result = await this.$faceApi.detectSingleFace("/demo/face.png");
```

## 核心配置

`createFaceApiService` / `createFaceApiPlugin` 支持以下常用配置：

- `modelPath`: 模型目录，必填，未提供时 `loadModels` 会直接报错
- `backend`: `"webgl"` 或 `"cpu"`，默认 `"webgl"`
- `autoLoadModels`: 是否在检测前自动补齐所需模型，默认 `true`
- `defaultDetector`: `"tiny"` 或 `"ssd"`，默认 `"tiny"`
- `defaultMinConfidence`: 默认置信度，默认 `0.5`
- `defaultTinyInputSize`: tiny detector 输入尺寸，默认 `320`
- `globalPropertyName`: 插件挂载到 Vue 全局属性时的字段名，默认 `$faceApi`

## 常用方法

### 1. `loadModels`

显式预加载模型：

```ts
await faceApi.loadModels({
  modelPath: "/models/face-api",
  models: ["tinyFaceDetector", "faceLandmark68Net", "faceRecognitionNet"],
});
```

### 2. `detectSingleFace`

检测单张图片中的一张人脸：

```ts
const result = await faceApi.detectSingleFace("/demo/face.png", {
  withLandmarks: true,
  withDescriptor: true,
});
```

### 3. `detectAllFaces`

检测图片中的多张人脸：

```ts
const faces = await faceApi.detectAllFaces("/demo/group.png", {
  withLandmarks: true,
  withDescriptor: true,
  maxResults: 20,
});
```

### 4. `extractDescriptor`

提取单张输入的人脸特征向量：

```ts
const descriptor = await faceApi.extractDescriptor("/demo/face.png");
```

返回值：

- 成功时为 `Float32Array`
- 未检测到人脸时为 `null`

### 5. `compareDescriptors`

直接比较两组人脸特征：

```ts
const compareResult = faceApi.compareDescriptors(leftDescriptor, rightDescriptor, 0.6);
```

返回：

```ts
{
  distance: 0.42,
  matched: true,
  threshold: 0.6,
}
```

### 6. `compareInputs`

直接比较两张图片：

```ts
const compareResult = await faceApi.compareInputs(
  "/demo/a.png",
  "/demo/b.png",
  { threshold: 0.6 },
);
```

### 7. `createMatcher`

创建带标签的人脸匹配器：

```ts
const matcher = await faceApi.createMatcher([
  {
    label: "alice",
    descriptors: [descriptorA1, descriptorA2],
  },
  {
    label: "bob",
    descriptors: [descriptorB1],
  },
]);
```

## 输入类型

当前支持：

- 图片 URL 字符串
- `Blob`
- `File`
- `HTMLImageElement`
- `HTMLVideoElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `ImageData`

## 后端与模型建议

- 模型静态资源建议统一托管到 `/models/face-api`
- 浏览器优先使用 `webgl`，不支持时服务会自动回退到 `cpu`
- 生产场景建议首次进入业务页时先执行一次 `loadModels`

## 推荐接入顺序

1. 先准备模型目录
2. 启动时注册 `createFaceApiPlugin`
3. 业务页进入时执行 `loadModels`
4. 检测时优先调用 `extractDescriptor`
5. 比对时使用 `compareDescriptors` 或 `compareInputs`

## 测试

当前已覆盖的单测：

- `packages/utils/tests/face-api.test.ts`

执行命令：

```bash
pnpm --filter @repo/utils exec vitest run tests/face-api.test.ts
```
