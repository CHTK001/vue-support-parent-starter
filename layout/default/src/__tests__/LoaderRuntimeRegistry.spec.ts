import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getLoaderStyleEntries,
  renderLoaderMarkup,
  renderLoaderPreviewMarkup,
} from "../../../../packages/components/ScRouteLoading/loader-manager";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../../");
const loaderConfigSource = readFileSync(
  resolve(repoRoot, "public/loader-config.js"),
  "utf-8",
);
const loaderEntrySource = readFileSync(
  resolve(repoRoot, "public/loader.js"),
  "utf-8",
);
const loaderSettingSource = readFileSync(
  resolve(
    repoRoot,
    "layout/default/src/components/lay-setting/themes/LoaderStyleSetting.vue",
  ),
  "utf-8",
);
const loaderThemeSectionSource = readFileSync(
  resolve(
    repoRoot,
    "layout/default/src/components/lay-setting/themes/components/SettingTheme.vue",
  ),
  "utf-8",
);
const routeLoaderSource = readFileSync(
  resolve(repoRoot, "packages/components/ScRouteLoading/index.vue"),
  "utf-8",
);

describe("loader runtime registry", () => {
  it("keeps fallback loader entries as pure html/css definitions", () => {
    const entries = getLoaderStyleEntries();

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry.html.trim()).toBeTruthy();
      expect(entry.css.trim()).toBeTruthy();
      expect(entry.html.toLowerCase()).not.toContain("<iframe");
      expect(entry.html.toLowerCase()).not.toContain("<script");
      expect(entry.html.toLowerCase()).not.toContain("<canvas");
    });
  });

  it("keeps public loader config HTML-only for all runtime animations", () => {
    const htmlMatches = loaderConfigSource.match(/html:\s*['"`]/g) || [];

    expect(htmlMatches.length).toBeGreaterThan(1);
    expect(loaderConfigSource).not.toContain("<iframe");
    expect(loaderConfigSource).not.toContain("createElement(\"iframe\")");
    expect(loaderConfigSource).not.toContain("createElement('iframe')");
    expect(loaderConfigSource).not.toContain("<canvas");
    expect(loaderConfigSource).not.toContain("createElement(\"canvas\")");
    expect(loaderConfigSource).not.toContain("createElement('canvas')");
  });

  it("reuses the same loader html registry in boot loader and settings preview", () => {
    expect(renderLoaderMarkup("default")).toContain('class="sys-loader-shell"');
    expect(renderLoaderMarkup("default")).toContain(
      'data-loader-key="default"',
    );
    expect(renderLoaderPreviewMarkup("default")).toContain(
      "sys-loader-shell--preview",
    );
    expect(loaderEntrySource).toContain("window.__SYS_LOADER_CONFIG__");
    expect(loaderEntrySource).toContain("createLoaderMarkup(loader)");
    expect(loaderEntrySource).toContain("sys-loader-shell");
    expect(loaderSettingSource).toContain(
      '@repo/components/ScRouteLoading/loader-manager',
    );
    expect(loaderSettingSource).toContain("renderLoaderPreviewMarkup");
    expect(loaderSettingSource).toContain(
      'v-html="renderLoaderPreviewMarkup(item.key)"',
    );
    expect(loaderThemeSectionSource).toContain(
      "getConfig().ShowLoadingPageStyleSwitcher",
    );
    expect(routeLoaderSource).toContain("getLoaderStyleEntries");
    expect(routeLoaderSource).toContain("renderLoaderMarkup");
    expect(routeLoaderSource).toContain("renderLoaderPreviewMarkup(style.key)");
    expect(routeLoaderSource).toContain(
      "loaderEl.innerHTML = renderLoaderMarkup(currentStyle.value)",
    );
  });
});
