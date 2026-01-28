<template>
  <div class="job-log-wrapper system-container modern-bg">
    <div class="job-log-container">
      <!-- 统计图表区域 -->
      <div class="chart-section">
        <div class="chart-header" @click="showChart = !showChart">
          <div class="chart-title">
            <IconifyIconOnline
              icon="ri:bar-chart-2-line"
              class="chart-title-icon"
            />
            <span>近七日执行趋势</span>
          </div>
          <div class="chart-right">
            <div v-if="showChart" class="chart-legend">
              <span class="legend-item success">
                <span class="legend-dot"></span>成功
              </span>
              <span class="legend-item danger">
                <span class="legend-dot"></span>失败
              </span>
            </div>
            <IconifyIconOnline
              :icon="showChart ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
              class="toggle-icon"
            />
          </div>
        </div>
        <transition name="slide-fade">
          <div v-if="showChart" class="chart-body">
            <scEcharts height="120px" :option="logsChartOption" />
          </div>
        </transition>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="search-section">
        <div class="search-toggle" @click="showCondition = !showCondition">
          <IconifyIconOnline icon="ri:filter-3-line" class="filter-icon" />
          <span>筛选条件</span>
          <IconifyIconOnline
            :icon="
              showCondition ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'
            "
            class="toggle-icon"
          />
        </div>
        <transition name="slide-fade">
          <div v-if="showCondition" class="search-filters">
            <div class="filter-item">
              <el-date-picker
                v-model="date"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="date-picker"
              />
            </div>
            <div class="filter-item">
              <el-select
                v-model="form.jobLogTriggerCode"
                clearable
                placeholder="任务状态"
                class="filter-select"
              >
                <el-option value="" label="全部状态" />
                <el-option :value="1" label="成功" />
                <el-option :value="0" label="失败" />
              </el-select>
            </div>
            <div class="filter-item">
              <el-select
                v-model="form.jobLogApp"
                clearable
                placeholder="执行器"
                class="filter-select"
              >
                <el-option value="" label="全部执行器" />
                <el-option
                  v-for="item in executorData"
                  :key="item.monitorId"
                  :value="item.monitorApplicationName"
                  :label="item.monitorName"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <el-select
                v-model="form.jobLogProfile"
                clearable
                placeholder="环境"
                class="filter-select"
              >
                <el-option value="" label="全部环境" />
                <el-option value="dev" label="开发" />
                <el-option value="prod" label="生产" />
                <el-option value="test" label="测试" />
              </el-select>
            </div>
            <div class="filter-actions">
              <el-tooltip content="搜索" placement="top">
                <el-button type="primary" class="action-btn" @click="search">
                  <IconifyIconOnline icon="ri:search-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="清理日志" placement="top">
                <el-button type="danger" class="action-btn" @click="clear">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </transition>
      </div>

      <!-- 日志表格 -->
      <div class="table-section">
        <scTable
          ref="table"
          :loading="loading"
          :params="form"
          :url="fetchJobLogPage"
          stripe
          highlightCurrentRow
          height="calc(100vh - 400px)"
          class="log-table"
        >
          <el-table-column label="状态" prop="level" width="70" align="center">
            <template #default="scope">
              <div class="status-cell">
                <span
                  class="status-dot"
                  :class="getStatusClass(scope.row)"
                ></span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务ID" prop="jobLogId" width="120">
            <template #default="scope">
              <span class="log-id">#{{ scope.row.jobLogId }}</span>
            </template>
          </el-table-column>
          <el-table-column label="系统/环境" prop="jobLogApp" width="180">
            <template #default="scope">
              <div class="app-info">
                <span class="app-name">{{ scope.row.jobLogApp }}</span>
                <el-tag
                  size="small"
                  :type="getEnvType(scope.row.jobLogProfile)"
                  class="env-tag"
                >
                  {{ scope.row.jobLogProfile || "-" }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="执行地址"
            prop="jobLogTriggerAddress"
            width="180"
          >
            <template #default="scope">
              <ScIp
                v-if="scope.row.jobLogTriggerAddress"
                :ip="scope.row.jobLogTriggerAddress"
              />
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="调度时间"
            prop="jobLogTriggerTime"
            width="180"
          >
            <template #default="scope">
              <div class="time-cell">
                <IconifyIconOnline icon="ri:time-line" class="time-icon" />
                <span>{{ dateFormat(scope.row.jobLogTriggerTime) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="调度结果"
            prop="logMapping"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-tag
                :type="
                  scope.row.jobLogTriggerCode !== '00000' ? 'danger' : 'success'
                "
                effect="light"
                class="result-tag"
              >
                <IconifyIconOnline
                  :icon="
                    scope.row.jobLogTriggerCode !== '00000'
                      ? 'ri:close-circle-line'
                      : 'ri:checkbox-circle-line'
                  "
                />
                {{ scope.row.jobLogTriggerCode !== "00000" ? "失败" : "成功" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="执行耗时" prop="jobLogCost" width="120">
            <template #default="scope">
              <div
                class="cost-cell"
                :class="getCostClass(scope.row.jobLogCost)"
              >
                <IconifyIconOnline icon="ri:timer-line" class="cost-icon" />
                <span>{{ scope.row.jobLogCost || 0 }} ms</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="错误信息"
            prop="jobLogTriggerMsg"
            min-width="150"
            show-overflow-tooltip
          >
            <template #default="scope">
              <span v-if="scope.row.jobLogTriggerMsg" class="error-msg">{{
                scope.row.jobLogTriggerMsg
              }}</span>
              <span v-else class="text-placeholder">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="scope">
              <div class="action-cell">
                <el-tooltip content="查看详情" placement="top">
                  <el-button class="action-btn-sm" @click="rowClick(scope.row)">
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="查看日志" placement="top">
                  <el-button class="action-btn-sm" @click="cat(scope.row)">
                    <IconifyIconOnline icon="ri:terminal-box-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </scTable>
      </div>
    </div>
    <sc-dialog v-model="clearShow" title="日志清理" @close="clearShow = !1">
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
            <!-- <el-option label="清理一千条之前的日志数据" :value="5" />
            <el-option label="清理一万条之前的日志数据" :value="6" />
            <el-option label="清理三万条之前的日志数据" :value="7" />
            <el-option label="清理十万条之前的日志数据" :value="8" /> -->
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
    </sc-dialog>

    <cat ref="catRef" />
    <info ref="infoRef" />
  </div>
</template>

<script>
import { fetchAppList } from "@/api/monitor/app";
import {
  fetchJobLogChart,
  fetchJobLogPage,
  fetchJobLogClear,
} from "@/api/monitor/job";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { dateFormat, getDateRang, getRecentDays } from "@repo/utils";
import { defineAsyncComponent, defineComponent } from "vue";

// import cat from "./cat.vue";
// import info from "./info.vue";
const cat = defineAsyncComponent({
  loader: () => import("./cat.vue"),
  delay: 200,
});
const info = defineAsyncComponent({
  loader: () => import("./info.vue"),
  delay: 200,
});
export default {
  name: "log",
  components: {
    info,
    ScStatusIndicator: defineAsyncComponent(
      () => import("@repo/components/ScMini/scStatusIndicator.vue")
    ),
    scEcharts,
    cat,
  },
  data() {
    return {
      showCondition: false,
      showChart: true,
      clearType: 1,
      catStatus: false,
      loading: !1,
      date: [],
      defaultValueDate: {},
      form: {
        jobLogTriggerCode: null,
        jobLogApp: null,
      },
      jobName: "全部",
      jobGroupName: "全部",
      infoData: {},
      data: {},
      executorData: [],
      jobData: [],
      clearShow: !1,
      infoStatus: !1,
      logsChartOption: {
        color: ["#10b981", "#ef4444"],
        grid: {
          top: "10px",
          left: "40px",
          right: "20px",
          bottom: "25px",
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          textStyle: {
            color: "#374151",
          },
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#999",
            },
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [],
          axisLine: {
            lineStyle: {
              color: "#e5e7eb",
            },
          },
          axisLabel: {
            color: "#6b7280",
            fontSize: 11,
          },
        },
        yAxis: {
          show: true,
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#f3f4f6",
              type: "dashed",
            },
          },
          axisLabel: {
            color: "#9ca3af",
            fontSize: 11,
          },
        },
        series: [
          {
            data: [],
            name: "成功",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
                  { offset: 1, color: "rgba(16, 185, 129, 0.02)" },
                ],
              },
            },
          },
          {
            data: [],
            type: "line",
            name: "失败",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(239, 68, 68, 0.25)" },
                  { offset: 1, color: "rgba(239, 68, 68, 0.02)" },
                ],
              },
            },
          },
        ],
      },
      category: [],
    };
  },
  watch: {},
  mounted: function () {
    const route = this.$route;
    if (route.query.jobLogApp) {
      this.form.jobLogApp = route.query.jobLogApp;
      this.form.jobLogProfile = route.query.jobLogProfile;
    }
    this.initial();
  },
  methods: {
    dateFormat,
    fetchJobLogPage,
    useRenderIcon,
    rowClick(row) {
      this.infoStatus = true;
      this.$nextTick(() => {
        this.$refs.infoRef.setData(row).open();
      });
    },
    cat(row) {
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
      fetchJobLogClear({
        jobId: v,
        jobGroup: this.form.jobGroup,
        clearType: this.clearType,
      }).then((res) => {
        if (res.code === "00000") {
          this.$message.success("清除成功");
          this.clearShow = !1;
          this.initial();
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    async doSearchJob(jobGroupId) {
      const res1 = await this.jobInfo.get({
        jobGroup: jobGroupId,
      });
      this.jobData = res1?.data.content;
      if (!this.form.jobId) {
        this.form.jobId =
          this.jobData && this.jobData.length == 1 ? this.jobData[0].id : 0;
        this.jobName =
          this.jobData && this.jobData.length == 1
            ? this.jobData[0].jobDesc
            : undefined;
      }
    },
    async intiCharts() {
      const data = {};
      const date = getDateRang("pastWeek");
      data.startDate = date[0];
      data.endDate = date[1];
      const dates = getRecentDays(7);
      this.logsChartOption.xAxis.data = dates;
      fetchJobLogChart(data).then((res) => {
        if (res.code === "00000") {
          this.logsChartOption.series[0].data = res.data.successCount;
          this.logsChartOption.series[1].data = res.data.failureCount;
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
      if (this.date && this.date.length > 0) {
        this.form.startDate = this.date[0];
        this.form.endDate = this.date[1];
      }
      if (!this.form.jobId) {
        this.form.jobId = 0;
      }
      this.$refs.table.reload(this.form);
    },
    // 获取状态样式类
    getStatusClass(row) {
      if (row.jobLogTriggerCode !== "00000") return "status-error";
      if (row.jobLogCost && row.jobLogCost > 10000) return "status-slow";
      if (row.jobLogCost && row.jobLogCost > 5000) return "status-warn";
      return "status-success";
    },
    // 获取环境标签类型
    getEnvType(env) {
      if (!env) return "info";
      const envMap = {
        prod: "danger",
        dev: "primary",
        test: "warning",
      };
      return envMap[env.toLowerCase()] || "info";
    },
    // 获取耗时样式类
    getCostClass(cost) {
      if (!cost) return "cost-normal";
      if (cost > 10000) return "cost-slow";
      if (cost > 5000) return "cost-warn";
      return "cost-normal";
    },
  },
};
</script>

<style scoped lang="scss">

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}



.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.job-log-wrapper {
  height: 100%;
  overflow: hidden;
}

.job-log-container {
  padding: 16px;
  background: var(--el-bg-color-page);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.title-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 4px 0 0 0;
}

/* 图表区域 */
.chart-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
}

.chart-header:hover {
  opacity: 0.8;
}

.chart-section:has(.chart-body) .chart-header {
  margin-bottom: 12px;
}

.chart-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-title-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item.success .legend-dot {
  background: #10b981;
}

.legend-item.danger .legend-dot {
  background: #ef4444;
}

.chart-body {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px;
}

/* 搜索筛选区域 */
.search-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding: 4px 0;
}

.filter-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.toggle-icon {
  font-size: 18px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 12px;
}

.filter-item {
  flex-shrink: 0;
}

.filter-select {
  width: 150px;
}

.date-picker {
  width: auto;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.action-btn {
  width: 36px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
}

/* 表格区域 */
.table-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-section :deep(.sc-table-container) {
  height: 100% !important;
  min-height: 0 !important;
}

.table-section :deep(.sc-table-container.auto-height) {
  min-height: 0 !important;
}

.table-section :deep(.sc-table-wrapper) {
  height: 100%;
  min-height: 0;
}

.table-section :deep(.sc-table-auto-height) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-section :deep(.sc-table-content-wrapper) {
  flex: 1 !important;
  min-height: 0 !important;
  height: auto !important;
}

/* 状态单元格 */
.status-cell {
  display: flex;
  justify-content: center;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
}

.status-dot::after {
  content: "";
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.status-success {
  background: #10b981;
}

.status-dot.status-success::after {
  background: rgba(16, 185, 129, 0.3);
}

.status-dot.status-warn {
  background: #f59e0b;
}

.status-dot.status-warn::after {
  background: rgba(245, 158, 11, 0.3);
}

.status-dot.status-slow {
  background: #ef4444;
}

.status-dot.status-slow::after {
  background: rgba(239, 68, 68, 0.3);
}

.status-dot.status-error {
  background: #ef4444;
}

.status-dot.status-error::after {
  background: rgba(239, 68, 68, 0.3);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* 日志ID */
.log-id {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 应用信息 */
.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.env-tag {
  width: fit-content;
  font-size: 10px;
  padding: 0 6px;
  height: 18px;
  line-height: 16px;
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.time-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

/* 结果标签 */
.result-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

/* 耗时单元格 */
.cost-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}

.cost-icon {
  font-size: 14px;
}

.cost-cell.cost-normal {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.cost-cell.cost-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.cost-cell.cost-slow {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 错误信息 */
.error-msg {
  color: var(--el-color-danger);
  font-size: 12px;
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

/* 操作单元格 */
.action-cell {
  display: flex;
  gap: 6px;
}

.action-btn-sm {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  transition: all 0.2s ease;
}

.action-btn-sm:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 表格样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: var(--el-fill-color-lighter) !important;
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-table td) {
  font-size: 13px;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
