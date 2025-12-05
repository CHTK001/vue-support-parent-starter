/**
 * 性能优化服务
 * 实现图片懒加载、虚拟滚动、路由预加载等功能
 * @author CH
 * @version 1.0.0
 * @since 2024-12-05
 */

import { getConfig } from "@repo/config";

/** 性能配置接口 */
interface PerformanceConfig {
  /** 图片懒加载 */
  lazyLoadImages?: boolean;
  /** 虚拟滚动 */
  virtualScroll?: boolean;
  /** 预加载路由 */
  prefetchRoutes?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

/** 懒加载观察器 */
let lazyLoadObserver: IntersectionObserver | null = null;

/** 预加载的路由集合 */
const prefetchedRoutes: Set<string> = new Set();

/** 性能管理器类 */
class PerformanceManager {
  /** 配置 */
  private config: PerformanceConfig = {
    enable: true,
    lazyLoadImages: true,
    virtualScroll: false,
    prefetchRoutes: true,
  };

  /**
   * 初始化性能管理器
   */
  init(): void {
    const globalConfig = getConfig();
    this.config = {
      ...this.config,
      ...globalConfig?.Performance,
    };

    if (!this.config.enable) {
      return;
    }

    // 初始化图片懒加载
    if (this.config.lazyLoadImages) {
      this.initLazyLoad();
    }

    // 初始化路由预加载
    if (this.config.prefetchRoutes) {
      this.initPrefetch();
    }
  }

  /** 初始化图片懒加载 */
  private initLazyLoad(): void {
    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver not supported, lazy load disabled");
      return;
    }

    lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
              lazyLoadObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );

    // 观察所有带有data-src属性的图片
    this.observeLazyImages();

    // 监听DOM变化，自动观察新添加的图片
    const mutationObserver = new MutationObserver(() => {
      this.observeLazyImages();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /** 观察懒加载图片 */
  private observeLazyImages(): void {
    if (!lazyLoadObserver) return;

    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      lazyLoadObserver?.observe(img);
    });
  }

  /** 初始化路由预加载 */
  private initPrefetch(): void {
    // 监听鼠标悬停在链接上的事件
    document.addEventListener(
      "mouseover",
      (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest("a[href]") as HTMLAnchorElement;

        if (link && link.href) {
          this.prefetchRoute(link.href);
        }
      },
      { passive: true }
    );
  }

  /**
   * 预加载路由
   * @param url 路由URL
   */
  prefetchRoute(url: string): void {
    if (!this.config.prefetchRoutes || prefetchedRoutes.has(url)) {
      return;
    }

    // 只预加载同源的链接
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.origin !== window.location.origin) {
        return;
      }

      // 创建预加载链接
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);

      prefetchedRoutes.add(url);
    } catch (e) {
      // 忽略无效的URL
    }
  }

  /**
   * 手动触发图片懒加载
   * @param container 容器元素
   */
  lazyLoadImages(container?: HTMLElement): void {
    if (!lazyLoadObserver) return;

    const root = container || document;
    const images = root.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      lazyLoadObserver?.observe(img);
    });
  }

  /**
   * 预加载图片
   * @param urls 图片URL数组
   */
  preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
          })
      )
    );
  }

  /** 停止性能管理器 */
  stop(): void {
    if (lazyLoadObserver) {
      lazyLoadObserver.disconnect();
      lazyLoadObserver = null;
    }
  }

  /** 是否已启用 */
  isEnabled(): boolean {
    return this.config.enable || false;
  }

  /** 获取配置 */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /** 是否启用虚拟滚动 */
  isVirtualScrollEnabled(): boolean {
    return this.config.virtualScroll || false;
  }

  /** 是否启用图片懒加载 */
  isLazyLoadEnabled(): boolean {
    return this.config.lazyLoadImages || false;
  }
}

/** 性能管理器单例 */
export const performanceManager = new PerformanceManager();

/**
 * 初始化性能优化
 */
export function initPerformance(): void {
  performanceManager.init();
}

/**
 * 停止性能优化
 */
export function stopPerformance(): void {
  performanceManager.stop();
}

/**
 * 手动触发图片懒加载
 * @param container 容器元素
 */
export function lazyLoadImages(container?: HTMLElement): void {
  performanceManager.lazyLoadImages(container);
}

/**
 * 预加载图片
 * @param urls 图片URL数组
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return performanceManager.preloadImages(urls);
}

/**
 * 预加载路由
 * @param url 路由URL
 */
export function prefetchRoute(url: string): void {
  performanceManager.prefetchRoute(url);
}

/**
 * 是否启用虚拟滚动
 */
export function isVirtualScrollEnabled(): boolean {
  return performanceManager.isVirtualScrollEnabled();
}
