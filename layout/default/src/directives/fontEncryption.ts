/**
 * 字体加密指令
 * @description 为元素应用字体加密，支持加密开关和复制开关
 * @author CH
 * @date 2025-12-16
 */
import type { Directive, DirectiveBinding } from "vue";
import { encryptText, decryptText } from "../utils/fontEncryption";

/**
 * 字体加密指令值类型
 */
interface FontEncryptionValue {
  /** 是否启用加密 */
  enabled?: boolean;
  /** 是否加密数字 */
  encryptNumbers?: boolean;
  /** 是否加密汉字 */
  encryptChinese?: boolean;
  /** 是否禁用复制 */
  disableCopy?: boolean;
  /**
   * 是否启用 OCR 噪点（干扰 OCR）
   * @description 默认关闭。开启后会在元素上叠加低透明噪点层，尽量不影响人眼阅读。
   */
  ocrNoise?: boolean | { level?: "low" | "medium" | "high" };
}

/**
 * 元素扩展属性
 */
interface ElementWithEncryption extends HTMLElement {
  __originalText?: string;
  __encryptionEnabled?: boolean;
  __copyHandler?: (e: ClipboardEvent) => void;
  __selectHandler?: (e: Event) => void;
  __contextMenuHandler?: (e: Event) => void;
  __ocrNoiseEnabled?: boolean;
}

/**
 * 应用字体加密到元素
 */
function applyEncryption(
  el: ElementWithEncryption,
  encryptNumbers: boolean,
  encryptChinese: boolean
): void {
  if (!el.textContent) {
    return;
  }

  // 保存原始文本
  if (!el.__originalText) {
    el.__originalText = el.textContent;
  }

  // 加密文本
  const encryptedText = encryptText(
    el.__originalText,
    encryptNumbers,
    encryptChinese
  );

  if (encryptedText !== el.__originalText) {
    el.textContent = encryptedText;
    el.classList.add("font-encryption-enabled");
    el.__encryptionEnabled = true;
  }
}

/**
 * 恢复元素原始文本
 */
function restoreEncryption(el: ElementWithEncryption): void {
  if (el.__originalText && el.__encryptionEnabled) {
    el.textContent = el.__originalText;
    el.classList.remove("font-encryption-enabled");
    el.__encryptionEnabled = false;
  }
}

/**
 * 禁用复制功能
 */
function disableCopy(el: ElementWithEncryption): void {
  // 阻止复制事件
  el.__copyHandler = (e: ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 可选：显示提示
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // 可以显示提示消息
      console.log("[字体加密] 复制功能已禁用");
    }
  };

  // 阻止选择
  el.__selectHandler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 阻止右键菜单
  el.__contextMenuHandler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  el.addEventListener("copy", el.__copyHandler);
  el.addEventListener("selectstart", el.__selectHandler);
  el.addEventListener("contextmenu", el.__contextMenuHandler);

  // 禁用文本选择样式
  el.style.userSelect = "none";
  el.style.webkitUserSelect = "none";
  el.style.mozUserSelect = "none";
  el.style.msUserSelect = "none";
}

/**
 * 启用复制功能
 */
function enableCopy(el: ElementWithEncryption): void {
  if (el.__copyHandler) {
    el.removeEventListener("copy", el.__copyHandler);
    el.__copyHandler = undefined;
  }

  if (el.__selectHandler) {
    el.removeEventListener("selectstart", el.__selectHandler);
    el.__selectHandler = undefined;
  }

  if (el.__contextMenuHandler) {
    el.removeEventListener("contextmenu", el.__contextMenuHandler);
    el.__contextMenuHandler = undefined;
  }

  // 恢复文本选择样式
  el.style.userSelect = "";
  el.style.webkitUserSelect = "";
  el.style.mozUserSelect = "";
  el.style.msUserSelect = "";
}

/**
 * 启用 OCR 噪点
 */
function enableOcrNoise(
  el: ElementWithEncryption,
  noise: NonNullable<FontEncryptionValue["ocrNoise"]>
): void {
  const level = typeof noise === "boolean" ? "low" : noise.level || "low";

  el.classList.add("font-encryption-ocr-noise");
  el.__ocrNoiseEnabled = true;

  // 用 CSS 变量做一点“伪随机”，避免每个元素噪点完全一致
  const r = () => Math.floor(Math.random() * 80) + 10;
  el.style.setProperty("--fe-ocr-noise-x1", `${r()}%`);
  el.style.setProperty("--fe-ocr-noise-y1", `${r()}%`);
  el.style.setProperty("--fe-ocr-noise-x2", `${r()}%`);
  el.style.setProperty("--fe-ocr-noise-y2", `${r()}%`);
  el.style.setProperty("--fe-ocr-noise-x3", `${r()}%`);
  el.style.setProperty("--fe-ocr-noise-y3", `${r()}%`);

  if (level === "high") {
    el.style.setProperty("--fe-ocr-noise-opacity", "0.045");
    el.style.setProperty("--fe-ocr-noise-size", "2.5px");
    return;
  }
  if (level === "medium") {
    el.style.setProperty("--fe-ocr-noise-opacity", "0.035");
    el.style.setProperty("--fe-ocr-noise-size", "3px");
    return;
  }
  el.style.setProperty("--fe-ocr-noise-opacity", "0.025");
  el.style.setProperty("--fe-ocr-noise-size", "3px");
}

/**
 * 关闭 OCR 噪点
 */
function disableOcrNoise(el: ElementWithEncryption): void {
  if (!el.__ocrNoiseEnabled) {
    return;
  }
  el.classList.remove("font-encryption-ocr-noise");
  el.__ocrNoiseEnabled = false;
  el.style.removeProperty("--fe-ocr-noise-opacity");
  el.style.removeProperty("--fe-ocr-noise-size");
  el.style.removeProperty("--fe-ocr-noise-x1");
  el.style.removeProperty("--fe-ocr-noise-y1");
  el.style.removeProperty("--fe-ocr-noise-x2");
  el.style.removeProperty("--fe-ocr-noise-y2");
  el.style.removeProperty("--fe-ocr-noise-x3");
  el.style.removeProperty("--fe-ocr-noise-y3");
}

/**
 * 字体加密指令
 */
export const vFontEncryption: Directive<ElementWithEncryption, FontEncryptionValue | boolean> = {
  mounted(el, binding) {
    const value = binding.value;
    const config: FontEncryptionValue =
      typeof value === "boolean"
        ? { enabled: value }
        : value ?? { enabled: true, encryptNumbers: true, encryptChinese: true };

    const {
      enabled = true,
      encryptNumbers = true,
      encryptChinese = true,
      disableCopy = false,
      ocrNoise = false,
    } = config;

    if (enabled) {
      applyEncryption(el, encryptNumbers, encryptChinese);
    }

    if (disableCopy) {
      disableCopy(el);
    }

    if (ocrNoise) {
      enableOcrNoise(el, ocrNoise);
    }
  },

  updated(el, binding) {
    const value = binding.value;
    const config: FontEncryptionValue =
      typeof value === "boolean"
        ? { enabled: value }
        : value ?? { enabled: true, encryptNumbers: true, encryptChinese: true };

    const {
      enabled = true,
      encryptNumbers = true,
      encryptChinese = true,
      disableCopy = false,
      ocrNoise = false,
    } = config;

    if (enabled) {
      // 如果原始文本已改变，重新加密
      const currentText = el.textContent || "";
      if (el.__originalText !== currentText && !el.__encryptionEnabled) {
        applyEncryption(el, encryptNumbers, encryptChinese);
      } else if (el.__encryptionEnabled) {
        // 如果已加密，检查是否需要更新
        const shouldEncrypt = encryptNumbers || encryptChinese;
        if (!shouldEncrypt) {
          restoreEncryption(el);
        }
      }
    } else {
      restoreEncryption(el);
    }

    // 更新复制开关
    if (disableCopy) {
      disableCopy(el);
    } else {
      enableCopy(el);
    }

    // 更新 OCR 噪点开关
    if (ocrNoise) {
      enableOcrNoise(el, ocrNoise);
    } else {
      disableOcrNoise(el);
    }
  },

  unmounted(el) {
    restoreEncryption(el);
    enableCopy(el);
    disableOcrNoise(el);
    
    // 清理
    delete el.__originalText;
    delete el.__encryptionEnabled;
    delete el.__ocrNoiseEnabled;
  },
};

