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
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]",
  ];
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
      <div ref="target" class="right-panel bg-bg_color stitch-glass-panel">
        <div class="project-configuration">
          <h4 class="dark:text-white panel-title">
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
            <IconifyIconOffline
              class="dark:text-white close-icon"
              width="18px"
              height="18px"
              :icon="CloseIcon"
              @click="
                () => {
                  show = !show;
                  emitter.emit('settingPanelClosed');
                }
              "
            />
          </span>
        </div>
        <el-scrollbar>
          <slot />
        </el-scrollbar>

        <div class="panel-footer">
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
  backdrop-filter: blur(4px);
}

// 设置面板 - 从右侧滑入
.right-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40000;
  width: 100%;
  max-width: 520px;
  height: 100vh;
  // box-shadow: -4px 0 20px rgb(0 0 0 / 10%); // Moved to stitch-glass-panel
  transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translateX(100%);
  border-left: 1px solid var(--stitch-glass-border);
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--stitch-glass-border);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent);
}

.panel-title {
  font-size: 18px !important;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;

  /* Decorative indicator */
  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 18px;
    background: var(--stitch-accent);
    margin-right: 12px;
    border-radius: 2px;
    box-shadow: 0 0 8px var(--stitch-accent);
  }
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--stitch-glass-border);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.02), transparent);
}

.bg-bg_color {
  background-color: var(--el-bg-color-overlay) !important; // Match overlay bg
  backdrop-filter: blur(10px); // Glass effect
}

.close-icon {
  transition: all 0.3s;

  &:hover {
    color: var(--stitch-accent);
    transform: rotate(90deg);
  }
}
</style>
