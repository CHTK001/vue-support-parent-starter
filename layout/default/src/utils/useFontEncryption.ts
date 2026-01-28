/**
 * 字体加密 Hook
 * @description 管理字体加密的启用和应用
 * @author CH
 * @date 2025-12-16
 */
import { watch, onMounted, onUnmounted } from 'vue';
import { encryptText } from './fontEncryption';

/**
 * 字体加密配置
 */
export interface FontEncryptionConfig {
  /** 是否启用字体加密 */
  enabled: boolean;
  /** 是否加密数字 */
  encryptNumbers: boolean;
  /** 是否加密汉字 */
  encryptChinese: boolean;
  /** 是否应用到全局 */
  applyGlobal: boolean;
  /** 需要加密的选择器（CSS选择器） */
  selectors?: string[];
  /** 是否启用 OCR 噪点（干扰 OCR 识别） */
  ocrNoise?: boolean | { level?: "low" | "medium" | "high" };
}

/**
 * 字体加密元素扩展属性
 */
interface ElementWithOriginalText extends Element {
  __originalText?: string;
}

/**
 * 字体加密管理器
 */
class FontEncryptionManager {
  private config: FontEncryptionConfig = {
    enabled: false,
    encryptNumbers: true,
    encryptChinese: true,
    applyGlobal: false,
    selectors: [],
    ocrNoise: false,
  };

  private observer: MutationObserver | null = null;
  private encryptedElements: Set<Element> = new Set();

  /**
   * 初始化字体加密
   */
  init(config: FontEncryptionConfig): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  /**
   * 启用字体加密
   */
  enable(): void {
    // 添加全局样式类
    if (this.config.applyGlobal) {
      document.body.classList.add('font-encryption-global');
    }

    // 应用加密到现有元素
    this.applyEncryption();

    // 监听 DOM 变化
    this.startObserving();
  }

  /**
   * 禁用字体加密
   */
  disable(): void {
    // 移除全局样式类
    document.body.classList.remove('font-encryption-global');

    // 恢复所有加密元素
    this.restoreEncryption();

    // 停止监听
    this.stopObserving();
  }

  /**
   * 应用加密到元素
   */
  private applyEncryptionToElement(element: Element): void {
    const el = element as ElementWithOriginalText;

    const textContent = element.textContent;
    if (!textContent) {
      return;
    }

    // 仅处理“纯文本叶子节点”，避免覆盖子节点导致 DOM 结构丢失
    if (!this.isEncryptableTextElement(element)) {
      return;
    }

    // 已加密过的元素，如果文本被外部更新（比如 Vue 重新渲染），需要允许重新加密
    const existed = this.encryptedElements.has(element);
    if (existed && el.__originalText && textContent === encryptText(el.__originalText, this.config.encryptNumbers, this.config.encryptChinese)) {
      return;
    }

    // 加密文本内容
    const encryptedText = encryptText(
      textContent,
      this.config.encryptNumbers,
      this.config.encryptChinese
    );

    if (encryptedText !== textContent) {
      // 保存原始内容
      el.__originalText = textContent;
      
      // 更新文本内容
      element.textContent = encryptedText;
      
      // 添加加密类
      element.classList.add('font-encryption-enabled');
      
      // 应用 OCR 噪点
      this.applyOcrNoise(element);
      
      // 标记为已加密
      this.encryptedElements.add(element);
    }
  }

  /**
   * 恢复元素原始内容
   */
  private restoreElement(element: Element): void {
    if (!this.encryptedElements.has(element)) {
      return;
    }

    const el = element as ElementWithOriginalText;
    const originalText = el.__originalText;
    if (originalText) {
      element.textContent = originalText;
      delete el.__originalText;
    }

    element.classList.remove('font-encryption-enabled');
    this.removeOcrNoise(element);
    this.encryptedElements.delete(element);
  }

  /**
   * 应用加密到所有匹配的元素
   */
  private applyEncryption(): void {
    if (this.config.selectors && this.config.selectors.length > 0) {
      // 应用加密到指定选择器
      this.config.selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.applyEncryptionToElement(el));
      });
    } else if (this.config.applyGlobal) {
      // 应用加密到所有文本节点
      this.encryptAllTextNodes();
    }
  }

  /**
   * 加密所有文本节点
   */
  private encryptAllTextNodes(): void {
    const elements = document.body.querySelectorAll('*');
    elements.forEach(el => this.applyEncryptionToElement(el));
  }

  /**
   * 判断元素是否为可安全加密的“纯文本叶子节点”
   * @description 全局模式下，为避免覆盖子节点导致 DOM 结构丢失，仅加密没有子元素的节点。
   */
  private isEncryptableTextElement(element: Element): boolean {
    const htmlElement = element as HTMLElement;
    if (htmlElement.childElementCount > 0) {
      return false;
    }

    const tagName = htmlElement.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'textarea', 'input', 'select', 'option'].includes(tagName)) {
      return false;
    }

    if (htmlElement.isContentEditable) {
      return false;
    }

    const text = htmlElement.textContent;
    return Boolean(text && text.trim());
  }

  /**
   * 恢复所有加密元素
   */
  private restoreEncryption(): void {
    this.encryptedElements.forEach(element => {
      this.restoreElement(element);
    });
    this.encryptedElements.clear();
  }

  /**
   * 开始监听 DOM 变化
   */
  private startObserving(): void {
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // 检查是否需要加密
              if (this.shouldEncrypt(element)) {
                this.applyEncryptionToElement(element);
              }

              // 检查子元素
              if (this.config.selectors && this.config.selectors.length > 0) {
                this.config.selectors.forEach(selector => {
                  const children = element.querySelectorAll(selector);
                  children.forEach(child => this.applyEncryptionToElement(child));
                });
              } else if (this.config.applyGlobal) {
                // 全局模式下，新增节点需要递归处理其后代
                const children = element.querySelectorAll('*');
                children.forEach(child => this.applyEncryptionToElement(child));
              }
            }
          });
          return;
        }

        if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement;
          if (!parent) {
            return;
          }
          if (this.shouldEncrypt(parent)) {
            this.applyEncryptionToElement(parent);
          }
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * 停止监听 DOM 变化
   */
  private stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 判断元素是否需要加密
   */
  private shouldEncrypt(element: Element): boolean {
    if (this.config.selectors && this.config.selectors.length > 0) {
      return this.config.selectors.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });
    }
    return this.config.applyGlobal;
  }

  /**
   * 应用 OCR 噪点到元素
   */
  private applyOcrNoise(element: Element): void {
    if (!this.config.ocrNoise) {
      return;
    }

    const htmlElement = element as HTMLElement;
    const level = typeof this.config.ocrNoise === "boolean" ? "low" : (this.config.ocrNoise.level || "low");

    htmlElement.classList.add("font-encryption-ocr-noise");

    // 用 CSS 变量做一点"伪随机"，避免每个元素噪点完全一致
    const r = () => Math.floor(Math.random() * 80) + 10;
    htmlElement.style.setProperty("--fe-ocr-noise-x1", `${r()}%`);
    htmlElement.style.setProperty("--fe-ocr-noise-y1", `${r()}%`);
    htmlElement.style.setProperty("--fe-ocr-noise-x2", `${r()}%`);
    htmlElement.style.setProperty("--fe-ocr-noise-y2", `${r()}%`);
    htmlElement.style.setProperty("--fe-ocr-noise-x3", `${r()}%`);
    htmlElement.style.setProperty("--fe-ocr-noise-y3", `${r()}%`);

    if (level === "high") {
      htmlElement.style.setProperty("--fe-ocr-noise-opacity", "0.045");
      htmlElement.style.setProperty("--fe-ocr-noise-size", "2.5px");
      return;
    }
    if (level === "medium") {
      htmlElement.style.setProperty("--fe-ocr-noise-opacity", "0.035");
      htmlElement.style.setProperty("--fe-ocr-noise-size", "3px");
      return;
    }
    htmlElement.style.setProperty("--fe-ocr-noise-opacity", "0.025");
    htmlElement.style.setProperty("--fe-ocr-noise-size", "3px");
  }

  /**
   * 移除元素的 OCR 噪点
   */
  private removeOcrNoise(element: Element): void {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.remove("font-encryption-ocr-noise");
    htmlElement.style.removeProperty("--fe-ocr-noise-opacity");
    htmlElement.style.removeProperty("--fe-ocr-noise-size");
    htmlElement.style.removeProperty("--fe-ocr-noise-x1");
    htmlElement.style.removeProperty("--fe-ocr-noise-y1");
    htmlElement.style.removeProperty("--fe-ocr-noise-x2");
    htmlElement.style.removeProperty("--fe-ocr-noise-y2");
    htmlElement.style.removeProperty("--fe-ocr-noise-x3");
    htmlElement.style.removeProperty("--fe-ocr-noise-y3");
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<FontEncryptionConfig>): void {
    const wasEnabled = this.config.enabled;
    const wasOcrNoise = this.config.ocrNoise;
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled !== wasEnabled) {
      if (this.config.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    } else if (this.config.enabled) {
      // OCR 噪点配置改变时，需要更新已加密的元素
      if (this.config.ocrNoise !== wasOcrNoise) {
        this.encryptedElements.forEach(element => {
          if (this.config.ocrNoise) {
            this.applyOcrNoise(element);
          } else {
            this.removeOcrNoise(element);
          }
        });
      }
      // 重新应用加密
      this.restoreEncryption();
      this.applyEncryption();
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.disable();
  }
}

// 单例实例
let managerInstance: FontEncryptionManager | null = null;

/**
 * 获取字体加密管理器实例
 */
function getManager(): FontEncryptionManager {
  if (!managerInstance) {
    managerInstance = new FontEncryptionManager();
  }
  return managerInstance;
}

/**
 * 字体加密 Hook
 * @param config 字体加密配置（可以是响应式对象）
 */
export function useFontEncryption(config: FontEncryptionConfig | (() => FontEncryptionConfig)) {
  const manager = getManager();
  
  // 处理响应式配置
  const getConfig = () => {
    return typeof config === 'function' ? config() : config;
  };

  onMounted(() => {
    manager.init(getConfig());
  });

  onUnmounted(() => {
    // 不销毁单例，只重置配置
    manager.updateConfig({ enabled: false });
  });

  // 如果配置是响应式的，监听变化
  if (typeof config === 'function') {
    watch(
      () => getConfig().enabled,
      (enabled) => {
        manager.updateConfig({ enabled });
      }
    );

    watch(
      () => [
        getConfig().encryptNumbers,
        getConfig().encryptChinese,
        getConfig().applyGlobal,
        getConfig().ocrNoise,
      ],
      () => {
        if (getConfig().enabled) {
          manager.updateConfig(getConfig());
        }
      }
    );
  }

  return {
    enable: () => manager.enable(),
    disable: () => manager.disable(),
    updateConfig: (newConfig: Partial<FontEncryptionConfig>) => {
      manager.updateConfig(newConfig);
    },
  };
}

