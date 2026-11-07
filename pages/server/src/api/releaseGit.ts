/**
 * 项目 Git 仓库面板的接口（/ms/server/release/project/{id}/git/*）。
 *
 * <p>全部走后端 `utils-support-git-starter` 的 GitClient：前端只负责展示，
 * 不在浏览器里跑任何 Git 逻辑，也不解析 refs。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { http, unwrapResult } from "@repo/utils";

const BASE = "/ms/server/release";

/** 分支条目 */
export interface GitBranch {
  name: string;
  /** 是否远程分支（refs/remotes/origin/*） */
  remote: boolean;
  /** 是否当前所在分支 */
  current: boolean;
}

/** 提交条目 */
export interface GitCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  /** 提交时间（epoch 毫秒） */
  time: number;
}

/** 仓库概览（GET /project/{id}/git/repository） */
export interface GitRepository {
  gitUrl: string;
  /** 项目配置里指定的分支，空表示跟随远端默认 */
  configuredBranch: string;
  authType: string;
  /** 本地工作区绝对路径（展示用，便于到机器上直接看） */
  workspace: string;
  lastCommit?: string | null;
  pollEnabled: boolean;
  pollCron?: string | null;
  /** 本地是否已有该仓库的工作区 */
  cloned: boolean;
  /** 未克隆时的说明 */
  message?: string;
  /** 当前分支 */
  branch?: string;
  commit?: string | null;
  shortCommit?: string | null;
  remoteCommit?: string | null;
  /** 远端是否领先本地（需要拉取） */
  behind?: boolean;
  branches?: GitBranch[];
  /** 工作区是否干净（有改动时不允许拉取） */
  clean?: boolean;
  changes?: string[];
  changeCount?: number;
  commits?: GitCommit[];
}

/** 拉取结果（POST /project/{id}/git/pull） */
export interface GitPullResult {
  /** 本次是否为首次克隆 */
  cloned?: boolean;
  branch?: string;
  updated?: boolean;
  commit?: string | null;
  message?: string;
}

/**
 * 读取项目 Git 仓库概览。
 *
 * @param projectId 项目标识
 * @returns 仓库概览
 */
export function getGitRepository(projectId: number): Promise<GitRepository> {
  return http()
    .get(`${BASE}/project/${projectId}/git/repository`)
    .then((r) => unwrapResult<GitRepository>(r));
}

/**
 * 拉取项目 Git 仓库（只同步本地工作区，不构建、不发布）。
 *
 * @param projectId 项目标识
 * @param branch    目标分支（可空：用项目配置的分支）
 * @returns 拉取结果
 */
export function pullGitRepository(projectId: number, branch?: string): Promise<GitPullResult> {
  const query: Record<string, unknown> = {};
  if (branch) {
    query.branch = branch;
  }
  return http()
    .post(`${BASE}/project/${projectId}/git/pull`)
    .query(query)
    .then((r) => unwrapResult<GitPullResult>(r));
}

/**
 * 拉取并发布（拉代码 → Maven 构建 → 上传 → 备份重启）。
 *
 * <p>与 {@link pullGitRepository} 的区别：这个会动线上服务，返回的是异步任务标识，
 * 进度走发布管理的任务帧（SSE + 快照），前端用 ReProgressDialog 展示。</p>
 *
 * @param projectId 项目标识
 * @returns 任务标识
 */
export function deployGitRepository(projectId: number): Promise<string> {
  return http()
    .post(`${BASE}/project/${projectId}/git/deploy`)
    .then((r) => unwrapResult<string>(r));
}
