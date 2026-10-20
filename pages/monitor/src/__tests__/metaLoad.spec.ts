/**
 * 首屏/刷新降级提示的门禁。
 *
 * <p>针对的是一个已存在的真实缺陷：协议与插件元数据原先是
 * {@code .catch(() => [])} 静默吞掉的。于是在协议接口故障时，
 * 界面表现是<b>「协议下拉是空的」且没有任何提示</b> —— 表格正常渲染、
 * 统计卡正常出数，唯独下拉是空的。用户点「新增服务」面对空下拉框，
 * 只能猜是接口挂了还是自己没有权限。</p>
 *
 * <p>这类「静默降级」比直接报错更难排查，因为它<b>不留任何痕迹</b>：
 * 没有红色 toast、没有 console 输出、没有失败计数。</p>
 *
 * <p>口径钉死为：<b>节点列表失败 = 致命（error），元数据失败 = 降级但必须出声
 * （warning）</b>。理由是节点列表挂了就没有任何可管理的内容，
 * 而元数据挂了页面仍然能用，只是下拉不完整 —— 但用户必须知道。</p>
 */
import { describe, expect, it } from "vitest";
import { describeMetaLoad } from "../utils/metaLoad";

/** 三类全成功 */
const ALL_OK = { nodesOk: true, protocolsOk: true, filtersOk: true };

describe("全部成功", () => {
  it("不展示任何提示", () => {
    const n = describeMetaLoad(ALL_OK);
    expect(n.show).toBe(false);
    expect(n.text).toBe("");
  });
});

describe("节点列表失败 = 致命", () => {
  it("tone 为 error（不是 warning：此时页面已无可管理内容）", () => {
    expect(describeMetaLoad({ ...ALL_OK, nodesOk: false }).tone).toBe("error");
  });

  it("带上后端原因，便于判断是鉴权、还是网络、还是接口 500", () => {
    const n = describeMetaLoad({ ...ALL_OK, nodesOk: false, nodesError: "401 未登录" });
    expect(n.show).toBe(true);
    expect(n.text).toContain("401 未登录");
  });

  it("没有错误信息时也要有兜底文案，不能渲染成「加载失败：」", () => {
    const n = describeMetaLoad({ ...ALL_OK, nodesOk: false });
    expect(n.text).toContain("未知原因");
    expect(n.text).not.toContain("： ");
  });

  it("节点列表失败优先于元数据失败，不被后者的 warning 掩盖", () => {
    const n = describeMetaLoad({
      nodesOk: false,
      protocolsOk: false,
      filtersOk: false,
      nodesError: "列表挂了",
      protocolsError: "协议挂了",
      filtersError: "插件挂了",
    });
    expect(n.tone).toBe("error");
    expect(n.text).toContain("列表挂了");
    expect(n.text).not.toContain("协议挂了");
  });
});

describe("元数据失败 = 降级但必须出声", () => {
  it("协议失败：warning 且文案点名「协议」", () => {
    const n = describeMetaLoad({
      ...ALL_OK,
      protocolsOk: false,
      protocolsError: "503",
    });
    expect(n.show).toBe(true);
    expect(n.tone).toBe("warning");
    expect(n.text).toContain("协议");
    expect(n.text).toContain("503");
  });

  it("插件失败：warning 且文案点名「插件」", () => {
    const n = describeMetaLoad({ ...ALL_OK, filtersOk: false, filtersError: "超时" });
    expect(n.show).toBe(true);
    expect(n.tone).toBe("warning");
    expect(n.text).toContain("插件");
  });

  it("两者都失败时同一条提示里都要列出，而不是只报第一个", () => {
    const n = describeMetaLoad({
      ...ALL_OK,
      protocolsOk: false,
      filtersOk: false,
      protocolsError: "e1",
      filtersError: "e2",
    });
    expect(n.text).toContain("e1");
    expect(n.text).toContain("e2");
  });

  it("提示里必须给出可执行的下一步（先刷新确认），否则用户仍不知道该怎么办", () => {
    const n = describeMetaLoad({ ...ALL_OK, protocolsOk: false });
    expect(n.text).toContain("刷新");
  });

  it("缺少错误信息时逐项兜底，不出现空括号", () => {
    const n = describeMetaLoad({ ...ALL_OK, protocolsOk: false, filtersOk: false });
    expect(n.text).not.toContain("（）");
    expect(n.text).not.toContain("()");
    expect(n.text).toContain("未知原因");
  });

  it("只失败一项时文案里不出现另一个未失败项（避免误导）", () => {
    const n = describeMetaLoad({ ...ALL_OK, protocolsOk: false, protocolsError: "x" });
    expect(n.text).not.toContain("插件列表");
  });
});