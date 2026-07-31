import { fileURLToPath } from "node:url";
import path from "node:path";
import { createVite } from "../../turbo/vite/createVite.ts";

const root = path.dirname(fileURLToPath(import.meta.url));

export default createVite({
  root,
  appName: "system",
  server: {
    port: 5731,
  },
  alias: {
    "@": path.resolve(root, "src"),
  },
});
