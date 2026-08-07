<script setup lang="ts">
/**
 * ReDrawer default 主题 —— 抽屉组件（el-drawer 封装）
 *
 * 增强：传入 id 后，自动持久化 size（宽度/高度）和 visible 状态到 localStorage，
 * 刷新页面后自动恢复关闭前的状态。
 *
 * 持久化 key 由 @repo/config.getStorageKey 统一加前缀（避免多 app 串数据）。
 */
import { ElDrawer } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { getStorageKey } from "@repo/config";

defineOptions({ name: "ReDrawer", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  /** 抽屉唯一标识；传入后 size/visible 状态自动持久化到 localStorage */
  id?: string;
  title?: string;
  size?: string | number;
  direction?: "ltr" | "rtl" | "ttb" | "btt";
  appendToBody?: boolean;
  closeOnClickModal?: boolean;
  destroyOnClose?: boolean;
  beforeClose?: (done: () => void) => void;
  showClose?: boolean;
  modal?: boolean;
  lockScroll?: boolean;
}>();

/** 抽屉内部子项后缀（app 前缀由 getStorageKey 加） */
const DRAWER_SUFFIX = "drawer";

function storageKey(): string {
  if (!props.id) return "";
  return getStorageKey(`${DRAWER_SUFFIX}:${props.id}`);
}

/** 内部响应式 size（可被持久化覆盖） */
const innerSize = ref<string | number | undefined>(props.size);

/** 从 localStorage 恢复 */
function restore(): void {
  const key = storageKey();
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const state = JSON.parse(raw) as { size?: string | number; visible?: boolean };
    if (state.size != null) innerSize.value = state.size;
    if (state.visible != null) visible.value = state.visible;
  } catch {
    /* ignore */
  }
}

/** 保存到 localStorage */
function save(): void {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ size: innerSize.value, visible: visible.value }),
    );
  } catch {
    /* ignore */
  }
}

/** 监听 size/visible 变化自动保存 */
watch([visible, innerSize], () => save(), { deep: true });

/** 挂载时恢复 */
onMounted(() => restore());

/** size prop 变化同步到 innerSize */
watch(
  () => props.size,
  (v) => {
    // 仅在无持久化数据时使用 prop 值
    const key = storageKey();
    if (key) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const state = JSON.parse(raw) as { size?: string | number };
          if (state.size != null) return;
        } catch { /* fall through */ }
      }
    }
    innerSize.value = v;
  },
  { immediate: true },
);

/** 最终生效的 size */
const effectiveSize = computed(() => innerSize.value ?? props.size);
</script>

<template>
  <ElDrawer
    v-model="visible"
    v-bind="$attrs"
    :title="title"
    :size="effectiveSize"
    :direction="direction"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    :show-close="showClose"
    :modal="modal"
    :lock-scroll="lockScroll"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ElDrawer>
</template>
