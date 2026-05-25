import { createStandardApp } from "@repo/core";
import "./styles/app.scss";

createStandardApp().then(bootstrap => bootstrap.mount("#app"));
