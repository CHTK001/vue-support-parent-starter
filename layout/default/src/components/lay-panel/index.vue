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

// 遮罩层 - 覆盖整个视口
.right-panel-background {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100vw;
  height: 100vh;
  background: rgb(0 0 0 / 30%);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  pointer-events: none;
}

// 设置面板 - 从右侧滑入
.right-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40000;
  width: 100%;
  max-width: 420px;
  height: 100vh;
  box-shadow: -4px 0 20px rgb(0 0 0 / 10%);
  transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translateX(100%);
}

.show {
  .right-panel-background {
    z-index: 39999;
    opacity: 1;
    pointer-events: auto;
  }

  .right-panel {
    transform: translateX(0);
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
