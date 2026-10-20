<!--
  大纲 / 脑图（非 XMind）预览面板：FreeMind（.mm）与 OPML（.opml）。

  <p>为什么单独一个面板：file-viewer 的 mindmapRenderer 只认 .xmind（按扩展名路由），
  .mm / .opml 都是**纯 XML 大纲**，没有对应渲染器。这里取字节后在前端解析成树、
  用自绘的可折叠树展示——不引入新依赖，也不需要后端参与。</p>

  <p>取字节口径与 FvDocPanel / PreviewDrawioPanel 一致：票据直链优先（props.src），
  否则顶层直取 objectUrl，包内条目走 ?preview=true&amp;inner= 通道。</p>
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";
import { countOutlineNodes, parseOutline, type OutlineNode } from "../../utils/outlineParser";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名（决定 FreeMind / OPML 分支） */
  fileName: string;
  /** 直链地址（可选；给了直接用，不再拼 URL） */
  src?: string;
  /** 压缩包内条目路径（可选） */
  inner?: string;
  /** 对象大小（可选；仅声明以兼容调用点透传） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 取字节/解析失败，请求父组件切回 iframe 服务端通道 */
  fallback: [];
  /** 错误明细（供父组件打日志/提示） */
  error: [msg: string];
  /** 渲染完成 */
  rendered: [];
}>();

void props.size;

/** 数据加载中（v-model:loading 兼容） */
const loading = defineModel<boolean>("loading", { default: false });

/** 解析出的大纲树（顶层可能是多个根，OPML/FreeMind 通常只有一个） */
const tree = shallowRef<OutlineNode[]>([]);
/** 面板内可读的失败文案 */
const failReason = ref("");
/** 已折叠节点的 key 集合 */
const collapsed = ref<Set<string>>(new Set());
/** 节点总数（用于提示，「全部展开/折叠」按需） */
const totalNodes = ref(0);

/** 是否已卸载 */
let disposed = false;
/** 防竞态令牌 */
let loadToken = 0;

/** 生效扩展名（小写） */
const ext = computed(() => extensionOf(props.fileName).toLowerCase());

/** 拍平为可见行（折叠的子树不展开），带层级用于缩进 */
const rows = computed(() => {
  const out: Array<{ node: OutlineNode; depth: number }> = [];
  const walk = (nodes: OutlineNode[], depth: number): void => {
    for (const node of nodes) {
      out.push({ node, depth });
      if (node.children.length > 0 && !collapsed.value.has(node.key)) {
        walk(node.children, depth + 1);
      }
    }
  };
  walk(tree.value, 0);
  return out;
});

/** 切换某个节点的展开/折叠 */
function toggle(key: string): void {
  const next = new Set(collapsed.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  collapsed.value = next;
}

/** 拉取文件字节（票据直链优先；包内条目带 inner） */
async function fetchBytes(): Promise<ArrayBuffer> {
  if (props.src) {
    const res = await fetch(props.src, { headers: authHeaders() });
    if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
    return res.arrayBuffer();
  }
  const base = objectUrl(props.bucket, props.objectKey);
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** 主流程：取字节 → 解析 → 渲染 */
async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  failReason.value = "";
  tree.value = [];
  collapsed.value = new Set();
  totalNodes.value = 0;
  try {
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    if (buf.byteLength === 0) throw new Error("文件内容为空");
    const text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
    const parsed = parseOutline(text, props.fileName);
    if (parsed.length === 0) throw new Error("大纲内容为空，或不是有效的 FreeMind / OPML 文件");
    tree.value = parsed;
    totalNodes.value = parsed.reduce((s, n) => s + countOutlineNodes(n), 0);
    emit("rendered");
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "大纲加载失败";
    console.warn("[FvOutlinePanel] 大纲加载失败", e);
    failReason.value = msg;
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed && token === loadToken) loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.fileName, props.src, props.inner],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
  loadToken++;
  tree.value = [];
});
</script>

<template>
  <section class="fv-outline" aria-label="大纲 / 脑图预览">
    <div v-if="loading" class="fv-outline__mask">
      <span class="fv-outline__spinner" aria-hidden="true"></span>
      <span>正在解析大纲…</span>
    </div>
    <div v-else-if="failReason" class="fv-outline__mask fv-outline__mask--error">{{ failReason }}</div>
    <template v-else>
      <header class="fv-outline__bar">
        <span class="fv-outline__badge">{{ ext === "opml" ? "OPML" : "FREEMIND" }}</span>
        <span class="fv-outline__count">{{ totalNodes }} 个节点</span>
        <button type="button" class="fv-outline__btn" @click="collapsed = new Set()">全部展开</button>
        <button
          type="button"
          class="fv-outline__btn"
          @click="collapsed = new Set(rows.filter((r) => r.node.children.length).map((r) => r.node.key))"
        >
          全部折叠
        </button>
      </header>
      <ul v-if="rows.length" class="fv-outline__list" role="tree" aria-label="大纲节点">
        <li
          v-for="row in rows"
          :key="row.node.key"
          class="fv-outline__item"
          role="treeitem"
          :aria-level="row.depth + 1"
          :aria-expanded="row.node.children.length ? !collapsed.has(row.node.key) : undefined"
        >
          <span v-if="row.depth" class="fv-outline__indent" aria-hidden="true">
            <i v-for="d in row.depth" :key="d"></i>
          </span>
          <button
            v-if="row.node.children.length"
            type="button"
            class="fv-outline__toggle"
            :aria-expanded="!collapsed.has(row.node.key)"
            :aria-label="collapsed.has(row.node.key) ? '展开' : '折叠'"
            :title="collapsed.has(row.node.key) ? '展开' : '折叠'"
            @click="toggle(row.node.key)"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span v-else class="fv-outline__toggle fv-outline__toggle--leaf" aria-hidden="true"></span>
          <span class="fv-outline__text">{{ row.node.title || "(无标题)" }}</span>
          <span v-if="row.node.note" class="fv-outline__note" :title="row.node.note">{{ row.node.note }}</span>
        </li>
      </ul>
      <div v-else class="fv-outline__mask">
        <span class="fv-outline__empty-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" stroke-width="1.8" opacity=".3"/>
            <line x1="14" y1="22" x2="34" y2="22" stroke="currentColor" stroke-width="1.8" opacity=".5" stroke-linecap="round"/>
            <line x1="14" y1="28" x2="28" y2="28" stroke="currentColor" stroke-width="1.8" opacity=".4" stroke-linecap="round"/>
            <line x1="14" y1="34" x2="24" y2="34" stroke="currentColor" stroke-width="1.8" opacity=".3" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="fv-outline__empty-title">大纲里没有可显示的节点</span>
        <span class="fv-outline__empty-hint">该文件可能为空或仅含根节点</span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.fv-outline {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary, #303133);
  font-size: 13px;
}

/* ---- 加载 / 错误 / 空态 ---- */
.fv-outline__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  padding: 24px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  text-align: center;
}
.fv-outline__mask--error {
  color: var(--el-color-danger, #f56c6c);
}
.fv-outline__empty-icon {
  display: block;
  margin-bottom: 14px;
  color: var(--el-color-primary, #409eff);
  opacity: 0.5;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--el-color-primary, #409eff) 50%, transparent));
}
.fv-outline__empty-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular, #606266);
  margin-bottom: 6px;
}
.fv-outline__empty-hint {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #b1b3b8);
}
.fv-outline__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--el-border-color-lighter, #ebeef5);
  border-top-color: var(--el-color-primary, #409eff);
  animation: fv-outline-spin 0.8s linear infinite;
}
@keyframes fv-outline-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- 顶部信息条（科技感：渐变底 + 底边光） ---- */
.fv-outline__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid transparent;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary, #409eff) 6%, var(--el-bg-color, #fff)) 0%,
      color-mix(in srgb, var(--el-color-success, #67c23a) 4%, var(--el-bg-color, #fff)) 100%
    );
  box-shadow:
    0 1px 0 0 var(--el-border-color-lighter, #ebeef5),
    0 4px 16px color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
}
.fv-outline__badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary, #409eff) 0%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 60%, var(--el-color-info, #909399)) 100%
  );
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-shadow: 0 0 8px color-mix(in srgb, var(--el-color-primary, #409eff) 60%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--el-color-primary, #409eff) 28%, transparent);
}
.fv-outline__count {
  margin-right: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary, #909399);
  letter-spacing: 0.3px;
}
.fv-outline__btn {
  height: 26px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 40%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
  color: var(--el-color-primary, #409eff);
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.1s ease;
}
.fv-outline__btn:hover {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 18%, transparent);
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary, #409eff) 30%, transparent);
}
.fv-outline__btn:active {
  transform: translateY(1px);
}
.fv-outline__btn:focus-visible,
.fv-outline__toggle:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary, #409eff) 60%, transparent);
  outline-offset: 2px;
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-primary, #409eff) 30%, transparent);
}

/* ---- 节点列表 ---- */
.fv-outline__list {
  list-style: none;
  margin: 0;
  padding: 10px 8px 20px;
}
.fv-outline__item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 2px 8px;
  border-radius: 8px;
  line-height: 1.5;
  transition:
    background 0.14s ease,
    box-shadow 0.14s ease;
}
.fv-outline__item:hover {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary, #409eff) 18%, transparent);
}
/* 层级参考线：每一级一条竖线，替代纯靠留白的缩进 */
.fv-outline__indent {
  display: inline-flex;
  flex: none;
  align-self: stretch;
}
.fv-outline__indent i {
  width: 16px;
  border-left: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 22%, var(--el-border-color-lighter, #ebeef5));
}
.fv-outline__toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  color: var(--el-color-primary, #409eff);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
}
.fv-outline__toggle:hover {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 22%, transparent);
  color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-primary, #409eff) 40%, transparent);
}
.fv-outline__toggle svg {
  /* 默认指向下方（展开态）；折叠时转回右侧 */
  transform: rotate(90deg);
  transition: transform 0.16s ease;
}
.fv-outline__toggle[aria-expanded="false"] svg {
  transform: rotate(0deg);
}
.fv-outline__toggle--leaf {
  background: transparent;
  cursor: default;
}
.fv-outline__toggle--leaf:hover {
  background: transparent;
  color: var(--el-text-color-secondary, #909399);
}
.fv-outline__text {
  min-width: 0;
  color: var(--el-text-color-primary, #303133);
  word-break: break-word;
}
.fv-outline__note {
  max-width: 40%;
  padding: 1px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, var(--el-fill-color-light, #f5f7fa));
  color: color-mix(in srgb, var(--el-color-primary, #409eff) 80%, var(--el-text-color-placeholder, #a8abb2));
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .fv-outline__spinner {
    animation: none;
  }
  .fv-outline__item,
  .fv-outline__btn,
  .fv-outline__toggle,
  .fv-outline__toggle svg {
    transition: none;
  }
}

/* ---- 选中与滚动条 ---- */
.fv-outline ::selection,
.fv-outline *::selection {
  background: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
  color: var(--el-text-color-primary, #303133);
}

.fv-outline::-webkit-scrollbar {
  width: 5px;
}
.fv-outline::-webkit-scrollbar-track {
  background: transparent;
}
.fv-outline::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #dcdfe6);
  border-radius: 999px;
}
.fv-outline::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker, #c4c7ce);
}
.fv-outline::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
