<template>
  <div>
    <!-- <viewer > -->
    <el-skeleton :loading="loading" animated :count="5" />
    <!-- </viewer> -->
  </div>
</template>
<script>
import "viewerjs/dist/viewer.css";
import { api as viewerApi } from "v-viewer";
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
      src: null,
      loading: true,
      img: []
    };
  },
  mounted() {
    this.loading = true;
    this.src = null;
    const _this = this;
    Object.defineProperty(Image.prototype, "authsrc", {
      writable: true,
      enumerable: true,
      configurable: true
    });

    if (this.url.startsWith("blob")) {
      this.loading = false;
      viewerApi({
        images: [this.url],
        options: {
          backdrop: false,
          inline: true
        }
      });
      return false;
    }

    // window.onload = () => {
    // let img = document.createElement('img');
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
        _this.img.push(URL.createObjectURL(res?.response.data));
        viewerApi({
          images: this.img,
          options: {
            backdrop: false,
            inline: true
          }
        });
      })
      .finally(() => {
        this.loading = false;
      });
    // }
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
    try {
      this.img.forEach(it => {
        URL.revokeObjectURL(it);
      });
    } catch (error) {}
  }
};
</script>
<style lang="scss" scoped>
:global(.viewer-close) {
  display: none;
}
</style>
