import { formatToken, getConfig, getToken } from "@repo/config";
import { http, type ReturnResult } from "@repo/utils";
import { resolveRouteSourceMode } from "../router/route-mode";

type Result = {
  success: boolean;
  data: Array<any>;
};

const extractRouteArray = (payload: any): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.records)) {
    return payload.records;
  }
  if (Array.isArray(payload?.result)) {
    return payload.result;
  }
  return [];
};

/**
 * 获取异步路由
 * 支持三种模式：
 * 1. RemoteMenu=false: 仅使用本地路由
 * 2. RemoteMenu=true, MergeLocalMenu=false: 仅使用远程路由
 * 3. RemoteMenu=true, MergeLocalMenu=true: 远程路由 + 本地路由（合并模式）
 */
export const getAsyncRoutes = async () => {
  const config = getConfig();
  const routeSourceMode = resolveRouteSourceMode(config);

  // 模式1: 不使用远程菜单，返回空（由路由系统自动加载本地路由）
  if (routeSourceMode === "local-only") {
    return new Promise<ReturnResult<Result>>(resolve => {
      resolve({
        data: [],
        success: true
      } as any);
    });
  }

  // 模式2和3: 使用远程菜单
  try {
    const baseUrl = config.ApiAddress || config.BaseUrl || "";
    const apiVersion = config.apiVersion;
    const tokenInfo = getToken();
    const accessToken = tokenInfo?.accessToken;
    const remoteResponse = await fetch(
      `${baseUrl}/v2/user/menu${apiVersion ? `?version=${encodeURIComponent(apiVersion)}` : ""}`,
      {
        headers: {
          ...(accessToken
            ? {
                Authorization: formatToken(accessToken),
                "x-oauth-token": accessToken,
              }
            : {}),
        },
      },
    );
    const remotePayload = await remoteResponse.json();
    const remoteRoutes = extractRouteArray(remotePayload?.data ?? remotePayload);
    const remoteResult = {
      data: remoteRoutes,
      success: remoteResponse.ok,
      code: remotePayload?.code ?? remoteResponse.status,
      msg: remotePayload?.msg ?? "",
    } as any;

    if (!remoteRoutes.length) {
      const httpFallbackResult = await http.request<ReturnResult<Result>>(
        "get",
        "/v2/user/menu",
      );
      remoteResult.data = extractRouteArray(
        httpFallbackResult?.data ?? httpFallbackResult,
      );
    }

    const normalizedRemoteRoutes = extractRouteArray(remoteResult.data);

    return {
      ...remoteResult,
      data: normalizedRemoteRoutes,
      success: true
    } as any;
  } catch (error) {
    console.error("[路由加载] 远程菜单加载失败:", error);

    // 如果启用了混合模式，保留已静态装配的本地路由
    if (routeSourceMode === "hybrid") {
      console.warn("[路由加载] 远程菜单加载失败，保留本地路由");
      return {
        data: [],
        success: true
      } as any;
    }

    // 否则返回空
    return {
      data: [],
      success: false,
      msg: "远程菜单加载失败"
    } as any;
  }
};
