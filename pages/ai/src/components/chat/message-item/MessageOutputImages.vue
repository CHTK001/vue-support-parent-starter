<template>
  <!--
    Agent 产出图片就地预览：助手消息正文/工具调用里提到的工作区图片文件
    （PNG/SVG 等），只要服务端真实存在就渲染成缩略图，点击可放大。

    背景（2026-10-09 鹈鹕骑车缺陷）：agent 已把图画到工作区
    （raw-file 端点可取回 31KB 合法 PNG），但聊天正文只是把路径当行内代码，
    页面上看不到任何图 —— 用户以为「agent 没有输出结果」。
    这里从消息 JSON 里提取图片路径候选，逐个经 raw-file + 鉴权取回，
    取到才渲染；幻觉路径（404）静默丢弃，不显示裂图。
  -->
  <div v-if="loadedImages.length" class="output-images">
    <button v-for="(img, index) in loadedImages" :key="img.key" type="button" class="output-images__item"
      :title="img.path" @click="openViewer(index)">
      <img class="output-images__img" :src="img.url" :alt="img.name" loading="lazy" />
      <span class="output-images__name">{{ img.name }}</span>
    </button>

    <el-image-viewer v-if="viewerVisible" v-model:visible="viewerVisible" :url-list="imageUrls"
      :initial-index="viewerIndex" :teleported="true" @close="viewerVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { ElImageViewer } from "element-plus";

import { apiService } from "@/services/ApiService";
import { loadAuthenticatedImage } from "@/utils/authImage";
import type { Message } from "@/utils/messageUtils";

const props = defineProps<{
  sessionId: string;
  /** 本轮的全部助手消息（含历史版本）：图片是 agent 的真实产物，与文本版本无关 */
  messages: Message[];
}>();

/** 单条消息最多提取多少个图片路径 token（防超长消息撑爆请求） */
const MAX_TOKENS = 16;
/** 单条消息最多展示多少张图 */
const MAX_IMAGES = 12;
/** 每个 token 最多尝试的候选路径数 */
const MAX_ATTEMPTS = 3;

/** 已成功取回的图片（保持提取顺序） */
const loadedImages = ref<Array<{ key: string; path: string; name: string; url: string }>>([]);
const viewerVisible = ref(false);
const viewerIndex = ref(0);

const imageUrls = computed(() => loadedImages.value.map((item) => item.url));

/**
 * 把解析成功的路径归一化成去重 key。
 *
 * 同一个文件常被绝对路径（`/opt/…/admin/agent/85/x.png`）和相对路径
 * （`85/x.png`、`x.png`）各提到一次——字符串不同、落盘同一份，
 * 不归一就会在页面上出现两张一模一样的图。
 * 规则：去开头斜杠 → 截掉 `/{sessionId}/` 及其之前的部分 → 去 `{sessionId}/` 前缀。
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

/** 已发起过尝试的 token（无论成败），避免流式期间重复打后端 */
const attempted = new Set<string>();
/** 取回失败的 token：流式结束后统一重试一次（文件可能刚落地） */
const failed = new Set<string>();
/** 待释放的 object URL */
let revokes: Array<() => void> = [];
let disposed = false;

/** 从本轮全部版本里提取图片路径 token（跨版本去重、总量封顶） */
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
    // 词法：路径字符集 + 图片扩展名收尾；每次新建正则避免 /g 的 lastIndex 残留
    const re =
      /[A-Za-z0-9_.\-/\\]+\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?![A-Za-z0-9_.-])/gi;
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
 * 生成 raw-file 的候选相对路径（按命中概率排序，最多 MAX_ATTEMPTS 个）。
 *
 * - 绝对路径：raw-file 接受工作区内绝对路径；工作区外的绝对路径在
 *   write_file 落盘时被拼到了工作区根下（去掉开头 /），故补一个去斜杠候选。
 * - 相对路径：agent 的 cwd 是 `{工作区}/{sessionId}`，先试会话前缀，
 *   再退回工作区根（sse-probe 之类确实落在根下）。
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

/** 依次尝试候选路径，取到第一张真实存在的图 */
async function attempt(token: string): Promise<void> {
  if (attempted.has(token) || disposed || !props.sessionId || !token) return;
  attempted.add(token);
  for (const rel of candidates(token)) {
    const url = apiService.getWorkspaceRawFileUrl(props.sessionId, rel);
    const res = await loadAuthenticatedImage(url);
    if (disposed) {
      res?.revoke();
      return;
    }
    if (res) {
      revokes.push(res.revoke);
      // 同一文件被绝对/相对多种写法提到时只保留一张
      const key = normalizeKey(rel);
      if (!loadedImages.value.some((item) => item.key === key)) {
        loadedImages.value.push({
          key,
          path: rel,
          name: rel.split("/").pop() || rel,
          url: res.objectUrl,
        });
      } else {
        // 归一后重复：立即释放这次多取的 blob
        res.revoke();
      }
      if (loadedImages.value.length > MAX_IMAGES) {
        loadedImages.value = loadedImages.value.slice(0, MAX_IMAGES);
      }
      return;
    }
  }
  failed.add(token);
}

/** 清空全部状态并释放 blob（切换会话/切换消息版本时调用） */
function reset(): void {
  for (const revoke of revokes.splice(0)) revoke();
  loadedImages.value = [];
  attempted.clear();
  failed.clear();
  viewerVisible.value = false;
}

// 会话或消息集合切换（含版本增删）：状态里混着上一个来源的图片，整体复位。
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

function openViewer(index: number): void {
  viewerIndex.value = index;
  viewerVisible.value = true;
}

onBeforeUnmount(() => {
  disposed = true;
  for (const revoke of revokes.splice(0)) revoke();
});
</script>

<style scoped>
.output-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.output-images__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 260px;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  cursor: zoom-in;
  transition: border-color 0.15s ease;
}

.output-images__item:hover {
  border-color: var(--el-color-primary);
}

.output-images__img {
  display: block;
  max-width: 250px;
  max-height: 160px;
  object-fit: contain;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.output-images__name {
  max-width: 250px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
