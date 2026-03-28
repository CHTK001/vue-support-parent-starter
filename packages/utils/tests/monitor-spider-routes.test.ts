import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const spiderRoutesSource = readFileSync(
  resolve(
    __dirname,
    "../../../apps/vue-support-monitor-starter/src/router/modules/task.ts",
  ),
  "utf-8",
);

const routeMenuSource = readFileSync(
  resolve(
    __dirname,
    "../../../apps/vue-support-monitor-starter/src/stores/route-menu.ts",
  ),
  "utf-8",
);

describe("monitor spider routes", () => {
  it("exposes the spider pages used by the monitor ui", () => {
    expect(spiderRoutesSource).toContain('path: "/spider-management"');
    expect(spiderRoutesSource).toContain('redirect: "/spider"');
    expect(spiderRoutesSource).toContain('path: "/spider"');
    expect(spiderRoutesSource).toContain('alias: ["/spider-list"]');
    expect(spiderRoutesSource).toContain('path: "/spider/design/:taskId"');
    expect(spiderRoutesSource).toContain('showLink: false');
  });

  it("maps backend menu ids to the live spider page", () => {
    expect(routeMenuSource).toContain('spiderManagement: "/spider"');
    expect(routeMenuSource).toContain('spiderList: "/spider"');
  });
});
