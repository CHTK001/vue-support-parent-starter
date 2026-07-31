import { defineAsyncComponent } from "vue";
import { getConfig } from "@repo/config";

export default defineAsyncComponent({
  loader: () => {
    const theme = getConfig()?.theme || "koi";
    if (theme === "default") {
      return import("./themes/default/index.vue");
    }
    return import("./themes/koi/index.vue");
  },
  suspensible: false,
  delay: 0,
});
