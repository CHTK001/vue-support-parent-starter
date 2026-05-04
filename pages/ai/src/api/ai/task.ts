import { http, type ReturnResult } from "@repo/utils";

export type AiTaskType =
  | "IMAGE"
  | "VIDEO"
  | "FACE"
  | "FACE_DETECT"
  | "COLORIZATION"
  | "RESOLUTION"
  | "MATTING";

export interface AiTask {
  sysAiTaskId: number;
  sysAiTaskType: AiTaskType | string;
  sysAiModuleCode?: string;
  sysAiTaskPrompt?: string;
  sysAiTaskRequest?: string;
  sysAiTaskResult?: string;
  sysAiTaskStatus?: string;
  sysUserId?: string;
  createTime?: string;
}

export interface AiTaskRequest {
  sysAiModuleCode: string;
  prompt: string;
  sourceUrl?: string;
  sourceContent?: string;
  negativePrompt?: string;
}

const pathMap: Record<AiTaskType, string> = {
  IMAGE: "/v2/ai/image/task",
  VIDEO: "/v2/ai/video/task",
  FACE: "/v2/ai/face/detect",
  FACE_DETECT: "/v2/ai/face-detect/task",
  COLORIZATION: "/v2/ai/colorization/task",
  RESOLUTION: "/v2/ai/resolution/task",
  MATTING: "/v2/ai/matting/task",
};

export const createAiTask = async (taskType: AiTaskType, data: AiTaskRequest) => {
  return http.request<ReturnResult<AiTask>>("post", pathMap[taskType], {
    data,
    headers: {
      "x-remote-animation": "false",
    },
  });
};

export const getAiTask = async (taskId: number) => {
  return http.request<ReturnResult<AiTask>>("get", `/v2/ai/task/${taskId}`, {
    headers:{
      "x-remote-animation": "false"
    }

  });
};

export const listAiTaskHistory = async (taskType?: AiTaskType | string) => {
  return http.request<ReturnResult<AiTask[]>>("get", "/v2/ai/task/history", {
    params: { taskType },
    headers: {
      "x-remote-animation": "false",
    },
  });
};
