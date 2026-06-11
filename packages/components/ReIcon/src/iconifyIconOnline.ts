import { Icon as IconifyIcon } from "@iconify/vue";
import { addIcon } from "@iconify/vue/dist/offline";
import EpClock from "@iconify-icons/ep/clock";
import EpDelete from "@iconify-icons/ep/delete";
import EpDocument from "@iconify-icons/ep/document";
import EpEdit from "@iconify-icons/ep/edit";
import EpKey from "@iconify-icons/ep/key";
import EpLink from "@iconify-icons/ep/link";
import EpMonitor from "@iconify-icons/ep/monitor";
import EpPlus from "@iconify-icons/ep/plus";
import EpQuestionFilled from "@iconify-icons/ep/question-filled";
import EpRefresh from "@iconify-icons/ep/refresh";
import EpSearch from "@iconify-icons/ep/search";
import EpSetting from "@iconify-icons/ep/setting";
import EpView from "@iconify-icons/ep/view";
import HumbleWifi from "@iconify-icons/humbleicons/wifi";
import HumbleWifiOff from "@iconify-icons/humbleicons/wifi-off";
import RiArrowLeftLine from "@iconify-icons/ri/arrow-left-line";
import RiBarChart2Line from "@iconify-icons/ri/bar-chart-2-line";
import RiCheckLine from "@iconify-icons/ri/check-line";
import RiCloseLine from "@iconify-icons/ri/close-line";
import RiDeviceLine from "@iconify-icons/ri/device-line";
import RiDownload2Line from "@iconify-icons/ri/download-2-line";
import RiEyeLine from "@iconify-icons/ri/eye-line";
import RiFileListLine from "@iconify-icons/ri/file-list-line";
import RiHistoryLine from "@iconify-icons/ri/history-line";
import RiKey2Line from "@iconify-icons/ri/key-2-line";
import RiMore2Fill from "@iconify-icons/ri/more-2-fill";
import RiPauseLine from "@iconify-icons/ri/pause-line";
import RiPlayCircleLine from "@iconify-icons/ri/play-circle-line";
import RiPlayListAddLine from "@iconify-icons/ri/play-list-add-line";
import RiPlayListLine from "@iconify-icons/ri/play-list-line";
import RiPlayLine from "@iconify-icons/ri/play-line";
import RiPulseLine from "@iconify-icons/ri/pulse-line";
import RiRefreshLine from "@iconify-icons/ri/refresh-line";
import RiRobot2Line from "@iconify-icons/ri/robot-2-line";
import RiSave3Line from "@iconify-icons/ri/save-3-line";
import RiSearchEyeLine from "@iconify-icons/ri/search-eye-line";
import RiSearchLine from "@iconify-icons/ri/search-line";
import RiSkipBackLine from "@iconify-icons/ri/skip-back-line";
import RiSkipForwardLine from "@iconify-icons/ri/skip-forward-line";
import RiStopCircleLine from "@iconify-icons/ri/stop-circle-line";
import RiStore2Line from "@iconify-icons/ri/store-2-line";
import RiUpload2Line from "@iconify-icons/ri/upload-2-line";
import RiVideoLine from "@iconify-icons/ri/video-line";
import { h, defineComponent, markRaw } from "vue";

const localIcons: Record<string, any> = {
  "ep:clock": EpClock,
  "ep:delete": EpDelete,
  "ep:document": EpDocument,
  "ep:edit": EpEdit,
  "ep:key": EpKey,
  "ep:link": EpLink,
  "ep:monitor": EpMonitor,
  "ep:plus": EpPlus,
  "ep:question-filled": EpQuestionFilled,
  "ep:refresh": EpRefresh,
  "ep:search": EpSearch,
  "ep:setting": EpSetting,
  "ep:view": EpView,
  "humbleicons:wifi": HumbleWifi,
  "humbleicons:wifi-off": HumbleWifiOff,
  "ri:arrow-left-line": RiArrowLeftLine,
  "ri:bar-chart-2-line": RiBarChart2Line,
  "ri:check-line": RiCheckLine,
  "ri:close-line": RiCloseLine,
  "ri:device-line": RiDeviceLine,
  "ri:download-2-line": RiDownload2Line,
  "ri:eye-line": RiEyeLine,
  "ri:file-list-line": RiFileListLine,
  "ri:history-line": RiHistoryLine,
  "ri:key-2-line": RiKey2Line,
  "ri:more-2-fill": RiMore2Fill,
  "ri:pause-line": RiPauseLine,
  "ri:play-circle-line": RiPlayCircleLine,
  "ri:play-forward-line": RiSkipForwardLine,
  "ri:play-list-add-line": RiPlayListAddLine,
  "ri:play-list-line": RiPlayListLine,
  "ri:play-line": RiPlayLine,
  "ri:play-reverse-line": RiSkipBackLine,
  "ri:pulse-line": RiPulseLine,
  "ri:refresh-line": RiRefreshLine,
  "ri:robot-2-line": RiRobot2Line,
  "ri:save-3-line": RiSave3Line,
  "ri:search-eye-line": RiSearchEyeLine,
  "ri:search-line": RiSearchLine,
  "ri:skip-back-line": RiSkipBackLine,
  "ri:skip-forward-line": RiSkipForwardLine,
  "ri:stop-circle-line": RiStopCircleLine,
  "ri:store-2-line": RiStore2Line,
  "ri:timeline-view": RiDeviceLine,
  "ri:upload-2-line": RiUpload2Line,
  "ri:video-line": RiVideoLine,
  "mingcute:computer-camera-fill": RiVideoLine,
  "mdi:barcode-scan": RiDeviceLine,
  "mdi:cctv": RiVideoLine,
  "mdi:cellphone-link": EpMonitor,
  "mdi:clock-outline": EpClock,
  "mdi:cloud-outline": RiVideoLine,
  "mdi:content-save": EpDocument,
  "mdi:delete": EpDelete,
  "mdi:devices": EpMonitor,
  "mdi:eye-outline": RiEyeLine,
  "mdi:help-circle-outline": EpQuestionFilled,
  "mdi:ip-network": EpMonitor,
  "mdi:key-chain-variant": EpKey,
  "mdi:pipe": EpMonitor,
  "mdi:play-circle": RiPlayCircleLine,
  "mdi:playlist-remove": EpDelete,
  "mdi:plus": EpPlus,
  "mdi:shield-lock-outline": EpKey,
  "mdi:sun-wireless-outline": HumbleWifi,
  "mdi:tag-outline": EpDocument,
};

Object.entries(localIcons).forEach(([name, icon]) => {
  addIcon(name, markRaw(icon));
});

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

    const renderIcon = localIcons[normalizedIcon] || EpQuestionFilled;

    return h(
      IconifyIcon,
      {
        icon: renderIcon,
        "data-missing-icon": localIcons[normalizedIcon] ? undefined : normalizedIcon,
        style: attrs?.style ? Object.assign(attrs.style, { outline: "none" }) : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
