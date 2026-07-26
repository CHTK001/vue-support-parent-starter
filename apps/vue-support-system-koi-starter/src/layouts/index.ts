import { defineComponent, h, type Component, defineAsyncComponent } from "vue";

const Layout = defineComponent({
  name: "Layout",
  setup() {
    return {};
  },
  render() {
    const LayoutComponent = defineAsyncComponent(() => import("@layout/koi/src").then(m => m.KoiLayout as Component));
    return h(LayoutComponent);
  }
});

export default Layout;