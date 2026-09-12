import io

with io.open('InfluxDBManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在内容区域添加数据浏览 Tab
old_content = '''      <div class="dsm-content">
        <div class="dsm-info-card">'''

new_content = '''      <div class="dsm-content">
        <!-- 视图切换 -->
        <div class="influx-view-tabs">
          <button class="ivt-btn" :class="{ active: influxView === 'overview' }" @click="influxView = 'overview'">概览</button>
          <button class="ivt-btn" :class="{ active: influxView === 'data' }" @click="influxView = 'data'">数据浏览</button>
          <button class="ivt-btn" :class="{ active: influxView === 'query' }" @click="influxView = 'query'">Flux查询</button>
        </div>

        <!-- 概览视图 -->
        <div v-show="influxView === 'overview'">
        <div class="dsm-info-card">'''

if old_content in content:
    content = content.replace(old_content, new_content, 1)
    print('1. 添加视图切换成功')
else:
    print('1. 未找到内容区域')

# 2. 在存储桶列表后添加数据浏览和Flux查询视图
old_buckets_end = '''          <ReButton size="small" text @click="loadBucketData">
            <template #icon><ReIcon name="View" size="12" /></template>查看数据
          </ReButton>
        </div>
      </div>'''

new_buckets_end = '''          <ReButton size="small" text @click="loadBucketData">
            <template #icon><ReIcon name="View" size="12" /></template>查看数据
          </ReButton>
        </div>
      </div>
        </div>

        <!-- 数据浏览视图 -->
        <div v-show="influxView === 'data'" class="influx-data-view">
          <div class="idv-toolbar">
            <div class="idv-filter">
              <span class="idv-label">存储桶：</span>
              <ReSelect v-model="selectedBucket" size="small" style="width: 160px" @change="loadMeasurements">
                <ReOption v-for="b in buckets" :key="b.name" :label="b.name" :value="b.name" />
              </ReSelect>
              <span class="idv-label">测量：</span>
              <ReSelect v-model="selectedMeasurement" size="small" style="width: 160px">
                <ReOption v-for="m in measurements" :key="m" :label="m" :value="m" />
              </ReSelect>
              <span class="idv-label">时间范围：</span>
              <ReSelect v-model="timeRange" size="small" style="width: 120px">
                <ReOption label="最近1小时" value="1h" />
                <ReOption label="最近6小时" value="6h" />
                <ReOption label="最近24小时" value="24h" />
                <ReOption label="最近7天" value="7d" />
              </ReSelect>
              <ReButton size="small" type="primary" @click="queryData">
                <template #icon><ReIcon name="Search" /></template>查询
              </ReButton>
            </div>
          </div>
          <div class="idv-result">
            <div v-if="queryDataRows.length > 0" class="idv-table-wrap">
              <ReTable :data="queryDataRows" :columns="queryDataColumns" :loading="queryLoading" stripe border height="350" />
            </div>
            <ReEmpty v-else description="选择存储桶和测量后点击查询" :image-size="80" />
          </div>
        </div>

        <!-- Flux 查询视图 -->
        <div v-show="influxView === 'query'" class="influx-query-view">
          <div class="iqv-editor">
            <ReTextarea v-model="fluxQuery" :rows="8" placeholder="输入 Flux 查询，例如：&#10;from(bucket: \"my-bucket\")&#10;  |> range(start: -1h)&#10;  |> filter(fn: (r) => r._measurement == \"cpu\")" class="flux-editor" />
            <div class="iqv-actions">
              <ReButton type="primary" @click="executeFluxQuery">
                <template #icon><ReIcon name="VideoPlay" /></template>执行查询
              </ReButton>
            </div>
          </div>
          <div class="iqv-result">
            <ReTable v-if="fluxResult.rows.length > 0" :data="fluxResult.rows" :columns="fluxResult.columns" stripe border height="300" />
            <ReEmpty v-else description="执行 Flux 查询后显示结果" :image-size="60" />
          </div>
        </div>'''

if old_buckets_end in content:
    content = content.replace(old_buckets_end, new_buckets_end, 1)
    print('2. 添加数据浏览视图成功')
else:
    print('2. 未找到存储桶列表结束位置')

# 3. 在 script 中添加数据浏览相关的变量和函数
old_script = '''const queryVisible = ref(false);'''

new_script = '''const queryVisible = ref(false);

// ==================== 数据浏览 ====================
const influxView = ref<'overview' | 'data' | 'query'>('overview');
const selectedBucket = ref("");
const selectedMeasurement = ref("");
const timeRange = ref("1h");
const queryLoading = ref(false);
const queryDataRows = ref<any[]>([]);
const queryDataColumns = ref<any[]>([]);
const fluxQuery = ref('');
const fluxResult = ref<{ columns: any[]; rows: any[] }>({ columns: [], rows: [] });

const loadMeasurements = async () => {
  // 模拟加载测量列表
  measurements.value = ["cpu", "memory", "disk", "network", "temperature"];
};

const queryData = async () => {
  if (!selectedBucket.value || !selectedMeasurement.value) {
    ElMessage.warning("请选择存储桶和测量");
    return;
  }
  queryLoading.value = true;
  try {
    // 模拟查询数据
    const now = Date.now();
    const rows = [];
    for (let i = 0; i < 20; i++) {
      rows.push({
        time: new Date(now - i * 60000).toISOString(),
        _measurement: selectedMeasurement.value,
        _field: "value",
        _value: (Math.random() * 100).toFixed(2),
        host: "server-" + (i % 3 + 1),
      });
    }
    queryDataRows.value = rows;
    queryDataColumns.value = [
      { prop: "time", label: "时间", minWidth: 180 },
      { prop: "_measurement", label: "测量", minWidth: 120 },
      { prop: "_field", label: "字段", minWidth: 100 },
      { prop: "_value", label: "值", minWidth: 100 },
      { prop: "host", label: "主机", minWidth: 120 },
    ];
  } catch (e) {
    ElMessage.error(`查询失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    queryLoading.value = false;
  }
};

const executeFluxQuery = async () => {
  if (!fluxQuery.value.trim()) {
    ElMessage.warning("请输入 Flux 查询");
    return;
  }
  try {
    // 模拟执行 Flux 查询
    const result = await executeInfluxFluxQuery(fluxQuery.value);
    if (result && Array.isArray(result)) {
      fluxResult.value = {
        columns: result.length > 0 ? Object.keys(result[0]).map(k => ({ prop: k, label: k, minWidth: 120 })) : [],
        rows: result,
      };
    }
    ElMessage.success("查询成功");
  } catch (e) {
    ElMessage.error(`查询失败: ${String((e as Error)?.message ?? e)}`);
  }
};'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('3. 添加数据浏览函数成功')
else:
    print('3. 未找到 script 位置')

# 4. 在 style 中添加数据浏览样式
old_style_end = '''.dsm-empty-icon { opacity: 0.3; }'''

new_style_end = '''.dsm-empty-icon { opacity: 0.3; }

/* InfluxDB 视图切换 */
.influx-view-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  padding-bottom: 8px;
}
.ivt-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.ivt-btn:hover { background: var(--bg-hover, #f1f5f9); }
.ivt-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
}

/* 数据浏览 */
.influx-data-view, .influx-query-view {
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  overflow: hidden;
}
.idv-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.idv-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.idv-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.idv-result { padding: 12px; }
.idv-table-wrap { width: 100%; }

/* Flux 查询 */
.iqv-editor { padding: 12px; border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2)); }
.flux-editor { font-family: monospace; font-size: 12px; }
.iqv-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
.iqv-result { padding: 12px; }'''

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    print('4. 添加数据浏览样式成功')
else:
    print('4. 未找到样式结束位置')

with io.open('InfluxDBManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nInfluxDBManageView.vue 数据浏览功能添加完成')
