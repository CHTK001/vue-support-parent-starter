/**
 * WebRTC视频会议组合式函数
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, computed, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { joinRoom, leaveRoom, type RoomInfo, type WebRTCUser } from '@/api/webrtc';

// WebRTC配置
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// 参与者信息接口
interface Participant {
  userId: string;
  userInfo: WebRTCUser;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
}

export function useWebRTCConference() {
  // 状态管理
  const inConference = ref(false);
  const isConnecting = ref(false);
  const conferenceDuration = ref(0);
  const audioEnabled = ref(true);
  const videoEnabled = ref(true);
  const screenSharing = ref(false);
  const currentRoom = ref<RoomInfo | null>(null);
  const currentUser = ref<WebRTCUser | null>(null);
  
  // 参与者管理
  const participants = reactive<Map<string, Participant>>(new Map());
  const localStream = ref<MediaStream | null>(null);
  const screenStream = ref<MediaStream | null>(null);
  
  // Socket连接
  let socket: any = null;
  
  // 视频元素引用映射
  const videoRefs = reactive<Record<string, HTMLVideoElement>>({});
  
  // 会议计时器
  let conferenceTimer: NodeJS.Timeout | null = null;
  
  // 计算属性
  const participantCount = computed(() => participants.size + 1); // +1 for current user
  const participantList = computed(() => Array.from(participants.values()));
  
  /**
   * 设置视频元素引用
   */
  const setVideoRef = (userId: string, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs[userId] = element;
    } else {
      delete videoRefs[userId];
    }
  };
  
  /**
   * 初始化本地媒体流
   */
  const initLocalStream = async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 设置本地视频
      const localVideo = videoRefs[currentUser.value?.userId || 'local'];
      if (localVideo && localStream.value) {
        localVideo.srcObject = localStream.value;
      }
      
      return localStream.value;
    } catch (error) {
      console.error('获取本地媒体流失败:', error);
      throw new Error('无法访问摄像头或麦克风');
    }
  };
  
  /**
   * 创建与特定用户的WebRTC连接
   */
  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId: currentRoom.value?.roomId,
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };
    
    // 处理远程流
    peerConnection.ontrack = (event) => {
      const participant = participants.get(userId);
      if (participant) {
        participant.stream = event.streams[0];
        const remoteVideo = videoRefs[userId];
        if (remoteVideo && participant.stream) {
          remoteVideo.srcObject = participant.stream;
        }
      }
    };
    
    // 处理连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(`与用户${userId}的连接状态:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        removeParticipant(userId);
      }
    };
    
    // 添加本地流到连接
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream.value!);
      });
    }
    
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
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('audio-toggle', handleAudioToggle);
    socket.on('video-toggle', handleVideoToggle);
    socket.on('screen-share-start', handleScreenShareStart);
    socket.on('screen-share-stop', handleScreenShareStop);
    socket.on('conference-ended', handleConferenceEnded);
    
    return socket;
  };
  
  /**
   * 加入会议
   */
  const joinConference = async (roomId: string) => {
    try {
      isConnecting.value = true;
      
      // 初始化本地媒体流
      await initLocalStream();
      
      // 加入房间
      const { data } = await joinRoom(roomId);
      currentRoom.value = data;
      
      // 初始化Socket连接
      initSocket();
      
      // 加入房间
      socket.emit('join-conference', {
        roomId: roomId,
        userId: currentUser.value?.userId,
        userInfo: currentUser.value
      });
      
      inConference.value = true;
      startConferenceTimer();
      ElMessage.success('已加入会议');
    } catch (error) {
      console.error('加入会议失败:', error);
      ElMessage.error('加入会议失败');
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };
  
  /**
   * 离开会议
   */
  const leaveConference = async () => {
    try {
      // 停止计时器
      stopConferenceTimer();
      
      // 停止屏幕共享
      if (screenSharing.value) {
        await stopScreenShare();
      }
      
      // 关闭所有WebRTC连接
      participants.forEach((participant) => {
        if (participant.peerConnection) {
          participant.peerConnection.close();
        }
      });
      participants.clear();
      
      // 关闭本地媒体流
      if (localStream.value) {
        localStream.value.getTracks().forEach(track => track.stop());
        localStream.value = null;
      }
      
      // 离开房间
      if (currentRoom.value) {
        await leaveRoom(currentRoom.value.roomId);
        socket?.emit('leave-conference', {
          roomId: currentRoom.value.roomId,
          userId: currentUser.value?.userId
        });
      }
      
      // 断开Socket连接
      socket?.disconnect();
      socket = null;
      
      // 重置状态
      inConference.value = false;
      isConnecting.value = false;
      conferenceDuration.value = 0;
      currentRoom.value = null;
      
      ElMessage.success('已离开会议');
    } catch (error) {
      console.error('离开会议失败:', error);
      ElMessage.error('离开会议失败');
    }
  };
  
  /**
   * 添加参与者
   */
  const addParticipant = (userId: string, userInfo: WebRTCUser) => {
    if (!participants.has(userId)) {
      const participant: Participant = {
        userId,
        userInfo,
        audioEnabled: true,
        videoEnabled: true,
        isSpeaking: false
      };
      
      // 创建WebRTC连接
      participant.peerConnection = createPeerConnection(userId);
      
      participants.set(userId, participant);
      
      // 如果是新加入的用户，创建offer
      createOffer(userId);
    }
  };
  
  /**
   * 移除参与者
   */
  const removeParticipant = (userId: string) => {
    const participant = participants.get(userId);
    if (participant) {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      participants.delete(userId);
      
      // 清理视频元素
      delete videoRefs[userId];
    }
  };
  
  /**
   * 切换音频
   */
  const toggleAudio = () => {
    if (localStream.value) {
      const audioTrack = localStream.value.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        audioEnabled.value = audioTrack.enabled;
        
        // 通知其他参与者音频状态变化
        socket?.emit('audio-toggle', {
          roomId: currentRoom.value?.roomId,
          userId: currentUser.value?.userId,
          enabled: audioEnabled.value
        });
      }
    }
  };
  
  /**
   * 切换视频
   */
  const toggleVideo = () => {
    if (localStream.value) {
      const videoTrack = localStream.value.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        videoEnabled.value = videoTrack.enabled;
        
        // 通知其他参与者视频状态变化
        socket?.emit('video-toggle', {
          roomId: currentRoom.value?.roomId,
          userId: currentUser.value?.userId,
          enabled: videoEnabled.value
        });
      }
    }
  };
  
  /**
   * 开始屏幕共享
   */
  const startScreenShare = async () => {
    try {
      screenStream.value = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // 替换视频轨道
      const videoTrack = screenStream.value.getVideoTracks()[0];
      if (videoTrack) {
        // 替换所有连接中的视频轨道
        participants.forEach((participant) => {
          if (participant.peerConnection) {
            const sender = participant.peerConnection.getSenders().find(
              s => s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        });
        
        // 更新本地视频显示
        const localVideo = videoRefs[currentUser.value?.userId || 'local'];
        if (localVideo) {
          localVideo.srcObject = screenStream.value;
        }
        
        screenSharing.value = true;
        
        // 监听屏幕共享结束
        videoTrack.onended = () => {
          stopScreenShare();
        };
        
        // 通知其他参与者
        socket?.emit('screen-share-start', {
          roomId: currentRoom.value?.roomId,
          userId: currentUser.value?.userId
        });
        
        ElMessage.success('屏幕共享已开始');
      }
    } catch (error) {
      console.error('开始屏幕共享失败:', error);
      ElMessage.error('开始屏幕共享失败');
    }
  };
  
  /**
   * 停止屏幕共享
   */
  const stopScreenShare = async () => {
    try {
      if (screenStream.value) {
        screenStream.value.getTracks().forEach(track => track.stop());
        screenStream.value = null;
      }
      
      // 恢复摄像头视频
      if (localStream.value) {
        const videoTrack = localStream.value.getVideoTracks()[0];
        if (videoTrack) {
          // 替换所有连接中的视频轨道
          participants.forEach((participant) => {
            if (participant.peerConnection) {
              const sender = participant.peerConnection.getSenders().find(
                s => s.track && s.track.kind === 'video'
              );
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            }
          });
          
          // 更新本地视频显示
          const localVideo = videoRefs[currentUser.value?.userId || 'local'];
          if (localVideo) {
            localVideo.srcObject = localStream.value;
          }
        }
      }
      
      screenSharing.value = false;
      
      // 通知其他参与者
      socket?.emit('screen-share-stop', {
        roomId: currentRoom.value?.roomId,
        userId: currentUser.value?.userId
      });
      
      ElMessage.success('屏幕共享已停止');
    } catch (error) {
      console.error('停止屏幕共享失败:', error);
      ElMessage.error('停止屏幕共享失败');
    }
  };
  
  /**
   * 开始会议计时
   */
  const startConferenceTimer = () => {
    conferenceTimer = setInterval(() => {
      conferenceDuration.value++;
    }, 1000);
  };
  
  /**
   * 停止会议计时
   */
  const stopConferenceTimer = () => {
    if (conferenceTimer) {
      clearInterval(conferenceTimer);
      conferenceTimer = null;
    }
  };
  
  /**
   * 创建Offer
   */
  const createOffer = async (targetUserId: string) => {
    const participant = participants.get(targetUserId);
    if (!participant?.peerConnection) return;
    
    try {
      const offer = await participant.peerConnection.createOffer();
      await participant.peerConnection.setLocalDescription(offer);
      
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
  const handleUserJoined = (data: any) => {
    console.log('用户加入会议:', data);
    addParticipant(data.userId, data.userInfo);
  };
  
  const handleUserLeft = (data: any) => {
    console.log('用户离开会议:', data);
    removeParticipant(data.userId);
  };
  
  const handleOffer = async (data: any) => {
    const participant = participants.get(data.fromUserId);
    if (!participant?.peerConnection) {
      // 如果参与者不存在，先添加
      addParticipant(data.fromUserId, data.userInfo);
    }
    
    const pc = participants.get(data.fromUserId)?.peerConnection;
    if (!pc) return;
    
    try {
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket?.emit('answer', {
        roomId: currentRoom.value?.roomId,
        targetUserId: data.fromUserId,
        answer: answer
      });
    } catch (error) {
      console.error('处理Offer失败:', error);
    }
  };
  
  const handleAnswer = async (data: any) => {
    const participant = participants.get(data.fromUserId);
    if (!participant?.peerConnection) return;
    
    try {
      await participant.peerConnection.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('处理Answer失败:', error);
    }
  };
  
  const handleIceCandidate = async (data: any) => {
    const participant = participants.get(data.fromUserId);
    if (!participant?.peerConnection) return;
    
    try {
      await participant.peerConnection.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('处理ICE候选失败:', error);
    }
  };
  
  const handleAudioToggle = (data: any) => {
    const participant = participants.get(data.userId);
    if (participant) {
      participant.audioEnabled = data.enabled;
    }
  };
  
  const handleVideoToggle = (data: any) => {
    const participant = participants.get(data.userId);
    if (participant) {
      participant.videoEnabled = data.enabled;
    }
  };
  
  const handleScreenShareStart = (data: any) => {
    console.log('用户开始屏幕共享:', data.userId);
    // 可以在UI中显示屏幕共享状态
  };
  
  const handleScreenShareStop = (data: any) => {
    console.log('用户停止屏幕共享:', data.userId);
    // 可以在UI中隐藏屏幕共享状态
  };
  
  const handleConferenceEnded = () => {
    leaveConference();
  };
  
  // 组件卸载时清理资源
  onUnmounted(() => {
    if (inConference.value) {
      leaveConference();
    }
  });
  
  return {
    // 状态
    inConference,
    isConnecting,
    conferenceDuration,
    audioEnabled,
    videoEnabled,
    screenSharing,
    currentRoom,
    currentUser,
    participants: participantList,
    participantCount,
    
    // 方法
    setVideoRef,
    joinConference,
    leaveConference,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  };
}