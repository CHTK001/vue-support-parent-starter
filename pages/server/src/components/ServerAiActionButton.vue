<template>
  <el-tooltip :content="resolvedTooltip" :placement="placement">
    <ScButton
      :circle="circle"
      :plain="plain"
      :size="size"
      :type="type"
      :disabled="disabled"
      :loading="loading"
      @click="handleClick"
    >
      <slot>
        <IconifyIconOnline :icon="icon" />
      </slot>
    </ScButton>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScButton from "@repo/components/ScButton/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { useAiSupport } from "@layout/default";

export interface ServerAiActionPayload {
  scene?: string;
  systemPrompt?: string;
  prompt?: string;
  supportSource?: string;
  backendUrl?: string;
}

const props = withDefaults(
  defineProps<{
    icon?: string;
    tooltip?: string;
    disabledTooltip?: string;
    placement?:
      | "top"
      | "top-start"
      | "top-end"
      | "bottom"
      | "bottom-start"
      | "bottom-end"
      | "left"
      | "left-start"
      | "left-end"
      | "right"
      | "right-start"
      | "right-end";
    type?: string;
    size?: "small" | "default" | "large";
    circle?: boolean;
    plain?: boolean;
    disabled?: boolean;
    loading?: boolean;
    stopPropagation?: boolean;
    scene?: string;
    systemPrompt?: string;
    prompt?: string;
    method?: (payload: ServerAiActionPayload) => unknown;
    action?: (payload: ServerAiActionPayload) => unknown;
  }>(),
  {
    icon: "ri:ai-generate-2",
    tooltip: "AI 分析",
    disabledTooltip: "",
    placement: "top",
    type: undefined,
    size: "default",
    circle: true,
    plain: true,
    disabled: false,
    loading: false,
    stopPropagation: true,
    scene: "",
    systemPrompt: "",
    prompt: "",
    method: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  trigger: [payload: ServerAiActionPayload];
}>();

const resolvedTooltip = computed(() =>
  props.disabled && props.disabledTooltip ? props.disabledTooltip : props.tooltip,
);
const aiSupport = useAiSupport();

const createPayload = (): ServerAiActionPayload => ({
  scene: props.scene || undefined,
  systemPrompt: props.systemPrompt || undefined,
  prompt: props.prompt || undefined,
});

const handleClick = async (event: MouseEvent) => {
  if (props.stopPropagation) {
    event.stopPropagation();
  }
  if (props.disabled) {
    return;
  }
  const payload = createPayload();
  const runner = props.method || props.action;
  if (runner) {
    emit("trigger", payload);
    runner(payload);
    return;
  }

  const support = await aiSupport.resolveAvailability();
  const resolvedPayload = {
    ...payload,
    supportSource: support.source,
    backendUrl: support.backendUrl,
  };

  if (support.available) {
    aiSupport.updateBrowserSupport(true);
    emit("trigger", resolvedPayload);
    message(
      support.source === "backend"
        ? `已检测到服务器 AI：${support.backendUrl || "默认后端"}`
        : "已检测到可用 AI 能力",
      { type: "success" },
    );
    return;
  }

  aiSupport.updateBrowserSupport(false);
  message(support.reason || "未检测到可用 AI 能力，请先设置 AI 服务器", {
    type: "warning",
  });
  aiSupport.openSettings();
};
</script>
