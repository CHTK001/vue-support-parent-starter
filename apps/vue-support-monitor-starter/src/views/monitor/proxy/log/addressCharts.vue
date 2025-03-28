<template>
  <div>
    <el-dialog v-model="detailVisiable" top="10px" :close-on-click-modal="false" title="IP访问统计" width="80%" draggable
      class="chart-dialog" @close="doClose">
      <div class="chart-container">
        <!-- 顶部工具栏 -->
        <div class="chart-toolbar">
          <div class="chart-info">
            <div class="ip-address">
              <IconifyIconOnline icon="mdi:ip-network" />
              <span>{{ form.monitorProxyLogAddress }}</span>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color allow-color"></div>
                <span>允许</span>
              </div>
              <div class="legend-item">
                <div class="legend-color deny-color"></div>
                <span>拒绝</span>
              </div>
              <div class="legend-item">
                <div class="legend-color warn-color"></div>
                <span>预警</span>
              </div>
            </div>
          </div>

          <div class="chart-filter">
            <el-date-picker v-model="value" type="datetimerange" range-separator="-" start-placeholder="开始时间"
              end-placeholder="结束时间" class="date-picker" />
            <el-button type="primary" @click="afterPropertiesSet(form)" class="search-btn">
              <IconifyIconOnline icon="ep:search" />
              查询
            </el-button>
          </div>
        </div>

        <!-- 图表内容 -->
        <div class="chart-content">
          <transition name="fade">
            <el-empty v-if="detailData.length === 0" description="暂无数据" class="chart-empty">
              <template #image>
                <IconifyIconOnline icon="ep:data-line" class="empty-icon" />
              </template>
            </el-empty>
          </transition>

          <transition name="fade">
            <div v-if="detailData.length > 0" class="chart-wrapper">
              <scEcharts height="100%" width="100%" :option="chartOption" class="echarts-instance" />
            </div>
          </transition>
        </div>

        <!-- 底部统计信息 -->
        <div v-if="detailData.length > 0" class="chart-stats">
          <div class="stat-card">
            <div class="stat-value allow-text">{{ getTotalValue(chartOption.series[0].data) }}</div>
            <div class="stat-label">允许总次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value deny-text">{{ getTotalValue(chartOption.series[1].data) }}</div>
            <div class="stat-label">拒绝总次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value warn-text">{{ getTotalValue(chartOption.series[2].data) }}</div>
            <div class="stat-label">预警总次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ detailData.length }}</div>
            <div class="stat-label">数据点数</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { dateFormat } from "@repo/utils";
import { fetchProxyLogStatistic } from "@/api/monitor/proxy";

export default {
  name: "AddressCharts",
  components: {
    scEcharts
  },
  data() {
    return {
      // 表单数据
      form: {},

      // 时间范围
      value: [],

      // 控制状态
      show: false,
      detailVisiable: false,

      // 图表数据
      detailData: [],

      // 图表配置
      chartOption: {
        update: false,
        title: {
          text: 'IP访问统计',
          left: 'center',
          top: 0,
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          formatter: function (params) {
            let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].axisValue}</div>`;
            params.forEach(item => {
              const color = item.seriesName === '允许' ? '#67c23a' :
                item.seriesName === '拒绝' ? '#f56c6c' : '#e6a23c';
              result += `<div style="display:flex;align-items:center;margin:5px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>
                <span style="margin-right:15px;">${item.seriesName}:</span>
                <span style="font-weight:bold;">${item.value}</span>
              </div>`;
            });
            return result;
          }
        },
        legend: {
          show: true,
          top: 30,
          data: ['允许', '拒绝', '预警'],
          right: 15
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: 70,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [],
          axisLabel: {
            rotate: 45,
            formatter: function (value) {
              return value.substring(5); // 只显示月日时分
            }
          }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        dataZoom: [
          {
            type: 'slider',
            start: 60,
            end: 100,
            bottom: 10
          },
          {
            type: 'inside',
            start: 60,
            end: 100
          }
        ],
        series: [
          {
            name: '允许',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 2,
              color: '#67c23a'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
                  { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
                ]
              }
            },
            emphasis: {
              focus: 'series'
            },
            data: []
          },
          {
            name: '拒绝',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 2,
              color: '#f56c6c'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(245, 108, 108, 0.5)' },
                  { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
                ]
              }
            },
            emphasis: {
              focus: 'series'
            },
            data: []
          },
          {
            name: '预警',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 2,
              color: '#e6a23c'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
                  { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
                ]
              }
            },
            emphasis: {
              focus: 'series'
            },
            data: []
          }
        ]
      }
    };
  },
  mounted() {
    // 初始化时间范围为过去24小时
    this.value = [
      new Date(new Date().getTime() - 86400 * 1000),
      new Date()
    ];
  },
  methods: {
    /**
     * 设置IP地址数据
     * @param {String} address - IP地址
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(address) {
      this.form.monitorProxyLogAddress = address;
      return this;
    },

    /**
     * 打开图表对话框
     */
    open() {
      this.afterPropertiesSet();
    },

    /**
     * 获取时间戳
     * @param {Number} i - 索引
     * @returns {Number} - 时间戳
     */
    getTime(i) {
      if (!this.value || !this.value[i]) return undefined;

      try {
        return this.value[i].getTime();
      } catch (error) {
        return this.value[i]?.$d?.getTime();
      }
    },

    /**
     * 关闭对话框并重置数据
     */
    doClose() {
      this.detailVisiable = false;
      this.detailData = [];
      this.form = {};

      // 清空图表数据
      this.chartOption.xAxis.data = [];
      this.chartOption.series[0].data = [];
      this.chartOption.series[1].data = [];
      this.chartOption.series[2].data = [];
    },

    /**
     * 计算数组总和
     * @param {Array} data - 数据数组
     * @returns {Number} - 总和
     */
    getTotalValue(data) {
      if (!data || data.length === 0) return 0;
      return data.reduce((sum, current) => sum + (Number(current) || 0), 0);
    },

    /**
     * 加载图表数据
     */
    afterPropertiesSet() {
      this.detailVisiable = true;
      this.detailData = [];

      // 显示加载状态
      const loading = this.$loading({
        lock: true,
        text: '加载数据中...',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.7)'
      });

      // 获取统计数据
      fetchProxyLogStatistic({
        monitorProxyLogAddress: this.form.monitorProxyLogAddress,
        startDate: this.getTime(0),
        endDate: this.getTime(1)
      })
        .then(res => {
          if (res.code === "00000") {
            this.detailData = res.data.xAxis || [];

            // 更新图表数据
            this.chartOption.xAxis.data = res.data.xAxis || [];
            this.chartOption.series[0].data = res.data.allowAxis || [];
            this.chartOption.series[1].data = res.data.denyAxis || [];
            this.chartOption.series[2].data = res.data.warnAxis || [];

            // 更新图表标题
            this.chartOption.title.text = `IP访问统计 - ${this.form.monitorProxyLogAddress}`;

            // 触发图表更新
            this.chartOption.update = true;
          } else {
            this.$message.error(res.msg || '获取数据失败');
          }
        })
        .catch(error => {
          console.error('获取统计数据失败:', error);
          this.$message.error('获取数据失败，请稍后重试');
        })
        .finally(() => {
          loading.close();
        });
    }
  }
};
</script>

<style scoped lang="scss">
.chart-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__header) {
    padding: 15px 20px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}

.chart-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

.chart-info {
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }
}

.ip-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  :deep(svg) {
    color: var(--el-color-primary);
  }
}

.chart-legend {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;

  &.allow-color {
    background-color: #67c23a;
  }

  &.deny-color {
    background-color: #f56c6c;
  }

  &.warn-color {
    background-color: #e6a23c;
  }
}

.chart-filter {
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    width: 100%;
  }

  .date-picker {
    width: 350px;

    @media (max-width: 768px) {
      width: calc(100% - 50px);
    }
  }

  .search-btn {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.chart-content {
  flex: 1;
  position: relative;
  padding: 10px;
  overflow: hidden;
}

.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .empty-icon {
    font-size: 60px;
    color: var(--el-color-info-light-5);
  }
}

.chart-wrapper {
  height: 100%;
  width: 100%;
}

.chart-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 10px;
  }
}

.stat-card {
  text-align: center;
  padding: 10px 15px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    width: calc(50% - 10px);
  }
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;

  &.allow-text {
    color: #67c23a;
  }

  &.deny-text {
    color: #f56c6c;
  }

  &.warn-text {
    color: #e6a23c;
  }
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.echarts-instance {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
