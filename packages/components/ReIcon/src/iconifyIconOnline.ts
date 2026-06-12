import { h, defineComponent } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";
import { addAPIProvider } from "@iconify/vue";
import { getConfig } from "@repo/config";

const _iconifyConfig = getConfig();
const _iconifyApiUrl = _iconifyConfig?.IconifyApiUrl || _iconifyConfig?.iconifyApiUrl;

if (_iconifyApiUrl) {
  try {
    addAPIProvider("_local", {
      icons: {},
      aliases: {},
      widths: {},
      heights: {},
      loading: false,
      loaded: false,
      resources: [`${_iconifyApiUrl}/iconify.json`],
      customResources: [`${_iconifyApiUrl}/iconify.json`],
    });
  } catch (e) {
    console.warn("[Iconify] addAPIProvider failed, using default:", e);
  }
}

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
    const iconValue = String(this.icon || "").trim();
    const isImageSource =
      /^(https?:)?\/\//.test(iconValue)
      || /^data:image\//.test(iconValue)
      || /^blob:/.test(iconValue)
      || /^\/(?!\/)/.test(iconValue)
      || /^\.\.?\//.test(iconValue)
      || /\.(svg|png|jpe?g|gif|webp|bmp|ico)(\?.*)?$/i.test(iconValue);

    if (isImageSource) {
      return h("img", {
        src: iconValue,
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

    const normalizedIcon = iconValue && !iconValue.includes(":")
      ? `ri:${iconValue}`
      : iconValue;

    return h(
      IconifyIcon,
      {
        icon: normalizedIcon,
        style: attrs?.style ? Object.assign(attrs.style, { outline: "none" }) : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
