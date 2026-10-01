/**
 * 深度查看入口解析门禁。
 *
 * 这里的行为差异对用户是「按钮点了打不开 / 打开了死链」，而编译与构建全绿，
 * 所以必须逐条钉住。三类易错点：
 *
 *   1. `0.0.0.0` / `::` 是服务端写法，浏览器直开必然失败。列表里「访问地址」
 *      一栏显示的就是 0.0.0.0（实测 fs-demo 显示 http://0.0.0.0:19080/），
 *      深度页面若不归一，用户点「打开文件管理器」得到的是打不开的地址。
 *   2. node 型入口在服务未运行、或处于表单态（还没有节点）时，必须给出
 *      **可区分的** 两种提示，而不是笼统一句「打不开」。
 *   3. bucket 缺省必须是 local——与 pages/filesystem 的 DEFAULT_BUCKET 对齐，
 *      拼错会打开到一个不存在的桶，页面表现为 404。
 */
import { describe, expect, it } from "vitest";
import {
  hasFilterDetail,
  resolveFilterDetail,
  type FilterDetailTarget,
} from "../utils/filterDetail";

/** node 型元数据（FileStorageServerFilter 的形态：detailKind=node，无 detailPage） */
const nodeMeta = {
  detailKind: "node" as const,
  detailLabel: "打开文件管理器",
};

/** route 型元数据（宿主应用托管的形态） */
const routeMeta = {
  detailPage: "/system/filesystem",
  detailKind: "route" as const,
  detailLabel: "查看详情",
};

/** 完全没有深度入口的元数据（三个字段都可缺省） */
const noDetailMeta = { detailKind: undefined, detailLabel: "" };

describe("resolveFilterDetail 基础判定", () => {
  it("meta 为空返回 null（按钮不显示）", () => {
    expect(resolveFilterDetail(null)).toBeNull();
    expect(resolveFilterDetail(undefined)).toBeNull();
  });

  it("既无 detailKind 也无 detailPage 返回 null", () => {
    expect(resolveFilterDetail(noDetailMeta)).toBeNull();
  });

  it("只有 detailPage 时按 route 处理（兼容后端旧版本）", () => {
    const t = resolveFilterDetail({
      detailPage: "/system/filesystem",
      detailKind: undefined,
      detailLabel: "",
    });
    expect(t).toEqual({ kind: "route", path: "/system/filesystem", label: "查看详情" });
  });

  it("detailLabel 为空时用兜底文案", () => {
    const t = resolveFilterDetail({
      detailPage: "/system/filesystem",
      detailKind: "route",
      detailLabel: "",
    });
    expect(t?.label).toBe("查看详情");
  });
});

describe("route 型入口", () => {
  it("返回宿主路由路径，不拼节点地址", () => {
    expect(resolveFilterDetail(routeMeta)).toEqual({
      kind: "route",
      path: "/system/filesystem",
      label: "查看详情",
    });
  });
});

describe("node 型入口的不可用分支", () => {
  it("有节点但服务未运行（serverUrl 为空）→ 提示启动后可用", () => {
    const t = resolveFilterDetail(nodeMeta, null, { serverUrl: "" });
    expect(t?.kind).toBe("unavailable");
    expect((t as Extract<FilterDetailTarget, { kind: "unavailable" }>).reason).toContain(
      "启动后即可打开",
    );
  });

  it("表单态（根本没有节点）→ 提示先保存并启动（与上一种必须可区分）", () => {
    const t = resolveFilterDetail(nodeMeta, null, null);
    expect(t?.kind).toBe("unavailable");
    const reason = (t as Extract<FilterDetailTarget, { kind: "unavailable" }>).reason;
    expect(reason).toContain("请先保存并启动服务");
    expect(reason).not.toContain("启动后即可打开");
  });

  it("不可用时按钮仍然显示（hasFilterDetail 为 true）——点了要能解释，而不是按钮消失", () => {
    expect(hasFilterDetail(nodeMeta)).toBe(true);
  });
});

describe("node 型入口的 URL 拼装", () => {
  it("用节点的 serverUrl 加桶名", () => {
    const t = resolveFilterDetail(nodeMeta, { params: { bucket: "media" } }, {
      serverUrl: "http://127.0.0.1:19080",
    });
    expect(t).toEqual({
      kind: "node",
      url: "http://127.0.0.1:19080/media",
      label: "打开文件管理器",
    });
  });

  it("bucket 缺省用 local（与 pages/filesystem 的 DEFAULT_BUCKET 对齐）", () => {
    const t = resolveFilterDetail(nodeMeta, { params: {} }, {
      serverUrl: "http://127.0.0.1:19080",
    });
    expect(t?.kind === "node" && t.url).toBe("http://127.0.0.1:19080/local");
  });

  it("filter 为 null 时同样落到 local，不抛错", () => {
    const t = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://127.0.0.1:19080" });
    expect(t?.kind === "node" && t.url).toBe("http://127.0.0.1:19080/local");
  });

  it("0.0.0.0 归一为 127.0.0.1（浏览器打不开监听全部网卡的写法）", () => {
    const t = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://0.0.0.0:19080" });
    expect(t?.kind === "node" && t.url).toBe("http://127.0.0.1:19080/local");
  });

  it("[::] 与 :: 同样归一", () => {
    const v6 = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://[::]:19080" });
    expect(v6?.kind === "node" && v6.url).toBe("http://127.0.0.1:19080/local");
    const bare = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://::" });
    expect(bare?.kind === "node" && bare.url).toBe("http://127.0.0.1/local");
  });

  it("host 为 0.0.0.0 且位于末尾（无端口无路径）也能归一", () => {
    const t = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://0.0.0.0" });
    expect(t?.kind === "node" && t.url).toBe("http://127.0.0.1/local");
  });

  it("不以 : 或 / 结尾的相似主机名不被误改（归一不能连坐）", () => {
    const t = resolveFilterDetail(nodeMeta, null, { serverUrl: "http://0.0.0.0x:19080" });
    expect(t?.kind === "node" && t.url).toBe("http://0.0.0.0x:19080/local");
  });

  it("base 结尾斜杠与桶名开头斜杠都被吸收，拼不出双斜杠", () => {
    const a = resolveFilterDetail(nodeMeta, { params: { bucket: "media" } }, {
      serverUrl: "http://127.0.0.1:19080/",
    });
    expect(a?.kind === "node" && a.url).toBe("http://127.0.0.1:19080/media");

    const b = resolveFilterDetail(nodeMeta, { params: { bucket: "/media" } }, {
      serverUrl: "http://127.0.0.1:19080",
    });
    expect(b?.kind === "node" && b.url).toBe("http://127.0.0.1:19080/media");
  });
});

describe("hasFilterDetail 与解析结果同源", () => {
  it("node 型与 route 型为 true，无入口的为 false", () => {
    expect(hasFilterDetail(nodeMeta)).toBe(true);
    expect(hasFilterDetail(routeMeta)).toBe(true);
    expect(hasFilterDetail(noDetailMeta)).toBe(false);
    expect(hasFilterDetail(null)).toBe(false);
    expect(hasFilterDetail(undefined)).toBe(false);
  });
});