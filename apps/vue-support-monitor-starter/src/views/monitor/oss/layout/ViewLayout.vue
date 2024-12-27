<template>
  <div>
    <el-dialog
      v-model="visible"
      top="2%"
      :title="title"
      :destroy-on-close="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      width="80%"
      style="height: 80%; border-radius: 10px; overflow: hidden"
      @close="close"
    >
      <el-skeleton :loading="loading" />
      <iframe
        v-if="!fullUrl"
        id="bdIframe"
        ref="Iframe"
        class="h-full w-full bdIframe"
        :src="url + '?data=' + path + '&mediaType=' + mediaType + '&ua=' + fileStorageProtocolUa + '&name=' + name"
        frameborder="0"
        width="100%"
        height="100%"
        scrolling="no"
      />
      <preview v-else class="overflow-auto vesselBox1" :url="path" :ua="fileStorageProtocolUa" :name="name" :mediaType="mediaType" />
    </el-dialog>
  </div>
</template>

<script>
import { Base64 } from "js-base64";
import Preview from "../Preview.vue";
export default {
  components: {
    Preview
  },
  data() {
    return {
      url: null,
      path: null,
      row: null,
      menu: null,
      loading: false,
      mediaType: null,
      visible: false,
      title: "预览",
      name: null,
      fullUrl: false,
      fileStorageProtocolUa: null
    };
  },
  mounted() {},
  methods: {
    setData(path, row, menu, form, fullUrl = false) {
      this.fullUrl = fullUrl;
      this.form = form;
      this.menu = menu;
      this.name = row.filename;
      //fileStorageBucket
      this.title = row.filename;
      this.row = row;
      this.url = (location.origin + (location.pathname === "/" ? "/index.html" : location.pathname)).replaceAll("index.html", "preview.html");

      const type = Object.keys(row.mediaType).filter(i => row.mediaType[i]);
      if (type.length == 1) {
        this.mediaType = type[0];
      } else {
        this.mediaType = row.mediaType?.image ? "image" : row.suffix;
      }
      this.fileStorageProtocolUa = fullUrl ? form.fileStorageProtocolUa : Base64.encode(form.fileStorageProtocolUa);
      let originUrl =
        form.fileStorageProtocolName.toLowerCase() +
        "://" +
        this.getHost(form) +
        ":" +
        form.fileStorageProtocolPort +
        (menu.fileStorageBucket.startsWith("/") ? menu.fileStorageBucket : "/" + menu.fileStorageBucket) +
        (path.startsWith("/") ? path : "/" + path);
      if (this.isServerRender(row)) {
        originUrl = this.serverRenderUrl(row, originUrl);
      }
      this.path = fullUrl ? path : Base64.encode(originUrl);
      return this;
    },
    isServerRender(row) {
      if (
        row.suffix === "xlsx" ||
        row.suffix === "xls" ||
        row.suffix === "csv" ||
        row.suffix === "doc" ||
        row.suffix === "docx" ||
        row.suffix === "avif" ||
        row.suffix === "heic" ||
        row.suffix === "tiff" ||
        row.suffix === "tif" ||
        row.suffix === "md" ||
        row.suffix === "zip" ||
        row.suffix === "tar" ||
        row.suffix === "jar" ||
        row.suffix === "class" ||
        row.suffix === "dcm" ||
        row.suffix === "vsdx" ||
        row.suffix === "eml" ||
        row.suffix === "wps" ||
        row.suffix === "pdf" ||
        row.suffix === "ofd"
      ) {
        this.mediaType = "html";
        return true;
      }
      return false;
    },
    serverRenderUrl(row, originUrl) {
      if (row.suffix === "eml") {
        return originUrl + "?preview/format/pdf/can/html";
      }
      if (row.suffix === "doc" || row.suffix === "docx" || row.suffix === "wps" || row.suffix === "vsdx") {
        return originUrl + "?preview/format/pdf/can/html";
      }
      return originUrl + "?preview/can/html";
    },
    getHost(form) {
      const fileStorageProtocolHost = form.fileStorageProtocolHost;
      return "0.0.0.0" == fileStorageProtocolHost ? "127.0.0.1" : fileStorageProtocolHost;
    },
    open(mode = "preview") {
      this.visible = !0;
      if (this.fullUrl) {
        return;
      }
      this.iframeLoad();
    },
    close() {
      this.visible = false;
      this.$emit("close");
      this.path = null;
      this.row = null;
      this.menu = null;
    },
    // 调用方法
    iframeLoad() {
      this.loading = true;
      this.$nextTick(() => {
        const iframe = this.$refs.Iframe;
        // 兼容处理
        if (iframe?.attachEvent) {
          // IE
          iframe.attachEvent("onload", () => {
            this.loading = false;
          });
        } else {
          // 非IE
          if (iframe) {
            iframe.onload = () => {
              this.loading = false;
            };
          }
        }
      });
    }
  }
};
</script>
<style scoped>
iframe {
  overflow: hidden;
}
:deep(.el-dialog__body) {
  height: 100%;
  padding: 0;
}

.bdIframe {
  overflow-y: auto;
  overflow-x: hidden;
}

.el-dialog__body {
  height: 100%;
}
:deep(.el-dialog__body) {
  height: calc(100% - 54px);
}
.vesselBox {
  height: calc(100% - 0px);
  top: -10%;
  width: 100%;
}
.vesselBox1 {
  height: calc(100% - 0px);
  overflow: hidden;
  width: 100%;
}
</style>
