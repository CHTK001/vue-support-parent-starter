<template>
  <div style="height: 100%; width: 100%">
    <el-skeleton :loading="loading" animated :count="5" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <div v-if="!isBlob">
        <vue-office-pdf :src="data" />
      </div>
      <div v-else style="height: 100%; width: 100%">
        <iframe :src="url" frameborder="0" width="100%" height="100%" />
      </div>
    </div>
  </div>
</template>
<script>
import { http } from "@/utils/http";
import VueOfficePdf from "@vue-office/pdf";
export default {
  components: {
    VueOfficePdf
  },
  props: {
    url: {
      type: String,
      default: ""
    },
    ua: {
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
          responseType: "blob"
        }
      )
      .then(res => {
        this.data = URL.createObjectURL(res);
      })
      .finally(() => {
        this.loading = false;
      });
  }
};
</script>
<style lang="less" scoped>
:deep(.vue-office-pdf) {
  background-color: #fff;
}
:deep(.vue-office-pdf-wrapper) {
  padding: 0 !important;
}
canvas,
:deep(canvas) {
  width: 100% !important;
}
</style>
