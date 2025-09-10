/**
 * WebRTC服务统一导出
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

// Socket服务
export { webrtcSocket, WebRTCSocketService } from './socket';
export type { SocketConfig, SocketEvents, SocketStatus } from './socket';

// 类型定义
export interface WebRTCService {
  socket: typeof webrtcSocket;
}

// 创建WebRTC服务实例
export const webrtcService: WebRTCService = {
  socket: webrtcSocket
};

// 默认导出
export default webrtcService;