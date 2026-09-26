<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="860px"
    destroy-on-close
    append-to-body
  >
    <div v-loading="loading" class="kp-preview">
      <!-- 图片 -->
      <img
        v-if="kind === 'image' && src"
        :src="src"
        :alt="title"
        class="kp-preview__img"
        @load="loading = false"
        @error="onError"
      />
      <!-- PDF：浏览器内置 viewer -->
      <iframe
        v-else-if="kind === 'pdf' && src"
        :src="src + '#toolbar=1'"
        class="kp-preview__frame"
        @load="loading = false"
        @error="onError"
      />
      <!-- DOCX：Office Online 需公网 URL，本地走 mammoth 转 HTML；失败兜底下载 -->
      <div v-else-if="kind === 'docx' && src" class="kp-preview__docx">
        <div v-if="docxHtml" class="kp-preview__docx-html" v-html="docxHtml" />
        <el-empty v-else-if="!loading" description="DOCX 解析失败，可下载后查看">
          <el-button type="primary" @click="download">下载文件</el-button>
        </el-empty>
      </div>
      <el-empty v-else-if="!loading" description="不支持预览的类型">
        <el-button type="primary" @click="download">下载文件</el-button>
      </el-empty>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="download">下载</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * KnowledgeFilePreview —— 知识点附件预览对话框
 *
 * - 图片：img 直链
 * - PDF：iframe（浏览器内置 viewer，#toolbar=1）
 * - DOCX：fetch blob → mammoth 转 HTML 内嵌展示；失败提供下载兜底
 *
 * 直链已由后端 whitelist 放行（/v2/edu/knowledge-point/file），
 * img/iframe 无需鉴权头即可访问；路径为服务端 UUID 落盘相对路径。
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@repo/utils";

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  /** 附件相对路径（knowledgePointFilePath） */
  path?: string;
  /** 原始文件名（用于标题与下载） */
  fileName?: string;
  /** 扩展名: png/jpg/pdf/docx 等 */
  fileType?: string;
}>();

const loading = ref(false);
const docxHtml = ref("");
const error = ref(false);

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);
const DOCX_EXT = new Set(["docx"]);

const ext = computed(() => (props.fileType || guessExt(props.fileName || "")).toLowerCase());
const kind = computed<"image" | "pdf" | "docx" | "other">(() => {
  if (IMAGE_EXT.has(ext.value)) return "image";
  if (ext.value === "pdf") return "pdf";
  if (DOCX_EXT.has(ext.value)) return "docx";
  return "other";
});
const src = computed(() =>
  props.path ? `/v2/edu/knowledge-point/file?path=${encodeURIComponent(props.path)}` : "",
);
const title = computed(() => props.fileName || "附件预览");

function guessExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1) : "";
}

function onError() {
  loading.value = false;
  error.value = true;
  ElMessage.error("预览加载失败");
}

async function download() {
  if (!src.value) return;
  try {
    const blob = await http()
      .get(src.value)
      .responseType("blob")
      .then<Blob>((r) => r.data as Blob);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = props.fileName || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    // 直链已 whitelist，兜底新窗口打开
    window.open(src.value, "_blank");
  }
}

async function loadDocx() {
  if (!src.value) return;
  loading.value = true;
  docxHtml.value = "";
  error.value = false;
  try {
    const mammoth = await import(/* @vite-ignore */ "mammoth/mammoth.browser");
    const blob = await http()
      .get(src.value)
      .responseType("blob")
      .then<Blob>((r) => r.data as Blob);
    const buf = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buf });
    docxHtml.value = result.value || "";
  } catch (e) {
    console.warn("[KnowledgeFilePreview] mammoth DOCX 解析失败", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [visible.value, props.path, kind.value],
  () => {
    if (!visible.value || !props.path) return;
    error.value = false;
    docxHtml.value = "";
    loading.value = kind.value !== "other";
    if (kind.value === "docx") void loadDocx();
  },
  { immediate: true },
);
</script>

<style scoped>
.kp-preview {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kp-preview__img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
.kp-preview__frame {
  width: 100%;
  height: 70vh;
  border: none;
  background: var(--el-fill-color-light);
}
.kp-preview__docx {
  width: 100%;
  max-height: 70vh;
  overflow: auto;
}
.kp-preview__docx-html {
  padding: 16px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
</style>
