// 通过 Vite 的 raw 加载器获取 CSS 内容
import lightTheme from "highlight.js/styles/github.css?raw";
import darkTheme from "highlight.js/styles/github-dark.css?raw";
import { onMounted, onUnmounted } from "vue";

export default function useLoadTheme() {
  type ThemeType = "light" | "dark";
  let observer: MutationObserver | null = null;
  let styleElement: HTMLStyleElement | null = null;

  const initTheme = () => {
    const htmlElement = document.documentElement;

    // 初始化主题
    const initialTheme =
      (htmlElement.getAttribute("ld-theme") as ThemeType) || // 优先使用 ld-theme 属性
      (localStorage.getItem("ld-theme") as ThemeType) || // 其次使用 localStorage
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") || // 最后使用系统主题
      "light";

    // 初始化主题样式
    initThemeStyle(initialTheme);

    // 初始设置一次主题
    loadTheme(initialTheme);

    // 初始化主题观察器
    initThemeObserver(htmlElement);
  };

  const loadTheme = (theme: ThemeType) => {
    if (!styleElement) return;

    // 加载对应主题的代码高亮样式
    styleElement.textContent = theme === "light" ? lightTheme : darkTheme;
  };

  // 初始化主题样式
  const initThemeStyle = (theme: ThemeType) => {
    // 在 html 标签上设置主题，触发观察器
    document.documentElement.setAttribute("ld-theme", theme);

    styleElement = document.createElement("style");
    styleElement.id = "dynamic-theme";
    document.head.appendChild(styleElement);
  };

  const initThemeObserver = (htmlElement: HTMLElement) => {
    // 配置观察器
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 如果 ld-theme 属性发生变化
        if (mutation.attributeName === "ld-theme") {
          // 获取新主题
          const newTheme = htmlElement.getAttribute("ld-theme") as ThemeType;
          // 加载新主题
          loadTheme(newTheme);
          // 保存主题到 localStorage
          localStorage.setItem("ld-theme", newTheme);
        }
      });
    });

    // 开始观察
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["ld-theme"],
    });
  };

  // 挂载完毕后初始化主题观察器
  onMounted(() => {
    // 初始化主题
    initTheme();
  });

  // 卸载时清理主题观察器
  onUnmounted(() => {
    // 清理主题观察器
    if (observer) {
      observer.disconnect();
    }
    // 移除样式元素
    if (styleElement) {
      document.head.removeChild(styleElement);
    }
  });

  return {
    initTheme,
    get styleElement() {
      return styleElement;
    },
    get observer() {
      return observer;
    },
  };
}
