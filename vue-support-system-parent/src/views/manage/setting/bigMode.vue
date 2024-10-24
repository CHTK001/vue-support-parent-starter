<template>
  <div class="animate relative h-full">
    <el-form :form="form">
      <el-form-item label="模型" prop="model">
        <el-select v-model="form.model">
          <el-option v-for="model in models" :key="model" :value="model" :label="model" />
        </el-select>
      </el-form-item>
    </el-form>
    <div>
      <ul class="h-full overflow-auto max-h-[600px]">
        <li v-for="(row, index) in dataList" :key="index">
          <el-card class="big-model border-radius mt-[4px]" shadow="hover">
            <div v-if="row.role != 'user'" class="flex flex-row">
              <el-avatar class="justify-start min-w-[40px]" />
              <span :id="'ref' + row?.requestId" class="leading-10 pl-2 text-[13px] w-full">
                <span class="mdTextBox w-full" v-html="renderMdText(row.message)" />
                <!-- <span v-for="(item, index) in row.message" :key="index">{{ item }}</span> -->
              </span>
            </div>
            <div v-else class="flex flex-row justify-end">
              <span class="leading-10 pr-2 text-[13px]">
                {{ row.message }}
              </span>
              <el-avatar class="justify-start min-w-[40px]" />
            </div>
          </el-card>
        </li>
      </ul>
    </div>
    <div class="absolute bottom-0 w-full">
      <el-input v-model="question" type="textarea" :readonly="loading" :disabled="loading" :rows="4" resize="none" :show-word-limit="true" placeholder="请输入问题" />
      <el-button :icon="useRenderIcon('ep:search')" :loading="loading" class="!absolute !right-0 !h-full" type="primary" @click="send">{{ $t("buttons.send") }}</el-button>
    </div>
  </div>
</template>
<script>
import { fetchListModel, fetchCallStream } from "@/api/manage/bigModel";
import { defineComponent } from "vue";
import { uuid } from "@/utils/objects";
import { message } from "@/utils/message";
import TypeIt from "typeit";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import MarkdownIt from "markdown-it";
import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

export default defineComponent({
  components: {},
  data() {
    return {
      loading: false,
      seq: 0,
      dataList: [],
      question: "用java写一首关于月亮的诗句",
      models: [],
      visible: false,
      request: null,
      speed: 300,
      form: {
        model: null
      },
      markdownRender: null
    };
  },
  computed: {
    dText() {
      return this.currentItem.message || "";
    }
  },
  unmounted() {
    this.loading = false;
    try {
      this.request?.close();
    } catch (error) {}
    window.removeEventListener("keydown", this.keydown);
    // window.removeEventListener("DOMContentLoaded", this.highlight);
  },
  mounted() {
    const _this = this;
    this.markdownRender = new MarkdownIt({
      linkify: true,
      highlight(code, options) {
        const validLang = !!(options && hljs.getLanguage(options?.language));
        if (validLang) {
          const lang = options?.language ?? "";
          return _this.highlightBlock(hljs.highlight(lang, code, true).value, lang);
        }
        return _this.highlightBlock(hljs.highlightAuto(code).value, "");
      }
    });
    this.markdownRender.use(mdKatex, { blockClass: "katexmath-block rounded-md p-[10px]", errorColor: " #cc0000" });
    window.addEventListener("keydown", this.keydown);
    // 使用highlight.js自动识别语言
    // window.addEventListener("DOMContentLoaded", this.highlight);
    this.afterPropertiesSet();
  },
  methods: {
    useRenderIcon,
    highlightBlock(str, lang) {
      lang = lang || "text";
      return `<pre class="pre-code-box">
            <div class="pre-code-header"
            style = "
                background-color: #50505a;
                padding: 0.2rem;
                padding-left: 1rem;
                color: white;
                font-size: 1rem;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
            "><span class="code-block-header__lang">${lang}</span></div><div class="pre-code"><code class="hljs code-block-body ${lang}" style="padding:1.5rem; font-size: 1.05rem;border-bottom-left-radius: 10px;border-bottom-right-radius: 10px;" >${str}</code></div></pre>`;
    },
    keydown(e) {
      if (e.keyCode === 13 && !this.loading) {
        this.send();
        return;
      }
    },
    renderMdText(message) {
      //生成html
      return this.markdownRender.render(message || "");
    },
    send() {
      if (!this.question) {
        message("请输入问题", { type: "error" });
        return;
      }
      this.loading = true;
      const requestId = uuid();
      this.dataList.push({
        requestId: requestId,
        role: "user",
        message: this.question
      });
      if (this.request) {
        this.request?.close();
        this.request = null;
      }

      const system = {
        requestId: requestId,
        role: "assistant",
        message: ""
      };
      this.dataList.push(system);
      this.$nextTick(() => {
        var typeIf = new TypeIt("#ref" + requestId, {
          speed: 1000,
          startDelay: 0,
          loop: true
        });
        typeIf.type("...").go();
        this.request = new EventSource(
          fetchCallStream({
            requestId: requestId,
            model: this.form.model,
            user: this.question
          })
        );
        this.question = null;
        const code = [];
        var index = 0;
        this.request.onmessage = event => {
          const item = JSON.parse(event?.data || "{}");
          if (item?.state == "DONE") {
            typeIf.go();
            this.request?.close();
            this.currentItem = {};
            this.loading = false;
            this.question = null;
            typeIf?.destroy();
            return;
          }
          if (item?.state == "START") {
            typeIf.reset();
            typeIf.updateOptions({
              speed: 50,
              loop: false
            });
            return;
          }

          if (item.output.indexOf("```") > -1) {
            code.push(item.output);
            index++;
          } else {
            if (index == 1) {
              code.push(item.output);
            }
          }

          if (index == 2) {
            typeIf = typeIf.type(this.renderMdText(code.join("")));
            code.length = 0;
            index = 0;
          } else if (index == 1) {
          } else {
            typeIf = typeIf.type(item.output);
          }
        };
      });
    },
    afterPropertiesSet() {
      this.initializeModels();
    },
    initializeModels() {
      fetchListModel().then(res => {
        this.models = res.data;
        this.form.model = this.models?.[0];
      });
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    open() {
      this.visible = true;
    }
  }
});
</script>
<style scoped lang="scss">
@import "highlight.js/styles/github.css";

:deep(.big-model .el-card__body) {
  padding: 5px;
}
.border-radius {
  border-radius: 10px;
}
</style>
