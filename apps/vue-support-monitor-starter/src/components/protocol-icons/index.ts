import { h } from "vue";

// HTTP/HTTPS 协议图标
export const HttpIcon = () =>
  h(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      class: "protocol-icon",
    },
    [
      h("path", {
        d: "M3 12h18M3 12a9 9 0 0 1 9-9M3 12a9 9 0 0 0 9 9m9-9a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m0 18v-9h9",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]
  );

// TCP 协议图标
export const TcpIcon = () =>
  h(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      class: "protocol-icon",
    },
    [
      h("path", {
        d: "M4 4v16M20 4v16M4 12h16M12 4v16",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]
  );

// UDP 协议图标
export const UdpIcon = () =>
  h(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      class: "protocol-icon",
    },
    [
      h("path", {
        d: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M9 12h6 M12 9v6",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]
  );

// WebSocket 协议图标
export const WsIcon = () =>
  h(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      class: "protocol-icon",
    },
    [
      h("path", {
        d: "M13 10V3L4 14h7v7l9-11h-7z",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]
  );

// MQTT 协议图标
export const MqttIcon = () =>
  h(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      class: "protocol-icon",
    },
    [
      h("path", {
        d: "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 12v8c0 1.66 4 3 9 3s9-1.34 9-3v-8M3 8c0-1.66 4-3 9-3s9 1.34 9 3-4 3-9 3-9-1.34-9-3z",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]
  );

// 根据协议类型返回对应的图标
export const getProtocolIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case "HTTP":
    case "HTTPS":
      return HttpIcon;
    case "TCP":
      return TcpIcon;
    case "UDP":
      return UdpIcon;
    case "WS":
    case "WSS":
      return WsIcon;
    case "MQTT":
      return MqttIcon;
    default:
      return TcpIcon; // 默认图标
  }
};
