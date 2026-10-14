<script lang="ts">
/**
 * 菜单项描述（放普通 script 块：script setup 不允许 ES 导出）
 */
export interface DsmMenuItem {
  /** 动作键（select 事件回传） */
  key: string;
  /** 文案 */
  label: string;
  /** ReIcon 图标名 */
  icon: string;
  /** 危险动作（红色） */
  danger?: boolean;
  /** 警告动作（橙色） */
  warning?: boolean;
  /** 与上一项之间画分隔线 */
  divided?: boolean;
  /** 禁用态（置灰、不响应点击、不触发 select；用于受保护目标，如 public 命名空间） */
  disabled?: boolean;
}
</script>

<script setup lang="ts">
/**
 * DsmContextMenu — 中间件控制台统一右键菜单
 *
 * <p>第九批「统一右键」以 ZooKeeper 控制台的 {@code .zk-context-menu} 为模板：
 * fixed 定位在光标处、图标+文案、悬停高亮、danger/warning 变色、分隔线；
 * Teleport 到 body（不被侧栏 overflow 裁剪），点击外部自动关闭。</p>
 *
 * <p>宿主侧用原生 {@code @contextmenu.prevent} 打开并写入 x/y/items，
 * 选择项以 {@code select} 事件冒泡给宿主分发（key 对应宿主自己的动作键）。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import ReIcon from "@repo/ui/re-icon";

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible: boolean;
    /** 菜单 x 坐标（光标 clientX） */
    x: number;
    /** 菜单 y 坐标（光标 clientY） */
    y: number;
    /** 菜单项列表 */
    items?: DsmMenuItem[];
  }>(),
  { visible: false, x: 0, y: 0, items: () => [] },
);

const emit = defineEmits<{
  (e: "select", key: string): void;
  (e: "update:visible", value: boolean): void;
}>();

const menuRef = ref<HTMLElement | null>(null);

/** 定位（防溢出：超出视口回退） */
const menuStyle = computed(() => {
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;
  const estW = 200;
  const estH = (props.items?.length || 0) * 36;
  let x = props.x;
  let y = props.y;
  if (x + estW > vw) x = Math.max(8, vw - estW - 8);
  if (y + estH > vh) y = Math.max(8, vh - estH - 8);
  return { left: `${x}px`, top: `${y}px` };
});

/** 点击外部关闭 */
function onDocumentClick(e: MouseEvent) {
  if (!props.visible) return;
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit("update:visible", false);
  }
}

onMounted(() => document.addEventListener("click", onDocumentClick, true));
onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="dsm-cm-fade">
      <div
        v-if="visible && items.length > 0"
        ref="menuRef"
        class="dsm-cm"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <template v-for="(it, idx) in items" :key="it.key">
          <div v-if="it.divided && idx > 0" class="dsm-cm__divider" />
          <div
            class="dsm-cm__item"
            :class="{
              'dsm-cm__item--danger': it.danger,
              'dsm-cm__item--warning': it.warning,
              'is-disabled': it.disabled,
            }"
            :aria-disabled="it.disabled ? 'true' : undefined"
            @click.stop="
              if (!it.disabled) {
                emit('select', it.key);
                emit('update:visible', false);
              }
            "
          >
            <ReIcon :name="it.icon" size="14" />
            <span class="dsm-cm__label">{{ it.label }}</span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dsm-cm {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.dsm-cm__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.dsm-cm__item:hover { background: var(--bg-hover, #f1f5f9); }
.dsm-cm__item--danger { color: #ef4444; }
.dsm-cm__item--danger:hover { background: rgba(239, 68, 68, 0.1); }
.dsm-cm__item--warning { color: #f59e0b; }
.dsm-cm__item--warning:hover { background: rgba(245, 158, 11, 0.1); }
.dsm-cm__item.is-disabled,
.dsm-cm__item.is-disabled.dsm-cm__item--danger,
.dsm-cm__item.is-disabled.dsm-cm__item--warning {
  color: var(--text-disabled, #cbd5e1);
  cursor: not-allowed;
}
.dsm-cm__item.is-disabled:hover { background: transparent; }
.dsm-cm__label { flex: 1; white-space: nowrap; }
.dsm-cm__divider { height: 1px; margin: 4px 8px; background: var(--border-subtle, rgba(148, 163, 184, 0.2)); }
.dsm-cm-fade-enter-active,
.dsm-cm-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dsm-cm-fade-enter-from { opacity: 0; transform: scale(0.95); }
.dsm-cm-fade-leave-to { opacity: 0; transform: scale(0.95); }
</style>
