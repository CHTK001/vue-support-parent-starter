import "@repo/assets/less/main.less";
import { http } from "@repo/utils";
// import {AyinColor} from "ayin-color"

export default function (app) {
  window.axios = http;
  // app.use(AyinColor)

  // const comps=[ ];
  // comps.forEach((com,a) => {
  //   let cona=com.name?com.name:com.__name
  //   app.component(cona,com);
  // });
}