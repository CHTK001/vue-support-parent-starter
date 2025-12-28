<template>
  <div>
    <sc-dialog
      v-model="showDialog"
      draggable
      width="70%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      title="日志cat"
      @close="onClose"
    >
      <div class="container">
        <el-skeleton :animated="true" :loading="loadingStatus">
          <el-empty
            v-if="!returnResult || !returnResult.logContent"
            description="暂无日志"
          />
          <div v-else style="height: 100%" class="code-style">
            <code>
              <pre>{{ returnResult.logContent?.replaceAll('<br>', '\r\n') }}</pre>
            </code>
          </div>
        </el-skeleton>
      </div>
    </sc-dialog>
  </div>
</template>

<script>
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import { fetchJobLogCat } from "@/api/monitor/job";
import "highlight.js/styles/atom-one-light.css";
import "prismjs/components/prism-sql.min.js";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/themes/prism-tomorrow.min.css";
export default {
  data() {
    return {
      form: {},
      showDialog: false,
      loadingStatus: false,
      returnResult: {
        logContent: "",
      },
    };
  },
  mounted: function () {
    // this.form.logId = ~~this.$route.params.logId;
    // this.initial();
  },
  methods: {
    onClose() {
      this.form = {};
      this.showDialog = false;
    },
    open() {
      this.showDialog = true;
      return this;
    },
    setData(row) {
      this.form = row;
      this.initial();
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
    initial() {
      this.loadingStatus = true;
      fetchJobLogCat({
        jobLogId: this.form.jobLogId,
        fromLineNum: 0,
      })
        .then((res) => {
          if (res.code === "00000") {
            try {
              this.returnResult = JSON.parse(res.data);
            } catch (error) {
              this.returnResult = {};
            }
            this.$nextTick(() => {
              this.highlightSQL();
            });
            return !1;
          }
          this.$message.error(res?.msg);
        })
        .finally(() => (this.loadingStatus = false));
      // this.returnResult = {
      //     "fromLineNum": 0,
      //     "toLineNum": 6,
      //     "logContent": "2023-11-09 09:33:30 [com.xxl.job.core.thread.JobThread#run]-[133]-[xxl-job, JobThread-5-1699490445106] <br>----------- xxl-job job execute start -----------<br>----------- Param:null\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]启动定时检测策略任务\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]开始获取未完成任务\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]定时检测策略任务完成\n2023-11-09 09:33:30 [com.xxl.job.core.thread.JobThread#run]-[179]-[xxl-job, JobThread-5-1699490445106] <br>----------- xxl-job job execute end(finish) -----------<br>----------- Result: handleCode=200, handleMsg = null\n2023-11-09 09:33:30 [com.xxl.job.core.thread.TriggerCallbackThread#callbackLog]-[197]-[xxl-job, executor TriggerCallbackThread] <br>----------- xxl-job job callback finish.\n",
      //     "end": false
      // }
    },
  },
};
</script>
<style lang="scss" scoped>
.code-style {
  overflow-y: auto;
  height: 600px;
  font-size: 14px;
  font-family:
    "幼圆",
    YouYuan,
    simsun,
    sans-serif,
    Microsoft YaHei,
    Consolas,
    Monaco,
    Menlo,
    Consolas,
    "Courier New",
    monospace;
}
</style>
