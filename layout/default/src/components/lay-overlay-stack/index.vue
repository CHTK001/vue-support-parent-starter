<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import ScOverlayStack from "../../../../../packages/components/ScOverlayStack/index.vue";
import { removeOverlayStackItem, useOverlayStackState } from "./service";
import type {
  OverlayStackClosePayload,
  ResolvedOverlayStackItem,
} from "./types";
import {
  disposeStandaloneOverlayHost,
  updateOverlayStackHostCount,
} from "../../runtime/standaloneOverlayHostRegistry";

defineOptions({
  name: "LayOverlayStackHost",
});

const props = withDefaults(
  defineProps<{
    standalone?: boolean;
  }>(),
  {
    standalone: false,
  },
);

const { state } = useOverlayStackState();

const handleOpen = (item: ResolvedOverlayStackItem) => {
  const target = state.items.find((entry) => entry.id === item.id);
  target?.onOpen?.(item);
};

const handleClose = (payload: OverlayStackClosePayload) => {
  const target = state.items.find((entry) => entry.id === payload.item.id);
  target?.onClose?.(payload);
  removeOverlayStackItem(payload.item.id);
};

const handleToggleDetails = (payload: {
  item: ResolvedOverlayStackItem;
  collapsed: boolean;
}) => {
  const target = state.items.find((entry) => entry.id === payload.item.id);
  target?.onToggleDetails?.(payload);
};

const handleMinimize = (item: ResolvedOverlayStackItem) => {
  const target = state.items.find((entry) => entry.id === item.id);
  target?.onMinimize?.(item);
};

onMounted(() => {
  updateOverlayStackHostCount(1);
  if (!props.standalone) {
    disposeStandaloneOverlayHost();
  }
});

onUnmounted(() => {
  updateOverlayStackHostCount(-1);
});
</script>

<template>
  <ScOverlayStack
    :items="state.items"
    :default-position="state.config.defaultPosition"
    :max-visible="state.config.maxVisible"
    :width="state.config.width"
    :stacked="state.config.stacked"
    :stack-expanded="state.config.stackExpanded"
    :expand-on-hover="state.config.expandOnHover"
    :details-collapsible="state.config.detailsCollapsible"
    :details-collapsed="state.config.detailsCollapsed"
    :closeable="state.config.closeable"
    :auto-close="state.config.autoClose"
    :auto-close-delay="state.config.autoCloseDelay"
    :message-limit="state.config.messageLimit"
    :teleport-to="state.config.teleportTo"
    :z-index="state.config.zIndex"
    @close="handleClose"
    @minimize="handleMinimize"
    @open="handleOpen"
    @toggle-details="handleToggleDetails"
  />
</template>
