/**
 * 在线用户页面（OnlineUserManage.vue）登录历史展示测试
 *
 * 覆盖：
 *  1. 全部登录 IP：默认展示前 2 个，其余折叠为「+N」，popover 内展示完整列表
 *  2. 最近 30 天登录：稀疏条固定 30 个格子，格子上带当日登录次数/失败/IP 说明
 *  3. 点击稀疏条打开登录时间轴抽屉：按 username + days 请求接口，并按天渲染节点
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const api = vi.hoisted(() => ({
  listOnline: vi.fn(),
  countOnline: vi.fn(),
  kickUser: vi.fn(),
  getOnlineLoginHistory: vi.fn(),
}));

const core = vi.hoisted(() => ({
  message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@repo/core", () => core);
vi.mock("../api/systemApi", () => api);

import OnlineUserManage from "../views/OnlineUserManage.vue";
import { makeReTableStub, ReButtonStub, ReTagStub, settle } from "./helpers";

/** 与页面 dayKey 同口径的本地日期键 */
function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ElPopoverStub = {
  props: ["placement", "width", "trigger", "popperClass"],
  template: `<span class="el-popover-stub"><slot name="reference" /><span class="el-popover-stub__content"><slot /></span></span>`,
};

const ElDrawerStub = {
  props: ["modelValue", "title", "size", "class"],
  emits: ["update:modelValue"],
  template: `<div v-if="modelValue" class="el-drawer-stub"><div class="el-drawer-stub__title">{{ title }}</div><slot /></div>`,
};

const rows = [
  {
    userId: "3",
    username: "ops",
    nickname: "运营",
    deptName: "平台部",
    ip: "10.0.0.1",
    address: "本地网络",
    browser: "Chrome",
    os: "Windows",
    loginType: "WEB",
    loginTime: `${dayKey(0)}T09:00:00`,
    lastAccessTime: `${dayKey(0)}T10:00:00`,
    loginIps: [
      { ip: "10.0.0.1", address: "本地网络", total: 5, lastTime: `${dayKey(0)}T09:00:00` },
      { ip: "1.2.3.4", address: "上海", total: 2, lastTime: `${dayKey(1)}T08:00:00` },
      { ip: "5.6.7.8", address: "北京", total: 1, lastTime: `${dayKey(10)}T08:00:00` },
    ],
    loginDays: [
      {
        date: dayKey(0),
        total: 2,
        success: 2,
        fail: 0,
        ips: ["10.0.0.1"],
        lastTime: `${dayKey(0)}T09:00:00`,
      },
    ],
  },
];

const historyFixture = {
  username: "ops",
  windowDays: 30,
  total: 3,
  success: 2,
  fail: 1,
  lastTime: `${dayKey(0)}T09:00:00`,
  ips: [
    { ip: "10.0.0.1", address: "本地网络", total: 5, lastTime: `${dayKey(0)}T09:00:00` },
    { ip: "1.2.3.4", address: "上海", total: 2, lastTime: `${dayKey(1)}T08:00:00` },
  ],
  items: [
    { date: dayKey(3), total: 0, success: 0, fail: 0, ips: [] },
    {
      date: dayKey(1),
      total: 1,
      success: 0,
      fail: 1,
      ips: ["1.2.3.4"],
      lastTime: `${dayKey(1)}T08:00:00`,
    },
    {
      date: dayKey(0),
      total: 2,
      success: 2,
      fail: 0,
      ips: ["10.0.0.1"],
      lastTime: `${dayKey(0)}T09:00:00`,
    },
  ],
};

function mountPage() {
  return mount(OnlineUserManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["username", "dept", "ip", "info", "loginType", "days", "action"]),
        ReButton: ReButtonStub,
        ReTag: ReTagStub,
        ReIcon: { template: "<i />" },
        ElPopover: ElPopoverStub,
        ElDrawer: ElDrawerStub,
      },
      directives: { loading: {} },
      components: { ElPopover: ElPopoverStub, ElDrawer: ElDrawerStub },
    },
  });
}

describe("OnlineUserManage 登录 IP 与登录时间轴", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listOnline.mockResolvedValue({ data: rows });
    api.countOnline.mockResolvedValue({ data: 1 });
    api.getOnlineLoginHistory.mockResolvedValue({ data: historyFixture });
  });

  it("登录 IP 默认只展示前两个，其余折叠为 +N", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const preview = wrapper.findAll(".online-ip__ip").map((n) => n.text());
    expect(preview).toEqual(["10.0.0.1,", "1.2.3.4"]);
    expect(wrapper.find(".online-ip__more").text()).toBe("+1");
  });

  it("popover 内展示全部登录 IP 与最近登录信息", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const popIps = wrapper.findAll(".ip-pop__ip").map((n) => n.text());
    expect(popIps).toEqual(["10.0.0.1", "1.2.3.4", "5.6.7.8"]);
    expect(wrapper.find(".ip-pop__title").text()).toContain("全部登录 IP（3 个）");
    expect(wrapper.text()).toContain("当前");
  });

  it("最近 30 天稀疏条固定 30 格，并展示当日次数", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const cells = wrapper.findAll(".online-days__cell");
    expect(cells.length).toBe(30);
    expect(wrapper.find(".online-days__total").text()).toBe("2 次");
    const active = cells.filter((c) => !c.classes().includes("is-lv0"));
    expect(active.length).toBe(1);
    expect(active[0].attributes("title")).toContain("登录 2 次");
  });

  it("点击稀疏条按 username + days 打开登录时间轴抽屉", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    await wrapper.find(".online-days__strip").trigger("click");
    await settle(wrapper);

    expect(api.getOnlineLoginHistory).toHaveBeenCalledWith({ username: "ops", days: 30 });
    expect(wrapper.find(".el-drawer-stub__title").text()).toBe("登录时间轴 · ops");
    // 补零日期不渲染节点，只渲染有登录记录的两天，最近一天在前
    const items = wrapper.findAll(".history__item");
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain(dayKey(0));
    expect(items[1].classes()).toContain("is-danger");
  });
});
