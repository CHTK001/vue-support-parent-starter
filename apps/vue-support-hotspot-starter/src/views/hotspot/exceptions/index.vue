<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

const loading = ref(false);
const exceptions = ref<any[]>([]);
const stats = ref<any[]>([]);
const activeTab = ref("list");
const selectedEx = ref<any>(null);
const dialogVisible = ref(false);

// 获取最近异常列表
const fetchExceptions = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/exceptions?action=list&limit=100");
    const data = await response.json();
    exceptions.value = data.exceptions || [];
  } catch (error) {
    ElMessage.error("获取异常列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取异常统计
const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/exceptions?action=stats");
    const data = await response.json();
    stats.value = data.statistics || [];
  } catch (error) {
    ElMessage.error("获取异常统计失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查看异常详情
const viewException = (row: any) => {
  selectedEx.value = row;
  dialogVisible.value = true;
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

// 清除统计
const clearStats = async () => {
  try {
    await fetch("/api/exceptions?action=clear");
    ElMessage.success("异常统计已清除");
    fetchData();
  } catch (error) {
    ElMessage.error("清除失败");
    console.error(error);
  }
};

// 获取所有数据
const fetchData = () => {
  fetchExceptions();
  fetchStats();
};

onMounted(() => {
  fetchData();
  // 每30秒刷新一次
  setInterval(fetchData, 30000);
});
</script>

<template>
  <div class="exceptions-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常监控</span>
          <el-button type="primary" size="small" @click="clearStats">
            清除统计
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="异常列表" name="list">
          <el-table
            :data="exceptions"
            v-loading="loading"
            stripe
            max-height="600"
          >
            <el-table-column prop="exceptionType" label="异常类型" width="250">
              <template #default="{ row }">
                <el-tag type="danger">{{
                  row.exceptionType.split(".").pop()
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="message"
              label="异常消息"
              min-width="300"
              show-overflow-tooltip
            />
            <el-table-column prop="thread" label="线程" width="150" />
            <el-table-column prop="location" label="位置" width="200" />
            <el-table-column prop="timestamp" label="发生时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="text"
                  size="small"
                  @click="viewException(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="异常统计" name="stats">
          <el-table :data="stats" v-loading="loading" stripe>
            <el-table-column prop="exceptionType" label="异常类型" width="300">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.exceptionType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="发生次数" width="120" />
            <el-table-column
              prop="firstOccurrence"
              label="首次发生"
              width="180"
            >
              <template #default="{ row }">
                {{ formatTime(row.firstOccurrence) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="lastOccurrence"
              label="最后发生"
              width="180"
            >
              <template #default="{ row }">
                {{ formatTime(row.lastOccurrence) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 异常详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="异常详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedEx" class="exception-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="异常类型">
            <el-tag type="danger">{{ selectedEx.exceptionType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ formatTime(selectedEx.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="线程">
            {{ selectedEx.thread }}
          </el-descriptions-item>
          <el-descriptions-item label="位置">
            {{ selectedEx.location }}
          </el-descriptions-item>
          <el-descriptions-item label="异常消息" :span="2">
            {{ selectedEx.message }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="stack-trace">
          <h4>堆栈跟踪：</h4>
          <pre>{{ selectedEx.stackTrace }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.exceptions-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exception-detail {
  .stack-trace {
    margin-top: 20px;

    h4 {
      margin-bottom: 10px;
      color: #333;
    }

    pre {
      background-color: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;
      color: #e74c3c;
    }
  }
}
</style>
