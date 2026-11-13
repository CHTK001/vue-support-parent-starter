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
 *
 * <p><b>不要把 document.body 当 container</b>：eruda 的 `_initContainer` 会
 * 给 container 写行内 `all: initial` 和 `id="eruda"`。body 被重置后整页样式崩掉，
 * 设置抽屉直接白屏 —— 这是「开关一拨就白」的根因。这里自建一个宿主节点，
 * 由 eruda 只重置这个空 div。</p>
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
  const host = document.createElement("div");
  host.id = "eruda";
  document.documentElement.appendChild(host);
  try {
    eruda.init({
      container: host,
      useShadowDom: false,
    });
  } catch (err) {
    host.remove();
    console.warn("[eruda] init 失败", err);
    return;
  }
  bindEntryButton();
  injectErudaStyles();
}

/**
 * 入口按钮加固：显式 type=button，并阻止点击冒泡到 document。
 *
 * <p>eruda 的入口按钮是动态插到宿主里的，冒泡会被页面上的全局点击监听（关抽屉、
 * 路由刷新等）接住，表现为「点一下控制台整页刷新」。这里只在捕获阶段截断冒泡，
 * 不影响按钮自身的展开/收起。</p>
 */
function bindEntryButton() {
  const btn = document.querySelector<HTMLElement>(".eruda-entry-btn");
  if (!btn) return;
  if (btn instanceof HTMLButtonElement) {
    btn.type = "button";
  }
  if ((btn as HTMLElement & { __koiBound?: boolean }).__koiBound) return;
  (btn as HTMLElement & { __koiBound?: boolean }).__koiBound = true;
  const stop = (event: Event) => event.stopPropagation();
  btn.addEventListener("pointerdown", stop, true);
  btn.addEventListener("click", stop, true);
  btn.addEventListener("keydown", stop, true);
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
  // destroy 正常会带走宿主；初始化失败 / 半初始化时兜底清掉，避免残留空节点
  document.getElementById("eruda")?.remove();
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