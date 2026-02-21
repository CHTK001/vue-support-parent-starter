import { ref, onMounted, onUnmounted, type Ref } from "vue";

/**
 * 绘制元素配置
 */
export interface DrawElementConfig {
  /**
   * 元素类型
   */
  type: "rect" | "circle" | "line" | "text" | "image" | "custom";
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
  /**
   * 宽度（矩形、图片）
   */
  width?: number;
  /**
   * 高度（矩形、图片）
   */
  height?: number;
  /**
   * 半径（圆形）
   */
  radius?: number;
  /**
   * 结束 X 坐标（线条）
   */
  endX?: number;
  /**
   * 结束 Y 坐标（线条）
   */
  endY?: number;
  /**
   * 文本内容（文本）
   */
  text?: string;
  /**
   * 图片源（图片）
   */
  imageSrc?: string;
  /**
   * 填充颜色
   */
  fillStyle?: string;
  /**
   * 描边颜色
   */
  strokeStyle?: string;
  /**
   * 线宽
   */
  lineWidth?: number;
  /**
   * 字体（文本）
   */
  font?: string;
  /**
   * 文本对齐方式（文本）
   */
  textAlign?: CanvasTextAlign;
  /**
   * 文本基线（文本）
   */
  textBaseline?: CanvasTextBaseline;
  /**
   * 自定义绘制函数
   */
  customDraw?: (ctx: CanvasRenderingContext2D, element: DrawElementConfig) => void;
  /**
   * 其他自定义属性
   */
  [key: string]: any;
}

/**
 * 绘制配置
 */
export interface DrawConfig {
  /**
   * Canvas 宽度
   */
  width?: number;
  /**
   * Canvas 高度
   */
  height?: number;
  /**
   * 背景颜色
   */
  backgroundColor?: string;
  /**
   * 是否自动调整大小
   */
  autoResize?: boolean;
}

/**
 * 自定义绘制 composable
 */
export function useDraw(canvasRef: Ref<HTMLCanvasElement | null>, config?: DrawConfig) {
  const { width, height, backgroundColor, autoResize = true } = config || {};

  // 绘制元素列表
  const elements: Ref<DrawElementConfig[]> = ref([]);
  // Canvas 上下文
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  /**
   * 初始化 Canvas
   */
  const initCanvas = () => {
    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }

    ctx.value = canvas.getContext("2d");
    if (!ctx.value) {
      return;
    }

    // 设置 Canvas 尺寸
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
    } else if (autoResize) {
      canvas.width = canvas.offsetWidth || 800;
      canvas.height = canvas.offsetHeight || 600;
    }

    // 设置背景
    if (backgroundColor) {
      ctx.value.fillStyle = backgroundColor;
      ctx.value.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 初始绘制
    draw();
  };

  /**
   * 绘制单个元素
   */
  const drawElement = (element: DrawElementConfig) => {
    if (!ctx.value) {
      return;
    }

    const { type, x, y, fillStyle, strokeStyle, lineWidth = 1 } = element;

    // 保存上下文状态
    ctx.value.save();

    // 设置样式
    if (fillStyle) {
      ctx.value.fillStyle = fillStyle;
    }
    if (strokeStyle) {
      ctx.value.strokeStyle = strokeStyle;
    }
    ctx.value.lineWidth = lineWidth;

    // 根据类型绘制
    switch (type) {
      case "rect":
        if (element.width && element.height) {
          if (fillStyle) {
            ctx.value.fillRect(x, y, element.width, element.height);
          }
          if (strokeStyle) {
            ctx.value.strokeRect(x, y, element.width, element.height);
          }
        }
        break;

      case "circle":
        if (element.radius) {
          ctx.value.beginPath();
          ctx.value.arc(x, y, element.radius, 0, Math.PI * 2);
          if (fillStyle) {
            ctx.value.fill();
          }
          if (strokeStyle) {
            ctx.value.stroke();
          }
        }
        break;

      case "line":
        if (element.endX !== undefined && element.endY !== undefined) {
          ctx.value.beginPath();
          ctx.value.moveTo(x, y);
          ctx.value.lineTo(element.endX, element.endY);
          ctx.value.stroke();
        }
        break;

      case "text":
        if (element.text) {
          if (element.font) {
            ctx.value.font = element.font;
          }
          if (element.textAlign) {
            ctx.value.textAlign = element.textAlign;
          }
          if (element.textBaseline) {
            ctx.value.textBaseline = element.textBaseline;
          }
          if (fillStyle) {
            ctx.value.fillText(element.text, x, y);
          }
          if (strokeStyle) {
            ctx.value.strokeText(element.text, x, y);
          }
        }
        break;

      case "image":
        if (element.imageSrc && element.width && element.height) {
          const img = new Image();
          img.onload = () => {
            if (ctx.value) {
              ctx.value.drawImage(img, x, y, element.width!, element.height!);
            }
          };
          img.src = element.imageSrc;
        }
        break;

      case "custom":
        if (element.customDraw) {
          element.customDraw(ctx.value, element);
        }
        break;
    }

    // 恢复上下文状态
    ctx.value.restore();
  };

  /**
   * 绘制所有元素
   */
  const draw = () => {
    if (!ctx.value || !canvasRef.value) {
      return;
    }

    // 清空画布
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

    // 绘制背景
    if (backgroundColor) {
      ctx.value.fillStyle = backgroundColor;
      ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }

    // 绘制所有元素
    elements.value.forEach((element) => {
      drawElement(element);
    });
  };

  /**
   * 添加元素
   */
  const addElement = (element: DrawElementConfig) => {
    elements.value.push(element);
    draw();
  };

  /**
   * 添加多个元素
   */
  const addElements = (newElements: DrawElementConfig[]) => {
    elements.value.push(...newElements);
    draw();
  };

  /**
   * 移除元素
   */
  const removeElement = (index: number) => {
    elements.value.splice(index, 1);
    draw();
  };

  /**
   * 更新元素
   */
  const updateElement = (index: number, updates: Partial<DrawElementConfig>) => {
    elements.value[index] = { ...elements.value[index], ...updates };
    draw();
  };

  /**
   * 清空所有元素
   */
  const clear = () => {
    elements.value = [];
    draw();
  };

  /**
   * 设置元素列表
   */
  const setElements = (newElements: DrawElementConfig[]) => {
    elements.value = newElements;
    draw();
  };

  /**
   * 获取 Canvas 上下文
   */
  const getContext = () => ctx.value;

  /**
   * 调整 Canvas 大小
   */
  const resize = (newWidth: number, newHeight: number) => {
    const canvas = canvasRef.value;
    if (!canvas) {
      return;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    draw();
  };

  // 初始化
  onMounted(() => {
    initCanvas();
  });

  // 窗口大小变化时调整
  if (autoResize) {
    const handleResize = () => {
      const canvas = canvasRef.value;
      if (canvas) {
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 600;
        draw();
      }
    };

    onMounted(() => {
      window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });
  }

  return {
    elements,
    ctx,
    draw,
    addElement,
    addElements,
    removeElement,
    updateElement,
    clear,
    setElements,
    getContext,
    resize,
  };
}

