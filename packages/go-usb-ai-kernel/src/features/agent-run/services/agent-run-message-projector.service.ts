import type { NcpMessage } from "@go-usb-ai/ncp";
import { projectNcpMessagesWithContextCompaction } from "@kernel/features/context-compaction/index.js";

export type AgentRunMessageProjectParams = {
  sessionId: string;
  messages: readonly NcpMessage[];
};

export class AgentRunMessageProjector {
  project = (params: AgentRunMessageProjectParams): NcpMessage[] =>
    projectNcpMessagesWithContextCompaction({
      sessionId: params.sessionId,
      sessionMessages: params.messages,
    });
}
