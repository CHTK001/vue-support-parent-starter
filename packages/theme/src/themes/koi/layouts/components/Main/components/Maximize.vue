<template>
  <!-- 挂到 body：避免嵌入式布局外壳 backdrop-filter / overflow 导致 fixed 被裁剪或非视口参照 -->
  <Teleport to="body">
    <transition name="maximize-exit-fade">
      <!-- Transition 需要单一真实 DOM 根节点，不可直接包 el-tooltip（其根为碎片节点） -->
      <div v-if="globalStore.maximize" class="layout-main-maximize-exit-wrap">
        <el-tooltip
          :content="$t('tabs.exitMaximize')"
          placement="left"
          :show-after="400"
        >
          <button
            type="button"
            class="layout-main-maximize-exit"
            :aria-label="$t('tabs.exitMaximize')"
            @click="handleExitMaximize"
          >
            <el-icon :size="14" class="exit-icon">
              <Close />
            </el-icon>
          </button>
        </el-tooltip>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import useGlobalStore from "@repo/theme/koi/stores/modules/global.ts";

const globalStore = useGlobalStore();

const handleExitMaximize = () => {
  globalStore.setGlobalState("maximize", false);
};
</script>

<style lang="scss" scoped>
.layout-main-maximize-exit-wrap {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 10050;
}

.layout-main-maximize-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  @apply backdrop-blur-[12px] backdrop-saturate-[180%];
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 7px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  outline: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  html.dark & {
    background: rgba(30, 30, 30, 0.65);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.82);
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.18);

    html.dark & {
      background: rgba(40, 40, 40, 0.82);
    }

    .exit-icon {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }

  .exit-icon {
    color: var(--el-text-color-regular);
    transition: color 0.3s ease, transform 0.3s ease;
  }
}

.maximize-exit-fade-enter-active,
.maximize-exit-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.maximize-exit-fade-enter-from,
.maximize-exit-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.92);
}
</style>
