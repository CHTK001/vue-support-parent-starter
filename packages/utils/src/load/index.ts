/**
 * 异步加载远程 JS 文件
 * @param {string} src - 必需，需要加载的 JS 文件的 URL 路径
 * @param {string} keyName - 必需，唯一标识符，也是 JS 文件加载后返回的全局对象名
 * @param {string} [callbackName] - 可选，如果远程 JS 文件有回调函数，可用于更有效地判断是否完成加载
 * @returns {Promise<any>} - 返回一个 Promise，当 JS 文件加载成功时解析为全局对象，失败时拒绝并返回错误信息
 */
export function loadJS(src: string, keyName: string, callbackName?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过该 JS 文件
    const existingScript = document.head.querySelector(`script[loadKey="${keyName}"]`);
    if (existingScript) {
      return resolve(window[keyName]);
    }

    // 创建新的 script 元素
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.setAttribute("loadKey", keyName);
    document.head.appendChild(script);

    // 处理加载成功事件
    script.onload = () => {
      if (callbackName) {
        // 为回调函数设置处理逻辑
        // @ts-ignore
        window[callbackName] = () => {
          resolve(window[keyName]);
        };
      } else {
        // 若没有回调函数，延迟 50 毫秒后解析
        setTimeout(() => {
          resolve(window[keyName]);
        }, 50);
      }
    };

    // 处理加载失败事件
    script.onerror = (error) => {
      reject(error);
    };
  });
}

/**
 * 异步加载远程 CSS 文件
 * @param {string} src - 必需，需要加载的 CSS 文件的 URL 路径
 * @param {string} keyName - 必需，唯一标识符
 * @returns {Promise<void>} - 返回一个 Promise，当 CSS 文件加载成功时解析，失败时拒绝并返回错误信息
 */
export function loadCSS(src: string, keyName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过该 CSS 文件
    const existingLink = document.head.querySelector(`link[loadKey="${keyName}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    // 创建新的 link 元素
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = src;
    link.setAttribute("loadKey", keyName);
    document.head.appendChild(link);

    // 处理加载成功事件
    link.onload = () => {
      resolve();
    };

    // 处理加载失败事件
    link.onerror = (error) => {
      reject(error);
    };
  });
}
