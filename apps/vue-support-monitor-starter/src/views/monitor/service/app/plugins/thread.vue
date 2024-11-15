<template>
  <el-dialog v-model="visiable" width="70%" draggable :title="title" :close-on-click-modal="false" @close="close">
    <div style="height: 600px; overflow: auto">
      <el-skeleton v-if="loading" :loading="loading" animated />
      <div v-else>
        <el-empty v-if="!data || data.length == 0" />
        <el-row v-for="(item, i) in data" v-else :key="i">
          <el-col class="env" :span="24">
            <div class="card panel">
              <header class="card-header panel__header--sticky" style="top: 0px; position: sticky; z-index: 9999">
                <p class="card-header-title">
                  <span>
                    <el-icon :style="{ color: item.threadState === 'RUNNABLE' ? 'green' : 'gray', fontSize: '18px', top: '5px' }">
                      <component :is="useRenderIcon('ep:caret-right')" v-if="item.threadState === 'RUNNABLE'" />
                      <component :is="useRenderIcon('ri:pause-fill')" v-else-if="item.threadState === 'WAITING' || item.threadState === 'TIMED_WAITING'" />
                    </el-icon>
                    <span style="font-size: 13px">{{ item.threadName }} : {{ item.threadState }}</span>
                  </span>
                </p>
              </header>
              <div v-if="item.stackTrace.length > 0" class="card-content">
                <pre ref="sqlPre" class="language-java line-numbers inline-color"> <code class="language-java line-numbers inline-color"> {{ getMessage(item.stackTrace) }}</code></pre>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import { fetchActuatorCall } from "@/api/monitor/actuator";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
export default {
  data() {
    return {
      activeNames: {},
      visiable: false,
      loading: !0,
      row: {},
      data: []
    };
  },
  computed: {
    title() {
      return this.row?.metadata?.applicationName + "线程 (" + this.data.length + ")";
    }
  },
  methods: {
    useRenderIcon,
    getMessage(stackTrace) {
      const rs = [""];
      (stackTrace || []).forEach(it => {
        rs.push(it.className + "#" + it.methodName + ":" + it.lineNumber + "(" + it.moduleName + ") (" + it.moduleVersion + ")");
      });
      return rs.join("\r\n");
    },
    async highlightSQL() {
      setTimeout(async () => {
        Prism.highlightAll();
        this.$nextTick(() => {
          try {
            Prism.highlightElement(document.querySelectorAll("pre code"));
          } catch (error) {}
        });
      }, 300);
    },
    close() {
      this.visiable = false;
      this.data.length = 0;
      this.loading = true;
    },
    open(item) {
      this.loading = true;
      this.visiable = true;
      const metadata = item.metadata;
      this.row = item;
      fetchActuatorCall({
        url: `http://${item.host}:${item.port}${metadata.contextPath}${metadata.endpointsUrl}/thread`,
        method: "GET",
        body: JSON.stringify(item)
      })
        .then(res => {
          if (res.code === "00000") {
            const data = JSON.parse(res.data);
            this.data = data || {};
            this.highlightSQL();
          }
        })
        .finally(() => {
          this.loading = !1;
        });
    }
  }
};
</script>

<style scoped>
.env {
  font-size: 1rem;
}

.box {
  background-color: #fff;
  border-radius: 6px;
  -webkit-box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px rgba(10, 10, 10, 0.02);
  box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px rgba(10, 10, 10, 0.02);
  color: #4a4a4a;
  display: block;
  padding: 1.25rem;
}

a.box:focus,
a.box:hover {
  -webkit-box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px #42d3a5;
  box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px #42d3a5;
}

a.box:active {
  -webkit-box-shadow:
    inset 0 1px 2px rgba(10, 10, 10, 0.2),
    0 0 0 1px #42d3a5;
  box-shadow:
    inset 0 1px 2px rgba(10, 10, 10, 0.2),
    0 0 0 1px #42d3a5;
}

.button {
  background-color: #fff;
  border-color: #dbdbdb;
  border-width: 1px;
  color: #363636;
  cursor: pointer;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding-bottom: calc(0.5em - 1px);
  padding-left: 1em;
  padding-right: 1em;
  padding-top: calc(0.5em - 1px);
  text-align: center;
  white-space: nowrap;
}

.button strong {
  color: inherit;
}

.button .icon,
.button .icon.is-large,
.button .icon.is-medium,
.button .icon.is-small {
  height: 1.5em;
  width: 1.5em;
}

.button .icon:first-child:not(:last-child) {
  margin-left: calc(-0.5em - 1px);
  margin-right: 0.25em;
}

.button .icon:last-child:not(:first-child) {
  margin-left: 0.25em;
  margin-right: calc(-0.5em - 1px);
}

.button .icon:first-child:last-child {
  margin-left: calc(-0.5em - 1px);
  margin-right: calc(-0.5em - 1px);
}

.button.is-hovered,
.button:hover {
  border-color: #b5b5b5;
  color: #363636;
}

.button.is-focused,
.button:focus {
  border-color: #485fc7;
  color: #363636;
}

.button.is-focused:not(:active),
.button:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
}

.button.is-active,
.button:active {
  border-color: #4a4a4a;
  color: #363636;
}

.button.is-text {
  background-color: transparent;
  border-color: transparent;
  color: #4a4a4a;
  text-decoration: underline;
}

.button.is-text.is-focused,
.button.is-text.is-hovered,
.button.is-text:focus,
.button.is-text:hover {
  background-color: #f5f5f5;
  color: #363636;
}

.button.is-text.is-active,
.button.is-text:active {
  background-color: #e8e8e8;
  color: #363636;
}

.button.is-text[disabled],
fieldset[disabled] .button.is-text {
  background-color: transparent;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-ghost {
  background: none;
  border-color: transparent;
  color: #42d3a5;
  text-decoration: none;
}

.button.is-ghost.is-hovered,
.button.is-ghost:hover {
  color: #42d3a5;
  text-decoration: underline;
}

.button.is-white {
  background-color: #fff;
  border-color: transparent;
  color: #0a0a0a;
}

.button.is-white.is-hovered,
.button.is-white:hover {
  background-color: #f9f9f9;
  border-color: transparent;
  color: #0a0a0a;
}

.button.is-white.is-focused,
.button.is-white:focus {
  border-color: transparent;
  color: #0a0a0a;
}

.button.is-white.is-focused:not(:active),
.button.is-white:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
}

.button.is-white.is-active,
.button.is-white:active {
  background-color: #f2f2f2;
  border-color: transparent;
  color: #0a0a0a;
}

.button.is-white[disabled],
fieldset[disabled] .button.is-white {
  background-color: #fff;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-white.is-inverted {
  background-color: #0a0a0a;
  color: #fff;
}

.button.is-white.is-inverted.is-hovered,
.button.is-white.is-inverted:hover {
  background-color: #000;
}

.button.is-white.is-inverted[disabled],
fieldset[disabled] .button.is-white.is-inverted {
  background-color: #0a0a0a;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-white.is-loading:after {
  border-color: transparent transparent #0a0a0a #0a0a0a !important;
}

.button.is-white.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-white.is-outlined.is-focused,
.button.is-white.is-outlined.is-hovered,
.button.is-white.is-outlined:focus,
.button.is-white.is-outlined:hover {
  background-color: #fff;
  border-color: #fff;
  color: #0a0a0a;
}

.button.is-white.is-outlined.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-white.is-outlined.is-loading.is-focused:after,
.button.is-white.is-outlined.is-loading.is-hovered:after,
.button.is-white.is-outlined.is-loading:focus:after,
.button.is-white.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #0a0a0a #0a0a0a !important;
}

.button.is-white.is-outlined[disabled],
fieldset[disabled] .button.is-white.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-white.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #0a0a0a;
  color: #0a0a0a;
}

.button.is-white.is-inverted.is-outlined.is-focused,
.button.is-white.is-inverted.is-outlined.is-hovered,
.button.is-white.is-inverted.is-outlined:focus,
.button.is-white.is-inverted.is-outlined:hover {
  background-color: #0a0a0a;
  color: #fff;
}

.button.is-white.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-white.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-white.is-inverted.is-outlined.is-loading:focus:after,
.button.is-white.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-white.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-white.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #0a0a0a;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #0a0a0a;
}

.button.is-black {
  background-color: #0a0a0a;
  border-color: transparent;
  color: #fff;
}

.button.is-black.is-hovered,
.button.is-black:hover {
  background-color: #040404;
  border-color: transparent;
  color: #fff;
}

.button.is-black.is-focused,
.button.is-black:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-black.is-focused:not(:active),
.button.is-black:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
}

.button.is-black.is-active,
.button.is-black:active {
  background-color: #000;
  border-color: transparent;
  color: #fff;
}

.button.is-black[disabled],
fieldset[disabled] .button.is-black {
  background-color: #0a0a0a;
  border-color: #0a0a0a;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-black.is-inverted {
  background-color: #fff;
  color: #0a0a0a;
}

.button.is-black.is-inverted.is-hovered,
.button.is-black.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-black.is-inverted[disabled],
fieldset[disabled] .button.is-black.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #0a0a0a;
}

.button.is-black.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-black.is-outlined {
  background-color: transparent;
  border-color: #0a0a0a;
  color: #0a0a0a;
}

.button.is-black.is-outlined.is-focused,
.button.is-black.is-outlined.is-hovered,
.button.is-black.is-outlined:focus,
.button.is-black.is-outlined:hover {
  background-color: #0a0a0a;
  border-color: #0a0a0a;
  color: #fff;
}

.button.is-black.is-outlined.is-loading:after {
  border-color: transparent transparent #0a0a0a #0a0a0a !important;
}

.button.is-black.is-outlined.is-loading.is-focused:after,
.button.is-black.is-outlined.is-loading.is-hovered:after,
.button.is-black.is-outlined.is-loading:focus:after,
.button.is-black.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-black.is-outlined[disabled],
fieldset[disabled] .button.is-black.is-outlined {
  background-color: transparent;
  border-color: #0a0a0a;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #0a0a0a;
}

.button.is-black.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-black.is-inverted.is-outlined.is-focused,
.button.is-black.is-inverted.is-outlined.is-hovered,
.button.is-black.is-inverted.is-outlined:focus,
.button.is-black.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #0a0a0a;
}

.button.is-black.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-black.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-black.is-inverted.is-outlined.is-loading:focus:after,
.button.is-black.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #0a0a0a #0a0a0a !important;
}

.button.is-black.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-black.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-light {
  background-color: #f5f5f5;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-hovered,
.button.is-light:hover {
  background-color: #eee;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-focused,
.button.is-light:focus {
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-focused:not(:active),
.button.is-light:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
}

.button.is-light.is-active,
.button.is-light:active {
  background-color: #e8e8e8;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light[disabled],
fieldset[disabled] .button.is-light {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-light.is-inverted {
  color: #f5f5f5;
}

.button.is-light.is-inverted,
.button.is-light.is-inverted.is-hovered,
.button.is-light.is-inverted:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-inverted[disabled],
fieldset[disabled] .button.is-light.is-inverted {
  background-color: rgba(0, 0, 0, 0.7);
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #f5f5f5;
}

.button.is-light.is-loading:after {
  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;
}

.button.is-light.is-outlined {
  background-color: transparent;
  border-color: #f5f5f5;
  color: #f5f5f5;
}

.button.is-light.is-outlined.is-focused,
.button.is-light.is-outlined.is-hovered,
.button.is-light.is-outlined:focus,
.button.is-light.is-outlined:hover {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-outlined.is-loading:after {
  border-color: transparent transparent #f5f5f5 #f5f5f5 !important;
}

.button.is-light.is-outlined.is-loading.is-focused:after,
.button.is-light.is-outlined.is-loading.is-hovered:after,
.button.is-light.is-outlined.is-loading:focus:after,
.button.is-light.is-outlined.is-loading:hover:after {
  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;
}

.button.is-light.is-outlined[disabled],
fieldset[disabled] .button.is-light.is-outlined {
  background-color: transparent;
  border-color: #f5f5f5;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #f5f5f5;
}

.button.is-light.is-inverted.is-outlined {
  background-color: transparent;
  border-color: rgba(0, 0, 0, 0.7);
  color: rgba(0, 0, 0, 0.7);
}

.button.is-light.is-inverted.is-outlined.is-focused,
.button.is-light.is-inverted.is-outlined.is-hovered,
.button.is-light.is-inverted.is-outlined:focus,
.button.is-light.is-inverted.is-outlined:hover {
  background-color: rgba(0, 0, 0, 0.7);
  color: #f5f5f5;
}

.button.is-light.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-light.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-light.is-inverted.is-outlined.is-loading:focus:after,
.button.is-light.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #f5f5f5 #f5f5f5 !important;
}

.button.is-light.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-light.is-inverted.is-outlined {
  background-color: transparent;
  border-color: rgba(0, 0, 0, 0.7);
  -webkit-box-shadow: none;
  box-shadow: none;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-dark {
  background-color: #363636;
  border-color: transparent;
  color: #fff;
}

.button.is-dark.is-hovered,
.button.is-dark:hover {
  background-color: #2f2f2f;
  border-color: transparent;
  color: #fff;
}

.button.is-dark.is-focused,
.button.is-dark:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-dark.is-focused:not(:active),
.button.is-dark:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
}

.button.is-dark.is-active,
.button.is-dark:active {
  background-color: #292929;
  border-color: transparent;
  color: #fff;
}

.button.is-dark[disabled],
fieldset[disabled] .button.is-dark {
  background-color: #363636;
  border-color: #363636;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-dark.is-inverted {
  background-color: #fff;
  color: #363636;
}

.button.is-dark.is-inverted.is-hovered,
.button.is-dark.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-dark.is-inverted[disabled],
fieldset[disabled] .button.is-dark.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #363636;
}

.button.is-dark.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-dark.is-outlined {
  background-color: transparent;
  border-color: #363636;
  color: #363636;
}

.button.is-dark.is-outlined.is-focused,
.button.is-dark.is-outlined.is-hovered,
.button.is-dark.is-outlined:focus,
.button.is-dark.is-outlined:hover {
  background-color: #363636;
  border-color: #363636;
  color: #fff;
}

.button.is-dark.is-outlined.is-loading:after {
  border-color: transparent transparent #363636 #363636 !important;
}

.button.is-dark.is-outlined.is-loading.is-focused:after,
.button.is-dark.is-outlined.is-loading.is-hovered:after,
.button.is-dark.is-outlined.is-loading:focus:after,
.button.is-dark.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-dark.is-outlined[disabled],
fieldset[disabled] .button.is-dark.is-outlined {
  background-color: transparent;
  border-color: #363636;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #363636;
}

.button.is-dark.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-dark.is-inverted.is-outlined.is-focused,
.button.is-dark.is-inverted.is-outlined.is-hovered,
.button.is-dark.is-inverted.is-outlined:focus,
.button.is-dark.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #363636;
}

.button.is-dark.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-dark.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-dark.is-inverted.is-outlined.is-loading:focus:after,
.button.is-dark.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #363636 #363636 !important;
}

.button.is-dark.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-dark.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-primary {
  background-color: #42d3a5;
  border-color: transparent;
  color: #fff;
}

.button.is-primary.is-hovered,
.button.is-primary:hover {
  background-color: #38d1a0;
  border-color: transparent;
  color: #fff;
}

.button.is-primary.is-focused,
.button.is-primary:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-primary.is-focused:not(:active),
.button.is-primary:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
}

.button.is-primary.is-active,
.button.is-primary:active {
  background-color: #2fcc9a;
  border-color: transparent;
  color: #fff;
}

.button.is-primary[disabled],
fieldset[disabled] .button.is-primary {
  background-color: #42d3a5;
  border-color: #42d3a5;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-primary.is-inverted {
  background-color: #fff;
  color: #42d3a5;
}

.button.is-primary.is-inverted.is-hovered,
.button.is-primary.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-primary.is-inverted[disabled],
fieldset[disabled] .button.is-primary.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #42d3a5;
}

.button.is-primary.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-primary.is-outlined {
  background-color: transparent;
  border-color: #42d3a5;
  color: #42d3a5;
}

.button.is-primary.is-outlined.is-focused,
.button.is-primary.is-outlined.is-hovered,
.button.is-primary.is-outlined:focus,
.button.is-primary.is-outlined:hover {
  background-color: #42d3a5;
  border-color: #42d3a5;
  color: #fff;
}

.button.is-primary.is-outlined.is-loading:after {
  border-color: transparent transparent #42d3a5 #42d3a5 !important;
}

.button.is-primary.is-outlined.is-loading.is-focused:after,
.button.is-primary.is-outlined.is-loading.is-hovered:after,
.button.is-primary.is-outlined.is-loading:focus:after,
.button.is-primary.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-primary.is-outlined[disabled],
fieldset[disabled] .button.is-primary.is-outlined {
  background-color: transparent;
  border-color: #42d3a5;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #42d3a5;
}

.button.is-primary.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-primary.is-inverted.is-outlined.is-focused,
.button.is-primary.is-inverted.is-outlined.is-hovered,
.button.is-primary.is-inverted.is-outlined:focus,
.button.is-primary.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #42d3a5;
}

.button.is-primary.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-primary.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-primary.is-inverted.is-outlined.is-loading:focus:after,
.button.is-primary.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #42d3a5 #42d3a5 !important;
}

.button.is-primary.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-primary.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-primary.is-light {
  background-color: #eefbf7;
  color: #1c785b;
}

.button.is-primary.is-light.is-hovered,
.button.is-primary.is-light:hover {
  background-color: #e4f9f2;
  border-color: transparent;
  color: #1c785b;
}

.button.is-primary.is-light.is-active,
.button.is-primary.is-light:active {
  background-color: #daf6ed;
  border-color: transparent;
  color: #1c785b;
}

.button.is-link {
  background-color: #485fc7;
  border-color: transparent;
  color: #fff;
}

.button.is-link.is-hovered,
.button.is-link:hover {
  background-color: #3e56c4;
  border-color: transparent;
  color: #fff;
}

.button.is-link.is-focused,
.button.is-link:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-link.is-focused:not(:active),
.button.is-link:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
}

.button.is-link.is-active,
.button.is-link:active {
  background-color: #3a51bb;
  border-color: transparent;
  color: #fff;
}

.button.is-link[disabled],
fieldset[disabled] .button.is-link {
  background-color: #485fc7;
  border-color: #485fc7;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-link.is-inverted {
  background-color: #fff;
  color: #485fc7;
}

.button.is-link.is-inverted.is-hovered,
.button.is-link.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-link.is-inverted[disabled],
fieldset[disabled] .button.is-link.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #485fc7;
}

.button.is-link.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-link.is-outlined {
  background-color: transparent;
  border-color: #485fc7;
  color: #485fc7;
}

.button.is-link.is-outlined.is-focused,
.button.is-link.is-outlined.is-hovered,
.button.is-link.is-outlined:focus,
.button.is-link.is-outlined:hover {
  background-color: #485fc7;
  border-color: #485fc7;
  color: #fff;
}

.button.is-link.is-outlined.is-loading:after {
  border-color: transparent transparent #485fc7 #485fc7 !important;
}

.button.is-link.is-outlined.is-loading.is-focused:after,
.button.is-link.is-outlined.is-loading.is-hovered:after,
.button.is-link.is-outlined.is-loading:focus:after,
.button.is-link.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-link.is-outlined[disabled],
fieldset[disabled] .button.is-link.is-outlined {
  background-color: transparent;
  border-color: #485fc7;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #485fc7;
}

.button.is-link.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-link.is-inverted.is-outlined.is-focused,
.button.is-link.is-inverted.is-outlined.is-hovered,
.button.is-link.is-inverted.is-outlined:focus,
.button.is-link.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #485fc7;
}

.button.is-link.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-link.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-link.is-inverted.is-outlined.is-loading:focus:after,
.button.is-link.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #485fc7 #485fc7 !important;
}

.button.is-link.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-link.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-link.is-light {
  background-color: #eff1fa;
  color: #3850b7;
}

.button.is-link.is-light.is-hovered,
.button.is-link.is-light:hover {
  background-color: #e6e9f7;
  border-color: transparent;
  color: #3850b7;
}

.button.is-link.is-light.is-active,
.button.is-link.is-light:active {
  background-color: #dce0f4;
  border-color: transparent;
  color: #3850b7;
}

.button.is-info {
  background-color: #3e8ed0;
  border-color: transparent;
  color: #fff;
}

.button.is-info.is-hovered,
.button.is-info:hover {
  background-color: #3488ce;
  border-color: transparent;
  color: #fff;
}

.button.is-info.is-focused,
.button.is-info:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-info.is-focused:not(:active),
.button.is-info:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
  box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
}

.button.is-info.is-active,
.button.is-info:active {
  background-color: #3082c5;
  border-color: transparent;
  color: #fff;
}

.button.is-info[disabled],
fieldset[disabled] .button.is-info {
  background-color: #3e8ed0;
  border-color: #3e8ed0;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-info.is-inverted {
  background-color: #fff;
  color: #3e8ed0;
}

.button.is-info.is-inverted.is-hovered,
.button.is-info.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-info.is-inverted[disabled],
fieldset[disabled] .button.is-info.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #3e8ed0;
}

.button.is-info.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-info.is-outlined {
  background-color: transparent;
  border-color: #3e8ed0;
  color: #3e8ed0;
}

.button.is-info.is-outlined.is-focused,
.button.is-info.is-outlined.is-hovered,
.button.is-info.is-outlined:focus,
.button.is-info.is-outlined:hover {
  background-color: #3e8ed0;
  border-color: #3e8ed0;
  color: #fff;
}

.button.is-info.is-outlined.is-loading:after {
  border-color: transparent transparent #3e8ed0 #3e8ed0 !important;
}

.button.is-info.is-outlined.is-loading.is-focused:after,
.button.is-info.is-outlined.is-loading.is-hovered:after,
.button.is-info.is-outlined.is-loading:focus:after,
.button.is-info.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-info.is-outlined[disabled],
fieldset[disabled] .button.is-info.is-outlined {
  background-color: transparent;
  border-color: #3e8ed0;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #3e8ed0;
}

.button.is-info.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-info.is-inverted.is-outlined.is-focused,
.button.is-info.is-inverted.is-outlined.is-hovered,
.button.is-info.is-inverted.is-outlined:focus,
.button.is-info.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #3e8ed0;
}

.button.is-info.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-info.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-info.is-inverted.is-outlined.is-loading:focus:after,
.button.is-info.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #3e8ed0 #3e8ed0 !important;
}

.button.is-info.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-info.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-info.is-light {
  background-color: #eff5fb;
  color: #296fa8;
}

.button.is-info.is-light.is-hovered,
.button.is-info.is-light:hover {
  background-color: #e4eff9;
  border-color: transparent;
  color: #296fa8;
}

.button.is-info.is-light.is-active,
.button.is-info.is-light:active {
  background-color: #dae9f6;
  border-color: transparent;
  color: #296fa8;
}

.button.is-success {
  background-color: #48c78e;
  border-color: transparent;
  color: #fff;
}

.button.is-success.is-hovered,
.button.is-success:hover {
  background-color: #3ec487;
  border-color: transparent;
  color: #fff;
}

.button.is-success.is-focused,
.button.is-success:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-success.is-focused:not(:active),
.button.is-success:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
}

.button.is-success.is-active,
.button.is-success:active {
  background-color: #3abb81;
  border-color: transparent;
  color: #fff;
}

.button.is-success[disabled],
fieldset[disabled] .button.is-success {
  background-color: #48c78e;
  border-color: #48c78e;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-success.is-inverted {
  background-color: #fff;
  color: #48c78e;
}

.button.is-success.is-inverted.is-hovered,
.button.is-success.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-success.is-inverted[disabled],
fieldset[disabled] .button.is-success.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #48c78e;
}

.button.is-success.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-success.is-outlined {
  background-color: transparent;
  border-color: #48c78e;
  color: #48c78e;
}

.button.is-success.is-outlined.is-focused,
.button.is-success.is-outlined.is-hovered,
.button.is-success.is-outlined:focus,
.button.is-success.is-outlined:hover {
  background-color: #48c78e;
  border-color: #48c78e;
  color: #fff;
}

.button.is-success.is-outlined.is-loading:after {
  border-color: transparent transparent #48c78e #48c78e !important;
}

.button.is-success.is-outlined.is-loading.is-focused:after,
.button.is-success.is-outlined.is-loading.is-hovered:after,
.button.is-success.is-outlined.is-loading:focus:after,
.button.is-success.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-success.is-outlined[disabled],
fieldset[disabled] .button.is-success.is-outlined {
  background-color: transparent;
  border-color: #48c78e;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #48c78e;
}

.button.is-success.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-success.is-inverted.is-outlined.is-focused,
.button.is-success.is-inverted.is-outlined.is-hovered,
.button.is-success.is-inverted.is-outlined:focus,
.button.is-success.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #48c78e;
}

.button.is-success.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-success.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-success.is-inverted.is-outlined.is-loading:focus:after,
.button.is-success.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #48c78e #48c78e !important;
}

.button.is-success.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-success.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-success.is-light {
  background-color: #effaf5;
  color: #257953;
}

.button.is-success.is-light.is-hovered,
.button.is-success.is-light:hover {
  background-color: #e6f7ef;
  border-color: transparent;
  color: #257953;
}

.button.is-success.is-light.is-active,
.button.is-success.is-light:active {
  background-color: #dcf4e9;
  border-color: transparent;
  color: #257953;
}

.button.is-warning {
  background-color: #ffe08a;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-hovered,
.button.is-warning:hover {
  background-color: #ffdc7d;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-focused,
.button.is-warning:focus {
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-focused:not(:active),
.button.is-warning:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
  box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
}

.button.is-warning.is-active,
.button.is-warning:active {
  background-color: #ffd970;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning[disabled],
fieldset[disabled] .button.is-warning {
  background-color: #ffe08a;
  border-color: #ffe08a;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-warning.is-inverted {
  color: #ffe08a;
}

.button.is-warning.is-inverted,
.button.is-warning.is-inverted.is-hovered,
.button.is-warning.is-inverted:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-inverted[disabled],
fieldset[disabled] .button.is-warning.is-inverted {
  background-color: rgba(0, 0, 0, 0.7);
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #ffe08a;
}

.button.is-warning.is-loading:after {
  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;
}

.button.is-warning.is-outlined {
  background-color: transparent;
  border-color: #ffe08a;
  color: #ffe08a;
}

.button.is-warning.is-outlined.is-focused,
.button.is-warning.is-outlined.is-hovered,
.button.is-warning.is-outlined:focus,
.button.is-warning.is-outlined:hover {
  background-color: #ffe08a;
  border-color: #ffe08a;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-outlined.is-loading:after {
  border-color: transparent transparent #ffe08a #ffe08a !important;
}

.button.is-warning.is-outlined.is-loading.is-focused:after,
.button.is-warning.is-outlined.is-loading.is-hovered:after,
.button.is-warning.is-outlined.is-loading:focus:after,
.button.is-warning.is-outlined.is-loading:hover:after {
  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;
}

.button.is-warning.is-outlined[disabled],
fieldset[disabled] .button.is-warning.is-outlined {
  background-color: transparent;
  border-color: #ffe08a;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #ffe08a;
}

.button.is-warning.is-inverted.is-outlined {
  background-color: transparent;
  border-color: rgba(0, 0, 0, 0.7);
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-inverted.is-outlined.is-focused,
.button.is-warning.is-inverted.is-outlined.is-hovered,
.button.is-warning.is-inverted.is-outlined:focus,
.button.is-warning.is-inverted.is-outlined:hover {
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffe08a;
}

.button.is-warning.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-warning.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-warning.is-inverted.is-outlined.is-loading:focus:after,
.button.is-warning.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #ffe08a #ffe08a !important;
}

.button.is-warning.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-warning.is-inverted.is-outlined {
  background-color: transparent;
  border-color: rgba(0, 0, 0, 0.7);
  -webkit-box-shadow: none;
  box-shadow: none;
  color: rgba(0, 0, 0, 0.7);
}

.button.is-warning.is-light {
  background-color: #fffaeb;
  color: #946c00;
}

.button.is-warning.is-light.is-hovered,
.button.is-warning.is-light:hover {
  background-color: #fff6de;
  border-color: transparent;
  color: #946c00;
}

.button.is-warning.is-light.is-active,
.button.is-warning.is-light:active {
  background-color: #fff3d1;
  border-color: transparent;
  color: #946c00;
}

.button.is-danger {
  background-color: #f14668;
  border-color: transparent;
  color: #fff;
}

.button.is-danger.is-hovered,
.button.is-danger:hover {
  background-color: #f03a5f;
  border-color: transparent;
  color: #fff;
}

.button.is-danger.is-focused,
.button.is-danger:focus {
  border-color: transparent;
  color: #fff;
}

.button.is-danger.is-focused:not(:active),
.button.is-danger:focus:not(:active) {
  -webkit-box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
}

.button.is-danger.is-active,
.button.is-danger:active {
  background-color: #ef2e55;
  border-color: transparent;
  color: #fff;
}

.button.is-danger[disabled],
fieldset[disabled] .button.is-danger {
  background-color: #f14668;
  border-color: #f14668;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.button.is-danger.is-inverted {
  background-color: #fff;
  color: #f14668;
}

.button.is-danger.is-inverted.is-hovered,
.button.is-danger.is-inverted:hover {
  background-color: #f2f2f2;
}

.button.is-danger.is-inverted[disabled],
fieldset[disabled] .button.is-danger.is-inverted {
  background-color: #fff;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #f14668;
}

.button.is-danger.is-loading:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-danger.is-outlined {
  background-color: transparent;
  border-color: #f14668;
  color: #f14668;
}

.button.is-danger.is-outlined.is-focused,
.button.is-danger.is-outlined.is-hovered,
.button.is-danger.is-outlined:focus,
.button.is-danger.is-outlined:hover {
  background-color: #f14668;
  border-color: #f14668;
  color: #fff;
}

.button.is-danger.is-outlined.is-loading:after {
  border-color: transparent transparent #f14668 #f14668 !important;
}

.button.is-danger.is-outlined.is-loading.is-focused:after,
.button.is-danger.is-outlined.is-loading.is-hovered:after,
.button.is-danger.is-outlined.is-loading:focus:after,
.button.is-danger.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #fff #fff !important;
}

.button.is-danger.is-outlined[disabled],
fieldset[disabled] .button.is-danger.is-outlined {
  background-color: transparent;
  border-color: #f14668;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #f14668;
}

.button.is-danger.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  color: #fff;
}

.button.is-danger.is-inverted.is-outlined.is-focused,
.button.is-danger.is-inverted.is-outlined.is-hovered,
.button.is-danger.is-inverted.is-outlined:focus,
.button.is-danger.is-inverted.is-outlined:hover {
  background-color: #fff;
  color: #f14668;
}

.button.is-danger.is-inverted.is-outlined.is-loading.is-focused:after,
.button.is-danger.is-inverted.is-outlined.is-loading.is-hovered:after,
.button.is-danger.is-inverted.is-outlined.is-loading:focus:after,
.button.is-danger.is-inverted.is-outlined.is-loading:hover:after {
  border-color: transparent transparent #f14668 #f14668 !important;
}

.button.is-danger.is-inverted.is-outlined[disabled],
fieldset[disabled] .button.is-danger.is-inverted.is-outlined {
  background-color: transparent;
  border-color: #fff;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #fff;
}

.button.is-danger.is-light {
  background-color: #feecf0;
  color: #cc0f35;
}

.button.is-danger.is-light.is-hovered,
.button.is-danger.is-light:hover {
  background-color: #fde0e6;
  border-color: transparent;
  color: #cc0f35;
}

.button.is-danger.is-light.is-active,
.button.is-danger.is-light:active {
  background-color: #fcd4dc;
  border-color: transparent;
  color: #cc0f35;
}

.button.is-small {
  font-size: 0.75rem;
}

.button.is-small:not(.is-rounded) {
  border-radius: 2px;
}

.button.is-normal {
  font-size: 1rem;
}

.button.is-medium {
  font-size: 1.25rem;
}

.button.is-large {
  font-size: 1.5rem;
}

.button[disabled],
fieldset[disabled] .button {
  background-color: #fff;
  border-color: #dbdbdb;
  -webkit-box-shadow: none;
  box-shadow: none;
  opacity: 0.5;
}

.button.is-fullwidth {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
}

.button.is-loading {
  color: transparent !important;
  pointer-events: none;
}

.button.is-loading:after {
  position: absolute;
  left: calc(50% - 0.5em);
  top: calc(50% - 0.5em);
  position: absolute !important;
}

.button.is-static {
  background-color: #f5f5f5;
  border-color: #dbdbdb;
  color: #7a7a7a;
  -webkit-box-shadow: none;
  box-shadow: none;
  pointer-events: none;
}

.button.is-rounded {
  border-radius: 9999px;
  padding-left: 1.25em;
  padding-right: 1.25em;
}

.buttons {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  -webkit-box-pack: start;
  -ms-flex-pack: start;
  justify-content: flex-start;
}

.buttons .button {
  margin-bottom: 0.5rem;
}

.buttons .button:not(:last-child):not(.is-fullwidth) {
  margin-right: 0.5rem;
}

.buttons:last-child {
  margin-bottom: -0.5rem;
}

.buttons:not(:last-child) {
  margin-bottom: 1rem;
}

.buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large) {
  font-size: 0.75rem;
}

.buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large):not(.is-rounded) {
  border-radius: 2px;
}

.buttons.are-medium .button:not(.is-small):not(.is-normal):not(.is-large) {
  font-size: 1.25rem;
}

.buttons.are-large .button:not(.is-small):not(.is-normal):not(.is-medium) {
  font-size: 1.5rem;
}

.buttons.has-addons .button:not(:first-child) {
  border-bottom-left-radius: 0;
  border-top-left-radius: 0;
}

.buttons.has-addons .button:not(:last-child) {
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
  margin-right: -1px;
}

.buttons.has-addons .button:last-child {
  margin-right: 0;
}

.buttons.has-addons .button.is-hovered,
.buttons.has-addons .button:hover {
  z-index: 2;
}

.buttons.has-addons .button.is-active,
.buttons.has-addons .button.is-focused,
.buttons.has-addons .button.is-selected,
.buttons.has-addons .button:active,
.buttons.has-addons .button:focus {
  z-index: 3;
}

.buttons.has-addons .button.is-active:hover,
.buttons.has-addons .button.is-focused:hover,
.buttons.has-addons .button.is-selected:hover,
.buttons.has-addons .button:active:hover,
.buttons.has-addons .button:focus:hover {
  z-index: 4;
}

.buttons.has-addons .button.is-expanded {
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -ms-flex-negative: 1;
  flex-shrink: 1;
}

.buttons.is-centered {
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
}

.buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}

.buttons.is-right {
  -webkit-box-pack: end;
  -ms-flex-pack: end;
  justify-content: flex-end;
}

.buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}

@media screen and (max-width: 768px) {
  .button.is-responsive.is-small {
    font-size: 0.5625rem;
  }

  .button.is-responsive,
  .button.is-responsive.is-normal {
    font-size: 0.65625rem;
  }

  .button.is-responsive.is-medium {
    font-size: 0.75rem;
  }

  .button.is-responsive.is-large {
    font-size: 1rem;
  }
}

@media screen and (min-width: 769px) and (max-width: 1023px) {
  .button.is-responsive.is-small {
    font-size: 0.65625rem;
  }

  .button.is-responsive,
  .button.is-responsive.is-normal {
    font-size: 0.75rem;
  }

  .button.is-responsive.is-medium {
    font-size: 1rem;
  }

  .button.is-responsive.is-large {
    font-size: 1.25rem;
  }
}

.container {
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  margin: 0 auto;
  position: relative;
  width: auto;
}

.container.is-fluid {
  max-width: none !important;
  padding-left: 32px;
  padding-right: 32px;
  width: 100%;
}

@media screen and (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

@media screen and (max-width: 1215px) {
  .container.is-widescreen:not(.is-max-desktop) {
    max-width: 1152px;
  }
}

@media screen and (max-width: 1407px) {
  .container.is-fullhd:not(.is-max-desktop):not(.is-max-widescreen) {
    max-width: 1344px;
  }
}

@media screen and (min-width: 1216px) {
  .container:not(.is-max-desktop) {
    max-width: 1152px;
  }
}

@media screen and (min-width: 1408px) {
  .container:not(.is-max-desktop):not(.is-max-widescreen) {
    max-width: 1344px;
  }
}

.content li + li {
  margin-top: 0.25em;
}

.content blockquote:not(:last-child),
.content dl:not(:last-child),
.content ol:not(:last-child),
.content p:not(:last-child),
.content pre:not(:last-child),
.content table:not(:last-child),
.content ul:not(:last-child) {
  margin-bottom: 1em;
}

.content h1,
.content h2,
.content h3,
.content h4,
.content h5,
.content h6 {
  color: #363636;
  font-weight: 600;
  line-height: 1.125;
}

.content h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.content h1:not(:first-child) {
  margin-top: 1em;
}

.content h2 {
  font-size: 1.75em;
  margin-bottom: 0.5714em;
}

.content h2:not(:first-child) {
  margin-top: 1.1428em;
}

.content h3 {
  font-size: 1.5em;
  margin-bottom: 0.6666em;
}

.content h3:not(:first-child) {
  margin-top: 1.3333em;
}

.content h4 {
  font-size: 1.25em;
  margin-bottom: 0.8em;
}

.content h5 {
  font-size: 1.125em;
  margin-bottom: 0.8888em;
}

.content h6 {
  font-size: 1em;
  margin-bottom: 1em;
}

.content blockquote {
  background-color: #f5f5f5;
  border-left: 5px solid #dbdbdb;
  padding: 1.25em 1.5em;
}

.content ol {
  list-style-position: outside;
  margin-left: 2em;
  margin-top: 1em;
}

.content ol:not([type]) {
  list-style-type: decimal;
}

.content ol:not([type]).is-lower-alpha {
  list-style-type: lower-alpha;
}

.content ol:not([type]).is-lower-roman {
  list-style-type: lower-roman;
}

.content ol:not([type]).is-upper-alpha {
  list-style-type: upper-alpha;
}

.content ol:not([type]).is-upper-roman {
  list-style-type: upper-roman;
}

.content ul {
  list-style: disc outside;
  margin-left: 2em;
  margin-top: 1em;
}

.content ul ul {
  list-style-type: circle;
  margin-top: 0.5em;
}

.content ul ul ul {
  list-style-type: square;
}

.content dd {
  margin-left: 2em;
}

.content figure {
  margin-left: 2em;
  margin-right: 2em;
  text-align: center;
}

.content figure:not(:first-child) {
  margin-top: 2em;
}

.content figure:not(:last-child) {
  margin-bottom: 2em;
}

.content figure img {
  display: inline-block;
}

.content figure figcaption {
  font-style: italic;
}

.content pre {
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  padding: 1.25em 1.5em;
  white-space: pre;
  word-wrap: normal;
}

.content sub,
.content sup {
  font-size: 75%;
}

.content table {
  width: 100%;
}

.content table td,
.content table th {
  border: 1px solid #dbdbdb;
  border-width: 0 0 1px;
  padding: 0.5em 0.75em;
  vertical-align: top;
}

.content table th {
  color: #363636;
}

.content table th:not([align]) {
  text-align: inherit;
}

.content table thead td,
.content table thead th {
  border-width: 0 0 2px;
  color: #363636;
}

.content table tfoot td,
.content table tfoot th {
  border-width: 2px 0 0;
  color: #363636;
}

.content table tbody tr:last-child td,
.content table tbody tr:last-child th {
  border-bottom-width: 0;
}

.content .tabs li + li {
  margin-top: 0;
}

.content.is-small {
  font-size: 0.75rem;
}

.content.is-normal {
  font-size: 1rem;
}

.content.is-medium {
  font-size: 1.25rem;
}

.content.is-large {
  font-size: 1.5rem;
}

.icon {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  height: 1.5rem;
  width: 1.5rem;
}

.icon.is-small {
  height: 1rem;
  width: 1rem;
}

.icon.is-medium {
  height: 2rem;
  width: 2rem;
}

.icon.is-large {
  height: 3rem;
  width: 3rem;
}

.icon-text {
  -webkit-box-align: start;
  -ms-flex-align: start;
  align-items: flex-start;
  color: inherit;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  line-height: 1.5rem;
  vertical-align: top;
}

.icon-text .icon {
  -webkit-box-flex: 0;
  -ms-flex-positive: 0;
  flex-grow: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
}

.icon-text .icon:not(:last-child) {
  margin-right: 0.25em;
}

.icon-text .icon:not(:first-child) {
  margin-left: 0.25em;
}

div.icon-text {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.image {
  display: block;
  position: relative;
}

.image img {
  display: block;
  height: auto;
  width: 100%;
}

.image img.is-rounded {
  border-radius: 9999px;
}

.image.is-fullwidth {
  width: 100%;
}

.image.is-1by1 .has-ratio,
.image.is-1by1 img,
.image.is-1by2 .has-ratio,
.image.is-1by2 img,
.image.is-1by3 .has-ratio,
.image.is-1by3 img,
.image.is-2by1 .has-ratio,
.image.is-2by1 img,
.image.is-2by3 .has-ratio,
.image.is-2by3 img,
.image.is-3by1 .has-ratio,
.image.is-3by1 img,
.image.is-3by2 .has-ratio,
.image.is-3by2 img,
.image.is-3by4 .has-ratio,
.image.is-3by4 img,
.image.is-3by5 .has-ratio,
.image.is-3by5 img,
.image.is-4by3 .has-ratio,
.image.is-4by3 img,
.image.is-4by5 .has-ratio,
.image.is-4by5 img,
.image.is-5by3 .has-ratio,
.image.is-5by3 img,
.image.is-5by4 .has-ratio,
.image.is-5by4 img,
.image.is-9by16 .has-ratio,
.image.is-9by16 img,
.image.is-16by9 .has-ratio,
.image.is-16by9 img,
.image.is-square .has-ratio,
.image.is-square img {
  height: 100%;
  width: 100%;
}

.image.is-1by1,
.image.is-square {
  padding-top: 100%;
}

.image.is-5by4 {
  padding-top: 80%;
}

.image.is-4by3 {
  padding-top: 75%;
}

.image.is-3by2 {
  padding-top: 66.6666%;
}

.image.is-5by3 {
  padding-top: 60%;
}

.image.is-16by9 {
  padding-top: 56.25%;
}

.image.is-2by1 {
  padding-top: 50%;
}

.image.is-3by1 {
  padding-top: 33.3333%;
}

.image.is-4by5 {
  padding-top: 125%;
}

.image.is-3by4 {
  padding-top: 133.3333%;
}

.image.is-2by3 {
  padding-top: 150%;
}

.image.is-3by5 {
  padding-top: 166.6666%;
}

.image.is-9by16 {
  padding-top: 177.7777%;
}

.image.is-1by2 {
  padding-top: 200%;
}

.image.is-1by3 {
  padding-top: 300%;
}

.image.is-16x16 {
  height: 16px;
  width: 16px;
}

.image.is-24x24 {
  height: 24px;
  width: 24px;
}

.image.is-32x32 {
  height: 32px;
  width: 32px;
}

.image.is-48x48 {
  height: 48px;
  width: 48px;
}

.image.is-64x64 {
  height: 64px;
  width: 64px;
}

.image.is-96x96 {
  height: 96px;
  width: 96px;
}

.image.is-128x128 {
  height: 128px;
  width: 128px;
}

.notification {
  background-color: #f5f5f5;
  border-radius: 4px;
  position: relative;
  padding: 1.25rem 2.5rem 1.25rem 1.5rem;
}

.notification a:not(.button):not(.dropdown-item) {
  color: currentColor;
  text-decoration: underline;
}

.notification strong {
  color: currentColor;
}

.notification code,
.notification pre {
  background: #fff;
}

.notification pre code {
  background: transparent;
}

.notification > .delete {
  right: 0.5rem;
  position: absolute;
  top: 0.5rem;
}

.notification .content,
.notification .subtitle,
.notification .title {
  color: currentColor;
}

.notification.is-white {
  background-color: #fff;
  color: #0a0a0a;
}

.notification.is-black {
  background-color: #0a0a0a;
  color: #fff;
}

.notification.is-light {
  background-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.7);
}

.notification.is-dark {
  background-color: #363636;
  color: #fff;
}

.notification.is-primary {
  background-color: #42d3a5;
  color: #fff;
}

.notification.is-primary.is-light {
  background-color: #eefbf7;
  color: #1c785b;
}

.notification.is-link {
  background-color: #485fc7;
  color: #fff;
}

.notification.is-link.is-light {
  background-color: #eff1fa;
  color: #3850b7;
}

.notification.is-info {
  background-color: #3e8ed0;
  color: #fff;
}

.notification.is-info.is-light {
  background-color: #eff5fb;
  color: #296fa8;
}

.notification.is-success {
  background-color: #48c78e;
  color: #fff;
}

.notification.is-success.is-light {
  background-color: #effaf5;
  color: #257953;
}

.notification.is-warning {
  background-color: #ffe08a;
  color: rgba(0, 0, 0, 0.7);
}

.notification.is-warning.is-light {
  background-color: #fffaeb;
  color: #946c00;
}

.notification.is-danger {
  background-color: #f14668;
  color: #fff;
}

.notification.is-danger.is-light {
  background-color: #feecf0;
  color: #cc0f35;
}

.progress {
  -moz-appearance: none;
  -webkit-appearance: none;
  border: none;
  border-radius: 9999px;
  display: block;
  height: 1rem;
  overflow: hidden;
  padding: 0;
  width: 100%;
}

.progress::-webkit-progress-bar {
  background-color: #ededed;
}

.progress::-webkit-progress-value {
  background-color: #4a4a4a;
}

.progress::-moz-progress-bar {
  background-color: #4a4a4a;
}

.progress::-ms-fill {
  background-color: #4a4a4a;
  border: none;
}

.progress.is-white::-webkit-progress-value {
  background-color: #fff;
}

.progress.is-white::-moz-progress-bar {
  background-color: #fff;
}

.progress.is-white::-ms-fill {
  background-color: #fff;
}

.progress.is-white:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #fff), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #fff 30%, #ededed 0);
}

.progress.is-black::-webkit-progress-value {
  background-color: #0a0a0a;
}

.progress.is-black::-moz-progress-bar {
  background-color: #0a0a0a;
}

.progress.is-black::-ms-fill {
  background-color: #0a0a0a;
}

.progress.is-black:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #0a0a0a), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #0a0a0a 30%, #ededed 0);
}

.progress.is-light::-webkit-progress-value {
  background-color: #f5f5f5;
}

.progress.is-light::-moz-progress-bar {
  background-color: #f5f5f5;
}

.progress.is-light::-ms-fill {
  background-color: #f5f5f5;
}

.progress.is-light:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #f5f5f5), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #f5f5f5 30%, #ededed 0);
}

.progress.is-dark::-webkit-progress-value {
  background-color: #363636;
}

.progress.is-dark::-moz-progress-bar {
  background-color: #363636;
}

.progress.is-dark::-ms-fill {
  background-color: #363636;
}

.progress.is-dark:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #363636), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #363636 30%, #ededed 0);
}

.progress.is-primary::-webkit-progress-value {
  background-color: #42d3a5;
}

.progress.is-primary::-moz-progress-bar {
  background-color: #42d3a5;
}

.progress.is-primary::-ms-fill {
  background-color: #42d3a5;
}

.progress.is-primary:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #42d3a5), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #42d3a5 30%, #ededed 0);
}

.progress.is-link::-webkit-progress-value {
  background-color: #485fc7;
}

.progress.is-link::-moz-progress-bar {
  background-color: #485fc7;
}

.progress.is-link::-ms-fill {
  background-color: #485fc7;
}

.progress.is-link:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #485fc7), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #485fc7 30%, #ededed 0);
}

.progress.is-info::-webkit-progress-value {
  background-color: #3e8ed0;
}

.progress.is-info::-moz-progress-bar {
  background-color: #3e8ed0;
}

.progress.is-info::-ms-fill {
  background-color: #3e8ed0;
}

.progress.is-info:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #3e8ed0), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #3e8ed0 30%, #ededed 0);
}

.progress.is-success::-webkit-progress-value {
  background-color: #48c78e;
}

.progress.is-success::-moz-progress-bar {
  background-color: #48c78e;
}

.progress.is-success::-ms-fill {
  background-color: #48c78e;
}

.progress.is-success:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #48c78e), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #48c78e 30%, #ededed 0);
}

.progress.is-warning::-webkit-progress-value {
  background-color: #ffe08a;
}

.progress.is-warning::-moz-progress-bar {
  background-color: #ffe08a;
}

.progress.is-warning::-ms-fill {
  background-color: #ffe08a;
}

.progress.is-warning:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #ffe08a), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #ffe08a 30%, #ededed 0);
}

.progress.is-danger::-webkit-progress-value {
  background-color: #f14668;
}

.progress.is-danger::-moz-progress-bar {
  background-color: #f14668;
}

.progress.is-danger::-ms-fill {
  background-color: #f14668;
}

.progress.is-danger:indeterminate {
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #f14668), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #f14668 30%, #ededed 0);
}

.progress:indeterminate {
  -webkit-animation-duration: 1.5s;
  animation-duration: 1.5s;
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
  -webkit-animation-name: moveIndeterminate;
  animation-name: moveIndeterminate;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  background-color: #ededed;
  background-image: -webkit-gradient(linear, left top, right top, color-stop(30%, #4a4a4a), color-stop(30%, #ededed));
  background-image: linear-gradient(90deg, #4a4a4a 30%, #ededed 0);
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: 150% 150%;
}

.progress:indeterminate::-webkit-progress-bar {
  background-color: transparent;
}

.progress:indeterminate::-moz-progress-bar {
  background-color: transparent;
}

.progress:indeterminate::-ms-fill {
  animation-name: none;
}

.progress.is-small {
  height: 0.75rem;
}

.progress.is-medium {
  height: 1.25rem;
}

.progress.is-large {
  height: 1.5rem;
}

@-webkit-keyframes moveIndeterminate {
  0% {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@keyframes moveIndeterminate {
  0% {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

.table {
  background-color: #fff;
  color: #363636;
}

.table td,
.table th {
  border: 1px solid #dbdbdb;
  border-width: 0 0 1px;
  padding: 0.5em 0.75em;
  vertical-align: top;
}

.table td.is-white,
.table th.is-white {
  background-color: #fff;
  border-color: #fff;
  color: #0a0a0a;
}

.table td.is-black,
.table th.is-black {
  background-color: #0a0a0a;
  border-color: #0a0a0a;
  color: #fff;
}

.table td.is-light,
.table th.is-light {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.7);
}

.table td.is-dark,
.table th.is-dark {
  background-color: #363636;
  border-color: #363636;
  color: #fff;
}

.table td.is-primary,
.table th.is-primary {
  background-color: #42d3a5;
  border-color: #42d3a5;
  color: #fff;
}

.table td.is-link,
.table th.is-link {
  background-color: #485fc7;
  border-color: #485fc7;
  color: #fff;
}

.table td.is-info,
.table th.is-info {
  background-color: #3e8ed0;
  border-color: #3e8ed0;
  color: #fff;
}

.table td.is-success,
.table th.is-success {
  background-color: #48c78e;
  border-color: #48c78e;
  color: #fff;
}

.table td.is-warning,
.table th.is-warning {
  background-color: #ffe08a;
  border-color: #ffe08a;
  color: rgba(0, 0, 0, 0.7);
}

.table td.is-danger,
.table th.is-danger {
  background-color: #f14668;
  border-color: #f14668;
  color: #fff;
}

.table td.is-narrow,
.table th.is-narrow {
  white-space: nowrap;
  width: 1%;
}

.table td.is-selected,
.table th.is-selected {
  background-color: #42d3a5;
  color: #fff;
}

.table td.is-selected a,
.table td.is-selected strong,
.table th.is-selected a,
.table th.is-selected strong {
  color: currentColor;
}

.table td.is-vcentered,
.table th.is-vcentered {
  vertical-align: middle;
}

.table th {
  color: #363636;
}

.table th:not([align]) {
  text-align: left;
}

.table tr.is-selected {
  background-color: #42d3a5;
  color: #fff;
}

.table tr.is-selected a,
.table tr.is-selected strong {
  color: currentColor;
}

.table tr.is-selected td,
.table tr.is-selected th {
  border-color: #fff;
  color: currentColor;
}

.table thead {
  background-color: transparent;
}

.table thead td,
.table thead th {
  border-width: 0 0 2px;
  color: #363636;
}

.table tfoot {
  background-color: transparent;
}

.table tfoot td,
.table tfoot th {
  border-width: 2px 0 0;
  color: #363636;
}

.table tbody {
  background-color: transparent;
}

.table tbody tr:last-child td,
.table tbody tr:last-child th {
  border-bottom-width: 0;
}

.table.is-bordered td,
.table.is-bordered th {
  border-width: 1px;
}

.table.is-bordered tr:last-child td,
.table.is-bordered tr:last-child th {
  border-bottom-width: 1px;
}

.table.is-fullwidth {
  width: 100%;
}

.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover,
.table.is-hoverable tbody tr:not(.is-selected):hover {
  background-color: #fafafa;
}

.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover:nth-child(2n) {
  background-color: #f5f5f5;
}

.table.is-narrow td,
.table.is-narrow th {
  padding: 0.25em 0.5em;
}

.table.is-striped tbody tr:not(.is-selected):nth-child(2n) {
  background-color: #fafafa;
}

.table-container {
  -webkit-overflow-scrolling: touch;
  overflow: auto;
  overflow-y: hidden;
  max-width: 100%;
}

.tags {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  -webkit-box-pack: start;
  -ms-flex-pack: start;
  justify-content: flex-start;
}

.tags .tag {
  margin-bottom: 0.5rem;
}

.tags .tag:not(:last-child) {
  margin-right: 0.5rem;
}

.tags:last-child {
  margin-bottom: -0.5rem;
}

.tags:not(:last-child) {
  margin-bottom: 1rem;
}

.tags.are-medium .tag:not(.is-normal):not(.is-large) {
  font-size: 1rem;
}

.tags.are-large .tag:not(.is-normal):not(.is-medium) {
  font-size: 1.25rem;
}

.tags.is-centered {
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
}

.tags.is-centered .tag {
  margin-right: 0.25rem;
  margin-left: 0.25rem;
}

.tags.is-right {
  -webkit-box-pack: end;
  -ms-flex-pack: end;
  justify-content: flex-end;
}

.tags.is-right .tag:not(:first-child) {
  margin-left: 0.5rem;
}

.tags.has-addons .tag,
.tags.is-right .tag:not(:last-child) {
  margin-right: 0;
}

.tags.has-addons .tag:not(:first-child) {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.tags.has-addons .tag:not(:last-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.tag:not(body) {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #4a4a4a;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  font-size: 0.75rem;
  height: 2em;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  line-height: 1.5;
  padding-left: 0.75em;
  padding-right: 0.75em;
  white-space: nowrap;
}

.tag:not(body) .delete {
  margin-left: 0.25rem;
  margin-right: -0.375rem;
}

.tag:not(body).is-white {
  background-color: #fff;
  color: #0a0a0a;
}

.tag:not(body).is-black {
  background-color: #0a0a0a;
  color: #fff;
}

.tag:not(body).is-light {
  background-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.7);
}

.tag:not(body).is-dark {
  background-color: #363636;
  color: #fff;
}

.tag:not(body).is-primary {
  background-color: #42d3a5;
  color: #fff;
}

.tag:not(body).is-primary.is-light {
  background-color: #eefbf7;
  color: #1c785b;
}

.tag:not(body).is-link {
  background-color: #485fc7;
  color: #fff;
}

.tag:not(body).is-link.is-light {
  background-color: #eff1fa;
  color: #3850b7;
}

.tag:not(body).is-info {
  background-color: #3e8ed0;
  color: #fff;
}

.tag:not(body).is-info.is-light {
  background-color: #eff5fb;
  color: #296fa8;
}

.tag:not(body).is-success {
  background-color: #48c78e;
  color: #fff;
}

.tag:not(body).is-success.is-light {
  background-color: #effaf5;
  color: #257953;
}

.tag:not(body).is-warning {
  background-color: #ffe08a;
  color: rgba(0, 0, 0, 0.7);
}

.tag:not(body).is-warning.is-light {
  background-color: #fffaeb;
  color: #946c00;
}

.tag:not(body).is-danger {
  background-color: #f14668;
  color: #fff;
}

.tag:not(body).is-danger.is-light {
  background-color: #feecf0;
  color: #cc0f35;
}

.tag:not(body).is-normal {
  font-size: 0.75rem;
}

.tag:not(body).is-medium {
  font-size: 1rem;
}

.tag:not(body).is-large {
  font-size: 1.25rem;
}

.tag:not(body) .icon:first-child:not(:last-child) {
  margin-left: -0.375em;
  margin-right: 0.1875em;
}

.tag:not(body) .icon:last-child:not(:first-child) {
  margin-left: 0.1875em;
  margin-right: -0.375em;
}

.tag:not(body) .icon:first-child:last-child {
  margin-left: -0.375em;
  margin-right: -0.375em;
}

.tag:not(body).is-delete {
  margin-left: 1px;
  padding: 0;
  position: relative;
  width: 2em;
}

.tag:not(body).is-delete:after,
.tag:not(body).is-delete:before {
  background-color: currentColor;
  content: "";
  display: block;
  left: 50%;
  position: absolute;
  top: 50%;
  -webkit-transform: translateX(-50%) translateY(-50%) rotate(45deg);
  transform: translateX(-50%) translateY(-50%) rotate(45deg);
  -webkit-transform-origin: center center;
  transform-origin: center center;
}

.tag:not(body).is-delete:before {
  height: 1px;
  width: 50%;
}

.tag:not(body).is-delete:after {
  height: 50%;
  width: 1px;
}

.tag:not(body).is-delete:focus,
.tag:not(body).is-delete:hover {
  background-color: #e8e8e8;
}

.tag:not(body).is-delete:active {
  background-color: #dbdbdb;
}

.tag:not(body).is-rounded {
  border-radius: 9999px;
}

a.tag:hover {
  text-decoration: underline;
}

.subtitle,
.title {
  word-break: break-word;
}

.subtitle em,
.subtitle span,
.title em,
.title span {
  font-weight: inherit;
}

.subtitle sub,
.subtitle sup,
.title sub,
.title sup {
  font-size: 0.75em;
}

.subtitle .tag,
.title .tag {
  vertical-align: middle;
}

.title {
  color: #363636;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.125;
}

.title strong {
  color: inherit;
  font-weight: inherit;
}

.title:not(.is-spaced) + .subtitle {
  margin-top: -1.25rem;
}

.title.is-1 {
  font-size: 3rem;
}

.title.is-2 {
  font-size: 2.5rem;
}

.title.is-3 {
  font-size: 2rem;
}

.title.is-4 {
  font-size: 1.5rem;
}

.title.is-5 {
  font-size: 1.25rem;
}

.title.is-6 {
  font-size: 1rem;
}

.title.is-7 {
  font-size: 0.75rem;
}

.subtitle {
  color: #4a4a4a;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
}

.subtitle strong {
  color: #363636;
  font-weight: 600;
}

.subtitle:not(.is-spaced) + .title {
  margin-top: -1.25rem;
}

.subtitle.is-1 {
  font-size: 3rem;
}

.subtitle.is-2 {
  font-size: 2.5rem;
}

.subtitle.is-3 {
  font-size: 2rem;
}

.subtitle.is-4 {
  font-size: 1.5rem;
}

.subtitle.is-5 {
  font-size: 1.25rem;
}

.subtitle.is-6 {
  font-size: 1rem;
}

.subtitle.is-7 {
  font-size: 0.75rem;
}

.heading {
  display: block;
  font-size: 11px;
  letter-spacing: 1px;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.number {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 9999px;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  font-size: 1.25rem;
  height: 2em;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  margin-right: 1.5rem;
  min-width: 2.5em;
  padding: 0.25rem 0.5rem;
  text-align: center;
  vertical-align: top;
}

.input,
.select select,
.textarea {
  background-color: #fff;
  border-color: #dbdbdb;
  border-radius: 4px;
  color: #363636;
}

.input::-moz-placeholder,
.select select::-moz-placeholder,
.textarea::-moz-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input::-webkit-input-placeholder,
.select select::-webkit-input-placeholder,
.textarea::-webkit-input-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:-moz-placeholder,
.select select:-moz-placeholder,
.textarea:-moz-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:-ms-input-placeholder,
.select select:-ms-input-placeholder,
.textarea:-ms-input-placeholder {
  color: rgba(54, 54, 54, 0.3);
}

.input:hover,
.is-hovered.input,
.is-hovered.textarea,
.select select.is-hovered,
.select select:hover,
.textarea:hover {
  border-color: #b5b5b5;
}

.input:active,
.input:focus,
.is-active.input,
.is-active.textarea,
.is-focused.input,
.is-focused.textarea,
.select select.is-active,
.select select.is-focused,
.select select:active,
.select select:focus,
.textarea:active,
.textarea:focus {
  border-color: #42d3a5;
  -webkit-box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
}

.select fieldset[disabled] select,
.select select[disabled],
[disabled].input,
[disabled].textarea,
fieldset[disabled] .input,
fieldset[disabled] .select select,
fieldset[disabled] .textarea {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  -webkit-box-shadow: none;
  box-shadow: none;
  color: #7a7a7a;
}

.select fieldset[disabled] select::-moz-placeholder,
.select select[disabled]::-moz-placeholder,
[disabled].input::-moz-placeholder,
[disabled].textarea::-moz-placeholder,
fieldset[disabled] .input::-moz-placeholder,
fieldset[disabled] .select select::-moz-placeholder,
fieldset[disabled] .textarea::-moz-placeholder {
  color: hsla(0, 0%, 47.8%, 0.3);
}

.select fieldset[disabled] select::-webkit-input-placeholder,
.select select[disabled]::-webkit-input-placeholder,
[disabled].input::-webkit-input-placeholder,
[disabled].textarea::-webkit-input-placeholder,
fieldset[disabled] .input::-webkit-input-placeholder,
fieldset[disabled] .select select::-webkit-input-placeholder,
fieldset[disabled] .textarea::-webkit-input-placeholder {
  color: hsla(0, 0%, 47.8%, 0.3);
}

.select fieldset[disabled] select:-moz-placeholder,
.select select[disabled]:-moz-placeholder,
[disabled].input:-moz-placeholder,
[disabled].textarea:-moz-placeholder,
fieldset[disabled] .input:-moz-placeholder,
fieldset[disabled] .select select:-moz-placeholder,
fieldset[disabled] .textarea:-moz-placeholder {
  color: hsla(0, 0%, 47.8%, 0.3);
}

.select fieldset[disabled] select:-ms-input-placeholder,
.select select[disabled]:-ms-input-placeholder,
[disabled].input:-ms-input-placeholder,
[disabled].textarea:-ms-input-placeholder,
fieldset[disabled] .input:-ms-input-placeholder,
fieldset[disabled] .select select:-ms-input-placeholder,
fieldset[disabled] .textarea:-ms-input-placeholder {
  color: hsla(0, 0%, 47.8%, 0.3);
}

.input,
.textarea {
  -webkit-box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
  box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
  max-width: 100%;
  width: 100%;
}

[readonly].input,
[readonly].textarea {
  -webkit-box-shadow: none;
  box-shadow: none;
}

.is-white.input,
.is-white.textarea {
  border-color: #fff;
}

.is-white.input:active,
.is-white.input:focus,
.is-white.is-active.input,
.is-white.is-active.textarea,
.is-white.is-focused.input,
.is-white.is-focused.textarea,
.is-white.textarea:active,
.is-white.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
}

.is-black.input,
.is-black.textarea {
  border-color: #0a0a0a;
}

.is-black.input:active,
.is-black.input:focus,
.is-black.is-active.input,
.is-black.is-active.textarea,
.is-black.is-focused.input,
.is-black.is-focused.textarea,
.is-black.textarea:active,
.is-black.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
}

.is-light.input,
.is-light.textarea {
  border-color: #f5f5f5;
}

.is-light.input:active,
.is-light.input:focus,
.is-light.is-active.input,
.is-light.is-active.textarea,
.is-light.is-focused.input,
.is-light.is-focused.textarea,
.is-light.textarea:active,
.is-light.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
}

.is-dark.input,
.is-dark.textarea {
  border-color: #363636;
}

.is-dark.input:active,
.is-dark.input:focus,
.is-dark.is-active.input,
.is-dark.is-active.textarea,
.is-dark.is-focused.input,
.is-dark.is-focused.textarea,
.is-dark.textarea:active,
.is-dark.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
}

.is-primary.input,
.is-primary.textarea {
  border-color: #42d3a5;
}

.is-primary.input:active,
.is-primary.input:focus,
.is-primary.is-active.input,
.is-primary.is-active.textarea,
.is-primary.is-focused.input,
.is-primary.is-focused.textarea,
.is-primary.textarea:active,
.is-primary.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
}

.is-link.input,
.is-link.textarea {
  border-color: #485fc7;
}

.is-link.input:active,
.is-link.input:focus,
.is-link.is-active.input,
.is-link.is-active.textarea,
.is-link.is-focused.input,
.is-link.is-focused.textarea,
.is-link.textarea:active,
.is-link.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
}

.is-info.input,
.is-info.textarea {
  border-color: #3e8ed0;
}

.is-info.input:active,
.is-info.input:focus,
.is-info.is-active.input,
.is-info.is-active.textarea,
.is-info.is-focused.input,
.is-info.is-focused.textarea,
.is-info.textarea:active,
.is-info.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
  box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
}

.is-success.input,
.is-success.textarea {
  border-color: #48c78e;
}

.is-success.input:active,
.is-success.input:focus,
.is-success.is-active.input,
.is-success.is-active.textarea,
.is-success.is-focused.input,
.is-success.is-focused.textarea,
.is-success.textarea:active,
.is-success.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
}

.is-warning.input,
.is-warning.textarea {
  border-color: #ffe08a;
}

.is-warning.input:active,
.is-warning.input:focus,
.is-warning.is-active.input,
.is-warning.is-active.textarea,
.is-warning.is-focused.input,
.is-warning.is-focused.textarea,
.is-warning.textarea:active,
.is-warning.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
  box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
}

.is-danger.input,
.is-danger.textarea {
  border-color: #f14668;
}

.is-danger.input:active,
.is-danger.input:focus,
.is-danger.is-active.input,
.is-danger.is-active.textarea,
.is-danger.is-focused.input,
.is-danger.is-focused.textarea,
.is-danger.textarea:active,
.is-danger.textarea:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
}

.is-small.input,
.is-small.textarea {
  border-radius: 2px;
  font-size: 0.75rem;
}

.is-medium.input,
.is-medium.textarea {
  font-size: 1.25rem;
}

.is-large.input,
.is-large.textarea {
  font-size: 1.5rem;
}

.is-fullwidth.input,
.is-fullwidth.textarea {
  display: block;
  width: 100%;
}

.is-inline.input,
.is-inline.textarea {
  display: inline;
  width: auto;
}

.input.is-rounded {
  border-radius: 9999px;
  padding-left: calc(1.125em - 1px);
  padding-right: calc(1.125em - 1px);
}

.input.is-static {
  background-color: transparent;
  border-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
  padding-left: 0;
  padding-right: 0;
}

.textarea {
  display: block;
  max-width: 100%;
  min-width: 100%;
  padding: calc(0.75em - 1px);
  resize: vertical;
}

.textarea:not([rows]) {
  max-height: 40em;
  min-height: 8em;
}

.textarea[rows] {
  height: auto;
}

.textarea.has-fixed-size {
  resize: none;
}

.checkbox,
.radio {
  cursor: pointer;
  display: inline-block;
  line-height: 1.25;
  position: relative;
}

.checkbox input,
.radio input {
  cursor: pointer;
}

.checkbox:hover,
.radio:hover {
  color: #363636;
}

.checkbox input[disabled],
.radio input[disabled],
[disabled].checkbox,
[disabled].radio,
fieldset[disabled] .checkbox,
fieldset[disabled] .radio {
  color: #7a7a7a;
  cursor: not-allowed;
}

.radio + .radio {
  margin-left: 0.5em;
}

.select {
  display: inline-block;
  max-width: 100%;
  position: relative;
  vertical-align: top;
}

.select:not(.is-multiple) {
  height: 2.5em;
}

.select:not(.is-multiple):not(.is-loading):after {
  border-color: #42d3a5;
  right: 1.125em;
  z-index: 4;
}

.select.is-rounded select {
  border-radius: 9999px;
  padding-left: 1em;
}

.select select {
  cursor: pointer;
  display: block;
  font-size: 1em;
  max-width: 100%;
  outline: none;
}

.select select::-ms-expand {
  display: none;
}

.select select[disabled]:hover,
fieldset[disabled] .select select:hover {
  border-color: #f5f5f5;
}

.select select:not([multiple]) {
  padding-right: 2.5em;
}

.select select[multiple] {
  height: auto;
  padding: 0;
}

.select select[multiple] option {
  padding: 0.5em 1em;
}

.select:not(.is-multiple):not(.is-loading):hover:after {
  border-color: #363636;
}

.select.is-white:not(:hover):after,
.select.is-white select {
  border-color: #fff;
}

.select.is-white select.is-hovered,
.select.is-white select:hover {
  border-color: #f2f2f2;
}

.select.is-white select.is-active,
.select.is-white select.is-focused,
.select.is-white select:active,
.select.is-white select:focus {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 100%, 0.25);
}

.select.is-black:not(:hover):after,
.select.is-black select {
  border-color: #0a0a0a;
}

.select.is-black select.is-hovered,
.select.is-black select:hover {
  border-color: #000;
}

.select.is-black select.is-active,
.select.is-black select.is-focused,
.select.is-black select:active,
.select.is-black select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);
}

.select.is-light:not(:hover):after,
.select.is-light select {
  border-color: #f5f5f5;
}

.select.is-light select.is-hovered,
.select.is-light select:hover {
  border-color: #e8e8e8;
}

.select.is-light select.is-active,
.select.is-light select.is-focused,
.select.is-light select:active,
.select.is-light select:focus {
  -webkit-box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
  box-shadow: 0 0 0 0.125em hsla(0, 0%, 96.1%, 0.25);
}

.select.is-dark:not(:hover):after,
.select.is-dark select {
  border-color: #363636;
}

.select.is-dark select.is-hovered,
.select.is-dark select:hover {
  border-color: #292929;
}

.select.is-dark select.is-active,
.select.is-dark select.is-focused,
.select.is-dark select:active,
.select.is-dark select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);
}

.select.is-primary:not(:hover):after,
.select.is-primary select {
  border-color: #42d3a5;
}

.select.is-primary select.is-hovered,
.select.is-primary select:hover {
  border-color: #2fcc9a;
}

.select.is-primary select.is-active,
.select.is-primary select.is-focused,
.select.is-primary select:active,
.select.is-primary select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0 0.125em rgba(66, 211, 165, 0.25);
}

.select.is-link:not(:hover):after,
.select.is-link select {
  border-color: #485fc7;
}

.select.is-link select.is-hovered,
.select.is-link select:hover {
  border-color: #3a51bb;
}

.select.is-link select.is-active,
.select.is-link select.is-focused,
.select.is-link select:active,
.select.is-link select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 95, 199, 0.25);
}

.select.is-info:not(:hover):after,
.select.is-info select {
  border-color: #3e8ed0;
}

.select.is-info select.is-hovered,
.select.is-info select:hover {
  border-color: #3082c5;
}

.select.is-info select.is-active,
.select.is-info select.is-focused,
.select.is-info select:active,
.select.is-info select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
  box-shadow: 0 0 0 0.125em rgba(62, 142, 208, 0.25);
}

.select.is-success:not(:hover):after,
.select.is-success select {
  border-color: #48c78e;
}

.select.is-success select.is-hovered,
.select.is-success select:hover {
  border-color: #3abb81;
}

.select.is-success select.is-active,
.select.is-success select.is-focused,
.select.is-success select:active,
.select.is-success select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
  box-shadow: 0 0 0 0.125em rgba(72, 199, 142, 0.25);
}

.select.is-warning:not(:hover):after,
.select.is-warning select {
  border-color: #ffe08a;
}

.select.is-warning select.is-hovered,
.select.is-warning select:hover {
  border-color: #ffd970;
}

.select.is-warning select.is-active,
.select.is-warning select.is-focused,
.select.is-warning select:active,
.select.is-warning select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
  box-shadow: 0 0 0 0.125em rgba(255, 224, 138, 0.25);
}

.select.is-danger:not(:hover):after,
.select.is-danger select {
  border-color: #f14668;
}

.select.is-danger select.is-hovered,
.select.is-danger select:hover {
  border-color: #ef2e55;
}

.select.is-danger select.is-active,
.select.is-danger select.is-focused,
.select.is-danger select:active,
.select.is-danger select:focus {
  -webkit-box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);
}

.select.is-small {
  border-radius: 2px;
  font-size: 0.75rem;
}

.select.is-medium {
  font-size: 1.25rem;
}

.select.is-large {
  font-size: 1.5rem;
}

.select.is-disabled:after {
  border-color: #7a7a7a !important;
  opacity: 0.5;
}

.select.is-fullwidth,
.select.is-fullwidth select {
  width: 100%;
}

.select.is-loading:after {
  margin-top: 0;
  position: absolute;
  right: 0.625em;
  top: 0.625em;
  -webkit-transform: none;
  transform: none;
}

.select.is-loading.is-small:after {
  font-size: 0.75rem;
}

.select.is-loading.is-medium:after {
  font-size: 1.25rem;
}

.select.is-loading.is-large:after {
  font-size: 1.5rem;
}

.file {
  -webkit-box-align: stretch;
  -ms-flex-align: stretch;
  align-items: stretch;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: start;
  -ms-flex-pack: start;
  justify-content: flex-start;
  position: relative;
}

.file.is-white .file-cta {
  background-color: #fff;
  border-color: transparent;
  color: #0a0a0a;
}

.file.is-white.is-hovered .file-cta,
.file.is-white:hover .file-cta {
  background-color: #f9f9f9;
  border-color: transparent;
  color: #0a0a0a;
}

.file.is-white.is-focused .file-cta,
.file.is-white:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em hsla(0, 0%, 100%, 0.25);
  box-shadow: 0 0 0.5em hsla(0, 0%, 100%, 0.25);
  color: #0a0a0a;
}

.file.is-white.is-active .file-cta,
.file.is-white:active .file-cta {
  background-color: #f2f2f2;
  border-color: transparent;
  color: #0a0a0a;
}

.file.is-black .file-cta {
  background-color: #0a0a0a;
  border-color: transparent;
  color: #fff;
}

.file.is-black.is-hovered .file-cta,
.file.is-black:hover .file-cta {
  background-color: #040404;
  border-color: transparent;
  color: #fff;
}

.file.is-black.is-focused .file-cta,
.file.is-black:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);
  box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);
  color: #fff;
}

.file.is-black.is-active .file-cta,
.file.is-black:active .file-cta {
  background-color: #000;
  border-color: transparent;
  color: #fff;
}

.file.is-light .file-cta {
  background-color: #f5f5f5;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.file.is-light.is-hovered .file-cta,
.file.is-light:hover .file-cta {
  background-color: #eee;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.file.is-light.is-focused .file-cta,
.file.is-light:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em hsla(0, 0%, 96.1%, 0.25);
  box-shadow: 0 0 0.5em hsla(0, 0%, 96.1%, 0.25);
  color: rgba(0, 0, 0, 0.7);
}

.file.is-light.is-active .file-cta,
.file.is-light:active .file-cta {
  background-color: #e8e8e8;
  border-color: transparent;
  color: rgba(0, 0, 0, 0.7);
}

.file.is-dark .file-cta {
  background-color: #363636;
  border-color: transparent;
  color: #fff;
}

.file.is-dark.is-hovered .file-cta,
.file.is-dark:hover .file-cta {
  background-color: #2f2f2f;
  border-color: transparent;
  color: #fff;
}

.file.is-dark.is-focused .file-cta,
.file.is-dark:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);
  box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);
  color: #fff;
}

.file.is-dark.is-active .file-cta,
.file.is-dark:active .file-cta {
  background-color: #292929;
  border-color: transparent;
  color: #fff;
}

.file.is-primary .file-cta {
  background-color: #42d3a5;
  border-color: transparent;
  color: #fff;
}

.file.is-primary.is-hovered .file-cta,
.file.is-primary:hover .file-cta {
  background-color: #38d1a0;
  border-color: transparent;
  color: #fff;
}

.file.is-primary.is-focused .file-cta,
.file.is-primary:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(66, 211, 165, 0.25);
  box-shadow: 0 0 0.5em rgba(66, 211, 165, 0.25);
  color: #fff;
}

.file.is-primary.is-active .file-cta,
.file.is-primary:active .file-cta {
  background-color: #2fcc9a;
  border-color: transparent;
  color: #fff;
}

.file.is-link .file-cta {
  background-color: #485fc7;
  border-color: transparent;
  color: #fff;
}

.file.is-link.is-hovered .file-cta,
.file.is-link:hover .file-cta {
  background-color: #3e56c4;
  border-color: transparent;
  color: #fff;
}

.file.is-link.is-focused .file-cta,
.file.is-link:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(72, 95, 199, 0.25);
  box-shadow: 0 0 0.5em rgba(72, 95, 199, 0.25);
  color: #fff;
}

.file.is-link.is-active .file-cta,
.file.is-link:active .file-cta {
  background-color: #3a51bb;
  border-color: transparent;
  color: #fff;
}

.file.is-info .file-cta {
  background-color: #3e8ed0;
  border-color: transparent;
  color: #fff;
}

.file.is-info.is-hovered .file-cta,
.file.is-info:hover .file-cta {
  background-color: #3488ce;
  border-color: transparent;
  color: #fff;
}

.file.is-info.is-focused .file-cta,
.file.is-info:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(62, 142, 208, 0.25);
  box-shadow: 0 0 0.5em rgba(62, 142, 208, 0.25);
  color: #fff;
}

.file.is-info.is-active .file-cta,
.file.is-info:active .file-cta {
  background-color: #3082c5;
  border-color: transparent;
  color: #fff;
}

.file.is-success .file-cta {
  background-color: #48c78e;
  border-color: transparent;
  color: #fff;
}

.file.is-success.is-hovered .file-cta,
.file.is-success:hover .file-cta {
  background-color: #3ec487;
  border-color: transparent;
  color: #fff;
}

.file.is-success.is-focused .file-cta,
.file.is-success:focus .file-cta {
  border-color: transparent;
  -webkit-box-shadow: 0 0 0.5em rgba(72, 199, 142, 0.25);
  box-shadow: 0 0 0.5em rgba(72, 199, 142, 0.25);
  color: #fff;
}

.file.is-success.is-active .file-cta,
.file.is-success:active .file-cta {
  background-color: #3abb81;
  border-color: transparent;
  color: #fff;
}

.card {
  background-color: #fff;
  border-radius: 0.25rem;
  -webkit-box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px rgba(10, 10, 10, 0.02);
  box-shadow:
    0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
    0 0 0 1px rgba(10, 10, 10, 0.02);
  color: #4a4a4a;
  max-width: 100%;
  position: relative;
}

.card-content:first-child,
.card-footer:first-child,
.card-header:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.card-content:last-child,
.card-footer:last-child,
.card-header:last-child {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.card-header {
  background-color: transparent;
  -webkit-box-align: stretch;
  -ms-flex-align: stretch;
  align-items: stretch;
  -webkit-box-shadow: 0 0.125em 0.25em rgba(10, 10, 10, 0.1);
  box-shadow: 0 0.125em 0.25em rgba(10, 10, 10, 0.1);
}

.card-header,
.card-header-title {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.card-header-title {
  background: #f6f8f9;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  color: #363636;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  font-weight: 700;
  padding: 0.75rem 1rem;
}

.card-header-icon,
.card-header-title.is-centered {
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
}

.card-header-icon {
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background: none;
  border: none;
  color: currentColor;
  font-family: inherit;
  font-size: 1em;
  margin: 0;
  padding: 0;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  padding: 0.75rem 1rem;
}

.card-image {
  display: block;
  position: relative;
}

.card-image:first-child img {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.card-image:last-child img {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.card-content {
  background-color: transparent;
  padding: 1.5rem;
}

.card-footer {
  background-color: transparent;
  border-top: 1px solid #ededed;
  -webkit-box-align: stretch;
  -ms-flex-align: stretch;
  align-items: stretch;
}

.card-footer,
.card-footer-item {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.card-footer-item {
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-preferred-size: 0;
  flex-basis: 0;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0.75rem;
}

.card-footer-item:not(:last-child) {
  border-right: 1px solid #ededed;
}

.card .media:not(:last-child) {
  margin-bottom: 1.5rem;
}

.dropdown {
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  position: relative;
  vertical-align: top;
}

.dropdown.is-active .dropdown-menu,
.dropdown.is-hoverable:hover .dropdown-menu {
  display: block;
}

.dropdown.is-right .dropdown-menu {
  left: auto;
  right: 0;
}

.dropdown.is-up .dropdown-menu {
  bottom: 100%;
  padding-bottom: 4px;
  padding-top: 0;
  top: auto;
}

.content.is-loading:after,
.section.is-loading:after {
  border: 2px solid #dbdbdb;
  border-radius: 9999px;
  border-right-color: transparent;
  border-top-color: transparent;
  display: block;
  height: 1em;
  width: 1em;
  height: 5rem;
  width: 5rem;
  left: calc(50% - 2.5em);
  top: calc(50% - 2.5em);
  border-width: 0.5rem;
}

.content.is-loading:after,
.section.is-loading:after,
p.is-loading:before {
  -webkit-animation: spinAround 0.5s linear infinite;
  animation: spinAround 0.5s linear infinite;
  content: "";
  position: relative;
}

p.is-loading:before {
  border: 2px solid #dbdbdb;
  border-radius: 9999px;
  border-right-color: transparent;
  border-top-color: transparent;
  display: block;
  height: 1em;
  width: 1em;
  display: inline-block;
  right: 0.25em;
}

.card .hero {
  padding: 0.75rem;
}

.has-bullet:before {
  background: currentColor;
  content: "";
  width: 0.75em;
  height: 0.75em;
  display: inline-block;
  margin-right: 0.25em;
}

.has-bullet.has-bullet-white:before {
  background-color: #fff;
}

.has-bullet.has-bullet-black:before {
  background-color: #0a0a0a;
}

.has-bullet.has-bullet-light:before {
  background-color: #f5f5f5;
}

.has-bullet.has-bullet-dark:before {
  background-color: #363636;
}

.has-bullet.has-bullet-primary:before {
  background-color: #42d3a5;
}

.has-bullet.has-bullet-link:before {
  background-color: #485fc7;
}

.has-bullet.has-bullet-info:before {
  background-color: #3e8ed0;
}

.has-bullet.has-bullet-success:before {
  background-color: #48c78e;
}

.has-bullet.has-bullet-warning:before {
  background-color: #ffe08a;
}

.has-bullet.has-bullet-danger:before {
  background-color: #f14668;
}

.tick line {
  stroke: currentColor;
}

.tick text {
  fill: currentColor;
  font-size: 0.75rem;
}

path.domain {
  stroke: currentColor;
}

.login {
  background-color: #242424;
}

.login--logo {
  margin-left: auto;
  margin-right: auto;
}

.fade-in-enter-active {
  -webkit-animation: fade-in 0.5s forwards;
  animation: fade-in 0.5s forwards;
}

@-webkit-keyframes fade-in {
  0% {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
