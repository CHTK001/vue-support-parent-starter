<template>
  <div style="height: 100%; width: 100%; overflow: auto">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!loading" style="height: 100%; width: 100%">
      <div v-if="!isBlob">
        <pre ref="code" style="height: 100%; width: 100%" :class="'language-' + suffix + ' line-numbers inline-color highlight-keywords show-language'">
<code :class="getLanguage() + ' line-numbers inline-color highlight-keywords show-language download-button data-uri-highlight'">{{ data }} </code>
                 </pre>
      </div>
      <div v-else style="height: 100%; width: 100%">
        <!-- <a :href="url" download="file" class="download-button"> -->
        <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 54px)" @click="download">
          <component :is="useRenderIcon('ri:download-2-fill')" />
        </el-icon>
        <!-- </a> -->
      </div>
    </div>
  </div>
</template>
<script>
import { http } from "@/utils/http";

// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/components/prism-css.min.js";
import "prismjs/components/prism-javascript.min.js";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-ini.min.js";
import "prismjs/components/prism-json5.min.js";
import "prismjs/components/prism-less.min.js";
import "prismjs/components/prism-php.min.js";
import "prismjs/components/prism-yaml.min.js";
import "prismjs/components/prism-scss.min.js";
import "prismjs/components/prism-toml.min.js";
import "prismjs/components/prism-groovy.min.js";
import "prismjs/components/prism-http.min.js";
import "prismjs/components/prism-log.min.js";
import "prismjs/components/prism-typescript.min.js";
import "prismjs/components/prism-nginx.min.js";
import "prismjs/components/prism-docker.min.js";
import "prismjs/components/prism-markup.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import vkbeautify from "vkbeautify";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  props: {
    url: {
      type: String,
      default: ""
    },
    suffix: {
      type: String,
      default: ""
    },
    name: {
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
      URL.revokeObjectURL(this.url);
    } catch (error) {}
  },
  mounted() {
    this.loading = true;
    this.data = null;
    const _this = this;
    Prism.highlightAll();
    if (this.url.startsWith("blob")) {
      this.isBlob = true;
      try {
        var xhr = new XMLHttpRequest(); //创建XMLHttpRequest对象
        xhr.open("get", this.url, true); //建立http链接
        xhr.onload = function () {
          this.loading = false;
          if (this.status == 200) {
            _this.isBlob = false;
            _this.data = this.response;
            if (_this.suffix == "xml") {
              _this.data = vkbeautify.xml(res);
            }
            // 假设你的SQL代码在模板的pre标签中
            _this.$nextTick(() => {
              Prism.highlightAll();
              const pre = _this.$refs.code;
              // 使用Prism.highlightElement来高亮代码
              try {
                Prism.highlightElement(pre);
              } catch (error) {}
            });
            Prism.highlightAll();
          }
        };
        xhr.send();
      } catch (error) {
        this.isBlob = true;
      }
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
        this.loading = false;
        this.data = res;
        if (this.suffix == "xml") {
          this.data = vkbeautify.xml(res);
        }
        // 假设你的SQL代码在模板的pre标签中
        this.$nextTick(() => {
          Prism.highlightAll();
          const pre = _this.$refs.code;
          // 使用Prism.highlightElement来高亮代码
          try {
            Prism.highlightElement(pre);
          } catch (error) {}
        });
        Prism.highlightAll();
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
    },
    getLanguage() {
      var s = this.suffix;
      if (this.suffix == "xml") {
        s = "markup";
      } else if (s == "bat") {
        s = "bash";
      }
      return "language-" + s;
    }
  }
};
</script>
<style lang="scss" scoped>
:deep(.prolog) {
  padding: 0;
}
</style>
