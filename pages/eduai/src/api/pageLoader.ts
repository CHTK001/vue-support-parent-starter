/**
 * ReTable 远程分页工装：把 eduai 的分页接口包成组件认识的 loader，并合并重复请求。
 */

import { message } from "@repo/core";
import { computed, ref, type Ref } from "vue";
import type { RePageResult, ReTableLoader } from "@repo/ui/re-table";
import type { PageResult } from "./types";

/** 字符串查询参数：空串按"未填"处理 */
export function strParam(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/** 数值查询参数：0 是合法值（状态=停用/禁用），只有 undefined 才视为未填 */
export function numParam(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * 生成 ReTable 的 loader。
 *
 * ReTable 的 page 与 params 两个监听会对同一次操作各重载一次，这里把"同参数且在飞行中"的请求合并为一次网络查询；
 * 请求失败时原样抛出，由表格的 load-error 事件决定如何提示。
 */
export function createPageLoader<T>(
  fetchPage: (page: number, pageSize: number, params: Record<string, unknown>) => Promise<PageResult<T>>,
): ReTableLoader {
  let inFlight: { key: string; request: Promise<RePageResult> } | null = null;
  return ({ page, pageSize, params }) => {
    const key = JSON.stringify([page, pageSize, params]);
    if (inFlight?.key === key) return inFlight.request;
    const request: Promise<RePageResult> = fetchPage(page, pageSize, params).then((res) => ({
      total: res?.total ?? 0,
      data: (res?.data ?? []) as unknown as Record<string, unknown>[],
    }));
    const settle = () => {
      if (inFlight?.request === request) inFlight = null;
    };
    request.then(settle, settle);
    inFlight = { key, request };
    return request;
  };
}

/**
 * ReTable 内置 ReSearch 用的「草稿 + 已提交快照」状态。
 *
 * 搜索区双向绑定 searchModel（逐键更新，不影响列表），点查询才 commit() 成 applied，
 * 表格的 params 只认 applied —— 否则每敲一个字都会多发一次分页请求。
 */
export function useSnapshotSearch<T extends Record<string, unknown>>(blank: () => T) {
  const searchModel = ref({ ...blank() }) as Ref<T>;
  const applied = ref({ ...blank() }) as Ref<T>;
  const queryParams = computed<Record<string, unknown>>(() => ({ ...applied.value }));
  const commit = () => {
    applied.value = { ...searchModel.value } as T;
  };
  const reset = () => {
    searchModel.value = { ...blank() } as T;
    commit();
  };
  return { searchModel, applied, queryParams, commit, reset };
}

/** 统一的服务端分页失败提示 */
export function pageLoadError(e: unknown): void {
  message.error("加载失败: " + (e instanceof Error ? e.message : String(e)));
}