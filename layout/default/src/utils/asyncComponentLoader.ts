/**
 * 异步组件加载工具
 * 提供带有 loading 和 error 状态的异步组件加载
 * @author Auto-generated
 * @version 1.0.0
 */
import { defineAsyncComponent, h, type AsyncComponentLoader, type Component } from "vue";
import { ElSkeleton, ElIcon, ElButton } from "element-plus";

/**
 * 默认加载组件（三个点动画）
 */
const DefaultLoadingComponent = {
  name: "DefaultLoadingComponent",
  render() {
    return h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          minHeight: "200px",
        },
      },
      [
        h(
          "div",
          {
            class: "loading-dots",
            style: {
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          [
            h("span", {
              class: "loading-dot dot1",
              style: {
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "var(--el-color-primary, #409eff)",
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.32s",
              },
            }),
            h("span", {
              class: "loading-dot dot2",
              style: {
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "var(--el-color-primary, #409eff)",
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.16s",
              },
            }),
            h("span", {
              class: "loading-dot dot3",
              style: {
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "var(--el-color-primary, #409eff)",
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: "0",
              },
            }),
          ]
        ),
      ]
    );
  },
};

/**
 * 默认错误组件
 */
const DefaultErrorComponent = {
  name: "DefaultErrorComponent",
  props: {
    error: Object,
    retry: Function,
  },
  render() {
    return h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          minHeight: "200px",
          color: "var(--el-color-danger)",
          gap: "16px",
        },
      },
      [
        h(
          ElIcon,
          { size: 48 },
          {
            default: () =>
              h(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                },
                [
                  h("circle", { cx: "12", cy: "12", r: "10" }),
                  h("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
                  h("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }),
                ]
              ),
          }
        ),
        h("span", { style: { fontSize: "14px" } }, "组件加载失败"),
        h(
          ElButton,
          {
            type: "primary",
            size: "small",
            // @ts-ignore
            onClick: () => this.retry?.(),
          },
          { default: () => "重试" }
        ),
      ]
    );
  },
};

/**
 * 异步组件配置选项
 */
export interface AsyncComponentOptions {
  /** 加载延迟（毫秒），超过此时间才显示 loading */
  delay?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 自定义加载组件 */
  loadingComponent?: Component;
  /** 自定义错误组件 */
  errorComponent?: Component;
  /** 加载失败时是否自动重试 */
  suspensible?: boolean;
  /** 加载失败回调 */
  onError?: (
    error: Error,
    retry: () => void,
    fail: () => void,
    attempts: number
  ) => void;
}

/**
 * 创建带有 loading/error 状态的异步组件
 * @param loader 组件加载器
 * @param options 配置选项
 * @returns 异步组件
 */
export function createAsyncComponent(
  loader: AsyncComponentLoader,
  options: AsyncComponentOptions = {}
) {
  const {
    delay = 200,
    timeout = 30000,
    loadingComponent = DefaultLoadingComponent,
    errorComponent = DefaultErrorComponent,
    suspensible = false,
    onError,
  } = options;

  return defineAsyncComponent({
    loader,
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    suspensible,
    onError:
      onError ||
      ((error, retry, fail, attempts) => {
        // 自动重试最多 3 次
        if (attempts <= 3) {
          console.warn(`组件加载失败，正在重试 (${attempts}/3)...`, error);
          retry();
        } else {
          console.error("组件加载失败，已达到最大重试次数", error);
          fail();
        }
      }),
  });
}

/**
 * 创建布局组件专用的异步加载器
 * 针对布局组件优化的配置
 */
export function createLayoutAsyncComponent(loader: AsyncComponentLoader) {
  return createAsyncComponent(loader, {
    delay: 100,
    timeout: 60000,
    suspensible: false,
  });
}

/**
 * 创建页面组件专用的异步加载器
 * 针对页面组件优化的配置
 */
export function createPageAsyncComponent(loader: AsyncComponentLoader) {
  return createAsyncComponent(loader, {
    delay: 150,
    timeout: 30000,
    suspensible: true,
  });
}

export default createAsyncComponent;
