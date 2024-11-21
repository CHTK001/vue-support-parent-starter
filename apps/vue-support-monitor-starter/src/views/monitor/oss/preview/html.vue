<template>
  <div style="height: 100%; width: 100%">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <iframe :src="data" frameborder="0" width="100%" height="100%" />
    </div>
  </div>
</template>
<script>
import { http } from "@repo/utils";

export default {
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
      loading: true
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
      this.data = this.url;
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
        this.data = URL.createObjectURL(res?.response.data);
      })
      .finally(() => {
        this.loading = false;
      });
  }
};
</script>
<style lang="scss" scoped>
:global(.viewer-close) {
  display: none;
}
</style>
