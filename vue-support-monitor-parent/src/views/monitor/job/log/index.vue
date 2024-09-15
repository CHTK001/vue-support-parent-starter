<template>
  <el-container>
    <el-main class="nopadding">
      <el-container>
        <el-header>
          <el-text class="flex flex1" @click="showCondition = !showCondition">
            <span>过滤</span>
            <component :is="useRenderIcon('ep:arrow-down')" class="mt-1 pl-1" />
          </el-text>
          <div v-if="showCondition" class="flex flex-2 m-2">
            <div class="mx-1">
              <el-date-picker v-model="date" value-format="YYYY-MM-DD HH:MM:ss" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
            </div>

            <div class="!w-[200px] mx-1">
              <el-select v-model="form.jobLogTriggerCode" clearable class="w-full" placeholder="请选择任务状态">
                <el-option value="" label="全部" />
                <el-option :value="1" label="成功" />
                <el-option :value="2" label="失败" />
              </el-select>
            </div>

            <div class="!w-[200px] mx-1">
              <el-select v-model="form.jobLogApp" clearable class="w-full" placeholder="请选择执行器">
                <el-option value="" label="全部" />
                <el-option v-for="item in executorData" :key="item" :value="item.monitorName" :label="item.monitorName">
                  <span style="float: left">{{ item.monitorName }}</span>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ item.monitorApplicationName }}</span>
                </el-option>
              </el-select>
            </div>

            <div class="!w-[200px] mx-1">
              <el-select v-model="form.jobLogProfile" clearable class="w-full" placeholder="请选择环境">
                <el-option value="">全部</el-option>
                <el-option value="dev">开发</el-option>
                <el-option value="prod">生产</el-option>
                <el-option value="test">测试</el-option>
              </el-select>
            </div>

            <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="search" />
            <el-button type="danger" :icon="useRenderIcon('ep:delete')" @click="clear" />
          </div>
        </el-header>
        <el-header style="height: 150px">
          <scEcharts height="100%" :option="logsChartOption" />
        </el-header>
        <el-main class="nopadding">
          <scTable ref="table" :loading="loading" :params="form" :url="fetchJobLogPage" stripe highlightCurrentRow @row-click="rowClick">
            <el-table-column label="级别" prop="level" width="60">
              <template #default="scope">
                <div>
                  <Suspense>
                    <template #default>
                      <div>
                        <sc-status-indicator v-if="scope.row.jobLogCost && scope.row.jobLogCost > 3000" pulse type="success" title="結果失败" />
                        <el-icon v-else style="color: #068f3f"><el-icon-info-filled /></el-icon>
                      </div>
                    </template>
                  </Suspense>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="任务ID" prop="jobLogId" width="150" />
            <el-table-column label="调度时间" prop="jobLogTriggerTime" width="220">
              <template #default="scope">
                <span>{{ dateFormat(scope.row.jobLogTriggerTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="调度结果" prop="logMapping" show-overflow-tooltip>
              <template #default="scope">
                <el-tag v-if="scope.row.jobLogTriggerCode !== '00000'" type="danger">失败</el-tag>
                <el-tag v-else type="success">成功</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="执行地址" prop="jobLogTriggerAddress" width="200" />
            <el-table-column label="执行时间" prop="createTime">
              <template #default="scope">
                <span v-time="scope.row.createTime" />
              </template>
            </el-table-column>
            <el-table-column label="错误描述" prop="jobLogTriggerMsg" />
            <el-table-column label="执行备注" prop="handleMsg" width="150">
              <template #default="scope">
                <span v-if="scope.row.handleMsg">{{ scope.row.handleMsg }}</span>
                <span v-else>无</span>
              </template>
            </el-table-column>
          </scTable>
        </el-main>
      </el-container>
    </el-main>
  </el-container>

  <el-dialog v-model="clearShow" title="日志清理" @close="clearShow = !1">
    <el-form :model="form" label-width="120px">
      <el-form-item label="执行器">
        <el-input v-model="jobGroupName" disabled readonly />
      </el-form-item>
      <el-form-item label="任务">
        <el-input v-model="jobName" disabled readonly />
      </el-form-item>
      <el-form-item label="">
        <el-select v-model="clearType" style="width: 100%">
          <el-option label="清理一个月之前的日志数据" :value="1" />
          <el-option label="清理三个月之前的日志数据" :value="2" />
          <el-option label="清理六个月之前的日志数据" :value="3" />
          <el-option label="清理一年之前的日志数据" :value="4" />
          <el-option label="清理一千条之前的日志数据" :value="5" />
          <el-option label="清理一万条之前的日志数据" :value="6" />
          <el-option label="清理三万条之前的日志数据" :value="7" />
          <el-option label="清理十万条之前的日志数据" :value="8" />
          <el-option label="清理所以日志数据" :value="9" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="clearShow = false">取消</el-button>
        <el-button type="primary" @click="clearLog(0)">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <el-drawer v-model="infoDrawer" title="日志详情" :size="800" destroy-on-close>
    <info ref="info" />
  </el-drawer>
  <cat v-if="catStatus" ref="catRef" />
</template>

<script>
import info from "./info.vue";
import scEcharts from "@/components/scEcharts/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { fetchJobLogPage, fetchJobLogChart, fetchJobLogClear } from "@/api/monitor/job";
import { fetchAppList } from "@/api/monitor/app";
import cat from "./cat.vue";
import { getDateRang, getRecentDays } from "@/utils/date";
import { defineAsyncComponent } from "vue";
import { dateFormat } from "@/utils/date";
import { IconifyIconOffline } from "@/components/ReIcon";
export default {
  name: "log",
  components: {
    info,
    ScStatusIndicator: defineAsyncComponent(() => import("@/components/scMini/scStatusIndicator.vue")),
    scEcharts,
    cat
  },
  data() {
    return {
      showCondition: false,
      clearType: 1,
      catStatus: false,
      loading: !1,
      date: [],
      defaultValueDate: {},
      form: {
        jobLogTriggerCode: null,
        jobLogApp: null
      },
      jobName: "全部",
      jobGroupName: "全部",
      data: {},
      executorData: [],
      jobData: [],
      clearShow: !1,
      infoDrawer: !1,
      logsChartOption: {
        color: ["#409eff", "#e6a23c", "#f56c6c"],
        grid: {
          top: "0px",
          left: "10px",
          right: "10px",
          bottom: "0px"
        },
        tooltip: {
          trigger: "axis"
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: []
        },
        yAxis: {
          show: false,
          type: "value"
        },
        series: [
          {
            data: [],
            type: "line",
            name: "失败",
            stack: "Total",
            label: {
              normal: {
                show: true,
                position: "top"
              }
            },
            areaStyle: { normal: {} },
            barWidth: "15px"
          },
          {
            data: [],
            name: "成功",
            type: "line",
            stack: "Total",
            areaStyle: { normal: {} },
            barWidth: "15px"
          }
        ]
      },
      category: []
    };
  },
  watch: {},
  mounted: function () {
    this.initial();
  },
  methods: {
    dateFormat,
    fetchJobLogPage,
    useRenderIcon,
    rowClick(row) {
      this.infoDrawer = true;
      this.$nextTick(() => {
        this.$refs.info.setData(row);
      });
    },
    doDetail(row) {
      this.catStatus = true;
      this.$nextTick(() => {
        this.$refs.catRef.open().setData(row);
      });
      // this.$router.push({ path: '/scheduler/joblog/cat/' + row.id });
    },
    clear() {
      // this.jobName = '全部';
      this.clearShow = !0;
    },
    clearLog(v) {
      this.$API.scheduler.clearLog
        .get({
          jobId: v,
          jobGroup: this.form.jobGroup,
          type: this.clearType
        })
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("清除成功");
            this.clearShow = !1;
            return !1;
          }
          this.$message.error(res.msg);
        });
    },
    async doSearchJob(jobGroupId) {
      const res1 = await this.jobInfo.get({
        jobGroup: jobGroupId
      });
      this.jobData = res1?.data.content;
      if (!this.form.jobId) {
        this.form.jobId = this.jobData && this.jobData.length == 1 ? this.jobData[0].id : 0;
        this.jobName = this.jobData && this.jobData.length == 1 ? this.jobData[0].jobDesc : undefined;
      }
    },
    async intiCharts() {
      const data = {};
      const date = getDateRang("pastWeek");
      data.startDate = date[0];
      data.endDate = date[1];
      const dates = getRecentDays(7);
      this.logsChartOption.xAxis.data = dates;
      fetchJobLogChart(data).then(res => {
        if (res.code === "00000") {
          this.logsChartOption.series[0].data = res.data.failureCount;
          this.logsChartOption.series[1].data = res.data.successCount;
        }
      });
    },
    async initial() {
      this.intiCharts();
      const res = await fetchAppList();
      this.executorData = res?.data;
      this.search();
    },
    search() {
      // this.loading = !0;
      if (this.date) {
        this.form.filterTime = this.date.join(" - ");
      }
      if (!this.form.jobId) {
        this.form.jobId = 0;
      }
      this.$refs.table.reload(this.form);
    }
  }
};
</script>

<style></style>
