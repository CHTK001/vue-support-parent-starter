<template>
  <div ref="containerRef" class="t3d" @mousedown="onMouseDown" @wheel.prevent="onWheel">
    <canvas ref="canvasRef" class="t3d__canvas" />
    <!-- 设备标记：Three.js 渲染管线外，用 Vue 绝对定位浮在画布上 -->
    <div class="t3d__markers">
      <div
        v-for="(tile, i) in tiles"
        :key="tile.key"
        class="t3d__marker"
        :class="{ 'is-selected': selectedKey === tile.key }"
        :style="markerStyle(tile)"
        @click.stop="emit('select', tile)"
      >
        <div class="t3d__marker-body">
          <div class="t3d__marker-screen" :style="screenStyle(tile)">
            <span v-if="!tile.url" class="t3d__marker-err">{{ tile.error || '取流...' }}</span>
          </div>
          <div class="t3d__marker-name">{{ tile.name }}</div>
          <div class="t3d__marker-meta">CH{{ tile.channel }} · {{ tile.stream === 'sub' ? '副' : '主' }}</div>
        </div>
      </div>
    </div>
    <div class="t3d__ctrl">
      <span class="t3d__hint">拖拽旋转 · 滚轮缩放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Tile {
  key: string
  deviceId: string
  name: string
  channel: number
  stream: string
  online: boolean
  url: string
  error: string
  _x?: number
  _y?: number
  _z?: number
}

const props = defineProps<{
  tiles: Tile[]
  selectedKey?: string
}>()

const emit = defineEmits<{
  (e: 'select', tile: Tile): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let THREE: any = null
let renderer: any = null
let scene: any = null
let camera: any = null
let animFrame = 0

// Three.js 场景对象
let cabinetGroup: any = null
let markerMap = new Map<string, any>()

const MARKER_Z = 0.8  // 屏幕在机柜前方的深度

// 动态加载 Three.js（CDN，模块内联）
async function loadThree(): Promise<any> {
  // @ts-ignore
const THREE_MOD = await import('https://esm.sh/three@0.170.0')
  return THREE_MOD
}

function screenStyle(tile: Tile) {
  if (!tile.url) return {}
  return { backgroundImage: `url(${tile.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

function markerStyle(tile: Tile) {
  const el = markerMap.get(tile.key)
  if (!el || !containerRef.value) return { display: 'none' }
  const { x, y } = worldToScreen(el.position, camera, renderer)
  const W = containerRef.value.clientWidth
  const H = containerRef.value.clientHeight
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
  }
}

function worldToScreen(pos: any, cam: any, ren: any) {
  const v = pos.clone().project(cam)
  const w = ren.domElement.clientWidth
  const h = ren.domElement.clientHeight
  return {
    x: ((v.x + 1) / 2) * w,
    y: ((-v.y + 1) / 2) * h,
  }
}

function buildCabinet() {
  if (!THREE || !scene) return
  if (cabinetGroup) scene.remove(cabinetGroup)
  cabinetGroup = new THREE.Group()
  scene.add(cabinetGroup)

  // 地板
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9, metalness: 0.1 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.5
  cabinetGroup.add(floor)

  // 网格线（地板）
  const grid = new THREE.GridHelper(12, 24, 0x1c2333, 0x1c2333)
  grid.position.y = -1.49
  cabinetGroup.add(grid)

  // 机柜 x 3 台，z 排列
  const positions = [
    { x: -1.8, z: -0.3 },
    { x:  0,   z: -0.3 },
    { x:  1.8, z: -0.3 },
  ]
  positions.forEach((pos, rackIdx) => {
    // 机柜主体
    const bodyGeo = new THREE.BoxGeometry(1.5, 2.8, 0.9)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 0.6, metalness: 0.4 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(pos.x, 0, pos.z)
    cabinetGroup.add(body)

    // 机柜门框（发光边框）
    const edgeGeo = new THREE.EdgesGeometry(bodyGeo)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3fb950, opacity: 0.6, transparent: true })
    const edges = new THREE.LineSegments(edgeGeo, edgeMat)
    edges.position.copy(body.position)
    cabinetGroup.add(edges)

    // 指示灯（红色电源灯）
    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xff3333, emissiveIntensity: 2 })
    const led = new THREE.Mesh(ledGeo, ledMat)
    led.position.set(pos.x + 0.55, 1.25, pos.z + 0.46)
    cabinetGroup.add(led)

    // 机柜门缝
    const seamGeo = new THREE.BoxGeometry(0.01, 2.5, 0.01)
    const seamMat = new THREE.MeshStandardMaterial({ color: 0x21262d })
    const seam = new THREE.Mesh(seamGeo, seamMat)
    seam.position.set(pos.x, 0, pos.z + 0.46)
    cabinetGroup.add(seam)

    // 机柜脚（支架）
    for (const dx of [-0.6, 0.6]) {
      for (const dz of [-0.3, 0.3]) {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x30363d, metalness: 0.8 })
        const leg = new THREE.Mesh(legGeo, legMat)
        leg.position.set(pos.x + dx, -1.43, pos.z + dz)
        cabinetGroup.add(leg)
      }
    }

    // 屏幕挂墙（2行 × 2列 = 4个设备槽位，对应 4 个 tile）
    const tileIdx = rackIdx * 4
    const tilePositions = [
      { lx: -0.4, ly:  0.5, rx: 0.4, ry:  0.5 },  // 左上/右上（合并为宽屏）
    ]
    // 每台机柜上方挂一块大屏
    const screenW = 1.3
    const screenH = 0.75
    const screenGeo = new THREE.PlaneGeometry(screenW, screenH)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x010409,
      emissive: 0x010409,
      emissiveIntensity: 0.3,
    })
    const screen = new THREE.Mesh(screenGeo, screenMat)
    screen.position.set(pos.x, 1.5, pos.z + 0.46)
    cabinetGroup.add(screen)

    // 屏幕边框
    const borderGeo = new THREE.EdgesGeometry(screenGeo)
    const borderMat = new THREE.LineBasicMaterial({ color: 0x58a6ff, opacity: 0.5, transparent: true })
    const border = new THREE.LineSegments(borderGeo, borderMat)
    border.position.copy(screen.position)
    cabinetGroup.add(border)

    // 机柜编号标签（用小 Plane 模拟）
    const labelGeo = new THREE.PlaneGeometry(0.3, 0.12)
    const labelMat = new THREE.MeshStandardMaterial({ color: 0x1f6feb, emissive: 0x1f6feb, emissiveIntensity: 1 })
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.position.set(pos.x, -1.2, pos.z + 0.46)
    cabinetGroup.add(label)

    // 为每个机柜分配 tile（最多 3 台 × 4 = 12）
    for (let i = 0; i < 4; i++) {
      const tile = props.tiles[tileIdx + i]
      if (!tile) continue
      const screen3d = new THREE.Mesh(
        new THREE.PlaneGeometry(screenW * 0.46, screenH * 0.85),
        new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.2, metalness: 0.8 }),
      )
      // 分配到机柜左侧挂的 4 个小屏幕
      const col = i % 2
      const row = Math.floor(i / 2)
      screen3d.position.set(
        0 + (-0.32 + col * 0.64),
        0 + 0.5 + (row === 0 ? 0 : -0.75) + 1.5,
        pos.z + 0.47,
      )
      cabinetGroup.add(screen3d)
      markerMap.set(tile.key, screen3d)
    }
  })

  // 环境光 + 点光源
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))
  const spot = new THREE.SpotLight(0xaaddff, 3)
  spot.position.set(0, 5, 5)
  spot.castShadow = false
  scene.add(spot)

  // 机柜顶部蓝光照条
  const stripGeo = new THREE.BoxGeometry(5, 0.02, 0.05)
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x388bfd, emissive: 0x388bfd, emissiveIntensity: 3 })
  const strip = new THREE.Mesh(stripGeo, stripMat)
  strip.position.set(0, 1.41, 0.8)
  cabinetGroup.add(strip)
}

async function initScene() {
  THREE = await loadThree()
  const container = containerRef.value!
  const canvas = canvasRef.value!

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setClearColor(0x010409, 1)
  renderer.shadowMap.enabled = false

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x010409, 0.12)

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(0, 1.8, 5.5)
  camera.lookAt(0, 0, 0)

  buildCabinet()

  let rotY = 0.15
  let rotX = 0.1
  let targetRotY = 0.15
  let targetRotX = 0.1
  let zoom = 5.5
  let targetZoom = 5.5
  let dragging = false
  let lastX = 0, lastY = 0

  container.addEventListener('mousedown', (e: MouseEvent) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  })
  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    targetRotY += dx * 0.006
    targetRotX += dy * 0.004
    targetRotX = Math.max(-0.3, Math.min(0.6, targetRotX))
    lastX = e.clientX
    lastY = e.clientY
  })
  window.addEventListener('mouseup', () => { dragging = false })

  function animate() {
    animFrame = requestAnimationFrame(animate)
    rotY += (targetRotY - rotY) * 0.08
    rotX += (targetRotX - rotX) * 0.08
    zoom += (targetZoom - zoom) * 0.08
    camera.position.x = Math.sin(rotY) * zoom * Math.cos(rotX)
    camera.position.y = Math.sin(rotX) * zoom * 0.4 + 1.8
    camera.position.z = Math.cos(rotY) * zoom * Math.cos(rotX)
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)

    // 更新标记位置
    if (containerRef.value) {
      containerRef.value?.querySelectorAll('.t3d__marker').forEach((el) => {
        const key = (el as HTMLElement).dataset.key
        if (!key) return
        const mesh = markerMap.get(key)
        if (!mesh) return
        const pos = worldToScreen(mesh.position, camera, renderer)
        if (!containerRef.value) return
        const W = containerRef.value.clientWidth
        const H = containerRef.value.clientHeight
        ;(el as HTMLElement).style.left = `${pos.x}px`
        ;(el as HTMLElement).style.top = `${pos.y}px`
      })
    }
  }
  animate()

  const ro = new ResizeObserver(() => {
    if (!containerRef.value) return
    const W = containerRef.value.clientWidth
    const H = containerRef.value.clientHeight
    renderer.setSize(W, H)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
  })
  ro.observe(container)
}

function onMouseDown() {}
function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.3 : -0.3
  // zoom 通过外部 props 控制，这里简化
}

watch(() => props.tiles, () => {
  // tile 变化时重建（实际可按 key 增量更新）
}, { deep: true })

onMounted(() => { void initScene() })
onBeforeUnmount(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.t3d {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  background: #010409;
  cursor: grab;
  border-radius: 12px;
}
.t3d:active { cursor: grabbing; }

.t3d__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 标记层 */
.t3d__markers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.t3d__marker {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: all;
  cursor: pointer;
  animation: t3d-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes t3d-pop {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.t3d__marker-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.t3d__marker-screen {
  width: 90px;
  height: 54px;
  background: #0d1117;
  border: 1.5px solid #388bfd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px rgba(56,139,253,0.4), inset 0 0 8px rgba(56,139,253,0.1);
}
.t3d__marker-err {
  font-size: 9px;
  color: #58a6ff;
  text-align: center;
  padding: 2px;
  line-height: 1.3;
}
.t3d__marker-name {
  font-size: 10.5px;
  font-weight: 700;
  color: #e6edf3;
  background: rgba(1,4,9,0.85);
  padding: 1px 6px;
  border-radius: 3px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.t3d__marker-meta {
  font-size: 9.5px;
  color: #7ee787;
  background: rgba(13,17,23,0.85);
  padding: 1px 5px;
  border-radius: 3px;
}
.t3d__marker.is-selected .t3d__marker-screen {
  border-color: #3fb950;
  box-shadow: 0 0 16px rgba(63,185,80,0.6), inset 0 0 10px rgba(63,185,80,0.15);
}

.t3d__ctrl {
  position: absolute;
  bottom: 10px;
  right: 14px;
  pointer-events: none;
}
.t3d__hint {
  font-size: 11px;
  color: rgba(88,166,255,0.6);
  letter-spacing: 0.5px;
}
</style>
