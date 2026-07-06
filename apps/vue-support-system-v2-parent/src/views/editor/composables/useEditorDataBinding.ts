/**
 * 编辑器数据绑定 + 处理脚本
 * 复用 bigscreen 的 useDataBinding，在其结果上添加 processScript 支持
 */
import { computed } from "vue";
import type { Ref } from "vue";
import { useDataBinding } from "@layout/bigscreen";
import type { EditorDataBindingConfig } from "../types/editor";

export function useEditorDataBinding(
  binding: Ref<EditorDataBindingConfig | undefined>
) {
  // 桥接：EditorDataBindingConfig 兼容 DataBindingConfig
  const bridgedBinding = computed(() => {
    const b = binding.value;
    if (!b) return undefined;
    return {
      apiUrl: b.apiUrl,
      method: b.method || "GET",
      headers: b.headers,
      body: b.body,
      refreshInterval: b.refreshInterval ?? 0,
      dataPath: b.dataPath,
      _cachedData: b._cachedData,
    };
  });

  const { data, loading, error, fetchData, startPolling, stopPolling } =
    useDataBinding(bridgedBinding);

  /** 经 processScript 处理后的数据 */
  const processedData = computed(() => {
    const raw = data.value;
    const script = binding.value?.processScript;
    if (!script || !raw) return raw;
    try {
      const fn = new Function("data", script);
      return fn(raw);
    } catch (e) {
      console.warn("[EditorDataBinding] processScript 执行异常:", e);
      return raw;
    }
  });

  return {
    data: processedData,
    rawData: data,
    loading,
    error,
    fetchData,
    startPolling,
    stopPolling,
  };
}
