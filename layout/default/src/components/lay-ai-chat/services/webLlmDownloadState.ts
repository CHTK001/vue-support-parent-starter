/**
 * WebLLM 下载进度全局状态
 * 供布局右上角组件读取，显示文件名、进度、速度
 */
import { reactive } from "vue";

export interface WebLlmDownloadState {
  /** 是否正在下载 */
  downloading: boolean;
  /** 当前下载的文件名（从 progress.text 解析） */
  fileName: string;
  /** 下载进度 0-100 */
  progress: number;
  /** 下载速度描述（如 "1.2 MB/s"） */
  speed: string;
  /** 原始进度文本 */
  text: string;
}

export const webLlmDownloadState = reactive<WebLlmDownloadState>({
  downloading: false,
  fileName: "",
  progress: 0,
  speed: "",
  text: "",
});

/** 上次更新时间戳，用于计算速度 */
let lastProgressTime = 0;
let lastProgressValue = 0;

/**
 * 更新下载进度
 * @param progressObj WebLLM initProgressCallback 传入的 progress 对象
 */
export function updateWebLlmProgress(progressObj: {
  text?: string;
  progress?: number;
}) {
  const now = Date.now();
  const rawText = progressObj.text ?? "";
  const rawProgress = progressObj.progress ?? 0;

  // 解析文件名：从 text 中提取，格式通常为 "Fetching xxx.bin [xx%]" 或 "Loading xxx"
  const fileMatch = rawText.match(/(?:Fetching|Loading|Downloading)\s+([^\s\[]+)/i);
  const fileName = fileMatch ? fileMatch[1] : rawText.slice(0, 40);

  // 计算速度（基于进度变化量 / 时间差，单位：%/s，仅作参考）
  let speed = "";
  if (lastProgressTime > 0 && now - lastProgressTime > 0) {
    const deltaProgress = rawProgress - lastProgressValue;
    const deltaTime = (now - lastProgressTime) / 1000;
    if (deltaProgress > 0 && deltaTime > 0) {
      const rate = deltaProgress / deltaTime;
      speed = rate >= 1 ? `${rate.toFixed(1)}%/s` : `${(rate * 100).toFixed(0)}‰/s`;
    }
  }
  lastProgressTime = now;
  lastProgressValue = rawProgress;

  webLlmDownloadState.downloading = rawProgress < 1;
  webLlmDownloadState.fileName = fileName;
  webLlmDownloadState.progress = Math.round(rawProgress * 100);
  webLlmDownloadState.speed = speed;
  webLlmDownloadState.text = rawText;
}

/** 重置下载状态（加载完成后调用） */
export function resetWebLlmDownloadState() {
  webLlmDownloadState.downloading = false;
  webLlmDownloadState.fileName = "";
  webLlmDownloadState.progress = 0;
  webLlmDownloadState.speed = "";
  webLlmDownloadState.text = "";
  lastProgressTime = 0;
  lastProgressValue = 0;
}
