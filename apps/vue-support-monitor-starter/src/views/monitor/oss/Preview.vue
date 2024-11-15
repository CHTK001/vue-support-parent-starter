<template>
  <div>
    <component :is="plugin[mediaType]" v-if="plugin[mediaType]" style="height: 100%; width: 100%" :name="name" :url="url" :ua="ua" :suffix="mediaType" />
    <div v-else style="position: relative; left: 48%; top: 40%; overflow: hidden">不支持预览</div>
  </div>
</template>
<script>
import { defineAsyncComponent } from "vue";

const ImageViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/image.vue"));
const JsonViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/json.vue"));
const XlsxViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/xlsx.vue"));
const MdViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/md.vue"));
const TxtViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/txt.vue"));
const PdfViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/pdf.vue"));
const VideoViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/video.vue"));
const DocxViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/docx.vue"));
const XmindViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/xmind.vue"));
const CodeViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/code.vue"));
const HtmlViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/html.vue"));
const ZipViewer = defineAsyncComponent(() => import("@/views/monitor/oss/preview/zip.vue"));

export default {
  name: "App",
  props: {
    url: {
      type: String,
      default: ""
    },
    ua: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    mediaType: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      config: {
        size: "default",
        zIndex: 2000,
        button: {
          autoInsertSpace: false
        }
      },
      plugin: {
        image: ImageViewer,
        json: JsonViewer,
        xlsx: XlsxViewer,
        csv: XlsxViewer,
        md: MdViewer,
        pdf: PdfViewer,
        text: TxtViewer,
        plain: TxtViewer,
        txt: TxtViewer,
        video: VideoViewer,
        docx: DocxViewer,
        bat: CodeViewer,
        js: CodeViewer,
        css: CodeViewer,
        java: CodeViewer,
        yml: CodeViewer,
        yaml: CodeViewer,
        ini: CodeViewer,
        json5: CodeViewer,
        less: CodeViewer,
        php: CodeViewer,
        py: CodeViewer,
        python: CodeViewer,
        scss: CodeViewer,
        sh: CodeViewer,
        toml: CodeViewer,
        groovy: CodeViewer,
        http: CodeViewer,
        log: CodeViewer,
        ts: CodeViewer,
        nginx: CodeViewer,
        docker: CodeViewer,
        xml: CodeViewer,
        xmind: XmindViewer,
        html: HtmlViewer,
        zip: ZipViewer
      }
    };
  }
};
</script>
