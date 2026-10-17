#!/usr/bin/env node
/**
 * icons-animated 动画图标同步器
 *
 * 上游：https://github.com/ln-dev7/icons-animated（MIT）
 *       Vue 3 组件位于 `frameworks/vue/<lib>/<icon>.vue`，由上游生成器产出，
 *       每个文件自带一份迷你运行时并依赖 `motion`（版本必须与上游一致）。
 *
 * 为什么是「按清单拉取」而不是整库 vendoring：
 *   上游共 1318 个组件、33.7 MB，单文件中位 26 KB（内含重复的运行时）。
 *   全量引入会显著膨胀仓库与构建产物，因此只同步业务真正用到的图标。
 *
 * 用法：
 *   node scripts/sync-animated-icons.mjs                # 下载清单中的图标并重建 registry
 *   node scripts/sync-animated-icons.mjs --check        # 离线校验（不联网）：sha256 + registry + 结构
 *   node scripts/sync-animated-icons.mjs --check --remote  # 额外比对上游，检测上游漂移
 *
 * 新增图标：改下面的 ICON_MANIFEST，再跑一次同步；提交时把 .vue、registry.ts、
 *          sources.json 一起提交。`--check` 可在 CI 里防止有人手改生成物（不依赖网络）。
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** 上游仓库与钉死的提交（禁止用 main，避免上游变动导致产物漂移） */
const UPSTREAM_REPO = "ln-dev7/icons-animated";
const UPSTREAM_REF = "3561aea87c239ade543a6388e69ea2f2edaa6ac6";
const RAW_BASE = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_REF}`;

/** 图标清单：lib → 图标文件名（不含 .vue）。改这里即可增删。 */
const ICON_MANIFEST = {
  heroicons: ["bell", "heart", "plus", "trash"],
  hugeicons: ["bell", "heart", "plus", "trash"],
  phosphor: ["bell", "heart", "plus", "trash"],
  tabler: ["bell", "heart", "plus", "trash"],
};

/** 需要随组件一起再分发的许可证文件（MIT 要求保留版权与许可声明） */
const NOTICE_FILES = {
  "LICENSE": "LICENSE",
  "THIRD_PARTY_NOTICES.md": "THIRD_PARTY_NOTICES.md",
};

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "..", "src", "components", "ReIcon", "animated");
const CHECK = process.argv.includes("--check");
const REMOTE = process.argv.includes("--remote");

/** 生成顺序固定的库列表（对象键插入顺序即清单顺序） */
const LIB_ORDER = Object.keys(ICON_MANIFEST);

/** 清单里所有图标的 key（`lib/icon`），顺序固定 */
const EXPECTED_KEYS = LIB_ORDER.flatMap((lib) => ICON_MANIFEST[lib].map((icon) => `${lib}/${icon}`));

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "rekit-animated-icons-sync" } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.text();
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** 上游文件必须真的是那个组件；网络错误页/半截文件要当场拒绝，不能静默落盘 */
function assertUpstreamSfc(label, text) {
  const problems = [];
  if (!text.startsWith('<script setup lang="ts">')) problems.push('未以 <script setup lang="ts"> 开头');
  if (!text.includes("mountIconProgram")) problems.push("缺少 mountIconProgram");
  if (!text.includes("<template>")) problems.push("缺少 <template>");
  if (text.length < 5000) problems.push(`体积极小（${text.length} 字节），疑似不是完整组件`);
  if (text.includes("<html") || text.includes("404: Not Found")) problems.push("疑似 HTTP 错误页");
  if (problems.length) {
    throw new Error(`${label}.vue 校验失败：${problems.join("；")}`);
  }
}

/** registry.ts 的内容完全由清单决定，保证可重复生成与逐字比对 */
function buildRegistry() {
  const lines = [];
  lines.push("/**");
  lines.push(" * ReIcon 动画图标注册表 —— 由 scripts/sync-animated-icons.mjs 生成，请勿手改。");
  lines.push(` * 上游：${UPSTREAM_REPO} @ ${UPSTREAM_REF}（MIT）`);
  lines.push(" * 新增/删除图标：改脚本里的 ICON_MANIFEST 后执行 `pnpm --filter @repo/ui icons:sync`。");
  lines.push(" */");
  lines.push('import type { Component } from "vue";');
  lines.push("");
  lines.push("/** 动画图标名的统一前缀：`anim:<lib>:<icon>` */");
  lines.push('export const ANIMATED_ICON_PREFIX = "anim:";');
  lines.push("");
  lines.push("/** 一个动画图标的注册项 */");
  lines.push("export interface AnimatedIconEntry {");
  lines.push("  /** 完整图标名：`anim:<lib>:<icon>` */");
  lines.push("  readonly name: string;");
  lines.push("  /** 上游图标库 */");
  lines.push("  readonly lib: string;");
  lines.push("  /** 上游图标文件名（不含 .vue） */");
  lines.push("  readonly icon: string;");
  lines.push("  /** 懒加载该图标组件（每个图标独立 chunk，不会进主包） */");
  lines.push("  readonly load: () => Promise<{ default: Component }>;");
  lines.push("}");
  lines.push("");
  lines.push("const ENTRIES: readonly AnimatedIconEntry[] = [");
  for (const lib of LIB_ORDER) {
    for (const icon of ICON_MANIFEST[lib]) {
      lines.push(
        `  { name: "anim:${lib}:${icon}", lib: "${lib}", icon: "${icon}", load: () => import("./${lib}/${icon}.vue") },`,
      );
    }
  }
  lines.push("];");
  lines.push("");
  lines.push("const BY_NAME = new Map<string, AnimatedIconEntry>(ENTRIES.map((entry) => [entry.name, entry]));");
  lines.push("");
  lines.push("/** 全部动画图标名（`anim:<lib>:<icon>`），顺序固定，供选择器稳定分页 */");
  lines.push("export const ANIMATED_ICON_NAMES: readonly string[] = ENTRIES.map((entry) => entry.name);");
  lines.push("");
  lines.push("/** 是否是本注册表认识的动画图标名 */");
  lines.push("export function isAnimatedIconName(name: unknown): name is string {");
  lines.push('  return typeof name === "string" && BY_NAME.has(name);');
  lines.push("}");
  lines.push("");
  lines.push("/** 取某个动画图标的懒加载器；未注册时返回 null（调用方回退到普通图标） */");
  lines.push("export function loadAnimatedIcon(name: string): (() => Promise<{ default: Component }>) | null {");
  lines.push("  return BY_NAME.get(name)?.load ?? null;");
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function buildSources(hashes) {
  const sources = {
    upstream: { repo: UPSTREAM_REPO, ref: UPSTREAM_REF, license: "MIT" },
    files: {},
  };
  for (const key of EXPECTED_KEYS) {
    sources.files[`${key}.vue`] = { sha256: hashes.get(key) };
  }
  return JSON.stringify(sources, null, 2) + "\n";
}

async function readIfExists(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

/** 本地已同步文件的路径 */
function localPath(key) {
  return join(OUT_DIR, `${key}.vue`);
}

/* ------------------------------------------------------------------ */
/* 同步：联网下载并写入                                                 */
/* ------------------------------------------------------------------ */

async function sync() {
  const hashes = new Map();
  const writes = [];

  for (const key of EXPECTED_KEYS) {
    const text = await fetchText(`${RAW_BASE}/frameworks/vue/${key}.vue`);
    assertUpstreamSfc(key, text);
    hashes.set(key, sha256(text));

    const target = localPath(key);
    const local = await readIfExists(target);
    if (local !== text) writes.push({ path: target, content: text });
  }

  for (const [file, upstreamPath] of Object.entries(NOTICE_FILES)) {
    const text = await fetchText(`${RAW_BASE}/${upstreamPath}`);
    const target = join(OUT_DIR, file);
    const local = await readIfExists(target);
    if (local !== text) writes.push({ path: target, content: text });
  }

  const registryPath = join(OUT_DIR, "registry.ts");
  const localRegistry = await readIfExists(registryPath);
  if (localRegistry !== buildRegistry()) {
    writes.push({ path: registryPath, content: buildRegistry() });
  }

  const sourcesPath = join(OUT_DIR, "sources.json");
  const localSources = await readIfExists(sourcesPath);
  if (localSources !== buildSources(hashes)) {
    writes.push({ path: sourcesPath, content: buildSources(hashes) });
  }

  for (const { path, content } of writes) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
    console.log(`  写入 ${path.slice(OUT_DIR.length + 1)}`);
  }
  console.log(
    writes.length
      ? `[icons:sync] 完成：${writes.length} 个文件更新（共 ${hashes.size} 个图标）。`
      : `[icons:sync] 已是最新：${hashes.size} 个图标，无需写入。`,
  );
}

/* ------------------------------------------------------------------ */
/* 校验：默认离线；--remote 才联网                                       */
/* ------------------------------------------------------------------ */

/** 读 sources.json 并做结构校验，返回 `lib/icon → sha256` */
async function readSourcesOffline(problems) {
  const sourcesPath = join(OUT_DIR, "sources.json");
  const text = await readIfExists(sourcesPath);
  if (text === null) {
    problems.push("sources.json 不存在（缺失同步产物）");
    return new Map();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    problems.push(`sources.json 不是合法 JSON：${error instanceof Error ? error.message : String(error)}`);
    return new Map();
  }

  const upstream = parsed?.upstream;
  if (!upstream || typeof upstream !== "object") {
    problems.push("sources.json 缺少 upstream 元信息");
  } else {
    if (upstream.repo !== UPSTREAM_REPO) problems.push(`sources.json 的 upstream.repo 与脚本不一致（${upstream.repo}）`);
    if (upstream.ref !== UPSTREAM_REF) problems.push(`sources.json 的 upstream.ref 与脚本不一致（${upstream.ref}）`);
    if (upstream.license !== "MIT") problems.push(`sources.json 的 upstream.license 异常（${upstream.license}）`);
  }

  const files = parsed?.files;
  if (!files || typeof files !== "object") {
    problems.push("sources.json 缺少 files 表");
    return new Map();
  }

  const recordedKeys = Object.keys(files).map((name) => name.replace(/\.vue$/, ""));
  const missing = EXPECTED_KEYS.filter((key) => !recordedKeys.includes(key));
  const extra = recordedKeys.filter((key) => !EXPECTED_KEYS.includes(key));
  if (missing.length) problems.push(`sources.json 缺少记录：${missing.join(", ")}`);
  if (extra.length) problems.push(`sources.json 有清单外的记录：${extra.join(", ")}`);

  const hashes = new Map();
  for (const key of EXPECTED_KEYS) {
    const sha = files[`${key}.vue`]?.sha256;
    if (typeof sha !== "string" || !/^[0-9a-f]{64}$/.test(sha)) {
      problems.push(`sources.json 里 ${key}.vue 的 sha256 缺失或非法`);
      continue;
    }
    hashes.set(key, sha);
  }
  return hashes;
}

async function checkOffline(problems) {
  const recorded = await readSourcesOffline(problems);

  for (const key of EXPECTED_KEYS) {
    const text = await readIfExists(localPath(key));
    if (text === null) {
      problems.push(`${key}.vue 不存在`);
      continue;
    }
    try {
      assertUpstreamSfc(key, text);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const expected = recorded.get(key);
    if (expected && sha256(text) !== expected) {
      problems.push(`${key}.vue 与 sources.json 记录的校验和不一致（文件被手改过）`);
    }
  }

  for (const file of Object.keys(NOTICE_FILES)) {
    const text = await readIfExists(join(OUT_DIR, file));
    if (text === null || text.trim().length === 0) problems.push(`${file} 缺失或为空`);
  }

  const registry = await readIfExists(join(OUT_DIR, "registry.ts"));
  if (registry === null) {
    problems.push("registry.ts 不存在");
  } else if (registry !== buildRegistry()) {
    problems.push("registry.ts 与 ICON_MANIFEST 不一致（有人手改，或清单改了没同步）");
  }
}

async function checkRemote(problems) {
  const hashes = new Map();

  for (const key of EXPECTED_KEYS) {
    const text = await fetchText(`${RAW_BASE}/frameworks/vue/${key}.vue`);
    assertUpstreamSfc(key, text);
    hashes.set(key, sha256(text));

    const local = await readIfExists(localPath(key));
    if (local !== text) {
      problems.push(`${key}.vue 与上游不一致（上游 ${sha256(text).slice(0, 12)}，本地可能有改动或上游变更）`);
    }
  }

  for (const [file, upstreamPath] of Object.entries(NOTICE_FILES)) {
    const text = await fetchText(`${RAW_BASE}/${upstreamPath}`);
    const local = await readIfExists(join(OUT_DIR, file));
    if (local !== text) problems.push(`${file} 与上游不一致`);
  }

  const localSources = await readIfExists(join(OUT_DIR, "sources.json"));
  if (localSources !== buildSources(hashes)) {
    problems.push("sources.json 与上游校验和不一致");
  }
}

async function check() {
  const problems = [];
  await checkOffline(problems);
  if (REMOTE) {
    try {
      await checkRemote(problems);
    } catch (error) {
      problems.push(`联网校验失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (problems.length) {
    console.error(`[icons:check] 失败 ${problems.length} 项：`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("[icons:check] 修复：执行 `pnpm --filter @repo/ui icons:sync` 后重新提交。");
    process.exitCode = 1;
    return;
  }

  console.log(
    `[icons:check] 通过：${EXPECTED_KEYS.length} 个图标${REMOTE ? `与上游 ${UPSTREAM_REF.slice(0, 12)} 一致` : "本地完整性校验通过（离线）"}。`,
  );
}

async function run() {
  if (REMOTE && !CHECK) {
    throw new Error("--remote 只能与 --check 一起用（同步请直接执行 icons:sync）");
  }
  if (CHECK) return check();
  return sync();
}

run().catch((error) => {
  console.error(`[icons:sync] 失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
