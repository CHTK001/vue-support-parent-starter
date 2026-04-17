/**
 * 根据 serverOs 返回对应的 CSS class
 */
export const getOsCardClass = (serverOs?: string): string => {
  const map: Record<string, string> = {
    linux: "card-os--linux",
    windows: "card-os--windows",
    macos: "card-os--macos",
    unknown: "card-os--unknown",
  };
  return map[serverOs ?? ""] ?? "card-os--unknown";
};

/**
 * 根据 serverOs 返回对应的 Iconify 图标名
 */
export const getOsIcon = (serverOs?: string): string => {
  const map: Record<string, string> = {
    linux: "mdi:linux",
    windows: "mdi:microsoft-windows",
    macos: "mdi:apple",
  };
  return map[serverOs ?? ""] ?? "mdi:server";
};

/**
 * 脱敏用户名：保留前2字符，其余替换为 **
 */
export const maskUsername = (username?: string): string => {
  if (!username || username.length < 2) return "**";
  return username.slice(0, 2) + "**";
};

/** localStorage key 前缀 */
export const LS_KEY = (projectId: number) =>
  `project_server_activated_${projectId}`;

/** 读取 localStorage 激活缓存 */
export const getLocalActivated = (projectId: number): boolean =>
  localStorage.getItem(LS_KEY(projectId)) === "true";

/** 写入 localStorage 激活缓存 */
export const setLocalActivated = (projectId: number, value: boolean) => {
  if (value) {
    localStorage.setItem(LS_KEY(projectId), "true");
  } else {
    localStorage.removeItem(LS_KEY(projectId));
  }
};
