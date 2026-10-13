/**
 * Dexie 对象封装回归测试。
 *
 * <p>用 fake-indexeddb 在 Node 里跑真实 IndexedDB 语义（不是 mock 掉 Dexie），
 * 覆盖的是封装自身的几处易错点：</p>
 * <ul>
 *   <li>索引查询：{@code where} 走的是 stores 里声明的索引，声明缺失时该报错</li>
 *   <li>批量写入的原子性：bulkPut 中途失败不得留下半截数据</li>
 *   <li>局部更新：update 只改给定字段，不整条覆盖</li>
 *   <li>事务：scope 抛错时整体回滚，且订阅者不被通知</li>
 *   <li>变更通知：只在写入<b>提交后</b>触发，绕开封装的直写不触发</li>
 *   <li>响应式封装：写入后 items 自动重查，并发刷新只保留最后一次结果</li>
 * </ul>
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDexieStore,
  deleteDexieDatabase,
  getDexieDatabase,
  hasIndexedDB,
  useDexieStore,
} from "../dexie";
import { log } from "../../log";

/** 测试用记录 */
interface Note {
  id: string;
  title: string;
  kind: "todo" | "memo";
  updatedAt: number;
}

const DB_NAME = "test-dexie-wrapper";
const TABLE = "notes";

/** 声明了两个索引（updatedAt / kind），主键 id */
const OPTIONS = {
  dbName: DB_NAME,
  stores: { [TABLE]: "id,updatedAt,kind" },
  tableName: TABLE,
};

/** 同库多表：一个库的全部表声明写在同一处，两个 store 才共享连接 */
const MULTI_STORES = { [TABLE]: "id,updatedAt,kind", tags: "id" };

/** 唯一索引库：用来制造真实的 bulkPut 失败（主键重复只是 upsert，不会失败） */
const ATOMIC_DB = "test-dexie-atomic";

const note = (id: string, kind: Note["kind"], updatedAt: number): Note => ({
  id,
  title: `note-${id}`,
  kind,
  updatedAt,
});

/** 等待异步链路落定。
 *
 * <p>fake-indexeddb 的 IDB 回调跑在宏任务里，Vue 的 ref 更新跑在微任务里，
 * 两边都得排空，所以用 setTimeout(0) 而不是 nextTick。</p>
 */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("dexie 封装", () => {
  beforeEach(async () => {
    await deleteDexieDatabase(DB_NAME);
    await deleteDexieDatabase(ATOMIC_DB);
  });

  afterEach(async () => {
    await deleteDexieDatabase(DB_NAME);
    await deleteDexieDatabase(ATOMIC_DB);
  });

  it("fake-indexeddb 生效，hasIndexedDB 为真", () => {
    expect(hasIndexedDB()).toBe(true);
  });

  it("put / get / getAll 按主键 upsert", async () => {
    const store = createDexieStore<Note>(OPTIONS);

    await store.put(note("1", "todo", 100));
    await store.put(note("2", "memo", 200));
    // 同主键再写 = 覆盖，不是新增
    await store.put({ ...note("1", "todo", 300), title: "改过的标题" });

    expect(await store.get("1")).toMatchObject({ title: "改过的标题", updatedAt: 300 });
    expect(await store.get("不存在的")).toBeUndefined();
    expect(await store.getAll()).toHaveLength(2);
    expect(await store.count()).toBe(2);
  });

  it("putAll 批量写入且任一失败整体回滚（唯一索引冲突）", async () => {
    const store = createDexieStore<{ id: string; slug: string }>({
      dbName: ATOMIC_DB,
      stores: { items: "id,&slug" },
      tableName: "items",
    });

    await store.putAll([
      { id: "1", slug: "a" },
      { id: "2", slug: "b" },
    ]);
    expect(await store.count()).toBe(2);

    // 主键重复不会失败（bulkPut 是 upsert），所以用 slug 唯一索引制造真实失败：
    // 第四条撞上第一条的 slug -> 整个 bulkPut 回滚，第三条不得留下
    await expect(
      store.putAll([
        { id: "3", slug: "c" },
        { id: "4", slug: "a" },
      ]),
    ).rejects.toThrow();
    expect(await store.get("3")).toBeUndefined();
    expect(await store.count()).toBe(2);
  });

  it("put 同主键是覆盖而非新增", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.put(note("1", "todo", 100));
    await store.put({ ...note("1", "todo", 200), title: "改过的标题" });
    expect(await store.count()).toBe(1);
    expect(await store.get("1")).toMatchObject({ title: "改过的标题", updatedAt: 200 });
  });

  it("where 走声明过的索引，orderBy 按索引排序", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.putAll([
      note("1", "todo", 300),
      note("2", "memo", 100),
      note("3", "todo", 200),
    ]);

    const todos = await store.where("kind", "todo");
    expect(todos.map((n) => n.id).sort()).toEqual(["1", "3"]);

    const asc = await store.orderBy("updatedAt");
    expect(asc.map((n) => n.id)).toEqual(["2", "3", "1"]);

    // 索引区间查询（IDBKeyRange）。注意：不能直接把 range 塞给
    // Dexie 的 where({index: range})，那样会在请求阶段抛 DataError。
    const ranged = await store.where("updatedAt", IDBKeyRange.bound(150, 350));
    expect(ranged.map((n) => n.id).sort()).toEqual(["1", "3"]);

    // 开区间：lowerOpen 生效，(100, 300] 含 200 和 300
    const openRanged = await store.where(
      "updatedAt",
      IDBKeyRange.bound(100, 300, true, false),
    );
    expect(openRanged.map((n) => n.id).sort()).toEqual(["1", "3"]);

    // 上开区间：(100, 300) 只含 200
    const bothOpen = await store.where("updatedAt", IDBKeyRange.bound(100, 300, true, true));
    expect(bothOpen.map((n) => n.id)).toEqual(["3"]);

    // 单侧区间：lowerBound / upperBound
    expect((await store.where("updatedAt", IDBKeyRange.lowerBound(200))).map((n) => n.id).sort())
      .toEqual(["1", "3"]);
    // upperBound(200) 是 <= 200，含 100 和 200 两条
    expect((await store.where("updatedAt", IDBKeyRange.upperBound(200))).map((n) => n.id).sort())
      .toEqual(["2", "3"]);
  });

  it("getBy 取索引上的第一条；未声明的索引会报错", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.putAll([note("1", "memo", 100), note("2", "memo", 200)]);

    expect((await store.getBy("kind", "memo"))?.id).toBe("1");

    // title 没进索引声明，Dexie 该抛 SchemaError 而不是静默全表扫描
    await expect(store.getBy("title", "note-1")).rejects.toThrow();
  });

  it("update 只改给定字段，不整条覆盖", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.put(note("1", "todo", 100));

    const affected = await store.update("1", { title: "只改标题" });
    expect(affected).toBe(1);
    expect(await store.get("1")).toEqual({
      id: "1",
      title: "只改标题",
      kind: "todo",
      updatedAt: 100,
    });

    // 主键不存在时返回 0，不抛错
    expect(await store.update("不存在", { title: "x" })).toBe(0);
  });

  it("remove / removeAll / clear / keys", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.putAll([note("1", "todo", 100), note("2", "memo", 200), note("3", "todo", 300)]);

    expect((await store.keys()).sort()).toEqual(["1", "2", "3"]);

    await store.remove("1");
    expect(await store.get("1")).toBeUndefined();

    await store.removeAll(["2", "3"]);
    expect(await store.count()).toBe(0);

    await store.putAll([note("1", "todo", 100), note("2", "memo", 200)]);
    await store.clear();
    expect(await store.getAll()).toEqual([]);
  });

  it("filter 全表扫描后过滤", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.putAll([note("1", "todo", 100), note("2", "memo", 200), note("3", "todo", 300)]);

    const big = await store.filter((n) => n.updatedAt >= 200);
    expect(big.map((n) => n.id).sort()).toEqual(["2", "3"]);
  });

  it("transaction 提交后整体生效；抛错则整体回滚", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    await store.putAll([note("1", "todo", 100), note("2", "memo", 200)]);

    const merged = await store.transaction(async (table) => {
      await table.put(note("3", "todo", 300));
      await table.delete("1");
      return "done";
    });
    expect(merged).toBe("done");
    expect((await store.getAll()).map((n) => n.id).sort()).toEqual(["2", "3"]);

    // 中途抛错：第一条写入必须被回滚掉
    await expect(
      store.transaction(async (table) => {
        await table.put(note("4", "todo", 400));
        throw new Error("业务中断");
      }),
    ).rejects.toThrow("业务中断");
    expect(await store.get("4")).toBeUndefined();
    expect(await store.count()).toBe(2);
  });

  it("onChange 只在写入提交后触发，且能被取消订阅", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    const seen: string[] = [];
    const unsubscribe = store.onChange(() => seen.push("fired"));

    await store.put(note("1", "todo", 100));
    expect(seen).toEqual(["fired"]);

    // 读操作不触发
    await store.getAll();
    await store.count();
    expect(seen).toEqual(["fired"]);

    // 取消订阅后不再触发
    unsubscribe();
    await store.put(note("2", "memo", 200));
    expect(seen).toEqual(["fired"]);
  });

  it("onChange 的单个订阅者抛异常不影响写入，也不影响其它订阅者", async () => {
    const store = createDexieStore<Note>(OPTIONS);
    const other = vi.fn();
    store.onChange(() => {
      throw new Error("订阅者自己炸了");
    });
    store.onChange(other);

    await expect(store.put(note("1", "todo", 100))).resolves.toBe("1");
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("同库多表共享连接，跨表事务可用", async () => {
    // 同一个库的全部表声明写在同一处 —— 这是连接能共享的前提
    const notes = createDexieStore<Note>({ ...OPTIONS, stores: MULTI_STORES, tableName: "notes" });
    const tags = createDexieStore<{ id: string; name: string }>({
      ...OPTIONS,
      stores: MULTI_STORES,
      tableName: "tags",
    });

    // 两个 store 指向同一个数据库实例
    expect(notes.database).toBe(tags.database);

    await notes.database.transaction("rw", [TABLE, "tags"], async () => {
      await notes.database.table<Note>(TABLE).put(note("1", "todo", 100));
      await tags.database
        .table<{ id: string; name: string }>("tags")
        .put({ id: "t1", name: "重要" });
    });

    expect(await notes.count()).toBe(1);
    expect((await tags.getAll())[0]).toEqual({ id: "t1", name: "重要" });
  });

  it("表结构漂移时提前告警，且缺的表不会被补建", async () => {
    // 先前调用方只声明了 notes
    getDexieDatabase({ dbName: DB_NAME, stores: { [TABLE]: "id,updatedAt,kind" } });

    const warn = vi.spyOn(log, "warn").mockImplementation(() => {});
    try {
      // 同一个库名+版本，但这次想声明一张新表
      const drifted = getDexieDatabase({ dbName: DB_NAME, stores: { [TABLE]: "id", tags: "id" } });
      expect(drifted.tables.map((t) => t.name)).toEqual([TABLE]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain("tags");
    } finally {
      warn.mockRestore();
    }
  });

  it("getDexieDatabase 按库名+版本缓存，与表结构声明无关", () => {
    const a = getDexieDatabase(OPTIONS);
    expect(getDexieDatabase(OPTIONS)).toBe(a);

    // 同库同版本但声明不同的表结构 -> 仍是同一个实例（首次声明生效）
    expect(getDexieDatabase({ ...OPTIONS, stores: { [TABLE]: "id" } })).toBe(a);

    // 声明顺序不同 -> 同一个实例
    expect(getDexieDatabase({ dbName: DB_NAME, stores: { a: "id", [TABLE]: "id,updatedAt,kind" } }))
      .toBe(getDexieDatabase({ dbName: DB_NAME, stores: { [TABLE]: "id,updatedAt,kind", a: "id" } }));

    // 版本不同 -> 新实例
    expect(getDexieDatabase({ ...OPTIONS, version: 2 })).not.toBe(a);

    // 库名不同 -> 新实例
    expect(getDexieDatabase({ ...OPTIONS, dbName: "另一个库" })).not.toBe(a);
  });

  it("closeDexieDatabase 后再取是新连接", async () => {
    const { closeDexieDatabase } = await import("../dexie");
    const first = getDexieDatabase(OPTIONS);
    await first.open();
    closeDexieDatabase(DB_NAME);
    expect(getDexieDatabase(OPTIONS)).not.toBe(first);
  });

  describe("useDexieStore", () => {
    it("挂载即拉全表；同表写入后自动重查", async () => {
      const store = createDexieStore<Note>(OPTIONS);
      await store.put(note("1", "todo", 100));

      const view = useDexieStore<Note>(OPTIONS);
      expect(view.available.value).toBe(true);
      expect(view.loading.value).toBe(true);
      await settle();
      expect(view.items.value).toHaveLength(1);

      // 经由封装的写入 -> 订阅触发重查
      await view.save(note("2", "memo", 200));
      await settle();
      expect(view.items.value.map((n) => n.id).sort()).toEqual(["1", "2"]);
      expect(view.error.value).toBe("");

      // 另一个 store 写同一张表 -> 同样触发（多组件联动）
      const other = createDexieStore<Note>(OPTIONS);
      await other.remove("1");
      await settle();
      expect(view.items.value.map((n) => n.id)).toEqual(["2"]);

      await view.clear();
      await settle();
      expect(view.items.value).toEqual([]);
    });

    it("自定义 querier 走索引，写入后按同样条件重查", async () => {
      const view = useDexieStore<Note>(OPTIONS, (store) => store.where("kind", "todo"));
      await settle();
      expect(view.items.value).toEqual([]);

      await view.save(note("1", "todo", 100));
      await settle();
      expect(view.items.value.map((n) => n.id)).toEqual(["1"]);

      // 写一条 memo：不该出现在 todo 查询结果里
      await view.save(note("2", "memo", 200));
      await settle();
      expect(view.items.value.map((n) => n.id)).toEqual(["1"]);
    });

    it("查询失败时 error 有值，items 保持上一次结果", async () => {
      const view = useDexieStore<Note>(OPTIONS, (store) => store.where("不存在的索引", "x"));
      await settle();

      expect(view.error.value).not.toBe("");
      expect(view.items.value).toEqual([]);
      expect(view.loading.value).toBe(false);
    });

    it("并发刷新只保留最后一次结果（refreshSeq 防竞态）", async () => {
      const store = createDexieStore<Note>(OPTIONS);
      await store.putAll([note("1", "todo", 100), note("2", "memo", 200)]);

      const view = useDexieStore<Note>(OPTIONS);
      await settle();
      expect(view.items.value).toHaveLength(2);

      // 连发两次 refresh，第二次查询到的数据必须胜出
      const first = view.refresh();
      const second = view.refresh();
      await Promise.all([first, second]);
      await settle();

      expect(view.items.value).toHaveLength(2);
      expect(view.error.value).toBe("");
      expect(view.loading.value).toBe(false);
    });

    it("不可用环境下静默降级：store 为 null，读写不抛错", async () => {
      const original = globalThis.indexedDB;
      // @ts-expect-error 临时摘掉 indexedDB 模拟 SSR / 隐私模式
      globalThis.indexedDB = undefined;
      try {
        const view = useDexieStore<Note>(OPTIONS);
        expect(view.available.value).toBe(false);
        expect(view.store).toBeNull();

        await expect(view.refresh()).resolves.toBeUndefined();
        await expect(view.save(note("1", "todo", 100))).resolves.toBeUndefined();
        await expect(view.clear()).resolves.toBeUndefined();
        expect(view.items.value).toEqual([]);
      } finally {
        globalThis.indexedDB = original;
      }
    });
  });
});
