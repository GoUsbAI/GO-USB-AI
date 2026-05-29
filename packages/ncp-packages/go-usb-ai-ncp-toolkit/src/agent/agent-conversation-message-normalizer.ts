import { type NcpMessage, sanitizeAssistantReplyTags } from "@go-usb-ai/ncp";

export function cloneConversationMessage(message: NcpMessage): NcpMessage {
  return {
    ...message,
    parts: [...message.parts],
    metadata: message.metadata ? { ...message.metadata } : undefined,
  };
}

export function normalizeConversationMessage(message: NcpMessage): NcpMessage {
  return cloneConversationMessage(sanitizeAssistantReplyTags(message));
}
