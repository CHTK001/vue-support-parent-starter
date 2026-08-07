<script setup lang="ts">
/**
 * 系统调试设置组件
 *
 * 集成 eruda（移动端调试控制台）：
 *   动态加载 eruda CDN 脚本，初始化后可查看 Console / Elements / Network / Resources 等面板。
 *   设置项实时写入 appConfig.other.devTools.debugEruda，由 config.ts 的 watch 自动持久化。
 */
import { computed, watch } from "vue";
import { getConfig } from "@repo/config";
import type { DevToolsConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { Tools } from "@element-plus/icons-vue";

const appConfig = getConfig();
const devTools = computed(() => appConfig.other.devTools as DevToolsConfig);

/** 环境判断 */
const isDevOrTest = computed(() => {
  const env = appConfig.env?.env ?? "dev";
  return env === "dev" || env === "test";
});

let erudaLoaded = false;

function loadEruda() {
  if (erudaLoaded) return;
  erudaLoaded = true;
  const script = document.createElement("script");
  script.src = "//cdn.jsdelivr.net/npm/eruda";
  script.onload = () => {
    (window as any).eruda?.init();
  };
  document.body.appendChild(script);
}

function destroyEruda() {
  try {
    (window as any).eruda?.destroy();
  } catch { /* ignore */ }
  erudaLoaded = false;
}

watch(
  () => devTools.value.debugEruda,
  (val) => (val ? loadEruda() : destroyEruda()),
  { immediate: true },
);
</script>

<template>
  <div v-if="isDevOrTest && devTools.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Tools /></el-icon>
      <span class="section-title">系统调试</span>
      <span class="section-badge">DEV</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        title="Eruda 控制台"
        sub="移动端调试器"
        tip="集成 eruda，提供 Console / Elements / Network / Resources 等调试面板"
        description="动态加载 CDN 脚本，关闭后自动销毁"
        v-model="devTools.debugEruda"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-badge {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
}

.section-card {
  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}
</style>