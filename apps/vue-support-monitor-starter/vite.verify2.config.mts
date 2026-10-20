import base from "./vite.config.ts";
export default { ...base, build: { ...(base.build ?? {}), outDir: "dist-verify2", emptyOutDir: true, cssMinify: false, minify: false } };
