<template>
  <div class="connection-test-page">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>连接测试工具</span>
          <el-button type="primary" @click="showHelp = !showHelp">
            <IconifyIconOnline icon="ri:question-line" />
            帮助
          </el-button>
        </div>
      </template>

      <!-- 帮助信息 -->
      <el-collapse-transition>
        <el-alert
          v-show="showHelp"
          title="支持的连接格式"
          type="info"
          :closable="false"
          class="help-alert"
        >
          <div class="help-content">
            <p><strong>HTTP/HTTPS:</strong> http://example.com, https://example.com</p>
            <p><strong>Socket:</strong> socket://host:port, host:port</p>
            <p><strong>Prometheus:</strong> http://prometheus:9090</p>
            <p><strong>示例:</strong></p>
            <ul>
              <li>http://www.baidu.com</li>
              <li>https://www.google.com</li>
              <li>socket://127.0.0.1:22</li>
              <li>127.0.0.1:3306</li>
              <li>http://localhost:9090 (Prometheus)</li>
            </ul>
          </div>
        </el-alert>
      </el-collapse-transition>

      <!-- 单个测试 -->
      <div class="test-section">
        <h3>单个连接测试</h3>
        <el-form :model="singleTestForm" label-width="100px">
          <el-form-item label="连接地址">
            <el-input
              v-model="singleTestForm.address"
              placeholder="请输入连接地址，如: http://example.com"
              @keyup.enter="testSingleConnection"
            >
              <template #append>
                <el-button 
                  type="primary" 
                  @click="testSingleConnection"
                  :loading="singleTesting"
                >
                  测试
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <!-- 单个测试结果 -->
        <div v-if="singleResult" class="test-result">
          <ConnectionTestResult :result="singleResult" />
        </div>
      </div>

      <!-- 批量测试 -->
      <div class="test-section">
        <h3>批量连接测试</h3>
        <el-form :model="batchTestForm" label-width="100px">
          <el-form-item label="连接地址">
            <el-input
              v-model="batchTestForm.addresses"
              type="textarea"
              :rows="5"
              placeholder="请输入多个连接地址，每行一个"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="testBatchConnections"
              :loading="batchTesting"
            >
              批量测试
            </el-button>
            <el-button @click="clearBatchResults">清空结果</el-button>
          </el-form-item>
        </el-form>

        <!-- 批量测试结果 -->
        <div v-if="batchResults.length > 0" class="batch-results">
          <h4>批量测试结果 ({{ batchResults.length }} 个)</h4>
          <div class="results-grid">
            <ConnectionTestResult
              v-for="(result, index) in batchResults"
              :key="index"
              :result="result"
              compact
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineAsyncComponent } from 'vue';
import { message } from '@repo/utils';
import { http } from '@/utils/http';

// 连接测试结果组件
const ConnectionTestResult = defineAsyncComponent(() =>
  import('./components/ConnectionTestResult.vue')
);

// 响应式数据
const showHelp = ref(false);
const singleTesting = ref(false);
const batchTesting = ref(false);

// 单个测试表单
const singleTestForm = reactive({
  address: ''
});

// 批量测试表单
const batchTestForm = reactive({
  addresses: ''
});

// 测试结果
const singleResult = ref(null);
const batchResults = ref([]);

// 单个连接测试
const testSingleConnection = async () => {
  if (!singleTestForm.address.trim()) {
    message.warning('请输入连接地址');
    return;
  }

  singleTesting.value = true;
  try {
    const response = await http.request({
      url: '/api/monitor/connection-test/general',
      method: 'post',
      params: {
        address: singleTestForm.address.trim()
      }
    });

    if (response.code === '00000') {
      singleResult.value = response.data;
      message.success('测试完成');
    } else {
      message.error(response.msg || '测试失败');
    }
  } catch (error) {
    console.error('连接测试失败:', error);
    message.error('测试异常');
  } finally {
    singleTesting.value = false;
  }
};

// 批量连接测试
const testBatchConnections = async () => {
  const addresses = batchTestForm.addresses
    .split('\n')
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0);

  if (addresses.length === 0) {
    message.warning('请输入至少一个连接地址');
    return;
  }

  batchTesting.value = true;
  try {
    const response = await http.request({
      url: '/api/monitor/connection-test/batch',
      method: 'post',
      data: addresses
    });

    if (response.code === '00000') {
      batchResults.value = response.data || [];
      message.success(`批量测试完成，共测试 ${addresses.length} 个地址`);
    } else {
      message.error(response.msg || '批量测试失败');
    }
  } catch (error) {
    console.error('批量连接测试失败:', error);
    message.error('批量测试异常');
  } finally {
    batchTesting.value = false;
  }
};

// 清空批量测试结果
const clearBatchResults = () => {
  batchResults.value = [];
  batchTestForm.addresses = '';
};
</script>

<style scoped>
.connection-test-page {
  padding: 20px;
}

.test-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-alert {
  margin-bottom: 20px;
}

.help-content p {
  margin: 8px 0;
}

.help-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.test-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.test-result {
  margin-top: 20px;
}

.batch-results {
  margin-top: 20px;
}

.batch-results h4 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}
</style>
