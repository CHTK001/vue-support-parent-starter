<script setup lang="ts">
/**
 * 侧边栏 Logo 组件
 * 支持配置图片大小和动画效果
 * @author CH
 * @date 2025-12-02
 */
import { getTopMenu } from "@repo/core";
import { emitter } from "@repo/core";
import { responsiveStorageNameSpace } from "@repo/config";
import { localStorageProxy } from "@repo/utils";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNav } from "../../../hooks/useNav";

defineProps({
  collapse: Boolean,
});

const { title, getLogo, layout } = useNav();

// Logo 配置
const logoSize = ref(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.logoSize ?? 32
);
const logoAnimation = ref(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.logoAnimation ?? "none"
);

// 计算 Logo 样式
const logoStyle = computed(() => ({
  height: `${logoSize.value}px`,
  width: "auto",
}));

// 计算动画类名
const animationClass = computed(() => {
  switch (logoAnimation.value) {
    case "pulse":
      return "logo-pulse";
    case "bounce":
      return "logo-bounce";
    default:
      return "";
  }
});

// 监听配置变更
onMounted(() => {
  emitter.on(
    "logoConfigChange",
    (config: { logoSize: number; logoAnimation: string }) => {
      logoSize.value = config.logoSize;
      logoAnimation.value = config.logoAnimation;
    }
  );
});

onBeforeUnmount(() => {
  emitter.off("logoConfigChange");
});

// 判断当前环境
const currentEnv = import.meta.env.MODE || "production";
const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
const isTest = currentEnv === "test";
const showEnvBadge = computed(() => isDevelopment || isTest);

// 获取环境标识文本
const envBadgeText = computed(() => {
  if (isDevelopment) {
    return "DEV";
  }
  return "TEST";
});

const envBadgeClass = computed(() => {
  return isDevelopment ? "env-dev" : "env-test";
});
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <img
          :src="getLogo()"
          alt="logo"
          :class="animationClass"
          :style="logoStyle"
        />
        <span class="sidebar-title" v-if="layout !== 'double'">
          {{ title }}
        </span>
        <!-- 环境标识 - 双栏模式下不显示 -->
        <span v-if="showEnvBadge && layout !== 'double'" class="env-badge" :class="envBadgeClass">
          {{ envBadgeText }}
        </span>
      </router-link>
      <router-link
        v-else
        key="expand"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <img
          :src="getLogo()"
          alt="logo"
          :class="animationClass"
          :style="logoStyle"
        />
        <span class="sidebar-title" v-if="layout !== 'double'">
          {{ title }}
        </span>
        <!-- 环境标识 - 双栏模式下不显示 -->
        <span v-if="showEnvBadge && layout !== 'double'" class="env-badge" :class="envBadgeClass">
          {{ envBadgeText }}
        </span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;
  background: transparent; // 默认透明，继承父容器背景

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    padding-left: 10px;

    img {
      display: inline-block;
      height: 32px;
    }

    .sidebar-title {
      display: inline-block;
      height: 32px;
      margin: 2px 0 0 12px;
      overflow: hidden;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: all 0.3s ease;
    }

    .env-badge {
      margin-left: 8px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 10px;
      color: #fff;
      letter-spacing: 0.5px;
      flex-shrink: 0;

      &.env-dev {
        background: linear-gradient(135deg, #f59e0b, #f97316);
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
        animation: envPulse 2s ease-in-out infinite;
      }

      &.env-test {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
      }
    }
  }

  /* 收缩状态样式 */
  &.collapses {
    .sidebar-logo-link {
      justify-content: center;
      padding-left: 0;

      .sidebar-title,
      .env-badge {
        display: none;
      }

      img {
        margin: 0;
      }
    }
  }
}

/* Logo 动画效果 */
.logo-pulse {
  animation: logoPulse 2s ease-in-out infinite;
}

.logo-bounce {
  animation: logoBounce 2s ease-in-out infinite;
}

@keyframes logoPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes logoBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-3px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-2px);
  }
}

@keyframes envPulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
  }
  50% {
    opacity: 0.85;
    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.6);
  }
}

// 万圣节主题适配 - 使用更高优先级
:global(html[data-skin="halloween"]) {
  .sidebar-logo-container.sidebar-logo-container {
    background: linear-gradient(135deg, rgba(44, 0, 62, 0.95), rgba(26, 0, 38, 0.9)) !important;

    .sidebar-logo-link {
      background: linear-gradient(135deg, rgba(44, 0, 62, 0.22), rgba(26, 0, 38, 0.08)) !important;
      border-bottom: 1px solid rgba(255, 117, 24, 0.18) !important;
    }

    img {
      filter: drop-shadow(0 4px 12px rgba(255, 117, 24, 0.32)) !important;
    }

    .sidebar-title {
      color: #ff7518 !important; // 南瓜橙
      font-family: 'Creepster', 'cursive', sans-serif;
      text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);
    }

    // 暗黑模式下微调
    &:global(.dark) .sidebar-title {
      color: #d86b15 !important; // 暗一点的橙色
      text-shadow: none;
    }
  }
}

// 确保万圣节主题下 Logo 容器有背景
:global(html[data-skin="halloween"] .sidebar-logo-container) {
  background: linear-gradient(135deg, rgba(44, 0, 62, 0.95), rgba(26, 0, 38, 0.9)) !important;
}

:global(html[data-skin="spring-festival"]),
:global(html.theme-spring-festival) {
  .sidebar-logo-container {
    background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(107, 0, 0, 0.9)) !important;

    .sidebar-logo-link {
      background: linear-gradient(135deg, rgba(124, 0, 20, 0.22), rgba(74, 0, 12, 0.08));
      border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    }

    img {
      filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.28));
    }

    .sidebar-title {
      color: #f5d57a !important;
      font-family: "STZhongsong", "STKaiti", "KaiTi", serif;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.16);
    }
  }
}

:global(html[data-skin="christmas"]),
:global(html.theme-christmas) {
  .sidebar-logo-container {
    background: linear-gradient(135deg, rgba(27, 94, 32, 0.95), rgba(13, 61, 18, 0.9)) !important;

    .sidebar-logo-link {
      background: linear-gradient(135deg, rgba(14, 67, 34, 0.22), rgba(8, 34, 18, 0.08));
      border-bottom: 1px solid rgba(255, 215, 0, 0.18);
    }

    img {
      filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.24));
    }

    .sidebar-title {
      color: #f7de9a !important;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.14);
    }
  }
}

:global(html[data-skin="future-tech"]),
:global(html.theme-future-tech) {
  .sidebar-logo-container {
    background: linear-gradient(135deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;

    .sidebar-logo-link {
      background: linear-gradient(135deg, rgba(15, 37, 24, 0.22), rgba(7, 18, 12, 0.08));
      border-bottom: 1px solid rgba(105, 164, 117, 0.18);
    }

    img {
      filter: drop-shadow(0 4px 12px rgba(242, 208, 122, 0.22));
    }

    .sidebar-title {
      color: #f2d07a !important;
      font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;
      letter-spacing: 0.06em;
      text-shadow: none;
    }
  }
}
</style>
