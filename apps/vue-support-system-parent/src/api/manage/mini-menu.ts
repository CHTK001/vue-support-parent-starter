import { http, type ReturnResult } from "@repo/utils";

export type MiniMenu = {
  sysMiniMenuId?: number;
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

export const fetchListMiniMenu = () => {
  return http.request<ReturnResult<MiniMenu[]>>("get", "/v2/mini-menu/list");
};

export const fetchSaveMiniMenu = (data) => {
  return http.request<ReturnResult<MiniMenu>>("post", "/v2/mini-menu/save", {
    data,
  });
};

export const fetchUpdateMiniMenu = (data) => {
  if (!data?.sysMiniMenuId) {
    return;
  }
  return http.request<ReturnResult<boolean>>("put", "/v2/mini-menu/update", {
    data,
  });
};

export const fetchDeleteMiniMenu = (id) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/mini-menu/delete", {
    params: { sysMiniMenuId: id },
  });
};
