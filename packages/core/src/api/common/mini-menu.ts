import { http, localStorageProxy, type ReturnResult } from "@repo/utils";

const MINI_MENU_CACHE_KEY = "mini-menus";

export type MiniMenuVO = {
  sysMiniMenuId?: number | string;
  sysMiniMenuTitle?: string;
  sysMiniMenuSubtitle?: string;
  sysMiniMenuCategory?: string;
  sysMiniMenuPath?: string;
  sysMiniMenuJumpMode?: number;
  sysMiniMenuIcon?: string;
  sysMiniMenuCover?: string;
  sysMiniMenuBadge?: string;
  sysMiniMenuBadgeType?: string;
  sysMiniMenuPerm?: string;
  sysMiniMenuRole?: string;
  sysMiniMenuSort?: number;
  sysMiniMenuKeepAlive?: number;
  sysMiniMenuHidden?: number;
  sysMiniMenuDescription?: string;
};

const extractMiniMenuArray = (payload: any): MiniMenuVO[] => {
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

export const getCachedUserMiniMenus = (): MiniMenuVO[] => {
  return extractMiniMenuArray(
    localStorageProxy().getItem(MINI_MENU_CACHE_KEY) as any,
  );
};

export const setCachedUserMiniMenus = (menus: MiniMenuVO[] = []) => {
  localStorageProxy().setItem(MINI_MENU_CACHE_KEY, menus);
};

export const clearCachedUserMiniMenus = () => {
  localStorageProxy().removeItem(MINI_MENU_CACHE_KEY);
};

export const fetchGetUserMiniMenus = () => {
  return http.request<ReturnResult<MiniMenuVO[]>>("get", "/v2/user/mini-menu");
};

export const loadUserMiniMenus = async (): Promise<MiniMenuVO[]> => {
  const cachedMenus = getCachedUserMiniMenus();

  try {
    const response = await fetchGetUserMiniMenus();
    const menus = extractMiniMenuArray(response?.data ?? response);
    if (menus.length) {
      setCachedUserMiniMenus(menus);
      return menus;
    }
  } catch (error) {
    console.warn("[MiniMenu] 加载失败，回退本地缓存", error);
  }

  return cachedMenus;
};
