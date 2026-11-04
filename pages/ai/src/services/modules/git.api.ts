import type { ApiContext } from "./api-context";

/**
 * 单个文件的 Git 状态，字段与后端 {@code GitModels.FileStatus} 一一对应。
 */
export interface GitFileStatus {
  /** 文件相对仓库根目录的路径 */
  path: string;
  /** 暂存区状态字符（A/M/D/U/空格） */
  indexStatus: string;
  /** 工作区状态字符（M/D/?/U/空格） */
  workStatus: string;
  /** 是否存在已暂存变更 */
  staged: boolean;
  /** 是否为未跟踪文件 */
  untracked: boolean;
  /** 是否存在冲突 */
  conflicted: boolean;
}

/**
 * 仓库状态快照，字段与后端 {@code GitModels.Status} 一一对应。
 */
export interface GitStatus {
  /** 当前工作区是否为 Git 仓库 */
  repository: boolean;
  /** 仓库根目录（绝对路径） */
  repositoryRoot: string;
  /** 会话执行目录（绝对路径） */
  sessionRoot: string;
  /** 当前分支名 */
  branch: string;
  /** 当前提交短 SHA */
  head: string;
  /** 是否游离 HEAD */
  detached: boolean;
  /** 工作区是否干净 */
  clean: boolean;
  /** 领先上游的提交数 */
  ahead: number;
  /** 落后上游的提交数 */
  behind: number;
  /** 变更文件列表 */
  files: GitFileStatus[];
}

/**
 * 文件差异，字段与后端 {@code GitModels.Diff} 一一对应。
 */
export interface GitDiff {
  /** 文件相对路径 */
  path: string;
  /** 是否为暂存区差异 */
  staged: boolean;
  /** 统一 diff 文本 */
  text: string;
  /** 新增行数 */
  additions: number;
  /** 删除行数 */
  deletions: number;
  /** 是否为二进制差异 */
  binary: boolean;
}

/**
 * 分支信息，字段与后端 {@code GitModels.Branch} 一一对应。
 */
export interface GitBranch {
  /** 分支名 */
  name: string;
  /** 是否为当前分支 */
  current: boolean;
  /** 是否为远程分支 */
  remote: boolean;
}

/**
 * 分支列表，字段与后端 {@code GitModels.Branches} 一一对应。
 */
export interface GitBranches {
  /** 本地分支 */
  branches: GitBranch[];
  /** 远程分支 */
  remotes: GitBranch[];
  /** 当前分支名 */
  current: string;
}

/**
 * 提交日志条目，字段与后端 {@code GitModels.LogEntry} 一一对应。
 */
export interface GitLogEntry {
  /** 完整提交 SHA */
  sha: string;
  /** 短提交 SHA */
  shortSha: string;
  /** 提交标题 */
  subject: string;
  /** 完整提交信息 */
  message: string;
  /** 作者 */
  author: string;
  /** 作者邮箱 */
  email: string;
  /** 提交时间（ISO-8601） */
  time: string;
}

/**
 * 提交结果，字段与后端 {@code GitModels.CommitResult} 一一对应。
 */
export interface GitCommitResult {
  /** 提交 SHA */
  sha: string;
  /** 提交信息 */
  message: string;
}

/**
 * 会话工作区 Git 操作接口。
 *
 * <p>所有调用都以会话工作目录为作用域，文件路径一律使用「相对仓库根目录」的斜杠路径。</p>
 */
export interface GitApi {
  /**
   * 查询仓库状态。
   *
   * @param sessionId 会话标识
   * @returns 仓库状态；非 Git 仓库时 {@link GitStatus.repository} 为 false
   */
  getGitStatus(sessionId: string): Promise<GitStatus>;

  /**
   * 在会话工作目录初始化 Git 仓库。
   *
   * @param sessionId 会话标识
   * @returns 初始化后的仓库状态
   */
  initGitRepository(sessionId: string): Promise<GitStatus>;

  /**
   * 查询文件差异。
   *
   * @param sessionId 会话标识
   * @param path      文件相对路径；留空表示全部变更
   * @param staged    是否查询暂存区差异
   * @returns 差异文本与增删行数
   */
  getGitDiff(
    sessionId: string,
    path?: string,
    staged?: boolean,
  ): Promise<GitDiff>;

  /**
   * 暂存文件。
   *
   * @param sessionId 会话标识
   * @param paths     文件相对路径列表；空数组表示暂存全部
   * @returns 操作后的仓库状态
   */
  stageGitFiles(sessionId: string, paths: string[]): Promise<GitStatus>;

  /**
   * 取消暂存。
   *
   * @param sessionId 会话标识
   * @param paths     文件相对路径列表；空数组表示取消全部暂存
   * @returns 操作后的仓库状态
   */
  unstageGitFiles(sessionId: string, paths: string[]): Promise<GitStatus>;

  /**
   * 丢弃工作区变更（不可撤销）。
   *
   * @param sessionId 会话标识
   * @param paths     文件相对路径列表
   * @returns 操作后的仓库状态
   */
  discardGitFiles(sessionId: string, paths: string[]): Promise<GitStatus>;

  /**
   * 提交已暂存内容。
   *
   * @param sessionId 会话标识
   * @param commitMessage 提交信息
   * @returns 提交结果
   */
  commitGit(sessionId: string, commitMessage: string): Promise<GitCommitResult>;

  /**
   * 查询分支列表。
   *
   * @param sessionId 会话标识
   * @returns 本地与远程分支
   */
  getGitBranches(sessionId: string): Promise<GitBranches>;

  /**
   * 切换或创建分支。
   *
   * @param sessionId 会话标识
   * @param branch    分支名
   * @param create    是否创建新分支
   * @returns 操作后的仓库状态
   */
  checkoutGitBranch(
    sessionId: string,
    branch: string,
    create?: boolean,
  ): Promise<GitStatus>;

  /**
   * 查询提交日志。
   *
   * @param sessionId 会话标识
   * @param limit     条数（后端默认 30，上限 200）
   * @returns 提交日志
   */
  getGitLog(sessionId: string, limit?: number): Promise<GitLogEntry[]>;
}

/**
 * Git 接口实现，通过 {@code this._request} 走框架请求管线。
 */
export const gitApi: GitApi = {
  async getGitStatus(this: ApiContext, sessionId: string) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/status`,
    );
  },

  async initGitRepository(this: ApiContext, sessionId: string) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/init`,
      { method: "POST" },
    );
  },

  async getGitDiff(this: ApiContext, sessionId: string, path = "", staged = false) {
    const search = new URLSearchParams();
    if (path) {
      search.set("path", path);
    }
    search.set("staged", staged ? "true" : "false");
    return await this._request<GitDiff>(
      `/sessions/${encodeURIComponent(sessionId)}/git/diff?${search.toString()}`,
    );
  },

  async stageGitFiles(this: ApiContext, sessionId: string, paths: string[]) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/stage`,
      { method: "POST", data: { paths } },
    );
  },

  async unstageGitFiles(this: ApiContext, sessionId: string, paths: string[]) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/unstage`,
      { method: "POST", data: { paths } },
    );
  },

  async discardGitFiles(this: ApiContext, sessionId: string, paths: string[]) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/discard`,
      { method: "POST", data: { paths } },
    );
  },

  async commitGit(this: ApiContext, sessionId: string, commitMessage: string) {
    return await this._request<GitCommitResult>(
      `/sessions/${encodeURIComponent(sessionId)}/git/commit`,
      { method: "POST", data: { message: commitMessage } },
    );
  },

  async getGitBranches(this: ApiContext, sessionId: string) {
    return await this._request<GitBranches>(
      `/sessions/${encodeURIComponent(sessionId)}/git/branches`,
    );
  },

  async checkoutGitBranch(
    this: ApiContext,
    sessionId: string,
    branch: string,
    create = false,
  ) {
    return await this._request<GitStatus>(
      `/sessions/${encodeURIComponent(sessionId)}/git/checkout`,
      { method: "POST", data: { branch, create } },
    );
  },

  async getGitLog(this: ApiContext, sessionId: string, limit = 30) {
    return await this._request<GitLogEntry[]>(
      `/sessions/${encodeURIComponent(sessionId)}/git/log?limit=${limit}`,
    );
  },
};
