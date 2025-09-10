/**
 * WebRTC 配置管理 API
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { http } from "@repo/utils";

/**
 * WebRTC配置接口
 */
export interface WebRTCConfig {
  /** ICE服务器配置 */
  iceServers: {
    /** 服务器URL */
    urls: string[];
    /** 用户名（TURN服务器） */
    username?: string;
    /** 密码（TURN服务器） */
    credential?: string;
  }[];
  /** 媒体约束配置 */
  mediaConstraints: {
    /** 视频约束 */
    video: {
      /** 是否启用 */
      enabled: boolean;
      /** 宽度 */
      width: { min: number; ideal: number; max: number };
      /** 高度 */
      height: { min: number; ideal: number; max: number };
      /** 帧率 */
      frameRate: { min: number; ideal: number; max: number };
      /** 码率（kbps） */
      bitrate: { min: number; ideal: number; max: number };
    };
    /** 音频约束 */
    audio: {
      /** 是否启用 */
      enabled: boolean;
      /** 回声消除 */
      echoCancellation: boolean;
      /** 噪声抑制 */
      noiseSuppression: boolean;
      /** 自动增益控制 */
      autoGainControl: boolean;
      /** 采样率 */
      sampleRate: number;
      /** 码率（kbps） */
      bitrate: { min: number; ideal: number; max: number };
    };
  };
  /** 房间配置 */
  roomConfig: {
    /** 默认最大用户数 */
    defaultMaxUsers: number;
    /** 房间超时时间（分钟） */
    roomTimeout: number;
    /** 是否允许匿名用户 */
    allowAnonymous: boolean;
    /** 是否需要审核 */
    requireApproval: boolean;
    /** 默认房间类型 */
    defaultRoomType: 'video_call' | 'video_conference';
  };
  /** 安全配置 */
  securityConfig: {
    /** 是否启用DTLS */
    enableDTLS: boolean;
    /** 是否启用SRTP */
    enableSRTP: boolean;
    /** 最大连接数限制 */
    maxConnections: number;
    /** 连接超时时间（秒） */
    connectionTimeout: number;
    /** 是否记录日志 */
    enableLogging: boolean;
  };
  /** 性能配置 */
  performanceConfig: {
    /** 是否启用硬件加速 */
    enableHardwareAcceleration: boolean;
    /** 最大带宽（Mbps） */
    maxBandwidth: number;
    /** 自适应码率 */
    adaptiveBitrate: boolean;
    /** 网络质量检测间隔（秒） */
    networkQualityInterval: number;
  };
}

/**
 * 更新配置参数
 */
export interface UpdateConfigParams {
  /** 配置类型 */
  configType: 'ice' | 'media' | 'room' | 'security' | 'performance';
  /** 配置数据 */
  configData: any;
}

/**
 * 获取WebRTC配置
 * @returns WebRTC配置信息
 */
export const getWebRTCConfig = () => {
  return http.request<WebRTCConfig>('get', '/webrtc/config');
};

/**
 * 获取ICE服务器配置
 * @returns ICE服务器配置
 */
export const getIceServers = () => {
  return http.request<{
    iceServers: WebRTCConfig['iceServers'];
  }>('get', '/webrtc/config/ice-servers');
};

/**
 * 更新WebRTC配置
 * @param data 配置数据
 * @returns 更新结果
 */
export const updateWebRTCConfig = (data: UpdateConfigParams) => {
  return http.request<{
    success: boolean;
    message: string;
    config: WebRTCConfig;
  }>('put', '/webrtc/config', { data });
};

/**
 * 重置配置为默认值
 * @param configType 配置类型
 * @returns 重置结果
 */
export const resetConfig = (configType?: 'ice' | 'media' | 'room' | 'security' | 'performance') => {
  return http.request<{
    success: boolean;
    message: string;
    config: WebRTCConfig;
  }>('post', '/webrtc/config/reset', {
    data: { configType }
  });
};

/**
 * 测试ICE服务器连接
 * @param iceServer ICE服务器配置
 * @returns 测试结果
 */
export const testIceServer = (iceServer: WebRTCConfig['iceServers'][0]) => {
  return http.request<{
    success: boolean;
    message: string;
    latency?: number;
    error?: string;
  }>('post', '/webrtc/config/test-ice', { data: iceServer });
};

/**
 * 获取配置历史记录
 * @param params 查询参数
 * @returns 配置历史记录
 */
export const getConfigHistory = (params?: {
  page?: number;
  size?: number;
  configType?: string;
  startTime?: string;
  endTime?: string;
}) => {
  return http.request<{
    total: number;
    records: {
      id: string;
      configType: string;
      oldValue: any;
      newValue: any;
      operator: string;
      operateTime: string;
      description: string;
    }[];
  }>('get', '/webrtc/config/history', { params });
};

/**
 * 导出配置
 * @returns 配置导出结果
 */
export const exportConfig = () => {
  return http.request<{
    downloadUrl: string;
    fileName: string;
  }>('post', '/webrtc/config/export');
};

/**
 * 导入配置
 * @param configData 配置数据
 * @returns 导入结果
 */
export const importConfig = (configData: WebRTCConfig) => {
  return http.request<{
    success: boolean;
    message: string;
    importedItems: string[];
    errors?: string[];
  }>('post', '/webrtc/config/import', { data: configData });
};

/**
 * 验证配置
 * @param config 配置数据
 * @returns 验证结果
 */
export const validateConfig = (config: Partial<WebRTCConfig>) => {
  return http.request<{
    valid: boolean;
    errors: {
      field: string;
      message: string;
    }[];
    warnings: {
      field: string;
      message: string;
    }[];
  }>('post', '/webrtc/config/validate', { data: config });
};