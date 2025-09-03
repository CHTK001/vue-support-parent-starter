import { Icon as IconifyIconLayout, addIcon } from "@iconify/vue/dist/offline";
import { defineComponent, h, markRaw } from "vue";

const IconifyIcon = markRaw(IconifyIconLayout);
// Iconify Icon在Vue里本地使用（用于内网环境）
export default defineComponent({
  name: "IconifyIconOffline",
  components: { IconifyIcon },
  props: {
    icon: {
      default: null
    }
  },
  render() {
    const attrs = this.$attrs;

    // 检查是否为HTTP/HTTPS URL
    const httpReg = /^https?:\/\//;
    if (typeof this.icon === "string" && httpReg.test(this.icon)) {
      // 如果是HTTP URL，使用img标签渲染
      return h("img", {
        src: this.icon,
        alt: "icon",
        style: {
          width: "1em",
          height: "1em",
          display: "inline-block",
          verticalAlign: "middle",
          objectFit: "contain",
          outline: "none",
          ...(attrs?.style || {})
        },
        ...attrs
      });
    }

    // 处理对象类型的图标
    if (typeof this.icon === "object") addIcon(this.icon, this.icon);

    // 使用Iconify组件
    return h(
      IconifyIcon,
      {
        icon: this.icon,
        style: attrs?.style ? Object.assign(attrs.style, { outline: "none" }) : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
