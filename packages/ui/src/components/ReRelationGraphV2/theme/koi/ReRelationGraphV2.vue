<script setup lang="ts">
/**
 * ReRelationGraphV2 · koi 主题
 *
 * <p>与 default 同核，仅主题类名不同；同样转发核心实例的 expose。</p>
 */
import { ref } from "vue";
import G6GraphV2 from "../../internals/G6GraphV2.vue";

defineOptions({ name: "ReRelationGraphV2", inheritAttrs: false });

const core = ref<{
  graph: unknown;
  layout: string;
  layoutOptions: Record<string, unknown>;
  groupType: string;
  groupVisible: boolean;
  setLayout: (type: string, options?: Record<string, unknown>) => void;
  setGroupType: (type: string) => void;
  setGroupVisible: (visible: boolean) => void;
  fitView: () => void;
  focus: (id: string | string[]) => Promise<unknown>;
} | null>(null);

defineExpose({
  /** 底层 G6 Graph 实例句柄（转发自核心） */
  get graph() {
    return core.value?.graph ?? null;
  },
  /** 当前布局名（转发自核心） */
  get layout() {
    return core.value?.layout ?? "group";
  },
  /** 当前布局参数（转发自核心） */
  get layoutOptions() {
    return core.value?.layoutOptions ?? {};
  },
  /** 当前分组轮廓类型（转发自核心） */
  get groupType() {
    return core.value?.groupType ?? "bubble";
  },
  /** 当前分组轮廓显隐（转发自核心） */
  get groupVisible() {
    return core.value?.groupVisible ?? true;
  },
  /** 命令式切换布局（转发自核心） */
  setLayout(type: string, options?: Record<string, unknown>) {
    return core.value?.setLayout(type, options);
  },
  /** 命令式切换分组轮廓类型（转发自核心） */
  setGroupType(type: string) {
    return core.value?.setGroupType(type);
  },
  /** 命令式显示 / 隐藏分组轮廓（转发自核心） */
  setGroupVisible(visible: boolean) {
    return core.value?.setGroupVisible(visible);
  },
  /** 适应画布（转发自核心） */
  fitView() {
    return core.value?.fitView();
  },
  /** 聚焦节点（转发自核心） */
  focus(id: string | string[]) {
    return core.value?.focus(id);
  },
});
</script>

<template>
  <G6GraphV2 ref="core" v-bind="$attrs" class="rrgv2-theme-koi">
    <!-- 槽位透传：业务用 <template #toolbar-extra> 往内置工具栏塞自定义按钮 -->
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </G6GraphV2>
</template>
