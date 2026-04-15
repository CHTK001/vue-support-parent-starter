let codeMirrorCorePromise;
let codeMirrorAddonsPromise;
const codeMirrorModePromises = new Map();

const normalizeMode = (mode = "sql") => {
  const normalized = String(mode || "sql").toLowerCase();

  if (
    normalized.includes("shell") ||
    normalized.includes("bash") ||
    normalized === "sh"
  ) {
    return "shell";
  }

  if (
    normalized.includes("yaml") ||
    normalized === "yml"
  ) {
    return "yaml";
  }

  if (
    normalized.includes("xml") ||
    normalized.includes("html")
  ) {
    return "xml";
  }

  if (
    normalized.includes("properties") ||
    normalized.includes("ini")
  ) {
    return "properties";
  }

  if (normalized.includes("sql")) {
    return "sql";
  }

  return "javascript";
};

export const ensureScCodeEditorCore = () => {
  if (!codeMirrorCorePromise) {
    codeMirrorCorePromise = import("codemirror").then(
      (module) => module.default || module,
    );
  }

  return codeMirrorCorePromise;
};

export const ensureScCodeEditorAddons = () => {
  if (!codeMirrorAddonsPromise) {
    codeMirrorAddonsPromise = Promise.all([
      import("codemirror/addon/display/autorefresh"),
      import("codemirror/addon/selection/active-line"),
      import("codemirror/addon/hint/show-hint"),
      import("codemirror/addon/hint/sql-hint"),
    ]).then(() => undefined);
  }

  return codeMirrorAddonsPromise;
};

export const ensureScCodeEditorMode = (mode = "sql") => {
  const normalizedMode = normalizeMode(mode);

  if (!codeMirrorModePromises.has(normalizedMode)) {
    const loader =
      normalizedMode === "shell"
        ? () => import("codemirror/mode/shell/shell")
        : normalizedMode === "yaml"
          ? () => import("codemirror/mode/yaml/yaml")
          : normalizedMode === "xml"
            ? () => import("codemirror/mode/xml/xml")
            : normalizedMode === "properties"
              ? () => import("codemirror/mode/properties/properties")
              : normalizedMode === "sql"
                ? () => import("codemirror/mode/sql/sql")
                : () => import("codemirror/mode/javascript/javascript");

    codeMirrorModePromises.set(
      normalizedMode,
      loader().then(() => undefined),
    );
  }

  return codeMirrorModePromises.get(normalizedMode);
};

export const ensureScCodeEditorRuntime = async (mode = "sql") => {
  const [CodeMirror] = await Promise.all([
    ensureScCodeEditorCore(),
    ensureScCodeEditorAddons(),
    ensureScCodeEditorMode(mode),
  ]);

  return CodeMirror;
};
