<!--
  FvPltPanel.vue — HP-GL / HP-GL(2) 绘图文件（.plt）预览面板。

  为什么自研：浏览器没有 PLT/HPGL 解码器，file-viewer 的 cad registry 与
  @flyfish-dev/cad-viewer 都只认 dwg/dxf/dwf/dwfx/xps。PLT 是 AutoCAD
  「打印到文件」的默认格式，工程出图里很常见，回退成「不支持预览」不诚实。

  做法与 tga 一致：纯 TS 解析（见 utils/hpgl.ts）→ SVG → 直接挂 DOM。
  取字节走「顶层直取 / 包内 inner-raw」两种通道，照抄 FvCadPanel 的写法。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { hpglToSvg, parseHpgl } from "../../utils/hpgl";
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
  /** 文件大小（字节；仅兼容调用方透传，未使用） */
  size?: number;
  /** 直接可取的字节地址（票据 URL）；为空时按 bucket/objectKey 签票据 */
  src?: string;
}>();

const emit = defineEmits<{
  /** 加载或解析失败，请求父组件退回兜底通道 */
  fallback: [];
  /** 失败明细（可读文案） */
  error: [msg: string];
  /** 渲染完成 */
  rendered: [];
}>();

/** 生效文件名：包内条目取路径末段 */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) return props.fileName;
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

const loading = ref(true);
const failReason = ref("");
/** 解析出的 SVG 源码（空串表示尚未出图） */
const svg = ref("");
/** 图元/指令统计（供状态条展示，让「出了多少内容」可核对） */
const stats = ref({ lines: 0, circles: 0, rects: 0, commands: 0 });

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  svg.value = "";
  try {
    let url = props.src ?? "";
    if (!url) {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) throw new Error("获取图纸地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) throw new Error("预览通道返回空响应体");

    const geo = parseHpgl(ab);
    if (geo.polylines.length === 0 && geo.circles.length === 0 && geo.rects.length === 0) {
      throw new Error("未解析到任何绘图指令（可能不是 HP-GL/PLT 文件）");
    }
    stats.value = {
      lines: geo.polylines.length,
      circles: geo.circles.length,
      rects: geo.rects.length,
      commands: geo.commandCount,
    };
    svg.value = hpglToSvg(geo);
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "PLT 图纸加载失败";
    console.warn("[FvPltPanel] PLT 图纸加载失败", e);
    failReason.value = `PLT 图纸加载失败（${effectiveName.value}）：${msg}`;
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
  <div class="fv-plt-panel">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-plt-panel__mask">
      <span class="fv-plt-panel__mask-text">{{ failReason }}</span>
    </div>
    <template v-else>
      <div class="fv-plt-panel__stat">
        HP-GL 绘图 · 折线 {{ stats.lines }} · 圆 {{ stats.circles }} · 矩形 {{ stats.rects }} · 指令 {{ stats.commands }}
      </div>
      <!-- eslint-disable-next-line vue/no-v-html — 源码由本地 hpgl.ts 生成，仅含 path/circle/rect -->
      <div class="fv-plt-panel__canvas" data-testid="file-viewer" v-html="svg" />
    </template>
  </div>
</template>

<style scoped>
.fv-plt-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}
.fv-plt-panel__stat {
  flex: 0 0 auto;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.fv-plt-panel__canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.fv-plt-panel__canvas :deep(svg) {
  display: block;
}
.fv-plt-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-plt-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
