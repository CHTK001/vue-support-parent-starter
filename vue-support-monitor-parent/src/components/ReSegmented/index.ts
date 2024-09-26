import "./src/index.css";
import reSegmented from "./src/index.vue";
import { withInstall } from "@pureadmin/utils";

/** 分段控制器组件 */
export const ReSegmented = withInstall(reSegmented);

export default ReSegmented;
export type { OptionsType } from "./src/type";
