/**
 * WebRTC屏幕共享组合式函数
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, computed, onUnmounted } from 'vue';
import { message } from "@repo/utils";
import { joinRoom, leaveRoom, type RoomInfo, type WebRTCUser } from '@/api/webrtc';

// WebRTC配置
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// 观看者信息接口
interface Viewer {
  userId: string;
  userInfo: WebRTCUser;
  peerConnection?: RTCPeerConnection;
  joinTime: number;
}

export function useWebRTCScreenShare() {
  // 状态管理
  const isSharing = ref(false);
  const isViewing = ref(false);
  const isConnecting = ref(false);
  const shareDuration = ref(0);
  const audioEnabled = ref(true);
  const currentRoom = ref<RoomInfo | null>(null);
  const currentUser = ref<WebRTCUser | null>(null);
  const sharer = ref<WebRTCUser | null>(null);
  
  // 流管理
  const screenStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);
  
  // 观看者管理
  const viewers = reactive<Map<string, Viewer>>(new Map());
  
  // Socket连接
  let socket: any = null;
  
  // 视频元素引用
  const videoRefs = reactive<Record<string, HTMLVideoElement>>({});
  
  // 共享计时器
  let shareTimer: NodeJS.Timeout | null = null;
  
  // 计算属性
  const viewerCount = computed(() => viewers.size);
  const viewerList = computed(() => Array.from(viewers.values()));
  
  /**
   * 设置视频元素引用
   */
  const setVideoRef = (elementId: string, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs[elementId] = element;
    } else {
      delete videoRefs[elementId];
    }
  };
  
  /**
   * 获取屏幕媒体流
   */
  const getScreenStream = async (includeAudio: boolean = true) => {
    try {
      const constraints: DisplayMediaStreamConstraints = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: includeAudio
      };
      
      screenStream.value = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // 监听屏幕共享结束事件
      const videoTrack = screenStream.value.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
      
      return screenStream.value;
    } catch (error) {
      console.error('获取屏幕流失败:', error);
      throw new Error('无法获取屏幕共享权限');
    }
  };
  
  /**
   * 创建与观看者的WebRTC连接
   */
  const createPeerConnection = (viewerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId: currentRoom.value?.roomId,
          targetUserId: viewerId,
          candidate: event.candidate
        });
      }
    };
    
    // 处理连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(`与观看者${viewerId}的连接状态:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        removeViewer(viewerId);
      }
    };
    
    // 添加屏幕流到连接
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => {
        peerConnection.addTrack(track, screenStream.value!);
      });
    }
    
    return peerConnection;
  };
  
  /**
   * 创建观看者的WebRTC连接
   */
  const createViewerPeerConnection = (): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId: currentRoom.value?.roomId,
          targetUserId: sharer.value?.userId,
          candidate: event.candidate
        });
      }
    };
    
    // 处理远程流
    peerConnection.ontrack = (event) => {
      remoteStream.value = event.streams[0];
      const remoteVideo = videoRefs['remote'];
      if (remoteVideo && remoteStream.value) {
        remoteVideo.srcObject = remoteStream.value;
      }
    };
    
    // 处理连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log('观看连接状态:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        stopViewing();
      }
    };
    
    return peerConnection;
  };
  
  /**
   * 初始化Socket连接
   */
  const initSocket = () => {
    // TODO: 实际项目中需要导入Socket.IO客户端
    // import { io } from 'socket.io-client';
    // socket = io('ws://localhost:3000');
    
    // 模拟Socket事件处理
    const mockSocket = {
      emit: (event: string, data: any) => {
        console.log('Socket emit:', event, data);
      },
      on: (event: string, handler: Function) => {
        console.log('Socket on:', event);
      },
      disconnect: () => {
        console.log('Socket disconnected');
      }
    };
    
    socket = mockSocket;
    
    // 处理Socket事件
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('viewer-left', handleViewerLeft);
    socket.on('share-started', handleShareStarted);
    socket.on('share-stopped', handleShareStopped);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('audio-toggle', handleAudioToggle);
    
    return socket;
  };
  
  /**
   * 开始屏幕共享
   */
  const startScreenShare = async (roomId?: string, includeAudio: boolean = true) => {
    try {
      isConnecting.value = true;
      
      // 获取屏幕流
      await getScreenStream(includeAudio);
      
      // 创建或加入房间
      let room: RoomInfo;
      if (roomId) {
        const { data } = await joinRoom(roomId);
        room = data;
      } else {
        // 创建新房间用于屏幕共享
        const { data } = await joinRoom('screen-' + Date.now());
        room = data;
      }
      
      currentRoom.value = room;
      
      // 初始化Socket连接
      initSocket();
      
      // 加入房间作为共享者
      socket.emit('start-screen-share', {
        roomId: room.roomId,
        userId: currentUser.value?.userId,
        userInfo: currentUser.value
      });
      
      // 设置本地视频显示
      const localVideo = videoRefs['local'];
      if (localVideo && screenStream.value) {
        localVideo.srcObject = screenStream.value;
      }
      
      isSharing.value = true;
      startShareTimer();
      message('屏幕共享已开始', { type: "success" });
    } catch (error) {
      console.error('开始屏幕共享失败:', error);
      message('开始屏幕共享失败', { type: "error" });
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };
  
  /**
   * 停止屏幕共享
   */
  const stopScreenShare = async () => {
    try {
      // 停止计时器
      stopShareTimer();
      
      // 关闭所有观看者连接
      viewers.forEach((viewer) => {
        if (viewer.peerConnection) {
          viewer.peerConnection.close();
        }
      });
      viewers.clear();
      
      // 停止屏幕流
      if (screenStream.value) {
        screenStream.value.getTracks().forEach(track => track.stop());
        screenStream.value = null;
      }
      
      // 通知停止共享
      socket?.emit('stop-screen-share', {
        roomId: currentRoom.value?.roomId,
        userId: currentUser.value?.userId
      });
      
      // 离开房间
      if (currentRoom.value) {
        await leaveRoom(currentRoom.value.roomId);
      }
      
      // 断开Socket连接
      socket?.disconnect();
      socket = null;
      
      // 重置状态
      isSharing.value = false;
      isConnecting.value = false;
      shareDuration.value = 0;
      currentRoom.value = null;
      
      message('屏幕共享已停止', { type: "success" });
    } catch (error) {
      console.error('停止屏幕共享失败:', error);
      message('停止屏幕共享失败', { type: "error" });
    }
  };
  
  /**
   * 开始观看屏幕共享
   */
  const startViewing = async (roomId: string) => {
    try {
      isConnecting.value = true;
      
      // 加入房间
      const { data } = await joinRoom(roomId);
      currentRoom.value = data;
      
      // 初始化Socket连接
      initSocket();
      
      // 加入房间作为观看者
      socket.emit('join-screen-share', {
        roomId: roomId,
        userId: currentUser.value?.userId,
        userInfo: currentUser.value
      });
      
      isViewing.value = true;
      message('已加入屏幕共享观看', { type: "success" });
    } catch (error) {
      console.error('加入观看失败:', error);
      message('加入观看失败', { type: "error" });
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };
  
  /**
   * 停止观看
   */
  const stopViewing = async () => {
    try {
      // 关闭WebRTC连接
      // 这里应该有观看者的peerConnection，简化处理
      
      // 清理远程流
      remoteStream.value = null;
      
      // 通知离开观看
      socket?.emit('leave-screen-share', {
        roomId: currentRoom.value?.roomId,
        userId: currentUser.value?.userId
      });
      
      // 离开房间
      if (currentRoom.value) {
        await leaveRoom(currentRoom.value.roomId);
      }
      
      // 断开Socket连接
      socket?.disconnect();
      socket = null;
      
      // 重置状态
      isViewing.value = false;
      isConnecting.value = false;
      currentRoom.value = null;
      sharer.value = null;
      
      message('已停止观看', { type: "success" });
    } catch (error) {
      console.error('停止观看失败:', error);
      message('停止观看失败', { type: "error" });
    }
  };
  
  /**
   * 添加观看者
   */
  const addViewer = (userId: string, userInfo: WebRTCUser) => {
    if (!viewers.has(userId)) {
      const viewer: Viewer = {
        userId,
        userInfo,
        joinTime: Date.now()
      };
      
      // 创建WebRTC连接
      viewer.peerConnection = createPeerConnection(userId);
      
      viewers.set(userId, viewer);
      
      // 创建offer给新观看者
      createOffer(userId);
    }
  };
  
  /**
   * 移除观看者
   */
  const removeViewer = (userId: string) => {
    const viewer = viewers.get(userId);
    if (viewer) {
      if (viewer.peerConnection) {
        viewer.peerConnection.close();
      }
      viewers.delete(userId);
    }
  };
  
  /**
   * 切换音频
   */
  const toggleAudio = () => {
    if (screenStream.value) {
      const audioTrack = screenStream.value.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        audioEnabled.value = audioTrack.enabled;
        
        // 通知观看者音频状态变化
        socket?.emit('audio-toggle', {
          roomId: currentRoom.value?.roomId,
          userId: currentUser.value?.userId,
          enabled: audioEnabled.value
        });
      }
    }
  };
  
  /**
   * 开始共享计时
   */
  const startShareTimer = () => {
    shareTimer = setInterval(() => {
      shareDuration.value++;
    }, 1000);
  };
  
  /**
   * 停止共享计时
   */
  const stopShareTimer = () => {
    if (shareTimer) {
      clearInterval(shareTimer);
      shareTimer = null;
    }
  };
  
  /**
   * 创建Offer
   */
  const createOffer = async (targetUserId: string) => {
    const viewer = viewers.get(targetUserId);
    if (!viewer?.peerConnection) return;
    
    try {
      const offer = await viewer.peerConnection.createOffer();
      await viewer.peerConnection.setLocalDescription(offer);
      
      socket?.emit('offer', {
        roomId: currentRoom.value?.roomId,
        targetUserId: targetUserId,
        offer: offer
      });
    } catch (error) {
      console.error('创建Offer失败:', error);
    }
  };
  
  // Socket事件处理函数
  const handleViewerJoined = (data: any) => {
    console.log('观看者加入:', data);
    if (isSharing.value) {
      addViewer(data.userId, data.userInfo);
    }
  };
  
  const handleViewerLeft = (data: any) => {
    console.log('观看者离开:', data);
    removeViewer(data.userId);
  };
  
  const handleShareStarted = (data: any) => {
    console.log('屏幕共享开始:', data);
    sharer.value = data.userInfo;
    
    // 如果是观看者，创建连接
    if (isViewing.value && !isSharing.value) {
      // 创建观看者的WebRTC连接
      const peerConnection = createViewerPeerConnection();
      // 这里需要处理观看者的连接逻辑
    }
  };
  
  const handleShareStopped = (data: any) => {
    console.log('屏幕共享停止:', data);
    if (isViewing.value) {
      stopViewing();
    }
  };
  
  const handleOffer = async (data: any) => {
    // 观看者处理offer
    if (isViewing.value && data.fromUserId === sharer.value?.userId) {
      // 创建answer逻辑
      console.log('收到共享者的offer');
    }
    
    // 共享者处理来自观看者的offer（通常不会发生）
    const viewer = viewers.get(data.fromUserId);
    if (viewer?.peerConnection) {
      try {
        await viewer.peerConnection.setRemoteDescription(data.offer);
        const answer = await viewer.peerConnection.createAnswer();
        await viewer.peerConnection.setLocalDescription(answer);
        
        socket?.emit('answer', {
          roomId: currentRoom.value?.roomId,
          targetUserId: data.fromUserId,
          answer: answer
        });
      } catch (error) {
        console.error('处理Offer失败:', error);
      }
    }
  };
  
  const handleAnswer = async (data: any) => {
    const viewer = viewers.get(data.fromUserId);
    if (viewer?.peerConnection) {
      try {
        await viewer.peerConnection.setRemoteDescription(data.answer);
      } catch (error) {
        console.error('处理Answer失败:', error);
      }
    }
  };
  
  const handleIceCandidate = async (data: any) => {
    const viewer = viewers.get(data.fromUserId);
    if (viewer?.peerConnection) {
      try {
        await viewer.peerConnection.addIceCandidate(data.candidate);
      } catch (error) {
        console.error('处理ICE候选失败:', error);
      }
    }
  };
  
  const handleAudioToggle = (data: any) => {
    if (data.userId === sharer.value?.userId) {
      // 更新共享者的音频状态显示
      console.log('共享者音频状态变化:', data.enabled);
    }
  };
  
  // 组件卸载时清理资源
  onUnmounted(() => {
    if (isSharing.value) {
      stopScreenShare();
    }
    if (isViewing.value) {
      stopViewing();
    }
  });
  
  return {
    // 状态
    isSharing,
    isViewing,
    isConnecting,
    shareDuration,
    audioEnabled,
    currentRoom,
    currentUser,
    sharer,
    viewers: viewerList,
    viewerCount,
    
    // 方法
    setVideoRef,
    startScreenShare,
    stopScreenShare,
    startViewing,
    stopViewing,
    toggleAudio
  };
}