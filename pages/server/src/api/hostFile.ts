/**
 * 主机文件管理 / Agent 生命周期 API（/ms/server/host/*）。
 *
 * <p>按采集通道路由到目标机，属「主机资产」能力，故与主机台账、远控、主机画像
 * 一起住在 @pages/server；监控台宿主不再重复实现。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== Agent 生命周期（/ms/server/host/agent） ====================

/**
 * Agent 生命周期动作
 */
export type AgentLifecycleAction = "install" | "reinstall" | "upgrade" | "uninstall";

/**
 * 提交 Agent 生命周期动作（安装/重装/升级/卸载）。
 * <p>
 * 安装对应后端 deploy 端点，其余动作同名；进度通过 socket 的 monitor/agent-deploy 事件推送。
 * @param hostId 主机 ID
 * @param action 生命周期动作
 * @returns 后端受理的动作标识
 */
export const submitAgentAction = (hostId: number, action: AgentLifecycleAction) => {
  const endpoint = action === "install" ? "deploy" : action;
  return http()
    .post(`/ms/server/host/agent/${hostId}/${endpoint}`)
    .then(r => unwrap<string>(r));
};

// ==================== 主机文件管理（/ms/server/host/file，按采集通道路由） ====================

/**
 * 主机文件条目
 */
export interface HostFileItem {
  name: string;
  /** 是否目录（后端 @JsonProperty("isDir")） */
  isDir: boolean;
  size: number;
  modified?: string;
  owner?: string;
  perms?: string;
}

/**
 * 主机文件接口前缀
 * @param hostId 主机 ID
 * @returns 前缀路径
 */
const hostFileBase = (hostId: number) => `/ms/server/host/file/${hostId}`;

/**
 * 列出主机目录
 * @param hostId 主机 ID
 * @param path 目录路径
 */
export const fetchHostFiles = (hostId: number, path?: string) =>
  http().get(hostFileBase(hostId)).query({ path }).then(r => unwrap<HostFileItem[]>(r));

/**
 * 读取主机文本文件
 * @param hostId 主机 ID
 * @param path 文件路径
 */
export const readHostFileContent = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/content`).query({ path }).then(r => unwrap<string>(r));

/**
 * 写入主机文本文件
 * @param hostId 主机 ID
 * @param path 文件路径
 * @param content 内容
 */
export const writeHostFileContent = (hostId: number, path: string, content: string) =>
  http().put(`${hostFileBase(hostId)}/content`).query({ path }).headers({ "Content-Type": "text/plain;charset=utf-8" }).data(content).then(r => unwrap<boolean>(r));

/**
 * 创建主机目录
 * @param hostId 主机 ID
 * @param path 目录路径
 */
export const mkdirHostFile = (hostId: number, path: string) =>
  http().post(`${hostFileBase(hostId)}/mkdir`).query({ path }).then(r => unwrap<boolean>(r));

/**
 * 删除主机文件 / 目录
 * @param hostId 主机 ID
 * @param path 目标路径
 */
export const deleteHostFile = (hostId: number, path: string) =>
  http().delete(hostFileBase(hostId)).query({ path }).then(r => unwrap<boolean>(r));

/**
 * 重命名 / 移动主机文件
 * @param hostId 主机 ID
 * @param from 源路径
 * @param to 目标路径
 */
export const renameHostFile = (hostId: number, from: string, to: string) =>
  http().put(`${hostFileBase(hostId)}/rename`).query({ from, to }).then(r => unwrap<boolean>(r));

/**
 * 上传文件到主机目录
 * @param hostId 主机 ID
 * @param dir 目标目录
 * @param file 文件
 */
export const uploadHostFile = (hostId: number, dir: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return http().post(`${hostFileBase(hostId)}/upload`).query({ path: dir }).data(form)
    .then(r => unwrap<string>(r));
};

/**
 * 下载主机文件，返回 Blob（由组件触发浏览器保存）
 * @param hostId 主机 ID
 * @param path 文件路径
 */
export const downloadHostFile = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/download`).query({ path }).responseType("blob")
    .then(r => r.data as Blob);

/**
 * 主机文件/目录权限信息（类 Unix）
 */
export interface HostFilePerms {
  /** 八进制权限，如 755 */
  mode: string;
  owner: string;
  group: string;
}

/**
 * 读取主机文件/目录权限（类 Unix）
 * @param hostId 主机 ID
 * @param path 目标路径
 */
export const fetchHostPerms = (hostId: number, path: string) =>
  http().get(`${hostFileBase(hostId)}/chmod`).query({ path }).then(r => unwrap<HostFilePerms>(r));

/**
 * 下发主机文件/目录权限（类 Unix）
 * @param hostId 主机 ID
 * @param path 目标路径
 * @param mode 八进制权限（3~4 位）
 */
export const saveHostPerms = (hostId: number, path: string, mode: string) =>
  http().put(`${hostFileBase(hostId)}/chmod`).query({ path, mode }).then(r => unwrap<boolean>(r));

/* ==================== 磁盘占用分析（WizTree 风格） ==================== */

/** 磁盘占用树节点 */
export interface DiskUsageNode {
  name: string;
  path: string;
  /** 字节（目录为累计值） */
  size: number;
  directory: boolean;
  children?: DiskUsageNode[];
  /** 节点下（含子孙）文件总数 */
  fileCount?: number;
  /** 节点下（含子孙）目录总数 */
  dirCount?: number;
  /** 修改时间展示文本（文件为自身 mtime，目录取最近修改子项） */
  modified?: string | null;
  /** 所在卷总容量（字节，仅根节点） */
  totalSpace?: number;
  /** 所在卷可用容量（字节，仅根节点） */
  freeSpace?: number;
}

/**
 * 磁盘占用分析：递归统计目录/文件大小
 * @param hostId 主机 ID
 * @param path   起始路径
 * @param depth  递归深度
 */
export const fetchDiskUsage = (hostId: number, path?: string, depth = 4) =>
  http().get(`${hostFileBase(hostId)}/usage`).query({ path, depth })
    // 整盘递归可能较慢，放宽到 120s
    .timeout(120_000)
    .then(r => unwrap<DiskUsageNode>(r));
