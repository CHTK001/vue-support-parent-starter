/**
 * ServerFilter 深度查看入口解析（共享）。
 *
 * 深度页面有两种来源，必须分开处理，否则在未挂载目标页的宿主应用里会死链：
 *   - node  —— 由插件自身的 HTTP 服务提供。典型是 FileStorageServerFilter 的 SYSTEM 布局：
 *              它在 {serverUrl}{bucket} 上直接返回 classpath static/index.html（Vue 独立构建），
 *              与宿主应用无关，新窗口直开节点地址即可，任何宿主都可用；
 *   - route —— 由宿主应用托管，必须先 router.resolve(path).matched.length 校验再跳。
 *
 * 调用点：ScServiceManage.vue / ScServerDetailDrawer.vue / ScServerFormDrawer.vue。
 */
import { getConfig } from '@repo/core';
import type { FilterTypeMeta, ServerFilterDescriptor, ServerNodeView } from '../api';

/**
 * 兜底桶名（与 pages/filesystem 的 filestorageApi DEFAULT_BUCKET 对齐）。
 * 仅在部署未配置 otherConfig.filestorage.bucket 时使用。
 */
const DEFAULT_BUCKET = 'local';

/**
 * 解析当前部署的主存储桶名。
 *
 * <p>桶名 = 容器中 FileStorage Bean 名，随部署而变（monitor 后端的本地桶叫
 * {@code localFileStorage}，而模板默认是 {@code local}）。此前写死 {@code local}，
 * 在 monitor 部署下「打开文件管理器」会落到一个不存在的桶（实测 404）。
 * 取值口径与 pages/filesystem 的 {@code resolveBucket} 一致：部署配置
 * {@code otherConfig.filestorage.bucket} 优先，{@link #DEFAULT_BUCKET} 只做兜底。</p>
 */
function resolveDefaultBucket(): string {
  try {
    const cfg = getConfig() as unknown as {
      other?: { filestorage?: { bucket?: string } };
    };
    return cfg?.other?.filestorage?.bucket || DEFAULT_BUCKET;
  } catch {
    return DEFAULT_BUCKET;
  }
}

/** 深度查看入口解析结果 */
export type FilterDetailTarget =
  | { kind: 'node'; url: string; label: string }
  | { kind: 'route'; path: string; label: string }
  | { kind: 'unavailable'; reason: string; label: string };

/** 该插件是否提供深度查看入口（用于按钮显隐） */
export function hasFilterDetail(
  meta: Pick<FilterTypeMeta, 'detailPage' | 'detailKind' | 'detailLabel'> | null | undefined,
): boolean {
  return resolveFilterDetail(meta, null, null) !== null;
}

/**
 * 解析某个过滤器实例的深度查看入口。
 *
 * @param meta   插件元数据
 * @param filter 该实例的过滤器配置（node 型用于取 bucket 等参数）
 * @param node   所属节点（node 型需要 serverUrl；表单态没有节点时传空）
 * @returns 解析结果；`null` 表示该插件没有深度查看入口
 */
export function resolveFilterDetail(
  meta: Pick<FilterTypeMeta, 'detailPage' | 'detailKind' | 'detailLabel'> | null | undefined,
  filter?: Pick<ServerFilterDescriptor, 'params'> | null,
  node?: Pick<ServerNodeView, 'serverUrl'> | null,
): FilterDetailTarget | null {
  if (!meta) return null;
  const label = meta.detailLabel || '查看详情';
  // 兼容后端旧版本：只给了 detailPage 时按 route 处理
  const kind = meta.detailKind ?? (meta.detailPage ? 'route' : undefined);

  if (kind === 'node') {
    const base = node?.serverUrl;
    if (!base) {
      return {
        kind: 'unavailable',
        reason: node
          ? '服务未运行，启动后即可打开该插件的深度页面'
          : '请先保存并启动服务，再从服务详情页打开该插件的深度页面',
        label,
      };
    }
    // 实例参数显式指定的 bucket 最高优先，其次部署配置的主桶，最后兜底 local
    const bucket = filter?.params?.bucket || resolveDefaultBucket();
    return { kind: 'node', url: joinUrl(normalizeHost(base), bucket), label };
  }

  if (kind === 'route' && meta.detailPage) {
    return { kind: 'route', path: meta.detailPage, label };
  }

  return null;
}

/** 拼接节点访问地址与路径，避免出现双斜杠 */
function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * `0.0.0.0` / `::` 表示「监听全部网卡」，是服务端写法；浏览器直开会打不开，
 * 统一换成回环地址。节点 host 留空时后端就按 `0.0.0.0` 生成 serverUrl。
 */
function normalizeHost(base: string): string {
  return base.replace(/\/\/(0\.0\.0\.0|\[::\]|::)(?=[:/]|$)/, '//127.0.0.1');
}
