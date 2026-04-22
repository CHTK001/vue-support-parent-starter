import { beforeEach, describe, expect, it } from "vitest";
import { clearTaskCenter, getTaskCenterTask } from "../service";
import {
  resetWebLlmDownloadState,
  updateWebLlmProgress,
  WEB_LLM_DOWNLOAD_TASK_ID,
  webLlmDownloadState,
} from "../../lay-ai-chat/services/webLlmDownloadState";

describe("task center webllm bridge", () => {
  beforeEach(() => {
    clearTaskCenter();
    resetWebLlmDownloadState();
  });

  it("maps webllm download progress into task center tasks", () => {
    updateWebLlmProgress({
      text: "Downloading qwen-2.5-1.5b.bin",
      progress: 0.35,
    });

    expect(webLlmDownloadState.downloading).toBe(true);
    expect(webLlmDownloadState.progress).toBe(35);

    const task = getTaskCenterTask(WEB_LLM_DOWNLOAD_TASK_ID);
    expect(task).toMatchObject({
      id: WEB_LLM_DOWNLOAD_TASK_ID,
      title: "AI 模型下载",
      status: "running",
      progress: 35,
      position: "top-right",
    });
    expect(task?.latestMessage).toContain("Downloading");
  });

  it("marks the webllm task as complete when download state resets", () => {
    updateWebLlmProgress({
      text: "Downloading qwen-2.5-1.5b.bin",
      progress: 0.72,
    });

    resetWebLlmDownloadState();

    const task = getTaskCenterTask(WEB_LLM_DOWNLOAD_TASK_ID);
    expect(webLlmDownloadState.downloading).toBe(false);
    expect(task).toMatchObject({
      id: WEB_LLM_DOWNLOAD_TASK_ID,
      status: "success",
      progress: 100,
    });
    expect(task?.latestMessage).toBe("模型已就绪");
  });
});
