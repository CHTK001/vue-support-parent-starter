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
      <div v-loading="loading" class="vesselBox">
        <iframe
          v-if="!fullUrl"
          id="bdIframe"
          ref="Iframe"
          :src="'/preview.html?data=' + path + '&mediaType=' + mediaType + '&ua=' + fileStorageProtocolUa + '&name=' + name"
          frameborder="0"
          width="100%"
          height="100%"
          scrolling="no"
          class="bdIframe"
        />
        <preview v-else class="overflow-auto vesselBox1" :url="path" :ua="fileStorageProtocolUa" :name="name" :mediaType="mediaType" />
      </div>
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
      const type = Object.keys(row.mediaType).filter(i => row.mediaType[i]);
      if (type.length == 1) {
        this.mediaType = type[0];
      } else {
        this.mediaType = row.suffix;
      }
      this.fileStorageProtocolUa = fullUrl ? form.fileStorageProtocolUa : Base64.encode(form.fileStorageProtocolUa);
      this.path = fullUrl
        ? path
        : Base64.encode(
            form.fileStorageProtocolName.toLowerCase() +
              "://" +
              this.getHost(form) +
              ":" +
              form.fileStorageProtocolPort +
              (menu.fileStorageBucket.startsWith("/") ? menu.fileStorageBucket : "/" + menu.fileStorageBucket) +
              (path.startsWith("/") ? path : "/" + path)
          );
      this.row = row;
      return this;
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
        if (iframe.attachEvent) {
          // IE
          iframe.attachEvent("onload", () => {
            this.loading = false;
          });
        } else {
          // 非IE
          iframe.onload = () => {
            this.loading = false;
          };
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
