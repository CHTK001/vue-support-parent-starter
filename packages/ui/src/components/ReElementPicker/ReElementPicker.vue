<!--
  元素拾取器：把目标页面呈现在左侧，像 F12 的 Elements 那样 hover 高亮、点击选中，
  生成短且唯一的 CSS 选择器与绝对路径 XPath，供抽取表达式直接使用。

  布局是左可视化、右 DevTools 风格页签（元素 / 选择器 / 原文，实时模式另有控制台）：
  左边点元素，右边实时出 XPath/CSS/DOM 路径与匹配数，确认后回填表达式。

  两种模式，打开弹窗时用 probeLive() 探测本地 sidecar（127.0.0.1:19097）：
  1) **实时（默认，探测成功）**：LiveView 真 Chromium + CDP screencast ——
     JS 执行、翻页、登录态、控制台俱全；失败或 sidecar 没起时 emit('fallback')
     自动回退静态模式，用户也可手动切换。
  2) **静态（兜底）**：后端把页面抓回来、前端渲染进 <iframe srcdoc> ——
     srcdoc 与父页同源，DOM 可访问。渲染前剥掉 <script> 与内联事件属性，
     配合 sandbox="allow-same-origin"（不给 allow-scripts）双保险。
     预览地址支持任意公网 URL（默认预填上游抓取节点的 URL，用户可在弹窗里改）。

  组件自身不直接发 HTTP：静态正文由 loader 注入，实时走 liveClient → sidecar，
  这样组件可单测、可复用在别的宿主里。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElTabPane,
  ElTabs,
} from "element-plus";
import { finder } from "@medv/finder";
import LiveView from "./LiveView.vue";
import { probeLive } from "./liveClient";

/** 抓取结果，形状与后端 CollectPreviewVO 对齐 */
export interface ElementPreviewPayload {
  /** HTTP 状态码 */
  status: number;
  /** 响应 Content-Type */
  contentType?: string | null;
  /** 正文原文 */
  html: string;
}

const props = withDefaults(
  defineProps<{
    /** 对话框显隐 */
    visible: boolean;
    /** 目标页面地址；可在弹窗里改 */
    url?: string;
    /** 当前解析器类型，决定默认推荐哪种选择器：CSS / XPATH */
    parserType?: string;
    /**
     * 取页面正文的加载器，由宿主注入（一般是调用后端 /designer/fetch-preview）。
     * 组件本身不直接发请求。
     */
    loader: (url: string) => Promise<ElementPreviewPayload>;
  }>(),
  {
    url: "",
    parserType: "CSS",
  },
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  /** 选中并确认后回传：表达式 + 建议的解析器类型 */
  (e: "pick", payload: { expression: string; parserType: string }): void;
}>();

/** 对话框内可编辑的地址，初值取 props.url；支持任意公网 URL */
const target = ref(props.url);
const loading = ref(false);
const error = ref("");
const frame = ref<HTMLIFrameElement | null>(null);
/** 右侧页签：element 元素 / selector 选择器 / source 原文 */
const activeTab = ref("element");
/** 预览模式：live 实时（真浏览器）/ static 静态（后端抓取 + srcdoc 兜底） */
const mode = ref<"live" | "static">("static");
/** sidecar 是否可用；打开弹窗时探测一次，成功默认实时 */
const liveAvailable = ref(false);
/** 探测中：期间不渲染静态 iframe，避免白闪一次抓取 */
const probing = ref(false);
/** 实时模式「打开」计数：自增触发 LiveView 导航 */
const navNonce = ref(0);
/** 已渲染的正文（剥过脚本） */
const srcdoc = ref("");
/** 抓取回来的原文（未剥脚本，仅展示与统计用） */
const rawHtml = ref("");
const rawStatus = ref(0);
const rawContentType = ref("");
/** 当前选中元素的摘要，给标题栏显示 */
const pickedSummary = ref("");
/** 选中元素的 DOM 路径（tag + id/class 摘要，自顶向下） */
const domPath = ref("");
/** 选中元素的 outerHTML 片段（截断展示） */
const pickedHtml = ref("");
/** 生成的两种选择器 */
const cssSelector = ref("");
const xpathSelector = ref("");
/** 两种选择器在当前文档里的匹配数 */
const cssMatchCount = ref(0);
const xpathMatchCount = ref(0);

const recommendXpath = computed(() => (props.parserType || "CSS").toUpperCase() === "XPATH");

watch(
  () => props.visible,
  (open) => {
    if (open) {
      target.value = props.url;
      activeTab.value = "element";
      navNonce.value = 0;
      error.value = "";
      resetPicked();
      // 打开弹窗先探测 sidecar：可用 → 默认实时（真浏览器）；不可用 → 静态兜底。
      // 探测有 600ms 超时上限，失败路径不抛异常（probeLive 内部吞掉）。
      probing.value = true;
      void probeLive()
        .then((ok) => {
          if (!props.visible) {
            return;
          }
          liveAvailable.value = ok;
          if (ok) {
            mode.value = "live";
          } else {
            mode.value = "static";
            // 静态模式仍然要抓一次：页面可能已经变了，缓存住反而让人以为看的是旧内容
            void load();
          }
        })
        .catch(() => {
          if (!props.visible) {
            return;
          }
          mode.value = "static";
          void load();
        })
        .finally(() => {
          probing.value = false;
        });
    } else {
      srcdoc.value = "";
      rawHtml.value = "";
      // 实时会话由 LiveView 自己监听 visible=false 销毁，这里只清静态态
      resetPicked();
    }
  },
);

/**
 * 手动切换预览模式。
 *
 * 静态 → 实时：LiveView 挂载时会用 target 建会话（其内部 watch visible/onMounted 触发）。
 * 实时 → 静态：LiveView 卸载自毁会话；静态侧若还没抓过正文则补抓一次。
 */
function switchMode(next: "live" | "static"): void {
  if (mode.value === next) {
    return;
  }
  mode.value = next;
  error.value = "";
  if (next === "static" && !srcdoc.value) {
    void load();
  }
}

/** 实时模式不可用（sidecar 挂了 / 浏览器起不来）：回退静态并提示 */
function onLiveFallback(message: string): void {
  liveAvailable.value = false;
  mode.value = "static";
  error.value = message;
  if (!srcdoc.value) {
    void load();
  }
}

/** 实时模式选中并确认：与静态路径同一出口 */
function onLivePick(payload: { expression: string; parserType: string }): void {
  emit("pick", payload);
  emit("update:visible", false);
}

/** 顶栏「打开」：实时模式触发导航，静态模式重新抓取 */
function openTarget(): void {
  if (mode.value === "live") {
    navNonce.value += 1;
    return;
  }
  void load();
}

/** 清空选中态 */
function resetPicked(): void {
  pickedSummary.value = "";
  domPath.value = "";
  pickedHtml.value = "";
  cssSelector.value = "";
  xpathSelector.value = "";
  cssMatchCount.value = 0;
  xpathMatchCount.value = 0;
}

/**
 * 去掉正文里的脚本与内联事件。
 *
 * 抓回来的是别人的页面，原样塞进同源 iframe 等于在我们的域里执行它的脚本；
 * sandbox 已不给 allow-scripts，这里是第二道防线。
 *
 * @param html 正文原文
 * @returns 可安全渲染的正文
 */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

/** 抓取并渲染 */
async function load(): Promise<void> {
  const url = target.value.trim();
  if (!url) {
    error.value = "请先填写要预览的地址";
    return;
  }
  loading.value = true;
  error.value = "";
  resetPicked();
  try {
    const payload = await props.loader(url);
    rawHtml.value = payload.html ?? "";
    rawStatus.value = payload.status ?? 0;
    rawContentType.value = payload.contentType ?? "";
    srcdoc.value = sanitize(rawHtml.value);
    if (!srcdoc.value) {
      error.value = `抓取成功但正文为空（HTTP ${payload.status}）`;
      return;
    }
    // srcdoc 赋值后 iframe 异步解析，选中态等 @load 里 bindFrame 后再由用户点击产生
    await nextTick();
    // 绑定交给 iframe 的 @load（srcdoc 是异步解析的，这里绑会绑到空白文档）
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

/**
 * 给 iframe 里的文档挂上高亮与选中。
 *
 * srcdoc 与父页同源，所以能直接拿 contentDocument；sandbox 不给 allow-scripts，
 * 所以页面自己的脚本不会干扰我们挂的监听。
 */
function bindFrame(): void {
  const doc = frame.value?.contentDocument;
  if (!doc) {
    error.value = "无法读取预览文档（iframe 未就绪或跨域被拦）";
    return;
  }
  // iframe 的 srcdoc 是异步解析的，而且会先有一次 about:blank 的 load ——
  // 必须在**每次 load 时**重新绑定，并且用标记防重复绑定（否则每个元素会被挂多次监听）。
  // 早先版本在 nextTick 后直接 bind，绑到的是随后被替换掉的空白文档，表现为
  // 「iframe 里能看到页面、点元素却没有任何反应」（实测踩过）。
  if (doc.documentElement?.dataset.rePickerBound === "1") {
    return;
  }
  if (!doc.body) {
    return;
  }
  if (doc.documentElement) {
    doc.documentElement.dataset.rePickerBound = "1";
  }
  // 用一段样式做高亮，不去改元素自身的 style —— 免得把页面原本的样式改坏
  const style = doc.createElement("style");
  style.textContent =
    ".re-picker-hover{outline:2px solid #4f7cff !important;outline-offset:-2px;cursor:crosshair;}" +
    ".re-picker-picked{outline:2px dashed #00b96b !important;outline-offset:-2px;}";
  doc.head?.appendChild(style);

  let hovered: Element | null = null;
  let picked: Element | null = null;

  doc.addEventListener("mouseover", (ev) => {
    const el = ev.target as Element | null;
    if (!el || el === hovered) {
      return;
    }
    hovered?.classList.remove("re-picker-hover");
    hovered = el;
    hovered.classList.add("re-picker-hover");
  });
  doc.addEventListener("mouseout", () => {
    hovered?.classList.remove("re-picker-hover");
    hovered = null;
  });
  // 单击选中：preventDefault 拦住页面自己的跳转/提交
  doc.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const el = ev.target as Element | null;
    if (!el) {
      return;
    }
    picked?.classList.remove("re-picker-picked");
    picked = el;
    picked.classList.add("re-picker-picked");
    applyPicked(el);
  }, true);
  // 右键也当选中，符合「右键直接选择」的习惯
  doc.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    const el = ev.target as Element | null;
    if (!el) {
      return;
    }
    picked?.classList.remove("re-picker-picked");
    picked = el;
    picked.classList.add("re-picker-picked");
    applyPicked(el);
  }, true);
}

/** 把选中元素换算成两种选择器并展示，同时算出 DOM 路径、HTML 片段与匹配数 */
function applyPicked(el: Element): void {
  const tag = el.tagName.toLowerCase();
  const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
  const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
  pickedSummary.value = `<${tag}>${cls ? " ." + cls : ""}${text ? "  “" + text + "”" : ""}`;
  domPath.value = domPathOf(el);
  pickedHtml.value = (el.outerHTML || "").replace(/\s+/g, " ").trim().slice(0, 500);
  try {
    // @medv/finder 的默认 root 是「当前 window 的 document.body」（finder.js 的 defaults）。
    // 选中元素在预览 iframe 里，向上遍历永远到不了外层 body，查找只会走到
    // "Selector was not found." 抛异常，然后被下面的 catch 吞成空 —— CSS 恒显示「—」。
    // 所以必须把 root 显式指向元素自己所属的文档。
    const doc = el.ownerDocument;
    const root = doc?.body ?? doc?.documentElement ?? null;
    cssSelector.value = root ? finder(el as HTMLElement, { root }) : "";
  } catch {
    cssSelector.value = "";
  }
  xpathSelector.value = xpathOf(el);
  cssMatchCount.value = countCss(el);
  xpathMatchCount.value = countXpath(el);
  // 选中后自动切到选择器页签：用户最关心的是表达式能不能用
  activeTab.value = "selector";
}

/**
 * 自顶向下的 DOM 路径（tag + id/class 摘要），给右侧元素页签展示。
 *
 * 与 xpathOf 的绝对路径不同：这里不带下标、只带可读标识，方便人一眼定位。
 *
 * @param el 目标元素
 * @returns 形如 html > body > div#main > ul.list > li 的路径
 */
function domPathOf(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1) {
    const tag = current.tagName.toLowerCase();
    const id = current.getAttribute("id");
    const cls = (current.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 2).join(".");
    parts.unshift(id ? `${tag}#${id}` : cls ? `${tag}.${cls}` : tag);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

/**
 * CSS 选择器在当前预览文档里的匹配数。
 *
 * @param el 选中元素（只用它所属的文档做计数）
 * @returns 匹配到的元素个数；选择器为空或非法时返回 0
 */
function countCss(el: Element): number {
  if (!cssSelector.value) {
    return 0;
  }
  try {
    return el.ownerDocument?.querySelectorAll(cssSelector.value).length ?? 0;
  } catch {
    return 0;
  }
}

/**
 * XPath 在当前预览文档里的匹配数（document.evaluate 数 snapshotLength）。
 *
 * @param el 选中元素（只用它所属的文档做计数）
 * @returns 匹配到的节点个数；表达式为空或非法时返回 0
 */
function countXpath(el: Element): number {
  if (!xpathSelector.value) {
    return 0;
  }
  try {
    const doc = el.ownerDocument;
    if (!doc) {
      return 0;
    }
    const result = doc.evaluate(
      xpathSelector.value,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    return result.snapshotLength;
  } catch {
    return 0;
  }
}

/**
 * 元素的绝对路径 XPath。
 *
 * 只出绝对路径（同级同名元素按下标区分）：它在后端刚修好的
 * {@code namespaceAware(false)} 求值器上稳定可跑，不会因为属性值变化而失配。
 * 代价是页面结构一变就失效 —— 需要更稳的写法时由用户自己改成 //tag[@attr='x']。
 *
 * @param el 目标元素
 * @returns 形如 /html[1]/body[1]/div[1]/a[1] 的绝对路径
 */
function xpathOf(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1) {
    const tag = current.tagName.toLowerCase();
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index += 1;
      }
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${tag}[${index}]`);
    current = current.parentElement;
  }
  return `/${parts.join("/")}`;
}

/** 用某种解析器插入 */
function insert(parserType: string, expression: string): void {
  if (!expression) {
    ElMessage.warning("还没有选中元素");
    return;
  }
  emit("pick", { expression, parserType });
  emit("update:visible", false);
}

/**
 * 复制到剪贴板；失败静默降级（不影响插入）。
 *
 * @param text 待复制文本
 */
async function copy(text: string): Promise<void> {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败，请手动选中");
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    title="选取页面元素"
    width="1400px"
    top="4vh"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="picker-bar">
      <ElRadioGroup
        :model-value="mode"
        size="small"
        @update:model-value="(v: any) => switchMode(v as 'live' | 'static')"
      >
        <ElRadioButton value="live">实时浏览器</ElRadioButton>
        <ElRadioButton value="static">静态渲染</ElRadioButton>
      </ElRadioGroup>
      <ElInput
        v-model="target"
        placeholder="要预览的页面地址（预填上游抓取节点的 URL，可改成任意公网地址）"
        clearable
        @keyup.enter="openTarget"
      />
      <ElButton type="primary" :loading="loading || probing" @click="openTarget">
        {{ mode === "live" ? "打开" : "抓取并渲染" }}
      </ElButton>
      <span v-if="!liveAvailable && !probing && mode === 'static'" class="picker-badge">
        静态兜底（实时服务未启动）
      </span>
    </div>

    <div v-if="error" class="picker-error">{{ error }}</div>

    <!-- 实时：真 Chromium screencast + DevTools 页签；探测成功默认走这条 -->
    <LiveView
      v-if="mode === 'live'"
      :visible="visible"
      :url="target"
      :parser-type="parserType"
      :nav-nonce="navNonce"
      @pick="onLivePick"
      @fallback="onLiveFallback"
    />

    <!-- 静态：后端抓取 + 同源 srcdoc，sidecar 不可用时的兜底路径 -->
    <div v-else class="picker-main">
      <div class="picker-left">
        <iframe
          ref="frame"
          class="picker-frame"
          sandbox="allow-same-origin"
          :srcdoc="srcdoc"
          @load="bindFrame"
        />
      </div>

      <div class="picker-right">
        <ElTabs v-model="activeTab" class="picker-tabs">
          <ElTabPane label="元素" name="element">
            <div class="picker-picked">
              <span class="picker-label">已选元素</span>
              <span v-if="pickedSummary" class="picker-summary">{{ pickedSummary }}</span>
              <span v-else class="picker-empty">在左侧预览里点一下元素（或右键）</span>
            </div>
            <div v-if="domPath" class="picker-kv">
              <span class="picker-label">DOM 路径</span>
              <code class="picker-code">{{ domPath }}</code>
            </div>
            <div v-if="pickedHtml" class="picker-kv">
              <span class="picker-label">HTML 片段</span>
              <code class="picker-code picker-multiline">{{ pickedHtml }}</code>
            </div>
            <div v-if="rawContentType || rawStatus" class="picker-meta">
              抓取：HTTP {{ rawStatus || "—" }} · {{ rawContentType || "未知类型" }} · 原文 {{ (rawHtml || "").length }} 字符
            </div>
          </ElTabPane>

          <ElTabPane label="选择器" name="selector">
            <div class="picker-row">
              <span class="picker-label">CSS</span>
              <code class="picker-code">{{ cssSelector || "—" }}</code>
              <span class="picker-count">{{ cssSelector ? `${cssMatchCount} 个匹配` : "" }}</span>
            </div>
            <div class="picker-row picker-actions">
              <ElButton
                :type="recommendXpath ? 'default' : 'primary'"
                :disabled="!cssSelector"
                @click="insert('CSS', cssSelector)"
              >
                用 CSS 插入
              </ElButton>
              <ElButton text :disabled="!cssSelector" @click="copy(cssSelector)">复制</ElButton>
            </div>
            <div class="picker-row">
              <span class="picker-label">XPath</span>
              <code class="picker-code">{{ xpathSelector || "—" }}</code>
              <span class="picker-count">{{ xpathSelector ? `${xpathMatchCount} 个匹配` : "" }}</span>
            </div>
            <div class="picker-row picker-actions">
              <ElButton
                :type="recommendXpath ? 'primary' : 'default'"
                :disabled="!xpathSelector"
                @click="insert('XPATH', xpathSelector)"
              >
                用 XPath 插入
              </ElButton>
              <ElButton text :disabled="!xpathSelector" @click="copy(xpathSelector)">复制</ElButton>
            </div>
            <div class="picker-tip">XPath 属性请写在表达式里，如 //a/@href；右侧取值方式对它无效。</div>
          </ElTabPane>

          <ElTabPane label="原文" name="source">
            <pre class="picker-source">{{ (rawHtml || "").slice(0, 20000) }}</pre>
            <div v-if="(rawHtml || '').length > 20000" class="picker-tip">
              原文过长，仅显示前 20000 字符（共 {{ (rawHtml || "").length }} 字符）。
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.picker-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.picker-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}

/* 静态兜底提示徽标（sidecar 未启动时出现在顶栏右侧） */
.picker-badge {
  flex: none;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 10px;
}

.picker-body {
  height: 460px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

/* 左可视化、右面板：左 3 右 2，窄屏自动上下叠 */
.picker-main {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 10px;
  margin-top: 10px;
}

.picker-left {
  height: 520px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.picker-right {
  min-width: 0;
  height: 520px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.picker-tabs {
  padding: 0 10px 10px;
}

.picker-kv {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 8px;
  font-size: 12px;
}

.picker-meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.picker-count {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.picker-actions {
  justify-content: flex-end;
}

.picker-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.picker-source {
  max-height: 440px;
  padding: 8px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.picker-multiline {
  max-height: 120px;
  overflow: auto;
  text-overflow: clip;
  white-space: normal;
  word-break: break-all;
}

@media (max-width: 900px) {
  .picker-main {
    grid-template-columns: 1fr;
  }

  .picker-left,
  .picker-right {
    height: 380px;
  }
}

.picker-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.picker-picked {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-top: 10px;
  font-size: 12px;
}

.picker-label {
  flex: none;
  width: 62px;
  color: var(--el-text-color-secondary);
}

.picker-summary {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.picker-empty {
  color: var(--el-text-color-placeholder);
}

.picker-result {
  margin-top: 8px;
}

.picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
}

.picker-code {
  flex: 1;
  padding: 4px 8px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
