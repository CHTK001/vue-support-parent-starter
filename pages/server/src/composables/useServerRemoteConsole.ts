import { nextTick, ref, type Ref } from "vue";
import { message } from "@repo/utils";
import {
  getServerHostRemoteConsoleConfig,
  type ServerHost,
  type ServerRemoteConsoleConfig,
} from "../api";

type UseServerRemoteConsoleOptions = {
  selectedHost: Ref<ServerHost | null>;
  selectedRemoteGateway: Ref<ServerRemoteConsoleConfig | null>;
  selectHost: (serverId: number) => void;
};

export const useServerRemoteConsole = ({
  selectedHost,
  selectedRemoteGateway,
  selectHost,
}: UseServerRemoteConsoleOptions) => {
  const remoteConsoleVisible = ref(false);
  const remoteConsoleLoading = ref(false);
  const remoteConsoleConfig = ref<ServerRemoteConsoleConfig | null>(null);
  const remoteConsoleHostName = ref("");

  const openRemoteConsole = async (host?: ServerHost | null) => {
    const targetHost = host || selectedHost.value;
    if (!targetHost) {
      return;
    }
    if (
      targetHost.serverId &&
      targetHost.serverId !== selectedHost.value?.serverId
    ) {
      selectHost(targetHost.serverId);
      await nextTick();
    }
    const config = targetHost.serverId
      ? (
          await getServerHostRemoteConsoleConfig(targetHost.serverId).catch(
            () => null,
          )
        )?.data ||
        targetHost.remoteGatewayConfig ||
        targetHost.guacamoleConfig ||
        selectedRemoteGateway.value
      : targetHost.remoteGatewayConfig ||
        targetHost.guacamoleConfig ||
        selectedRemoteGateway.value;
    if (!config?.launchUrl) {
      message(config?.message || "当前服务器未配置远程控制入口", {
        type: "warning",
      });
      return;
    }
    remoteConsoleConfig.value = config;
    remoteConsoleHostName.value = targetHost.serverName || "";
    remoteConsoleLoading.value = true;
    remoteConsoleVisible.value = true;
  };

  const handleRemoteConsoleClosed = () => {
    remoteConsoleConfig.value = null;
    remoteConsoleLoading.value = false;
  };

  return {
    remoteConsoleVisible,
    remoteConsoleLoading,
    remoteConsoleConfig,
    remoteConsoleHostName,
    openRemoteConsole,
    handleRemoteConsoleClosed,
  };
};
