import type { iconType } from "./types";
import { h, defineComponent, markRaw, type Component } from "vue";
import {
  IconifyIconOnline,
  IconifyIconOffline,
  FontIcon,
  PixelIcon,
} from "../index";

/**
 * 支持 `iconfont`、自定义 `svg` 以及 `iconify` 中所有的图标
 * @see 点击查看文档图标篇 {@link https://pure-admin.github.io/pure-admin-doc/pages/icon/}
 * @param icon 必传 图标
 * @param attrs 可选 iconType 属性
 * @returns Component
 */
export function useRenderIcon(icon: any, attrs?: iconType): Component {
  const wrapComponent = (name: string, render: () => ReturnType<typeof h>) =>
    markRaw(defineComponent({ name, render }));
  // iconfont
  const ifReg = /^IF-/;
  // HTTP远程图标
  const httpReg = /^https?:\/\//;
  // pixel-icon 图标
  const pixelIconReg = /^pixel-icon:/;
  // typeof icon === "function" 属于SVG
  if (pixelIconReg.test(icon)) {
    // pixel-icon 图标
    return wrapComponent("PixelIcon", () =>
      h(PixelIcon, {
        icon: icon,
        ...attrs,
      }),
    );
  } else if (ifReg.test(icon)) {
    // iconfont
    const name = icon.split(ifReg)[1];
    const iconName = name.slice(
      0,
      name.indexOf(" ") == -1 ? name.length : name.indexOf(" "),
    );
    const iconType = name.slice(name.indexOf(" ") + 1, name.length);
    return wrapComponent("FontIcon", () =>
      h(FontIcon, {
        icon: iconName,
        iconType,
        ...attrs,
      }),
    );
  } else if (httpReg.test(icon)) {
    // HTTP远程图标
    return wrapComponent("HttpIcon", () =>
      h("img", {
        src: icon,
        alt: "icon",
        style: {
          width: "1em",
          height: "1em",
          display: "inline-block",
          verticalAlign: "middle",
          objectFit: "contain",
          ...attrs?.style,
        },
        ...attrs,
      }),
    );
  } else if (typeof icon === "function" || typeof icon?.render === "function") {
    // svg
    return attrs
      ? wrapComponent("SvgIcon", () => h(icon, { ...attrs }))
      : markRaw(icon);
  } else if (typeof icon === "object") {
    return wrapComponent("OfflineIcon", () =>
      h(IconifyIconOffline, {
        icon: icon,
        ...attrs,
      }),
    );
  } else {
    // 通过是否存在 : 符号来判断是在线还是本地图标，存在即是在线图标，反之
    return wrapComponent("Icon", () => {
      const IconifyIcon =
        icon && icon.includes(":") ? IconifyIconOnline : IconifyIconOffline;
      return h(IconifyIcon, {
        icon: icon,
        ...attrs,
      });
    });
  }
}
