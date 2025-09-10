/**
 * WebRTC Socket.IO客户端服务
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
// import { io, Socket } from 'socket.io-client';

// Socket连接状态
export enum SocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Socket事件类型
export interface SocketEvents {
  // 房间相关事件
  'join-room': (data: { roomId: string; userId: string; userInfo: any }) => void;
  'leave-room': (data: { roomId: string; userId: string }) => void;
  'room-created': (data: { roomId: string; roomInfo: any }) => void;
  'room-destroyed': (data: { roomId: string }) => void;
  'user-joined': (data: { roomId: string; userId: string; userInfo: any }) => void;
  'user-left': (data: { roomId: string; userId: string }) => void;
  
  // WebRTC信令事件
  'offer': (data: { roomId: string; fromUserId: string; targetUserId: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { roomId: string; fromUserId: string; targetUserId: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { roomId: string; fromUserId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => void;
  
  // 媒体控制事件
  'audio-toggle': (data: { roomId: string; userId: string; enabled: boolean }) => void;
  'video-toggle': (data: { roomId: string; userId: string; enabled: boolean }) => void;
  'screen-share-start': (data: { roomId: string; userId: string }) => void;
  'screen-share-stop': (data: { roomId: string; userId: string }) => void;
  
  // 通话相关事件
  'call-request': (data: { fromUserId: string; toUserId: string; roomId: string; callType: 'video' | 'audio' }) => void;
  'call-accept': (data: { roomId: string; userId: string }) => void;
  'call-reject': (data: { roomId: string; userId: string; reason?: string }) => void;
  'call-end': (data: { roomId: string; userId: string }) => void;
  
  // 会议相关事件
  'join-conference': (data: { roomId: string; userId: string; userInfo: any }) => void;
  'leave-conference': (data: { roomId: string; userId: string }) => void;
  'conference-ended': (data: { roomId: string }) => void;
  
  // 屏幕共享相关事件
  'start-screen-share': (data: { roomId: string; userId: string; userInfo: any }) => void;
  'stop-screen-share': (data: { roomId: string; userId: string }) => void;
  'join-screen-share': (data: { roomId: string; userId: string; userInfo: any }) => void;
  'leave-screen-share': (data: { roomId: string; userId: string }) => void;
  
  // 系统事件
  'error': (data: { code: string; message: string; details?: any }) => void;
  'notification': (data: { type: 'info' | 'warning' | 'error' | 'success'; message: string }) => void;
}

// Socket配置
interface SocketConfig {
  url: string;
  options?: {
    transports?: string[];
    timeout?: number;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    autoConnect?: boolean;
  };
}

// 默认配置
const defaultConfig: SocketConfig = {
  url: process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : window.location.origin,
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false
  }
};

/**
 * WebRTC Socket服务类
 */
class WebRTCSocketService {
  private socket: any = null; // Socket实例
  private config: SocketConfig;
  private eventHandlers: Map<string, Function[]> = new Map();
  
  // 响应式状态
  public status = ref<SocketStatus>(SocketStatus.DISCONNECTED);
  public connectedUsers = reactive<Map<string, any>>(new Map());
  public currentRoom = ref<string | null>(null);
  public currentUser = ref<any>(null);
  
  constructor(config?: Partial<SocketConfig>) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * 连接Socket服务器
   */
  async connect(userInfo?: any): Promise<void> {
    if (this.socket?.connected) {
      console.warn('Socket已连接');
      return;
    }
    
    try {
      this.status.value = SocketStatus.CONNECTING;
      
      // TODO: 实际项目中需要导入Socket.IO客户端
      // this.socket = io(this.config.url, this.config.options);
      
      // 模拟Socket连接
      this.socket = this.createMockSocket();
      
      if (userInfo) {
        this.currentUser.value = userInfo;
      }
      
      this.setupEventHandlers();
      
      // 模拟连接成功
      setTimeout(() => {
        this.status.value = SocketStatus.CONNECTED;
        this.emit('user-online', { userInfo: this.currentUser.value });
        ElMessage.success('WebRTC服务连接成功');
      }, 1000);
      
    } catch (error) {
      console.error('Socket连接失败:', error);
      this.status.value = SocketStatus.ERROR;
      ElMessage.error('WebRTC服务连接失败');
      throw error;
    }
  }
  
  /**
   * 断开Socket连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.status.value = SocketStatus.DISCONNECTED;
    this.connectedUsers.clear();
    this.currentRoom.value = null;
    this.eventHandlers.clear();
  }
  
  /**
   * 发送事件
   */
  emit<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0]): void {
    if (!this.socket) {
      console.warn('Socket未连接，无法发送事件:', event);
      return;
    }
    
    console.log('Socket emit:', event, data);
    this.socket.emit(event, data);
  }
  
  /**
   * 监听事件
   */
  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(handler);
    
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }
  
  /**
   * 移除事件监听
   */
  off<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      
      if (this.socket) {
        this.socket.off(event, handler);
      }
    } else {
      this.eventHandlers.delete(event);
      
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }
  
  /**
   * 加入房间
   */
  joinRoom(roomId: string, userInfo?: any): void {
    this.currentRoom.value = roomId;
    this.emit('join-room', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous',
      userInfo: userInfo || this.currentUser.value
    });
  }
  
  /**
   * 离开房间
   */
  leaveRoom(roomId?: string): void {
    const targetRoomId = roomId || this.currentRoom.value;
    if (targetRoomId) {
      this.emit('leave-room', {
        roomId: targetRoomId,
        userId: this.currentUser.value?.userId || 'anonymous'
      });
      
      if (targetRoomId === this.currentRoom.value) {
        this.currentRoom.value = null;
      }
    }
  }
  
  /**
   * 发送WebRTC Offer
   */
  sendOffer(roomId: string, targetUserId: string, offer: RTCSessionDescriptionInit): void {
    this.emit('offer', {
      roomId,
      fromUserId: this.currentUser.value?.userId || 'anonymous',
      targetUserId,
      offer
    });
  }
  
  /**
   * 发送WebRTC Answer
   */
  sendAnswer(roomId: string, targetUserId: string, answer: RTCSessionDescriptionInit): void {
    this.emit('answer', {
      roomId,
      fromUserId: this.currentUser.value?.userId || 'anonymous',
      targetUserId,
      answer
    });
  }
  
  /**
   * 发送ICE候选
   */
  sendIceCandidate(roomId: string, targetUserId: string, candidate: RTCIceCandidateInit): void {
    this.emit('ice-candidate', {
      roomId,
      fromUserId: this.currentUser.value?.userId || 'anonymous',
      targetUserId,
      candidate
    });
  }
  
  /**
   * 发起通话请求
   */
  requestCall(toUserId: string, roomId: string, callType: 'video' | 'audio' = 'video'): void {
    this.emit('call-request', {
      fromUserId: this.currentUser.value?.userId || 'anonymous',
      toUserId,
      roomId,
      callType
    });
  }
  
  /**
   * 接受通话
   */
  acceptCall(roomId: string): void {
    this.emit('call-accept', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous'
    });
  }
  
  /**
   * 拒绝通话
   */
  rejectCall(roomId: string, reason?: string): void {
    this.emit('call-reject', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous',
      reason
    });
  }
  
  /**
   * 结束通话
   */
  endCall(roomId: string): void {
    this.emit('call-end', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous'
    });
  }
  
  /**
   * 切换音频状态
   */
  toggleAudio(roomId: string, enabled: boolean): void {
    this.emit('audio-toggle', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous',
      enabled
    });
  }
  
  /**
   * 切换视频状态
   */
  toggleVideo(roomId: string, enabled: boolean): void {
    this.emit('video-toggle', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous',
      enabled
    });
  }
  
  /**
   * 开始屏幕共享
   */
  startScreenShare(roomId: string): void {
    this.emit('screen-share-start', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous'
    });
  }
  
  /**
   * 停止屏幕共享
   */
  stopScreenShare(roomId: string): void {
    this.emit('screen-share-stop', {
      roomId,
      userId: this.currentUser.value?.userId || 'anonymous'
    });
  }
  
  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    // 连接状态事件
    this.socket.on('connect', () => {
      console.log('Socket连接成功');
      this.status.value = SocketStatus.CONNECTED;
    });
    
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket断开连接:', reason);
      this.status.value = SocketStatus.DISCONNECTED;
      this.connectedUsers.clear();
    });
    
    this.socket.on('reconnect', () => {
      console.log('Socket重连成功');
      this.status.value = SocketStatus.CONNECTED;
    });
    
    this.socket.on('reconnecting', () => {
      console.log('Socket重连中...');
      this.status.value = SocketStatus.RECONNECTING;
    });
    
    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket连接错误:', error);
      this.status.value = SocketStatus.ERROR;
    });
    
    // 用户相关事件
    this.socket.on('user-joined', (data: any) => {
      console.log('用户加入:', data);
      this.connectedUsers.set(data.userId, data.userInfo);
    });
    
    this.socket.on('user-left', (data: any) => {
      console.log('用户离开:', data);
      this.connectedUsers.delete(data.userId);
    });
    
    // 错误处理
    this.socket.on('error', (data: any) => {
      console.error('Socket错误:', data);
      ElMessage.error(data.message || '发生未知错误');
    });
    
    // 通知处理
    this.socket.on('notification', (data: any) => {
      console.log('收到通知:', data);
      switch (data.type) {
        case 'success':
          ElMessage.success(data.message);
          break;
        case 'warning':
          ElMessage.warning(data.message);
          break;
        case 'error':
          ElMessage.error(data.message);
          break;
        default:
          ElMessage.info(data.message);
      }
    });
    
    // 重新注册所有事件处理器
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket.on(event, handler);
      });
    });
  }
  
  /**
   * 创建模拟Socket（用于开发测试）
   */
  private createMockSocket() {
    const eventHandlers: Map<string, Function[]> = new Map();
    
    return {
      connected: true,
      
      emit: (event: string, data: any) => {
        console.log('Mock Socket emit:', event, data);
        
        // 模拟一些响应
        setTimeout(() => {
          switch (event) {
            case 'join-room':
              this.triggerMockEvent('user-joined', data);
              break;
            case 'leave-room':
              this.triggerMockEvent('user-left', data);
              break;
          }
        }, 100);
      },
      
      on: (event: string, handler: Function) => {
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, []);
        }
        eventHandlers.get(event)!.push(handler);
      },
      
      off: (event: string, handler?: Function) => {
        if (handler) {
          const handlers = eventHandlers.get(event);
          if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
              handlers.splice(index, 1);
            }
          }
        } else {
          eventHandlers.delete(event);
        }
      },
      
      disconnect: () => {
        console.log('Mock Socket disconnected');
        eventHandlers.clear();
      },
      
      // 内部方法，用于触发模拟事件
      _triggerEvent: (event: string, data: any) => {
        const handlers = eventHandlers.get(event);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      }
    };
  }
  
  /**
   * 触发模拟事件
   */
  private triggerMockEvent(event: string, data: any): void {
    if (this.socket && this.socket._triggerEvent) {
      this.socket._triggerEvent(event, data);
    }
  }
}

// 创建全局Socket服务实例
export const webrtcSocket = new WebRTCSocketService();

// 导出服务类
export { WebRTCSocketService };

// 导出类型
export type { SocketConfig, SocketEvents };