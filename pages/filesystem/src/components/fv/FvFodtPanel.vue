<!--
  FvFodtPanel.vue — 扁平 OpenDocument 文字（.fodt）预览面板。

  为什么自研：fodt 是**单个 XML** 的扁平 ODF，服务端 Aspose 转换器读不了（实测落到
  「不支持在线预览」），file-viewer 的 office registry 也不认这个扩展名。这里按
  utils/flatOdf.ts 的做法轻量抽出正文的标题与段落，用 Vue 直接渲染（不用 v-html，
  文本节点天然安全）。
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { parseFlatOdf, type OdfBlock } from "../../utils/flatOdf";
import FvLoadingMask from "./FvLoadingMask.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（不含目录） */
  fileName: string;
  /** 压缩包内条目路径（走 inner-raw 通道取包内字节） */
  inner?: string;
  /** 文件大小（字节；仅兼容调用方透传） */
  size?: number;
  /** 直接可取的字节地址（票据 URL） */
  src?: string;
}>();

const emit = defineEmits<{
  fallback: [];
  error: [msg: string];
  rendered: [];
}>();

const loading = ref(true);
const failReason = ref("");
const blocks = ref<OdfBlock[]>([]);

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  blocks.value = [];
  try {
    let url = props.src ?? "";
    if (!url) {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) throw new Error("获取文件地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error("预览通道返回空响应体");
    const parsed = parseFlatOdf(new TextDecoder("utf-8").decode(buf));
    if (!parsed.length) throw new Error("未解析到正文（可能不是扁平 ODF 文字）");
    blocks.value = parsed;
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "fodt 加载失败";
    console.warn("[FvFodtPanel] fodt 加载失败", e);
    failReason.value = `fodt 加载失败（${props.fileName}）：${msg}`;
    emit("fallback");
    emit("error", failReason.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);
</script>

<template>
  <div class="fv-fodt" data-testid="file-viewer">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-fodt__mask"><span>{{ failReason }}</span></div>
    <article v-else class="fv-fodt__doc">
      <template v-for="(b, i) in blocks" :key="i">
        <component
          :is="`h${b.level}`"
          v-if="b.kind === 'heading'"
          class="fv-fodt__h"
        >{{ b.text }}</component>
        <p v-else class="fv-fodt__p">{{ b.text }}</p>
      </template>
    </article>
  </div>
</template>

<style scoped>
.fv-fodt {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--el-bg-color, #fff);
}
.fv-fodt__doc {
  max-width: 820px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  color: var(--el-text-color-primary, #303133);
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
.fv-fodt__h {
  margin: 18px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}
.fv-fodt__p {
  margin: 0 0 10px;
}
.fv-fodt__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
