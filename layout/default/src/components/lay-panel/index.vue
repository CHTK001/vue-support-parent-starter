<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { emitter } from "@repo/core";
import { onClickOutside } from "@vueuse/core";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useDataThemeChange } from "../../hooks/useDataThemeChange";
import CloseIcon from "@iconify-icons/ep/close";

const target = ref(null);
const show = ref<Boolean>(false);

const iconClass = computed(() => {
  return ["w-[22px]", "h-[22px]", "flex", "justify-center", "items-center", "outline-none", "rounded-[4px]", "cursor-pointer", "transition-colors", "hover:bg-[#0000000f]", "dark:hover:bg-[#ffffff1f]", "dark:hover:text-[#ffffffd9]"];
});

const { t } = useI18n();
const { onReset } = useDataThemeChange();

onClickOutside(target, (event: any) => {
  if (event.clientX > target.value.offsetLeft) return;
  show.value = false;
  // 发射面板关闭事件
  emitter.emit("settingPanelClosed");
});
onMounted(() => {
  emitter.on("openPanel", () => {
    show.value = true;
  });
});

onBeforeUnmount(() => {
  // 解绑`openPanel`公共事件，防止多次触发
  emitter.off("openPanel");
});
</script>

<template>
  <Teleport to="body">
    <div :class="{ show }">
      <div class="right-panel-background" />
      <div ref="target" class="right-panel bg-bg_color">
        <div class="project-configuration border-b-[1px] border-solid border-[var(--pure-border-color)]">
          <h4 class="dark:text-white">
            {{ t("panel.pureSystemSet") }}
          </h4>
          <span
            v-tippy="{
              content: t('panel.pureCloseSystemSet'),
              placement: 'bottom-start',
              zIndex: 41000,
            }"
            :class="iconClass"
          >
            <IconifyIconOffline class="dark:text-white" width="18px" height="18px" :icon="CloseIcon" @click="() => { show = !show; emitter.emit('settingPanelClosed'); }" />
          </span>
        </div>
        <el-scrollbar>
          <slot />
        </el-scrollbar>

        <div class="flex justify-end p-3 border-t-[1px] border-solid border-[var(--pure-border-color)]">
          <el-button
            v-tippy="{
              content: t('panel.pureClearCacheAndToLogin'),
              placement: 'left-start',
              zIndex: 41000,
            }"
            type="danger"
            text
            bg
            @click="onReset"
          >
            {{ t("panel.pureClearCache") }}
          </el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
:deep(.el-scrollbar) {
  height: calc(100% - 110px);
}

.right-panel-background {
  position: fixed;
  /* 顶部距离 = 导航栏高度 + 标签页高度 */
  top: calc(var(--pure-header-height, 56px) + var(--pure-tags-height, 36px));
  left: var(--pure-sidebar-width, 210px);
  z-index: -1;
  background: rgb(0 0 0 / 20%);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
}

.right-panel {
  position: fixed;
  /* 顶部距离 = 导航栏高度 + 标签页高度 */
  top: calc(var(--pure-header-height, 56px) + var(--pure-tags-height, 36px));
  right: 0;
  z-index: 40000;
  width: 100%;
  max-width: 420px;
  height: calc(100vh - var(--pure-header-height, 56px) - var(--pure-tags-height, 36px));
  box-shadow: 0 0 15px 0 rgb(0 0 0 / 5%);
  transition: all 0.25s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translate(100%);
}

.show {
  transition: all 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);

  .right-panel-background {
    z-index: 20000;
    /* 宽度为屏幕宽度减去侧边栏宽度 */
    width: calc(100vw - var(--pure-sidebar-width, 210px));
    /* 高度为屏幕高度减去顶部导航和标签页高度 */
    height: calc(100vh - var(--pure-header-height, 56px) - var(--pure-tags-height, 36px));
    opacity: 1;
  }

  .right-panel {
    transform: translate(0);
  }
}

.project-configuration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}
.bg-bg_color {
  background-color: var(--el-bg-color) !important;
}
</style>

<!-- 全局样式：不同布局模式下的面板定位 -->
<style lang="scss">
/* 侧边栏收起时 */
body.sidebar-collapsed {
  .right-panel-background {
    left: var(--pure-sidebar-collapsed-width, 54px) !important;
  }
  
  .show .right-panel-background {
    width: calc(100vw - var(--pure-sidebar-collapsed-width, 54px)) !important;
  }
}

/* 水平布局 */
body[layout="horizontal"] {
  .right-panel-background {
    left: 0 !important;
  }
  
  .show .right-panel-background {
    width: 100vw !important;
  }
}

/* 双栏布局 */
body[layout="double"] {
  .right-panel-background {
    left: 320px !important;
  }
  
  .show .right-panel-background {
    width: calc(100vw - 320px) !important;
  }
  
  &.sidebar-collapsed {
    .right-panel-background {
      left: 54px !important;
    }
    
    .show .right-panel-background {
      width: calc(100vw - 54px) !important;
    }
  }
}

/* 悬停布局 */
body[layout="hover"] {
  .right-panel-background {
    left: 200px !important;
  }
  
  .show .right-panel-background {
    width: calc(100vw - 200px) !important;
  }
}

/* 移动布局 */
body[layout="mobile"] {
  .right-panel-background {
    left: 0 !important;
    top: var(--pure-header-height, 56px) !important;
  }
  
  .right-panel {
    top: var(--pure-header-height, 56px) !important;
    height: calc(100vh - var(--pure-header-height, 56px)) !important;
  }
  
  .show .right-panel-background {
    width: 100vw !important;
    height: calc(100vh - var(--pure-header-height, 56px)) !important;
  }
}
</style>
