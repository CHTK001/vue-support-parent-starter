import { h, defineComponent } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";

// Iconify Icon在Vue里在线使用（用于外网环境）
export default defineComponent({
  name: "IconifyIconOnline",
  components: { IconifyIcon },
  props: {
    icon: {
      type: String,
      default: ""
    }
  },
  render() {
    const attrs = this.$attrs;

    // 检查是否为HTTP/HTTPS URL
    const httpReg = /^https?:\/\//;
    if (httpReg.test(this.icon)) {
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

    // 否则使用Iconify组件
    return h(
      IconifyIcon,
      {
        icon: `${this.icon}`,
        style: attrs?.style ? Object.assign(attrs.style, { outline: "none" }) : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
