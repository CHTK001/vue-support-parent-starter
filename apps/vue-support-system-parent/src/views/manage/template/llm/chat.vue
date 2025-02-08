el-button
<template>
  <div class="animate relative h-full">
    <div>
      <ul class="h-full overflow-auto max-h-[600px]">
        <li v-for="(row, index) in dataList" :key="index">
          <div class="big-model border-radius mt-[4px]" shadow="hover">
            <div v-if="row.role != 'user'" class="flex flex-row w-3/4 chat-left">
              <el-avatar class="justify-start min-w-[40px]" />
              <span :id="'ref' + row?.uid" class="leading-10 pl-2 text-[13px] w-full flex">
                <span class="mdTextBox w-full" v-html="renderMdText(row.message)" />
                <!-- <span v-for="(item, index) in row.message" :key="index">{{ item }}</span> -->
              </span>
            </div>
            <div v-else>
              <div class="flex flex-row">
                <div class="w-1/4"></div>
                <div class="w-3/4 flex flex-row justify-end el-card chat-right">
                  <span class="leading-10 pr-2 text-[13px]">
                    {{ row.message }}
                    <el-icon v-copy:click="row.message" class="cursor-pointer">
                      <component :is="useRenderIcon('ep:copy-document')"></component>
                    </el-icon>
                  </span>
                  <el-avatar class="justify-start min-w-[40px]" :src="useUserStoreHook()?.avatar" />
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <el-button
      class="absolute bottom-[100px]"
      :icon="useRenderIcon('ep:delete')"
      @click="
        () => {
          dataList.length = 0;
        }
      "
      >{{ $t("button.clearHistory") }}</el-button
    >
    <div class="absolute bottom-0 w-full">
      <el-input v-model="question" type="textarea" :readonly="loading" :disabled="loading" :rows="4" resize="none" :show-word-limit="true" placeholder="请输入问题" />
      <el-button :icon="useRenderIcon('ep:search')" :loading="loading" class="!absolute !right-0 !h-full" type="primary" @click="send">{{ $t("buttons.send") }}</el-button>
    </div>
  </div>
</template>
<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchCallStream } from "@repo/core";
import { message, uuid } from "@repo/utils";
import TypeIt from "typeit";
import { defineComponent } from "vue";
import { useUserStoreHook } from "@repo/core";
import mdKatex from "@traptitech/markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import MarkdownIt from "markdown-it";

export default defineComponent({
  components: {},
  props: {
    form: { type: Object, default: () => {} },
    env: { type: Object, default: () => {} },
  },
  data() {
    return {
      loading: false,
      seq: 0,
      dataList: [],
      question: "用java代码写一首关于月亮的诗句",
      models: [],
      visible: false,
      request: null,
      speed: 300,
      markdownRender: null,
    };
  },
  computed: {
    dText() {
      return this.currentItem.message || "";
    },
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
        const validLang = !!(options && hljs.getLanguage(options?.language || options));
        if (validLang) {
          const lang = options?.language || options || "";
          return _this.highlightBlock(hljs.highlight(lang, code, true).value, lang);
        }
        return _this.highlightBlock(hljs.highlightAuto(code).value, "");
      },
    });
    this.markdownRender.use(mdKatex, { blockClass: "katexmath-block rounded-md p-[10px]", errorColor: " #cc0000" });
    window.addEventListener("keydown", this.keydown);
  },
  methods: {
    useRenderIcon,
    useUserStoreHook,
    highlightBlock(str, lang) {
      lang = lang || "text";
      // return `<pre class="pre-code-box">
      //       <div class="pre-code-header"
      //       style = "
      //           background-color: #50505a;
      //           padding: 0.2rem;
      //           padding-left: 1rem;
      //           color: white;
      //           font-size: 1rem;
      //           border-top-left-radius: 10px;
      //           border-top-right-radius: 10px;
      //       "><span class="code-block-header__lang">${lang}</span></div><div class="pre-code"><code class="hljs code-block-body ${lang}" style="padding:1.5rem; font-size: 1.05rem;border-bottom-left-radius: 10px;border-bottom-right-radius: 10px;" >${str}</code></div></pre>`;
      return `<pre class="pre-code-box">
            <div class="pre-code-header"
            style = "
                width: auto;
                background-color: #50505a;
                padding: 0.2rem;
                padding-left: 1rem;
                color: white;
                font-size: 1rem;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
            "><span class="code-block-header__lang">${lang}</span></div><div class="pre-code"><code class="hljs code-block-body ${lang}" style="line-height:1.6;font-size: 12px;border-bottom-left-radius: 10px;border-bottom-right-radius: 10px;" >${str}</code></div></pre>`;
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
      if (!this.form.model) {
        message("请选择模型", { type: "error" });
        return;
      }
      if (!this.form.temperature) {
        message("请选择随机性", { type: "error" });
        return;
      }
      if (!this.form.topK) {
        message("请选择灵活度", { type: "error" });
        return;
      }
      if (!this.form.tokens) {
        message("请选择回复长度限制", { type: "error" });
        return;
      }
      this.loading = true;
      const requestId = this.form.sysProjectId;
      const uuid1 = uuid().replaceAll("-", "");
      this.dataList.push({
        requestId: requestId,
        uid: uuid1,
        role: "user",
        message: this.question,
      });
      if (this.request) {
        this.request?.close();
        this.request = null;
      }

      const system = {
        requestId: requestId,
        uid: uuid1,
        role: "assistant",
        message: "",
      };
      this.dataList.push(system);
      this.$nextTick(() => {
        var typeIf = new TypeIt("#ref" + uuid1, {
          speed: 1000,
          startDelay: 0,
          loop: true,
        });
        typeIf.type("...").go();
        this.request = new EventSource(
          fetchCallStream({
            requestId: requestId,
            model: this.form.model,
            user: this.question,
            temperature: this.form.temperature,
            topK: this.form.topK,
            tokens: this.form.tokens,
          })
        );
        this.question = null;
        const code = [];
        var index = 0;
        this.request.onerror = (event) => {
          this.request?.close();
          typeIf?.destroy();
          this.currentItem = {};
          this.loading = false;
          this.question = null;
          let _typeIf = new TypeIt("#ref" + uuid1, {
            speed: 50,
            startDelay: 0,
          });
          _typeIf.type("系统繁忙, 请稍后重试!").go();
          _typeIf?.destroy();
        };
        this.request.onmessage = (event) => {
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
            typeIf.empty();
            typeIf.updateOptions({
              speed: 50,
              loop: false,
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
  },
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
.chat {
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 10px;
  padding-bottom: 10px;
}
.ai-img {
  height: 36px;
  width: 36px;
}
.pre-code-box {
  width: 100%;
}
.chat-left {
  background-color: #f5f6f7 !important;
  box-sizing: border-box;
  text-align: left;
  border-radius: 12px;
  line-height: 24px;
  max-width: 100%;
  padding: 12px 16px;
  white-space: pre-wrap;
}
.chat-right {
  background-color: #e0dfff;
  box-sizing: border-box;
  box-shadow: 0px 7px 30px 0px rgba(100, 100, 111, 0.2);
  color: #3f3f3f;
  border-radius: 12px;
  line-height: 24px;
  max-width: 100%;
  padding: 12px 16px;
  white-space: pre-wrap;
}
</style>
