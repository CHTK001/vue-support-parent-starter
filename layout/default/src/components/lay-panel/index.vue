<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { emitter } from "@repo/core";
import { onClickOutside, useStorage } from "@vueuse/core";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
  useSlots,
} from "vue";
import { useDataThemeChange } from "../../hooks/useDataThemeChange";
import CloseIcon from "@iconify-icons/ep/close";
import ScScrollbar from "@repo/components/ScScrollbar";

/**
 * 设置面板记忆数据
 * @description 统一记录打开状态与滚动位置，避免拆分多个 key
 */
interface PanelMemory {
  /** 是否可见 */
  visible: boolean;
  /** 内容滚动位置（el-scrollbar 的 scrollTop） */
  scrollTop: number;
}

const target = ref(null);
const scrollbarRef = ref<any>(null);

/**
 * 设置面板记忆（本地持久化）
 * @description 统一记录显示状态与当前位置，刷新后自动恢复
 */
const PANEL_MEMORY_STORAGE_KEY = "LAY_PANEL_MEMORY";
const panelMemory = useStorage<PanelMemory>(PANEL_MEMORY_STORAGE_KEY, {
  visible: false,
  scrollTop: 0,
});

// 兼容旧版本仅存储 boolean 的场景
if (typeof panelMemory.value === "boolean") {
  panelMemory.value = {
    visible: panelMemory.value,
    scrollTop: 0,
  } as PanelMemory;
}

const show = ref<boolean>(panelMemory.value.visible);
const scrollTop = ref<number>(panelMemory.value.scrollTop ?? 0);
const slots = useSlots();
const hasFooter = computed(() => Boolean(slots.footer));

/**
 * 打开设置面板
 * @description 更新 UI 状态并写入本地记忆
 */
function openPanel(): void {
  show.value = true;
  panelMemory.value = {
    ...panelMemory.value,
    visible: true,
  };
}

const handleOpenPanel = (): void => {
  openPanel();
};

/**
 * 关闭设置面板
 * @description 更新 UI 状态并写入本地记忆，同时广播关闭事件
 */
function closePanel(): void {
  show.value = false;
  panelMemory.value = {
    ...panelMemory.value,
    visible: false,
  };
  emitter.emit("settingPanelClosed");
}

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

/**
 * 处理滚动事件
 * @description 记录当前滚动位置，写入同一个记忆对象
 */
function handleScroll(payload: {
  scrollTop: number;
  scrollLeft: number;
}): void {
  scrollTop.value = payload.scrollTop;
  panelMemory.value = {
    ...panelMemory.value,
    scrollTop: scrollTop.value,
  };
}

onClickOutside(target, (event: any) => {
  if (!target.value) return;
  if (event.clientX > (target.value as any).offsetLeft) return;
  closePanel();
});
onMounted(() => {
  emitter.on("openPanel", handleOpenPanel);

  // 恢复滚动位置
  nextTick(() => {
    if (scrollbarRef.value && scrollTop.value > 0) {
      try {
        scrollbarRef.value.setScrollTop(scrollTop.value);
      } catch {
        // 忽略滚动恢复异常，避免影响主流程
      }
    }
  });
});

watch(show, (value) => {
  if (!value) {
    return;
  }
  nextTick(() => {
    if (scrollbarRef.value && scrollTop.value > 0) {
      try {
        scrollbarRef.value.setScrollTop(scrollTop.value);
      } catch {
        // 忽略滚动恢复异常，避免影响主流程
      }
    }
  });
});

onBeforeUnmount(() => {
  // 只解绑当前实例的监听，避免 HMR/重挂载时误删其它实例监听
  emitter.off("openPanel", handleOpenPanel);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="show">
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
                  closePanel();
                }
              "
            />
          </span>
        </div>
        <ScScrollbar ref="scrollbarRef" @scroll="handleScroll">
          <slot />
        </ScScrollbar>

        <div v-if="hasFooter" class="panel-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
:global(html) {
  --lay-panel-backdrop-bg: rgb(0 0 0 / 28%);
  --lay-panel-backdrop-blur: 0px;
  --lay-panel-surface-bg: var(--el-bg-color-overlay);
  --lay-panel-surface-blur: 8px;
  --lay-panel-border: var(--stitch-glass-border);
  --lay-panel-shadow: -18px 0 40px rgba(15, 23, 42, 0.16);
  --lay-panel-header-bg: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  --lay-panel-footer-bg: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02),
    transparent
  );
}

:global(html[data-skin="future-tech"]),
:global(html.theme-future-tech) {
  --lay-panel-backdrop-bg: rgba(1, 6, 18, 0.5);
  --lay-panel-backdrop-blur: 0px;
  --lay-panel-surface-bg: linear-gradient(
    180deg,
    rgba(4, 10, 28, 0.98),
    rgba(7, 19, 43, 0.96)
  );
  --lay-panel-surface-blur: 6px;
  --lay-panel-border: rgba(102, 248, 255, 0.18);
  --lay-panel-shadow: -22px 0 54px rgba(0, 187, 255, 0.14);
  --lay-panel-header-bg: linear-gradient(
    90deg,
    rgba(102, 248, 255, 0.08),
    transparent 72%
  );
  --lay-panel-footer-bg: linear-gradient(
    90deg,
    rgba(102, 248, 255, 0.05),
    transparent 72%
  );
}

:deep(.el-scrollbar) {
  flex: 1;
  width: 100%;
  height: 0; /* flex 子项，由 flex:1 撑满，不能用 calc */
  min-height: 0;
}

:deep(.el-scrollbar__wrap) {
  width: 100%;
}

:deep(.el-scrollbar__view) {
  width: 100%;
}

// 遮罩层 - 覆盖整个视口
.right-panel-background {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100vw;
  height: 100vh;
  background: var(--lay-panel-backdrop-bg);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  pointer-events: none;
  backdrop-filter: blur(var(--lay-panel-backdrop-blur));
}

// 设置面板 - 从右侧滑入，固定宽度 520px 与系统设置一致
.right-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40000;
  width: 520px; /* 固定宽度，与系统设置保持一致 */
  max-width: 100%; /* 移动端响应式 */
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translate3d(100%, 0, 0);
  border-left: 1px solid var(--lay-panel-border);
  background: var(--lay-panel-surface-bg);
  box-shadow: var(--lay-panel-shadow);
  backdrop-filter: blur(var(--lay-panel-surface-blur));
  contain: layout paint style;
  will-change: transform;
}

.show {
  .right-panel-background {
    z-index: 39999;
    opacity: 1;
    pointer-events: auto;
  }

  .right-panel {
    transform: translate3d(0, 0, 0);
  }
}

.project-configuration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--lay-panel-border);
  background: var(--lay-panel-header-bg);
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
  justify-content: center;
  padding: 16px 20px;
  border-top: 1px solid var(--lay-panel-border);
  background: var(--lay-panel-footer-bg);
}

.bg-bg_color {
  background: var(--lay-panel-surface-bg) !important;
  backdrop-filter: blur(var(--lay-panel-surface-blur));
}

.close-icon {
  transition: all 0.3s;

  &:hover {
    color: var(--stitch-accent);
    transform: rotate(90deg);
  }
}
</style>
