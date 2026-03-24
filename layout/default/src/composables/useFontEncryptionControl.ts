/**
 * 字体加密控制 Hook
 * @description 提供字体加密的开关控制和状态管理
 * @author CH
 * @date 2025-12-16
 */
import { ref, computed, type Ref } from "vue";
import { useFontEncryption, type FontEncryptionConfig } from "../utils/useFontEncryption";

/**
 * 字体加密控制选项
 */
export interface FontEncryptionControlOptions {
  /** 初始是否启用加密 */
  initialEnabled?: boolean;
  /** 初始是否加密数字 */
  initialEncryptNumbers?: boolean;
  /** 初始是否加密汉字 */
  initialEncryptChinese?: boolean;
  /** 初始是否应用到全局 */
  initialApplyGlobal?: boolean;
  /** 初始是否禁用复制 */
  initialDisableCopy?: boolean;
  /** 需要加密的选择器 */
  selectors?: string[];
}

/**
 * 字体加密控制返回值
 */
export interface FontEncryptionControlReturn {
  /** 是否启用加密 */
  enabled: Ref<boolean>;
  /** 是否加密数字 */
  encryptNumbers: Ref<boolean>;
  /** 是否加密汉字 */
  encryptChinese: Ref<boolean>;
  /** 是否应用到全局 */
  applyGlobal: Ref<boolean>;
  /** 是否禁用复制 */
  disableCopy: Ref<boolean>;
  /** 加密状态（计算属性） */
  isEncrypted: Ref<boolean>;
  /** 切换加密开关 */
  toggleEncryption: () => void;
  /** 启用加密 */
  enableEncryption: () => void;
  /** 禁用加密 */
  disableEncryption: () => void;
  /** 切换数字加密 */
  toggleNumberEncryption: () => void;
  /** 切换汉字加密 */
  toggleChineseEncryption: () => void;
  /** 切换全局应用 */
  toggleGlobal: () => void;
  /** 切换复制开关 */
  toggleCopy: () => void;
  /** 更新配置 */
  updateConfig: (config: Partial<FontEncryptionConfig>) => void;
}

/**
 * 字体加密控制 Hook
 * @param options 配置选项
 * @returns 控制对象
 */
export function useFontEncryptionControl(
  options: FontEncryptionControlOptions = {}
): FontEncryptionControlReturn {
  const {
    initialEnabled = false,
    initialEncryptNumbers = true,
    initialEncryptChinese = true,
    initialApplyGlobal = false,
    initialDisableCopy = false,
    selectors = [],
  } = options;

  // 状态
  const enabled = ref(initialEnabled);
  const encryptNumbers = ref(initialEncryptNumbers);
  const encryptChinese = ref(initialEncryptChinese);
  const applyGlobal = ref(initialApplyGlobal);
  const disableCopy = ref(initialDisableCopy);

  // 计算属性
  const isEncrypted = computed(() => enabled.value);

  // 创建配置对象
  const createConfig = (): FontEncryptionConfig => ({
    enabled: enabled.value,
    encryptNumbers: encryptNumbers.value,
    encryptChinese: encryptChinese.value,
    applyGlobal: applyGlobal.value,
    selectors: selectors.length > 0 ? selectors : undefined,
  });

  // 使用字体加密 Hook
  const { updateConfig: updateFontConfig } = useFontEncryption(() =>
    createConfig()
  );

  // 切换加密开关
  const toggleEncryption = () => {
    enabled.value = !enabled.value;
  };

  // 启用加密
  const enableEncryption = () => {
    enabled.value = true;
  };

  // 禁用加密
  const disableEncryption = () => {
    enabled.value = false;
  };

  // 切换数字加密
  const toggleNumberEncryption = () => {
    encryptNumbers.value = !encryptNumbers.value;
  };

  // 切换汉字加密
  const toggleChineseEncryption = () => {
    encryptChinese.value = !encryptChinese.value;
  };

  // 切换全局应用
  const toggleGlobal = () => {
    applyGlobal.value = !applyGlobal.value;
  };

  // 切换复制开关
  const toggleCopy = () => {
    disableCopy.value = !disableCopy.value;
  };

  // 更新配置
  const updateConfig = (config: Partial<FontEncryptionConfig>) => {
    if (config.enabled !== undefined) {
      enabled.value = config.enabled;
    }
    if (config.encryptNumbers !== undefined) {
      encryptNumbers.value = config.encryptNumbers;
    }
    if (config.encryptChinese !== undefined) {
      encryptChinese.value = config.encryptChinese;
    }
    if (config.applyGlobal !== undefined) {
      applyGlobal.value = config.applyGlobal;
    }
    updateFontConfig(config);
  };

  return {
    enabled,
    encryptNumbers,
    encryptChinese,
    applyGlobal,
    disableCopy,
    isEncrypted,
    toggleEncryption,
    enableEncryption,
    disableEncryption,
    toggleNumberEncryption,
    toggleChineseEncryption,
    toggleGlobal,
    toggleCopy,
    updateConfig,
  };
}

