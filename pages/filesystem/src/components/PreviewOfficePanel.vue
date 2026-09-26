<script setup lang="ts">
/**
 * 客户端 Office 文档预览面板组件。
 *
 * 通过 Vue3 Office 组件族（`@vue-office/docx` / `excel` / `pdf` / `pptx`）
 * 在浏览器内直接解析并渲染 docx / xlsx / xls / pdf / pptx，
 * 服务端只需回吐原始字节，不再经过 LibreOffice / Aspose / OnlyOffice 转换，
 * 首次打开延迟与服务器资源占用显著下降。
 *
 * 组件按**内容魔数**选择渲染器（而非只看扩展名），因此能正确处理
 * 「扩展名是 .doc、内容其实是 .docx」这类文件；真正的传统二进制 .doc 则
 * 由后端渲染，组件收到非 client 通道后抛出 `error`，父组件改用
 * `?preview=true&render=server` 退回服务端渲染链路。
 *
 * @author CH
 * @since 2026/09/26
 */
import { computed, defineAsyncComponent, ref, shallowRef, watch } from "vue";
import PreviewToolbar from "./PreviewToolbar.vue";
import { officeRendererOfSniffed, type OfficeRenderer } from "../utils/officeRenderer";

/**
 * Vue3 Office 组件按需异步加载
 *
 * 四个渲染器各自内嵌完整解析器（docx-preview / exceljs + x-data-spreadsheet /
 * pdf.js / pptx-preview），静态引入会让主包膨胀到 7MB 量级。
 * 改为 defineAsyncComponent 后，只有真正打开对应类型文档时才拉取该解析器。
 * 注意：渲染器与扩展名的对应关系不变，仍由 officeRenderer.ts 统一维护。
 */
const VueOfficeDocx = defineAsyncComponent(() => import("@vue-office/docx"));
const VueOfficeExcel = defineAsyncComponent(() => import("@vue-office/excel"));
const VueOfficePdf = defineAsyncComponent(() => import("@vue-office/pdf"));
const VueOfficePptx = defineAsyncComponent(() => import("@vue-office/pptx"));

/** docx / excel 渲染器所需样式（静态引入，避免异步 chunk 内样式闪烁） */
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";

/** 缩放比例（v-model） */
const zoom = defineModel<number>("zoom", { default: 100 });

/** 数据加载中状态（v-model，由本组件在拉取字节期间置位） */
const loading = defineModel<boolean>("loading", { default: false });

const props = defineProps<{
  /** 文件字节地址（后端预览通道 ?preview=true） */
  src: string;
  /** 文件名（用于选择渲染器） */
  fileName: string;
}>();

const emit = defineEmits<{
  /** 渲染完成 */
  rendered: [];
  /** 加载或解析失败，父组件应退回服务端渲染 */
  error: [];
  /** 请求全屏 */
  fullscreen: [];
}>();

/** wrap 容器 DOM 引用（供父组件全屏切换） */
const wrapRef = ref<HTMLDivElement>();
/** 工具栏引用 */
const toolbarRef = ref<InstanceType<typeof PreviewToolbar>>();

/**
 * 文档二进制内容
 *
 * 用 shallowRef 而非 ref：ArrayBuffer 为大对象，深响应性代理没有意义且会拖慢渲染
 */
const buffer = shallowRef<ArrayBuffer | null>(null);

/** 加载失败信息（渲染错误时展示，便于定位） */
const failReason = ref("");

/**
 * 当前文件实际使用的渲染器
 *
 * 依据**内容魔数**判定而非扩展名：扩展名为 doc / xls / ppt 的文件里，
 * 相当一部分实际是 OOXML（Word「另存为」、在线转换、邮件附件都会产生），
 * 只有嗅探出真实类型才能交给对应的客户端组件。
 * 拿到字节前退化为按扩展名判定。
 */
const renderer = computed<OfficeRenderer | "">(() =>
  officeRendererOfSniffed(props.fileName, buffer.value ? new Uint8Array(buffer.value) : undefined),
);

/** 是否为可客户端直渲染的类型（false 时提示父组件走服务端） */
const supported = computed(() => renderer.value !== "");

/** 传给 Vue3 Office 组件的 src：统一使用 ArrayBuffer，避免组件二次发起带凭证请求 */
const officeSrc = computed<ArrayBuffer | string | undefined>(() =>
  supported.value && buffer.value ? buffer.value : undefined,
);

/**
 * 拉取文档字节
 *
 * <p>与后端约定：命中客户端直渲染通道时，响应头 {@code X-FileStorage-Preview}
 * 为 {@code client} 且响应体是原始文件字节；若后端判定该文件需服务端渲染
 * （如真正的 OLE2 传统 .doc），响应体是 HTML 预览页，此时不能作为
 * {@code ArrayBuffer} 交给 Office 组件解析，需交回父组件走服务端渲染。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  failReason.value = "";
  buffer.value = null;
  try {
    const res = await fetch(props.src, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const channel = res.headers.get("X-FileStorage-Preview");
    if (channel && channel !== "client") {
      // 服务端已按自己的链路渲染出 HTML 预览页，无法作为文档字节解析
      failReason.value = "该文件需由服务端渲染";
      emit("error");
      return;
    }
    buffer.value = await res.arrayBuffer();
    if (!officeRendererOfSniffed(props.fileName, new Uint8Array(buffer.value))) {
      failReason.value = `客户端不支持直接解析该格式（${props.fileName}）`;
      emit("error");
    }
  } catch (e) {
    failReason.value = (e as Error)?.message ?? "文档加载失败";
    emit("error");
  } finally {
    loading.value = false;
  }
}

watch(() => [props.src, props.fileName], () => void load(), { immediate: true });

/** Vue3 Office 组件渲染完成 */
function onRendered(): void {
  emit("rendered");
}

/**
 * Vue3 Office 组件解析失败
 *
 * 四个组件均声明 emits:["rendered","error"]，但错误载荷不一致
 * （pdf 透传异常对象，其余无载荷），故此处只取固定文案。
 */
function onRenderError(): void {
  failReason.value = "文档解析失败";
  emit("error");
}

/** 切换快捷键帮助弹窗 */
function toggleHelp(): void {
  toolbarRef.value?.toggleHelp();
}
defineExpose({ wrapRef, toggleHelp });
</script>

<template>
  <div class="preview-office-panel">
    <PreviewToolbar ref="toolbarRef" v-model:zoom="zoom" @fullscreen="$emit('fullscreen')" />
    <div
      ref="wrapRef"
      class="preview-office-panel__wrap"
      :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
    >
      <div v-if="loading" class="preview-office-panel__mask">
        <span class="preview-office-panel__mask-text">加载中…</span>
      </div>

      <div v-else-if="failReason" class="preview-office-panel__mask">
        <span class="preview-office-panel__mask-text">{{ failReason }}</span>
      </div>

      <VueOfficeDocx
        v-else-if="renderer === 'docx'"
        :src="officeSrc"
        class="preview-office-panel__body"
        @rendered="onRendered"
        @error="onRenderError"
      />
      <VueOfficeExcel
        v-else-if="renderer === 'excel'"
        :src="officeSrc"
        class="preview-office-panel__body"
        @rendered="onRendered"
        @error="onRenderError"
      />
      <VueOfficePdf
        v-else-if="renderer === 'pdf'"
        :src="officeSrc"
        class="preview-office-panel__body"
        @rendered="onRendered"
        @error="onRenderError"
      />
      <VueOfficePptx
        v-else-if="renderer === 'pptx'"
        :src="officeSrc"
        class="preview-office-panel__body"
        @rendered="onRendered"
        @error="onRenderError"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-office-panel {
  width: 100%;
}

.preview-office-panel__wrap {
  position: relative;
  width: 100%;
  min-height: 65vh;
  transition: transform 0.2s ease;
  overflow: visible;
}

.preview-office-panel__body {
  width: 100%;
  min-height: 65vh;
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.preview-office-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 65vh;
}

.preview-office-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

:fullscreen .preview-office-panel__wrap,
:fullscreen .preview-office-panel__body,
:fullscreen .preview-office-panel__mask {
  min-height: 100vh;
  border-radius: 0;
}
</style>
