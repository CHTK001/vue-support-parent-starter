<template>
  <el-config-provider :locale="locale" :size="config.size" :zIndex="config.zIndex" :button="config.button">
    <component :is="plugin[mediaType1]" v-if="plugin[mediaType1]" style="height: 100%; width: 100%" :name="name1" :url="url1" :ua="ua1" :suffix="mediaType1" />
    <div v-else style="position: relative; left: 48%; top: 40%; overflow: hidden; display: inline-block">不支持预览</div>
  </el-config-provider>
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
import colorTool from "@/utils/color";
import { Base64 } from "js-base64";

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
      },
      url1: "",
      ua1: "",
      mediaType1: "",
      name1: ""
    };
  },
  computed: {
    locale() {
      return "zh";
    }
  },
  mounted() {
    this.url1 = Base64.decode(this.getQueryString("data")) || this.url;
    this.ua1 = Base64.decode(this.getQueryString("ua")) || this.ua;
    this.mediaType1 = this.getQueryString("mediaType") || this.mediaType;
    this.name1 = this.getQueryString("name") || this.name;
  },
  methods: {
    getQueryString(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
      var r = ((window.location.hash && window.location.hash.indexOf("?") > -1 ? window.location.hash.substring(window.location.hash.indexOf("?")) : "") || window.location.search)
        .substr(1)
        .match(reg);
      if (r != null) return unescape(decodeURIComponent(r[2]));
      return null;
    }
  }
};
</script>
