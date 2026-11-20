<template>
  <!--
    Agent 产出的 HTML 设计稿就地渲染（openchamber_render 的会话内形态）。
    正文/工具调用里提到的工作区 .html 文件，只要服务端真实存在就用
    srcdoc 沙箱内联渲染成可交互预览卡：默认展开、可收起、可刷新、可放大。
    与 MessageOutputImages 同构：幻觉路径（404）静默丢弃，不显示裂卡。
  -->
  <div v-if="previews.length" class="output-html">
    <section v-for="(item, index) in previews" :key="item.key" class="output-html__card">
      <header class="output-html__head">
        <span class="output-html__badge">设计稿</span>
        <span class="output-html__name" :title="item.path">{{ item.name }}</span>
        <span class="output-html__spacer"></span>
        <el-button size="small" text :icon="Refresh" title="重新加载" @click="reload(index)" />
        <el-button size="small" text :icon="FullScreen" title="放大预览" @click="openZoom(index)" />
        <el-button size="small" text :icon="item.expanded ? Fold : Expand"
          :title="item.expanded ? '收起' : '展开'" @click="item.expanded = !item.expanded" />
      </header>
      <div v-show="item.expanded" class="output-html__body">
        <iframe v-if="item.srcdoc" :srcdoc="item.srcdoc" class="output-html__frame"
          referrerpolicy="no-referrer" sandbox="allow-same-origin allow-scripts"></iframe>
        <div v-else class="output-html__loading">设计稿加载中…</div>
      </div>
    </section>

    <el-dialog v-model="zoom.visible" :title="zoom.name || '设计稿预览'" width="92%" top="4vh"
      destroy-on-close append-to-body>
      <iframe v-if="zoom.visible && zoom.srcdoc" :srcdoc="zoom.srcdoc"
        class="output-html__frame output-html__frame--zoom"
        referrerpolicy="no-referrer" sandbox="allow-same-origin allow-scripts"></iframe>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElButton, ElDialog } from "element-plus";
import { Expand, Fold, FullScreen, Refresh } from "@element-plus/icons-vue";

import { apiService } from "@/services/ApiService";
import { loadAuthenticatedImage } from "@/utils/authImage";
import { buildHtmlPreviewSrcDocWithAssets } from "@/utils/htmlPreviewSrcDoc";
import type { Message } from "@/utils/messageUtils";

/**
 * 会话内 HTML 设计稿内联渲染。
 *
 * <p><b>背景。</b>agent 在会话工作区里写出 UI 设计页（.html）后，聊天正文
 * 只把路径当行内代码展示，用户看不到「设计出来长什么样」——对应
 * openchamber_render / openchamber_design 的体验缺口。图片稿已由
 * MessageOutputImages 覆盖，这里补齐 HTML 原型形态。</p>
 *
 * <p><b>做法。</b>从本轮助手消息（含工具调用）里词法提取 .html/.htm 路径
 * token，逐个经 getWorkspaceFile（带鉴权请求头）取回；确认是 HTML 文档后，
 * 用 buildHtmlPreviewSrcDocWithAssets 注入 base href 并把页面内图片/媒体
 * 换成带鉴权取回的 blob 地址，最后塞进 sandbox iframe 的 srcdoc 渲染。
 * 令牌不出现在任何 URL 里，与 FilePreviewPanel 的安全预览口径一致。</p>
 *
 * <p><b>已知取舍。</b>与图片稿相同：路径来自正文词法扫描，agent 幻觉出的
 * 路径取不到文件就静默跳过；同一文件被多种写法提到时按归一化 key 去重。</p>
 */
const props = defineProps<{
  sessionId: string;
  /** 本轮的全部助手消息（含历史版本）：设计稿是 agent 的真实产物，与文本版本无关 */
  messages: Message[];
}>();

/** 单条消息最多提取多少个 HTML 路径 token（防超长消息撑爆请求） */
const MAX_TOKENS = 8;
/** 单轮最多内联渲染多少份设计稿 */
const MAX_PREVIEWS = 3;
/** 每个 token 最多尝试的候选路径数 */
const MAX_ATTEMPTS = 3;

interface PreviewItem {
  /** 归一化去重 key */
  key: string;
  /** 命中的工作区相对路径 */
  path: string;
  /** 展示用文件名 */
  name: string;
  /** iframe srcdoc 文档（资源已换成 blob 地址） */
  srcdoc: string;
  /** 是否展开正文（默认展开：设计稿就是要给人看的） */
  expanded: boolean;
  /** 释放本次 srcdoc 改写创建的 blob 地址 */
  revoke: () => void;
}

const previews = ref<PreviewItem[]>([]);
const zoom = reactive({ visible: false, name: "", srcdoc: "" });

/**
 * 把解析成功的路径归一化成去重 key（与 MessageOutputImages 同规则）：
 * 去开头斜杠 → 截掉 `/{sessionId}/` 及其之前的部分 → 去 `{sessionId}/` 前缀。
 */
function normalizeKey(rel: string): string {
  let k = rel.replace(/^\/+/, "");
  const sid = props.sessionId;
  if (sid) {
    const marker = `/${sid}/`;
    const idx = k.indexOf(marker);
    if (idx >= 0) {
      k = k.slice(idx + marker.length);
    } else if (k.startsWith(`${sid}/`)) {
      k = k.slice(sid.length + 1);
    }
  }
  return k;
}

/** 从本轮全部版本里提取 HTML 路径 token（跨版本去重、总量封顶） */
function extractTokens(msgs: Message[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const msg of msgs) {
    let blob: string;
    try {
      blob = JSON.stringify(msg?.contents ?? []);
    } catch {
      continue;
    }
    if (!blob) continue;
    // 词法：路径字符集 + html 扩展名收尾；每次新建正则避免 /g 的 lastIndex 残留
    const re = /[A-Za-z0-9_.\-/\\]+\.html?(?![A-Za-z0-9_.-])/gi;
    for (const raw of blob.match(re) ?? []) {
      const token = raw.replace(/\\/g, "/").replace(/^["'`(]+/, "").replace(/[)"'`,;:]+$/, "");
      if (!token || token.length > 300) continue;
      // 协议 URL（http://…、//cdn…）不归工作区管，跳过
      if (token.startsWith("//")) continue;
      if (seen.has(token)) continue;
      seen.add(token);
      out.push(token);
      if (out.length >= MAX_TOKENS) return out;
    }
  }
  return out;
}

/**
 * 生成 getWorkspaceFile 的候选相对路径（按命中概率排序，最多 MAX_ATTEMPTS 个）。
 * 与 MessageOutputImages 同策略：绝对路径补一个去斜杠候选；相对路径先试
 * `{sessionId}/` 前缀（agent cwd 是 `{工作区}/{sessionId}`），再退回工作区根。
 */
function candidates(token: string): string[] {
  const out: string[] = [];
  const push = (p: string) => {
    if (p && !out.includes(p) && out.length < MAX_ATTEMPTS) out.push(p);
  };
  if (token.startsWith("/")) {
    push(token);
    push(token.replace(/^\/+/, ""));
  } else {
    const rel = token.replace(/^\.\//, "");
    if (props.sessionId) push(`${props.sessionId}/${rel}`);
    push(rel);
  }
  return out;
}

/** 已发起过尝试的 token（无论成败），避免流式期间重复打后端 */
const attempted = new Set<string>();
/** 取回失败的 token：流式结束后统一重试一次（文件可能刚落地） */
const failed = new Set<string>();
let disposed = false;

/** token 的展示名与 srcdoc 的资源基址目录 */
function dirOf(rel: string): string {
  const idx = rel.lastIndexOf("/");
  return idx > 0 ? rel.slice(0, idx) : "";
}

/** 取回并构建一份设计稿的 srcdoc；文件不存在或不是 HTML 文档时返回 null */
async function buildDoc(rel: string) {
  const file = await apiService.getWorkspaceFile(props.sessionId, rel);
  if (!file?.content || !/<\s*(?:!doctype|html|head|body)\b/i.test(file.content)) {
    return null;
  }
  const baseUrl = apiService.getWorkspaceHtmlPreviewBaseUrl(props.sessionId, dirOf(rel));
  return buildHtmlPreviewSrcDocWithAssets(file.content, baseUrl, loadAuthenticatedImage);
}

/** 依次尝试候选路径，取到第一份真实存在的 HTML 设计稿 */
async function attempt(token: string): Promise<void> {
  if (attempted.has(token) || disposed || !props.sessionId || !token) return;
  attempted.add(token);
  if (previews.value.length >= MAX_PREVIEWS) return;
  for (const rel of candidates(token)) {
    try {
      const built = await buildDoc(rel);
      if (disposed) {
        built?.revoke();
        return;
      }
      if (!built) continue;
      // 同一文件被绝对/相对多种写法提到时只保留一份
      const key = normalizeKey(rel);
      if (previews.value.some((item) => item.key === key)) {
        built.revoke();
        return;
      }
      previews.value.push({
        key,
        path: rel,
        name: rel.split("/").pop() || rel,
        srcdoc: built.html,
        revoke: built.revoke,
        expanded: true,
      });
      return;
    } catch {
      // 该候选不存在/不可读：换下一个候选
    }
  }
  failed.add(token);
}

/** 重新加载某一分设计稿（agent 可能刚改完文件）；失败保留旧内容 */
async function reload(index: number): Promise<void> {
  const item = previews.value[index];
  if (!item || disposed) return;
  try {
    const built = await buildDoc(item.path);
    if (!built) return;
    if (disposed) {
      built.revoke();
      return;
    }
    const oldRevoke = item.revoke;
    item.srcdoc = built.html;
    item.revoke = built.revoke;
    oldRevoke();
  } catch {
    // 刷新失败：保留旧内容
  }
}

function openZoom(index: number): void {
  const item = previews.value[index];
  if (!item?.srcdoc) return;
  zoom.name = item.name;
  zoom.srcdoc = item.srcdoc;
  zoom.visible = true;
}

/** 清空全部状态并释放 blob（切换会话/切换消息版本时调用） */
function reset(): void {
  for (const item of previews.value) item.revoke();
  previews.value = [];
  attempted.clear();
  failed.clear();
  zoom.visible = false;
  zoom.srcdoc = "";
}

// 会话或消息集合切换（含版本增删）：状态里混着上一个来源的文件，整体复位。
// 必须先于下面的 tokens 监听注册——同一 tick 内回调按注册顺序跑，
// 复位在前才能保证新一轮提取从干净状态开始。
watch(
  () => [props.sessionId, props.messages.map((m) => m.id).join(",")],
  () => reset(),
);

const tokens = computed(() => extractTokens(props.messages));

watch(
  tokens,
  (list) => {
    for (const token of list.slice(0, MAX_TOKENS)) void attempt(token);
  },
  { immediate: true },
);

// 流式结束后给失败 token 一次重试机会：路径可能在正文中先出现、文件后落地
const anyStreaming = computed(() => props.messages.some((m) => m.state?.isStreaming));
watch(
  anyStreaming,
  (streaming, wasStreaming) => {
    if (!wasStreaming || streaming || failed.size === 0) return;
    for (const token of failed) attempted.delete(token);
    failed.clear();
    for (const token of tokens.value.slice(0, MAX_TOKENS)) void attempt(token);
  },
);

onBeforeUnmount(() => {
  disposed = true;
  reset();
});
</script>

<style scoped>
.output-html {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.output-html__card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.15s ease;
}

.output-html__card:hover {
  border-color: var(--el-border-color);
}

.output-html__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.output-html__badge {
  flex: none;
  padding: 0 8px;
  font-size: 12px;
  line-height: 20px;
  color: var(--el-color-primary);
  border: 1px solid currentColor;
  border-radius: 999px;
  opacity: 0.9;
}

.output-html__name {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.output-html__spacer {
  flex: 1 1 auto;
}

.output-html__body {
  height: 460px;
  background: #fff;
}

.output-html__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.output-html__frame--zoom {
  height: 78vh;
}

.output-html__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
