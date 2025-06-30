<template>
  <div class="rdp-vnc-test">
    <el-card header="RDP/VNC 功能测试">
      <div class="test-controls">
        <el-button type="primary" @click="testRDP">测试 RDP 连接</el-button>
        <el-button type="success" @click="testVNC">测试 VNC 连接</el-button>
        <el-button @click="clearDisplay">清空显示</el-button>
      </div>

      <div class="test-display">
        <div class="display-section">
          <h3>RDP 显示测试</h3>
          <canvas ref="rdpCanvasRef" width="800" height="600" class="test-canvas"></canvas>
          <div class="canvas-info">
            <span>RDP Canvas - 800x600</span>
          </div>
        </div>

        <div class="display-section">
          <h3>VNC 显示测试</h3>
          <canvas ref="vncCanvasRef" width="800" height="600" class="test-canvas"></canvas>
          <div class="canvas-info">
            <span>VNC Canvas - 800x600</span>
          </div>
        </div>
      </div>

      <div class="test-instructions">
        <h3>测试输入</h3>
        <el-input
          v-model="testInstruction"
          placeholder="输入测试内容，例如: 连接测试、状态检查等"
          @keyup.enter="executeInstruction"
        >
          <template #append>
            <el-button @click="executeInstruction">执行</el-button>
          </template>
        </el-input>
        
        <div class="predefined-instructions">
          <h4>快速测试:</h4>
          <el-button size="small" @click="testInstruction = 'RDP 连接测试'; executeInstruction()">
            RDP 测试
          </el-button>
          <el-button size="small" @click="testInstruction = 'VNC 连接测试'; executeInstruction()">
            VNC 测试
          </el-button>
          <el-button size="small" @click="testInstruction = '客户端状态检查'; executeInstruction()">
            状态检查
          </el-button>
        </div>
      </div>

      <div class="test-log">
        <h3>测试日志</h3>
        <el-scrollbar height="200px">
          <div class="log-content">
            <div v-for="(log, index) in testLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-scrollbar>
        <el-button size="small" @click="clearLogs">清空日志</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { message } from '@repo/utils';
import {
  GuacamoleClientManager,
  GuacamoleState,
  getStateDescription,
  defaultGuacamoleConfig
} from '@/utils/guacamole';

// 响应式数据
const rdpCanvasRef = ref<HTMLCanvasElement>();
const vncCanvasRef = ref<HTMLCanvasElement>();
const testInstruction = ref('');
const testLogs = ref<Array<{ time: string; message: string }>>([]);

// Guacamole 客户端管理器
let rdpClient: GuacamoleClientManager | null = null;
let vncClient: GuacamoleClientManager | null = null;

// 添加日志
const addLog = (message: string) => {
  const time = new Date().toLocaleTimeString();
  testLogs.value.push({ time, message });
  console.log(`[${time}] ${message}`);
};

// 清空日志
const clearLogs = () => {
  testLogs.value = [];
};

// 初始化显示
const initDisplays = () => {
  if (rdpCanvasRef.value) {
    rdpClient = new GuacamoleClientManager(rdpCanvasRef.value);
    addLog('RDP 客户端管理器初始化完成');
  }

  if (vncCanvasRef.value) {
    vncClient = new GuacamoleClientManager(vncCanvasRef.value);
    addLog('VNC 客户端管理器初始化完成');
  }
};

// 测试 RDP
const testRDP = () => {
  if (!rdpClient) {
    message.error('RDP 客户端未初始化');
    return;
  }

  addLog('开始测试 RDP 功能 - 注意：这只是客户端初始化测试，实际连接需要后端支持');
  message.info('RDP 客户端已准备就绪，需要连接到实际的 Guacamole 服务器');
};

// 测试 VNC
const testVNC = () => {
  if (!vncClient) {
    message.error('VNC 客户端未初始化');
    return;
  }

  addLog('开始测试 VNC 功能 - 注意：这只是客户端初始化测试，实际连接需要后端支持');
  message.info('VNC 客户端已准备就绪，需要连接到实际的 Guacamole 服务器');
};

// 清空显示
const clearDisplay = () => {
  if (rdpClient) {
    rdpClient.disconnect();
    addLog('RDP 客户端已断开');
  }

  if (vncClient) {
    vncClient.disconnect();
    addLog('VNC 客户端已断开');
  }
};

// 执行指令 - 简化版本，仅用于测试
const executeInstruction = () => {
  if (!testInstruction.value.trim()) {
    message.warning('请输入测试内容');
    return;
  }

  addLog(`测试输入: ${testInstruction.value}`);
  message.success('测试完成 - 实际功能需要连接到 Guacamole 服务器');
};

// 生命周期
onMounted(() => {
  initDisplays();
  addLog('RDP/VNC 测试页面初始化完成');
});

onUnmounted(() => {
  // 清理资源
  if (rdpClient) {
    rdpClient.disconnect();
  }
  if (vncClient) {
    vncClient.disconnect();
  }
  addLog('测试页面资源已清理');
});
</script>

<style lang="scss" scoped>
.rdp-vnc-test {
  padding: 20px;
  
  .test-controls {
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
  }
  
  .test-display {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
    
    .display-section {
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      padding: 16px;
      
      h3 {
        margin: 0 0 12px 0;
        color: var(--el-text-color-primary);
      }
      
      .test-canvas {
        border: 2px solid var(--el-border-color-light);
        border-radius: 4px;
        background-color: #000;
        cursor: crosshair;
        
        &:hover {
          border-color: var(--el-color-primary);
        }
      }
      
      .canvas-info {
        margin-top: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .test-instructions {
    margin-bottom: 20px;
    
    h3, h4 {
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
    }
    
    .predefined-instructions {
      margin-top: 16px;
      
      .el-button {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }
  
  .test-log {
    h3 {
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
    }
    
    .log-content {
      padding: 8px;
      background-color: var(--el-fill-color-lighter);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      
      .log-item {
        margin-bottom: 4px;
        
        .log-time {
          color: var(--el-color-info);
          margin-right: 8px;
        }
        
        .log-message {
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .test-display {
    grid-template-columns: 1fr;
  }
}
</style>
