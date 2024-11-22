<template>
  <div class="relative h-full" :style="{ width: width }">
    <div class="absolute" style="top: 1%; left: 0%; z-index: 1">
      <el-button v-if="form.supportBackup === true" circle type="primary" :icon="useRenderIcon('ep:search')" @click="doSearch" />
      <el-button v-if="form.supportBackup === true" circle type="primary" :icon="useRenderIcon('ep:download')" @click="doDownload" />
    </div>
    <div ref="containerRef" style="height: 90%; overflow: auto" @keyup="keyEvent">
      <ul>
        <li v-for="(item, index) in dataValue" :key="index">
          <el-card style="width: 100%">
            <pre ref="sqlPre" class="language-sql line-numbers inline-color"> <code class="language-sql line-numbers inline-color"> {{ getMessage(item) }} </code> </pre>
          </el-card>
        </li>
      </ul>

      <el-empty v-if="!dataValue || dataValue.length == 0" />
    </div>
  </div>

  <search-dialog v-if="searchDialogStatus" ref="searchDialogRef" />
  <download-dialog v-if="downloadDialogStatus" ref="downloadDialogRef" />
</template>
<script>
import { format } from "sql-formatter";
import { inject, defineAsyncComponent } from "vue";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import SearchDialog from "./time.vue";
import DownloadDialog from "./download.vue";
import { dateFormat } from "@repo/utils";
import { AnsiUp } from "ansi_up";
import { useConfigStore } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const ansi_up = new AnsiUp();
export default {
  name: "consoleLog",
  components: { SearchDialog, DownloadDialog },
  props: {
    data: { type: Object, default: () => ({}) },
    width: { type: String, default: "100%" }
  },
  data() {
    return {
      searchDialogStatus: false,
      downloadDialogStatus: false,
      rangTimeValue: [],
      editDialogStatus: false,
      form: {},
      loading: false,
      noMore: false,
      disabled: false,
      input: "",
      detailData: [],
      searchTitle: "查询日志",
      detailTotal: 0,
      showFile: 0,
      title: "",
      dataValue: [],
      current: 0,
      pages: 0,
      total: 0,
      socket: null,
      eventSource: null,
      options: {
        hintOptions: {
          // 自定义提示选项
          completeSingle: false,
          tables: {
            users: ["name", "score", "birthDate"],
            countries: ["name", "population", "size"],
            score: ["zooao"]
          }
        }
      }
    };
  },
  beforeUnmount() {
    this.close();
  },
  created() {},
  mounted() {
    this.open(this.data);
    Prism.highlightAll();
  },
  methods: {
    useRenderIcon,
    getMessage(msg) {
      return "" + format(msg?.data);
    },
    dateFormat,
    highlightSQL() {
      setTimeout(() => {
        const _this = this;
        Prism.highlightAll();
        this.$nextTick(() => {
          // 假设你的SQL代码在模板的pre标签中
          const pre = _this.$refs.sqlPre;
          // 使用Prism.highlightElement来高亮代码
          try {
            Prism.highlightElement(pre);
          } catch (error) {}
        });
      }, 300);
    },
    getTime(i) {
      try {
        return this.rangTimeValue[i].getTime();
      } catch (error) {
        return this.rangTimeValue[i].$d.getTime();
      }
    },
    close() {
      this.closeSocket();
    },
    doSearch() {
      this.searchDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.searchDialogRef.open(this.form);
      });
    },
    doDownload() {
      this.downloadDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.downloadDialogRef.open(this.form);
      });
    },
    open(row) {
      this.form = row;
      this.editDialogStatus = true;
      this.title = row.genName + "日志";
      this.openSocket();
      return this;
    },
    openSocket() {
      this.socket = useConfigStore()?.socket;
      const _this = this;
      this.socket.on("log-gen-" + this.form.genId, data => {
        const value = data;
        _this.dataValue = [value, ..._this.dataValue];
        if (_this.dataValue.length > 10000) {
          _this.dataValue.shift();
        }
        this.highlightSQL();
        // _this.$nextTick(() => {
        //     let scrollEl = _this.$refs.containerRef;
        //     scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
        //     this.highlightSQL();
        // });
      });
    },
    closeSocket() {
      this.socket.off("log-gen-" + this.form.genId);
    }
  }
};
</script>
