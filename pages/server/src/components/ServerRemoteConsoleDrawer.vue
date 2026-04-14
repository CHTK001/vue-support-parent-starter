<template>
  <ScDrawer
    v-model="visible"
    size="min(84vw, 1280px)"
    destroy-on-close
    append-to-body="true"
    class="server-remote-console"
    :class="{ 'is-fullscreen': fullscreen }"
    :title="hostName ? `${hostName} · 远程控制` : '远程控制'"
    @closed="handleClosed"
  >
    <div ref="containerRef" class="server-remote-console__body">
      <div class="server-remote-console__toolbar">
        <div class="server-remote-console__meta">
          <div class="server-chip-group">
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ config?.provider || "remote" }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ config?.protocol || "auto" }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ config?.connectionId || "-" }}
            </el-tag>
          </div>
          <p class="server-remote-console__hint">
            {{
              launchUrl
                ? "右侧面板已加载远程入口，可直接全屏或新标签打开"
                : config?.message || "当前远程入口未返回可用地址"
            }}
          </p>
        </div>
        <div class="server-action-row">
          <el-tooltip v-if="launchUrl" content="新标签页打开远程控制">
            <el-button circle @click="openInNewTab">
              <IconifyIconOnline icon="ri:external-link-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="fullscreen ? '退出全屏' : '远程控制全屏'">
            <el-button circle @click="toggleFullscreen">
              <IconifyIconOnline
                :icon="
                  fullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'
                "
              />
            </el-button>
          </el-tooltip>
          <el-tooltip content="关闭远程面板">
            <el-button circle @click="visible = false">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div v-loading="loading" class="server-remote-console__stage">
        <iframe
          v-if="launchUrl"
          class="server-remote-console__frame"
          :src="launchUrl"
          allowfullscreen
          @load="$emit('update:loading', false)"
          @error="$emit('update:loading', false)"
        />
        <el-empty
          v-else
          :description="config?.message || '当前远程入口未返回可用地址'"
        />
      </div>
    </div>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { message } from "@repo/utils";
import type { ServerRemoteConsoleConfig } from "../api";

const props = defineProps<{
  modelValue: boolean;
  hostName: string;
  config: ServerRemoteConsoleConfig | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:loading", value: boolean): void;
  (event: "closed"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const containerRef = ref<HTMLElement | null>(null);
const fullscreen = ref(false);

const launchUrl = computed(() => props.config?.launchUrl || "");

const syncFullscreenState = () => {
  const container = containerRef.value;
  fullscreen.value = Boolean(container && document.fullscreenElement === container);
};

const toggleFullscreen = async () => {
  const container = containerRef.value;
  if (!container) {
    return;
  }
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await container.requestFullscreen();
  } catch (error) {
    console.error(error);
    message("当前环境不支持远程全屏", { type: "warning" });
  }
};

const openInNewTab = () => {
  if (!launchUrl.value) {
    return;
  }
  const popup = window.open(launchUrl.value, "_blank", "noopener,noreferrer");
  if (!popup) {
    message("浏览器拦截了新标签页，请允许弹窗后重试", {
      type: "warning",
    });
  }
};

const handleClosed = async () => {
  if (document.fullscreenElement === containerRef.value) {
    await document.exitFullscreen().catch(() => undefined);
  }
  fullscreen.value = false;
  emit("closed");
};

onMounted(() => {
  document.addEventListener("fullscreenchange", syncFullscreenState);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", syncFullscreenState);
});
</script>

<style scoped lang="scss">
.server-remote-console__body,
.server-remote-console__toolbar {
  display: flex;
  flex-direction: column;
}

.server-remote-console__body {
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.server-remote-console__meta {
  display: grid;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.server-remote-console__toolbar {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 18px 30px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-remote-console__hint {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.server-remote-console__stage {
  min-height: 0;
  flex: 1;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.12), transparent 26%),
    rgba(2, 6, 23, 0.94);
  box-shadow:
    0 22px 42px rgba(2, 6, 23, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.server-remote-console__frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 170px);
  border: none;
  background: #020617;
}

:deep(.server-remote-console.is-fullscreen .el-drawer__body) {
  padding-top: 10px;
}

.server-remote-console.is-fullscreen .server-remote-console__stage {
  border-color: rgba(96, 165, 250, 0.35);
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.16);
}

.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}
</style>
