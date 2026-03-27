import { mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "..");
const APP_URL = process.env.APP_URL || "http://127.0.0.1:8848/#/home";
const SCREENSHOT_PATH = resolve(repoRoot, ".runtime/verify-settings-panel.png");
const APP_CONFIG_PATH = resolve(
  repoRoot,
  "apps/vue-support-system-parent/src/app.yaml",
);
const DEFAULT_CONFIG_PATH = resolve(
  repoRoot,
  "packages/config/src/setting/index.ts",
);

function readBooleanFromTsSource(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*(true|false)`));
  if (!match) {
    return null;
  }
  return match[1] === "true";
}

function readBooleanFromYamlSource(source, key) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, ""))
    .filter((line) => line.trim() && !line.trim().startsWith("#"));

  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*${key}:\\s*(true|false)\\s*$`));
    if (match) {
      return match[1] === "true";
    }
  }

  return null;
}

async function resolveLoaderSettingConfig() {
  const [defaultConfigSource, appConfigSource] = await Promise.all([
    readFile(DEFAULT_CONFIG_PATH, "utf-8"),
    readFile(APP_CONFIG_PATH, "utf-8").catch(() => ""),
  ]);

  const defaultValue =
    readBooleanFromTsSource(defaultConfigSource, "ShowLoadingPageStyleSwitcher") ??
    false;
  const appValue = appConfigSource
    ? readBooleanFromYamlSource(appConfigSource, "ShowLoadingPageStyleSwitcher")
    : null;

  return {
    defaultValue,
    appValue,
    effectiveValue: appValue ?? defaultValue,
  };
}

async function importPlaywright() {
  const pnpmDir = resolve(repoRoot, "node_modules/.pnpm");
  const entries = await readdir(pnpmDir, { withFileTypes: true });
  const playwrightEntry = entries
    .filter((entry) => entry.isDirectory() && /^playwright@/.test(entry.name))
    .sort((left, right) => right.name.localeCompare(left.name))[0];

  if (!playwrightEntry) {
    throw new Error("未找到 Playwright 运行时，请先安装依赖");
  }

  const playwrightModuleUrl = pathToFileURL(
    resolve(pnpmDir, playwrightEntry.name, "node_modules/playwright/index.mjs"),
  ).href;

  return import(playwrightModuleUrl);
}

function buildFailureList({
  loaderSettingConfig,
  summary,
  loaderInteraction,
  devLoaderBefore,
  devLoaderAfterOpen,
  devLoaderSwitchResult,
  pageErrors,
  requestFailures,
  dialogs,
}) {
  const failures = [];

  if (pageErrors.length) {
    failures.push(`页面脚本错误 ${pageErrors.length} 条`);
  }

  if (requestFailures.length) {
    failures.push(`请求失败 ${requestFailures.length} 条`);
  }

  if (dialogs.length) {
    failures.push(`出现未预期对话框 ${dialogs.length} 个`);
  }

  if (!summary.appLoaderExists) {
    failures.push("首屏 app-loader 节点不存在");
  }

  if (!summary.appLoaderHasShell) {
    failures.push("首屏 app-loader 未复用统一的 sys-loader-shell 壳层");
  }

  if (!summary.appLoaderHiddenAfterBoot) {
    failures.push("应用启动完成后首屏 app-loader 未被隐藏");
  }

  if (loaderSettingConfig.effectiveValue) {
    if (!summary.loaderSectionExists) {
      failures.push("配置已开启，但设置面板未渲染“加载动画样式”分组");
    }

    if (summary.loaderPreviewCount <= 0) {
      failures.push("配置已开启，但设置面板未渲染加载动画预览卡片");
    }

    if (!loaderInteraction.changed) {
      failures.push("配置已开启，但设置面板内切换加载动画未生效");
    }
  }

  if (devLoaderBefore.devSwitcherExists) {
    if (devLoaderAfterOpen.styleOptionCount <= 0) {
      failures.push("开发态加载动画切换器展开后没有任何可选项");
    }

    if (!devLoaderSwitchResult.changed) {
      failures.push("开发态加载动画切换器点击后未切换样式");
    }
  }

  return failures;
}

const loaderSettingConfig = await resolveLoaderSettingConfig();
const { chromium } = await importPlaywright();

await mkdir(resolve(repoRoot, ".runtime"), { recursive: true });

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage({
  viewport: {
    width: 1440,
    height: 1024,
  },
});

const consoleMessages = [];
const pageErrors = [];
const requestFailures = [];
const dialogs = [];

page.on("console", (message) => {
  consoleMessages.push(`[${message.type()}] ${message.text()}`);
});

page.on("pageerror", (error) => {
  pageErrors.push(String(error));
});

page.on("requestfailed", (request) => {
  requestFailures.push(
    `${request.method()} ${request.url()} -> ${request.failure()?.errorText || "unknown"}`,
  );
});

page.on("dialog", async (dialog) => {
  dialogs.push(`${dialog.type()}: ${dialog.message()}`);
  await dialog.dismiss();
});

const waitForSettled = async () => {
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
};

try {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await waitForSettled();

  const loginButton = page.getByRole("button", { name: "登录", exact: true });
  if (await loginButton.isVisible().catch(() => false)) {
    await loginButton.click();
    await page.waitForURL("**/#/home", { timeout: 30000 }).catch(() => {});
    await waitForSettled();
  }

  await page.evaluate(() => {
    localStorage.setItem(
      "LAY_PANEL_MEMORY",
      JSON.stringify({
        visible: true,
        scrollTop: 0,
      }),
    );
    localStorage.setItem("LAY_PANEL_VISIBLE", "true");
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSettled();

  const summary = await page.evaluate(
    ({ loaderSettingEnabledByConfig }) => {
      const getText = (selector) =>
        document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() ||
        "";

      const findLoaderSection = () =>
        Array.from(document.querySelectorAll(".setting-section")).find((section) =>
          section.querySelector(".section-title")?.textContent?.includes("加载动画样式"),
        );

      const loaderSection = findLoaderSection();
      const appLoader = document.getElementById("app-loader");

      return {
        title: document.title,
        url: location.href,
        loaderSettingEnabledByConfig,
        rightPanelExists: Boolean(document.querySelector(".right-panel")),
        laySettingExists: Boolean(document.querySelector(".lay-setting")),
        sectionCount: document.querySelectorAll(".setting-section").length,
        loaderSectionExists: Boolean(loaderSection),
        loaderPreviewCount:
          loaderSection?.querySelectorAll(".loader-preview-item").length ?? 0,
        hasLoaderStyleHeading: Boolean(loaderSection),
        loaderLabels: Array.from(
          loaderSection?.querySelectorAll(".preview-label") || [],
        )
          .map((node) => node.textContent?.trim())
          .filter(Boolean),
        appLoaderExists: Boolean(appLoader),
        appLoaderHasShell: Boolean(appLoader?.querySelector(".sys-loader-shell")),
        appLoaderHiddenAfterBoot:
          appLoader instanceof HTMLElement
            ? appLoader.style.display === "none"
            : false,
        appLoaderLoaderKey:
          appLoader?.querySelector(".sys-loader-shell")?.getAttribute("data-loader-key") ||
          null,
        rightPanelText: getText(".right-panel").slice(0, 800),
        currentLoaderStyle: localStorage.getItem("sys-loader-style"),
        bodySnippet: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 800),
        bodyHtmlSnippet: document.body.innerHTML
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1200),
      };
    },
    { loaderSettingEnabledByConfig: loaderSettingConfig.effectiveValue },
  );

  const loaderInteraction = loaderSettingConfig.effectiveValue
    ? await page.evaluate(() => {
        const loaderSection = Array.from(
          document.querySelectorAll(".setting-section"),
        ).find((section) =>
          section.querySelector(".section-title")?.textContent?.includes("加载动画样式"),
        );

        if (!loaderSection) {
          return {
            skipped: false,
            reason: "section-missing",
            before: localStorage.getItem("sys-loader-style"),
            after: localStorage.getItem("sys-loader-style"),
            changed: false,
            selectedLabel: null,
          };
        }

        const items = Array.from(
          loaderSection.querySelectorAll(".loader-preview-item"),
        );
        const target = items.find((node) => !node.classList.contains("is-active"));
        const before = localStorage.getItem("sys-loader-style");

        if (!target) {
          return {
            skipped: false,
            reason: "no-alternative-loader",
            before,
            after: before,
            changed: false,
            selectedLabel: null,
          };
        }

        target.scrollIntoView({ block: "center" });
        target.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          }),
        );

        return {
          skipped: false,
          reason: null,
          before,
          after: localStorage.getItem("sys-loader-style"),
          changed: localStorage.getItem("sys-loader-style") !== before,
          selectedLabel:
            target.querySelector(".preview-label")?.textContent?.trim() || null,
        };
      })
    : {
        skipped: true,
        reason: "config-disabled",
        before: await page.evaluate(() => localStorage.getItem("sys-loader-style")),
        after: await page.evaluate(() => localStorage.getItem("sys-loader-style")),
        changed: false,
        selectedLabel: null,
      };

  const devLoaderBefore = await page.evaluate(() => ({
    devSwitcherExists: Boolean(document.querySelector(".dev-loader-switch")),
    styleOptionCount: document.querySelectorAll(".dev-loader-switch .style-option")
      .length,
    styleLabels: Array.from(document.querySelectorAll(".dev-loader-switch .style-name"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean),
    currentLoaderStyle: localStorage.getItem("sys-loader-style"),
  }));

  const devLoaderTrigger = page.locator(".dev-loader-switch .trigger");
  if (await devLoaderTrigger.count()) {
    await devLoaderTrigger.click();
    await page.waitForTimeout(400);
  }

  const devLoaderAfterOpen = await page.evaluate(() => ({
    styleOptionCount: document.querySelectorAll(".dev-loader-switch .style-option")
      .length,
    styleLabels: Array.from(document.querySelectorAll(".dev-loader-switch .style-name"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean),
  }));

  const devLoaderSwitchResult = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll(".dev-loader-switch .style-option"));
    const current = localStorage.getItem("sys-loader-style");
    const target = options.find((node) => !node.classList.contains("active"));

    if (!target) {
      return {
        before: current,
        after: current,
        changed: false,
        selectedLabel: null,
      };
    }

    target.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      }),
    );

    return {
      before: current,
      after: localStorage.getItem("sys-loader-style"),
      changed: localStorage.getItem("sys-loader-style") !== current,
      selectedLabel: target.querySelector(".style-name")?.textContent?.trim() || null,
    };
  });

  await page.screenshot({
    path: SCREENSHOT_PATH,
    fullPage: true,
  });

  const failures = buildFailureList({
    loaderSettingConfig,
    summary,
    loaderInteraction,
    devLoaderBefore,
    devLoaderAfterOpen,
    devLoaderSwitchResult,
    pageErrors,
    requestFailures,
    dialogs,
  });

  const result = {
    appUrl: APP_URL,
    loaderSettingConfig,
    summary,
    loaderInteraction,
    devLoaderBefore,
    devLoaderAfterOpen,
    devLoaderSwitchResult,
    dialogs,
    consoleMessages,
    pageErrors,
    requestFailures,
    screenshotPath: SCREENSHOT_PATH,
    failures,
  };

  console.log(JSON.stringify(result, null, 2));

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
} finally {
  await browser.close();
}
