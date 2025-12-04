<template>
  <div class="server-proxy-connection">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>代理连接</span>
          <el-tag v-if="server?.monitorSysGenServerProxyType" type="success">
            {{ server.monitorSysGenServerProxyType }}
          </el-tag>
          <el-tag v-else type="info">无代�?/el-tag>
        </div>
      </template>

      <div v-if="!server?.monitorSysGenServerProxyType" class="no-proxy">
        <el-empty description="未配置代理服务器">
          <el-button type="primary" @click="$emit('configure-proxy')">
            配置代理
          </el-button>
        </el-empty>
      </div>

      <div v-else class="proxy-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="代理类型">
            {{ server.monitorSysGenServerProxyType }}
          </el-descriptions-item>
          <el-descriptions-item label="代理地址">
            {{ server.monitorSysGenServerProxyHost }}:{{ server.monitorSysGenServerProxyPort }}
          </el-descriptions-item>
          <el-descriptions-item label="连接状�?>
            <el-tag :type="proxyStatus.type">
              {{ proxyStatus.text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后测�?>
            {{ lastTestTime || '未测�? }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="proxy-actions">
          <el-button-group>
            <el-button
              v-if="server.monitorSysGenServerProxyType === 'GUACAMOLE'"
              type="primary"
              :loading="connecting"
              @click="connectGuacamole"
            >
              <IconifyIconOnline icon="ri:remote-control-line" />
              连接 Guacamole
            </el-button>
            
            <el-button
              :loading="testing"
              @click="testProxyConnection"
            >
              <IconifyIconOnline icon="ri:wifi-line" />
              测试连接
            </el-button>
            
            <el-button @click="$emit('configure-proxy')">
              <IconifyIconOnline icon="ri:settings-line" />
              配置代理
            </el-button>
          </el-button-group>
        </div>

        <!-- Guacamole 连接选项 -->
        <div v-if="server.monitorSysGenServerProxyType === 'GUACAMOLE'" class="guacamole-options">
          <el-divider content-position="left">连接选项</el-divider>
          
          <el-form :model="guacamoleOptions" label-width="120px" size="small">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="连接协议">
                  <el-select v-model="guacamoleOptions.protocol" style="width: 100%">
                    <el-option label="SSH" value="ssh" />
                    <el-option label="RDP" value="rdp" />
                    <el-option label="VNC" value="vnc" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="颜色深度">
                  <el-select v-model="guacamoleOptions.colorDepth" style="width: 100%">
                    <el-option label="256�? value="8" />
                    <el-option label="高彩�?16�?" value="16" />
                    <el-option label="真彩�?24�?" value="24" />
                    <el-option label="真彩�?32�?" value="32" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="屏幕宽度">
                  <el-input-number
                    v-model="guacamoleOptions.width"
                    :min="800"
                    :max="1920"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="屏幕高度">
                  <el-input-number
                    v-model="guacamoleOptions.height"
                    :min="600"
                    :max="1080"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="启用音频">
              <el-switch v-model="guacamoleOptions.enableAudio" />
            </el-form-item>
            
            <el-form-item label="启用剪贴�?>
              <el-switch v-model="guacamoleOptions.enableClipboard" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 连接历史 -->
        <div class="connection-history">
          <el-divider content-position="left">连接历史</el-divider>
          
          <el-table :data="connectionHistory" size="small" max-height="200">
            <el-table-column prop="time" label="时间" width="160" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="status" label="状�? width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" />
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- Guacamole 连接对话�?-->
    <el-dialog
      v-model="guacamoleDialogVisible"
      title="Guacamole 远程连接"
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
      class="guacamole-dialog"
    >
      <div class="guacamole-container">
        <iframe
          v-if="guacamoleUrl"
          :src="guacamoleUrl"
          class="guacamole-iframe"
          frameborder="0"
          allowfullscreen
        />
        <div v-else class="loading-container">
          <el-loading-spinner />
          <p>正在建立连接...</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="disconnectGuacamole">断开连接</el-button>
        <el-button type="primary" @click="openInNewWindow" v-if="guacamoleUrl">
          在新窗口打开
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import IconifyIconOnline from "@repo/components/ReIcon/src/iconifyIconOnline";
import {
  getGuacamoleProxyUrl,
  testServerProxyConnection,
  type MonitorSysGenServer
} from '@/api/monitor/gen/proxy';

// Props
interface Props {
  server?: MonitorSysGenServer;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'configure-proxy': [];
}>();

// 响应式数�?
const testing = ref(false);
const connecting = ref(false);
const lastTestTime = ref<string>('');
const guacamoleDialogVisible = ref(false);
const guacamoleUrl = ref<string>('');

// Guacamole 连接选项
const guacamoleOptions = reactive({
  protocol: 'ssh',
  colorDepth: '24',
  width: 1024,
  height: 768,
  enableAudio: false,
  enableClipboard: true
});

// 连接历史
const connectionHistory = ref<Array<{
  time: string;
  type: string;
  status: 'success' | 'error';
  message: string;
}>>([]);

// 计算属�?
const proxyStatus = computed(() => {
  // 这里可以根据实际的代理状态来返回
  return {
    type: 'success' as const,
    text: '正常'
  };
});

// 方法
const testProxyConnection = async () => {
  if (!props.server?.id) return;
  
  try {
    testing.value = true;
    const res = await testServerProxyConnection(String(props.server.id));
    
    const historyItem = {
      time: new Date().toLocaleString(),
      type: '测试',
      status: res.code === '00000' ? 'success' as const : 'error' as const,
      message: res.code === '00000' ? '连接正常' : (res.msg || '连接失败')
    };
    
    connectionHistory.value.unshift(historyItem);
    lastTestTime.value = historyItem.time;
    
    if (res.code === '00000') {
      ElMessage.success('代理连接测试成功');
    } else {
      ElMessage.error(`代理连接测试失败: ${res.msg}`);
    }
  } catch (error) {
    console.error('测试代理连接失败:', error);
    ElMessage.error('测试代理连接失败');
    
    connectionHistory.value.unshift({
      time: new Date().toLocaleString(),
      type: '测试',
      status: 'error',
      message: '网络错误'
    });
  } finally {
    testing.value = false;
  }
};

const connectGuacamole = async () => {
  if (!props.server?.id) return;
  
  try {
    connecting.value = true;
    const res = await getGuacamoleProxyUrl(String(props.server.id));
    
    if (res.code === '00000' && res.data) {
      guacamoleUrl.value = res.data;
      guacamoleDialogVisible.value = true;
      
      connectionHistory.value.unshift({
        time: new Date().toLocaleString(),
        type: 'Guacamole',
        status: 'success',
        message: '连接建立成功'
      });
      
      ElMessage.success('Guacamole 连接建立成功');
    } else {
      ElMessage.error(`连接失败: ${res.msg}`);
      
      connectionHistory.value.unshift({
        time: new Date().toLocaleString(),
        type: 'Guacamole',
        status: 'error',
        message: res.msg || '连接失败'
      });
    }
  } catch (error) {
    console.error('连接 Guacamole 失败:', error);
    ElMessage.error('连接 Guacamole 失败');
    
    connectionHistory.value.unshift({
      time: new Date().toLocaleString(),
      type: 'Guacamole',
      status: 'error',
      message: '网络错误'
    });
  } finally {
    connecting.value = false;
  }
};

const disconnectGuacamole = () => {
  guacamoleDialogVisible.value = false;
  guacamoleUrl.value = '';
  
  connectionHistory.value.unshift({
    time: new Date().toLocaleString(),
    type: 'Guacamole',
    status: 'success',
    message: '连接已断开'
  });
};

const openInNewWindow = () => {
  if (guacamoleUrl.value) {
    window.open(guacamoleUrl.value, '_blank');
  }
};

// 生命周期
onMounted(() => {
  // 初始化时可以加载连接历史
});
</script>

<style scoped>
.server-proxy-connection {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .no-proxy {
    text-align: center;
    padding: 40px 0;
  }

  .proxy-info {
    .proxy-actions {
      margin: 20px 0;
      text-align: center;
    }

    .guacamole-options {
      margin-top: 20px;
    }

    .connection-history {
      margin-top: 20px;
    }
  }
}

.guacamole-dialog {
  .guacamole-container {
    height: 70vh;
    position: relative;

    .guacamole-iframe {
      width: 100%;
      height: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
