<template>
  <div class="re-async" :style="rootStyle">
    <!-- 加载中：自定义 loading 插槽优先，其次 ReLoader，最后内置骨架 -->
    <div v-if="status === 'loading'" class="re-async__loading">
      <slot name="loading">
        <ReLoader
          v-if="loadingMode === 'loader'"
          loading
          :variant="loaderVariant"
          :mode="'skeleton'"
          :fullscreen="false"
          :text="loadingText"
          :delay="loaderDelay"
          :timeout="loaderTimeout"
          :skeleton-height="skeletonHeight"
          @timeout="onLoaderTimeout"
        />
        <div v-else class="re-async__skeleton" :style="{ height: skeletonHeight }">
          <div class="re-async__bar" />
          <div class="re-async__bar" />
          <div class="re-async__bar" />
          <div class="re-async__bar" />
          <div class="re-async__bar re-async__bar--short" />
        </div>
      </slot>
    </div>

    <!-- 加载失败：可重试 -->
    <div v-else-if="status === 'error'" class="re-async__error">
      <slot name="error" :error="error" :retry="load">
        <div class="re-async__error-box">
          <el-icon class="re-async__error-icon" :size="28"><WarningFilled /></el-icon>
          <div class="re-async__error-text">
            组件加载失败{{ error?.message ? `：${error.message}` : "" }}
          </div>
          <el-button size="small" @click="load">重新加载</el-button>
        </div>
      </slot>
    </div>

    <!-- 加载完成：过渡进入目标组件 -->
    <Transition v-else :name="transitionName" appear>
      <component :is="comp" v-bind="attrs" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * ReAsync —— 通用异步组件加载器
 *
 * 把「按需加载其它组件 + 加载动画 + 进入过渡 + 错误重试」封装成一个组件，
 * 业务只需要传一个 loader：
 *
 * ```vue
 * <ReAsync :loader="() => import('@pages/ai/components/models/ModelsPage.vue')">
 *   <template #loading>
 *     <el-skeleton :rows="6" animated />
 *   </template>
 * </ReAsync>
 * ```
 *
 * - 加载期间默认交给 {@link ReLoader}（统一加载动画，可用 loaderVariant 切换海浪/进度条/双环），
 *   `#loading` 插槽可完全自定义，`loadingMode="skeleton"` 可退回内置骨架条。
 * - 组件就绪后以淡入上移过渡出现，避免白屏后“突然弹出”。
 * - loader 失败时展示错误态，支持一键重试。
 * - loaderTimeout 到点会 emit `loader-timeout`，宿主可据此提示或降级。
 */
import { shallowRef, watch, onMounted, useAttrs, computed } from "vue";
import { WarningFilled } from "@element-plus/icons-vue";
import ReLoader from "../ReLoader/ReLoader.vue";
import type { ReLoaderVariant } from "../ReLoader/types";

interface Props {
  /** 返回「组件模块 promise」的加载函数（动态 import 或其包装） */
  loader: () => Promise<{ default: unknown }>;
  /** 加载动画容器最小高度，避免页面跳动（如 "480px"） */
  minHeight?: string;
  /** 骨架动画高度 */
  skeletonHeight?: string;
  /** 指定进入过渡名（默认 re-async-enter） */
  enterTransition?: string;
  /**
   * 是否撑满父容器高度（height: 100%）。
   *
   * <p>注意：父容器只靠 min-height 撑出“视觉高度”时，子组件的
   * height:100% 不会生效（CSS 百分比高度要求父 height 为确定值）。
   * 当被加载组件根节点用 h-full 且宿主给了确定高度时，应开启本项。</p>
   */
  fillHeight?: boolean;
  /**
   * 加载态形态。
   *
   * <ul>
   *   <li>{@code loader}（默认）：用 ReLoader 统一加载动画（可配 {@link loaderVariant}）；</li>
   *   <li>{@code skeleton}：用内置骨架条（结构固定、无文案的旧行为）。</li>
   * </ul>
   */
  loadingMode?: "loader" | "skeleton";
  /** ReLoader 动画形态（loadingMode=loader 时生效） */
  loaderVariant?: ReLoaderVariant;
  /** ReLoader 文案；空则不显示 */
  loadingText?: string;
  /** ReLoader 延迟显示（毫秒）：避免快请求闪一下 */
  loaderDelay?: number;
  /** ReLoader 超时（毫秒，0=不限）；到点关闭加载态并回调 */
  loaderTimeout?: number;
}

const props = withDefaults(defineProps<Props>(), {
  minHeight: "auto",
  skeletonHeight: "240px",
  enterTransition: "re-async-enter",
  fillHeight: false,
  loadingMode: "loader",
  // 与 ReLoader 默认一致
  loaderVariant: "spin",
  loadingText: "",
  loaderDelay: 0,
  loaderTimeout: 0,
});

const emit = defineEmits<{
  /** 加载超时（组件迟迟未就绪）。宿主可据此提示或改走降级渲染 */
  (e: "loader-timeout"): void;
}>();

function onLoaderTimeout() {
  emit("loader-timeout");
}

const attrs = useAttrs();
const transitionName = computed(() => props.enterTransition);
const rootStyle = computed(() => ({
  minHeight: props.minHeight,
  height: props.fillHeight ? "100%" : undefined,
}));

defineOptions({ name: "ReAsync", inheritAttrs: false });

type Status = "loading" | "error" | "success";

const status = shallowRef<Status>("loading");
const comp = shallowRef<unknown>(null);
const error = shallowRef<Error | null>(null);

async function load(): Promise<void> {
  status.value = "loading";
  error.value = null;
  try {
    const mod = await props.loader();
    comp.value = (mod as { default?: unknown }).default ?? mod;
    status.value = "success";
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e));
    status.value = "error";
  }
}

onMounted(load);
watch(() => props.loader, load);
</script>

<style scoped>
.re-async {
  position: relative;
  width: 100%;
}

.re-async__loading {
  width: 100%;
}

/* 默认骨架：一排呼吸波动的圆角条 */
.re-async__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 16px;
}
.re-async__bar {
  height: 22px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color-light) 25%,
    var(--el-fill-color) 50%,
    var(--el-fill-color-light) 75%
  );
  background-size: 200% 100%;
  animation: re-async-shimmer 1.4s ease-in-out infinite;
}
.re-async__bar--short {
  width: 55%;
}
@keyframes re-async-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.re-async__error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}
.re-async__error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 28px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  text-align: center;
}
.re-async__error-icon {
  color: var(--el-color-warning);
}
.re-async__error-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  max-width: 420px;
  word-break: break-all;
}
</style>

<style>
/* 进入过渡：淡入 + 轻微上移（全局注册，供 Transition 使用） */
.re-async-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.re-async-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .re-async-enter-active {
    transition: opacity 0.15s linear, transform none;
  }
  .re-async__bar {
    animation: none;
  }
}
</style>

