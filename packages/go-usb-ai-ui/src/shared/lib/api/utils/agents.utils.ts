import { goUsbAiClient } from "../managers/client.manager";
import type { AgentCreateRequest, AgentDeleteResult, AgentProfileView, AgentUpdateRequest } from "@/shared/lib/api/types";

export async function fetchAgents(): Promise<{ agents: AgentProfileView[] }> {
  return { agents: await goUsbAiClient.agents.list() };
}

export async function createAgent(data: AgentCreateRequest): Promise<AgentProfileView> {
  return await goUsbAiClient.agents.create(data);
}

export async function updateAgent(agentId: string, data: AgentUpdateRequest): Promise<AgentProfileView> {
  return await goUsbAiClient.agents.update(agentId, data);
}

export async function deleteAgent(agentId: string): Promise<AgentDeleteResult> {
  return await goUsbAiClient.agents.delete(agentId);
}
