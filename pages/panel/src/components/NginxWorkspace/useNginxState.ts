import { ref, reactive } from "vue";
import type { NginxServerBlock, NginxConfFile, NginxDashboardStats } from "../../api/nginx";

/**
 * Nginx 工作区共享状态 composable。
 * 所有子组件通过 inject/provide 或 props 共享此状态。
 */
export function useNginxState(connectionId: string) {
  // ── 配置文件列表 ────────────────────────────────────────────────────────────
  const confFiles = ref<NginxConfFile[]>([]);
  const confFilesLoading = ref(false);
  const activeConfigPath = ref("/etc/nginx/nginx.conf");

  // ── Server 树 ───────────────────────────────────────────────────────────────
  const servers = ref<NginxServerBlock[]>([]);
  const serversLoading = ref(false);
  const expandedServers = ref(new Set<number>());
  const activeServerIndex = ref(-1);
  const activeLocationIndex = ref(-1);
  const editingServer = ref(false);
  const serverCardRefs = ref<HTMLElement[]>([]);

  // server 编辑表单
  const serverForm = reactive<NginxServerBlock>({
    listen: "80",
    serverName: "",
    root: "",
    index: "index.html",
    sslCertificate: "",
    sslCertificateKey: "",
    locations: [],
  });

  // ── 大屏 ────────────────────────────────────────────────────────────────────
  const dashboardStats = ref<NginxDashboardStats | null>(null);
  const dashboardLoading = ref(false);

  // ── 通用 ────────────────────────────────────────────────────────────────────
  const saving = ref(false);
  const configContent = ref("");
  const configLoading = ref(false);

  return {
    connectionId,
    // 配置文件
    confFiles, confFilesLoading, activeConfigPath,
    // server 树
    servers, serversLoading, expandedServers,
    activeServerIndex, activeLocationIndex,
    editingServer, serverCardRefs, serverForm,
    // 大屏
    dashboardStats, dashboardLoading,
    // 通用
    saving, configContent, configLoading,
  };
}

export type NginxState = ReturnType<typeof useNginxState>;
