import { createRequire } from "node:module";
import { normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger, type Logger, type Plugin } from "vite";
import { root } from "./utils";

export type WarningFilter = string | RegExp | ((message: string) => boolean);
export type ManualChunkMatcher =
  | string
  | RegExp
  | ((normalizedId: string) => boolean);

export interface ManualChunkGroup {
  name: string;
  matchers: ManualChunkMatcher[];
}

const DEFAULT_VENDOR_CHUNK_GROUPS: ManualChunkGroup[] = [
  {
    name: "vendor-ui",
    matchers: [
      "/node_modules/vue/",
      "/node_modules/@vue/",
      "/node_modules/vue-router/",
      "/node_modules/vue-i18n/",
      "/node_modules/pinia/",
      "/node_modules/@vueuse/",
      "/node_modules/element-plus/",
      "/node_modules/@element-plus/",
      "/node_modules/@pureadmin/",
    ],
  },
  {
    name: "vendor-editor",
    matchers: [
      "/node_modules/codemirror/",
      "/node_modules/monaco-editor/",
      "/node_modules/prismjs/",
      "/node_modules/sql-formatter/",
    ],
  },
  {
    name: "vendor-echarts",
    matchers: [
      "/node_modules/echarts/",
      "/node_modules/zrender/",
      "/node_modules/@antv/",
    ],
  },
  {
    name: "vendor-graph",
    matchers: [
      "/node_modules/rete",
      "/node_modules/cytoscape/",
      "/node_modules/dagre/",
    ],
  },
  {
    name: "vendor-terminal",
    matchers: [
      "/node_modules/xterm",
      "/node_modules/@xterm/",
      "/node_modules/@novnc/",
      "/node_modules/guacamole-common-js/",
    ],
  },
  {
    name: "vendor-map",
    matchers: [
      "/node_modules/leaflet",
      "/node_modules/ol/",
      "/node_modules/ol-",
      "/node_modules/proj4/",
      "/node_modules/@turf/",
      "/node_modules/mapv/",
      "/node_modules/h3-js/",
      "/node_modules/ngeohash/",
      "/node_modules/cesium/",
      "/node_modules/olcs/",
    ],
  },
  {
    name: "vendor-3d",
    matchers: ["/node_modules/three/"],
  },
  {
    name: "vendor-ai",
    matchers: [
      "/node_modules/@mlc-ai/",
      "/node_modules/@huggingface/",
      "/node_modules/@xenova/",
    ],
  },
];

function normalizeId(id: string): string {
  return id.replaceAll("\\", "/");
}

function stripQueryAndHash(id: string): string {
  return id.split("?")[0].split("#")[0];
}

function isBareImport(id: string): boolean {
  return (
    !id.startsWith(".") &&
    !id.startsWith("/") &&
    !id.startsWith("\0") &&
    !id.startsWith("virtual:") &&
    !/^[A-Za-z]:[\\/]/.test(id)
  );
}

function matchesWarning(
  pattern: WarningFilter,
  message: string,
): boolean {
  if (typeof pattern === "string") return message.includes(pattern);
  if (pattern instanceof RegExp) return pattern.test(message);
  return pattern(message);
}

function matchesChunk(
  matcher: ManualChunkMatcher,
  normalizedId: string,
): boolean {
  if (typeof matcher === "string") return normalizedId.includes(matcher);
  if (matcher instanceof RegExp) return matcher.test(normalizedId);
  return matcher(normalizedId);
}

export function resolvePackageImport(
  metaUrl: string,
  specifier: string,
): string {
  return createRequire(fileURLToPath(metaUrl)).resolve(specifier);
}

export function createFilteredLogger(
  patterns: WarningFilter[] = [],
  baseLogger?: Logger,
): Logger {
  const logger = baseLogger ?? createLogger();
  const originalWarn = logger.warn.bind(logger);

  logger.warn = (msg, options) => {
    const message = String(msg);
    if (patterns.some((pattern) => matchesWarning(pattern, message))) return;
    originalWarn(msg, options);
  };

  return logger;
}

export function createVendorManualChunks(
  customGroups: ManualChunkGroup[] = [],
  fallbackChunk?: string,
): (id: string) => string | undefined {
  const groups = [...customGroups, ...DEFAULT_VENDOR_CHUNK_GROUPS];

  return (id: string) => {
    const normalizedId = normalizeId(id);
    if (!normalizedId.includes("/node_modules/")) return undefined;

    for (const group of groups) {
      if (
        group.matchers.some((matcher) => matchesChunk(matcher, normalizedId))
      ) {
        return group.name;
      }
    }

    return fallbackChunk;
  };
}

export function createAggressiveTerserOptions(overrides: any = {}) {
  const baseOptions = {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: [
        "console.log",
        "console.info",
        "console.debug",
        "console.warn",
        "console.error",
      ],
      passes: 3,
      dead_code: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
      reduce_funcs: true,
      inline: 2,
      keep_fargs: false,
      keep_fnames: false,
    },
    mangle: {
      properties: {
        regex: /^_/,
      },
      toplevel: true,
      reserved: [],
      keep_classnames: false,
      keep_fnames: false,
    },
    format: {
      comments: false,
      beautify: false,
      ascii_only: false,
    },
  };

  return {
    ...baseOptions,
    ...overrides,
    compress: {
      ...baseOptions.compress,
      ...overrides.compress,
      pure_funcs:
        overrides.compress?.pure_funcs ?? baseOptions.compress.pure_funcs,
    },
    mangle: {
      ...baseOptions.mangle,
      ...overrides.mangle,
      properties: {
        ...baseOptions.mangle.properties,
        ...overrides.mangle?.properties,
      },
      reserved: overrides.mangle?.reserved ?? baseOptions.mangle.reserved,
    },
    format: {
      ...baseOptions.format,
      ...overrides.format,
    },
  };
}

export function createWorkspaceDependencyFallbackPlugin(
  workspaceRoot = root,
): Plugin {
  const normalizedRoot = normalize(workspaceRoot);
  const nodeModulesSegment = `${sep}node_modules${sep}`;

  return {
    name: "repo-workspace-dependency-fallback",
    async resolveId(source, importer, options) {
      if (!importer || !isBareImport(source)) return null;
      if (source.startsWith("vite/") || source.startsWith("@vite/")) {
        return null;
      }

      const cleanImporter = normalize(stripQueryAndHash(importer));
      if (
        !cleanImporter.startsWith(normalizedRoot) ||
        cleanImporter.includes(nodeModulesSegment)
      ) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (resolved) return null;

      try {
        return createRequire(cleanImporter).resolve(source);
      } catch {
        return null;
      }
    },
  };
}
