import { createStandardApp } from "@repo/core";
import { WebSocketPlugin } from "./utils/websocket";

createStandardApp({
  socketPlugins: [WebSocketPlugin]
}).then(bootstrap => bootstrap.mount("#app"));
