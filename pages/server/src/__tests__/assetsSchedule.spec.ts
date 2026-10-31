/**
 * 主机右键菜单宽度 + 调度信息页签的门禁。
 *
 * <p>两个线上问题的回归：
 * <ul>
 *   <li>长主机名（{@code ibssh_xxx@ssh.instabox.sh}）把右键菜单撑到 300px+，
 *       菜单横跨半个屏幕；</li>
 *   <li>「调度信息」打开后请求 {@code /ms/server/host/{id}/schedule} 返回 404，
 *       后端并没有这张表。</li>
 * </ul>
 *
 * <p>宽度只断言源样式（封顶 + 省略号），调度只断言 API 落在已存在的
 * {@code /ms/server/exec/job} 上、且删除只摘掉当前主机。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseScheduleHostIds } from "../api";

const ASSETS_VIEW_PATH = join(process.cwd(), "src", "views", "AssetsView.vue");
const SCHEDULE_TAB_PATH = join(process.cwd(), "src", "views", "ScScheduleTab.vue");
const API_PATH = join(process.cwd(), "src", "api", "index.ts");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/** 取一段 CSS 块：从 prefix 起到 suffix 前 */
function section(styles: string, prefix: string, suffix: string): string {
  const start = styles.indexOf(prefix);
  expect(start).toBeGreaterThan(-1);
  const end = styles.indexOf(suffix, start);
  expect(end).toBeGreaterThan(start);
  return styles.slice(start, end);
}

describe("主机右键菜单：长主机名不再撑宽", () => {
  const styles = read(ASSETS_VIEW_PATH).slice(read(ASSETS_VIEW_PATH).indexOf("<style"));

  it("菜单宽度按内容收缩但封顶 260px", () => {
    const menu = section(styles, ".host-ctx-menu {", ".host-ctx-item {");
    expect(menu).toContain("width: max-content");
    expect(menu).toContain("max-width: min(260px, calc(100vw - 24px))");
  });

  it("末尾的尺寸兜底块同样保持 260px 封顶（不能被后写的规则放大）", () => {
    const tail = section(styles, "/* 菜单项数量有限", "</style>");
    expect(tail).toContain("max-width: min(260px, calc(100vw - 24px))");
    expect(tail).not.toContain("max-width: calc(100vw - 24px);");
  });

  it("主机名与地址都按省略号收口", () => {
    const headName = section(styles, ".host-ctx-head b {", ".host-ctx-head span {");
    expect(headName).toContain("text-overflow: ellipsis");
    const headAddr = section(styles, ".host-ctx-head span {", "/* 分组标题");
    expect(headAddr).toContain("text-overflow: ellipsis");
    const itemLabel = section(styles, ".host-ctx-item > span {", ".host-ctx-item .re-icon");
    expect(itemLabel).toContain("text-overflow: ellipsis");
  });
});

describe("调度信息：复用计划任务接口，不再打不存在的 /schedule", () => {
  const api = read(API_PATH);
  const tab = read(SCHEDULE_TAB_PATH);

  it("API 不再请求 /host/{id}/schedule", () => {
    expect(api).not.toContain("/host/${hostId}/schedule");
  });

  it("列表 / 增 / 改 / 删都落到 /exec/job", () => {
    expect(api).toContain("`${B}/exec/job`");
    expect(api).toContain("getJobs()");
    expect(api).toContain("saveJob(null, {");
    expect(api).toContain("msExecJobHostIds: JSON.stringify([hostId])");
    expect(api).toContain("delJob(id)");
  });

  it("删除只摘掉当前主机，摘空才删任务", () => {
    const start = api.indexOf("export const delSchedule");
    expect(start).toBeGreaterThan(-1);
    const body = api.slice(start, api.indexOf("};", start));
    expect(body).toContain(".filter(x => x !== hostId)");
    expect(body).toContain("if (!remain.length) return delJob(id)");
    expect(body).toContain("msExecJobHostIds: JSON.stringify(remain)");
  });

  it("页面只依赖主机维度，不再有平台选择器", () => {
    expect(tab).toContain("listSchedules(hostId4.value)");
    expect(tab).toContain("toggleSchedule");
    expect(tab).not.toContain("platform");
    expect(tab).not.toContain("platformOptions");
  });
});

describe("hostIds 解析", () => {
  it("解析后端存的 JSON 数组字符串", () => {
    expect(parseScheduleHostIds("[1,2]")).toEqual([1, 2]);
    expect(parseScheduleHostIds('["3"]')).toEqual([3]);
  });

  it("空值 / 脏数据按空数组处理", () => {
    expect(parseScheduleHostIds("")).toEqual([]);
    expect(parseScheduleHostIds(undefined)).toEqual([]);
    expect(parseScheduleHostIds(null)).toEqual([]);
    expect(parseScheduleHostIds("not-json")).toEqual([]);
    expect(parseScheduleHostIds("{}")).toEqual([]);
  });
});
