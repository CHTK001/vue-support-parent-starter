<!--
  FvMetafilePanel.vue — Windows 图元文件（.wmf / .emf）预览面板。

  为什么自研：浏览器不解码 WMF/EMF，file-viewer 的 image/cad registry 也没有登记它们；
  本机 pnpm 仓里的 wmf 包只有元数据、无代码，EMF 没有可用 JS 实现。解析在
  utils/metafile.ts（记录流 → SVG），本面板只负责取字节、画 SVG、报统计。
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { parseMetafile } from "../../utils/metafile";
import FvLoadingMask from "./FvLoadingMask.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀） */
  objectKey: string;
  /** 文件名（不含目录） */
  fileName: string;
  /** 压缩包内条目路径（走 inner-raw 通道取包内字节） */
  inner?: string;
  /** 文件大小（字节；仅兼容调用方透传） */
  size?: number;
  /** 直接可取的字节地址（票据 URL / blob URL） */
  src?: string;
}>();

const emit = defineEmits<{
  fallback: [];
  error: [msg: string];
  rendered: [];
}>();

const loading = ref(true);
const failReason = ref("");
const svg = ref("");
const stats = ref("");

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  svg.value = "";
  stats.value = "";
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
    const r = parseMetafile(buf);
    if (r.shapeCount === 0) throw new Error("未解析到任何绘图图元");
    svg.value = r.svg;
    stats.value = `${r.kind.toUpperCase()} 图元文件 · 图元 ${r.shapeCount} · 记录 ${r.recordCount}`;
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "图元文件加载失败";
    console.warn("[FvMetafilePanel] wmf/emf 加载失败", e);
    failReason.value = `图元文件加载失败（${props.fileName}）：${msg}`;
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
  <div class="fv-metafile" data-testid="file-viewer">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-metafile__mask"><span>{{ failReason }}</span></div>
    <template v-else>
      <div class="fv-metafile__bar">
        <span class="fv-metafile__stat" data-testid="metafile-stats">{{ stats }}</span>
        <span class="fv-metafile__file">{{ fileName }}</span>
      </div>
      <!-- SVG 由 utils/metafile.ts 依解析出的数值拼装，文本已转义，可安全直插 -->
      <div class="fv-metafile__stage" v-html="svg"></div>
    </template>
  </div>
</template>

<style scoped>
.fv-metafile {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color, #fff);
}
.fv-metafile__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.fv-metafile__file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-metafile__stage {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}
.fv-metafile__stage :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.fv-metafile__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
