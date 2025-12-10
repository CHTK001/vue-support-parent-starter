<template>
  <div class="video-conference-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>视频会议</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 会议界面 -->
    <div class="conference-interface" v-if="inConference">
      <!-- 会议信息栏 -->
      <div class="conference-info-bar">
        <div class="conference-title">
          <h3>{{ currentRoom?.roomName }}</h3>
          <span class="participant-count">{{ participants.length }} 人参与</span>
        </div>
        <div class="conference-time">
          <span>{{ formatDuration(conferenceDuration) }}</span>
        </div>
        <div class="conference-actions">
          <el-button type="info" size="small" @click="showParticipants = true">
            <el-icon><User /></el-icon>
            参与者
          </el-button>
          <el-button type="info" size="small" @click="showChat = !showChat">
            <el-icon><ChatDotRound /></el-icon>
            聊天
          </el-button>
        </div>
      </div>

      <!-- 视频网格 -->
      <div class="video-grid" :class="getGridClass()">
        <!-- 主讲者视频 -->
        <div 
          v-if="mainSpeaker"
          class="main-speaker-video"
          :class="{ 'with-sidebar': showChat }"
        >
          <video
            :ref="el => setVideoRef(mainSpeaker.userId, el)"
            class="speaker-video"
            autoplay
            playsinline
          ></video>
          <div class="speaker-info">
            <span class="speaker-name">{{ mainSpeaker.username }}</span>
            <el-tag v-if="mainSpeaker.isPresenting" type="success" size="small">
              正在演示
            </el-tag>
          </div>
        </div>

        <!-- 参与者视频网格 -->
        <div class="participants-grid" :class="{ 'with-sidebar': showChat }">
          <div
            v-for="participant in visibleParticipants"
            :key="participant.userId"
            class="participant-video"
            @click="setMainSpeaker(participant)"
          >
            <video
              :ref="el => setVideoRef(participant.userId, el)"
              class="video"
              autoplay
              playsinline
              :muted="participant.userId === currentUser?.userId"
            ></video>
            <div class="participant-info">
              <span class="participant-name">{{ participant.username }}</span>
              <div class="participant-status">
                <el-icon v-if="!participant.audioEnabled" class="muted-icon"><MicrophoneFilled /></el-icon>
                <el-icon v-if="!participant.videoEnabled" class="video-off-icon"><VideoCameraFilled /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天侧边栏 -->
      <div class="chat-sidebar" v-if="showChat">
        <div class="chat-header">
          <span>会议聊天</span>
          <el-button type="text" @click="showChat = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="chat-messages" ref="chatMessagesRef">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="chat-message"
            :class="{ 'own-message': message.userId === currentUser?.userId }"
          >
            <div class="message-header">
              <span class="sender-name">{{ message.username }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="chatInput"
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
          >
            <template #append>
              <el-button @click="sendMessage">
                <el-icon><Promotion /></el-icon>
              </el-button>
            </template>
          </el-input>
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
            @click="leaveConference"
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
          
          <el-button
            type="warning"
            size="small"
            @click="showInvite = true"
          >
            <el-icon><Plus /></el-icon>
            邀请
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主界面 -->
    <div class="main-interface" v-else>
      <!-- 创建会议 -->
      <el-card class="create-conference-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>创建会议</span>
          </div>
        </template>
        
        <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
          <el-form-item label="会议主题" prop="roomName">
            <el-input v-model="createForm.roomName" placeholder="请输入会议主题" />
          </el-form-item>
          
          <el-form-item label="最大人数" prop="maxUsers">
            <el-input-number
              v-model="createForm.maxUsers"
              :min="2"
              :max="50"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="会议描述">
            <el-input
              v-model="createForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入会议描述"
            />
          </el-form-item>
          
          <el-form-item label="会议密码">
            <el-input
              v-model="createForm.password"
              type="password"
              placeholder="可选，设置会议密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="creating"
              @click="createConference"
            >
              <el-icon><VideoCamera /></el-icon>
              创建会议
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 加入会议 -->
      <el-card class="join-conference-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>加入会议</span>
          </div>
        </template>
        
        <el-form :model="joinForm" label-width="100px">
          <el-form-item label="会议ID">
            <el-input v-model="joinForm.roomId" placeholder="请输入会议ID" />
          </el-form-item>
          
          <el-form-item label="会议密码">
            <el-input
              v-model="joinForm.password"
              type="password"
              placeholder="如果需要，请输入会议密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="success"
              size="large"
              :disabled="!joinForm.roomId"
              :loading="joining"
              @click="joinConference"
            >
              <el-icon><Right /></el-icon>
              加入会议
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 会议列表 -->
      <el-card class="conference-list-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>进行中的会议</span>
            <el-button type="text" @click="loadActiveConferences">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </template>
        
        <el-table :data="activeConferences" style="width: 100%">
          <el-table-column prop="roomName" label="会议主题" min-width="150" />
          <el-table-column prop="currentUsers" label="参与人数" width="100">
            <template #default="{ row }">
              {{ row.currentUsers }}/{{ row.maxUsers }}
            </template>
          </el-table-column>
          <el-table-column prop="creatorName" label="主持人" width="120" />
          <el-table-column prop="createTime" label="开始时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="quickJoinConference(row)"
              >
                加入
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 参与者列表对话框 -->
    <el-dialog v-model="showParticipants" title="参与者列表" width="500px">
      <el-table :data="participants" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="participant-status-list">
              <el-tag v-if="row.isPresenting" type="success" size="small">演示中</el-tag>
              <el-icon v-if="!row.audioEnabled" class="status-icon muted"><MicrophoneFilled /></el-icon>
              <el-icon v-if="!row.videoEnabled" class="status-icon video-off"><VideoCameraFilled /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="joinTime" label="加入时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.joinTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" v-if="isHost">
          <template #default="{ row }">
            <el-dropdown @command="(command) => handleParticipantAction(command, row)">
              <el-button type="primary" size="small">
                操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="mute">静音</el-dropdown-item>
                  <el-dropdown-item command="kick" divided>移除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 邀请对话框 -->
    <el-dialog v-model="showInvite" title="邀请参与者" width="500px">
      <div class="invite-content">
        <el-form-item label="会议链接">
          <el-input v-model="inviteLink" readonly>
            <template #append>
              <el-button @click="copyInviteLink">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="邀请用户">
          <el-select
            v-model="selectedInviteUsers"
            multiple
            placeholder="选择要邀请的用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.userId"
              :label="user.username"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
      </div>
      
      <template #footer>
        <el-button @click="showInvite = false">取消</el-button>
        <el-button type="primary" @click="sendInvitations">
          发送邀请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC视频会议页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from "@repo/utils";
import { ElMessageBox, type FormInstance } from 'element-plus';
import {
  VideoCamera,
  VideoCameraFilled,
  Microphone,
  MicrophoneFilled,
  PhoneFilled,
  Monitor,
  Setting,
  Plus,
  User,
  ChatDotRound,
  Close,
  Promotion,
  Right,
  Refresh,
  ArrowDown,
  CopyDocument
} from '@element-plus/icons-vue';
import {
  getRoomList,
  createRoom,
  joinRoom,
  getRoomUsers,
  getOnlineUsers,
  type RoomInfo,
  type CreateRoomParams,
  type WebRTCUser
} from '@/api/webrtc';
import { useWebRTCConference } from '@/composables/webrtc/useWebRTCConference';

const router = useRouter();
const route = useRoute();

// WebRTC会议组合式函数
const {
  inConference,
  currentRoom,
  participants,
  audioEnabled,
  videoEnabled,
  screenSharing,
  conferenceDuration,
  currentUser,
  joinConference: joinConferenceRoom,
  leaveConference,
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  setVideoRef
} = useWebRTCConference();

// 表单引用
const createFormRef = ref<FormInstance>();
const chatMessagesRef = ref<HTMLElement>();

// 数据状态
const creating = ref(false);
const joining = ref(false);
const showChat = ref(false);
const showParticipants = ref(false);
const showSettings = ref(false);
const showInvite = ref(false);
const chatInput = ref('');
const selectedInviteUsers = ref<string[]>([]);

// 主讲者
const mainSpeaker = ref<any>(null);

// 表单数据
const createForm = reactive<CreateRoomParams>({
  roomName: '',
  roomType: 'video_conference',
  maxUsers: 10,
  description: '',
  password: ''
});

const joinForm = reactive({
  roomId: '',
  password: ''
});

// 验证规则
const createRules = {
  roomName: [
    { required: true, message: '请输入会议主题', trigger: 'blur' },
    { min: 2, max: 50, message: '会议主题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  maxUsers: [
    { required: true, message: '请设置最大人数', trigger: 'blur' }
  ]
};

// 会议列表
const activeConferences = ref<RoomInfo[]>([]);
const availableUsers = ref<WebRTCUser[]>([]);

// 聊天消息
const chatMessages = ref([
  {
    id: '1',
    userId: 'user1',
    username: '张三',
    content: '大家好！',
    timestamp: new Date().toISOString()
  }
]);

// 计算属性
const visibleParticipants = computed(() => {
  return participants.value.filter(p => p.userId !== mainSpeaker.value?.userId);
});

const isHost = computed(() => {
  return currentUser.value?.userId === currentRoom.value?.creatorId;
});

const inviteLink = computed(() => {
  if (!currentRoom.value) return '';
  return `${window.location.origin}/webrtc/join/${currentRoom.value.roomId}`;
});

/**
 * 获取网格样式类
 */
const getGridClass = () => {
  const count = participants.value.length;
  if (count <= 4) return 'grid-small';
  if (count <= 9) return 'grid-medium';
  return 'grid-large';
};

/**
 * 设置主讲者
 */
const setMainSpeaker = (participant: any) => {
  mainSpeaker.value = participant;
};

/**
 * 创建会议
 */
const createConference = async () => {
  if (!createFormRef.value) return;
  
  try {
    await createFormRef.value.validate();
    creating.value = true;
    
    const params = { ...createForm };
    if (!params.password) {
      delete params.password;
    }
    
    const { data } = await createRoom(params);
    message('会议创建成功', { type: "success" });
    
    // 自动加入创建的会议
    await joinConferenceRoom(data.roomId, params.password);
  } catch (error) {
    console.error('创建会议失败:', error);
    message('创建会议失败', { type: "error" });
  } finally {
    creating.value = false;
  }
};

/**
 * 加入会议
 */
const joinConference = async () => {
  if (!joinForm.roomId) {
    message('请输入会议ID', { type: "warning" });
    return;
  }
  
  try {
    joining.value = true;
    await joinConferenceRoom(joinForm.roomId, joinForm.password);
    message('加入会议成功', { type: "success" });
  } catch (error) {
    console.error('加入会议失败:', error);
    message('加入会议失败', { type: "error" });
  } finally {
    joining.value = false;
  }
};

/**
 * 快速加入会议
 */
const quickJoinConference = async (room: RoomInfo) => {
  try {
    await joinConferenceRoom(room.roomId);
    message('加入会议成功', { type: "success" });
  } catch (error) {
    console.error('加入会议失败:', error);
    message('加入会议失败', { type: "error" });
  }
};

/**
 * 加载活跃会议列表
 */
const loadActiveConferences = async () => {
  try {
    const { data } = await getRoomList({
      roomType: 'video_conference',
      status: 'active'
    });
    activeConferences.value = data.records;
  } catch (error) {
    console.error('加载会议列表失败:', error);
    message('加载会议列表失败', { type: "error" });
  }
};

/**
 * 加载可邀请用户
 */
const loadAvailableUsers = async () => {
  try {
    const { data } = await getOnlineUsers();
    availableUsers.value = data.records.filter(user => 
      !participants.value.some(p => p.userId === user.userId)
    );
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
};

/**
 * 发送消息
 */
const sendMessage = () => {
  if (!chatInput.value.trim()) return;
  
  const message = {
    id: Date.now().toString(),
    userId: currentUser.value?.userId || '',
    username: currentUser.value?.username || '',
    content: chatInput.value,
    timestamp: new Date().toISOString()
  };
  
  chatMessages.value.push(message);
  chatInput.value = '';
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

/**
 * 处理参与者操作
 */
const handleParticipantAction = async (command: string, participant: any) => {
  switch (command) {
    case 'mute':
      // TODO: 实现静音参与者
      message(`已静音 ${participant.username}`, { type: "success" });
      break;
    case 'kick':
      try {
        await ElMessageBox.confirm(
          `确定要移除 ${participant.username} 吗？`,
          '确认移除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        // TODO: 实现移除参与者
        message(`已移除 ${participant.username}`, { type: "success" });
      } catch (error) {
        // 用户取消
      }
      break;
  }
};

/**
 * 复制邀请链接
 */
const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    message('邀请链接已复制到剪贴板', { type: "success" });
  } catch (error) {
    message('复制失败', { type: "error" });
  }
};

/**
 * 发送邀请
 */
const sendInvitations = () => {
  if (selectedInviteUsers.value.length === 0) {
    message('请选择要邀请的用户', { type: "warning" });
    return;
  }
  
  // TODO: 实现发送邀请逻辑
  message(`已向 ${selectedInviteUsers.value.length} 位用户发送邀请`, { type: "success" });
  showInvite.value = false;
  selectedInviteUsers.value = [];
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
    loadActiveConferences(),
    loadAvailableUsers()
  ]);
  
  // 如果URL中有房间ID，自动加入
  const roomId = route.params.roomId as string;
  if (roomId) {
    joinForm.roomId = roomId;
    await joinConference();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (inConference.value) {
    leaveConference();
  }
});
</script>

<style scoped lang="scss">
.video-conference-container {
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

.conference-interface {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  
  .conference-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    margin-bottom: 12px;
    
    .conference-title {
      h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .participant-count {
         color: var(--el-text-color-primary);
        font-size: 14px;
      }
    }
    
    .conference-time {
      font-size: 16px;
      font-weight: 600;
      color: #67c23a;
    }
    
    .conference-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .video-grid {
    flex: 1;
    display: flex;
    gap: 12px;
    
    &.with-sidebar {
      margin-right: 300px;
    }
    
    .main-speaker-video {
      flex: 2;
      position: relative;
      background-color: #2a2a2a;
      border-radius: 12px;
      overflow: hidden;
      
      .speaker-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .speaker-info {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 8px 16px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .speaker-name {
          font-weight: 600;
        }
      }
    }
    
    .participants-grid {
      flex: 1;
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      
      &.grid-small {
        grid-template-columns: repeat(2, 1fr);
      }
      
      &.grid-medium {
        grid-template-columns: repeat(3, 1fr);
      }
      
      &.grid-large {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .participant-video {
        position: relative;
        background-color: #2a2a2a;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          border: 2px solid #409eff;
        }
        
        .video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .participant-info {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 4px 8px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .participant-name {
            font-size: 12px;
            font-weight: 500;
          }
          
          .participant-status {
            display: flex;
            gap: 4px;
            
            .muted-icon {
              color: #f56c6c;
            }
            
            .video-off-icon {
              color: #e6a23c;
            }
          }
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
    margin-top: 12px;
    
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

.chat-sidebar {
  position: fixed;
  right: 20px;
  top: 120px;
  bottom: 120px;
  width: 280px;
  background-color: #2a2a2a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #404040;
    font-weight: 600;
  }
  
  .chat-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    
    .chat-message {
      margin-bottom: 12px;
      
      &.own-message {
        .message-content {
          background-color: #409eff;
          margin-left: 20px;
        }
      }
      
      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .sender-name {
          font-size: 12px;
          font-weight: 500;
           color: var(--el-text-color-primary);
        }
        
        .message-time {
          font-size: 10px;
          color: #606266;
        }
      }
      
      .message-content {
        background-color: #404040;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        margin-right: 20px;
      }
    }
  }
  
  .chat-input {
    padding: 12px;
    border-top: 1px solid #404040;
  }
}

.main-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  height: calc(100vh - 100px);
  
  .create-conference-card {
    grid-column: 1;
  }
  
  .join-conference-card {
    grid-column: 2;
  }
  
  .conference-list-card {
    grid-column: 1 / -1;
  }
  
  .create-conference-card,
  .join-conference-card,
  .conference-list-card {
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
}

.participant-status-list {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .status-icon {
    &.muted {
      color: #f56c6c;
    }
    
    &.video-off {
      color: #e6a23c;
    }
  }
}

.invite-content {
  .el-form-item {
    margin-bottom: 20px;
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

:deep(.el-textarea__inner) {
  background-color: #404040 !important;
  border-color: #606060 !important;
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
</style>