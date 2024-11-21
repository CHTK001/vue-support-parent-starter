<template>
  <div>
    <el-dialog
      v-model="visible"
      :title="title"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      width="30%"
      style="height: 30%; border-radius: 10px; overflow: hidden"
      @close="close"
    >
      <div v-loading="loading" class="vesselBox">
        <el-icon v-if="!downloaded" class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 28px)" @click="download">
          <component :is="useRenderIcon('ri:download-2-fill')" />
        </el-icon>
        <div v-else style="position: relative; left: 45%; top: 30%">正在下载....</div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { http } from "@repo/utils";
export default {
  data() {
    return {
      path: null,
      row: null,
      downloaded: false,
      menu: null,
      loading: false,
      mediaType: null,
      visible: false,
      title: "预览",
      name: null,
      data: null
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.data);
    } catch (error) {}
  },
  methods: {
    useRenderIcon,
    setData(path, row, menu, form, fullUrl = false) {
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
      this.path = fullUrl
        ? path
        : form.fileStorageProtocolName.toLowerCase() +
          "://" +
          this.getHost(form) +
          ":" +
          form.fileStorageProtocolPort +
          (menu.fileStorageBucket.startsWith("/") ? menu.fileStorageBucket : "/" + menu.fileStorageBucket) +
          (path.startsWith("/") ? path : "/" + path);
      this.row = row;
      return this;
    },
    getHost(form) {
      const fileStorageProtocolHost = form.fileStorageProtocolHost;
      return "0.0.0.0" == fileStorageProtocolHost ? "127.0.0.1" : fileStorageProtocolHost;
    },
    open(mode = "download") {
      this.visible = !0;
    },
    close() {
      this.visible = false;
      this.$emit("close");
      this.path = null;
      this.row = null;
      this.menu = null;
    },
    download() {
      this.downloaded = true;
      http
        .get(
          this.path + "?download",
          {},
          {
            headers: {
              "X-User-Agent": this.ua,
              "X-Download-User-Agent": this.form.fileStorageProtocolDownloadUa
            },
            responseType: "blob"
          }
        )
        .then(res => {
          this.loading = false;
          this.data = URL.createObjectURL(res);
          const box = document.createElement("a");
          box.download = this.name;
          box.href = this.data;
          box.click();
        })
        .finally(() => {
          this.loading = false;
          this.downloaded = false;
        });
    }
  }
};
</script>
<style scoped>
:deep(.el-dialog__body) {
  height: 100%;
  padding: 0;
}

.el-dialog__body {
  height: 100%;
}

.vesselBox {
  height: 100%;
  top: -10%;
}
</style>
