/**
 * useConfig — 读取全局配置
 *
 * 在桌面模式下从 Tauri 本地存储读取；在 WebUI 模式下从 /v2/global-settings 读取。
 * 这里提供一个轻量实现：优先 localStorage，其次全局默认。
 */
import { useState, useEffect } from 'react';

type ConfigValue = string | number | boolean | null;

const DEFAULTS: Record<string, ConfigValue> = {
  'chat.sendKey': 'enter',
};

export function useConfig(key: string): [ConfigValue, (val: ConfigValue) => void] {
  const [value, setValue] = useState<ConfigValue>(() => {
    try {
      const stored = localStorage.getItem(`config.${key}`);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULTS[key] ?? null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`config.${key}`, JSON.stringify(value));
    } catch { /* ignore */ }
  }, [key, value]);

  return [value, setValue];
}
