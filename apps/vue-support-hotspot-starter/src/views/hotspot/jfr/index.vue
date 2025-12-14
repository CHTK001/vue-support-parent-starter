<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const loading = ref(false);
const recordings = ref<any[]>([]);
const status = ref<any>({});

// 获取JFR状态
const fetchStatus = async () => {
  try {
    const response = await fetch("/agent/api/jfr?action=status");
    const data = await response.json();
    status.value = data;
  } catch (error) {
    console.error(error);
  }
};

// 获取录制列表
const fetchRecordings = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/jfr?action=list");
    const data = await response.json();
    recordings.value = data.recordings || [];
  } catch (error) {
    ElMessage.error("获取JFR录制列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 开始录制
const startRecording = async () => {
  ElMessageBox.prompt("请输入录制时长（秒）", "开始JFR录制", {
    confirmButtonText: "开始",
    cancelButtonText: "取消",
    inputPattern: /^\d+$/,
    inputErrorMessage: "请输入有效的数字"
  })
    .then(async ({ value }) => {
      try {
        await fetch(`/agent/api/jfr?action=start&duration=${value}`);
        ElMessage.success("JFR录制已开始");
        fetchRecordings();
        fetchStatus();
      } catch (error) {
        ElMessage.error("开始录制失败");
        console.error(error);
      }
    })
    .catch(() => {});
};

// 停止录制
const stopRecording = async (id: number) => {
  try {
    await fetch(`/agent/api/jfr?action=stop&id=${id}`);
    ElMessage.success("录制已停止");
    fetchRecordings();
    fetchStatus();
  } catch (error) {
    ElMessage.error("停止录制失败");
    console.error(error);
  }
};

// 下载录制文件
const downloadRecording = async (id: number) => {
  try {
    const response = await fetch(`/agent/api/jfr?action=dump&id=${id}`);
    const data = await response.json();
    if (data.file) {
      ElMessage.success(`录制文件已保存: ${data.file}`);
    }
  } catch (error) {
    ElMessage.error("下载录制失败");
    console.error(error);
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

// 格式化大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

onMounted(() => {
  fetchStatus();
  fetchRecordings();
  // 每30秒刷新一次
  setInterval(() => {
    fetchStatus();
    fetchRecordings();
  }, 30000);
});
</script>

<template>
  <div class="jfr-container">
    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span>JFR状态</span>
          <el-button type="primary" size="small" @click="startRecording">
            <el-icon><VideoPlay /></el-icon>
            开始录制
          </el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="JFR支持">
          <el-tag :type="status.available ? 'success' : 'danger'">
            {{ status.available ? "可用" : "不可用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活跃录制">
          {{ status.activeRecordings || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="Java版本">
          {{ status.javaVersion || "N/A" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="recordings-card">
      <template #header>
        <span>录制列表</span>
      </template>
      <el-table :data="recordings" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column prop="state" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.state === 'RUNNING' ? 'success' : 'info'">
              {{ row.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(秒)" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.startTime ? formatTime(row.startTime) : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ row.size ? formatSize(row.size) : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.state === 'RUNNING'"
              type="warning"
              size="small"
              @click="stopRecording(row.id)"
            >
              停止
            </el-button>
            <el-button
              v-if="row.state === 'STOPPED'"
              type="primary"
              size="small"
              @click="downloadRecording(row.id)"
            >
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <span>使用说明</span>
      </template>
      <el-alert
        type="info"
        :closable="false"
        description="JDK Flight Recorder (JFR) 是一个内置于JVM的性能分析工具，可以收集详细的诊断和性能数据。需要Java 11+支持。"
      />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.jfr-container {
  padding: 20px;
}

.status-card,
.recordings-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
