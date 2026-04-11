import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dockerRoutesSource = readFileSync(
  resolve(
    __dirname,
    "../../../apps/vue-support-monitor-starter/src/router/modules/docker.ts",
  ),
  "utf-8",
);

const monitorSoftRoutePath = resolve(
  __dirname,
  "../../../apps/vue-support-monitor-starter/src/router/modules/soft.ts",
);

const pagesSoftRouterPath = resolve(
  __dirname,
  "../../../pages/soft/src/router.ts",
);

const pagesSoftRouterSource = readFileSync(pagesSoftRouterPath, "utf-8");

const routeMenuSource = readFileSync(
  resolve(
    __dirname,
    "../../../apps/vue-support-monitor-starter/src/stores/route-menu.ts",
  ),
  "utf-8",
);

describe("monitor docker routes", () => {
  it("keeps pure docker pages in docker routes", () => {
    expect(dockerRoutesSource).toContain('path: "/docker/containers"');
    expect(dockerRoutesSource).toContain('path: "/docker/images"');
    expect(dockerRoutesSource).toContain('path: "/docker/monitoring"');
    expect(dockerRoutesSource).not.toContain('path: "/docker/soft"');
    expect(dockerRoutesSource).not.toContain('path: "/docker/records"');
    expect(dockerRoutesSource).not.toContain('path: "/docker/registry"');
    expect(dockerRoutesSource).not.toContain('path: "/docker/detail/:id"');
  });

  it("moves software pages to dedicated soft routes", () => {
    expect(existsSync(monitorSoftRoutePath)).toBe(false);
    expect(pagesSoftRouterSource).toContain('path: "/soft/catalog"');
    expect(pagesSoftRouterSource).toContain('path: "/soft/repositories"');
    expect(pagesSoftRouterSource).toContain('path: "/soft/targets"');
    expect(pagesSoftRouterSource).toContain('path: "/soft/installations"');
    expect(pagesSoftRouterSource).toContain('path: "/soft/records"');
    expect(pagesSoftRouterSource).toContain('path: "/soft/detail/:id"');
    expect(pagesSoftRouterSource).toContain('const { SoftCatalogPage } = await import("./index")');
  });

  it("maps backend menu ids to the new soft pages", () => {
    expect(routeMenuSource).toContain('dockerList: "/docker/containers"');
    expect(routeMenuSource).toContain('softIndex: "/soft/catalog"');
    expect(routeMenuSource).toContain('softDetail: "/soft/detail"');
    expect(routeMenuSource).toContain('softRecords: "/soft/records"');
    expect(routeMenuSource).toContain('softTargets: "/soft/targets"');
    expect(routeMenuSource).toContain('softRepositories: "/soft/repositories"');
    expect(routeMenuSource).toContain('softInstallations: "/soft/installations"');
  });
});
