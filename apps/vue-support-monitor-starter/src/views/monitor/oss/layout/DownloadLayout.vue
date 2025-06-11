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
      <el-skeleton animated :loading="loading">
        <template #default>
          <el-icon v-if="!downloaded" class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 28px)" @click="download">
            <component :is="useRenderIcon('ri:download-2-fill')" />
          </el-icon>
          <div v-else style="position: relative; left: 45%; top: 30%">正在下载....</div>
        </template>
      </el-skeleton>
    </el-dialog>
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
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
      name: null
    };
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
      try {
        // 直接创建a标签下载文件
        const downloadUrl = this.path + "?download";
        const box = document.createElement("a");
        box.download = this.name;
        box.href = downloadUrl;
        box.target = "_blank";
        
        // 如果需要添加下载用户代理头信息，可以考虑使用其他下载方式
        // 但直接使用a标签无法设置自定义请求头
        
        box.click();
        
        // 短暂延迟后关闭下载对话框
        setTimeout(() => {
          this.downloaded = false;
          this.close();
        }, 1000);
      } catch (error) {
        console.error("下载失败:", error);
        this.downloaded = false;
      }
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
