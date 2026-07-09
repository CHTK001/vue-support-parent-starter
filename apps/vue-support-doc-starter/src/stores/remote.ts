import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  fetchAgents, fetchTargets, fetchStats,
  remoteWs, setGatewayConfig, getGatewayConfig,
  type AgentInfo, type TargetEntry, type GatewayStats, type GatewayConfig, type WsState
} from "@/api/remote";

export type SessionProtocol = "SSH" | "DESKTOP" | "VNC" | "RUSTDESK" | "CONFERENCE" | "AUTO";
export type SessionState = "connecting" | "connected" | "disconnected" | "error";

export interface RemoteSession {
  sessionId: string;
  agentId: string;
  targetId: string;
  protocol: SessionProtocol;
  state: SessionState;
  error?: string;
  createdAt: number;
}

export const useRemoteStore = defineStore("remote", () => {
  // ─── Gateway config ──────────────────────────────
  const gatewayCfg = ref<GatewayConfig>(getGatewayConfig());

  function updateGateway(cfg: Partial<GatewayConfig>) {
    setGatewayConfig(cfg);
    gatewayCfg.value = getGatewayConfig();
  }

  // ─── Agent & Target data ─────────────────────────
  const agents = ref<AgentInfo[]>([]);
  const targets = ref<TargetEntry[]>([]);
  const stats = ref<GatewayStats>({ agents: 0, targets: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const onlineAgents = computed(() => agents.value.filter(a => a.online && !a.disabled));

  async function refreshAgents() {
    loading.value = true;
    error.value = null;
    try {
      const [a, t, s] = await Promise.all([fetchAgents(), fetchTargets(), fetchStats()]);
      agents.value = a;
      targets.value = t;
      stats.value = s;
    } catch (e: any) {
      error.value = e.message || "Failed to fetch agents";
    } finally {
      loading.value = false;
    }
  }

  // ─── WebSocket state ─────────────────────────────
  const wsState = ref<WsState>("disconnected");

  // ─── Sessions ────────────────────────────────────
  const sessions = ref<RemoteSession[]>([]);
  const activeSessionId = ref<string | null>(null);

  const activeSession = computed(() =>
    sessions.value.find(s => s.sessionId === activeSessionId.value) ?? null
  );

  function addSession(s: RemoteSession) {
    sessions.value.push(s);
    activeSessionId.value = s.sessionId;
  }

  function updateSession(sessionId: string, patch: Partial<RemoteSession>) {
    const idx = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (idx >= 0) Object.assign(sessions.value[idx], patch);
  }

  function removeSession(sessionId: string) {
    sessions.value = sessions.value.filter(s => s.sessionId !== sessionId);
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value.length > 0 ? sessions.value[sessions.value.length - 1].sessionId : null;
    }
  }

  // ─── Terminal output buffer (per session) ────────
  const terminalBuffers = ref<Record<string, string>>({});

  function appendTerminal(sessionId: string, data: string) {
    if (!terminalBuffers.value[sessionId]) terminalBuffers.value[sessionId] = "";
    terminalBuffers.value[sessionId] += data;
    // Keep buffer under 200KB per session
    if (terminalBuffers.value[sessionId].length > 200_000) {
      terminalBuffers.value[sessionId] = terminalBuffers.value[sessionId].slice(-100_000);
    }
  }

  function clearTerminal(sessionId: string) {
    terminalBuffers.value[sessionId] = "";
  }

  // ─── WS lifecycle ────────────────────────────────
  function connectWs() {
    remoteWs.onStateChange(s => { wsState.value = s; });

    remoteWs.onMessage(msg => {
      const type = msg.type as string;
      if (type === "connected") {
        const sid = msg.sessionId as string;
        updateSession(sid, { state: "connected" });
      } else if (type === "disconnected") {
        const sid = msg.sessionId as string;
        updateSession(sid, { state: "disconnected" });
      } else if (type === "error") {
        const sid = msg.sessionId as string;
        const errMsg = msg.msg as string;
        if (sid) {
          updateSession(sid, { state: "error", error: errMsg });
        }
      } else if (type === "pong") {
        // heartbeat response
      }
      // Terminal output from Agent (text relay)
      if (msg.data && typeof msg.data === "string") {
        const sid = msg.sessionId as string;
        if (sid) appendTerminal(sid, msg.data as string);
      }
    });

    remoteWs.connect();
  }

  function disconnectWs() {
    remoteWs.disconnect();
    sessions.value = [];
    activeSessionId.value = null;
  }

  // ─── Connect to a target ─────────────────────────
  function connectToTarget(agent: AgentInfo, protocol: SessionProtocol = "AUTO", auth?: Record<string, unknown>) {
    if (wsState.value === "disconnected") {
      connectWs();
      // Wait for WS open then send connect — simple retry
      const tryConnect = () => {
        if (remoteWs.state === "connected") {
          remoteWs.connectToTarget({
            targetId: agent.agentId,
            verifyCode: agent.verifyCode || undefined,
            protocol,
            auth
          });
        } else {
          setTimeout(tryConnect, 100);
        }
      };
      setTimeout(tryConnect, 100);
    } else if (wsState.value === "connected") {
      remoteWs.connectToTarget({
        targetId: agent.agentId,
        verifyCode: agent.verifyCode || undefined,
        protocol,
        auth
      });
    }
  }

  return {
    gatewayCfg, updateGateway,
    agents, targets, stats, loading, error, onlineAgents, refreshAgents,
    wsState, sessions, activeSessionId, activeSession,
    addSession, updateSession, removeSession,
    terminalBuffers, appendTerminal, clearTerminal,
    connectWs, disconnectWs, connectToTarget
  };
});