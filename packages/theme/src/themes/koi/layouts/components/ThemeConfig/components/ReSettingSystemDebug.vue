<script setup lang="ts">
/**
 * 系统调试设置组件
 *
 * 集成 eruda（移动端调试控制台）：
 *   动态加载 eruda CDN 脚本，初始化后注入项目统一风格的自定义 CSS，
 *   并按需注册常用插件（Console / Network / Element / Resources / Info / Sources / Snippets）。
 *   设置项实时写入 appConfig.other.devTools.debugEruda，由 config.ts 的 watch 自动持久化。
 *
 * 两个容易踩的坑（都曾导致「打开开关但控制台不出现 / 出现了没样式」）：
 *   1. `useShadowDom` 必须为 false。eruda 默认把面板放进影子根，而影子根是样式边界，
 *      document 级的 eruda.css 一条都进不去，面板就退回原生浅色外观；
 *      同时宿主 `#eruda` 会被写上行内 `all: initial`，外部样式同样被重置。
 *   2. eruda.css 必须按 3.4.1 的真实类名写（`.eruda-entry-btn` / `.eruda-dev-tools` /
 *      `.eruda-tab.luna-tab` …）。2.x 的 `.eruda-panel` / `.eruda-tab-bar` 在 3.4.1
 *      里已经不存在，写错不报错，只是静默不生效。
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

/**
 * 初始化 eruda 并挂上主题样式。
 *
 * <p>注意 `useShadowDom: false`：面板必须留在 document 里，eruda.css 才能生效；
 * 影子根是样式边界，开着它等于放弃主题（见文件头注释）。</p>
 */
function startEruda() {
  const eruda = (window as any).eruda;
  if (!eruda) return;
  // 已初始化过（热更新 / 开关来回切）时 init 会重复建宿主，先销毁再起
  try {
    eruda.destroy();
  } catch {
    /* ignore */
  }
  try {
    eruda.init({
      container: document.body,
      useShadowDom: false,
    });
  } catch (err) {
    console.warn("[eruda] init 失败", err);
    return;
  }
  injectErudaStyles();
}

function loadEruda() {
  if (erudaScriptEl) return;
  const existing = findExistingErudaScript();
  if (existing) {
    erudaScriptEl = existing;
    if ((window as any).eruda) {
      startEruda();
    } else {
      // 脚本已插入但还没执行完，等它加载完成再 init，避免「开关打开却永远不出现」
      existing.addEventListener("load", startEruda, { once: true });
    }
    return;
  }
  const script = document.createElement("script");
  script.src = ERUDA_CDN;
  script.onload = startEruda;
  script.onerror = () => console.warn("[eruda] CDN 脚本加载失败:", ERUDA_CDN);
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