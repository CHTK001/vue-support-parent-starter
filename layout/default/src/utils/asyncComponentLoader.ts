/**
 * 异步组件加载工具
 * 提供带有 loading 和 error 状态的异步组件加载
 * @author Auto-generated
 * @version 1.0.0
 */
import {
  defineAsyncComponent,
  h,
  type AsyncComponentLoader,
  type Component,
} from "vue";
import { ElIcon, ElButton } from "element-plus";

/**
 * 空加载组件（不渲染任何占位，避免撑开布局）
 */
const EmptyLoadingComponent = {
  name: "EmptyLoadingComponent",
  render() {
    return null;
  },
};

/**
 * 侧边栏骨架屏加载组件
 */
const SidebarSkeletonLoadingComponent = {
  name: "SidebarSkeletonLoadingComponent",
  render() {
    const lineStyle = {
      height: "12px",
      borderRadius: "8px",
      background:
        "linear-gradient(90deg, rgba(148,163,184,0.12), rgba(148,163,184,0.22), rgba(148,163,184,0.12))",
    } as const;

    return h(
      "div",
      {
        style: {
          height: "100%",
          minHeight: "360px",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          overflow: "hidden",
        },
      },
      [
        h("div", {
          style: {
            ...lineStyle,
            width: "78%",
            height: "28px",
          },
        }),
        ...Array.from({ length: 10 }).map((_, index) =>
          h("div", {
            key: index,
            style: {
              ...lineStyle,
              width: index % 3 === 0 ? "86%" : index % 3 === 1 ? "72%" : "80%",
            },
          }),
        ),
      ],
    );
  },
};

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
          ],
        ),
      ],
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
                ],
              ),
          },
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
          { default: () => "重试" },
        ),
      ],
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
    attempts: number,
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
  options: AsyncComponentOptions = {},
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
 * 创建侧边栏组件专用的异步加载器（骨架屏）
 */
export function createSidebarAsyncComponent(loader: AsyncComponentLoader) {
  return createAsyncComponent(loader, {
    delay: 60,
    timeout: 60000,
    suspensible: false,
    loadingComponent: SidebarSkeletonLoadingComponent,
  });
}

/**
 * 创建覆盖层组件专用的异步加载器（不显示 loading 占位）
 */
export function createOverlayAsyncComponent(loader: AsyncComponentLoader) {
  return createAsyncComponent(loader, {
    delay: 0,
    timeout: 60000,
    suspensible: false,
    loadingComponent: EmptyLoadingComponent,
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
