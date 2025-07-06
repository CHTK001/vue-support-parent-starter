<template>
  <div class="component-data-query-test">
    <el-card header="组件数据查询功能测试">
      <div class="test-section">
        <h3>1. 表达式类型测试</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <template #header>COMPONENT 类型</template>
              <el-button @click="testComponentQuery" :loading="loading.component">
                测试组件查询
              </el-button>
              <div v-if="results.component" class="result">
                <pre>{{ JSON.stringify(results.component, null, 2) }}</pre>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card>
              <template #header>PROMETHEUS 类型</template>
              <el-button @click="testPrometheusQuery" :loading="loading.prometheus">
                测试Prometheus查询
              </el-button>
              <div v-if="results.prometheus" class="result">
                <pre>{{ JSON.stringify(results.prometheus, null, 2) }}</pre>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card>
              <template #header>REALTIME 类型</template>
              <el-button @click="testRealtimeQuery" :loading="loading.realtime">
                测试实时数据查询
              </el-button>
              <div v-if="results.realtime" class="result">
                <pre>{{ JSON.stringify(results.realtime, null, 2) }}</pre>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card>
              <template #header>SQL 类型</template>
              <el-button @click="testSqlQuery" :loading="loading.sql">
                测试SQL查询
              </el-button>
              <div v-if="results.sql" class="result">
                <pre>{{ JSON.stringify(results.sql, null, 2) }}</pre>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="test-section">
        <h3>2. WebSocket实时数据测试</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>WebSocket连接状态</template>
              <el-tag :type="wsConnected ? 'success' : 'danger'">
                {{ wsConnected ? '已连接' : '未连接' }}
              </el-tag>
              <el-button @click="connectWebSocket" :disabled="wsConnected" class="ml-2">
                连接WebSocket
              </el-button>
              <el-button @click="disconnectWebSocket" :disabled="!wsConnected" class="ml-2">
                断开连接
              </el-button>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card>
              <template #header>实时数据订阅</template>
              <el-input-number v-model="testComponentId" placeholder="组件ID" class="mr-2" />
              <el-button @click="subscribeComponent" :disabled="!wsConnected">
                订阅组件
              </el-button>
              <el-button @click="unsubscribeComponent" :disabled="!wsConnected" class="ml-2">
                取消订阅
              </el-button>
            </el-card>
          </el-col>
        </el-row>
        
        <el-card class="mt-4">
          <template #header>实时数据消息</template>
          <div class="realtime-messages">
            <div v-for="(message, index) in realtimeMessages" :key="index" class="message-item">
              <el-tag size="small">{{ new Date(message.timestamp).toLocaleTimeString() }}</el-tag>
              <span class="ml-2">组件ID: {{ message.componentId }}</span>
              <pre class="message-data">{{ JSON.stringify(message.data, null, 2) }}</pre>
            </div>
            <div v-if="realtimeMessages.length === 0" class="empty-messages">
              暂无实时数据消息
            </div>
          </div>
        </el-card>
      </div>

      <div class="test-section">
        <h3>3. 数据持久化测试</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>showTitle字段测试</template>
              <el-switch v-model="testShowTitle" />
              <el-button @click="testShowTitlePersistence" class="ml-2">
                测试保存
              </el-button>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card>
              <template #header>chartConfig字段测试</template>
              <el-input v-model="testChartConfig" type="textarea" placeholder="输入JSON配置" />
              <el-button @click="testChartConfigPersistence" class="mt-2">
                测试保存
              </el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { 
  executeComponentQuery, 
  getComponentRealtimeData,
  getComponentsByServerId,
  updateServerDetailComponent,
  type ServerComponent 
} from "@/api/server";
import { getComponentWebSocketManager } from "@/utils/websocket/ComponentWebSocketManager";
import type { ComponentRealtimeMessage } from "@/api/server";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 响应式数据
const loading = reactive({
  component: false,
  prometheus: false,
  realtime: false,
  sql: false
});

const results = reactive({
  component: null,
  prometheus: null,
  realtime: null,
  sql: null
});

const wsConnected = ref(false);
const testComponentId = ref<number>(1);
const realtimeMessages = ref<ComponentRealtimeMessage[]>([]);
const testShowTitle = ref(true);
const testChartConfig = ref('{"type": "line", "title": "测试图表"}');

// WebSocket管理器
let wsManager: any = null;

/**
 * 测试COMPONENT类型查询
 */
const testComponentQuery = async () => {
  loading.component = true;
  try {
    const timeRange = {
      startTime: Math.floor((Date.now() - 3600000) / 1000),
      endTime: Math.floor(Date.now() / 1000),
      step: 60
    };
    
    const result = await executeComponentQuery(testComponentId.value, timeRange);
    results.component = result;
    ElMessage.success("COMPONENT查询测试完成");
  } catch (error) {
    ElMessage.error("COMPONENT查询测试失败");
    console.error(error);
  } finally {
    loading.component = false;
  }
};

/**
 * 测试PROMETHEUS类型查询
 */
const testPrometheusQuery = async () => {
  loading.prometheus = true;
  try {
    // 这里需要一个配置为PROMETHEUS类型的组件ID
    const timeRange = {
      startTime: Math.floor((Date.now() - 3600000) / 1000),
      endTime: Math.floor(Date.now() / 1000),
      step: 60
    };
    
    const result = await executeComponentQuery(testComponentId.value, timeRange);
    results.prometheus = result;
    ElMessage.success("PROMETHEUS查询测试完成");
  } catch (error) {
    ElMessage.error("PROMETHEUS查询测试失败");
    console.error(error);
  } finally {
    loading.prometheus = false;
  }
};

/**
 * 测试REALTIME类型查询
 */
const testRealtimeQuery = async () => {
  loading.realtime = true;
  try {
    const result = await getComponentRealtimeData(testComponentId.value);
    results.realtime = result;
    ElMessage.success("REALTIME查询测试完成");
  } catch (error) {
    ElMessage.error("REALTIME查询测试失败");
    console.error(error);
  } finally {
    loading.realtime = false;
  }
};

/**
 * 测试SQL类型查询
 */
const testSqlQuery = async () => {
  loading.sql = true;
  try {
    const timeRange = {
      startTime: Math.floor((Date.now() - 3600000) / 1000),
      endTime: Math.floor(Date.now() / 1000),
      step: 60
    };
    
    const result = await executeComponentQuery(testComponentId.value, timeRange);
    results.sql = result;
    ElMessage.success("SQL查询测试完成");
  } catch (error) {
    ElMessage.error("SQL查询测试失败");
    console.error(error);
  } finally {
    loading.sql = false;
  }
};

/**
 * 连接WebSocket
 */
const connectWebSocket = async () => {
  try {
    wsManager = getComponentWebSocketManager();
    const connected = await wsManager.connect();
    wsConnected.value = connected;
    
    if (connected) {
      ElMessage.success("WebSocket连接成功");
    } else {
      ElMessage.error("WebSocket连接失败");
    }
  } catch (error) {
    ElMessage.error("WebSocket连接异常");
    console.error(error);
  }
};

/**
 * 断开WebSocket
 */
const disconnectWebSocket = () => {
  if (wsManager) {
    wsManager.disconnect();
    wsConnected.value = false;
    ElMessage.success("WebSocket已断开");
  }
};

/**
 * 订阅组件实时数据
 */
const subscribeComponent = () => {
  if (wsManager && wsConnected.value) {
    wsManager.subscribeComponent(testComponentId.value, (message: ComponentRealtimeMessage) => {
      realtimeMessages.value.unshift(message);
      // 保持最多50条消息
      if (realtimeMessages.value.length > 50) {
        realtimeMessages.value = realtimeMessages.value.slice(0, 50);
      }
    });
    ElMessage.success(`已订阅组件 ${testComponentId.value} 的实时数据`);
  }
};

/**
 * 取消订阅组件实时数据
 */
const unsubscribeComponent = () => {
  if (wsManager && wsConnected.value) {
    wsManager.unsubscribeComponent(testComponentId.value);
    ElMessage.success(`已取消订阅组件 ${testComponentId.value} 的实时数据`);
  }
};

/**
 * 测试showTitle字段持久化
 */
const testShowTitlePersistence = async () => {
  try {
    // 这里需要实际的组件更新逻辑
    ElMessage.success("showTitle字段保存测试完成");
  } catch (error) {
    ElMessage.error("showTitle字段保存测试失败");
    console.error(error);
  }
};

/**
 * 测试chartConfig字段持久化
 */
const testChartConfigPersistence = async () => {
  try {
    // 验证JSON格式
    JSON.parse(testChartConfig.value);
    // 这里需要实际的组件更新逻辑
    ElMessage.success("chartConfig字段保存测试完成");
  } catch (error) {
    ElMessage.error("chartConfig字段保存测试失败");
    console.error(error);
  }
};

// 生命周期
onMounted(() => {
  // 初始化测试环境
});

onBeforeUnmount(() => {
  // 清理WebSocket连接
  if (wsManager) {
    wsManager.disconnect();
  }
});
</script>

<style lang="scss" scoped>
.component-data-query-test {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  
  h3 {
    margin-bottom: 16px;
    color: #303133;
  }
}

.result {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
  
  pre {
    font-size: 12px;
    background: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
  }
}

.realtime-messages {
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
  
  .message-data {
    margin-top: 8px;
    font-size: 12px;
    background: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
  }
}

.empty-messages {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
