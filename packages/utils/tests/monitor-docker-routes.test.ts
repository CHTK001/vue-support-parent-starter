import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dockerRoutesSource = readFileSync(
  resolve(
    __dirname,
    "../../../apps/vue-support-monitor-starter/src/router/modules/docker.ts",
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

describe("monitor docker routes", () => {
  it("exposes the docker pages used by the monitor ui", () => {
    expect(dockerRoutesSource).toContain('path: "/docker/containers"');
    expect(dockerRoutesSource).toContain('path: "/docker/images"');
    expect(dockerRoutesSource).toContain('path: "/docker/soft"');
    expect(dockerRoutesSource).toContain('path: "/docker/monitoring"');
    expect(dockerRoutesSource).toContain('path: "/docker/records"');
    expect(dockerRoutesSource).toContain('path: "/docker/registry"');
    expect(dockerRoutesSource).toContain('path: "/docker/detail/:id"');
    expect(dockerRoutesSource).toContain("showLink: false");
  });

  it("keeps legacy docker and soft paths compatible", () => {
    expect(dockerRoutesSource).toContain(
      'alias: ["/docker/list", "/soft/containers"]',
    );
    expect(dockerRoutesSource).toContain('alias: ["/soft", "/soft/index"]');
    expect(dockerRoutesSource).toContain('alias: ["/soft/monitoring"]');
    expect(dockerRoutesSource).toContain('alias: ["/soft/records"]');
    expect(dockerRoutesSource).toContain('alias: ["/soft/detail/:id"]');
  });

  it("maps backend menu ids to live docker pages", () => {
    expect(routeMenuSource).toContain('dockerList: "/docker/containers"');
    expect(routeMenuSource).toContain('softIndex: "/docker/soft"');
    expect(routeMenuSource).toContain('softDetail: "/docker/soft"');
    expect(routeMenuSource).toContain('softRecords: "/docker/records"');
    expect(routeMenuSource).toContain('softContainers: "/docker/containers"');
  });
});
