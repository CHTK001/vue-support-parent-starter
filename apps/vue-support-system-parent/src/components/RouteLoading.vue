<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { CoolLoading } from "@repo/pages";

const isDev = import.meta.env.DEV;
const router = useRouter();
const show = ref(false);
const isLoading = ref(false);
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

const options = [
  { label: "圆点加载", value: "default" },
  { label: "像素进度条", value: "pixel" },
  // 这里依旧写 dino，兼容 index.html 与历史配置，但实际在 CoolLoading 中映射为 dinoGame 组件
  { label: "恐龙小游戏", value: "dino" },
  { label: "霓虹进度条", value: "neon" },
  { label: "马里奥采蘑菇", value: "mario" },
  { label: "翻书加载", value: "book" },
  { label: "笔写书加载", value: "bookWrite" },
  { label: "河狸敲蛤蜊", value: "beaver" }
];

const saved = localStorage.getItem("sys-loading-anim") || "default";
const current = ref<string>(saved);

const previewType = computed(() => {
  if (current.value === "dino") {
    return "dinoGame";
  }
  if (current.value === "skeleton") {
    return "skeleton";
  }
  if (current.value === "neon") {
    return "neon";
  }
  if (current.value === "book") {
    return "book";
  }
  if (current.value === "bookWrite") {
    return "bookWrite";
  }
  if (current.value === "beaver") {
    return "beaver";
  }
  return current.value;
});

const select = (value: string) => {
  current.value = value;
  localStorage.setItem("sys-loading-anim", value);
  // 触发自定义事件，通知同窗口内的 CoolLoading 组件更新
  window.dispatchEvent(
    new CustomEvent("localStorageChange", {
      detail: { key: "sys-loading-anim", value }
    })
  );
};

/**
 * 显示加载动画
 */
const showLoading = () => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
  isLoading.value = true;
};

/**
 * 隐藏加载动画
 */
const hideLoading = () => {
  loadingTimer = setTimeout(() => {
    isLoading.value = false;
    loadingTimer = null;
  }, 200);
};

/**
 * 路由守卫：在路由切换时显示加载动画
 */
onMounted(async () => {
  // 初始加载时显示加载动画
  showLoading();
  
  // 等待路由准备好
  try {
    await router.isReady();
    await nextTick();
    hideLoading();
  } catch (error) {
    console.error("[RouteLoading][初始化]路由准备失败:", error);
    hideLoading();
  }
  
  // 注册路由守卫，处理路由切换
  router.beforeEach(() => {
    showLoading();
  });
  
  router.afterEach(async () => {
    await nextTick();
    hideLoading();
  });
});

/**
 * 清理定时器
 */
onUnmounted(() => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
});
</script>

<template>
  <!-- 全屏加载动画 -->
  <CoolLoading v-if="isLoading" :type="previewType" loading-text="页面加载中..." :show-progress="true" />
  
  <!-- 开发环境切换器 -->
  <div v-if="isDev" class="dev-loader-switch">
    <div class="trigger" @click="show = !show" title="切换加载动画">
      ⚙️
    </div>
    <div v-if="show" class="panel">
      <div class="panel-header">
        <span class="panel-title">加载动画</span>
        <span class="panel-desc">点击左侧选项，右侧实时预览</span>
      </div>
      <div class="panel-body">
        <div class="options">
          <div
            v-for="opt in options"
            :key="opt.value"
            class="option"
            :class="{ active: current === opt.value }"
            @click="select(opt.value)"
          >
            {{ opt.label }}
          </div>
        </div>
        <div class="preview">
          <CoolLoading :type="previewType" loading-text="加载预览..." :show-progress="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-loader-switch {
  position: fixed;
  bottom: 20px;
  right: 80px;
  z-index: 99999;
}

.trigger {
  width: 40px;
  height: 40px;
  background: rgba(15, 23, 42, 0.7);
  color: #f9fafb;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.55),
    0 0 0 1px rgba(148, 163, 184, 0.65);
  transition: all 0.25s ease;
  user-select: none;
}

.trigger:hover {
  background: rgba(15, 23, 42, 0.92);
  transform: translateY(-2px) rotate(90deg);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.75),
    0 0 0 1px rgba(148, 163, 184, 0.85);
}

.panel {
  position: absolute;
  bottom: 52px;
  right: 0;
  width: 420px;
  max-width: 90vw;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(148, 163, 184, 0.18), transparent),
    rgba(15, 23, 42, 0.95);
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(148, 163, 184, 0.7);
  color: #e5e7eb;
  padding: 10px 12px 12px;
  backdrop-filter: blur(20px);
  animation: slide-up 0.2s ease-out;
}

.panel-header {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 6px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.85);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
}

.panel-desc {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.panel-body {
  display: flex;
  gap: 10px;
  padding: 8px 6px 4px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  min-width: 120px;
}

.option {
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  color: #d1d5db;
  border-radius: 999px;
  transition: all 0.18s ease;
}

.option:hover {
  background: rgba(31, 41, 55, 0.9);
}

.option.active {
  color: #e5e7eb;
  font-weight: 600;
  background: linear-gradient(90deg, #38bdf8, #6366f1);
  box-shadow: 0 0 0 1px rgba(191, 219, 254, 0.8);
}

.preview {
  position: relative;
  flex: 1;
  min-width: 170px;
  min-height: 120px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(31, 41, 55, 0.95),
    0 16px 30px rgba(15, 23, 42, 0.95);
}

.preview :deep(.cool-loading) {
  position: static;
  inset: auto;
  width: 100%;
  height: 100%;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

