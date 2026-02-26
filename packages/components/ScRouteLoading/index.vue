<template>
  <!-- 路由加载时保持 HTML loader 可见，不额外渲染 -->
  <!-- 开发环境切换器 -->
  <div v-if="isDev && showDevSwitcher" class="dev-loader-switch">
    <div class="trigger" @click="showPanel = !showPanel" title="加载动画预览">⚙️</div>
    <div v-if="showPanel" class="panel">
      <div class="panel-header">
        <span class="panel-title">加载动画预览</span>
        <span class="panel-desc">选择加载动画样式</span>
      </div>
      <div class="panel-body">
        <div v-for="(style, key) in loaderStyles" :key="key" class="style-option" :class="{ active: currentStyle === key }" @click="changeStyle(key)">
          <div class="preview-mini" v-html="getPreviewHTML(key)"></div>
          <span class="style-name">{{ style.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ScRouteLoading - 路由加载动画组件
 *
 * 统一使用 HTML loader，不再额外渲染加载动画
 * 仅在开发环境提供样式切换器
 */
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

interface Props {
  showDevSwitcher?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDevSwitcher: true
});

const isDev = import.meta.env.DEV;
const router = useRouter();
const showPanel = ref(false);
const currentStyle = ref(localStorage.getItem("sys-loader-style") || "default");

// 加载动画样式配置
const loaderStyles = {
  default: { name: "三个圆点" },
  rings: { name: "彩色圆环" },
  simple: { name: "简约圆环" },
  pulse: { name: "脉冲圆点" },
  blocks: { name: "跳动方块" }
};

const getPreviewHTML = (key: string) => {
  const previews: Record<string, string> = {
    default:
      '<div style="display:flex;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div><div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div><div style="width:8px;height:8px;border-radius:50%;background:#406eeb"></div></div>',
    rings: '<div style="width:30px;height:30px;border:2px solid #ff6b6b;border-radius:50%;border-right-color:transparent"></div>',
    simple: '<div style="width:30px;height:30px;border:3px solid rgba(64,110,235,0.2);border-top-color:#406eeb;border-radius:50%"></div>',
    pulse: '<div style="width:16px;height:16px;background:#406eeb;border-radius:50%"></div>',
    blocks:
      '<div style="display:flex;gap:3px"><div style="width:8px;height:8px;background:#406eeb;border-radius:2px"></div><div style="width:8px;height:8px;background:#406eeb;border-radius:2px"></div><div style="width:8px;height:8px;background:#406eeb;border-radius:2px"></div></div>'
  };
  return previews[key] || previews.default;
};

const changeStyle = (key: string) => {
  currentStyle.value = key;
  localStorage.setItem("sys-loader-style", key);

  // 提示用户刷新页面
  if (window.confirm("加载样式已更改，需要刷新页面才能生效。是否立即刷新？")) {
    window.location.reload();
  }
};

// 路由守卫：显示/隐藏 HTML loader
const showHTMLLoader = () => {
  const app = document.getElementById("app");
  if (app && app.children.length === 0) {
    // 如果 app 为空，重新注入 loader
    const loaderType = localStorage.getItem("sys-loader-style") || "default";
    const loaderHTML = getLoaderHTML(loaderType);
    app.innerHTML = loaderHTML;
  }
  // 确保 app 可见
  if (app) {
    app.style.display = "flex";
  }
};

const hideHTMLLoader = () => {
  // 不做任何操作，让 Vue 接管 #app
};

const getLoaderHTML = (type: string) => {
  const loaders: Record<string, string> = {
    default: '<div class="loader"></div>',
    rings: '<div class="loading-spinner"><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div></div>',
    simple: '<div class="simple-spinner"></div>',
    pulse: '<div class="pulse-loader"></div>',
    blocks: '<div class="blocks-loader"><div class="block"></div><div class="block"></div><div class="block"></div></div>'
  };
  return loaders[type] || loaders.default;
};

onMounted(async () => {
  // 初始加载时显示 loader
  showHTMLLoader();

  try {
    await router.isReady();
    hideHTMLLoader();
  } catch (error) {
    console.error("[ScRouteLoading] 路由准备失败:", error);
    hideHTMLLoader();
  }

  // 路由守卫
  router.beforeEach(() => {
    showHTMLLoader();
  });

  router.afterEach(() => {
    // 延迟隐藏，让页面有时间渲染
    setTimeout(hideHTMLLoader, 100);
  });
});

onUnmounted(() => {
  // 清理工作
});

defineExpose({
  show: showHTMLLoader,
  hide: hideHTMLLoader
});
</script>

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
  width: 320px;
  max-width: 90vw;
  border-radius: 18px;
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.18), transparent), rgba(15, 23, 42, 0.95);
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
  margin-bottom: 8px;
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
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-option:hover {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(64, 110, 235, 0.6);
  transform: translateX(4px);
}

.style-option.active {
  background: rgba(64, 110, 235, 0.2);
  border-color: #406eeb;
}

.preview-mini {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}

.style-name {
  font-size: 13px;
  font-weight: 500;
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
