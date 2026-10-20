/**
 * 服务管理列表页展示逻辑的门禁。
 *
 * <p>这些函数原先内联在 {@code ScServiceManage.vue} 的 computed 里。
 * 内联代码改错了类型检查与构建都是绿的，只有真人对着屏幕才会发现：
 * 一个节点变成 ERROR 却不显示原因、或者统计卡上的数字加不起来。</p>
 *
 * <p>本 spec 特别关注<b>后端契约的容错</b>：{@code ServerNodeView.status}
 * 在类型上是三值枚举，但数据库里存了什么没人管得到（历史数据、手工改库、
 * 跨版本回滚都会写进枚举外的值）。凡是遇到「后端可能给出意料之外的值」的地方，
 * 这里都钉一条用例 —— 因为这类缺陷在测试环境数据干净时永远不会暴露。</p>
 */
import { describe, expect, it } from "vitest";
import type { ServerNodeView } from "../api/serviceManage";
import {
  buildProtocolOptions,
  deriveStatusMeta,
  filterNodes,
  formatListenText,
  isProxyProtocol,
  summarizeNodes,
} from "../utils/nodeList";

/** 构造节点，缺省字段尽量给全，只在专门测容错时才省略 */
function node(over: Partial<ServerNodeView> = {}): ServerNodeView {
  return {
    id: 1,
    name: "fs-demo",
    protocol: "http",
    status: "RUNNING",
    enabled: 1,
    host: "0.0.0.0",
    port: 19080,
    ...over,
  } as ServerNodeView;
}

describe("deriveStatusMeta 三种正常状态", () => {
  it("RUNNING：绿色 + 呼吸", () => {
    const m = deriveStatusMeta(node({ status: "RUNNING" }));
    expect(m).toMatchObject({ tone: "success", pulse: true });
  });

  it("STOPPED：灰色 + 不呼吸", () => {
    const m = deriveStatusMeta(node({ status: "STOPPED" }));
    expect(m).toMatchObject({ tone: "info", pulse: false });
  });

  it("ERROR：红色 + 不呼吸", () => {
    const m = deriveStatusMeta(node({ status: "ERROR" }));
    expect(m).toMatchObject({ tone: "danger", pulse: false });
  });
});

describe("deriveStatusMeta 的失败原因（本轮修复的核心）", () => {
  it("ERROR 时把 error 字段透出来（后端一直在返回，列表原先从不显示）", () => {
    const m = deriveStatusMeta(
      node({ status: "ERROR", error: "端口 19080 绑定失败：Address already in use" }),
    );
    expect(m.reason).toBe("端口 19080 绑定失败：Address already in use");
  });

  it("ERROR 但 error 为空串 → reason 为空，不显示空白行", () => {
    // 后端在「定义已落库、运行态刚失败」时可能给出空串，
    // 模板里 v-if="reason" 依赖这里返回空串而不是 null
    expect(deriveStatusMeta(node({ status: "ERROR", error: "" })).reason).toBe("");
    expect(deriveStatusMeta(node({ status: "ERROR" })).reason).toBe("");
  });

  it("ERROR 的 error 只有空白 → 视为无原因", () => {
    expect(deriveStatusMeta(node({ status: "ERROR", error: "   \n " })).reason).toBe("");
  });

  it("RUNNING 携带历史 error 残留时不得展示（否则会误导成「运行中但有错」）", () => {
    const m = deriveStatusMeta(node({ status: "RUNNING", error: "上次启动失败的残留文案" }));
    expect(m.reason).toBe("");
  });

  it("error 为 null / 数字等非字符串时按无原因处理，不抛错", () => {
    expect(deriveStatusMeta(node({ status: "ERROR", error: null as never })).reason).toBe("");
    expect(deriveStatusMeta(node({ status: "ERROR", error: 500 as never })).reason).toBe("");
  });
});

describe("deriveStatusMeta 对枚举外取值的容错", () => {
  it("未知状态显式标注，不复用任何已有文案", () => {
    const m = deriveStatusMeta(node({ status: "STARTING" as never }));
    expect(m.text).toBe("未知(STARTING)");
    expect(m.tone).toBe("info");
    expect(m.pulse).toBe(false);
  });

  it("未知状态绝不显示成「运行中」或「异常」——那会让状态灯撒谎", () => {
    for (const bad of ["running", "RUNNING ", "Error", "", "ok"]) {
      const m = deriveStatusMeta(node({ status: bad as never }));
      expect(m.text).not.toBe("运行中");
      expect(m.text).not.toBe("异常");
    }
  });

  it("status 缺失（undefined / null）不崩", () => {
    expect(() => deriveStatusMeta(node({ status: undefined as never }))).not.toThrow();
    expect(deriveStatusMeta(null).text).toContain("未知");
    expect(deriveStatusMeta(undefined).text).toContain("未知");
  });

  it("null 节点也能安全求值（模板里 row 可能是 undefined）", () => {
    const m = deriveStatusMeta(null);
    expect(m.pulse).toBe(false);
    expect(m.reason).toBe("");
  });
});

describe("summarizeNodes 统计口径", () => {
  const nodes = [
    node({ id: 1, status: "RUNNING", filters: [{ name: "a" }, { name: "b" }] }),
    node({ id: 2, status: "RUNNING", filters: [] }),
    node({ id: 3, status: "STOPPED" }),
    node({ id: 4, status: "ERROR", error: "boom" }),
    node({ id: 5, status: "PENDING" as never }),
  ];

  it("总数与分项之和一致（未知状态单列，不被悄悄并进 stopped）", () => {
    const s = summarizeNodes(nodes);
    expect(s.total).toBe(5);
    expect(s.running + s.stopped + s.error + s.unknown).toBe(s.total);
  });

  it("各分项计数正确", () => {
    const s = summarizeNodes(nodes);
    expect(s).toMatchObject({ running: 2, stopped: 1, error: 1, unknown: 1 });
  });

  it("plugins 累加各节点过滤器数，停用的也算（口径是「挂了多少个」）", () => {
    expect(summarizeNodes(nodes).plugins).toBe(2);
  });

  it("filters 缺失或 undefined 时按 0 计，不产生 NaN", () => {
    const s = summarizeNodes([node({ filters: undefined }), node({ filters: [] })]);
    expect(s.plugins).toBe(0);
    expect(Number.isNaN(s.plugins)).toBe(false);
  });

  it("空列表返回全 0，不返回 NaN", () => {
    expect(summarizeNodes([])).toEqual({
      total: 0,
      running: 0,
      stopped: 0,
      error: 0,
      unknown: 0,
      plugins: 0,
    });
  });

  it("null / undefined 输入返回全 0（接口异常时页面不能白屏）", () => {
    expect(summarizeNodes(null).total).toBe(0);
    expect(summarizeNodes(undefined).total).toBe(0);
  });
});

describe("filterNodes 关键字搜索", () => {
  const nodes = [
    node({ id: 1, name: "fs-demo", protocol: "http", host: "0.0.0.0", port: 19080 }),
    node({ id: 2, name: "http-proxy-demo", protocol: "http-proxy", host: "127.0.0.1", port: 19081 }),
    node({
      id: 3,
      name: "tcp-proxy-demo",
      protocol: "tcp-proxy",
      port: 19082,
      status: "ERROR",
      error: "端口 19082 绑定失败 Address already in use",
    }),
  ];

  it("按名称命中", () => {
    expect(filterNodes(nodes, { keyword: "fs-demo" }).map(n => n.id)).toEqual([1]);
  });

  it("按端口命中", () => {
    expect(filterNodes(nodes, { keyword: "19081" }).map(n => n.id)).toEqual([2]);
  });

  it("按失败原因命中（排障入口：运维想搜的就是报错里的端口/关键字）", () => {
    expect(filterNodes(nodes, { keyword: "Address already in use" }).map(n => n.id)).toEqual([3]);
  });

  it("大小写不敏感", () => {
    expect(filterNodes(nodes, { keyword: "FS-DEMO" }).map(n => n.id)).toEqual([1]);
  });

  it("首尾空白被忽略（输入框很容易带上）", () => {
    expect(filterNodes(nodes, { keyword: "  fs-demo  " }).map(n => n.id)).toEqual([1]);
  });

  it("空关键字返回全部", () => {
    expect(filterNodes(nodes, { keyword: "" })).toHaveLength(3);
    expect(filterNodes(nodes, {})).toHaveLength(3);
  });

  it("无命中返回空数组而不是 null", () => {
    expect(filterNodes(nodes, { keyword: "不存在的服务" })).toEqual([]);
  });

  it("协议过滤为精确匹配，不做子串（避免 http 命中 http-proxy）", () => {
    expect(filterNodes(nodes, { protocol: "http" }).map(n => n.id)).toEqual([1]);
    expect(filterNodes(nodes, { protocol: "proxy" })).toHaveLength(0);
  });

  it("协议与关键字是【与】关系", () => {
    // node 1 是 http/19080，node 2 是 http-proxy/19081：
    // 必须用 19080 去筛 http 才能证明两个条件同时生效。
    // 写成 protocol=http + keyword=19081 会返回空，那是协议精确匹配
    // 挡住了（http ≠ http-proxy），不能用来证明「与」关系。
    expect(filterNodes(nodes, { protocol: "http", keyword: "19080" }).map(n => n.id)).toEqual([1]);
    expect(filterNodes(nodes, { protocol: "tcp-proxy", keyword: "19081" })).toEqual([]);
  });

  it("null / undefined 输入返回空数组", () => {
    expect(filterNodes(null)).toEqual([]);
    expect(filterNodes(undefined, { keyword: "x" })).toEqual([]);
  });

  it("保持原始顺序（前端表格排序依赖稳定顺序）", () => {
    expect(filterNodes(nodes).map(n => n.id)).toEqual([1, 2, 3]);
  });
});

describe("formatListenText", () => {
  it("host 为空时回落 0.0.0.0（与后端默认监听一致）", () => {
    expect(formatListenText(node({ host: "", port: 19080 }))).toBe("0.0.0.0:19080");
    expect(formatListenText(node({ host: undefined, port: 19080 }))).toBe("0.0.0.0:19080");
  });

  it("host 只有空白也回落，不渲染成「   :19080」", () => {
    expect(formatListenText(node({ host: "  ", port: 19080 }))).toBe("0.0.0.0:19080");
  });

  it("端口为 undefined 渲染成横杠而不是 null", () => {
    expect(formatListenText(node({ host: "0.0.0.0", port: undefined }))).toBe("0.0.0.0:-");
    expect(formatListenText(node({ host: "0.0.0.0", port: 0 }))).toBe("0.0.0.0:0");
  });

  it("null 节点不抛错", () => {
    expect(formatListenText(null)).toBe("0.0.0.0:-");
  });
});

describe("buildProtocolOptions", () => {
  it("SPI 协议加「（SPI）」后缀，与表格展示区分得开", () => {
    const opts = buildProtocolOptions([
      { code: "http", alias: "http", desc: "HTTP 服务器", defaultPort: 8080, defaultEngine: null, requiresBackend: false, spi: false },
      { code: "sftp", alias: "sftp", desc: "SFTP 服务器", defaultPort: 22, defaultEngine: null, requiresBackend: false, spi: true },
    ]);
    expect(opts).toEqual([
      { label: "http - HTTP 服务器", value: "http" },
      { label: "sftp（SPI） - SFTP 服务器", value: "sftp" },
    ]);
  });

  it("丢掉没有 alias 的条目（否则下拉里会出现一个选不中的空项）", () => {
    const opts = buildProtocolOptions([
      { alias: "", desc: "x" },
      { alias: "http", desc: "y" },
    ] as never);
    expect(opts).toEqual([{ label: "http - y", value: "http" }]);
  });

  it("desc 缺失时不让标签渲染成 undefined", () => {
    const opts = buildProtocolOptions([{ alias: "http" }] as never);
    expect(opts[0].label).toBe("http - ");
  });

  it("null / undefined 输入返回空数组（下拉渲染 v-for 空数组，不报错）", () => {
    expect(buildProtocolOptions(null)).toEqual([]);
    expect(buildProtocolOptions(undefined)).toEqual([]);
  });
});

describe("isProxyProtocol", () => {
  it("含 proxy 的编码判为代理类", () => {
    expect(isProxyProtocol("http-proxy")).toBe(true);
    expect(isProxyProtocol("tcp-proxy")).toBe(true);
    expect(isProxyProtocol("socks-proxy")).toBe(true);
  });

  it("普通协议判为非代理", () => {
    expect(isProxyProtocol("http")).toBe(false);
    expect(isProxyProtocol("ftp")).toBe(false);
  });

  it("非字符串（undefined / null / 数字）判为非代理，不抛错", () => {
    expect(isProxyProtocol(undefined)).toBe(false);
    expect(isProxyProtocol(null)).toBe(false);
    expect(isProxyProtocol(42)).toBe(false);
  });

  it("空串判为非代理", () => {
    expect(isProxyProtocol("")).toBe(false);
  });
});