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

      .sidebar-title {
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
</style>
