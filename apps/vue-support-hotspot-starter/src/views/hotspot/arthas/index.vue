<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";

const loading = ref(false);
const activeTab = ref("jvm");
const jvmInfo = ref<any>({});
const threadInfo = ref<any>({});
const memoryInfo = ref<any>({});
const gcInfo = ref<any>({});

// 获取JVM信息
const fetchJvmInfo = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/arthas?action=jvm");
    const data = await response.json();
    jvmInfo.value = data;
  } catch (error) {
    ElMessage.error("获取JVM信息失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取线程信息
const fetchThreadInfo = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/arthas?action=thread");
    const data = await response.json();
    threadInfo.value = data;
  } catch (error) {
    ElMessage.error("获取线程信息失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取内存信息
const fetchMemoryInfo = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/arthas?action=memory");
    const data = await response.json();
    memoryInfo.value = data;
  } catch (error) {
    ElMessage.error("获取内存信息失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取GC信息
const fetchGcInfo = async () => {
  loading.value = true;
  try {
    const response = await fetch("/agent/api/arthas?action=gc");
    const data = await response.json();
    gcInfo.value = data;
  } catch (error) {
    ElMessage.error("获取GC信息失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 格式化大小
const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

// Tab切换处理
const handleTabChange = (tab: string) => {
  switch (tab) {
    case "jvm":
      fetchJvmInfo();
      break;
    case "thread":
      fetchThreadInfo();
      break;
    case "memory":
      fetchMemoryInfo();
      break;
    case "gc":
      fetchGcInfo();
      break;
  }
};

onMounted(() => {
  fetchJvmInfo();
});
</script>

<template>
  <div class="arthas-container">
    <el-card>
      <template #header>
        <span>Arthas JVM诊断</span>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="JVM信息" name="jvm">
          <el-descriptions :column="2" border v-loading="loading">
            <el-descriptions-item label="Java版本">
              {{ jvmInfo.javaVersion }}
            </el-descriptions-item>
            <el-descriptions-item label="JVM名称">
              {{ jvmInfo.jvmName }}
            </el-descriptions-item>
            <el-descriptions-item label="JVM版本">
              {{ jvmInfo.jvmVersion }}
            </el-descriptions-item>
            <el-descriptions-item label="JVM供应商">
              {{ jvmInfo.jvmVendor }}
            </el-descriptions-item>
            <el-descriptions-item label="启动时间">
              {{ jvmInfo.startTime }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              {{ jvmInfo.uptime }}
            </el-descriptions-item>
            <el-descriptions-item label="当前时间">
              {{ jvmInfo.currentTime }}
            </el-descriptions-item>
            <el-descriptions-item label="进程ID">
              {{ jvmInfo.pid }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="线程信息" name="thread">
          <el-descriptions :column="2" border v-loading="loading">
            <el-descriptions-item label="线程总数">
              {{ threadInfo.threadCount }}
            </el-descriptions-item>
            <el-descriptions-item label="峰值线程数">
              {{ threadInfo.peakThreadCount }}
            </el-descriptions-item>
            <el-descriptions-item label="守护线程数">
              {{ threadInfo.daemonThreadCount }}
            </el-descriptions-item>
            <el-descriptions-item label="已启动线程总数">
              {{ threadInfo.totalStartedThreadCount }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="内存信息" name="memory">
          <div v-loading="loading">
            <h4>堆内存</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="已使用">
                {{ formatSize(memoryInfo.heapUsed) }}
              </el-descriptions-item>
              <el-descriptions-item label="最大值">
                {{ formatSize(memoryInfo.heapMax) }}
              </el-descriptions-item>
              <el-descriptions-item label="已提交">
                {{ formatSize(memoryInfo.heapCommitted) }}
              </el-descriptions-item>
            </el-descriptions>

            <h4 style="margin-top: 20px">非堆内存</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="已使用">
                {{ formatSize(memoryInfo.nonHeapUsed) }}
              </el-descriptions-item>
              <el-descriptions-item label="最大值">
                {{ formatSize(memoryInfo.nonHeapMax) }}
              </el-descriptions-item>
              <el-descriptions-item label="已提交">
                {{ formatSize(memoryInfo.nonHeapCommitted) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="GC信息" name="gc">
          <el-table :data="gcInfo.collectors || []" v-loading="loading" stripe>
            <el-table-column prop="name" label="收集器名称" min-width="200" />
            <el-table-column prop="collectionCount" label="GC次数" width="120" />
            <el-table-column prop="collectionTime" label="GC时间(ms)" width="150" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <span>使用说明</span>
      </template>
      <el-alert
        type="info"
        :closable="false"
        description="Arthas诊断提供JVM运行时信息查看功能，包括JVM基本信息、线程状态、内存使用和GC统计等。"
      />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.arthas-container {
  padding: 20px;
}

.info-card {
  margin-top: 20px;
}

h4 {
  margin: 10px 0;
  color: #333;
}
</style>
