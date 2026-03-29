# ScFlourishEmbed 设计文档

## 1. 目录结构

```
packages/components-standalone/ScFlourishEmbed/
├── package.json       # @repo/components/ScFlourishEmbed
├── index.ts           # 导出入口
└── index.vue          # 组件实现
```

---

## 2. package.json 设计

```json
{
  "name": "@repo/components/ScFlourishEmbed",
  "version": "1.0.0",
  "description": "Flourish 数据可视化嵌入组件，支持 Public Embed 和 Live API 两种模式",
  "private": true,
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": {
      "types": "./index.ts",
      "default": "./index.ts"
    }
  },
  "dependencies": {
    "vue": "catalog:"
  },
  "license": "ISC"
}
```

无外部 npm 依赖，Flourish 脚本通过 CDN 动态加载。

---

## 3. index.ts 设计

```ts
import type { App } from "vue";
import ScFlourishEmbed from "./index.vue";

export { ScFlourishEmbed };
export default ScFlourishEmbed;

export function install(app: App): void {
  app.component("ScFlourishEmbed", ScFlourishEmbed);
}
```

---

## 4. Props 接口设计

```ts
interface Props {
  // ── Public Embed 模式 ──
  /** Flourish 可视化 ID，如 "visualisation/12345" 或纯数字 12345 */
  visualisationId?: string | number;

  // ── Live API 模式 ──
  /** Flourish API Key（企业版） */
  apiKey?: string;
  /** 模板标识，如 "@flourish/scatter" */
  template?: string;
  /** 模板版本，如 "4" */
  version?: string;
  /** 数据对象 */
  data?: Record<string, unknown[]>;
  /** 数据绑定 */
  bindings?: Record<string, unknown>;
  /** 状态/样式配置 */
  state?: Record<string, unknown>;

  // ── 通用 ──
  /** 宽度，默认 "100%" */
  width?: string | number;
  /** 高度，默认 undefined（Flourish 自适应） */
  height?: string | number;
  /** aria-label，无障碍 */
  ariaLabel?: string;
}
```

模式判断逻辑：`visualisationId` 存在 → Public Embed 模式；`apiKey + template` 存在 → Live API 模式。

---

## 5. Emits 设计

```ts
const emit = defineEmits<{
  loaded: [];           // 脚本加载 + 渲染完成
  error: [err: Error];  // 脚本加载失败或渲染异常
}>();
```

---

## 6. 暴露方法（defineExpose）

```ts
// 仅 Live API 模式有效
defineExpose({
  update(opts: Partial<Props>): void  // 调用 Flourish.Live.update()
});
```

---

## 7. 脚本加载策略

### 7.1 模块级单例 Promise

两个脚本各维护一个模块级 Promise，避免同页面多个组件实例重复加载：

```ts
// Public Embed 脚本
let embedScriptPromise: Promise<void> | null = null;

function loadEmbedScript(): Promise<void> {
  if (embedScriptPromise) return embedScriptPromise;
  // 若已存在 script 标签（SSR hydration 场景）则直接 resolve
  if (document.querySelector('script[src*="embed.js"]')) {
    embedScriptPromise = Promise.resolve();
    return embedScriptPromise;
  }
  embedScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://public.flourish.studio/resources/embed.js";
    s.onload = () => resolve();
    s.onerror = () => {
      embedScriptPromise = null;
      reject(new Error("Flourish embed.js 加载失败"));
    };
    document.head.appendChild(s);
  });
  return embedScriptPromise;
}

// Live API 脚本（同理）
let apiScriptPromise: Promise<void> | null = null;

function loadApiScript(): Promise<void> { /* 同上，src 换为 api.js */ }
```

### 7.2 Public Embed 渲染流程

1. 加载 `embed.js`
2. embed.js 会自动扫描 DOM 中带 `data-src` 的 `.flourish-embed` 元素并渲染
3. 但动态插入的元素需要手动触发：调用 `window.Flourish?.loadEmbed?.(containerEl)` 或直接依赖 embed.js 的 MutationObserver（embed.js 内置）

实际上 Flourish embed.js 内置 MutationObserver，DOM 插入后会自动处理。因此流程为：
1. `loadEmbedScript()` 加载脚本
2. 脚本加载完成后，容器 div 已在 DOM 中（`onMounted` 保证），embed.js 自动渲染
3. emit `loaded`

### 7.3 Live API 渲染流程

1. 加载 `https://public.flourish.studio/resources/api.js`
2. `new window.Flourish.Live({ container: containerEl, apiKey, template, version, data, bindings, state })`
3. 保存实例到 `liveInstance`
4. emit `loaded`

---

## 8. 状态机

```
idle → loading → ready
              ↘ error
```

- `idle`：组件挂载前
- `loading`：脚本加载中，显示骨架屏
- `ready`：渲染完成，显示 Flourish 内容
- `error`：加载/渲染失败，显示错误提示

---

## 9. 模板结构

```html
<div class="sc-flourish-embed" :style="containerStyle">
  <!-- loading 骨架屏 -->
  <div v-if="status === 'loading'" class="sc-flourish-skeleton">
    <div class="sc-flourish-skeleton__shimmer" />
    <div class="sc-flourish-skeleton__label">加载中...</div>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="status === 'error'" class="sc-flourish-error">
    <div class="sc-flourish-error__icon">⚠</div>
    <div class="sc-flourish-error__msg">{{ errorMessage }}</div>
  </div>

  <!-- Public Embed 容器（始终在 DOM，由 embed.js 填充） -->
  <div
    v-if="mode === 'embed'"
    ref="embedRef"
    class="flourish-embed"
    :data-src="normalisedSrc"
    :aria-label="ariaLabel"
    :style="{ visibility: status === 'ready' ? 'visible' : 'hidden' }"
  />

  <!-- Live API 容器 -->
  <div
    v-if="mode === 'live'"
    ref="liveRef"
    class="sc-flourish-live"
    :aria-label="ariaLabel"
    :style="{ visibility: status === 'ready' ? 'visible' : 'hidden' }"
  />
</div>
```

注意：embed 容器在 `status === 'loading'` 时用 `visibility: hidden` 而非 `v-if`，保证 embed.js MutationObserver 能检测到 DOM 节点。

---

## 10. 样式设计

### 骨架屏
- 背景：`linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`
- 动画：`shimmer` keyframe，`background-position` 从 `-200%` 到 `200%`，1.5s infinite
- 最小高度：`200px`（当 height prop 未指定时）

### 错误状态
- 背景：`rgba(255, 59, 48, 0.06)`，边框 `1px solid rgba(255, 59, 48, 0.2)`
- 图标：⚠ 符号，`#ff3b30`，`24px`
- 文字：`#666`，`14px`

### 容器
- `position: relative`，`overflow: hidden`，`border-radius: 8px`
- 宽度默认 `100%`，高度由 prop 控制或自适应

---

## 11. watch 逻辑

```ts
// Public Embed 模式：visualisationId 变化时重新渲染
watch(() => props.visualisationId, () => {
  if (mode.value === 'embed') reinitEmbed();
});

// Live API 模式：data/state 变化时调用 update
watch([() => props.data, () => props.state], () => {
  if (liveInstance) liveInstance.update({ data: props.data, state: props.state });
}, { deep: true });
```

---

## 12. 生命周期

```
onMounted  → 判断模式 → 加载脚本 → 渲染
onBeforeUnmount → liveInstance?.destroy?.() → liveInstance = null
```

---

## 13. TypeScript 全局类型声明

在 `index.vue` 内部声明，避免污染全局：

```ts
interface FlourishLiveInstance {
  update(opts: Record<string, unknown>): void;
  destroy?(): void;
  getState?(cb: (err: Error | null, state: unknown) => void): void;
}

interface FlourishLiveConstructor {
  new (opts: Record<string, unknown>): FlourishLiveInstance;
}

declare global {
  interface Window {
    Flourish?: {
      Live: FlourishLiveConstructor;
      loadEmbed?: (el: HTMLElement) => void;
    };
  }
}
```
