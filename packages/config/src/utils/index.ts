// import path from "node:path";
import path from "path-browserify";

export function resolvePath(relative: string, base: string) {
  return path.posix.resolve(relative, base);
}
