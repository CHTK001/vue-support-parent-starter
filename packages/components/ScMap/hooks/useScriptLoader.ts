import { ref } from 'vue';

/**
 * 脚本加载钩子
 * 用于动态加载外部JS脚本
 */
export function useScriptLoader() {
  const scriptLoaded = ref(false);
  const scriptError = ref(false);
  const loading = ref(false);

  /**
   * 加载外部JS脚本
   * @param src 脚本URL
   * @returns Promise
   */
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 已经加载过，直接返回
      if (scriptLoaded.value) {
        resolve();
        return;
      }

      // 正在加载中，防止重复加载
      if (loading.value) {
        const checkLoaded = setInterval(() => {
          if (scriptLoaded.value) {
            clearInterval(checkLoaded);
            resolve();
          }
          if (scriptError.value) {
            clearInterval(checkLoaded);
            reject(new Error('Script load failed'));
          }
        }, 100);
        return;
      }

      loading.value = true;

      // 检查是否已经存在该脚本
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        scriptLoaded.value = true;
        loading.value = false;
        resolve();
        return;
      }

      // 创建script标签
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;

      // 加载成功
      script.onload = () => {
        scriptLoaded.value = true;
        loading.value = false;
        resolve();
      };

      // 加载失败
      script.onerror = (e) => {
        console.error('加载脚本失败:', src);
        scriptError.value = true;
        loading.value = false;
        reject(e);
      };

      // 添加到文档
      document.head.appendChild(script);
    });
  };

  /**
   * 重置加载状态
   */
  const reset = () => {
    scriptLoaded.value = false;
    scriptError.value = false;
    loading.value = false;
  };

  return {
    loadScript,
    scriptLoaded,
    scriptError,
    loading,
    reset
  };
} 