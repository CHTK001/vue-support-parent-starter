import { ref } from 'vue';

export function useScriptLoader() {
  const scriptLoaded = ref(false);
  const scriptError = ref<Error | null>(null);
  const loadedScripts = ref<Set<string>>(new Set());

  /**
   * 加载外部脚本
   * @param src 脚本URL
   * @returns Promise
   */
  const loadScript = (src: string): Promise<void> => {
    // 如果已经加载过该脚本，直接返回成功
    if (loadedScripts.value.has(src)) {
      scriptLoaded.value = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;

      script.onload = () => {
        scriptLoaded.value = true;
        loadedScripts.value.add(src);
        resolve();
      };

      script.onerror = (error) => {
        scriptError.value = new Error(`加载脚本失败: ${src}`);
        reject(scriptError.value);
      };

      document.head.appendChild(script);
    });
  };

  return {
    loadScript,
    scriptLoaded,
    scriptError,
    loadedScripts
  };
}