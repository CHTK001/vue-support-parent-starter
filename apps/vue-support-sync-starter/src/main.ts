import { createStandardApp } from "@repo/core";
import "./styles/app.scss";

createStandardApp({
  enableTippy: false,
}).then((bootstrap) => bootstrap.mount("#app"));
