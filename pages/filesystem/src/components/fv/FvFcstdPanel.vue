<!--
  FvFcstdPanel.vue — FreeCAD 文档（.fcstd）预览面板。

  <p>.fcstd 是 **ZIP 容器**（Document.xml / GuiDocument.xml + 每个形状一个 *.brp），
  浏览器没有 FreeCAD 内核，但内层 *.brp 就是 OCCT BREP，本仓库已有 BREP 渲染路径
  （PreviewModel3dPanel + occt-import-js）。所以这里的做法是：取字节 → 就地解 ZIP →
  挑出**最大的** *.brp → 用 blob URL 交给 PreviewModel3dPanel 渲染，几何内核与直接
  打开 .brep 完全一致。</p>

  挑最大而非第一个：FreeCAD 里一个文档可能有多个形状对象（PartShape、Cut、Fusion…），
  首个常是中间体；最大的那个通常才是最完整的实体。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { extractFcstdShape } from "../../utils/fcstd";
import FvLoadingMask from "./FvLoadingMask.vue";
import PreviewModel3dPanel from "../PreviewModel3dPanel.vue";

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

/** 解包出的 BREP 的 blob URL（交给 PreviewModel3dPanel 的 `src`） */
const brepSrc = shallowRef("");
/** 交给模型面板的虚拟文件名：必须以 .brep 结尾，面板按扩展名选几何内核 */
const brepName = ref("");
const loading = ref(true);
const failReason = ref("");

/** 释放上一次的 blob URL，避免连续预览泄漏 */
function revoke(): void {
  if (brepSrc.value) {
    URL.revokeObjectURL(brepSrc.value);
    brepSrc.value = "";
  }
}

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  revoke();
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

    // 解包取几何（逻辑抽到 utils/fcstd.ts，已有单测覆盖）
    const shape = await extractFcstdShape(buf);
    revoke();
    brepSrc.value = URL.createObjectURL(
      new Blob([shape.bytes], { type: "application/octet-stream" }),
    );
    const base = props.fileName.replace(/\.[^.]+$/, "") || "freecad";
    brepName.value = `${base}.brep`;
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "FreeCAD 文档加载失败";
    console.warn("[FvFcstdPanel] FreeCAD 文档加载失败", e);
    failReason.value = `FreeCAD 文档加载失败（${props.fileName}）：${msg}`;
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

onBeforeUnmount(revoke);
</script>

<template>
  <div class="fv-fcstd">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-fcstd__mask"><span>{{ failReason }}</span></div>
    <PreviewModel3dPanel
      v-else-if="brepSrc"
      :bucket="''"
      :object-key="''"
      :file-name="brepName"
      :src="brepSrc"
    />
  </div>
</template>

<style scoped>
.fv-fcstd {
  width: 100%;
  height: 100%;
  min-height: 0;
}
.fv-fcstd__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
