/**
 * 媒体资源分类统计的聚合逻辑（纯函数，不依赖 Vue / 接口 / 浏览器环境）。
 *
 * <p>为什么要单独抽出来：页面只负责「怎么画」，这里负责「怎么算」。
 * 统计口径是本需求的核心争议点 —— 分类表必须<b>完整列出全部分类</b>，
 * 有多少类就出多少行，不能只显示一行。把它做成无副作用的纯函数，
 * 就可以脱离浏览器直接验收（见 test/media/media-statistics-accept.mjs），
 * 不用为了验一条「行数够不够」去把整个控制台跑起来。</p>
 *
 * <p>口径约定（三条，都是「宁多勿少」）：</p>
 * <ol>
 *   <li><b>媒体类型</b>：图片 / 视频两类<b>恒定存在</b>（无数据时为 0），
 *       库里出现了顺序表之外的类型也照样追加，绝不丢。</li>
 *   <li><b>任务状态</b>：PENDING / RUNNING / SUCCESS / FAILED / CANCELED
 *       五种<b>恒定存在</b>（无数据时 0）—— 这是「不只显示一行」的兜底：
 *       即使某次统计只有失败记录，状态表也是五行，而不是孤零零一行。</li>
 *   <li><b>模型</b>：按出现过的模型全量列出，按数量降序；不截断、不分页、
 *       不取 Top N。模型名为空归入「未知模型」。</li>
 * </ol>
 *
 * <p>所有比率都以<b>本组数据的任务总数</b>为分母，不做二次四舍五入取整，
 * 由渲染层决定保留方式，避免「比率加起来不等于 100%」的解释成本。</p>
 */

/** 媒体类型分类的固定顺序（缺项补 0，顺序即页面展示顺序） */
export const MEDIA_TYPE_ORDER = ['image', 'video'] as const;

/** 媒体类型的中文名（新增类型时必须同步补，否则页面会回退显示原始标识） */
export const MEDIA_TYPE_LABELS: Record<string, string> = {
  image: '图片',
  video: '视频',
};

/** 任务状态分类的固定顺序（缺项补 0） */
export const MEDIA_STATUS_ORDER = ['SUCCESS', 'FAILED', 'RUNNING', 'PENDING', 'CANCELED'] as const;

/** 任务状态的中文名 */
export const MEDIA_STATUS_LABELS: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  RUNNING: '生成中',
  PENDING: '排队中',
  CANCELED: '已取消',
};

/** 模型名缺失时的归并标签 */
export const UNKNOWN_MODEL_LABEL = '未知模型';

/**
 * 一个分类行。
 *
 * <p>{@code ratio} 是 0~1 的小数（不是百分比字符串），渲染层自行决定画多宽的条、
 * 保留几位小数 —— 聚合层不参与表现层决策。</p>
 */
export interface CategoryRow {
  /** 分类标识（媒体类型标识 / 状态码 / 模型名），用于 key 与排错 */
  key: string;
  /** 展示用名称（中文名或模型名原文） */
  label: string;
  /** 该分类下的任务数 */
  count: number;
  /** 占任务总数的比例，0~1；总数为 0 时为 0（不是 NaN） */
  ratio: number;
  /** 是否属于「固定分类」（true = 顺序表内，false = 数据里多出来的未知分类） */
  known: boolean;
}

/** 页面顶部读数 */
export interface MediaStatisticsKpi {
  success: number;
  failed: number;
  running: number;
  canceled: number;
}

/** 聚合结果：一份数据，四个视角 */
export interface MediaStatistics {
  /** 参与统计的任务总数 */
  total: number;
  /** 顶部读数 */
  kpi: MediaStatisticsKpi;
  /** 按媒体类型（图片 / 视频两类恒定存在） */
  byType: CategoryRow[];
  /** 按任务状态（五种状态恒定存在） */
  byStatus: CategoryRow[];
  /** 按模型（全量，按数量降序） */
  byModel: CategoryRow[];
}

/**
 * 参与聚合的最小任务视图。
 *
 * <p>只声明用到的三个字段，且都允许缺省：历史数据里这三个字段都可能为空
 * （早期入库没有 provider/model，状态字段也有过空值），聚合层必须能兜住。</p>
 */
export interface MediaStatisticsTask {
  type?: string | null;
  status?: string | null;
  model?: string | null;
}

/**
 * 以任务总数为分母算比例；总数为 0 时返回 0（避免 NaN 传到样式里）。
 *
 * @param count 该分类计数
 * @param total 任务总数
 */
function ratioOf(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

/**
 * 按固定顺序表聚合并补 0；数据里出现顺序表之外的值时追加在尾部。
 *
 * <p>这是三个维度共用的实现：顺序表保证「固定分类恒在」，尾部追加保证
 * 「未知分类不丢」—— 两者加起来才是「完整列出全部分类」。</p>
 *
 * @param tasks 任务列表
 * @param pick 取该维度的原始值
 * @param order 固定顺序表
 * @param labels 固定分类的展示名
 * @param fallback 原始值为空时的归并值（如「未知模型」）
 * @return 分类行数组：顺序表优先，其后是数据里的未知分类（按数量降序）
 */
function groupBy(
  tasks: readonly MediaStatisticsTask[],
  pick: (task: MediaStatisticsTask) => string,
  order: readonly string[],
  labels: Record<string, string>,
  fallback: string,
): CategoryRow[] {
  const counts = new Map<string, number>();
  for (const key of order) {
    counts.set(key, 0);
  }
  for (const task of tasks) {
    const raw = pick(task);
    const key = raw && raw.trim() ? raw.trim() : fallback;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = tasks.length;
  const rows: CategoryRow[] = [];
  // 固定分类：恒定输出（含 0），顺序由顺序表决定
  for (const key of order) {
    rows.push({
      key,
      label: labels[key] ?? key,
      count: counts.get(key) ?? 0,
      ratio: ratioOf(counts.get(key) ?? 0, total),
      known: true,
    });
  }
  // 未知分类：数据里多出来的值全部追加，按数量降序、同数量按名称升序（结果稳定）
  const extras = [...counts.entries()]
    .filter(([key]) => !order.includes(key))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [key, count] of extras) {
    rows.push({
      key,
      label: labels[key] ?? key,
      count,
      ratio: ratioOf(count, total),
      known: false,
    });
  }
  return rows;
}

/**
 * 把生成任务列表聚合成分类统计。
 *
 * <p>纯函数：同样的输入永远得到同样的输出，不读时间、不读全局、不改入参。
 * 页面把接口数据丢进来即可；验收脚本可以喂构造数据把各种边界一次性断言掉。</p>
 *
 * @param tasks 生成任务列表（可为空数组）
 * @return 分类统计结果（三个维度都保证「分类完整」）
 */
export function buildMediaStatistics(tasks: readonly MediaStatisticsTask[]): MediaStatistics {
  const list = tasks ?? [];
  const total = list.length;

  let success = 0;
  let failed = 0;
  let running = 0;
  let canceled = 0;
  for (const task of list) {
    const status = (task.status ?? '').trim().toUpperCase();
    if (status === 'SUCCESS') {
      success += 1;
    } else if (status === 'FAILED') {
      failed += 1;
    } else if (status === 'RUNNING' || status === 'PENDING') {
      // 「生成中」把排队中和生成中合并：两者对用户是同一件事——还没出结果
      running += 1;
    } else if (status === 'CANCELED') {
      canceled += 1;
    }
  }

  // 模型维度不设固定分类：有多少种模型就列多少行，只把空模型名归并
  const byModel = (() => {
    const counts = new Map<string, number>();
    for (const task of list) {
      const raw = task.model;
      const key = raw && raw.trim() ? raw.trim() : UNKNOWN_MODEL_LABEL;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key, count]) => ({
        key,
        label: key,
        count,
        ratio: ratioOf(count, total),
        known: true,
      }));
  })();

  return {
    total,
    kpi: { success, failed, running, canceled },
    byType: groupBy(list, (task) => task.type ?? '', MEDIA_TYPE_ORDER, MEDIA_TYPE_LABELS, '未知类型'),
    byStatus: groupBy(
      list,
      (task) => (task.status ?? '').toUpperCase(),
      MEDIA_STATUS_ORDER,
      MEDIA_STATUS_LABELS,
      '未知状态',
    ),
    byModel,
  };
}

/**
 * 分类行里「有数据的」条数（0 的不算）。
 *
 * <p>页面用它显示「共 N 类，其中 M 类有数据」，让「完整列出」与
 * 「有几类真的出现了」一眼可分，避免读的人以为空白行是渲染错误。</p>
 *
 * @param rows 分类行数组
 */
export function countNonEmpty(rows: readonly CategoryRow[]): number {
  return rows.filter((row) => row.count > 0).length;
}
