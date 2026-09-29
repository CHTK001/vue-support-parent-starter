<!--
  元素拾取器：把目标页面渲染在 iframe 里，像 F12 的 Elements 那样 hover 高亮、点击选中，
  然后用 @medv/finder 生成短且唯一的 CSS 选择器、用绝对路径生成 XPath，供抽取表达式直接使用。

  设计取舍：
  1) **不用 iframe 指向目标站**：跨域 iframe 的 contentDocument 拿不到，高亮与取值全都做不了。
     改成后端把页面抓回来、前端渲染进 <iframe srcdoc> —— srcdoc 与父页同源，DOM 可访问。
  2) **渲染前剥掉 <script> 与内联事件属性**：抓回来的是别人的页面，直接执行等于在我们域里跑它的脚本。
     再配合 sandbox="allow-same-origin"（不给 allow-scripts）双保险。
  3) **本组件不发 HTTP**：页面正文由 loader 注入，这样组件可单测、可复用在别的宿主里。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElButton, ElDialog, ElInput, ElMessage } from "element-plus";
import { finder } from "@medv/finder";

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

/** 对话框内可编辑的地址，初值取 props.url */
const target = ref(props.url);
const loading = ref(false);
const error = ref("");
const frame = ref<HTMLIFrameElement | null>(null);
/** 已渲染的正文（剥过脚本） */
const srcdoc = ref("");
/** 当前选中元素的摘要，给标题栏显示 */
const pickedSummary = ref("");
/** 生成的两种选择器 */
const cssSelector = ref("");
const xpathSelector = ref("");

const recommendXpath = computed(() => (props.parserType || "CSS").toUpperCase() === "XPATH");

watch(
  () => props.visible,
  (open) => {
    if (open) {
      target.value = props.url;
      // 每次打开都重抓：页面可能已经变了，缓存住反而让人以为看的是旧内容
      void load();
    } else {
      srcdoc.value = "";
      resetPicked();
    }
  },
);

/** 清空选中态 */
function resetPicked(): void {
  pickedSummary.value = "";
  cssSelector.value = "";
  xpathSelector.value = "";
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
    srcdoc.value = sanitize(payload.html ?? "");
    if (!srcdoc.value) {
      error.value = `抓取成功但正文为空（HTTP ${payload.status}）`;
      return;
    }
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

/** 把选中元素换算成两种选择器并展示 */
function applyPicked(el: Element): void {
  const tag = el.tagName.toLowerCase();
  const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
  const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
  pickedSummary.value = `<${tag}>${cls ? " ." + cls : ""}${text ? "  “" + text + "”" : ""}`;
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
    width="1040px"
    top="4vh"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="picker-bar">
      <ElInput
        v-model="target"
        placeholder="要预览的页面地址（预填的是上游抓取节点里的 URL）"
        clearable
        @keyup.enter="load"
      />
      <ElButton type="primary" :loading="loading" @click="load">抓取并渲染</ElButton>
    </div>

    <div v-if="error" class="picker-error">{{ error }}</div>

    <div class="picker-body">
      <iframe
        ref="frame"
        class="picker-frame"
        sandbox="allow-same-origin"
        :srcdoc="srcdoc"
        @load="bindFrame"
      />
    </div>

    <div class="picker-picked">
      <span class="picker-label">已选元素</span>
      <span v-if="pickedSummary" class="picker-summary">{{ pickedSummary }}</span>
      <span v-else class="picker-empty">在下面的预览里点一下元素（或右键）</span>
    </div>

    <div class="picker-result">
      <div class="picker-row">
        <span class="picker-label">CSS</span>
        <code class="picker-code">{{ cssSelector || "—" }}</code>
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
        <ElButton
          :type="recommendXpath ? 'primary' : 'default'"
          :disabled="!xpathSelector"
          @click="insert('XPATH', xpathSelector)"
        >
          用 XPath 插入
        </ElButton>
        <ElButton text :disabled="!xpathSelector" @click="copy(xpathSelector)">复制</ElButton>
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

.picker-body {
  height: 460px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
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
