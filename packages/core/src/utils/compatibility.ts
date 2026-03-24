/**
 * IdleDeadline类型
 */
type IdleDeadline = {
  timeRemaining(): number;
  didTimeout: boolean;
};

/**
 * r回调参数
 */
type RequestIdleCallbackOptions = {
  timeout?: number;
};

/**
 * EventListenerOrEventListenerObject类型
 */
type EventListenerOrEventListenerObject = {
  handleEvent(event: Event): void;
};

type AddEventListenerOptions = {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
};
/**
 * requestIdleCallback polyfill
 */
export const registerRequestIdleCallback = (() => {
  const TIMEOUT_DELAY = 1; // 使用 setTimeout 的延迟时间（毫秒）

  //@ts-ignore
  if (typeof window.requestIdleCallback === "function") {
    //@ts-ignore
    return window.requestIdleCallback;
  }

  return (callback: (deadline: IdleDeadline) => void, options?: RequestIdleCallbackOptions) => {
    const startTime = performance.now();
    const timeout = options?.timeout || Infinity;

    setTimeout(() => {
      const currentTime = performance.now();
      const timeElapsed = currentTime - startTime;
      const remainingTime = Math.max(0, timeout - timeElapsed);

      callback({
        timeRemaining: () => remainingTime,
        didTimeout: timeElapsed >= timeout,
      } as IdleDeadline);
    }, TIMEOUT_DELAY);
  };
})();
/**
 * 注册事件
 */
export const registerEventListener = (() => {
  //@ts-ignore
  if (typeof window.addEventListener === "function") {
    //@ts-ignore
    return window.addEventListener;
  }

  //@ts-ignore
  if (typeof window.attachEvent === "function") {
    //@ts-ignore
    return window.attachEvent;
  }

  return (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
    //@ts-ignore
    window.addEventListener(type, listener, options);
  };
})();
