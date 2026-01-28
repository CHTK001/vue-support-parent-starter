<template>
  <div class="video-call-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>视频通话</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 通话界面 -->
    <div class="call-interface" v-if="inCall">
      <!-- 视频区域 -->
      <div class="video-area">
        <!-- 远程视频 -->
        <div class="remote-video-container">
          <video
            ref="remoteVideoRef"
            class="remote-video"
            autoplay
            playsinline
          ></video>
          <div class="remote-user-info" v-if="remoteUser">
            <span class="user-name">{{ remoteUser.username }}</span>
            <span class="call-duration">{{ formatDuration(callDuration) }}</span>
          </div>
          <div class="connection-status">
            <el-tag :type="connectionStatus === 'connected' ? 'success' : 'warning'">
              {{ getConnectionStatusText(connectionStatus) }}
            </el-tag>
          </div>
        </div>

        <!-- 本地视频 -->
        <div class="local-video-container">
          <video
            ref="localVideoRef"
            class="local-video"
            autoplay
            playsinline
            muted
          ></video>
          <div class="local-controls">
            <el-button
              :type="videoEnabled ? 'primary' : 'danger'"
              circle
              @click="toggleVideo"
            >
              <el-icon><VideoCamera v-if="videoEnabled" /><VideoCameraFilled v-else /></el-icon>
            </el-button>
            <el-button
              :type="audioEnabled ? 'primary' : 'danger'"
              circle
              @click="toggleAudio"
            >
              <el-icon><Microphone v-if="audioEnabled" /><MicrophoneFilled v-else /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="control-bar">
        <div class="control-group">
          <el-button
            :type="audioEnabled ? 'primary' : 'danger'"
            size="large"
            circle
            @click="toggleAudio"
          >
            <el-icon><Microphone v-if="audioEnabled" /><MicrophoneFilled v-else /></el-icon>
          </el-button>
          
          <el-button
            type="danger"
            size="large"
            circle
            @click="endCall"
          >
            <el-icon><PhoneFilled /></el-icon>
          </el-button>
          
          <el-button
            :type="videoEnabled ? 'primary' : 'danger'"
            size="large"
            circle
            @click="toggleVideo"
          >
            <el-icon><VideoCamera v-if="videoEnabled" /><VideoCameraFilled v-else /></el-icon>
          </el-button>
        </div>
        
        <div class="additional-controls">
          <el-button
            :type="screenSharing ? 'success' : 'info'"
            size="small"
            @click="toggleScreenShare"
          >
            <el-icon><Monitor /></el-icon>
            {{ screenSharing ? '停止共享' : '屏幕共享' }}
          </el-button>
          
          <el-button
            type="info"
            size="small"
            @click="showSettings = true"
          >
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 等待界面 -->
    <div class="waiting-interface" v-else-if="waiting">
      <div class="waiting-content">
        <el-icon class="waiting-icon"><Loading /></el-icon>
        <h3>等待对方接听...</h3>
        <p>正在连接到 {{ targetUser?.username }}</p>
        <el-button type="danger" @click="cancelCall">
          取消通话
        </el-button>
      </div>
    </div>

    <!-- 主界面 -->
    <div class="main-interface" v-else>
      <!-- 快速拨号 -->
      <el-card class="quick-dial-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>快速拨号</span>
          </div>
        </template>
        
        <el-form :model="callForm" label-width="80px">
          <el-form-item label="用户选择">
            <el-select
              v-model="callForm.targetUserId"
              placeholder="选择要通话的用户"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="user in onlineUsers"
                :key="user.userId"
                :label="user.username"
                :value="user.userId"
              >
                <div class="user-option">
                  <span class="user-name">{{ user.username }}</span>
                  <el-tag size="small" :type="getUserStatusType(user.status)">
                    {{ getUserStatusText(user.status) }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :disabled="!callForm.targetUserId"
              :loading="initiating"
              @click="initiateCall"
            >
              <el-icon><Phone /></el-icon>
              发起通话
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 通话历史 -->
      <el-card class="history-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>通话历史</span>
            <el-button type="text" @click="loadCallHistory">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </template>
        
        <el-table :data="callHistory" style="width: 100%">
          <el-table-column prop="targetUser" label="通话对象" />
          <el-table-column prop="duration" label="通话时长">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getCallStatusType(row.status)">
                {{ getCallStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="callUser(row.targetUserId)"
              >
                回拨
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 设置对话框 -->
    <sc-dialog v-model="showSettings" title="通话设置" width="500px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="摄像头">
          <el-select v-model="settings.videoDeviceId" placeholder="选择摄像头">
            <el-option
              v-for="device in videoDevices"
              :key="device.deviceId"
              :label="device.label"
              :value="device.deviceId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="麦克风">
          <el-select v-model="settings.audioDeviceId" placeholder="选择麦克风">
            <el-option
              v-for="device in audioDevices"
              :key="device.deviceId"
              :label="device.label"
              :value="device.deviceId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="扬声器">
          <el-select v-model="settings.speakerDeviceId" placeholder="选择扬声器">
            <el-option
              v-for="device in speakerDevices"
              :key="device.deviceId"
              :label="device.label"
              :value="device.deviceId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="视频质量">
          <el-radio-group v-model="settings.videoQuality">
            <el-radio value="low">低质量</el-radio>
            <el-radio value="medium">中等质量</el-radio>
            <el-radio value="high">高质量</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="applySettings">应用</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC视频通话页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { message } from "@repo/utils";
import { ElMessageBox } from 'element-plus';
import {
  VideoCamera,
  VideoCameraFilled,
  Microphone,
  MicrophoneFilled,
  PhoneFilled,
  Phone,
  Monitor,
  Setting,
  Loading,
  Refresh
} from '@element-plus/icons-vue';
import { getOnlineUsers, type WebRTCUser } from '@/api/webrtc';
import { useWebRTCCall } from '@/composables/webrtc/useWebRTCCall';

// WebRTC通话组合式函数
const {
  localVideoRef,
  remoteVideoRef,
  inCall,
  waiting,
  connectionStatus,
  audioEnabled,
  videoEnabled,
  screenSharing,
  callDuration,
  remoteUser,
  initiateCall: startCall,
  endCall,
  toggleAudio,
  toggleVideo,
  toggleScreenShare
} = useWebRTCCall();

// 数据状态
const initiating = ref(false);
const showSettings = ref(false);
const onlineUsers = ref<WebRTCUser[]>([]);
const targetUser = ref<WebRTCUser | null>(null);

// 表单数据
const callForm = reactive({
  targetUserId: ''
});

// 设置数据
const settings = reactive({
  videoDeviceId: '',
  audioDeviceId: '',
  speakerDeviceId: '',
  videoQuality: 'medium'
});

// 设备列表
const videoDevices = ref<MediaDeviceInfo[]>([]);
const audioDevices = ref<MediaDeviceInfo[]>([]);
const speakerDevices = ref<MediaDeviceInfo[]>([]);

// 通话历史
const callHistory = ref([
  {
    targetUser: '张三',
    targetUserId: 'user1',
    duration: 180,
    startTime: '2025-01-10 14:30:00',
    status: 'completed'
  },
  {
    targetUser: '李四',
    targetUserId: 'user2',
    duration: 0,
    startTime: '2025-01-10 13:15:00',
    status: 'missed'
  }
]);

/**
 * 加载在线用户列表
 */
const loadOnlineUsers = async () => {
  try {
    const { data } = await getOnlineUsers();
    onlineUsers.value = data.records.filter(user => user.status === 'online');
  } catch (error) {
    console.error('加载在线用户失败:', error);
    message('加载在线用户失败', { type: "error" });
  }
};

/**
 * 发起通话
 */
const initiateCall = async () => {
  if (!callForm.targetUserId) {
    message('请选择要通话的用户', { type: "warning" });
    return;
  }
  
  try {
    initiating.value = true;
    targetUser.value = onlineUsers.value.find(user => user.userId === callForm.targetUserId) || null;
    await startCall(callForm.targetUserId);
  } catch (error) {
    console.error('发起通话失败:', error);
    message('发起通话失败', { type: "error" });
  } finally {
    initiating.value = false;
  }
};

/**
 * 取消通话
 */
const cancelCall = () => {
  endCall();
  targetUser.value = null;
};

/**
 * 呼叫用户
 */
const callUser = (userId: string) => {
  callForm.targetUserId = userId;
  initiateCall();
};

/**
 * 加载通话历史
 */
const loadCallHistory = () => {
  // TODO: 实现加载通话历史的逻辑
  message('通话历史已刷新', { type: "success" });
};

/**
 * 获取媒体设备列表
 */
const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');
    audioDevices.value = devices.filter(device => device.kind === 'audioinput');
    speakerDevices.value = devices.filter(device => device.kind === 'audiooutput');
  } catch (error) {
    console.error('获取媒体设备失败:', error);
  }
};

/**
 * 应用设置
 */
const applySettings = () => {
  // TODO: 实现应用设置的逻辑
  showSettings.value = false;
  message('设置已应用', { type: "success" });
};

/**
 * 获取用户状态类型
 */
const getUserStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    online: 'success',
    busy: 'warning',
    offline: 'info'
  };
  return typeMap[status] || 'info';
};

/**
 * 获取用户状态文本
 */
const getUserStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    busy: '忙碌',
    offline: '离线'
  };
  return textMap[status] || '未知';
};

/**
 * 获取连接状态文本
 */
const getConnectionStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    connecting: '连接中',
    connected: '已连接',
    disconnected: '已断开',
    failed: '连接失败'
  };
  return textMap[status] || '未知';
};

/**
 * 获取通话状态类型
 */
const getCallStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    completed: 'success',
    missed: 'warning',
    rejected: 'danger',
    failed: 'danger'
  };
  return typeMap[status] || 'info';
};

/**
 * 获取通话状态文本
 */
const getCallStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    completed: '已完成',
    missed: '未接听',
    rejected: '已拒绝',
    failed: '失败'
  };
  return textMap[status] || '未知';
};

/**
 * 格式化时长
 */
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

// 组件挂载时初始化
onMounted(async () => {
  await Promise.all([
    loadOnlineUsers(),
    getMediaDevices()
  ]);
});

// 组件卸载时清理
onUnmounted(() => {
  if (inCall.value || waiting.value) {
    endCall();
  }
});
</script>

<style scoped lang="scss">

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}



.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.video-call-container {
  padding: 20px;
  height: 100vh;
  background-color: #1a1a1a;
  color: var(--el-text-color-primary);
}

.page-header {
  margin-bottom: 20px;
  
  :deep(.el-breadcrumb__inner) {
    color: var(--el-text-color-primary);
  }
}

.call-interface {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  
  .video-area {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .remote-video-container {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: #2a2a2a;
      border-radius: 12px;
      overflow: hidden;
      
      .remote-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .remote-user-info {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 8px 16px;
        border-radius: 20px;
        
        .user-name {
          font-weight: 600;
          margin-right: 12px;
        }
        
        .call-duration {
          color: #67c23a;
        }
      }
      
      .connection-status {
        position: absolute;
        top: 20px;
        right: 20px;
      }
    }
    
    .local-video-container {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 150px;
      background-color: #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #409eff;
      
      .local-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .local-controls {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        
        .el-button {
          width: 32px;
          height: 32px;
        }
      }
    }
  }
  
  .control-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 12px;
    margin-top: 20px;
    
    .control-group {
      display: flex;
      gap: 20px;
      align-items: center;
      
      .el-button {
        width: 60px;
        height: 60px;
        
        .el-icon {
          font-size: 24px;
        }
      }
    }
    
    .additional-controls {
      display: flex;
      gap: 12px;
    }
  }
}

.waiting-interface {
  height: calc(100vh - 100px);
  display: flex;
  justify-content: center;
  align-items: center;
  
  .waiting-content {
    text-align: center;
    
    .waiting-icon {
      font-size: 64px;
      color: #409eff;
      margin-bottom: 20px;
      animation: spin 2s linear infinite;
    }
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
    }
    
    p {
      margin: 0 0 24px 0;
       color: var(--el-text-color-primary);
    }
  }
}

.main-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 100px);
  
  .quick-dial-card,
  .history-card {
    background-color: #2a2a2a;
    border: 1px solid #404040;
    
    :deep(.el-card__header) {
      background-color: var(--el-text-color-primary);
      border-bottom: 1px solid #404040;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--el-text-color-primary);
      }
    }
    
    :deep(.el-card__body) {
      color: var(--el-text-color-primary);
    }
  }
  
  .user-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .user-name {
      flex: 1;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 深色主题样式覆盖
:deep(.el-form-item__label) {
  color: white !important;
}

:deep(.el-input__wrapper) {
  background-color: #404040 !important;
  border-color: #606060 !important;
}

:deep(.el-input__inner) {
  color: white !important;
}

:deep(.el-select .el-input__wrapper) {
  background-color: #404040 !important;
}

:deep(.el-table) {
  background-color: transparent !important;
  color: white !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #333 !important;
  color: white !important;
  border-color: #404040 !important;
}

:deep(.el-table td.el-table__cell) {
  border-color: #404040 !important;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>