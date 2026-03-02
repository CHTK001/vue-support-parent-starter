import { h, defineComponent, ref, onMounted } from "vue";
import type { iconType } from "./types";

/**
 * Pixel Icon 组件
 * 支持 @hackernoon/pixel-icon-library 图标库
 * 使用方式: pixel-icon:iconName
 */
export default defineComponent({
  name: "PixelIcon",
  props: {
    icon: {
      type: String,
      required: true,
      default: ""
    }
  },
  setup(props, { attrs }) {
    const iconAttrs = attrs as iconType;
    const iconComponent = ref<any>(null);
    const loading = ref(true);
    const error = ref<Error | null>(null);

    onMounted(async () => {
      try {
        // 动态导入 @hackernoon/pixel-icon-library
        // 使用 Function 构造函数避免 Vite 在构建时解析该包
        const loadPixelIconLib = new Function("return (specifier) => import(specifier)")();
        const pixelIconLib = await loadPixelIconLib("@hackernoon/pixel-icon-library");

        // 获取图标名称（去除 pixel-icon: 前缀）
        const iconName = props.icon.replace(/^pixel-icon:/, "");

        // 尝试多种方式获取图标
        let IconComponent =
          pixelIconLib[iconName] ||
          pixelIconLib.default?.[iconName] ||
          (pixelIconLib.default && typeof pixelIconLib.default === "object" ? pixelIconLib.default[iconName] : null);

        // 如果图标不存在，尝试使用 kebab-case 或 camelCase 转换
        if (!IconComponent) {
          const camelCaseName = iconName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          const kebabCaseName = iconName.replace(/([A-Z])/g, "-$1").toLowerCase();
          IconComponent =
            pixelIconLib[camelCaseName] ||
            pixelIconLib[kebabCaseName] ||
            pixelIconLib.default?.[camelCaseName] ||
            pixelIconLib.default?.[kebabCaseName];
        }

        iconComponent.value = IconComponent;
        loading.value = false;
      } catch (err) {
        error.value = err as Error;
        loading.value = false;
        console.error(`[PixelIcon] 加载图标库失败:`, err);
      }
    });

    return () => {
      const style = {
        width: iconAttrs?.width || "1em",
        height: iconAttrs?.height || "1em",
        display: "inline-block",
        verticalAlign: "middle",
        color: iconAttrs?.color,
        fill: iconAttrs?.fill || iconAttrs?.color || "currentColor",
        ...iconAttrs?.style
      };

      if (loading.value) {
        return h("span", {
          style: {
            ...style,
            backgroundColor: "#f0f0f0",
            borderRadius: "2px"
          }
        });
      }

      if (error.value || !iconComponent.value) {
        const iconName = props.icon.replace(/^pixel-icon:/, "");
        if (!error.value) {
          console.warn(`[PixelIcon] 图标 "${iconName}" 未找到`);
        }
        return h("span", {
          style: {
            ...style,
            backgroundColor: error.value ? "#f00" : "#ccc",
            borderRadius: "2px"
          }
        });
      }

      const IconComponent = iconComponent.value;

      // 如果是一个函数（Vue/React 组件），直接渲染
      if (typeof IconComponent === "function") {
        return h(IconComponent, {
          style,
          ...iconAttrs
        });
      }

      // 如果是 SVG 字符串
      if (typeof IconComponent === "string") {
        return h("span", {
          innerHTML: IconComponent,
          style,
          ...iconAttrs
        });
      }

      // 如果是 SVG 数据对象（Iconify 格式）
      if (typeof IconComponent === "object") {
        // Iconify 格式
        if (IconComponent.body) {
          return h("svg", {
            innerHTML: IconComponent.body,
            viewBox: IconComponent.viewBox || "0 0 24 24",
            width: style.width,
            height: style.height,
            style,
            ...iconAttrs
          });
        }

        // 如果是直接的 SVG 属性对象
        if (IconComponent.viewBox || IconComponent.width || IconComponent.height) {
          return h("svg", {
            viewBox: IconComponent.viewBox || "0 0 24 24",
            width: style.width,
            height: style.height,
            style,
            ...iconAttrs,
            ...IconComponent
          });
        }
      }

      // 默认占位符
      return h("span", {
        style: {
          ...style,
          backgroundColor: "#ccc",
          borderRadius: "2px"
        }
      });
    };
  }
});

