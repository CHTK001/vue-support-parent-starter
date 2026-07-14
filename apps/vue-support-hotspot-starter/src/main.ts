import { createStandardApp } from "@repo/core";
import { WebSocketPlugin } from "./utils/websocket";
import "./styles/app.scss";
import homeRoutes from "./router/modules/home";
import hotspotRoutes from "./router/modules/hotspot";

createStandardApp({
  socketPlugins: [WebSocketPlugin],
  appRoutes: [homeRoutes, hotspotRoutes]
}).then(bootstrap => bootstrap.mount("#app"));
