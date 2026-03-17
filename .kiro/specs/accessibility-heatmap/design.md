# 设计文档：语音朗读 + 热点工具（热力图覆盖层）

## 一、整体架构

```
layout/default/src/
├── index.vue                          # 布局根组件，挂载 HeatmapOverlay
├── components/
│   ├── lay-dev-tools/
│   │   ├── LiteInspector.vue          # 已有，不修改
│   │   └── HeatmapOverlay.vue         # 新建：热点工具浮层 + 热力图 canvas
│   └── lay-setting/themes/components/
│       ├── SettingAccessibility.vue   # 修改：新增语音朗读开关
│       ├── SettingDevTools.vue        # 修改：新增热点工具开关
│       └── SettingAdvanced.vue        # 修改：透传新增的 props/handlers
└── themes/BaseSetting.vue             # 修改：新增 settings 字段 + handler 函数
```

---

## 二、功能一：语音朗读

### 2.1 配置字段

`BaseSetting.vue` 的 `settings` reactive 对象新增：
```ts
voiceReadEnabled: $storage.configure?.voiceReadEnabled ?? false,
```

### 2.2 Handler 函数（BaseSetting.vue）

```ts
function voiceReadEnabledChange(enabled: boolean) {
  settings.voiceReadEnabled = enabled;
  storageConfigureChange("voiceReadEnabled", enabled);
  emitter.emit("voiceReadEnabledChange", enabled);
}
```

### 2.3 语音朗读逻辑（SettingAccessibility.vue 内部实现）

不单独抽 composable，直接在组件内用 `watch` + `onBeforeUnmount` 管理：

```ts
// 监听焦点变化，朗读元素内容
let focusHandler: ((e: FocusEvent) => void) | null = null;

function getReadText(el: HTMLElement): string {
  return el.getAttribute("aria-label") 
    || el.getAttribute("title") 
    || el.textContent?.trim().slice(0, 100) 
    || "";
}

function attachVoiceRead() {
  if (focusHandler) return;
  focusHandler = (e: FocusEvent) => {
    const text = getReadText(e.target as HTMLElement);
    if (!text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    window.speechSynthesis.speak(utter);
  };
  window.addEventListener("focus", focusHandler, { capture: true });
}

function detachVoiceRead() {
  if (focusHandler) {
    window.removeEventListener("focus", focusHandler, { capture: true });
    focusHandler = null;
  }
  window.speechSynthesis?.cancel();
}
```

`watch(() => props.settings.voiceReadEnabled, active => active ? attachVoiceRead() : detachVoiceRead(), { immediate: true })`

### 2.4 不支持时的处理

```ts
const speechSupported = "speechSynthesis" in window;
```
开关 `disabled` 绑定 `!speechSupported`，description 动态显示「当前浏览器不支持语音朗读」。

### 2.5 SettingAccessibility.vue Props 新增

```ts
voiceReadEnabledChange: (enabled: boolean) => void;
```

### 2.6 SettingAdvanced.vue Props 透传

新增 `voiceReadEnabledChange` prop，透传给 `SettingAccessibility`。

---

## 三、功能二：热点工具

### 3.1 配置字段

`BaseSetting.vue` 的 `settings` 新增：
```ts
devHeatmap: $storage.configure?.devHeatmap ?? false,
```

### 3.2 Handler 函数（BaseSetting.vue）

```ts
function devHeatmapChange(enabled: boolean) {
  settings.devHeatmap = enabled;
  storageConfigureChange("devHeatmap", enabled);
}
```

### 3.3 SettingDevTools.vue 新增开关

在现有 4 个开关后追加：
```html
<ScSwitch
  v-model="settings.devHeatmap"
  layout="visual-card"
  size="small"
  label="热点工具"
  description="记录用户点击热点，以热力图形式覆盖展示"
  active-icon="ri:fire-line"
  ribbon-color="var(--el-color-danger)"
  @change="devHeatmapChange"
/>
```

Props 新增 `devHeatmapChange: (enabled: boolean) => void`。

### 3.4 HeatmapOverlay.vue 设计

#### 3.4.1 组件结构

```
HeatmapOverlay
├── 可拖动浮层（position: fixed，默认右下角）
│   ├── 拖拽把手（header bar）
│   ├── 按钮：热力图展示（切换 heatmapVisible）
│   └── 按钮：清除数据
└── canvas 覆盖层（position: fixed; inset: 0; pointer-events: none; z-index: 9998）
```

#### 3.4.2 拖拽实现

使用 `mousedown` + `mousemove` + `mouseup` 实现，记录初始偏移量，更新 `left`/`top`。

```ts
const panelX = ref(window.innerWidth - 180);
const panelY = ref(window.innerHeight - 120);
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function onDragStart(e: MouseEvent) {
  dragging = true;
  dragOffsetX = e.clientX - panelX.value;
  dragOffsetY = e.clientY - panelY.value;
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);
}
function onDragMove(e: MouseEvent) {
  if (!dragging) return;
  panelX.value = Math.max(0, Math.min(window.innerWidth - 160, e.clientX - dragOffsetX));
  panelY.value = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffsetY));
}
function onDragEnd() {
  dragging = false;
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
}
```

#### 3.4.3 点击数据收集

```ts
interface ClickPoint { x: number; y: number; count: number }
const clickPoints = ref<ClickPoint[]>([]);
const MERGE_RADIUS = 20; // 20px 内的点合并

let clickHandler: ((e: MouseEvent) => void) | null = null;

function attachClickListener() {
  clickHandler = (e: MouseEvent) => {
    // 忽略浮层自身的点击
    if ((e.target as HTMLElement).closest(".heatmap-panel")) return;
    const existing = clickPoints.value.find(
      p => Math.hypot(p.x - e.clientX, p.y - e.clientY) < MERGE_RADIUS
    );
    existing ? existing.count++ : clickPoints.value.push({ x: e.clientX, y: e.clientY, count: 1 });
    renderHeatmap();
  };
  window.addEventListener("click", clickHandler, { capture: true });
}
```

#### 3.4.4 热力图渲染算法

```ts
const canvasRef = ref<HTMLCanvasElement | null>(null);
const RADIUS = 60;
const MAX_COUNT = computed(() => Math.max(...clickPoints.value.map(p => p.count), 1));

function renderHeatmap() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 先绘制所有点的径向渐变（alpha 叠加）
  for (const p of clickPoints.value) {
    const intensity = p.count / MAX_COUNT.value; // 0~1
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS);
    grad.addColorStop(0, `rgba(255,0,0,${intensity * 0.8})`);
    grad.addColorStop(0.4, `rgba(255,165,0,${intensity * 0.5})`);
    grad.addColorStop(0.7, `rgba(0,255,0,${intensity * 0.3})`);
    grad.addColorStop(1, "rgba(0,0,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

#### 3.4.5 生命周期管理

```ts
const enabled = computed(() => isDevEnv && devHeatmap.value);
const heatmapVisible = ref(false);

watch(heatmapVisible, active => {
  active ? attachClickListener() : detachClickListener();
  if (!active) clearHeatmap();
});

watch(enabled, active => {
  if (!active) {
    heatmapVisible.value = false;
    detachClickListener();
  }
});

onBeforeUnmount(() => detachClickListener());
```

#### 3.4.6 清除数据

```ts
function clearHeatmap() {
  clickPoints.value = [];
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
```

### 3.5 index.vue 挂载

在 `<LiteInspector />` 后追加：
```html
<HeatmapOverlay />
```
并在 script 中 import。

---

## 四、文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `SettingAccessibility.vue` | 修改 | 新增语音朗读开关 + 内部逻辑 |
| `SettingDevTools.vue` | 修改 | 新增热点工具开关 |
| `SettingAdvanced.vue` | 修改 | 透传 voiceReadEnabledChange + devHeatmapChange |
| `BaseSetting.vue` | 修改 | 新增 settings 字段 + 2 个 handler |
| `lay-dev-tools/HeatmapOverlay.vue` | 新建 | 热点浮层 + canvas 热力图 |
| `layout/default/src/index.vue` | 修改 | import + 挂载 HeatmapOverlay |
