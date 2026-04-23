import {
  createVNode,
  defineComponent,
  getCurrentInstance,
  h,
  render,
  type AppContext,
} from "vue";
import LayOverlayStack from "../components/lay-overlay-stack/index.vue";
import {
  STANDALONE_OVERLAY_HOST_ID,
  disposeStandaloneOverlayHost,
  getOverlayStackHostCount,
} from "./standaloneOverlayHostRegistry";

let mounted = false;

const StandaloneOverlayHost = defineComponent({
  name: "StandaloneOverlayHost",
  setup() {
    return () => h(LayOverlayStack, { standalone: true });
  },
});

const resolveContainer = () => {
  if (typeof document === "undefined") {
    return null;
  }
  const existing = document.getElementById(STANDALONE_OVERLAY_HOST_ID);
  if (existing) {
    return existing;
  }
  const container = document.createElement("div");
  container.id = STANDALONE_OVERLAY_HOST_ID;
  document.body.appendChild(container);
  return container;
};

export const ensureStandaloneOverlayHost = (appContext?: AppContext | null) => {
  if (mounted || getOverlayStackHostCount() > 0) {
    return;
  }
  const container = resolveContainer();
  if (!container) {
    return;
  }
  const vnode = createVNode(StandaloneOverlayHost);
  const context = appContext || getCurrentInstance()?.appContext || null;
  if (context) {
    vnode.appContext = context;
  }
  render(vnode, container);
  mounted = true;
};

export const resetStandaloneOverlayHostForTest = () => {
  disposeStandaloneOverlayHost();
  mounted = false;
};
