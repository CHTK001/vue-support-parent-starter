/**
 * 主机资产工作台：页签门控（Docker 回页签 / 日志进页签）
 *
 * <p>需求：右键菜单的「Docker」「系统日志」「登录日志」不再跳出到独立页面（router.push），
 * 而是收回工作区页签（ReTabs），与「远控 / 文件 / 指标 / 画像分区」平级。</p>
 *
 * <p>不依赖浏览器：只断言页面源结构 —— 页签类型声明、TAB_KINDS、lazyTabOf 分支、
 * ctxCommand 路由口、标签文本全量取自检，编译与构建才能落定。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ASSETS_VIEW_PATH = join(process.cwd(), "src", "views", "AssetsView.vue");

function readViewSource(): string {
  return readFileSync(ASSETS_VIEW_PATH, "utf8");
}

/** 从 key 处截断：返回从 key 到测试结尾的文本 */
function cut(source: string, key: string): string {
  const idx = source.indexOf(key);
  expect(idx).toBeGreaterThan(-1);
  return source.slice(idx);
}

/** 只取某个函数体内：体内容 braces 计数，不多不少 */
function fnBody(source: string, name: string): string {
  const idx = source.indexOf(`function ${name}`);
  const start = Math.max(idx, source.indexOf(`${name}(`));
  const body = source.slice(start);
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return body.slice(0, i + 1);
    }
  }
  return body;
}

describe("AssetsView 页签门控", () => {
  const source = readViewSource();
  const script = source.slice(0, source.indexOf("<template"));
  const template = source.slice(source.indexOf("<template"));

  /** tab 类型声明 */
  const tabKindSection = cut(script, "type TabKind =");
  /** TAB_KINDS 元数据 */
  const kindSection = cut(script, "const TAB_KINDS: Record<TabKind, TabKindMeta> = {");

  it("TabKind union 声明 docker / sys-log / user-log 三项", () => {
    for (const k of ['"docker"', '"sys-log"', '"user-log"']) {
      expect(tabKindSection).toContain(k);
    }
  });

  it("TAB_KINDS 有 Docker / 系统日志 / 登录日志（标签与图标），且不是画像分区", () => {
    expect(kindSection).toContain('docker: { label: "Docker", icon: "Box" }');
    expect(kindSection).toContain('"sys-log": { label: "系统日志", icon: "Tickets" }');
    expect(kindSection).toContain('"user-log": { label: "登录日志", icon: "Unlock" }');
    expect(kindSection).not.toContain('docker: { label: "Docker（独立页）"');
    expect(kindSection).toContain("section:");
  });

  it("lazyTabOf 为 Docker 提供内容组件；日志页走专属分支", () => {
    const lazy = cut(script, "function lazyTabOf(name: string): Component | null {");
    expect(lazy).toContain('case "docker":\n      return DockerTab;');
    // 日志页要额外传 kind=sys|login，模板里有专属分支，不能落在通用懒加载映射里
    expect(lazy).toContain('case "sys-log":\n    case "user-log":');
    expect(lazy).not.toContain("return SysLogTab;");
    expect(lazy).not.toContain("return UserLogTab;");
  });

  it("日志页用 ScHostLogs（目标服务器日志），不再复用 @pages/system 的软件日志页", () => {
    const docker = cut(script, 'const DockerTab = defineAsyncComponent');
    const hostLogs = cut(script, 'const HostLogsTab = defineAsyncComponent');
    expect(docker).toContain("ScDockerK8sWorkbench.vue");
    expect(hostLogs).toContain("../components/lab/ScHostLogs.vue");
    expect(script).not.toContain("@pages/system/views/SysLogManage.vue");
    expect(script).not.toContain("@pages/system/views/UserLogManage.vue");
  });

  it("右键菜单 docker / 系统日志 / 登录日志 收进 openTab（不跳 router）", () => {
    const ctxCommand = fnBody(script, "ctxCommand");
    // Docker：右键菜单 → 工作区页签
    expect(ctxCommand).toContain('if (cmd === "tab-docker") {');
    expect(ctxCommand).toContain('openTab(h, "docker");');
    // 日志页：右键菜单 → 工作区页签
    expect(ctxCommand).toContain('cmd === "open-sys-log"');
    expect(ctxCommand).toContain('cmd === "open-user-log"');
    expect(ctxCommand).toContain('openTab(h, cmd === "open-sys-log" ? "sys-log" : "user-log");');
    // 不再 push 路由
    expect(ctxCommand).not.toContain("router.push");
  });

  it("右键菜单 Docker 标签不再带（独立页）", () => {
    expect(template).not.toContain("Docker（独立页）");
    expect(template).toContain(`ctxCommand('tab-docker')`);
    expect(template).toContain(`ctxCommand('open-sys-log')`);
    expect(template).toContain(`ctxCommand('open-user-log')`);
    expect(template).toContain(`<span>Docker</span>`);
  });

  it("openTab 文档说明 Docker 拆成工作区页签", () => {
    expect(script).toContain("Docker 已拆成独立页签（ReTabs 工作区页签），由 {@code ScDockerK8sWorkbench}");
    expect(script).toContain("的 {@code domain=\"docker\"} 支持");
  });

  it("工作区内容区：Docker 开域分支，日志页开专属分支并带 kind", () => {
    const lazyBranch = cut(template, "<!-- Docker 工作台页签：");
    expect(lazyBranch).toContain(':host-id="tabHostIdOf(tab.name)"');
    expect(lazyBranch).toContain("domain=\"docker\"");
    const logBranch = cut(template, "<!-- 目标主机日志页签：");
    expect(logBranch).toContain("<HostLogsTab");
    expect(logBranch).toContain(":kind=\"tabKindOf(tab.name) === 'user-log' ? 'login' : 'sys'\"");
    expect(logBranch).toContain(':platform="platformOf(tabHostIdOf(tab.name))"');
    expect(template).toContain("<!-- 运维台四页 + 主机账号 + 软件管理：懒加载页面收进工作区页签 -->");
  });

  it("工作区页签模板的默认分支与 head 匹配：右键菜单项不串到独立页", () => {
    // 工作台注释里写清了 Docker 的去向
    const comment = cut(template, "<!-- 主机工作台：分屏 / K8s / 隧道 / 反向隧道");
    expect(comment).toContain("/docker 独立页");
  });
});
