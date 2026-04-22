import { withInstall } from "@repo/utils";
import component from "./index.vue";

export type {
  OverlayStackClosePayload,
  OverlayStackCloseReason,
  OverlayStackConfig,
  OverlayStackItem,
  OverlayStackMessage,
  OverlayStackMessageLevel,
  OverlayStackPosition,
  OverlayStackTone,
  ResolvedOverlayStackItem,
} from "./types";

export const ScOverlayStack = withInstall(component);
export default ScOverlayStack;
