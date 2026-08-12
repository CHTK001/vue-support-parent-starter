<script setup lang="ts">
/**
 * 系统调试设置组件
 *
 * 集成 eruda（移动端调试控制台）：
 *   动态加载 eruda CDN 脚本，初始化后注入项目统一风格的自定义 CSS，
 *   并按需注册常用插件（Console / Network / Element / Resources / Info / Sources / Snippets）。
 *   设置项实时写入 appConfig.other.devTools.debugEruda，由 config.ts 的 watch 自动持久化。
 */
import { computed, onBeforeUnmount, watch } from "vue";
import { getConfig } from "@repo/config";
import type { DevToolsConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { Tools } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import erudaStyles from "./eruda.css?inline";

const { t } = useI18n();

const appConfig = getConfig();
const devTools = computed(() => appConfig.other.devTools as DevToolsConfig);

/** 环境判断 */
const isDevOrTest = computed(() => {
  const env = appConfig.env?.env ?? "dev";
  return env === "dev" || env === "test";
});

const ERUDA_CDN = "//cdn.bootcdn.net/ajax/libs/eruda/3.4.1/eruda.min.js";

let erudaStyleEl: HTMLStyleElement | null = null;
let erudaScriptEl: HTMLScriptElement | null = null;

/** 注入 eruda 美化样式 */
function injectErudaStyles() {
  if (erudaStyleEl) return;
  const style = document.createElement("style");
  style.setAttribute("data-eruda-theme", "koi");
  style.textContent = erudaStyles;
  document.head.appendChild(style);
  erudaStyleEl = style;
}

/** 移除 eruda 美化样式 */
function removeErudaStyles() {
  erudaStyleEl?.remove();
  erudaStyleEl = null;
}

/** 查找页面上已有的 eruda script 标签 */
function findExistingErudaScript() {
  return document.querySelector<HTMLScriptElement>(`script[src="${ERUDA_CDN}"]`);
}

function loadEruda() {
  if (erudaScriptEl) return;
  const existing = findExistingErudaScript();
  if (existing) {
    erudaScriptEl = existing;
    if ((window as any).eruda) {
      (window as any).eruda.init();
      injectErudaStyles();
    }
    return;
  }
  const script = document.createElement("script");
  script.src = ERUDA_CDN;
  script.onload = () => {
    const eruda = (window as any).eruda;
    if (!eruda) return;
    eruda.init({
      container: document.body,
      useShadowDom: true,
    });
    injectErudaStyles();
  };
  document.body.appendChild(script);
  erudaScriptEl = script;
}

function destroyEruda() {
  try {
    (window as any).eruda?.destroy();
  } catch {
    /* ignore */
  }
  removeErudaStyles();
  if (erudaScriptEl && erudaScriptEl.parentNode) {
    erudaScriptEl.parentNode.removeChild(erudaScriptEl);
  }
  erudaScriptEl = null;
}

watch(
  () => devTools.value.debugEruda,
  (val) => (val ? loadEruda() : destroyEruda()),
  { immediate: true },
);

onBeforeUnmount(() => {
  removeErudaStyles();
});
</script>

<template>
  <div v-if="isDevOrTest && devTools.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Tools /></el-icon>
      <span class="section-title">{{ t("systemDebug.title") }}</span>
      <span class="section-badge">DEV</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        :title="t('systemDebug.eruda.title')"
        :sub="t('systemDebug.eruda.sub')"
        :tip="t('systemDebug.eruda.tip')"
        :description="t('systemDebug.eruda.description')"
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