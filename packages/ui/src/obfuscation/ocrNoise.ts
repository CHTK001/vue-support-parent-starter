/**
 * OCR 噪点渲染（secure-render-text 封装）
 *
 * 基于三方库 secure-render-text 在 canvas 上渲染"人眼可读、摄像头/OCR 难识别"的文本：
 *  - 时间分片（fps 高频重绘，摄像头采样捕获不完整字形）
 *  - 图案干扰（stripe / diagonal / crosshatch）
 *  - 可选扭曲（distortion）制造动态视觉不稳定
 *
 * 封装目标：
 *  - 简化 API：组件内一行调用
 *  - 生命周期管理：组件卸载时自动 stop
 *  - 类型友好
 */
import SecureRender from "secure-render-text";

/** OCR 噪点配置（透传 secure-render-text 的 RenderOptions） */
export interface OcrNoiseOptions {
  /** 刷新帧率 1-120，越高干扰越强，默认 60 */
  fps?: number;
  /** 干扰图案 stripe / diagonal / crosshatch，默认 stripe */
  pattern?: "stripe" | "diagonal" | "crosshatch";
  /** 是否开启扭曲，默认 false */
  distortion?: boolean;
}

/**
 * 在 canvas 上渲染防 OCR 文本
 *
 * @param canvas 目标 canvas 元素（组件 ref 传入）
 * @param text 需要保护的文本
 * @param options OCR 噪点配置
 * @returns 停止渲染的函数（组件卸载时调用）
 */
export function renderSecureText(
  canvas: HTMLCanvasElement | null | undefined,
  text: string,
  options: OcrNoiseOptions = {},
): () => void {
  if (!canvas || !text) return () => undefined;

  SecureRender.render({
    element: canvas,
    text,
    fps: options.fps ?? 60,
    pattern: options.pattern ?? "stripe",
    distortion: options.distortion ?? false,
  });

  return () => SecureRender.stop();
}

/**
 * Vue 组合式封装：在组件中安全使用
 *
 * 用法：
 *   const { bind, stop } = useOcrNoise();
 *   // template: <canvas ref="bind" />
 *   // 设置文本后调用 render("需要保护的文本")
 */
export function useOcrNoise() {
  let canvasRef: HTMLCanvasElement | null = null;
  let stopFn: (() => void) | undefined;

  const bind = (el: unknown): void => {
    canvasRef = el as HTMLCanvasElement | null;
  };

  const render = (text: string, options: OcrNoiseOptions = {}): void => {
    stop();
    stopFn = renderSecureText(canvasRef, text, options);
  };

  const stop = (): void => {
    stopFn?.();
    stopFn = undefined;
  };

  return { bind, render, stop };
}
