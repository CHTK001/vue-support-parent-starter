<template>
  <div :style="{ height: '600px', overflow: 'auto' }">
    <el-skeleton v-if="loading" />
    <div v-else>
      <el-empty v-if="detailData.length == 0" />
      <el-timeline v-else v-infinite-scroll="load" style="max-width: 98%" class="infinite-list" :infinite-scroll-disabled="disabled" :infinite-scroll-immediate="false">
        <el-timeline-item v-for="(item, index) in detailData" :key="index" :timestamp="dateFormat(item.timestamp * 1)" color="#0bbd87" icon="MoreFilled" placement="top">
          <el-card v-if="item.text" style="width: 100%">
            <el-tag v-if="item.event" style="margin-left: 10px" type="danger">{{ item.event }}</el-tag>
            <el-tag v-if="item.from" style="margin-left: 10px" type="info">{{ item.from }}</el-tag>
            <el-tag v-if="item.threadAddress" style="margin-left: 10px">{{ item.threadAddress }}</el-tag>
            <el-tag v-if="item.thread" style="margin-left: 10px">{{ item.thread }}</el-tag>
            <el-tag v-if="item.threadId" style="margin-left: 10px">THREAD: {{ item.threadId }}</el-tag>
            <pre ref="sqlPre" class="language-sql line-numbers inline-color"><code class="language-sql line-numbers inline-color">{{ getMessage(item.text || item.sql) }} </code> </pre>
          </el-card>
        </el-timeline-item>
        <p v-if="loading" style="text-align: center; margin-top: 20px">加载中...</p>
        <p v-if="noMore" style="text-align: center; margin-top: 20px">无更多数据</p>
      </el-timeline>
    </div>
  </div>
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
import { fetchPageEvent } from "@/api/event";
import { dateFormat } from "@/utils/date";
export default {
  name: "consoleLog",
  props: {
    time: { type: Array, default: () => [] },
    width: { type: String, default: "100%" }
  },
  data() {
    return {
      detailVisiable: false,
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
      data: [],
      current: 0,
      pages: 0,
      total: 0,
      socket: inject("socket"),
      eventSource: null,
      tableName: null,
      action: null,
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
    this.rangTimeValue = this.time;
    Prism.highlightAll();
    this.close();
  },
  methods: {
    dateFormat,
    getMessage(msg) {
      try {
        return format(msg);
      } catch (error) {
        return msg;
      }
    },
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
      this.loading = false;
      this.detailVisiable = false;
      this.detailData.length = 0;
      this.detailTotal = 0;
      this.pages = 0;
      this.current = 0;
      this.searchTitle = null;
      this.tableName = null;
      this.action = null;
      this.form = {};
    },
    doSearch() {
      if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
        this.$message.error("请选择时间");
        return;
      }
      this.afterPropertiesSet();
    },
    load() {
      setTimeout(() => {
        if (this.current >= this.pages) {
          this.noMore = true;
          this.disabled = true;
          return;
        }
        this.afterPropertiesSet();
      }, 500);
    },
    async afterPropertiesSet() {
      fetchPageEvent({
        event: "sql",
        action: this.form.action,
        keyword: this.form.keyword,
        startTime: this.getTime(0),
        endTime: this.getTime(1),
        pageSize: 10,
        sort: "timestamp",
        page: this.current + 1
      })
        .then(res => {
          if (res.code == "00000") {
            this.highlightSQL();
            res.data.data.forEach(it => {
              this.detailData.push(it);
            });
            this.total = this.detailTotal = res.data.total;
            this.current = res.data.current;
            this.pages = res.data.pages;
            if (!this.searchTitle || "查询日志" == this.searchTitle) {
              this.searchTitle = "查询日志(共匹配到" + this.total + "条记录)";
            }
            this.$emit("success", this.searchTitle, this.total);
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    open(rangTimeValue, form, query, clear = false) {
      this.total = 0;
      this.current = 0;
      this.detailData.length = 0;
      this.loading = true;
      if (clear) {
        this.close();
      }
      Object.assign(this.form, form);
      this.tableName = query?.tableName;
      if (query?.current) {
        this.current = query?.current;
      }
      this.form.action = query?.action;
      this.form.keyword = query?.keyword;
      this.detailVisiable = true;
      this.rangTimeValue = rangTimeValue;
      this.doSearch();
      return this;
    }
  }
};
</script>
