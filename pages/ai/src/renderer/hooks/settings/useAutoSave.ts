import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 自动保存 hook —— 值变化时防抖 800ms 后写入服务端，无需手动点击保存。
 *
 * @param load   拉取当前值的函数（应在页面挂载时调用一次），返回值会被忽略
 * @param save   将完整 values 写入服务端的函数，接收 Partial<T>
 */
export function useAutoSave<T extends Record<string, unknown>>(
  load: () => Promise<Partial<T>>,
  save: (values: Partial<T>) => Promise<void>,
) {
  const [values, setValues] = useState<T>({} as T);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const valuesRef = useRef<Partial<T>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await load();
        if (res != null && typeof res === 'object') {
          setValues(res as T);
        }
        setHasLoaded(true);
      } catch {
        setHasLoaded(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      valuesRef.current = next;
      return next;
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try { await save(valuesRef.current); } catch { /* silent */ }
    }, 800);
  }, [save]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { values, set, loading, hasLoaded };
}
