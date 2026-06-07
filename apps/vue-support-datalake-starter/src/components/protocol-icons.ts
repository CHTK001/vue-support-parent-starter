import { h } from "vue";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";

const iconMap: Record<string, string> = {
  SSH: "ri:terminal-box-line",
  HTTP: "ri:global-line",
  MQTT: "ri:message-2-line",
  FTP: "ri:folder-transfer-line",
  TCP: "ri:node-tree",
  WEBSOCKET: "ri:plug-line",
};

export function getProtocolIcon(type: string) {
  const icon = iconMap[type?.toUpperCase()] || "ri:server-line";
  return h(IconifyIconOnline, { icon });
}
