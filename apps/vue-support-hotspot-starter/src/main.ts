import { createStandardApp } from "@repo/core";
import { WebSocketPlugin } from "./utils/websocket";
import "./styles/app.scss";

createStandardApp({
  socketPlugins: [WebSocketPlugin]
}).then(bootstrap => bootstrap.mount("#app"));
