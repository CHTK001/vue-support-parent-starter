# ReMap3D - Dual-Engine 3D Map Component (Enhanced)

基于双引擎的 3D 地图组件，支持 **Mars3D**（Three.js 三维地球）和 **MapLibre GL**（矢量地图）两种引擎。增强版包含更多交互功能和工具。

## 🎯 核心特性

### Mars3D 引擎特色
- ✅ **三种视图模式**: 球体 / 线框 / 点阵
- ✅ **灯光控制**: 环境光/方向光独立开关
- ✅ **轨道动画**: 可切换轨道显示
- ✅ **帧率统计**: 实时 FPS 显示（调试模式）
- ✅ **自动旋转**: 速度与开关控制
- ✅ **视角飞渡**: 一键飞向指定标记点
- ✅ **调试模式**: GPU 资源/物体数量监控

### MapLibre GL 引擎特色
- ✅ **三种地图样式**: 街道 / 卫星 / 暗黑主题
- ✅ **倾斜视角**: 45°立体视角展示
- ✅ **导航控件**: 缩放 + 指南针集成
- ✅ **边界适配**: 自动计算所有标记点包围盒
- ✅ **图像导出**: PNG 截图下载
- ✅ **缩放监听**: 实时更新缩放级别
- ✅ **响应式**: 窗口自适应调整

### 通用功能
- ✅ **引擎热切换**: 运行时自由切换引擎
- ✅ **全屏支持**: WebGL 容器全屏预览
- ✅ **状态标识**: 加载完成绿色指示器
- ✅ **错误处理**: 完善的错误回调机制
- ✅ **调试面板**: Mars3D 性能监控覆盖层

## 📦 安装依赖

### Mars3D 引擎 (默认)
无需额外安装，使用现有的 `three` 库。

### MapLibre GL 引擎
如需使用 MapLibre 引擎，需要安装：

```bash
pnpm add maplibre-gl
pnpm add -D @types/maplibre-gl
```

## 🚀 基本用法

### 1. Mars3D 引擎（3D 地球可视化）

```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
</script>

<template>
  <!-- 默认的 Mars3D 球体模式 -->
  <ReMap3D :height="500" />
  
  <!-- 线框模式 + 灯光控制 -->
  <ReMap3D 
    engine="mars3d" 
    mode="wireframe" 
    height="500"
    :auto-rotate="true"
    :auto-rotate-speed="0.5"
  />
  
  <!-- 点阵模式 -->
  <ReMap3D engine="mars3d" mode="dots" :height="500" />
  
  <!-- 自定义标记点 -->
  <ReMap3D 
    :pins="[
      { name: '北京', lat: 39.9042, lng: 116.4074, type: 'server' },
      { name: '上海', lat: 31.2304, lng: 121.4737, type: 'redis' }
    ]" 
    height="500" 
  />
</template>
```

### 2. MapLibre GL 引擎（矢量地图）

```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
</script>

<template>
  <!-- 默认的街道视图 -->
  <ReMap3D engine="maplibre" :height="500" />
  
  <!-- 卫星视图 -->
  <ReMap3D engine="maplibre" view-style="satellite" :height="500" />
  
  <!-- 暗黑模式 -->
  <ReMap3D engine="maplibre" view-style="dark" :height="500" />
  
  <!-- 指定位置 + 图像导出 -->
  <ReMap3D 
    engine="maplibre"
    :location="{ lat: 30.2741, lng: 120.1551, zoom: 10 }" 
    height="500"
    :enable-export-image="true"
  />
</template>
```

### 3. 动态切换引擎

```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
import { ref } from 'vue'

const selectedEngine = ref<'mars3d' | 'maplibre'>('mars3d')

function onEngineChange(engine: string) {
  console.log('Engine switched to:', engine)
  // 可以在此处触发业务逻辑
}

function handleReady() {
  console.log('地图已准备好')
}

function handleError(error: Error) {
  console.error('地图加载失败:', error)
}
</script>

<template>
  <ReMap3D 
    v-model:engine="selectedEngine"
    @engine-change="onEngineChange"
    @ready="handleReady"
    @load-error="handleError"
    height="600"
  />
</template>
```

### 4. 高级功能演示

#### Mars3D 调试模式
```vue
<template>
  <ReMap3D 
    engine="mars3d"
    :debug-enabled="true"
    :support-fullscreen="true"
    :show-status="true"
    height="500"
  />
</template>
```

#### MapLibre 边界适配
```vue
<template>
  <ReMap3D 
    engine="maplibre"
    :height="500"
    @pin-click="handlePinClick"
  >
    <template #dropdown-menu>
      <!-- 可以通过下拉菜单调用 fitBounds -->
      <el-dropdown-item command="fitBounds">适配所有标记点</el-dropdown-item>
    </template>
  </ReMap3D>
</template>
```

#### 全屏预览
```vue
<template>
  <ReMap3D 
    height="800"
    :support-fullscreen="true"
    @ready="console.log('地图就绪')"
  />
</template>
```

## 💡 高级用法

### 1. 使用事件回调
```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
import { ElMessage } from 'element-plus'

function handlePinClick(pin: ReMap3DPin) {
  ElMessage.info(`点击了：${pin.name}`)
  // 打开详情页
}

function handleReady() {
  ElMessage.success('地图加载完成')
}

function handleError(error: Error) {
  ElMessage.error(`地图错误：${error.message}`)
}
</script>

<template>
  <ReMap3D 
    @pin-click="handlePinClick"
    @ready="handleReady"
    @load-error="handleError"
  />
</template>
```

### 2. 组合使用多个实例
```vue
<template>
  <div class="dual-map">
    <ReMap3D engine="mars3d" height="400" title="全球视角" />
    <ReMap3D engine="maplibre" height="400" title="区域地图" />
  </div>
</template>

<style scoped>
.dual-map {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
```

### 3. 通过 Ref 操作实例
```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
import { ref } from 'vue'

const marsInstance = ref(null)

// 可以通过 ref 访问内部方法
function flyToBeijing() {
  // 实现飞渡逻辑
}
</script>
```

## 📝 Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `engine` | 地图引擎类型 | `'mars3d' \| 'maplibre'` | `'mars3d'` |
| `pins` | 标记点列表 | `ReMap3DPin[]` | 默认定位城市 |
| `location` | 初始位置 | `ReMap3DLocation \| string` | `undefined` |
| `height` | 容器高度 | `number \| string` | `500` |
| `autoRotate` | 是否自动旋转 | `boolean` | `true` |
| `showFooter` | 显示底部信息栏 | `boolean` | `true` |
| `showStatus` | 显示运行状态标识 | `boolean` | `false` |
| `debugEnabled` | 启用调试模式 | `boolean` | `false` |
| `supportFullscreen` | 是否支持全屏 | `boolean` | `true` |
| `enableExportImage` | 是否支持图像导出 | `boolean` | `true` |
| `autoResetOnResize` | 窗口 resize 后自动重置 | `boolean` | `true` |

### Mars3D 专用 Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `mode` | 地球展示模式 | `'globe' \| 'wireframe' \| 'dots'` | `'globe'` |
| `autoRotateSpeed` | 自动旋转速度 | `number` | `0.2` |

### MapLibre 专用 Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `viewStyle` | 地图样式（仅 MapLibre） | `'streets' \| 'satellite' \| 'dark'` | `'streets'` |

## 🔧 Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| `pin-click` | 点击标记点 | `(pin: ReMap3DPin)` |
| `engine-change` | 引擎切换 | `(engine: 'mars3d' \| 'maplibre')` |
| `ready` | 地图初始化完成 | - |
| `load-error` | 地图加载失败 | `(error: Error)` |

## 🎯 Types

```typescript
export interface ReMap3DPin {
  name: string        // 标记名称
  lat: number         // 纬度
  lng: number         // 经度
  type?: string       // 标记类型（用于颜色）
  color?: string      // 自定义颜色
  value?: number      // 数值标识
}

export interface ReMap3DLocation {
  lat: number
  lng: number
  zoom?: number       // 缩放级别（MapLibre 专用）
}

export type MapEngine = 'mars3d' | 'maplibre'
```

## 🌟 功能特性

### Mars3D 引擎
- ✅ 真实 3D 地球球体渲染
- ✅ 三种模式：实体球 / 线框 / 点阵
- ✅ 自动旋转控制
- ✅ 多标记点展示
- ✅ 环绕轨道动画
- ✅ 光照明暗效果

### MapLibre GL 引擎
- ✅ 高性能 WebGL 矢量地图
- ✅ 三种地图样式：街道/卫星/暗黑
- ✅ 交互式平移缩放
- ✅ 自定义标记点
- ✅ 导航控件与比例尺
- ✅ 响应式布局

## 🔗 与其他组件配合

```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
import ReCard from '@repo/ui/re-card'

const pins = ref([
  { name: '服务器 A', lat: 39.9042, lng: 116.4074, type: 'server', value: 3 },
  { name: 'Redis 节点', lat: 31.2304, lng: 121.4737, type: 'redis', value: 2 }
])

function handlePinClick(pin: ReMap3DPin) {
  console.log('Clicked:', pin)
  // 可打开详情抽屉或弹窗
}
</script>

<template>
  <ReCard shadow="always">
    <ReMap3D 
      :pins="pins"
      @pin-click="handlePinClick"
      height="600"
    />
  </ReCard>
</template>
```

## 📚 完整示例

```vue
<script setup lang="ts">
import ReMap3D from '@repo/ui/re-map3d'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const engine = ref<'mars3d' | 'maplibre'>('mars3d')

// 自定义标记点
const customPins = ref([
  { name: '数据中心 A', lat: 40.1234, lng: 116.5678, type: 'server', value: 10 },
  { name: 'Redis 集群', lat: 39.8765, lng: 116.4321, type: 'redis', value: 8 },
  { name: 'MySQL 主库', lat: 31.5678, lng: 121.2345, type: 'mysql', value: 5 }
])

function handlePinClick(pin: ReMap3DPin) {
  ElMessage.success(`访问：${pin.name}`)
}

function handleReady() {
  console.log('地图已就绪')
}

function handleError(error: Error) {
  ElMessage.error('地图加载失败')
  console.error(error)
}
</script>

<template>
  <ReCard title="双引擎 3D 地图展示" shadow="always">
    <ReMap3D 
      :engine="engine"
      :pins="customPins"
      :height="600"
      @ready="handleReady"
      @load-error="handleError"
      @pin-click="handlePinClick"
      :support-fullscreen="true"
      :debug-enabled="false"
    />
    
    <el-button-group style="margin-top: 16px;">
      <el-radio-group v-model="engine" size="small">
        <el-radio-button value="mars3d">Mars3D</el-radio-button>
        <el-radio-button value="maplibre">MapLibre</el-radio-button>
      </el-radio-group>
    </el-button-group>
  </ReCard>
</template>
```

## 💡 注意事项

1. **MapLibre 需要网络**: MapLibre GL 需要从远程服务器加载瓦片数据和样式文件，确保网络连接正常。

2. **性能优化**: 
   - Mars3D 在大数据量标记时可能影响性能，建议限制 pins 数量
   - MapLibre 对于大规模 marker 建议使用 Custom Overlay 或 Canvas Layer

3. **跨域问题**: 使用 MapLibre 时，如果本地加载本地瓦片，可能需要配置 CORS。

4. **API Token**: 某些地图服务需要 API Token，可在代码中替换对应的 token。

5. **响应式**: 组件会根据父容器自适应宽度，请确保设置了明确的高度。

6. **全屏兼容性**: 全屏功能依赖浏览器全屏 API，iOS Safari 支持有限。

7. **错误处理**: 务必监听 `load-error` 事件以捕获地图加载失败的情况。

8. **调试模式**: 生产环境请关闭 `debug-enabled`，避免泄露敏感信息。

## 🔗 API 参考

### 类型定义

```typescript
export interface ReMap3DPin {
  name: string         // 标记名称（必填）
  lat: number          // 纬度 -180 ~ 180（必填）
  lng: number          // 经度 -180 ~ 180（必填）
  type?: string        // 标记类型（可选）- server/redis/mysql/alert/custom
  color?: string       // 自定义颜色 (#RRGGBB)
  value?: number       // 数值标识
}

export interface ReMap3DLocation {
  lat: number          // 纬度
  lng: number          // 经度
  zoom?: number        // 缩放级别（仅 MapLibre）
}

export type MapEngine = 'mars3d' | 'maplibre'
```

### 工具函数

```typescript
// 经纬度转三维向量
export function latLonToVec3(lat: number, lng: number, r: number): THREE.Vector3
```

## 🎨 UI 定制

可以通过 CSS 变量定制样式：

```css
.re-map3d-card {
  /* 自定义卡片样式 */
}

.map3d-footer {
  background: var(--your-bg-color);
}

.debug-panel {
  background: rgba(0, 0, 0, 0.9);
  color: #0f0;
}
```

## 🌟 扩展能力

- **自定义 Marker**: 可通过 `custom-marker` 样式修改 MapLibre 的 marker
- **自定义地球纹理**: Mars3D 的球体材质可修改为贴图
- **数据绑定**: 可通过 props/reactive 数据驱动地图更新
- **组合布局**: 可与图表、表格等组件组合使用

完整的示例代码请参考项目中的演示页面或使用 Storybook 查看交互式演示。</p>