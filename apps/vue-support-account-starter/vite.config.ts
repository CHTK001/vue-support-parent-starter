import { createViteConfig } from "@repo/build-config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json";

const appRoot = dirname(fileURLToPath(import.meta.url));
const accountPagesRoot = resolve(appRoot, "../../pages/account");
const emailPagesRoot = resolve(appRoot, "../../pages/email");

export default createViteConfig(import.meta.url, pkg)
  .alias("@pages/account", resolve(accountPagesRoot, "src"))
  .alias("@pages/email", resolve(emailPagesRoot, "src"))
  .fsAllow(accountPagesRoot)
  .fsAllow(emailPagesRoot)
  .fsAllowRelative("../../")
  .port(8850)
  .proxy("/api", "http://127.0.0.1:18190")
  .build();
