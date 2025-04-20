import { ref } from 'vue';

/**
 * 加载高德地图脚本钩子函数
 * @param apiKey API密钥
 * @param plugins 需要加载的插件列表
 * @returns 加载状态和错误信息
 */
export const useMapScriptLoader = (apiKey: string, plugins: string[] = []) => {
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const loadScript = async () => {
    if (window.AMap) {
      isLoaded.value = true;
      return Promise.resolve();
    }

    if (isLoading.value) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (isLoaded.value) {
            clearInterval(checkInterval);
            resolve(true);
          }
          if (error.value) {
            clearInterval(checkInterval);
            reject(error.value);
          }
        }, 100);
      });
    }

    isLoading.value = true;

    return new Promise<void>((resolve, reject) => {
      try {
        const script = document.createElement('script');
        const pluginsParam = plugins.length > 0 ? `&plugin=${plugins.join(',')}` : '';
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}${pluginsParam}`;
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          isLoaded.value = true;
          isLoading.value = false;
          resolve();
        };

        script.onerror = (e) => {
          const err = new Error(`Failed to load AMap script: ${e}`);
          error.value = err;
          isLoading.value = false;
          reject(err);
        };

        document.head.appendChild(script);
      } catch (e) {
        isLoading.value = false;
        error.value = e instanceof Error ? e : new Error('Unknown error loading map script');
        reject(error.value);
      }
    });
  };

  return {
    isLoaded,
    isLoading,
    error,
    loadScript
  };
}; 