<template>
  <div style="height: 100%; width: 100%">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <div v-if="!isBlob">
        <MdPreview :editorId="id" :modelValue="data" />
        <MdCatalog :editorId="id" :scrollElement="scrollElement" />
      </div>
      <div v-else style="height: 100%; width: 100%">
        <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 54px)" @click="download">
          <component :is="useRenderIcon('ri:download-2-fill')" />
        </el-icon>
      </div>
    </div>
  </div>
</template>
<script>
import { MdPreview, MdCatalog } from "md-editor-v3";
// preview.css相比style.css少了编辑器那部分样式
import "md-editor-v3/lib/preview.css";
import { http } from "@/utils/http";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  components: {
    MdPreview,
    MdCatalog
  },
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
    }
  },
  data() {
    return {
      scrollElement: document.documentElement,
      data: null,
      id: "preview-only",
      loading: true,
      isBlob: false
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.data);
    } catch (error) {}
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
  },
  mounted() {
    this.loading = true;
    this.data = null;
    const _this = this;
    if (this.url.startsWith("blob")) {
      this.loading = false;
      this.isBlob = true;
      try {
        var xhr = new XMLHttpRequest(); //创建XMLHttpRequest对象
        xhr.open("get", this.url, true); //建立http链接
        xhr.onload = function () {
          if (this.status == 200) {
            _this.isBlob = false;
            _this.data = xhr.response;
          }
        };
        xhr.send();
      } catch (error) {}
      this.loading = false;
      return false;
    }
    http
      .get(
        this.url,
        {},
        {
          headers: {
            "X-User-Agent": this.ua
          }
        }
      )
      .then(res => {
        this.data = res?.response.data;
      })
      .finally(() => {
        this.loading = false;
      });
  },
  methods: {
    useRenderIcon,
    download() {
      const box = document.createElement("a");
      box.download = this.name;
      box.href = this.url;
      box.click();
    }
  }
};
</script>
<style lang="scss" scoped>
:global(.viewer-close) {
  display: none;
}
</style>
