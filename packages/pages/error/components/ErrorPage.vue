<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
import PixelStyle from "./styles/PixelStyle.vue";
import SpaceStyle from "./styles/SpaceStyle.vue";
import MinimalStyle from "./styles/MinimalStyle.vue";
import ForbiddenStyle from "./styles/ForbiddenStyle.vue";
import NotFoundStyle from "./styles/NotFoundStyle.vue";
import ServerErrorStyle from "./styles/ServerErrorStyle.vue";

// 从配置获取是否显示风格切换器
const showStyleSwitcher = computed(() => getConfig().ShowErrorPageStyleSwitcher ?? false);

// 从配置获取默认错误页面风格
const defaultStyle = computed(() => getConfig().ErrorPageStyle ?? "pixel");

defineOptions({
  name: "ErrorPage",
});

type StyleType = "pixel" | "space" | "minimal" | "forbidden" | "notfound" | "servererror";

const props = withDefaults(
  defineProps<{
    code: number | string;
    style?: StyleType;
  }>(),
  {
    style: "pixel",
  }
);

const { t } = useI18n();
const router = useRouter();

// 风格配置
const styleOptions: { key: StyleType; label: string; icon: string }[] = [
  { key: "pixel", label: "像素恐龙", icon: "🦖" },
  { key: "space", label: "太空宇航员", icon: "🚀" },
  { key: "minimal", label: "简约风格", icon: "✨" },
  { key: "forbidden", label: "禁止访问", icon: "🔒" },
  { key: "notfound", label: "迷路沙漠", icon: "🏜️" },
  { key: "servererror", label: "服务器故障", icon: "💥" },
];

// localStorage key
const STORAGE_KEY = "error-page-style";

// 当前选中的风格（优先级：localStorage > 配置文件 > props > 默认pixel）
const currentStyle = ref<StyleType>(props.style || (defaultStyle.value as StyleType));

// 风格选择器是否展开
const showStylePicker = ref(false);

// 从 localStorage 读取保存的风格（如果开启了风格切换器）
onMounted(() => {
  if (showStyleSwitcher.value) {
    const savedStyle = localStorage.getItem(STORAGE_KEY);
    if (savedStyle && styleOptions.some(s => s.key === savedStyle)) {
      currentStyle.value = savedStyle as StyleType;
      return;
    }
  }
  // 使用配置文件中的默认风格
  currentStyle.value = props.style || (defaultStyle.value as StyleType);
});

// 切换风格
const switchStyle = (style: StyleType) => {
  currentStyle.value = style;
  localStorage.setItem(STORAGE_KEY, style);
  showStylePicker.value = false;
};

// 切换到下一个风格
const nextStyle = () => {
  const currentIndex = styleOptions.findIndex(s => s.key === currentStyle.value);
  const nextIndex = (currentIndex + 1) % styleOptions.length;
  switchStyle(styleOptions[nextIndex].key);
};

// 错误信息映射
const errorInfo = computed(() => {
  const code = String(props.code);
  const messages: Record<string, { title: string; desc: string }> = {
    "403": {
      title: t("error.forbidden"),
      desc: t("error.forbiddenDesc"),
    },
    "404": {
      title: t("error.notFound"),
      desc: t("error.notFoundDesc"),
    },
    "500": {
      title: t("error.serverError"),
      desc: t("error.serverErrorDesc"),
    },
  };
  return messages[code] || messages["404"];
});

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  router.go(-1);
};

// 根据风格选择组件
const styleComponent = computed(() => {
  const styles: Record<StyleType, any> = {
    pixel: PixelStyle,
    space: SpaceStyle,
    minimal: MinimalStyle,
    forbidden: ForbiddenStyle,
    notfound: NotFoundStyle,
    servererror: ServerErrorStyle,
  };
  return styles[currentStyle.value] || styles.pixel;
});

// 当前风格信息
const currentStyleInfo = computed(() => {
  return styleOptions.find(s => s.key === currentStyle.value) || styleOptions[0];
});
</script>

<template>
  <div class="error-page">
    <component
      :is="styleComponent"
      :code="code"
      :title="errorInfo.title"
      :description="errorInfo.desc"
      @go-home="goHome"
      @go-back="goBack"
    />
    
    <!-- 风格切换按钮 - 由配置控制是否显示 -->
    <div v-if="showStyleSwitcher" class="style-switcher">
      <button 
        class="style-toggle-btn" 
        @click="showStylePicker = !showStylePicker"
        :title="'当前风格: ' + currentStyleInfo.label"
      >
        <span class="btn-icon">🎨</span>
      </button>
      
      <!-- 快速切换按钮 -->
      <button 
        class="style-next-btn" 
        @click="nextStyle"
        title="切换下一个风格"
      >
        <span class="btn-icon">⏭️</span>
      </button>
      
      <!-- 风格选择面板 -->
      <transition name="fade">
        <div v-if="showStylePicker" class="style-picker">
          <div class="picker-header">
            <span>选择错误页风格</span>
            <button class="close-btn" @click="showStylePicker = false">✕</button>
          </div>
          <div class="picker-options">
            <button
              v-for="option in styleOptions"
              :key="option.key"
              class="style-option"
              :class="{ active: currentStyle === option.key }"
              @click="switchStyle(option.key)"
            >
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-label">{{ option.label }}</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
}

// 风格切换器
.style-switcher {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.style-toggle-btn,
.style-next-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .btn-icon {
    font-size: 1.5rem;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 风格选择面板
.style-picker {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
  color: #333;
  
  .close-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    color: #999;
    border-radius: 50%;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #333;
    }
  }
}

.picker-options {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 15px 10px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.2s ease;
  
  .option-icon {
    font-size: 1.8rem;
  }
  
  .option-label {
    font-size: 0.75rem;
    color: #666;
    white-space: nowrap;
  }
  
  &:hover {
    background: rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.3);
  }
  
  &.active {
    background: rgba(64, 158, 255, 0.15);
    border-color: #409eff;
    
    .option-label {
      color: #409eff;
      font-weight: 600;
    }
  }
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

// 深色模式适配
:global(html.dark) {
  .style-toggle-btn,
  .style-next-btn {
    background: rgba(30, 30, 30, 0.9);
  }
  
  .style-picker {
    background: rgba(30, 30, 30, 0.95);
    
    .picker-header {
      color: #eee;
      border-bottom-color: rgba(255, 255, 255, 0.1);
      
      .close-btn {
        color: #888;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #eee;
        }
      }
    }
    
    .style-option {
      background: rgba(255, 255, 255, 0.05);
      
      .option-label {
        color: #aaa;
      }
      
      &:hover {
        background: rgba(64, 158, 255, 0.2);
      }
      
      &.active {
        background: rgba(64, 158, 255, 0.25);
        
        .option-label {
          color: #409eff;
        }
      }
    }
  }
}
</style>
