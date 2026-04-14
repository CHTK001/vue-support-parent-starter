import { ref } from "vue";
import {
  getServerServiceOperationLogs,
  type ServerService,
  type ServerServiceOperationLog,
} from "../api";

export const useServerServiceLogs = () => {
  const serviceLogsVisible = ref(false);
  const serviceLogLoading = ref(false);
  const serviceLogs = ref<ServerServiceOperationLog[]>([]);
  const serviceLogService = ref<ServerService | null>(null);

  const openServiceLogs = async (service: ServerService) => {
    if (!service.serverServiceId) {
      return;
    }
    serviceLogService.value = service;
    serviceLogsVisible.value = true;
    serviceLogLoading.value = true;
    try {
      const result = await getServerServiceOperationLogs(
        service.serverServiceId,
        20,
      );
      serviceLogs.value = result.data || [];
    } finally {
      serviceLogLoading.value = false;
    }
  };

  const resetServiceLogs = () => {
    serviceLogs.value = [];
    serviceLogService.value = null;
  };

  return {
    serviceLogsVisible,
    serviceLogLoading,
    serviceLogs,
    serviceLogService,
    openServiceLogs,
    resetServiceLogs,
  };
};
