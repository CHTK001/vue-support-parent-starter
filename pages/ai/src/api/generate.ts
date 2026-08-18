/** AI 生成接口（图像/视频生成 + 异步任务） */
import { get, post, put } from './request';
import { uploadFile } from './upload';

/** 图像生成请求 */
export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  /** 附加参数透传给底层生成器 */
  [key: string]: unknown;
}

/** 视频生成请求 */
export interface VideoGenRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  /** 附加参数透传给底层生成器 */
  [key: string]: unknown;
}

/** 同步生成结果 */
export interface GenerateResult {
  image?: string;
  video?: string;
  url?: string;
  /** 其他字段透传 */
  [key: string]: unknown;
}

/** 异步生成任务 */
export interface GenerateTask {
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  progress?: number;
  result?: GenerateResult;
  errorMessage?: string;
  startTime?: number;
  endTime?: number;
}

export const generateApi = {
  /** 同步图像生成 */
  image: (request: ImageGenRequest) =>
    post<GenerateResult>('/v2/generate/image', request),
  /** 同步视频生成 */
  video: (request: VideoGenRequest) =>
    post<GenerateResult>('/v2/generate/video', request),
  /** 异步图像生成（创建任务） */
  createImageTask: (request: ImageGenRequest) =>
    post<GenerateTask>('/v2/generate/task/image', request),
  /** 异步视频生成（创建任务） */
  createVideoTask: (request: VideoGenRequest) =>
    post<GenerateTask>('/v2/generate/task/video', request),
  /** 查询任务状态 */
  getTask: (taskId: string) => get<GenerateTask>(`/v2/generate/task/${taskId}`),
  /** 任务列表 */
  listTasks: () => get<GenerateTask[]>('/v2/generate/task/list'),
  /** 图片上色（老照片 → 彩色） */
  colorize: (file: File) => uploadFile<GenerateResult>('/v2/generate/colorize', file),
};
