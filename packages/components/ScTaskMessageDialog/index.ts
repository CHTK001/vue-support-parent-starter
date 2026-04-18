import { withInstall } from "@repo/utils";
import component from "./index.vue";

export type {
  TaskDialogModel,
  TaskDialogStep,
  TaskDialogSummaryItem,
} from "./types";

export const ScTaskMessageDialog = withInstall(component);
export default ScTaskMessageDialog;

