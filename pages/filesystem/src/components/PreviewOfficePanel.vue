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
import { isCorruptOfficeFile, officeRendererOfSniffed, RENDER_SERVER, type OfficeRenderer } from "../utils/officeRenderer";

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
  /**
   * 加载或解析失败
   *
   * @param payload `noFallback=true` 表示**不要再退回服务端渲染**
   *                （内容损坏，或服务端既没有渲染器也没有转换器）；
   *                `channel` 告诉父组件该用哪条兜底通道（`server` / `pdf`）；
   *                `reason` 是给用户看的中文文案
   */
  error: [payload?: { noFallback?: boolean; reason?: string; channel?: "server" | "pdf" }];
}>();

/** wrap 容器 DOM 引用 */
const wrapRef = ref<HTMLDivElement>();

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
    // 不带 credentials：数据源是独立 origin（如 http://host:18080），鉴权由 URL 上的
    // x-oauth-token 与请求头承担，不依赖 cookie。一旦写 credentials:"include"，
    // 浏览器会强制要求响应带 Access-Control-Allow-Credentials: true，
    // 而存储服务不返回该头 → 请求直接被 CORS 拦掉（预览整条链路失败）。
    const res = await fetch(props.src);
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
    const bytes = new Uint8Array(buffer.value);
    if (!officeRendererOfSniffed(props.fileName, bytes)) {
      // 客户端组件吃不下这个文件，先判断是「内容坏了」还是「格式不支持」
      const corrupt = isCorruptOfficeFile(props.fileName, bytes);
      if (corrupt) {
        // 措辞要覆盖「加密」：实测本机 D:\施工图文件 下的 .dwg/.doc 都被
        // 360 防泄密透明加密（4 个不同类型文件共用同一 16 字节密文头），
        // 那种情况下「重新上传」是无用的动作，只会让用户反复试。
        failReason.value = `文件不是有效的 ${props.fileName.split(".").pop()?.toUpperCase()} 容器：`
          + "可能已损坏，也可能被文档防泄密软件透明加密（磁盘上是密文，只有授权终端能解密）。"
          + "若是加密文件，重新上传也没用，请提供未加密的副本";
        // 内容损坏时退回服务端毫无意义（服务端拿到的是同一堆坏字节），
        // 只会把面板自己的中文提示顶掉，换成一个空白的服务端渲染页。
        emit("error", { noFallback: true, reason: failReason.value });
        return;
      }
      // 格式不支持：确认服务端到底能不能渲染/转换。
      // 有些扩展名（实测 OLE2 的 .xls）服务端没有 HTML 渲染器，`render=server`
      // 会原样吐回二进制、不带任何 channel 头——直接丢给 iframe 只会得到一屏乱码
      // 或一个意料之外的下载。
      //
      // 退路有两条，按优先级：
      //   ① 服务端有该格式的 HTML 渲染器（channel=spi）→ 走 iframe；
      //   ② 没有 HTML 渲染器，但有 Office→PDF 转换器（Aspose SPI）
      //      → 让父组件用 ?format=pdf 直接把 PDF 交给浏览器内置阅读器。
      const fallback = await probeFallback();
      if (fallback === "server") {
        failReason.value = "该文件需由服务端渲染";
        emit("error", { noFallback: false, reason: failReason.value, channel: "server" });
      } else if (fallback === "pdf") {
        failReason.value = "该文件需由服务端转换为 PDF 后预览";
        emit("error", { noFallback: false, reason: failReason.value, channel: "pdf" });
      } else {
        failReason.value = `该格式暂不支持在线预览（${props.fileName}），请下载后用本地软件打开`;
        emit("error", { noFallback: true, reason: failReason.value });
      }
    }
  } catch (e) {
    // JSZip / PDF 解析库抛的是英文原始异常（如 "Can't find end of central directory"），
    // 直达界面对用户无意义。统一收敛为中文文案，具体原因见控制台。
    console.warn("[PreviewOfficePanel] 文档加载失败", e);
    failReason.value = `文档加载失败（${props.fileName}），可尝试下载后用本地软件打开`;
    emit("error");
  } finally {
    loading.value = false;
  }
}

/**
 * 探测服务端能为该文件提供哪种兜底通道
 *
 * <p>按优先级探测：</p>
 * <ol>
 *   <li>{@code render=server} 返回 {@code X-FileStorage-Preview: spi} → 服务端有
 *       HTML 渲染器，返回 {@code "server"}</li>
 *   <li>{@code format=pdf} 返回 {@code X-FileStorage-Convert: pdf}
 *       → 服务端有 Office→PDF 转换器（Aspose），返回 {@code "pdf"}</li>
 *   <li>都没有 → {@code null}</li>
 * </ol>
 *
 * <p>必须看响应头而不是只看状态码：转不成功时服务端**不报错**，而是带
 * {@code X-FileStorage-Convert: unavailable} 继续走原通道并返回原始字节，
 * 只看状态码会把 Office 二进制当成 PDF 交给读取器。</p>
 *
 * <p>探测失败（网络/超时）按「都没有」处理：宁可给一句可执行的提示，
 * 也不要让用户看到一屏乱码。</p>
 *
 * @returns 可用通道；都没有返回 null
 */
async function probeFallback(): Promise<"server" | "pdf" | null> {
  const sep = props.src.includes("?") ? "&" : "?";
  // 顺序：先试 Office→PDF 转换，再试服务端 HTML 渲染。
  // 产品口径是「客户端能显示就用客户端，报错才转 PDF」——所以兜底时
  // PDF 优先：转换出来的文档与原样一致，比服务端拼的 HTML 预览页更可靠。
  try {
    const res = await fetch(`${props.src}${sep}format=pdf`, { method: "GET" });
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      // 同时看响应头与内容类型：`X-FileStorage-Convert` 说明服务端真转换了；
      // 内容类型兜底，防止中间代理改写响应头。
      // 只看状态码不行——转换失败时服务端仍返回 200，靠这个头区分。
      if (res.headers.get("X-FileStorage-Convert") === "pdf" || ct.startsWith("application/pdf")) {
        return "pdf";
      }
    }
  } catch {
    // 继续探测下一条通道
  }
  try {
    const res = await fetch(`${props.src}${sep}render=${RENDER_SERVER}`, { method: "GET" });
    if (res.ok && res.headers.get("X-FileStorage-Preview") === "spi") {
      return "server";
    }
  } catch {
    // 都没有
  }
  return null;
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
/**
 * 客户端组件解析失败后的兜底
 *
 * <p>产品口径：客户端能显示就用客户端，报错才转。所以这里不是无条件退回
 * 服务端渲染，而是先探测兜底通道（PDF 优先），由结果决定去向：</p>
 * <ul>
 *   <li>有转换器 → 让父组件用 {@code ?format=pdf} 交给浏览器内置 PDF 阅读器</li>
 *   <li>只有 HTML 渲染器 → 退回 {@code render=server}</li>
 *   <li>都没有 → 面板自己给一句可执行的中文提示，不再切换通道</li>
 * </ul>
 */
async function fallbackAfterClientError(): Promise<void> {
  loading.value = true;
  let fallback: "server" | "pdf" | null = null;
  try {
    fallback = await probeFallback();
  } finally {
    loading.value = false;
  }
  if (fallback === "pdf") {
    failReason.value = "客户端解析失败，已改用 PDF 预览";
    emit("error", { noFallback: false, reason: failReason.value, channel: "pdf" });
    return;
  }
  if (fallback === "server") {
    failReason.value = "该文件需由服务端渲染";
    emit("error", { noFallback: false, reason: failReason.value, channel: "server" });
    return;
  }
  failReason.value = `文档解析失败（${props.fileName}），可尝试下载后用本地软件打开`;
  emit("error", { noFallback: true, reason: failReason.value });
}

/**
 * Vue3 Office 组件解析失败
 *
 * <p>四个组件的错误载荷不一致（pdf 透传异常对象，其余无载荷），故此处不取载荷，
 * 统一交给 {@link fallbackAfterClientError} 按兜底通道决定去向。</p>
 */
function onRenderError(): void {
  void fallbackAfterClientError();
}

defineExpose({ wrapRef });
</script>

<template>
  <div class="preview-office-panel">
    <!-- 不再对 wrap 做 transform: scale()：那会连同遮罩与边框一起缩放，
         表现为「缩放时整个弹框都在动」。缩放工具条已按产品要求移除。 -->
    <div ref="wrapRef" class="preview-office-panel__wrap">
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
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
  overflow: visible;
}

.preview-office-panel__body {
  width: 100%;
  min-height: 65vh;
  border-radius: var(--el-radius-md, 8px);
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

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .preview-office-panel__wrap {
    transition: none;
  }
}
</style>
