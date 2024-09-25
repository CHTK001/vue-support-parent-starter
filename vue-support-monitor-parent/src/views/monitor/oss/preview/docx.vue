<template>
  <div style="height: 100%; width: 100%">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <div v-if="!isBlob">
        <vue-office-docx :src="data" />
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
//引入VueOfficeDocx组件
import VueOfficeDocx from "@vue-office/docx";
//引入相关样式
import "@vue-office/docx/lib/index.css";
export default {
  components: {
    VueOfficeDocx
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
      data: null,
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
    if (this.url.startsWith("blob")) {
      this.isBlob = true;
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
          },
          responseType: "blob"
        }
      )
      .then(res => {
        this.data = URL.createObjectURL(res);
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
<style lang="less" scoped>
:deep(.docx-wrapper .docx_3),
:deep(.docx-wrapper .docx) {
  width: 100% !important;
  padding: 0 !important;
}
:deep(.docx-wrapper) {
  background-color: #fff;
  padding: 0;
}
</style>
