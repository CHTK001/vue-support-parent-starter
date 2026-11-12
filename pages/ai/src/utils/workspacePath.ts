/**
 * 工作间路径的展示口径。
 *
 * <p>「工作间」在数据上只是一条 {@code workspacePath}：可能是服务端本机的一个目录，
 * 也可能是通过远端执行器给出的地址（{@code ssh://host/path}、
 * {@code user@host:/path}、{@code \\host\share} 这类）。界面上要让用户一眼看出
 * 这条路径落在哪台机器上，所以判定与截断都收在这一个文件里，
 * 避免工作间按钮、选择器、会话列表各写一份、各认一半。</p>
 *
 * <p>判定只做「形态识别」，不解析、不校验可达性：真正的远端连接由后端执行器负责。
 * 认不出来的形式一律按本地处理——把本地目录误标成远端，比不标更糟。</p>
 */

/** 明确表示「另一台机器」的协议前缀 */
const REMOTE_SCHEMES = ['ssh://', 'sftp://', 'ftp://', 'smb://', 'smb2://', 'nfs://', 'rdp://'];

/**
 * scp 形式的远端地址：{@code user@host:/path}、{@code user@host:path}。
 *
 * <p>只认「@ 之前没有分隔符、之后紧跟冒号」的形态，避免把 Windows 盘符
 * （{@code C:\}）或带 @ 的普通目录名误判成远端。</p>
 */
const SCP_LIKE = /^[^\s/\\@]+@[^\s/\\:]+:(?:[\\/]|[^\\/:])/;

/**
 * UNC 路径：{@code \\host\share} 或 {@code //host/share}。
 *
 * <p>它指向另一台主机的共享目录，对使用者来说就是「远端」。</p>
 */
const UNC_LIKE = /^(?:\\\\|\/\/)[^\\/]+[\\/][^\\/]+/;

/**
 * 判断一个工作间路径是否指向远端。
 *
 * @param path 会话上的 workspacePath；空值表示「自动创建」，按本地处理
 * @returns 远端返回 true；本地、未设置、无法识别都返回 false
 */
export function isRemoteWorkspacePath(path?: string | null): boolean {
  const value = (path || '').trim();
  if (!value) return false;
  const lower = value.toLowerCase();
  if (REMOTE_SCHEMES.some((scheme) => lower.startsWith(scheme))) return true;
  if (SCP_LIKE.test(value)) return true;
  return UNC_LIKE.test(value);
}

/**
 * 取路径的最后一级作为显示名。
 *
 * <p>远端地址（{@code ssh://host/home/app}）与本地路径走同一规则：
 * 先统一分隔符再取最后一段，取不到就返回原值。</p>
 *
 * @param path 工作间路径
 * @returns 末级目录名；路径为空时返回空串
 */
export function workspaceFolderName(path?: string | null): string {
  const value = (path || '').trim();
  if (!value) return '';
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] || value;
}

/**
 * 远端路径里「哪台主机」。
 *
 * @param path 工作间路径
 * @returns 主机名 / 共享主机名；本地路径或解析不出时返回空串
 */
export function remoteWorkspaceHost(path?: string | null): string {
  const value = (path || '').trim();
  if (!value || !isRemoteWorkspacePath(value)) return '';
  const schemeMatch = /^[a-z0-9+.-]+:\/\/(?:[^@/]+@)?([^/:]+)/i.exec(value);
  if (schemeMatch) return schemeMatch[1] || '';
  const scpMatch = /^[^\s/\\@]+@([^\s/\\:]+):/i.exec(value);
  if (scpMatch) return scpMatch[1] || '';
  const uncMatch = /^(?:\\\\|\/\/)([^\\/]+)/.exec(value);
  if (uncMatch) return uncMatch[1] || '';
  return '';
}
