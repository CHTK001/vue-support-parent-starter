<script setup lang="ts">
/**
 * 主机画像弹窗（独立子组件）
 * 近全屏 ReDialog 承载 HostProfileView：左主机列表 + 右分区详情。
 * 显式 :model-value / @update:model-value 写法对齐 HostFormDialog。
 */
import HostProfileView from "./HostProfileView.vue";
import type { Host, Group } from "./AssetsView.vue";

defineOptions({ name: "HostProfileDialog", inheritAttrs: false });

const props = defineProps<{
  modelValue: boolean;
  hosts: Host[];
  groups: Group[];
  liveDelay: Record<number, number>;
  liveOnline: Record<number, number>;
  initialHostId: number | null;
  initialTab: string;
  openSeq: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "connect", h: Host): void;
  (e: "edit", h: Host): void;
  (e: "detail", h: Host): void;
  (e: "deploy-agent", h: Host): void;
  (e: "refreshed"): void;
}>();
</script>

<template>
  <ReDialog
    :model-value="props.modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    title="主机画像"
    width="94%"
    top="3vh"
    :footer-hidden="true"
    :close-on-click-modal="false"
  >
    <div class="profile-host">
      <HostProfileView
        :hosts="hosts"
        :groups="groups"
        :live-delay="liveDelay"
        :live-online="liveOnline"
        :initial-host-id="initialHostId"
        :initial-tab="initialTab"
        :open-seq="openSeq"
        @connect="(h) => emit('connect', h)"
        @edit="(h) => emit('edit', h)"
        @detail="(h) => emit('detail', h)"
        @deploy-agent="(h) => emit('deploy-agent', h)"
        @refreshed="emit('refreshed')"
      />
    </div>
  </ReDialog>
</template>

<style scoped lang="scss">
/* 固定高度，让内部 .profile height:100% 生效并自行滚动 */
.profile-host {
  height: calc(100vh - 165px);
  min-height: 420px;
}
.profile-host :deep(.profile) {
  height: 100%;
}
</style>
