import { defineComponent, h } from "vue";
import { getConfig } from "@repo/config";
import { useSettingStoreHook } from "@repo/core";
import { useLayout } from "../../hooks/useLayout";
import LayNavbar from "../lay-navbar/index.vue";
import NavHorizontal from "../lay-sidebar/NavHorizontal.vue";
import LayTag from "../lay-tag/index.vue";

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    const set = useSettingStoreHook();
    const pureSetting = getConfig();
    const { layout } = useLayout();
    return h(
      "div",
      { class: { "fixed-header shadow-tab": set.fixedHeader } },
      {
        default: () => [
          !pureSetting.hiddenSideBar &&
          (layout.value === "vertical" ||
            layout.value === "lay-xx" ||
            layout.value === "mix" ||
            layout.value === "hover" ||
            layout.value === "drawer" ||
            layout.value === "double")
            ? h(LayNavbar)
            : null,
          !pureSetting.hiddenSideBar && layout.value === "horizontal"
            ? h(NavHorizontal)
            : null,
          layout.value !== "lay-xx" ? h(LayTag) : null,
        ],
      },
    );
  },
});

export default LayHeader;
