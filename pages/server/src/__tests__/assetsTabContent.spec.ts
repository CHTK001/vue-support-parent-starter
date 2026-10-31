/**
 * 工作区页签的内容组件可用：Docker 工作台页签（`domain="docker"`）与日志页（系统日志 / 登录日志）
 *
 * <p>页签 Demo 在容器里跑的是各个组件自己：右上角的 ENTRY（docker 工作台）取
 * {@code ScDockerK8sWorkbench} 的 {@code domain="docker"} 支；日志页取
 * {@code ScHostLogs.vue}——它读的是「这台服务器」自己的日志（命令经主机通道下发），
 * 不是 {@code @pages/system} 里的平台软件日志。它们从 `@pages/server` 的源里被懒加载，
 * 必须能解析（别名 + 文件存在），且能独立挂载。挂载不要求接口，命令下发用 vi.mock 挡住，
 * 只验证结构可见性。</p>
 *
 * <p>验证方式：实际挂载，数 DOM。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";

import ScDockerK8sWorkbench from "../components/lab/ScDockerK8sWorkbench.vue";
import ScHostLogs from "../components/lab/ScHostLogs.vue";

/** @scope 内 mock @repo/core，只暴露 message 服务，系统行为其余保持真实 */
vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

/** 日志页通过主机命令通道取数：这里直接返回一段目标机日志，验证渲染链路 */
vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    runCommand: vi.fn().mockResolvedValue([
      {
        msExecLogStatus: "SUCCESS",
        msExecLogOutput: "Oct 31 10:00:01 test systemd[1]: Started Session 12.\nOct 31 10:00:02 test sshd[9]: Accepted password for root",
        msExecLogCostMs: 12,
      },
    ]),
  };
});

/** jsdom 不提供 matchMedia，ReIcon 的动画模块里用 addEventListener/removeEventListener */
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  configurable: true,
});

/** 页面里的 http() 走 POST / GET 向真实服务端发 XHR（jsdom 里全部不通）
 * 只拦截 http，保留 costMs 等工具函数真实实现。
 * 模拟 @repo/utils 的链式调用形貌：`http().get(url).then(r => unwrapResult(r))`。 */
vi.mock("@repo/utils", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  /** 链式调用：`.get()/.post()/.query()/.data()/.timeout()` 返回同一个链，.then 支付 { code, data } */
  const chain = (): Record<string, unknown> => {
    const c: Record<string, unknown> = {
      get: () => c,
      post: () => c,
      put: () => c,
      delete: () => c,
      patch: () => c,
      query: () => c,
      data: () => c,
      timeout: () => c,
      headers: () => c,
      then: (fn: (r: Record<string, unknown>) => unknown) => Promise.resolve({ code: 0, data: null }).then(fn),
    };
    return c;
  };
  return {
    ...actual,
    http: vi.fn(chain),
  };
});

/** 页面里用到的 Re 控件（ReTable 系 / 表单级 / 信息级） */
const RE_COMPONENTS = [
  "ReText",
  "ReButton",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReSwitch",
  "ReForm",
  "ReDialog",
  "ReKit",
  "ReTable",
  "ReTag",
  "ReBadge",
  "ReIcon",
  "ReIpText",
  "ReTime",
  "ReLoading",
  "ReStatusIndicator",
  "ReSectionHead",
];

let globalComponents: Record<string, unknown> = {};
const wrappers: Array<any> = [];

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  globalComponents = Object.assign(Object.fromEntries(RE_COMPONENTS.map((name) => [name, app.component(name)])), {
    ScDockerK8sWorkbench,
  });
});

/** 等一个 Vue tick + element-plus 动画初始化 */
async function tick(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await nextTick();
    await new Promise((r) => setTimeout(r, 12));
  }
}

/** 挂载 + 不泄露未清理的 DOM，方便后续断言 */
async function mountAndAtlas(
  Component: unknown,
  extra: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
): Promise<any> {
  const wrapper = mount(Component, {
    props,
    global: { plugins: [elementPlus], components: { ...globalComponents, ...extra } } as never,
  });
  wrappers.push(wrapper);
  await tick();
  return wrapper;
}

afterAll(() => {
  for (const w of wrappers) {
    try {
      w.unmount();
    } catch {
      /* / eslint-disable -- 已拦截 */
    }
  }
  wrappers.length = 0;
});

describe("页签内容组件挂载", () => {
  it("Docker 工作台页签：domain=docker 可挂载，非 k8s", async () => {
    const wrapper = await mountAndAtlas({
      components: globalComponents as never,
      template: `<ScDockerK8sWorkbench :host-id="1" host-name="测试主机" domain="docker" />`,
    });
    expect(wrapper.find(".dk").exists()).toBe(true);
    expect(wrapper.find(".dk-title").text()).toBe("Docker 工作台");
    // domain=docker 时不出现 Kubernetes 探测
    expect(wrapper.text()).not.toContain("Kubernetes");
  });

  it("系统日志页签：ScHostLogs 读的是目标服务器日志", async () => {
    const wrapper = await mountAndAtlas(
      ScHostLogs,
      {},
      { hostId: 1, hostName: "测试主机", platform: "LINUX", kind: "sys" },
    );
    expect(wrapper.find(".lg").exists()).toBe(true);
    expect(wrapper.find(".lb-title").text()).toBe("系统日志");
    expect(wrapper.text()).toContain("测试主机");
    // 渲染命令输出（不是平台软件日志页的表格）
    expect(wrapper.text()).toContain("Started Session 12");
    expect(wrapper.findComponent({ name: "ReTable" }).exists()).toBe(false);
  });

  it("登录日志页签：ScHostLogs 用 kind=login 读认证日志", async () => {
    const wrapper = await mountAndAtlas(
      ScHostLogs,
      {},
      { hostId: 1, hostName: "测试主机", platform: "WINDOWS", kind: "login" },
    );
    expect(wrapper.find(".lg").exists()).toBe(true);
    expect(wrapper.find(".lb-title").text()).toBe("登录日志");
    // Windows 走 wevtutil 的 Security 通道
    expect(wrapper.find(".lg-cmd").text()).toContain("wevtutil qe Security");
  });
});
