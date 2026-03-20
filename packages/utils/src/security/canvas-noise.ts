/**
 * Canvas 噪点生成器 - 防止 OCR 识别
 * 
 * 功能：
 * 1. 在文本周围添加随机噪点
 * 2. 添加干扰线条
 * 3. 颜色扰动
 * 4. 字符轻微变形
 */

export interface NoiseOptions {
  // 噪点密度 (0-1)
  noiseDensity?: number;
  // 噪点颜色
  noiseColor?: string;
  // 噪点大小
  noiseSize?: number;
  // 干扰线数量
  lineCount?: number;
  // 干扰线颜色
  lineColor?: string;
  // 颜色扰动强度 (0-255)
  colorDistortion?: number;
  // 字符扰动强度 (0-1)
  charDistortion?: number;
}

const DEFAULT_OPTIONS: Required<NoiseOptions> = {
  noiseDensity: 0.05,
  noiseColor: 'rgba(0, 0, 0, 0.1)',
  noiseSize: 1,
  lineCount: 3,
  lineColor: 'rgba(0, 0, 0, 0.05)',
  colorDistortion: 10,
  charDistortion: 0.1,
};

/**
 * 在 Canvas 上添加噪点
 */
export function addCanvasNoise(
  canvas: HTMLCanvasElement,
  options: NoiseOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 添加像素噪点
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < opts.noiseDensity) {
      const noise = Math.random() * opts.colorDistortion;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // 添加干扰线
  for (let i = 0; i < opts.lineCount; i++) {
    ctx.strokeStyle = opts.lineColor;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // 添加随机噪点
  ctx.fillStyle = opts.noiseColor;
  const noiseCount = width * height * opts.noiseDensity;
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, opts.noiseSize, opts.noiseSize);
  }
}

/**
 * 将文本渲染到 Canvas 并添加噪点
 */
export function renderTextWithNoise(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: number;
    noise?: NoiseOptions;
  } = {}
): HTMLCanvasElement {
  const {
    fontSize = 16,
    fontFamily = 'Arial, sans-serif',
    color = '#000000',
    backgroundColor = '#ffffff',
    padding = 10,
    noise = {},
  } = options;

  // 创建临时 canvas 测量文本
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = `${fontSize}px ${fontFamily}`;
  const metrics = tempCtx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2; // 估算高度

  // 创建实际 canvas
  const canvas = document.createElement('canvas');
  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;
  const ctx = canvas.getContext('2d')!;

  // 绘制背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制文本
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.fillText(text, padding, padding);

  // 添加噪点
  addCanvasNoise(canvas, noise);

  return canvas;
}

/**
 * 创建带噪点的文本图片 (Data URL)
 */
export function createNoisyTextImage(
  text: string,
  options?: Parameters<typeof renderTextWithNoise>[1]
): string {
  const canvas = renderTextWithNoise(text, options);
  return canvas.toDataURL('image/png');
}

/**
 * 创建带噪点的文本 Blob
 */
export async function createNoisyTextBlob(
  text: string,
  options?: Parameters<typeof renderTextWithNoise>[1]
): Promise<Blob> {
  const canvas = renderTextWithNoise(text, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
}

/**
 * 为 DOM 元素添加噪点背景
 */
export function addNoiseBackground(
  element: HTMLElement,
  options: NoiseOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height } = element.getBoundingClientRect();
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 创建噪点背景
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);
  addCanvasNoise(canvas, opts);

  // 设置为背景
  const dataUrl = canvas.toDataURL('image/png');
  element.style.backgroundImage = `url(${dataUrl})`;
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundSize = 'cover';
}

/**
 * 生成噪点纹理 (可重复使用)
 */
export function generateNoiseTexture(
  width: number = 100,
  height: number = 100,
  options: NoiseOptions = {}
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);
  addCanvasNoise(canvas, options);

  return canvas.toDataURL('image/png');
}
