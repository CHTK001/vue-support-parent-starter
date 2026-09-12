import io

with io.open('InfluxDBManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在数据浏览结果区域添加图表切换
old_result = '''          <div class="idv-result">
            <div v-if="queryDataRows.length > 0" class="idv-table-wrap">
              <ReTable :data="queryDataRows" :columns="queryDataColumns" :loading="queryLoading" stripe border height="350" />
            </div>
            <ReEmpty v-else description="选择存储桶和测量后点击查询" :image-size="80" />
          </div>'''

new_result = '''          <div class="idv-result">
            <div v-if="queryDataRows.length > 0">
              <div class="idv-view-toggle">
                <button class="idvt-btn" :class="{ active: dataViewMode === 'chart' }" @click="dataViewMode = 'chart'">图表</button>
                <button class="idvt-btn" :class="{ active: dataViewMode === 'table' }" @click="dataViewMode = 'table'">表格</button>
              </div>
              <div v-show="dataViewMode === 'chart'" class="idv-chart-wrap">
                <div ref="influxChartRef" class="idv-chart"></div>
              </div>
              <div v-show="dataViewMode === 'table'" class="idv-table-wrap">
                <ReTable :data="queryDataRows" :columns="queryDataColumns" :loading="queryLoading" stripe border height="350" />
              </div>
            </div>
            <ReEmpty v-else description="选择存储桶和测量后点击查询" :image-size="80" />
          </div>'''

if old_result in content:
    content = content.replace(old_result, new_result, 1)
    print('1. 添加图表切换成功')
else:
    print('1. 未找到结果区域')

# 2. 在 script 中添加图表相关的变量和函数
old_script = '''const executeFluxQuery = async () => {'''

new_script = '''// ==================== 图表展示 ====================
import * as echarts from "echarts";
const influxChartRef = ref<HTMLDivElement | null>(null);
let influxChartInstance: echarts.ECharts | null = null;
const dataViewMode = ref<'chart' | 'table'>('chart');

const renderInfluxChart = () => {
  if (!influxChartRef.value || queryDataRows.value.length === 0) return;
  if (!influxChartInstance) {
    influxChartInstance = echarts.init(influxChartRef.value);
  }
  // 从数据中提取时间和值
  const times = queryDataRows.value.map((r: any) => r.time?.substring(11, 19) || '');
  const values = queryDataRows.value.map((r: any) => Number(r._value) || 0);
  influxChartInstance.setOption({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "10%", containLabel: true },
    xAxis: { type: "category", data: times, axisLabel: { fontSize: 10 } },
    yAxis: { type: "value" },
    series: [{
      name: selectedMeasurement.value,
      type: "line",
      data: values,
      smooth: true,
      areaStyle: { opacity: 0.3 },
      lineStyle: { width: 2 },
      itemStyle: { color: "#3b82f6" },
    }],
  });
};

// 监听数据变化，重新渲染图表
watch(queryDataRows, () => {
  if (dataViewMode.value === 'chart') {
    setTimeout(renderInfluxChart, 100);
  }
});

watch(dataViewMode, (mode) => {
  if (mode === 'chart') {
    setTimeout(renderInfluxChart, 100);
  }
});

const executeFluxQuery = async () => {'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('2. 添加图表函数成功')
else:
    print('2. 未找到 script 位置')

# 3. 在 style 中添加图表样式
old_style_end = '''.iqv-result { padding: 12px; }'''

new_style_end = '''.iqv-result { padding: 12px; }

/* 数据视图切换 */
.idv-view-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.idvt-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.3));
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}
.idvt-btn:hover { background: var(--bg-hover, #f1f5f9); }
.idvt-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
  border-color: var(--primary, #3b82f6);
}
.idv-chart-wrap {
  width: 100%;
  height: 350px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  overflow: hidden;
}
.idv-chart { width: 100%; height: 100%; }'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('3. 添加图表样式成功')
else:
    print('3. 未找到样式结束位置')

with io.open('InfluxDBManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nInfluxDBManageView.vue 图表展示功能添加完成')
