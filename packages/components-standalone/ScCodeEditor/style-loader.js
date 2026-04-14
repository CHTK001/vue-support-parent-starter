let scCodeEditorBaseStylesPromise;
const scCodeEditorThemeStyles = new Map();

const toVoid = (promise) => promise.then(() => undefined);

export const ensureScCodeEditorBaseStyles = () => {
  if (!scCodeEditorBaseStylesPromise) {
    scCodeEditorBaseStylesPromise = Promise.all([
      toVoid(import("codemirror/lib/codemirror.css")),
      toVoid(import("codemirror/addon/hint/show-hint.css")),
    ]).then(() => undefined);
  }

  return scCodeEditorBaseStylesPromise;
};

export const ensureScCodeEditorThemeStyle = (theme = "idea") => {
  if (!theme) {
    return Promise.resolve();
  }

  if (!scCodeEditorThemeStyles.has(theme)) {
    const loader =
      theme === "darcula"
        ? () => import("codemirror/theme/darcula.css")
        : theme === "idea"
          ? () => import("codemirror/theme/idea.css")
          : null;

    scCodeEditorThemeStyles.set(
      theme,
      loader ? toVoid(loader()) : Promise.resolve(),
    );
  }

  return scCodeEditorThemeStyles.get(theme);
};

export const ensureScCodeEditorStyles = (theme = "idea") =>
  Promise.all([
    ensureScCodeEditorBaseStyles(),
    ensureScCodeEditorThemeStyle(theme),
  ]).then(() => undefined);
