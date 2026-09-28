/**
 * 地图组件
 *
 * Leaflet 底图 + 矩形/多边形选区绘制 + 手动四至输入
 * 与 useSelectionStore 双向同步 bounds / polygon
 */
<template>
  <div class="geo-map-wrap" :style="{ height: heightStyle }">
    <div ref="mapRef" class="geo-map-container" />
    <!-- 工具栏 -->
    <div class="geo-map-toolbar">
      <el-button-group>
        <el-tooltip content="矩形选区">
          <el-button
            :type="activeTool === 'rect' ? 'primary' : 'default'"
            @click="toggleTool('rect')"
          >
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="多边形选区">
          <el-button
            :type="activeTool === 'polygon' ? 'primary' : 'default'"
            @click="toggleTool('polygon')"
          >
            <el-icon><EditPen /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="清除选区">
          <el-button @click="clearSelection">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>
      <el-button-group class="ml-8">
        <el-tooltip content="底图：高德路网">
          <el-button
            :type="currentBaseLayer === 'gaode' ? 'primary' : 'default'"
            @click="switchBaseLayer('gaode')"
          >高德</el-button>
        </el-tooltip>
        <el-tooltip content="底图：OSM">
          <el-button
            :type="currentBaseLayer === 'osm' ? 'primary' : 'default'"
            @click="switchBaseLayer('osm')"
          >OSM</el-button>
        </el-tooltip>
        <el-tooltip content="底图：高德影像">
          <el-button
            :type="currentBaseLayer === 'gaode_img' ? 'primary' : 'default'"
            @click="switchBaseLayer('gaode_img')"
          >影像</el-button>
        </el-tooltip>
      </el-button-group>
      <el-button class="ml-8" @click="showBoundsInput = !showBoundsInput">
        <el-icon><Aim /></el-icon>
        手动四至
      </el-button>
    </div>
    <!-- 手动四至面板 -->
    <div v-show="showBoundsInput" class="geo-map-bounds-panel">
      <div class="bounds-title">四至范围 (WGS-84)</div>
      <el-form :inline="true" label-width="40px">
        <el-form-item label="北">
          <el-input-number v-model="manualBounds.north" :step="0.01" :precision="6" controls-position="right" />
        </el-form-item>
        <el-form-item label="南">
          <el-input-number v-model="manualBounds.south" :step="0.01" :precision="6" controls-position="right" />
        </el-form-item>
        <el-form-item label="东">
          <el-input-number v-model="manualBounds.east" :step="0.01" :precision="6" controls-position="right" />
        </el-form-item>
        <el-form-item label="西">
          <el-input-number v-model="manualBounds.west" :step="0.01" :precision="6" controls-position="right" />
        </el-form-item>
      </el-form>
      <div class="bounds-actions">
        <el-button type="primary" @click="applyManualBounds">应用</el-button>
        <el-button @click="showBoundsInput = false">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 地图组件
 *
 * Leaflet 底图 + 矩形/多边形选区绘制 + 手动四至输入
 * 与 useSelectionStore 双向同步 bounds / polygon
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue"
import { FullScreen, EditPen, Delete, Aim } from "@element-plus/icons-vue"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useSelectionStore } from "@/store/selection"
import type { GeoBounds } from "@/types"

/**
 * 组件 props 定义
 * @author CH
 * @since 4.0.0
 */
const props = withDefaults(
  defineProps<{
    /** 地图高度：数字按 px，字符串按 CSS 原样（如 calc(100vh - 156px)） */
    height?: number | string
    center?: [number, number]
    zoom?: number
  }>(),
  {
    height: 500,
    center: () => [39.90923, 116.397428],
    zoom: 5,
  }
)

/** 地图容器高度样式：数字补 px，字符串原样输出 */
const heightStyle = computed<string>(() =>
  typeof props.height === "number" ? `${props.height}px` : props.height
)

const emit = defineEmits<{
  (e: "map-ready", map: L.Map): void
  (e: "bounds-change", bounds: GeoBounds): void
}>()

const mapRef = ref<HTMLDivElement>()
const selection = useSelectionStore()

let map: L.Map | null = null
let drawLayer: L.Layer | null = null
let activeTool = ref<"rect" | "polygon" | null>(null)
let currentBaseLayer = ref<"gaode" | "osm" | "gaode_img">("gaode")
let showBoundsInput = ref(false)
const manualBounds = ref({ north: 39.95, south: 39.85, east: 116.45, west: 116.35 })

let drawingPoints: L.LatLng[] = []
let tempLayer: L.Layer | null = null
let drawingClickListener: ((e: L.LeafletMouseEvent) => void) | null = null
let drawingDblClickListener: ((e: L.LeafletMouseEvent) => void) | null = null

/** 修正 Leaflet 默认图标资源路径 */
function fixLeafletIcon() {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
  })
}

/** 创建底图瓦片图层（高德路网 / OSM / 高德影像） */
function createBaseLayers() {
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  })
  const gaode = L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
    subdomains: "1234",
    maxZoom: 18,
    attribution: "© 高德地图",
  })
  const gaodeImg = L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", {
    subdomains: "1234",
    maxZoom: 18,
    attribution: "© 高德影像",
  })
  return { osm, gaode, gaodeImg }
}

/** 初始化地图实例 */
function initMap() {
  if (!mapRef.value) return
  fixLeafletIcon()
  const layers = createBaseLayers()
  map = L.map(mapRef.value, {
    center: props.center,
    zoom: props.zoom,
    layers: [layers.gaode],
    zoomControl: true,
  })

  const baseLayers: Record<string, L.TileLayer> = {
    高德路网: layers.gaode,
    OSM: layers.osm,
    高德影像: layers.gaodeImg,
  }
  L.control.layers(baseLayers).addTo(map)

  map.on("click", handleMapClick)
  emit("map-ready", map)
}

/**
 * 切换绘制工具
 * @param tool 工具类型：矩形或多边形
 */
function toggleTool(tool: "rect" | "polygon") {
  if (!map) return
  if (activeTool.value === tool) {
    cancelDrawing()
    return
  }
  cancelDrawing()
  activeTool.value = tool
  if (tool === "polygon") {
    startPolygonDraw()
  }
}

/** 开始多边形绘制 */
function startPolygonDraw() {
  if (!map) return
  drawingPoints = []
  drawingClickListener = (e: L.LeafletMouseEvent) => {
    drawingPoints.push(e.latlng)
    removeTempLayer()
    if (drawingPoints.length >= 2) {
      tempLayer = L.polygon(drawingPoints, {
        color: "#409eff",
        weight: 2,
        dashArray: "6 3",
        fillOpacity: 0.08,
      }).addTo(map!)
    } else {
      tempLayer = L.circleMarker(e.latlng, {
        radius: 4,
        color: "#409eff",
        fillColor: "#409eff",
        fillOpacity: 1,
      }).addTo(map!)
    }
  }
  drawingDblClickListener = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e)
    if (drawingPoints.length >= 3) {
      finishPolygonDraw()
    }
  }
  map!.on("click", drawingClickListener)
  map!.on("dblclick", drawingDblClickListener)
  map!.getContainer().style.cursor = "crosshair"
}

/** 完成多边形绘制并同步至选区 store */
function finishPolygonDraw() {
  if (!map || drawingPoints.length < 3) return
  removeTempLayer()
  removeDrawLayer()
  const polygon = L.polygon(drawingPoints, {
    color: "#409eff",
    weight: 2,
    fillOpacity: 0.15,
  }).addTo(map)
  drawLayer = polygon
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[]
  const polygonCoords: Array<[number, number]> = latlngs.map((ll) => [ll.lat, ll.lng])
  selection.setPolygon(polygonCoords)
  const bounds = polygon.getBounds()
  const b: GeoBounds = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
  selection.setBounds(b)
  emit("bounds-change", b)
  cancelDrawing()
}

/**
 * 地图点击事件处理（矩形工具下开始绘制）
 * @param e Leaflet 鼠标事件
 */
function handleMapClick(e: L.LeafletMouseEvent) {
  if (activeTool.value === "rect") {
    startRectDraw(e.latlng)
  }
}

/**
 * LatLng 转 [lat, lng] 元组
 *
 * Leaflet 的 bounds 表达式（rectangle / setBounds）在类型上只接受 LatLngTuple，
 * 不接受 LatLng 对象，统一在此转换。
 *
 * @param p 经纬度点
 * @return [纬度, 经度] 元组
 */
function toTuple(p: L.LatLng): [number, number] {
  return [p.lat, p.lng]
}

/**
 * 开始矩形绘制
 * @param start 矩形起点坐标
 */
function startRectDraw(start: L.LatLng) {
  if (!map) return
  removeDrawLayer()
  const rect = L.rectangle([toTuple(start), toTuple(start)], {
    color: "#409eff",
    weight: 2,
    fillOpacity: 0.15,
  }).addTo(map)
  drawLayer = rect

  const onMove = (ev: L.LeafletMouseEvent) => {
    rect.setBounds([toTuple(start), toTuple(ev.latlng)])
  }
  const onUp = (ev: L.LeafletMouseEvent) => {
    map!.off("mousemove", onMove)
    map!.off("mouseup", onUp)
    rect.setBounds([toTuple(start), toTuple(ev.latlng)])
    const b = rect.getBounds()
    const bounds: GeoBounds = {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    }
    selection.setBounds(bounds)
    selection.setPolygon(null)
    emit("bounds-change", bounds)
    activeTool.value = null
    map!.getContainer().style.cursor = ""
  }
  map.on("mousemove", onMove)
  map.on("mouseup", onUp)
}

/** 移除绘制图层 */
function removeDrawLayer() {
  if (drawLayer && map) {
    map.removeLayer(drawLayer)
    drawLayer = null
  }
}

/** 移除临时预览图层 */
function removeTempLayer() {
  if (tempLayer && map) {
    map.removeLayer(tempLayer)
    tempLayer = null
  }
}

/** 取消当前绘制 */
function cancelDrawing() {
  if (map) {
    if (drawingClickListener) map.off("click", drawingClickListener)
    if (drawingDblClickListener) map.off("dblclick", drawingDblClickListener)
    map.getContainer().style.cursor = ""
  }
  drawingClickListener = null
  drawingDblClickListener = null
  drawingPoints = []
  removeTempLayer()
  activeTool.value = null
}

/** 清除全部选区 */
function clearSelection() {
  removeDrawLayer()
  selection.clear()
  drawingPoints = []
}

/**
 * 切换底图
 * @param name 底图键名：gaode / osm / gaode_img
 */
function switchBaseLayer(name: "gaode" | "osm" | "gaode_img") {
  if (!map) return
  const layers = createBaseLayers()
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map!.removeLayer(layer)
  })
  // 对外键名为 gaode_img，内部图层字段为 gaodeImg，此处做一次映射
  const layer = name === "gaode_img" ? layers.gaodeImg : layers[name]
  map.addLayer(layer)
  currentBaseLayer.value = name
}

/** 应用手动输入的四至范围 */
function applyManualBounds() {
  const b = manualBounds.value
  const bounds: GeoBounds = {
    north: Number(b.north),
    south: Number(b.south),
    east: Number(b.east),
    west: Number(b.west),
  }
  selection.setBounds(bounds)
  selection.setPolygon(null)
  removeDrawLayer()
  if (map) {
    const leafletBounds = L.latLngBounds(
      L.latLng(bounds.south, bounds.west),
      L.latLng(bounds.north, bounds.east)
    )
    drawLayer = L.rectangle(leafletBounds, {
      color: "#409eff",
      weight: 2,
      fillOpacity: 0.15,
    }).addTo(map)
    map.fitBounds(leafletBounds)
  }
  emit("bounds-change", bounds)
}

// 监听 selection store 变化，同步到地图
watch(
  () => selection.bounds,
  (b) => {
    if (b && map) {
      manualBounds.value = { ...b }
    }
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => initMap())
})

onBeforeUnmount(() => {
  cancelDrawing()
  if (map) {
    map.remove()
    map = null
  }
})

defineExpose({
  getMap: () => map,
  fitBounds: (bounds: GeoBounds) => {
    if (map) {
      map.fitBounds(
        L.latLngBounds(
          L.latLng(bounds.south, bounds.west),
          L.latLng(bounds.north, bounds.east)
        )
      )
    }
  },
})
</script>

<style scoped>
.geo-map-wrap {
  position: relative;
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  overflow: hidden;
}

.geo-map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 浮在地图上的工具条 / 面板：边界用描边承载，不用投影
   （koi 规约：卡片与容器不投影；且投影压在瓦片影像上会显脏） */
.geo-map-toolbar {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  padding: 6px 10px;
  border-radius: var(--el-radius-sm, 6px);
}

.ml-8 { margin-left: 8px; }

.geo-map-bounds-panel {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 1000;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  padding: 12px 16px;
  border-radius: var(--el-radius-sm, 6px);
  min-width: 340px;
}

.bounds-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.bounds-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* 尊重系统「减少动态效果」偏好：
   本组件自身无 transition/animation，要关掉的是 Leaflet 自带的
   缩放位移与弹层淡入动画 —— 瓦片与选区绘制结果不受影响，只是不再有过渡。
   Leaflet 的 DOM 在 .geo-map-wrap 内，故用 :deep 命中。 */
@media (prefers-reduced-motion: reduce) {
  .geo-map-wrap :deep(.leaflet-zoom-anim .leaflet-zoom-animated),
  .geo-map-wrap :deep(.leaflet-fade-anim .leaflet-tile),
  .geo-map-wrap :deep(.leaflet-fade-anim .leaflet-popup) {
    transition: none;
  }
}
</style>
