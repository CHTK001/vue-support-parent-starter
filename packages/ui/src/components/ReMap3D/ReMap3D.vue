<template>
  <ReCard layout="simple" :radius="12" :padding="0" shadow="never" class="re-map3d-card">
    <template #header>
      <div class="map3d-head">
        <div class="map3d-title-wrap">
          <ReIcon v-if="engine === 'mars3d'" name="Earth" :size="16" />
          <ReIcon v-else name="LayerGroup" :size="16" />
          <span class="map3d-title">{{ titleText }}</span>
          <el-tag v-if="showStatus && isReady" type="success" size="small" round effect="plain" class="status-tag">✓</el-tag>
        </div>

        <div class="map3d-controls">
          <!-- Engine selector -->
          <el-radio-group v-model="selectedEngine" class="engine-select" @change="onEngineChange">
            <el-radio-button value="mars3d">Mars3D</el-radio-button>
            <el-radio-button value="maplibre">MapLibre</el-radio-button>
          </el-radio-group>

          <!-- Engine-specific controls -->
          <template v-if="engine === 'mars3d'">
            <el-radio-group v-model="globeMode" class="map-mode" size="small">
              <el-radio-button value="globe">球体</el-radio-button>
              <el-radio-button value="wireframe">线框</el-radio-button>
              <el-radio-button value="dots">点阵</el-radio-button>
            </el-radio-group>

            <!-- Mars3D advanced controls -->
            <el-dropdown trigger="click" @command="handleMars3DDropdown">
              <el-button plain size="small"><ReIcon name="Setting" /><el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggleOrbit" :disabled="!globeGroup">切换轨道</el-dropdown-item>
                  <el-dropdown-item command="toggleLights" :disabled="!sceneReady">灯光效果</el-dropdown-item>
                  <el-dropdown-item command="resetView">重置视角</el-dropdown-item>
                  <el-dropdown-item command="flyToPin">飞抵标记</el-dropdown-item>
                  <el-dropdown-item command="toggleDebug" :disabled="!debugEnabled">调试模式</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <el-radio-group v-model="viewStyle" class="map-style" size="small">
              <el-radio-button value="streets">街道</el-radio-button>
              <el-radio-button value="satellite">卫星</el-radio-button>
              <el-radio-button value="dark">暗黑</el-radio-button>
            </el-radio-group>

            <!-- MapLibre advanced controls -->
            <el-dropdown trigger="click" @command="handleMapLibreDropdown">
              <el-button plain size="small"><ReIcon name="Setting" /><el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="fitBounds">适配边界</el-dropdown-item>
                  <el-dropdown-item command="centerPin">中心到标记</el-dropdown-item>
                  <el-dropdown-item command="toggleAttribution">版权信息</el-dropdown-item>
                  <el-dropdown-item command="exportImage">导出图像</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <el-button-group class="map-nav">
            <el-button plain @click="resetView"><ReIcon name="HomeFilled" /></el-button>
            <el-button
              v-if="canAutoRotate"
              plain
              :icon="autoRotate ? '' : ''"
              @click="toggleRotate"
              :class="{ active: autoRotate }"
            >
              <ReIcon name="RefreshRight" />
            </el-button>
            <el-button plain @click="toggleFullscreen" v-if="supportFullscreen">
              <ReIcon name="FullScreen" />
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="map3d-body" :style="{ height: geBodyHeight }">
      <!-- Mars3D engine -->
      <div v-if="engine === 'mars3d'" class="mars3d-container" ref="marsContainer">
        <ReThree
          v-if="initialized"
          :render="renderMars3D"
          :animate="animateMars3D"
          :auto-rotate="autoRotate"
          :auto-rotate-speed="autoRotateSpeed"
          @ready="onMarsReady"
        />
        <div v-else class="loading-mask">正在加载 Mars3D...</div>
      </div>

      <!-- MapLibre engine -->
      <div v-else class="maplibre-container" ref="maplibreContainer">
        <div v-if="!maplibreLoaded" class="loading-mask">正在加载 MapLibre...</div>
        <div id="map" style="width: 100%; height: 100%;" v-else></div>
      </div>
    </div>

    <!-- Status bar (always visible) -->
    <div v-if="showFooter" class="map3d-footer">
      <el-space :size="24">
        <span class="map3d-info">
          <ReIcon name="InfoFilled" />
          {{ pins.length }} 个标记
        </span>
        <span class="map3d-stat" v-if="engine === 'mars3d'">
          <ReIcon name="Monitor" />
          旋转 {{ autoRotate ? '开' : '关' }} · 速度 {{ autoRotateSpeed.toFixed(2) }}x
        </span>
        <span class="map3d-stat" v-else>
          <ReIcon name="ZoomIn" />
          缩放 {{ currentZoom?.toFixed(1) }}x
        </span>
        <span class="map3d-coords">
          <ReIcon name="Location" />
          {{ focalCoords }}
        </span>
      </el-space>
    </div>

    <!-- Debug overlay (Mars3D only) -->
    <div v-if="engine === 'mars3d' && debugEnabled" class="debug-overlay">
      <div class="debug-panel">
        <h4>调试信息</h4>
        <div class="debug-row">帧率：<span id="fps-counter">{{ fps }}</span> FPS</div>
        <div class="debug-row">网格数：<span>{{ meshVertexCount }}</span></div>
        <div class="debug-row">物体数：<span>{{ sceneObjectsCount }}</span></div>
      </div>
    </div>
  </ReCard>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import type { ReThreeContext } from '@repo/ui/re-three'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

// Engine types
export type MapEngine = 'mars3d' | 'maplibre'

export interface ReMap3DPin {
  name: string
  lat: number
  lng: number
  type?: string
  color?: string
  value?: number
}

export interface ReMap3DLocation {
  lat: number
  lng: number
  zoom?: number
}

const props = withDefaults(
  defineProps<{
    engine?: MapEngine
    pins?: ReMap3DPin[]
    location?: ReMap3DLocation | string
    height?: number | string
    autoRotate?: boolean
    showFooter?: boolean
    showStatus?: boolean
    debugEnabled?: boolean
    supportFullscreen?: boolean
    enableExportImage?: boolean
    autoResetOnResize?: boolean
  }>(),
  {
    engine: 'mars3d',
    pins: () => [
      { name: '北京', lat: 39.9042, lng: 116.4074, type: 'server', value: 3 },
      { name: '上海', lat: 31.2304, lng: 121.4737, type: 'redis', value: 2 },
      { name: '东京', lat: 35.6762, lng: 139.6503, type: 'mysql', value: 1 },
      { name: '法兰克福', lat: 50.1109, lng: 8.6821, type: 'server', value: 4 },
      { name: '圣何塞', lat: 37.3382, lng: -121.8863, type: 'alert', value: 5 },
      { name: '圣保罗', lat: -23.5505, lng: -46.6333, type: 'server', value: 2 },
    ],
    location: undefined,
    height: 500,
    autoRotate: true,
    showFooter: true,
    showStatus: false,
    debugEnabled: false,
    supportFullscreen: true,
    enableExportImage: true,
    autoResetOnResize: true,
  },
)

const emit = defineEmits<{
  (e: 'pin-click', pin: ReMap3DPin): void
  (e: 'engine-change', engine: MapEngine): void
  (e: 'ready'): void
  (e: 'load-error', error: Error): void
}>()

const selectedEngine = ref<MapEngine>(props.engine)
const initialized = ref(false)
const maplibreLoaded = ref(false)
const isReady = ref(false)
const sceneReady = ref(false)
const canAutoRotate = ref(true)
const autoRotate = ref(props.autoRotate)

// Mars3D specific
const globeMode = ref<'globe' | 'wireframe' | 'dots'>('globe')
const autoRotateSpeed = ref(0.2)
const toggleOrbit = ref(true)
const toggleLights = ref(true)
const debugMode = ref(false)
const fps = ref(0)
let lastTime = performance.now()
let frameCount = 0

// MapLibre specific
const viewStyle = ref<'streets' | 'satellite' | 'dark'>('streets')
const currentZoom = ref<number>(1)
const showAttribution = ref(true)

const marsContainer = ref<HTMLDivElement>()
const maplibreContainer = ref<HTMLDivElement>()
let mapInstance: any = null

// ========== ReThree / Globe shared state ==========
const globeMesh = shallowRef<THREE.Mesh | null>(null)
const wireframeMesh = shallowRef<THREE.Mesh | null>(null)
const dotCloud = shallowRef<THREE.Points | null>(null)
const pinGroup = shallowRef<THREE.Group | null>(null)
const ringGroup = shallowRef<THREE.Group | null>(null)
const globeGroup = shallowRef<THREE.Group | null>(null)
let ctx: ReThreeContext | null = null

const titleText = computed(() => selectedEngine.value === 'mars3d' ? '3D 地球' : '3D 地图')

const geBodyHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
)

const focalCoords = computed(() => {
  if (props.location && typeof props.location === 'object') {
    return `${props.location.lat.toFixed(2)}, ${props.location.lng.toFixed(2)}`
  }
  const p = props.pins[0]
  return p ? `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` : '0, 0'
})

const sceneObjectsCount = computed(() => {
  return (globeMesh.value ? 1 : 0) + (wireframeMesh.value ? 1 : 0) + (dotCloud.value ? 1 : 0)
})

/**
 * 网格顶点数（调试面板用）：three r125+ 已把 BufferGeometry.vertices 移到
 * attributes.position.count，旧的 .vertices 只是兼容残留，类型上已不存在。
 * 这里只读一个数值展示，不做其它用途。
 */
const meshVertexCount = computed<number>(() => {
  const g = globeMesh.value?.geometry
  const pos = (g as unknown as { attributes?: { position?: { count?: number } } })?.attributes?.position
  return pos?.count ?? 0
})

const pinColorMap: Record<string, string> = {
  server: '#5b8def',
  redis: '#f59e0b',
  mysql: '#22c55e',
  alert: '#ef4444',
  custom: '#a855f7',
}

const pinColor = (type: string) => pinColorMap[type] || '#94a3b8'

function latLonToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// Watch engine changes
watch(selectedEngine, async (newEngine) => {
  if (newEngine !== props.engine) {
    emit('engine-change', newEngine)
    await onEngineChange(newEngine)
    await nextTick()
  }
})

async function onEngineChange(engine: MapEngine) {
  // Cleanup old instance
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  initialized.value = false
  maplibreLoaded.value = false
  isReady.value = false

  if (engine === 'mars3d') {
    // Mars3D needs reinitialization
    await nextTick()
    await nextTick()
    initialized.value = true
  } else {
    // MapLibre will load on next tick
    await nextTick()
    initMapLibre()
  }
}

// ========== Mars3D implementations ==========
function renderMars3D(tctx: ReThreeContext) {
  const { scene } = tctx
  ctx = tctx
  const grp = new THREE.Group()
  scene.add(grp)
  globeGroup.value = grp

  const R = 20
  const mode = globeMode.value

  if (mode === 'globe') {
    const geo = new THREE.SphereGeometry(R * 0.98, 64, 48)
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.9,
      shininess: 40,
    })
    const mesh = new THREE.Mesh(geo, mat)
    grp.add(mesh)
    globeMesh.value = mesh
  }

  if (mode === 'wireframe' || mode === 'globe') {
    const wireGeo = new THREE.SphereGeometry(R * 1.0, 24, 16)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x334155, wireframe: true, transparent: true, opacity: mode === 'wireframe' ? 0.6 : 0.15,
    })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    grp.add(wire)
    wireframeMesh.value = wire
  }

  if (mode === 'dots' || mode === 'globe') {
    const count = 2000
    const positions = new Float32Array(count * 3)
    const opacities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const lat = (Math.random() - 0.5) * 180
      const lng = (Math.random() - 0.5) * 360
      const v = latLonToVec3(lat, lng, R * 1.01)
      positions[i * 3] = v.x
      positions[i * 3 + 1] = v.y
      positions[i * 3 + 2] = v.z
      opacities[i] = Math.random()
    }
    const dotGeo = new THREE.BufferGeometry()
    dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const dotMat = new THREE.PointsMaterial({
      size: mode === 'dots' ? 0.4 : 0.25,
      color: 0x64748b,
      transparent: true,
      opacity: mode === 'dots' ? 0.8 : 0.4,
      sizeAttenuation: true,
    })
    const dots = new THREE.Points(dotGeo, dotMat)
    grp.add(dots)
    dotCloud.value = dots
  }

  const pinGrp = new THREE.Group()
  grp.add(pinGrp)
  pinGroup.value = pinGrp

  props.pins.forEach(pin => {
    const pos = latLonToVec3(pin.lat, pin.lng, R)
    const col = new THREE.Color(pin.color || pinColor(pin.type || 'custom'))

    const pinGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8)
    pinGeo.translate(0, 0.75, 0)
    const pinMat = new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: 0.9, shininess: 80 })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    pinMesh.position.copy(pos)
    pinMesh.lookAt(0, 0, 0)
    pinMesh.rotateX(Math.PI / 2)
    pinGrp.add(pinMesh)

    const headGeo = new THREE.SphereGeometry(0.4, 12, 12)
    const headMesh = new THREE.Mesh(headGeo, pinMat)
    headMesh.position.copy(pos)
    headMesh.position.multiplyScalar(1.08)
    pinGrp.add(headMesh)

    const ringGeo = new THREE.RingGeometry(0.5, 0.6, 24)
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    const ring1 = new THREE.Mesh(ringGeo, ringMat)
    ring1.position.copy(pos)
    ring1.lookAt(0, 0, 0)
    pinGrp.add(ring1)

    const ring2 = ring1.clone()
    ring2.scale.set(1.8, 1.8, 1.8)
    pinGrp.add(ring2)
  })

  const rGrp = new THREE.Group()
  grp.add(rGrp)
  ringGroup.value = rGrp

  const orbitGeo = new THREE.TorusGeometry(R * 1.15, 0.03, 8, 100)
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 })
  const orbit1 = new THREE.Mesh(orbitGeo, orbitMat)
  orbit1.rotation.x = Math.PI / 3
  rGrp.add(orbit1)

  const orbit2 = new THREE.Mesh(orbitGeo, orbitMat.clone())
  orbit2.rotation.x = -Math.PI / 4
  orbit2.rotation.y = Math.PI / 6
  orbit2.scale.set(1.05, 0.95, 0.95)
  rGrp.add(orbit2)

  // Lighting controls
  const amb = new THREE.AmbientLight(0xffffff, debugMode.value ? 0.8 : toggleLights.value ? 0.3 : 0)
  scene.add(amb)

  const dir = new THREE.DirectionalLight(0xffffff, debugMode.value ? 1.2 : toggleLights.value ? 0.8 : 0)
  dir.position.set(50, 30, 40)
  scene.add(dir)

  const back = new THREE.DirectionalLight(0x5b8def, debugMode.value ? 0.5 : toggleLights.value ? 0.3 : 0)
  back.position.set(-40, -20, -30)
  scene.add(back)

  ctx.camera.position.set(0, 10, 70)
  ctx.camera.lookAt(0, 0, 0)

  isReady.value = true
}

function animateMars3D(tctx: ReThreeContext) {
  const t = Date.now() * 0.001

  // FPS counter
  frameCount++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastTime = now
  }

  if (pinGroup.value) {
    pinGroup.value.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.geometry.type === 'RingGeometry') {
        const s = 1 + Math.sin(t * 2 + i * 0.5) * 0.6
        child.scale.set(s, s, s)
        const mat = Array.isArray(child.material) ? child.material[0] : child.material
        if (mat && 'opacity' in mat) {
          mat.opacity = Math.max(0, 0.5 - Math.abs(s - 1) * 0.4)
        }
      }
    })
  }

  if (ringGroup.value) {
    ringGroup.value.rotation.y = toggleOrbit.value ? t * 0.1 : 0
  }

  if (dotCloud.value) {
    const mat = Array.isArray(dotCloud.value.material)
      ? dotCloud.value.material[0]
      : dotCloud.value.material
    if (mat && 'opacity' in mat) {
      mat.opacity = 0.3 + Math.sin(t * 1.5) * 0.15
    }
  }
}

// ========== MapLibre implementations ==========
async function initMapLibre() {
  if (maplibreLoaded.value) return

  try {
    // Try to import maplibre-gl
    const maplibreGL = await import('maplibre-gl')

    if (!(maplibreGL as unknown as { Map?: unknown; util?: unknown }).Map || !(maplibreGL as unknown as { util?: unknown }).util) {
      throw new Error('maplibre-gl not found')
    }

    const { Map } = maplibreGL

    // Set tile server URL based on view style
    const styles = {
      streets: 'https://demotiles.maplibre.org/style.json',
      satellite: 'https://carto-basemaps-v4.s3.amazonaws.com/styles/v4/positron_global_all/z/0/x/0/y.mvt',
      dark: 'https://basemaps.mapbox.com/api/maps/dark-v2/style?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG21lAriBMTyIuQg'
    }

    const container = maplibreContainer.value
    if (!container) return

    const mapEl = container.querySelector('#map')
    if (!mapEl) return

    mapInstance = new Map({
      container: 'map',
      style: styles[viewStyle.value],
      center: getCenter(),
      zoom: props.location && typeof props.location === 'object'
        ? (props.location.zoom || 12) : 2,
      minZoom: 0.5,
      maxZoom: 20,
      attributionControl: false,
      pitch: 45,  // 倾斜视角
      bearing: 0   // 旋转角度
    })

    // Add controls
    mapInstance.addControl(new maplibreGL.NavigationControl(), 'top-right')
    mapInstance.addControl(new maplibreGL.ScaleControl(), 'bottom-left')

    // Load markers
    props.pins.forEach(pin => {
      createMarker(mapInstance, pin, maplibreGL)
    })

    // Listen to zoom changes
    mapInstance.on('move', () => {
      currentZoom.value = mapInstance.getZoom()
    })

    mapInstance.once('load', () => {
      maplibreLoaded.value = true
      initialized.value = true
      isReady.value = true

      // Fly to default location
      if (props.location && typeof props.location === 'object') {
        mapInstance.flyTo({
          center: [props.location.lng, props.location.lat],
          zoom: props.location.zoom || 12,
          speed: 1.5
        })
      } else {
        mapInstance.flyTo({
          center: [105.0, 35.0],  // China center
          zoom: 4,
          speed: 1.5
        })
      }
    })

    // Handle errors
    mapInstance.on('error', (e: unknown) => {
      console.warn('MapLibre error:', e)
      emit('load-error', new Error((e as any)?.message || 'Map loading failed'))
    })

  } catch (err) {
    console.error('Failed to load maplibre-gl:', err)
    emit('load-error', err instanceof Error ? err : new Error('Failed to load map engine'))
    maplibreLoaded.value = false
  }
}

function getCenter(): [number, number] {
  if (props.location && typeof props.location === 'object') {
    return [props.location.lng, props.location.lat]
  }
  // Default to China center
  return [105.0, 35.0]
}

function createMarker(map: any, pin: ReMap3DPin, maplibreGL: any) {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 24px;
    height: 24px;
    background-color: ${pin.color || pinColor(pin.type || 'custom')};
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
  `

  el.addEventListener('click', (e) => {
    e.stopPropagation()
    emit('pin-click', pin)
  })

  new maplibreGL.Marker({ element: el })
    .setLngLat([pin.lng, pin.lat])
    .addTo(map)
}

// ========== Common methods ==========
function resetView() {
  if (selectedEngine.value === 'mars3d') {
    if (globeGroup.value) {
      globeGroup.value.rotation.y = 0
    }
  } else if (mapInstance) {
    mapInstance.flyTo({
      center: getCenter(),
      zoom: props.location && typeof props.location === 'object'
        ? (props.location.zoom || 12) : 2,
      speed: 1.2,
      curve: 1,
      easing: (t: number) => t
    })
  }
}

function toggleRotate() {
  autoRotate.value = !autoRotate.value
}

function onMarsReady() {
  initialized.value = true
  sceneReady.value = true
  isReady.value = true
  emit('ready')
}

// Mars3D advanced controls
async function handleMars3DDropdown(command: string) {
  switch (command) {
    case 'toggleOrbit':
      toggleOrbit.value = !toggleOrbit.value
      ElMessage.success(toggleOrbit.value ? '轨道已开启' : '轨道已关闭')
      break

    case 'toggleLights':
      toggleLights.value = !toggleLights.value
      ElMessage.success(toggleLights.value ? '灯光已开启' : '灯光已关闭')
      break

    case 'resetView':
      resetView()
      ElMessage.info('视角已重置')
      break

    case 'flyToPin':
      if (props.pins[0]) {
        const pos = latLonToVec3(props.pins[0].lat, props.pins[0].lng, 25)
        if (ctx) {
          ctx.camera.position.set(pos.x, pos.y, pos.z)
          ctx.camera.lookAt(0, 0, 0)
        }
        ElMessage.success(`已飞向 ${props.pins[0].name}`)
      }
      break

    case 'toggleDebug':
      debugMode.value = !debugMode.value
      ElMessage.info(debugMode.value ? '调试模式已开启' : '调试模式已关闭')
      break
  }
}

// MapLibre advanced controls
async function handleMapLibreDropdown(command: string) {
  switch (command) {
    case 'fitBounds':
      // Fit bounds to pins
      if (props.pins.length > 0 && mapInstance) {
        const maplibreGL = await import('maplibre-gl')
        const bounds = new maplibreGL.LngLatBounds()
        props.pins.forEach(pin => {
          bounds.extend([pin.lng, pin.lat])
        })
        mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 })
        ElMessage.success('已适配所有标记点')
      } else {
        ElMessage.warning('没有可用的标记点')
      }
      break

    case 'centerPin':
      if (props.pins[0] && mapInstance) {
        mapInstance.flyTo({
          center: [props.pins[0].lng, props.pins[0].lat],
          zoom: 14,
          speed: 1.5
        })
        ElMessage.success(`已中心到 ${props.pins[0].name}`)
      }
      break

    case 'toggleAttribution':
      showAttribution.value = !showAttribution.value
      ElMessage.info(showAttribution.value ? '版权信息已显示' : '版权信息已隐藏')
      break

    case 'exportImage':
      await exportMapImage()
      break
  }
}

// Fullscreen support
async function toggleFullscreen() {
  try {
    const container = selectedEngine.value === 'mars3d' ? marsContainer.value : maplibreContainer.value
    if (!container) return

    if (!document.fullscreenElement) {
      await container.requestFullscreen()
      ElMessage.success('已进入全屏模式')
    } else {
      await document.exitFullscreen()
      ElMessage.info('已退出全屏模式')
    }
  } catch (err) {
    console.warn('Fullscreen not supported:', err)
  }
}

// Export image for MapLibre
async function exportMapImage() {
  if (!mapInstance || !maplibreLoaded.value) return

  try {
    ElMessage.info('正在生成图像...')

    // Use the canvas directly
    const canvas = document.querySelector('#map canvas') as HTMLCanvasElement
    if (!canvas) throw new Error('Canvas not found')

    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.download = `map-${timestamp}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    ElMessage.success('图像已导出')
  } catch (err) {
    ElMessage.error('导出失败：' + (err instanceof Error ? err.message : '未知错误'))
  }
}

// Lifecycle hooks
onMounted(async () => {
  if (selectedEngine.value === 'maplibre') {
    await nextTick()
    await nextTick()
    initMapLibre()
  } else {
    initialized.value = true
  }
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

// Resize handler
let resizeObserver: ResizeObserver | null = null

if (props.autoResetOnResize) {
  onMounted(() => {
    const body = document.querySelector('.map3d-body')
    if (body) {
      resizeObserver = new ResizeObserver((entries) => {
        if (selectedEngine.value === 'maplibre' && mapInstance) {
          mapInstance.resize()
        }
      })
      resizeObserver.observe(body)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })
}
</script>

<style scoped>
.re-map3d-card { display: flex; flex-direction: column; height: 100%; }

.map3d-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.map3d-title-wrap { display: flex; align-items: center; gap: 8px; }
.map3d-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }

/* Status tag */
.status-tag { margin-left: 8px; font-weight: bold; font-size: 10px; padding: 0 6px; }

.map3d-controls { display: flex; align-items: center; gap: 10px; }

/* Engine selector */
.engine-select :deep(.el-radio-button__inner) { 
  border-radius: 6px; 
  padding: 4px 12px; 
  font-size: 12px; 
  min-width: 70px; 
  text-align: center; 
}
.engine-select :deep(.is-checked) { 
  background: var(--el-color-primary); 
  border-color: var(--el-color-primary); 
  color: white; 
}

/* Mode controls */
.map-mode, .map-style :deep(.el-radio-button__inner) { 
  border-radius: 6px; 
  padding: 4px 12px; 
  font-size: 12px; 
}
.map-nav :deep(.el-button) { border-radius: 6px; padding: 5px 8px; }
.map-nav .active :deep() { color: var(--el-color-primary); }

.map3d-body {
  width: 100%;
  flex: 1;
  overflow: hidden;
  border-top: 1px solid var(--el-border-color-light);
  position: relative;
}

/* Mars3D container */
.mars3d-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* MapLibre container */
.maplibre-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}

/* Debug overlay */
.debug-overlay {
  position: absolute;
  bottom: 80px;
  left: 10px;
  z-index: 100;
}

.debug-panel {
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  max-width: 200px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.debug-panel h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0;
}

.debug-row span:last-child {
  color: #fff;
  font-weight: bold;
}

/* Footer */
.map3d-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  font-size: 12px;
}

.map3d-info, .map3d-stat, .map3d-coords {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}

.map3d-stats-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Custom markers for MapLibre */
:deep(.custom-marker) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
:deep(.custom-marker:hover) {
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

/* Dropdown menu styles */
:deep(.el-dropdown-menu__item) {
  font-size: 13px;
}

:deep(.el-button--small) {
  padding: 6px 8px;
  font-size: 12px;
}
</style>