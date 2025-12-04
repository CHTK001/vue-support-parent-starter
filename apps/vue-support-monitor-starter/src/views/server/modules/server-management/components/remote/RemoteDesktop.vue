<template>
  <div class="remote-desktop">
    <!-- 协议选择面板 -->
    <div v-if="!selectedProtocol" class="protocol-selection">
      <el-card shadow="hover" class="protocol-card">
        <template #header>
          <div class="card-header">
            <el-icon><Monitor /></el-icon>
            <span>选择远程桌面协议</span>
          </div>
        </template>
        
        <div class="protocol-options">
          <div class="protocol-option" @click="selectProtocol('rdp')">
            <div class="protocol-icon">
              <el-icon size="48"><Monitor /></el-icon>
            </div>
            <h3>RDP 远程桌面</h3>
            <p>Microsoft Remote Desktop Protocol</p>
            <ul class="protocol-features">
              <li>支持 Windows 服务�?/li>
              <li>高质量音频传�?/li>
              <li>文件传输支持</li>
              <li>多显示器支持</li>
            </ul>
            <el-button type="primary" size="large">选择 RDP</el-button>
          </div>



          <div class="protocol-option" @click="selectProtocol('vnc')">
            <div class="protocol-icon">
              <el-icon size="48"><Monitor /></el-icon>
            </div>
            <h3>VNC 远程桌面</h3>
            <p>Virtual Network Computing</p>
            <ul class="protocol-features">
              <li>跨平台支�?/li>
              <li>轻量级协�?/li>
              <li>多种编码方式</li>
              <li>只读模式支持</li>
            </ul>
            <el-button type="success" size="large">选择 VNC</el-button>
          </div>
        </div>
        
        <div class="protocol-info">
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>请根据目标服务器的操作系统和配置选择合适的远程桌面协议�?/p>
              <ul>
                <li><strong>RDP</strong>：适用�?Windows 服务器，提供最佳的用户体验</li>
                <li><strong>VNC</strong>：适用�?Linux/Unix 服务器，或需要跨平台支持的场�?/li>
              </ul>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- RDP 桌面组件 -->
    <SimpleRDPDesktop
      v-if="selectedProtocol === 'rdp'"
      :server="server"
    />



    <!-- VNC 桌面组件 -->
    <SimpleVNCDesktop
      v-if="selectedProtocol === 'vnc'"
      :server="server"
    />

    <!-- 返回按钮 -->
    <div v-if="selectedProtocol" class="back-button">
      <el-button
        size="small"
        @click="goBack"
      >
        <IconifyIconOnline icon="ep:arrow-left" class="mr-1" />
        返回协议选择
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import SimpleRDPDesktop from './SimpleRDPDesktop.vue';
import SimpleVNCDesktop from './SimpleVNCDesktop.vue';

interface Props {
  /** 服务器信�?*/
  server?: {
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerPort: number;
    monitorSysGenServerProtocol?: string;
    monitorSysGenServerUsername?: string;
    monitorSysGenServerPassword?: string;
  };
  /** 默认协议 */
  defaultProtocol?: 'rdp' | 'vnc' ;
  /** 是否自动选择协议 */
  autoSelectProtocol?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'protocol-change', protocol: 'rdp' | 'vnc' ): void;
}

const props = withDefaults(defineProps<Props>(), {
  autoSelectProtocol: false
});

const emit = defineEmits<Emits>();

// 状�?
const selectedProtocol = ref<'rdp' | 'vnc'  | null>(null);

// 计算属�?
const serverProtocol = computed(() => {
  if (props.server?.monitorSysGenServerProtocol) {
    const protocol = props.server.monitorSysGenServerProtocol.toLowerCase();
    if (protocol === 'rdp' || protocol === 'vnc') {
      return protocol;
    }
  }
  return null;
});

// 方法
const selectProtocol = (protocol: 'rdp' | 'vnc' ) => {
  selectedProtocol.value = protocol;
  emit('protocol-change', protocol);

  ElMessage.success(`已选择 ${protocol.toUpperCase()} 协议`);
};

const goBack = () => {
  selectedProtocol.value = null;
};

// 初始�?
const initializeProtocol = () => {
  // 如果设置了自动选择协议
  if (props.autoSelectProtocol) {
    // 优先使用服务器配置的协议
    if (serverProtocol.value) {
      selectedProtocol.value = serverProtocol.value;
      return;
    }
    
    // 其次使用默认协议
    if (props.defaultProtocol) {
      selectedProtocol.value = props.defaultProtocol;
      return;
    }
    
    // 最后根据端口号推测协议
    if (props.server?.monitorSysGenServerPort) {
      const port = props.server.monitorSysGenServerPort;
      if (port === 3389) {
        selectedProtocol.value = 'rdp';
      } else if (port >= 5900 && port <= 5999) {
        selectedProtocol.value = 'vnc';
      }
    }
  } else {
    // 手动选择模式，但如果有明确的协议配置，直接使�?
    if (serverProtocol.value) {
      selectedProtocol.value = serverProtocol.value;
    } else if (props.defaultProtocol) {
      selectedProtocol.value = props.defaultProtocol;
    }
  }
};

// 初始化协议选择
initializeProtocol();
</script>

<style scoped lang="scss">
.remote-desktop {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  .protocol-selection {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .protocol-card {
      width: 100%;
      max-width: 900px;
      border-radius: 12px;
      overflow: hidden;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }
    }
  }

  .protocol-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin: 24px 0;

    .protocol-option {
      padding: 24px;
      border: 2px solid #e4e7ed;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--el-bg-color-overlay);

      &:hover {
        border-color: #409eff;
        box-shadow: 0 8px 25px rgba(64, 158, 255, 0.15);
        transform: translateY(-2px);
      }

      .protocol-icon {
        margin-bottom: 16px;
        color: #409eff;
        position: relative;

        .protocol-tag {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          background: #67c23a;
          color: var(--el-text-color-primary);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1;
        }
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0 0 16px 0;
        color: #606266;
        font-size: 14px;
      }

      .protocol-features {
        list-style: none;
        padding: 0;
        margin: 0 0 20px 0;

        li {
          padding: 4px 0;
          color: #606266;
          font-size: 13px;
          position: relative;
          padding-left: 16px;

          &::before {
            content: '�?;
            position: absolute;
            left: 0;
            color: #67c23a;
            font-weight: bold;
          }
        }
      }

      .el-button {
        width: 100%;
        margin-top: 8px;
      }
    }
  }

  .protocol-info {
    margin-top: 24px;

    :deep(.el-alert) {
      border-radius: 8px;

      .el-alert__content {
        .el-alert__description {
          margin-top: 8px;

          ul {
            margin: 8px 0 0 0;
            padding-left: 20px;

            li {
              margin: 4px 0;
              line-height: 1.5;
            }
          }
        }
      }
    }
  }

  .back-button {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 100;
  }

  // 响应式设�?
  @media (max-width: 768px) {
    .protocol-selection {
      padding: 12px;

      .protocol-card {
        max-width: none;
      }
    }

    .protocol-options {
      grid-template-columns: 1fr;
      gap: 16px;

      .protocol-option {
        padding: 20px;

        h3 {
          font-size: 18px;
        }

        .protocol-features {
          li {
            font-size: 12px;
          }
        }
      }
    }

    .back-button {
      top: 12px;
      left: 12px;
    }
  }
}

// 动画效果
.protocol-option {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 协议选择卡片的特殊样�?
.protocol-options {
  .protocol-option {
    &:nth-child(1) {
      animation-delay: 0.1s;

      &:hover {
        border-color: #409eff;
        
        .protocol-icon {
          color: #409eff;
        }
      }
    }

    &:nth-child(2) {
      animation-delay: 0.2s;

      &:hover {
        border-color: #67c23a;
        
        .protocol-icon {
          color: #67c23a;
        }
      }
    }
  }
}
</style>
