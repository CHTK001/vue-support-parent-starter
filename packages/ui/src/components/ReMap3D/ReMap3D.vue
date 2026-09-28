<template>
  <ReCard layout="simple" :radius="12" :padding="0" shadow="never" class="re-map3d-card">
    <template #header>
      <div class="map3d-head">
        <div class="map3d-title-wrap">
          <ReIcon name="Earth" :size="16" />
          <span class="map3d-title">3D 地球</span>
        </div>
        <div class="map3d-controls">
          <el-radio-group v-model="globeMode" class="map-mode">
            <el-radio-button value="globe">球体</el-radio-button>
            <el-radio-button value="wireframe">线框</el-radio-button>
            <el-radio-button value="dots">点阵</el-radio-button>
          </el-radio-group>
          <el-button-group class="map-nav">
            <el-button plain @click="rotateToDefault"><ReIcon name="HomeFilled" /></el-button>
            <el-button plain :icon="autoRotate ? '' : ''" @click="toggleRotate" :class="{ active: autoRotate }"><ReIcon name="RefreshRight" /></el-button>
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="map3d-body" :style="{ height: geBodyHeight }">
      <ReThree
        :render="renderGlobe"
        :animate="animateGlobe"
        :auto-rotate="autoRotate"
        :auto-rotate-speed="0.2"
        @ready="onReady"
      />
      <div class="map3d-overlay" v-if="pins.length > 0">
        <div class="pin-legend">
          <span class="legend-title">标记</span>
          <span v-for="p in pins" :key="p.name" class="legend-item">
            <span class="legend-dot" :style="{ background: p.color || pinColor(p.type ?? '') }"></span>
            {{ p.name }}
          </span>
        </div>
      </div>
    </div>

    <template v-if="showFooter" #footer>
      <div class="map3d-footer">
        <span class="map3d-pins">{{ pins.length }} 个标记</span>
        <span class="map3d-rotation">旋转速度 {{ autoRotateSpeed }}x</span>
        <span class="map3d-coords">{{ focalCoords }}</span>
      </div>
    </template>
  </ReCard>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import * as THREE from 'three'
import type { ReThreeContext } from '@repo/ui/re-three'

const pinColorMap: Record<string, string> = {
  server: '#5b8def',
  redis: '#f59e0b',
  mysql: '#22c55e',
  alert: '#ef4444',
  custom: '#a855f7',
}

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
}

const props = withDefaults(
  defineProps<{
    pins?: ReMap3DPin[]
    height?: number | string
    autoRotate?: boolean
    showFooter?: boolean
  }>(),
  {
    pins: () => [
      { name: '北京', lat: 39.9042, lng: 116.4074, type: 'server', value: 3 },
      { name: '上海', lat: 31.2304, lng: 121.4737, type: 'redis', value: 2 },
      { name: '东京', lat: 35.6762, lng: 139.6503, type: 'mysql', value: 1 },
      { name: '法兰克福', lat: 50.1109, lng: 8.6821, type: 'server', value: 4 },
      { name: '圣何塞', lat: 37.3382, lng: -121.8863, type: 'alert', value: 5 },
      { name: '圣保罗', lat: -23.5505, lng: -46.6333, type: 'server', value: 2 },
    ],
    height: 500,
    autoRotate: true,
    showFooter: true,
  },
)

const emit = defineEmits<{
  (e: 'pin-click', pin: ReMap3DPin): void
}>()

const globeMode = ref<'globe' | 'wireframe' | 'dots'>('globe')
const autoRotate = ref(props.autoRotate)
const autoRotateSpeed = ref(0.2)
const geBodyHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
)

const focalCoords = computed(() => {
  const p = props.pins[0]
  return p ? `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` : '0, 0'
})

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

const globeMesh = shallowRef<THREE.Mesh | null>(null)
const wireframeMesh = shallowRef<THREE.Mesh | null>(null)
const dotCloud = shallowRef<THREE.Points | null>(null)
const pinGroup = shallowRef<THREE.Group | null>(null)
const ringGroup = shallowRef<THREE.Group | null>(null)
const globeGroup = shallowRef<THREE.Group | null>(null)

function renderGlobe(ctx: ReThreeContext) {
  const { scene, THREE } = ctx
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

  const amb = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(amb)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(50, 30, 40)
  scene.add(dir)
  const back = new THREE.DirectionalLight(0x5b8def, 0.3)
  back.position.set(-40, -20, -30)
  scene.add(back)

  ctx.camera.position.set(0, 10, 70)
  ctx.camera.lookAt(0, 0, 0)
}

function animateGlobe(ctx: ReThreeContext) {
  const t = Date.now() * 0.001

  if (pinGroup.value) {
    pinGroup.value.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.geometry.type === 'RingGeometry') {
        const s = 1 + Math.sin(t * 2 + i * 0.5) * 0.6
        child.scale.set(s, s, s)
        // material 可能为材质数组，统一收敛为单材质处理
        const mat = Array.isArray(child.material) ? child.material[0] : child.material
        if (mat && 'opacity' in mat) {
          mat.opacity = Math.max(0, 0.5 - Math.abs(s - 1) * 0.4)
        }
      }
    })
  }

  if (ringGroup.value) {
    ringGroup.value.rotation.y = t * 0.1
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

function rotateToDefault() {
  if (globeGroup.value) {
    globeGroup.value.rotation.y = 0
  }
}

function toggleRotate() {
  autoRotate.value = !autoRotate.value
}

function onReady() {
  // ready
}
</script>

<style scoped>
.re-map3d-card { display: flex; flex-direction: column; height: 100%; }

.map3d-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.map3d-title-wrap { display: flex; align-items: center; gap: 8px; }
.map3d-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.map3d-controls { display: flex; align-items: center; gap: 10px; }
.map-mode :deep(.el-radio-button__inner) { border-radius: 6px; padding: 4px 12px; font-size: 12px; }
.map-nav :deep(.el-button) { border-radius: 6px; padding: 5px 8px; }
.map-nav .active :deep() { color: var(--el-color-primary); }

.map3d-body {
  width: 100%;
  flex: 1;
  overflow: hidden;
  border-top: 1px solid var(--el-border-color-light);
  position: relative;
}
.map3d-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
}
.pin-legend { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; max-width: 220px; }
.legend-title { font-weight: 600; color: var(--el-text-color-primary); margin-right: 4px; }
.legend-item { display: flex; align-items: center; gap: 4px; color: var(--el-text-color-secondary); white-space: nowrap; }
.legend-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

.map3d-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
}
.map3d-pins, .map3d-rotation, .map3d-coords {
  font-size: 11px; color: var(--el-text-color-secondary);
}
.map3d-coords { font-family: 'SF Mono', monospace; }
</style>