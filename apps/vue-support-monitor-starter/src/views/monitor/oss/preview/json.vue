<template>
  <div style="height: 100%; width: 100%">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!isBlob">
      <vue-json-pretty v-if="!loading" :data="data" :showLineNumber="true" :showIcon="true" :showLength="true" />
    </div>
    <div v-else style="height: 100%; width: 100%">
      <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 64px)" @click="download">
        <component :is="useRenderIcon('ri:download-2-fill')" />
      </el-icon>
    </div>
  </div>
</template>
<script>
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { http } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default {
  components: {
    VueJsonPretty
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
            const res = xhr.response;
            try {
              _this.data = JSON.parse(res);
            } catch (error) {
              _this.data = res;
            }
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
        try {
          this.data = JSON.parse(res);
        } catch (error) {
          this.data = res;
        }
      })
      .finally(() => {
        this.loading = false;
      });
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
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
