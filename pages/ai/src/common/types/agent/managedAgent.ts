/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Managed Agent types for `/api/agents/managed/*` — the Agent management
 * surface (create/configure master & sub agents, orchestration graph, model
 * registration).
 */

export interface AgentStrategy {
  /** 编排模式：SINGLE / ROUTER / AUTO / PIPELINE / FAN_OUT / PLAN_AND_EXECUTE */
  mode?: string;
  planning?: boolean;
  memory?: boolean;
  mcp?: boolean;
  max_tool_iterations?: number;
  temperature?: number;
  max_tokens?: number;
}

export interface ManagedAgent {
  agent_id: string;
  parent_id?: string | null;
  name: string;
  description?: string;
  role?: string;
  instruction?: string;
  system_prompt?: string;
  provider_id?: string;
  model?: string;
  mcp_ids: string[];
  skill_ids: string[];
  strategy: AgentStrategy;
  enabled: boolean;
  sort_order: number;
  created_at?: number;
  updated_at?: number;
  sub_agents?: ManagedAgent[];
}

export interface ManagedAgentPayload {
  name?: string;
  description?: string;
  role?: string;
  instruction?: string;
  system_prompt?: string;
  provider_id?: string;
  model?: string;
  mcp_ids?: string[];
  skill_ids?: string[];
  strategy?: AgentStrategy;
  enabled?: boolean;
  sort_order?: number;
}

export interface OrchestrationNode {
  id: string;
  agent_id: string;
  label: string;
  kind: 'master' | 'sub-agent';
  position: { x: number; y: number };
}

export interface OrchestrationEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface OrchestrationData {
  nodes: OrchestrationNode[];
  edges: OrchestrationEdge[];
  agentId?: string;
  mode?: string;
}
