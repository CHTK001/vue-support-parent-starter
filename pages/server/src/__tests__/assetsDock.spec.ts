/**
 * Dock（右侧快捷操作面板）收起的门禁。
 *
 * <p>两项需求：**中间底部一行显示不允许换行**、**关闭右侧是全部关闭**——Dock
 * 收起时 Dock 内的折叠钮、Dock 外暴露的展开手柄必须全部销毁，不再占位或
 * 残留任何 Dock 控件（铃声只由齿轮菜单的「显示右侧快捷操作」提供）。
 *
 * <p>不依赖浏览器：只断言页面源结构——DOM 行不行，开关是什么。
 *
 * @author CH
 * @since 4.0.0
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 页面源文件（测试进程启动于 page/server，Windows 下 new URL().pathname 会丢盘符） */
const ASSETS_VIEW_PATH = join(process.cwd(), "src", "views", "AssetsView.vue");

/** 底部常驻状态条（.hmb）源文件——在一行里写死换不行的规则全在这片 */
const METRICS_BAR_PATH = join(process.cwd(), "src", "components", "ScHostMetricsBar.vue");

function readViewSource(): string {
  return readFileSync(ASSETS_VIEW_PATH, "utf8");
}

function readMetricsBarSource(): string {
  return readFileSync(METRICS_BAR_PATH, "utf8");
}

describe("Dock 收起时全部销毁", () => {
  const source = readViewSource();
  const template = source.slice(source.indexOf("<template"));
  const script = source.slice(0, source.indexOf("<template"));
  const styles = source.slice(source.indexOf("<style"));

  it("Dock 整体由 v-if=\"dockOpen\" 挂载，收起时 DOM 被完整销毁", () => {
    expect(template).toContain('<aside v-if="dockOpen" class="as-dock">');
  });

  it("Dock 的折叠钮（最小化）只在 Dock 展开时存在", () => {
    expect(template).toContain('class="dock-foot__fold"');
    expect(template).not.toContain('class="as-dock-open"');
    expect(styles).not.toContain(".as-dock-open");
    expect(script).not.toContain("as-dock-open");
    expect(template).not.toContain(".as-dock-open");
  });

  it("Dock 收起时齿轮浮窗（恢复）随开关一起清空", () => {
    const toggle = script.slice(script.indexOf("function toggleDock"));
    expect(toggle).toContain("dockConfigVisible.value = false;");
    // 浮窗开关与 Dock 展开/收起 联动
    expect(script).toContain("const dockConfigVisible = ref(false);");
    expect(template).toContain("<div v-if=\"dockConfigVisible\" class=\"as-work__popover\"");
  });
});

describe("metrics bar：一行显示，永不换行", () => {
  const source = readMetricsBarSource();
  const styles = source.slice(source.indexOf("<style scoped"));

  /** 选取一段 CSS 块：从 prefix { 到下一段 suffix { 之前 */
  function section(prefix: string, suffix: string): string {
    const start = styles.indexOf(prefix);
    expect(start).toBeGreaterThan(-1);
    const end = styles.indexOf(suffix, start);
    expect(end).toBeGreaterThan(start);
    return styles.slice(start, end);
  }

  it(".hmb 顶层是 flex 容器，flex-wrap: nowrap 兜底", () => {
    expect(section(".hmb {", ".hmb__summary {")).toContain("flex-wrap: nowrap");
    expect(section(".hmb {", ".hmb__summary {")).toContain("white-space: nowrap");
  });

  it(".hmb__name/.hmb__addr/.hmb__metric-label/.hmb__pill 强制单行不换行", () => {
    // [当前选择器，下一段选择器] 成对锁定边界，避免 mask 与自身花括号冲突
    const pairs: [string, string][] = [
      [".hmb__name", ".hmb__addr"],
      [".hmb__addr", ".hmb__info"],
      [".hmb__metric-label", ".hmb__track"],
      [".hmb__pill", ".hmb__pill.is-ok"],
    ];
    for (const [sel, next] of pairs) {
      const block = section(sel + " {", next + " {");
      expect(block).toContain("white-space: nowrap");
    }
  });
});

describe("底部一行：指标条与 Dock 设置钮不能再拆行", () => {
  const source = readViewSource();
  const template = source.slice(source.indexOf("<template"));
  const styles = source.slice(source.indexOf("<style scoped"));

  function section(prefix: string, suffix: string): string {
    const start = styles.indexOf(prefix);
    expect(start).toBeGreaterThan(-1);
    const end = styles.indexOf(suffix, start);
    expect(end).toBeGreaterThan(start);
    return styles.slice(start, end);
  }

  /** 取工作区底部容器 `.as-work` 的那段模板文本（它下面紧挨着 Dock aside） */
  function workSection(): string {
    const m = template.match(/<section class="as-work">[\s\S]*?<\/section>/);
    expect(m).not.toBeNull();
    return m![0];
  }

  it("底部整行被 as-work__bottom 包裹，容器强锁一行", () => {
    expect(template).toContain('<div class="as-work__bottom">');
    const bottom = section(".as-work__bottom {", ".as-work__foot {");
    expect(bottom).toContain("display: flex");
    expect(bottom).toContain("flex-wrap: nowrap");
    expect(bottom).toContain("align-items: center");
  });

  it("设置钮高度固定（32px）且没有底部间距，不再给独立行留空间", () => {
    const foot = section(".as-work__foot {", ".as-work__config {");
    expect(foot).toContain("height: 32px");
    expect(foot).toContain("padding: 0");
    expect(foot).not.toContain("0 0 10px");
  });

  it("工作区底部只有 as-work__bottom 一个容器：页签条 + 底部一行", () => {
    const work = workSection();
    // 页签条 + 底部容器 = 2 个子块，多一个就会额外占一行
    expect(work).toContain("<ReTabs");
    expect(work).toContain('<div class="as-work__bottom">');
    expect(work.match(/<div class="as-work__bottom">/g)?.length).toBe(1);
    // dock 收起后底部不能再生成独立行（旧的和是 .as-work__foot：没有单独包裹容器）
    expect(work).not.toMatch(/<\/section>\s*<div class="as-work__foot">/);
  });
});
