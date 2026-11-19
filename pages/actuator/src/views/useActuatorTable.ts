/**
 * Actuator 表格页的共享「密度 + 分页」。
 *
 * <p>6 个海量行页签（loggers / mappings / beans / conditions / threaddump /
 * configprops）的数据形态不同，但排障动线一样：先过滤、再逐行扫、最后看某一行的细节。
 * 因此它们共用同一套表格底盘 —— 密度档位、首列固定、底部分页 —— 而不是各页各写一套。</p>
 *
 * <p>密度是**全页共享**的：在任何一页切成「舒适」，切到另一页仍是舒适。
 * 偏好写入 localStorage，刷新后保持；读不到（隐私模式 / 存储被禁用）就退回紧凑，
 * 不因为记不住偏好而把页面卡住。</p>
 *
 * @since 4.0.0.51
 */
import { computed, ref, watch, type Ref } from "vue";

/** 表格密度档位 */
export type ActuatorDensity = "compact" | "comfortable";

/** 密度偏好的存储键（与页签记忆分开：它跨页签生效） */
const DENSITY_STORAGE_KEY = "actuator:table-density";

/** 读取密度偏好：只认两个合法值，其余一律按紧凑处理 */
function readDensity(): ActuatorDensity {
  try {
    return localStorage.getItem(DENSITY_STORAGE_KEY) === "comfortable" ? "comfortable" : "compact";
  } catch {
    return "compact";
  }
}

/** 当前密度（模块级单例：6 个页面读的是同一个值） */
export const actuatorDensity = ref<ActuatorDensity>(readDensity());

/**
 * 切换密度并记住偏好。
 *
 * <p>写成函数而不是让模板直接赋值：`actuatorDensity` 是从模块导入的 ref，
 * 模板里直接赋值只会改到一个临时绑定，改不动响应式值。</p>
 */
export function setActuatorDensity(value: ActuatorDensity): void {
  actuatorDensity.value = value;
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, value);
  } catch {
    // 记住偏好不是必需能力：存储不可用时本次会话内照样生效
  }
}

/** ReTable 的 size：紧凑 = mini（28px 行），舒适 = small（34px 行） */
export const actuatorTableSize = computed<"mini" | "small">(() =>
  actuatorDensity.value === "compact" ? "mini" : "small",
);

/** 分页器返回值 */
export interface ActuatorPager<T> {
  /** 当前页（1 起） */
  page: Ref<number>;
  /** 每页条数 */
  pageSize: Ref<number>;
  /** 过滤后的总条数 */
  total: Ref<number>;
  /** 当前页的行 */
  pagedRows: Ref<T[]>;
  /** 回到第 1 页（过滤词变化时调用） */
  resetPage: () => void;
}

/**
 * 前端分页。
 *
 * <p>Actuator 端点本身不分页（一次返回全部 logger / bean），所以分页只在「已过滤的行」
 * 上切片：过滤范围仍是全量，不会出现「只搜到当前页」的假命中。数据变少（刷新后条目减少）
 * 时把页码收回有效范围，避免停在一页空白上。</p>
 *
 * @param rows            过滤后的全部行
 * @param defaultPageSize 每页条数（默认 50）
 */
export function useActuatorPager<T>(rows: Ref<T[]>, defaultPageSize = 50): ActuatorPager<T> {
  const page = ref(1);
  const pageSize = ref(defaultPageSize);
  const total = computed(() => rows.value.length);

  const pagedRows = computed<T[]>(() => {
    const start = (page.value - 1) * pageSize.value;
    return rows.value.slice(start, start + pageSize.value);
  });

  // 行数变化（过滤 / 刷新）可能让当前页越界：收回最后一页，不留在空白页上
  watch(total, (count) => {
    const last = Math.max(1, Math.ceil(count / pageSize.value));
    if (page.value > last) page.value = last;
  });

  // 改每页条数后从第 1 页重新看，避免「跳到一个内容完全不同的页」
  watch(pageSize, () => {
    page.value = 1;
  });

  return {
    page,
    pageSize,
    total,
    pagedRows,
    resetPage: () => {
      page.value = 1;
    },
  };
}
