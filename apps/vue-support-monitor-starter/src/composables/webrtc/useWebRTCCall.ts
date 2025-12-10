/**
 * WebRTC视频通话组合式函数
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, onUnmounted } from 'vue';
import { message } from "@repo/utils";
import { joinRoom, leaveRoom, type RoomInfo, type WebRTCUser } from '@/api/webrtc';

// WebRTC配置
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTCCall() {
  // 状态管理
  const inCall = ref(false);
  const isConnecting = ref(false);
  const callDuration = ref(0);
  const audioEnabled = ref(true);
  const videoEnabled = ref(true);
  const currentRoom = ref<RoomInfo | null>(null);
  const currentUser = ref<WebRTCUser | null>(null);
  const remoteUser = ref<WebRTCUser | null>(null);
  
  // WebRTC对象
  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;
  let peerConnection: RTCPeerConnection | null = null;
  let socket: any = null; // Socket.IO实例
  
  // 视频元素引用映射
  const videoRefs = reactive<Record<string, HTMLVideoElement>>({});
  
  // 通话计时器
  let callTimer: NodeJS.Timeout | null = null;
  
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
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 设置本地视频
      const localVideo = videoRefs[currentUser.value?.userId || 'local'];
      if (localVideo && localStream) {
        localVideo.srcObject = localStream;
      }
      
      return localStream;
    } catch (error) {
      console.error('获取本地媒体流失败:', error);
      throw new Error('无法访问摄像头或麦克风');
    }
  };
  
  /**
   * 初始化WebRTC连接
   */
  const initPeerConnection = () => {
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId: currentRoom.value?.roomId,
          candidate: event.candidate
        });
      }
    };
    
    // 处理远程流
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      const remoteVideo = videoRefs[remoteUser.value?.userId || 'remote'];
      if (remoteVideo && remoteStream) {
        remoteVideo.srcObject = remoteStream;
      }
    };
    
    // 处理连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log('连接状态:', peerConnection?.connectionState);
      if (peerConnection?.connectionState === 'connected') {
        startCallTimer();
      } else if (peerConnection?.connectionState === 'disconnected' || 
                 peerConnection?.connectionState === 'failed') {
        endCall();
      }
    };
    
    // 添加本地流到连接
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream!);
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
    socket.on('call-ended', handleCallEnded);
    
    return socket;
  };
  
  /**
   * 发起通话
   */
  const startCall = async (targetUserId: string, roomId?: string) => {
    try {
      isConnecting.value = true;
      
      // 初始化本地媒体流
      await initLocalStream();
      
      // 创建或加入房间
      let room: RoomInfo;
      if (roomId) {
        const { data } = await joinRoom(roomId);
        room = data;
      } else {
        // 创建新房间用于通话
        const { data } = await joinRoom('temp-' + Date.now());
        room = data;
      }
      
      currentRoom.value = room;
      
      // 初始化WebRTC连接
      initPeerConnection();
      
      // 初始化Socket连接
      initSocket();
      
      // 加入房间
      socket.emit('join-room', {
        roomId: room.roomId,
        userId: currentUser.value?.userId,
        userInfo: currentUser.value
      });
      
      inCall.value = true;
      message('通话已开始', { type: "success" });
    } catch (error) {
      console.error('发起通话失败:', error);
      message('发起通话失败', { type: "error" });
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };
  
  /**
   * 接听通话
   */
  const answerCall = async (roomId: string) => {
    try {
      isConnecting.value = true;
      
      // 初始化本地媒体流
      await initLocalStream();
      
      // 加入房间
      const { data } = await joinRoom(roomId);
      currentRoom.value = data;
      
      // 初始化WebRTC连接
      initPeerConnection();
      
      // 初始化Socket连接
      initSocket();
      
      // 加入房间
      socket.emit('join-room', {
        roomId: roomId,
        userId: currentUser.value?.userId,
        userInfo: currentUser.value
      });
      
      inCall.value = true;
      message('已接听通话', { type: "success" });
    } catch (error) {
      console.error('接听通话失败:', error);
      message('接听通话失败', { type: "error" });
      throw error;
    } finally {
      isConnecting.value = false;
    }
  };
  
  /**
   * 结束通话
   */
  const endCall = async () => {
    try {
      // 停止计时器
      stopCallTimer();
      
      // 关闭媒体流
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
      
      // 关闭WebRTC连接
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      
      // 离开房间
      if (currentRoom.value) {
        await leaveRoom(currentRoom.value.roomId);
        socket?.emit('leave-room', {
          roomId: currentRoom.value.roomId,
          userId: currentUser.value?.userId
        });
      }
      
      // 断开Socket连接
      socket?.disconnect();
      socket = null;
      
      // 重置状态
      inCall.value = false;
      isConnecting.value = false;
      callDuration.value = 0;
      currentRoom.value = null;
      remoteUser.value = null;
      
      message('通话已结束', { type: "success" });
    } catch (error) {
      console.error('结束通话失败:', error);
      message('结束通话失败', { type: "error" });
    }
  };
  
  /**
   * 切换音频
   */
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        audioEnabled.value = audioTrack.enabled;
        
        // 通知对方音频状态变化
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
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        videoEnabled.value = videoTrack.enabled;
        
        // 通知对方视频状态变化
        socket?.emit('video-toggle', {
          roomId: currentRoom.value?.roomId,
          userId: currentUser.value?.userId,
          enabled: videoEnabled.value
        });
      }
    }
  };
  
  /**
   * 开始通话计时
   */
  const startCallTimer = () => {
    callTimer = setInterval(() => {
      callDuration.value++;
    }, 1000);
  };
  
  /**
   * 停止通话计时
   */
  const stopCallTimer = () => {
    if (callTimer) {
      clearInterval(callTimer);
      callTimer = null;
    }
  };
  
  /**
   * 处理用户加入
   */
  const handleUserJoined = (data: any) => {
    console.log('用户加入:', data);
    remoteUser.value = data.userInfo;
    
    // 如果是发起方，创建offer
    if (peerConnection && data.userId !== currentUser.value?.userId) {
      createOffer();
    }
  };
  
  /**
   * 处理用户离开
   */
  const handleUserLeft = (data: any) => {
    console.log('用户离开:', data);
    if (data.userId === remoteUser.value?.userId) {
      endCall();
    }
  };
  
  /**
   * 创建Offer
   */
  const createOffer = async () => {
    if (!peerConnection) return;
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket?.emit('offer', {
        roomId: currentRoom.value?.roomId,
        offer: offer
      });
    } catch (error) {
      console.error('创建Offer失败:', error);
    }
  };
  
  /**
   * 处理Offer
   */
  const handleOffer = async (data: any) => {
    if (!peerConnection) return;
    
    try {
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket?.emit('answer', {
        roomId: currentRoom.value?.roomId,
        answer: answer
      });
    } catch (error) {
      console.error('处理Offer失败:', error);
    }
  };
  
  /**
   * 处理Answer
   */
  const handleAnswer = async (data: any) => {
    if (!peerConnection) return;
    
    try {
      await peerConnection.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('处理Answer失败:', error);
    }
  };
  
  /**
   * 处理ICE候选
   */
  const handleIceCandidate = async (data: any) => {
    if (!peerConnection) return;
    
    try {
      await peerConnection.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('处理ICE候选失败:', error);
    }
  };
  
  /**
   * 处理通话结束
   */
  const handleCallEnded = () => {
    endCall();
  };
  
  // 组件卸载时清理资源
  onUnmounted(() => {
    if (inCall.value) {
      endCall();
    }
  });
  
  return {
    // 状态
    inCall,
    isConnecting,
    callDuration,
    audioEnabled,
    videoEnabled,
    currentRoom,
    currentUser,
    remoteUser,
    
    // 方法
    setVideoRef,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
}