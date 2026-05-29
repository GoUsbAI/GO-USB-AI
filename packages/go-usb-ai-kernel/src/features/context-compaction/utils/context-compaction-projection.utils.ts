import type { NcpMessage } from "@go-usb-ai/ncp";
import { readCompressedContextCompactionCheckpoint } from "@go-usb-ai/core";
import { CONTEXT_COMPACTION_TIMELINE_KIND, GOUSB_AI_TIMELINE_KIND_METADATA_KEY } from "./context-compaction-timeline-message.utils.js";

function readCompactionSummary(message: NcpMessage): string | null {
  const metadata = message.metadata;
  if (metadata?.[GOUSB_AI_TIMELINE_KIND_METADATA_KEY] !== CONTEXT_COMPACTION_TIMELINE_KIND) {
    return null;
  }
  const checkpoint = readCompressedContextCompactionCheckpoint(metadata.checkpoint);
  return checkpoint?.summary ?? null;
}

export function projectNcpMessagesWithContextCompaction(params: {
  sessionId: string;
  sessionMessages: readonly NcpMessage[];
}): NcpMessage[] {
  const { sessionId, sessionMessages } = params;
  let checkpointIndex = -1;
  let summary = "";
  for (let index = sessionMessages.length - 1; index >= 0; index -= 1) {
    const candidateSummary = readCompactionSummary(sessionMessages[index] as NcpMessage);
    if (!candidateSummary) {
      continue;
    }
    checkpointIndex = index;
    summary = candidateSummary;
    break;
  }

  if (checkpointIndex < 0) {
    return sessionMessages
      .filter((message) => !readCompactionSummary(message))
      .map((message) => structuredClone(message));
  }

  return [
    {
      id: `${sessionId}:context-compaction-summary:${sessionMessages[checkpointIndex]?.id ?? "latest"}`,
      sessionId,
      role: "user",
      status: "final",
      timestamp: sessionMessages[checkpointIndex]?.timestamp ?? new Date().toISOString(),
      parts: [{ type: "text", text: summary }],
    },
    ...sessionMessages
      .slice(checkpointIndex + 1)
      .filter((message) => !readCompactionSummary(message))
      .map((message) => structuredClone(message)),
  ];
}
