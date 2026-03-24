<template>
  <div class="webrtc-remote-desktop system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>远程桌面</el-breadcrumb-item>
      </el-breadcrumb>
      <h1 class="page-title">WebRTC远程桌面</h1>
    </div>

    <!-- 连接配置面板 -->
    <el-card v-if="!isConnected" class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>连接配置</span>
        </div>
      </template>
      
      <el-form :model="config" label-width="120px" class="config-form">
        <el-form-item label="服务器ID">
          <el-input-number
            v-model="config.serverId"
            :min="1"
            placeholder="可选，服务器ID"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="服务器地址">
          <el-input
            v-model="config.host"
            placeholder="localhost"
            clearable
          />
        </el-form-item>
        <el-form-item label="服务器端口">
          <el-input-number
            v-model="config.port"
            :min="1"
            :max="65535"
            placeholder="21116"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="connect" :loading="connecting">
            <el-icon><Connection /></el-icon>
            连接
          </el-button>
          <el-button @click="loadDefaultConfig">加载默认配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 远程桌面显示区域 -->
    <div v-if="isConnected" class="desktop-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tag type="success" effect="light">
            <el-icon><CircleCheck /></el-icon>
            已连接
          </el-tag>
          <span class="server-info">
            {{ config.host }}:{{ config.port }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-tooltip content="全屏" placement="bottom">
              <el-button size="small" @click="toggleFullscreen">
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="截图" placement="bottom">
              <el-button size="small" @click="takeScreenshot">
                <el-icon><Camera /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="断开连接" placement="bottom">
              <el-button size="small" type="danger" @click="disconnect">
                <el-icon><Close /></el-icon>
                断开
              </el-button>
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 视频显示区域 -->
      <div ref="videoContainer" class="video-container" @contextmenu.prevent>
        <video
          ref="remoteVideo"
          class="remote-video"
          autoplay
          playsinline
          tabindex="0"
          @loadedmetadata="onVideoLoaded"
        ></video>
        
        <!-- 加载中 -->
        <div v-if="connecting" class="loading-overlay">
          <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
          <p>正在连接远程桌面...</p>
        </div>
        
        <!-- 连接失败 -->
        <div v-if="errorMessage" class="error-overlay">
          <el-icon :size="48"><CircleClose /></el-icon>
          <p>{{ errorMessage }}</p>
          <el-button type="primary" @click="reconnect">重新连接</el-button>
        </div>
      </div>
    </div>

    <!-- 日志面板 -->
    <el-card v-if="logs.length > 0" class="log-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>连接日志</span>
          <el-button type="text" size="small" @click="clearLogs">清空</el-button>
        </div>
      </template>
      <div class="log-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-entry', `log-${log.type}`]"
        >
          [{{ log.time }}] {{ log.message }}
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC远程桌面客户端
 * @author CH
 * @date 2026-01-03
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { message } from "@repo/utils";
import {
  Setting,
  Connection,
  CircleCheck,
  FullScreen,
  Camera,
  Close,
  Loading,
  CircleClose,
  Document
} from '@element-plus/icons-vue';
import { getWebRTCConnectInfo, getWebRTCStatus } from '@/api/webrtc/remote-desktop';
import { createNamedSocketService, closeNamedSocketService, type SocketTemplate } from '@repo/core';
import { getConfig } from '@repo/config';
import { splitToArray } from '@repo/utils';

// 配置
const config = ref({
  serverId: undefined as number | undefined,
  host: 'localhost',
  port: 21116
});

// 状态
const isConnected = ref(false);
const connecting = ref(false);
const errorMessage = ref('');
const remoteVideo = ref<HTMLVideoElement | null>(null);
const videoContainer = ref<HTMLElement | null>(null);
const logs = ref<Array<{ time: string; message: string; type: string }>>([]);

// WebRTC相关
let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let socketService: SocketTemplate | null = null;
const socketName = 'webrtc-remote-desktop';

/**
 * 添加日志
 */
const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  });
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value.shift();
  }
};

/**
 * 清空日志
 */
const clearLogs = () => {
  logs.value = [];
};

/**
 * 加载默认配置
 */
const loadDefaultConfig = async () => {
  try {
    const { data } = await getWebRTCStatus();
    if (data.enabled) {
      config.value.host = data.defaultHost || 'localhost';
      config.value.port = data.defaultPort || 21116;
      addLog('已加载默认配置', 'success');
    }
  } catch (error) {
    console.error('加载默认配置失败:', error);
  }
};

/**
 * 连接远程桌面
 */
const connect = async () => {
  if (connecting.value) {
    return;
  }

  connecting.value = true;
  errorMessage.value = '';
  addLog('开始连接远程桌面...', 'info');

  try {
    // 获取连接信息
    const { data } = await getWebRTCConnectInfo({
      serverId: config.value.serverId,
      host: config.value.host,
      port: config.value.port
    });

    if (!data.enabled) {
      throw new Error('WebRTC服务未启用');
    }

    addLog(`连接到 ${data.host}:${data.port}`, 'info');

    // 创建Socket连接
    await connectSocket(data.host, data.port);

    // 初始化WebRTC连接
    await initWebRTCConnection();

  } catch (error: any) {
    errorMessage.value = error.message || '连接失败';
    addLog(`连接失败: ${errorMessage.value}`, 'error');
    message(`连接失败: ${errorMessage.value}`, { type: 'error' });
    connecting.value = false;
  }
};

/**
 * 连接Socket服务
 */
const connectSocket = async (host: string, port: number) => {
  return new Promise<void>((resolve, reject) => {
    try {
      // 关闭旧连接
      if (socketService) {
        closeNamedSocketService(socketName);
        socketService = null;
      }

      // 获取Socket配置
      const socketConfig = getConfig('SocketUrl');
      const socketUrls = socketConfig ? splitToArray(socketConfig) : [];
      if (socketUrls.length === 0) {
        throw new Error('Socket服务器地址未配置');
      }

      // 创建命名Socket服务
      socketService = createNamedSocketService(socketName, {
        protocol: 'socketio',
        urls: socketUrls,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      // 监听连接成功
      socketService.on('connect', () => {
        addLog('Socket连接成功', 'success');
        // 发送连接请求
        socketService!.emit('remote:webrtc:connect', {
          serverId: config.value.serverId,
          host: host,
          port: port
        });
        resolve();
      });

      // 监听连接错误
      socketService.on('connect_error', (error: any) => {
        addLog(`Socket连接失败: ${error}`, 'error');
        reject(new Error(`Socket连接失败: ${error}`));
      });

      // 监听连接断开
      socketService.on('disconnect', () => {
        addLog('Socket连接已断开', 'warn');
        isConnected.value = false;
      });

      // 监听WebRTC相关事件
      socketService.on('remote:webrtc:connected', (data: any) => {
        addLog('WebRTC连接已建立', 'success');
        isConnected.value = true;
        connecting.value = false;
      });

      socketService.on('remote:webrtc:error', (data: any) => {
        const errorMsg = data?.message || 'WebRTC连接错误';
        addLog(`WebRTC错误: ${errorMsg}`, 'error');
        errorMessage.value = errorMsg;
        connecting.value = false;
      });

      // 监听ICE候选（在整个连接过程中保持活跃）
      socketService.on('remote:webrtc:ice_candidate', (data: any) => {
        if (data?.candidate && peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => {
            addLog(`添加ICE候选失败: ${err}`, 'warn');
          });
        }
      });

    } catch (error: any) {
      reject(error);
    }
  });
};

/**
 * 初始化WebRTC连接
 */
const initWebRTCConnection = async () => {
  if (!socketService) {
    throw new Error('Socket服务未连接');
  }

  // 创建RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  // 处理接收到的视频流
  peerConnection.ontrack = (event) => {
    if (remoteVideo.value && event.streams[0]) {
      remoteVideo.value.srcObject = event.streams[0];
      addLog('收到视频流', 'success');
    }
  };

  // 处理ICE候选
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && socketService) {
      // 通过Socket发送ICE候选
      socketService.emit('remote:webrtc:ice_candidate', {
        candidate: event.candidate
      });
    }
  };

  // 创建数据通道用于输入事件
  dataChannel = peerConnection.createDataChannel('input', {
    ordered: true
  });

  dataChannel.onopen = () => {
    addLog('数据通道已打开', 'success');
    setupInputHandlers();
  };

  dataChannel.onerror = (error) => {
    addLog(`数据通道错误: ${error}`, 'error');
  };

  // 创建offer
  const offer = await peerConnection.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: false
  });

  await peerConnection.setLocalDescription(offer);

  // 通过Socket发送offer并接收answer
  const answer = await sendOfferAndReceiveAnswer(offer);

  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

  addLog('WebRTC连接已建立', 'success');
};

/**
 * 通过Socket发送offer并接收answer
 */
const sendOfferAndReceiveAnswer = async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
  return new Promise((resolve, reject) => {
    if (!socketService) {
      reject(new Error('Socket服务未连接'));
      return;
    }

    // 发送offer
    socketService.emit('remote:webrtc:offer', {
      type: 'offer',
      sdp: offer
    });
    addLog('已发送WebRTC offer', 'info');

    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    // 监听answer
    const answerHandler = (data: any) => {
      try {
        if (data?.type === 'answer' && data?.sdp && !resolved) {
          resolved = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          socketService!.off('remote:webrtc:answer', answerHandler);
          resolve(data);
        }
      } catch (error) {
        addLog(`处理answer失败: ${error}`, 'error');
      }
    };

    socketService.on('remote:webrtc:answer', answerHandler);

    // 设置超时
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socketService!.off('remote:webrtc:answer', answerHandler);
        reject(new Error('等待answer超时'));
      }
    }, 30000);
  });
};

/**
 * 设置输入事件处理器
 */
const setupInputHandlers = () => {
  if (!remoteVideo.value || !dataChannel) {
    return;
  }

  const video = remoteVideo.value;

  // 鼠标事件
  video.addEventListener('mousedown', (e) => {
    sendInputEvent('mousedown', {
      button: e.button,
      x: e.offsetX,
      y: e.offsetY
    });
  });

  video.addEventListener('mouseup', (e) => {
    sendInputEvent('mouseup', {
      button: e.button,
      x: e.offsetX,
      y: e.offsetY
    });
  });

  video.addEventListener('mousemove', (e) => {
    sendInputEvent('mousemove', {
      x: e.offsetX,
      y: e.offsetY
    });
  });

  video.addEventListener('wheel', (e) => {
    sendInputEvent('wheel', {
      deltaX: e.deltaX,
      deltaY: e.deltaY
    });
  });

  // 键盘事件
  video.addEventListener('keydown', (e) => {
    sendInputEvent('keydown', {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode
    });
  });

  video.addEventListener('keyup', (e) => {
    sendInputEvent('keyup', {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode
    });
  });

  addLog('输入事件处理器已设置', 'success');
};

/**
 * 发送输入事件
 */
const sendInputEvent = (type: string, data: any) => {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({ type, data }));
  }
};

/**
 * 视频加载完成
 */
const onVideoLoaded = () => {
  addLog('视频流已加载', 'success');
};

/**
 * 断开连接
 */
const disconnect = () => {
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  if (socketService) {
    socketService.emit('remote:webrtc:disconnect', {});
    closeNamedSocketService(socketName);
    socketService = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (remoteVideo.value) {
    remoteVideo.value.srcObject = null;
  }

  isConnected.value = false;
  connecting.value = false;
  addLog('已断开连接', 'info');
};

/**
 * 重新连接
 */
const reconnect = () => {
  disconnect();
  setTimeout(() => {
    connect();
  }, 1000);
};

/**
 * 全屏
 */
const toggleFullscreen = () => {
  if (!videoContainer.value) {
    return;
  }

  if (!document.fullscreenElement) {
    videoContainer.value.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

/**
 * 截图
 */
const takeScreenshot = () => {
  if (!remoteVideo.value) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = remoteVideo.value.videoWidth;
  canvas.height = remoteVideo.value.videoHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(remoteVideo.value, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('截图已保存', 'success');
      }
    });
  }
};

// 组件卸载时断开连接
onUnmounted(() => {
  disconnect();
});

// 组件挂载时加载默认配置
onMounted(() => {
  loadDefaultConfig();
});
</script>

<style scoped lang="scss">
.webrtc-remote-desktop {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 8px 0;
  }
}

.config-card {
  margin-bottom: 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .config-form {
    max-width: 600px;
  }
}

.desktop-container {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border-radius: 8px;
    margin-bottom: 16px;
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .server-info {
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }
  }
  
  .video-container {
    position: relative;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    min-height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .remote-video {
      width: 100%;
      height: auto;
      max-height: 80vh;
      object-fit: contain;
    }
    
    .loading-overlay,
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      
      .loading-icon {
        animation: rotate 2s linear infinite;
      }
      
      p {
        margin: 16px 0;
        font-size: 16px;
      }
    }
  }
}

.log-card {
  margin-top: 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  .log-container {
    max-height: 300px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    
    .log-entry {
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 4px;
      
      &.log-info {
        color: #333;
        background: #f5f5f5;
      }
      
      &.log-success {
        color: #44aa44;
        background: #e8f5e9;
      }
      
      &.log-error {
        color: #cc0000;
        background: #ffebee;
      }
      
      &.log-warn {
        color: #ff8800;
        background: #fff3e0;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

