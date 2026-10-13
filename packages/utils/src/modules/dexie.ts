/**
 * Dexie 对象存储封装（@repo/utils）
 *
 * <p>在 Dexie 之上补齐「对象封装」这一层：把 {@code IndexedDBStore}（indexeddb.ts）
 * 那套 put / get / getAll / remove / clear / keys 语义搬到 Dexie 上，
 * 同时把 Dexie 真正值钱的几件事开放出来——索引查询（where / orderBy / filter）、
 * 批量写入（bulkPut / bulkDelete）、局部更新（update）与事务。</p>
 *
 * <h3>什么时候用它，什么时候用 IndexedDBStore</h3>
 * <ul>
 *   <li>只按主键增删改查、单表单键：{@code IndexedDBStore} 就够，零依赖</li>
 *   <li>需要按时间/状态/分类等<b>非主键字段</b>检索、批量落库、多表原子写：用这里的 {@link DexieStore}</li>
 * </ul>
 *
 * <h3>对象模型</h3>
 * <ul>
 *   <li>{@link getDexieDatabase}：一个数据库 = 一张表集合，用声明式 stores 建表</li>
 *   <li>{@link DexieStore}：绑定其中一张表，业务侧只跟它打交道</li>
 *   <li>{@link useDexieStore}：Vue 侧响应式封装，写入后自动重查</li>
 * </ul>
 *
 * <h3>刷新订阅的边界（重要，别误用）</h3>
 * <p>{@link useDexieStore} 的自动刷新只覆盖<b>经由本封装</b>的写入
 * （put / putAll / update / remove / removeAll / clear / transaction）。
 * 绕过封装直接拿 {@link getDexieDatabase} 写库不会触发刷新——那是
 * dexie-observability 附加包的职责，本包不引入它。
 * 同理，<b>跨标签页</b>的变更互不可见（同库多标签同步需要 storagemutated 事件）。</p>
 *
 * @author CH
 * @since 2026/10
 */
import Dexie, {
  type Collection,
  type Dexie as DexieInstance,
  type IndexableType,
  type Table,
  type UpdateSpec,
} from "dexie";
import { tryOnUnmounted } from "@vueuse/core";
import { computed, ref, type ComputedRef, type Ref } from "vue";
import { log } from "./../log";

/** 记录约束：只要求有主键字段（与 indexeddb.ts 的 WithId 一致） */
export interface DexieEntity {
  /** 主键，与建表声明里的首项一致 */
  id: string | number;
}

/**
 * 建表声明：表名 → 索引声明串。
 *
 * <p>语法沿用 Dexie：首项为主键，其余为索引，{@code ++} 前缀表示自增，
 * {@code *} 表示多值，逗号分隔。例：</p>
 * <pre>{@code
 * { notes: "id,updatedAt", tags: "id,*tag" }
 * }</pre>
 */
export type DexieStoresDecl = Record<string, string>;

/** 数据库选项 */
export interface DexieOptions {
  /** 数据库名，默认 koi-home-db */
  dbName?: string;
  /** 版本号，默认 1；改版本需同步调整 stores 并（按需）写 upgrade */
  version?: number;
  /** 建表声明，默认单表 default 且主键为 id */
  stores?: DexieStoresDecl;
}

/** 单表封装选项 */
export interface DexieStoreOptions extends DexieOptions {
  /** 表名，默认 default（须出现在 stores 声明里） */
  tableName?: string;
}

const DEFAULT_DB = "koi-home-db";
const DEFAULT_STORE = "default";
const DEFAULT_VERSION = 1;

/* ==================== 变更通知总线 ==================== */

/** 变更监听器 */
type ChangeListener = () => void;

/** 变更订阅表：key 为 {@code dbName@tableName} */
const changeListeners = new Map<string, Set<ChangeListener>>();

/** 订阅键 */
function listenerKey(dbName: string, tableName: string): string {
  return `${dbName}@${tableName}`;
}

/**
 * 通知某张表的订阅者。
 *
 * <p>只在<b>写入已提交之后</b>调用，因此订阅者重查拿到的一定是新数据。
 * 单个订阅者抛异常不影响其它订阅者，更不影响写入结果。</p>
 */
function notifyChange(dbName: string, tableName: string): void {
  const listeners = changeListeners.get(listenerKey(dbName, tableName));
  if (!listeners) return;
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // 订阅者异常隔离：刷屏报错只会掩盖真正的写入结果
    }
  }
}

/** 订阅某张表经由封装的写入 */
function onChange(dbName: string, tableName: string, listener: ChangeListener): () => void {
  const key = listenerKey(dbName, tableName);
  let listeners = changeListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    changeListeners.set(key, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) {
      changeListeners.delete(key);
    }
  };
}

/* ==================== 数据库 ==================== */

/** 全局连接缓存：同名同版本共享一个连接（重入时复用） */
const dbCache = new Map<string, DexieInstance>();

/**
 * 连接缓存键：只按「库名 + 版本」。
 *
 * <p>表结构<b>不</b>参与键计算——同一个 IndexedDB 库在同一页面里只能有一个 Dexie 实例。
 * 两个实例各自 open 会互相撞版本协商/升级，Dexie 直接抛 UpgradeError；
 * 所以同库多表必须共用同一个实例，所有表声明写在<b>同一次</b> stores 里。</p>
 */
function cacheKeyOf(options: DexieOptions): string {
  return `${options.dbName ?? DEFAULT_DB}@${options.version ?? DEFAULT_VERSION}`;
}

/**
 * 判断当前环境是否可用 IndexedDB。
 *
 * <p>浏览器里 {@code indexedDB} 是 window 上的全局；Node（测试 / 装了 polyfill 的 SSR）
 * 下它是 globalThis 上的全局。两种都认。</p>
 */
export function hasIndexedDB(): boolean {
  return typeof indexedDB !== "undefined" && !!indexedDB;
}

/**
 * 取（或建）共享数据库实例。
 *
 * <p>声明式建表，等价于手写一个 Dexie 子类：
 * <pre>{@code
 * class AppDB extends Dexie {
 *   notes!: Table<Note, string>;
 *   constructor() {
 *     super("app-db");
 *     this.version(1).stores({ notes: "id,updatedAt" });
 *   }
 * }
 * }</pre>
 * 只是把参数化了，避免每个库都要写一个子类。</p>
 *
 * <p><b>为什么不返回子类类型</b>：Dexie 的 {@code transaction()} 形参里挂着
 * {@code TXWithTables<this>}——一个以多态 {@code this} 为键的巨型映射表。
 * 一旦把实例按「Dexie 子类声明类型」持有，这个映射表就得被完整展开，
 * 在本包（strict + 大量 {@code Table<T>} 实例化）里稳定触发
 * TS2589「实例化过深」，而且报错位置随检查顺序漂移，无法靠调整写法规避。
 * 因此这里统一按 Dexie 接口类型持有实例。</p>
 *
 * <p>同库多表场景应共用同一个实例：每张表一个 {@link DexieStore}，但都从同一个
 * 数据库取表，事务才能跨表。<b>一个库的全部表声明要写在同一次 stores 里</b>——
 * 连接按「库名 + 版本」缓存，后一次声明只做校验，不会补建表；声明不全时
 * 缺的表会以 {@link log.warn} 形式提前告警。</p>
 */
export function getDexieDatabase(options: DexieOptions = {}): DexieInstance {
  const key = cacheKeyOf(options);
  const cached = dbCache.get(key);
  if (cached) {
    warnIfSchemaDrift(cached, options);
    return cached;
  }
  const db: DexieInstance = new Dexie(options.dbName ?? DEFAULT_DB);
  db.version(options.version ?? DEFAULT_VERSION).stores(
    options.stores ?? { [DEFAULT_STORE]: "id" },
  );
  dbCache.set(key, db);
  return db;
}

/**
 * 表结构漂移告警。
 *
 * <p>同一个库名 + 版本已被先前的调用方建好，而这次声明的表不在里面——
 * 说明调用方以为自己在建表，实际被静默忽略了，后面 {@code db.table(name)}
 * 只会抛 NotFoundError。这里提前喊一声，别让人对着空表查半天。</p>
 */
function warnIfSchemaDrift(db: DexieInstance, options: DexieOptions): void {
  const requested = Object.keys(options.stores ?? {});
  if (requested.length === 0) return;
  const declared = new Set(db.tables.map((table) => table.name));
  const missing = requested.filter((name) => !declared.has(name));
  if (missing.length === 0) return;
  log.warn(
    `[dexie] 数据库 "${db.name}" 已由先前的调用方以 ${[...declared].join("/")} 建好，` +
      `本次声明的表 ${missing.join("/")} 不会生效。同库多表请把 stores 合并到同一处声明。`,
  );
}

/**
 * 关闭（并遗忘）一个数据库连接。
 *
 * <p>下次访问会重新 open。用于版本变更后强制重建，
 * 或 {@link deleteDexieDatabase} 前置的收尾。</p>
 */
export function closeDexieDatabase(name: string): void {
  for (const [key, db] of Array.from(dbCache.entries())) {
    if (db.name === name) {
      db.close();
      dbCache.delete(key);
    }
  }
}

/** 删除整个数据库（登出清号等场景）。会先关掉同名缓存连接，否则删除会被阻塞 */
export async function deleteDexieDatabase(name: string): Promise<void> {
  closeDexieDatabase(name);
  await Dexie.delete(name);
}

/* ==================== 单表对象封装 ==================== */

/** 索引取值：单值，或 IDBKeyRange 区间 */
export type DexieIndexValue = IDBValidKey | IDBKeyRange;

/**
 * 判断是否是 IDBKeyRange。
 *
 * <p>故意不用 {@code instanceof}：SSR / 跨 realm 下全局构造器不可靠。
 * IDBKeyRange 恒定带 {@code lower} / {@code upper} 两个属性（值可为 undefined），
 * 而 {@link IDBValidKey} 里唯一的对象型取值 {@code Date} 没有它们，据此区分足够稳。</p>
 */
function isKeyRange(value: DexieIndexValue): value is IDBKeyRange {
  return typeof value === "object" && value !== null && "lower" in value && "upper" in value;
}

/**
 * 把索引取值转成 Dexie 的 Collection。
 *
 * <p><b>为什么需要这一层</b>：Dexie 的 {@code where({index: value})} 只吃单值，
 * 传 range 会在请求阶段抛 {@code DataError}（实测 dexie 4.4.6 + fake-indexeddb，
 * {@code where({updatedAt: IDBKeyRange.bound(150, 350)})} 与
 * {@code where("updatedAt").equals(range)} 均报 DataError）。
 * 区间必须落到 {@code between} / {@code above} / {@code below} 系列上，这里做转换。</p>
 */
function collectionOfIndex<T extends DexieEntity>(
  table: Table<T, IDBValidKey>,
  index: string,
  value: DexieIndexValue,
): Collection<T, IDBValidKey, T> {
  const clause = table.where(index);
  if (!isKeyRange(value)) {
    // Dexie 把 equals() 的形参标成 IndexableType，而其中的数组型键被错写成
    // void[][]（丢了元素类型），合法的 IDBValidKey[] 过不了编译。
    // 这里按 IDBValidKey 收窄后再断言回去。
    return clause.equals(value as IndexableType);
  }
  const { lower, upper, lowerOpen, upperOpen } = value;
  if (lower !== undefined && upper !== undefined) {
    // 注意语义相反：IDBKeyRange 的 lowerOpen/upperOpen 表示「开」，
    // Dexie 的 between 第三、四参表示「包含」。直接传会把开闭区间反过来。
    return clause.between(lower, upper, !lowerOpen, !upperOpen);
  }
  if (lower !== undefined) {
    return lowerOpen ? clause.above(lower) : clause.aboveOrEqual(lower);
  }
  // upper 必然有界：IDBKeyRange 不可能上下界都没有
  return upperOpen ? clause.below(upper!) : clause.belowOrEqual(upper!);
}

/**
 * 表对象封装：对齐 {@code IndexedDBStore} 的语义，并开放 Dexie 的索引查询能力。
 *
 * @typeParam T 记录类型，须含主键字段 {@link DexieEntity.id}
 *
 * @example
 * ```ts
 * const notes = createDexieStore<Note>({
 *   dbName: "app-db",
 *   stores: { notes: "id,updatedAt,kind" },
 *   tableName: "notes",
 * });
 * await notes.put({ id: "1", title: "标题", updatedAt: Date.now(), kind: "todo" });
 * const recent = await notes.where("updatedAt", IDBKeyRange.bound(from, to)); // 索引区间查询
 * ```
 */
export class DexieStore<T extends DexieEntity = DexieEntity> {
  private readonly db: DexieInstance;
  private readonly tableName: string;

  constructor(options: DexieStoreOptions = {}) {
    if (!hasIndexedDB()) {
      throw new Error("[dexie] IndexedDB not available");
    }
    this.db = getDexieDatabase(options);
    this.tableName = options.tableName ?? DEFAULT_STORE;
  }

  /** 所属数据库（跨表事务、建表校验等场景用） */
  get database(): DexieInstance {
    return this.db;
  }

  /** 表名 */
  get table(): string {
    return this.tableName;
  }

  /** 表句柄：每次访问都从 db 取，避免缓存过期引用 */
  private get tableRef(): Table<T, IDBValidKey> {
    return this.db.table<T>(this.tableName) as Table<T, IDBValidKey>;
  }

  /** 写入一条记录（按主键 upsert，主键相同即覆盖） */
  async put(value: T): Promise<IDBValidKey> {
    const key = await this.tableRef.put(value);
    notifyChange(this.db.name, this.tableName);
    return key;
  }

  /**
   * 批量写入（单事务内 bulkPut，任一失败整体回滚）。
   *
   * <p><b>必须套显式事务</b>：裸调 {@code table.bulkPut()} 是非原子的——
   * 它自己会把失败的请求错误收进 {@code BulkError} 而不让事务中止，
   * 于是已成功的那几条照样落库（实测 dexie 4.4.6 + fake-indexeddb）。
   * 包一层 {@code db.transaction} 之后错误会传导到外层事务，整体回滚。</p>
   *
   * <p>注意：主键重复<b>不算</b>失败——bulkPut 是 upsert，同主键会覆盖。
   * 能触发回滚的是真正的写入失败（唯一索引冲突、配额超限等）。</p>
   */
  async putAll(values: T[]): Promise<void> {
    // tables 传表名字符串而不是 Table<T> 实例、回调参数显式标 unknown：
    // 都是为了绕开 Dexie 的 TXWithTables<this> 巨型映射表导致的 TS2589。
    await this.db.transaction("rw", this.tableName, async (_tx: unknown) => {
      await this.tableRef.bulkPut(values);
    });
    notifyChange(this.db.name, this.tableName);
  }

  /** 按主键读取 */
  async get(key: IDBValidKey): Promise<T | undefined> {
    return this.tableRef.get(key);
  }

  /** 批量按主键读取（缺记录的位置为 undefined，不抛错） */
  async bulkGet(keys: IDBValidKey[]): Promise<Array<T | undefined>> {
    return this.tableRef.bulkGet(keys);
  }

  /** 按索引精确取值，取第一条（索引须在 stores 声明里） */
  async getBy(index: string, value: IDBValidKey): Promise<T | undefined> {
    return this.tableRef.where({ [index]: value }).first();
  }

  /**
   * 按索引查询。
   *
   * <p>单值走 equals；传 {@link IDBKeyRange} 走区间（between / above / below），
   * 开闭区间按 range 自身的 {@code lowerOpen} / {@code upperOpen} 决定。</p>
   *
   * @example
   * ```ts
   * await notes.where("kind", "todo");                      // 单值
   * await notes.where("updatedAt", IDBKeyRange.bound(a, b)); // 闭区间 [a, b]
   * await notes.where("updatedAt", IDBKeyRange.lowerBound(a)); // >= a
   * ```
   */
  async where(index: string, value: DexieIndexValue): Promise<T[]> {
    return (await collectionOfIndex(this.tableRef, index, value)).toArray();
  }

  /** 按索引升序取全部 */
  async orderBy(index: string): Promise<T[]> {
    return this.tableRef.orderBy(index).toArray();
  }

  /**
   * 内存过滤（全表扫描后过滤）。
   *
   * <p>不走索引，数据量大时慢；能索引就别用它。</p>
   */
  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    return this.tableRef.filter(predicate).toArray();
  }

  /** 记录数 */
  async count(): Promise<number> {
    return this.tableRef.count();
  }

  /** 读取全部记录 */
  async getAll(): Promise<T[]> {
    return this.tableRef.toArray();
  }

  /** 主键列表 */
  async keys(): Promise<IDBValidKey[]> {
    return this.tableRef.toCollection().primaryKeys();
  }

  /** 局部更新（只改给定字段，不整条覆盖；返回受影响行数，0 表示没匹配到） */
  async update(key: IDBValidKey, changes: UpdateSpec<T>): Promise<number> {
    const updated = await this.tableRef.update(key, changes);
    notifyChange(this.db.name, this.tableName);
    return updated;
  }

  /** 按主键删除 */
  async remove(key: IDBValidKey): Promise<void> {
    await this.tableRef.delete(key);
    notifyChange(this.db.name, this.tableName);
  }

  /** 批量按主键删除（单事务） */
  async removeAll(keys: IDBValidKey[]): Promise<void> {
    await this.tableRef.bulkDelete(keys);
    notifyChange(this.db.name, this.tableName);
  }

  /** 清空当前表 */
  async clear(): Promise<void> {
    await this.tableRef.clear();
    notifyChange(this.db.name, this.tableName);
  }

  /**
   * 事务：把多步写入包成一个原子操作，提交后统一通知一次订阅者。
   *
   * <p>回调里拿到的是本表的 Dexie {@link Table}，用它写库会自动并入当前事务
   * （Dexie 按事务作用域归并）。<b>不要</b>在回调里调用本封装的 put/update 等方法——
   * 那些会各自开新事务或提前触发通知。</p>
   *
   * @example
   * ```ts
   * await store.transaction(async (table) => {
   *   await table.put(a);
   *   await table.delete(b.id);
   * });
   * ```
   */
  async transaction<R>(scope: (table: Table<T, IDBValidKey>) => Promise<R> | R): Promise<R> {
    // 回调参数必须显式标成 unknown，不能省、也不能标成 Transaction：
    // 交给 TS 推断会摊开 TXWithTables<this> 那张巨型映射表，触发 TS2589。
    const result = await this.db.transaction("rw", this.tableName, async (_tx: unknown) =>
      scope(this.tableRef),
    );
    notifyChange(this.db.name, this.tableName);
    return result;
  }

  /** 订阅本表<b>经由封装</b>的写入（返回取消订阅函数） */
  onChange(listener: () => void): () => void {
    return onChange(this.db.name, this.tableName, listener);
  }

  /** 显式打开连接：可在首屏提前触发，把建库错误暴露到加载期而非首次读写时 */
  async open(): Promise<DexieInstance> {
    return this.db.open();
  }
}

/** 工厂：创建单表对象封装 */
export function createDexieStore<T extends DexieEntity = DexieEntity>(
  options: DexieStoreOptions = {},
): DexieStore<T> {
  return new DexieStore<T>(options);
}

/* ==================== Vue 响应式封装 ==================== */

/** {@link useDexieStore} 的返回值 */
export interface DexieStoreRef<T extends DexieEntity = DexieEntity> {
  /** 查询结果（refresh 成功后更新） */
  items: Ref<T[]>;
  /** 是否正在查询 */
  loading: Ref<boolean>;
  /** 最近一次错误信息，空串表示无错误 */
  error: Ref<string>;
  /** 当前环境是否可用 IndexedDB（false 时 store 为 null，读写均为静默空操作） */
  available: ComputedRef<boolean>;
  /** 底层封装实例；不可用时为 null */
  store: DexieStore<T> | null;
  /** 重新执行查询 */
  refresh: () => Promise<void>;
  /** 写入一条记录 */
  save: (value: T) => Promise<void>;
  /** 局部更新一条记录 */
  update: (key: IDBValidKey, changes: UpdateSpec<T>) => Promise<void>;
  /** 按主键删除一条记录 */
  remove: (key: IDBValidKey) => Promise<void>;
  /** 清空整表 */
  clear: () => Promise<void>;
}

/**
 * Vue 侧响应式对象封装。
 *
 * <p>挂载时自动拉一次数据，之后本封装（同表）的任何写入都会触发重查。
 * 多个组件用同一张表时天然联动。</p>
 *
 * @param options 库/表配置，见 {@link DexieStoreOptions}
 * @param querier 自定义查询，默认取全表；可用来做索引过滤 / 排序 / 分页
 *
 * @example
 * ```ts
 * // 一个库的全部表声明写在同一处，多个 store 共享同一个连接
 * const APP_DB = { dbName: "app-db", stores: { notes: "id,updatedAt,kind" } };
 *
 * // 全表
 * const notes = useDexieStore<Note>({ ...APP_DB, tableName: "notes" });
 *
 * // 同表 + 自定义查询：只查待办
 * const todos = useDexieStore<Note>(
 *   { ...APP_DB, tableName: "notes" },
 *   (store) => store.where("kind", "todo"),
 * );
 * ```
 */
export function useDexieStore<T extends DexieEntity = DexieEntity>(
  options: DexieStoreOptions = {},
  querier?: (store: DexieStore<T>) => Promise<T[]>,
): DexieStoreRef<T> {
  const available = computed(() => hasIndexedDB());
  const store = available.value ? new DexieStore<T>(options) : null;
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref("");

  /** 刷新序号：只接受最后一次查询的结果，避免并发刷新互相覆盖 */
  let refreshSeq = 0;

  const runQuery = async (): Promise<void> => {
    if (!store) return;
    const seq = ++refreshSeq;
    loading.value = true;
    error.value = "";
    try {
      const next = await (querier ? querier(store) : store.getAll());
      if (seq !== refreshSeq) return; // 已有更新的刷新在跑，丢弃这次结果
      items.value = next;
    } catch (e) {
      if (seq !== refreshSeq) return;
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      if (seq === refreshSeq) loading.value = false;
    }
  };

  /** 写操作统一入口：执行后等刷新完成，调用方 await 完即可拿到新数据 */
  const mutate = async (action: () => Promise<unknown>): Promise<void> => {
    if (!store) return;
    try {
      await action();
      await runQuery();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  };

  if (store) {
    const unsubscribe = store.onChange(() => {
      void runQuery();
    });
    tryOnUnmounted(() => unsubscribe());
    void runQuery();
  }

  return {
    items,
    loading,
    error,
    available,
    store,
    refresh: runQuery,
    save: (value: T) => mutate(() => store!.put(value)),
    update: (key: IDBValidKey, changes: UpdateSpec<T>) => mutate(() => store!.update(key, changes)),
    remove: (key: IDBValidKey) => mutate(() => store!.remove(key)),
    clear: () => mutate(() => store!.clear()),
  };
}
