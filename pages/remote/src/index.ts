export { useRemoteControl } from "./composables/useRemoteControl";
export { default } from "./composables/useRemoteControl";
export type {
  RemoteProtocol,
  RemoteCodec,
  TransportType,
  ConnectionState,
  ConnectionSettings,
  RemoteSession,
  DesktopFrameEvent,
} from "./composables/useRemoteControl";

export function encodeConferencePayload(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
