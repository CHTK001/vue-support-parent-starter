<!--
  FvManifestPanel.vue — Java MANIFEST（.mf / MANIFEST.MF）预览面板。

  为什么不复用文本面板：file-viewer 的 text 渲染器按 registry 里的扩展名选型，
  `.mf` 不在其中，落到它手里只会得到「该类型暂不支持在线预览」页。MANIFEST 本身
  是**有结构的键值清单**（主属性段 + 若干 Name: 条目段，72 字节折行、续行以空格开头），
  解析见 utils/manifest.ts（与 tga / hpgl 同为纯 TS 解析）。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { parseManifest, type ManifestSection } from "../../utils/manifest";
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
  fallback: [];
  error: [msg: string];
  rendered: [];
}>();

const loading = ref(true);
const failReason = ref("");
const sections = ref<ManifestSection[]>([]);

/** 主属性段（无 Name: 标题的那段）单独置顶展示 */
const mainSection = computed(() => sections.value[0] ?? { title: "", attrs: [] });
/** 其余为条目段 */
const entries = computed(() => sections.value.slice(1));

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  sections.value = [];
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
    const text = new TextDecoder("utf-8").decode(buf);
    const parsed = parseManifest(text);
    if (!parsed.length) throw new Error("未解析到任何 MANIFEST 属性");
    sections.value = parsed;
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "MANIFEST 加载失败";
    console.warn("[FvManifestPanel] MANIFEST 加载失败", e);
    failReason.value = `MANIFEST 加载失败（${props.fileName}）：${msg}`;
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
  <div class="fv-manifest" data-testid="file-viewer">
    <FvLoadingMask v-if="loading" :fileName="fileName" />
    <div v-else-if="failReason" class="fv-manifest__mask"><span>{{ failReason }}</span></div>
    <div v-else class="fv-manifest__body">
      <section class="fv-manifest__section">
        <h4 class="fv-manifest__title">主属性</h4>
        <dl class="fv-manifest__list">
          <template v-for="a in mainSection.attrs" :key="a.name">
            <dt>{{ a.name }}</dt>
            <dd>{{ a.value }}</dd>
          </template>
        </dl>
      </section>
      <section v-for="(s, i) in entries" :key="`${i}-${s.title}`" class="fv-manifest__section">
        <h4 class="fv-manifest__title">{{ s.title || `条目 ${i + 1}` }}</h4>
        <dl class="fv-manifest__list">
          <template v-for="a in s.attrs" :key="a.name">
            <dt>{{ a.name }}</dt>
            <dd>{{ a.value }}</dd>
          </template>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.fv-manifest {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: var(--el-bg-color-page);
  font-size: 13px;
}
.fv-manifest__body {
  padding: 12px 14px 20px;
}
.fv-manifest__section {
  margin-bottom: 14px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}
.fv-manifest__title {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  background: var(--el-fill-color-light, #fafafa);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.fv-manifest__list {
  margin: 0;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: minmax(140px, max-content) minmax(0, 1fr);
  gap: 6px 14px;
}
.fv-manifest__list dt {
  color: var(--el-text-color-secondary, #909399);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.fv-manifest__list dd {
  margin: 0;
  color: var(--el-text-color-primary, #303133);
  word-break: break-all;
}
.fv-manifest__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
