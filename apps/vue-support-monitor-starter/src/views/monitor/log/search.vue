<template>
  <div :style="{ height: '600px', overflow: 'hidden' }">
    <el-skeleton v-if="loading" />
    <div v-else class="h-full">
      <el-empty v-if="detailData.length == 0" />
      <ul v-else v-infinite-scroll="load" class="h-full overflow-auto infinite-list" :infinite-scroll-disabled="disabled" :infinite-scroll-immediate="false">
        <li v-for="(item, index) in detailData" :key="index" :timestamp="dateFormat(item.timestamp * 1)" color="#0bbd87" icon="MoreFilled" placement="top">
          <span style="color: rgb(22 165 67)">
            <b>[{{ dateFormat(item?.timestamp * 1) }}]</b>
          </span>
          <span v-if="item?.level == 'INFO'" class="ml-1" style="color: rgb(93 137 239)">
            <b>[ {{ item?.level }}]</b>
          </span>
          <span v-else-if="item?.level == 'ERROR'" class="ml-1" style="color: rgb(255 0 0)">
            <b>[ {{ item?.level }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.traceId }}]</b>
          </span>

          <span class="ml-1" style="color: rgb(207 55 55)">
            <b>[{{ item?.thread }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.className }}]</b>
          </span>

          <span class="ml-1">
            <b>- {{ item?.text }}</b>
          </span>
        </li>
        <p v-if="loading" style="text-align: center; margin-top: 20px">加载中...</p>
        <p v-if="noMore" style="text-align: center; margin-top: 20px">无更多数据</p>
      </ul>
    </div>
  </div>
</template>
<script>
import { inject, defineAsyncComponent } from "vue";

// 引入Prism.js
import { fetchPageEvent } from "@/api/event";
import { dateFormat } from "@repo/utils";
export default {
  name: "consoleLog",
  components: {},
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
      event: "'log'",
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
    this.close();
  },
  methods: {
    dateFormat,
    getMessage(msg) {
      try {
        return msg;
      } catch (error) {
        return msg;
      }
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
        event: this.event,
        action: this.form.action,
        keyword: this.form.keyword,
        startTime: this.getTime(0),
        endTime: this.getTime(1),
        pageSize: 100,
        sort: "timestamp",
        page: this.current + 1
      })
        .then(res => {
          if (res.code == "00000") {
            this.detailData = res.data.data;
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
