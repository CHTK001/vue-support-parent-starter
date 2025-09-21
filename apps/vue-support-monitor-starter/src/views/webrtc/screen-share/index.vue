<template>
  <div class="screen-share-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>屏幕共享</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 共享界面 -->
    <div class="share-interface" v-if="isSharing">
      <!-- 共享信息栏 -->
      <div class="share-info-bar">
        <div class="share-status">
          <el-icon class="sharing-icon"><Monitor /></el-icon>
          <span class="status-text">正在共享屏幕</span>
          <el-tag type="success" size="small">{{ shareType === 'screen' ? '整个屏幕' : '应用窗口' }}</el-tag>
        </div>
        <div class="share-time">
          <span>{{ formatDuration(shareDuration) }}</span>
        </div>
        <div class="share-actions">
          <el-button type="info" size="small" @click="showViewers = true">
            <el-icon><User /></el-icon>
            观看者 ({{ viewers.length }})
          </el-button>
          <el-button type="warning" size="small" @click="pauseShare">
            <el-icon><VideoPause /></el-icon>
            {{ isPaused ? '恢复' : '暂停' }}
          </el-button>
          <el-button type="danger" size="small" @click="stopShare">
            <el-icon><VideoPlay /></el-icon>
            停止共享
          </el-button>
        </div>
      </div>

      <!-- 预览窗口 -->
      <div class="preview-container">
        <div class="preview-window">
          <video
            ref="previewVideoRef"
            class="preview-video"
            autoplay
            muted
            playsinline
          ></video>
          <div class="preview-overlay">
            <div class="preview-info">
              <span>预览窗口</span>
              <el-button type="text" @click="togglePreview">
                <el-icon><{{ showPreview ? 'Hide' : 'View' }} /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 观看者列表 -->
        <div class="viewers-panel" v-if="showViewers">
          <div class="panel-header">
            <span>观看者列表</span>
            <el-button type="text" @click="showViewers = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="viewers-list">
            <div
              v-for="viewer in viewers"
              :key="viewer.userId"
              class="viewer-item"
            >
              <el-avatar :size="32" :src="viewer.avatar">
                {{ viewer.username.charAt(0) }}
              </el-avatar>
              <div class="viewer-info">
                <span class="viewer-name">{{ viewer.username }}</span>
                <span class="viewer-status">{{ viewer.status }}</span>
              </div>
              <div class="viewer-actions">
                <el-button type="text" size="small" @click="kickViewer(viewer)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
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
            type="warning"
            size="large"
            circle
            @click="pauseShare"
          >
            <el-icon><VideoPause v-if="!isPaused" /><VideoPlay v-else /></el-icon>
          </el-button>
          
          <el-button
            type="danger"
            size="large"
            circle
            @click="stopShare"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <div class="additional-controls">
          <el-button type="info" size="small" @click="showSettings = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
          
          <el-button type="success" size="small" @click="showInvite = true">
            <el-icon><Share /></el-icon>
            邀请观看
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主界面 -->
    <div class="main-interface" v-else>
      <!-- 开始共享 -->
      <el-card class="start-share-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>开始屏幕共享</span>
          </div>
        </template>
        
        <div class="share-options">
          <div class="option-group">
            <h4>选择共享内容</h4>
            <el-radio-group v-model="shareType" class="share-type-group">
              <el-radio value="screen" class="share-option">
                <div class="option-content">
                  <el-icon class="option-icon"><Monitor /></el-icon>
                  <div class="option-text">
                    <span class="option-title">整个屏幕</span>
                    <span class="option-desc">共享您的整个屏幕内容</span>
                  </div>
                </div>
              </el-radio>
              
              <el-radio value="window" class="share-option">
                <div class="option-content">
                  <el-icon class="option-icon"><Crop /></el-icon>
                  <div class="option-text">
                    <span class="option-title">应用窗口</span>
                    <span class="option-desc">共享特定的应用程序窗口</span>
                  </div>
                </div>
              </el-radio>
              
              <el-radio value="tab" class="share-option">
                <div class="option-content">
                  <el-icon class="option-icon"><Document /></el-icon>
                  <div class="option-text">
                    <span class="option-title">浏览器标签页</span>
                    <span class="option-desc">共享当前浏览器标签页</span>
                  </div>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
          
          <div class="option-group">
            <h4>共享设置</h4>
            <el-form :model="shareSettings" label-width="120px">
              <el-form-item label="共享质量">
                <el-select v-model="shareSettings.quality" style="width: 100%">
                  <el-option label="高清 (1080p)" value="high" />
                  <el-option label="标清 (720p)" value="medium" />
                  <el-option label="流畅 (480p)" value="low" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="帧率">
                <el-select v-model="shareSettings.frameRate" style="width: 100%">
                  <el-option label="60 FPS" :value="60" />
                  <el-option label="30 FPS" :value="30" />
                  <el-option label="15 FPS" :value="15" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="shareSettings.includeAudio">
                  包含系统音频
                </el-checkbox>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="shareSettings.enablePointer">
                  显示鼠标指针
                </el-checkbox>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="start-actions">
            <el-button
              type="primary"
              size="large"
              :loading="starting"
              @click="startShare"
            >
              <el-icon><VideoPlay /></el-icon>
              开始共享
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 加入观看 -->
      <el-card class="join-watch-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>加入观看</span>
          </div>
        </template>
        
        <el-form :model="joinForm" label-width="100px">
          <el-form-item label="共享ID">
            <el-input v-model="joinForm.shareId" placeholder="请输入共享ID" />
          </el-form-item>
          
          <el-form-item label="访问密码">
            <el-input
              v-model="joinForm.password"
              type="password"
              placeholder="如果需要，请输入访问密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="success"
              size="large"
              :disabled="!joinForm.shareId"
              :loading="joining"
              @click="joinWatch"
            >
              <el-icon><View /></el-icon>
              加入观看
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 活跃共享列表 -->
      <el-card class="active-shares-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>活跃的屏幕共享</span>
            <el-button type="text" @click="loadActiveShares">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </template>
        
        <el-table :data="activeShares" style="width: 100%">
          <el-table-column prop="title" label="共享标题" min-width="150" />
          <el-table-column prop="shareType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getShareTypeTag(row.shareType)" size="small">
                {{ getShareTypeText(row.shareType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewerCount" label="观看人数" width="100" />
          <el-table-column prop="ownerName" label="共享者" width="120" />
          <el-table-column prop="startTime" label="开始时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="quickJoinWatch(row)"
              >
                观看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 观看者列表对话框 -->
    <el-dialog v-model="showViewers" title="观看者列表" width="500px">
      <el-table :data="viewers" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'" size="small">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinTime" label="加入时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.joinTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="kickViewer(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 邀请观看对话框 -->
    <el-dialog v-model="showInvite" title="邀请观看" width="500px">
      <div class="invite-content">
        <el-form-item label="共享链接">
          <el-input v-model="shareLink" readonly>
            <template #append>
              <el-button @click="copyShareLink">
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

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="共享设置" width="600px">
      <el-form :model="shareSettings" label-width="120px">
        <el-form-item label="共享质量">
          <el-select v-model="shareSettings.quality" style="width: 100%">
            <el-option label="高清 (1080p)" value="high" />
            <el-option label="标清 (720p)" value="medium" />
            <el-option label="流畅 (480p)" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="帧率">
          <el-select v-model="shareSettings.frameRate" style="width: 100%">
            <el-option label="60 FPS" :value="60" />
            <el-option label="30 FPS" :value="30" />
            <el-option label="15 FPS" :value="15" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="shareSettings.includeAudio">
            包含系统音频
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="shareSettings.enablePointer">
            显示鼠标指针
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="shareSettings.allowControl">
            允许远程控制
          </el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="applySettings">
          应用设置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC屏幕共享页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Monitor,
  User,
  VideoPause,
  VideoPlay,
  Close,
  Microphone,
  MicrophoneFilled,
  Setting,
  Share,
  Crop,
  Document,
  View,
  Refresh,
  CopyDocument
} from '@element-plus/icons-vue';
import { getOnlineUsers, type WebRTCUser } from '@/api/webrtc';
import { useWebRTCScreenShare } from '@/composables/webrtc/useWebRTCScreenShare';

const router = useRouter();

// WebRTC屏幕共享组合式函数
const {
  isSharing,
  isPaused,
  shareDuration,
  audioEnabled,
  viewers,
  startScreenShare,
  stopScreenShare,
  pauseScreenShare,
  toggleAudio
} = useWebRTCScreenShare();

// 视频引用
const previewVideoRef = ref<HTMLVideoElement>();

// 数据状态
const starting = ref(false);
const joining = ref(false);
const showPreview = ref(true);
const showViewers = ref(false);
const showSettings = ref(false);
const showInvite = ref(false);
const selectedInviteUsers = ref<string[]>([]);

// 共享类型
const shareType = ref<'screen' | 'window' | 'tab'>('screen');

// 表单数据
const shareSettings = reactive({
  quality: 'medium',
  frameRate: 30,
  includeAudio: true,
  enablePointer: true,
  allowControl: false
});

const joinForm = reactive({
  shareId: '',
  password: ''
});

// 活跃共享列表
const activeShares = ref([
  {
    id: '1',
    title: '项目演示',
    shareType: 'screen',
    viewerCount: 5,
    ownerName: '张三',
    startTime: new Date().toISOString()
  },
  {
    id: '2',
    title: '代码审查',
    shareType: 'window',
    viewerCount: 3,
    ownerName: '李四',
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]);

const availableUsers = ref<WebRTCUser[]>([]);

// 计算属性
const shareLink = computed(() => {
  if (!isSharing.value) return '';
  return `${window.location.origin}/webrtc/screen-share/watch/123456`;
});

/**
 * 获取共享类型标签
 */
const getShareTypeTag = (type: string) => {
  const tags = {
    screen: 'primary',
    window: 'success',
    tab: 'warning'
  };
  return tags[type as keyof typeof tags] || 'info';
};

/**
 * 获取共享类型文本
 */
const getShareTypeText = (type: string) => {
  const texts = {
    screen: '整屏',
    window: '窗口',
    tab: '标签页'
  };
  return texts[type as keyof typeof texts] || '未知';
};

/**
 * 开始屏幕共享
 */
const startShare = async () => {
  try {
    starting.value = true;
    
    const constraints = {
      video: {
        mediaSource: shareType.value,
        width: { ideal: shareSettings.quality === 'high' ? 1920 : shareSettings.quality === 'medium' ? 1280 : 854 },
        height: { ideal: shareSettings.quality === 'high' ? 1080 : shareSettings.quality === 'medium' ? 720 : 480 },
        frameRate: { ideal: shareSettings.frameRate }
      },
      audio: shareSettings.includeAudio
    };
    
    await startScreenShare(constraints);
    
    // 设置预览视频
    if (previewVideoRef.value) {
      // TODO: 设置预览流
    }
    
    ElMessage.success('屏幕共享已开始');
  } catch (error) {
    console.error('开始屏幕共享失败:', error);
    ElMessage.error('开始屏幕共享失败');
  } finally {
    starting.value = false;
  }
};

/**
 * 停止屏幕共享
 */
const stopShare = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要停止屏幕共享吗？',
      '确认停止',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await stopScreenShare();
    ElMessage.success('屏幕共享已停止');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('停止屏幕共享失败:', error);
      ElMessage.error('停止屏幕共享失败');
    }
  }
};

/**
 * 暂停/恢复共享
 */
const pauseShare = async () => {
  try {
    await pauseScreenShare();
    ElMessage.success(isPaused.value ? '屏幕共享已暂停' : '屏幕共享已恢复');
  } catch (error) {
    console.error('暂停/恢复共享失败:', error);
    ElMessage.error('操作失败');
  }
};

/**
 * 切换预览窗口
 */
const togglePreview = () => {
  showPreview.value = !showPreview.value;
};

/**
 * 加入观看
 */
const joinWatch = async () => {
  if (!joinForm.shareId) {
    ElMessage.warning('请输入共享ID');
    return;
  }
  
  try {
    joining.value = true;
    // TODO: 实现加入观看逻辑
    ElMessage.success('加入观看成功');
  } catch (error) {
    console.error('加入观看失败:', error);
    ElMessage.error('加入观看失败');
  } finally {
    joining.value = false;
  }
};

/**
 * 快速加入观看
 */
const quickJoinWatch = async (share: any) => {
  try {
    // TODO: 实现快速加入观看逻辑
    ElMessage.success('加入观看成功');
  } catch (error) {
    console.error('加入观看失败:', error);
    ElMessage.error('加入观看失败');
  }
};

/**
 * 移除观看者
 */
const kickViewer = async (viewer: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除观看者 ${viewer.username} 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // TODO: 实现移除观看者逻辑
    ElMessage.success(`已移除观看者 ${viewer.username}`);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除观看者失败:', error);
      ElMessage.error('移除观看者失败');
    }
  }
};

/**
 * 加载活跃共享列表
 */
const loadActiveShares = async () => {
  try {
    // TODO: 实现加载活跃共享列表
    ElMessage.success('刷新成功');
  } catch (error) {
    console.error('加载活跃共享列表失败:', error);
    ElMessage.error('加载失败');
  }
};

/**
 * 加载可邀请用户
 */
const loadAvailableUsers = async () => {
  try {
    const { data } = await getOnlineUsers();
    availableUsers.value = data.records;
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
};

/**
 * 复制共享链接
 */
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    ElMessage.success('共享链接已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

/**
 * 发送邀请
 */
const sendInvitations = () => {
  if (selectedInviteUsers.value.length === 0) {
    ElMessage.warning('请选择要邀请的用户');
    return;
  }
  
  // TODO: 实现发送邀请逻辑
  ElMessage.success(`已向 ${selectedInviteUsers.value.length} 位用户发送邀请`);
  showInvite.value = false;
  selectedInviteUsers.value = [];
};

/**
 * 应用设置
 */
const applySettings = () => {
  // TODO: 实现应用设置逻辑
  ElMessage.success('设置已应用');
  showSettings.value = false;
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
  await loadAvailableUsers();
});

// 组件卸载时清理
onUnmounted(() => {
  if (isSharing.value) {
    stopScreenShare();
  }
});
</script>

<style scoped lang="scss">
.screen-share-container {
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

.share-interface {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  
  .share-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    margin-bottom: 12px;
    
    .share-status {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .sharing-icon {
        color: #67c23a;
        font-size: 20px;
      }
      
      .status-text {
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .share-time {
      font-size: 16px;
      font-weight: 600;
      color: #67c23a;
    }
    
    .share-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .preview-container {
    flex: 1;
    display: flex;
    gap: 12px;
    
    .preview-window {
      flex: 1;
      position: relative;
      background-color: #2a2a2a;
      border-radius: 12px;
      overflow: hidden;
      
      .preview-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .preview-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.7) 100%);
        pointer-events: none;
        
        .preview-info {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 8px 16px;
          border-radius: 20px;
          pointer-events: auto;
          
          span {
            font-weight: 600;
          }
        }
      }
    }
    
    .viewers-panel {
      width: 300px;
      background-color: #2a2a2a;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #404040;
        font-weight: 600;
      }
      
      .viewers-list {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        
        .viewer-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: background-color 0.3s ease;
          
          &:hover {
            background-color: #404040;
          }
          
          .viewer-info {
            flex: 1;
            
            .viewer-name {
              display: block;
              font-weight: 500;
              margin-bottom: 2px;
            }
            
            .viewer-status {
              font-size: 12px;
               color: var(--el-text-color-primary);
            }
          }
          
          .viewer-actions {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          &:hover .viewer-actions {
            opacity: 1;
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

.main-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  height: calc(100vh - 100px);
  
  .start-share-card {
    grid-column: 1 / -1;
  }
  
  .join-watch-card {
    grid-column: 1;
  }
  
  .active-shares-card {
    grid-column: 2;
  }
  
  .start-share-card,
  .join-watch-card,
  .active-shares-card {
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

.share-options {
  .option-group {
    margin-bottom: 30px;
    
    h4 {
      margin-bottom: 16px;
      color: var(--el-text-color-primary);
    }
    
    .share-type-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .share-option {
        border: 1px solid #404040;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #409eff;
          background-color: rgba(64, 158, 255, 0.1);
        }
        
        :deep(.el-radio__input.is-checked + .el-radio__label) {
          color: #409eff;
        }
        
        .option-content {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .option-icon {
            font-size: 32px;
            color: #409eff;
          }
          
          .option-text {
            .option-title {
              display: block;
              font-weight: 600;
              margin-bottom: 4px;
            }
            
            .option-desc {
              font-size: 14px;
               color: var(--el-text-color-primary);
            }
          }
        }
      }
    }
  }
  
  .start-actions {
    text-align: center;
    margin-top: 30px;
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

:deep(.el-select .el-input__wrapper) {
  background-color: #404040 !important;
}

:deep(.el-radio__label) {
  color: white !important;
}

:deep(.el-checkbox__label) {
  color: white !important;
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