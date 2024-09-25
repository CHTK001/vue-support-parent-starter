<template>
  <div>
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <div v-if="!isBlob">
        <div id="jsmind_container" />
      </div>
      <div v-else>
        <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 64px)" @click="download">
          <component :is="useRenderIcon('ri:download-2-fill')" />
        </el-icon>
      </div>
    </div>
  </div>
</template>
<script>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { http } from "@/utils/http";
import XMindViewer from "@hyjiacan/xmind-viewer";

export default {
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
      data: null,
      loading: true,
      isBlob: false
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
    try {
      URL.revokeObjectURL(this.data);
    } catch (error) {}
  },
  mounted() {
    this.loading = true;
    this.data = null;
    if (this.url.startsWith("blob")) {
      this.loading = false;
      this.isBlob = true;
      return false;
    }
    http
      .get(
        this.url,
        {},
        {
          headers: {
            "X-User-Agent": this.ua
          },
          responseType: "arraybuffer"
        }
      )
      .then(res => {
        this.data = URL.createObjectURL(new Blob([res], { type: "application/octet-stream" }));
        this.loading = false;
        this.$nextTick(() => {
          const container = document.getElementById("jsmind_container");
          XMindViewer.viewer.render(container, res, null, []);
        });
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
      box.href = this.data;
      box.click();
    }
  }
};
</script>
<style lang="scss" scoped></style>
