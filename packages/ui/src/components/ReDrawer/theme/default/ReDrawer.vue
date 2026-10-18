<script setup lang="ts">
/**
 * ReDrawer default 主题 —— 抽屉组件（el-drawer 封装）
 *
 * 增强：传入 id 后，自动持久化 size（宽度/高度）和 visible 状态到 localStorage，
 * 刷新页面后自动恢复关闭前的状态。
 *
 * 持久化 key 由 @repo/config.getStorageKey 统一加前缀（避免多 app 串数据）。
 */
import { ElDrawer, ElButton } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { getStorageKey } from "@repo/config";

defineOptions({ name: "ReDrawer", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
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
    /** 确认按钮文案（默认「确定」）：只在内置底栏渲染时生效 */
    confirmText?: string;
    /** 取消按钮文案（默认「取消」）：只在内置底栏渲染时生效 */
    cancelText?: string;
    /** 确认按钮 loading 态（koi 主题同名 prop） */
    confirmLoading?: boolean;
    /** 整抽屉 loading 的别名（koi 主题同名 prop，等价于 confirmLoading） */
    loading?: boolean;
    /** 是否渲染内置「确定」按钮（默认 true） */
    showOk?: boolean;
    /** 是否渲染内置「取消」按钮（默认 true） */
    showCancel?: boolean;
    /**
     * 底部区域三态（与 ReDialog / koi 主题对齐）：
     *   - undefined（未传，默认）：只在业务提供 #footer 插槽时渲染插槽内容，不自带按钮；
     *   - true：渲染自带「取消/确定」（提供 #footer 插槽时插槽内容优先）；
     *   - false：整个底部区域不渲染（即使有 #footer 插槽）。
     */
    showFooter?: boolean;
    /** showFooter 的反义别名（koi 主题惯用写法），两者同时传时以 showFooter 为准 */
    footerHidden?: boolean;
  }>(),
  {
    confirmText: "确定",
    cancelText: "取消",
    confirmLoading: false,
    loading: false,
    showOk: true,
    showCancel: true,
    // showFooter / footerHidden 必须显式 default: undefined：Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false（resolvePropValue: isAbsent && !hasDefault → false），
    // 三态里的「未传＝只渲染业务 #footer 插槽」将永远不可达，业务自定义底栏会被误吞。
    showFooter: undefined,
    footerHidden: undefined,
  },
);

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

/** 确认按钮 loading：confirmLoading 优先，其次 loading（koi 同名 prop） */
const effectiveConfirmLoading = computed(() => props.confirmLoading || props.loading);

/**
 * 底部区域三态归一：true=渲染自带按钮 / false=整块不渲染 / undefined=未传
 * （只渲染业务 #footer 插槽，不自带按钮）。口径与 ReDialog / koi 主题一致。
 */
const footerMode = computed<boolean | undefined>(() => {
  if (props.showFooter !== undefined) return props.showFooter;
  if (props.footerHidden !== undefined) return !props.footerHidden;
  return undefined;
});

const emit = defineEmits<{
  (e: "ok"): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

/** 确定：ok + confirm 都发（页面两种写法都能生效，与 koi ReDialog 同口径） */
function onOk(): void {
  if (effectiveConfirmLoading.value) return;
  emit("confirm");
  emit("ok");
}

/**
 * 取消：发 cancel 并关闭抽屉。
 *
 * <p>关闭不能只交给调用方：业务没接 {@code @cancel} 时按钮会「点了没反应」，
 * 表现成「取消没法点击」。这里兜底关闭，接了 @cancel 的页面照旧收到事件（重复关闭无害）。</p>
 */
function onCancel(): void {
  emit("cancel");
  visible.value = false;
}
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
    <!--
      底部三态（与 ReDialog 口径一致）：
        - false        → 整块不渲染（即使有 #footer 插槽）；
        - true         → 渲染自带「取消/确定」（有 #footer 插槽时插槽内容优先）；
        - 未传(undefined) → 只在业务提供 #footer 插槽时渲染插槽内容，不自带按钮。
      自带按钮默认不渲染：ReDrawer 的写法以业务 #footer 为主，
      要自带按钮请在调用方显式传 :show-footer="true"（或 :footer-hidden="false"）。
    -->
    <template
      v-if="footerMode !== false && (footerMode === true || !!$slots.footer)"
      #footer
    >
      <slot
        name="footer"
        :ok="onOk"
        :confirm="onOk"
        :cancel="onCancel"
        :loading="effectiveConfirmLoading"
      >
        <div v-if="footerMode === true" class="re-drawer__footer">
          <ElButton v-if="showCancel" @click="onCancel">{{ cancelText }}</ElButton>
          <ElButton v-if="showOk" type="primary" :loading="effectiveConfirmLoading" @click="onOk">
            {{ confirmText }}
          </ElButton>
        </div>
      </slot>
    </template>
  </ElDrawer>
</template>

<style scoped>
.re-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
